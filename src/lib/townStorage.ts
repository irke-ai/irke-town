import { TownState, SavedTown } from '@/types/town'
import { Building } from '@/types/building'
import { Connection } from '@/types/connection'

const STORAGE_KEY = 'irke-town-saves'
const CURRENT_VERSION = '1.0.0'

export class TownStorage {
  // 로컬 스토리지에서 모든 저장된 타운 목록 가져오기
  static getAllSaves(): SavedTown[] {
    if (typeof window === 'undefined') return []
    
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    
    try {
      const saves = JSON.parse(saved)
      return saves.map((save: any) => ({
        ...save,
        createdAt: new Date(save.createdAt),
        updatedAt: new Date(save.updatedAt),
      }))
    } catch (error) {
      console.error('Failed to parse saved towns:', error)
      return []
    }
  }
  
  // 타운 저장
  static saveTown(name: string, buildings: Building[], connections: Connection[]): string {
    const townState: TownState = {
      id: `town-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      buildings,
      connections,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: CURRENT_VERSION,
    }
    
    const savedTown: SavedTown = {
      id: townState.id,
      name: townState.name,
      data: JSON.stringify(townState),
      createdAt: townState.createdAt,
      updatedAt: townState.updatedAt,
    }
    
    const saves = this.getAllSaves()
    saves.push(savedTown)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
    
    return savedTown.id
  }
  
  // 타운 불러오기
  static loadTown(id: string): TownState | null {
    const saves = this.getAllSaves()
    const save = saves.find(s => s.id === id)
    
    if (!save) return null
    
    try {
      const townState = JSON.parse(save.data)
      return {
        ...townState,
        createdAt: new Date(townState.createdAt),
        updatedAt: new Date(townState.updatedAt),
        // 연결의 날짜도 변환
        connections: townState.connections.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt)
        }))
      }
    } catch (error) {
      console.error('Failed to load town:', error)
      return null
    }
  }
  
  // 타운 업데이트
  static updateTown(id: string, buildings: Building[], connections: Connection[]): boolean {
    const saves = this.getAllSaves()
    const index = saves.findIndex(s => s.id === id)
    
    if (index === -1) return false
    
    const existingTown = this.loadTown(id)
    if (!existingTown) return false
    
    const updatedTownState: TownState = {
      ...existingTown,
      buildings,
      connections,
      updatedAt: new Date(),
    }
    
    saves[index] = {
      ...saves[index],
      data: JSON.stringify(updatedTownState),
      updatedAt: updatedTownState.updatedAt,
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
    return true
  }
  
  // 타운 삭제
  static deleteTown(id: string): boolean {
    const saves = this.getAllSaves()
    const filtered = saves.filter(s => s.id !== id)
    
    if (filtered.length === saves.length) return false
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  }
  
  // 자동 저장을 위한 현재 세션 ID
  private static currentSessionId: string | null = null
  
  static setCurrentSession(id: string | null) {
    this.currentSessionId = id
  }
  
  static getCurrentSession(): string | null {
    return this.currentSessionId
  }
  
  // 자동 저장
  static autoSave(buildings: Building[], connections: Connection[]): boolean {
    if (!this.currentSessionId) return false
    
    return this.updateTown(this.currentSessionId, buildings, connections)
  }
}