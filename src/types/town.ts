import { Building } from './building'
import { Connection } from './connection'

export interface TownState {
  id: string
  name: string
  buildings: Building[]
  connections: Connection[]
  createdAt: Date
  updatedAt: Date
  version: string
}

export interface SavedTown {
  id: string
  name: string
  data: string // JSON stringified TownState
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
}