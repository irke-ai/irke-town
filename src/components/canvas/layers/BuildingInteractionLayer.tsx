'use client'

import { Container, Graphics } from '@pixi/react'
import { Graphics as PixiGraphics } from 'pixi.js'
import { gridToScreen } from '@/lib/isometric'
import { useBuildingStore } from '@/stores/buildingStore'

export default function BuildingInteractionLayer() {
  const buildings = useBuildingStore((state) => state.buildings)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  
  return (
    <Container>
      {buildings.map((building) => {
        const topLeft = gridToScreen(building.gridX, building.gridY)
        const topRight = gridToScreen(building.gridX + building.width, building.gridY)
        const bottomRight = gridToScreen(building.gridX + building.width, building.gridY + building.height)
        const bottomLeft = gridToScreen(building.gridX, building.gridY + building.height)
        
        const draw = (g: PixiGraphics) => {
          g.clear()
          // 디버깅용 가시적인 클릭 영역
          g.beginFill(0xff0000, 0.3) // 빨간색 반투명
          g.lineStyle(2, 0xff0000, 1)
          
          // 건물 전체 영역 (높이 포함)
          const buildingHeight = 40
          g.moveTo(topLeft.x, topLeft.y - buildingHeight - 20)
          g.lineTo(topRight.x, topRight.y - buildingHeight - 20)
          g.lineTo(bottomRight.x, bottomRight.y - buildingHeight - 20)
          g.lineTo(bottomLeft.x, bottomLeft.y - buildingHeight - 20)
          g.closePath()
          g.endFill()
          
        }
        
        return (
          <Graphics
            key={building.id}
            draw={draw}
            interactive={true}
            eventMode="static"
            pointerdown={() => {
              console.log('Building interaction clicked:', building.id)
              selectBuilding(building.id)
            }}
            pointertap={() => {
              console.log('Building interaction tapped:', building.id)
              selectBuilding(building.id)
            }}
            cursor="pointer"
          />
        )
      })}
    </Container>
  )
}