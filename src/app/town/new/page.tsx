'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewTownPage() {
  const router = useRouter()
  const [projectName, setProjectName] = useState('')

  const handleCreate = () => {
    if (projectName.trim()) {
      // TODO: 실제로는 프로젝트 생성 후 ID를 받아야 함
      const projectId = 'temp-id-123'
      router.push(`/town/${projectId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">새 타운 만들기</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              프로젝트 이름
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="My Awesome App"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명 (선택)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="프로젝트에 대한 간단한 설명..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              disabled={!projectName.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              타운 만들기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}