# Sprint 3.2: 레포지토리 관리 (상세 버전)

## 개요
GitHub 레포지토리 생성, 파일 관리, 코드 커밋을 처리하는 시스템을 구현합니다. Octokit.js는 GitHub의 REST API와 GraphQL API에 요청을 보낼 수 있는 공식 SDK로, 모든 GitHub 플랫폼 API 기능을 포괄합니다.

## 주요 작업

### Task 1: GitHub 레포지토리 생성

#### 1.1 Octokit 초기 설정
```typescript
// src/services/github/client.ts
/**
 * irke://stack/integration/github/client
 * GitHub API 클라이언트 설정
 */
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { retry } from '@octokit/plugin-retry';
import { throttling } from '@octokit/plugin-throttling';

// 플러그인을 적용한 Octokit 클래스 생성
const MyOctokit = Octokit.plugin(retry, throttling);

export function createGitHubClient(accessToken: string) {
  return new MyOctokit({
    auth: accessToken,
    userAgent: 'irke-town/1.0',
    timeZone: 'Asia/Seoul',
    baseUrl: 'https://api.github.com',
    log: {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    },
    throttle: {
      onRateLimit: (retryAfter, options, octokit, retryCount) => {
        octokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );
        if (retryCount < 1) {
          octokit.log.info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onSecondaryRateLimit: (retryAfter, options, octokit) => {
        octokit.log.warn(
          `SecondaryRateLimit detected for request ${options.method} ${options.url}`
        );
      },
    },
    retry: {
      doNotRetry: ['429'],
    },
  });
}

// 타입 정의
export type GitHubClient = ReturnType<typeof createGitHubClient>;
```

#### 1.2 레포지토리 서비스 구현
```typescript
// src/services/github/repository.service.ts
/**
 * irke://stack/integration/github/repository
 * GitHub 레포지토리 관리 서비스
 */
import { GitHubClient, createGitHubClient } from './client';
import { components } from '@octokit/openapi-types';

type Repository = components['schemas']['repository'];

export class GitHubRepositoryService {
  private octokit: GitHubClient | null = null;
  private user: { login: string } | null = null;

  async initialize(accessToken: string) {
    this.octokit = createGitHubClient(accessToken);
    // 현재 사용자 정보 가져오기
    const { data } = await this.octokit.rest.users.getAuthenticated();
    this.user = { login: data.login };
  }

  async createRepository(options: {
    name: string;
    description?: string;
    isPrivate?: boolean;
    autoInit?: boolean;
    gitignoreTemplate?: string;
    licenseTemplate?: string;
  }) {
    if (!this.octokit) throw new Error('GitHub not initialized');

    const {
      name,
      description,
      isPrivate = false,
      autoInit = true,
      gitignoreTemplate = 'Node',
      licenseTemplate = 'mit',
    } = options;

    try {
      const { data } = await this.octokit.rest.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: autoInit,
        gitignore_template: gitignoreTemplate,
        license_template: licenseTemplate,
        has_issues: true,
        has_projects: false,
        has_wiki: false,
        has_discussions: false,
        allow_squash_merge: true,
        allow_merge_commit: true,
        allow_rebase_merge: true,
        delete_branch_on_merge: true,
      });

      return this.mapRepository(data);
    } catch (error: any) {
      if (error.status === 422) {
        const validationError = error.response?.data?.errors?.[0];
        if (validationError?.message?.includes('already exists')) {
          throw new Error(`Repository '${name}' already exists`);
        }
        throw new Error(`Validation error: ${validationError?.message || 'Unknown'}`);
      }
      throw error;
    }
  }

  async getRepository(owner: string, repo: string) {
    if (!this.octokit) throw new Error('GitHub not initialized');

    try {
      const { data } = await this.octokit.rest.repos.get({ owner, repo });
      return this.mapRepository(data);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async updateRepository(owner: string, repo: string, updates: {
    name?: string;
    description?: string;
    homepage?: string;
    private?: boolean;
    has_issues?: boolean;
    default_branch?: string;
  }) {
    if (!this.octokit) throw new Error('GitHub not initialized');

    const { data } = await this.octokit.rest.repos.update({
      owner,
      repo,
      ...updates,
    });

    return this.mapRepository(data);
  }

  async deleteRepository(owner: string, repo: string) {
    if (!this.octokit) throw new Error('GitHub not initialized');

    await this.octokit.rest.repos.delete({ owner, repo });
  }

  async listRepositories(options?: {
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  }) {
    if (!this.octokit) throw new Error('GitHub not initialized');

    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      type: options?.type || 'all',
      sort: options?.sort || 'updated',
      direction: options?.direction || 'desc',
      per_page: options?.per_page || 30,
      page: options?.page || 1,
    });

    return data.map(repo => this.mapRepository(repo));
  }

  async checkCollaboratorPermission(owner: string, repo: string, username: string) {
    if (!this.octokit) throw new Error('GitHub not initialized');

    try {
      const { data } = await this.octokit.rest.repos.getCollaboratorPermissionLevel({
        owner,
        repo,
        username,
      });
      return data.permission;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  private mapRepository(repo: Repository) {
    return {
      id: repo.id,
      nodeId: repo.node_id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      owner: {
        login: repo.owner.login,
        id: repo.owner.id,
        avatar: repo.owner.avatar_url,
      },
      htmlUrl: repo.html_url,
      cloneUrl: repo.clone_url,
      sshUrl: repo.ssh_url,
      defaultBranch: repo.default_branch || 'main',
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      size: repo.size,
      language: repo.language,
      permissions: repo.permissions,
      topics: repo.topics || [],
    };
  }
}
```

