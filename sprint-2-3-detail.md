# Sprint 2.3: 컨텍스트 관리 - 상세 구현 가이드

## 🎯 Sprint 목표
AI 대화 인터페이스를 구현하고, 사용자와 AI 간의 대화 컨텍스트를 효과적으로 관리하는 시스템을 구축합니다.

## 🛠️ 핵심 구현 사항
- AI 대화 UI 컴포넌트
- 건물 선택 연동 시스템
- 메시지 히스토리 관리
- 동적 프롬프트 생성
- 실시간 코드 생성 피드백

## 📋 Task 1: AI 대화 UI

### 1.1 AI 채팅 컴포넌트 (src/components/ai/AIChat.tsx)
```typescript
// irke://component/ai/chat/main
'use client'

import { useState, useRef, useEffect } from 'react'
import { useTownStore } from '@/stores/townStore'
import { useAIStore } from '@/stores/aiStore'
import { Building } from '@/types/building'
import { Message } from '@/services/ai/types'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import BuildingContext from './BuildingContext'
import CodePreview from './CodePreview'
import { AIService } from '@/services/ai/service'

interface AIChatProps {
  className?: string
}

export default function AIChat({ className = '' }: AIChatProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const selectedBuildingId = useTownStore((state) => state.selectedBuildingId)
  const buildings = useTownStore((state) => state.buildings)
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
  
  const { messages, addMessage, clearMessages, currentCode } = useAIStore()
  const aiService = useRef(new AIService())

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 메시지 전송
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      metadata: {
        buildingId: selectedBuildingId,
      },
    }
    addMessage(userMessage)
    
    setIsLoading(true)
    setError(null)

    try {
      // AI 응답 요청
      const response = await aiService.current.chat(content, {
        selectedBuilding,
        buildings,
        messages,
      })

      // AI 응답 추가
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: {
          buildingId: selectedBuildingId,
          codeGenerated: !!response.codeGenerated,
        },
      }
      addMessage(aiMessage)

      // 코드가 생성된 경우 저장
      if (response.codeGenerated) {
        useAIStore.getState().setCurrentCode(response.codeGenerated)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      
      // 에러 메시지 추가
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.',
        timestamp: new Date(),
        metadata: {
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      }
      addMessage(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 빠른 액션
  const quickActions = [
    { label: 'API 생성', prompt: 'REST API 엔드포인트를 만들어줘' },
    { label: '스키마 생성', prompt: '데이터베이스 스키마를 생성해줘' },
    { label: 'UI 생성', prompt: '이 데이터를 표시할 UI 컴포넌트를 만들어줘' },
    { label: '버그 수정', prompt: '현재 에러를 해결해줘' },
  ]

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* 헤더 */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">AI Assistant</h3>
          <button
            onClick={clearMessages}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            대화 초기화
          </button>
        </div>
        
        {/* 선택된 건물 컨텍스트 */}
        {selectedBuilding && (
          <BuildingContext building={selectedBuilding} className="mt-2" />
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} isLoading={isLoading} />
        
        {/* 코드 미리보기 */}
        {currentCode && (
          <div className="px-4 py-2 border-t">
            <CodePreview code={currentCode} onApply={() => {
              // TODO: 코드 적용 로직
              console.log('Applying generated code...')
            }} />
          </div>
        )}
        
        {error && (
          <div className="px-4 py-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 빠른 액션 */}
      {!selectedBuilding && messages.length === 0 && (
        <div className="px-4 py-3 border-t">
          <p className="text-sm text-gray-500 mb-2">시작하려면 건물을 선택하거나 질문해보세요:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleSendMessage(action.prompt)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={isLoading}
        placeholder={
          selectedBuilding
            ? `${selectedBuilding.name}에 대해 물어보세요...`
            : 'AI에게 물어보세요...'
        }
      />
    </div>
  )
}
```

