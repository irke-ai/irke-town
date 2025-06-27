'use client'

import { Container, Graphics, Text } from '@pixi/react'
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js'
import { gridToScreen } from '@/lib/isometric'
import { useBuildingStore } from '@/stores/buildingStore'
import { BUILDING_TEMPLATES, STATUS_COLORS } from '@/types/building'

export default function BuildingLayerSimple() {
  const buildings = useBuildingStore((state) => state.buildings)
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  
  // console.log('BuildingLayerSimple render:', { buildings: buildings.length, selectedBuildingId })
  
  return (
    <Container sortableChildren={true}>
      {buildings.map((building) => {
        const template = BUILDING_TEMPLATES[building.type as keyof typeof BUILDING_TEMPLATES]
        const statusColor = STATUS_COLORS[building.status as keyof typeof STATUS_COLORS]
        const isSelected = building.id === selectedBuildingId
        
        // 건물 중앙 계산
        const centerPos = gridToScreen(
          building.gridX + building.width / 2,
          building.gridY + building.height / 2
        )
        
        const draw = (g: PixiGraphics) => {
          g.clear()
          
          // 4개의 모서리 계산
          const topLeft = gridToScreen(building.gridX, building.gridY)
          const topRight = gridToScreen(building.gridX + building.width, building.gridY)
          const bottomRight = gridToScreen(building.gridX + building.width, building.gridY + building.height)
          const bottomLeft = gridToScreen(building.gridX, building.gridY + building.height)
          
          const buildingHeight = 40
          
          // 클릭 영역을 위한 투명한 박스 그리기
          g.beginFill(0x000000, 0.01) // 거의 투명
          g.drawRect(
            Math.min(topLeft.x, bottomLeft.x) - 20,
            topLeft.y - buildingHeight - 20,
            Math.abs(topRight.x - topLeft.x) + 40,
            buildingHeight + Math.abs(bottomLeft.y - topLeft.y) + 40
          )
          g.endFill()
          
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
        }
        
        return (
          <Container key={building.id}>
            <Graphics
              draw={draw}
              interactive={true}
              eventMode="static"
              cursor="pointer"
              pointerdown={(e) => {
                console.log('Building Graphics clicked:', building.id, building.name)
                e.stopPropagation()
                selectBuilding(building.id)
              }}
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
              interactive={false}
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
              interactive={false}
            />
          </Container>
        )
      })}
    </Container>
  )
}