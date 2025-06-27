# Sprint 3.1: GitHub 통합 - 상세 구현 가이드

## 🎯 Sprint 목표
GitHub OAuth 인증을 구현하고, 타운 상태를 GitHub 레포지토리로 동기화하는 시스템을 구축합니다.

## 🛠️ 핵심 구현 사항
- GitHub OAuth 2.0 인증
- 레포지토리 생성 및 관리
- 타운 → 코드 변환 시스템
- 파일 구조 매핑
- 커밋 및 푸시 자동화

## 📋 Task 1: GitHub OAuth 인증

### 1.1 환경 변수 설정 (.env.local)
```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github/callback

# GitHub API
GITHUB_APP_NAME=IRKE_TOWN
GITHUB_API_VERSION=2022-11-28

# Next Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key_here
```

### 1.2 NextAuth 설정 (src/app/api/auth/[...nextauth]/route.ts)
```typescript
// irke://stack/auth/github/nextauth
import NextAuth, { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { JWT } from 'next-auth/jwt'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'repo user:email workflow'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 첫 로그인 시 GitHub 토큰 저장
      if (account && profile) {
        token.accessToken = account.access_token
        token.githubId = profile.id
        token.githubUsername = profile.login
      }
      return token
    },
    
    async session({ session, token }) {
      // 세션에 GitHub 정보 추가
      session.accessToken = token.accessToken
      session.user.githubId = token.githubId
      session.user.githubUsername = token.githubUsername
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### 1.3 세션 타입 확장 (src/types/next-auth.d.ts)
```typescript
// irke://stack/typescript/types/nextauth
import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      githubId?: string
      githubUsername?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    githubId?: string
    githubUsername?: string
  }
}
```

### 1.4 인증 버튼 컴포넌트 (src/components/auth/GitHubAuthButton.tsx)
```typescript
// irke://component/auth/github/button
'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

export default function GitHubAuthButton() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('github', { callbackUrl: '/town/new' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="px-4 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="h-5 w-20 bg-gray-300 rounded"></div>
      </div>
    )
  }

  if (session) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <img
            src={session.user?.image || ''}
            alt={session.user?.name || ''}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-sm font-medium">
            {session.user?.githubUsername || session.user?.name}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          로그아웃
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 
                 disabled:opacity-50 flex items-center space-x-2"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
      <span>GitHub으로 로그인</span>
    </button>
  )
}
```

## 📋 Task 2: GitHub API 클라이언트

### 2.1 GitHub API 서비스 (src/services/github/client.ts)
```typescript
// irke://stack/integration/github/client
import { Octokit } from '@octokit/rest'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export interface Repository {
  id: number
  name: string
  full_name: string
  html_url: string
  clone_url: string
  default_branch: string
  private: boolean
}

export interface FileContent {
  path: string
  content: string
  encoding?: 'utf-8' | 'base64'
}

export class GitHubClient {
  private octokit: Octokit
  private username: string

  constructor(accessToken: string, username: string) {
    this.octokit = new Octokit({
      auth: accessToken,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    this.username = username
  }

  // 정적 팩토리 메서드
  static async createFromSession() {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken || !session?.user?.githubUsername) {
      throw new Error('GitHub authentication required')
    }

    return new GitHubClient(session.accessToken, session.user.githubUsername)
  }

  // 레포지토리 생성
  async createRepository(name: string, description?: string, isPrivate = false): Promise<Repository> {
    try {
      const { data } = await this.octokit.repos.createForAuthenticatedUser({
        name,
        description: description || `Created by IRKE TOWN`,
        private: isPrivate,
        auto_init: true, // README 자동 생성
        gitignore_template: 'Node',
        license_template: 'mit',
      })

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        html_url: data.html_url,
        clone_url: data.clone_url,
        default_branch: data.default_branch || 'main',
        private: data.private,
      }
    } catch (error: any) {
      if (error.status === 422) {
        throw new Error(`Repository "${name}" already exists`)
      }
      throw error
    }
  }

