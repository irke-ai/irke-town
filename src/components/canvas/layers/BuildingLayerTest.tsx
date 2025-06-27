'use client'

import { Container, Graphics } from '@pixi/react'
import { Graphics as PixiGraphics, FederatedPointerEvent } from 'pixi.js'
import { gridToScreen } from '@/lib/isometric'
import { useBuildingStore } from '@/stores/buildingStore'

export default function BuildingLayerTest() {
  const buildings = useBuildingStore((state) => state.buildings)
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  
  return (
    <Container sortableChildren={true}>
      {buildings.map((building) => {
        const pos = gridToScreen(building.gridX + 1, building.gridY + 1)
        const isSelected = building.id === selectedBuildingId
        
        const draw = (g: PixiGraphics) => {
          g.clear()
          g.beginFill(isSelected ? 0xff0000 : 0x0066cc, 0.8)
          g.lineStyle(2, isSelected ? 0xffff00 : 0x000000)
          g.drawRect(-30, -30, 60, 60)
          g.endFill()
        }
        
        const handleClick = (event: FederatedPointerEvent) => {
          console.log('*** BUILDING CLICKED ***', building.id, building.name)
          event.stopPropagation()
          selectBuilding(building.id)
        }
        
        return (
          <Container
            key={building.id}
            x={pos.x}
            y={pos.y}
            interactive={true}
            eventMode="static"
            cursor="pointer"
            pointerdown={handleClick}
            pointertap={handleClick}
            click={handleClick}
            zIndex={1000}
          >
            <Graphics draw={draw} />
          </Container>
        )
      })}
    </Container>
  )
}