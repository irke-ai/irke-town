import { FederatedPointerEvent } from 'pixi.js'

export interface BuildingClickEvent {
  buildingId: string
  event: FederatedPointerEvent
}

export interface CellClickEvent {
  gridX: number
  gridY: number
  event: FederatedPointerEvent
}

export type PointerEventHandler = (event: FederatedPointerEvent) => void
export type BuildingClickHandler = (buildingId: string, event: FederatedPointerEvent) => void
export type CellClickHandler = (gridX: number, gridY: number) => void