  // 레포지토리 목록 조회
  async listRepositories(): Promise<Repository[]> {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    })

    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      default_branch: repo.default_branch || 'main',
      private: repo.private,
    }))
  }

  // 레포지토리 조회
  async getRepository(owner: string, repo: string): Promise<Repository> {
    const { data } = await this.octokit.repos.get({ owner, repo })

    return {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      html_url: data.html_url,
      clone_url: data.clone_url,
      default_branch: data.default_branch || 'main',
      private: data.private,
    }
  }

  // 파일 생성/업데이트
  async createOrUpdateFile(
    repo: string,
    path: string,
    content: string,
    message: string,
    branch = 'main'
  ): Promise<void> {
    const encodedContent = Buffer.from(content).toString('base64')

    try {
      // 파일이 이미 존재하는지 확인
      const { data: existingFile } = await this.octokit.repos.getContent({
        owner: this.username,
        repo,
        path,
        ref: branch,
      }).catch(() => ({ data: null }))

      if (existingFile && 'sha' in existingFile) {
        // 파일 업데이트
        await this.octokit.repos.createOrUpdateFileContents({
          owner: this.username,
          repo,
          path,
          message,
          content: encodedContent,
          sha: existingFile.sha,
          branch,
        })
      } else {
        // 새 파일 생성
        await this.octokit.repos.createOrUpdateFileContents({
          owner: this.username,
          repo,
          path,
          message,
          content: encodedContent,
          branch,
        })
      }
    } catch (error: any) {
      console.error(`Failed to create/update file ${path}:`, error)
      throw error
    }
  }

  // 여러 파일 일괄 커밋
  async commitFiles(
    repo: string,
    files: FileContent[],
    message: string,
    branch = 'main'
  ): Promise<void> {
    // 현재 커밋 SHA 가져오기
    const { data: ref } = await this.octokit.git.getRef({
      owner: this.username,
      repo,
      ref: `heads/${branch}`,
    })
    const latestCommitSha = ref.object.sha

    // 현재 트리 가져오기
    const { data: baseTree } = await this.octokit.git.getCommit({
      owner: this.username,
      repo,
      commit_sha: latestCommitSha,
    })

    // 새 트리 생성
    const tree = await Promise.all(
      files.map(async (file) => ({
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        content: file.content,
      }))
    )

    const { data: newTree } = await this.octokit.git.createTree({
      owner: this.username,
      repo,
      tree,
      base_tree: baseTree.tree.sha,
    })

    // 새 커밋 생성
    const { data: newCommit } = await this.octokit.git.createCommit({
      owner: this.username,
      repo,
      message,
      tree: newTree.sha,
      parents: [latestCommitSha],
    })

    // 브랜치 업데이트
    await this.octokit.git.updateRef({
      owner: this.username,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    })
  }

  // 브랜치 생성
  async createBranch(repo: string, branchName: string, fromBranch = 'main'): Promise<void> {
    // 기준 브랜치의 SHA 가져오기
    const { data: ref } = await this.octokit.git.getRef({
      owner: this.username,
      repo,
      ref: `heads/${fromBranch}`,
    })

    // 새 브랜치 생성
    await this.octokit.git.createRef({
      owner: this.username,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    })
  }

  // Pull Request 생성
  async createPullRequest(
    repo: string,
    title: string,
    head: string,
    base = 'main',
    body?: string
  ): Promise<number> {
    const { data } = await this.octokit.pulls.create({
      owner: this.username,
      repo,
      title,
      head,
      base,
      body: body || 'Created by IRKE TOWN',
    })

    return data.number
  }
}
```

### 2.2 GitHub 동기화 매니저 (src/services/github/sync.ts)
```typescript
// irke://stack/integration/github/sync
import { Building, Connection } from '@/types'
import { GeneratedCode, CodeFile } from '@/services/ai/types'
import { GitHubClient, FileContent } from './client'

export interface TownState {
  buildings: Building[]
  connections: Connection[]
}

export interface SyncOptions {
  repo: string
  branch?: string
  message?: string
}

export class GitHubSyncManager {
  private client: GitHubClient

  constructor(client: GitHubClient) {
    this.client = client
  }

  // 타운 상태를 GitHub에 동기화
  async syncTownToGitHub(
    townState: TownState,
    generatedCodes: Map<string, GeneratedCode>,
    options: SyncOptions
  ): Promise<void> {
    const files: FileContent[] = []

    // 1. 타운 설정 파일 생성
    files.push(this.generateTownConfig(townState))

    // 2. README 파일 생성
    files.push(this.generateReadme(townState))

    // 3. 생성된 코드 파일들 추가
    generatedCodes.forEach((code, buildingId) => {
      code.files.forEach(file => {
        files.push({
          path: file.path,
          content: file.content,
        })
      })
    })

    // 4. package.json 생성
    files.push(this.generatePackageJson(generatedCodes))

    // 5. 환경 설정 파일
    files.push(this.generateEnvExample())

    // 6. GitHub Actions 워크플로우
    files.push(this.generateGitHubActions())

    // 7. 파일들을 GitHub에 커밋
    const message = options.message || `Update from IRKE TOWN - ${new Date().toISOString()}`
    await this.client.commitFiles(options.repo, files, message, options.branch)
  }

