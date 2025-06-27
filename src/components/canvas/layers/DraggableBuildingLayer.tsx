'use client'

import React, { useCallback, useMemo, useState, useRef } from 'react'
import { Container, Graphics, Sprite } from '@pixi/react'
import { useBuildingStore } from '@/stores/buildingStore'
import { gridToScreen, screenToGrid } from '@/lib/isometric'
import { Graphics as PixiGraphics, Rectangle, FederatedPointerEvent } from 'pixi.js'
import { STATUS_COLORS } from '@/types/building'

interface DraggableBuildingLayerProps {
  mousePosition: { x: number; y: number } | null
}

const DraggableBuildingLayer: React.FC<DraggableBuildingLayerProps> = ({ mousePosition }) => {
  const buildings = useBuildingStore((state) => state.buildings)
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const hoveredBuildingId = useBuildingStore((state) => state.hoveredBuildingId)
  const draggingBuildingId = useBuildingStore((state) => state.draggingBuildingId)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  const hoverBuilding = useBuildingStore((state) => state.hoverBuilding)
  const startDragging = useBuildingStore((state) => state.startDragging)
  const stopDragging = useBuildingStore((state) => state.stopDragging)
  const moveBuilding = useBuildingStore((state) => state.moveBuilding)
  const isPositionOccupied = useBuildingStore((state) => state.isPositionOccupied)
  
  const [draggedPosition, setDraggedPosition] = useState<{ x: number; y: number } | null>(null)
  const dragStartRef = useRef<{ buildingX: number; buildingY: number; mouseX: number; mouseY: number } | null>(null)

  const handleBuildingPointerDown = useCallback((buildingId: string, event: FederatedPointerEvent) => {
    event.stopPropagation()
    
    const building = buildings.find(b => b.id === buildingId)
    if (!building) return
    
    // 드래그 시작 준비 (실제 드래그는 이동할 때 시작)
    const globalPos = event.data.global
    dragStartRef.current = {
      buildingX: building.gridX,
      buildingY: building.gridY,
      mouseX: globalPos.x,
      mouseY: globalPos.y
    }
    
    // 선택만 처리 (드래그는 이동 시 시작)
    if (selectedBuildingId === buildingId) {
      selectBuilding(null)
    } else {
      selectBuilding(buildingId, { x: event.data.global.x, y: event.data.global.y })
      hoverBuilding(buildingId)
    }
  }, [buildings, selectedBuildingId, selectBuilding, hoverBuilding])

  const handlePointerMove = useCallback((event: FederatedPointerEvent) => {
    // 드래그 시작 조건: 선택된 건물이 있고, 마우스를 누른 상태에서 이동
    if (selectedBuildingId && dragStartRef.current && !draggingBuildingId) {
      const dx = Math.abs(event.data.global.x - dragStartRef.current.mouseX)
      const dy = Math.abs(event.data.global.y - dragStartRef.current.mouseY)
      
      // 최소 이동 거리를 넘으면 드래그 시작
      if (dx > 5 || dy > 5) {
        const building = buildings.find(b => b.id === selectedBuildingId)
        if (building) {
          const buildingScreenPos = gridToScreen(building.gridX, building.gridY)
          const offset = {
            x: dragStartRef.current.mouseX - buildingScreenPos.x,
            y: dragStartRef.current.mouseY - buildingScreenPos.y
          }
          startDragging(selectedBuildingId, offset)
        }
      }
    }
    
    // 드래그 중일 때 위치 업데이트
    if (draggingBuildingId && dragStartRef.current) {
      const building = buildings.find(b => b.id === draggingBuildingId)
      if (!building) return
      
      // 마우스 이동 거리 계산
      const dx = event.data.global.x - dragStartRef.current.mouseX
      const dy = event.data.global.y - dragStartRef.current.mouseY
      
      // 그리드 좌표로 변환
      const screenPos = gridToScreen(dragStartRef.current.buildingX, dragStartRef.current.buildingY)
      const newScreenPos = {
        x: screenPos.x + dx,
        y: screenPos.y + dy
      }
      
      const newGridPos = screenToGrid(newScreenPos.x, newScreenPos.y)
      
      // 유효한 위치인지 확인
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
  }, [draggingBuildingId, selectedBuildingId, buildings, isPositionOccupied, startDragging])

  const handlePointerUp = useCallback(() => {
    if (draggingBuildingId && draggedPosition) {
      // 건물 이동
      moveBuilding(draggingBuildingId, draggedPosition.x, draggedPosition.y)
    }
    
    stopDragging()
    setDraggedPosition(null)
    dragStartRef.current = null
  }, [draggingBuildingId, draggedPosition, moveBuilding, stopDragging])

  const handleBuildingHover = useCallback((buildingId: string) => {
    if (!draggingBuildingId && hoveredBuildingId !== buildingId) {
      hoverBuilding(buildingId)
    }
  }, [hoverBuilding, hoveredBuildingId, draggingBuildingId])

  const handleBuildingLeave = useCallback(() => {
    if (!draggingBuildingId && hoveredBuildingId) {
      hoverBuilding(null)
    }
  }, [hoverBuilding, hoveredBuildingId, draggingBuildingId])

  // 투명 Sprite를 메모이제이션
  const transparentSprite = useMemo(() => (
    <Sprite 
      image="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" 
      alpha={0} 
      x={-1000} 
      y={-1000} 
      width={1} 
      height={1} 
    />
  ), [])

  return (
    <Container
      eventMode="static"
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointerupoutside={handlePointerUp}
    >
      {transparentSprite}
      {buildings.map((building) => {
        const isDragging = draggingBuildingId === building.id
        const displayPos = isDragging && draggedPosition ? draggedPosition : { x: building.gridX, y: building.gridY }
        const pos = gridToScreen(displayPos.x + 1, displayPos.y + 1)
        const isSelected = selectedBuildingId === building.id
        const isHovered = hoveredBuildingId === building.id
        const statusColor = STATUS_COLORS[building.status as keyof typeof STATUS_COLORS] || 0x666666

        // 건물 크기에 맞는 hitArea 설정
        const hitArea = new Rectangle(
          -building.width * 32,
          -building.height * 32,
          building.width * 64,
          building.height * 64
        )

        const draw = (g: PixiGraphics) => {
          g.clear()
          
          // 4개의 모서리 계산
          const topLeft = gridToScreen(displayPos.x, displayPos.y)
          const topRight = gridToScreen(displayPos.x + building.width, displayPos.y)
          const bottomRight = gridToScreen(displayPos.x + building.width, displayPos.y + building.height)
          const bottomLeft = gridToScreen(displayPos.x, displayPos.y + building.height)
          
          // Container의 중심점으로부터 상대적인 위치로 조정
          const centerX = pos.x
          const centerY = pos.y
          const adjustedTopLeft = { x: topLeft.x - centerX, y: topLeft.y - centerY }
          const adjustedTopRight = { x: topRight.x - centerX, y: topRight.y - centerY }
          const adjustedBottomRight = { x: bottomRight.x - centerX, y: bottomRight.y - centerY }
          const adjustedBottomLeft = { x: bottomLeft.x - centerX, y: bottomLeft.y - centerY }
          
          const buildingHeight = 40
          
          // 드래그 중일 때 반투명 처리
          const alpha = isDragging ? 0.6 : 0.8
          
          // 색상 결정
          let baseColor = statusColor
          if (isHovered && !isSelected) baseColor = (statusColor & 0x7f7f7f) + 0x404040
          
          // 바닥 그리기
          g.beginFill(baseColor, alpha)
          g.lineStyle(2, isSelected ? 0x3b82f6 : (isHovered ? 0xffa500 : 0x000000), 1)
          g.moveTo(adjustedTopLeft.x, adjustedTopLeft.y)
          g.lineTo(adjustedTopRight.x, adjustedTopRight.y)
          g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y)
          g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y)
          g.closePath()
          g.endFill()
          
          // 왼쪽 벽
          g.beginFill(baseColor, alpha * 0.75)
          g.moveTo(adjustedBottomLeft.x, adjustedBottomLeft.y)
          g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y - buildingHeight)
          g.lineTo(adjustedTopLeft.x, adjustedTopLeft.y - buildingHeight)
          g.lineTo(adjustedTopLeft.x, adjustedTopLeft.y)
          g.closePath()
          g.endFill()
          
          // 오른쪽 벽
          g.beginFill(baseColor, alpha * 0.875)
          g.moveTo(adjustedBottomLeft.x, adjustedBottomLeft.y)
          g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y - buildingHeight)
          g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y - buildingHeight)
          g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y)
          g.closePath()
          g.endFill()
          
          // 지붕
          g.beginFill(baseColor, alpha * 1.125)
          g.lineStyle(2, isSelected ? 0x3b82f6 : (isHovered ? 0xffa500 : 0x000000), 1)
          g.moveTo(adjustedTopLeft.x, adjustedTopLeft.y - buildingHeight)
          g.lineTo(adjustedTopRight.x, adjustedTopRight.y - buildingHeight)
          g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y - buildingHeight)
          g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y - buildingHeight)
          g.closePath()
          g.endFill()
          
          // 선택 효과
          if (isSelected) {
            g.lineStyle(3, 0x3b82f6, 1)
            g.beginFill(0x3b82f6, 0.1)
            g.moveTo(adjustedTopLeft.x, adjustedTopLeft.y - buildingHeight - 10)
            g.lineTo(adjustedTopRight.x, adjustedTopRight.y - buildingHeight - 10)
            g.lineTo(adjustedBottomRight.x, adjustedBottomRight.y - buildingHeight - 10)
            g.lineTo(adjustedBottomLeft.x, adjustedBottomLeft.y - buildingHeight - 10)
            g.closePath()
            g.endFill()
          }
          
        }

        return (
          <Container
            key={building.id}
            x={pos.x}
            y={pos.y}
            zIndex={100}
            eventMode="static"
            cursor={isDragging ? "grabbing" : "grab"}
            hitArea={hitArea}
            pointerdown={(event) => handleBuildingPointerDown(building.id, event)}
            pointerover={() => handleBuildingHover(building.id)}
            pointerout={handleBuildingLeave}
          >
            <Graphics draw={draw} />
          </Container>
        )
      })}
    </Container>
  )
}

export default DraggableBuildingLayer