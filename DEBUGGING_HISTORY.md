# IRKE-TOWN 디버깅 히스토리

## 현재 발생하는 문제
- **새로고침 시 서버 연결 끊김**: 브라우저에서 새로고침(F5) 하면 로딩 상태에서 멈추고 서버 연결이 끊어짐
- **건물 다중 클릭 시 서버 크래시**: 건물을 여러번 클릭하면 서버가 멈추고 연결이 끊어짐
- **Hook 순서 에러**: `Rendered more hooks than during the previous render` 에러 발생

## 초기 상황 (세션 시작 시점)
- IRKE-TOWN 프로젝트에서 BuildingTooltip 편집 버튼 문제가 미해결 상태였음
- 우상단 PropertyPanel과 마우스 커서 따라다니는 BuildingTooltip이 중복으로 표시되는 문제
- 사용자 요청: "호버 플로팅 창으로 단일화 해줘"

## 해결 시도 과정

### 1단계: BuildingTooltip 편집 버튼 문제 해결 (성공)
**문제**: 건물 클릭 시 편집 버튼이 표시되지 않음
**해결책**: 
- `@pixi/events` 패키지 설치 및 import
- BuildingClickLayerFixed.tsx에서 투명 Sprite 워크어라운드 적용
- 이벤트 전파 차단 (`stopPropagation`, `preventDefault`)

**결과**: ✅ 건물 클릭 이벤트 정상 작동, 편집 버튼 표시됨

### 2단계: PropertyPanel 제거 (성공)
**문제**: 우상단 PropertyPanel과 BuildingTooltip 중복 표시
**해결책**:
1. `/home/irke/irke-town/src/app/town/[id]/page.tsx`에서 `propertyPanel={null}` 설정
2. `EditorLayout.tsx`에서 조건부 렌더링 추가
3. `CanvasContainer.tsx`에서 `<BuildingProperties />` 완전 제거

**결과**: ✅ 우상단 PropertyPanel 완전 제거됨

### 3단계: 편집 버튼 클릭 시 툴팁 사라지는 문제 해결 (실패)
**문제**: 편집 버튼 클릭 시 마우스가 버튼으로 이동하면서 호버 해제됨
**시도한 해결책**:
- `pointer-events-auto` 설정
- 툴팁에 `onMouseEnter`, `onMouseLeave` 이벤트 추가
- 선택된 건물일 때 호버 상태 유지 로직

**결과**: ❌ 여전히 툴팁이 사라짐

### 4단계: 툴팁 고정 위치 시스템 구현 (부분 성공)
**해결책**: 선택된 건물일 때 우상단 고정, 호버만 할 때 마우스 따라다니기
```typescript
const tooltipStyle = selectedBuildingId === hoveredBuildingId ? {
  // 선택된 건물: 화면 우상단에 고정
  right: 20,
  top: 20,
  transform: 'none'
} : {
  // 호버만: 마우스 커서 따라다니기
  left: mousePosition.x + 15,
  top: mousePosition.y - 10,
  transform: mousePosition.x > window.innerWidth - 300 ? 'translateX(-100%)' : 'none'
}
```

**결과**: ✅ UI 동작은 개선되었으나 서버 안정성 문제 발생

### 5단계: 성능 최적화 시도 (부분 성공)
**문제**: 새로고침 및 다중 클릭 시 서버 크래시
**시도한 최적화**:

#### 5-1. 디버그 로그 제거
```typescript
// 제거된 로그들
console.log('🔍 BuildingTooltip Debug:', ...)
console.log('🏢 selectBuilding called:', ...)
console.log('👆 hoverBuilding called:', ...)
console.log('*** BUILDING CLICKED ***', ...)
```

#### 5-2. 중복 이벤트 방지
```typescript
// BuildingClickLayerFixed.tsx
const handleBuildingClick = useCallback((buildingId: string, event: FederatedPointerEvent) => {
  // 이미 선택된 건물을 다시 클릭하면 무시
  if (selectedBuildingId === buildingId) {
    return
  }
  // ...
}, [selectBuilding, hoverBuilding, selectedBuildingId])

const handleBuildingHover = useCallback((buildingId: string) => {
  // 이미 호버된 건물이면 무시
  if (hoveredBuildingId === buildingId) {
    return
  }
  hoverBuilding(buildingId)
}, [hoverBuilding, hoveredBuildingId])
```

#### 5-3. 메모이제이션 적용
```typescript
// BuildingTooltip.tsx
const hoveredBuilding = useMemo(() => 
  buildings.find(b => b.id === hoveredBuildingId), 
  [buildings, hoveredBuildingId]
)

const template = useMemo(() => 
  hoveredBuilding ? BUILDING_TEMPLATES[hoveredBuilding.type as keyof typeof BUILDING_TEMPLATES] : null,
  [hoveredBuilding]
)
```

