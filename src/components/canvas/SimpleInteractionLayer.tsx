'use client'

import { Container, Graphics } from '@pixi/react'
import { useCallback, useState } from 'react'
import { Graphics as PixiGraphics, FederatedPointerEvent } from 'pixi.js'
import { screenToGrid, isValidGridPosition, gridToScreen, GRID_CONFIG } from '@/lib/isometric'

interface SimpleInteractionLayerProps {
  onCellClick: (x: number, y: number) => void
  onCellHover: (x: number, y: number) => void
}

export default function SimpleInteractionLayer({ onCellClick, onCellHover }: SimpleInteractionLayerProps) {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null)

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

  const handleInteraction = useCallback((g: PixiGraphics) => {
    g.clear()
    g.beginFill(0xffffff, 0.01)
    g.drawRect(-2000, -2000, 4000, 4000)
    g.endFill()
  }, [])

  return (
    <Container
      interactive={true}
      onmousemove={(e: FederatedPointerEvent) => {
        const local = e.data.getLocalPosition(e.currentTarget)
        const gridPos = screenToGrid(local.x, local.y)
        
        if (isValidGridPosition(gridPos.x, gridPos.y)) {
          setHoveredCell(gridPos)
          onCellHover(gridPos.x, gridPos.y)
        } else {
          setHoveredCell(null)
        }
      }}
      onclick={(e: FederatedPointerEvent) => {
        const local = e.data.getLocalPosition(e.currentTarget)
        const gridPos = screenToGrid(local.x, local.y)
        
        if (isValidGridPosition(gridPos.x, gridPos.y)) {
          onCellClick(gridPos.x, gridPos.y)
        }
      }}
    >
      <Graphics draw={handleInteraction} />
      <Graphics draw={drawHoverEffect} />
    </Container>
  )
}