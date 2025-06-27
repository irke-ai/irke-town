'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  const isEditor = pathname.includes('/town/')

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 z-header relative">
      <div className="flex items-center space-x-4 flex-1">
        {/* 로고 */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <span className="text-white font-bold">IT</span>
          </div>
          <span className="font-semibold text-lg">IRKE TOWN</span>
        </Link>

        {/* 프로젝트 이름 (에디터에서만 표시) */}
        {isEditor && (
          <div className="flex items-center space-x-2 ml-8">
            <span className="text-gray-500">/</span>
            <span className="font-medium">My Awesome Project</span>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      {isEditor && (
        <div className="flex items-center space-x-3">
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">
            저장
          </button>
          <button className="btn-primary text-sm">
            배포
          </button>
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
      )}
    </header>
  )
}