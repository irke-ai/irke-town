# Sprint 4.2: 관리자 대시보드 및 출시 준비 - 상세 구현 가이드

## 📋 목차
1. [Task 1: 관리자 대시보드 구현](#task-1-관리자-대시보드-구현)
2. [Task 2: 사용자 관리 시스템](#task-2-사용자-관리-시스템)
3. [Task 3: 시스템 모니터링](#task-3-시스템-모니터링)
4. [Task 4: 긴급 제어 시스템](#task-4-긴급-제어-시스템)
5. [Task 5: 출시 체크리스트](#task-5-출시-체크리스트)

---

## Task 1: 관리자 대시보드 구현

### 1.1 관리자 인증 시스템

```typescript
// src/lib/admin-auth.ts
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import crypto from 'crypto';

// 관리자 이메일 목록 (환경변수에서 가져오기)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

// IP 화이트리스트 (선택적)
const IP_WHITELIST = process.env.ADMIN_IP_WHITELIST?.split(',') || [];

export async function checkAdminAuth(): Promise<boolean> {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return false;
    }

    // 이메일 기반 관리자 체크
    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return false;
    }

    // IP 화이트리스트 체크 (설정된 경우)
    if (IP_WHITELIST.length > 0) {
      const headersList = headers();
      const forwardedFor = headersList.get('x-forwarded-for');
      const realIp = forwardedFor ? forwardedFor.split(',')[0] : headersList.get('x-real-ip');
      
      if (realIp && !IP_WHITELIST.includes(realIp)) {
        console.warn(`Admin access attempt from unauthorized IP: ${realIp}`);
        return false;
      }
    }

    // 2FA 체크 (구현된 경우)
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { twoFactorEnabled: true, twoFactorVerified: true }
    });

    if (user?.twoFactorEnabled && !user.twoFactorVerified) {
      return false;
    }

    // 관리자 활동 로깅
    await logAdminActivity(session.user.email, 'dashboard_access');

    return true;
  } catch (error) {
    console.error('Admin auth check failed:', error);
    return false;
  }
}

// 관리자 활동 로깅
async function logAdminActivity(email: string, action: string, details?: any) {
  try {
    await db.adminActivityLog.create({
      data: {
        adminEmail: email,
        action,
        details: details ? JSON.stringify(details) : null,
        ipAddress: headers().get('x-forwarded-for') || headers().get('x-real-ip') || 'unknown',
        userAgent: headers().get('user-agent') || 'unknown',
      }
    });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
}

// 관리자 권한 레벨 체크
export async function getAdminRole(email: string): Promise<string | null> {
  const adminUser = await db.adminUser.findUnique({
    where: { email },
    select: { role: true }
  });
  
  return adminUser?.role || null;
}

// CSRF 토큰 생성 및 검증
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function validateCSRFToken(token: string): Promise<boolean> {
  // Redis에서 토큰 검증
  const stored = await redis.get(`csrf:${token}`);
  return stored !== null;
}
```

### 1.2 메트릭 수집 시스템

```typescript
// src/services/admin/metrics-collector.ts
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { sql } from '@vercel/postgres';

interface MetricSnapshot {
  timestamp: Date;
  activeUsers: number;
  totalUsers: number;
  totalProjects: number;
  activeProjects: number;
  apiCalls: {
    total: number;
    byEndpoint: Record<string, number>;
    byStatus: Record<string, number>;
  };
  aiUsage: {
    totalTokens: number;
    totalCost: number;
    byModel: Record<string, number>;
  };
  systemHealth: {
    cpu: number;
    memory: number;
    disk: number;
    dbConnections: number;
  };
}

export class MetricsCollector {
  private intervals: NodeJS.Timeout[] = [];

  async start() {
    // 1분마다 메트릭 수집
    this.intervals.push(
      setInterval(() => this.collectMinuteMetrics(), 60000)
    );

    // 5분마다 상세 메트릭 수집
    this.intervals.push(
      setInterval(() => this.collectDetailedMetrics(), 300000)
    );

    // 1시간마다 집계
    this.intervals.push(
      setInterval(() => this.aggregateHourlyMetrics(), 3600000)
    );
  }

  async stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  private async collectMinuteMetrics() {
    try {
      const snapshot = await this.createSnapshot();
      
      // Redis에 실시간 데이터 저장 (24시간 TTL)
      await redis.setex(
        `metrics:minute:${Date.now()}`,
        86400,
        JSON.stringify(snapshot)
      );

      // 실시간 대시보드를 위한 current 메트릭 업데이트
      await redis.set('metrics:current', JSON.stringify(snapshot));
      
      // WebSocket으로 실시간 전송
      await this.broadcastMetrics(snapshot);
    } catch (error) {
      console.error('Failed to collect minute metrics:', error);
    }
  }

  private async createSnapshot(): Promise<MetricSnapshot> {
    const [
      activeUsers,
      userStats,
      projectStats,
      apiStats,
      aiStats,
      systemStats
    ] = await Promise.all([
      this.getActiveUserCount(),
      this.getUserStatistics(),
      this.getProjectStatistics(),
      this.getAPIStatistics(),
      this.getAIUsageStatistics(),
      this.getSystemStatistics()
    ]);

    return {
      timestamp: new Date(),
      activeUsers,
      totalUsers: userStats.total,
      totalProjects: projectStats.total,
      activeProjects: projectStats.active,
      apiCalls: apiStats,
      aiUsage: aiStats,
      systemHealth: systemStats
    };
  }

  private async getActiveUserCount(): Promise<number> {
    const result = await redis.scard('active_users');
    return result || 0;
  }

  private async getUserStatistics() {
    const result = await db.user.aggregate({
      _count: { _all: true },
      where: {
        deletedAt: null
      }
    });

    const newToday = await db.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    return {
      total: result._count._all,
      newToday
    };
  }

  private async getProjectStatistics() {
    const total = await db.project.count();
    
    const active = await db.project.count({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7일 이내 업데이트
        }
      }
    });

    return { total, active };
  }

  private async getAPIStatistics() {
    // Redis에서 API 호출 통계 가져오기
    const stats = await redis.hgetall('api_stats');
    
    const byEndpoint: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let total = 0;

    for (const [key, value] of Object.entries(stats)) {
      const count = parseInt(value);
      total += count;

      if (key.startsWith('endpoint:')) {
        byEndpoint[key.replace('endpoint:', '')] = count;
      } else if (key.startsWith('status:')) {
        byStatus[key.replace('status:', '')] = count;
      }
    }

    return { total, byEndpoint, byStatus };
  }

  private async getAIUsageStatistics() {
    // 오늘의 AI 사용량 통계
    const today = new Date().toISOString().split('T')[0];
    const usage = await redis.hgetall(`ai_usage:${today}`);

    return {
      totalTokens: parseInt(usage.tokens || '0'),
      totalCost: parseFloat(usage.cost || '0'),
      byModel: {
        'qwen-2.5-coder': parseInt(usage['model:qwen-2.5-coder'] || '0')
      }
    };
  }

  private async getSystemStatistics() {
    // 시스템 메트릭 (실제로는 모니터링 도구에서 가져와야 함)
    const dbPool = await db.$queryRaw`
      SELECT count(*) as connections 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;

    return {
      cpu: await this.getCPUUsage(),
      memory: await this.getMemoryUsage(),
      disk: await this.getDiskUsage(),
      dbConnections: Number(dbPool[0]?.connections || 0)
    };
  }

  private async getCPUUsage(): Promise<number> {
    // 실제 구현에서는 OS 메트릭을 가져와야 함
    // 여기서는 시뮬레이션
    return Math.random() * 30 + 20; // 20-50%
  }

  private async getMemoryUsage(): Promise<number> {
    const used = process.memoryUsage();
    const total = require('os').totalmem();
    return (used.heapUsed / total) * 100;
  }

  private async getDiskUsage(): Promise<number> {
    // 실제 구현에서는 디스크 사용량을 체크해야 함
    return Math.random() * 20 + 40; // 40-60%
  }

  private async broadcastMetrics(snapshot: MetricSnapshot) {
    // WebSocket을 통한 실시간 전송
    // 실제 구현에서는 Socket.IO 또는 다른 WebSocket 라이브러리 사용
    if (global.io) {
      global.io.to('admin').emit('metrics:update', snapshot);
    }
  }
}

// 메트릭 수집기 인스턴스
export const metricsCollector = new MetricsCollector();
```

### 1.3 실시간 차트 컴포넌트

```typescript
// src/components/admin/RealtimeChart.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { io, Socket } from 'socket.io-client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface RealtimeChartProps {
  type: 'traffic' | 'ai-usage' | 'error-rate' | 'response-time';
  height?: number;
}

export function RealtimeChart({ type, height = 300 }: RealtimeChartProps) {
  const [data, setData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const maxDataPoints = 30; // 최근 30개 데이터 포인트만 표시

  useEffect(() => {
    // WebSocket 연결
    socketRef.current = io('/admin', {
      auth: {
        token: getCookie('admin-token') // 관리자 인증 토큰
      }
    });

    // 초기 데이터 로드
    loadInitialData();

    // 실시간 업데이트 수신
    socketRef.current.on('metrics:update', (metrics) => {
      updateChartData(metrics);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [type]);

  const loadInitialData = async () => {
    try {
      const response = await fetch(`/api/admin/metrics/${type}?range=30m`);
      const result = await response.json();
      
      setData(result.values);
      setLabels(result.timestamps.map((ts: string) => 
        new Date(ts).toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      ));
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const updateChartData = (metrics: any) => {
    let newValue: number;
    
    switch (type) {
      case 'traffic':
        newValue = metrics.activeUsers;
        break;
      case 'ai-usage':
        newValue = metrics.aiUsage.totalTokens;
        break;
      case 'error-rate':
        newValue = metrics.apiCalls.byStatus['5xx'] || 0;
        break;
      case 'response-time':
        newValue = metrics.systemHealth.avgResponseTime || 0;
        break;
      default:
        return;
    }

    setData(prev => {
      const updated = [...prev, newValue];
      if (updated.length > maxDataPoints) {
        updated.shift();
      }
      return updated;
    });

    setLabels(prev => {
      const updated = [...prev, new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      })];
      if (updated.length > maxDataPoints) {
        updated.shift();
      }
      return updated;
    });
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: getChartLabel(type),
        data,
        borderColor: getChartColor(type),
        backgroundColor: getChartColor(type, 0.1),
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

function getChartLabel(type: string): string {
  const labels = {
    'traffic': '활성 사용자',
    'ai-usage': 'AI 토큰 사용량',
    'error-rate': '에러율',
    'response-time': '응답 시간 (ms)',
  };
  return labels[type] || type;
}

function getChartColor(type: string, alpha = 1): string {
  const colors = {
    'traffic': `rgba(59, 130, 246, ${alpha})`, // blue
    'ai-usage': `rgba(16, 185, 129, ${alpha})`, // green
    'error-rate': `rgba(239, 68, 68, ${alpha})`, // red
    'response-time': `rgba(245, 158, 11, ${alpha})`, // amber
  };
  return colors[type] || `rgba(107, 114, 128, ${alpha})`;
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}
```

### 1.4 메트릭 카드 컴포넌트

```typescript
// src/components/admin/MetricCard.tsx
'use client';

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import {
  Users,
  Building,
  Rocket,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: 'users' | 'building' | 'rocket' | 'activity';
  trend?: number[];
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  trend,
  loading = false
}: MetricCardProps) {
  const Icon = {
    users: Users,
    building: Building,
    rocket: Rocket,
    activity: Activity,
  }[icon];

  const getTrendIcon = () => {
    if (!change) return <Minus className="w-4 h-4 text-gray-400" />;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    return <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getChangeColor = () => {
    if (!change) return 'text-gray-500';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getChangeColor()}`}>
              {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>

      {trend && trend.length > 0 && (
        <div className="mt-4 h-10">
          <MiniSparkline data={trend} />
        </div>
      )}
    </div>
  );
}

// 미니 스파크라인 차트
function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 40;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
        className="text-blue-500"
      />
    </svg>
  );
}
```

## Task 2: 사용자 관리 시스템

### 2.1 사용자 관리 API

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAdminAuth } from '@/lib/admin-auth';
import { z } from 'zod';

// 쿼리 파라미터 스키마
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'suspended', 'all']).default('all'),
  sortBy: z.enum(['createdAt', 'lastActiveAt', 'townCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 체크
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    // 검색 조건 구성
    const where: any = {};
    
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { githubUsername: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status !== 'all') {
      where.status = query.status;
    }

    // 전체 개수 조회
    const total = await db.user.count({ where });

    // 사용자 목록 조회
    const users = await db.user.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      select: {
        id: true,
        email: true,
        name: true,
        githubUsername: true,
        avatar: true,
        status: true,
        createdAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    // 응답 데이터 포맷
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || user.githubUsername || 'Unknown',
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      townCount: user._count.projects,
    }));

    return NextResponse.json({
      data: formattedUsers,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 사용자 상태 변경 (PATCH)
export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userIds, action, reason } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid user IDs' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'suspend':
        await suspendUsers(userIds, reason);
        break;
      case 'activate':
        await activateUsers(userIds);
        break;
      case 'delete':
        await deleteUsers(userIds, reason);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function suspendUsers(userIds: string[], reason?: string) {
  await db.$transaction(async (tx) => {
    // 사용자 상태 업데이트
    await tx.user.updateMany({
      where: { id: { in: userIds } },
      data: { status: 'suspended' },
    });

    // 정지 기록 생성
    await tx.userSuspension.createMany({
      data: userIds.map(userId => ({
        userId,
        reason: reason || 'Admin action',
        suspendedBy: 'admin', // 실제로는 현재 관리자 ID
      })),
    });

    // 활성 세션 종료
    await tx.session.deleteMany({
      where: { userId: { in: userIds } },
    });
  });
}

async function activateUsers(userIds: string[]) {
  await db.$transaction(async (tx) => {
    // 사용자 활성화
    await tx.user.updateMany({
      where: { id: { in: userIds } },
      data: { status: 'active' },
    });

    // 정지 기록 종료
    await tx.userSuspension.updateMany({
      where: {
        userId: { in: userIds },
        liftedAt: null,
      },
      data: {
        liftedAt: new Date(),
        liftedBy: 'admin', // 실제로는 현재 관리자 ID
      },
    });
  });
}

async function deleteUsers(userIds: string[], reason?: string) {
  // Soft delete 구현
  await db.$transaction(async (tx) => {
    await tx.user.updateMany({
      where: { id: { in: userIds } },
      data: {
        status: 'deleted',
        deletedAt: new Date(),
        email: db.raw(`email || '_deleted_' || extract(epoch from now())`),
      },
    });

    // 삭제 기록
    await tx.userDeletion.createMany({
      data: userIds.map(userId => ({
        userId,
        reason: reason || 'Admin action',
        deletedBy: 'admin',
      })),
    });
  });
}
```

### 2.2 사용자 상세 정보 모달

```typescript
// src/components/admin/UserDetailModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Mail, Github, Calendar, Building, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface UserDetail {
  id: string;
  email: string;
  name: string;
  githubUsername: string;
  avatar: string;
  status: string;
  createdAt: string;
  lastActiveAt: string;
  stats: {
    totalProjects: number;
    activeProjects: number;
    totalDeployments: number;
    totalAIRequests: number;
    storageUsed: number;
  };
  projects: Array<{
    id: string;
    name: string;
    createdAt: string;
    lastDeployment: string | null;
    buildingCount: number;
  }>;
  activity: Array<{
    id: string;
    action: string;
    timestamp: string;
    details: any;
  }>;
}

interface UserDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDetailModal({ userId, isOpen, onClose }: UserDetailModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'activity'>('overview');

  useEffect(() => {
    if (userId && isOpen) {
      loadUserDetail();
    }
  }, [userId, isOpen]);

  const loadUserDetail = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Failed to load user detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-xl shadow-xl">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          ) : user ? (
            <>
              {/* 헤더 */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                      <p className="text-gray-600">{user.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Github className="w-4 h-4" />
                          {user.githubUsername}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          가입: {formatDistanceToNow(new Date(user.createdAt), { 
                            addSuffix: true, 
                            locale: ko 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* 탭 */}
              <div className="border-b border-gray-200">
                <nav className="flex gap-8 px-6">
                  {(['overview', 'projects', 'activity'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab === 'overview' && '개요'}
                      {tab === 'projects' && '프로젝트'}
                      {tab === 'activity' && '활동 내역'}
                    </button>
                  ))}
                </nav>
              </div>

              {/* 탭 내용 */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatCard
                      label="총 프로젝트"
                      value={user.stats.totalProjects}
                      icon={Building}
                    />
                    <StatCard
                      label="활성 프로젝트"
                      value={user.stats.activeProjects}
                      icon={Activity}
                    />
                    <StatCard
                      label="총 배포"
                      value={user.stats.totalDeployments}
                      icon={Rocket}
                    />
                    <StatCard
                      label="AI 요청"
                      value={user.stats.totalAIRequests}
                      icon={Activity}
                    />
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="space-y-4">
                    {user.projects.map((project) => (
                      <div
                        key={project.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{project.name}</h4>
                            <p className="text-sm text-gray-600">
                              {project.buildingCount}개 건물 • 
                              생성: {formatDistanceToNow(new Date(project.createdAt), {
                                addSuffix: true,
                                locale: ko
                              })}
                            </p>
                          </div>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            상세 보기
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-3">
                    {user.activity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-gray-900">{activity.action}</p>
                          <p className="text-gray-500">
                            {formatDistanceToNow(new Date(activity.timestamp), {
                              addSuffix: true,
                              locale: ko
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-600">사용자 정보를 불러올 수 없습니다.</p>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function StatCard({ label, value, icon: Icon }: any) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
```

## Task 3: 시스템 모니터링

### 3.1 시스템 메트릭 컴포넌트

```typescript
// src/components/admin/SystemMetrics.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Cpu, HardDrive, Database, Wifi } from 'lucide-react';

interface SystemMetric {
  label: string;
  value: number;
  max: number;
  unit: string;
  icon: React.ComponentType<any>;
  status: 'normal' | 'warning' | 'critical';
}

export function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000); // 5초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/admin/system/metrics');
      const data = await response.json();

      setMetrics([
        {
          label: 'CPU 사용률',
          value: data.cpu.usage,
          max: 100,
          unit: '%',
          icon: Cpu,
          status: getStatus(data.cpu.usage, 70, 85),
        },
        {
          label: '메모리 사용률',
          value: data.memory.usedPercent,
          max: 100,
          unit: '%',
          icon: HardDrive,
          status: getStatus(data.memory.usedPercent, 80, 90),
        },
        {
          label: 'DB 연결',
          value: data.database.connections,
          max: data.database.maxConnections,
          unit: '개',
          icon: Database,
          status: getStatus(
            (data.database.connections / data.database.maxConnections) * 100,
            70,
            85
          ),
        },
        {
          label: '네트워크 I/O',
          value: data.network.bandwidth,
          max: data.network.maxBandwidth,
          unit: 'Mbps',
          icon: Wifi,
          status: getStatus(
            (data.network.bandwidth / data.network.maxBandwidth) * 100,
            70,
            85
          ),
        },
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load system metrics:', error);
    }
  };

  const getStatus = (value: number, warningThreshold: number, criticalThreshold: number) => {
    if (value >= criticalThreshold) return 'critical';
    if (value >= warningThreshold) return 'warning';
    return 'normal';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-600';
      case 'warning':
        return 'bg-yellow-600';
      default:
        return 'bg-green-600';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const percentage = (metric.value / metric.max) * 100;

        return (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>{metric.label}</span>
                <Icon className="w-4 h-4 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold">{metric.value}</span>
                <span className="text-sm text-gray-500">
                  / {metric.max} {metric.unit}
                </span>
              </div>
              <Progress
                value={percentage}
                className="h-2"
                indicatorClassName={getProgressColor(metric.status)}
              />
              <div className="mt-2">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    metric.status
                  )}`}
                >
                  {metric.status === 'normal' && '정상'}
                  {metric.status === 'warning' && '주의'}
                  {metric.status === 'critical' && '위험'}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

### 3.2 로그 스트리밍 시스템

```typescript
// src/components/admin/LogStream.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { Search, Filter, Download, Pause, Play } from 'lucide-react';
import { format } from 'date-fns';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
  metadata?: Record<string, any>;
}

export function LogStream() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<{
    level: string;
    service: string;
    search: string;
  }>({
    level: 'all',
    service: 'all',
    search: '',
  });
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isPaused) {
      connectToLogStream();
    } else {
      disconnectFromLogStream();
    }

    return () => {
      disconnectFromLogStream();
    };
  }, [isPaused, filter]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const connectToLogStream = () => {
    const params = new URLSearchParams({
      level: filter.level,
      service: filter.service,
    });

    eventSourceRef.current = new EventSource(`/api/admin/logs/stream?${params}`);

    eventSourceRef.current.onmessage = (event) => {
      const logEntry: LogEntry = JSON.parse(event.data);
      
      // 검색 필터 적용
      if (filter.search && !logEntry.message.toLowerCase().includes(filter.search.toLowerCase())) {
        return;
      }

      setLogs((prev) => {
        const updated = [...prev, logEntry];
        // 최대 1000개 로그 유지
        if (updated.length > 1000) {
          updated.shift();
        }
        return updated;
      });
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('Log stream error:', error);
      eventSourceRef.current?.close();
      // 5초 후 재연결 시도
      setTimeout(() => {
        if (!isPaused) {
          connectToLogStream();
        }
      }, 5000);
    };
  };

  const disconnectFromLogStream = () => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  };

  const handleExport = () => {
    const csvContent = [
      'Timestamp,Level,Service,Message',
      ...logs.map(log => 
        `"${log.timestamp}","${log.level}","${log.service}","${log.message.replace(/"/g, '""')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warn':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      case 'debug':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* 툴바 */}
      <div className="flex items-center gap-4 p-4 border-b">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="로그 검색..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filter.level}
          onChange={(e) => setFilter({ ...filter, level: e.target.value })}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">모든 레벨</option>
          <option value="error">에러</option>
          <option value="warn">경고</option>
          <option value="info">정보</option>
          <option value="debug">디버그</option>
        </select>

        <select
          value={filter.service}
          onChange={(e) => setFilter({ ...filter, service: e.target.value })}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">모든 서비스</option>
          <option value="api">API</option>
          <option value="auth">인증</option>
          <option value="ai">AI</option>
          <option value="deployment">배포</option>
        </select>

        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-2 border rounded-lg hover:bg-gray-50"
          title={isPaused ? '재생' : '일시정지'}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        <button
          onClick={handleExport}
          className="p-2 border rounded-lg hover:bg-gray-50"
          title="내보내기"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* 로그 컨테이너 */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto font-mono text-sm"
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          const isAtBottom = target.scrollHeight - target.scrollTop === target.clientHeight;
          setAutoScroll(isAtBottom);
        }}
      >
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-4 px-4 py-2 hover:bg-gray-50 border-b border-gray-100"
          >
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
            </span>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${getLevelColor(
                log.level
              )}`}
            >
              {log.level.toUpperCase()}
            </span>
            <span className="text-xs font-medium text-gray-600">[{log.service}]</span>
            <span className="flex-1 text-xs text-gray-800 break-all">{log.message}</span>
          </div>
        ))}
      </div>

      {/* 자동 스크롤 표시 */}
      {!autoScroll && (
        <div className="absolute bottom-20 right-8">
          <button
            onClick={() => {
              setAutoScroll(true);
              if (logContainerRef.current) {
                logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700"
          >
            최신 로그로 이동
          </button>
        </div>
      )}
    </div>
  );
}
```

### 3.3 알림 패널

```typescript
// src/components/admin/AlertsPanel.tsx
'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Info, X, Bell, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  service: string;
  actionRequired: boolean;
  actions?: Array<{
    label: string;
    action: string;
  }>;
  metadata?: Record<string, any>;
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000); // 30초마다 갱신
    return () => clearInterval(interval);
  }, [filter]);

  const loadAlerts = async () => {
    try {
      const response = await fetch(`/api/admin/alerts?filter=${filter}`);
      const data = await response.json();
      setAlerts(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      await fetch(`/api/admin/alerts/${alertId}/dismiss`, { method: 'POST' });
      setAlerts(alerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const handleAction = async (alertId: string, action: string) => {
    try {
      await fetch(`/api/admin/alerts/${alertId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      await loadAlerts();
    } catch (error) {
      console.error('Failed to execute action:', error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 탭 */}
      <div className="flex gap-4 border-b">
        {(['active', 'all', 'resolved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              filter === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'active' && '활성'}
            {tab === 'all' && '전체'}
            {tab === 'resolved' && '해결됨'}
          </button>
        ))}
      </div>

      {/* 알림 목록 */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>표시할 알림이 없습니다</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getAlertStyle(alert.type)}`}
            >
              <div className="flex items-start gap-3">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{alert.service}</span>
                        <span>
                          {formatDistanceToNow(new Date(alert.timestamp), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </span>
                      </div>
                    </div>
                    {!alert.actionRequired && (
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  {alert.actions && alert.actions.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {alert.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleAction(alert.id, action.action)}
                          className="px-3 py-1 bg-white border rounded text-sm font-medium hover:bg-gray-50"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

### 4.2 시스템 공지 컴포넌트

```typescript
// src/components/admin/SystemAnnouncement.tsx
'use client';

import { useState } from 'react';
import { AlertCircle, Info, AlertTriangle, Send } from 'lucide-react';

interface AnnouncementFormData {
  message: string;
  type: 'info' | 'warning' | 'critical';
  duration: number | null;
}

export function SystemAnnouncement() {
  const [formData, setFormData] = useState<AnnouncementFormData>({
    message: '',
    type: 'info',
    duration: null,
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/admin/emergency/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ message: '', type: 'info', duration: null });
        alert('공지가 전송되었습니다.');
      }
    } catch (error) {
      console.error('Failed to send announcement:', error);
      alert('공지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          공지 메시지
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="모든 사용자에게 표시될 메시지를 입력하세요..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            공지 타입
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="info">정보</option>
            <option value="warning">경고</option>
            <option value="critical">긴급</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            표시 시간 (분)
          </label>
          <input
            type="number"
            value={formData.duration || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              duration: e.target.value ? parseInt(e.target.value) * 60 : null 
            })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="무제한"
            min={1}
          />
        </div>
      </div>

      {formData.message && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-2">미리보기:</p>
          <div className={`flex items-start gap-3 p-3 rounded-lg ${getTypeColor(formData.type)}`}>
            {getTypeIcon(formData.type)}
            <p className="text-sm">{formData.message}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!formData.message.trim() || sending}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        {sending ? '전송 중...' : '공지 전송'}
      </button>
    </form>
  );
}
```

## Task 4: 긴급 제어 시스템

### 4.1 긴급 제어 API

```typescript
// src/app/api/admin/emergency/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth, getAdminRole } from '@/lib/admin-auth';
import { redis } from '@/lib/redis';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// 긴급 제어 상태 타입
interface EmergencyState {
  maintenanceMode: boolean;
  deploymentFreeze: boolean;
  aiDisabled: boolean;
  emergencyShutdown: boolean;
  announcement: {
    active: boolean;
    message: string;
    type: 'info' | 'warning' | 'critical';
    expiresAt: string | null;
  } | null;
}

// 긴급 제어 상태 가져오기
export async function GET(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const state = await getEmergencyState();
  return NextResponse.json(state);
}

// 긴급 제어 상태 업데이트
export async function POST(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Super Admin만 긴급 제어 가능
  const session = await auth();
  const adminEmail = session?.user?.email;
  const role = await getAdminRole(adminEmail!);
  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { control, value, reason } = body;

  try {
    switch (control) {
      case 'maintenance':
        await toggleMaintenanceMode(value, reason, adminEmail!);
        break;
      case 'deployment-freeze':
        await toggleDeploymentFreeze(value, reason, adminEmail!);
        break;
      case 'ai-service':
        await toggleAIService(value, reason, adminEmail!);
        break;
      case 'emergency-shutdown':
        await initiateEmergencyShutdown(reason, adminEmail!);
        break;
      default:
        return NextResponse.json({ error: 'Invalid control' }, { status: 400 });
    }

    // 변경 사항 브로드캐스트
    await broadcastEmergencyUpdate();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Emergency control error:', error);
    return NextResponse.json(
      { error: 'Failed to update emergency control' },
      { status: 500 }
    );
  }
}

async function getEmergencyState(): Promise<EmergencyState> {
  const state = await redis.get('emergency:state');
  if (state) {
    return JSON.parse(state);
  }

  // 기본 상태
  return {
    maintenanceMode: false,
    deploymentFreeze: false,
    aiDisabled: false,
    emergencyShutdown: false,
    announcement: null,
  };
}

async function toggleMaintenanceMode(enabled: boolean, reason: string, adminEmail: string) {
  const state = await getEmergencyState();
  state.maintenanceMode = enabled;

  await redis.set('emergency:state', JSON.stringify(state));
  
  // 로그 기록
  await db.emergencyLog.create({
    data: {
      action: enabled ? 'MAINTENANCE_ON' : 'MAINTENANCE_OFF',
      reason,
      performedBy: adminEmail,
      metadata: {},
    },
  });

  // 모든 활성 세션 종료 (유지보수 모드 켜질 때)
  if (enabled) {
    await db.session.deleteMany({});
    await redis.flushdb(); // 캐시 클리어
  }
}

async function toggleDeploymentFreeze(frozen: boolean, reason: string, adminEmail: string) {
  const state = await getEmergencyState();
  state.deploymentFreeze = frozen;

  await redis.set('emergency:state', JSON.stringify(state));
  
  // Vercel 웹훅 비활성화
  if (frozen) {
    await disableVercelWebhooks();
  } else {
    await enableVercelWebhooks();
  }

  await db.emergencyLog.create({
    data: {
      action: frozen ? 'DEPLOYMENT_FREEZE' : 'DEPLOYMENT_UNFREEZE',
      reason,
      performedBy: adminEmail,
      metadata: {},
    },
  });
}

async function toggleAIService(disabled: boolean, reason: string, adminEmail: string) {
  const state = await getEmergencyState();
  state.aiDisabled = disabled;

  await redis.set('emergency:state', JSON.stringify(state));
  
  // AI 서비스 상태 업데이트
  await redis.set('ai:service:enabled', !disabled ? '1' : '0');

  await db.emergencyLog.create({
    data: {
      action: disabled ? 'AI_SERVICE_DISABLED' : 'AI_SERVICE_ENABLED',
      reason,
      performedBy: adminEmail,
      metadata: {},
    },
  });
}

async function initiateEmergencyShutdown(reason: string, adminEmail: string) {
  const state = await getEmergencyState();
  state.emergencyShutdown = true;
  state.maintenanceMode = true;
  state.deploymentFreeze = true;
  state.aiDisabled = true;

  await redis.set('emergency:state', JSON.stringify(state));
  
  // 모든 서비스 중단
  await Promise.all([
    db.session.deleteMany({}), // 모든 세션 종료
    redis.flushdb(), // 캐시 클리어
    disableAllExternalServices(), // 외부 서비스 비활성화
  ]);

  await db.emergencyLog.create({
    data: {
      action: 'EMERGENCY_SHUTDOWN',
      reason,
      performedBy: adminEmail,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
  });

  // 알림 전송
  await sendEmergencyNotifications(reason);
}

async function broadcastEmergencyUpdate() {
  const state = await getEmergencyState();
  
  // WebSocket으로 모든 관리자에게 전송
  if (global.io) {
    global.io.to('admin').emit('emergency:update', state);
  }
}

// src/app/api/admin/emergency/announcement/route.ts
export async function POST(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { message, type, duration } = body;

  if (!message || !type) {
    return NextResponse.json(
      { error: 'Message and type are required' },
      { status: 400 }
    );
  }

  const state = await getEmergencyState();
  state.announcement = {
    active: true,
    message,
    type,
    expiresAt: duration ? new Date(Date.now() + duration * 1000).toISOString() : null,
  };

  await redis.set('emergency:state', JSON.stringify(state));
  
  // 모든 사용자에게 브로드캐스트
  if (global.io) {
    global.io.emit('announcement', state.announcement);
  }

  return NextResponse.json({ success: true });
}

// 긴급 공지 삭제
export async function DELETE(request: NextRequest) {
  const isAdmin = await checkAdminAuth();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const state = await getEmergencyState();
  state.announcement = null;

  await redis.set('emergency:state', JSON.stringify(state));
  
  // 브로드캐스트
  if (global.io) {
    global.io.emit('announcement', null);
  }

  return NextResponse.json({ success: true });
}

// 헬퍼 함수들
async function disableVercelWebhooks() {
  // Vercel API를 통해 웹훅 비활성화
  const webhooks = await getVercelWebhooks();
  for (const webhook of webhooks) {
    await disableVercelWebhook(webhook.id);
  }
}

async function enableVercelWebhooks() {
  // Vercel API를 통해 웹훅 활성화
  const webhooks = await getVercelWebhooks();
  for (const webhook of webhooks) {
    await enableVercelWebhook(webhook.id);
  }
}

async function disableAllExternalServices() {
  // 모든 외부 서비스 비활성화
  await Promise.all([
    disableGitHubWebhooks(),
    disableVercelWebhooks(),
    disableEmailService(),
  ]);
}

async function sendEmergencyNotifications(reason: string) {
  // 모든 관리자에게 긴급 알림 전송
  const admins = await db.adminUser.findMany({
    select: { email: true, phone: true }
  });

  for (const admin of admins) {
    // 이메일 알림
    if (admin.email) {
      await sendEmergencyEmail(admin.email, reason);
    }
    // SMS 알림 (구현된 경우)
    if (admin.phone) {
      await sendEmergencySMS(admin.phone, reason);
    }
  }
}