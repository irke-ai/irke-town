'use client'

import { useBuildingStore } from '@/stores/buildingStore'
import { BUILDING_TEMPLATES, BuildingType } from '@/types/building'

import { useUIStore } from '@/stores/uiStore'

export default function BuildingPalette() {
  const placingBuildingType = useBuildingStore((state) => state.placingBuildingType)
  const setPlacingBuildingType = useBuildingStore((state) => state.setPlacingBuildingType)
  const editMode = useUIStore((state) => state.editMode)
  
  // 편집 모드에서만 표시
  if (editMode !== 'edit') return null
  
  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-sm font-semibold mb-3">건물 배치</h3>
      <div className="space-y-2">
        {Object.values(BUILDING_TEMPLATES).map((template) => (
          <button
            key={template.type}
            onClick={() => setPlacingBuildingType(
              placingBuildingType === template.type ? null : template.type
            )}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all
              ${placingBuildingType === template.type
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-2xl">{template.icon}</span>
            <div className="text-left">
              <div className="font-medium text-sm">{template.name}</div>
              <div className="text-xs text-gray-500">{template.description}</div>
              <div className="text-xs text-gray-400">
                크기: {template.width}x{template.height}
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {placingBuildingType && (
        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
          클릭하여 건물을 배치하세요
        </div>
      )}
    </div>
  )
}