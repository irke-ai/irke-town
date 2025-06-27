# Sprint 1.3: 건물 시스템 구현 - 상세 구현 가이드

## 🎯 Sprint 목표
3종류의 건물(API Gateway, Database, Frontend Page)을 구현하고, 배치/이동/삭제 기능을 완성합니다.

## 🛠️ 핵심 구현 사항
- 건물 데이터 구조 설계
- 건물 스프라이트 렌더링
- 드래그 앤 드롭 시스템
- 충돌 감지 알고리즘
- 건물 상태 관리

## 📋 Task 1: 건물 데이터 구조

### 1.1 건물 타입 정의 확장 (src/types/building.ts)
```typescript
// irke://component/building/*/base
export interface BuildingType {
  id: 'api' | 'database' | 'frontend'
  name: string
  size: { width: number; height: number }
  color: {
    primary: number    // Pixi.js hex color
    secondary: number
    outline: number
  }
  icon: string // 이모지 또는 아이콘 경로
  description: string
}

export const BUILDING_TYPES: Record<string, BuildingType> = {
  api: {
    id: 'api',
    name: 'API Gateway',
    size: { width: 2, height: 3 },
    color: {
      primary: 0x3B82F6,    // blue-500
      secondary: 0x2563EB,  // blue-600
      outline: 0x1D4ED8,    // blue-700
    },
    icon: '🏛️',
    description: 'REST API 엔드포인트 관리',
  },
  database: {
    id: 'database',
    name: 'Database',
    size: { width: 3, height: 3 },
    color: {
      primary: 0x10B981,    // green-500
      secondary: 0x059669,  // green-600
      outline: 0x047857,    // green-700
    },
    icon: '🗄️',
    description: '데이터 저장 및 관리',
  },
  frontend: {
    id: 'frontend',
    name: 'Frontend Page',
    size: { width: 2, height: 2 },
    color: {
      primary: 0x8B5CF6,    // purple-500
      secondary: 0x7C3AED,  // purple-600
      outline: 0x6D28D9,    // purple-700
    },
    icon: '📱',
    description: 'UI 페이지 및 컴포넌트',
  },
}

export interface Building {
  id: string
  type: keyof typeof BUILDING_TYPES
  name: string
  position: {
    x: number
    y: number
  }
  status: 'healthy' | 'warning' | 'error' | 'building'
  config?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

### 1.2 타운 스토어 생성 (src/stores/townStore.ts)
```typescript
// irke://stack/state/zustand/town
import { create } from 'zustand'
import { Building } from '@/types/building'
import { nanoid } from 'nanoid'

interface TownStore {
  buildings: Building[]
  selectedBuildingId: string | null
  
  // 건물 관리
  addBuilding: (type: keyof typeof BUILDING_TYPES, position: { x: number; y: number }) => string
  updateBuilding: (id: string, updates: Partial<Building>) => void
  removeBuilding: (id: string) => void
  selectBuilding: (id: string | null) => void
  
  // 위치 확인
  isCellOccupied: (x: number, y: number, excludeId?: string) => boolean
  canPlaceBuilding: (type: keyof typeof BUILDING_TYPES, x: number, y: number, excludeId?: string) => boolean
  getBuildingAt: (x: number, y: number) => Building | undefined
}

export const useTownStore = create<TownStore>((set, get) => ({
  buildings: [],
  selectedBuildingId: null,

  addBuilding: (type, position) => {
    const id = nanoid()
    const building: Building = {
      id,
      type,
      name: `${BUILDING_TYPES[type].name} ${id.slice(0, 4)}`,
      position,
      status: 'building',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    set((state) => ({
      buildings: [...state.buildings, building],
    }))
    
    // 1초 후 건물 완성
    setTimeout(() => {
      set((state) => ({
        buildings: state.buildings.map((b) =>
          b.id === id ? { ...b, status: 'healthy' } : b
        ),
      }))
    }, 1000)
    
    return id
  },

  updateBuilding: (id, updates) => {
    set((state) => ({
      buildings: state.buildings.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b
      ),
    }))
  },

  removeBuilding: (id) => {
    set((state) => ({
      buildings: state.buildings.filter((b) => b.id !== id),
      selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId,
    }))
  },

  selectBuilding: (id) => {
    set({ selectedBuildingId: id })
  },

  isCellOccupied: (x, y, excludeId) => {
    const buildings = get().buildings
    
    return buildings.some((building) => {
      if (building.id === excludeId) return false
      
      const buildingType = BUILDING_TYPES[building.type]
      const startX = building.position.x
      const startY = building.position.y
      const endX = startX + buildingType.size.width - 1
      const endY = startY + buildingType.size.height - 1
      
      return x >= startX && x <= endX && y >= startY && y <= endY
    })
  },

  canPlaceBuilding: (type, x, y, excludeId) => {
    const buildingType = BUILDING_TYPES[type]
    const { width, height } = buildingType.size
    
    // 그리드 범위 확인
    if (x < 0 || y < 0 || x + width > 50 || y + height > 50) {
      return false
    }
    
    // 충돌 확인
    for (let dx = 0; dx < width; dx++) {
      for (let dy = 0; dy < height; dy++) {
        if (get().isCellOccupied(x + dx, y + dy, excludeId)) {
          return false
        }
      }
    }
    
    return true
  },

  getBuildingAt: (x, y) => {
    return get().buildings.find((building) => {
      const buildingType = BUILDING_TYPES[building.type]
      const startX = building.position.x
      const startY = building.position.y
      const endX = startX + buildingType.size.width - 1
      const endY = startY + buildingType.size.height - 1
      
      return x >= startX && x <= endX && y >= startY && y <= endY
    })
  },
}))