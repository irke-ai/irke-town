'use client'

import { useBuildingStore } from '@/stores/buildingStore'
import { BUILDING_TEMPLATES, STATUS_COLORS } from '@/types/building'

export default function PropertyPanel() {
  // BuildingTooltip으로 통합되어 더 이상 사용하지 않음
  return null
  
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const buildings = useBuildingStore((state) => state.buildings)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  
  // 선택된 건물만 표시 (편집 모드 전용)
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
  
  if (!selectedBuilding) {
    return (
      <div className="p-4">
        <h2 className="font-semibold mb-4">편집</h2>
        <div className="text-center text-gray-400 mt-8">
          <div className="mb-4">
            <span className="text-4xl">🔧</span>
          </div>
          <p className="text-sm">건물을 클릭하여</p>
          <p className="text-sm">편집 모드를 시작하세요</p>
        </div>
      </div>
    )
  }

  const template = BUILDING_TEMPLATES[selectedBuilding.type as keyof typeof BUILDING_TEMPLATES]
  const statusColor = STATUS_COLORS[selectedBuilding.status as keyof typeof STATUS_COLORS]

  const handleDeselect = () => {
    selectBuilding(null)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">편집 모드</h2>
        <button 
          onClick={handleDeselect}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
        >
          ✕ 닫기
        </button>
      </div>
      
      <div className="space-y-4">
        {/* 건물 정보 헤더 */}
        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
          <span className="text-2xl">{template?.icon || '🏢'}</span>
          <div>
            <h3 className="font-medium">{selectedBuilding.name}</h3>
            <p className="text-sm text-gray-500">{template?.description}</p>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">기본 정보</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">타입:</span>
              <span className="font-medium">{template?.name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">상태:</span>
              <span 
                className="font-medium px-2 py-1 rounded text-white text-xs"
                style={{ backgroundColor: `#${statusColor.toString(16).padStart(6, '0')}` }}
              >
                {selectedBuilding.status}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">위치:</span>
              <span>{selectedBuilding.gridX}, {selectedBuilding.gridY}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">크기:</span>
              <span>{selectedBuilding.width} × {selectedBuilding.height}</span>
            </div>
          </div>
        </div>

        {/* 편집 액션 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">편집 액션</h4>
          <div className="space-y-2">
            <button className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2">
              <span>🔧</span>
              <span>속성 편집</span>
            </button>
            <button className="w-full px-3 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2">
              <span>📍</span>
              <span>위치 이동</span>
            </button>
            <button className="w-full px-3 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2">
              <span>📋</span>
              <span>상세 설정</span>
            </button>
            <button className="w-full px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors flex items-center justify-center space-x-2">
              <span>🗑️</span>
              <span>건물 삭제</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}