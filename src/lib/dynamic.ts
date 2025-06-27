import dynamic from 'next/dynamic'

// Pixi.js는 브라우저 환경에서만 작동하므로 SSR 비활성화
export const DynamicCanvas = dynamic(
  () => import('@/components/canvas/TownCanvas'),
  { 
    ssr: false
  }
)