# U-001 기술 스택 결정

## 결정 요약

| Area | Decision | Rationale |
| --- | --- | --- |
| App Framework | Next.js + App Router | Vercel 배포와 Route Handler에 적합 |
| Language | TypeScript | 타입 안전성과 테스트 가능한 contract 제공 |
| Styling | Tailwind CSS | 빠른 MVP UI 구성과 일관된 utility style |
| Unit Test | Vitest | TypeScript/ESM 친화적이고 빠른 단위 테스트 |
| Component Test | React Testing Library | 사용자 관점의 React component 검증 |
| E2E | 후속 Playwright smoke test 후보 | MVP 초기에는 단위 테스트 우선 |
| Lint | Next.js ESLint 기반 | Next.js/React 기본 품질 규칙 |
| Package Manager | npm | 기본 Node/Next.js 생태계와 단순성 |

## Test Strategy

### U-001 필수

- `npm test`: Vitest 기반 단위 테스트 실행
- `npm run lint`: Next.js lint 실행
- `npm run typecheck`: TypeScript typecheck 실행
- `npm run build`: production build 실행

### 후속 확장

- `npm run test:e2e`: Playwright smoke test 후보
- 인증/OAuth callback, playlist publish 같은 흐름은 U-002부터 U-005가 연결된 뒤
  e2e 대상으로 올린다.

## Directory Strategy

```text
src/
  features/
  server/
  domain/
  lib/
```

- `src/features`: React feature component와 feature-local UI logic
- `src/server`: Route Handler에서 호출하는 server service와 adapter
- `src/domain`: 네트워크 없는 도메인 타입과 로직
- `src/lib`: 환경 변수, HTTP helper, 테스트 helper 같은 공통 기반

## Environment Strategy

### Server-only

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REDIRECT_URI`
- `SESSION_SECRET`
- `LLM_API_KEY` 또는 후속 provider별 secret

### Public

- MVP에서는 public 환경 변수를 최소화한다.
- client에 노출해야 하는 값은 `NEXT_PUBLIC_` prefix를 사용하고 secret을 담지
  않는다.

## Rejected Options

- **Jest 우선 도입**: 가능하지만 Vitest가 Next.js + TypeScript MVP에서 더
  가볍게 시작하기 좋다.
- **e2e 필수 게이트**: 이번 단위에서는 단위 테스트 기반 마련이 우선이다.
  e2e는 주요 흐름이 연결된 뒤 추가한다.
- **CSS Modules 우선**: 컴포넌트별 캡슐화는 좋지만, MVP 속도와 일관성을 위해
  Tailwind CSS를 우선한다.
