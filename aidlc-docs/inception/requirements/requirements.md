# 요구사항 분석

<!-- markdownlint-disable MD024 -->

## 의도 분석 요약

- **사용자 요청**: `AGENTS.md`를 따르고 모든 산출물을 한국어로 작성한다.
- **요청 유형**: 신규 프로젝트 개발
- **범위 추정**: 전체 애플리케이션의 핵심 도메인, API 계약, 테스트 골격
- **복잡도 추정**: 보통 이상
- **선택 기술 방향**: Next.js + TypeScript
- **배포 방향**: MVP 단계에서는 DB 없이 Vercel 배포

## 핵심 결정

- Spotify 플레이리스트 큐레이션 기능을 포함한 전체 애플리케이션을 만든다.
- 별도 Spring Boot 백엔드는 두지 않는다.
- Spotify OAuth, Spotify Web API 호출, LLM API 호출은 Next.js Route
  Handler에서 처리한다.
- MVP에서는 영속 데이터베이스를 사용하지 않는다.
- AI 큐레이션은 실제 구현보다 인터페이스와 교체 가능한 경계를 먼저 둔다.
- Security Baseline 확장 규칙은 이번 단계에서 적용하지 않는다.
- Property-Based Testing 확장 규칙은 이번 단계에서 적용하지 않는다.

## 기능 요구사항

## Requirement R-001: Spotify OAuth 인증

### Description

사용자는 Spotify 계정으로 인증할 수 있어야 한다. 인증 과정은 Next.js
Route Handler에서 처리하며, Spotify Web API 호출에 필요한 권한을 얻는다.

### Acceptance Criteria

- 사용자가 Spotify 인증 시작 액션을 실행할 수 있다.
- Spotify OAuth callback을 처리할 수 있다.
- 인증 실패 또는 취소 시 사용자에게 실패 상태를 전달한다.
- 인증 후 Spotify API 호출에 필요한 접근 권한을 확보한다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit, integration
- **Required Test Evidence**: OAuth URL 생성, callback 처리, 실패 분기 테스트
- **Manual Verification Rationale**: 실제 Spotify OAuth 화면 왕복은 배포 환경에서
  수동 확인이 필요할 수 있다.

## Requirement R-002: Spotify 사용자 데이터 조회

### Description

인증된 사용자의 Spotify 라이브러리, 재생 기록 또는 선호도 판단에 필요한
데이터를 조회할 수 있어야 한다.

### Acceptance Criteria

- Spotify Web API 클라이언트 경계를 정의한다.
- 사용자 취향 분석에 필요한 트랙 또는 아티스트 데이터를 조회한다.
- Spotify API 오류와 rate limit 응답을 명확한 애플리케이션 오류로 변환한다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit, integration
- **Required Test Evidence**: Spotify API 클라이언트 테스트 더블 기반 성공 및
  실패 시나리오
- **Manual Verification Rationale**: 없음

## Requirement R-003: 큐레이션 입력 모델과 도메인 분석

### Description

Spotify에서 얻은 트랙, 아티스트, 장르, 오디오 특성 등의 데이터를 내부
큐레이션 모델로 변환하고 테스트 가능한 도메인 로직으로 분석한다.

### Acceptance Criteria

- 외부 Spotify 응답과 내부 도메인 모델을 분리한다.
- 큐레이션 후보 트랙 목록을 만들 수 있다.
- 도메인 로직은 Route Handler와 분리되어 단위 테스트가 가능해야 한다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit
- **Required Test Evidence**: 도메인 모델 변환과 후보 선정 로직 테스트
- **Manual Verification Rationale**: 없음

## Requirement R-004: LLM 큐레이션 인터페이스

### Description

AI 기반 큐레이션은 실제 LLM 구현을 바로 고정하지 않고, 교체 가능한
인터페이스와 테스트 더블을 우선 제공한다.

### Acceptance Criteria

- 큐레이션 요청과 응답의 TypeScript 타입을 정의한다.
- LLM 제공자 구현은 인터페이스 뒤에 감춘다.
- MVP에서는 테스트 더블 또는 placeholder 구현으로 흐름을 검증할 수 있다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit
- **Required Test Evidence**: LLM 인터페이스 계약과 fallback 응답 테스트
- **Manual Verification Rationale**: 없음

## Requirement R-005: 플레이리스트 추천 또는 생성 흐름

### Description

사용자는 분석된 취향과 큐레이션 결과를 기반으로 플레이리스트 추천 결과를
볼 수 있어야 하며, Spotify API 권한이 있으면 플레이리스트 생성을 수행할 수
있어야 한다.

### Acceptance Criteria

