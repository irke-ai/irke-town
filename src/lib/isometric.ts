export const GRID_CONFIG = {
  width: 50,
  height: 50,
  cellWidth: 64,
  cellHeight: 32,
}

/**
 * 그리드 좌표를 아이소메트릭 화면 좌표로 변환
 */
export function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  const x = (gridX - gridY) * (GRID_CONFIG.cellWidth / 2)
  const y = (gridX + gridY) * (GRID_CONFIG.cellHeight / 2)
  return { x, y }
}

/**
 * 화면 좌표를 그리드 좌표로 변환
 */
export function screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
  const x = (screenX / (GRID_CONFIG.cellWidth / 2) + screenY / (GRID_CONFIG.cellHeight / 2)) / 2
  const y = (screenY / (GRID_CONFIG.cellHeight / 2) - screenX / (GRID_CONFIG.cellWidth / 2)) / 2
  
  return {
    x: Math.floor(x),
    y: Math.floor(y),
  }
}

/**
 * 그리드 좌표가 유효한지 확인
 */
export function isValidGridPosition(x: number, y: number): boolean {
  return x >= 0 && x < GRID_CONFIG.width && y >= 0 && y < GRID_CONFIG.height
}