'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBuildingStore } from '@/stores/buildingStore'
import { useUIStore } from '@/stores/uiStore'

interface ContextMenuProps {
  position: { x: number; y: number }
  onClose: () => void
  buildingId: string
  multiSelect?: boolean
  selectedIds?: string[]
}

export default function ContextMenu({ position, onClose, buildingId, multiSelect, selectedIds }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const removeBuilding = useBuildingStore((state) => state.removeBuilding)
  const addConnection = useBuildingStore((state) => state.addConnection)
  const clearSelection = useBuildingStore((state) => state.clearSelection)
  const rotateBuilding = useBuildingStore((state) => state.rotateBuilding)
  const editMode = useUIStore((state) => state.editMode)
  
  // 편집 모드에서만 표시
  if (editMode !== 'edit') return null
  
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])
  
  const handleDelete = () => {
    if (selectedIds && selectedIds.length > 1) {
      // 복수 선택된 경우 모두 삭제
      selectedIds.forEach(id => removeBuilding(id))
      clearSelection()
    } else {
      // 단일 선택된 경우
      removeBuilding(buildingId)
    }
    onClose()
  }
  
  const handleConnect = () => {
    if (selectedIds && selectedIds.length === 2) {
      const [fromId, toId] = selectedIds
      addConnection(fromId, toId)
      clearSelection()
    }
    onClose()
  }
  
  const handleRotate = () => {
    rotateBuilding(buildingId)
    onClose()
  }
  
  // 화면 경계를 고려한 위치 계산
  const style: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    zIndex: 10000
  }
  
  // 클라이언트 사이드에서만 화면 경계 체크
  if (typeof window !== 'undefined') {
    // 화면 오른쪽 경계 체크
    if (position.x > window.innerWidth - 150) {
      style.left = position.x - 150
    }
    
    // 화면 아래쪽 경계 체크
    if (position.y > window.innerHeight - 100) {
      style.top = position.y - 80
    }
  }
  
  
  const menuContent = (
    <div
      ref={menuRef}
      className="bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[150px]"
      style={{
        ...style,
        pointerEvents: 'auto',
        backgroundColor: 'white',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      }}
    >
      {multiSelect && selectedIds?.length === 2 ? (
        <>
          <button
            onClick={handleConnect}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            건물 연결
          </button>
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 hover:text-red-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            선택한 건물 삭제 (2개)
          </button>
        </>
      ) : multiSelect && selectedIds && selectedIds.length > 2 ? (
        <button
          onClick={handleDelete}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 hover:text-red-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          선택한 건물 삭제 ({selectedIds.length}개)
        </button>
      ) : (
        <>
          {!multiSelect && (
            <button
              onClick={handleRotate}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-gray-700 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              회전 (R)
            </button>
          )}
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 hover:text-red-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            건물 삭제
          </button>
        </>
      )}
    </div>
  )
  
  // 클라이언트 사이드에서만 포털 사용
  if (!mounted) return null
  
  return createPortal(menuContent, document.body)
}