  // 타운 설정 파일 생성
  private generateTownConfig(townState: TownState): FileContent {
    const config = {
      version: '1.0',
      buildings: townState.buildings.map(b => ({
        id: b.id,
        type: b.type,
        name: b.name,
        position: b.position,
      })),
      connections: townState.connections.map(c => ({
        id: c.id,
        from: c.fromBuildingId,
        to: c.toBuildingId,
        type: c.type,
      })),
      metadata: {
        createdAt: new Date().toISOString(),
        generator: 'IRKE TOWN',
      },
    }

    return {
      path: '.irke/town.json',
      content: JSON.stringify(config, null, 2),
    }
  }

  // README 생성
  private generateReadme(townState: TownState): FileContent {
    const buildingCounts = townState.buildings.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const content = `# ${townState.buildings[0]?.name || 'IRKE TOWN Project'}

Generated by [IRKE TOWN](https://irke.town) - Build apps like playing a game! 🎮

## 🏗️ Architecture

This project contains:
${Object.entries(buildingCounts).map(([type, count]) => 
  `- ${count} ${type} building${count > 1 ? 's' : ''}`
).join('\n')}
- ${townState.connections.length} connections

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
\`\`\`bash
npm install
\`\`\`

### Development
\`\`\`bash
npm run dev
\`\`\`

### Build
\`\`\`bash
npm run build
\`\`\`

## 📁 Project Structure

\`\`\`
.
├── src/
│   ├── app/          # Next.js App Router
│   ├── components/   # React components
│   ├── lib/         # Utilities
│   └── types/       # TypeScript types
├── prisma/          # Database schema
├── public/          # Static assets
└── tests/           # Test files
\`\`\`

## 🏢 Buildings

${townState.buildings.map(b => `### ${b.name}
- Type: ${b.type}
- Position: (${b.position.x}, ${b.position.y})
`).join('\n')}

## 🔗 Connections

${townState.connections.map((c, i) => {
  const from = townState.buildings.find(b => b.id === c.fromBuildingId)
  const to = townState.buildings.find(b => b.id === c.toBuildingId)
  return `${i + 1}. ${from?.name} → ${to?.name}`
}).join('\n')}

---

Created with ❤️ by IRKE TOWN
`

    return {
      path: 'README.md',
      content,
    }
  }

  // package.json 생성
  private generatePackageJson(generatedCodes: Map<string, GeneratedCode>): FileContent {
    // 모든 의존성 수집
    const dependencies: Set<string> = new Set()
    const devDependencies: Set<string> = new Set([
      '@types/node',
      '@types/react',
      'typescript',
      'eslint',
      'prettier',
    ])

    generatedCodes.forEach(code => {
      code.dependencies?.forEach(dep => {
        if (dep.startsWith('@types/')) {
          devDependencies.add(dep)
        } else {
          dependencies.add(dep)
        }
      })
    })

    // 기본 의존성 추가
    dependencies.add('next')
    dependencies.add('react')
    dependencies.add('react-dom')

    const packageJson = {
      name: 'irke-town-project',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        'db:push': 'prisma db push',
        'db:generate': 'prisma generate',
      },
      dependencies: Object.fromEntries(
        Array.from(dependencies).map(dep => [dep, 'latest'])
      ),
      devDependencies: Object.fromEntries(
        Array.from(devDependencies).map(dep => [dep, 'latest'])
      ),
    }

