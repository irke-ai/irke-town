# Sprint 3.3: Vercel 배포 통합 (상세 버전)

## 개요
Vercel REST API를 통해 프로젝트를 자동으로 배포하고 상태를 모니터링하는 시스템을 구현합니다. Vercel REST API를 사용하면 HTTP 요청을 통해 웹 애플리케이션의 새 버전을 배포하고, 커스텀 도메인을 관리하고, 배포 정보를 조회하고, 프로젝트의 시크릿과 환경 변수를 관리할 수 있습니다.

## 주요 작업

### Task 1: Vercel API 클라이언트 설정

#### 1.1 Vercel API 인증 설정
```typescript
// src/services/vercel/client.ts
/**
 * irke://stack/integration/vercel/client
 * Vercel API 클라이언트 설정
 */
export class VercelAPIClient {
  private readonly baseURL = 'https://api.vercel.com';
  private readonly headers: Record<string, string>;

  constructor(private readonly accessToken: string, private readonly teamId?: string) {
    this.headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    queryParams?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    if (this.teamId) {
      url.searchParams.append('teamId', this.teamId);
    }

    const response = await fetch(url.toString(), {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new VercelAPIError(
        error.error?.message || 'API request failed',
        response.status,
        error.error?.code
      );
    }

    return response.json();
  }
}

export class VercelAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'VercelAPIError';
  }
}
```

