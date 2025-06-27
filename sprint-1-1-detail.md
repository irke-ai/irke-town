# Sprint 1.1: 프로젝트 초기화 및 기본 UI - 상세 구현 가이드

## 🎯 Sprint 목표
Next.js 14 프로젝트를 생성하고, TypeScript + Tailwind CSS를 설정하며, IRKE TOWN의 기본 UI 레이아웃을 구축합니다.

## 🛠️ 기술 스택 상세
- **Next.js 14**: App Router 아키텍처
- **TypeScript 5.x**: 엄격한 타입 안전성
- **Tailwind CSS 3.x**: Utility-first CSS
- **Zustand 5.x**: 전역 상태 관리
- **ESLint + Prettier**: 코드 품질 관리

## 📋 Task 1: 프로젝트 설정

### 1.1 프로젝트 생성
```bash
# Next.js 14 프로젝트 생성 (대화형 설정)
npx create-next-app@latest irke-town --typescript --tailwind --eslint --app

# 프로젝트 디렉토리 이동
cd irke-town

# 추가 의존성 설치
npm install zustand @types/node
```

### 1.2 프로젝트 구조 설정
```
irke-town/
├── src/
│   ├── app/                    # App Router 페이지
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   ├── page.tsx           # 홈페이지
│   │   ├── globals.css        # 전역 스타일
│   │   └── town/
│   │       ├── new/
│   │       │   └── page.tsx   # 새 타운 생성
│   │       └── [id]/
│   │           └── page.tsx   # 타운 에디터
│   ├── components/            # React 컴포넌트
│   │   ├── layout/           # 레이아웃 컴포넌트
│   │   ├── ui/              # UI 컴포넌트
│   │   └── canvas/          # 캔버스 컴포넌트 (Sprint 1.2)
│   ├── stores/              # Zustand 스토어
│   ├── lib/                # 유틸리티 함수
│   └── types/             # TypeScript 타입 정의
├── public/                # 정적 자산
├── .eslintrc.json        # ESLint 설정
├── .prettierrc          # Prettier 설정
├── next.config.js       # Next.js 설정
├── tailwind.config.ts   # Tailwind 설정
└── tsconfig.json       # TypeScript 설정
```

### 1.3 TypeScript 설정 (tsconfig.json)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/types/*": ["./src/types/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 1.4 Tailwind CSS 설정 (tailwind.config.ts)
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // IRKE TOWN 색상 팔레트
        primary: {
          DEFAULT: '#3B82F6',
          50: '#EBF2FF',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        secondary: {
          DEFAULT: '#10B981',
          500: '#10B981',
          600: '#059669',
        },
        accent: {
          DEFAULT: '#F59E0B',
          500: '#F59E0B',
          600: '#D97706',
        },
        // 연결 타입별 색상
        road: '#6B7280',
        water: '#3B82F6',
        sewer: '#92400E',
        power: '#FCD34D',
        communication: '#10B981',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      zIndex: {
        'modal': '1000',
        'dropdown': '900',
        'header': '800',
        'canvas': '10',
      }
    },
  },
  plugins: [],
}
export default config
```

### 1.5 ESLint 설정 (.eslintrc.json)
```json
{
  "extends": [
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "react/display-name": "off"
  }
}
```

### 1.6 Prettier 설정 (.prettierrc)
```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

## 📋 Task 2: 기본 레이아웃 구현

### 2.1 루트 레이아웃 (src/app/layout.tsx)
```typescript
// irke://component/layout/root/base
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IRKE TOWN - Build Your App Like a Game',
  description: 'Transform web app development into a town building game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        {children}
      </body>
    </html>
  )
}
```

### 2.2 전역 스타일 (src/app/globals.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* 스크롤바 스타일링 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-gray-100;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-gray-400 rounded;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-500;
  }
}

