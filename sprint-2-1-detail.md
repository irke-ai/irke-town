# Sprint 2.1: AI 서비스 아키텍처 - 상세 구현 가이드

## 🎯 Sprint 목표
Qwen 2.5-Coder API를 통합하고, Stack Library를 구현하며, AI 서비스의 기반 아키텍처를 구축합니다.

## 🛠️ 핵심 구현 사항
- Qwen API 클라이언트 구축
- Stack Library 데이터 구조
- 프롬프트 템플릿 시스템
- 토큰 최적화 전략
- 에러 처리 및 재시도 로직

## 📋 Task 1: AI 서비스 레이어

### 1.1 환경 변수 설정 (.env.local)
```bash
# AI API 설정
QWEN_API_KEY=your_api_key_here
QWEN_API_URL=https://api.qwen.ai/v1/chat/completions
QWEN_MODEL=qwen-2.5-coder

# API 제한 설정
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7
AI_TIMEOUT=30000
AI_MAX_RETRIES=3
```

### 1.2 AI 클라이언트 구현 (src/services/ai/client.ts)
```typescript
// irke://stack/ai/qwen/client
interface QwenMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface QwenRequest {
  model: string
  messages: QwenMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

interface QwenResponse {
  id: string
  choices: Array<{
    message: QwenMessage
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class QwenClient {
  private apiKey: string
  private apiUrl: string
  private model: string
  private maxRetries: number
  private timeout: number

  constructor() {
    this.apiKey = process.env.QWEN_API_KEY!
    this.apiUrl = process.env.QWEN_API_URL!
    this.model = process.env.QWEN_MODEL || 'qwen-2.5-coder'
    this.maxRetries = parseInt(process.env.AI_MAX_RETRIES || '3')
    this.timeout = parseInt(process.env.AI_TIMEOUT || '30000')
  }

  async chat(messages: QwenMessage[], options?: Partial<QwenRequest>): Promise<QwenResponse> {
    const request: QwenRequest = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 4000,
      stream: false,
    }

    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(request)
        return response
      } catch (error) {
        lastError = error as Error
        console.error(`AI request attempt ${attempt + 1} failed:`, error)
        
        // 재시도 전 대기 (지수 백오프)
        if (attempt < this.maxRetries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000)
        }
      }
    }

    throw new Error(`AI request failed after ${this.maxRetries} attempts: ${lastError?.message}`)
  }

  private async makeRequest(request: QwenRequest): Promise<QwenResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data as QwenResponse
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 스트리밍 응답 지원
  async *chatStream(messages: QwenMessage[], options?: Partial<QwenRequest>): AsyncGenerator<string> {
    const request: QwenRequest = {
      ...options,
      model: this.model,
      messages,
      stream: true,
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return
          
          try {
            const json = JSON.parse(data)
            const content = json.choices[0]?.delta?.content
            if (content) yield content
          } catch (e) {
            console.error('Failed to parse streaming response:', e)
          }
        }
      }
    }
  }
}
```

### 1.3 AI 서비스 인터페이스 (src/services/ai/types.ts)
```typescript
// irke://stack/ai/service/types
import { Building, Connection } from '@/types'

export interface AIContext {
  // 현재 선택된 건물
  selectedBuilding?: Building
  
  // 연결된 건물들
  connectedBuildings: Building[]
  
  // 프로젝트 설정
  projectType: 'webapp' | 'api' | 'fullstack'
  techStack: string[]
  
  // 타운 전체 상태
  townState: {
    buildings: Building[]
    connections: Connection[]
  }
  
  // 대화 히스토리
  conversationHistory: Message[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    buildingId?: string
    codeGenerated?: boolean
    error?: string
  }
}

export interface CodeGenerationRequest {
  context: AIContext
  prompt: string
  targetBuilding: Building
  intent: 'create' | 'update' | 'fix' | 'explain'
}

export interface GeneratedCode {
  buildingId: string
  files: CodeFile[]
  dependencies: string[]
  instructions?: string
  warnings?: string[]
}

export interface CodeFile {
  path: string
  content: string
  language: string
  description?: string
}

export interface Intent {
  type: 'create' | 'update' | 'fix' | 'explain' | 'optimize' | 'test'
  confidence: number
  entities: {
    buildings?: string[]
    features?: string[]
    technologies?: string[]
  }
}
```