    return {
      path: 'package.json',
      content: JSON.stringify(packageJson, null, 2),
    }
  }

  // 환경 변수 예시 생성
  private generateEnvExample(): FileContent {
    return {
      path: '.env.example',
      content: `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# GitHub OAuth (if needed)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# API Keys
OPENAI_API_KEY=
STRIPE_SECRET_KEY=

# Public Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:3000/api
`,
    }
  }

  // GitHub Actions 워크플로우 생성
  private generateGitHubActions(): FileContent {
    return {
      path: '.github/workflows/ci.yml',
      content: `name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run type check
      run: npm run type-check || echo "No type-check script"
    
    - name: Run tests
      run: npm test || echo "No tests yet"
    
    - name: Build project
      run: npm run build
`,
    }
  }

  // 커밋 메시지 생성
  generateCommitMessage(changes: {
    added: string[]
    modified: string[]
    deleted: string[]
  }): string {
    const parts: string[] = []

    if (changes.added.length > 0) {
      parts.push(`Added ${changes.added.length} files`)
    }
    if (changes.modified.length > 0) {
      parts.push(`Modified ${changes.modified.length} files`)
    }
    if (changes.deleted.length > 0) {
      parts.push(`Deleted ${changes.deleted.length} files`)
    }

    const summary = parts.join(', ')
    const timestamp = new Date().toLocaleString()

    return `[IRKE TOWN] ${summary} - ${timestamp}`
  }
}
```

## 📋 Task 3: UI 통합

### 3.1 GitHub 동기화 버튼 (src/components/github/SyncButton.tsx)
```typescript
// irke://component/github/sync/button
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTownStore } from '@/stores/townStore'
import { useAIStore } from '@/stores/aiStore'
import GitHubRepoModal from './GitHubRepoModal'

export default function GitHubSyncButton() {
  const { data: session } = useSession()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  
  const buildings = useTownStore((state) => state.buildings)
  const connections = useTownStore((state) => state.connections)

  if (!session) {
    return null
  }

  const handleSync = async (repoName: string) => {
    setIsSyncing(true)
    
    try {
      // 생성된 코드 수집
      const generatedCodes = new Map()
      // TODO: AI 스토어에서 생성된 코드 가져오기

      const response = await fetch('/api/github/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          townState: { buildings, connections },
          generatedCodes: Array.from(generatedCodes.entries()),
          repoName,
        }),
      })

      if (!response.ok) {
        throw new Error('동기화 실패')
      }

      const result = await response.json()
      setLastSync(new Date())
      setIsModalOpen(false)
      
      // 성공 알림
      alert(`GitHub 동기화 완료! 레포지토리: ${result.repository.html_url}`)
    } catch (error) {
      console.error('Sync error:', error)
      alert('동기화 중 오류가 발생했습니다.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={isSyncing || buildings.length === 0}
        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 
                   disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <span>{isSyncing ? '동기화 중...' : 'GitHub 동기화'}</span>
      </button>
      
      {lastSync && (
        <p className="text-xs text-gray-500 mt-1">
          마지막 동기화: {lastSync.toLocaleTimeString()}
        </p>
      )}

      <GitHubRepoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSync={handleSync}
        isSyncing={isSyncing}
      />
    </>
  )
}
```

### 3.2 레포지토리 선택 모달 (src/components/github/GitHubRepoModal.tsx)
```typescript
// irke://component/github/repo/modal
'use client'

import { useState, useEffect } from 'react'
import { Repository } from '@/services/github/client'

interface GitHubRepoModalProps {
  isOpen: boolean
  onClose: () => void
  onSync: (repoName: string) => void
  isSyncing: boolean
}