### 1.2 메시지 리스트 컴포넌트 (src/components/ai/MessageList.tsx)
```typescript
// irke://component/ai/chat/messages
import { Message } from '@/services/ai/types'
import MessageItem from './MessageItem'

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="flex-1 p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <p className="text-lg mb-2">👋 안녕하세요!</p>
          <p className="text-sm">
            건물을 선택하고 AI와 대화를 시작해보세요.
          </p>
        </div>
      )}
      
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      
      {isLoading && (
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
            AI
          </div>
          <div className="flex-1">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 1.3 메시지 아이템 컴포넌트 (src/components/ai/MessageItem.tsx)
```typescript
// irke://component/ai/chat/message-item
import { Message } from '@/services/ai/types'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface MessageItemProps {
  message: Message
}

export default function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* 아바타 */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium
        ${isUser ? 'bg-gray-600' : 'bg-primary'}
      `}>
        {isUser ? 'U' : 'AI'}
      </div>
      
      {/* 메시지 내용 */}
      <div className="flex-1 max-w-[80%]">
        <div className={`
          rounded-lg p-3
          ${isUser ? 'bg-gray-100' : 'bg-blue-50'}
        `}>
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          
          {/* 메타데이터 */}
          {message.metadata?.codeGenerated && (
            <div className="mt-2 flex items-center text-xs text-blue-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              코드 생성됨
            </div>
          )}
          
          {message.metadata?.error && (
            <div className="mt-2 text-xs text-red-600">
              ⚠️ 오류 발생
            </div>
          )}
        </div>
        
        {/* 시간 표시 */}
        <div className="mt-1 text-xs text-gray-400">
          {formatDistanceToNow(message.timestamp, { 
            addSuffix: true,
            locale: ko 
          })}
        </div>
      </div>
    </div>
  )
}
```

### 1.4 메시지 입력 컴포넌트 (src/components/ai/MessageInput.tsx)
```typescript
// irke://component/ai/chat/input
import { useState, useRef, KeyboardEvent } from 'react'

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function MessageInput({ onSend, disabled, placeholder }: MessageInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input)
      setInput('')
      
      // 텍스트 영역 크기 초기화
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 자동 높이 조절
  const adjustHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }

  return (
    <div className="border-t px-4 py-3">
      <div className="flex items-end space-x-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            adjustHeight()
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'AI에게 메시지를 입력하세요...'}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 
                     focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50
                     min-h-[40px] max-h-[200px]"
        />
        
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      
      <div className="mt-1 text-xs text-gray-400">
        Shift + Enter로 줄바꿈
      </div>
    </div>
  )
}
```

## 📋 Task 2: 건물 선택 연동

### 2.1 건물 컨텍스트 표시 (src/components/ai/BuildingContext.tsx)
```typescript
// irke://component/ai/building/context
import { Building } from '@/types/building'
import { BUILDING_TYPES } from '@/types/building'
import { useTownStore } from '@/stores/townStore'

interface BuildingContextProps {
  building: Building
  className?: string
}

export default function BuildingContext({ building, className = '' }: BuildingContextProps) {
  const connections = useTownStore((state) => state.connections)
  const buildings = useTownStore((state) => state.buildings)
  
  const buildingType = BUILDING_TYPES[building.type]
  
  // 연결된 건물 찾기
  const connectedBuildings = connections
    .filter(c => c.fromBuildingId === building.id || c.toBuildingId === building.id)
    .map(c => {
      const connectedId = c.fromBuildingId === building.id ? c.toBuildingId : c.fromBuildingId
      return buildings.find(b => b.id === connectedId)
    })
    .filter(Boolean) as Building[]

  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{buildingType.icon}</div>
        <div className="flex-1">
          <h4 className="font-medium">{building.name}</h4>
          <p className="text-xs text-gray-500">{buildingType.description}</p>
        </div>
      </div>
      
      {connectedBuildings.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">연결된 건물:</p>
          <div className="flex flex-wrap gap-1">
            {connectedBuildings.map(b => (
              <span key={b.id} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-white rounded text-xs">
                <span>{BUILDING_TYPES[b.type].icon}</span>
                <span>{b.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

### 2.2 코드 프리뷰 컴포넌트 (src/components/ai/CodePreview.tsx)
```typescript
// irke://component/ai/code/preview
import { useState } from 'react'
import { GeneratedCode } from '@/services/ai/types'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodePreviewProps {
  code: GeneratedCode
  onApply: () => void
}