## 📋 Task 2: Stack Library 구현

### 2.1 라이브러리 프로토콜 파서 (src/lib/protocol/parser.ts)
```typescript
// irke://stack/protocol/parser
export interface ProtocolParsed {
  protocol: 'irke'
  library: 'stack' | 'business' | 'prompt' | 'component' | 'error' | 'compliance'
  category: string[]
  resource: string
  query?: Record<string, string>
}

export function parseProtocol(uri: string): ProtocolParsed | null {
  const regex = /^irke:\/\/([^\/]+)\/(.+?)(\?(.+))?$/
  const match = uri.match(regex)
  
  if (!match) return null
  
  const [, library, path, , queryString] = match
  const category = path.split('/')
  const resource = category.pop() || ''
  
  // 쿼리 파라미터 파싱
  const query: Record<string, string> = {}
  if (queryString) {
    const params = new URLSearchParams(queryString)
    params.forEach((value, key) => {
      query[key] = value
    })
  }
  
  return {
    protocol: 'irke',
    library: library as any,
    category,
    resource,
    query,
  }
}

export function buildProtocol(parsed: ProtocolParsed): string {
  const path = [...parsed.category, parsed.resource].join('/')
  let uri = `irke://${parsed.library}/${path}`
  
  if (parsed.query && Object.keys(parsed.query).length > 0) {
    const params = new URLSearchParams(parsed.query)
    uri += `?${params.toString()}`
  }
  
  return uri
}
```

### 2.2 Stack Library 데이터 (src/lib/libraries/stack/index.ts)
```typescript
// irke://stack/library/data
export interface StackResource {
  id: string
  uri: string
  content: string
  metadata: {
    type: 'code' | 'config' | 'pattern' | 'documentation'
    language?: string
    framework?: string
    version?: string
    tags: string[]
  }
}

export const stackLibrary: Record<string, StackResource> = {
  // Next.js 14 리소스
  'framework/nextjs/14/app-router': {
    id: 'nextjs-14-app-router',
    uri: 'irke://stack/framework/nextjs/14/app-router',
    content: `
// Next.js 14 App Router 기본 구조
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
`,
    metadata: {
      type: 'pattern',
      framework: 'nextjs',
      version: '14',
      language: 'typescript',
      tags: ['layout', 'app-router'],
    },
  },
  
  // API 패턴
  'api/rest/patterns': {
    id: 'rest-api-patterns',
    uri: 'irke://stack/api/rest/patterns',
    content: `
// RESTful API 패턴
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 데이터 조회 로직
    return NextResponse.json({ data: [] })
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
    // 데이터 생성 로직
    return NextResponse.json({ data: body }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Bad Request' },
      { status: 400 }
    )
  }
}
`,
    metadata: {
      type: 'pattern',
      language: 'typescript',
      tags: ['api', 'rest', 'nextjs'],
    },
  },
  
  // 데이터베이스 스키마
  'database/postgresql/schema': {
    id: 'postgresql-schema',
    uri: 'irke://stack/database/postgresql/schema',
    content: `
-- PostgreSQL 기본 스키마 패턴
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_name ON products(name);
`,
    metadata: {
      type: 'code',
      language: 'sql',
      tags: ['database', 'postgresql', 'schema'],
    },
  },
  
  // TypeScript 타입 정의
  'typescript/types/base': {
    id: 'typescript-base-types',
    uri: 'irke://stack/typescript/types/base',
    content: `
// 기본 타입 정의
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface User extends BaseEntity {
  email: string
  name?: string
  role: 'user' | 'admin'
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  metadata?: {
    page?: number
    limit?: number
    total?: number
  }
}
`,
    metadata: {
      type: 'code',
      language: 'typescript',
      tags: ['types', 'interface'],
    },
  },
}
```

### 2.3 라이브러리 검색 엔진 (src/lib/libraries/search.ts)
```typescript
// irke://stack/library/search
import { stackLibrary, StackResource } from './stack'

