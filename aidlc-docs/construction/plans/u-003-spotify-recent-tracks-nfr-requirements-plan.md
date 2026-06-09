# U-003 최근 재생 곡 연동 NFR Requirements 계획

<!-- markdownlint-disable MD013 MD053 -->

## 목적

U-003의 최근 재생 곡 연동을 구현하기 위한 비기능 요구사항과 기술 결정을 정리한다. API 호출 신뢰성, 타임아웃, 예외 처리 설계 및 모킹(Mocking) 범위 정의를 목표로 한다.

## 실행 체크리스트

- [x] U-003 Functional Design의 정제 규칙 및 예외 처리 흐름을 검토한다.
- [x] Spotify API 호출 제한시간(Timeout) 및 장애 감지 요구사항을 정의한다.
- [x] 429 Rate Limit 및 기타 5xx API 에러 발생 시 처리 정책을 수립한다.
- [x] Vitest 및 Mock fetch를 활용한 테스트 신뢰성 요구사항을 정의한다.
- [x] 기술 결정을 스펙 문서화한다.
- [x] `aidlc-docs/construction/u-003-spotify-recent-tracks/nfr-requirements/nfr-requirements.md`를 생성한다.
- [x] `aidlc-docs/construction/u-003-spotify-recent-tracks/nfr-requirements/tech-stack-decisions.md`를 생성한다.
- [x] 완료 후 이 계획의 체크박스를 즉시 갱신한다.

## 기본 판단

- 외부 API 통신 지연에 대응하기 위해 명시적 타임아웃(Timeout) 제약을 둔다.
- 401 오류는 백엔드 내에서 1회 자동 갱신(AuthService 연동) 및 재시도를 강제한다.
- 429 Rate Limit 등에 대해 상세 에러 스택을 남기며, 브라우저 스크립트에는 원본 스택 정보를 제공하지 않는다.

## 확인 질문

아래 질문의 `[Answer]:` 뒤에 선택지 문자를 적어 주세요. 선택지가 맞지 않으면 `X) Other`를 선택하고 설명을 덧붙여 주세요.

## Question 1

최근 재생 곡 데이터를 가져올 때 Spotify API 연동에서의 제한 시간(Timeout) 제약은 어떻게 둘까요?

A) Route Handler 레벨에서 최대 5초 타임아웃을 두고, 초과 시 타임아웃 오류 처리하여 사용자 지연을 방어

B) 10초 이상의 긴 타임아웃을 적용하여 API 응답이 느려도 데이터 확보를 최우선으로 시도

C) 타임아웃 제약 없이 브라우저/서버 기본값(보통 30초)을 유지

[Answer]: A

## Question 2

외부 API가 에러 상태(예: 429 Rate Limit)가 되었을 때의 서킷 브레이크 혹은 임시 캐싱 전략을 도입할까요?

A) MVP이므로 복잡한 캐싱/서킷은 제외하고, API 호출 실패 시 즉시 예외 파라미터를 노출하여 홈 화면으로 돌려보내는 기본 제약을 유지

B) 최근 재생 목록 응답 결과를 최대 1분간 인메모리에 임시 캐싱하여 동일 사용자 요청 시 Spotify Web API 재호출 부하를 경감

[Answer]: A

## 승인

모든 질문에 답한 뒤, 이 U-003 NFR Requirements 계획을 승인할지 표시해 주세요.

A) 승인하고 U-003 NFR Requirements 산출물 생성을 진행

B) 계획 수정을 요청

[Answer]: A