export default function GitHubRepoModal({
  isOpen,
  onClose,
  onSync,
  isSyncing,
}: GitHubRepoModalProps) {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<string>('')
  const [createNew, setCreateNew] = useState(false)
  const [newRepoName, setNewRepoName] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchRepositories()
    }
  }, [isOpen])

  const fetchRepositories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/github/repos')
      const data = await response.json()
      setRepositories(data.repositories)
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (createNew) {
      if (!newRepoName.trim()) return
      
      // 새 레포지토리 생성
      try {
        const response = await fetch('/api/github/repos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newRepoName,
            isPrivate,
          }),
        })
        
        if (!response.ok) throw new Error('레포지토리 생성 실패')
        
        const { repository } = await response.json()
        onSync(repository.name)
      } catch (error) {
        alert('레포지토리 생성 중 오류가 발생했습니다.')
      }
    } else {
      if (!selectedRepo) return
      onSync(selectedRepo)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">GitHub 레포지토리 선택</h2>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={!createNew}
                onChange={() => setCreateNew(false)}
                className="text-primary"
              />
              <span>기존 레포지토리 사용</span>
            </label>
            
            {!createNew && (
              <div className="mt-2">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : (
                  <select
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">레포지토리 선택...</option>
                    {repositories.map((repo) => (
                      <option key={repo.id} value={repo.name}>
                        {repo.name} {repo.private && '(Private)'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={createNew}
                onChange={() => setCreateNew(true)}
                className="text-primary"
              />
              <span>새 레포지토리 생성</span>
            </label>
            
            {createNew && (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="레포지토리 이름"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="text-primary"
                  />
                  <span className="text-sm">비공개 레포지토리</span>
                </label>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSyncing || (!createNew && !selectedRepo) || (createNew && !newRepoName.trim())}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
          >
            {isSyncing ? '동기화 중...' : '동기화'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

## 📋 Task 4: API 엔드포인트

### 4.1 GitHub 동기화 API (src/app/api/github/sync/route.ts)
```typescript
// irke://stack/api/github/sync
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { GitHubClient } from '@/services/github/client'
import { GitHubSyncManager } from '@/services/github/sync'

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'GitHub authentication required' },
        { status: 401 }
      )
    }

    // 요청 데이터 파싱
    const { townState, generatedCodes, repoName } = await request.json()

    // GitHub 클라이언트 생성
    const client = await GitHubClient.createFromSession()
    const syncManager = new GitHubSyncManager(client)

    // 레포지토리 확인/생성
    let repository
    try {
      repository = await client.getRepository(session.user.githubUsername!, repoName)
    } catch (error) {
      // 레포지토리가 없으면 생성
      repository = await client.createRepository(repoName)
    }

    // 코드 맵 변환
    const codeMap = new Map(generatedCodes)

    // 동기화 실행
    await syncManager.syncTownToGitHub(townState, codeMap, {
      repo: repository.name,
      branch: repository.default_branch,
    })

    return NextResponse.json({
      success: true,
      repository: {
        name: repository.name,
        html_url: repository.html_url,
      },
    })
  } catch (error: any) {
    console.error('GitHub sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    )
  }
}
```

### 4.2 레포지토리 목록 API (src/app/api/github/repos/route.ts)
```typescript
// irke://stack/api/github/repos
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { GitHubClient } from '@/services/github/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'GitHub authentication required' },
        { status: 401 }
      )
    }

    const client = await GitHubClient.createFromSession()
    const repositories = await client.listRepositories()

    return NextResponse.json({ repositories })
  } catch (error: any) {
    console.error('Failed to fetch repositories:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'GitHub authentication required' },
        { status: 401 }
      )
    }

    const { name, isPrivate } = await request.json()

    const client = await GitHubClient.createFromSession()
    const repository = await client.createRepository(name, undefined, isPrivate)

    return NextResponse.json({ repository })
  } catch (error: any) {
    console.error('Failed to create repository:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create repository' },
      { status: 500 }
    )
  }
}
```

## 🧪 테스트 체크리스트

### 인증 테스트
- [ ] GitHub OAuth 로그인 성공
- [ ] 세션 유지 및 토큰 저장
- [ ] 로그아웃 기능
- [ ] 권한 스코프 확인

### 동기화 테스트
- [ ] 레포지토리 생성
- [ ] 파일 커밋 성공
- [ ] 타운 설정 저장
- [ ] README 자동 생성
- [ ] package.json 의존성 정확성

### UI 테스트
- [ ] 동기화 버튼 표시
- [ ] 레포지토리 선택 모달
- [ ] 로딩 상태 표시
- [ ] 에러 처리

## 📝 Sprint 3.2 준비사항

### 전달할 인터페이스
```typescript
// Vercel 배포를 위한 인터페이스
export interface VercelDeployment {
  id: string
  url: string
  state: 'BUILDING' | 'READY' | 'ERROR'
  createdAt: Date
}

export interface DeploymentManager {
  deployFromGitHub(repoUrl: string): Promise<VercelDeployment>
  getDeploymentStatus(id: string): Promise<VercelDeployment>
  cancelDeployment(id: string): Promise<void>
}
```

## 🎯 완료 기준
- GitHub OAuth 인증 구현
- 레포지토리 생성 및 관리
- 타운 → 코드 동기화
- 파일 구조 자동 생성
- UI 통합 완료

---

*Sprint 3.1이 완료되면 사용자는 타운을 GitHub 레포지토리로 내보낼 수 있습니다. 생성된 코드는 즉시 실행 가능한 프로젝트입니다.*