export interface SearchOptions {
  query: string
  libraries?: string[]
  tags?: string[]
  type?: string
  limit?: number
}

export interface SearchResult {
  resource: StackResource
  score: number
  matches: {
    uri?: boolean
    content?: boolean
    tags?: boolean
  }
}

export class LibrarySearch {
  private resources: Map<string, StackResource>

  constructor() {
    this.resources = new Map()
    
    // Stack Library 로드
    Object.entries(stackLibrary).forEach(([key, resource]) => {
      this.resources.set(resource.uri, resource)
    })
    
    // 향후 다른 라이브러리도 추가
  }

  search(options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = []
    const query = options.query.toLowerCase()
    
    this.resources.forEach((resource) => {
      let score = 0
      const matches: SearchResult['matches'] = {}
      
      // URI 매칭
      if (resource.uri.toLowerCase().includes(query)) {
        score += 10
        matches.uri = true
      }
      
      // 콘텐츠 매칭
      if (resource.content.toLowerCase().includes(query)) {
        score += 5
        matches.content = true
      }
      
      // 태그 매칭
      if (resource.metadata.tags.some(tag => tag.toLowerCase().includes(query))) {
        score += 8
        matches.tags = true
      }
      
      // 타입 필터
      if (options.type && resource.metadata.type !== options.type) {
        score = 0
      }
      
      // 태그 필터
      if (options.tags && options.tags.length > 0) {
        const hasAllTags = options.tags.every(tag =>
          resource.metadata.tags.includes(tag)
        )
        if (!hasAllTags) score = 0
      }
      
      if (score > 0) {
        results.push({ resource, score, matches })
      }
    })
    
    // 점수순 정렬
    results.sort((a, b) => b.score - a.score)
    
    // 결과 제한
    if (options.limit) {
      return results.slice(0, options.limit)
    }
    
    return results
  }

  getByUri(uri: string): StackResource | undefined {
    return this.resources.get(uri)
  }

  getByPattern(pattern: RegExp): StackResource[] {
    const results: StackResource[] = []
    
    this.resources.forEach((resource) => {
      if (pattern.test(resource.uri)) {
        results.push(resource)
      }
    })
    
    return results
  }
}
```

## 📋 Task 3: 프롬프트 엔지니어링

### 3.1 프롬프트 템플릿 관리자 (src/services/ai/prompts/manager.ts)
```typescript
// irke://prompt/template/manager
export interface PromptTemplate {
  id: string
  name: string
  category: 'code-generation' | 'debugging' | 'explanation' | 'optimization'
  template: string
  variables: string[]
  examples?: string[]
}

export class PromptTemplateManager {
  private templates: Map<string, PromptTemplate>

  constructor() {
    this.templates = new Map()
    this.loadDefaultTemplates()
  }

