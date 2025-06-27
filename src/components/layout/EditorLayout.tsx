'use client'

import { ReactNode } from 'react'

interface EditorLayoutProps {
  toolPanel: ReactNode
  canvas: ReactNode
  propertyPanel?: ReactNode
}

export default function EditorLayout({ toolPanel, canvas, propertyPanel }: EditorLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* 도구 패널 */}
      <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
        {toolPanel}
      </aside>

      {/* 캔버스 영역 */}
      <main className="flex-1 relative overflow-hidden">
        {canvas}
      </main>

      {/* 속성 패널 - propertyPanel이 null이 아닐 때만 렌더링 */}
      {propertyPanel && (
        <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          {propertyPanel}
        </aside>
      )}
    </div>
  )
}