# U-002 Spotify Auth Session Functional Design 계획

<!-- markdownlint-disable MD013 MD053 -->

## 목적

U-002는 Spotify OAuth 시작, callback 처리, HttpOnly cookie 기반 session,
인증 상태 조회 Route Handler를 설계한다. 이 단계에서는 상세 business rule,
domain entity, validation, error flow를 문서화한다.

## 실행 체크리스트

- [x] U-002 책임과 story S-001, S-007의 acceptance criteria를 검토한다.
- [x] OAuth authorization URL 생성 규칙을 정의한다.
- [x] OAuth callback 입력, state 검증, 오류 분기를 정의한다.
- [x] HttpOnly cookie session entity와 token 저장 범위를 정의한다.
- [x] 인증 상태 조회 응답 모델을 정의한다.
- [x] 대표 오류와 사용자 재시도 가능 여부를 정의한다.
- [x] `aidlc-docs/construction/u-002-spotify-auth-session/functional-design/business-logic-model.md`를 생성한다.
- [x] `aidlc-docs/construction/u-002-spotify-auth-session/functional-design/business-rules.md`를 생성한다.
- [x] `aidlc-docs/construction/u-002-spotify-auth-session/functional-design/domain-entities.md`를 생성한다.
- [x] 완료 후 이 계획의 체크박스를 즉시 갱신한다.

## 기본 설계 방향

- Route Handler는 `/api/spotify/auth/login`, `/api/spotify/auth/callback`,
  `/api/spotify/auth/session`으로 설계한다.
- session은 HttpOnly cookie를 사용한다.
- token 값은 client에 반환하지 않는다.
- 실제 Spotify token 교환은 U-002에서 구현하되, Spotify API data adapter는
  U-003에서 확장한다.

## 확인 질문

아래 질문의 `[Answer]:` 뒤에 선택지 문자를 적어 주세요. 선택지가 맞지 않으면
`X) Other`를 선택하고 설명을 덧붙여 주세요.

## Question 1

OAuth state 값은 어떻게 관리할까요?

A) 별도 HttpOnly cookie에 state를 저장하고 callback에서 검증

B) signed state payload를 URL에 포함하고 callback에서 서명 검증

C) MVP에서는 state 검증을 생략하고 후속 보안 개선으로 둠

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2

HttpOnly session cookie에는 어떤 token 정보를 담을까요?

A) access token, refresh token, expiresAt을 암호화 또는 서명 가능한 session payload에 포함

B) access token만 담고 refresh token은 MVP에서 사용하지 않음

C) token은 cookie에 직접 담지 않고 서버 메모리에 임시 저장

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3

access token 만료 처리는 U-002에서 어디까지 설계할까요?

A) 만료 시 refresh token으로 갱신하는 AuthService contract까지 포함

B) 만료 여부만 감지하고 재로그인을 요구

C) 만료 처리는 U-003 Spotify API Adapter에서 설계

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4

인증 실패 후 사용자 redirect는 어떤 방식이 좋습니까?

A) 홈으로 redirect하고 query parameter로 대표 오류 코드를 전달

B) JSON 오류 응답만 반환하고 UI가 별도 처리

C) dedicated error page로 redirect

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## 승인

모든 질문에 답한 뒤, 이 U-002 Functional Design 계획을 승인할지 표시해
주세요.

A) 승인하고 U-002 Functional Design 산출물 생성을 진행

B) 계획 수정을 요청

X) Other (please describe after [Answer]: tag below)

[Answer]: A
