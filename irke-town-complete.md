# IRKE TOWN 상세 프로젝트 기획서 (AI 강화 완전판)

## 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [핵심 기능 상세](#2-핵심-기능-상세)
3. [사용자 경험 설계](#3-사용자-경험-설계)
4. [타운 빌딩 시스템](#4-타운-빌딩-시스템)
5. [AI 시스템 설계](#5-ai-시스템-설계)
6. [통합 라이브러리 시스템](#6-통합-라이브러리-시스템)
7. [AI 컨텍스트 관리 시스템](#7-ai-컨텍스트-관리-시스템)
8. [AI 사용성 향상 시스템](#8-ai-사용성-향상-시스템)
9. [데이터 구조 설계](#9-데이터-구조-설계)
10. [UI/UX 상세 설계](#10-uiux-상세-설계)
11. [기술 아키텍처](#11-기술-아키텍처)
12. [관리자 시스템](#12-관리자-시스템)
13. [보안 및 권한 관리](#13-보안-및-권한-관리)
14. [성능 및 확장성](#14-성능-및-확장성)

---

## 1. 프로젝트 개요

### 1.1 제품 정의
IRKE TOWN은 복잡한 웹 애플리케이션 개발을 타운 빌딩 게임으로 변환하는 혁신적인 플랫폼입니다. 사용자는 시각적으로 건물을 배치하고 연결하여 앱의 구조를 설계하면, AI가 자동으로 프로덕션 레벨의 코드를 생성하고 즉시 배포합니다.

### 1.2 핵심 혁신
- **게임화된 개발**: 개발 과정을 직관적이고 재미있게 변환
- **AI 자동화**: 설계에서 배포까지 전 과정 자동화
- **즉시 실현**: 아이디어를 몇 분 만에 실제 서비스로
- **진입 장벽 제거**: 코딩 지식 없이도 복잡한 앱 개발 가능

### 1.3 목표 사용자
1. **주니어 개발자**: 빠른 프로토타이핑과 학습을 원하는 개발자
2. **비기술 창업가**: MVP를 직접 만들고 싶은 창업가
3. **프리랜서/에이전시**: 생산성을 극대화하고 싶은 전문가
4. **교육 기관**: 프로그래밍 교육을 게임화하고 싶은 교육자

### 1.4 제품 포지셔닝
"GitHub 네이티브 + AI 우선 + 게임형 인터페이스"의 독특한 조합으로 기존 노코드 툴과 차별화

---

## 2. 핵심 기능 상세

### 2.1 타운 빌딩 에디터

#### 2.1.1 아이소메트릭 캔버스
- **뷰포트**: 100x100 그리드 기반의 아이소메트릭(2.5D) 뷰
- **카메라 컨트롤**: 
  - 줌: 50% ~ 200% (마우스 휠/핀치)
  - 팬: 드래그 또는 미니맵
  - 회전: 고정 45도 (향후 4방향 회전)
- **그리드 시스템**:
  - 각 셀: 64x32 픽셀 (아이소메트릭)
  - 스냅: 자동 그리드 정렬
  - 하이라이트: 유효/무효 위치 표시
- **모드 시스템**:
  - 편집 모드: 건물 배치/이동/연결
  - 프리뷰 모드: 인터랙티브 정보 표시

#### 2.1.2 건물 시스템
- **건물 카테고리**:
  - 인프라: 인증, 데이터베이스, 캐시, 파일 저장소
  - 프론트엔드: 페이지, 컴포넌트, 레이아웃
  - 백엔드: API, 서비스, 워커, 큐
  - 통합: 외부 API, 웹훅, 결제, 이메일
  - 분석: 대시보드, 로깅, 모니터링

- **건물 속성**:
  - 크기: 1x1 ~ 3x3 그리드
  - 상태: 정상/경고/에러/구축중
  - 메타데이터: 이름, 설명, 설정값
  - 연결 포트: 입력/출력 정의

#### 2.1.3 다층 연결 시스템
- **지상 연결**:
  - 🛣️ **도로**: 일반적인 데이터 흐름과 사용자 경로
    - HTTP/HTTPS 요청
    - 함수 호출
    - 페이지 네비게이션
    - 항상 표시되는 기본 연결

- **지하 인프라** (엑스레이 모드로 선택적 표시):
  - 💧 **상수도관** (파란색): 데이터 입력
    - 외부 데이터 소스
    - API 입력
    - 사용자 입력 스트림
    - 파일 업로드
  
  - 🚰 **하수도관** (갈색): 데이터 출력
    - 로그 데이터
    - 백업 스트림
    - 아카이브 데이터
    - 내보내기
  
  - ⚡ **전력선** (노란색): 리소스 할당
    - CPU/메모리 할당
    - 처리 우선순위
    - 성능 설정
    - 스케일링 규칙
  
  - 📡 **통신선** (초록색): 실시간 통신
    - WebSocket 연결
    - Server-Sent Events
    - 푸시 알림
    - 이벤트 브로드캐스트

- **연결 규칙**:
  - 호환성 검사: 포트 타입 매칭
  - 경로 찾기: A* 알고리즘
  - 시각화: 애니메이션 데이터 흐름

#### 2.1.4 인터랙티브 프리뷰 시스템
- **활성화 조건**:
  - 프리뷰 모드 선택
  - 최대 줌 레벨 (200%)에서만 작동
  - 마우스 호버 시 정보창 표시

- **건물별 호버 정보**:
  - **데이터베이스**: 테이블 목록, 스키마 구조, 관계도
  - **API 게이트웨이**: 엔드포인트 목록, 라우트 정보, 미들웨어
  - **프론트엔드 페이지**: 페이지 미리보기, 컴포넌트 트리, 라우트
  - **전자상거래 상점**: 상품 카탈로그 구조, 카테고리, 상품 스키마
  - **인증 센터**: 인증 방식, 사용자 필드, 권한 체계
  - **파일 저장소**: 폴더 구조, 파일 타입, 용량 제한

- **인터랙티브 기능**:
  - 인플레이스 편집: 호버 창에서 직접 수정
  - 네비게이션: 연관 페이지/상위 구조로 이동
  - AI 대화: 호버 창에서 바로 AI와 상호작용
  - 즉시 반영: 수정사항이 타운 뷰에 실시간 표시

### 2.2 AI 코드 생성 시스템

#### 2.2.1 생성 프로세스
1. **타운 분석**: 건물과 연결 구조 파싱
2. **컨텍스트 구성**: 관련 문서/템플릿 로드
3. **프롬프트 생성**: 최적화된 지시문 구성
4. **코드 생성**: Qwen 2.5-Coder 호출
5. **후처리**: 포맷팅, 검증, 최적화

#### 2.2.2 프롬프트 라이브러리
- **타운 오브젝트별 프롬프트 헤드**:
  ```
  건물 선택 시:
  - 건물 타입별 특화 프롬프트
  - 현재 컨텍스트 (연결된 건물, 설정값)
  - 관련 코드 조각
  - 이전 대화 참조
  ```
- **상황별 프롬프트 템플릿**:
  - 코드 생성
  - 버그 수정
  - 최적화
  - 문서화
  - 테스트 작성

### 2.3 GitHub 통합

#### 2.3.1 인증 및 권한
- **OAuth 스코프**:
  - repo: 레포지토리 생성/수정
  - workflow: Actions 실행
  - codespace: Codespace 생성
- **권한 관리**:
  - 읽기/쓰기 분리
  - 팀 권한 상속
  - 세션 기반 토큰

#### 2.3.2 Codespace & Aider 통합
- **Codespace 환경**:
  - devcontainer.json 자동 생성
  - 필요 도구 사전 설치
  - 환경 변수 자동 설정
  
- **Aider 통합**:
  - Codespace에 Aider 사전 설치
  - IRKE Town과 Aider 간 컨텍스트 공유
  - 프롬프트 템플릿 연동
  - 대화형 코드 수정 지원

### 2.5 실시간 협업 시스템

#### 2.5.1 멀티플레이어 타운 건설
- **동시 편집**: 여러 사용자가 한 타운에서 실시간 작업
- **시각적 표현**:
  - 각 사용자별 고유 색상 커서/아바타
  - 작업 중인 영역 하이라이트
  - 실시간 변경사항 애니메이션
- **역할 분담**:
  - 타운 소유자: 모든 권한
  - 빌더: 건물 추가/수정
  - 뷰어: 읽기 전용
- **AI 협업자**: AI도 팀원으로 참여, 자신의 작업 영역 표시

#### 2.5.2 커뮤니케이션
- **인앱 채팅**: 타운 내 실시간 메시지
- **음성 메모**: 건물에 음성 주석 첨부
- **포인팅**: "여기 보세요!" 기능으로 특정 위치 강조
- **AI 제안**: "이 부분은 제가 만들어볼까요?" 실시간 제안

### 2.6 디버깅 시각화 시스템

#### 2.6.1 에러 상태 시각화
- **건물 상태 표현**:
  - 🔥 연기 효과: 에러 발생 중
  - 🚨 사이렌: 크리티컬 에러
  - ⚠️ 노란 점멸: 경고
  - 🔧 공사 중: 수정 작업 중
- **에러 전파 표시**: 연결된 건물로 에러가 퍼지는 모습 시각화
- **성능 문제**: 교통 체증으로 표현 (데이터 흐름 막힘)

#### 2.6.2 AI 진단 시스템
- **AI 의사 건물**: 문제 있는 건물 자동 진단
- **진단 리포트**: 
  - 문제 원인 분석
  - 해결 방법 제시
  - 예상 수정 시간
- **실시간 모니터링**: AI가 타운 전체 건강 상태 감시

### 2.7 Import/Export 시스템

#### 2.7.1 프로젝트 Import
- **GitHub Import**:
  - 레포지토리 URL 입력
  - 자동 구조 분석
  - 타운 레이아웃 생성
  - 주요 파일 → 건물 매핑
- **지원 프레임워크**:
  - Next.js: 페이지 → 건물
  - Express: 라우트 → API 건물
  - React: 컴포넌트 → UI 건물
- **Import 프리뷰**: 생성될 타운 미리보기

#### 2.7.2 스마트 매핑
```javascript
// 파일 구조 → 타운 구조 자동 변환
{
  "/pages/index.js": "홈페이지 건물",
  "/pages/api/*": "API 게이트웨이",
  "/components/*": "컴포넌트 단지",
  "/lib/db.js": "데이터베이스 건물",
  "package.json": "설정 센터"
}
```

### 2.8 공간적 위치 시스템

#### 2.8.1 위치 기반 커뮤니케이션
- **위치 언급 표준화**:
  - 모든 시스템 메시지에 공간적 위치 포함
  - "Error in login.js" → "북쪽 API 건물에서 에러 발생"
  - "Database connection failed" → "동쪽 데이터베이스 건물 연결 실패"
- **방향 참조 시스템**:
  - 북쪽: 보안/인증 관련
  - 동쪽: 데이터/저장소 관련
  - 남쪽: 외부 연결/API
  - 서쪽: 실험적/샌드박스
- **랜드마크 기반 설명**:
  - "AI 구역 근처의 API 건물"
  - "중앙 광장에서 북쪽으로 두 블록"

#### 2.8.2 공간 메모리 강화
- **일관된 배치 권장**:
  - 같은 타입 건물은 같은 구역에 배치 유도
  - 자동 그룹핑 제안
- **시각적 경로 표시**:
  - 에러 발생 시 관련 건물까지 경로 하이라이트
  - 데이터 흐름을 실제 "길"로 표현

### 3.1 온보딩 플로우

#### 3.1.1 첫 방문자
1. **랜딩 페이지**: 
   - 인터랙티브 데모 타운
   - 3단계 가치 제안
   - "GitHub으로 시작" CTA

2. **GitHub 인증**:
   - OAuth 권한 설명
   - 프라이버시 보장
   - 스킵 불가 (핵심 기능)

3. **프로필 설정**:
   - 경험 수준 선택
   - 관심 프로젝트 타입
   - 시간대/언어 설정

4. **인터랙티브 튜토리얼**:
   - 첫 건물 배치 (5분)
   - 연결 만들기
   - AI 대화 체험
   - 미니 배포

#### 3.1.2 게임형 튜토리얼 시스템
- **퀘스트 구조**:
  ```
  Quest 1: "첫 타운 만들기"
  - Task 1: 타운 홀 배치 (중앙)
  - Task 2: 첫 도로 연결
  - Task 3: 데이터 센터 추가
  - Reward: 50 XP, "시작하는 건축가" 뱃지
  
  Quest 2: "첫 앱 배포하기"
  - Task 1: 프론트엔드 건물 추가
  - Task 2: AI로 코드 생성
  - Task 3: Vercel 배포
  - Reward: 100 XP, "Hello World" 뱃지
  ```

### 3.2 핵심 사용자 플로우

#### 3.2.1 프로젝트 생성 플로우
1. **시작 옵션**:
   - 빈 타운에서 시작
   - 템플릿 선택
   - 기존 프로젝트 복제

2. **기본 설정**:
   - 프로젝트 이름
   - 설명 (선택)
   - 공개/비공개
   - 기술 스택 선택

3. **타운 초기화**:
   - 그리드 크기 선택
   - 테마 선택
   - 시작 건물 배치

### 3.3 게임화 메커니즘

#### 3.3.1 진행 시스템
- **경험치 획득**:
  - 첫 건물: 10 XP
  - 첫 연결: 5 XP
  - 첫 배포: 50 XP
  - 일일 로그인: 5 XP

- **레벨 업**:
  - 1-10: 초보 건축가
  - 11-25: 숙련 건축가
  - 26-50: 마스터 건축가
  - 51+: 전설의 건축가

#### 3.3.2 업적 시스템
- **건설 업적**:
  - "첫 걸음": 첫 건물 배치
  - "연결의 달인": 50개 연결
  - "메트로폴리스": 100개 건물

- **배포 업적**:
  - "Hello World": 첫 배포
  - "신뢰성": 30일 무중단
  - "인기 서비스": 1000+ 방문자

---

## 4. 타운 빌딩 시스템

### 4.1 폐쇄형 타운 구조

#### 4.1.1 자연 경계 시스템
각 프로젝트는 **자연 경계로 완전히 둘러싸인 독립된 타운**으로 구성됩니다.

**방향별 자연 경계와 의미**:
- 🏔️ **북쪽: 산맥**
  - 기술적 의미: 보안/방화벽
  - 시각화: 보안 레벨에 따른 산 높이
  - 인터랙션: 보안 설정 시 산맥 변화
  - 특수 효과: 침입 시도 시 산사태

- 🌊 **남쪽: 바다**
  - 기술적 의미: 외부 세계와의 개방적 연결
  - 시각화: 트래픽에 따른 파도 크기
  - 인터랙션: API 공개 설정
  - 특수 효과: 등대 = 모니터링 포인트

- 🌲 **동쪽: 깊은 숲**
  - 기술적 의미: 데이터 저장소
  - 시각화: 데이터양에 따른 숲 밀도
  - 인터랙션: 백업/아카이브 관리
  - 특수 효과: 나무 성장 = 데이터 증가

- 🏜️ **서쪽: 사막/절벽**
  - 기술적 의미: 격리 영역/미사용 리소스
  - 시각화: 확장 가능한 빈 공간
  - 인터랙션: 향후 확장 영역
  - 특수 효과: 신기루 = 샌드박스 환경

#### 4.1.2 외부 연결 인프라
타운과 외부 세계를 연결하는 4가지 주요 시설:

**✈️ 공항 (글로벌 트래픽)**
- 위치: 타운 북서쪽 모서리
- 기능: 해외 사용자 접근, 글로벌 API 연동
- 시각화:
  - 비행기 착륙 = 해외 사용자 접속
  - 비행기 크기 = 트래픽 볼륨
  - 국기 표시 = 접속 국가
- 데이터: 실시간 국가별 사용자 분포

**🚢 항구 (대량 데이터 처리)**
- 위치: 남쪽 해안가
- 기능: B2B 트래픽, 대용량 데이터 전송, 백업
- 시각화:
  - 화물선 = 벌크 데이터 작업
  - 컨테이너 = 데이터 패키지
  - 크레인 작동 = 처리 중
- 데이터: 데이터 전송량, 처리 상태

**🚉 기차역 (국내 일반 트래픽)**
- 위치: 타운 동쪽 입구
- 기능: 일반 사용자 접근, 정기적 트래픽
- 시각화:
  - 기차 도착 = 사용자 세션 시작
  - 승객 수 = 동시 접속자
  - 시간표 = 피크 시간대
- 데이터: 시간대별 접속 패턴

**🌉 다리 (서비스 간 연동)**
- 위치: 필요에 따라 동적 생성
- 기능: 타 서비스/API와의 연결
- 시각화:
  - 차량 통행 = API 호출
  - 다리 폭 = 대역폭
  - 신호등 = API 상태
- 데이터: 연동 서비스 목록, 호출 빈도

#### 4.1.3 타운 성장과 환경 변화

**프로젝트 성장 단계**:
1. **Stage 1: 황무지 (1-10 건물)**
   - 메마른 땅, 먼지 날림
   - 기본 도로만 존재
   - 외부 연결 최소화

2. **Stage 2: 개척 마을 (11-30 건물)**
   - 첫 녹지 등장
   - 포장 도로 시작
   - 기차역 활성화

3. **Stage 3: 번영하는 도시 (31-70 건물)**
   - 공원과 가로수
   - 모든 외부 연결 활성화
   - 야간 조명 추가

4. **Stage 4: 메트로폴리스 (70+ 건물)**
   - 고층 건물 등장
   - 복잡한 교통망
   - 활발한 경제 활동 표현

**성과 연동 환경 변화**:
- ✅ 에러율 감소 → 맑은 날씨, 푸른 하늘
- 📈 사용자 증가 → 활발한 거리, NPC 증가
- 💰 수익 발생 → 건물 업그레이드, 황금 장식
- ⚡ 성능 최적화 → 매끄러운 교통 흐름

### 4.2 건물 상세 설계

#### 4.2.1 건물 타입별 특성

**인증 센터 (Auth Center)**
- 크기: 2x2
- 외관: 보안 게이트, 경비 부스, 체크포인트
- 포트: 입력(사용자 정보), 출력(토큰)
- 설정: OAuth 제공자, 세션 시간, MFA 옵션
- 특수 효과: 로그인 시 게이트 열림

**데이터베이스 (Database)**
- 크기: 3x3
- 외관: 거대한 서버 빌딩, 냉각탑
- 포트: 입력(쿼리), 출력(결과)
- 설정: 엔진(PostgreSQL/MySQL), 스키마
- 특수 효과: 데이터 처리 시 LED 깜빡임

**API 게이트웨이 (API Gateway)**
- 크기: 2x3
- 외관: 교통 관제탑, 다중 진입로
- 포트: 입력(요청), 출력(응답)
- 설정: 라우트, 미들웨어, 레이트 리밋
- 특수 효과: 트래픽에 따른 신호등 변화

#### 4.2.2 건물 내부 시스템
- **줌인 시 내부 공개**:
  - 최대 줌 레벨에서 건물 지붕 투명화
  - 내부 구조 및 작동 상태 표시
  - 상세 설정 UI 표시
  - 실시간 메트릭 표시

- **인터랙티브 요소**:
  - 클릭으로 설정 패널 열기
  - 드래그로 내부 구성 변경
  - 실시간 로그 확인
  - AI 어시스턴트 컨텍스트 제공

### 4.3 복합 단지 시스템

#### 4.3.1 단지 (Complex) 개념
**담장으로 둘러싸인 구역**으로 관련 기능을 그룹화:

**구성 요소**:
- 담장: 구역 경계 표시
- 정문: 단일 진입점
- 내부 건물군: 관련 기능 건물들
- 내부 도로망: 건물 간 연결
- 중앙 광장: 공통 리소스

**단지 타입 예시**:
1. **전자상거래 단지**:
   - 상품 전시관
   - 장바구니 센터
   - 결제 프로세서
   - 주문 관리소
   - 재고 창고

2. **인증 보안 단지**:
   - 로그인 센터
   - 토큰 관리소
   - 권한 검증소
   - 세션 저장소

3. **콘텐츠 관리 단지**:
   - 콘텐츠 편집기
   - 미디어 라이브러리
   - 캐시 서버
   - CDN 연결점

#### 4.3.2 단지 생성 및 관리
**생성 프로세스**:
1. 담장 도구 선택
2. 영역 그리기 (최소 5x5)
3. 정문 위치 지정
4. 이름 및 타입 설정
5. 내부 건물 배치

**관리 기능**:
- 단지 전체 이동/복사
- 템플릿으로 저장
- 일괄 설정 변경
- 단지 레벨 모니터링

### 4.5 AI 구역 시스템

#### 4.5.1 AI 구역 개념
**AI와 사용자가 협업하는 특별한 구역**으로, 타운 중앙 근처에 위치하며 AI의 사고 과정과 작업을 투명하게 보여주는 공간입니다.

**위치와 스타일**:
- 타운 중앙 근처 (모든 건물과 쉽게 연결)
- 반투명하고 미래적인 시각적 스타일
- "AI District" 또는 "지능 특구"로 명명

#### 4.5.2 AI 구역의 핵심 건물

**🧠 AI 본부 (AI Headquarters)**
- 현재 AI의 상태와 활동 실시간 표시
- 처리 중: 은은한 맥동 효과
- 생각 중: 톱니바퀴 회전
- 대기 중: 고요한 빛
- 클릭 시 현재 AI 컨텍스트 요약 표시

**🏛️ AI 회의실 (AI Council)**
- 복잡한 결정 시 여러 AI 관점 제시
- Security AI, UX AI, Performance AI 등 전문 AI 의견
- 사용자가 최종 선택하는 인터페이스

**🏖️ AI 샌드박스 (AI Sandbox)**
- AI와 사용자가 함께 실험하는 공간
- 실패해도 안전한 격리된 환경
- 여러 옵션을 동시에 시도하고 비교
- 성공한 구조를 실제 타운으로 export

**🔬 AI 실험실 (AI Laboratory)**
- 여러 옵션을 미리 생성하고 비교
- A/B/C 옵션의 장단점 시각화
- 프로토타입 프리뷰 제공

**📚 실패 박물관 (Failure Museum)**
- 과거 실수 케이스 보관 및 전시
- 유사 상황 경고 시스템
- 개선된 해결책 제시

**🌱 피드백 정원 (Feedback Garden)**
- 사용자 피드백 시각화
- 긍정: 꽃 🌸, 개선: 새싹 🌱, 성장: 나무 🌳
- AI 학습 진도 표시

**💭 사고 구름 (Thought Cloud)**
- AI의 현재 사고 과정 표시
- 확신도 퍼센티지
- 고민하는 옵션들 시각화

**🎯 신뢰도 타워 (Confidence Tower)**
- 응답 확신도를 높이로 표현 (0-100%)
- 색상으로 위험도 표시 (초록-노랑-빨강)
- 낮은 확신도 시 추가 정보 요청

#### 4.5.3 AI 구역 특별 기능

**투명성 모드**
- AI 구역 전체가 유리처럼 투명해짐
- 내부 작동 과정 실시간 표시
- 참조 중인 라이브러리, 고려 중인 옵션 공개

**AI 사고 과정 시각화 강화**
- **처리 단계 표시**:
  - 💭 "요청 분석 중..." (구름 애니메이션)
  - 🔍 "관련 정보 검색 중..." (돋보기 아이콘)
  - ⚡ "코드 생성 중..." (번개 효과)
  - ❓ "확신도 낮음" (물음표 표시)
- **다중 옵션 표시**:
  - 여러 해결책 고민 시 반투명 건물 3개 동시 표시
  - 각 옵션의 장단점을 말풍선으로 표현
  - 최종 선택 시 선택된 건물만 불투명하게 변경
- **확신도 시각화**:
  - 높음(90%+): 선명하고 밝은 표시
  - 중간(70-90%): 일반적인 밝기
  - 낮음(<70%): 흐릿하고 점선 처리

**협업 요청**
- AI가 불확실할 때 "?" 깃발 표시
- 사용자에게 추가 정보나 명확한 지시 요청

**학습 시각화**
- 성공/실패가 즉시 구역에 반영
- 시간이 지나면서 구역이 "성장"
- 더 정교한 건물과 연결 추가

### 4.6 건물 핫스왑 시스템

#### 4.6.1 핫스왑 개념
샌드박스에서 개발한 건물을 실제 운영 중인 건물과 **무중단으로 교체**하는 시스템입니다.

**핵심 원리**:
- 건물 = 교체 가능한 모듈
- 연결 인터페이스만 일치하면 스왑 가능
- Blue-Green 배포의 타운 버전

#### 4.6.2 스왑 프로세스

**1. 호환성 검사**
```
✅ 입력 포트 일치 확인
✅ 출력 포트 일치 확인  
✅ 데이터 타입 호환성
✅ 성능 요구사항 충족
```

**2. 스왑 실행**
- 샌드박스 건물이 애니메이션으로 이동
- 기존 건물 반투명 처리
- 연결선 자동 재연결
- 실시간 데이터 플로우 테스트

**3. 결과 처리**
- **성공**: 새 건물로 완전 교체, 이전 버전은 백업
- **실패**: 즉시 원본으로 롤백, AI가 원인 분석

#### 4.6.3 고급 스왑 기능

**부분 스왑**
- 건물의 특정 기능만 선택적 교체
- 예: API의 특정 엔드포인트만 테스트

**A/B 테스트 모드**
- 트래픽을 비율로 분배 (예: 70:30)
- 실시간 성능 비교
- 자동 최적 버전 선택

**스왑 이력 관리**
- 모든 버전 히스토리 보관
- 언제든 이전 버전으로 복구 가능
- 버전 간 성능 비교 차트

---

## 5. AI 시스템 설계

### 5.1 AI 아키텍처

#### 5.1.1 Qwen 2.5-Coder 단일 모델 전략
- **선택 이유**:
  - 비용 효율성 (가장 저렴)
  - 코드 생성 특화
  - 빠른 응답 속도
  - 충분한 성능

- **API 통합**:
  - 엔드포인트 관리
  - 인증 토큰 로테이션
  - 타임아웃 설정 (30초)
  - 재시도 로직 (3회)

#### 5.1.2 토큰 최적화 전략
- **리딩 토큰 최대화**:
  - 문서/템플릿 사전 로드
  - 컨텍스트 재사용
  - 캐싱 공격적 활용
  
- **생성 토큰 최소화**:
  - 차분 생성 (변경 부분만)
  - 템플릿 우선 접근
  - 간결한 지시문

### 5.2 메시지 분석 및 프롬프트 자동 첨부 시스템

#### 5.2.1 메시지 분석 파이프라인

```javascript
// 사용자 메시지 처리 흐름
async function processUserMessage(message, context) {
  // 1단계: 메시지 분류
  const classification = await classifyMessage(message);
  
  // 2단계: 컨텍스트 추출
  const enrichedContext = {
    ...context,
    currentBuilding: getSelectedBuilding(),
    townState: getTownState(),
    projectType: getProjectType(),
    userHistory: getRecentInteractions()
  };
  
  // 3단계: 라이브러리 매칭
  const requiredLibraries = await matchLibraries(classification, enrichedContext);
  
  // 4단계: 프롬프트 헤드 생성
  const promptHead = await generatePromptHead(classification, enrichedContext, requiredLibraries);
  
  // 5단계: 최종 프롬프트 조립
  return assembleFullPrompt(promptHead, message, requiredLibraries);
}
```

#### 5.2.2 메시지 분류 시스템

```javascript
const messageClassifier = {
  // 의도 분류
  intents: {
    CREATE: ["만들다", "추가", "생성", "구현", "add", "create", "implement"],
    FIX: ["고치다", "수정", "에러", "버그", "fix", "error", "bug"],
    EXPLAIN: ["설명", "알려줘", "뭐야", "어떻게", "explain", "what", "how"],
    OPTIMIZE: ["최적화", "개선", "빠르게", "optimize", "improve", "faster"],
    DESIGN: ["디자인", "UI", "레이아웃", "design", "layout", "style"]
  },
  
  // 도메인 감지
  domains: {
    AUTH: ["로그인", "인증", "회원가입", "login", "auth", "signup"],
    PAYMENT: ["결제", "구독", "가격", "payment", "subscription", "billing"],
    DATA: ["데이터베이스", "저장", "조회", "database", "query", "storage"],
    UI: ["버튼", "폼", "테이블", "button", "form", "table"]
  },
  
  // 긴급도 판단
  urgency: {
    HIGH: ["안돼", "급해", "당장", "broken", "urgent", "asap"],
    MEDIUM: ["좀", "해주세요", "부탁", "please", "need"],
    LOW: ["궁금", "혹시", "wondering", "maybe"]
  }
}
```

#### 5.2.3 상황 인식 컨텍스트 분석

```javascript
const contextTypes = {
  // 타운 상호작용 컨텍스트
  TOWN_INTERACTION: {
    BUILDING_SELECTED: {
      trigger: "사용자가 특정 건물 클릭",
      data: ["buildingType", "buildingId", "config", "connections", "spatialLocation"]
    },
    CONNECTION_SELECTED: {
      trigger: "연결선 클릭",
      data: ["connectionType", "fromBuilding", "toBuilding", "flowData"]
    },
    COMPLEX_SELECTED: {
      trigger: "단지 영역 선택",
      data: ["complexName", "includedBuildings", "internalConnections"]
    },
    EMPTY_AREA_CLICKED: {
      trigger: "빈 공간 클릭",
      data: ["coordinates", "nearbyBuildings", "availableSpace", "district"]
    }
  },
  
  // 에러/디버깅 컨텍스트 (위치 정보 추가)
  ERROR_CONTEXT: {
    BUILD_ERROR: {
      trigger: "빌드 실패",
      data: ["errorLog", "failedFile", "errorType", "buildingLocation", "nearbyBuildings"]
    },
    RUNTIME_ERROR: {
      trigger: "실행 중 에러",
      data: ["errorMessage", "stackTrace", "affectedComponent", "spatialPath"]
    },
    CONSOLE_LOG_ATTACHED: {
      trigger: "콘솔 로그 첨부",
      data: ["logContent", "errorCount", "warningCount", "errorLocations"]
    }
  },
  
  // AI 대화 연속성 컨텍스트
  CONVERSATION_FLOW: {
    AFTER_GENERATION: {
      trigger: "AI가 코드 생성 직후",
      data: ["generatedCode", "targetFile", "lastPrompt", "targetBuildingLocation"]
    },
    FOLLOW_UP_QUESTION: {
      trigger: "이전 응답에 대한 후속 질문",
      data: ["previousResponse", "userSatisfaction", "clarificationNeeded"]
    },
    REFINEMENT_REQUEST: {
      trigger: "수정/개선 요청",
      data: ["originalCode", "requestedChanges", "attemptCount"]
    }
  },
  
  // UI/디자인 컨텍스트
  DESIGN_MODE: {
    COMPONENT_DESIGN: {
      trigger: "UI 컴포넌트 디자인 중",
      data: ["componentType", "currentStyles", "designSystem", "buildingPosition"]
    },
    LAYOUT_EDITING: {
      trigger: "레이아웃 편집 모드",
      data: ["layoutStructure", "responsiveBreakpoints", "gridSystem"]
    },
    THEME_CUSTOMIZATION: {
      trigger: "테마 커스터마이징",
      data: ["currentTheme", "colorPalette", "typography"]
    }
  },
  
  // 성능/모니터링 컨텍스트
  MONITORING_CONTEXT: {
    PERFORMANCE_ANALYSIS: {
      trigger: "성능 모니터링 뷰",
      data: ["metrics", "bottlenecks", "recommendations", "problematicAreas"]
    },
    TRAFFIC_SPIKE: {
      trigger: "트래픽 급증 감지",
      data: ["currentLoad", "peakTime", "affectedServices", "trafficFlowPaths"]
    }
  }
}
```

#### 5.2.4 동적 라이브러리 참조 결정

```javascript
async function matchLibraries(classification, context) {
  const libraries = [];
  
  // 의도 기반 매칭
  switch(classification.intent) {
    case 'CREATE':
      libraries.push(
        `irke://business/domain/${context.projectType}/requirements`,
        `irke://stack/framework/${context.techStack}/patterns`,
        `irke://component/building/${classification.domain}/template`
      );
      break;
      
    case 'FIX':
      libraries.push(
        `irke://error/pattern/${context.framework}/${classification.errorType}`,
        `irke://stack/debugging/${context.techStack}/tools`,
        `irke://prompt/debug/fix-${classification.errorCategory}`
      );
      break;
      
    case 'OPTIMIZE':
      libraries.push(
        `irke://stack/optimization/${classification.targetMetric}`,
        `irke://business/metrics/${context.projectType}/benchmarks`
      );
      break;
  }
  
  // 컨텍스트 기반 추가
  if (context.hasCompliance) {
    libraries.push(`irke://compliance/regulation/${context.regulation}`);
  }
  
  if (context.needsAccessibility) {
    libraries.push(`irke://component/accessible/${classification.uiComponent}`);
  }
  
  // 호버 컨텍스트 추가
  if (context.hoveredBuilding) {
    libraries.push(`irke://component/building/${context.hoveredBuilding.type}/schema`);
  }
  
  return libraries;
}
```

### 5.3 프롬프트 엔지니어링

#### 5.3.1 타운 오브젝트별 프롬프트 헤드
**건물 선택 시 자동 생성**:
```
Context: You are modifying a {buildingType} in IRKE TOWN.
Current State: {buildingConfig}
Connected Buildings: {connections}
Project Type: {projectType}
Tech Stack: {techStack}

User Request: {userInput}

Guidelines:
- Maintain consistency with connected buildings
- Follow {projectType} best practices
- Optimize for {primaryGoal}
- Keep changes minimal and focused
```

#### 5.3.2 상황별 프롬프트 템플릿
**코드 생성**:
```
Task: Generate {codeType} for {buildingName}
Template Base: {templateUrl}
Modifications Needed: {userRequirements}
Output Format: {fileStructure}
```

**디버깅**:
```
Error Context: {errorMessage}
Stack Trace: {relevantStack}
Building State: {buildingConfig}
Fix Approach: Step-by-step resolution
```

### 5.5 호버 UI에서의 AI 통합

#### 5.5.1 컨텍스트 인식 AI 대화
```javascript
class HoverAIIntegration {
  // 호버 상태에서의 AI 대화 처리
  async handleHoverAI(hoveredBuilding, userMessage) {
    const context = {
      mode: 'hover-preview',
      building: {
        type: hoveredBuilding.type,
        id: hoveredBuilding.id,
        currentSchema: hoveredBuilding.schema,
        connections: hoveredBuilding.connections
      },
      specificContext: this.getBuildingSpecificContext(hoveredBuilding)
    };
    
    // 건물 타입별 특화 프롬프트
    const promptHead = this.generateHoverPrompt(context);
    
    // AI 응답 생성
    const response = await this.generateResponse(promptHead, userMessage);
    
    // 즉시 적용 가능한 변경사항 제공
    return {
      response,
      applicableChanges: this.extractChanges(response),
      preview: this.generatePreview(response)
    };
  }
  
  // 건물별 특화 컨텍스트
  getBuildingSpecificContext(building) {
    switch(building.type) {
      case 'database':
        return {
          tables: building.schema.tables,
          relationships: building.schema.relations,
          indexes: building.schema.indexes
        };
      case 'api-gateway':
        return {
          endpoints: building.routes,
          middleware: building.middleware,
          authentication: building.auth
        };
      // ... 기타 건물 타입
    }
  }
}
```

#### 5.5.2 인플레이스 수정 시스템
```javascript
class InPlaceEditor {
  // 호버 UI에서 직접 수정
  async applyChange(building, change) {
    // 1. 변경사항 검증
    const validation = await this.validateChange(building, change);
    if (!validation.isValid) {
      return { error: validation.errors };
    }
    
    // 2. 실시간 프리뷰
    const preview = this.generatePreview(building, change);
    
    // 3. AI 코드 생성
    const code = await this.generateCode(building, change);
    
    // 4. 적용
    await this.applyToProject({
      buildingId: building.id,
      change,
      code,
      timestamp: new Date()
    });
    
    // 5. 타운 뷰 업데이트
    this.updateTownView(building, change);
    
    return { success: true, preview };
  }
}
```

---

## 6. 통합 라이브러리 시스템

### 6.1 내부 라이브러리 프로토콜

AI가 모든 종류의 지식을 효율적으로 탐색하고 참조할 수 있는 HTTP 스타일의 내부 통신 프로토콜입니다.

#### 6.1.1 프로토콜 구조
```
// 비즈니스 라이브러리 (요구사항 분석)
irke://business/domain/ecommerce/requirements
irke://business/compliance/gdpr/checklist
irke://business/metrics/conversion/kpis
irke://business/evolution/scaling/strategies

// 기술 스택 라이브러리 (개발)
irke://stack/framework/nextjs/14
irke://stack/testing/jest/patterns
irke://stack/optimization/performance/web-vitals
irke://stack/deployment/vercel/config
irke://stack/integration/stripe/setup

// 프롬프트 라이브러리 (AI 요청)
irke://prompt/generate/component/auth
irke://prompt/debug/fix-error/database
irke://prompt/test/create-unit/api
irke://prompt/document/write-api/openapi

// 컴포넌트 라이브러리 (타운/디자인)
irke://component/building/auth-center/v2
irke://component/ui/login-form/accessible
irke://component/analytics/dashboard/realtime
irke://component/accessible/form/wcag-aa

// 에러 라이브러리 (문제 해결)
irke://error/pattern/nextjs/hydration
irke://error/solution/database/connection
irke://error/community/deployment/vercel

// 규정/보안 라이브러리 (컴플라이언스)
irke://compliance/regulation/pci-dss/requirements
irke://compliance/security/owasp/top10
irke://compliance/audit/log/patterns

// 통합 검색
irke://search?q=authentication&type=all&context=current
```

#### 6.1.2 응답 코드 체계
```
200 - 정확한 매칭 발견
201 - 새로운 조합 생성됨
300 - 여러 옵션 존재 (선택 필요)
301 - 다른 라이브러리로 리다이렉트
400 - 요청 불명확
404 - 관련 라이브러리 없음
500 - 시스템 오류
```

### 6.2 6개 라이브러리 상세 구조

#### 6.2.1 비즈니스 라이브러리
```javascript
businessLibrary: {
  // 도메인 지식
  domains: {
    ecommerce: {
      patterns: ["b2c", "b2b", "marketplace", "subscription"],
      processes: ["catalog", "cart", "checkout", "fulfillment"],
      regulations: ["consumer-protection", "tax-compliance"]
    },
    saas: {
      patterns: ["freemium", "tiered", "usage-based", "hybrid"],
      lifecycle: ["trial", "onboarding", "activation", "retention"],
      metrics: ["mrr", "arr", "churn", "ltv", "cac"]
    }
  },
  
  // 컴플라이언스 통합
  compliance: {
    byDomain: {
      ecommerce: ["pci-dss", "gdpr", "ccpa"],
      healthcare: ["hipaa", "hl7"],
      finance: ["sox", "psd2"]
    }
  },
  
  // 메트릭 및 KPI
  metrics: {
    definitions: {},
    benchmarks: {},
    calculations: {}
  },
  
  // 비즈니스 진화 전략
  evolution: {
    scaling: ["mvp", "growth", "enterprise"],
    pivoting: ["market-fit", "expansion", "transformation"]
  }
}
```

#### 6.2.2 스택 라이브러리
```javascript
stackLibrary: {
  // 핵심 기술 스택
  frameworks: {
    frontend: {
      react: { versions: ["18.x"], patterns: [], optimization: [] },
      nextjs: { versions: ["14.x"], deployment: [], testing: [] }
    },
    backend: {
      nodejs: { patterns: [], performance: [], security: [] },
      database: { sql: [], nosql: [], caching: [] }
    }
  },
  
  // 테스트 전략 통합
  testing: {
    unit: { frameworks: ["jest", "vitest"], patterns: [] },
    integration: { tools: ["supertest"], strategies: [] },
    e2e: { frameworks: ["playwright", "cypress"], scenarios: [] }
  },
  
  // 최적화 기법 통합
  optimization: {
    performance: ["bundling", "caching", "lazy-loading"],
    seo: ["meta-tags", "structured-data", "core-web-vitals"],
    security: ["headers", "csp", "rate-limiting"]
  },
  
  // 배포 설정 통합
  deployment: {
    platforms: { vercel: {}, aws: {}, docker: {} },
    cicd: { "github-actions": {}, jenkins: {} },
    monitoring: { sentry: {}, datadog: {} }
  },
  
  // 외부 서비스 통합
  integrations: {
    payment: { stripe: {}, paypal: {} },
    auth: { auth0: {}, supabase: {} },
    communication: { sendgrid: {}, twilio: {} }
  }
}
```

#### 6.2.3 프롬프트 라이브러리
```javascript
promptLibrary: {
  // 코드 생성 프롬프트
  generation: {
    component: { templates: [], variables: [], examples: [] },
    api: { patterns: [], security: [], validation: [] },
    database: { schema: [], queries: [], migrations: [] }
  },
  
  // 디버깅 프롬프트 통합
  debugging: {
    error: { analysis: [], solution: [], prevention: [] },
    performance: { profiling: [], optimization: [] },
    security: { audit: [], fixes: [] }
  },
  
  // 테스트 생성 프롬프트 통합
  testing: {
    unit: { templates: [], assertions: [], mocking: [] },
    integration: { scenarios: [], fixtures: [] },
    e2e: { workflows: [], validations: [] }
  },
  
  // 문서화 프롬프트 통합
  documentation: {
    api: { openapi: [], examples: [] },
    code: { comments: [], readme: [] },
    user: { guides: [], tutorials: [] }
  }
}
```

#### 6.2.4 컴포넌트 라이브러리
```javascript
componentLibrary: {
  // 타운 건물
  buildings: {
    core: {
      auth: ["login-center", "oauth-gateway", "mfa-tower"],
      data: ["database", "cache", "cdn"],
      compute: ["api-server", "worker", "scheduler"]
    },
    specialized: {
      analytics: ["metrics-center", "dashboard", "reports"],
      commerce: ["product-catalog", "cart", "payment"]
    }
  },
  
  // UI 컴포넌트 (접근성 통합)
  ui: {
    primitives: {
      button: { variants: [], a11y: { aria: [], keyboard: [] } },
      input: { types: [], validation: [], a11y: {} },
      select: { searchable: true, multi: true, a11y: {} }
    },
    compounds: {
      forms: { patterns: [], validation: [], a11y: {} },
      tables: { sortable: true, filterable: true, a11y: {} },
      modals: { types: [], animations: [], a11y: {} }
    }
  },
  
  // 분석 컴포넌트 통합
  analytics: {
    charts: { types: ["line", "bar", "pie"], realtime: true },
    dashboards: { layouts: [], widgets: [], interactions: [] },
    reports: { templates: [], exports: ["pdf", "csv"] }
  }
}
```

#### 6.2.5 에러 라이브러리
```javascript
errorLibrary: {
  // 에러 패턴 데이터베이스
  patterns: {
    byFramework: {
      nextjs: {
        hydration: { frequency: "high", severity: "medium" },
        buildErrors: { frequency: "medium", severity: "high" }
      },
      react: {
        hooks: { frequency: "high", severity: "low" },
        rendering: { frequency: "medium", severity: "medium" }
      }
    },
    byCategory: {
      runtime: ["null-reference", "type-error", "memory-leak"],
      build: ["dependency", "typescript", "webpack"],
      deployment: ["env-vars", "permissions", "resources"]
    }
  },
  
  // 검증된 솔루션
  solutions: {
    automated: { fixes: [], workarounds: [] },
    manual: { steps: [], explanations: [] },
    preventive: { patterns: [], tools: [] }
  },
  
  // 커뮤니티 지혜
  community: {
    discussions: { threads: [], solutions: [] },
    voting: { helpful: [], verified: [] },
    contributions: { fixes: [], explanations: [] }
  }
}
```

#### 6.2.6 규정/보안 라이브러리
```javascript
complianceLibrary: {
  // 규정 요구사항
  regulations: {
    privacy: {
      gdpr: { requirements: [], implementation: [], audit: [] },
      ccpa: { requirements: [], differences: [], checklist: [] }
    },
    industry: {
      pciDss: { levels: [], requirements: [], certification: [] },
      hipaa: { safeguards: [], documentation: [], training: [] }
    }
  },
  
  // 보안 프레임워크
  security: {
    frameworks: {
      owasp: { top10: [], countermeasures: [], testing: [] },
      nist: { controls: [], implementation: [], assessment: [] }
    },
    implementation: {
      authentication: ["mfa", "sso", "passwordless"],
      encryption: ["at-rest", "in-transit", "key-management"],
      monitoring: ["siem", "ids", "audit-logs"]
    }
  },
  
  // 감사 및 보고
  audit: {
    logging: { requirements: [], retention: [], analysis: [] },
    reporting: { templates: [], automation: [], distribution: [] },
    remediation: { process: [], tracking: [], verification: [] }
  }
}
```

### 6.3 통합 쿼리 엔진

```javascript
async function crossLibraryQuery(userRequest, context) {
  // 1. 요청 분류 및 관련 라이브러리 식별
  const classification = await classifyRequest(userRequest);
  
  // 2. 병렬 검색 실행 (6개 라이브러리)
  const results = await Promise.all([
    queryBusinessLibrary(classification.business),
    queryStackLibrary(classification.technical),
    queryPromptLibrary(classification.implementation),
    queryComponentLibrary(classification.ui),
    queryErrorLibrary(classification.troubleshooting),
    queryComplianceLibrary(classification.regulatory)
  ]);
  
  // 3. 상호 참조 확인
  const enriched = await enrichWithCrossReferences(results);
  
  // 4. 통합 응답 생성
  return {
    code: determineResponseCode(enriched),
    primary: selectPrimaryResult(enriched),
    related: groupRelatedResults(enriched),
    risks: identifyRisks(enriched),
    recommendations: generateRecommendations(enriched)
  };
}
```

### 6.4 라이브러리 간 연결 및 학습

```javascript
{
  "crossReferences": {
    // 비즈니스 → 기술 스택
    "business:ecommerce:checkout": {
      "requiredStack": ["stack:payment:stripe", "stack:queue:bull"],
      "compliance": ["compliance:pci-dss:level1"],
      "commonErrors": ["error:payment:declined", "error:timeout:gateway"]
    },
    
    // 에러 → 해결책
    "error:deployment:build-fail": {
      "relatedStack": ["stack:nextjs:config", "stack:deployment:vercel"],
      "solutions": ["prompt:debug:build-error"],
      "preventive": ["stack:testing:pre-deploy"]
    },
    
    // 규정 → 구현
    "compliance:gdpr:consent": {
      "requiredComponents": ["component:ui:cookie-banner"],
      "implementation": ["stack:integration:consent-management"],
      "audit": ["business:metrics:consent-rate"]
    }
  }
}
```

### 6.5 동적 라이브러리 업데이트

```javascript
{
  "improvement": {
    // 자동 학습
    "autoLearn": {
      "errorPatterns": "새로운 에러 패턴 자동 추가",
      "solutionSuccess": "성공률 기반 솔루션 순위 조정",
      "complianceUpdates": "규정 변경사항 자동 반영"
    },
    
    // 커뮤니티 기여
    "contribution": {
      "types": [
        "error-solution",
        "compliance-checklist",
        "optimization-pattern",
        "integration-guide"
      ],
      "review": {
        "automated": ["syntax", "security", "performance"],
        "community": ["usefulness", "accuracy"],
        "expert": ["compliance", "best-practice"]
      }
    }
  }
}
```

---

## 7. AI 컨텍스트 관리 시스템

### 7.1 사용자별 컨텍스트 관리

6개의 공통 라이브러리와는 별개로, 각 사용자의 프로젝트별 히스토리와 컨텍스트를 관리하는 개인화된 시스템입니다.

#### 7.1.1 컨텍스트 구조

```javascript
class UserContextManager {
  constructor(userId, projectId) {
    this.userId = userId;
    this.projectId = projectId;
    
    // 사용자별 고유 데이터
    this.context = {
      // 실시간 상태
      current: {
        selectedBuilding: null,
        activeConversation: null,
        pendingChanges: []
      },
      
      // 단기 기억 (세션)
      session: {
        recentActions: [],      // 최근 10개 액션
        recentMessages: [],     // 최근 5개 대화
        tempDecisions: []       // 확정 전 임시 결정
      },
      
      // 장기 기억 (DB 저장)
      persistent: {
        projectHistory: [],     // 전체 프로젝트 히스토리
        conversations: [],      // 모든 대화 기록
        codeEvolution: {},     // 코드 변경 이력
        decisions: []          // 확정된 결정사항
      }
    };
  }
  
  // 공통 라이브러리와 개인 컨텍스트 결합
  async prepareAIContext(userMessage) {
    // 1. 공통 라이브러리에서 지식 가져오기
    const libraries = await this.selectRelevantLibraries(userMessage);
    
    // 2. 개인 컨텍스트 준비
    const personalContext = {
      currentState: this.context.current,
      recentHistory: this.getRecentHistory(),
      relevantPastDecisions: this.findRelevantDecisions(userMessage),
      projectSpecifics: this.getProjectSpecifics()
    };
    
    // 3. 통합
    return {
      sharedKnowledge: libraries,      // 공통 지식
      personalContext: personalContext  // 개인화 컨텍스트
    };
  }
}
```

#### 7.1.2 계층적 히스토리 구조

```javascript
class ProjectHistorySystem {
  constructor(projectId) {
    this.projectId = projectId;
    
    // 다층 히스토리 구조
    this.history = {
      // 1. 프로젝트 레벨 (영구 보존)
      project: {
        created: new Date(),
        originalIntent: "", // "전자상거래 사이트를 만들고 싶어"
        coreConcepts: [],   // ["B2C", "구독 모델", "다국어"]
        techDecisions: [],  // ["Next.js 14", "PostgreSQL", "Stripe"]
        businessRules: []   // ["KRW 결제만", "한국 배송만"]
      },
      
      // 2. 마일스톤 레벨 (주요 결정사항)
      milestones: [
        {
          id: "m1",
          date: new Date(),
          decision: "인증 방식을 OAuth로 결정",
          reason: "소셜 로그인 요구사항",
          impact: ["auth-center 건물 추가", "user 스키마 변경"],
          relatedConversations: ["conv_123", "conv_124"]
        }
      ],
      
      // 3. 건물별 히스토리
      buildings: {
        "auth-center-01": {
          created: new Date(),
          purpose: "사용자 인증 관리",
          decisions: [
            {
              date: new Date(),
              change: "JWT에서 세션 기반으로 변경",
              reason: "보안 강화 요청",
              code: "// 이전 JWT 구현..."
            }
          ],
          currentState: {
            config: {},
            connections: [],
            lastModified: new Date()
          }
        }
      },
      
      // 4. 대화 히스토리 (검색 가능)
      conversations: [
        {
          id: "conv_123",
          timestamp: new Date(),
          context: {
            selectedBuilding: "auth-center-01",
            userMessage: "구글 로그인 추가해줘",
            aiResponse: "...",
            codeGenerated: true,
            files: ["src/auth/google.ts"]
          },
          tags: ["auth", "oauth", "google"],
          satisfaction: "positive"
        }
      ],
      
      // 5. 코드 진화 히스토리
      codeEvolution: {
        "src/auth/google.ts": [
          {
            version: 1,
            date: new Date(),
            changes: "초기 구현",
            conversation: "conv_123"
          },
          {
            version: 2,
            date: new Date(),
            changes: "에러 핸들링 추가",
            conversation: "conv_125"
          }
        ]
      }
    };
  }
}
```

### 7.2 지능형 히스토리 검색 시스템

#### 7.2.1 상황 인식 히스토리 검색

```javascript
class SmartHistoryRetriever {
  async findRelevantHistory(message, currentContext) {
    // 1. 현재 상황 분석
    const situation = this.analyzeSituation(currentContext);
    
    // 2. 메시지 의도 파악
    const intent = this.analyzeIntent(message);
    
    // 3. 다차원 검색 전략
    const searchStrategies = [
      this.searchBySimilarSituation(situation),      // 비슷한 상황
      this.searchByWorkPattern(intent),              // 작업 패턴
      this.searchByTemporalContext(currentContext),  // 시간적 맥락
      this.searchByBuildingContext(currentContext),  // 건물 관련
      this.searchByConversationFlow(message)         // 대화 흐름
    ];
    
    // 4. 병렬 검색 실행
    const results = await Promise.all(searchStrategies);
    
    // 5. 관련도 점수 계산 및 병합
    return this.mergeAndRankResults(results, {
      message,
      situation,
      intent
    });
  }
}
```

#### 7.2.2 작업 패턴 인식

```javascript
class WorkPatternRecognizer {
  patterns = {
    // 디자인 작업 패턴
    DESIGN_WORK: {
      keywords: ["디자인", "UI", "레이아웃", "스타일", "컴포넌트", "테마"],
      contexts: ["component-design", "layout-editing", "theme-customization"],
      relatedBuildings: ["frontend", "ui-component", "style-system"],
      continuityPhrases: ["다시", "이어서", "계속", "마저"]
    },
    
    // 백엔드 작업 패턴
    BACKEND_WORK: {
      keywords: ["API", "데이터베이스", "서버", "인증", "쿼리"],
      contexts: ["api-development", "database-design", "auth-setup"],
      relatedBuildings: ["api-gateway", "database", "auth-center"]
    },
    
    // 에러 수정 패턴
    ERROR_FIXING: {
      keywords: ["에러", "버그", "고치다", "수정", "해결"],
      contexts: ["debugging", "error-handling", "bug-fix"],
      continuityPhrases: ["아직", "여전히", "또", "계속"]
    }
  };
  
  // 작업 연속성 감지
  detectWorkContinuity(currentMessage, history) {
    // "다시 디자인 작업 하자" 같은 패턴 감지
    const continuitySignals = {
      explicitContinuation: this.checkContinuityPhrases(currentMessage),
      implicitContext: this.checkImplicitContinuation(currentMessage, history),
      timeGap: this.analyzeTimeGap(history),
      unfinishedWork: this.findUnfinishedTasks(history)
    };
    
    return {
      isContinuation: this.calculateContinuityScore(continuitySignals) > 0.7,
      previousSession: this.findPreviousWorkSession(continuitySignals),
      context: continuitySignals
    };
  }
}
```

#### 7.2.3 시간적 맥락 분석

```javascript
class TemporalContextAnalyzer {
  // 작업 세션 추적
  findWorkSessions(history, workType) {
    const sessions = [];
    let currentSession = null;
    
    for (const entry of history) {
      if (this.matchesWorkType(entry, workType)) {
        if (!currentSession || this.isNewSession(currentSession, entry)) {
          // 새 세션 시작
          currentSession = {
            id: generateId(),
            type: workType,
            start: entry.timestamp,
            entries: [entry],
            summary: {}
          };
          sessions.push(currentSession);
        } else {
          // 기존 세션에 추가
          currentSession.entries.push(entry);
          currentSession.end = entry.timestamp;
        }
      }
    }
    
    return sessions.map(s => this.summarizeSession(s));
  }
  
  // 중단된 작업 찾기
  findInterruptedWork(history) {
    const interrupted = [];
    
    for (let i = 0; i < history.length - 1; i++) {
      const current = history[i];
      const next = history[i + 1];
      
      // 작업 타입이 갑자기 바뀐 경우
      if (this.isWorkTypeChange(current, next)) {
        // 미완성 신호 확인
        if (this.hasUnfinishedSignals(current)) {
          interrupted.push({
            session: current,
            interruptedAt: current.timestamp,
            resumedAt: this.findResumption(history, i, current.workType)
          });
        }
      }
    }
    
    return interrupted;
  }
}
```

### 7.3 컨텍스트 압축 및 요약

```javascript
class ContextCompressor {
  // 긴 히스토리를 AI가 이해할 수 있는 크기로 압축
  compressHistory(fullHistory, currentContext) {
    return {
      // 1. 핵심 사실 (항상 포함)
      coreFacts: {
        projectType: fullHistory.project.type,
        mainFeatures: fullHistory.project.features,
        techStack: fullHistory.project.techStack,
        constraints: fullHistory.project.constraints
      },
      
      // 2. 관련 히스토리 (현재 작업과 관련된 것만)
      relevantHistory: this.selectRelevantHistory(fullHistory, currentContext),
      
      // 3. 중요 결정사항 (번복하면 안 되는 것들)
      criticalDecisions: fullHistory.milestones
        .filter(m => m.importance === 'critical')
        .map(m => ({
          decision: m.decision,
          reason: m.reason,
          mustMaintain: true
        })),
      
      // 4. 최근 컨텍스트 (최근 5개 대화)
      recentContext: fullHistory.conversations
        .slice(-5)
        .map(c => this.summarizeConversation(c)),
      
      // 5. 현재 작업 컨텍스트
      currentWork: {
        building: currentContext.selectedBuilding,
        task: currentContext.currentTask,
        previousAttempts: currentContext.attempts
      }
    };
  }
  
  // 대화 요약
  summarizeConversation(conversation) {
    return {
      id: conversation.id,
      summary: `${conversation.context.userMessage} → ${conversation.outcome}`,
      codeChanges: conversation.codeGenerated ? conversation.files : [],
      impact: conversation.impact
    };
  }
}
```

### 7.4 실시간 컨텍스트 업데이트

```javascript
class LiveContextManager {
  constructor(projectId) {
    this.projectId = projectId;
    this.activeContext = {
      shortTerm: new Map(),  // 현재 세션
      mediumTerm: new Map(), // 최근 1시간
      longTerm: new Map()    // 전체 프로젝트
    };
  }
  
  // 모든 상호작용 추적
  trackInteraction(event) {
    const interaction = {
      type: event.type,
      timestamp: Date.now(),
      data: event.data,
      impact: this.assessImpact(event)
    };
    
    // 단기 메모리 업데이트
    this.activeContext.shortTerm.set(event.id, interaction);
    
    // 중요도에 따라 장기 메모리로 승격
    if (interaction.impact.score > 0.7) {
      this.promoteToLongTerm(interaction);
    }
  }
  
  // AI 호출 시 컨텍스트 준비
  prepareAIContext(userMessage) {
    const compressed = new ContextCompressor().compressHistory(
      this.getFullHistory(),
      this.getCurrentContext()
    );
    
    return {
      // 압축된 히스토리
      history: compressed,
      
      // 현재 상태 스냅샷
      snapshot: {
        townState: this.getTownSnapshot(),
        selectedObject: this.getSelectedObject(),
        recentErrors: this.getRecentErrors()
      },
      
      // 관련 코드
      relatedCode: this.findRelatedCode(userMessage),
      
      // 이전 유사 대화
      similarConversations: this.findSimilarConversations(userMessage)
    };
  }
}
```

### 7.5 컨텍스트 일관성 검증

```javascript
class ContextConsistencyChecker {
  // AI 응답이 기존 컨텍스트와 충돌하지 않는지 검증
  validateResponse(aiResponse, projectContext) {
    const violations = [];
    
    // 1. 기술 스택 일관성
    if (aiResponse.suggestedTech) {
      const conflicts = this.checkTechConflicts(
        aiResponse.suggestedTech,
        projectContext.techStack
      );
      violations.push(...conflicts);
    }
    
    // 2. 비즈니스 규칙 위반
    if (aiResponse.businessLogic) {
      const ruleViolations = this.checkBusinessRules(
        aiResponse.businessLogic,
        projectContext.businessRules
      );
      violations.push(...ruleViolations);
    }
    
    // 3. 이전 결정사항과 충돌
    const decisionConflicts = this.checkDecisionConflicts(
      aiResponse,
      projectContext.criticalDecisions
    );
    violations.push(...decisionConflicts);
    
    return {
      isValid: violations.length === 0,
      violations,
      suggestions: this.generateFixSuggestions(violations)
    };
  }
}
```

### 7.6 히스토리 기반 자동 제안

```javascript
class HistoryBasedSuggestions {
  // 사용자가 입력하기 전에 다음 가능한 작업 제안
  suggestNextActions(currentState, history) {
    const suggestions = [];
    
    // 1. 패턴 기반 제안
    const patterns = this.detectPatterns(history);
    if (patterns.includes('auth-then-profile')) {
      if (currentState.hasAuth && !currentState.hasProfile) {
        suggestions.push({
          action: "프로필 페이지를 만들까요?",
          reason: "인증 후 보통 프로필 기능을 추가합니다"
        });
      }
    }
    
    // 2. 미완성 작업 제안
    const incomplete = this.findIncompleteWork(history);
    suggestions.push(...incomplete.map(work => ({
      action: `${work.building}의 ${work.feature} 완성하기`,
      reason: "이전에 시작했던 작업입니다"
    })));
    
    // 3. 다음 논리적 단계
    const nextSteps = this.inferNextSteps(currentState, history);
    suggestions.push(...nextSteps);
    
    return suggestions;
  }
}
```

---

## 8. AI 사용성 향상 시스템

### 8.1 의도 예측 및 자동 완성 시스템

```javascript
class IntentPredictionSystem {
  constructor() {
    // 실시간 타이핑 분석
    this.typingAnalyzer = {
      // 타이핑 중 의도 예측
      analyzePartialInput: (text) => {
        const predictions = {
          "로그인 폼": [
            "로그인 폼 만들어줘",
            "로그인 폼에 소셜 로그인 추가",
            "로그인 폼 디자인 개선"
          ],
          "에러": [
            "에러 해결해줘",
            "에러 메시지 설명해줘",
            "에러 처리 로직 추가"
          ],
          "성능": [
            "성능 최적화 해줘",
            "성능 측정 도구 추가",
            "성능 병목 지점 찾아줘"
          ]
        };
        
        return this.rankPredictions(text, predictions);
      },
      
      // 다음 작업 예측
      predictNextAction: (currentState) => {
        if (currentState.justAddedAuth) {
          return ["프로필 페이지 만들기", "권한 관리 추가", "로그아웃 기능"];
        }
        if (currentState.hasErrors) {
          return ["에러 수정", "로그 추가", "테스트 작성"];
        }
      }
    };
  }
  
  // 스마트 제안
  generateSmartSuggestions(context) {
    return {
      // 즉각적인 액션
      quickActions: [
        { icon: "🔧", text: "이 건물 수정", shortcut: "Cmd+E" },
        { icon: "🐛", text: "디버그 모드", shortcut: "Cmd+D" },
        { icon: "🎨", text: "디자인 개선", shortcut: "Cmd+S" }
      ],
      
      // 컨텍스트 기반 제안
      contextual: this.getContextualSuggestions(context),
      
      // 자주 사용하는 명령어
      frequent: this.getFrequentCommands(context.userId)
    };
  }
}
```

### 8.2 자동 컨텍스트 수집기

```javascript
class AutoContextCollector {
  // 사용자가 명시적으로 말하지 않아도 필요한 정보 자동 수집
  
  collectImplicitContext() {
    return {
      // 브라우저 정보
      environment: {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      
      // 성능 지표
      performance: {
        buildTime: this.getLastBuildTime(),
        errorRate: this.getCurrentErrorRate(),
        activeUsers: this.getActiveUserCount(),
        bottlenecks: this.detectBottlenecks()
      },
      
      // 작업 패턴
      workPatterns: {
        currentPhase: this.detectProjectPhase(), // "초기개발", "최적화", "유지보수"
        focusArea: this.detectFocusArea(),       // "프론트엔드", "백엔드", "인프라"
        urgency: this.detectUrgency()            // 긴급도 자동 감지
      },
      
      // 외부 상태
      external: {
        githubStatus: this.checkGithubStatus(),
        vercelStatus: this.checkVercelStatus(),
        apiHealth: this.checkAPIHealth()
      }
    };
  }
  
  // 스마트 컨텍스트 요약
  generateContextSummary() {
    const context = this.collectImplicitContext();
    
    return {
      alerts: [
        context.performance.errorRate > 0.05 && "높은 에러율 감지",
        context.external.vercelStatus !== 'ok' && "Vercel 배포 문제",
        context.workPatterns.urgency === 'high' && "긴급 상황 감지"
      ].filter(Boolean),
      
      recommendations: this.generateRecommendations(context)
    };
  }
}
```

### 8.3 AI 응답 A/B 테스팅 시스템

```javascript
class AIResponseOptimizer {
  // 여러 AI 응답 전략을 테스트하고 최적화
  
  constructor() {
    this.strategies = {
      // 응답 스타일 변형
      responseStyles: {
        concise: { tokenLimit: 500, style: "brief" },
        detailed: { tokenLimit: 1500, style: "comprehensive" },
        stepByStep: { tokenLimit: 1000, style: "tutorial" }
      },
      
      // 코드 생성 전략
      codeStrategies: {
        minimal: "최소한의 작동 코드",
        robust: "에러 처리 포함된 안전한 코드",
        optimized: "성능 최적화된 코드"
      }
    };
  }
  
  async generateOptimalResponse(message, context) {
    // 사용자 선호도 기반 전략 선택
    const userPreference = await this.getUserPreference(context.userId);
    
    // 상황에 맞는 최적 전략 선택
    const optimalStrategy = this.selectStrategy({
      message,
      context,
      userPreference,
      taskComplexity: this.assessComplexity(message)
    });
    
    // 응답 생성
    const response = await this.generateWithStrategy(optimalStrategy);
    
    // 피드백 수집 (암묵적)
    this.collectImplicitFeedback(response, context);
    
    return response;
  }
}
```

### 8.4 프로액티브 도우미 시스템

```javascript
class ProactiveAssistant {
  // 사용자가 요청하기 전에 먼저 도움 제공
  
  monitorUserActivity() {
    return {
      // 막힌 상황 감지
      stuckDetection: {
        noProgressDuration: this.detectNoProgress(),
        repeatedErrors: this.detectRepeatedErrors(),
        undoFrequency: this.detectFrequentUndo()
      },
      
      // 기회 감지
      opportunityDetection: {
        optimizationChances: this.findOptimizations(),
        securityIssues: this.findSecurityProblems(),
        codeSmells: this.detectCodeSmells()
      }
    };
  }
  
  // 프로액티브 제안 생성
  async generateProactiveSuggestions() {
    const monitoring = this.monitorUserActivity();
    const suggestions = [];
    
    // 막힌 상황 도움
    if (monitoring.stuckDetection.noProgressDuration > 300000) { // 5분
      suggestions.push({
        type: 'help',
        message: "도움이 필요하신가요? 현재 작업에 대한 가이드를 제공할 수 있습니다.",
        actions: ["가이드 보기", "예시 코드 보기", "비슷한 프로젝트 찾기"]
      });
    }
    
    // 최적화 기회
    if (monitoring.opportunityDetection.optimizationChances.length > 0) {
      suggestions.push({
        type: 'optimization',
        message: "성능을 개선할 수 있는 부분을 발견했습니다.",
        actions: ["최적화 제안 보기", "자동 최적화", "나중에"]
      });
    }
    
    return suggestions;
  }
}
```

### 8.5 AI 단축키 및 매크로 시스템

```javascript
class AIShortcutSystem {
  constructor() {
    this.shortcuts = {
      // 빠른 명령어
      quickCommands: {
        "/fix": "선택한 코드의 에러 수정",
        "/explain": "선택한 코드 설명",
        "/optimize": "선택한 코드 최적화",
        "/test": "테스트 코드 생성",
        "/doc": "문서화 추가"
      },
      
      // 매크로 (여러 작업 한번에)
      macros: {
        "/crud": "CRUD API 전체 생성",
        "/auth-flow": "인증 플로우 전체 구현",
        "/responsive": "반응형 디자인 적용"
      },
      
      // 템플릿 명령어
      templates: {
        "/component [name]": "React 컴포넌트 생성",
        "/api [endpoint]": "API 엔드포인트 생성",
        "/page [route]": "페이지 생성"
      }
    };
  }
  
  // 자연어를 단축키로 변환
  detectShortcutIntent(message) {
    const patterns = {
      "이거 고쳐줘": "/fix",
      "이게 뭐야": "/explain",
      "더 빠르게": "/optimize",
      "테스트 만들어": "/test"
    };
    
    for (const [pattern, shortcut] of Object.entries(patterns)) {
      if (message.includes(pattern)) {
        return {
          detected: true,
          shortcut,
          suggestion: `💡 팁: '${shortcut}'를 사용하면 더 빠르게 작업할 수 있어요!`
        };
      }
    }
  }
}
```

### 8.6 실시간 AI 피드백 시스템

```javascript
class RealTimeFeedback {
  // AI가 작업하는 동안 실시간 진행상황 제공
  
  streamProgress(taskId) {
    return {
      // 단계별 진행 상황
      stages: [
        { name: "요구사항 분석", status: "complete", duration: "0.5s" },
        { name: "코드 생성", status: "in-progress", progress: 45 },
        { name: "검증", status: "pending" },
        { name: "최적화", status: "pending" }
      ],
      
      // 실시간 프리뷰
      preview: {
        code: this.streamCodePreview(),
        visual: this.streamVisualPreview()
      },
      
      // 중간 설명
      explanations: [
        "Next.js 14의 App Router를 사용하여 구현 중...",
        "TypeScript 타입 안전성 확보 중...",
        "접근성 표준 WCAG 2.1 AA 준수 확인 중..."
      ]
    };
  }
}
```

### 8.7 스마트 에러 예방 시스템

```javascript
class ErrorPreventionSystem {
  // 에러가 발생하기 전에 미리 경고
  
  analyzeCodeInRealTime(code) {
    return {
      // 잠재적 문제 감지
      potentialIssues: [
        {
          type: "null-reference",
          line: 45,
          suggestion: "옵셔널 체이닝 사용 권장",
          autoFix: true
        },
        {
          type: "infinite-loop-risk",
          line: 78,
          suggestion: "종료 조건 확인 필요",
          severity: "high"
        }
      ],
      
      // 호환성 체크
      compatibility: {
        browsers: this.checkBrowserCompat(code),
        devices: this.checkDeviceCompat(code),
        frameworks: this.checkFrameworkCompat(code)
      },
      
      // 성능 예측
      performanceImpact: {
        bundleSize: "+2.3KB",
        loadTime: "+50ms",
        suggestion: "동적 임포트 사용 고려"
      }
    };
  }
}
```

---

## 9. 데이터 구조 설계

### 9.1 데이터베이스 스키마

#### 9.1.1 핵심 엔티티

**User**
```sql
id              UUID PRIMARY KEY
githubId        VARCHAR UNIQUE NOT NULL
username        VARCHAR NOT NULL
email           VARCHAR NOT NULL
avatar          VARCHAR
level           INTEGER DEFAULT 1
experience      INTEGER DEFAULT 0
points          INTEGER DEFAULT 0
subscription    ENUM('free','maker','startup','growth','enterprise')
settings        JSONB
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
lastActiveAt    TIMESTAMP
```

**Project**
```sql
id              UUID PRIMARY KEY
userId          UUID REFERENCES users(id)
name            VARCHAR NOT NULL
description     TEXT
githubRepo      VARCHAR
vercelUrl       VARCHAR
isPublic        BOOLEAN DEFAULT false
isTemplate      BOOLEAN DEFAULT false
townData        JSONB NOT NULL
boundaryData    JSONB -- 자연 경계 설정
externalPorts   JSONB -- 공항/항구/역/다리 데이터
metadata        JSONB
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

**Building**
```sql
id              UUID PRIMARY KEY
projectId       UUID REFERENCES projects(id)
type            VARCHAR NOT NULL
name            VARCHAR NOT NULL
position        JSONB -- {x, y}
size            JSONB -- {width, height}
config          JSONB
status          ENUM('healthy','warning','error','building')
internalSpace   JSONB -- 내부 구조 데이터
version         INTEGER DEFAULT 1 -- 버전 관리
isAIBuilding    BOOLEAN DEFAULT false -- AI 구역 건물 여부
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

**Connection**
```sql
id              UUID PRIMARY KEY
projectId       UUID REFERENCES projects(id)
fromBuildingId  UUID REFERENCES buildings(id)
toBuildingId    UUID REFERENCES buildings(id)
type            ENUM('road','water','sewer','power','communication')
path            JSONB -- 경로 좌표 배열
config          JSONB
flowData        JSONB -- 실시간 흐름 데이터
createdAt       TIMESTAMP
```

**Complex**
```sql
id              UUID PRIMARY KEY
projectId       UUID REFERENCES projects(id)
name            VARCHAR NOT NULL
type            VARCHAR
boundary        JSONB -- 담장 좌표
entrance        JSONB -- 정문 위치
buildings       UUID[] -- 포함된 건물 ID 배열
internalRoads   JSONB -- 내부 도로망
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

#### 9.1.2 히스토리 관련 테이블

**ProjectHistory**
```sql
id              UUID PRIMARY KEY
projectId       UUID REFERENCES projects(id)
userId          UUID REFERENCES users(id)
eventType       VARCHAR(50)
eventData       JSONB
createdAt       TIMESTAMP

-- 인덱스
CREATE INDEX idx_project_history_project_time ON project_history(project_id, created_at DESC);
CREATE INDEX idx_project_history_user_project ON project_history(user_id, project_id);
CREATE INDEX idx_project_history_event_type ON project_history(event_type, project_id);
```

**ConversationHistory**
```sql
id              UUID PRIMARY KEY
projectId       UUID
userMessage     TEXT
aiResponse      TEXT
contextSnapshot JSONB  -- 당시 타운 상태
codeGenerated   JSONB  -- 생성된 코드
satisfaction    VARCHAR(20)
createdAt       TIMESTAMP
```

**BuildingVersion**
```sql
id              UUID PRIMARY KEY
buildingId      UUID REFERENCES buildings(id)
version         INTEGER NOT NULL
config          JSONB
code            TEXT
performance     JSONB -- 성능 메트릭
createdAt       TIMESTAMP
createdBy       VARCHAR -- 'user' or 'ai'
status          ENUM('active','backup','sandbox')
```

**AIInteraction**
```sql
id              UUID PRIMARY KEY
projectId       UUID REFERENCES projects(id)
aiZoneBuilding  VARCHAR -- AI 구역 내 건물 타입
interactionType ENUM('experiment','suggestion','learning')
inputData       JSONB
outputData      JSONB
confidence      FLOAT -- AI 확신도
userFeedback    VARCHAR -- positive/negative/neutral
createdAt       TIMESTAMP
```

### 9.2 타운 데이터 구조

#### 9.2.1 확장된 Town JSON Schema
```json
{
  "version": "1.0",
  "grid": {
    "width": 100,
    "height": 100
  },
  "theme": "modern",
  "stage": 2, // 성장 단계
  
  "boundaries": {
    "north": {
      "type": "mountain",
      "height": 3, // 보안 레벨
      "features": ["firewall", "ids"]
    },
    "south": {
      "type": "ocean",
      "waveIntensity": 2, // 트래픽 레벨
      "features": ["lighthouse", "port"]
    },
    "east": {
      "type": "forest", 
      "density": 5, // 데이터 볼륨
      "features": ["dataLake", "backup"]
    },
    "west": {
      "type": "desert",
      "expansion": true,
      "features": ["sandbox"]
    }
  },
  
  "externalConnections": {
    "airport": {
      "position": {"x": 10, "y": 10},
      "traffic": {
        "countries": ["US", "KR", "JP"],
        "volume": 1250
      }
    },
    "seaport": {
      "position": {"x": 50, "y": 95},
      "cargo": {
        "incoming": 500,
        "outgoing": 300
      }
    },
    "trainStation": {
      "position": {"x": 90, "y": 50},
      "schedule": {
        "peak": ["09:00", "18:00"],
        "passengers": 5000
      }
    },
    "bridges": [
      {
        "id": "bridge_01",
        "position": {"x": 30, "y": 0},
        "connection": "payment-service",
        "bandwidth": "high"
      }
    ]
  },
  
  "buildings": [...],
  "connections": [...],
  "complexes": [...],
  
  "environment": {
    "weather": "sunny",
    "time": "day",
    "season": "spring",
    "growthIndicators": {
      "greenery": 0.6,
      "infrastructure": 0.7,
      "activity": 0.8
    }
  }
}
```

### 9.3 실시간 상태 관리

#### 9.3.1 트래픽 플로우 데이터
```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "flows": {
    "roads": {
      "road_01": {
        "vehicles": 25,
        "speed": "normal",
        "congestion": 0.3
      }
    },
    "underground": {
      "water_01": {
        "flow": 100, // L/s
        "pressure": "normal"
      },
      "power_01": {
        "load": 75, // %
        "voltage": "stable"
      },
      "comm_01": {
        "bandwidth": 80, // %
        "latency": 12 // ms
      }
    }
  },
  "externalTraffic": {
    "airport": {
      "arrivals": 5,
      "departures": 3,
      "queue": 2
    },
    "bridges": {
      "bridge_01": {
        "inbound": 150,
        "outbound": 200
      }
    }
  }
}
```

---

## 10. UI/UX 상세 설계

### 10.1 디자인 시스템

#### 10.1.1 확장된 색상 팔레트
**Primary Colors**
- Primary: #3B82F6 (Blue)
- Secondary: #10B981 (Green)
- Accent: #F59E0B (Amber)

**연결 타입별 색상**
- Road: #6B7280 (Gray)
- Water: #3B82F6 (Blue)
- Sewer: #92400E (Brown)
- Power: #FCD34D (Yellow)
- Communication: #10B981 (Green)

**환경 색상**
- Mountain: #4B5563 (Cool Gray)
- Ocean: #1E40AF (Deep Blue)
- Forest: #065F46 (Deep Green)
- Desert: #F59E0B (Sand)

### 10.2 타운 에디터 UI

#### 10.2.1 도구 패널 확장
**모드 전환**
- 편집 모드 / 프리뷰 모드 토글
- 단축키: Tab

**건물 도구**
- 기본 건물 팔레트
- 검색/필터
- 최근 사용
- 즐겨찾기

**연결 도구**
- 도로 (기본 선택)
- 지하 인프라 토글
- 연결 타입 선택
- 자동 라우팅 옵션

**단지 도구**
- 담장 그리기
- 정문 배치
- 단지 템플릿
- 일괄 편집

**뷰 컨트롤**
- 줌 슬라이더
- 엑스레이 모드 토글
- 레이어 선택
- 미니맵

#### 10.2.2 컨텍스트 패널
**건물 선택 시**
- 건물 정보
- 설정 옵션
- 연결 상태
- AI 대화 버튼

**단지 선택 시**
- 단지 개요
- 포함 건물 목록
- 통합 설정
- 성능 메트릭

**외부 연결 선택 시**
- 트래픽 통계
- 연결 서비스
- 대역폭 설정
- 실시간 모니터링

### 10.3 게임화 UI 요소

#### 10.3.1 HUD (Heads-Up Display)
```
┌─────────────────────────────────────────────────┐
│ 👤 Lv.12 마스터 빌더 | 💎 2,450 | 🏆 24/50     │
├─────────────────────────────────────────────────┤
│ 📊 프로젝트 상태: 🟢 정상 | 👥 사용자: 1,234   │
└─────────────────────────────────────────────────┘
```

#### 10.3.2 진행 상황 표시
**타운 성장 인디케이터**
- 진행 바: 현재 단계 진행률
- 다음 단계까지 필요 건물 수
- 환경 개선도 게이지

### 10.5 호버 프리뷰 UI 디자인

#### 10.5.1 호버 팝업 디자인
```
┌─────────────────────────────────────┐
│ [아이콘] 데이터베이스                │
│ ─────────────────────────────────── │
│ 📊 테이블 (3)                       │
│   • users                           │
│   • products                        │
│   • orders                          │
│                                     │
│ 🔗 관계                             │
│   users → orders (1:N)              │
│   products → orders (N:N)           │
│                                     │
│ [+ 테이블 추가] [AI 대화]           │
└─────────────────────────────────────┘
```

#### 10.5.2 호버 상태 표시
- **일반 상태**: 반투명 백그라운드, 부드러운 그림자
- **편집 가능**: 테두리 하이라이트
- **AI 대화 중**: 펄스 애니메이션
- **변경 사항 있음**: 노란색 인디케이터

#### 10.5.3 인터랙션 디자인
- **표시 지연**: 500ms (빠른 마우스 이동 시 표시 안 함)
- **위치**: 건물 상단 우측 (화면 밖으로 나가지 않도록 자동 조정)
- **전환**: 페이드 인/아웃 애니메이션
- **크기**: 최대 400x600px, 내용에 따라 자동 조절

### 10.6 AI 구역 UI 디자인

#### 10.6.1 AI 구역 시각적 스타일
- **반투명 유리 효과**: 내부가 은은하게 비치는 미래적 디자인
- **부드러운 광원**: AI 활동에 따라 맥동하는 빛
- **플로팅 요소**: 생각 구름, 데이터 스트림 시각화
- **색상 테마**: 파란색-보라색 그라데이션

#### 10.6.2 AI 건물 인터랙션
```
┌─────────────────────────────────────┐
│ 🧠 AI 본부                          │
│ ─────────────────────────────────── │
│ 상태: 🟢 활성                       │
│ 처리 중: "로그인 폼 최적화"          │
│ 확신도: 92%                         │
│                                     │
│ [현재 사고 과정 보기] [대화하기]     │
└─────────────────────────────────────┘
```

### 10.8 공간 위치 UI 표시

#### 10.8.1 위치 정보 표시 규칙
- **모든 알림과 메시지에 위치 포함**:
  ```
  ❌ "Error: Database connection failed"
  ✅ "에러: 동쪽 데이터베이스 건물에서 연결 실패"
  
  ❌ "Building login component..."
  ✅ "북쪽 인증 구역에서 로그인 컴포넌트 구축 중..."
  ```

- **방향 색상 코딩**:
  - 북쪽 (보안): 파란색 계열
  - 동쪽 (데이터): 초록색 계열
  - 남쪽 (외부): 주황색 계열
  - 서쪽 (실험): 보라색 계열

#### 10.8.2 AI 사고 과정 UI
```
┌─────────────────────────────────────┐
│ 🧠 AI 생각 중...                    │
│ ─────────────────────────────────── │
│ 💭 요청 분석 중... (2초)            │
│ 🔍 라이브러리 검색 중... (1초)      │
│ ⚡ 코드 생성 중... (3초)            │
│                                     │
│ 확신도: ████████░░ 85%             │
│                                     │
│ [다른 옵션 보기] [직접 선택]        │
└─────────────────────────────────────┘
```

#### 10.8.3 다중 옵션 표시
- **AI가 여러 해결책 고민 시**:
  - 3개의 반투명 건물 미리보기 동시 표시
  - 각 옵션 위 말풍선으로 장단점 표시
  - 호버 시 해당 옵션 강조
  - 클릭으로 선택

---

## 11. 기술 아키텍처

### 11.1 시스템 아키텍처

#### 11.1.1 전체 구조
```
┌─────────────────┐     ┌─────────────────┐
│   클라이언트     │     │   외부 서비스    │
│  (Next.js SPA)  │────▶│  - GitHub API   │
└────────┬────────┘     │  - Qwen API     │
         │              │  - Vercel API   │
         ▼              └─────────────────┘
┌─────────────────┐     ┌─────────────────┐
│   API Gateway   │────▶│ Library Server  │
│  (Next.js API)  │     │(lib.irke.town) │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   비즈니스 로직  │────▶│   데이터 레이어  │
│   (Services)    │     │  - PostgreSQL   │
└─────────────────┘     │  - Redis        │
                        │  - S3           │
                        └─────────────────┘
```

### 11.2 통합 라이브러리 시스템 아키텍처

#### 11.2.1 시스템 구성
```javascript
const librarySystem = {
  // 프로토콜 핸들러 (6개 라이브러리)
  protocolHandlers: {
    'irke://business': businessLibraryHandler,
    'irke://stack': stackLibraryHandler,
    'irke://prompt': promptLibraryHandler,
    'irke://component': componentLibraryHandler,
    'irke://error': errorLibraryHandler,
    'irke://compliance': complianceLibraryHandler
  },
  
  // 계층적 캐시 구조
  cache: {
    hot: {  // 즉시 접근 (메모리)
      capacity: '1GB',
      items: ['frequently-used', 'current-context']
    },
    warm: { // 빠른 접근 (메모리/SSD)
      capacity: '5GB',
      items: ['recent-usage', 'related-context']
    },
    cold: { // 보관용 (디스크)
      capacity: 'unlimited',
      items: ['all-libraries', 'archived']
    }
  },
  
  // 통합 인덱스
  indices: {
    global: {},        // 전체 검색 인덱스
    byType: {},        // 라이브러리 타입별
    byContext: {},     // 프로젝트 컨텍스트별
    byRelation: {},    // 상호 참조 그래프
    byFrequency: {}    // 사용 빈도별
  }
}
```

#### 11.2.2 통합 쿼리 엔진
```javascript
async function crossLibraryQuery(userRequest, context) {
  // 1. 요청 분류 및 관련 라이브러리 식별
  const classification = await classifyRequest(userRequest);
  
  // 2. 병렬 검색 실행 (6개 라이브러리)
  const results = await Promise.all([
    queryBusinessLibrary(classification.business),
    queryStackLibrary(classification.technical),
    queryPromptLibrary(classification.implementation),
    queryComponentLibrary(classification.ui),
    queryErrorLibrary(classification.troubleshooting),
    queryComplianceLibrary(classification.regulatory)
  ]);
  
  // 3. 상호 참조 확인
  const enriched = await enrichWithCrossReferences(results);
  
  // 4. 통합 응답 생성
  return {
    code: determineResponseCode(enriched),
    primary: selectPrimaryResult(enriched),
    related: groupRelatedResults(enriched),
    risks: identifyRisks(enriched),
    recommendations: generateRecommendations(enriched)
  };
}
```

### 11.3 캔버스 렌더링 최적화

#### 11.3.1 렌더링 파이프라인
1. **Culling**: 화면 밖 객체 제외
2. **Batching**: 동일 타입 객체 일괄 렌더링
3. **Layering**: 정적/동적 레이어 분리
4. **Caching**: 정적 요소 캐시

#### 11.3.2 성능 목표
- 60 FPS @ 100 건물
- 30 FPS @ 500 건물
- 초기 로드 < 2초
- 인터랙션 지연 < 16ms

---

## 12. 관리자 시스템

### 12.1 MVP 관리자 기능

#### 12.1.1 기본 대시보드
```javascript
const adminDashboard = {
  // 핵심 지표
  metrics: {
    realtime: {
      activeUsers: "현재 접속자 수",
      activeTowns: "활성 타운 수",
      apiCalls: "분당 API 호출 수"
    },
    daily: {
      newUsers: "신규 가입자",
      townsCreated: "생성된 타운",
      deploymentsCount: "배포 횟수",
      totalCost: "일일 API 비용"
    }
  },
  
  // 서버 상태
  serverStatus: {
    health: "정상/경고/오류",
    cpu: "CPU 사용률",
    memory: "메모리 사용률",
    apiLatency: "API 응답 시간"
  }
}
```

#### 12.1.2 사용자 관리
- **사용자 목록**
  - 검색: 이메일, 사용자명, GitHub ID
  - 필터: 가입일, 활성 상태, 플랜
  - 정렬: 사용량, 타운 수, 최근 활동

- **계정 관리**
  - 계정 정지/복구 (사유 기록)
  - API 사용량 제한 설정
  - 개별 사용자 알림 발송

#### 12.1.3 긴급 대응 시스템
```javascript
const emergencyControls = {
  // 서비스 제어
  serviceToggle: {
    entireService: "전체 서비스 on/off",
    aiGeneration: "AI 코드 생성 on/off",
    deployments: "배포 기능 on/off"
  },
  
  // API 제한
  rateLimits: {
    global: "전체 API 호출 제한",
    perUser: "사용자별 제한",
    aiSpecific: "AI API 특별 제한"
  },
  
  // 긴급 공지
  announcement: {
    types: ["maintenance", "incident", "update"],
    channels: ["banner", "popup", "email"],
    priority: ["low", "medium", "high", "critical"]
  }
}
```

#### 12.1.4 기본 모니터링
- **에러 로그**
  - 실시간 에러 스트림
  - 에러 타입별 분류
  - 영향받은 사용자 수
  - 스택 트레이스

- **API 모니터링**
  - Qwen API 상태 및 응답 시간
  - GitHub API 할당량 잔여
  - Vercel API 상태
  - 장애 자동 감지 및 알림

#### 12.1.5 지원 시스템
- **문의 관리**
  - 이메일 문의 목록
  - 우선순위 설정
  - 답변 템플릿
  - 처리 상태 추적

- **FAQ 관리**
  - 카테고리별 FAQ 작성/수정
  - 자주 묻는 질문 자동 추천
  - 다국어 지원 (영어/한국어)

### 12.2 관리자 권한 체계

#### 12.2.1 권한 레벨
```javascript
const adminRoles = {
  SUPER_ADMIN: {
    permissions: ["*"], // 모든 권한
    description: "시스템 전체 관리"
  },
  
  ADMIN: {
    permissions: [
      "user.manage",
      "content.moderate",
      "support.handle",
      "announcement.create"
    ],
    description: "일반 운영 관리"
  },
  
  SUPPORT: {
    permissions: [
      "support.view",
      "support.respond",
      "user.view"
    ],
    description: "고객 지원 담당"
  },
  
  MONITOR: {
    permissions: [
      "dashboard.view",
      "logs.view",
      "metrics.view"
    ],
    description: "모니터링 전용"
  }
}
```

#### 12.2.2 접근 제어
- IP 화이트리스트
- 2FA 필수
- 세션 타임아웃 (30분)
- 모든 관리 활동 로깅

---

## 13. 보안 및 권한 관리

### 12.1 프로젝트 격리

#### 12.1.1 타운 경계의 보안 의미
- **북쪽 산맥**: 방화벽 규칙 시각화
- **폐쇄형 구조**: 프로젝트 간 완전 격리
- **외부 연결점**: 명시적 API 엔드포인트

#### 12.1.2 멀티테넌시
- 프로젝트별 독립 환경
- 리소스 격리
- 데이터 분리
- 권한 상속 차단

### 12.2 AI 보안

#### 12.2.1 프롬프트 보안
- 인젝션 방지 필터
- 컨텍스트 검증
- 출력 샌드박싱
- 레이트 리미팅

#### 12.2.2 코드 생성 보안
- 정적 분석 도구 통합
- 취약점 자동 스캔
- 의존성 검사
- 코드 서명

---

## 13. 보안 및 권한 관리

### 13.1 프로젝트 격리

#### 13.1.1 타운 경계의 보안 의미
- **북쪽 산맥**: 방화벽 규칙 시각화
- **폐쇄형 구조**: 프로젝트 간 완전 격리
- **외부 연결점**: 명시적 API 엔드포인트

#### 13.1.2 멀티테넌시
- 프로젝트별 독립 환경
- 리소스 격리
- 데이터 분리
- 권한 상속 차단

### 13.2 AI 보안

#### 13.2.1 프롬프트 보안
- 인젝션 방지 필터
- 컨텍스트 검증
- 출력 샌드박싱
- 레이트 리미팅

#### 13.2.2 코드 생성 보안
- 정적 분석 도구 통합
- 취약점 자동 스캔
- 의존성 검사
- 코드 서명

---

## 14. 성능 및 확장성

### 13.1 타운 크기별 성능 전략

#### 13.1.1 성능 티어
**Small (< 50 건물)**
- 클라이언트 렌더링
- 로컬 상태 관리
- 기본 최적화

**Medium (50-200 건물)**
- 가상화 도입
- 청크 로딩
- 워커 스레드 활용

**Large (200+ 건물)**
- 서버 사이드 렌더링
- 스트리밍 업데이트
- 분산 상태 관리

### 13.2 글로벌 확장

#### 13.2.1 엣지 배포
- 라이브러리 서버: 글로벌 엣지
- 정적 에셋: CDN
- API: 지역별 엔드포인트

#### 13.2.2 다국어 지원
- 기본: 영어
- 1차: 한국어, 일본어, 중국어
- UI 텍스트 번역
- 문서 현지화

---

## 14. 성능 및 확장성

### 14.1 타운 크기별 성능 전략

#### 14.1.1 성능 티어
**Small (< 50 건물)**
- 클라이언트 렌더링
- 로컬 상태 관리
- 기본 최적화

**Medium (50-200 건물)**
- 가상화 도입
- 청크 로딩
- 워커 스레드 활용

**Large (200+ 건물)**
- 서버 사이드 렌더링
- 스트리밍 업데이트
- 분산 상태 관리

### 14.2 글로벌 확장

#### 14.2.1 엣지 배포
- 라이브러리 서버: 글로벌 엣지
- 정적 에셋: CDN
- API: 지역별 엔드포인트

#### 14.2.2 다국어 지원
- 기본: 영어
- 1차: 한국어, 일본어, 중국어
- UI 텍스트 번역
- 문서 현지화

---

## 부록: MVP 우선순위

### MVP 포함 (2개월 개발 + 1개월 안정화)

#### Phase 1: 핵심 뼈대 (1개월)
1. **기본 타운 시스템**
   - 아이소메트릭 캔버스 (50개 건물 한계)
   - 기본 건물 3종 (API, Database, Frontend)
   - 도로 연결만 (지하 인프라 제외)
   - 건물 배치/이동/삭제

2. **단순 AI 코드 생성**
   - Qwen 2.5-Coder 통합
   - 기본 프롬프트 템플릿
   - 1개 라이브러리 (Stack Library)만
   - 텍스트 기반 AI 대화

3. **GitHub 기본 통합**
   - OAuth 로그인
   - 레포 생성
   - 코드 푸시

#### Phase 2: 필수 기능 (1개월)
1. **인터랙티브 프리뷰**
   - 건물 호버 시 정보 표시
   - 클릭으로 설정 변경
   - 인플레이스 편집

2. **AI 기본 구역**
   - AI 본부 건물 1개
   - 처리 상태 표시
   - 에러 시각화 (연기 효과)

3. **Vercel 배포**
   - 원클릭 배포
   - 상태 모니터링

#### Phase 3: 안정화 (1개월)
1. **버그 수정 및 성능 최적화**
2. **기본 관리자 대시보드**
3. **핵심 지표 모니터링**
4. **이메일 지원**

---

### v2.0 단계별 개발 계획 (MVP 이후 6개월)

#### 🏗️ v2.1: 확장 가능한 아키텍처 (1개월)
**목표**: MVP의 한계를 극복할 수 있는 확장 가능한 기반 구축

1. **성능 최적화 시스템**
   - WebGL 기반 렌더링 엔진 전환
   - 가상화로 200+ 건물 지원
   - LOD (Level of Detail) 시스템
   - 청크 기반 로딩

2. **플러그인 아키텍처**
   - 건물 타입 플러그인 시스템
   - 연결 타입 확장 인터페이스
   - 커스텀 AI 프롬프트 플러그인
   - 테마 시스템 기반

3. **데이터 레이어 강화**
   - 이벤트 소싱 패턴 도입
   - 실시간 동기화 인프라
   - 히스토리 압축 시스템
   - 캐싱 전략 고도화

**핵심**: 이후 모든 기능이 플러그인으로 추가 가능한 구조

---

#### 🤝 v2.2: 실시간 협업 (1.5개월)
**목표**: 여러 사용자가 동시에 타운 편집

1. **협업 인프라**
   - WebSocket 기반 실시간 동기화
   - Operational Transform 충돌 해결
   - 커서 및 선택 영역 공유
   - 존재감 표시 (아바타)

2. **권한 시스템**
   - 역할 기반 접근 제어
   - 구역별 권한 설정
   - 초대 및 공유 시스템
   - 변경 이력 추적

3. **커뮤니케이션**
   - 인앱 채팅
   - 음성 메모
   - 화면 포인팅
   - 변경사항 알림

**핵심**: MVP 구조를 변경하지 않고 레이어로 추가

---

#### 🧠 v2.3: AI 시스템 고도화 (1.5개월)
**목표**: 6개 라이브러리 시스템 완성 및 고급 AI 기능

1. **통합 라이브러리 시스템**
   - 6개 라이브러리 전체 구현
   - 크로스 라이브러리 검색
   - 동적 라이브러리 업데이트
   - 커뮤니티 기여 시스템

2. **AI 구역 완성**
   - 모든 AI 건물 구현
   - 샌드박스 통합
   - 건물 핫스왑 시스템
   - AI 협업자 모드

3. **고급 AI 기능**
   - 의도 예측 시스템
   - 프로액티브 제안
   - A/B 테스트 자동화
   - 학습 기반 개선

**핵심**: MVP의 단순 AI를 점진적으로 교체

---

#### 🏗️ v2.4: 고급 타운 기능 (1개월)
**목표**: 복잡한 프로젝트 지원을 위한 고급 기능

1. **다층 인프라**
   - 지하 인프라 전체 구현
   - 엑스레이 모드
   - 복합 단지 시스템
   - 고급 연결 타입

2. **타운 환경 시스템**
   - 타운 성장 단계
   - 환경 변화 (날씨, 시간)
   - 외부 연결 인프라 완성
   - 경계 시스템 고도화

3. **Import/Export 완성**
   - 다양한 프레임워크 지원
   - 프로젝트 구조 분석 AI
   - 양방향 동기화
   - 템플릿 마켓

**핵심**: MVP 타운을 더 풍부하게, 구조 변경 없이

---

#### 🌐 v2.5: 타운 네트워크 (1개월)
**목표**: 타운 간 연결 및 메타버스 기반

1. **타운 간 이동**
   - 포털 시스템
   - 타운 검색 및 탐험
   - 공개/비공개 설정
   - 타운 평점 시스템

2. **서비스 상호작용**
   - 타운 내 실제 서비스 이용
   - API 마켓플레이스
   - 데이터 거래
   - 크로스 타운 통합

3. **경제 시스템**
   - 타운 방문자 수익
   - 거래 수수료
   - 프리미엄 위치
   - 가상 화폐 (선택적)

**핵심**: 독립된 타운들을 네트워크로 연결

---

#### 🎨 v2.6: 마켓플레이스 (1개월)
**목표**: 수익화 및 생태계 확장

1. **그래픽 에셋 마켓**
   - 건물 스킨
   - 환경 요소
   - 특수 효과
   - 타운 테마

2. **기능 마켓**
   - 건물 플러그인
   - AI 프롬프트 팩
   - 자동화 스크립트
   - 커스텀 연결 타입

3. **크리에이터 생태계**
   - 크리에이터 등록
   - 수익 분배 시스템
   - 품질 관리
   - 커뮤니티 큐레이션

**핵심**: 플러그인 아키텍처 위에 마켓 구축

---

### 🔑 핵심 원칙

1. **뼈대의 불변성**
   - MVP에서 만든 핵심 구조는 절대 변경하지 않음
   - 모든 v2 기능은 추가 레이어로만 구현
   - 하위 호환성 100% 보장

2. **점진적 확장**
   - 각 버전은 독립적으로 작동
   - 이전 버전 사용자도 계속 사용 가능
   - 기능 플래그로 점진적 활성화

3. **플러그인 우선**
   - v2.1에서 구축한 플러그인 시스템 활용
   - 핵심 엔진 수정 최소화
   - 커뮤니티 확장 가능

4. **성능 우선**
   - 각 단계에서 성능 테스트
   - 성능 저하 시 기능 롤백
   - 점진적 최적화

---

### 📊 리소스 계획

**MVP (3개월)**
- 개발자 2명
- 디자이너 1명 (파트타임)
- PM 1명

**v2.0 (6개월)**
- 개발자 4-6명
- 디자이너 2명
- DevOps 1명
- PM 1명
- 커뮤니티 매니저 1명

---

### 💰 수익화 전략

**MVP**: 무료 (베타)

**v2.2**: Freemium 시작
- Free: 1개 타운, 50개 건물
- Pro ($29/월): 5개 타운, 200개 건물
- Team ($99/월): 무제한, 협업 기능

**v2.5**: 거래 수수료
- 타운 간 거래의 5%
- API 마켓 수수료 20%

**v2.6**: 마켓플레이스
- 에셋 판매 수수료 30%
- 프리미엄 에셋 구독

---

*이 기획서는 IRKE TOWN의 완전한 구현 가이드입니다. 특히 AI 시스템이 대폭 강화되어 사용자의 의도를 정확히 파악하고, 프로젝트의 전체 맥락을 완벽하게 이해하며, 프로액티브하게 도움을 제공할 수 있도록 설계되었습니다.*