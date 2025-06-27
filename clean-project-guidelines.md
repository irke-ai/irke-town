# Claude Code 클린 프로젝트 개발 가이드라인

## 🌳 Git 브랜치 전략

### 브랜치 구조
```
main (운영)
  └── dev (Phase 통합)
       └── fix/phase7-sprint1 (Sprint 개발)
       └── fix/phase7-sprint2
       └── fix/phase7-sprint3
       └── ...
```

### 브랜치 운영 규칙
1. **main**: 완성된 프로덕션 코드 (모든 Phase 완료)
2. **dev**: Phase 단위 통합 브랜치 (Phase 완료 시 병합)
3. **fix/phaseX-sprintY**: Sprint 단위 개발 브랜치

### 워크플로우
```bash
# 1. Sprint 시작
git checkout dev
git pull origin dev
git checkout -b fix/phase7-sprint1

# 2. Sprint 개발 진행
# ... 개발 작업 ...

# 3. Sprint 완료
git add .
git commit -m "feat(phase7-sprint1): WebSocket 인프라 구축 완료"
git push origin fix/phase7-sprint1

# 4. 테스트 및 검증
npm run test
npm run build
npm run lint

# 5. Sprint 완료 후 dev에 PR
# GitHub에서 Pull Request 생성: fix/phase7-sprint1 → dev

# 6. Phase 완료 후 main에 PR
# GitHub에서 Pull Request 생성: dev → main
```

## 🎯 클린 개발 원칙

### 1. 파일 시스템 관리

#### 디렉토리 구조 표준
```
src/
├── app/                 # Next.js 13+ App Router
│   ├── api/            # API 라우트
│   └── (routes)/       # 페이지 라우트
├── components/         # UI 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   ├── features/       # 기능별 컴포넌트
│   │   ├── ia/        # IA 관련
│   │   ├── ui/        # UI 디자이너 관련
│   │   ├── deployment/ # 배포 관련
│   │   └── ...
│   └── layouts/        # 레이아웃 컴포넌트
├── hooks/              # 커스텀 훅
├── lib/                # 외부 라이브러리 설정
├── server/             # 서버 사이드 로직
│   ├── api/           # tRPC 라우터
│   ├── services/      # 비즈니스 로직
│   │   ├── sync/      # 실시간 동기화
│   │   ├── deployment/# 배포 서비스
│   │   └── ...
│   └── db/            # Prisma 클라이언트
├── styles/             # 전역 스타일
├── types/              # TypeScript 타입
└── utils/              # 유틸리티 함수
```

#### 파일 명명 규칙
- **컴포넌트**: `PascalCase.tsx` (예: `DeploymentManager.tsx`)
- **훅**: `use` 접두사 + `camelCase.ts` (예: `useWebSocket.ts`)
- **유틸리티**: `camelCase.ts` (예: `formatDate.ts`)
- **타입**: `types.ts` 또는 `[domain].types.ts` (예: `deployment.types.ts`)
- **상수**: `UPPER_SNAKE_CASE` in `constants.ts`

### 2. 코드 작성 표준

#### Import 순서
```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. 외부 라이브러리
import { motion } from 'framer-motion';
import { z } from 'zod';

// 3. 내부 모듈 (절대 경로)
import { api } from '~/utils/api';
import { Button } from '~/components/ui/button';

// 4. 상대 경로 imports
import { DeploymentStatus } from './DeploymentStatus';

// 5. 타입 imports
import type { DeploymentConfig } from '~/types/deployment';
```

#### 함수/컴포넌트 구조
```typescript
// 1. 타입 정의
interface ComponentProps {
  // ...
}

// 2. 상수 정의
const DEFAULT_VALUES = {
  // ...
};

// 3. 메인 컴포넌트/함수
export function Component({ prop1, prop2 }: ComponentProps) {
  // 3.1. 훅 (최상단)
  const [state, setState] = useState();
  const router = useRouter();
  
  // 3.2. 파생 상태
  const derivedValue = useMemo(() => {}, []);
  
  // 3.3. 이펙트
  useEffect(() => {}, []);
  
  // 3.4. 핸들러 함수
  const handleClick = () => {};
  
  // 3.5. 렌더링
  return <div>...</div>;
}

// 4. 내부 컴포넌트 (필요시)
function SubComponent() {}

// 5. 유틸리티 함수 (필요시)
function helperFunction() {}
```

### 3. Sprint 개발 프로세스

#### Sprint 시작 체크리스트
```bash
# 1. 브랜치 생성 및 환경 설정
git checkout dev
git pull origin dev
git checkout -b fix/phase7-sprint1

# 2. 의존성 확인
pnpm install
pnpm run dev # 개발 서버 정상 작동 확인

# 3. 이전 Sprint 정리 확인
find . -name "*.tmp" -o -name "*.bak" -o -name "*~" | xargs rm -f
git clean -fd # 추적되지 않는 파일 제거 (주의!)

# 4. 린트/타입 체크
pnpm run lint
pnpm run type-check
```

#### 개발 중 규칙
```typescript
// ❌ 절대 하지 말 것
- console.log() 남기기 (디버깅 후 즉시 제거)
- any 타입 사용
- // @ts-ignore 사용
- TODO 주석 방치 (2주 이상)
- 임시 파일 생성 (temp.*, test.*, backup.*)
- 주석 처리된 코드 방치

// ✅ 반드시 할 것
- 타입 명시
- 에러 처리
- 로딩/에러 상태 처리
- 적절한 로깅 (개발: console, 프로덕션: logger)
- 의미 있는 변수/함수명
```

