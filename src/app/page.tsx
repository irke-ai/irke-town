import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            IRKE TOWN
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            웹 앱 개발을 타운 빌딩 게임으로 변환하는 혁신적인 플랫폼
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/town/new" className="btn-primary">
              새 타운 만들기
            </Link>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              데모 보기
            </button>
          </div>
        </div>
        
        {/* 특징 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎮</span>
            </div>
            <h3 className="font-semibold mb-2">게임화된 개발</h3>
            <p className="text-gray-600">건물을 배치하고 연결하여 앱을 만드세요</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="font-semibold mb-2">AI 자동화</h3>
            <p className="text-gray-600">AI가 자동으로 코드를 생성합니다</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="font-semibold mb-2">즉시 배포</h3>
            <p className="text-gray-600">완성된 앱을 바로 배포하세요</p>
          </div>
        </div>
      </div>
    </div>
  )
}