export default function CodePreview({ code, onApply }: CodePreviewProps) {
  const [selectedFile, setSelectedFile] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  
  if (!code.files || code.files.length === 0) return null
  
  const currentFile = code.files[selectedFile]

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gray-800 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="text-sm text-gray-300">코드 생성 완료</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white p-1"
          >
            {isExpanded ? '축소' : '확장'}
          </button>
          <button
            onClick={onApply}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            적용
          </button>
        </div>
      </div>
      
      {/* 파일 탭 */}
      {code.files.length > 1 && (
        <div className="bg-gray-800 border-t border-gray-700 px-3 flex space-x-1 overflow-x-auto">
          {code.files.map((file, index) => (
            <button
              key={index}
              onClick={() => setSelectedFile(index)}
              className={`px-3 py-2 text-sm whitespace-nowrap ${
                selectedFile === index
                  ? 'bg-gray-900 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {file.path.split('/').pop()}
            </button>
          ))}
        </div>
      )}
      
      {/* 코드 영역 */}
      <div className={`overflow-auto ${isExpanded ? 'max-h-[600px]' : 'max-h-[300px]'}`}>
        <div className="text-xs text-gray-500 px-4 py-2 bg-gray-850">
          {currentFile.path}
        </div>
        <SyntaxHighlighter
          language={currentFile.language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
          }}
          showLineNumbers
        >
          {currentFile.content}
        </SyntaxHighlighter>
      </div>
      
      {/* 푸터 정보 */}
      {code.dependencies && code.dependencies.length > 0 && (
        <div className="bg-gray-800 border-t border-gray-700 px-3 py-2">
          <p className="text-xs text-gray-400">
            의존성: {code.dependencies.join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
```

## 📋 Task 3: AI 스토어 및 서비스

### 3.1 AI 스토어 (src/stores/aiStore.ts)
```typescript
// irke://stack/state/zustand/ai
import { create } from 'zustand'
import { Message, GeneratedCode } from '@/services/ai/types'

interface AIStore {
  // 대화 히스토리
  messages: Message[]
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  clearMessages: () => void
  
  // 현재 생성된 코드
  currentCode: GeneratedCode | null
  setCurrentCode: (code: GeneratedCode | null) => void
  
  // 제안사항
  suggestions: string[]
  setSuggestions: (suggestions: string[]) => void
  
  // 대화 상태
  isProcessing: boolean
  setProcessing: (processing: boolean) => void
  
  // 의도 추적
  lastIntent: string | null
  setLastIntent: (intent: string | null) => void
}

export const useAIStore = create<AIStore>((set) => ({
  messages: [],
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map(msg =>
      msg.id === id ? { ...msg, ...updates } : msg
    ),
  })),
  
  clearMessages: () => set({
    messages: [],
    currentCode: null,
    suggestions: [],
    lastIntent: null,
  }),
  
  currentCode: null,
  setCurrentCode: (code) => set({ currentCode: code }),
  
  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),
  
  isProcessing: false,
  setProcessing: (processing) => set({ isProcessing: processing }),
  
  lastIntent: null,
  setLastIntent: (intent) => set({ lastIntent: intent }),
}))
```

### 3.2 AI 서비스 통합 (src/services/ai/service.ts)
```typescript
// irke://stack/ai/service/main
import { Building, Connection } from '@/types'
import { Message, GeneratedCode, Intent } from './types'
import { QwenClient } from './client'
import { PromptTemplateManager } from './prompts/manager'
import { ContextBuilder } from './context/builder'
import { IntentAnalyzer } from './intent/analyzer'
import { PromptOptimizer } from './optimization/prompt'
import { ApiCodeGenerator } from './generators/api'
import { DatabaseCodeGenerator } from './generators/database'
import { FrontendCodeGenerator } from './generators/frontend'
import { CodeValidator } from './validation/validator'
import { CodeFormatter } from './formatting/formatter'

export interface ChatOptions {
  selectedBuilding?: Building
  buildings: Building[]
  connections?: Connection[]
  messages: Message[]
}

export interface ChatResponse {
  message: string
  codeGenerated?: GeneratedCode
  intent: Intent
  suggestions?: string[]
}

export class AIService {
  private client: QwenClient
  private templateManager: PromptTemplateManager
  private contextBuilder: ContextBuilder
  private intentAnalyzer: IntentAnalyzer
  private promptOptimizer: PromptOptimizer
  private validator: CodeValidator
  private formatter: CodeFormatter

  constructor() {
    this.client = new QwenClient()
    this.templateManager = new PromptTemplateManager()
    this.contextBuilder = new ContextBuilder()
    this.intentAnalyzer = new IntentAnalyzer()
    this.promptOptimizer = new PromptOptimizer()
    this.validator = new CodeValidator()
    this.formatter = new CodeFormatter()
  }

  async chat(userMessage: string, options: ChatOptions): Promise<ChatResponse> {
    // 1. 의도 분석
    const intent = this.intentAnalyzer.analyze(userMessage)
    
    // 2. 컨텍스트 구축
    const context = await this.contextBuilder.buildContext({
      selectedBuilding: options.selectedBuilding,
      buildings: options.buildings,
      connections: options.connections || [],
      projectType: 'fullstack', // TODO: 프로젝트 설정에서 가져오기
      techStack: ['Next.js', 'TypeScript', 'PostgreSQL'], // TODO: 프로젝트 설정에서 가져오기
      conversationHistory: options.messages,
    })
    
    // 3. 코드 생성이 필요한지 판단
    const needsCodeGeneration = this.shouldGenerateCode(intent, context)
    
    if (needsCodeGeneration && context.selectedBuilding) {
      // 코드 생성 처리
      return this.handleCodeGeneration(userMessage, intent, context)
    } else {
      // 일반 대화 처리
      return this.handleGeneralChat(userMessage, intent, context)
    }
  }

  private shouldGenerateCode(intent: Intent, context: any): boolean {
    // 코드 생성이 필요한 의도들
    const codeGenerationIntents = ['create', 'update', 'fix', 'optimize']
    
    return (
      codeGenerationIntents.includes(intent.type) &&
      context.selectedBuilding &&
      intent.confidence > 0.7
    )
  }

  private async handleCodeGeneration(
    userMessage: string,
    intent: Intent,
    context: any
  ): Promise<ChatResponse> {
    const building = context.selectedBuilding
    let generator

    // 건물 타입별 생성기 선택
    switch (building.type) {
      case 'api':
        generator = new ApiCodeGenerator()
        break
      case 'database':
        generator = new DatabaseCodeGenerator()
        break
      case 'frontend':
        generator = new FrontendCodeGenerator()
        break
      default:
        throw new Error(`Unsupported building type: ${building.type}`)
    }

    try {
      // 코드 생성
      const generatedCode = await generator.generateCode(building, context)
      
      // 검증
      const validationResult = this.validator.validateFiles(generatedCode.files)
      
      // 포맷팅
      generatedCode.files = await this.formatter.formatFiles(generatedCode.files)
      
      // 응답 메시지 생성
      const message = this.generateCodeResponseMessage(
        building,
        generatedCode,
        validationResult.warnings
      )
      
      // 다음 작업 제안
      const suggestions = this.generateSuggestions(building, intent, context)

      return {
        message,
        codeGenerated: generatedCode,
        intent,
        suggestions,
      }
    } catch (error) {
      console.error('Code generation error:', error)
      
      return {
        message: `코드 생성 중 오류가 발생했습니다: ${error.message}\n\n다시 시도하거나 더 구체적인 요구사항을 알려주세요.`,
        intent,
      }
    }
  }

  private async handleGeneralChat(
    userMessage: string,
    intent: Intent,
    context: any
  ): Promise<ChatResponse> {
    // 시스템 프롬프트
    const systemPrompt = `You are an AI assistant for IRKE TOWN, a visual programming platform.
You help users build web applications by placing and connecting buildings.
Be helpful, concise, and guide users through the town-building process.
${context.selectedBuilding ? `Currently selected building: ${context.selectedBuilding.name} (${context.selectedBuilding.type})` : ''}
Available building types: API Gateway, Database, Frontend Page`

    // 프롬프트 최적화
    const { optimizedSystem, optimizedUser } = this.promptOptimizer.optimizePrompt(
      systemPrompt,
      userMessage,
      context
    )

    // AI 호출
    const response = await this.client.chat([
      { role: 'system', content: optimizedSystem },
      ...context.conversationHistory.map(msg => ({
        role: msg.role as any,
        content: msg.content,
      })),
      { role: 'user', content: optimizedUser },
    ])

    const suggestions = this.generateSuggestions(context.selectedBuilding, intent, context)

    return {
      message: response.choices[0].message.content,
      intent,
      suggestions,
    }
  }

  private generateCodeResponseMessage(
    building: Building,
    code: GeneratedCode,
    warnings: any[]
  ): string {
    const lines = [
      `✅ ${building.name}의 코드를 생성했습니다!`,
      '',
      `📁 생성된 파일 (${code.files.length}개):`,
      ...code.files.map(f => `  • ${f.path}`),
    ]

    if (code.dependencies && code.dependencies.length > 0) {
      lines.push('', `📦 필요한 패키지:`, `  npm install ${code.dependencies.join(' ')}`)
    }

    if (warnings.length > 0) {
      lines.push('', `⚠️ 주의사항:`)
      warnings.forEach(w => {
        lines.push(`  • ${w.message}`)
      })
    }

    if (code.instructions) {
      lines.push('', `📝 사용 방법:`, code.instructions)
    }

    return lines.join('\n')
  }

  private generateSuggestions(
    building: Building | undefined,
    intent: Intent,
    context: any
  ): string[] {
    const suggestions: string[] = []

    if (!building) {
      suggestions.push('건물을 선택하여 코드를 생성해보세요')
      suggestions.push('새 건물을 추가해보세요')
      return suggestions
    }

    // 건물 타입별 제안
    switch (building.type) {
      case 'api':
        if (!context.connectedBuildings.some((b: Building) => b.type === 'database')) {
          suggestions.push('데이터베이스를 연결하여 데이터 저장 기능을 추가하세요')
        }
        suggestions.push('API 엔드포인트에 인증을 추가해보세요')
        suggestions.push('Swagger 문서를 생성해보세요')
        break

      case 'database':
        if (!context.connectedBuildings.some((b: Building) => b.type === 'api')) {
          suggestions.push('API Gateway를 연결하여 데이터 접근 인터페이스를 만드세요')
        }
        suggestions.push('샘플 데이터를 추가해보세요')
        suggestions.push('인덱스를 최적화해보세요')
        break

      case 'frontend':
        if (!context.connectedBuildings.some((b: Building) => b.type === 'api')) {
          suggestions.push('API를 연결하여 동적 데이터를 표시하세요')
        }
        suggestions.push('반응형 디자인을 개선해보세요')
        suggestions.push('로딩 상태를 추가해보세요')
        break
    }

    // 의도별 추가 제안
    if (intent.type === 'create') {
      suggestions.push('생성된 코드를 테스트해보세요')
    } else if (intent.type === 'fix') {
      suggestions.push('에러 로그를 확인해보세요')
    }

    return suggestions.slice(0, 3) // 최대 3개
  }

  // 스트리밍 응답 (향후 구현)
  async *chatStream(userMessage: string, options: ChatOptions): AsyncGenerator<string> {
    // TODO: 스트리밍 구현
    yield 'Streaming not implemented yet'
  }
}
```

## 📋 Task 4: 동적 프롬프트 생성

### 4.1 프롬프트 헤드 생성기 (src/services/ai/prompts/head.ts)
```typescript
// irke://prompt/dynamic/head
import { Building } from '@/types'
import { AIContext } from '../types'

export class PromptHeadGenerator {
  generateForBuilding(building: Building, context: AIContext): string {
    const heads: Record<string, () => string> = {
      api: () => this.generateAPIHead(building, context),
      database: () => this.generateDatabaseHead(building, context),
      frontend: () => this.generateFrontendHead(building, context),
    }

    const generator = heads[building.type]
    return generator ? generator() : this.generateDefaultHead(building, context)
  }

  private generateAPIHead(building: Building, context: AIContext): string {
    const connectedDb = context.connectedBuildings.find(b => b.type === 'database')
    const connectedFrontend = context.connectedBuildings.find(b => b.type === 'frontend')

    const sections = [
      `You are working on an API Gateway building named "${building.name}".`,
      `Position in town: (${building.position.x}, ${building.position.y})`,
    ]

    if (connectedDb) {
      sections.push(`Connected Database: ${connectedDb.name} - Use this for data persistence`)
    }

    if (connectedFrontend) {
      sections.push(`Connected Frontend: ${connectedFrontend.name} - This will consume your API`)
    }

    sections.push(
      `Tech Stack: ${context.techStack.join(', ')}`,
      `API Style: RESTful with JSON responses`,
      `Focus on: Error handling, validation, and proper HTTP status codes`
    )

    return sections.join('\n')
  }

  private generateDatabaseHead(building: Building, context: AIContext): string {
    const connectedApis = context.connectedBuildings.filter(b => b.type === 'api')
    
    const sections = [
      `You are working on a Database building named "${building.name}".`,
      `Position in town: (${building.position.x}, ${building.position.y})`,
      `Database Type: ${this.detectDatabaseType(context)}`,
    ]

    if (connectedApis.length > 0) {
      sections.push(`Connected APIs: ${connectedApis.map(a => a.name).join(', ')}`)
      sections.push(`Design schema to support these API requirements`)
    }

    sections.push(
      `Focus on: Normalization, indexes, and data integrity`,
      `Include: Primary keys, foreign keys, and constraints`
    )

    return sections.join('\n')
  }

  private generateFrontendHead(building: Building, context: AIContext): string {
    const connectedApis = context.connectedBuildings.filter(b => b.type === 'api')
    
    const sections = [
      `You are working on a Frontend Page building named "${building.name}".`,
      `Position in town: (${building.position.x}, ${building.position.y})`,
      `UI Framework: React with ${context.techStack.includes('Next.js') ? 'Next.js' : 'Create React App'}`,
      `Styling: Tailwind CSS`,
    ]

    if (connectedApis.length > 0) {
      sections.push(`Connected APIs: ${connectedApis.map(a => a.name).join(', ')}`)
      sections.push(`Implement API calls with proper error handling`)
    }

    sections.push(
      `Focus on: User experience, accessibility, and responsive design`,
      `Include: Loading states, error boundaries, and form validation`
    )

    return sections.join('\n')
  }

  private generateDefaultHead(building: Building, context: AIContext): string {
    return `You are working on a ${building.type} building named "${building.name}".
Position: (${building.position.x}, ${building.position.y})
Tech Stack: ${context.techStack.join(', ')}
Connected Buildings: ${context.connectedBuildings.map(b => `${b.name} (${b.type})`).join(', ') || 'None'}
`
  }

  private detectDatabaseType(context: AIContext): string {
    const stack = context.techStack.join(' ').toLowerCase()
    
    if (stack.includes('postgresql')) return 'PostgreSQL'
    if (stack.includes('mysql')) return 'MySQL'
    if (stack.includes('mongodb')) return 'MongoDB'
    
    return 'PostgreSQL' // default
  }
}
```

### 4.2 컨텍스트 압축기 (src/services/ai/optimization/compressor.ts)
```typescript
// irke://stack/ai/optimization/context
import { AIContext, Message } from '../types'
import { TokenCounter } from '../tokens/counter'

export class ContextCompressor {
  private maxTokens = 2000

  compressContext(context: AIContext): AIContext {
    // 토큰 수 계산
    const currentTokens = this.calculateTokens(context)
    
    if (currentTokens <= this.maxTokens) {
      return context
    }

    // 압축이 필요한 경우
    return this.performCompression(context)
  }

  private calculateTokens(context: AIContext): number {
    let total = 0
    
    // 대화 히스토리
    context.conversationHistory.forEach(msg => {
      total += TokenCounter.estimate(msg.content)
    })
    
    // 건물 정보
    if (context.selectedBuilding) {
      total += TokenCounter.estimate(JSON.stringify(context.selectedBuilding))
    }
    
    // 연결된 건물
    context.connectedBuildings.forEach(building => {
      total += TokenCounter.estimate(JSON.stringify(building))
    })
    
    return total
  }

  private performCompression(context: AIContext): AIContext {
    const compressed = { ...context }
    
    // 1. 대화 히스토리 압축 (최근 N개만)
    if (compressed.conversationHistory.length > 5) {
      compressed.conversationHistory = [
        ...this.summarizeOldMessages(compressed.conversationHistory.slice(0, -5)),
        ...compressed.conversationHistory.slice(-5),
      ]
    }
    
    // 2. 타운 상태 요약
    compressed.townState = {
      buildings: [], // 전체 목록 대신 개수만
      connections: [],
      summary: {
        totalBuildings: context.townState.buildings.length,
        totalConnections: context.townState.connections.length,
        buildingTypes: this.countBuildingTypes(context.townState.buildings),
      },
    }
    
    // 3. 연결된 건물 정보 간소화
    compressed.connectedBuildings = compressed.connectedBuildings.map(b => ({
      ...b,
      // 필수 정보만 유지
      config: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    }))
    
    return compressed
  }

  private summarizeOldMessages(messages: Message[]): Message[] {
    if (messages.length === 0) return []
    
    // 오래된 메시지들을 하나의 요약 메시지로
    const summary: Message = {
      id: 'summary-' + Date.now(),
      role: 'system',
      content: `Previous conversation summary (${messages.length} messages): User asked about building configuration and code generation. AI provided assistance.`,
      timestamp: new Date(),
    }
    
    return [summary]
  }

  private countBuildingTypes(buildings: any[]): Record<string, number> {
    const counts: Record<string, number> = {}
    
    buildings.forEach(building => {
      counts[building.type] = (counts[building.type] || 0) + 1
    })
    
    return counts
  }
}
```

## 🧪 테스트 체크리스트

### UI 테스트
- [ ] AI 채팅 인터페이스 표시
- [ ] 메시지 송수신 작동
- [ ] 건물 선택 시 컨텍스트 표시
- [ ] 코드 프리뷰 및 구문 강조
- [ ] 로딩 상태 표시

### 통합 테스트
- [ ] 건물 선택 → AI 컨텍스트 반영
- [ ] 코드 생성 요청 → 프리뷰 표시
- [ ] 대화 히스토리 유지
- [ ] 에러 처리 및 복구

### 성능 테스트
- [ ] 긴 대화 시 성능 유지
- [ ] 컨텍스트 압축 작동
- [ ] 응답 시간 < 5초

## 📝 Phase 3 준비사항

### 전달할 인터페이스
```typescript
// GitHub 통합을 위한 인터페이스
export interface GitHubIntegration {
  authenticate(): Promise<boolean>
  createRepository(name: string, isPrivate: boolean): Promise<Repository>
  pushCode(repo: string, files: CodeFile[]): Promise<boolean>
}

// 코드 동기화
export interface CodeSyncManager {
  townToCode(townState: TownState): FileStructure
  codeToTown(files: FileStructure): Partial<TownState>
  generateCommitMessage(changes: Change[]): string
}
```

## 🎯 완료 기준
- AI 채팅 UI 완성
- 건물 선택 연동 작동
- 컨텍스트 기반 대화
- 코드 생성 및 프리뷰
- 동적 프롬프트 생성

---

*Sprint 2.3이 완료되면 사용자는 AI와 자연스럽게 대화하며 코드를 생성할 수 있습니다. Phase 2가 완료되었습니다!*