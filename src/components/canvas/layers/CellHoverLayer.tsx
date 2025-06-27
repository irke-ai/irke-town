'use client'

import React from 'react'
import { Graphics } from '@pixi/react'
import { Graphics as PixiGraphics } from 'pixi.js'
import { gridToScreen, GRID_CONFIG } from '@/lib/isometric'
import { useBuildingStore } from '@/stores/buildingStore'

interface CellHoverLayerProps {
  hoveredCell: { x: number; y: number } | null
}

/**
 * 마우스 호버된 셀에 파란색 박스를 표시하는 레이어
 * TownCanvas의 전역 마우스 이벤트를 기반으로 작동
 */
const CellHoverLayer: React.FC<CellHoverLayerProps> = ({ hoveredCell }) => {
  const buildings = useBuildingStore((state) => state.buildings)

  // 해당 그리드 위치에 건물이 있는지 확인
  const hasBuildingAt = (gridX: number, gridY: number) => {
    return buildings.some(building => {
      return (
        gridX >= building.gridX &&
        gridX < building.gridX + building.width &&
        gridY >= building.gridY &&
        gridY < building.gridY + building.height
      )
    })
  }

  const draw = (g: PixiGraphics) => {
    g.clear()
    
    // 호버된 셀이 있고, 건물이 없는 경우에만 표시
    if (hoveredCell && !hasBuildingAt(hoveredCell.x, hoveredCell.y)) {
      const pos = gridToScreen(hoveredCell.x, hoveredCell.y)
      const halfWidth = GRID_CONFIG.cellWidth / 2
      const halfHeight = GRID_CONFIG.cellHeight / 2
      
      // 파란색 호버 효과
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

  return <Graphics draw={draw} zIndex={75} />
}

export default CellHoverLayer