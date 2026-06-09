# U-004 Curation Engine / LLM Client NFR Requirements 계획

<!-- markdownlint-disable MD013 MD053 -->

## 목적

U-004의 AI 큐레이션 및 LLM 연동을 구현하기 위한 비기능 요구사항과 기술 결정을 정리한다. API 지연성 방어, 응답 신뢰성 확보, 로컬 테스트 고립 정책 수립을 목표로 한다.

## 실행 체크리스트

- [x] U-004 Functional Design의 프롬프트 조립 및 폴백 규칙을 검토한다.
- [x] LLM API 호출 타임아웃(Timeout) 및 Abort 처리 요구사항을 정의한다.
- [x] 파싱 예외 복원력 및 디폴트 폴백 데이터 안정성 요구사항을 정의한다.
- [x] API Key 누락 시 Mock LLM 응답 연동의 비지니스 규칙을 수립한다.
- [x] Vitest 및 Mock fetch를 활용한 테스트 신뢰성 요구사항을 정의한다.
- [x] `aidlc-docs/construction/u-004-curation-llm/nfr-requirements/nfr-requirements.md`를 생성한다.
- [x] `aidlc-docs/construction/u-004-curation-llm/nfr-requirements/tech-stack-decisions.md`를 생성한다.
- [x] 완료 후 이 계획의 체크박스를 즉시 갱신한다.

## 기본 판단

- LLM API의 평균 지연을 고려하여 성능 타임아웃을 부여하고 AbortController로 통제한다.
- JSON 파싱 예외 포착 시 즉각 오류 응답을 하지 않고 1회 재요청 또는 디폴트 폴백으로 자동 전환한다.
- 로컬 테스트 실행 시 실제 OpenAI/Gemini API 연결을 차단하고 Mocking 상태에서 100% 테스트되도록 보장한다.

## 확인 질문

아래 질문의 `[Answer]:` 뒤에 선택지 문자를 적어 주세요. 선택지가 맞지 않으면 `X) Other`를 선택하고 설명을 덧붙여 주세요.

## Question 1

LLM API 호출에 대한 최대 타임아웃(Timeout) 제약은 어느 정도로 설정할까요?

A) Route Handler 레벨에서 최대 10초 타임아웃을 설정하고, 초과 시 타임아웃 에러를 발생시키며 폴백 처리한다. (가장 합리적인 대기 마지노선)

B) 20초 이상의 긴 타임아웃을 두어 지연이 있어도 대답을 가급적 온전하게 받는다.

C) 타임아웃 제약 없이 기본 브라우저/서버 타임아웃을 유지한다.

[Answer]: A

## Question 2

개발 환경 및 모킹 모드에서 사용할 Mock LLM 데이터 셋의 큐레이션 다양성은 어느 정도로 구성할까요?

A) 유저 프롬프트 키워드에 연동되어 제목/설명 및 추천 트랙 목록이 그럴듯하게 동적으로 변경되도록 설계하여 개발/시연 편의성 확보

B) 단순하게 1~2종의 고정된 정적(static) 더미 데이터만 반환하도록 아주 가볍게 구현

[Answer]: B

## 승인

모든 질문에 답한 뒤, 이 U-004 NFR Requirements 계획을 승인할지 표시해 주세요.

A) 승인하고 U-004 NFR Requirements 산출물 생성을 진행

B) 계획 수정을 요청

[Answer]: A
