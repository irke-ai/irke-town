'use client'

import React from 'react'
import { Container, Graphics } from '@pixi/react'
import { useBuildingStore } from '@/stores/buildingStore'
import { gridToScreen } from '@/lib/isometric'
import { Graphics as PixiGraphics } from 'pixi.js'
import { STATUS_COLORS } from '@/types/building'

export default function TestBuildingLayer() {
  const buildings = useBuildingStore((state) => state.buildings)
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  
  React.useEffect(() => {
    console.log('Current selected building:', selectedBuildingId)
  }, [selectedBuildingId])

  return (
    <>
      {buildings.map((building) => {
        const pos = gridToScreen(building.gridX + 1, building.gridY + 1)
        const isSelected = selectedBuildingId === building.id
        const statusColor = STATUS_COLORS[building.status as keyof typeof STATUS_COLORS] || 0x666666

        return (
          <Graphics
            key={building.id}
            x={pos.x}
            y={pos.y}
            eventMode="static"
            draw={(g: PixiGraphics) => {
              g.clear()
              g.beginFill(isSelected ? 0x3b82f6 : statusColor, 1)
              g.drawRect(-30, -30, 60, 60)
              g.endFill()
            }}
            pointerdown={() => {
              console.log('Graphics pointer down event fired for:', building.id)
              if (isSelected) {
                selectBuilding(null)
              } else {
                selectBuilding(building.id)
              }
            }}
          />
        )
      })}
    </>
  )
}