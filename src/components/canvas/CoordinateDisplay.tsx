interface CoordinateDisplayProps {
  gridX: number | null
  gridY: number | null
}

export default function CoordinateDisplay({ gridX, gridY }: CoordinateDisplayProps) {
  if (gridX === null || gridY === null) return null

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
      <p className="text-sm font-mono">
        Grid: ({gridX}, {gridY})
      </p>
    </div>
  )
}