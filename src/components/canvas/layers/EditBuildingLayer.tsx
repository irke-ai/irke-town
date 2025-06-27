'use client'

import React, { useCallback, useState, useRef, useEffect } from 'react'
import { Container, Graphics, Text } from '@pixi/react'
import { useBuildingStore } from '@/stores/buildingStore'
import { useUIStore } from '@/stores/uiStore'
import { gridToScreen, screenToGrid } from '@/lib/isometric'
import { Graphics as PixiGraphics, Rectangle, FederatedPointerEvent, TextStyle } from 'pixi.js'
import { STATUS_COLORS, BUILDING_TEMPLATES } from '@/types/building'

export default function EditBuildingLayer() {
  const buildings = useBuildingStore((state) => state.buildings)
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  const hoverBuilding = useBuildingStore((state) => state.hoverBuilding)
  const moveBuilding = useBuildingStore((state) => state.moveBuilding)
  const isPositionOccupied = useBuildingStore((state) => state.isPositionOccupied)
  const startDragging = useBuildingStore((state) => state.startDragging)
  const stopDragging = useBuildingStore((state) => state.stopDragging)
  const editMode = useUIStore((state) => state.editMode)
  
  
  const [isDragging, setIsDragging] = useState(false)
  const [draggedBuildingId, setDraggedBuildingId] = useState<string | null>(null)
  const [draggedPosition, setDraggedPosition] = useState<{ x: number; y: number } | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; buildingX: number; buildingY: number } | null>(null)

  const handleBuildingPointerDown = useCallback((buildingId: string, event: FederatedPointerEvent) => {
    event.stopPropagation()
    
    const building = buildings.find(b => b.id === buildingId)
    if (!building) return
    
    const clickPosition = { x: event.data.global.x, y: event.data.global.y }
    
    if (selectedBuildingId === buildingId) {
      // 이미 선택된 건물 - 드래그 준비
      setDraggedBuildingId(buildingId)
      dragStartRef.current = {
        x: clickPosition.x,
        y: clickPosition.y,
        buildingX: building.gridX,
        buildingY: building.gridY
      }
    } else {
      // 새로운 건물 선택
      selectBuilding(buildingId, clickPosition)
    }
  }, [buildings, selectedBuildingId, selectBuilding])

  const handlePointerMove = useCallback((event: FederatedPointerEvent) => {
    if (!draggedBuildingId || !dragStartRef.current) return
    
    const currentPos = { x: event.data.global.x, y: event.data.global.y }
    const distance = Math.sqrt(
      Math.pow(currentPos.x - dragStartRef.current.x, 2) + 
      Math.pow(currentPos.y - dragStartRef.current.y, 2)
    )
    
    if (distance > 5 && !isDragging) {
      setIsDragging(true)
      startDragging(draggedBuildingId, { x: 0, y: 0 })
    }
    
    if (isDragging) {
      const building = buildings.find(b => b.id === draggedBuildingId)
      if (!building) return
      
      const dx = currentPos.x - dragStartRef.current.x
      const dy = currentPos.y - dragStartRef.current.y
      
      const screenPos = gridToScreen(dragStartRef.current.buildingX, dragStartRef.current.buildingY)
      const newScreenPos = {
        x: screenPos.x + dx,
        y: screenPos.y + dy
      }
      
      const newGridPos = screenToGrid(newScreenPos.x, newScreenPos.y)
      
      const canPlace = !isPositionOccupied(
        newGridPos.x,
        newGridPos.y,
        building.width,
        building.height,
        building.id
      )
      
      if (canPlace && newGridPos.x >= 0 && newGridPos.y >= 0 && 
          newGridPos.x + building.width <= 50 && newGridPos.y + building.height <= 50) {
        setDraggedPosition(newGridPos)
      }
    }
  }, [draggedBuildingId, isDragging, buildings, isPositionOccupied, startDragging])

  const handlePointerUp = useCallback(() => {
    if (isDragging && draggedBuildingId && draggedPosition) {
      moveBuilding(draggedBuildingId, draggedPosition.x, draggedPosition.y)
    } else if (draggedBuildingId && !isDragging && selectedBuildingId === draggedBuildingId) {
      // 클릭만 한 경우 선택 해제
      selectBuilding(null)
    }
    
    setIsDragging(false)
    setDraggedBuildingId(null)
    setDraggedPosition(null)
    dragStartRef.current = null
    stopDragging()
  }, [isDragging, draggedBuildingId, draggedPosition, selectedBuildingId, moveBuilding, selectBuilding, stopDragging])

  // 프리뷰 모드에서는 렌더링하지 않음
  if (editMode === 'preview') {
    return null
  }
  

  return (
    <Container
      eventMode="static"
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointerupoutside={handlePointerUp}
      zIndex={100}
    >
      {buildings.map((building) => {
        const isBeingDragged = isDragging && draggedBuildingId === building.id
        const displayPos = isBeingDragged && draggedPosition ? draggedPosition : { x: building.gridX, y: building.gridY }
        const pos = gridToScreen(displayPos.x + 1, displayPos.y + 1)
        const isSelected = selectedBuildingId === building.id
        
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
            cursor={isSelected ? (isBeingDragged ? "grabbing" : "grab") : "pointer"}
            hitArea={hitArea}
            pointerdown={(event) => handleBuildingPointerDown(building.id, event)}
            pointerover={() => hoverBuilding(building.id)}
            pointerout={() => hoverBuilding(null)}
            alpha={isBeingDragged ? 0.6 : 1}
          >
            <Graphics
              draw={(g: PixiGraphics) => {
                g.clear()
                
                const template = BUILDING_TEMPLATES[building.type as keyof typeof BUILDING_TEMPLATES]
                const statusColor = STATUS_COLORS[building.status as keyof typeof STATUS_COLORS]
                
                if (isBeingDragged) {
                  // 드래그 중인 건물을 아이소메트릭 3D로 그리기
                  // 상대 좌표로 아이소메트릭 변환
                  const topLeft = gridToScreen(0, 0)
                  const topRight = gridToScreen(building.width, 0)
                  const bottomRight = gridToScreen(building.width, building.height)
                  const bottomLeft = gridToScreen(0, building.height)
                  
                  // 중심점 기준으로 조정
                  const centerOffset = gridToScreen(building.width / 2, building.height / 2)
                  const adjustedTopLeft = { x: topLeft.x - centerOffset.x, y: topLeft.y - centerOffset.y }
                  const adjustedTopRight = { x: topRight.x - centerOffset.x, y: topRight.y - centerOffset.y }
                  const adjustedBottomRight = { x: bottomRight.x - centerOffset.x, y: bottomRight.y - centerOffset.y }
                  const adjustedBottomLeft = { x: bottomLeft.x - centerOffset.x, y: bottomLeft.y - centerOffset.y }
                  
                  const buildingHeight = 40
                  
                  // 바닥 그리기
                  g.beginFill(statusColor, 0.8)
                  g.lineStyle(2, 0x3b82f6, 1)
                  g.moveTo(adjustedTopLeft.x, adjustedTopLeft.y)
                  g.lineTo(adjustedTopRight.x, adjustedTopRight.y)
                  g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y)
                  g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y)
                  g.closePath()
                  g.endFill()
                  
                  // 왼쪽 벽
                  g.beginFill(statusColor, 0.6)
                  g.moveTo(adjustedBottomLeft.x, adjustedBottomLeft.y)
                  g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y - buildingHeight)
                  g.lineTo(adjustedTopLeft.x, adjustedTopLeft.y - buildingHeight)
                  g.lineTo(adjustedTopLeft.x, adjustedTopLeft.y)
                  g.closePath()
                  g.endFill()
                  
                  // 오른쪽 벽
                  g.beginFill(statusColor, 0.7)
                  g.moveTo(adjustedBottomLeft.x, adjustedBottomLeft.y)
                  g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y - buildingHeight)
                  g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y - buildingHeight)
                  g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y)
                  g.closePath()
                  g.endFill()
                  
                  // 지붕
                  g.beginFill(statusColor, 0.9)
                  g.lineStyle(2, 0x3b82f6, 1)
                  g.moveTo(adjustedTopLeft.x, adjustedTopLeft.y - buildingHeight)
                  g.lineTo(adjustedTopRight.x, adjustedTopRight.y - buildingHeight)
                  g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y - buildingHeight)
                  g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y - buildingHeight)
                  g.closePath()
                  g.endFill()
                  
                  // 드래그 중 하이라이트
                  g.beginFill(0x3b82f6, 0.2)
                  g.lineStyle(3, 0x3b82f6, 1)
                  g.moveTo(adjustedTopLeft.x, adjustedTopLeft.y - buildingHeight - 5)
                  g.lineTo(adjustedTopRight.x, adjustedTopRight.y - buildingHeight - 5)
                  g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y - buildingHeight - 5)
                  g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y - buildingHeight - 5)
                  g.closePath()
                  g.endFill()
                } else {
                  // 투명한 클릭 영역만 그리기
                  g.beginFill(0xffffff, 0.01)
                  g.drawRect(
                    -building.width * 32,
                    -building.height * 32,
                    building.width * 64,
                    building.height * 64
                  )
                  g.endFill()
                }
              }}
            />
            {isBeingDragged && (
              <>
                {/* 건물 아이콘 */}
                <Text
                  text={BUILDING_TEMPLATES[building.type as keyof typeof BUILDING_TEMPLATES]?.icon || '🏢'}
                  x={0}
                  y={-60}
                  anchor={0.5}
                  style={new TextStyle({
                    fontSize: 48,
                    fill: 0xffffff
                  })}
                />
                {/* 건물 이름 */}
                <Text
                  text={building.name}
                  x={0}
                  y={-30}
                  anchor={0.5}
                  style={new TextStyle({
                    fontSize: 12,
                    fill: 0x000000,
                    align: 'center',
                    fontWeight: 'bold'
                  })}
                />
              </>
            )}
          </Container>
        )
      })}
    </Container>
  )
}