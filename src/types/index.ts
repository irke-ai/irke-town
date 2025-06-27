export interface Project {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface Building {
  id: string
  type: 'api' | 'database' | 'frontend'
  name: string
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  status: 'healthy' | 'warning' | 'error'
  config?: Record<string, any>
}

export interface Connection {
  id: string
  fromBuildingId: string
  toBuildingId: string
  type: 'road' // MVP는 도로만
  path: Array<{ x: number; y: number }>
}

export interface TownState {
  id: string
  projectId: string
  buildings: Building[]
  connections: Connection[]
  grid: {
    width: number
    height: number
  }
}