  private loadDefaultTemplates() {
    // 코드 생성 템플릿
    this.addTemplate({
      id: 'generate-api-endpoint',
      name: 'API 엔드포인트 생성',
      category: 'code-generation',
      template: `
You are helping to build a REST API endpoint for a {buildingType} in IRKE TOWN.

Context:
- Building Name: {buildingName}
- Connected Buildings: {connectedBuildings}
- Tech Stack: {techStack}
- Project Type: {projectType}

Requirements:
{requirements}

Generate a complete, production-ready API endpoint with:
1. Proper error handling
2. Input validation
3. Type safety
4. Appropriate HTTP status codes
5. Clear documentation comments

Output the code in the following format:
- File path as a comment at the top
- Complete TypeScript/JavaScript code
- No explanations outside of code comments
`,
      variables: ['buildingType', 'buildingName', 'connectedBuildings', 'techStack', 'projectType', 'requirements'],
    })

    // 데이터베이스 스키마 생성
    this.addTemplate({
      id: 'generate-db-schema',
      name: '데이터베이스 스키마 생성',
      category: 'code-generation',
      template: `
You are creating a database schema for a {databaseType} database in IRKE TOWN.

Context:
- Building: {buildingName}
- Connected APIs: {connectedAPIs}
- Data Requirements: {dataRequirements}

Generate:
1. Complete SQL schema with tables
2. Appropriate data types and constraints
3. Indexes for performance
4. Foreign key relationships
5. Sample seed data (5-10 records)

Format: Standard SQL compatible with {databaseType}
`,
      variables: ['databaseType', 'buildingName', 'connectedAPIs', 'dataRequirements'],
    })

    // 프론트엔드 컴포넌트 생성
    this.addTemplate({
      id: 'generate-frontend-component',
      name: '프론트엔드 컴포넌트 생성',
      category: 'code-generation',
      template: `
You are creating a React component for a Frontend Page building in IRKE TOWN.

Context:
- Component Purpose: {componentPurpose}
- Connected APIs: {connectedAPIs}
- UI Framework: {uiFramework}
- State Management: {stateManagement}

Requirements:
{requirements}

Generate a complete React component with:
1. TypeScript interfaces
2. Proper state management
3. API integration (if needed)
4. Error handling
5. Loading states
6. Responsive design with Tailwind CSS

Output as a single .tsx file with all necessary imports.
`,
      variables: ['componentPurpose', 'connectedAPIs', 'uiFramework', 'stateManagement', 'requirements'],
    })

    // 디버깅 템플릿
    this.addTemplate({
      id: 'debug-error',
      name: '에러 디버깅',
      category: 'debugging',
      template: `
Help debug an error in the {buildingName} building.

Error Details:
{errorMessage}

Stack Trace:
{stackTrace}

Building Configuration:
{buildingConfig}

Current Code:
{currentCode}

Analyze the error and provide:
1. Root cause explanation
2. Step-by-step fix
3. Preventive measures
4. Updated code

Focus on the minimal changes needed to fix the issue.
`,
      variables: ['buildingName', 'errorMessage', 'stackTrace', 'buildingConfig', 'currentCode'],
    })
  }

  addTemplate(template: PromptTemplate) {
    this.templates.set(template.id, template)
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id)
  }

  fillTemplate(templateId: string, variables: Record<string, any>): string {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    let filled = template.template

    // 변수 치환
    template.variables.forEach(variable => {
      const value = variables[variable]
      if (value === undefined) {
        console.warn(`Variable ${variable} not provided for template ${templateId}`)
      }
      
      const regex = new RegExp(`{${variable}}`, 'g')
      filled = filled.replace(regex, String(value || ''))
    })

    return filled.trim()
  }

  searchTemplates(category?: string, keyword?: string): PromptTemplate[] {
    let results = Array.from(this.templates.values())

    if (category) {
      results = results.filter(t => t.category === category)
    }

    if (keyword) {
      const lower = keyword.toLowerCase()
      results = results.filter(t =>
        t.name.toLowerCase().includes(lower) ||
        t.template.toLowerCase().includes(lower)
      )
    }

    return results
  }
}
```

### 3.2 컨텍스트 빌더 (src/services/ai/context/builder.ts)
```typescript
// irke://stack/ai/context/builder
import { Building, Connection } from '@/types'
import { AIContext } from '../types'
import { LibrarySearch } from '@/lib/libraries/search'

export class ContextBuilder {
  private librarySearch: LibrarySearch

  constructor() {
    this.librarySearch = new LibrarySearch()
  }

  async buildContext(params: {
    selectedBuilding?: Building
    buildings: Building[]
    connections: Connection[]
    projectType: string
    techStack: string[]
    conversationHistory?: Message[]
  }): Promise<AIContext> {
    const { selectedBuilding, buildings, connections } = params

    // 연결된 건물 찾기
    let connectedBuildings: Building[] = []
    if (selectedBuilding) {
      const connectedIds = connections
        .filter(c =>
          c.fromBuildingId === selectedBuilding.id ||
          c.toBuildingId === selectedBuilding.id
        )
        .map(c =>
          c.fromBuildingId === selectedBuilding.id
            ? c.toBuildingId
            : c.fromBuildingId
        )

      connectedBuildings = buildings.filter(b => connectedIds.includes(b.id))
    }

    // 관련 라이브러리 리소스 찾기
    const relevantResources = await this.findRelevantResources(params)

    return {
      selectedBuilding,
      connectedBuildings,
      projectType: params.projectType as any,
      techStack: params.techStack,
      townState: {
        buildings,
        connections,
      },
      conversationHistory: params.conversationHistory || [],
      // 추가 컨텍스트
      libraryResources: relevantResources,
    }
  }

