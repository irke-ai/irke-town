# 건물 클릭 이벤트 문제 해결 히스토리

## 문제 요약
IRKE-TOWN 프로젝트에서 건물 클릭 이벤트가 작동하지 않는 문제가 발생했습니다. 여러 접근 방식을 시도했지만 모두 실패했습니다.

## 기술 스택
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **렌더링**: Pixi.js 7.2.4 + @pixi/react 7.1.2
- **상태관리**: Zustand

## 문제 상세
- **현상**: 건물을 클릭해도 선택되지 않음
- **예상 동작**: 건물 클릭 시 `selectBuilding(building.id)` 호출되어야 함
- **실제 동작**: 클릭 이벤트가 전혀 발생하지 않음

## 시도한 해결책들

### 1. BuildingLayerFixed.tsx (hitArea 접근법)
```typescript
// 파일: src/components/canvas/layers/BuildingLayerFixed.tsx
<Container
  interactive={true}
  eventMode="static"
  cursor="pointer"
  hitArea={bounds}  // Rectangle 기반 hit area
  pointerdown={handleClick}
>
  <Graphics draw={draw} />
</Container>
```
**결과**: 이벤트 발생하지 않음

### 2. BuildingLayerSimple.tsx (Graphics 직접 이벤트)
```typescript
// Graphics에 직접 이벤트 핸들러 추가 시도
<Graphics 
  draw={draw} 
  interactive={true}
  eventMode="static"
  cursor="pointer"
  pointerdown={handleClick}
/>
```
**결과**: Graphics는 직접 이벤트를 지원하지 않음

### 3. BuildingLayerTest.tsx (간단한 사각형)
```typescript
// 간단한 사각형으로 테스트
const draw = (g: PixiGraphics) => {
  g.clear()
  g.beginFill(isSelected ? 0xff0000 : statusColor, 0.8)
  g.lineStyle(2, isSelected ? 0x3b82f6 : 0x000000)
  g.drawRect(-30, -30, 60, 60)
  g.endFill()
}
```
**문제**: 무한 리렌더링으로 브라우저 멈춤

### 4. VanillaBuildingLayer.tsx (순수 Pixi.js)
```typescript
// @pixi/react 우회하여 순수 Pixi.js 사용
useEffect(() => {
  const graphics = new PixiGraphics()
  graphics.interactive = true
  graphics.eventMode = 'static'
  graphics.cursor = 'pointer'
  graphics.on('pointerdown', () => {
    console.log('*** VANILLA BUILDING CLICKED ***', building.id)
    selectBuilding(building.id)
  })
}, [])
```
**결과**: `_parentID` 오류 발생 (React와 vanilla Pixi 혼용 문제)

### 5. BuildingClickLayer.tsx (최종 시도)
```typescript
// CellInteractionLayer 패턴 따라하기
<Container
  key={building.id}
  x={pos.x}
  y={pos.y}
  interactive={true}
  eventMode="static"
  cursor="pointer"
  pointerdown={handleClick}
  pointertap={handleClick}
  click={handleClick}
>
  <Graphics draw={draw} />
</Container>
```
**결과**: 여전히 이벤트 발생하지 않음

## 발견한 부수적 문제들

### 1. React Strict Mode 이중 실행
```typescript
// 해결: useRef로 한 번만 실행되도록 수정
const initOnce = useRef(false)

useEffect(() => {
  if (!initOnce.current) {
    initOnce.current = true
    console.log('Adding test buildings (one time only)...')
    // Add buildings...
  }
}, [addBuilding])
```

### 2. 무한 리렌더링
- **원인**: useCallback 의존성 배열 문제
- **해결**: useCallback 제거하고 단순 함수 사용

### 3. 브라우저 멈춤
- **원인**: 무한 리렌더링으로 인한 성능 문제
- **해결**: 즉시 수정하여 브라우저 재시작

## 기술적 분석

### 이벤트 전파 구조
```
TownCanvas (onMouseMove, onClick)
└── Stage (onPointerDown, onPointerMove, onPointerUp, onClick)
    └── Container (scale, position)
        ├── GridLayer
        ├── CellInteractionLayer (onCellClick, onCellHover) ← 이곳에서 이벤트 가로채기?
        ├── BuildingClickLayer ← 여기서 이벤트가 도달하지 않음
        └── PlacementPreviewLayer
```

