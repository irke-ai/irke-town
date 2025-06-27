# Sprint 1.2: 캔버스 시스템 구현 - 상세 구현 가이드

## 🎯 Sprint 목표
Pixi.js를 사용하여 아이소메트릭 캔버스를 구현하고, 50x50 그리드 시스템과 카메라 컨트롤을 완성합니다.

## 🛠️ 기술 스택 상세
- **Pixi.js 8.x**: WebGL 기반 2D 렌더링 엔진
- **@pixi/react 8.x**: React 통합 (v8 사용 - 최신)
- **아이소메트릭 투영**: 45도 각도의 2.5D 뷰

## 📋 Task 1: Pixi.js 통합

### 1.1 패키지 설치
```bash
# Pixi.js와 React 통합 패키지 설치
npm install pixi.js @pixi/react

# 타입 정의 (Pixi.js는 내장 타입 포함)
npm install --save-dev @types/offscreencanvas
```

### 1.2 Next.js 동적 임포트 설정
```typescript
// src/lib/dynamic.ts
// irke://stack/framework/nextjs/14/dynamic-import
import dynamic from 'next/dynamic'

// Pixi.js는 브라우저 환경에서만 작동하므로 SSR 비활성화
export const DynamicCanvas = dynamic(
  () => import('@/components/canvas/TownCanvas'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400">캔버스 로딩 중...</p>
      </div>
    )
  }
)
```

### 1.3 캔버스 컨테이너 컴포넌트 (src/components/canvas/CanvasContainer.tsx)
```typescript
// irke://component/canvas/container/base
'use client'

import { useUIStore } from '@/stores/uiStore'
import { DynamicCanvas } from '@/lib/dynamic'

export default function CanvasContainer() {
  const zoom = useUIStore((state) => state.zoom)
  const setZoom = useUIStore((state) => state.setZoom)

  const handleCellClick = (x: number, y: number) => {
    console.log('Cell clicked:', x, y)
    // Sprint 1.3에서 건물 배치 로직 추가
  }

  const handleCellHover = (x: number, y: number) => {
    // 호버 효과는 Canvas 내부에서 처리
  }

  return (
    <div className="w-full h-full relative">
      <DynamicCanvas
        zoom={zoom}
        onCellClick={handleCellClick}
        onCellHover={handleCellHover}
      />
      
      {/* 줌 컨트롤 */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2">
        <button
          onClick={() => setZoom(zoom + 0.1)}
          className="p-2 hover:bg-gray-100 rounded"
          title="확대"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          onClick={() => setZoom(zoom - 0.1)}
          className="p-2 hover:bg-gray-100 rounded"
          title="축소"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-2 hover:bg-gray-100 rounded"
          title="초기화"
        >
          <span className="text-sm">{Math.round(zoom * 100)}%</span>
        </button>
      </div>
    </div>
  )
}
```

## 📋 Task 2: 아이소메트릭 그리드

### 2.1 아이소메트릭 변환 유틸리티 (src/lib/isometric.ts)
```typescript
// irke://stack/math/isometric/transform
export const GRID_CONFIG = {
  width: 50,
  height: 50,
  cellWidth: 64,
  cellHeight: 32,
}

/**
 * 그리드 좌표를 아이소메트릭 화면 좌표로 변환
 */
export function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  const x = (gridX - gridY) * (GRID_CONFIG.cellWidth / 2)
  const y = (gridX + gridY) * (GRID_CONFIG.cellHeight / 2)
  return { x, y }
}

/**
 * 화면 좌표를 그리드 좌표로 변환
 */
export function screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
  const x = (screenX / (GRID_CONFIG.cellWidth / 2) + screenY / (GRID_CONFIG.cellHeight / 2)) / 2
  const y = (screenY / (GRID_CONFIG.cellHeight / 2) - screenX / (GRID_CONFIG.cellWidth / 2)) / 2
  
  return {
    x: Math.floor(x),
    y: Math.floor(y),
  }
}

/**
 * 그리드 좌표가 유효한지 확인
 */
export function isValidGridPosition(x: number, y: number): boolean {
  return x >= 0 && x < GRID_CONFIG.width && y >= 0 && y < GRID_CONFIG.height
}
```

