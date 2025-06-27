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
  onSelect: () => void
}

function BuildingGraphics({ building, isSelected, onSelect }: BuildingGraphicsProps) {
  const template = BUILDING_TEMPLATES[building.type as keyof typeof BUILDING_TEMPLATES]
  const statusColor = STATUS_COLORS[building.status as keyof typeof STATUS_COLORS]
  
  const draw = useCallback((g: PixiGraphics) => {
    g.clear()
    
    // 4개의 모서리 계산
    const topLeft = gridToScreen(building.gridX, building.gridY)
    const topRight = gridToScreen(building.gridX + building.width, building.gridY)
    const bottomRight = gridToScreen(building.gridX + building.width, building.gridY + building.height)
    const bottomLeft = gridToScreen(building.gridX, building.gridY + building.height)
    
    // Hit area 설정 (건물 전체 영역)
    const buildingHeight = 40
    g.hitArea = {
      contains: (x: number, y: number) => {
        // 건물의 3D 영역 전체를 클릭 가능하게 설정
        const minX = Math.min(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x) - 10
        const maxX = Math.max(topLeft.x, topRight.x, bottomRight.x, bottomLeft.x) + 10
        const minY = Math.min(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y) - buildingHeight - 20
        const maxY = Math.max(topLeft.y, topRight.y, bottomRight.y, bottomLeft.y) + 10
        return x >= minX && x <= maxX && y >= minY && y <= maxY
      }
    }
    
    // 바닥 그리기
    g.beginFill(statusColor, 0.8)
    g.lineStyle(2, isSelected ? 0x3b82f6 : 0x000000, 1)
    g.moveTo(topLeft.x, topLeft.y)
    g.lineTo(topRight.x, topRight.y)
    g.lineTo(bottomRight.x, bottomRight.y)
    g.lineTo(bottomLeft.x, bottomLeft.y)
    g.closePath()
    g.endFill()
    
    
    // 왼쪽 벽
    g.beginFill(statusColor, 0.6)
    g.moveTo(bottomLeft.x, bottomLeft.y)
    g.lineTo(bottomLeft.x, bottomLeft.y - buildingHeight)
    g.lineTo(topLeft.x, topLeft.y - buildingHeight)
    g.lineTo(topLeft.x, topLeft.y)
    g.closePath()
    g.endFill()
    
    // 오른쪽 벽
    g.beginFill(statusColor, 0.7)
    g.moveTo(bottomLeft.x, bottomLeft.y)
    g.lineTo(bottomLeft.x, bottomLeft.y - buildingHeight)
    g.lineTo(bottomRight.x, bottomRight.y - buildingHeight)
    g.lineTo(bottomRight.x, bottomRight.y)
    g.closePath()
    g.endFill()
    
    // 지붕
    g.beginFill(statusColor, 0.9)
    g.lineStyle(2, isSelected ? 0x3b82f6 : 0x000000, 1)
    g.moveTo(topLeft.x, topLeft.y - buildingHeight)
    g.lineTo(topRight.x, topRight.y - buildingHeight)
    g.lineTo(bottomRight.x, bottomRight.y - buildingHeight)
    g.lineTo(bottomLeft.x, bottomLeft.y - buildingHeight)
    g.closePath()
    g.endFill()
    
    // 선택 표시
    if (isSelected) {
      g.lineStyle(3, 0x3b82f6, 1)
      g.beginFill(0x3b82f6, 0.1)
      g.moveTo(topLeft.x, topLeft.y - buildingHeight - 10)
      g.lineTo(topRight.x, topRight.y - buildingHeight - 10)
      g.lineTo(bottomRight.x, bottomRight.y - buildingHeight - 10)
      g.lineTo(bottomLeft.x, bottomLeft.y - buildingHeight - 10)
      g.closePath()
      g.endFill()
    }
  }, [building, isSelected, statusColor])
  
  // 건물 중앙 계산
  const centerPos = gridToScreen(
    building.gridX + building.width / 2,
    building.gridY + building.height / 2
  )
  
  return (
    <Container>
      <Graphics 
        draw={draw} 
        interactive={true}
        eventMode="static"
        cursor="pointer"
        pointerdown={onSelect}
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

export default function BuildingLayerWithInteraction() {
  const buildings = useBuildingStore((state) => state.buildings)
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  
  return (
    <Container sortableChildren={true}>
      {buildings.map((building) => (
        <BuildingGraphics
          key={building.id}
          building={building}
          isSelected={building.id === selectedBuildingId}
          onSelect={() => selectBuilding(building.id)}
        />
      ))}
    </Container>
  )
}