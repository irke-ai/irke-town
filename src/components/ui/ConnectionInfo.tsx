'use client'

import { useBuildingStore } from '@/stores/buildingStore'
import { useUIStore } from '@/stores/uiStore'

export default function ConnectionInfo() {
  const selectedConnectionId = useBuildingStore((state) => state.selectedConnectionId)
  const selectedConnectionPosition = useBuildingStore((state) => state.selectedConnectionPosition)
  const connections = useBuildingStore((state) => state.connections)
  const buildings = useBuildingStore((state) => state.buildings)
  const removeConnection = useBuildingStore((state) => state.removeConnection)
  const editMode = useUIStore((state) => state.editMode)
  
  if (editMode !== 'edit' || !selectedConnectionId || !selectedConnectionPosition) return null
  
  const connection = connections.find(c => c.id === selectedConnectionId)
  if (!connection) return null
  
  const fromBuilding = buildings.find(b => b.id === connection.fromBuildingId)
  const toBuilding = buildings.find(b => b.id === connection.toBuildingId)
  
  // 화면 경계를 고려한 위치 계산
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${selectedConnectionPosition.x + 10}px`,
    top: `${selectedConnectionPosition.y + 10}px`,
    maxWidth: '300px'
  }
  
  // 화면 오른쪽 경계 체크
  if (selectedConnectionPosition.x > window.innerWidth - 320) {
    style.left = 'auto'
    style.right = `${window.innerWidth - selectedConnectionPosition.x + 10}px`
  }
  
  // 화면 아래쪽 경계 체크
  if (selectedConnectionPosition.y > window.innerHeight - 200) {
    style.top = 'auto'
    style.bottom = `${window.innerHeight - selectedConnectionPosition.y + 10}px`
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-4" style={style}>
      <h3 className="font-semibold text-sm mb-2">연결 정보</h3>
      <div className="space-y-1 text-xs text-gray-600">
        <div>
          <span className="font-medium">시작:</span> {fromBuilding?.name || '알 수 없음'}
        </div>
        <div>
          <span className="font-medium">도착:</span> {toBuilding?.name || '알 수 없음'}
        </div>
        <div>
          <span className="font-medium">거리:</span> {connection.metadata?.distance || 0}칸
        </div>
        <div>
          <span className="font-medium">상태:</span>{' '}
          <span className={`
            ${connection.status === 'active' ? 'text-green-600' : ''}
            ${connection.status === 'inactive' ? 'text-gray-500' : ''}
            ${connection.status === 'error' ? 'text-red-600' : ''}
          `}>
            {connection.status === 'active' && '활성'}
            {connection.status === 'inactive' && '비활성'}
            {connection.status === 'error' && '오류'}
          </span>
        </div>
      </div>
      <button
        onClick={() => removeConnection(selectedConnectionId)}
        className="mt-3 w-full text-xs bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 transition-colors"
      >
        연결 삭제
      </button>
    </div>
  )
}