### 2.2 메인 캔버스 컴포넌트 (src/components/canvas/TownCanvas.tsx)
```typescript
// irke://component/canvas/town/isometric
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Application, Container, Graphics, Text } from 'pixi.js'
import { Stage } from '@pixi/react'
import { GRID_CONFIG, gridToScreen, screenToGrid, isValidGridPosition } from '@/lib/isometric'
import GridLayer from './layers/GridLayer'
import InteractionLayer from './layers/InteractionLayer'

interface TownCanvasProps {
  zoom: number
  onCellClick: (x: number, y: number) => void
  onCellHover: (x: number, y: number) => void
}

export default function TownCanvas({ zoom, onCellClick, onCellHover }: TownCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // 캔버스 크기 자동 조정
  useEffect(() => {
    const updateDimensions = () => {
      if (stageRef.current) {
        setDimensions({
          width: stageRef.current.clientWidth,
          height: stageRef.current.clientHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return (
    <div ref={stageRef} className="w-full h-full">
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        options={{
          backgroundColor: 0xf3f4f6, // Tailwind gray-100
          antialias: true,
          resolution: window.devicePixelRatio || 1,
        }}
      >
        <Container
          scale={zoom}
          position={[dimensions.width / 2, dimensions.height / 4]}
        >
          <GridLayer />
          <InteractionLayer
            onCellClick={onCellClick}
            onCellHover={onCellHover}
          />
        </Container>
      </Stage>
    </div>
  )
}
```

### 2.3 그리드 레이어 (src/components/canvas/layers/GridLayer.tsx)
```typescript
// irke://component/canvas/layer/grid
import { Graphics } from '@pixi/react'
import { useCallback } from 'react'
import { Graphics as PixiGraphics } from 'pixi.js'
import { GRID_CONFIG, gridToScreen } from '@/lib/isometric'

export default function GridLayer() {
  const draw = useCallback((g: PixiGraphics) => {
    g.clear()
    
    // 그리드 라인 색상
    const lineColor = 0xd1d5db // Tailwind gray-300
    const lineAlpha = 0.5
    
    // 수평선 그리기 (실제로는 아이소메트릭 대각선)
    for (let y = 0; y <= GRID_CONFIG.height; y++) {
      g.lineStyle(1, lineColor, lineAlpha)
      
      const start = gridToScreen(0, y)
      const end = gridToScreen(GRID_CONFIG.width, y)
      
      g.moveTo(start.x, start.y)
      g.lineTo(end.x, end.y)
    }
    
    // 수직선 그리기 (실제로는 아이소메트릭 대각선)
    for (let x = 0; x <= GRID_CONFIG.width; x++) {
      g.lineStyle(1, lineColor, lineAlpha)
      
      const start = gridToScreen(x, 0)
      const end = gridToScreen(x, GRID_CONFIG.height)
      
      g.moveTo(start.x, start.y)
      g.lineTo(end.x, end.y)
    }
    
    // 그리드 중앙에 좌표 표시 (디버깅용)
    if (process.env.NODE_ENV === 'development') {
      for (let x = 0; x < GRID_CONFIG.width; x += 5) {
        for (let y = 0; y < GRID_CONFIG.height; y += 5) {
          const pos = gridToScreen(x, y)
          
          // 작은 점 표시
          g.lineStyle(0)
          g.beginFill(0x3b82f6, 0.3)
          g.drawCircle(pos.x, pos.y, 2)
          g.endFill()
        }
      }
    }
  }, [])

  return <Graphics draw={draw} />
}
```

