'use client'

import { useEffect, useRef } from 'react'
import { GRID_CONFIG } from '@/lib/isometric'

interface MinimapProps {
  viewOffset: { x: number; y: number }
  zoom: number
  onViewChange: (offset: { x: number; y: number }) => void
}

export default function Minimap({ viewOffset, zoom, onViewChange }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const size = 150

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 미니맵 그리기
    ctx.clearRect(0, 0, size, size)
    
    // 배경
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, size, size)
    
    // 그리드
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 0.5
    
    const cellSize = size / Math.max(GRID_CONFIG.width, GRID_CONFIG.height)
    
    for (let i = 0; i <= GRID_CONFIG.width; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellSize, 0)
      ctx.lineTo(i * cellSize, size)
      ctx.stroke()
    }
    
    for (let j = 0; j <= GRID_CONFIG.height; j++) {
      ctx.beginPath()
      ctx.moveTo(0, j * cellSize)
      ctx.lineTo(size, j * cellSize)
      ctx.stroke()
    }
    
    // 현재 뷰포트 표시
    const viewportSize = 50 / zoom
    const viewportX = size / 2 - (viewOffset.x / 10)
    const viewportY = size / 2 - (viewOffset.y / 10)
    
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.strokeRect(
      viewportX - viewportSize / 2,
      viewportY - viewportSize / 2,
      viewportSize,
      viewportSize
    )
  }, [viewOffset, zoom])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const offsetX = (size / 2 - x) * 10
    const offsetY = (size / 2 - y) * 10
    
    onViewChange({ x: offsetX, y: offsetY })
  }

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="cursor-pointer"
        onClick={handleClick}
      />
    </div>
  )
}