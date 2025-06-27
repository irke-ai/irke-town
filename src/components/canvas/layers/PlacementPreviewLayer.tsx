'use client'

import { Container, Graphics } from '@pixi/react'
import { useCallback } from 'react'
import { Graphics as PixiGraphics } from 'pixi.js'
import { gridToScreen, GRID_CONFIG } from '@/lib/isometric'
import { useBuildingStore } from '@/stores/buildingStore'
import { BUILDING_TEMPLATES } from '@/types/building'

interface PlacementPreviewLayerProps {
  hoveredCell: { x: number; y: number } | null
}

export default function PlacementPreviewLayer({ hoveredCell }: PlacementPreviewLayerProps) {
  const placingBuildingType = useBuildingStore((state) => state.placingBuildingType)
  const isPositionOccupied = useBuildingStore((state) => state.isPositionOccupied)
  
  const draw = useCallback((g: PixiGraphics) => {
    g.clear()
    
    if (!placingBuildingType || !hoveredCell) return
    
    const template = BUILDING_TEMPLATES[placingBuildingType]
    const isValid = !isPositionOccupied(
      hoveredCell.x, 
      hoveredCell.y, 
      template.width, 
      template.height
    )
    
    // 미리보기 색상 (유효: 초록색, 무효: 빨간색)
    const color = isValid ? 0x10b981 : 0xef4444
    const alpha = 0.5
    
    // 건물이 차지할 그리드 영역 표시
    for (let x = 0; x < template.width; x++) {
      for (let y = 0; y < template.height; y++) {
        const cellX = hoveredCell.x + x
        const cellY = hoveredCell.y + y
        const pos = gridToScreen(cellX, cellY)
        
        const halfWidth = GRID_CONFIG.cellWidth / 2
        const halfHeight = GRID_CONFIG.cellHeight / 2
        
        g.beginFill(color, alpha)
        g.lineStyle(2, color, 1)
        g.moveTo(pos.x, pos.y - halfHeight)
        g.lineTo(pos.x + halfWidth, pos.y)
        g.lineTo(pos.x, pos.y + halfHeight)
        g.lineTo(pos.x - halfWidth, pos.y)
        g.closePath()
        g.endFill()
      }
    }
    
    // 건물 외곽선
    const topLeft = gridToScreen(hoveredCell.x, hoveredCell.y)
    const topRight = gridToScreen(hoveredCell.x + template.width, hoveredCell.y)
    const bottomRight = gridToScreen(hoveredCell.x + template.width, hoveredCell.y + template.height)
    const bottomLeft = gridToScreen(hoveredCell.x, hoveredCell.y + template.height)
    
    g.lineStyle(3, color, 1)
    g.moveTo(topLeft.x, topLeft.y)
    g.lineTo(topRight.x, topRight.y)
    g.lineTo(bottomRight.x, bottomRight.y)
    g.lineTo(bottomLeft.x, bottomLeft.y)
    g.closePath()
  }, [placingBuildingType, hoveredCell, isPositionOccupied])
  
  return <Graphics draw={draw} />
}