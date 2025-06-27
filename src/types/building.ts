export enum BuildingType {
  API = 'api',
  DATABASE = 'database',
  FRONTEND = 'frontend'
}

export enum BuildingStatus {
  PLANNING = 'planning',     // 계획 중 (회색)
  BUILDING = 'building',     // 건설 중 (노란색)
  READY = 'ready',          // 완료 (초록색)
  ERROR = 'error'           // 오류 (빨간색)
}

export interface Building {
  id: string
  type: BuildingType
  name: string
  gridX: number
  gridY: number
  status: BuildingStatus
  width: number  // 그리드 단위
  height: number // 그리드 단위
  metadata?: {
    description?: string
    techStack?: string[]
    version?: string
  }
}

export interface BuildingTemplate {
  type: BuildingType
  name: string
  description: string
  icon: string
  width: number
  height: number
  color: string  // 기본 색상
  colors?: {
    primary: number    // Pixi.js hex color
    secondary: number  // 건물 커플 색상
    outline: number    // 테두리 색상
  }
}

export const BUILDING_TEMPLATES: Record<BuildingType, BuildingTemplate> = {
  [BuildingType.API]: {
    type: BuildingType.API,
    name: 'API Server',
    description: 'RESTful API 또는 GraphQL 서버',
    icon: '🔌',
    width: 2,
    height: 2,
    color: '#3b82f6', // blue-500
    colors: {
      primary: 0x3B82F6,    // blue-500
      secondary: 0x2563EB,  // blue-600
      outline: 0x1D4ED8,    // blue-700
    }
  },
  [BuildingType.DATABASE]: {
    type: BuildingType.DATABASE,
    name: 'Database',
    description: '데이터 저장소 (PostgreSQL, MongoDB 등)',
    icon: '💾',
    width: 3,
    height: 2,
    color: '#10b981', // emerald-500
    colors: {
      primary: 0x10B981,    // emerald-500
      secondary: 0x059669,  // emerald-600
      outline: 0x047857,    // emerald-700
    }
  },
  [BuildingType.FRONTEND]: {
    type: BuildingType.FRONTEND,
    name: 'Frontend',
    description: 'React, Vue, Angular 애플리케이션',
    icon: '🖥️',
    width: 2,
    height: 3,
    color: '#f59e0b', // amber-500
    colors: {
      primary: 0xF59E0B,    // amber-500
      secondary: 0xD97706,  // amber-600
      outline: 0xB45309,    // amber-700
    }
  }
}

export const STATUS_COLORS: Record<BuildingStatus, number> = {
  [BuildingStatus.PLANNING]: 0x9ca3af, // gray-400
  [BuildingStatus.BUILDING]: 0xfbbf24, // yellow-400
  [BuildingStatus.READY]: 0x10b981,    // emerald-500
  [BuildingStatus.ERROR]: 0xef4444     // red-500
}