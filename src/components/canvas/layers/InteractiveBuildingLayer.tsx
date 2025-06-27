'use client'

import { PixiComponent } from '@pixi/react'
import { Container, Graphics, Text } from 'pixi.js'
import { gridToScreen } from '@/lib/isometric'
import { useBuildingStore } from '@/stores/buildingStore'
import { BUILDING_TEMPLATES, STATUS_COLORS } from '@/types/building'

const InteractiveBuilding = PixiComponent('InteractiveBuilding', {
  create: (props) => {
    const container = new Container()
    const graphics = new Graphics()
    const text = new Text(props.icon, { fontSize: 24 })
    const nameText = new Text(props.name, { fontSize: 12, fill: 0x000000 })
    
    container.addChild(graphics)
    container.addChild(text)
    container.addChild(nameText)
    
    // 인터랙티브 설정
    container.eventMode = 'static'
    container.cursor = 'pointer'
    
    return container
  },
  applyProps: (container, _, props) => {
    const graphics = container.children[0] as Graphics
    const text = container.children[1] as Text
    const nameText = container.children[2] as Text
    
    // 그래픽 다시 그리기
    graphics.clear()
    
    const topLeft = gridToScreen(props.gridX, props.gridY)
    const topRight = gridToScreen(props.gridX + props.width, props.gridY)
    const bottomRight = gridToScreen(props.gridX + props.width, props.gridY + props.height)
    const bottomLeft = gridToScreen(props.gridX, props.gridY + props.height)
    
    const buildingHeight = 40
    const statusColor = props.statusColor
    
    // 바닥
    graphics.beginFill(statusColor, 0.8)
    graphics.lineStyle(2, props.isSelected ? 0x3b82f6 : 0x000000, 1)
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
    graphics.lineStyle(2, props.isSelected ? 0x3b82f6 : 0x000000, 1)
    graphics.moveTo(topLeft.x, topLeft.y - buildingHeight)
    graphics.lineTo(topRight.x, topRight.y - buildingHeight)
    graphics.lineTo(bottomRight.x, bottomRight.y - buildingHeight)
    graphics.lineTo(bottomLeft.x, bottomLeft.y - buildingHeight)
    graphics.closePath()
    graphics.endFill()
    
    // 텍스트 위치
    const centerPos = gridToScreen(
      props.gridX + props.width / 2,
      props.gridY + props.height / 2
    )
    
    text.text = props.icon
    text.anchor.set(0.5)
    text.position.set(centerPos.x, centerPos.y - 60)
    
    nameText.text = props.name
    nameText.anchor.set(0.5)
    nameText.position.set(centerPos.x, centerPos.y - 30)
    
    // 이벤트 핸들러
    container.removeAllListeners()
    container.on('pointerdown', () => {
      console.log('Building clicked (PixiComponent):', props.id)
      props.onClick()
    })
  }
})

export default function InteractiveBuildingLayer() {
  const buildings = useBuildingStore((state) => state.buildings)
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  
  return (
    <>
      {buildings.map((building) => {
        const template = BUILDING_TEMPLATES[building.type as keyof typeof BUILDING_TEMPLATES]
        const statusColor = STATUS_COLORS[building.status as keyof typeof STATUS_COLORS]
        
        return (
          <InteractiveBuilding
            key={building.id}
            id={building.id}
            name={building.name}
            icon={template?.icon || '🏢'}
            gridX={building.gridX}
            gridY={building.gridY}
            width={building.width}
            height={building.height}
            statusColor={statusColor}
            isSelected={building.id === selectedBuildingId}
            onClick={() => selectBuilding(building.id)}
          />
        )
      })}
    </>
  )
}