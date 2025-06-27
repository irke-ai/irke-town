# 건물 클릭 이벤트 해결 방안

## 문제 요약
IRKE-TOWN 프로젝트에서 @pixi/react v7.1.2를 사용 중 건물 클릭 이벤트가 작동하지 않는 문제가 발생했습니다.

## 해결된 근본 원인
1. **@pixi/events 패키지 누락**: @pixi/react v7에서 이벤트 시스템을 사용하려면 명시적으로 import 필요
2. **@pixi/react v7 버그**: Graphics 요소가 interactive하게 작동하려면 Stage에 최소 하나의 Sprite가 필요
3. **레이어 순서 문제**: CellInteractionLayer가 BuildingLayer보다 앞에 있어 이벤트 가로채기
4. **텍스트 노드 오류**: JSX 내부의 공백과 주석이 @pixi/react에서 텍스트 노드로 인식되어 오류 발생

## 적용된 해결책

### 1. @pixi/events 패키지 설치 및 설정
```bash
npm install @pixi/events
```

**파일: src/app/layout.tsx**
```typescript
import '@pixi/events'
```

### 2. BuildingClickLayerFixed.tsx 생성
- **투명 Sprite 추가**: @pixi/react v7 버그 해결
- **zIndex=100 설정**: 높은 우선순위로 다른 레이어보다 앞에 배치
- **정확한 hitArea**: Rectangle 기반 클릭 영역 설정
- **event.stopPropagation()**: 이벤트 전파 차단
- **eventMode="static"**: deprecation 경고 해결

### 3. CellInteractionLayerImproved.tsx 생성
- **건물 충돌 감지**: 건물이 있는 셀에서는 이벤트 처리하지 않음
- **zIndex=50 설정**: BuildingLayer보다 낮은 우선순위

### 4. 레이어 순서 최적화
```typescript
<Container sortableChildren={true}>
  <GridLayer />                    // zIndex: 0
  <CellInteractionLayerImproved /> // zIndex: 50
  <BuildingClickLayerFixed />      // zIndex: 100
  <PlacementPreviewLayer />        // zIndex: 200
</Container>
```

### 5. 성능 최적화
- **useMemo**: 투명 Sprite 메모이제이션
- **useCallback**: 이벤트 핸들러 최적화
- **타입 안전성**: FederatedPointerEvent 타입 사용

## 테스트 결과
✅ 건물 클릭 이벤트 정상 작동  
✅ 셀 클릭 이벤트 정상 작동  
✅ 이벤트 충돌 없음  
✅ 성능 최적화 완료  
✅ Deprecation 경고 해결  

## 사용법
```typescript
// 건물 클릭 시
console.log('Building clicked:', buildingId)
selectBuilding(buildingId) // 건물 선택

// 셀 클릭 시
console.log('Cell clicked:', x, y)
onCellClick(x, y) // 셀 클릭 처리
```

## 주요 파일
- `src/components/canvas/layers/BuildingClickLayerFixed.tsx`
- `src/components/canvas/layers/CellInteractionLayerImproved.tsx`
- `src/types/events.ts`
- `src/app/layout.tsx`

## 향후 개선 방향
1. 건물 호버 효과 추가
2. 드래그 앤 드롭 지원
3. 멀티 선택 기능
4. 키보드 단축키 지원

---
**최종 업데이트**: 2024-12-27  
**상태**: ✅ 완료  
**테스트**: ✅ 통과