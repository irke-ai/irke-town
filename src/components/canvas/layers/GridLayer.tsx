import { Graphics } from '@pixi/react'
import { useCallback } from 'react'
import { Graphics as PixiGraphics } from 'pixi.js'
import { GRID_CONFIG, gridToScreen } from '@/lib/isometric'

export default function GridLayer() {
  const draw = useCallback((g: PixiGraphics) => {
    g.clear()
    
    // 그리드 라인 색상
    const lineColor = 0xd1d5db // Tailwind gray-300
    const lineAlpha = 0.5
    
    // 수평선 그리기 (실제로는 아이소메트릭 대각선)
    for (let y = 0; y <= GRID_CONFIG.height; y++) {
      g.lineStyle(1, lineColor, lineAlpha)
      
      const start = gridToScreen(0, y)
      const end = gridToScreen(GRID_CONFIG.width, y)
      
      g.moveTo(start.x, start.y)
      g.lineTo(end.x, end.y)
    }
    
    // 수직선 그리기 (실제로는 아이소메트릭 대각선)
    for (let x = 0; x <= GRID_CONFIG.width; x++) {
      g.lineStyle(1, lineColor, lineAlpha)
      
      const start = gridToScreen(x, 0)
      const end = gridToScreen(x, GRID_CONFIG.height)
      
      g.moveTo(start.x, start.y)
      g.lineTo(end.x, end.y)
    }
    
    // 그리드 중앙에 좌표 표시 (디버깅용)
    if (process.env.NODE_ENV === 'development') {
      for (let x = 0; x < GRID_CONFIG.width; x += 5) {
        for (let y = 0; y < GRID_CONFIG.height; y += 5) {
          const pos = gridToScreen(x, y)
          
          // 작은 점 표시
          g.lineStyle(0)
          g.beginFill(0x3b82f6, 0.3)
          g.drawCircle(pos.x, pos.y, 2)
          g.endFill()
        }
      }
    }
  }, [])

  return <Graphics draw={draw} zIndex={0} />
}