### Task 2: GitHub 파일 관리

#### 2.1 파일 서비스 구현
```typescript
// src/services/github/file.service.ts
/**
 * irke://stack/integration/github/files
 * GitHub 파일 관리 서비스
 */
import { GitHubClient, createGitHubClient } from './client';
import { components } from '@octokit/openapi-types';

type FileContent = components['schemas']['content-file'];
type TreeItem = components['schemas']['git-tree']['tree'][0];

interface FileOperation {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

export class GitHubFileService {
  private octokit: GitHubClient | null = null;

  async initialize(accessToken: string) {
    this.octokit = createGitHubClient(accessToken);
  }

  async getFile(owner: string, repo: string, path: string, ref?: string) {
    if (!this.octokit) throw new Error('GitHub not initialized');

    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if (Array.isArray(data)) {
        throw new Error('Path is a directory');
      }

      if ('content' in data && data.type === 'file') {
        return {
          content: Buffer.from(data.content, 'base64').toString('utf-8'),
          sha: data.sha,
          size: data.size,
          encoding: data.encoding as 'base64',
          url: data.html_url,
          downloadUrl: data.download_url,
        };
      }
      
      throw new Error('Invalid file type');
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    options?: {
      branch?: string;
      committer?: {
        name: string;
        email: string;
      };
      author?: {
        name: string;
        email: string;
      };
    }
  ) {
    if (!this.octokit) throw new Error('GitHub not initialized');

    const branch = options?.branch || 'main';
    const encodedContent = Buffer.from(content).toString('base64');
    
    // 기존 파일 확인
    const existingFile = await this.getFile(owner, repo, path, branch);
    
    const params = {
      owner,
      repo,
      path,
      message,
      content: encodedContent,
      branch,
      committer: options?.committer || {
        name: 'IRKE TOWN',
        email: 'bot@irke.town',
      },
      author: options?.author,
      ...(existingFile && { sha: existingFile.sha }),
    };

    const { data } = await this.octokit.rest.repos.createOrUpdateFileContents(params);
    
    return {
      commit: {
        sha: data.commit.sha,
        message: data.commit.message,
        url: data.commit.html_url,
      },
      content: {
        path: data.content?.path,
        sha: data.content?.sha,
        size: data.content?.size,
        url: data.content?.html_url,
      },
    };
  }

  async createMultipleFiles(
    owner: string,
    repo: string,
    files: FileOperation[],
    message: string,
    branch = 'main'
  ) {
    if (!this.octokit) throw new Error('GitHub not initialized');

    // 현재 브랜치의 최신 커밋 가져오기
    const { data: refData } = await this.octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });

    const currentCommitSha = refData.object.sha;
    const { data: currentCommit } = await this.octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: currentCommitSha,
    });

    // 파일 블롭 생성
    const blobs = await Promise.all(
      files.map(async (file) => {
        const content = file.encoding === 'base64' 
          ? file.content 
          : Buffer.from(file.content).toString('base64');
          
        const { data } = await this.octokit!.rest.git.createBlob({
          owner,
          repo,
          content,
          encoding: 'base64',
        });
        
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: data.sha,
        };
      })
    );

    // 새 트리 생성
    const { data: tree } = await this.octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: currentCommit.tree.sha,
      tree: blobs,
    });

    // 새 커밋 생성
    const { data: newCommit } = await this.octokit.rest.git.createCommit({
      owner,
      repo,
      message,
      tree: tree.sha,
      parents: [currentCommitSha],
      committer: {
        name: 'IRKE TOWN',
        email: 'bot@irke.town',
        date: new Date().toISOString(),
      },
    });

    // 브랜치 참조 업데이트
    await this.octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });

    return {
      commit: {
        sha: newCommit.sha,
        message: newCommit.message,
        url: newCommit.html_url,
      },
      files: files.map((file, index) => ({
        path: file.path,
        sha: blobs[index].sha,
      })),
    };
  }

  async deleteFile(
    owner: string,
    repo: string,
    path: string,
    message: string,
    branch = 'main'
  ) {
    if (!this.octokit) throw new Error('GitHub not initialized');

    const file = await this.getFile(owner, repo, path, branch);
    if (!file) throw new Error('File not found');

    const { data } = await this.octokit.rest.repos.deleteFile({
      owner,
      repo,
      path,
      message,
      sha: file.sha,
      branch,
      committer: {
        name: 'IRKE TOWN',
        email: 'bot@irke.town',
      },
    });

    return {
      commit: {
        sha: data.commit.sha,
        message: data.commit.message,
        url: data.commit.html_url,
      },
    };
  }

  async getDirectory(owner: string, repo: string, path: string, ref?: string) {
    if (!this.octokit) throw new Error('GitHub not initialized');

    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if (!Array.isArray(data)) {
        throw new Error('Path is not a directory');
      }

      return data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        sha: item.sha,
        url: item.html_url,
        downloadUrl: item.download_url,
      }));
    } catch (error: any) {
      if (error.status === 404) {
        return [];
      }
      throw error;
    }
  }

  async getTree(owner: string, repo: string, branch = 'main', recursive = true) {
    if (!this.octokit) throw new Error('GitHub not initialized');

    const { data } = await this.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: recursive ? 'true' : undefined,
    });

    return data.tree.map((item: TreeItem) => ({
      path: item.path,
      mode: item.mode,
      type: item.type,
      size: item.size,
      sha: item.sha,
      url: item.url,
    }));
  }
}
```

