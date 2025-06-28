'use client'

import React, { useCallback, useMemo } from 'react'
import { Container, Graphics } from '@pixi/react'
import { Graphics as PixiGraphics, Polygon } from 'pixi.js'
import { useBuildingStore } from '@/stores/buildingStore'
import { useUIStore } from '@/stores/uiStore'
import { gridToScreen } from '@/lib/isometric'
import { CONNECTION_COLORS } from '@/types/connection'

export default function ConnectionLayer() {
  const connections = useBuildingStore((state) => state.connections)
  const selectedConnectionId = useBuildingStore((state) => state.selectedConnectionId)
  const selectConnection = useBuildingStore((state) => state.selectConnection)
  const editMode = useUIStore((state) => state.editMode)
  
  const drawConnection = useCallback((g: PixiGraphics, connection: typeof connections[0], isSelected: boolean) => {
    g.clear()
    
    if (!connection.path || connection.path.length < 2) return
    
    const color = CONNECTION_COLORS[connection.status]
    const lineWidth = isSelected ? 8 : 6
    const alpha = isSelected ? 1 : 0.8
    
    // 클릭 가능한 영역을 위한 투명한 굵은 선 그리기
    g.lineStyle(20, 0xFFFFFF, 0.01)
    const firstHitPoint = gridToScreen(connection.path[0].x, connection.path[0].y)
    g.moveTo(firstHitPoint.x, firstHitPoint.y)
    for (let i = 1; i < connection.path.length; i++) {
      const point = gridToScreen(connection.path[i].x, connection.path[i].y)
      g.lineTo(point.x, point.y)
    }
    
    // 도로 그리기
    g.lineStyle(lineWidth, color, alpha)
    
    // 첫 번째 점으로 이동
    const firstPoint = gridToScreen(connection.path[0].x, connection.path[0].y)
    g.moveTo(firstPoint.x, firstPoint.y)
    
    // 나머지 점들 연결
    for (let i = 1; i < connection.path.length; i++) {
      const point = gridToScreen(connection.path[i].x, connection.path[i].y)
      g.lineTo(point.x, point.y)
    }
    
    // 선택된 연결은 하이라이트 효과 추가
    if (isSelected) {
      g.lineStyle(lineWidth + 4, 0xFFFFFF, 0.3)
      
      const firstPointHighlight = gridToScreen(connection.path[0].x, connection.path[0].y)
      g.moveTo(firstPointHighlight.x, firstPointHighlight.y)
      
      for (let i = 1; i < connection.path.length; i++) {
        const point = gridToScreen(connection.path[i].x, connection.path[i].y)
        g.lineTo(point.x, point.y)
      }
    }
    
    // 도로 노드 표시 (디버깅용, 선택시에만)
    if (isSelected) {
      g.lineStyle(2, 0xFFFFFF, 1)
      connection.path.forEach((node, index) => {
        const pos = gridToScreen(node.x, node.y)
        g.beginFill(color, 1)
        g.drawCircle(pos.x, pos.y, index === 0 || index === connection.path.length - 1 ? 6 : 4)
        g.endFill()
      })
    }
  }, [])
  
  return (
    <Container sortableChildren={true}>
      {connections.map((connection) => {
        // hitArea 계산
        const hitAreaPoints: number[] = []
        if (connection.path && connection.path.length >= 2) {
          // 경로를 따라 두꺼운 영역 생성
          for (let i = 0; i < connection.path.length - 1; i++) {
            const p1 = gridToScreen(connection.path[i].x, connection.path[i].y)
            const p2 = gridToScreen(connection.path[i + 1].x, connection.path[i + 1].y)
            
            // 방향 벡터
            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const len = Math.sqrt(dx * dx + dy * dy)
            
            // 수직 벡터 (두께를 위해)
            const perpX = (-dy / len) * 15
            const perpY = (dx / len) * 15
            
            if (i === 0) {
              hitAreaPoints.push(p1.x + perpX, p1.y + perpY)
              hitAreaPoints.push(p1.x - perpX, p1.y - perpY)
            }
            
            hitAreaPoints.push(p2.x + perpX, p2.y + perpY)
            hitAreaPoints.push(p2.x - perpX, p2.y - perpY)
          }
        }
        
        return (
          <Graphics
            key={connection.id}
            draw={(g) => drawConnection(g, connection, connection.id === selectedConnectionId)}
            zIndex={connection.id === selectedConnectionId ? 100 : 50}
            eventMode={editMode === 'edit' ? "static" : "none"}
            cursor={editMode === 'edit' ? "pointer" : "default"}
            hitArea={hitAreaPoints.length > 0 ? new Polygon(hitAreaPoints) : undefined}
            pointerdown={(event) => {
              if (editMode === 'edit') {
                const position = { 
                  x: event.data.global.x, 
                  y: event.data.global.y 
                }
                selectConnection(connection.id, position)
              }
            }}
          />
        )
      })}
    </Container>
  )
}