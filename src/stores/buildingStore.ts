import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Building, BuildingType, BuildingStatus } from '@/types/building'

interface BuildingState {
  buildings: Building[]
  selectedBuildingId: string | null
  hoveredBuildingId: string | null
  placingBuildingType: BuildingType | null
  selectedBuildingPosition: { x: number; y: number } | null
  draggingBuildingId: string | null
  dragOffset: { x: number; y: number } | null
  
  // Actions
  addBuilding: (building: Omit<Building, 'id'>) => void
  removeBuilding: (id: string) => void
  updateBuilding: (id: string, updates: Partial<Building>) => void
  selectBuilding: (id: string | null, position?: { x: number; y: number }) => void
  hoverBuilding: (id: string | null) => void
  setPlacingBuildingType: (type: BuildingType | null) => void
  moveBuilding: (id: string, gridX: number, gridY: number) => void
  isPositionOccupied: (gridX: number, gridY: number, width: number, height: number, excludeId?: string) => boolean
  startDragging: (id: string, offset: { x: number; y: number }) => void
  stopDragging: () => void
}

export const useBuildingStore = create<BuildingState>()(
  devtools(
    (set, get) => ({
      buildings: [],
      selectedBuildingId: null,
      hoveredBuildingId: null,
      placingBuildingType: null,
      selectedBuildingPosition: null,
      draggingBuildingId: null,
      dragOffset: null,
      
      addBuilding: (building) => {
        const id = `building-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        set((state) => ({
          buildings: [...state.buildings, { ...building, id }]
        }))
      },
      
      removeBuilding: (id) => {
        set((state) => ({
          buildings: state.buildings.filter(b => b.id !== id),
          selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId
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
          selectedBuildingPosition: position || null
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
      }
    }),
    {
      name: 'building-store'
    }
  )
)