### Task 3: 프로젝트 코드 동기화

#### 3.1 코드 생성 서비스
```typescript
// src/services/ai/code-generator.service.ts
/**
 * irke://stack/generation/project
 * 프로젝트 코드 생성 서비스
 */
import { Building, Connection } from '@/types/town';

export interface ProjectStructure {
  framework: 'nextjs' | 'react' | 'express' | 'vanilla';
  files: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  environmentVariables: string[];
}

export class ProjectCodeGeneratorService {
  async generateProjectStructure(
    buildings: Building[],
    connections: Connection[]
  ): Promise<ProjectStructure> {
    // 프레임워크 추론
    const framework = this.inferFramework(buildings);
    
    // 빌딩 타입별 코드 생성
    const files: Record<string, string> = {};
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {};
    const environmentVariables: string[] = [];

    // Next.js 기본 구조
    if (framework === 'nextjs') {
      // 기본 레이아웃
      files['src/app/layout.tsx'] = this.generateRootLayout();
      files['src/app/page.tsx'] = this.generateHomePage();
      files['src/app/globals.css'] = this.generateGlobalStyles();
      
      // 기본 의존성
      Object.assign(dependencies, {
        'next': '^14.0.0',
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
      });
      
      Object.assign(devDependencies, {
        '@types/node': '^20.0.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        'typescript': '^5.0.0',
        'tailwindcss': '^3.3.0',
        'postcss': '^8.4.0',
        'autoprefixer': '^10.4.0',
      });
    }

    // 각 빌딩에 대한 코드 생성
    for (const building of buildings) {
      const buildingCode = await this.generateBuildingCode(building, framework);
      Object.assign(files, buildingCode.files);
      Object.assign(dependencies, buildingCode.dependencies);
      environmentVariables.push(...buildingCode.environmentVariables);
    }

    // 연결 관계 반영
    this.applyConnections(files, connections, buildings);

    return {
      framework,
      files,
      dependencies,
      devDependencies,
      scripts: this.generateScripts(framework),
      environmentVariables: [...new Set(environmentVariables)],
    };
  }

  private inferFramework(buildings: Building[]): ProjectStructure['framework'] {
    const hasReactUI = buildings.some(b => 
      ['page', 'component', 'layout'].includes(b.type)
    );
    const hasAPI = buildings.some(b => 
      ['api-gateway', 'api-endpoint'].includes(b.type)
    );
    
    if (hasReactUI && hasAPI) return 'nextjs';
    if (hasReactUI) return 'react';
    if (hasAPI) return 'express';
    return 'vanilla';
  }

  private async generateBuildingCode(
    building: Building,
    framework: string
  ) {
    const files: Record<string, string> = {};
    const dependencies: Record<string, string> = {};
    const environmentVariables: string[] = [];

    switch (building.type) {
      case 'database':
        if (building.config.type === 'postgresql') {
          files['src/lib/db.ts'] = this.generateDatabaseConnection(building);
          dependencies['@prisma/client'] = '^5.0.0';
          dependencies['prisma'] = '^5.0.0';
          environmentVariables.push('DATABASE_URL');
        }
        break;

      case 'auth-center':
        files['src/app/api/auth/[...nextauth]/route.ts'] = this.generateAuthAPI(building);
        files['src/lib/auth.ts'] = this.generateAuthConfig(building);
        dependencies['next-auth'] = '^4.24.0';
        dependencies['@auth/prisma-adapter'] = '^1.0.0';
        environmentVariables.push('NEXTAUTH_URL', 'NEXTAUTH_SECRET');
        break;

      case 'api-gateway':
        const endpoints = building.config.endpoints || [];
        for (const endpoint of endpoints) {
          const path = `src/app/api/${endpoint.path}/route.ts`;
          files[path] = this.generateAPIEndpoint(endpoint);
        }
        break;

      case 'page':
        const pagePath = building.config.route || '/';
        const fileName = pagePath === '/' ? 'page' : pagePath.slice(1);
        files[`src/app/${fileName}/page.tsx`] = this.generatePage(building);
        break;
    }

    return { files, dependencies, environmentVariables };
  }

  private generateRootLayout(): string {
    return `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IRKE TOWN App',
  description: 'Generated by IRKE TOWN',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`;
  }

  private generateHomePage(): string {
    return `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold">Welcome to IRKE TOWN</h1>
        <p className="mt-4">Your app is ready!</p>
      </div>
    </main>
  )
}`;
  }

  private generateGlobalStyles(): string {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`;
  }

  private generateDatabaseConnection(building: Building): string {
    return `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma`;
  }

  private generateAuthAPI(building: Building): string {
    return `import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }`;
  }

  private generateAuthConfig(building: Building): string {
    return `import type { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from '@/lib/db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
}`;
  }

  private generateAPIEndpoint(endpoint: any): string {
    return `import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement ${endpoint.name} logic
    return NextResponse.json({ message: 'Success' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // TODO: Implement ${endpoint.name} logic
    return NextResponse.json({ message: 'Created', data: body })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}`;
  }

  private generatePage(building: Building): string {
    return `export default function ${building.name}Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">${building.name}</h1>
      <p className="mt-4">This page was generated by IRKE TOWN.</p>
    </div>
  )
}`;
  }

  private applyConnections(
    files: Record<string, string>,
    connections: Connection[],
    buildings: Building[]
  ) {
    // 연결 관계에 따른 import 및 데이터 흐름 추가
    connections.forEach(connection => {
      // TODO: 연결 타입에 따른 코드 수정
    });
  }

  private generateScripts(framework: string): Record<string, string> {
    switch (framework) {
      case 'nextjs':
        return {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint',
        };
      case 'react':
        return {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        };
      case 'express':
        return {
          dev: 'nodemon src/index.ts',
          build: 'tsc',
          start: 'node dist/index.js',
        };
      default:
        return {};
    }
  }
}
```

#### 3.2 동기화 서비스
```typescript
// src/services/github/sync.service.ts
/**
 * irke://stack/integration/github/sync
 * 타운과 GitHub 레포지토리 동기화 서비스
 */
