'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Container, Graphics } from '@pixi/react'
import { Graphics as PixiGraphics } from 'pixi.js'
import { useBuildingStore } from '@/stores/buildingStore'
import { useUIStore } from '@/stores/uiStore'
import { gridToScreen } from '@/lib/isometric'
import { BUILDING_TEMPLATES } from '@/types/building'

export default function ConnectionPreviewLayer() {
  const connectionMode = useUIStore((state) => state.connectionMode)
  const connectingFromBuildingId = useBuildingStore((state) => state.connectingFromBuildingId)
  const hoveredBuildingId = useBuildingStore((state) => state.hoveredBuildingId)
  const buildings = useBuildingStore((state) => state.buildings)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  
  // 마우스 위치 추적
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  const drawPreview = useCallback((g: PixiGraphics) => {
    g.clear()
    
    if (!connectionMode || !connectingFromBuildingId || !mousePosition) return
    
    const fromBuilding = buildings.find(b => b.id === connectingFromBuildingId)
    if (!fromBuilding) return
    
    const fromTemplate = BUILDING_TEMPLATES[fromBuilding.type]
    const fromCenter = gridToScreen(
      fromBuilding.gridX + fromTemplate.width / 2,
      fromBuilding.gridY + fromTemplate.height / 2
    )
    
    // 목표 위치 결정
    let toPosition = null
    
    if (hoveredBuildingId && hoveredBuildingId !== connectingFromBuildingId) {
      const toBuilding = buildings.find(b => b.id === hoveredBuildingId)
      if (toBuilding) {
        const toTemplate = BUILDING_TEMPLATES[toBuilding.type]
        toPosition = gridToScreen(
          toBuilding.gridX + toTemplate.width / 2,
          toBuilding.gridY + toTemplate.height / 2
        )
      }
    }
    
    // 프리뷰 선 그리기
    g.lineStyle(4, 0x3b82f6, 0.5)
    g.moveTo(fromCenter.x, fromCenter.y)
    
    if (toPosition) {
      // 건물에 연결될 때는 파란색
      g.lineStyle(4, 0x3b82f6, 0.8)
      g.lineTo(toPosition.x, toPosition.y)
    } else {
      // 마우스 따라다닐 때는 회색
      g.lineStyle(4, 0x9ca3af, 0.5)
      // TODO: 실제 마우스 위치를 캔버스 좌표로 변환하는 로직 필요
      // 임시로 fromCenter 사용
      g.lineTo(fromCenter.x + 100, fromCenter.y + 100)
    }
    
    // 시작점 표시
    g.beginFill(0x3b82f6, 1)
    g.drawCircle(fromCenter.x, fromCenter.y, 6)
    g.endFill()
    
    // 끝점 표시
    if (toPosition) {
      g.beginFill(0x3b82f6, 1)
      g.drawCircle(toPosition.x, toPosition.y, 6)
      g.endFill()
    }
  }, [connectionMode, connectingFromBuildingId, hoveredBuildingId, buildings, mousePosition])
  
  if (!connectionMode || !connectingFromBuildingId) {
    return null
  }
  
  return (
    <Container zIndex={150}>
      <Graphics draw={drawPreview} />
    </Container>
  )
}