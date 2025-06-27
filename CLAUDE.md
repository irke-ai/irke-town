# IRKE TOWN 개발 가이드

## 프로젝트 개요
IRKE TOWN은 웹 애플리케이션 개발을 타운 빌딩 게임으로 변환하는 혁신적인 플랫폼입니다.

## 개발 환경
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **상태관리**: Zustand
- **UI 라이브러리**: Radix UI
- **캔버스**: Pixi.js (Sprint 1.2부터)

## 프로젝트 구조
```
src/
├── app/                    # Next.js App Router
├── components/            # React 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── ui/              # UI 컴포넌트
│   └── canvas/          # 캔버스 컴포넌트
├── stores/              # Zustand 스토어
├── lib/                # 유틸리티 함수
└── types/              # TypeScript 타입 정의
```

## 개발 명령어
```bash
npm run dev        # 개발 서버 실행 (포트 3001)
npm run build      # 프로덕션 빌드
npm run lint       # ESLint 실행
npm run lint:fix   # ESLint 자동 수정
npm run typecheck  # TypeScript 타입 체크
```

## Sprint 진행 상황
- [x] Sprint 1.1: 프로젝트 초기화 및 기본 UI ✓
- [x] Sprint 1.2: 캔버스 시스템 구현 ✓
- [ ] Sprint 1.3: 건물 시스템 구현
- [ ] Sprint 1.4: 연결 시스템 및 상태 관리

## Sprint 1.2 완료 사항
- Pixi.js + @pixi/react 통합
- 50x50 아이소메트릭 그리드 시스템
- 좌표 변환 (그리드 ↔ 화면)
- 마우스 호버 하이라이트
- 카메라 컨트롤:
  - 줌 (50%-200%, 버튼 및 Ctrl+휠)
  - 팬 (Shift+드래그)
  - 미니맵
- 좌표 표시 및 디버그 오버레이

## 주요 참고사항
1. irke-web 프로젝트의 UI 컴포넌트와 패턴을 적극 활용
2. 클린 프로젝트 가이드라인 준수
3. 각 Sprint별 상세 가이드 문서 참조

## 다음 단계
Sprint 1.3에서 3종류 건물(API, Database, Frontend)의 배치/이동/삭제 시스템을 구현합니다.