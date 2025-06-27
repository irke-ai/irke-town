import React from 'react'
import { useBuildingStore } from '@/stores/buildingStore'
import { useUIStore } from '@/stores/uiStore'
import { BUILDING_TEMPLATES, STATUS_COLORS } from '@/types/building'

interface MousePosition {
  x: number
  y: number
}

interface BuildingTooltipProps {
  mousePosition: MousePosition | null
}

export default function BuildingTooltip({ mousePosition }: BuildingTooltipProps) {
  const selectedBuildingId = useBuildingStore((state) => state.selectedBuildingId)
  const hoveredBuildingId = useBuildingStore((state) => state.hoveredBuildingId)
  const buildings = useBuildingStore((state) => state.buildings)
  const selectBuilding = useBuildingStore((state) => state.selectBuilding)
  const removeBuilding = useBuildingStore((state) => state.removeBuilding)
  const selectedBuildingPosition = useBuildingStore((state) => state.selectedBuildingPosition)
  const draggingBuildingId = useBuildingStore((state) => state.draggingBuildingId)
  const editMode = useUIStore((state) => state.editMode)

  // 선택된 건물과 호버된 건물 정보를 각각 계산
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId)
  const hoveredBuilding = buildings.find(b => b.id === hoveredBuildingId)
  
  const selectedTemplate = selectedBuilding ? BUILDING_TEMPLATES[selectedBuilding.type as keyof typeof BUILDING_TEMPLATES] : null
  const hoveredTemplate = hoveredBuilding ? BUILDING_TEMPLATES[hoveredBuilding.type as keyof typeof BUILDING_TEMPLATES] : null

  const handleEdit = (buildingId: string) => {
    selectBuilding(buildingId)
  }

  const handleDelete = () => {
    if (selectedBuildingId) {
      removeBuilding(selectedBuildingId)
      selectBuilding(null)
    }
  }

  const renderTooltip = (building: any, template: any, isSelected: boolean) => {
    const statusColorClass = building.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
    
    const tooltipStyle: React.CSSProperties = isSelected ? {
      // 선택된 건물: 클릭한 위치에 고정
      position: 'fixed',
      left: selectedBuildingPosition ? selectedBuildingPosition.x + 15 : 100,
      top: selectedBuildingPosition ? selectedBuildingPosition.y - 10 : 100,
      zIndex: 1000,
    } : {
      // 호버만: 마우스 커서 따라다니기
      position: 'fixed',
      left: mousePosition ? mousePosition.x + 15 : 0,
      top: mousePosition ? mousePosition.y - 10 : 0,
      zIndex: 1000
    }

    return (
      <div
        key={building.id}
        style={tooltipStyle}
        className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700 pointer-events-auto max-w-xs"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-sm">{building.name}</h3>
            <p className={`text-xs ${statusColorClass}`}>
              {template.name}
            </p>
          </div>
          {isSelected ? (
            <div className="space-x-1">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs">
                편집
              </button>
              <button 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
              >
                삭제
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleEdit(building.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              편집
            </button>
          )}
        </div>
        
        <div className="text-xs text-gray-300">
          <p>위치: ({building.gridX}, {building.gridY})</p>
          <p>크기: {building.width} × {building.height}</p>
          <p>상태: {building.status}</p>
        </div>
      </div>
    )
  }

  // 드래그 중일 때는 툴팁 숨기기
  if (draggingBuildingId) {
    return null
  }

  // 프리뷰 모드에서만 툴팁 표시
  if (editMode === 'preview') {
    return (
      <>
        {/* 선택된 건물 툴팁 - 클릭한 위치에 고정 */}
        {selectedBuilding && selectedTemplate && renderTooltip(selectedBuilding, selectedTemplate, true)}
        
        {/* 호버된 건물 툴팁 - 마우스 따라다님 (선택된 건물과 다를 때만) */}
        {hoveredBuilding && hoveredTemplate && hoveredBuildingId !== selectedBuildingId && mousePosition && 
          renderTooltip(hoveredBuilding, hoveredTemplate, false)}
      </>
    )
  }

  // 편집 모드에서는 툴팁 표시하지 않음
  return null
}