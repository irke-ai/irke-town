'use client'

import { Container, Graphics } from '@pixi/react'
import { useCallback, useState } from 'react'
import { Graphics as PixiGraphics } from 'pixi.js'
import { gridToScreen, GRID_CONFIG } from '@/lib/isometric'
import { useBuildingStore } from '@/stores/buildingStore'

interface CellInteractionLayerProps {
  onCellClick: (x: number, y: number) => void
  onCellHover: (x: number, y: number) => void
}

interface CellProps {
  x: number
  y: number
  isHovered: boolean
  onClick: () => void
  onHover: () => void
}

function Cell({ x, y, isHovered, onClick, onHover }: CellProps) {
  const isCellOccupied = useBuildingStore((state) => 
    state.isPositionOccupied(x, y, 1, 1)
  )
  
  const draw = useCallback((g: PixiGraphics) => {
    g.clear()
    
    const pos = gridToScreen(x, y)
    const halfWidth = GRID_CONFIG.cellWidth / 2
    const halfHeight = GRID_CONFIG.cellHeight / 2
    
    // 투명한 히트 영역
    g.beginFill(0x000000, 0.01)
    g.moveTo(pos.x, pos.y - halfHeight)
    g.lineTo(pos.x + halfWidth, pos.y)
    g.lineTo(pos.x, pos.y + halfHeight)
    g.lineTo(pos.x - halfWidth, pos.y)
    g.closePath()
    g.endFill()
    
    // 호버 효과
    if (isHovered) {
      g.lineStyle(2, 0x3b82f6, 1)
      g.beginFill(0x3b82f6, 0.2)
      g.moveTo(pos.x, pos.y - halfHeight)
      g.lineTo(pos.x + halfWidth, pos.y)
      g.lineTo(pos.x, pos.y + halfHeight)
      g.lineTo(pos.x - halfWidth, pos.y)
      g.closePath()
      g.endFill()
    }
  }, [x, y, isHovered, isCellOccupied])
  
  return (
    <Graphics
      draw={draw}
      interactive={!isCellOccupied}
      pointerover={onHover}
      pointerdown={onClick}
      cursor={isCellOccupied ? "default" : "pointer"}
    />
  )
}

export default function CellInteractionLayer({ onCellClick, onCellHover }: CellInteractionLayerProps) {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null)
  
  // 화면에 보이는 셀만 렌더링 (성능 최적화)
  const visibleCells = []
  const startX = Math.max(0, 20) // 중앙 근처만 렌더링
  const endX = Math.min(GRID_CONFIG.width, 30)
  const startY = Math.max(0, 20)
  const endY = Math.min(GRID_CONFIG.height, 30)
  
  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      visibleCells.push({ x, y })
    }
  }
  
  return (
    <Container>
      {visibleCells.map(({ x, y }) => (
        <Cell
          key={`${x}-${y}`}
          x={x}
          y={y}
          isHovered={hoveredCell?.x === x && hoveredCell?.y === y}
          onClick={() => {
            console.log('CellInteractionLayer - Cell clicked:', x, y)
            onCellClick(x, y)
          }}
          onHover={() => {
            setHoveredCell({ x, y })
            onCellHover(x, y)
          }}
        />
      ))}
    </Container>
  )
}