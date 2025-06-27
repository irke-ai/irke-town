'use client'

import React, { useCallback } from 'react'
import { Container, Graphics } from '@pixi/react'
import { useBuildingStore } from '@/stores/buildingStore'
import { gridToScreen } from '@/lib/isometric'
import { Graphics as PixiGraphics, Rectangle, FederatedPointerEvent } from 'pixi.js'
import { STATUS_COLORS } from '@/types/building'

interface SimpleBuildingLayerProps {
  mousePosition: { x: number; y: number } | null
}

const SimpleBuildingLayer: React.FC<SimpleBuildingLayerProps> = ({ mousePosition }) => {
  const buildings = useBuildingStore((state) => state.buildings)
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const hoveredBuildingId = useBuildingStore((state) => state.hoveredBuildingId)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  const hoverBuilding = useBuildingStore((state) => state.hoverBuilding)

  const handleBuildingClick = useCallback((buildingId: string, event: FederatedPointerEvent) => {
    event.stopPropagation()
    console.log('Building clicked:', buildingId, 'Currently selected:', selectedBuildingId)
    
    if (selectedBuildingId === buildingId) {
      console.log('Deselecting building')
      selectBuilding(null)
    } else {
      console.log('Selecting building')
      const clickPosition = { x: event.data.global.x, y: event.data.global.y }
      selectBuilding(buildingId, clickPosition)
      // 강제로 상태 확인
      setTimeout(() => {
        const state = useBuildingStore.getState()
        console.log('Store state after selection:', state.selectedBuildingId)
      }, 100)
    }
  }, [selectedBuildingId, selectBuilding])

  return (
    <>
      {buildings.map((building) => {
        const pos = gridToScreen(building.gridX + 1, building.gridY + 1)
        const isSelected = selectedBuildingId === building.id
        const isHovered = hoveredBuildingId === building.id
        const statusColor = STATUS_COLORS[building.status as keyof typeof STATUS_COLORS] || 0x666666

        const hitArea = new Rectangle(
          -building.width * 32,
          -building.height * 32,
          building.width * 64,
          building.height * 64
        )

        const draw = (g: PixiGraphics) => {
          g.clear()
          
          // 4개의 모서리 계산
          const topLeft = gridToScreen(building.gridX, building.gridY)
          const topRight = gridToScreen(building.gridX + building.width, building.gridY)
          const bottomRight = gridToScreen(building.gridX + building.width, building.gridY + building.height)
          const bottomLeft = gridToScreen(building.gridX, building.gridY + building.height)
          
          // Container의 중심점으로부터 상대적인 위치로 조정
          const centerX = pos.x
          const centerY = pos.y
          const adjustedTopLeft = { x: topLeft.x - centerX, y: topLeft.y - centerY }
          const adjustedTopRight = { x: topRight.x - centerX, y: topRight.y - centerY }
          const adjustedBottomRight = { x: bottomRight.x - centerX, y: bottomRight.y - centerY }
          const adjustedBottomLeft = { x: bottomLeft.x - centerX, y: bottomLeft.y - centerY }
          
          const buildingHeight = 40
          
          // 색상 결정
          let baseColor = statusColor
          if (isHovered && !isSelected) baseColor = (statusColor & 0x7f7f7f) + 0x404040
          
          // 바닥 그리기
          g.beginFill(baseColor, 0.8)
          g.lineStyle(2, isSelected ? 0x3b82f6 : (isHovered ? 0xffa500 : 0x000000), 1)
          g.moveTo(adjustedTopLeft.x, adjustedTopLeft.y)
          g.lineTo(adjustedTopRight.x, adjustedTopRight.y)
          g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y)
          g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y)
          g.closePath()
          g.endFill()
          
          // 왼쪽 벽
          g.beginFill(baseColor, 0.6)
          g.moveTo(adjustedBottomLeft.x, adjustedBottomLeft.y)
          g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y - buildingHeight)
          g.lineTo(adjustedTopLeft.x, adjustedTopLeft.y - buildingHeight)
          g.lineTo(adjustedTopLeft.x, adjustedTopLeft.y)
          g.closePath()
          g.endFill()
          
          // 오른쪽 벽
          g.beginFill(baseColor, 0.7)
          g.moveTo(adjustedBottomLeft.x, adjustedBottomLeft.y)
          g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y - buildingHeight)
          g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y - buildingHeight)
          g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y)
          g.closePath()
          g.endFill()
          
          // 지붕
          g.beginFill(baseColor, 0.9)
          g.lineStyle(2, isSelected ? 0x3b82f6 : (isHovered ? 0xffa500 : 0x000000), 1)
          g.moveTo(adjustedTopLeft.x, adjustedTopLeft.y - buildingHeight)
          g.lineTo(adjustedTopRight.x, adjustedTopRight.y - buildingHeight)
          g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y - buildingHeight)
          g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y - buildingHeight)
          g.closePath()
          g.endFill()
          
          // 선택 효과
          if (isSelected) {
            g.lineStyle(3, 0x3b82f6, 1)
            g.beginFill(0x3b82f6, 0.1)
            g.moveTo(adjustedTopLeft.x, adjustedTopLeft.y - buildingHeight - 10)
            g.lineTo(adjustedTopRight.x, adjustedTopRight.y - buildingHeight - 10)
            g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y - buildingHeight - 10)
            g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y - buildingHeight - 10)
            g.closePath()
            g.endFill()
          }
        }

        return (
          <Container
            key={building.id}
            x={pos.x}
            y={pos.y}
            zIndex={100}
            eventMode="static"
            cursor="pointer"
            hitArea={hitArea}
            pointerdown={(event) => handleBuildingClick(building.id, event)}
            pointerover={() => hoverBuilding(building.id)}
            pointerout={() => hoverBuilding(null)}
          >
            <Graphics draw={draw} />
          </Container>
        )
      })}
    </>
  )
}

export default SimpleBuildingLayer