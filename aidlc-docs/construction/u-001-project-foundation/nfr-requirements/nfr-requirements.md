# U-001 Project Foundation NFR Requirements

<!-- markdownlint-disable MD024 -->

## 범위

U-001은 Next.js + TypeScript 프로젝트 기반, 테스트 도구, Tailwind CSS,
환경 변수 경계, Vercel 배포 적합성을 준비한다. 실제 Spotify OAuth, Spotify
API 호출, 큐레이션 도메인, UI 완성은 후속 단위에서 구현한다.

## NFR-001: Build and Type Safety

### Requirement

프로젝트는 production build와 TypeScript typecheck를 안정적으로 통과해야 한다.

### Acceptance Criteria

- `npm run build`가 DB 의존성 없이 실행 가능하다.
- `npm run typecheck`가 TypeScript 오류 없이 통과한다.
- route handler와 server-only 코드가 browser bundle에 잘못 포함되지 않도록
  파일 경계를 둔다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm run build`, `npm run typecheck`
- **Evidence**: Build and Test summary에 명령 결과 기록

## NFR-002: Unit Test Foundation

### Requirement

MVP에서는 단위 테스트를 우선 구성한다. e2e는 후속 단계에서 Playwright smoke
test로 확장 가능하게 scripts와 directory 경계를 열어둔다.

### Acceptance Criteria

- 단위 테스트 runner와 React component test 기반이 준비된다.
- 후속 단위가 domain, server adapter, feature component 테스트를 추가할 수
  있는 구조를 가진다.
- Playwright는 이번 단위의 필수 구현 범위가 아니지만 후속 확장을 고려해
  품질 게이트 설명에 남긴다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm test`
- **Evidence**: 최소 smoke unit test 또는 test runner 실행 결과

## NFR-003: Lint and Maintainability

### Requirement

초기 프로젝트는 일관된 lint 규칙과 format 가능한 구조를 가져야 한다.

### Acceptance Criteria

- `npm run lint`가 실행 가능하다.
- TypeScript, React, Next.js 기본 lint 규칙을 적용한다.
- 후속 단위가 같은 lint 기준을 공유한다.

### Verification

- **Automation Required**: Yes
- **Command**: `npm run lint`
- **Evidence**: lint 명령 결과

## NFR-004: Server-only Secret Boundary

### Requirement

Spotify client secret과 선택적 LLM API key는 서버 전용 환경 변수로 관리한다.

### Acceptance Criteria

- `.env.example`에 필요한 환경 변수 이름과 설명을 둔다.
- public 환경 변수와 server-only 환경 변수를 구분한다.
- client component에서 secret을 직접 참조하지 않는 구조를 둔다.

### Verification

- **Automation Required**: Yes
- **Command**: unit test 또는 type boundary test
- **Evidence**: env helper 테스트와 code review evidence

## NFR-005: Vercel Deployment Fit

### Requirement

프로젝트 기반은 Vercel serverless 배포에 맞아야 한다.

### Acceptance Criteria

- 별도 DB provisioning 없이 실행된다.
- Route Handler 기반 server boundary를 사용할 수 있는 Next.js 구조다.
- 배포에 필요한 환경 변수는 문서화된다.

### Verification

- **Automation Required**: Partial
- **Command**: `npm run build`
- **Manual Evidence**: Vercel 환경 변수 설정은 수동 확인 가능

## Exclusions

- e2e smoke test 구현은 U-001 필수 범위에서 제외한다.
- 실제 OAuth callback과 playlist publish end-to-end 검증은 후속 단위 이후
  Playwright smoke test 후보로 둔다.
- Spotify MCP는 사용하지 않는다.
