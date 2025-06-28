'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useUIStore } from '@/stores/uiStore'
import { useBuildingStore } from '@/stores/buildingStore'
import { BuildingType, BuildingStatus, BUILDING_TEMPLATES } from '@/types/building'
import { DynamicCanvas } from '@/lib/dynamic'
import BuildingPalette from '@/components/ui/BuildingPalette'
import EditModeToggle from '@/components/ui/EditModeToggle'
import ConnectionModeToggle from '@/components/ui/ConnectionModeToggle'
import ConnectionInfo from '@/components/ui/ConnectionInfo'
import SaveLoadMenu from '@/components/ui/SaveLoadMenu'
import { TownStorage } from '@/lib/townStorage'

export default function CanvasContainer() {
  const zoom = useUIStore((state) => state.zoom)
  const setZoom = useUIStore((state) => state.setZoom)
  const placingBuildingType = useBuildingStore((state) => state.placingBuildingType)
  const addBuilding = useBuildingStore((state) => state.addBuilding)
  const isPositionOccupied = useBuildingStore((state) => state.isPositionOccupied)
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const removeBuilding = useBuildingStore((state) => state.removeBuilding)
  const buildings = useBuildingStore((state) => state.buildings)
  const connections = useBuildingStore((state) => state.connections)
  const updateBuilding = useBuildingStore((state) => state.updateBuilding)
  const addConnection = useBuildingStore((state) => state.addConnection)
  
  // 테스트용 건물 한 번만 추가
  const initOnce = useRef(false)
  
  useEffect(() => {
    if (!initOnce.current) {
      initOnce.current = true
      
      // API 서버
      addBuilding({
        type: BuildingType.API,
        name: 'API Server',
        gridX: 25,
        gridY: 25,
        width: 2,
        height: 2,
        status: BuildingStatus.READY
      })
      
      // Database  
      addBuilding({
        type: BuildingType.DATABASE,
        name: 'Database',
        gridX: 23,
        gridY: 28,
        width: 2,
        height: 2,
        status: BuildingStatus.PLANNING
      })
      
      // Frontend
      addBuilding({
        type: BuildingType.FRONTEND,
        name: 'Frontend',
        gridX: 28,
        gridY: 26,
        width: 3,
        height: 3,
        status: BuildingStatus.BUILDING
      })
    }
  }, [addBuilding])

  // 마우스 휠 줌
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoom(zoom + delta)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      window.removeEventListener('wheel', handleWheel)
    }
  }, [zoom, setZoom])
  
  // 자동 저장 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      const sessionId = TownStorage.getCurrentSession()
      if (sessionId) {
        TownStorage.autoSave(buildings, connections)
      }
    }, 30000) // 30초
    
    return () => clearInterval(interval)
  }, [buildings, connections])
  
  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete 키로 선택된 항목 삭제
      if (e.key === 'Delete') {
        const selectedConnectionId = useBuildingStore.getState().selectedConnectionId
        if (selectedBuildingId) {
          removeBuilding(selectedBuildingId)
        } else if (selectedConnectionId) {
          useBuildingStore.getState().removeConnection(selectedConnectionId)
        }
      }
      
      // R 키로 선택된 건물 회전
      if (e.key === 'r' || e.key === 'R') {
        const editMode = useUIStore.getState().editMode
        if (editMode === 'edit' && selectedBuildingId) {
          useBuildingStore.getState().rotateBuilding(selectedBuildingId)
        }
      }
      
      // Escape 키로 모드 취소
      if (e.key === 'Escape') {
        const connectionMode = useUIStore.getState().connectionMode
        const placingBuildingType = useBuildingStore.getState().placingBuildingType
        
        // 연결 모드 취소
        if (connectionMode) {
          useUIStore.getState().setConnectionMode(false)
          useBuildingStore.getState().startConnecting(null)
        }
        
        // 건물 배치 모드 취소
        if (placingBuildingType) {
          useBuildingStore.getState().setPlacingBuildingType(null)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedBuildingId, removeBuilding])

  const selectBuilding = useBuildingStore((state) => state.selectBuilding)

  const handleCellClick = (x: number, y: number) => {
    
    // 건물 배치 모드일 때만 새 건물 추가
    if (placingBuildingType) {
      const template = BUILDING_TEMPLATES[placingBuildingType]
      
      // 충돌 검사
      if (!isPositionOccupied(x, y, template.width, template.height)) {
        addBuilding({
          type: placingBuildingType,
          name: template.name,
          gridX: x,
          gridY: y,
          width: template.width,
          height: template.height,
          status: BuildingStatus.PLANNING
        })
      }
    }
  }

  const handleCellHover = (x: number, y: number) => {
    // 호버 효과는 Canvas 내부에서 처리
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 클릭한 요소가 캔버스 컨테이너 자체인 경우만 선택 해제
    if (e.target === e.currentTarget) {
      selectBuilding(null)
    }
  }

  return (
    <div 
      className="w-full h-full relative" 
      onClick={handleCanvasClick} 
      onContextMenu={(e) => e.preventDefault()}
    >
      <Suspense fallback={
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <p className="text-gray-400">캔버스 로딩 중...</p>
        </div>
      }>
        <DynamicCanvas
          zoom={zoom}
          onCellClick={handleCellClick}
          onCellHover={handleCellHover}
        />
      </Suspense>
      
      {/* UI 패널들 */}
      <BuildingPalette />
      <ConnectionInfo />
      <SaveLoadMenu />
      
      {/* 하단 컨트롤 */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        {/* 편집 모드 토글 */}
        <div className="bg-white rounded-lg shadow-lg p-2 flex gap-2">
          <EditModeToggle />
          <ConnectionModeToggle />
        </div>
        
        {/* 줌 컨트롤 */}
        <div className="bg-white rounded-lg shadow-lg p-2 flex items-center">
          <button
            onClick={() => setZoom(zoom + 0.1)}
            className="p-2 hover:bg-gray-100 rounded"
            title="확대"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button
            onClick={() => setZoom(zoom - 0.1)}
            className="p-2 hover:bg-gray-100 rounded"
            title="축소"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 hover:bg-gray-100 rounded"
            title="초기화"
          >
            <span className="text-sm">{Math.round(zoom * 100)}%</span>
          </button>
        </div>
      </div>
      
    </div>
  )
}