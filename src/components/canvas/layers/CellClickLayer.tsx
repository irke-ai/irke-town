'use client'

import React from 'react'
import { Graphics } from '@pixi/react'
import { Graphics as PixiGraphics } from 'pixi.js'
import { useBuildingStore } from '@/stores/buildingStore'

interface CellClickLayerProps {
  onCellClick: (gridX: number, gridY: number) => void
}

/**
 * 전체 화면을 덮는 투명한 클릭 영역을 제공하는 레이어
 * TownCanvas의 전역 마우스 이벤트와 연동하여 작동
 */
const CellClickLayer: React.FC<CellClickLayerProps> = () => {
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)

  const draw = (g: PixiGraphics) => {
    g.clear()
    
    // 전체 화면을 덮는 투명한 영역 (이벤트 캐치용)
    g.beginFill(0x000000, 0)
    g.drawRect(-5000, -5000, 10000, 10000)
    g.endFill()
  }

  const handleClick = () => {
    // 빈 공간 클릭 시 선택 해제
    selectBuilding(null)
  }

  return (
    <Graphics 
      draw={draw} 
      zIndex={1}
      eventMode="static"
      cursor="default"
      pointerdown={handleClick}
    />
  )
}

export default CellClickLayer