### 2.4 인터랙션 레이어 (src/components/canvas/layers/InteractionLayer.tsx)
```typescript
// irke://component/canvas/layer/interaction
'use client'

import { Container, Graphics } from '@pixi/react'
import { useCallback, useState } from 'react'
import { Graphics as PixiGraphics, FederatedPointerEvent } from 'pixi.js'
import { screenToGrid, isValidGridPosition, gridToScreen, GRID_CONFIG } from '@/lib/isometric'

interface InteractionLayerProps {
  onCellClick: (x: number, y: number) => void
  onCellHover: (x: number, y: number) => void
}

export default function InteractionLayer({ onCellClick, onCellHover }: InteractionLayerProps) {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null)

  const handlePointerMove = useCallback((event: FederatedPointerEvent) => {
    const container = event.currentTarget as any
    const local = container.toLocal(event.global)
    const gridPos = screenToGrid(local.x, local.y)
    
    if (isValidGridPosition(gridPos.x, gridPos.y)) {
      setHoveredCell(gridPos)
      onCellHover(gridPos.x, gridPos.y)
    } else {
      setHoveredCell(null)
    }
  }, [onCellHover])

  const handlePointerDown = useCallback((event: FederatedPointerEvent) => {
    const container = event.currentTarget as any
    const local = container.toLocal(event.global)
    const gridPos = screenToGrid(local.x, local.y)
    
    if (isValidGridPosition(gridPos.x, gridPos.y)) {
      onCellClick(gridPos.x, gridPos.y)
    }
  }, [onCellClick])

  const drawHoverEffect = useCallback((g: PixiGraphics) => {
    g.clear()
    
    if (hoveredCell) {
      const pos = gridToScreen(hoveredCell.x, hoveredCell.y)
      
      // 호버된 셀 하이라이트
      g.lineStyle(2, 0x3b82f6, 1) // Primary color
      g.beginFill(0x3b82f6, 0.2)
      
      // 아이소메트릭 타일 그리기
      const halfWidth = GRID_CONFIG.cellWidth / 2
      const halfHeight = GRID_CONFIG.cellHeight / 2
      
      g.moveTo(pos.x, pos.y - halfHeight)
      g.lineTo(pos.x + halfWidth, pos.y)
      g.lineTo(pos.x, pos.y + halfHeight)
      g.lineTo(pos.x - halfWidth, pos.y)
      g.closePath()
      
      g.endFill()
    }
  }, [hoveredCell])

  const drawInteractionArea = useCallback((g: PixiGraphics) => {
    g.clear()
    
    // 전체 그리드를 덮는 투명한 인터랙션 영역
    const topLeft = gridToScreen(0, 0)
    const topRight = gridToScreen(GRID_CONFIG.width, 0)
    const bottomRight = gridToScreen(GRID_CONFIG.width, GRID_CONFIG.height)
    const bottomLeft = gridToScreen(0, GRID_CONFIG.height)
    
    g.beginFill(0x000000, 0.01) // 거의 투명
    g.moveTo(topLeft.x, topLeft.y - GRID_CONFIG.cellHeight / 2)
    g.lineTo(topRight.x + GRID_CONFIG.cellWidth / 2, topRight.y)
    g.lineTo(bottomRight.x, bottomRight.y + GRID_CONFIG.cellHeight / 2)
    g.lineTo(bottomLeft.x - GRID_CONFIG.cellWidth / 2, bottomLeft.y)
    g.closePath()
    g.endFill()
  }, [])

  return (
    <Container>
      {/* 인터랙션 영역 */}
      <Graphics
        draw={drawInteractionArea}
        interactive={true}
        pointermove={handlePointerMove}
        pointerdown={handlePointerDown}
        cursor="pointer"
      />
      {/* 호버 효과 */}
      <Graphics draw={drawHoverEffect} />
    </Container>
  )
}
```

## 📋 Task 3: 카메라 컨트롤

### 3.1 팬(드래그) 기능 추가 (src/components/canvas/TownCanvas.tsx 수정)
```typescript
// TownCanvas.tsx에 추가할 코드
import { useState, useRef } from 'react'

// 컴포넌트 내부에 추가
const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 })
const [isDragging, setIsDragging] = useState(false)
const dragStart = useRef({ x: 0, y: 0 })
const lastOffset = useRef({ x: 0, y: 0 })

const handlePointerDown = useCallback((event: FederatedPointerEvent) => {
  if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
    // 중간 버튼 또는 Shift+왼쪽 클릭으로 드래그 시작
    setIsDragging(true)
    dragStart.current = { x: event.global.x, y: event.global.y }
    lastOffset.current = viewOffset
  }
}, [viewOffset])

const handlePointerMove = useCallback((event: FederatedPointerEvent) => {
  if (isDragging) {
    const dx = event.global.x - dragStart.current.x
    const dy = event.global.y - dragStart.current.y
    
    setViewOffset({
      x: lastOffset.current.x + dx,
      y: lastOffset.current.y + dy,
    })
  }
}, [isDragging])

const handlePointerUp = useCallback(() => {
  setIsDragging(false)
}, [])

// Stage 컴포넌트에 이벤트 핸들러 추가
<Stage
  onPointerDown={handlePointerDown}
  onPointerMove={handlePointerMove}
  onPointerUp={handlePointerUp}
  onPointerUpOutside={handlePointerUp}
>
  <Container
    scale={zoom}
    position={[
      dimensions.width / 2 + viewOffset.x,
      dimensions.height / 4 + viewOffset.y
    ]}
  >
```

