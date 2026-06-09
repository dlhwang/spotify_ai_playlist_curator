# U-003 최근 재생 곡 연동 및 도메인 모델 Functional Design 계획

<!-- markdownlint-disable MD013 MD053 -->

## 목적

U-003은 Spotify 최근 재생 곡 수집 기능(`GET /v1/me/player/recently-played`)을 포함한다. 이 단계에서는 외부 API 응답을 애플리케이션 핵심 도메인 영역과 연동하기 위한 도메인 모델(`Track`, `Artist` 등) 설계, 데이터 정제 및 변환 비즈니스 규칙, 그리고 예외 상황(신규 계정으로 재생 곡이 없는 경우, API 실패 등) 처리를 설계하고 문서화한다.

## 실행 체크리스트

- [x] U-003 책임과 사용자 스토리 S-003의 수용 기준을 검토한다.
- [x] Spotify 최근 재생 곡 API 응답 명세를 도메인 객체로 정제 및 매핑하는 구조를 정의한다.
- [x] 비즈니스 도메인 모델(`Track`, `Artist`, `CurationInput`)의 엔티티 명세를 정의한다.
- [x] 토큰 만료 시 자동 토큰 리프레시와 API 재시도(Retry)에 관한 규칙을 수립한다.
- [x] 신규 사용자 등 최근 재생 이력이 없을 때의 대응 비즈니스 룰을 정의한다.
- [x] API 장애(429 Rate Limit, 5xx 에러) 시의 관측성 및 예외 전파 제약사항을 정의한다.
- [x] `aidlc-docs/construction/u-003-spotify-recent-tracks/functional-design/business-logic-model.md`를 생성한다.
- [x] `aidlc-docs/construction/u-003-spotify-recent-tracks/functional-design/business-rules.md`를 생성한다.
- [x] `aidlc-docs/construction/u-003-spotify-recent-tracks/functional-design/domain-entities.md`를 생성한다.
- [x] 완료 후 이 계획의 체크박스를 즉시 갱신한다.

## 기본 설계 방향

- Spotify API 연동 모듈은 `SpotifyClient` 로 명명하여 분리하고, 외부 네트워크 연동에 독립적인 형태로 테스트가 가능하도록 설계한다.
- 네트워크가 배제된 `src/domain` 레이어에 `Track`, `Artist` 등의 도메인 모델을 명시하여 데이터 의존성을 격리한다.
- 세션에서 토큰을 추출해 사용하며, API 응답 오류(401 Unauthorized) 발생 시 자동으로 `AuthService`의 Refresh Token 로직을 경유하여 갱신된 세션으로 재시도하도록 융합한다.

## 확인 질문

아래 질문의 `[Answer]:` 뒤에 선택지 문자를 적어 주세요. 선택지가 맞지 않으면 `X) Other`를 선택하고 설명을 덧붙여 주세요.

## Question 1

최근 재생 곡 데이터를 도메인 모델로 변환할 때 어떤 필드들을 코어 도메인으로 추출할까요?

A) 트랙 ID, 제목, 아티스트 이름, 앨범 이미지 URL, 재생 시간(played_at), 트랙 URI (기본 플레이리스트 큐레이션 및 UI 전시에 필요한 항목 위주)

B) 음원 특성(audio features - 템포, 댄스어빌리티 등) 분석 데이터까지 확장하여 가져오는 필드 스펙 추가

C) 플레이리스트 생성에 필요한 트랙 URI와 제목/아티스트 텍스트만 단순 추출

[Answer]: C

## Question 2

최근 재생 곡이 아예 없는 신규 계정이거나 오랜 기간 노래를 듣지 않은 사용자인 경우 어떻게 처리할까요?

A) 사용자 화면에 최근 재생 곡이 없다는 안내 및 경고를 띄우고, 수동 텍스트 프롬프트 기반 큐레이션만 진행할 수 있도록 동작 허용

B) 에러 페이지를 띄우고 더 이상 큐레이션을 진행하지 못하도록 완강하게 막음

C) 최근 재생 곡이 비어있는 상태로 LLM 레이어에 그대로 전달하여, 최근 선호 스타일 반영 없이 일반적인 추천 큐레이션만 진행

[Answer]: C

## Question 3

Spotify API 호출 시 토큰 만료(401) 외의 오류(예: Rate Limit 429, API Server Down 5xx 등)는 어떻게 대응할까요?

A) 사용자에게는 간소화된 오류 코드(`error=spotify_api_error`)를 담아 홈으로 리다이렉트하거나 오류 토스트를 노출하고, 서버에는 에러 스택을 상세히 로깅

B) 빈 트랙 리스트를 반환하여 오류가 나도 큐레이션 단계를 억지로 강행하고 사용자에게는 경고만 표시

C) 오류 발생 시 별도의 자동 재호출(Retry) 로직을 백엔드에 설계하여 최대 3회 재시도 처리

[Answer]: A

## 승인

모든 질문에 답한 뒤, 이 U-003 Functional Design 계획을 승인할지 표시해 주세요.

A) 승인하고 U-003 Functional Design 산출물 생성을 진행

B) 계획 수정을 요청

[Answer]: A
