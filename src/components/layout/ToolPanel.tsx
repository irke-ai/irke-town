'use client'

import { useState } from 'react'

type ToolCategory = 'buildings' | 'connections' | 'view'

export default function ToolPanel() {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('buildings')

  return (
    <div className="p-4">
      <h2 className="font-semibold mb-4">도구</h2>
      
      {/* 카테고리 탭 */}
      <div className="flex space-x-1 mb-4">
        <button
          className={`px-3 py-1.5 text-sm rounded ${
            activeCategory === 'buildings' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}
          onClick={() => setActiveCategory('buildings')}
        >
          건물
        </button>
        <button
          className={`px-3 py-1.5 text-sm rounded ${
            activeCategory === 'connections' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}
          onClick={() => setActiveCategory('connections')}
        >
          연결
        </button>
        <button
          className={`px-3 py-1.5 text-sm rounded ${
            activeCategory === 'view' 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}
          onClick={() => setActiveCategory('view')}
        >
          뷰
        </button>
      </div>

      {/* 도구 목록 */}
      {activeCategory === 'buildings' && (
        <div className="space-y-2">
          <div className="p-3 border border-gray-200 rounded cursor-pointer hover:border-primary">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                <span className="text-xl">🏛️</span>
              </div>
              <div>
                <p className="font-medium">API Gateway</p>
                <p className="text-xs text-gray-500">2x3</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 border border-gray-200 rounded cursor-pointer hover:border-primary">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                <span className="text-xl">🗄️</span>
              </div>
              <div>
                <p className="font-medium">Database</p>
                <p className="text-xs text-gray-500">3x3</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 border border-gray-200 rounded cursor-pointer hover:border-primary">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                <span className="text-xl">📱</span>
              </div>
              <div>
                <p className="font-medium">Frontend Page</p>
                <p className="text-xs text-gray-500">2x2</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}