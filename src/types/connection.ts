export interface Connection {
  id: string
  type: 'road' // MVP는 도로만
  fromBuildingId: string
  toBuildingId: string
  path: Array<{ x: number; y: number }>
  status: 'active' | 'inactive' | 'error'
  createdAt: Date
  metadata?: {
    distance: number
    cost: number
  }
}

export interface ConnectionPoint {
  buildingId: string
  side: 'north' | 'east' | 'south' | 'west'
  position: { x: number; y: number }
}

export const CONNECTION_COLORS = {
  active: 0x3B82F6,    // blue-500
  inactive: 0x9CA3AF,  // gray-400
  error: 0xEF4444,     // red-500
  preview: 0x10B981,   // emerald-500
}