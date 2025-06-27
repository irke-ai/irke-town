'use client'

import React from 'react'
import { Container, Graphics } from '@pixi/react'
import { useBuildingStore } from '@/stores/buildingStore'
import { useUIStore } from '@/stores/uiStore'
import { gridToScreen } from '@/lib/isometric'
import { Graphics as PixiGraphics, Rectangle } from 'pixi.js'

export default function PreviewBuildingLayer() {
  const buildings = useBuildingStore((state) => state.buildings)
  const hoverBuilding = useBuildingStore((state) => state.hoverBuilding)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const editMode = useUIStore((state) => state.editMode)

  // 편집 모드에서는 렌더링하지 않음
  if (editMode === 'edit') {
    return null
  }

  return (
    <Container zIndex={50}>
      {buildings.map((building) => {
        const pos = gridToScreen(building.gridX + 1, building.gridY + 1)
        
        const hitArea = new Rectangle(
          -building.width * 32,
          -building.height * 32,
          building.width * 64,
          building.height * 64
        )
        
        return (
          <Container
            key={building.id}
            x={pos.x}
            y={pos.y}
            eventMode="static"
            cursor="pointer"
            hitArea={hitArea}
            pointerover={() => hoverBuilding(building.id)}
            pointerout={() => hoverBuilding(null)}
            pointerdown={(event) => {
              event.stopPropagation()
              
              // 브라우저의 실제 마우스 좌표 사용
              const clickPosition = { 
                x: event.nativeEvent?.clientX || event.data.global.x,
                y: event.nativeEvent?.clientY || event.data.global.y
              }
              
              // 이미 선택된 건물 클릭 시 선택 해제
              if (selectedBuildingId === building.id) {
                selectBuilding(null)
              } else {
                selectBuilding(building.id, clickPosition)
              }
            }}
          >
            <Graphics
              draw={(g: PixiGraphics) => {
                g.clear()
                // 투명한 클릭 영역만 그리기
                g.beginFill(0xffffff, 0.01)
                g.drawRect(
                  -building.width * 32,
                  -building.height * 32,
                  building.width * 64,
                  building.height * 64
                )
                g.endFill()
              }}
            />
          </Container>
        )
      })}
    </Container>
  )
}