import { GitHubFileService } from './file.service';
import { ProjectCodeGeneratorService } from '../ai/code-generator.service';
import { Building, Connection } from '@/types/town';

interface SyncOptions {
  owner: string;
  repo: string;
  branch?: string;
  commitMessage?: string;
}

interface SyncResult {
  success: boolean;
  results: Array<{
    path: string;
    success: boolean;
    sha?: string;
    error?: string;
  }>;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
  commit?: {
    sha: string;
    message: string;
    url: string;
  };
}

export class GitHubSyncService {
  private fileService: GitHubFileService;
  private codeGenerator: ProjectCodeGeneratorService;

  constructor() {
    this.fileService = new GitHubFileService();
    this.codeGenerator = new ProjectCodeGeneratorService();
  }

  async initialize(accessToken: string) {
    await this.fileService.initialize(accessToken);
  }

  async syncTownToGitHub(
    buildings: Building[],
    connections: Connection[],
    options: SyncOptions
  ): Promise<SyncResult> {
    const { owner, repo, branch = 'main' } = options;
    
    try {
      // 1. 프로젝트 구조 생성
      const projectStructure = await this.codeGenerator.generateProjectStructure(
        buildings,
        connections
      );

      // 2. 파일 목록 준비
      const filesToCreate = Object.entries(projectStructure.files).map(
        ([path, content]) => ({ path, content })
      );

      // 3. 설정 파일 추가
      const configFiles = await this.generateConfigFiles(projectStructure);
      filesToCreate.push(...configFiles);

      // 4. 환경 변수 예제 파일
      if (projectStructure.environmentVariables.length > 0) {
        filesToCreate.push({
          path: '.env.example',
          content: projectStructure.environmentVariables
            .map(key => `${key}=`)
            .join('\n'),
        });
      }

      // 5. 모든 파일을 하나의 커밋으로 생성
      const result = await this.fileService.createMultipleFiles(
        owner,
        repo,
        filesToCreate,
        options.commitMessage || `Update project from IRKE TOWN - ${new Date().toISOString()}`,
        branch
      );

      return {
        success: true,
        results: filesToCreate.map((file, index) => ({
          path: file.path,
          success: true,
          sha: result.files[index]?.sha,
        })),
        summary: {
          total: filesToCreate.length,
          succeeded: filesToCreate.length,
          failed: 0,
        },
        commit: result.commit,
      };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        results: [{
          path: 'error',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
        summary: {
          total: 1,
          succeeded: 0,
          failed: 1,
        },
      };
    }
  }

  private async generateConfigFiles(projectStructure: any) {
    const files: Array<{ path: string; content: string }> = [];

    // package.json
    const packageJson = {
      name: 'irke-town-app',
      version: '1.0.0',
      private: true,
      scripts: projectStructure.scripts || {},
      dependencies: projectStructure.dependencies || {},
      devDependencies: projectStructure.devDependencies || {},
    };
    files.push({
      path: 'package.json',
      content: JSON.stringify(packageJson, null, 2),
    });

    // Framework specific configs
    if (projectStructure.framework === 'nextjs') {
      // next.config.js
      files.push({
        path: 'next.config.js',
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig`,
      });

      // tsconfig.json
      files.push({
        path: 'tsconfig.json',
        content: JSON.stringify({
          compilerOptions: {
            target: 'es5',
            lib: ['dom', 'dom.iterable', 'esnext'],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            forceConsistentCasingInFileNames: true,
            noEmit: true,
            esModuleInterop: true,
            module: 'esnext',
            moduleResolution: 'bundler',
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: 'preserve',
            incremental: true,
            plugins: [{ name: 'next' }],
            paths: { '@/*': ['./src/*'] },
          },
          include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
          exclude: ['node_modules'],
        }, null, 2),
      });

      // tailwind.config.js
      files.push({
        path: 'tailwind.config.js',
        content: `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}`,
      });

      // postcss.config.js
      files.push({
        path: 'postcss.config.js',
        content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      });
    }

    // .gitignore
    files.push({
      path: '.gitignore',
      content: `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts`,
    });

    // README.md
    files.push({
      path: 'README.md',
      content: `# IRKE TOWN Project

This project was generated by [IRKE TOWN](https://irke.town).

## Getting Started

First, install dependencies:

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

This project includes the following components:
${projectStructure.files ? Object.keys(projectStructure.files).map(path => `- ${path}`).join('\n') : ''}

## Environment Variables

Create a \`.env.local\` file based on \`.env.example\` and fill in the required values.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
`,
    });

    return files;
  }

  async getProjectState(owner: string, repo: string, branch = 'main') {
    const tree = await this.fileService.getTree(owner, repo, branch);
    
    const files = tree.filter(item => item.type === 'blob');
    const directories = tree.filter(item => item.type === 'tree');
    
    return {
      files: files.map(f => ({
        path: f.path,
        size: f.size || 0,
        sha: f.sha,
      })),
      directories: directories.map(d => ({
        path: d.path,
      })),
      totalSize: files.reduce((sum, item) => sum + (item.size || 0), 0),
      fileCount: files.length,
      directoryCount: directories.length,
    };
  }

  async compareWithRemote(
    owner: string,
    repo: string,
    localFiles: Record<string, string>,
    branch = 'main'
  ) {
    const remoteTree = await this.fileService.getTree(owner, repo, branch);
    const remoteFileMap = new Map(
      remoteTree
        .filter(item => item.type === 'blob')
        .map(item => [item.path!, item.sha!])
    );

    const changes = {
      added: [] as string[],
      modified: [] as string[],
      deleted: [] as string[],
    };

    // 추가 및 수정된 파일 확인
    for (const [path, content] of Object.entries(localFiles)) {
      const localSha = await this.calculateSha(content);
      const remoteSha = remoteFileMap.get(path);
      
      if (!remoteSha) {
        changes.added.push(path);
      } else if (remoteSha !== localSha) {
        changes.modified.push(path);
      }
      
      remoteFileMap.delete(path);
    }

    // 삭제된 파일
    changes.deleted = Array.from(remoteFileMap.keys());

    return changes;
  }

  private async calculateSha(content: string): Promise<string> {
    // 간단한 SHA 계산 (실제로는 Git 방식으로 계산해야 함)
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
```

### Task 4: Next.js App Router API 구현

#### 4.1 GitHub OAuth 처리
```typescript
// src/app/api/auth/github/route.ts
/**
 * irke://stack/api/auth/github
 * GitHub OAuth 처리 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI!;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // OAuth 시작 (code가 없는 경우)
  if (!code) {
    const state = crypto.randomUUID();
    cookies().set('github_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10분
    });

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: GITHUB_REDIRECT_URI,
      scope: 'repo user workflow',
      state,
    });

    return NextResponse.redirect(
      `https://github.com/login/oauth/authorize?${params}`
    );
  }

  // OAuth 콜백 처리
  try {
    // State 검증
    const savedState = cookies().get('github_oauth_state')?.value;
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    // Access token 교환
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: GITHUB_REDIRECT_URI,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to get access token');
    }

    // 사용자 정보 가져오기
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const userData = await userResponse.json();

    // 토큰 저장 (실제로는 데이터베이스에 저장)
    cookies().set('github_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30일
    });

    // 클라이언트로 리다이렉트
    return NextResponse.redirect(
      new URL('/?auth=success', request.url)
    );
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(
      new URL('/?auth=error', request.url)
    );
  }
}
```

#### 4.2 레포지토리 API
```typescript
// src/app/api/github/repository/route.ts
/**
 * irke://stack/api/github/repository
 * GitHub 레포지토리 관리 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GitHubRepositoryService } from '@/services/github/repository.service';

export async function POST(request: NextRequest) {
  try {
    const token = cookies().get('github_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, isPrivate } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Repository name is required' },
        { status: 400 }
      );
    }

    const service = new GitHubRepositoryService();
    await service.initialize(token);

    const repository = await service.createRepository({
      name,
      description,
      isPrivate,
    });

    return NextResponse.json(repository);
  } catch (error: any) {
    console.error('Repository creation error:', error);
    
    if (error.message?.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create repository' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('github_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');

    const service = new GitHubRepositoryService();
    await service.initialize(token);

    if (owner && repo) {
      // 특정 레포지토리 조회
      const repository = await service.getRepository(owner, repo);
      if (!repository) {
        return NextResponse.json(
          { error: 'Repository not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(repository);
    } else {
      // 레포지토리 목록 조회
      const repositories = await service.listRepositories({
        type: 'owner',
        sort: 'updated',
        per_page: 100,
      });
      return NextResponse.json(repositories);
    }
  } catch (error: any) {
    console.error('Repository fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repositories' },
      { status: 500 }
    );
  }
}
```

#### 4.3 동기화 API
```typescript
// src/app/api/github/sync/route.ts
/**
 * irke://stack/api/github/sync
 * GitHub 동기화 API
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GitHubSyncService } from '@/services/github/sync.service';

export async function POST(request: NextRequest) {
  try {
    const token = cookies().get('github_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { owner, repo, buildings, connections, commitMessage } = body;

    if (!owner || !repo || !buildings) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const service = new GitHubSyncService();
    await service.initialize(token);

    const result = await service.syncTownToGitHub(
      buildings,
      connections,
      {
        owner,
        repo,
        commitMessage,
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('github_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Owner and repo are required' },
        { status: 400 }
      );
    }

    const service = new GitHubSyncService();
    await service.initialize(token);

    const state = await service.getProjectState(owner, repo);

    return NextResponse.json(state);
  } catch (error: any) {
    console.error('State fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project state' },
      { status: 500 }
    );
  }
}
```

### Task 5: UI 컴포넌트 구현

#### 5.1 GitHub 패널 컴포넌트
```tsx
// src/components/github/github-panel.tsx
/**
 * irke://component/ui/github-panel
 * GitHub 통합 패널 UI
 */
'use client';

import { useState, useEffect } from 'react';
import { useGitHubStore } from '@/stores/github.store';
import { useProjectStore } from '@/stores/project.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Github, 
  Check, 
  X, 
  GitBranch,
  GitCommit,
  FileCode,
  FolderOpen,
  ExternalLink,
  RefreshCw,
  Settings
} from 'lucide-react';

export function GitHubPanel() {
  const { user, isAuthenticated, repository } = useGitHubStore();
  const { buildings, connections } = useProjectStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [repoDescription, setRepoDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [projectState, setProjectState] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    if (repository && user) {
      fetchProjectState();
    }
  }, [repository, user]);

  const fetchProjectState = async () => {
    if (!repository || !user) return;

    try {
      const response = await fetch(
        `/api/github/sync?owner=${user.login}&repo=${repository.name}`
      );
      if (response.ok) {
        const state = await response.json();
        setProjectState(state);
      }
    } catch (error) {
      console.error('Failed to fetch project state:', error);
    }
  };

  const handleCreateRepo = async () => {
    if (!repoName || !user) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/github/repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: repoName,
          description: repoDescription,
          isPrivate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create repository');
      }

      const repo = await response.json();
      useGitHubStore.setState({ repository: repo });
      setRepoName('');
      setRepoDescription('');
    } catch (error: any) {
      setSyncStatus({
        success: false,
        error: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSync = async () => {
    if (!repository || !user) return;

    setIsSyncing(true);
    setSyncStatus(null);

    try {
      const response = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: user.login,
          repo: repository.name,
          buildings,
          connections,
          commitMessage: `Update from IRKE TOWN - ${new Date().toLocaleString()}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync');
      }

      const result = await response.json();
      setSyncStatus(result);
      await fetchProjectState();
    } catch (error: any) {
      setSyncStatus({
        success: false,
        error: error.message,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GitHub Integration</CardTitle>
          <CardDescription>
            Connect to GitHub to save and deploy your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Github className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-6">
              Sign in with GitHub to unlock version control and deployment features
            </p>
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/auth/github'}
            >
              <Github className="mr-2 h-5 w-5" />
              Connect GitHub
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
            <CardTitle>GitHub Integration</CardTitle>
            <CardDescription>
              Manage your project repository and deployments
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <img 
              src={user.avatar} 
              alt={user.login} 
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm font-medium">{user.login}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!repository ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Repository Name</label>
              <Input
                placeholder="my-awesome-project"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="A brief description of your project"
                value={repoDescription}
                onChange={(e) => setRepoDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="private"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="private" className="text-sm">
                Make repository private
              </label>
            </div>
            <Button 
              onClick={handleCreateRepo} 
              disabled={!repoName || isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Repository...
                </>
              ) : (
                <>
                  <Github className="mr-2 h-4 w-4" />
                  Create Repository
                </>
              )}
            </Button>
          </div>
        ) : (
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{repository.fullName}</h4>
                  <a 
                    href={repository.htmlUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
                {repository.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {repository.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    <span>{repository.defaultBranch}</span>
                  </div>
                  <Badge variant={repository.private ? 'secondary' : 'default'}>
                    {repository.private ? 'Private' : 'Public'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleSync} 
                  disabled={isSyncing}
                  className="w-full"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing to GitHub...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync to GitHub
                    </>
                  )}
                </Button>

                {syncStatus && (
                  <Alert variant={syncStatus.success ? 'default' : 'destructive'}>
                    <div className="flex items-start gap-2">
                      {syncStatus.success ? (
                        <Check className="h-4 w-4 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <AlertDescription>
                          {syncStatus.success ? (
                            <>
                              Successfully synced {syncStatus.summary.succeeded} files
                              {syncStatus.commit && (
                                <div className="mt-2">
                                  <a
                                    href={syncStatus.commit.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <GitCommit className="h-3 w-3" />
                                    {syncStatus.commit.sha.slice(0, 7)}
                                  </a>
                                </div>
                              )}
                            </>
                          ) : (
                            syncStatus.error || 'Sync failed'
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              {projectState ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      {projectState.fileCount} files, {projectState.directoryCount} folders
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchProjectState}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                    {projectState.files.slice(0, 20).map((file: any) => (
                      <div
                        key={file.path}
                        className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-2"
                      >
                        <FileCode className="h-4 w-4 text-gray-400" />
                        <span className="text-sm flex-1">{file.path}</span>
                        <span className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(1)}KB
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {projectState.fileCount > 20 && (
                    <p className="text-sm text-gray-500 text-center">
                      And {projectState.fileCount - 20} more files...
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No files synced yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Repository Settings</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Default Branch</p>
                        <p className="text-sm text-gray-500">{repository.defaultBranch}</p>
                      </div>
                      <Settings className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Clone URL</p>
                        <p className="text-xs text-gray-500 font-mono">{repository.cloneUrl}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(repository.cloneUrl)}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to disconnect this repository?')) {
                        useGitHubStore.setState({ repository: null });
                      }
                    }}
                  >
                    Disconnect Repository
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

// src/components/github/sync-status.tsx
/**
 * irke://component/ui/sync-status
 * 동기화 상태 표시 컴포넌트
 */
'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react';

interface SyncStatusProps {
  status: {
    success: boolean;
    results: Array<{
      path: string;
      success: boolean;
      error?: string;
    }>;
    summary: {
      total: number;
      succeeded: number;
      failed: number;
    };
    commit?: {
      sha: string;
      message: string;
      url: string;
    };
  };
}

export function SyncStatus({ status }: SyncStatusProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const percentage = (status.summary.succeeded / status.summary.total) * 100;
    setProgress(percentage);
  }, [status]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Sync Progress</span>
          <span>{status.summary.succeeded} / {status.summary.total}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {status.summary.failed > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {status.summary.failed} files failed to sync
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {status.results.map((result, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm flex-1 truncate">{result.path}</span>
            {result.error && (
              <span className="text-xs text-red-500">{result.error}</span>
            )}
          </div>
        ))}
      </div>

      {status.commit && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Commit Created</p>
              <p className="text-xs text-gray-500 mt-1">{status.commit.message}</p>
            </div>
            <a
              href={status.commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              {status.commit.sha.slice(0, 7)}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// src/stores/github.store.ts
/**
 * irke://stack/state/github
 * GitHub 상태 관리
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar: string;
}

interface Repository {
  id: number;
  nodeId: string;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  owner: {
    login: string;
    id: number;
    avatar: string;
  };
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
  size: number;
  language: string | null;
  topics: string[];
}

interface GitHubStore {
  user: GitHubUser | null;
  accessToken: string | null;
  repository: Repository | null;
  isAuthenticated: boolean;
  
  setUser: (user: GitHubUser | null) => void;
  setAccessToken: (token: string | null) => void;
  setRepository: (repo: Repository | null) => void;
  logout: () => void;
}

export const useGitHubStore = create<GitHubStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      repository: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRepository: (repository) => set({ repository }),
      
      logout: () => set({
        user: null,
        accessToken: null,
        repository: null,
        isAuthenticated: false,
      }),
    }),
    {
      name: 'github-storage',
      partialize: (state) => ({
        user: state.user,
        repository: state.repository,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);