### 버전 호환성 이슈
- **pixi.js**: 7.2.4
- **@pixi/react**: 7.1.2
- **이전 리서치**: pixi.js v8.5.0과 @pixi/react v7.1.2 버전 불일치 문제 언급됨
- **현재 상태**: 올바른 버전 조합이지만 여전히 작동하지 않음

## 리서치 결과

### @pixi/react 이벤트 처리 방식
1. **Container 이벤트**: Container에 이벤트 핸들러 추가 (권장)
2. **Graphics 이벤트**: Graphics는 직접 이벤트를 지원하지 않음
3. **hitArea**: 클릭 가능 영역을 명시적으로 정의 가능
4. **eventMode**: `'static'`으로 설정해야 이벤트 처리됨
5. **interactive**: `true`로 설정해야 함

### 시도한 모든 패턴
- ✅ Container + pointerdown
- ✅ Container + pointertap  
- ✅ Container + click
- ✅ hitArea 사용
- ✅ eventMode="static"
- ✅ interactive=true
- ✅ cursor="pointer"
- ✅ event.stopPropagation()

## 미해결 이슈

### 1. CellInteractionLayer 간섭 가능성
CellInteractionLayer가 모든 포인터 이벤트를 가로채고 있을 가능성:
```typescript
// TownCanvas.tsx:172-175
<CellInteractionLayer
  onCellClick={onCellClick}
  onCellHover={handleCellHoverCustom}
/>
<BuildingClickLayer />  // 이 레이어까지 이벤트가 도달하지 않을 수 있음
```

### 2. 레이어 순서 문제
BuildingClickLayer가 CellInteractionLayer 뒤에 있어서 이벤트가 차단될 수 있음.

### 3. zIndex 설정 부족
Building Container에 zIndex를 설정했지만 여전히 이벤트가 발생하지 않음.

## 다음 시도할 수 있는 방법들

### 1. 레이어 순서 변경
```typescript
<Container>
  <GridLayer />
  <BuildingClickLayer />      // BuildingLayer를 앞으로
  <CellInteractionLayer />    // CellLayer를 뒤로
  <PlacementPreviewLayer />
</Container>
```

### 2. CellInteractionLayer 수정
CellInteractionLayer에서 건물이 있는 셀은 이벤트를 전파하도록 수정:
```typescript
const handleCellClick = (gridX: number, gridY: number, event: any) => {
  const hasBuilding = buildings.some(b => 
    gridX >= b.gridX && gridX < b.gridX + b.width &&
    gridY >= b.gridY && gridY < b.gridY + b.height
  )
  
  if (!hasBuilding) {
    onCellClick(gridX, gridY)
  }
  // 건물이 있으면 이벤트를 전파하지 않음
}
```

### 3. 통합 이벤트 핸들러
BuildingClickLayer를 제거하고 CellInteractionLayer에서 건물 클릭도 처리:
```typescript
const handleCellClick = (gridX: number, gridY: number) => {
  const clickedBuilding = buildings.find(b => 
    gridX >= b.gridX && gridX < b.gridX + b.width &&
    gridY >= b.gridY && gridY < b.gridY + b.height
  )
  
  if (clickedBuilding) {
    selectBuilding(clickedBuilding.id)
  } else {
    onCellClick(gridX, gridY)
  }
}
```

### 4. Pixi.js 버전 업그레이드
@pixi/react를 최신 버전으로 업그레이드하거나 pixi.js v8 호환 버전 사용 검토.

## 현재 상태
- ❌ 건물 클릭 이벤트 작동하지 않음
- ✅ 건물 렌더링 정상 작동
- ✅ 셀 호버/클릭 정상 작동  
- ✅ 카메라 컨트롤 정상 작동
- ✅ 미니맵 정상 작동

## 타임라인
- **2024-12-27**: 문제 발견 및 multiple 해결 시도
- **결과**: 모든 시도 실패, 이벤트 여전히 작동하지 않음

---
**참고**: 이 문제는 @pixi/react의 이벤트 시스템과 레이어 간섭, 또는 버전 호환성 문제로 추정됩니다. 향후 해결을 위해서는 더 깊은 디버깅이 필요합니다.