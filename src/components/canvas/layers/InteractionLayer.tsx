'use client'

import { Container, Graphics } from '@pixi/react'
import { useCallback, useState, useEffect } from 'react'
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
    
    console.log('Mouse move:', { local, gridPos })
    
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
    
    // 전체 그리드를 덮는 투명한 인터랙션 영역 (더 큰 영역)
    const padding = 1000
    g.beginFill(0x000000, 0.01)
    g.drawRect(-padding, -padding, padding * 2, padding * 2)
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