'use client'

import React, { useCallback, useState } from 'react'
import { Container, Graphics } from '@pixi/react'
import { useBuildingStore } from '@/stores/buildingStore'
import { gridToScreen, screenToGrid, GRID_CONFIG } from '@/lib/isometric'
import { Graphics as PixiGraphics } from 'pixi.js'

interface CellInteractionLayerProps {
  onCellClick: (gridX: number, gridY: number) => void
  onCellHover: (gridX: number, gridY: number) => void
}

interface CellProps {
  x: number
  y: number
  isHovered: boolean
  onClick: () => void
  onHover: () => void
  hasBuilding: boolean
}

function Cell({ x, y, isHovered, onClick, onHover, hasBuilding }: CellProps) {
  const draw = useCallback((g: PixiGraphics) => {
    g.clear()
    
    const pos = gridToScreen(x, y)
    const halfWidth = GRID_CONFIG.cellWidth / 2
    const halfHeight = GRID_CONFIG.cellHeight / 2
    
    // 건물이 없는 셀만 투명한 히트 영역 생성
    if (!hasBuilding) {
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
    }
  }, [x, y, isHovered, hasBuilding])
  
  // 건물이 있는 셀은 interactive하지 않음
  if (hasBuilding) {
    return <Graphics draw={draw} />
  }
  
  return (
    <Graphics
      draw={draw}
      eventMode="static"
      pointerover={onHover}
      pointerdown={onClick}
      cursor="pointer"
    />
  )
}

const CellInteractionLayerImproved: React.FC<CellInteractionLayerProps> = ({
  onCellClick,
  onCellHover
}) => {
  const buildings = useBuildingStore((state) => state.buildings)
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null)

  // 해당 그리드 위치에 건물이 있는지 확인
  const hasBuildingAt = useCallback((gridX: number, gridY: number) => {
    return buildings.some(building => {
      return (
        gridX >= building.gridX &&
        gridX < building.gridX + building.width &&
        gridY >= building.gridY &&
        gridY < building.gridY + building.height
      )
    })
  }, [buildings])

  const handleCellClick = useCallback((x: number, y: number) => {
    if (!hasBuildingAt(x, y)) {
      console.log('CellInteractionLayerImproved - Cell clicked:', x, y)
      onCellClick(x, y)
    }
  }, [onCellClick, hasBuildingAt])

  const handleCellHover = useCallback((x: number, y: number) => {
    if (!hasBuildingAt(x, y)) {
      setHoveredCell({ x, y })
      onCellHover(x, y)
    }
  }, [onCellHover, hasBuildingAt])

  const visibleCells = []
  const startX = Math.max(0, 20)
  const endX = Math.min(GRID_CONFIG.width, 30)
  const startY = Math.max(0, 20)
  const endY = Math.min(GRID_CONFIG.height, 30)
  
  for (let x = startX; x < endX; x++) {
    for (let y = startY; y < endY; y++) {
      visibleCells.push({ x, y })
    }
  }

  return (
    <Container zIndex={50}>
      {visibleCells.map(({ x, y }) => (
        <Cell
          key={`${x}-${y}`}
          x={x}
          y={y}
          isHovered={hoveredCell?.x === x && hoveredCell?.y === y}
          onClick={() => handleCellClick(x, y)}
          onHover={() => handleCellHover(x, y)}
          hasBuilding={hasBuildingAt(x, y)}
        />
      ))}
    </Container>
  )
}

export default CellInteractionLayerImproved