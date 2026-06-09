# User Stories

<!-- markdownlint-disable MD024 -->

## Story 작성 기준

- **분해 방식**: Epic-Based + User Journey-Based
- **우선순위 표시**: Must, Should, Could
- **기본 persona**: P-001 순간 분위기 큐레이터
- **보조 persona**: P-002 MVP 검증 개발자
- **추천 결과 초점**: playlist 제목, 설명, 전체 분위기 요약
- **MVP playlist 생성 범위**: 실제 Spotify 계정에 playlist 생성 포함
- **사용자 입력 범위**: 자연어 프롬프트
- **오류 story 범위**: 대표 실패 상태 중심

## Epic E-001: Spotify 인증 시작

## Story S-001: Spotify 계정으로 인증한다

**Priority**: Must

As a 순간 분위기 큐레이터, I want Spotify 계정으로 인증하고 권한을 부여하고
싶다, so that 내 음악 취향과 playlist 생성 권한을 앱이 사용할 수 있다.

### Acceptance Criteria

- Given 사용자가 인증 전 상태에 있을 때, when Spotify 인증 시작 액션을
  실행하면, then Spotify OAuth authorization URL로 이동한다.
- Given Spotify가 callback code를 반환했을 때, when Route Handler가 callback을
  처리하면, then 이후 Spotify Web API 호출에 필요한 인증 상태가 준비된다.
- Given 사용자가 인증을 취소했을 때, when callback이 실패 상태로 돌아오면,
  then 앱은 인증 실패 상태와 다시 시도할 수 있는 액션을 보여준다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit, integration, e2e
- **Required Test Evidence**: OAuth URL 생성 테스트, callback 처리 Route
  Handler 테스트, 인증 전후 UI 상태 테스트
- **Manual Verification Rationale**: 실제 Spotify OAuth 화면 왕복은 Spotify
  개발자 설정과 배포 URL에서 수동 확인이 필요할 수 있다.

### Requirement Mapping

- R-001
- NFR-003

## Epic E-002: 자연어 큐레이션 요청

## Story S-002: 원하는 분위기를 자연어로 입력한다

**Priority**: Must

As a 순간 분위기 큐레이터, I want 원하는 분위기나 상황을 자연어로 입력하고
싶다, so that 앱이 지금 필요한 playlist 방향을 이해할 수 있다.

### Acceptance Criteria

- Given 사용자가 인증된 상태일 때, when 자연어 큐레이션 입력을 작성하면,
  then 앱은 입력값을 큐레이션 요청 모델로 변환한다.
- Given 입력값이 비어 있을 때, when 사용자가 분석을 시작하면, then 앱은
  입력이 필요하다는 상태를 표시한다.
- Given 입력값이 제출되었을 때, when 분석이 시작되면, then 앱은 분석 중
  상태를 보여준다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit, e2e
- **Required Test Evidence**: 입력 validation 테스트, 큐레이션 요청 모델 변환
  테스트, UI 상태 전환 테스트
- **Manual Verification Rationale**: 없음

### Requirement Mapping

- R-003
- R-006

## Epic E-003: 취향 데이터 분석과 큐레이션

## Story S-003: Spotify 데이터를 내부 큐레이션 모델로 변환한다

**Priority**: Must

As a MVP 검증 개발자, I want Spotify 응답을 내부 큐레이션 모델로 변환하고
싶다, so that 네트워크 없이도 핵심 분석 로직을 테스트할 수 있다.

### Acceptance Criteria

- Given Spotify Web API가 트랙 또는 아티스트 데이터를 반환했을 때, when
  adapter가 응답을 처리하면, then 외부 응답과 분리된 내부 도메인 모델이
  생성된다.
- Given Spotify 응답에 일부 선택 데이터가 없을 때, when 변환이 실행되면,
  then 앱은 허용 가능한 기본값 또는 제외 규칙을 적용한다.
- Given 변환된 내부 모델이 있을 때, when 큐레이션 후보 선정 로직이 실행되면,
  then 추천 후보 목록을 생성한다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit, integration
- **Required Test Evidence**: Spotify 응답 fixture 기반 adapter 테스트,
  도메인 모델 변환 테스트, 후보 선정 로직 테스트
- **Manual Verification Rationale**: 없음

### Requirement Mapping

- R-002
- R-003
- NFR-001

## Story S-004: LLM 인터페이스로 playlist 컨셉을 생성한다

**Priority**: Must

As a MVP 검증 개발자, I want LLM provider를 인터페이스 뒤에 감추고 싶다,
so that 실제 LLM 구현 없이도 큐레이션 흐름을 검증하고 나중에 제공자를 바꿀 수
있다.

### Acceptance Criteria

- Given 큐레이션 요청 모델과 추천 후보가 있을 때, when LLM 큐레이션
  인터페이스가 호출되면, then playlist 제목, 설명, 전체 분위기 요약을 포함한
  결과를 반환한다.
- Given 실제 LLM provider가 설정되지 않았을 때, when 큐레이션이 실행되면,
  then 테스트 더블 또는 placeholder 구현이 안정적인 결과 형식을 반환한다.
- Given LLM provider 호출이 실패했을 때, when fallback이 가능하면, then 앱은
  최소한의 추천 결과 또는 오류 상태를 반환한다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit, integration
- **Required Test Evidence**: LLM interface 계약 테스트, placeholder provider
  테스트, 실패 fallback 테스트
- **Manual Verification Rationale**: 실제 외부 LLM 품질 평가는 MVP 후속 검증
  대상이다.

### Requirement Mapping

- R-004
- NFR-001

## Epic E-004: 추천 결과 확인

## Story S-005: playlist 제목, 설명, 분위기 요약을 확인한다

