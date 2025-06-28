'use client'

import { useUIStore } from '@/stores/uiStore'
import { useBuildingStore } from '@/stores/buildingStore'

export default function ConnectionModeToggle() {
  const editMode = useUIStore((state) => state.editMode)
  const connectionMode = useUIStore((state) => state.connectionMode)
  const setConnectionMode = useUIStore((state) => state.setConnectionMode)
  const connectingFromBuildingId = useBuildingStore((state) => state.connectingFromBuildingId)
  const startConnecting = useBuildingStore((state) => state.startConnecting)
  
  // 편집 모드에서만 연결 모드 사용 가능
  if (editMode !== 'edit') return null
  
  const handleToggle = () => {
    if (connectionMode) {
      setConnectionMode(false)
      startConnecting(null) // 연결 모드 해제시 선택 초기화
    } else {
      setConnectionMode(true)
    }
  }
  
  return (
    <button
      onClick={handleToggle}
      className={`
        p-2 rounded transition-colors
        ${connectionMode 
          ? 'bg-blue-500 text-white hover:bg-blue-600' 
          : 'hover:bg-gray-100'
        }
      `}
      title={connectionMode ? '연결 모드 끄기' : '연결 모드 켜기'}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" 
        />
      </svg>
      {connectingFromBuildingId && (
        <span className="ml-2 text-xs">연결 중...</span>
      )}
    </button>
  )
}