**결과**: ✅ 일부 성능 개선되었으나 여전히 서버 크래시 발생

### 6단계: Hook 순서 문제 해결 (시도 중)
**문제**: `Rendered more hooks than during the previous render` 에러
**원인**: 조건부 렌더링 전/후로 Hook 호출 순서가 바뀜
**해결 시도**:
```typescript
// 모든 Hook을 조건부 렌더링 전에 호출
const hoveredBuilding = useMemo(...)
const template = useMemo(...)
const statusColor = useMemo(...)
const isSelectedBuilding = selectedBuildingId === hoveredBuildingId
const tooltipStyle = useMemo(...)

// 조건부 렌더링은 모든 Hook 호출 후
if (!hoveredBuildingId || !mousePosition || !hoveredBuilding) {
  return null
}
```

**결과**: ⏳ 구현했으나 여전히 서버 안정성 문제

## 현재 문제 상황

### 주요 증상
1. **새로고침 시**: 페이지가 로딩 상태에서 멈추고 서버 응답 없음
2. **건물 다중 클릭 시**: 서버가 완전히 중단됨
3. **콘솔 에러**: Hook 순서 관련 React 에러

### 추정되는 원인
1. **메모리 누수**: 이벤트 리스너나 상태 업데이트에서 메모리 누수 발생
2. **무한 루프**: useCallback/useMemo 의존성 배열 문제로 무한 재렌더링
3. **이벤트 충돌**: 여러 이벤트 핸들러 간의 충돌
4. **PIXI.js 호환성**: @pixi/react v7의 알려진 버그와 상호작용

### 현재 파일 상태

#### 주요 수정된 파일들
- `/home/irke/irke-town/src/components/canvas/BuildingTooltip.tsx` - 과도한 최적화로 복잡해짐
- `/home/irke/irke-town/src/components/canvas/layers/BuildingClickLayerFixed.tsx` - 중복 이벤트 방지 로직 추가
- `/home/irke/irke-town/src/stores/buildingStore.ts` - 디버그 로그 제거
- `/home/irke/irke-town/src/app/town/[id]/page.tsx` - PropertyPanel 제거
- `/home/irke/irke-town/src/components/canvas/CanvasContainer.tsx` - BuildingProperties 제거

#### 현재 코드 복잡도
- BuildingTooltip: 과도한 useMemo 사용으로 복잡해짐
- 이벤트 핸들러: 중복 방지 로직으로 복잡해짐
- Hook 의존성: 복잡한 의존성 배열

## 권장 해결 방안

### 1. 단순화 접근법 (추천)
복잡한 최적화를 모두 제거하고 기본적인 구현으로 돌아가기
- useMemo/useCallback 최소화
- 이벤트 핸들러 단순화
- 디버그 모드 완전 제거

### 2. 점진적 개선
- 먼저 안정성 확보 (서버 크래시 방지)
- 이후 성능 최적화
- 마지막에 UX 개선

### 3. 근본 원인 분석
- React DevTools로 리렌더링 패턴 분석
- 메모리 사용량 모니터링
- 이벤트 리스너 누수 확인

## 다음 단계 제안

1. **즉시 조치**: BuildingTooltip을 가장 단순한 형태로 롤백
2. **안정성 확보**: 서버 크래시 문제 완전 해결
3. **점진적 기능 추가**: 안정성 확보 후 편집 기능 다시 구현
4. **테스트**: 각 단계마다 충분한 테스트

## 로그 및 에러 메시지

### 최근 콘솔 로그
```
main-app.js?v=1751018148162:1836 Download the React DevTools
CanvasContainer.tsx:26 Adding test buildings (one time only)...
TownCanvas.tsx:163 Stage mounted, setting pixiApp: _Application2
Unhandled Runtime Error: Rendered more hooks than during the previous render.
```

### 서버 로그 패턴
```
✓ Starting...
✓ Ready in [시간]
○ Compiling /town/[id] ...
✓ Compiled /town/[id] in [시간]
GET /town/123 200 in [시간]
[이후 연결 끊김]
```

## 기술적 세부사항

### 사용 중인 기술 스택
- Next.js 14.2.30
- @pixi/react v7
- pixi.js 7.2.4
- Zustand (상태관리)
- TypeScript
- Tailwind CSS

### 알려진 이슈
- @pixi/react v7의 Graphics 이벤트 처리 버그
- @pixi/events 패키지 필요
- 투명 Sprite 워크어라운드 필수

---

**작성일**: 2025-01-27
**작성자**: Claude Code Assistant
**상태**: 서버 안정성 문제 해결 중