  private async findRelevantResources(params: any) {
    const resources: any[] = []

    // 선택된 건물 타입에 따른 리소스
    if (params.selectedBuilding) {
      const buildingType = params.selectedBuilding.type
      
      if (buildingType === 'api') {
        const apiResources = this.librarySearch.search({
          query: 'api',
          tags: ['api', 'rest'],
          limit: 3,
        })
        resources.push(...apiResources.map(r => r.resource))
      } else if (buildingType === 'database') {
        const dbResources = this.librarySearch.search({
          query: 'database schema',
          tags: ['database', 'schema'],
          limit: 3,
        })
        resources.push(...dbResources.map(r => r.resource))
      }
    }

    // 기술 스택에 따른 리소스
    for (const tech of params.techStack) {
      const techResources = this.librarySearch.search({
        query: tech.toLowerCase(),
        limit: 2,
      })
      resources.push(...techResources.map(r => r.resource))
    }

    return resources
  }

  // 컨텍스트를 프롬프트용 텍스트로 변환
  formatContextForPrompt(context: AIContext): string {
    const parts: string[] = []

    // 프로젝트 정보
    parts.push(`Project Type: ${context.projectType}`)
    parts.push(`Tech Stack: ${context.techStack.join(', ')}`)

    // 선택된 건물 정보
    if (context.selectedBuilding) {
      parts.push(`\nSelected Building:`)
      parts.push(`- Type: ${context.selectedBuilding.type}`)
      parts.push(`- Name: ${context.selectedBuilding.name}`)
      parts.push(`- Position: (${context.selectedBuilding.position.x}, ${context.selectedBuilding.position.y})`)
    }

    // 연결된 건물 정보
    if (context.connectedBuildings.length > 0) {
      parts.push(`\nConnected Buildings:`)
      context.connectedBuildings.forEach(building => {
        parts.push(`- ${building.name} (${building.type})`)
      })
    }

    // 타운 상태 요약
    parts.push(`\nTown Overview:`)
    parts.push(`- Total Buildings: ${context.townState.buildings.length}`)
    parts.push(`- Total Connections: ${context.townState.connections.length}`)

    return parts.join('\n')
  }
}
```

### 3.3 의도 분석기 (src/services/ai/intent/analyzer.ts)
```typescript
// irke://stack/ai/intent/analyzer
import { Intent } from '../types'

export class IntentAnalyzer {
  private patterns: Map<string, RegExp[]>

  constructor() {
    this.patterns = new Map([
      ['create', [
        /만들|생성|추가|구현|개발|작성/i,
        /create|add|implement|develop|build|make/i,
      ]],
      ['update', [
        /수정|변경|업데이트|개선/i,
        /update|modify|change|improve|edit/i,
      ]],
      ['fix', [
        /고치|수정|에러|버그|문제/i,
        /fix|error|bug|issue|problem|broken/i,
      ]],
      ['explain', [
        /설명|알려|뭐야|어떻게|왜/i,
        /explain|what|how|why|tell/i,
      ]],
      ['optimize', [
        /최적화|개선|빠르게|성능/i,
        /optimize|improve|faster|performance/i,
      ]],
      ['test', [
        /테스트|검증|확인/i,
        /test|verify|check|validate/i,
      ]],
    ])
  }

  analyze(message: string): Intent {
    const lowercased = message.toLowerCase()
    let detectedType: Intent['type'] = 'explain' // 기본값
    let highestScore = 0

    // 각 의도 타입별로 매칭 점수 계산
    this.patterns.forEach((patterns, type) => {
      let score = 0
      patterns.forEach(pattern => {
        if (pattern.test(lowercased)) {
          score += 1
        }
      })

      if (score > highestScore) {
        highestScore = score
        detectedType = type as Intent['type']
      }
    })

    // 신뢰도 계산 (0-1)
    const confidence = Math.min(highestScore / 2, 1)

    // 엔티티 추출
    const entities = this.extractEntities(message)

    return {
      type: detectedType,
      confidence,
      entities,
    }
  }