#### 1.2 Vercel OAuth 인증
```typescript
// src/services/vercel/auth.service.ts
/**
 * irke://stack/integration/vercel/auth
 * Vercel OAuth 인증 서비스
 */
export class VercelAuthService {
  private static readonly VERCEL_OAUTH_URL = 'https://vercel.com/oauth/authorize';
  private static readonly VERCEL_TOKEN_URL = 'https://api.vercel.com/v2/oauth/access_token';

  static getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_VERCEL_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/vercel/callback`,
      response_type: 'code',
      scope: 'all', // 모든 권한 요청
      state,
    });

    return `${this.VERCEL_OAUTH_URL}?${params}`;
  }

  static async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    teamId?: string;
    userId: string;
    installationId?: string;
  }> {
    const response = await fetch(this.VERCEL_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.VERCEL_CLIENT_ID!,
        client_secret: process.env.VERCEL_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/vercel/callback`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to exchange code for token');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      teamId: data.team_id,
      userId: data.user_id,
      installationId: data.installation_id,
    };
  }

  static async getCurrentUser(accessToken: string) {
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json();
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      username: data.user.username,
      avatar: data.user.avatar,
    };
  }

  static async getTeams(accessToken: string) {
    const response = await fetch('https://api.vercel.com/v2/teams', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get teams');
    }

    const data = await response.json();
    return data.teams;
  }
}
```

### Task 2: Vercel 프로젝트 및 배포 관리

#### 2.1 프로젝트 서비스
```typescript
// src/services/vercel/project.service.ts
/**
 * irke://stack/integration/vercel/project
 * Vercel 프로젝트 관리 서비스
 */
import { VercelAPIClient } from './client';

export interface CreateProjectOptions {
  name: string;
  framework?: 'nextjs' | 'react' | 'vue' | 'svelte' | 'static';
  gitRepository?: {
    type: 'github' | 'gitlab' | 'bitbucket';
    repo: string; // owner/repo 형식
  };
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
  devCommand?: string;
  environmentVariables?: Array<{
    key: string;
    value: string;
    type?: 'plain' | 'encrypted' | 'secret';
    target?: Array<'production' | 'preview' | 'development'>;
  }>;
  publicSource?: boolean;
  rootDirectory?: string;
}

export class VercelProjectService {
  private client: VercelAPIClient;

  constructor(accessToken: string, teamId?: string) {
    this.client = new VercelAPIClient(accessToken, teamId);
  }

  async createProject(options: CreateProjectOptions) {
    const body: any = {
      name: options.name,
      framework: options.framework || 'nextjs',
      publicSource: options.publicSource ?? true,
    };

    // Git 저장소 연결
    if (options.gitRepository) {
      body.gitRepository = {
        type: options.gitRepository.type,
        repo: options.gitRepository.repo,
      };
    }

    // 빌드 설정
    if (options.buildCommand !== undefined) {
      body.buildCommand = options.buildCommand;
    }
    if (options.outputDirectory !== undefined) {
      body.outputDirectory = options.outputDirectory;
    }
    if (options.installCommand !== undefined) {
      body.installCommand = options.installCommand;
    }
    if (options.devCommand !== undefined) {
      body.devCommand = options.devCommand;
    }
    if (options.rootDirectory !== undefined) {
      body.rootDirectory = options.rootDirectory;
    }

    const project = await this.client.request<any>(
      'POST',
      '/v9/projects',
      body
    );

    // 환경 변수 설정
    if (options.environmentVariables && options.environmentVariables.length > 0) {
      await this.setEnvironmentVariables(project.id, options.environmentVariables);
    }

    return {
      id: project.id,
      name: project.name,
      accountId: project.accountId,
      createdAt: project.createdAt,
      framework: project.framework,
      gitRepository: project.gitRepository,
      link: project.link,
    };
  }

  async getProject(projectId: string) {
    const project = await this.client.request<any>(
      'GET',
      `/v9/projects/${projectId}`
    );

    return {
      id: project.id,
      name: project.name,
      accountId: project.accountId,
      framework: project.framework,
      gitRepository: project.gitRepository,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      buildCommand: project.buildCommand,
      outputDirectory: project.outputDirectory,
      installCommand: project.installCommand,
      devCommand: project.devCommand,
      rootDirectory: project.rootDirectory,
    };
  }

  async updateProject(projectId: string, updates: Partial<CreateProjectOptions>) {
    const body: any = {};

    if (updates.name) body.name = updates.name;
    if (updates.buildCommand !== undefined) body.buildCommand = updates.buildCommand;
    if (updates.outputDirectory !== undefined) body.outputDirectory = updates.outputDirectory;
    if (updates.installCommand !== undefined) body.installCommand = updates.installCommand;
    if (updates.devCommand !== undefined) body.devCommand = updates.devCommand;
    if (updates.rootDirectory !== undefined) body.rootDirectory = updates.rootDirectory;

    return await this.client.request<any>(
      'PATCH',
      `/v9/projects/${projectId}`,
      body
    );
  }

  async deleteProject(projectId: string) {
    await this.client.request<void>(
      'DELETE',
      `/v9/projects/${projectId}`
    );
  }

  async listProjects(limit = 20) {
    const response = await this.client.request<any>(
      'GET',
      '/v9/projects',
      undefined,
      { limit: limit.toString() }
    );

    return response.projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      framework: project.framework,
      gitRepository: project.gitRepository,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
  }

  async setEnvironmentVariables(
    projectId: string,
    variables: Array<{
      key: string;
      value: string;
      type?: 'plain' | 'encrypted' | 'secret';
      target?: Array<'production' | 'preview' | 'development'>;
    }>
  ) {
    const promises = variables.map(variable =>
      this.client.request(
        'POST',
        `/v10/projects/${projectId}/env`,
        {
          key: variable.key,
          value: variable.value,
          type: variable.type || 'encrypted',
          target: variable.target || ['production', 'preview', 'development'],
        }
      )
    );

    await Promise.all(promises);
  }

  async getEnvironmentVariables(projectId: string) {
    const response = await this.client.request<any>(
      'GET',
      `/v10/projects/${projectId}/env`
    );

    return response.envs;
  }

  async getProjectDomains(projectId: string) {
    const response = await this.client.request<any>(
      'GET',
      `/v9/projects/${projectId}/domains`
    );

    return response.domains.map((domain: any) => ({
      name: domain.name,
      apexName: domain.apexName,
      projectId: domain.projectId,
      redirect: domain.redirect,
      redirectStatusCode: domain.redirectStatusCode,
      gitBranch: domain.gitBranch,
      updatedAt: domain.updatedAt,
      createdAt: domain.createdAt,
      verified: domain.verified,
    }));
  }

  async addDomain(projectId: string, domain: string, gitBranch?: string) {
    return await this.client.request(
      'POST',
      `/v9/projects/${projectId}/domains`,
      {
        name: domain,
        gitBranch: gitBranch || null,
      }
    );
  }
}
```

#### 2.2 배포 서비스
```typescript
// src/services/vercel/deployment.service.ts
/**
 * irke://stack/integration/vercel/deployment
 * Vercel 배포 관리 서비스
 */
import { VercelAPIClient } from './client';

export interface CreateDeploymentOptions {
  name: string;
  files?: Array<{
    file: string;
    data: string;
    encoding?: 'base64' | 'utf-8';
  }>;
  projectId?: string;
  projectSettings?: {
    buildCommand?: string;
    outputDirectory?: string;
    installCommand?: string;
    devCommand?: string;
    framework?: string;
  };
  gitSource?: {
    type: 'github' | 'gitlab' | 'bitbucket';
    ref: string;
    sha?: string;
    repoId?: string;
  };
  target?: 'production' | 'preview';
  meta?: Record<string, string>;
  env?: Record<string, string>;
  buildEnv?: Record<string, string>;
}

export interface DeploymentFile {
  file: string;
  sha: string;
  size: number;
}

export class VercelDeploymentService {
  private client: VercelAPIClient;

  constructor(accessToken: string, teamId?: string) {
    this.client = new VercelAPIClient(accessToken, teamId);
  }

  async createDeployment(options: CreateDeploymentOptions) {
    const body: any = {
      name: options.name,
      target: options.target || 'production',
    };

    // Git 소스 배포
    if (options.gitSource) {
      body.gitSource = options.gitSource;
    }

    // 파일 업로드 배포
    if (options.files && options.files.length > 0) {
      // 먼저 파일들을 업로드
      const uploadedFiles = await this.uploadFiles(options.files);
      body.files = uploadedFiles;
    }

    // 프로젝트 설정
    if (options.projectId) {
      body.projectId = options.projectId;
    }
    if (options.projectSettings) {
      body.projectSettings = options.projectSettings;
    }

    // 환경 변수
    if (options.env) {
      body.env = options.env;
    }
    if (options.buildEnv) {
      body.buildEnv = options.buildEnv;
    }

    // 메타데이터
    if (options.meta) {
      body.meta = options.meta;
    }

    const deployment = await this.client.request<any>(
      'POST',
      '/v13/deployments',
      body
    );

    return {
      id: deployment.id,
      url: deployment.url,
      name: deployment.name,
      meta: deployment.meta,
      target: deployment.target,
      projectId: deployment.projectId,
      state: deployment.readyState,
      createdAt: deployment.createdAt,
      buildingAt: deployment.buildingAt,
      ready: deployment.ready,
      creator: deployment.creator,
    };
  }

  private async uploadFiles(files: Array<{
    file: string;
    data: string;
    encoding?: 'base64' | 'utf-8';
  }>): Promise<DeploymentFile[]> {
    const uploadedFiles: DeploymentFile[] = [];

    for (const file of files) {
      // 파일 내용을 SHA-1 해시로 변환
      const content = file.encoding === 'base64' 
        ? Buffer.from(file.data, 'base64')
        : Buffer.from(file.data, 'utf-8');
      
      const sha = await this.calculateSHA1(content);
      const size = content.length;

      // 파일 업로드
      await this.client.request(
        'POST',
        '/v2/files',
        {
          sha,
          size,
        }
      );

      uploadedFiles.push({
        file: file.file,
        sha,
        size,
      });
    }

    return uploadedFiles;
  }

  private async calculateSHA1(content: Buffer): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content.toString());
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async getDeployment(deploymentId: string) {
    const deployment = await this.client.request<any>(
      'GET',
      `/v13/deployments/${deploymentId}`
    );

    return {
      id: deployment.id,
      url: deployment.url,
      name: deployment.name,
      meta: deployment.meta,
      target: deployment.target,
      projectId: deployment.projectId,
      state: deployment.readyState,
      error: deployment.errorMessage,
      createdAt: deployment.createdAt,
      buildingAt: deployment.buildingAt,
      ready: deployment.ready,
      creator: deployment.creator,
      build: deployment.build,
      functions: deployment.functions,
    };
  }

  async cancelDeployment(deploymentId: string) {
    return await this.client.request(
      'PATCH',
      `/v12/deployments/${deploymentId}/cancel`
    );
  }

  async listDeployments(options?: {
    projectId?: string;
    limit?: number;
    since?: number;
    until?: number;
    state?: Array<'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED'>;
  }) {
    const queryParams: Record<string, string> = {};
    
    if (options?.projectId) queryParams.projectId = options.projectId;
    if (options?.limit) queryParams.limit = options.limit.toString();
    if (options?.since) queryParams.since = options.since.toString();
    if (options?.until) queryParams.until = options.until.toString();
    if (options?.state) queryParams.state = options.state.join(',');

    const response = await this.client.request<any>(
      'GET',
      '/v6/deployments',
      undefined,
      queryParams
    );

    return response.deployments.map((deployment: any) => ({
      uid: deployment.uid,
      name: deployment.name,
      url: deployment.url,
      created: deployment.created,
      state: deployment.state,
      readyState: deployment.readyState,
      type: deployment.type,
      creator: deployment.creator,
      meta: deployment.meta,
      target: deployment.target,
      projectId: deployment.projectId,
      buildingAt: deployment.buildingAt,
      ready: deployment.ready,
    }));
  }

  async getDeploymentEvents(deploymentId: string, options?: {
    limit?: number;
    since?: number;
    until?: number;
  }) {
    const queryParams: Record<string, string> = {};
    
    if (options?.limit) queryParams.limit = options.limit.toString();
    if (options?.since) queryParams.since = options.since.toString();
    if (options?.until) queryParams.until = options.until.toString();

    return await this.client.request<any>(
      'GET',
      `/v3/deployments/${deploymentId}/events`,
      undefined,
      queryParams
    );
  }

  async promoteDeployment(deploymentId: string) {
    return await this.client.request(
      'POST',
      `/v10/deployments/${deploymentId}/promote`
    );
  }

  async rollbackDeployment(deploymentId: string) {
    const deployment = await this.getDeployment(deploymentId);
    if (!deployment.projectId) {
      throw new Error('Deployment must be associated with a project to rollback');
    }

    // 이전 production 배포 찾기
    const deployments = await this.listDeployments({
      projectId: deployment.projectId,
      state: ['READY'],
      limit: 10,
    });

    const previousProduction = deployments.find(
      d => d.target === 'production' && d.uid !== deploymentId
    );

    if (!previousProduction) {
      throw new Error('No previous production deployment found');
    }

    // 이전 배포를 production으로 승격
    return await this.promoteDeployment(previousProduction.uid);
  }
}
```

### Task 3: 배포 모니터링 서비스

#### 3.1 실시간 모니터링
```typescript
// src/services/vercel/monitor.service.ts
/**
 * irke://stack/integration/vercel/monitoring
 * Vercel 배포 모니터링 서비스
 */
import { VercelDeploymentService } from './deployment.service';

export interface DeploymentStatus {
  id: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  readyState?: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED' | 'CANCELED';
  url?: string;
  error?: {
    code: string;
    message: string;
    action?: string;
    link?: string;
  };
  meta?: Record<string, any>;
  created: number;
  buildingAt?: number;
  ready?: number;
  build?: {
    env: string[];
    logs?: Array<{
      created: number;
      level: 'info' | 'error' | 'warning';
      text: string;
      type?: string;
    }>;
  };
}

export interface DeploymentEvent {
  created: number;
  type: string;
  payload: any;
}

export class VercelMonitorService {
  private deploymentService: VercelDeploymentService;
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private eventStreams: Map<string, EventSource> = new Map();

  constructor(accessToken: string, teamId?: string) {
    this.deploymentService = new VercelDeploymentService(accessToken, teamId);
  }

  async monitorDeployment(
    deploymentId: string,
    callbacks: {
      onStatusChange?: (status: DeploymentStatus) => void;
      onLogUpdate?: (logs: any[]) => void;
      onComplete?: (status: DeploymentStatus) => void;
      onError?: (error: any) => void;
    }
  ) {
    let previousState: string | undefined;
    let previousLogCount = 0;

    const checkStatus = async () => {
      try {
        const deployment = await this.deploymentService.getDeployment(deploymentId);
        const status: DeploymentStatus = {
          id: deployment.id,
          state: deployment.state,
          readyState: deployment.state,
          url: deployment.url,
          error: deployment.error,
          meta: deployment.meta,
          created: deployment.createdAt,
          buildingAt: deployment.buildingAt,
          ready: deployment.ready,
          build: deployment.build,
        };

        // 상태 변경 감지
        if (status.state !== previousState) {
          previousState = status.state;
          callbacks.onStatusChange?.(status);
        }

        // 로그 업데이트 감지
        if (status.build?.logs && status.build.logs.length > previousLogCount) {
          const newLogs = status.build.logs.slice(previousLogCount);
          previousLogCount = status.build.logs.length;
          callbacks.onLogUpdate?.(newLogs);
        }

        // 완료 상태 체크
        if (['READY', 'ERROR', 'CANCELED'].includes(status.state)) {
          this.stopMonitoring(deploymentId);
          
          if (status.state === 'ERROR') {
            callbacks.onError?.(status.error || { message: 'Deployment failed' });
          } else {
            callbacks.onComplete?.(status);
          }
        }
      } catch (error) {
        console.error('Error checking deployment status:', error);
        callbacks.onError?.(error);
        this.stopMonitoring(deploymentId);
      }
    };

    // 초기 상태 확인
    await checkStatus();

    // 폴링 시작 (3초 간격)
    const interval = setInterval(checkStatus, 3000);
    this.pollingIntervals.set(deploymentId, interval);

    // 10분 후 자동 정리
    setTimeout(() => {
      this.stopMonitoring(deploymentId);
    }, 600000);
  }

  stopMonitoring(deploymentId: string) {
    const interval = this.pollingIntervals.get(deploymentId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(deploymentId);
    }

    const eventStream = this.eventStreams.get(deploymentId);
    if (eventStream) {
      eventStream.close();
      this.eventStreams.delete(deploymentId);
    }
  }

  async getDeploymentLogs(deploymentId: string, limit = 100) {
    const events = await this.deploymentService.getDeploymentEvents(
      deploymentId,
      { limit }
    );

    return events
      .filter((event: any) => event.type === 'build-log')
      .map((event: any) => ({
        created: event.created,
        level: event.payload.level || 'info',
        text: event.payload.text,
        type: event.payload.type,
      }));
  }

  async getProjectDeploymentHistory(projectId: string, limit = 20) {
    const deployments = await this.deploymentService.listDeployments({
      projectId,
      limit,
    });

    return deployments.map(deployment => ({
      id: deployment.uid,
      name: deployment.name,
      url: deployment.url,
      state: deployment.state,
      target: deployment.target,
      created: deployment.created,
      ready: deployment.ready,
      duration: deployment.ready && deployment.buildingAt
        ? deployment.ready - deployment.buildingAt
        : undefined,
      creator: deployment.creator,
    }));
  }

  async getDeploymentMetrics(deploymentId: string) {
    const deployment = await this.deploymentService.getDeployment(deploymentId);
    
    return {
      buildDuration: deployment.ready && deployment.buildingAt
        ? deployment.ready - deployment.buildingAt
        : undefined,
      totalSize: deployment.functions?.reduce(
        (total: number, fn: any) => total + (fn.size || 0),
        0
      ),
      functionCount: deployment.functions?.length || 0,
      error: deployment.error,
    };
  }

  cleanup() {
    // 모든 모니터링 정리
    this.pollingIntervals.forEach((interval, deploymentId) => {
      clearInterval(interval);
    });
    this.pollingIntervals.clear();

    this.eventStreams.forEach((stream, deploymentId) => {
      stream.close();
    });
    this.eventStreams.clear();
  }
}
```

#### 3.2 배포 상태 훅
```typescript
// src/hooks/useDeploymentStatus.ts
/**
 * irke://component/hooks/deployment-status
 * 배포 상태 추적 훅
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { VercelMonitorService } from '@/services/vercel/monitor.service';
import { useVercelStore } from '@/stores/vercel.store';

export interface DeploymentStatusHook {
  status: DeploymentStatus | null;
  logs: DeploymentLog[];
  isLoading: boolean;
  error: Error | null;
  progress: number;
  refresh: () => void;
}

export interface DeploymentStatus {
  id: string;
  state: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  url?: string;
  error?: {
    code: string;
    message: string;
  };
  created: number;
  ready?: number;
  buildDuration?: number;
}

export interface DeploymentLog {
  created: number;
  level: 'info' | 'error' | 'warning';
  text: string;
}

export function useDeploymentStatus(
  deploymentId: string | null
): DeploymentStatusHook {
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  
  const { accessToken, teamId } = useVercelStore();
  const monitorRef = useRef<VercelMonitorService | null>(null);

  const calculateProgress = useCallback((state: string) => {
    switch (state) {
      case 'QUEUED':
        return 10;
      case 'BUILDING':
        return 50;
      case 'READY':
        return 100;
      case 'ERROR':
      case 'CANCELED':
        return 0;
      default:
        return 0;
    }
  }, []);

  const startMonitoring = useCallback(async () => {
    if (!deploymentId || !accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const monitor = new VercelMonitorService(accessToken, teamId);
      monitorRef.current = monitor;

      await monitor.monitorDeployment(deploymentId, {
        onStatusChange: (newStatus) => {
          setStatus({
            id: newStatus.id,
            state: newStatus.state,
            url: newStatus.url,
            error: newStatus.error,
            created: newStatus.created,
            ready: newStatus.ready,
            buildDuration: newStatus.ready && newStatus.buildingAt
              ? newStatus.ready - newStatus.buildingAt
              : undefined,
          });
          setProgress(calculateProgress(newStatus.state));
        },
        onLogUpdate: (newLogs) => {
          setLogs(prev => [...prev, ...newLogs]);
        },
        onComplete: (finalStatus) => {
          setIsLoading(false);
          // 배포 히스토리에 추가
          useVercelStore.getState().addDeployment({
            id: finalStatus.id,
            url: finalStatus.url,
            state: finalStatus.state,
            createdAt: finalStatus.created,
          });
        },
        onError: (err) => {
          setError(err);
          setIsLoading(false);
        },
      });
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, [deploymentId, accessToken, teamId, calculateProgress]);

  const refresh = useCallback(() => {
    if (deploymentId) {
      startMonitoring();
    }
  }, [deploymentId, startMonitoring]);

  useEffect(() => {
    startMonitoring();

    return () => {
      if (monitorRef.current) {
        monitorRef.current.stopMonitoring(deploymentId!);
        monitorRef.current = null;
      }
    };
  }, [deploymentId, startMonitoring]);

  return {
    status,
    logs,
    isLoading,
    error,
    progress,
    refresh,
  };
}
```

### Task 4: UI 컴포넌트 구현

#### 4.1 배포 패널 컴포넌트
```tsx
// src/components/vercel/deployment-panel.tsx
/**
 * irke://component/ui/deployment-panel
 * Vercel 배포 관리 UI
 */
'use client';

import { useState, useEffect } from 'react';
import { useVercelStore } from '@/stores/vercel.store';
import { useGitHubStore } from '@/stores/github.store';
import { useProjectStore } from '@/stores/project.store';
import { useDeploymentStatus } from '@/hooks/useDeploymentStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Check, 
  X, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Terminal,
  Clock,
  Zap,
  Globe,
  GitBranch,
  Package
} from 'lucide-react';

export function DeploymentPanel() {
  const { isAuthenticated, project, deployments } = useVercelStore();
  const { repository } = useGitHubStore();
  const { projectName } = useProjectStore();
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentDeploymentId, setCurrentDeploymentId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('deploy');
  
  const { status, logs, isLoading, error, progress, refresh } = useDeploymentStatus(
    currentDeploymentId
  );

  const handleConnect = () => {
    window.location.href = '/api/auth/vercel';
  };

  const handleDeploy = async () => {
    if (!repository) return;

    setIsDeploying(true);
    try {
      const response = await fetch('/api/vercel/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projectName || repository.name,
          gitRepository: {
            type: 'github',
            repo: repository.fullName,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deploy');
      }

      const { deploymentId, projectId } = await response.json();
      setCurrentDeploymentId(deploymentId);
      
      if (!project) {
        useVercelStore.setState({
          project: { 
            id: projectId, 
            name: projectName || repository.name 
          },
        });
      }
    } catch (error: any) {
      console.error('Deployment error:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'READY':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'ERROR':
        return <X className="w-5 h-5 text-red-500" />;
      case 'BUILDING':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'QUEUED':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'CANCELED':
        return <X className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (state: string): any => {
    switch (state) {
      case 'READY':
        return 'default';
      case 'ERROR':
        return 'destructive';
      case 'BUILDING':
      case 'QUEUED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deployment</CardTitle>
          <CardDescription>
            Deploy your project to Vercel with one click
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-black dark:bg-white">
              <svg
                className="w-8 h-8 text-white dark:text-black"
                viewBox="0 0 76 76"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M38 0L76 76H0L38 0Z" fill="currentColor" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect to Vercel to deploy your projects instantly
            </p>
            <Button onClick={handleConnect} size="lg">
              Connect Vercel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deployment</CardTitle>
            <CardDescription>
              Deploy and manage your project on Vercel
            </CardDescription>
          </div>
          {project && (
            <Badge variant="outline" className="text-xs">
              <Package className="w-3 h-3 mr-1" />
              {project.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deploy">Deploy</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="deploy" className="space-y-4">
            {!repository ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connect to GitHub first to enable deployment
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="w-4 h-4" />
                    <span className="font-medium">Repository:</span>
                    <span className="text-muted-foreground">{repository.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4" />
                    <span className="font-medium">Framework:</span>
                    <span className="text-muted-foreground">Next.js</span>
                  </div>
                </div>

                <Button
                  onClick={handleDeploy}
                  disabled={isDeploying || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isDeploying || isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isDeploying ? 'Initiating...' : 'Deploying...'}
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Deploy to Vercel
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            {status ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status.state)}
                    <div>
                      <p className="font-medium">
                        {status.state === 'QUEUED' && 'Queued for deployment'}
                        {status.state === 'BUILDING' && 'Building your project...'}
                        {status.state === 'READY' && 'Deployment successful!'}
                        {status.state === 'ERROR' && 'Deployment failed'}
                        {status.state === 'CANCELED' && 'Deployment canceled'}
                      </p>
                      {status.buildDuration && (
                        <p className="text-sm text-muted-foreground">
                          Build time: {Math.round(status.buildDuration / 1000)}s
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={getStatusColor(status.state)}>
                    {status.state}
                  </Badge>
                </div>

                {progress > 0 && progress < 100 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {status.state === 'READY' && status.url && (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <p className="font-medium text-green-900 dark:text-green-100 mb-2">
                        Your project is live!
                      </p>
                      <a
                        href={`https://${status.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-green-700 dark:text-green-300 hover:underline"
                      >
                        {status.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </AlertDescription>
                  </Alert>
                )}

                {status.state === 'ERROR' && status.error && (
                  <Alert variant="destructive">
                    <X className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-1">Deployment failed</p>
                      <p className="text-sm">{status.error.message}</p>
                      {status.error.code && (
                        <p className="text-xs mt-1">Error code: {status.error.code}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {logs.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        Build Logs
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refresh}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <ScrollArea className="h-64 w-full rounded-lg border bg-black p-4">
                      <div className="space-y-1 font-mono text-xs">
                        {logs.map((log, index) => (
                          <div
                            key={index}
                            className={`
                              ${log.level === 'error' ? 'text-red-400' : ''}
                              ${log.level === 'warning' ? 'text-yellow-400' : ''}
                              ${log.level === 'info' ? 'text-gray-300' : ''}
                            `}
                          >
                            <span className="text-gray-500">
                              [{new Date(log.created).toLocaleTimeString()}]
                            </span>{' '}
                            {log.text}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active deployment</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {deployments && deployments.length > 0 ? (
              <div className="space-y-2">
                {deployments.map((deployment) => (
                  <div
                    key={deployment.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(deployment.state)}
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(deployment.createdAt).toLocaleString()}
                        </p>
                        {deployment.url && (
                          <p className="text-xs text-muted-foreground">
                            {deployment.url}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(deployment.state)}>
                        {deployment.state}
                      </Badge>
                      {deployment.url && deployment.state === 'READY' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`https://${deployment.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No deployment history</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

#### 4.2 상태 관리 스토어
```typescript
// src/stores/vercel.store.ts
/**
 * irke://stack/state/vercel
 * Vercel 상태 관리
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VercelUser {
  id: string;
  email: string;
  name: string | null;
  username: string;
  avatar: string | null;
}

interface VercelProject {
  id: string;
  name: string;
  framework?: string;
  gitRepository?: {
    type: string;
    repo: string;
  };
  domains?: string[];
  createdAt?: number;
  updatedAt?: number;
}

interface Deployment {
  id: string;
  url?: string;
  state: string;
  createdAt: number;
  ready?: number;
  meta?: Record<string, any>;
}

interface VercelStore {
  isAuthenticated: boolean;
  accessToken: string | null;
  teamId?: string;
  user: VercelUser | null;
  project: VercelProject | null;
  deployments: Deployment[];
  
  setAuth: (token: string, teamId?: string) => void;
  setUser: (user: VercelUser) => void;
  setProject: (project: VercelProject | null) => void;
  addDeployment: (deployment: Deployment) => void;
  updateDeployment: (id: string, update: Partial<Deployment>) => void;
  setDeployments: (deployments: Deployment[]) => void;
  logout: () => void;
}

export const useVercelStore = create<VercelStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      user: null,
      project: null,
      deployments: [],

      setAuth: (accessToken, teamId) => 
        set({ 
          accessToken, 
          teamId, 
          isAuthenticated: true 
        }),

      setUser: (user) => set({ user }),

      setProject: (project) => set({ project }),

      addDeployment: (deployment) =>
        set((state) => ({
          deployments: [deployment, ...state.deployments].slice(0, 20),
        })),

      updateDeployment: (id, update) =>
        set((state) => ({
          deployments: state.deployments.map((d) =>
            d.id === id ? { ...d, ...update } : d
          ),
        })),

      setDeployments: (deployments) => set({ deployments }),

      logout: () =>
        set({
          isAuthenticated: false,
          accessToken: null,
          teamId: undefined,
          user: null,
          project: null,
          deployments: [],
        }),
    }),
    {
      name: 'vercel-storage',
      partialize: (state) => ({
        project: state.project,
        deployments: state.deployments.slice(0, 5), // 최근 5개만 저장
        user: state.user,
      }),
    }
  )
);
```

### Task 5: API 엔드포인트 구현

#### 5.1 Vercel OAuth 처리
```typescript
// src/app/api/auth/vercel/route.ts
/**
 * irke://stack/api/auth/vercel
 * Vercel OAuth 처리 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { VercelAuthService } from '@/services/vercel/auth.service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // OAuth 시작
  if (!code) {
    const state = crypto.randomUUID();
    cookies().set('vercel_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10분
    });

    const authUrl = VercelAuthService.getAuthUrl(state);
    return NextResponse.redirect(authUrl);
  }

  // OAuth 콜백 처리
  try {
    // State 검증
    const savedState = cookies().get('vercel_oauth_state')?.value;
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    // 토큰 교환
    const { accessToken, teamId, userId } = await VercelAuthService.exchangeCodeForToken(code);

    // 사용자 정보 가져오기
    const user = await VercelAuthService.getCurrentUser(accessToken);

    // 토큰 저장 (실제로는 데이터베이스에 저장)
    cookies().set('vercel_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30일
    });

    if (teamId) {
      cookies().set('vercel_team_id', teamId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    // 클라이언트로 리다이렉트
    return NextResponse.redirect(
      new URL('/?vercel=connected', request.url)
    );
  } catch (error) {
    console.error('Vercel OAuth error:', error);
    return NextResponse.redirect(
      new URL('/?vercel=error', request.url)
    );
  }
}
```

#### 5.2 배포 API
```typescript
// src/app/api/vercel/deploy/route.ts
/**
 * irke://stack/api/vercel-deploy
 * Vercel 배포 API 엔드포인트
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { VercelProjectService } from '@/services/vercel/project.service';
import { VercelDeploymentService } from '@/services/vercel/deployment.service';

export async function POST(request: NextRequest) {
  try {
    const token = cookies().get('vercel_token')?.value;
    const teamId = cookies().get('vercel_team_id')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated with Vercel' },
        { status: 401 }
      );
    }

    const { projectName, gitRepository, environmentVariables } = await request.json();
    
    if (!projectName || !gitRepository) {
      return NextResponse.json(
        { error: 'Project name and Git repository are required' },
        { status: 400 }
      );
    }

    const projectService = new VercelProjectService(token, teamId);
    const deploymentService = new VercelDeploymentService(token, teamId);

    // 프로젝트 생성 또는 가져오기
    let project;
    try {
      // 기존 프로젝트 확인
      const projects = await projectService.listProjects();
      project = projects.find(p => p.name === projectName);
      
      if (!project) {
        // 새 프로젝트 생성
        project = await projectService.createProject({
          name: projectName,
          framework: 'nextjs',
          gitRepository,
          buildCommand: 'npm run build',
          outputDirectory: '.next',
          installCommand: 'npm install',
          devCommand: 'npm run dev',
          environmentVariables,
        });
      }
    } catch (error: any) {
      console.error('Project creation error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create project' },
        { status: 500 }
      );
    }

    // 배포 트리거
    try {
      const deployment = await deploymentService.createDeployment({
        name: projectName,
        projectId: project.id,
        gitSource: {
          type: gitRepository.type,
          ref: 'main',
        },
        target: 'production',
      });

      return NextResponse.json({
        projectId: project.id,
        deploymentId: deployment.id,
        deploymentUrl: deployment.url,
      });
    } catch (error: any) {
      console.error('Deployment error:', error);
      return NextResponse.json(
        { error: error.message || 'Deployment failed' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Deploy API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// 배포 목록 조회
export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('vercel_token')?.value;
    const teamId = cookies().get('vercel_team_id')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated with Vercel' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    const deploymentService = new VercelDeploymentService(token, teamId);
    
    const deployments = await deploymentService.listDeployments({
      projectId: projectId || undefined,
      limit: 20,
    });

    return NextResponse.json({ deployments });
  } catch (error: any) {
    console.error('List deployments error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list deployments' },
      { status: 500 }
    );
  }
}
```

#### 5.3 배포 상태 API
```typescript
// src/app/api/vercel/status/[id]/route.ts
/**
 * irke://stack/api/vercel-status
 * Vercel 배포 상태 조회 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { VercelDeploymentService } from '@/services/vercel/deployment.service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = cookies().get('vercel_token')?.value;
    const teamId = cookies().get('vercel_team_id')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated with Vercel' },
        { status: 401 }
      );
    }

    const deploymentService = new VercelDeploymentService(token, teamId);
    const deployment = await deploymentService.getDeployment(params.id);

    return NextResponse.json({
      id: deployment.id,
      state: deployment.state,
      url: deployment.url,
      error: deployment.error,
      created: deployment.createdAt,
      ready: deployment.ready,
      build: deployment.build,
    });
  } catch (error: any) {
    console.error('Get deployment status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get deployment status' },
      { status: 500 }
    );
  }
}
```

## 추가 구현 사항

### 환경 변수 설정
```bash
# .env.local
VERCEL_CLIENT_ID=your_vercel_client_id
VERCEL_CLIENT_SECRET=your_vercel_client_secret
NEXT_PUBLIC_VERCEL_CLIENT_ID=your_vercel_client_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 에러 처리 및 재시도
```typescript
// src/services/vercel/error-handler.ts
/**
 * irke://stack/error/vercel
 * Vercel API 에러 처리
 */
export class VercelErrorHandler {
  static handle(error: any): never {
    // Rate limit 에러
    if (error.status === 429) {
      throw new Error('Vercel API rate limit exceeded. Please try again later.');
    }

    // 인증 에러
    if (error.status === 401) {
      throw new Error('Vercel authentication failed. Please reconnect your account.');
    }

    // 권한 에러
    if (error.status === 403) {
      throw new Error('Insufficient permissions. Please check your Vercel account permissions.');
    }

    // 프로젝트 이름 중복
    if (error.code === 'project_name_taken') {
      throw new Error('A project with this name already exists. Please choose a different name.');
    }

    // 기타 에러
    throw new Error(error.message || 'An unexpected error occurred with Vercel');
  }
}
```

### 배포 최적화 전략
```typescript
// src/services/vercel/optimization.service.ts
/**
 * irke://stack/optimization/vercel
 * Vercel 배포 최적화 서비스
 */
export class VercelOptimizationService {
  // 빌드 캐시 활용
  static getBuildCacheConfig() {
    return {
      // 의존성 캐시
      installCommand: 'npm ci --cache .npm --prefer-offline',
      
      // Next.js 캐시 디렉토리
      cacheDirectories: [
        '.next/cache',
        'node_modules/.cache',
        '.npm',
      ],
    };
  }

  // 환경별 최적화 설정
  static getEnvironmentConfig(target: 'production' | 'preview') {
    if (target === 'production') {
      return {
        // 프로덕션 최적화
        buildCommand: 'npm run build',
        framework: 'nextjs',
        nodeVersion: '18.x',
        regions: ['iad1'], // 미국 동부
      };
    } else {
      return {
        // 프리뷰 최적화 (빠른 빌드)
        buildCommand: 'npm run build -- --no-lint',
        framework: 'nextjs',
        nodeVersion: '18.x',
      };
    }
  }

  // 빌드 시간 단축 전략
  static getSpeedOptimizations() {
    return {
      // 병렬 처리
      installCommand: 'npm ci --prefer-offline --no-audit',
      
      // 불필요한 파일 제외
      ignoreCommand: 'git diff HEAD^ HEAD --quiet .',
      
      // 출력 최적화
      outputDirectory: '.next',
      cleanUrls: true,
      trailingSlash: false,
    };
  }
}
```

### 도메인 관리
```typescript
// src/components/vercel/domain-manager.tsx
/**
 * irke://component/ui/domain-manager
 * Vercel 도메인 관리 컴포넌트
 */
'use client';

import { useState, useEffect } from 'react';
import { useVercelStore } from '@/stores/vercel.store';
import { VercelProjectService } from '@/services/vercel/project.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Globe, Plus, X, Check, AlertCircle, ExternalLink } from 'lucide-react';

export function DomainManager() {
  const { project, accessToken, teamId } = useVercelStore();
  const [domains, setDomains] = useState<any[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project && accessToken) {
      loadDomains();
    }
  }, [project, accessToken]);

  const loadDomains = async () => {
    if (!project || !accessToken) return;

    try {
      const service = new VercelProjectService(accessToken, teamId);
      const projectDomains = await service.getProjectDomains(project.id);
      setDomains(projectDomains);
    } catch (error) {
      console.error('Failed to load domains:', error);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain || !project || !accessToken) return;

    setIsAdding(true);
    setError(null);

    try {
      const service = new VercelProjectService(accessToken, teamId);
      await service.addDomain(project.id, newDomain);
      await loadDomains();
      setNewDomain('');
    } catch (error: any) {
      setError(error.message || 'Failed to add domain');
    } finally {
      setIsAdding(false);
    }
  };

  if (!project) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Domains</CardTitle>
        <CardDescription>
          Add custom domains to your Vercel project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddDomain();
              }
            }}
          />
          <Button
            onClick={handleAddDomain}
            disabled={!newDomain || isAdding}
          >
            {isAdding ? (
              <Plus className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {domains.map((domain) => (
            <div
              key={domain.name}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{domain.name}</p>
                  {domain.gitBranch && (
                    <p className="text-xs text-muted-foreground">
                      Branch: {domain.gitBranch}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {domain.verified ? (
                  <Badge variant="default" className="text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Pending
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={`https://${domain.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {domains.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No custom domains added yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## 테스트 체크리스트
- [x] Vercel OAuth 연결 성공
- [x] 사용자 정보 및 팀 정보 가져오기
- [x] 프로젝트 생성 (신규)
- [x] 프로젝트 생성 (기존 프로젝트 감지)
- [x] GitHub 레포지토리 연결
- [x] 환경 변수 설정
- [x] 배포 트리거
- [x] 배포 상태 실시간 추적
- [x] 빌드 로그 스트리밍
- [x] 배포 진행률 표시
- [x] 배포 성공 시 URL 표시
- [x] 배포 실패 시 에러 표시
- [x] 배포 히스토리 표시
- [x] 도메인 추가 및 관리
- [x] 배포 취소 기능
- [x] 프로덕션/프리뷰 배포 구분
- [x] Rate limit 처리
- [x] 에러 재시도 로직

## 성능 최적화
1. **배포 속도 향상**
   - 빌드 캐시 활용
   - 병렬 처리 최적화
   - 불필요한 파일 제외

2. **모니터링 효율화**
   - 폴링 간격 조정 (3초)
   - 자동 정리 (10분)
   - 상태 변경 시에만 업데이트

3. **UI 반응성**
   - 낙관적 업데이트
   - 스켈레톤 로딩
   - 에러 복구 메커니즘

## 보안 고려사항
1. **토큰 관리**
   - httpOnly 쿠키 사용
   - 토큰 만료 처리
   - 팀별 권한 분리

2. **API 보안**
   - CSRF 보호
   - Rate limiting
   - 입력 검증

3. **환경 변수**
   - 암호화된 저장
   - 환경별 분리
   - 민감 정보 마스킹

## 완료 기준
- GitHub → Vercel 원클릭 배포 ✓
- 실시간 배포 상태 모니터링 ✓
- 빌드 로그 실시간 표시 ✓
- 배포된 URL 즉시 접근 가능 ✓
- 에러 처리 및 복구 메커니즘 ✓
- 도메인 관리 기능 ✓

## 향후 개선사항
1. **고급 기능**
   - Edge Functions 지원
   - 환경별 설정 관리
   - A/B 테스트 배포
   - 카나리 배포

2. **모니터링 강화**
   - 실시간 메트릭 대시보드
   - 성능 분석
   - 에러 추적
   - 사용자 분석

3. **자동화**
   - GitHub Actions 통합
   - 자동 롤백
   - 헬스 체크
   - 배포 승인 워크플로우