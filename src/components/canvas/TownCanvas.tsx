'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { Stage, Container, Graphics } from '@pixi/react'
import { Graphics as PixiGraphics, Application as PixiApplication } from 'pixi.js'
import * as PIXI from 'pixi.js'
import { screenToGrid, isValidGridPosition } from '@/lib/isometric'
import { useBuildingStore } from '@/stores/buildingStore'
import GridLayer from './layers/GridLayer'
import BuildingLayer from './layers/BuildingLayer'
import EditBuildingLayer from './layers/EditBuildingLayer'
import PreviewBuildingLayer from './layers/PreviewBuildingLayer'
import PlacementPreviewLayer from './layers/PlacementPreviewLayer'
import CellHoverLayer from './layers/CellHoverLayer'
import ConnectionLayer from './layers/ConnectionLayer'
import ConnectionPreviewLayer from './layers/ConnectionPreviewLayer'
import BuildingTooltip from './BuildingTooltip'
import Minimap from './Minimap'
import CoordinateDisplay from './CoordinateDisplay'
import DebugOverlay from './DebugOverlay'
import ContextMenu from '@/components/ui/ContextMenu'
import { useUIStore } from '@/stores/uiStore'

interface TownCanvasProps {
  zoom: number
  onCellClick: (x: number, y: number) => void
  onCellHover: (x: number, y: number) => void
}

export default function TownCanvas({ zoom, onCellClick, onCellHover }: TownCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  const [, setPixiApp] = useState<PixiApplication | null>(null)
  const dragStart = useRef({ x: 0, y: 0 })
  const lastOffset = useRef({ x: 0, y: 0 })
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  const contextMenu = useUIStore((state) => state.contextMenu)
  const setContextMenu = useUIStore((state) => state.setContextMenu)

  // 캔버스 크기 자동 조정
  useEffect(() => {
    const updateDimensions = () => {
      if (stageRef.current) {
        setDimensions({
          width: stageRef.current.clientWidth,
          height: stageRef.current.clientHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])


  // 드래그 핸들러
  const handlePointerDown = useCallback((event: any) => {
    const nativeEvent = event.nativeEvent || event
    if (nativeEvent.button === 1 || (nativeEvent.button === 0 && nativeEvent.shiftKey)) {
      // 중간 버튼 또는 Shift+왼쪽 클릭으로 드래그 시작
      setIsDragging(true)
      const globalX = event.data?.global?.x || event.clientX || 0
      const globalY = event.data?.global?.y || event.clientY || 0
      dragStart.current = { x: globalX, y: globalY }
      lastOffset.current = viewOffset
    }
  }, [viewOffset])

  const handlePointerMove = useCallback((event: any) => {
    if (isDragging) {
      const globalX = event.data?.global?.x || event.clientX || 0
      const globalY = event.data?.global?.y || event.clientY || 0
      const dx = globalX - dragStart.current.x
      const dy = globalY - dragStart.current.y
      
      setViewOffset({
        x: lastOffset.current.x + dx,
        y: lastOffset.current.y + dy,
      })
    }
  }, [isDragging])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])


  // 마우스 이벤트 처리
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return
    
    // 전역 마우스 위치 저장 (툴팁용)
    setMousePosition({ x: e.clientX, y: e.clientY })
    
    const rect = stageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - dimensions.width / 2 - viewOffset.x
    const y = e.clientY - rect.top - dimensions.height / 4 - viewOffset.y
    
    const scaledX = x / zoom
    const scaledY = y / zoom
    
    const gridPos = screenToGrid(scaledX, scaledY)
    
    if (isValidGridPosition(gridPos.x, gridPos.y)) {
      setHoveredCell(gridPos)
      onCellHover(gridPos.x, gridPos.y)
    } else {
      setHoveredCell(null)
    }
  }, [dimensions, viewOffset, zoom, onCellHover])


  const handleMouseLeave = useCallback(() => {
    setMousePosition(null)
    setHoveredCell(null)
  }, [])

  return (
    <div 
      ref={stageRef} 
      className="w-full h-full"
      style={{ position: 'relative' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        options={{
          backgroundColor: 0xf3f4f6, // Tailwind gray-100
          antialias: true,
          resolution: window.devicePixelRatio || 1,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMount={(app) => {
          setPixiApp(app)
        }}
      >
        <Container
          scale={zoom}
          position={[
            dimensions.width / 2 + viewOffset.x,
            dimensions.height / 4 + viewOffset.y
          ]}
          sortableChildren={true}
        >
          {/* 배경 클릭 영역 - 가장 아래 레이어 */}
          <Graphics
            draw={(g: PixiGraphics) => {
              g.clear()
              g.beginFill(0x000000, 0.01)
              g.drawRect(-5000, -5000, 10000, 10000)
              g.endFill()
            }}
            eventMode="static"
            pointerdown={(event) => {
              const point = event.data.global
              const x = (point.x - dimensions.width / 2 - viewOffset.x) / zoom
              const y = (point.y - dimensions.height / 4 - viewOffset.y) / zoom
              const gridPos = screenToGrid(x, y)
              
              if (isValidGridPosition(gridPos.x, gridPos.y)) {
                onCellClick(gridPos.x, gridPos.y)
              }
              
              useBuildingStore.getState().clearSelection()
              useBuildingStore.getState().selectConnection(null, null)
            }}
            zIndex={0}
          />
          <GridLayer />
          <CellHoverLayer hoveredCell={hoveredCell} />
          <ConnectionLayer />
          <BuildingLayer />
          <EditBuildingLayer />
          <PreviewBuildingLayer />
          <PlacementPreviewLayer hoveredCell={hoveredCell} />
          <ConnectionPreviewLayer />
        </Container>
      </Stage>
      <Minimap 
        viewOffset={viewOffset}
        zoom={zoom}
        onViewChange={setViewOffset}
      />
      <CoordinateDisplay 
        gridX={hoveredCell?.x ?? null}
        gridY={hoveredCell?.y ?? null}
      />
      <DebugOverlay />
      <BuildingTooltip mousePosition={mousePosition} />
      
      {/* 우클릭 메뉴 */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          buildingId={contextMenu.buildingId}
          multiSelect={contextMenu.multiSelect}
          selectedIds={contextMenu.selectedIds}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}