@layer components {
  /* 재사용 가능한 컴포넌트 클래스 */
  .btn-primary {
    @apply px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors;
  }
  
  .panel {
    @apply bg-white rounded-lg shadow-sm border border-gray-200;
  }
}
```

### 2.3 헤더 컴포넌트 (src/components/layout/Header.tsx)
```typescript
// irke://component/layout/header/base
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  const isEditor = pathname.includes('/town/')

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 z-header relative">
      <div className="flex items-center space-x-4 flex-1">
        {/* 로고 */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="text-white font-bold">IT</span>
          </div>
          <span className="font-semibold text-lg">IRKE TOWN</span>
        </Link>

        {/* 프로젝트 이름 (에디터에서만 표시) */}
        {isEditor && (
          <div className="flex items-center space-x-2 ml-8">
            <span className="text-gray-500">/</span>
            <span className="font-medium">My Awesome Project</span>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      {isEditor && (
        <div className="flex items-center space-x-3">
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">
            저장
          </button>
          <button className="btn-primary text-sm">
            배포
          </button>
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
      )}
    </header>
  )
}
```

### 2.4 3단 레이아웃 컴포넌트 (src/components/layout/EditorLayout.tsx)
```typescript
// irke://component/layout/editor/three-column
'use client'

import { ReactNode } from 'react'

interface EditorLayoutProps {
  toolPanel: ReactNode
  canvas: ReactNode
  propertyPanel: ReactNode
}

export default function EditorLayout({ toolPanel, canvas, propertyPanel }: EditorLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* 도구 패널 */}
      <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        {toolPanel}
      </aside>

      {/* 캔버스 영역 */}
      <main className="flex-1 relative overflow-hidden">
        {canvas}
      </main>

      {/* 속성 패널 */}
      <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        {propertyPanel}
      </aside>
    </div>
  )
}
```

### 2.5 도구 패널 컴포넌트 (src/components/layout/ToolPanel.tsx)
```typescript
// irke://component/ui/tool-panel/base
'use client'

import { useState } from 'react'

type ToolCategory = 'buildings' | 'connections' | 'view'

