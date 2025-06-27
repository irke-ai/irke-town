'use client'

import { useUIStore } from '@/stores/uiStore'

export default function EditModeToggle() {
  const editMode = useUIStore((state) => state.editMode)
  const toggleEditMode = useUIStore((state) => state.toggleEditMode)

  return (
    <button
      onClick={toggleEditMode}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        editMode === 'preview'
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          : 'bg-blue-500 text-white hover:bg-blue-600'
      }`}
    >
      {editMode === 'preview' ? '프리뷰 모드' : '편집 모드'}
    </button>
  )
}