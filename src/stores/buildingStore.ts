import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Building, BuildingType, BuildingStatus, BUILDING_TEMPLATES } from '@/types/building'
import { Connection } from '@/types/connection'
import { AStar } from '@/lib/pathfinding'

interface BuildingState {
  buildings: Building[]
  selectedBuildingId: string | null
  selectedBuildingIds: string[]  // 복수 선택을 위한 배열
  hoveredBuildingId: string | null
  placingBuildingType: BuildingType | null
  selectedBuildingPosition: { x: number; y: number } | null
  draggingBuildingId: string | null
  dragOffset: { x: number; y: number } | null
  
  // 연결 시스템
  connections: Connection[]
  selectedConnectionId: string | null
  selectedConnectionPosition: { x: number; y: number } | null
  connectingFromBuildingId: string | null  // 연결 모드 시작 건물
  
  // Actions
  addBuilding: (building: Omit<Building, 'id'>) => void
  removeBuilding: (id: string) => void
  updateBuilding: (id: string, updates: Partial<Building>) => void
  selectBuilding: (id: string | null, position?: { x: number; y: number }) => void
  toggleBuildingSelection: (id: string, isShiftPressed: boolean, position?: { x: number; y: number }) => void
  clearSelection: () => void
  hoverBuilding: (id: string | null) => void
  setPlacingBuildingType: (type: BuildingType | null) => void
  moveBuilding: (id: string, gridX: number, gridY: number) => void
  rotateBuilding: (id: string) => void
  isPositionOccupied: (gridX: number, gridY: number, width: number, height: number, excludeId?: string) => boolean
  startDragging: (id: string, offset: { x: number; y: number }) => void
  stopDragging: () => void
  
  // 연결 관리
  addConnection: (fromId: string, toId: string) => string | null
  removeConnection: (id: string) => void
  selectConnection: (id: string | null, position?: { x: number; y: number }) => void
  getConnectionsForBuilding: (buildingId: string) => Connection[]
  startConnecting: (fromBuildingId: string | null) => void
}

