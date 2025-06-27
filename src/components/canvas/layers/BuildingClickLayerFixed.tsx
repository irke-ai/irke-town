'use client'

import React, { useCallback, useMemo, useState, useRef } from 'react'
import { Container, Graphics, Sprite } from '@pixi/react'
import { useBuildingStore } from '@/stores/buildingStore'
import { gridToScreen, screenToGrid } from '@/lib/isometric'
import { Graphics as PixiGraphics, Rectangle, FederatedPointerEvent } from 'pixi.js'
import { STATUS_COLORS } from '@/types/building'

interface BuildingClickLayerFixedProps {
  mousePosition: { x: number; y: number } | null
}

/**
 * 건물 클릭 이벤트를 처리하는 레이어
 * @pixi/react v7 호환성 문제 해결을 위한 컴포넌트
 */
const BuildingClickLayerFixed: React.FC<BuildingClickLayerFixedProps> = () => {
  const buildings = useBuildingStore((state) => state.buildings)
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const hoveredBuildingId = useBuildingStore((state) => state.hoveredBuildingId)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  const hoverBuilding = useBuildingStore((state) => state.hoverBuilding)
  const moveBuilding = useBuildingStore((state) => state.moveBuilding)
  const isPositionOccupied = useBuildingStore((state) => state.isPositionOccupied)
  
  const [isDragging, setIsDragging] = useState(false)
  const [draggedBuildingId, setDraggedBuildingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [draggedPosition, setDraggedPosition] = useState<{ x: number; y: number } | null>(null)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)

  const handleBuildingPointerDown = useCallback((buildingId: string, event: FederatedPointerEvent) => {
    console.log('Building pointer down:', buildingId, 'Selected:', selectedBuildingId)
    event.stopPropagation()
    
    const building = buildings.find(b => b.id === buildingId)
    if (!building) return
    
    // 클릭한 위치를 저장
    const clickPosition = { x: event.data.global.x, y: event.data.global.y }
    dragStartPos.current = clickPosition
    
    // 드래그 준비 (선택된 건물만 드래그 가능)
    if (selectedBuildingId === buildingId) {
      console.log('Preparing drag for selected building')
      setDraggedBuildingId(buildingId)
      const buildingScreenPos = gridToScreen(building.gridX, building.gridY)
      setDragOffset({
        x: clickPosition.x - buildingScreenPos.x,
        y: clickPosition.y - buildingScreenPos.y
      })
    } else {
      // 선택되지 않은 건물 클릭 시 선택
      console.log('Selecting building:', buildingId)
      selectBuilding(buildingId, clickPosition)
      hoverBuilding(buildingId)
    }
  }, [buildings, selectBuilding, hoverBuilding, selectedBuildingId])
  
  const handlePointerMove = useCallback((event: FederatedPointerEvent) => {
    if (!draggedBuildingId || !dragStartPos.current) return
    
    const currentPos = { x: event.data.global.x, y: event.data.global.y }
    const distance = Math.sqrt(
      Math.pow(currentPos.x - dragStartPos.current.x, 2) + 
      Math.pow(currentPos.y - dragStartPos.current.y, 2)
    )
    
    // 5픽셀 이상 이동했을 때 드래그 시작
    if (distance > 5 && !isDragging) {
      setIsDragging(true)
    }
    
    if (isDragging) {
      const building = buildings.find(b => b.id === draggedBuildingId)
      if (!building) return
      
      // 드래그 위치 계산
      const newScreenPos = {
        x: currentPos.x - dragOffset.x,
        y: currentPos.y - dragOffset.y
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
  }, [draggedBuildingId, isDragging, buildings, dragOffset, isPositionOccupied])
  
  const handlePointerUp = useCallback(() => {
    console.log('Pointer up - isDragging:', isDragging, 'draggedBuildingId:', draggedBuildingId)
    if (isDragging && draggedBuildingId && draggedPosition) {
      // 드래그로 이동한 경우
      console.log('Moving building to:', draggedPosition)
      moveBuilding(draggedBuildingId, draggedPosition.x, draggedPosition.y)
    } else if (draggedBuildingId && !isDragging && selectedBuildingId === draggedBuildingId) {
      // 드래그하지 않고 클릭만 한 경우 (선택된 건물 다시 클릭)
      console.log('Deselecting building')
      selectBuilding(null)
    }
    
    // 드래그 상태 초기화
    setIsDragging(false)
    setDraggedBuildingId(null)
    setDraggedPosition(null)
    dragStartPos.current = null
  }, [isDragging, draggedBuildingId, draggedPosition, selectedBuildingId, moveBuilding, selectBuilding])

  const handleBuildingHover = useCallback((buildingId: string) => {
    // 이미 호버된 건물이면 무시
    if (hoveredBuildingId === buildingId) {
      return
    }
    hoverBuilding(buildingId)
  }, [hoverBuilding, hoveredBuildingId])

  const handleBuildingLeave = useCallback(() => {
    // 호버된 건물이 없으면 무시
    if (!hoveredBuildingId) {
      return
    }
    hoverBuilding(null)
  }, [hoverBuilding, hoveredBuildingId])

  // 투명 Sprite를 메모이제이션하여 재렌더링 방지
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
        const isBeingDragged = isDragging && draggedBuildingId === building.id
        const displayPos = isBeingDragged && draggedPosition ? draggedPosition : { x: building.gridX, y: building.gridY }
        const pos = gridToScreen(displayPos.x + 1, displayPos.y + 1)
        const isSelected = selectedBuildingId === building.id
        const isHovered = hoveredBuildingId === building.id
        const statusColor = STATUS_COLORS[building.status as keyof typeof STATUS_COLORS] || 0x666666

        // 건물 크기에 맞는 정확한 hitArea 설정
        const hitArea = new Rectangle(
          -building.width * 32,
          -building.height * 32,
          building.width * 64,
          building.height * 64
        )

        const draw = (g: PixiGraphics) => {
          g.clear()
          
          // 드래그 중일 때 투명도 조정
          const alpha = isBeingDragged ? 0.6 : 0.8
          
          // 4개의 모서리 계산 (표시 위치 사용)
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
          
          // 색상 결정 (호버 시 더 밝게)
          let baseColor = statusColor
          if (isHovered && !isSelected) baseColor = (statusColor & 0x7f7f7f) + 0x404040 // 더 밝게
          
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
            zIndex={100} // 다른 레이어보다 높은 우선순위
            eventMode="static"
            cursor={isBeingDragged ? "grabbing" : "grab"}
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

export default BuildingClickLayerFixed