export default function ToolPanel() {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('buildings')

  return (
    <div className="p-4">
      <h2 className="font-semibold mb-4">도구</h2>
      
      {/* 카테고리 탭 */}
      <div className="flex space-x-1 mb-4">
        <button
          className={`px-3 py-1.5 text-sm rounded ${
            activeCategory === 'buildings' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}
          onClick={() => setActiveCategory('buildings')}
        >
          건물
        </button>
        <button
          className={`px-3 py-1.5 text-sm rounded ${
            activeCategory === 'connections' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}
          onClick={() => setActiveCategory('connections')}
        >
          연결
        </button>
        <button
          className={`px-3 py-1.5 text-sm rounded ${
            activeCategory === 'view' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}
          onClick={() => setActiveCategory('view')}
        >
          뷰
        </button>
      </div>

      {/* 도구 목록 */}
      {activeCategory === 'buildings' && (
        <div className="space-y-2">
          <div className="p-3 border border-gray-200 rounded cursor-pointer hover:border-primary">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-xl">🏛️</span>
              </div>
              <div>
                <p className="font-medium">API Gateway</p>
                <p className="text-xs text-gray-500">2x3</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 border border-gray-200 rounded cursor-pointer hover:border-primary">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                <span className="text-xl">🗄️</span>
              </div>
              <div>
                <p className="font-medium">Database</p>
                <p className="text-xs text-gray-500">3x3</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 border border-gray-200 rounded cursor-pointer hover:border-primary">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                <span className="text-xl">📱</span>
              </div>
              <div>
                <p className="font-medium">Frontend Page</p>
                <p className="text-xs text-gray-500">2x2</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 2.6 속성 패널 컴포넌트 (src/components/layout/PropertyPanel.tsx)
```typescript
// irke://component/ui/property-panel/base
'use client'

export default function PropertyPanel() {
  // 추후 선택된 건물 정보를 표시
  const selectedBuilding = null

  return (
    <div className="p-4">
      <h2 className="font-semibold mb-4">속성</h2>
      
      {selectedBuilding ? (
        <div>
          {/* 선택된 건물 정보 표시 */}
        </div>
      ) : (
        <div className="text-center text-gray-400 mt-8">
          <p>건물을 선택하세요</p>
        </div>
      )}
    </div>
  )
}
```

## 📋 Task 3: 라우팅 설정

### 3.1 홈페이지 (src/app/page.tsx)
```typescript
// irke://stack/framework/nextjs/14/app-router
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            IRKE TOWN
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            웹 앱 개발을 타운 빌딩 게임으로 변환하는 혁신적인 플랫폼
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/town/new" className="btn-primary">
              새 타운 만들기
            </Link>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              데모 보기
            </button>
          </div>
        </div>
        
        {/* 특징 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎮</span>
            </div>
            <h3 className="font-semibold mb-2">게임화된 개발</h3>
            <p className="text-gray-600">건물을 배치하고 연결하여 앱을 만드세요</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="font-semibold mb-2">AI 자동화</h3>
            <p className="text-gray-600">AI가 자동으로 코드를 생성합니다</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="font-semibold mb-2">즉시 배포</h3>
            <p className="text-gray-600">완성된 앱을 바로 배포하세요</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3.2 새 타운 생성 페이지 (src/app/town/new/page.tsx)
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewTownPage() {
  const router = useRouter()
  const [projectName, setProjectName] = useState('')

  const handleCreate = () => {
    if (projectName.trim()) {
      // TODO: 실제로는 프로젝트 생성 후 ID를 받아야 함
      const projectId = 'temp-id-123'
      router.push(`/town/${projectId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">새 타운 만들기</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              프로젝트 이름
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="My Awesome App"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명 (선택)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="프로젝트에 대한 간단한 설명..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              disabled={!projectName.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              타운 만들기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3.3 타운 에디터 페이지 (src/app/town/[id]/page.tsx)
```typescript
import Header from '@/components/layout/Header'
import EditorLayout from '@/components/layout/EditorLayout'
import ToolPanel from '@/components/layout/ToolPanel'
import PropertyPanel from '@/components/layout/PropertyPanel'

export default function TownEditorPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <EditorLayout
        toolPanel={<ToolPanel />}
        canvas={
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <p className="text-gray-400">Canvas (Sprint 1.2에서 구현)</p>
          </div>
        }
        propertyPanel={<PropertyPanel />}
      />
    </div>
  )
}
```

## 📋 Task 4: 기본 상태 관리

### 4.1 타입 정의 (src/types/index.ts)
```typescript
// irke://stack/typescript/types/base
export interface Project {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface Building {
  id: string
  type: 'api' | 'database' | 'frontend'
  name: string
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  status: 'healthy' | 'warning' | 'error'
  config?: Record<string, any>
}

export interface Connection {
  id: string
  fromBuildingId: string
  toBuildingId: string
  type: 'road' // MVP는 도로만
  path: Array<{ x: number; y: number }>
}

export interface TownState {
  id: string
  projectId: string
  buildings: Building[]
  connections: Connection[]
  grid: {
    width: number
    height: number
  }
}
```

### 4.2 프로젝트 스토어 (src/stores/projectStore.ts)
```typescript
// irke://stack/state/zustand/store
import { create } from 'zustand'
import { Project } from '@/types'

interface ProjectStore {
  currentProject: Project | null
  setCurrentProject: (project: Project) => void
  clearProject: () => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  clearProject: () => set({ currentProject: null }),
}))
```

### 4.3 UI 스토어 (src/stores/uiStore.ts)
```typescript
// irke://stack/state/zustand/ui
import { create } from 'zustand'

interface UIStore {
  // 도구 패널
  selectedTool: 'select' | 'building' | 'connection' | null
  setSelectedTool: (tool: UIStore['selectedTool']) => void
  
  // 선택된 건물
  selectedBuildingId: string | null
  setSelectedBuildingId: (id: string | null) => void
  
  // 캔버스 상태
  zoom: number
  setZoom: (zoom: number) => void
  
  // 패널 표시 상태
  showToolPanel: boolean
  showPropertyPanel: boolean
  toggleToolPanel: () => void
  togglePropertyPanel: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  selectedTool: null,
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  
  selectedBuildingId: null,
  setSelectedBuildingId: (id) => set({ selectedBuildingId: id }),
  
  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),
  
  showToolPanel: true,
  showPropertyPanel: true,
  toggleToolPanel: () => set((state) => ({ showToolPanel: !state.showToolPanel })),
  togglePropertyPanel: () => set((state) => ({ showPropertyPanel: !state.showPropertyPanel })),
}))
```

## 🧪 테스트 체크리스트

### 개발 서버 실행
```bash
npm run dev
# http://localhost:3000 접속
```

### 확인 사항
- [ ] 홈페이지 정상 표시
- [ ] "새 타운 만들기" 버튼 작동
- [ ] 새 타운 생성 폼 작동
- [ ] 타운 에디터 페이지 접근 가능
- [ ] 3단 레이아웃 정상 표시
- [ ] 반응형 디자인 확인
- [ ] TypeScript 타입 에러 없음
- [ ] ESLint 경고 없음

## 📝 Sprint 1.2 준비사항

### 전달할 인터페이스
```typescript
// Canvas 통합을 위한 인터페이스
export interface CanvasConfig {
  gridSize: { width: 50, height: 50 }
  cellSize: { width: 64, height: 32 }
  viewAngle: 45 // 고정
}

// Canvas 컴포넌트가 구현해야 할 props
export interface CanvasProps {
  onCellClick: (x: number, y: number) => void
  onCellHover: (x: number, y: number) => void
  zoom: number
}
```

### 필요한 추가 패키지
```bash
# Sprint 1.2에서 설치할 패키지
npm install pixi.js @pixi/react
```

## 🎯 완료 기준
- Next.js 14 프로젝트 생성 완료
- TypeScript + Tailwind CSS 설정 완료
- 기본 UI 레이아웃 구현 완료
- 라우팅 시스템 작동
- Zustand 스토어 설정 완료
- 개발 환경에서 에러 없이 실행

---

*이 가이드를 따라 Sprint 1.1을 구현하세요. 각 코드 블록은 복사하여 바로 사용할 수 있도록 작성되었습니다.*