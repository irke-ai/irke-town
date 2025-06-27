# Sprint 1.4: 연결 시스템 및 상태 관리 - 상세 구현 가이드

## 🎯 Sprint 목표
건물 간 도로 연결 시스템을 구현하고, 전체 타운 상태 관리를 완성하여 Phase 1을 마무리합니다.

## 🛠️ 핵심 구현 사항
- A* 경로 찾기 알고리즘
- 도로 렌더링 시스템
- 연결 유효성 검사
- 타운 상태 저장/불러오기
- 실행 취소/다시 실행

## 📋 Task 1: 연결 시스템

### 1.1 연결 타입 정의 (src/types/connection.ts)
```typescript
// irke://component/connection/road/base
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
```

### 1.2 A* 경로 찾기 알고리즘 (src/lib/pathfinding.ts)
```typescript
// irke://stack/algorithm/pathfinding/astar
import { GRID_CONFIG } from './isometric'
import { useTownStore } from '@/stores/townStore'

interface Node {
  x: number
  y: number
  g: number // 시작점부터의 비용
  h: number // 목표까지의 추정 비용
  f: number // g + h
  parent: Node | null
}

export class AStar {
  private grid: boolean[][]
  private width: number
  private height: number

  constructor() {
    this.width = GRID_CONFIG.width
    this.height = GRID_CONFIG.height
    this.grid = this.createGrid()
  }

  private createGrid(): boolean[][] {
    const grid: boolean[][] = []
    const { buildings } = useTownStore.getState()
    
    // 초기화: 모든 셀을 걷기 가능으로 설정
    for (let y = 0; y < this.height; y++) {
      grid[y] = []
      for (let x = 0; x < this.width; x++) {
        grid[y][x] = true
      }
    }
    
    // 건물이 있는 셀은 걷기 불가능으로 설정
    buildings.forEach(building => {
      const buildingType = BUILDING_TYPES[building.type]
      for (let dy = 0; dy < buildingType.size.height; dy++) {
        for (let dx = 0; dx < buildingType.size.width; dx++) {
          const x = building.position.x + dx
          const y = building.position.y + dy
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            grid[y][x] = false
          }
        }
      }
    })
    
    return grid
  }

  private heuristic(a: { x: number; y: number }, b: { x: number; y: number }): number {
    // 맨해튼 거리
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
  }

  private getNeighbors(node: Node): Node[] {
    const neighbors: Node[] = []
    const directions = [
      { x: 0, y: -1 }, // 북
      { x: 1, y: 0 },  // 동
      { x: 0, y: 1 },  // 남
      { x: -1, y: 0 }, // 서
    ]
    
    for (const dir of directions) {
      const x = node.x + dir.x
      const y = node.y + dir.y
      
      if (x >= 0 && x < this.width && y >= 0 && y < this.height && this.grid[y][x]) {
        neighbors.push({
          x,
          y,
          g: 0,
          h: 0,
          f: 0,
          parent: null,
        })
      }
    }
    
    return neighbors
  }

  findPath(start: { x: number; y: number }, end: { x: number; y: number }): Array<{ x: number; y: number }> | null {
    // 그리드 업데이트
    this.grid = this.createGrid()
    
    // 시작점과 끝점이 유효한지 확인
    if (!this.isValidPosition(start) || !this.isValidPosition(end)) {
      return null
    }
    
    const openSet: Node[] = []
    const closedSet = new Set<string>()
    
    const startNode: Node = {
      x: start.x,
      y: start.y,
      g: 0,
      h: this.heuristic(start, end),
      f: 0,
      parent: null,
    }
    startNode.f = startNode.g + startNode.h
    
    openSet.push(startNode)
    
    while (openSet.length > 0) {
      // f 값이 가장 낮은 노드 찾기
      let currentIndex = 0
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i
        }
      }
      
      const currentNode = openSet[currentIndex]
      
      // 목표에 도달했는지 확인
      if (currentNode.x === end.x && currentNode.y === end.y) {
        const path: Array<{ x: number; y: number }> = []
        let current: Node | null = currentNode
        
        while (current) {
          path.unshift({ x: current.x, y: current.y })
          current = current.parent
        }
        
        return this.smoothPath(path)
      }
      
      // openSet에서 제거하고 closedSet에 추가
      openSet.splice(currentIndex, 1)
      closedSet.add(`${currentNode.x},${currentNode.y}`)
      
      // 이웃 노드 확인
      const neighbors = this.getNeighbors(currentNode)
      
      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`
        if (closedSet.has(key)) continue
        
        const g = currentNode.g + 1
        
        const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)
        
        if (!existingNode) {
          neighbor.g = g
          neighbor.h = this.heuristic(neighbor, end)
          neighbor.f = neighbor.g + neighbor.h
          neighbor.parent = currentNode
          openSet.push(neighbor)
        } else if (g < existingNode.g) {
          existingNode.g = g
          existingNode.f = existingNode.g + existingNode.h
          existingNode.parent = currentNode
        }
      }
    }
    
    return null // 경로를 찾을 수 없음
  }

  private isValidPosition(pos: { x: number; y: number }): boolean {
    return pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height
  }

  private smoothPath(path: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
    if (path.length <= 2) return path
    
    const smoothed: Array<{ x: number; y: number }> = [path[0]]
    
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1]
      const curr = path[i]
      const next = path[i + 1]
      
      // 방향이 바뀌는 지점만 포함
      if ((prev.x - curr.x) !== (curr.x - next.x) || (prev.y - curr.y) !== (curr.y - next.y)) {
        smoothed.push(curr)
      }
    }
    
    smoothed.push(path[path.length - 1])
    return smoothed
  }
}
```

### 1.3 연결 스토어 확장 (src/stores/townStore.ts에 추가)
```typescript
// townStore에 추가할 인터페이스와 메서드
interface TownStore {
  // ... 기존 코드 ...
  
