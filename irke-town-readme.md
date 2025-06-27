# IRKE TOWN MVP 개발 가이드

## 프로젝트 개요
IRKE TOWN은 복잡한 웹 애플리케이션 개발을 타운 빌딩 게임으로 변환하는 혁신적인 플랫폼입니다.

### 핵심 특징
- 🎮 **게임화된 개발**: 건물을 배치하고 연결하여 앱 구조 설계
- 🤖 **AI 자동화**: Qwen 2.5-Coder를 활용한 자동 코드 생성
- 🚀 **즉시 배포**: GitHub 및 Vercel 통합으로 원클릭 배포
- 🎯 **진입 장벽 제거**: 코딩 지식 없이도 복잡한 앱 개발 가능

## 기술 아키텍처

### 시스템 구조
```
┌─────────────────┐     ┌─────────────────┐
│   클라이언트     │     │   외부 서비스    │
│  (Next.js SPA)  │────▶│  - GitHub API   │
└────────┬────────┘     │  - Qwen API     │
         │              │  - Vercel API   │
         ▼              └─────────────────┘
┌─────────────────┐
│   API Gateway   │
│  (Next.js API)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   비즈니스 로직  │────▶│   데이터 레이어  │
│   (Services)    │     │  - PostgreSQL   │
└─────────────────┘     │  - Redis        │
                        │  - S3           │
                        └─────────────────┘
```

### 기술 스택
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Canvas**: Pixi.js (아이소메트릭 렌더링)
- **State Management**: Zustand
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase), Redis
- **AI**: Qwen 2.5-Coder API
- **Authentication**: GitHub OAuth
- **Deployment**: Vercel

## UI/UX 설계

### 메인 화면 구성
```
┌─────────────────────────────────────────────────┐
│ 헤더 (로고 | 프로젝트명 | 저장 | 배포 | 프로필) │
├─────────────────────────────────────────────────┤
│ 도구 패널 │       타운 캔버스          │ 속성 패널│
│           │   (아이소메트릭 뷰)       │         │
│ - 건물    │                          │ - 건물   │
│ - 연결    │   [건물] ─── [건물]      │   정보   │
│ - 뷰      │       │                  │ - 설정   │
│           │   [건물] ─── [건물]      │ - AI대화 │
└─────────────────────────────────────────────────┘
```

### 아이소메트릭 캔버스
- **그리드**: 50x50 (MVP), 각 셀 64x32 픽셀
- **카메라**: 줌(50%-200%), 팬, 고정 45도 뷰
- **인터랙션**: 드래그 배치, 클릭 선택, 호버 프리뷰

### 건물 시스템
- **기본 건물 (MVP)**:
  - API Gateway (2x3)
  - Database (3x3)
  - Frontend Page (2x2)
- **시각적 상태**: 정상(초록), 경고(노랑), 에러(빨강)
- **연결**: 도로만 지원 (MVP)

## MVP 개발 로드맵

### Phase 1: 핵심 뼈대 (4주)
- Sprint 1.1: 프로젝트 초기화 및 기본 UI (1주)
- Sprint 1.2: 캔버스 시스템 구현 (1주)
- Sprint 1.3: 건물 시스템 구현 (1주)
- Sprint 1.4: 연결 시스템 및 상태 관리 (1주)

### Phase 2: AI 통합 (3주)
- Sprint 2.1: AI 서비스 아키텍처 (1주)
- Sprint 2.2: 코드 생성 시스템 (1주)
- Sprint 2.3: 컨텍스트 관리 (1주)

### Phase 3: 외부 통합 (3주)
- Sprint 3.1: GitHub 통합 (1주)
- Sprint 3.2: Vercel 배포 (1주)
- Sprint 3.3: 프리뷰 및 모니터링 (1주)

### Phase 4: 안정화 (2주)
- Sprint 4.1: 버그 수정 및 성능 최적화 (1주)
- Sprint 4.2: 관리자 대시보드 및 출시 준비 (1주)

## 라이브러리 프로토콜

### Stack Library (MVP 유일 라이브러리)
```javascript
// 프로토콜 예시
irke://stack/framework/nextjs/14
irke://stack/database/postgresql/schema
irke://stack/api/rest/patterns

// 응답 코드
200 - 정확한 매칭 발견
201 - 새로운 조합 생성됨
404 - 관련 라이브러리 없음
```

## 개발 원칙

### MVP 제약사항
1. **건물 제한**: 최대 50개
2. **건물 타입**: 3종 (API, Database, Frontend)
3. **연결**: 도로만 (지하 인프라 제외)
4. **AI**: 텍스트 기반 대화, 1개 라이브러리
5. **배포**: Vercel만 지원

### 코드 작성 규칙
1. **TypeScript**: 엄격한 타입 정의
2. **주석**: 라이브러리 프로토콜 참조 명시
3. **컴포넌트**: 단일 책임 원칙
4. **상태 관리**: 최소한의 전역 상태
5. **성능**: 50개 건물에서 60FPS 유지

## 프로젝트 구조
```
irke-town/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React 컴포넌트
│   │   ├── canvas/         # 캔버스 관련
│   │   ├── ui/            # UI 컴포넌트
│   │   └── buildings/     # 건물 컴포넌트
│   ├── services/           # 비즈니스 로직
│   │   ├── ai/           # AI 서비스
│   │   ├── github/       # GitHub 통합
│   │   └── deployment/   # 배포 서비스
│   ├── stores/            # Zustand 스토어
│   ├── lib/              # 유틸리티
│   └── types/            # TypeScript 타입
├── public/               # 정적 자산
└── docs/                # 문서
```

## 시작하기

### 환경 설정
```bash
# 환경 변수 (.env.local)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
QWEN_API_KEY=
VERCEL_TOKEN=
DATABASE_URL=
REDIS_URL=
```

### 설치 및 실행
```bash
npm install
npm run dev
```

## 테스트 전략

### Phase별 테스트
- **Phase 1**: 캔버스 인터랙션, 건물 배치/연결
- **Phase 2**: AI 대화, 코드 생성 품질
- **Phase 3**: GitHub 레포 생성, Vercel 배포
- **Phase 4**: 성능 테스트, 에러 처리

### 성능 목표
- 초기 로드: < 2초
- 캔버스 렌더링: 60 FPS @ 50 건물
- AI 응답: < 5초
- 배포 시간: < 2분

## 향후 계획 (v2.0)

### 주요 추가 기능
- 실시간 협업
- 6개 라이브러리 시스템
- AI 구역 완성
- 다층 인프라
- Import/Export
- 마켓플레이스

---

*이 README는 MVP 개발의 전체적인 가이드라인을 제공합니다. 각 Phase와 Sprint의 상세 내용은 별도 문서를 참조하세요.*