export const useBuildingStore = create<BuildingState>()(
  devtools(
    (set, get) => ({
      buildings: [],
      selectedBuildingId: null,
      selectedBuildingIds: [],
      hoveredBuildingId: null,
      placingBuildingType: null,
      selectedBuildingPosition: null,
      draggingBuildingId: null,
      dragOffset: null,
      
      // 연결 시스템
      connections: [],
      selectedConnectionId: null,
      selectedConnectionPosition: null,
      connectingFromBuildingId: null,
      
      addBuilding: (building) => {
        const id = `building-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newBuilding = { ...building, id, rotation: building.rotation || 0 }
        
        set((state) => ({
          buildings: [...state.buildings, newBuilding]
        }))
        
        // 건물 상태 자동 전환
        if (building.status === BuildingStatus.PLANNING) {
          setTimeout(() => {
            get().updateBuilding(id, { status: BuildingStatus.BUILDING })
            
            setTimeout(() => {
              get().updateBuilding(id, { status: BuildingStatus.READY })
            }, 2000)
          }, 500)
        }
      },
      
      removeBuilding: (id) => {
        // 건물과 연결된 모든 연결도 함께 제거
        const connectionsToRemove = get().connections.filter(
          c => c.fromBuildingId === id || c.toBuildingId === id
        )
        
        set((state) => ({
          buildings: state.buildings.filter(b => b.id !== id),
          selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId,
          connections: state.connections.filter(
            c => c.fromBuildingId !== id && c.toBuildingId !== id
          )
        }))
      },
      
      updateBuilding: (id, updates) => {
        set((state) => ({
          buildings: state.buildings.map(b => 
            b.id === id ? { ...b, ...updates } : b
          )
        }))
      },
      
      selectBuilding: (id, position) => {
        set({ 
          selectedBuildingId: id,
          selectedBuildingIds: id ? [id] : [],
          selectedBuildingPosition: position || null
        })
      },
      
      toggleBuildingSelection: (id, isShiftPressed, position) => {
        if (!isShiftPressed) {
          // Shift가 눌리지 않았으면 단일 선택
          get().selectBuilding(id, position)
        } else {
          // Shift가 눌렸으면 복수 선택
          const currentIds = get().selectedBuildingIds
          const isSelected = currentIds.includes(id)
          
          if (isSelected) {
            // 이미 선택된 건물이면 선택 해제
            const newIds = currentIds.filter(bid => bid !== id)
            set({
              selectedBuildingIds: newIds,
              selectedBuildingId: newIds.length > 0 ? newIds[newIds.length - 1] : null,
              selectedBuildingPosition: position || null
            })
          } else {
            // 선택되지 않은 건물이면 추가
            set({
              selectedBuildingIds: [...currentIds, id],
              selectedBuildingId: id,
              selectedBuildingPosition: position || null
            })
          }
        }
      },
      
      clearSelection: () => {
        set({
          selectedBuildingId: null,
          selectedBuildingIds: [],
          selectedBuildingPosition: null
        })
      },
      
      hoverBuilding: (id) => {
        set({ hoveredBuildingId: id })
      },
      
      setPlacingBuildingType: (type) => {
        set({ placingBuildingType: type })
      },
      
      moveBuilding: (id, gridX, gridY) => {
        const building = get().buildings.find(b => b.id === id)
        if (!building) return
        
        // 충돌 검사
        if (!get().isPositionOccupied(gridX, gridY, building.width, building.height, id)) {
          get().updateBuilding(id, { gridX, gridY })
          
          // 이 건물과 연결된 모든 연결 재계산
          const connectionsToUpdate = get().connections.filter(
            c => c.fromBuildingId === id || c.toBuildingId === id
          )
          
          connectionsToUpdate.forEach(connection => {
            // 연결을 삭제하고 다시 생성
            get().removeConnection(connection.id)
            get().addConnection(connection.fromBuildingId, connection.toBuildingId)
          })
        }
      },
      
      rotateBuilding: (id) => {
        const building = get().buildings.find(b => b.id === id)
        if (!building) return
        
        // 90도씩 회전
        const newRotation = (building.rotation + 90) % 360
        
        // 회전 후 크기 (90도, 270도일 때 가로세로 바뀜)
        const rotatedWidth = newRotation % 180 === 0 ? building.width : building.height
        const rotatedHeight = newRotation % 180 === 0 ? building.height : building.width
        
        // 회전 후 충돌 검사
        if (!get().isPositionOccupied(building.gridX, building.gridY, rotatedWidth, rotatedHeight, id)) {
          get().updateBuilding(id, { rotation: newRotation })
          
          // 연결 재계산
          const connectionsToUpdate = get().connections.filter(
            c => c.fromBuildingId === id || c.toBuildingId === id
          )
          
          connectionsToUpdate.forEach(connection => {
            get().removeConnection(connection.id)
            get().addConnection(connection.fromBuildingId, connection.toBuildingId)
          })
        }
      },
      
      isPositionOccupied: (gridX, gridY, width, height, excludeId) => {
        const buildings = get().buildings
        
        for (const building of buildings) {
          if (building.id === excludeId) continue
          
          // AABB 충돌 검사
          const overlap = !(
            gridX + width <= building.gridX ||
            gridX >= building.gridX + building.width ||
            gridY + height <= building.gridY ||
            gridY >= building.gridY + building.height
          )
          
          if (overlap) return true
        }
        
        return false
      },
      
      startDragging: (id, offset) => {
        set({ 
          draggingBuildingId: id,
          dragOffset: offset,
          selectedBuildingId: id
        })
      },
      
      stopDragging: () => {
        set({ 
          draggingBuildingId: null,
          dragOffset: null
        })
      },
      
      // 연결 관리
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
        const fromTemplate = BUILDING_TEMPLATES[fromBuilding.type]
        const toTemplate = BUILDING_TEMPLATES[toBuilding.type]
        
        // 출구에서 입구로 연결
        let fromPort = null
        let toPort = null
        
        // from 건물의 출구 찾기
        if (fromTemplate.ports.output) {
          fromPort = pathfinder.findBuildingPortPoint(fromId, true)
        }
        
        // to 건물의 입구 찾기  
        if (toTemplate.ports.input) {
          toPort = pathfinder.findBuildingPortPoint(toId, false)
        }
        
        // 포트가 없으면 기존 방식으로 edge point 사용
        if (!fromPort || !toPort) {
          const fromCenter = {
            x: fromBuilding.gridX + Math.floor(fromTemplate.width / 2),
            y: fromBuilding.gridY + Math.floor(fromTemplate.height / 2),
          }
          const toCenter = {
            x: toBuilding.gridX + Math.floor(toTemplate.width / 2),
            y: toBuilding.gridY + Math.floor(toTemplate.height / 2),
          }
          
          fromPort = fromPort || pathfinder.findBuildingEdgePoint(fromId, toCenter)
          toPort = toPort || pathfinder.findBuildingEdgePoint(toId, fromCenter)
        }
        
        if (!fromPort || !toPort) return null
        
        const path = pathfinder.findPath(fromPort, toPort)
        if (!path) return null
        
        const id = `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
          connectingFromBuildingId: null,
        }))
        
        return id
      },
      
      removeConnection: (id) => {
        set(state => ({
          connections: state.connections.filter(c => c.id !== id),
          selectedConnectionId: state.selectedConnectionId === id ? null : state.selectedConnectionId,
          selectedConnectionPosition: state.selectedConnectionId === id ? null : state.selectedConnectionPosition,
        }))
      },
      
      selectConnection: (id, position) => {
        set({ 
          selectedConnectionId: id,
          selectedConnectionPosition: position || null
        })
      },
      
      getConnectionsForBuilding: (buildingId) => {
        return get().connections.filter(
          c => c.fromBuildingId === buildingId || c.toBuildingId === buildingId
        )
      },
      
      startConnecting: (fromBuildingId) => {
        set({ connectingFromBuildingId: fromBuildingId })
      }
    }),
    {
      name: 'building-store'
    }
  )
)