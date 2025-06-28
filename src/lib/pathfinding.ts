import { GRID_CONFIG } from './isometric'
import { useBuildingStore } from '@/stores/buildingStore'
import { BUILDING_TEMPLATES } from '@/types/building'

interface Node {
  x: number
  y: number
  g: number // 시작점부터의 비용
  h: number // 목표까지의 추정 비용
  f: number // g + h
  parent: Node | null
}

interface Point {
  x: number
  y: number
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
    const { buildings } = useBuildingStore.getState()
    
    // 초기화: 모든 셀을 걷기 가능으로 설정
    for (let y = 0; y < this.height; y++) {
      grid[y] = []
      for (let x = 0; x < this.width; x++) {
        grid[y][x] = true
      }
    }
    
    // 건물이 있는 셀은 걷기 불가능으로 설정
    buildings.forEach(building => {
      const buildingTemplate = BUILDING_TEMPLATES[building.type]
      for (let dy = 0; dy < buildingTemplate.height; dy++) {
        for (let dx = 0; dx < buildingTemplate.width; dx++) {
          const x = building.gridX + dx
          const y = building.gridY + dy
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
    
    // 좌표를 정수로 변환
    const startInt = { x: Math.floor(start.x), y: Math.floor(start.y) }
    const endInt = { x: Math.floor(end.x), y: Math.floor(end.y) }
    
    // 시작점과 끝점이 유효한지 확인
    if (!this.isValidPosition(startInt) || !this.isValidPosition(endInt)) {
      return null
    }
    
    const openSet: Node[] = []
    const closedSet = new Set<string>()
    
    const startNode: Node = {
      x: startInt.x,
      y: startInt.y,
      g: 0,
      h: this.heuristic(startInt, endInt),
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
      if (currentNode.x === endInt.x && currentNode.y === endInt.y) {
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
          neighbor.h = this.heuristic(neighbor, endInt)
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

  // 건물의 포트 위치 찾기 (입구/출구)
  findBuildingPortPoint(buildingId: string, isOutput: boolean): Point | null {
    const store = useBuildingStore.getState()
    const building = store.buildings.find(b => b.id === buildingId)
    if (!building) return null
    
    const template = BUILDING_TEMPLATES[building.type]
    const rotation = building.rotation || 0
    
    // 회전에 따른 실제 크기
    const actualWidth = rotation % 180 === 0 ? building.width : building.height
    const actualHeight = rotation % 180 === 0 ? building.height : building.width
    
    // 포트 위치 계산
    let portX, portY
    
    if (isOutput) {
      // 출구 위치
      switch (rotation) {
        case 0:
          portX = building.gridX + actualWidth / 2
          portY = building.gridY + actualHeight
          break
        case 90:
          portX = building.gridX
          portY = building.gridY + actualHeight / 2
          break
        case 180:
          portX = building.gridX + actualWidth / 2
          portY = building.gridY
          break
        case 270:
          portX = building.gridX + actualWidth
          portY = building.gridY + actualHeight / 2
          break
        default:
          portX = building.gridX + actualWidth / 2
          portY = building.gridY + actualHeight
      }
    } else {
      // 입구 위치
      switch (rotation) {
        case 0:
          portX = building.gridX + actualWidth / 2
          portY = building.gridY
          break
        case 90:
          portX = building.gridX + actualWidth
          portY = building.gridY + actualHeight / 2
          break
        case 180:
          portX = building.gridX + actualWidth / 2
          portY = building.gridY + actualHeight
          break
        case 270:
          portX = building.gridX
          portY = building.gridY + actualHeight / 2
          break
        default:
          portX = building.gridX + actualWidth / 2
          portY = building.gridY
      }
    }
    
    return { x: Math.floor(portX), y: Math.floor(portY) }
  }

  // 건물 외곽 경로점 찾기
  findBuildingEdgePoint(buildingId: string, targetPos: { x: number; y: number }): { x: number; y: number } | null {
    const { buildings } = useBuildingStore.getState()
    const building = buildings.find(b => b.id === buildingId)
    if (!building) return null

    const template = BUILDING_TEMPLATES[building.type]
    
    // 건물의 중심점
    const centerX = building.gridX + Math.floor(template.width / 2)
    const centerY = building.gridY + Math.floor(template.height / 2)
    
    // 목표 방향 계산
    const dx = targetPos.x - centerX
    const dy = targetPos.y - centerY
    
    // 건물의 4개 모서리 중점
    const edgePoints = [
      // 상단 모서리
      { x: centerX, y: building.gridY - 1 },
      // 하단 모서리
      { x: centerX, y: building.gridY + template.height },
      // 좌측 모서리
      { x: building.gridX - 1, y: centerY },
      // 우측 모서리
      { x: building.gridX + template.width, y: centerY }
    ]
    
    // 유효한 점들만 필터링
    const validPoints = edgePoints.filter(point => 
      point.x >= 0 && point.x < this.width && 
      point.y >= 0 && point.y < this.height &&
      this.grid[Math.floor(point.y)][Math.floor(point.x)]
    )
    
    if (validPoints.length === 0) return null
    
    // 목표 위치에서 가장 가까운 점 선택
    let closest = validPoints[0]
    let minDist = this.heuristic(closest, targetPos)
    
    for (const point of validPoints) {
      const dist = this.heuristic(point, targetPos)
      if (dist < minDist) {
        minDist = dist
        closest = point
      }
    }
    
    return closest
  }
}