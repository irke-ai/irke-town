'use client'

import { useBuildingStore } from '@/stores/buildingStore'
import { BuildingStatus } from '@/types/building'

export default function BuildingProperties() {
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const buildings = useBuildingStore((state) => state.buildings)
  const updateBuilding = useBuildingStore((state) => state.updateBuilding)
  const removeBuilding = useBuildingStore((state) => state.removeBuilding)
  
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
  
  if (!selectedBuilding) return null
  
  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-80">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-semibold">건물 속성</h3>
        <button
          onClick={() => removeBuilding(selectedBuilding.id)}
          className="text-red-500 hover:text-red-700 text-xs"
        >
          삭제
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            이름
          </label>
          <input
            type="text"
            value={selectedBuilding.name}
            onChange={(e) => updateBuilding(selectedBuilding.id, { name: e.target.value })}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            상태
          </label>
          <select
            value={selectedBuilding.status}
            onChange={(e) => updateBuilding(selectedBuilding.id, { 
              status: e.target.value as BuildingStatus 
            })}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={BuildingStatus.PLANNING}>계획 중</option>
            <option value={BuildingStatus.BUILDING}>건설 중</option>
            <option value={BuildingStatus.READY}>완료</option>
            <option value={BuildingStatus.ERROR}>오류</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            위치
          </label>
          <div className="text-sm text-gray-600">
            X: {selectedBuilding.gridX}, Y: {selectedBuilding.gridY}
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            크기
          </label>
          <div className="text-sm text-gray-600">
            {selectedBuilding.width} x {selectedBuilding.height}
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            설명
          </label>
          <textarea
            value={selectedBuilding.metadata?.description || ''}
            onChange={(e) => updateBuilding(selectedBuilding.id, { 
              metadata: { 
                ...selectedBuilding.metadata, 
                description: e.target.value 
              }
            })}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="건물에 대한 설명을 입력하세요..."
          />
        </div>
      </div>
      
      <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-600">
        💡 Tip: Delete 키를 눌러 건물을 삭제하거나, 드래그하여 이동할 수 있습니다.
      </div>
    </div>
  )
}