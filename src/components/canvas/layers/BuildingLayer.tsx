'use client'

import { Container, Graphics, Text } from '@pixi/react'
import { useCallback } from 'react'
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js'
import { gridToScreen } from '@/lib/isometric'
import { useBuildingStore } from '@/stores/buildingStore'
import { BUILDING_TEMPLATES, STATUS_COLORS } from '@/types/building'

interface BuildingGraphicsProps {
  building: {
    id: string
    type: string
    name: string
    gridX: number
    gridY: number
    status: string
    width: number
    height: number
  }
  isSelected: boolean
}

function BuildingGraphics({ building, isSelected }: BuildingGraphicsProps) {
  const template = BUILDING_TEMPLATES[building.type as keyof typeof BUILDING_TEMPLATES]
  const statusColor = STATUS_COLORS[building.status as keyof typeof STATUS_COLORS]
  const rotation = building.rotation || 0
  
  const draw = useCallback((g: PixiGraphics) => {
    g.clear()
    
    // 회전에 따른 실제 크기 계산
    const actualWidth = rotation % 180 === 0 ? building.width : building.height
    const actualHeight = rotation % 180 === 0 ? building.height : building.width
    
    // 4개의 모서리 계산
    const topLeft = gridToScreen(building.gridX, building.gridY)
    const topRight = gridToScreen(building.gridX + actualWidth, building.gridY)
    const bottomRight = gridToScreen(building.gridX + actualWidth, building.gridY + actualHeight)
    const bottomLeft = gridToScreen(building.gridX, building.gridY + actualHeight)
    
    // 클릭 영역 설정
    g.hitArea = {
      contains: (x: number, y: number) => {
        // 간단한 AABB 체크
        const minX = Math.min(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x) - 20
        const maxX = Math.max(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x) + 20
        const minY = Math.min(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y) - 60
        const maxY = Math.max(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y) + 20
        return x >= minX && x <= maxX && y >= minY && y <= maxY
      }
    }
    
    // 바닥 그리기
    g.beginFill(0x333333, 0.9)  // 어두운 바닥
    g.lineStyle(2, isSelected ? 0x3b82f6 : 0x000000, 1)
    g.moveTo(topLeft.x, topLeft.y)
    g.lineTo(topRight.x, topRight.y)
    g.lineTo(bottomRight.x, bottomRight.y)
    g.lineTo(bottomLeft.x, bottomLeft.y)
    g.closePath()
    g.endFill()
    
    // 건물 높이 (3D 효과)
    const buildingHeight = 40
    const wallThickness = 3
    
    // 왼쪽 벽 (외부)
    g.beginFill(statusColor, 0.7)
    g.moveTo(bottomLeft.x, bottomLeft.y)
    g.lineTo(bottomLeft.x, bottomLeft.y - buildingHeight)
    g.lineTo(topLeft.x, topLeft.y - buildingHeight)
    g.lineTo(topLeft.x, topLeft.y)
    g.closePath()
    g.endFill()
    
    // 오른쪽 벽 (외부)
    g.beginFill(statusColor, 0.8)
    g.moveTo(bottomLeft.x, bottomLeft.y)
    g.lineTo(bottomLeft.x, bottomLeft.y - buildingHeight)
    g.lineTo(bottomRight.x, bottomRight.y - buildingHeight)
    g.lineTo(bottomRight.x, bottomRight.y)
    g.closePath()
    g.endFill()
    
    // 뒤쪽 벽 (외부)
    g.beginFill(statusColor, 0.9)
    g.moveTo(topLeft.x, topLeft.y)
    g.lineTo(topLeft.x, topLeft.y - buildingHeight)
    g.lineTo(topRight.x, topRight.y - buildingHeight)
    g.lineTo(topRight.x, topRight.y)
    g.closePath()
    g.endFill()
    
    // 앞쪽 벽 (외부)
    g.beginFill(statusColor, 0.6)
    g.moveTo(bottomRight.x, bottomRight.y)
    g.lineTo(bottomRight.x, bottomRight.y - buildingHeight)
    g.lineTo(topRight.x, topRight.y - buildingHeight)
    g.lineTo(topRight.x, topRight.y)
    g.closePath()
    g.endFill()
    
    // 입구/출구 표시 (바닥에 표시)
    const portSize = 15
    
    // 회전에 따른 포트 위치 계산
    if (template.ports.input) {
      g.beginFill(0x00ff00, 0.8)  // 초록색 입구
      g.lineStyle(2, 0x00aa00, 1)
      
      let portX, portY
      switch (rotation) {
        case 0:
          portX = topLeft.x + (topRight.x - topLeft.x) / 2
          portY = topLeft.y + 5  // 바닥에 표시
          break
        case 90:
          portX = topRight.x - 5
          portY = topRight.y + (bottomRight.y - topRight.y) / 2
          break
        case 180:
          portX = bottomRight.x + (bottomLeft.x - bottomRight.x) / 2
          portY = bottomRight.y - 5
          break
        case 270:
          portX = bottomLeft.x + 5
          portY = bottomLeft.y + (topLeft.y - bottomLeft.y) / 2
          break
      }
      
      g.drawCircle(portX || 0, portY || 0, portSize / 2)
      g.endFill()
    }
    
    if (template.ports.output) {
      g.beginFill(0xff0000, 0.8)  // 빨간색 출구
      g.lineStyle(2, 0xaa0000, 1)
      
      let portX, portY
      switch (rotation) {
        case 0:
          portX = bottomRight.x + (bottomLeft.x - bottomRight.x) / 2
          portY = bottomRight.y - 5  // 바닥에 표시
          break
        case 90:
          portX = bottomLeft.x + 5
          portY = bottomLeft.y + (topLeft.y - bottomLeft.y) / 2
          break
        case 180:
          portX = topLeft.x + (topRight.x - topLeft.x) / 2
          portY = topLeft.y + 5
          break
        case 270:
          portX = topRight.x - 5
          portY = topRight.y + (bottomRight.y - topRight.y) / 2
          break
      }
      
      g.drawCircle(portX || 0, portY || 0, portSize / 2)
      g.endFill()
    }
    
    // 선택 표시
    if (isSelected) {
      g.lineStyle(3, 0x3b82f6, 1)
      g.beginFill(0x3b82f6, 0.1)
      g.drawRect(
        Math.min(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x) - 10,
        Math.min(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y) - buildingHeight - 10,
        Math.abs(topRight.x - topLeft.x) + Math.abs(bottomLeft.x - topLeft.x) + 20,
        Math.abs(bottomLeft.y - topLeft.y) + buildingHeight + 20
      )
      g.endFill()
    }
  }, [building, isSelected, statusColor, template, rotation])
  
  // 건물 중앙 계산
  const centerPos = gridToScreen(
    building.gridX + building.width / 2,
    building.gridY + building.height / 2
  )
  
  return (
    <Container>
      <Graphics 
        draw={draw} 
        eventMode="none"
      />
      <Text
        text={template?.icon || '🏢'}
        x={centerPos.x}
        y={centerPos.y - 60}
        anchor={0.5}
        style={new TextStyle({
          fontSize: 24,
          align: 'center'
        })}
      />
      <Text
        text={building.name}
        x={centerPos.x}
        y={centerPos.y - 30}
        anchor={0.5}
        style={new TextStyle({
          fontSize: 12,
          fill: 0x000000,
          align: 'center',
          fontWeight: 'bold'
        })}
      />
    </Container>
  )
}

export default function BuildingLayer() {
  const buildings = useBuildingStore((state) => state.buildings)
  const selectedBuildingIds = useBuildingStore((state) => state.selectedBuildingIds)
  const draggingBuildingId = useBuildingStore((state) => state.draggingBuildingId)
  
  return (
    <Container sortableChildren={true}>
      {buildings.map((building) => 
        draggingBuildingId === building.id ? null : (
          <BuildingGraphics
            key={building.id}
            building={building}
            isSelected={selectedBuildingIds.includes(building.id)}
          />
        )
      )}
    </Container>
  )
}