  connections: Connection[]
  selectedConnectionId: string | null
  
  // 연결 관리
  addConnection: (fromId: string, toId: string) => string | null
  removeConnection: (id: string) => void
  selectConnection: (id: string | null) => void
  getConnectionsForBuilding: (buildingId: string) => Connection[]
}

// townStore 구현에 추가
export const useTownStore = create<TownStore>((set, get) => ({
  // ... 기존 코드 ...
  
  connections: [],
  selectedConnectionId: null,
  
  addConnection: (fromId, toId) => {
    const { buildings } = get()
    const fromBuilding = buildings.find(b => b.id === fromId)
    const toBuilding = buildings.find(b => b.id === toId)
    
    if (!fromBuilding || !toBuilding) return null
    
    // 이미 연결되어 있는지 확인
    const existing = get().connections.find(
      c => (c.fromBuildingId === fromId && c.toBuildingId === toId) ||
           (c.fromBuildingId === toId && c.toBuildingId === fromId)
    )
    if (existing) return null
    
    // 경로 찾기
    const pathfinder = new AStar()
    const fromCenter = {
      x: fromBuilding.position.x + Math.floor(BUILDING_TYPES[fromBuilding.type].size.width / 2),
      y: fromBuilding.position.y + Math.floor(BUILDING_TYPES[fromBuilding.type].size.height / 2),
    }
    const toCenter = {
      x: toBuilding.position.x + Math.floor(BUILDING_TYPES[toBuilding.type].size.width / 2),
      y: toBuilding.position.y + Math.floor(BUILDING_TYPES[toBuilding.type].size.height / 2),
    }
    
    const path = pathfinder.findPath(fromCenter, toCenter)
    if (!path) return null
    
    const id = nanoid()
    const connection: Connection = {
      id,
      type: 'road',
      fromBuildingId: fromId,
      toBuildingId: toId,
      path,
      status: 'active',
      createdAt: new Date(),
      metadata: {
        distance: path.length,
        cost: path.length * 10, // 임의의 비용 계산
      },
    }
    
    set(state => ({
      connections: [...state.connections, connection],
    }))
    
    return id
  },
  
  removeConnection: (id) => {
    set(state => ({
      connections: state.connections.filter(c => c.id !== id),
      selectedConnectionId: state.selectedConnectionId === id ? null : state.selectedConnectionId,
    }))
  },
  
  selectConnection: (id) => {
    set({ selectedConnectionId: id })
  },
  
  getConnectionsForBuilding: (buildingId) => {
    return get().connections.filter(
      c => c.fromBuildingId === buildingId || c.toBuildingId === buildingId
    )
  },
}))