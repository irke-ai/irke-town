'use client'

import { Container, Graphics } from '@pixi/react'
import { useCallback } from 'react'
import { Graphics as PixiGraphics } from 'pixi.js'
import { gridToScreen } from '@/lib/isometric'
import { useBuildingStore } from '@/stores/buildingStore'
import { STATUS_COLORS } from '@/types/building'

export default function BuildingClickLayer() {
  const buildings = useBuildingStore((state) => state.buildings)
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  
  console.log('BuildingClickLayer render: buildings count =', buildings.length)
  
  return (
    <Container>
      {buildings.map((building) => {
        const pos = gridToScreen(building.gridX + 1, building.gridY + 1)
        const isSelected = building.id === selectedBuildingId
        const statusColor = STATUS_COLORS[building.status as keyof typeof STATUS_COLORS] || 0x666666
        
        const draw = (g: PixiGraphics) => {
          g.clear()
          
          // 간단한 사각형 그리기
          g.beginFill(isSelected ? 0xff0000 : statusColor, 0.8)
          g.lineStyle(2, isSelected ? 0x3b82f6 : 0x000000)
          g.drawRect(-30, -30, 60, 60)
          g.endFill()
        }
        
        const handleClick = (event: any) => {
          console.log('*** BUILDING CLICKED ***', building.id, building.name)
          event.stopPropagation() // 핵심: 이벤트 전파 차단
          selectBuilding(building.id)
        }
        
        console.log(`Rendering building ${building.id} at (${pos.x}, ${pos.y})`)
        
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
          >
            <Graphics draw={draw} />
          </Container>
        )
      })}
    </Container>
  )
}