#### Sprint 완료 체크리스트
```bash
# 1. 코드 정리
pnpm run format      # Prettier 실행
pnpm run lint:fix    # ESLint 자동 수정

# 2. 테스트
pnpm run test        # 전체 테스트
pnpm run test:coverage # 커버리지 확인 (목표: 80% 이상)

# 3. 빌드 확인
pnpm run build       # 빌드 에러 없음
pnpm run start       # 프로덕션 모드 테스트

# 4. 불필요한 의존성 확인
npx depcheck         # 사용하지 않는 패키지 확인

# 5. 번들 크기 확인
npx next-bundle-analyzer
```

### 4. 커밋 메시지 규칙

#### 형식
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 프로세스, 도구 설정 등

#### 예시
```bash
# Sprint 개발 중
git commit -m "feat(websocket): Socket.io 서버 초기 설정"
git commit -m "fix(auth): WebSocket 인증 토큰 검증 오류 수정"

# Sprint 완료
git commit -m "feat(phase7-sprint1): WebSocket 인프라 구축 완료

- Socket.io 서버 설정
- JWT 기반 인증 구현
- 재연결 로직 추가
- 연결 모니터링 시스템 구현

테스트 커버리지: 85%"

# Phase 완료
git commit -m "feat(phase7): 최종 통합 및 배포 시스템 완료

완료된 Sprint:
- Sprint 1: WebSocket 인프라
- Sprint 2: 실시간 동기화 코어
- Sprint 3: Phase 간 자동 동기화
- Sprint 4: 협업 기능
- Sprint 5: 배포 서비스 코어
- Sprint 6: 플랫폼 통합
- Sprint 7: 배포 UI
- Sprint 8: 통합 테스트

주요 기능:
- 실시간 협업 지원
- 원클릭 배포 (Vercel, Netlify, Cloudflare)
- 자동 동기화 시스템"
```

### 5. 코드 리뷰 체크리스트

#### PR 생성 전 자가 검토
- [ ] 브랜치명이 규칙에 맞는가? (`fix/phaseX-sprintY`)
- [ ] 모든 테스트가 통과하는가?
- [ ] 린트 에러가 없는가?
- [ ] 빌드가 성공하는가?
- [ ] 불필요한 파일/코드가 없는가?
- [ ] console.log가 제거되었는가?
- [ ] 적절한 에러 처리가 되어있는가?
- [ ] 타입이 명확히 정의되어 있는가?

#### PR 템플릿
```markdown
## 📋 작업 내용
- Sprint X: [스프린트명]
- 구현 기능: 
  - [ ] 기능 1
  - [ ] 기능 2

## 🧪 테스트
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 통과
- [ ] 수동 테스트 완료

## 📸 스크린샷
(해당사항 있을 경우)

## ✅ 체크리스트
- [ ] 코드 리뷰 체크리스트 확인
- [ ] 문서 업데이트 (필요시)
- [ ] 환경 변수 추가 (필요시)
```

### 6. 환경 설정 파일

#### .eslintrc.js
```javascript
module.exports = {
  extends: ['next/core-web-vitals', 'prettier'],
  rules: {
    'no-unused-vars': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'prefer-const': 'error',
    'react-hooks/exhaustive-deps': 'error',
  },
};
```

#### .prettierrc
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

#### .husky/pre-commit
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 린트 체크
npm run lint

# 타입 체크
npm run type-check

# 변경된 파일만 테스트
npm run test:changed

# console.log 체크
if grep -r "console\.log" --include="*.ts" --include="*.tsx" src/; then
  echo "❌ console.log found! Please remove before committing."
  exit 1
fi
```

### 7. 성능 및 품질 기준

#### 성능 목표
- Lighthouse 점수: 90+ (모든 카테고리)
- 번들 크기: 초기 로드 < 200KB
- TTI (Time to Interactive): < 3초
- FCP (First Contentful Paint): < 1.5초

#### 코드 품질 목표
- 테스트 커버리지: 80% 이상
- 타입 커버리지: 95% 이상
- 0 ESLint 에러
- 0 TypeScript 에러

### 8. 문제 해결 가이드

#### 자주 발생하는 문제와 해결법

**1. Import 순서 문제**
```bash
# ESLint import 순서 자동 정렬
pnpm run lint:fix
```

**2. 타입 에러**
```typescript
// ❌ 임시 해결 금지
// @ts-ignore

// ✅ 적절한 타입 정의
interface Props {
  data: unknown; // 임시
}
// 나중에 구체적 타입으로 변경
```

**3. 빌드 에러**
```bash
# 캐시 클리어 후 재빌드
rm -rf .next
pnpm run build
```

### 9. 개발 도구 활용

#### VS Code 확장 프로그램 (필수)
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- GitLens
- Error Lens

#### 유용한 스크립트
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:changed": "jest -o",
    "clean": "rm -rf .next node_modules",
    "analyze": "ANALYZE=true next build"
  }
}
```

## 🚨 절대 규칙

### 하지 말아야 할 것
1. **임시 코드 방치**: `// TEMP`, `// FIXME` 즉시 해결
2. **무분별한 패키지 추가**: 대안 먼저 검토
3. **복사-붙여넣기**: DRY 원칙 준수
4. **테스트 없는 기능**: TDD 권장
5. **문서화 없는 복잡한 로직**: 주석 필수

### 반드시 해야 할 것
1. **매일 코드 리뷰**: 자가 검토라도 수행
2. **정기적 리팩토링**: 기술 부채 최소화
3. **에러 경계 설정**: 사용자 경험 보호
4. **접근성 고려**: a11y 표준 준수
5. **보안 검토**: OWASP Top 10 체크

이 가이드라인을 준수하여 깨끗하고 유지보수가 쉬운 코드베이스를 만들어가세요!