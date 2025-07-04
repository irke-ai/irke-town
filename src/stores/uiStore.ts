import { create } from 'zustand'

interface UIStore {
  // 도구 패널
  selectedTool: 'select' | 'building' | 'connection' | null
  setSelectedTool: (tool: UIStore['selectedTool']) => void
  
  // 선택된 건물
  selectedBuildingId: string | null
  setSelectedBuildingId: (id: string | null) => void
  
  // 캔버스 상태
  zoom: number
  setZoom: (zoom: number) => void
  
  // 편집 모드
  editMode: 'preview' | 'edit'
  setEditMode: (mode: 'preview' | 'edit') => void
  toggleEditMode: () => void
  
  // 연결 모드
  connectionMode: boolean
  setConnectionMode: (enabled: boolean) => void
  
  // 컨텍스트 메뉴
  contextMenu: { 
    position: { x: number; y: number }
    buildingId: string
    multiSelect?: boolean
    selectedIds?: string[]
  } | null
  setContextMenu: (menu: { 
    position: { x: number; y: number }
    buildingId: string
    multiSelect?: boolean
    selectedIds?: string[]
  } | null) => void
  
  // 패널 표시 상태
  showToolPanel: boolean
  showPropertyPanel: boolean
  toggleToolPanel: () => void
  togglePropertyPanel: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  selectedTool: null,
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  
  selectedBuildingId: null,
  setSelectedBuildingId: (id) => set({ selectedBuildingId: id }),
  
  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),
  
  editMode: 'preview',
  setEditMode: (mode) => set({ editMode: mode }),
  toggleEditMode: () => set((state) => ({ editMode: state.editMode === 'preview' ? 'edit' : 'preview' })),
  
  connectionMode: false,
  setConnectionMode: (enabled) => set({ connectionMode: enabled }),
  
  contextMenu: null,
  setContextMenu: (menu) => set({ contextMenu: menu }),
  
  showToolPanel: true,
  showPropertyPanel: true,
  toggleToolPanel: () => set((state) => ({ showToolPanel: !state.showToolPanel })),
  togglePropertyPanel: () => set((state) => ({ showPropertyPanel: !state.showPropertyPanel })),
}))