**Priority**: Must

As a 순간 분위기 큐레이터, I want 추천 결과의 제목, 설명, 전체 분위기 요약을
먼저 보고 싶다, so that 이 playlist가 지금 내 상황에 맞는지 빠르게 판단할 수
있다.

### Acceptance Criteria

- Given 큐레이션이 성공했을 때, when 결과 화면이 표시되면, then playlist
  제목, 설명, 전체 분위기 요약이 명확히 보인다.
- Given 추천 결과에 곡 목록이 포함될 때, when 사용자가 세부 정보를 확인하면,
  then 곡 목록과 필요한 경우 추천 근거를 확인할 수 있다.
- Given 추천 결과가 마음에 들지 않을 때, when 사용자가 입력을 수정하면, then
  새 큐레이션 요청을 시작할 수 있다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit, e2e
- **Required Test Evidence**: 결과 컴포넌트 렌더링 테스트, 성공 상태 e2e 흐름,
  재요청 액션 테스트
- **Manual Verification Rationale**: 최종 시각 품질과 문구 톤은 브라우저에서
  수동 확인한다.

### Requirement Mapping

- R-005
- R-006

## Epic E-005: Spotify playlist 생성

## Story S-006: 추천 결과를 Spotify playlist로 생성한다

**Priority**: Must

As a 순간 분위기 큐레이터, I want 추천 결과를 내 Spotify 계정에 playlist로
생성하고 싶다, so that 바로 저장하고 재생할 수 있다.

### Acceptance Criteria

- Given 사용자가 추천 결과를 확인한 상태일 때, when playlist 생성 액션을
  실행하면, then 앱은 Spotify playlist 생성 API를 호출한다.
- Given Spotify playlist 생성이 성공했을 때, when 응답이 돌아오면, then 앱은
  생성 완료 상태와 Spotify에서 열 수 있는 정보를 제공한다.
- Given Spotify playlist 생성이 실패했을 때, when 오류가 발생하면, then 앱은
  대표 실패 메시지와 재시도 가능한 액션을 제공한다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit, integration, e2e
- **Required Test Evidence**: playlist 생성 adapter 테스트, Route Handler 성공
  및 실패 테스트, 생성 완료 UI 흐름 테스트
- **Manual Verification Rationale**: 실제 Spotify 계정에 생성된 playlist는
  수동 확인이 필요할 수 있다.

### Requirement Mapping

- R-005
- R-006
- NFR-003

## Epic E-006: 대표 실패 상태 처리

## Story S-007: 인증과 외부 API 대표 오류를 이해할 수 있게 보여준다

**Priority**: Should

As a 순간 분위기 큐레이터, I want 인증이나 Spotify API 오류가 발생했을 때
무엇을 다시 시도해야 하는지 알고 싶다, so that 오류 상황에서도 앱을 계속
사용할 수 있다.

### Acceptance Criteria

- Given Spotify 인증이 실패했을 때, when 사용자가 앱으로 돌아오면, then
  인증 실패 상태와 재시도 액션을 본다.
- Given Spotify API가 rate limit 또는 권한 오류를 반환했을 때, when 앱이
  오류를 처리하면, then 사용자에게 대표 오류 메시지를 보여준다.
- Given playlist 생성이 실패했을 때, when 재시도가 가능한 오류이면, then
  재시도 액션을 제공한다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: unit, integration, e2e
- **Required Test Evidence**: 대표 오류 mapping 테스트, Route Handler 실패
  응답 테스트, 오류 UI 상태 테스트
- **Manual Verification Rationale**: 없음

### Requirement Mapping

- R-001
- R-002
- R-005

## Epic E-007: 무상태 MVP와 배포 준비

## Story S-008: DB 없이 Vercel에서 실행 가능한 구조를 검증한다

**Priority**: Should

As a MVP 검증 개발자, I want DB 없이 환경 변수와 serverless Route Handler로
MVP를 실행하고 싶다, so that 배포와 검증을 빠르게 반복할 수 있다.

### Acceptance Criteria

- Given 프로젝트가 초기화되었을 때, when production build를 실행하면, then
  DB provisioning 없이 빌드가 성공한다.
- Given 배포 환경 변수가 제공되었을 때, when Route Handler가 실행되면, then
  서버 측에서만 Spotify secret과 선택적 LLM secret을 읽는다.
- Given 클라이언트 화면이 렌더링될 때, when 번들에 포함되는 값이 결정되면,
  then 민감한 secret은 클라이언트에 노출되지 않는다.

### Verification Expectations

- **Automation Required**: Yes
- **Expected Test Level**: build, unit, integration
- **Required Test Evidence**: `npm run build`, 환경 변수 접근 경계 테스트,
  secret 비노출 테스트
- **Manual Verification Rationale**: 실제 Vercel 환경 변수 설정은 수동 확인이
  필요할 수 있다.

### Requirement Mapping

- NFR-002
- NFR-003
- NFR-004

## Story 검증 요약

| Story | Priority | Primary Persona | Primary Verification |
| --- | --- | --- | --- |
| S-001 | Must | P-001 | OAuth URL, callback, UI state |
| S-002 | Must | P-001 | 입력 validation, 요청 모델, UI state |
| S-003 | Must | P-002 | Spotify adapter, 도메인 변환 |
| S-004 | Must | P-002 | LLM interface, placeholder provider |
| S-005 | Must | P-001 | 결과 화면, 재요청 흐름 |
| S-006 | Must | P-001 | playlist 생성 adapter, 성공/실패 UI |
| S-007 | Should | P-001 | 대표 오류 mapping, 오류 UI |
| S-008 | Should | P-002 | build, 환경 변수, secret 경계 |