### 3.2 미니맵 컴포넌트 (src/components/canvas/Minimap.tsx)
```typescript
// irke://component/canvas/minimap/base
'use client'

import { useEffect, useRef } from 'react'
import { GRID_CONFIG } from '@/lib/isometric'

interface MinimapProps {
  viewOffset: { x: number; y: number }
  zoom: number
  onViewChange: (offset: { x: number; y: number }) => void
}

export default function Minimap({ viewOffset, zoom, onViewChange }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = 150

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 미니맵 그리기
    ctx.clearRect(0, 0, size, size)
    
    // 배경
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, size, size)
    
    // 그리드
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 0.5
    
    const cellSize = size / Math.max(GRID_CONFIG.width, GRID_CONFIG.height)
    
    for (let i = 0; i <= GRID_CONFIG.width; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellSize, 0)
      ctx.lineTo(i * cellSize, size)
      ctx.stroke()
    }
    
    for (let j = 0; j <= GRID_CONFIG.height; j++) {
      ctx.beginPath()
      ctx.moveTo(0, j * cellSize)
      ctx.lineTo(size, j * cellSize)
      ctx.stroke()
    }
    
    // 현재 뷰포트 표시
    const viewportSize = 50 / zoom
    const viewportX = size / 2 - (viewOffset.x / 10)
    const viewportY = size / 2 - (viewOffset.y / 10)
    
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.strokeRect(
      viewportX - viewportSize / 2,
      viewportY - viewportSize / 2,
      viewportSize,
      viewportSize
    )
  }, [viewOffset, zoom])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const offsetX = (size / 2 - x) * 10
    const offsetY = (size / 2 - y) * 10
    
    onViewChange({ x: offsetX, y: offsetY })
  }

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="cursor-pointer"
        onClick={handleClick}
      />
    </div>
  )
}
```

### 3.3 마우스 휠 줌 (src/components/canvas/CanvasContainer.tsx 수정)
```typescript
// CanvasContainer에 추가
useEffect(() => {
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(zoom + delta)
  }

  const canvasElement = document.querySelector('.pixi-canvas')
  if (canvasElement) {
    canvasElement.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      canvasElement.removeEventListener('wheel', handleWheel)
    }
  }
}, [zoom, setZoom])
```

## 📋 Task 4: 인터랙션 기초

### 4.1 좌표 표시 컴포넌트 (src/components/canvas/CoordinateDisplay.tsx)
```typescript
// irke://component/canvas/coordinate/display
interface CoordinateDisplayProps {
  gridX: number | null
  gridY: number | null
}

export default function CoordinateDisplay({ gridX, gridY }: CoordinateDisplayProps) {
  if (gridX === null || gridY === null) return null

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
      <p className="text-sm font-mono">
        Grid: ({gridX}, {gridY})
      </p>
    </div>
  )
}
```

### 4.2 디버그 모드 (src/components/canvas/DebugOverlay.tsx)
```typescript
// irke://component/canvas/debug/overlay
import { useUIStore } from '@/stores/uiStore'

export default function DebugOverlay() {
  const zoom = useUIStore((state) => state.zoom)
  
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white rounded p-2 text-xs font-mono">
      <p>Zoom: {(zoom * 100).toFixed(0)}%</p>
      <p>Grid: 50x50</p>
      <p>Cell: 64x32px</p>
      <p>FPS: 60</p>
    </div>
  )
}
```

## 🧪 테스트 체크리스트

### 실행 및 확인
```bash
npm run dev
# http://localhost:3000/town/test-id 접속
```

### 기능 확인
- [ ] 아이소메트릭 그리드 정상 표시
- [ ] 50x50 그리드 렌더링
- [ ] 마우스 호버 시 셀 하이라이트
- [ ] 클릭 시 좌표 콘솔 출력
- [ ] 줌 인/아웃 작동 (50%-200%)
- [ ] 마우스 휠 줌 작동
- [ ] Shift+드래그로 팬 이동
- [ ] 미니맵 표시 및 클릭 이동
- [ ] 60 FPS 유지

## 📝 Sprint 1.3 준비사항

### 전달할 인터페이스
```typescript
// 건물 배치를 위한 인터페이스
export interface GridPosition {
  x: number
  y: number
}

export interface CanvasInteraction {
  onCellHover: (pos: GridPosition) => void
  onCellClick: (pos: GridPosition) => void
  onBuildingPlace: (type: string, pos: GridPosition) => void
}

// 건물 렌더링을 위한 인터페이스
export interface BuildingSprite {
  id: string
  type: 'api' | 'database' | 'frontend'
  gridPosition: GridPosition
  pixelPosition: { x: number; y: number }
  size: { width: number; height: number }
}
```

## 🎯 완료 기준
- Pixi.js 통합 완료
- 아이소메트릭 그리드 시스템 작동
- 카메라 컨트롤 (줌, 팬, 미니맵) 구현
- 좌표 변환 시스템 정확성
- 인터랙션 이벤트 처리
- 성능 목표 달성 (60 FPS)

## 💡 최적화 팁
1. **Pixi.js 최적화**
   - 정적 요소는 `cacheAsBitmap` 사용
   - 불필요한 다시 그리기 방지
   - 화면 밖 객체 렌더링 제외

2. **React 최적화**
   - `useCallback`으로 함수 재생성 방지
   - `useMemo`로 계산 결과 캐싱
   - 불필요한 상태 업데이트 최소화

---

*이 가이드를 따라 Sprint 1.2를 구현하세요. 아이소메트릭 캔버스는 IRKE TOWN의 핵심 요소입니다.*