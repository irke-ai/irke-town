import { useUIStore } from '@/stores/uiStore'
import { useState, useEffect } from 'react'

export default function DebugOverlay() {
  const zoom = useUIStore((state) => state.zoom)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white rounded p-2 text-xs font-mono">
      <p>Zoom: {(zoom * 100).toFixed(0)}%</p>
      <p>Grid: 50x50</p>
      <p>Cell: 64x32px</p>
      <p>Mouse: {mousePos.x}, {mousePos.y}</p>
    </div>
  )
}