- 추천 결과에는 곡 목록과 큐레이션 근거가 포함된다.
- Spotify API에 플레이리스트 생성 요청을 보낼 수 있는 경계를 둔다.
- 플레이리스트 생성 실패 시 사용자에게 재시도 가능한 오류 상태를 제공한다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit, integration
- **Required Test Evidence**: 추천 결과 생성, Spotify playlist API 호출 경계,
  오류 처리 테스트
- **Manual Verification Rationale**: 실제 Spotify 계정에 생성되는 결과는
  수동 확인이 필요할 수 있다.

## Requirement R-006: Next.js 사용자 화면

### Description

애플리케이션 첫 화면은 실제 큐레이션 경험을 시작할 수 있는 제품 화면이어야
한다. 사용자는 로그인, 취향 분석 시작, 추천 결과 확인 흐름을 사용할 수
있어야 한다.

### Acceptance Criteria

- 첫 화면에서 Spotify 인증 또는 큐레이션 시작 액션이 명확하다.
- 인증 전, 분석 중, 추천 완료, 오류 상태를 표시한다.
- 화면은 MVP 배포 환경에서 바로 사용할 수 있어야 한다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit, e2e
- **Required Test Evidence**: 주요 UI 상태 렌더링 테스트와 핵심 사용자 흐름
  검증
- **Manual Verification Rationale**: 최종 시각 품질은 브라우저에서 확인한다.

## 비기능 요구사항

## Requirement NFR-001: 테스트 가능성

### Description

도메인 로직, 외부 API 경계, Route Handler는 테스트 가능한 구조로 분리한다.

### Acceptance Criteria

- Spotify API와 LLM API 호출은 테스트 더블로 대체 가능하다.
- 핵심 큐레이션 로직은 네트워크 없이 테스트할 수 있다.
- 구현 단계에서 관련 테스트 골격을 함께 만든다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit, integration
- **Required Test Evidence**: 도메인 로직, API adapter, Route Handler 테스트
- **Manual Verification Rationale**: 없음

## Requirement NFR-002: 무상태 MVP 운영

### Description

MVP는 영속 데이터베이스 없이 동작해야 한다. 요청 단위 처리와 외부 API 응답을
중심으로 구성한다.

### Acceptance Criteria

- 앱 실행에 DB provisioning이 필요하지 않다.
- 배포 환경 변수만으로 Spotify 및 선택적 LLM 연동 설정이 가능하다.
- 영속 저장이 필요한 기능은 MVP 범위 밖으로 명확히 둔다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: integration
- **Required Test Evidence**: DB 의존성 없이 빌드와 주요 API 테스트 통과
- **Manual Verification Rationale**: Vercel 환경 변수 설정은 수동 확인이
  필요할 수 있다.

## Requirement NFR-003: 보안 기본 주의사항

### Description

Security Baseline 확장 규칙은 적용하지 않지만, OAuth token과 API key는
클라이언트 번들에 노출되지 않아야 한다.

### Acceptance Criteria

- Spotify client secret과 LLM API key는 서버 측 환경 변수로만 사용한다.
- Route Handler는 민감한 토큰을 응답 본문에 그대로 노출하지 않는다.
- 클라이언트 컴포넌트에는 공개 가능한 설정만 전달한다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit, integration
- **Required Test Evidence**: 응답 직렬화와 환경 변수 접근 경계 테스트
- **Manual Verification Rationale**: 배포 환경 secret 설정은 수동 확인이
  필요할 수 있다.

## Requirement NFR-004: 배포 용이성

### Description

MVP는 Vercel에 배포 가능한 Next.js 애플리케이션이어야 한다.

### Acceptance Criteria

- 표준 Next.js 빌드 명령으로 production build가 가능하다.
- 필요한 환경 변수 목록이 문서화된다.
- 서버 전용 API 호출이 Vercel serverless 환경에서 동작하는 구조여야 한다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: build, integration
- **Required Test Evidence**: `npm run build` 및 Route Handler 테스트
- **Manual Verification Rationale**: 실제 Vercel 배포 연결은 수동 확인이
  필요할 수 있다.

## 범위 제외

- 별도 Spring Boot 백엔드는 만들지 않는다.
- MVP에서는 영속 데이터베이스를 사용하지 않는다.
- 실제 LLM 제공자 고정 구현은 우선순위가 낮으며, 인터페이스와 테스트 더블을
  먼저 둔다.
- Security Baseline과 Property-Based Testing 확장 규칙은 이번 단계에서
  차단 조건으로 적용하지 않는다.

## 다음 단계 판단

신규 사용자 대면 전체 애플리케이션이므로 `User Stories` 단계를 실행한다.
사용자 인증, 취향 분석, 추천 결과 확인, 플레이리스트 생성 흐름의 수용 기준을
구체화한 뒤 `Workflow Planning`으로 진행한다.
