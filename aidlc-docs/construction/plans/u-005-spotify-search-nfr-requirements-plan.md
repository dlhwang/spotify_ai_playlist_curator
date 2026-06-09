# U-005 Spotify Search NFR Requirements 계획

<!-- markdownlint-disable MD013 MD053 -->

## 목적

U-005 Spotify Search API 연동 및 트랙 매핑을 구현하기 위한 비기능 요구사항(NFR)과 기술 결정을 수립한다. 다중 트랙 검색의 효율성 확보, 외부 API 제한 대처, 로컬 모킹 지원 및 테스트 신뢰성 확보를 목표로 한다.

## 실행 체크리스트

- [x] U-005 Functional Design의 트랙 매핑 및 예외 처리 흐름을 검토한다.
- [x] Spotify Search API 다중 호출 시의 비동기 병렬화 및 개별/전체 타임아웃 요구사항을 정의한다.
- [x] Spotify Search API의 429(Rate Limit) 및 일시적 오류에 대한 복원력 정책을 수립한다.
- [x] 로컬 개발 및 Credential 부재 시 시뮬레이션을 위한 Mock Search 연동 요구사항을 정의한다.
- [x] Vitest 및 MSW(또는 Mock fetch)를 활용한 단위/통합 테스트 신뢰성 요구사항을 정의한다.
- [x] `aidlc-docs/construction/u-005-spotify-search/nfr-requirements/nfr-requirements.md`를 생성한다.
- [x] `aidlc-docs/construction/u-005-spotify-search/nfr-requirements/tech-stack-decisions.md`를 생성한다.
- [x] 완료 후 이 계획의 체크박스를 즉시 갱신한다.

## 기본 판단

- 다중 곡 검색 시 성능 지연을 방지하기 위해 `Promise.all` 기반 병렬 처리를 수행하되, 개별 호출당 5초 타임아웃을 설정한다.
- 특정 곡의 검색 실패(404, 500, 혹은 타임아웃 등)는 개별 로그를 남긴 후 스킵 처리하여 전체 큐레이션 매핑이 중단되지 않도록 복원력을 보장한다.
- Spotify API 인증용 클라이언트 ID/시크릿이 없거나 환경 변수 설정에 따라 로컬 시뮬레이션용 Mock Search 모드를 제공한다.

## 확인 질문

아래 질문의 `[Answer]:` 뒤에 선택지 문자를 적어 주세요. 선택지가 맞지 않으면 `X) Other`를 선택하고 설명을 덧붙여 주세요.

## Question 1

AI가 추천한 여러 개의 트랙(보통 5~10곡)을 Spotify Search API로 검색할 때, API 호출 병렬성 및 타임아웃 처리는 어떻게 구성할까요?

A) **(추천)** MVP 규모(5~10곡 내외)를 고려하여 단순하고 빠른 병렬 처리(`Promise.all`)를 적용하고, 각 곡당 5초 개별 타임아웃을 적용하여 전체 응답 지연을 방지한다.
B) API 호출 제한 방지를 위해 순차적(직렬)으로 비동기 처리를 수행하여 안전성을 높인다. (응답 시간이 다소 늘어날 수 있음)

[Answer]: A

## Question 2

로컬 개발 및 테스트 편의성을 위한 Mock Search(가짜 검색) 지원 정책은 어떻게 할까요?

A) **(추천)** Spotify API Credential이 입력되지 않았거나 로컬 모드일 때, 실제 Spotify API를 호출하는 대신 입력된 곡명을 기반으로 가짜 Spotify URI를 100% 매핑하여 성공 처리하는 Mock Search 모드를 지원한다.
B) 별도의 Mock Search 모드를 두지 않고 실제 Spotify API만 호출하도록 강제하며, 자격 증명이 없을 때는 즉각 오류를 반환한다.

[Answer]: A

## 승인

모든 질문에 답한 뒤, 이 U-005 NFR Requirements 계획을 승인할지 표시해 주세요.

A) 승인하고 U-005 NFR Requirements 산출물 생성을 진행
B) 계획 수정을 요청

[Answer]: A
