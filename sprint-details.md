# IRKE TOWN MVP - Sprint Details

## Phase 1: 핵심 뼈대 구축

### Sprint 1.1: 프로젝트 초기화 및 기본 UI (1주)

#### 목표
프로젝트 기본 구조 설정 및 UI 레이아웃 구현

#### Tasks
1. **프로젝트 설정**
   - Next.js 14 프로젝트 생성
   - TypeScript, Tailwind CSS 설정
   - ESLint, Prettier 설정
   - 기본 폴더 구조 생성

2. **기본 레이아웃 구현**
   - 헤더 컴포넌트 (로고, 프로젝트명, 액션 버튼)
   - 3단 레이아웃 (도구 패널, 캔버스 영역, 속성 패널)
   - 반응형 디자인 기초

3. **라우팅 설정**
   - `/` - 랜딩 페이지
   - `/town/new` - 새 타운 생성
   - `/town/[id]` - 타운 에디터

4. **기본 상태 관리**
   - Zustand 스토어 설정
   - 프로젝트 상태 스토어
   - UI 상태 스토어

#### 산출물
- 실행 가능한 Next.js 앱
- 기본 UI 레이아웃
- 라우팅 시스템

#### 컨텍스트 전달
```typescript
// Sprint 1.2를 위한 인터페이스
interface CanvasConfig {
  gridSize: { width: 50, height: 50 };
  cellSize: { width: 64, height: 32 };
  viewAngle: 45; // 고정
}
```

---

### Sprint 1.2: 캔버스 시스템 구현 (1주)

#### 목표
Pixi.js 기반 아이소메트릭 캔버스 구현

#### Tasks
1. **Pixi.js 통합**
   - Pixi.js 설치 및 설정
   - React 컴포넌트로 래핑
   - 캔버스 생명주기 관리

2. **아이소메트릭 그리드**
   - 50x50 그리드 렌더링
   - 아이소메트릭 좌표 변환
   - 그리드 라인 표시/숨김

3. **카메라 컨트롤**
   - 줌 인/아웃 (50%-200%)
   - 팬 (드래그)
   - 미니맵 구현

4. **인터랙션 기초**
   - 마우스 좌표 → 그리드 좌표 변환
   - 호버 하이라이트
   - 클릭 이벤트 처리

#### 산출물
- 작동하는 아이소메트릭 캔버스
- 카메라 컨트롤
- 그리드 시스템

#### 컨텍스트 전달
```typescript
// Sprint 1.3을 위한 인터페이스
interface GridPosition {
  x: number;
  y: number;
}

interface CanvasInteraction {
  onCellHover: (pos: GridPosition) => void;
  onCellClick: (pos: GridPosition) => void;
}
```

---

### Sprint 1.3: 건물 시스템 구현 (1주)

#### 목표
3종류 건물의 배치, 이동, 삭제 구현

#### Tasks
1. **건물 데이터 구조**
   ```typescript
   // irke://component/building/*/base 참조
   interface Building {
     id: string;
     type: 'api' | 'database' | 'frontend';
     position: GridPosition;
     size: { width: number; height: number };
     status: 'healthy' | 'warning' | 'error';
   }
   ```

2. **건물 렌더링**
   - 건물 스프라이트 생성
   - 아이소메트릭 건물 그래픽
   - 상태별 색상 표현

3. **건물 배치**
   - 도구 패널에서 드래그 시작
   - 유효 위치 하이라이트
   - 충돌 감지
   - 배치 확정

4. **건물 조작**
   - 선택/해제
   - 이동 (드래그 앤 드롭)
   - 삭제 (Delete 키)
   - 속성 패널 연동

#### 산출물
- 3종 건물 배치 가능
- 건물 이동/삭제
- 충돌 감지

#### 컨텍스트 전달
```typescript
// Sprint 1.4를 위한 인터페이스
interface BuildingConnection {
  fromId: string;
  toId: string;
  type: 'road'; // MVP는 도로만
  path: GridPosition[];
}
```

---

### Sprint 1.4: 연결 시스템 및 상태 관리 (1주)

#### 목표
건물 간 도로 연결 및 전체 상태 관리 완성

#### Tasks
1. **연결 시스템**
   - 연결 시작/종료 UI
   - A* 경로 찾기 알고리즘
   - 도로 렌더링
   - 연결 유효성 검사

2. **상태 관리 완성**
   - 타운 상태 저장/불러오기
   - 실행 취소/다시 실행
   - 자동 저장 (로컬)

3. **데이터 구조 정리**
   ```typescript
   // irke://stack/architecture/town/schema 참조
   interface TownState {
     id: string;
     name: string;
     grid: GridConfig;
     buildings: Building[];
     connections: BuildingConnection[];
     metadata: TownMetadata;
   }
   ```

4. **Phase 1 통합 테스트**
   - 전체 플로우 테스트
   - 성능 벤치마크
   - 버그 수정

#### 산출물
- 완성된 타운 에디터
- 도로 연결 시스템
- 상태 저장/불러오기

#### Phase 2 준비
```typescript
// AI 통합을 위한 인터페이스
interface BuildingContext {
  building: Building;
  connections: BuildingConnection[];
  relatedBuildings: Building[];
}
```

---

## Phase 2: AI 통합

### Sprint 2.1: AI 서비스 아키텍처 (1주)

#### 목표
Qwen 2.5-Coder API 통합 기반 구축

#### Tasks
1. **AI 서비스 레이어**
   ```typescript
   // irke://stack/ai/qwen/integration 참조
   interface AIService {
     generateCode(context: AIContext): Promise<GeneratedCode>;
     analyzeIntent(message: string): Promise<Intent>;
     formatPrompt(template: string, vars: any): string;
   }
   ```

2. **Stack Library 구현**
   - irke:// 프로토콜 파서
   - 라이브러리 데이터 구조
   - 템플릿 로더
   - 응답 코드 시스템

3. **API 통합**
   - Qwen API 클라이언트
   - 인증 및 레이트 리밋
   - 에러 처리
   - 응답 스트리밍

4. **기본 프롬프트 템플릿**
   ```typescript
   // irke://prompt/generate/*/base 참조
   const templates = {
     api: 'Generate REST API for {building.name}...',
     database: 'Create schema for {building.name}...',
     frontend: 'Build component for {building.name}...'
   };
   ```

#### 산출물
- AI 서비스 레이어
- Stack Library 기초
- API 통합 완료

---

### Sprint 2.2: 코드 생성 시스템 (1주)

#### 목표
건물 타입별 코드 자동 생성

#### Tasks
1. **건물별 코드 생성기**
   - API: Express 라우터 생성
   - Database: Prisma 스키마 생성
   - Frontend: React 컴포넌트 생성

2. **컨텍스트 수집**
   ```typescript
   // 건물 선택 시 컨텍스트 구성
   interface CodeGenContext {
     targetBuilding: Building;
     connectedBuildings: Building[];
     projectType: 'webapp' | 'api' | 'fullstack';
     techStack: TechStack;
   }
   ```

3. **코드 후처리**
   - 포맷팅 (Prettier)
   - 타입 체크
   - 의존성 추출
   - 파일 구조 생성

4. **프리뷰 시스템**
   - 코드 하이라이팅
   - 파일 트리 뷰
   - 실시간 미리보기

#### 산출물
- 3종 건물 코드 생성
- 코드 프리뷰
- 파일 구조 생성

---

### Sprint 2.3: 컨텍스트 관리 (1주)

#### 목표
AI 대화 인터페이스 및 컨텍스트 관리

#### Tasks
1. **AI 대화 UI**
   - 채팅 인터페이스
   - 건물 선택 연동
   - 메시지 히스토리
   - 로딩/에러 상태

2. **컨텍스트 관리**
   ```typescript
   // irke://stack/ai/context/management 참조
   interface ConversationContext {
     sessionId: string;
     messages: Message[];
     currentBuilding?: Building;
     projectContext: ProjectContext;
   }
   ```

3. **프롬프트 최적화**
   - 동적 프롬프트 생성
   - 컨텍스트 압축
   - 토큰 최적화

4. **Phase 2 통합 테스트**
   - AI 응답 품질 테스트
   - 컨텍스트 정확도 검증
   - 성능 측정

#### 산출물
- AI 대화 시스템
- 컨텍스트 관리
- 통합된 코드 생성

---

## Phase 3: 외부 통합

### Sprint 3.1: GitHub 통합 (1주)

#### 목표
GitHub OAuth 및 레포지토리 관리

#### Tasks
1. **GitHub OAuth**
   - OAuth 앱 설정
   - 로그인 플로우
   - 토큰 관리
   - 세션 처리

2. **레포지토리 작업**
   ```typescript
   // irke://stack/integration/github/api 참조
   interface GitHubService {
     createRepo(name: string): Promise<Repository>;
     pushCode(repo: string, files: FileMap): Promise<void>;
     getRepoStatus(repo: string): Promise<RepoStatus>;
   }
   ```

3. **코드 동기화**
   - 타운 → 코드 변환
   - 파일 구조 매핑
   - 커밋 메시지 생성
   - 브랜치 관리

4. **UI 통합**
   - GitHub 연결 상태
   - 레포 선택/생성
   - 푸시 버튼
   - 동기화 상태

#### 산출물
- GitHub 로그인
- 레포 생성/푸시
- 코드 동기화

---

### Sprint 3.2: Vercel 배포 (1주)

#### 목표
원클릭 Vercel 배포 시스템

#### Tasks
1. **Vercel API 통합**
   ```typescript
   // irke://stack/deployment/vercel/api 참조
   interface VercelService {
     deployProject(githubRepo: string): Promise<Deployment>;
     getDeploymentStatus(id: string): Promise<DeployStatus>;
     getProjectDomains(id: string): Promise<string[]>;
   }
   ```

2. **배포 프로세스**
   - 프로젝트 생성
   - 환경 변수 설정
   - 빌드 설정
   - 도메인 연결

3. **모니터링**
   - 빌드 로그 스트리밍
   - 배포 상태 추적
   - 에러 처리
   - 롤백 옵션

4. **UI 통합**
   - 배포 버튼
   - 진행 상황 표시
   - 배포 URL 표시
   - 상태 인디케이터

#### 산출물
- Vercel 배포 기능
- 실시간 상태 추적
- 배포 URL 접근

---

### Sprint 3.3: 프리뷰 및 모니터링 (1주)

#### 목표
인터랙티브 프리뷰 및 기본 모니터링

#### Tasks
1. **프리뷰 시스템**
   - iframe 임베드
   - 실시간 업데이트
   - 디바이스 프리뷰
   - 인터랙션 전달

2. **모니터링 대시보드**
   ```typescript
   // 배포 상태 모니터링
   interface MonitoringData {
     buildStatus: 'building' | 'ready' | 'error';
     performance: PerformanceMetrics;
     errors: ErrorLog[];
     traffic: TrafficData;
   }
   ```

3. **에러 처리**
   - 빌드 실패 처리
   - 런타임 에러 수집
   - 사용자 알림
   - 자동 복구

4. **Phase 3 통합 테스트**
   - 전체 배포 플로우
   - 에러 시나리오
   - 성능 테스트

#### 산출물
- 라이브 프리뷰
- 모니터링 대시보드
- 완성된 배포 시스템

---

## Phase 4: 안정화 및 출시 준비

### Sprint 4.1: 버그 수정 및 성능 최적화 (1주)

#### Tasks
1. **버그 수정**
   - 크리티컬 버그 우선순위
   - 엣지 케이스 처리
   - 브라우저 호환성
   - 모바일 대응

2. **성능 최적화**
   - 캔버스 렌더링 최적화
   - API 호출 최소화
   - 번들 사이즈 감소
   - 로딩 시간 개선

3. **안정성 강화**
   - 에러 바운더리
   - 폴백 UI
   - 재시도 로직
   - 로깅 시스템

---

### Sprint 4.2: 관리자 대시보드 및 출시 준비 (1주)

#### Tasks
1. **관리자 대시보드**
   - 사용자 통계
   - 시스템 상태
   - 에러 로그
   - 긴급 제어

2. **문서화**
   - 사용자 가이드
   - API 문서
   - 트러블슈팅
   - 릴리즈 노트

3. **출시 준비**
   - 프로덕션 환경 설정
   - 모니터링 도구 설정
   - 백업 시스템
   - 출시 체크리스트

#### 최종 산출물
- 프로덕션 준비 완료
- 관리자 도구
- 완전한 문서화
- 출시 가능한 MVP

---

## Claude Code 작업 지침

### 1. 컨텍스트 유지
```typescript
// 각 Sprint 시작 시 이전 Sprint의 인터페이스 참조
import { PreviousSprintInterfaces } from './previous-sprint';
```

### 2. 라이브러리 프로토콜
```typescript
// 모든 주요 기능에 프로토콜 참조 주석
// irke://stack/framework/nextjs/14
// irke://component/building/api/base
```

### 3. 범위 준수
- MVP 기능만 구현
- v2.0 기능 구현 금지
- 추가 최적화 자제

### 4. 테스트 가능성
- 각 Sprint 완료 시 독립 테스트 가능
- E2E 테스트 시나리오 포함
- 성능 벤치마크 포함

---

*이 Sprint 계획을 따라 체계적으로 MVP를 개발하세요. 각 Sprint는 명확한 산출물과 다음 Sprint를 위한 인터페이스를 제공합니다.*