  private extractEntities(message: string): Intent['entities'] {
    const entities: Intent['entities'] = {}

    // 건물 타입 감지
    const buildingTypes = ['api', 'database', 'frontend', '프론트엔드', '백엔드', 'DB']
    const detectedBuildings: string[] = []
    
    buildingTypes.forEach(type => {
      if (message.toLowerCase().includes(type.toLowerCase())) {
        detectedBuildings.push(type)
      }
    })
    
    if (detectedBuildings.length > 0) {
      entities.buildings = detectedBuildings
    }

    // 기능 키워드 추출
    const featureKeywords = [
      '로그인', '인증', '회원가입', 'login', 'auth', 'signup',
      '검색', 'search', 'filter',
      '결제', 'payment', 'checkout',
      'CRUD', 'API', 'REST',
    ]
    
    const detectedFeatures: string[] = []
    featureKeywords.forEach(feature => {
      if (message.toLowerCase().includes(feature.toLowerCase())) {
        detectedFeatures.push(feature)
      }
    })
    
    if (detectedFeatures.length > 0) {
      entities.features = detectedFeatures
    }

    // 기술 스택 감지
    const technologies = [
      'React', 'Next.js', 'TypeScript', 'JavaScript',
      'PostgreSQL', 'MySQL', 'MongoDB',
      'REST', 'GraphQL',
      'Tailwind', 'CSS',
    ]
    
    const detectedTech: string[] = []
    technologies.forEach(tech => {
      if (message.toLowerCase().includes(tech.toLowerCase())) {
        detectedTech.push(tech)
      }
    })
    
    if (detectedTech.length > 0) {
      entities.technologies = detectedTech
    }

    return entities
  }
}
```

## 📋 Task 4: 토큰 최적화

### 4.1 토큰 카운터 (src/services/ai/tokens/counter.ts)
```typescript
// irke://stack/ai/tokens/counter
export class TokenCounter {
  // 간단한 토큰 추정 (실제로는 tiktoken 라이브러리 사용 권장)
  static estimate(text: string): number {
    // 대략적인 추정: 평균 4자 = 1토큰
    const charCount = text.length
    const wordCount = text.split(/\s+/).length
    
    // 한글은 대략 2-3자 = 1토큰
    const koreanChars = (text.match(/[가-힣]/g) || []).length
    const englishChars = charCount - koreanChars
    
    const koreanTokens = Math.ceil(koreanChars / 2.5)
    const englishTokens = Math.ceil(englishChars / 4)
    
    return koreanTokens + englishTokens
  }

  static truncate(text: string, maxTokens: number): string {
    const estimated = this.estimate(text)
    
    if (estimated <= maxTokens) {
      return text
    }
    
    // 비율로 자르기
    const ratio = maxTokens / estimated
    const targetLength = Math.floor(text.length * ratio * 0.9) // 여유분 10%
    
    return text.substring(0, targetLength) + '...'
  }
}
```

### 4.2 프롬프트 최적화기 (src/services/ai/optimization/prompt.ts)
```typescript
// irke://stack/ai/optimization/prompt
import { TokenCounter } from '../tokens/counter'
import { AIContext } from '../types'

export class PromptOptimizer {
  private maxContextTokens = 3000
  private maxResponseTokens = 4000

  optimizePrompt(systemPrompt: string, userPrompt: string, context: AIContext): {
    optimizedSystem: string
    optimizedUser: string
    estimatedTokens: number
  } {
    // 1. 컨텍스트 우선순위 정렬
    const prioritizedContext = this.prioritizeContext(context)
    
    // 2. 시스템 프롬프트 최적화
    let optimizedSystem = this.compressSystemPrompt(systemPrompt)
    
    // 3. 사용자 프롬프트 최적화
    let optimizedUser = userPrompt
    
    // 4. 컨텍스트 추가
    const contextString = this.formatContext(prioritizedContext)
    optimizedUser = `${contextString}\n\n${optimizedUser}`
    
    // 5. 토큰 수 확인 및 조정
    let totalTokens = TokenCounter.estimate(optimizedSystem + optimizedUser)
    
    if (totalTokens > this.maxContextTokens) {
      // 컨텍스트 축소
      const reducedContext = this.reduceContext(prioritizedContext)
      const reducedContextString = this.formatContext(reducedContext)
      optimizedUser = `${reducedContextString}\n\n${userPrompt}`
      totalTokens = TokenCounter.estimate(optimizedSystem + optimizedUser)
    }
    
    return {
      optimizedSystem,
      optimizedUser,
      estimatedTokens: totalTokens,
    }
  }

