# U-002 Spotify Auth Session NFR Requirements 계획

<!-- markdownlint-disable MD013 MD053 -->

## 목적

U-002의 OAuth, HttpOnly cookie session, token refresh contract에 필요한
비기능 요구사항과 기술 결정을 정리한다. Security Baseline 확장은 적용하지
않지만 token 비노출, cookie 보안 속성, 오류 정보 최소화는 필수 제약으로 둔다.

## 실행 체크리스트

- [ ] U-002 Functional Design의 token/session 규칙을 검토한다.
- [ ] cookie 보안 속성과 session 무결성 요구사항을 정의한다.
- [ ] OAuth callback reliability와 대표 오류 처리 요구사항을 정의한다.
- [ ] token refresh 성능 및 실패 처리 요구사항을 정의한다.
- [ ] 테스트 가능성과 mock Spotify token endpoint 요구사항을 정의한다.
- [ ] 기술 스택 결정을 문서화한다.
- [ ] `aidlc-docs/construction/u-002-spotify-auth-session/nfr-requirements/nfr-requirements.md`를 생성한다.
- [ ] `aidlc-docs/construction/u-002-spotify-auth-session/nfr-requirements/tech-stack-decisions.md`를 생성한다.
- [ ] 완료 후 이 계획의 체크박스를 즉시 갱신한다.

## 기본 판단

- session payload는 최소 서명되어야 한다.
- 가능한 경우 암호화 가능한 구조로 설계한다.
- cookie는 HttpOnly, SameSite=Lax, production Secure를 사용한다.
- token은 client 응답과 client bundle에 노출하지 않는다.

## 확인 질문

아래 질문의 `[Answer]:` 뒤에 선택지 문자를 적어 주세요. 선택지가 맞지 않으면
`X) Other`를 선택하고 설명을 덧붙여 주세요.

## Question 1

session cookie payload 보호 방식은 어떻게 잡을까요?

A) MVP에서는 HMAC 서명으로 무결성을 보장하고 암호화는 후속 개선 후보로 둠

B) MVP부터 AES-GCM 같은 대칭 암호화와 HMAC 또는 authenticated encryption 적용

C) 구현 단순화를 위해 base64 JSON만 사용

X) Other (please describe after [Answer]: tag below)

[Answer]:

## Question 2

session cookie 수명은 어떤 방향으로 설계할까요?

A) Spotify refresh token이 있으므로 명시적 maxAge를 길게 두고 refresh 중심

B) 짧은 maxAge를 두고 자주 재인증을 요구

C) MVP에서는 browser session cookie로 두고 만료는 token expiresAt 중심 처리

X) Other (please describe after [Answer]: tag below)

[Answer]:

## Question 3

OAuth callback 오류와 token exchange 실패는 관측성을 어디까지 둘까요?

A) 사용자에게는 대표 오류만, server log에는 원인 category만 남김

B) 사용자와 server log 모두 상세 Spotify error를 남김

C) MVP에서는 logging 없이 오류 응답만 처리

X) Other (please describe after [Answer]: tag below)

[Answer]:

## 승인

모든 질문에 답한 뒤, 이 U-002 NFR Requirements 계획을 승인할지 표시해
주세요.

A) 승인하고 U-002 NFR Requirements 산출물 생성을 진행

B) 계획 수정을 요청

X) Other (please describe after [Answer]: tag below)

[Answer]:
