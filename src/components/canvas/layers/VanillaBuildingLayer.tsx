'use client'

import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { gridToScreen } from '@/lib/isometric'
import { useBuildingStore } from '@/stores/buildingStore'
import { STATUS_COLORS } from '@/types/building'

interface VanillaBuildingLayerProps {
  app: PIXI.Application
}

export default function VanillaBuildingLayer({ app }: VanillaBuildingLayerProps) {
  const containerRef = useRef<PIXI.Container | null>(null)
  const buildings = useBuildingStore((state) => state.buildings)
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  
  console.log('VanillaBuildingLayer render:', { buildings: buildings.length, selectedBuildingId })
  
  useEffect(() => {
    if (!app) return
    
    // Container 생성
    const container = new PIXI.Container()
    container.sortableChildren = true
    app.stage.addChild(container)
    containerRef.current = container
    
    console.log('VanillaBuildingLayer: container created')
    
    return () => {
      if (containerRef.current) {
        app.stage.removeChild(containerRef.current)
        containerRef.current.destroy()
        containerRef.current = null
      }
    }
  }, [app])
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const container = containerRef.current
    
    // 기존 건물들 제거
    container.removeChildren()
    
    console.log('VanillaBuildingLayer: updating buildings', buildings.length)
    
    // 건물들 그리기
    buildings.forEach((building) => {
      const buildingContainer = new PIXI.Container()
      const isSelected = building.id === selectedBuildingId
      const statusColor = STATUS_COLORS[building.status as keyof typeof STATUS_COLORS] || 0x666666
      
      // 건물 그래픽 생성
      const graphics = new PIXI.Graphics()
      
      // 4개의 모서리 계산
      const topLeft = gridToScreen(building.gridX, building.gridY)
      const topRight = gridToScreen(building.gridX + building.width, building.gridY)
      const bottomRight = gridToScreen(building.gridX + building.width, building.gridY + building.height)
      const bottomLeft = gridToScreen(building.gridX, building.gridY + building.height)
      
      const buildingHeight = 40
      
      // 바닥 그리기
      graphics.beginFill(statusColor, 0.8)
      graphics.lineStyle(2, isSelected ? 0x3b82f6 : 0x000000, 1)
      graphics.moveTo(topLeft.x, topLeft.y)
      graphics.lineTo(topRight.x, topRight.y)
      graphics.lineTo(bottomRight.x, bottomRight.y)
      graphics.lineTo(bottomLeft.x, bottomLeft.y)
      graphics.closePath()
      graphics.endFill()
      
      // 왼쪽 벽
      graphics.beginFill(statusColor, 0.6)
      graphics.moveTo(bottomLeft.x, bottomLeft.y)
      graphics.lineTo(bottomLeft.x, bottomLeft.y - buildingHeight)
      graphics.lineTo(topLeft.x, topLeft.y - buildingHeight)
      graphics.lineTo(topLeft.x, topLeft.y)
      graphics.closePath()
      graphics.endFill()
      
      // 오른쪽 벽
      graphics.beginFill(statusColor, 0.7)
      graphics.moveTo(bottomLeft.x, bottomLeft.y)
      graphics.lineTo(bottomLeft.x, bottomLeft.y - buildingHeight)
      graphics.lineTo(bottomRight.x, bottomRight.y - buildingHeight)
      graphics.lineTo(bottomRight.x, bottomRight.y)
      graphics.closePath()
      graphics.endFill()
      
      // 지붕
      graphics.beginFill(statusColor, 0.9)
      graphics.lineStyle(2, isSelected ? 0x3b82f6 : 0x000000, 1)
      graphics.moveTo(topLeft.x, topLeft.y - buildingHeight)
      graphics.lineTo(topRight.x, topRight.y - buildingHeight)
      graphics.lineTo(bottomRight.x, bottomRight.y - buildingHeight)
      graphics.lineTo(bottomLeft.x, bottomLeft.y - buildingHeight)
      graphics.closePath()
      graphics.endFill()
      
      // 선택 표시
      if (isSelected) {
        graphics.lineStyle(3, 0x3b82f6, 1)
        graphics.beginFill(0x3b82f6, 0.1)
        graphics.moveTo(topLeft.x, topLeft.y - buildingHeight - 10)
        graphics.lineTo(topRight.x, topRight.y - buildingHeight - 10)
        graphics.lineTo(bottomRight.x, bottomRight.y - buildingHeight - 10)
        graphics.lineTo(bottomLeft.x, bottomLeft.y - buildingHeight - 10)
        graphics.closePath()
        graphics.endFill()
      }
      
      // 인터랙티브 설정
      graphics.interactive = true
      graphics.eventMode = 'static'
      graphics.cursor = 'pointer'
      
      // 클릭 이벤트
      graphics.on('pointerdown', () => {
        console.log('*** VANILLA BUILDING CLICKED ***', building.id, building.name)
        selectBuilding(building.id)
      })
      
      buildingContainer.addChild(graphics)
      
      // 텍스트 추가
      const centerPos = gridToScreen(
        building.gridX + building.width / 2,
        building.gridY + building.height / 2
      )
      
      const text = new PIXI.Text(building.name, {
        fontSize: 12,
        fill: 0x000000,
        align: 'center',
        fontWeight: 'bold'
      })
      text.anchor.set(0.5)
      text.x = centerPos.x
      text.y = centerPos.y - 30
      
      buildingContainer.addChild(text)
      container.addChild(buildingContainer)
    })
    
  }, [buildings, selectedBuildingId, selectBuilding])
  
  return null // 이 컴포넌트는 DOM을 렌더링하지 않습니다
}