  private prioritizeContext(context: AIContext): AIContext {
    // 현재 작업과 가장 관련 있는 정보만 유지
    const prioritized = { ...context }
    
    // 대화 히스토리 제한 (최근 5개)
    if (context.conversationHistory.length > 5) {
      prioritized.conversationHistory = context.conversationHistory.slice(-5)
    }
    
    // 연결된 건물 제한 (최대 5개)
    if (context.connectedBuildings.length > 5) {
      prioritized.connectedBuildings = context.connectedBuildings.slice(0, 5)
    }
    
    return prioritized
  }

  private compressSystemPrompt(prompt: string): string {
    // 불필요한 공백 제거
    let compressed = prompt.trim().replace(/\s+/g, ' ')
    
    // 중복 제거
    compressed = compressed.replace(/\. \./g, '.')
    
    return compressed
  }

  private formatContext(context: AIContext): string {
    const parts: string[] = []
    
    if (context.selectedBuilding) {
      parts.push(`Current Building: ${context.selectedBuilding.name} (${context.selectedBuilding.type})`)
    }
    
    if (context.connectedBuildings.length > 0) {
      const names = context.connectedBuildings.map(b => b.name).join(', ')
      parts.push(`Connected: ${names}`)
    }
    
    parts.push(`Tech Stack: ${context.techStack.join(', ')}`)
    
    return parts.join('\n')
  }

  private reduceContext(context: AIContext): AIContext {
    // 더 공격적인 컨텍스트 축소
    const reduced = { ...context }
    
    // 대화 히스토리를 최근 2개로
    reduced.conversationHistory = context.conversationHistory.slice(-2)
    
    // 연결된 건물을 최대 3개로
    reduced.connectedBuildings = context.connectedBuildings.slice(0, 3)
    
    // 타운 상태는 요약만
    reduced.townState = {
      buildings: [],
      connections: [],
    }
    
    return reduced
  }
}
```

## 🧪 테스트 체크리스트

### AI 클라이언트 테스트
- [ ] Qwen API 연결 성공
- [ ] 재시도 로직 작동
- [ ] 타임아웃 처리
- [ ] 에러 핸들링
- [ ] 스트리밍 응답

### Stack Library 테스트
- [ ] 프로토콜 파싱 정확도
- [ ] 리소스 검색 기능
- [ ] 태그 필터링
- [ ] 정규식 패턴 매칭

### 프롬프트 시스템 테스트
- [ ] 템플릿 변수 치환
- [ ] 의도 분석 정확도
- [ ] 컨텍스트 빌딩
- [ ] 토큰 최적화

## 📝 Sprint 2.2 준비사항

### 전달할 인터페이스
```typescript
// 코드 생성기가 사용할 인터페이스
export interface CodeGenerator {
  generateForBuilding(building: Building, context: AIContext): Promise<GeneratedCode>
  validateCode(code: string, language: string): Promise<ValidationResult>
  formatCode(code: string, language: string): Promise<string>
}

// 검증 결과
export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    line: number
    column: number
    message: string
    severity: 'error' | 'warning'
  }>
}
```

## 🎯 완료 기준
- AI 클라이언트 구현 완료
- Stack Library 데이터 구조 완성
- 프롬프트 템플릿 시스템 작동
- 의도 분석 기능 구현
- 토큰 최적화 전략 적용

---

*Sprint 2.1이 완료되면 AI 서비스의 기반이 구축됩니다. 이제 실제 코드 생성 기능을 구현할 준비가 되었습니다.*