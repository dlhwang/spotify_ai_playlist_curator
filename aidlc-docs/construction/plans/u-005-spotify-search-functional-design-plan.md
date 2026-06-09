# U-005 Spotify Search API 연동 및 트랙 매핑 Functional Design 계획

<!-- markdownlint-disable MD013 MD053 -->

## 목적

U-005는 AI 큐레이션 엔진이 추천한 텍스트 기반 트랙(곡 제목, 아티스트명)을 Spotify Search API를 호출하여 실제 Spotify URI(예: `spotify:track:xxxx`)로 정밀 매핑하는 기능의 비즈니스 룰 및 도메인 설계를 정리합니다.

## 실행 체크리스트

- [ ] AI 추천 텍스트를 이용해 Spotify Search API를 조회하는 쿼리 조합 전략 및 실패 완화 정책을 검토한다.
- [ ] 검색 결과가 없을 때의 비즈니스 규칙(생략 혹은 최근 곡 대체 등)을 검토한다.
- [ ] `aidlc-docs/construction/u-005-spotify-search/functional-design/business-logic-model.md`를 생성한다.
- [ ] `aidlc-docs/construction/u-005-spotify-search/functional-design/business-rules.md`를 생성한다.
- [ ] `aidlc-docs/construction/u-005-spotify-search/functional-design/domain-entities.md`를 생성한다.
- [ ] 완료 후 이 계획의 체크박스를 즉시 갱신한다.

## 기본 판단

- Spotify Search API(`GET /v1/search`)를 호출하여 `type=track&limit=1`로 정확도 높은 검색 매칭을 수행합니다.
- 외부 API 통신 실패에 유연하게 대응하기 위해 5초 타임아웃을 설정하고 예외 흐름을 차단하도록 설계합니다.
- 최종적으로 획득한 Spotify URI 매핑 목록을 이용하여 플레이리스트를 생성(U-006)할 준비 단계를 마칩니다.

## 확인 질문

아래 질문의 `[Answer]:` 뒤에 선택지 문자를 적어 주세요. 선택지가 맞지 않으면 `X) Other`를 선택하고 설명을 덧붙여 주세요.

## Question 1

AI가 추천한 텍스트 기반 곡이 Spotify 검색 API에서 결과가 전혀 나타나지 않는 경우, 어떻게 대응하도록 비즈니스 규칙을 정의할까요?

A) (권장) 검색되지 않은 곡은 최종 플레이리스트 후보군에서 제외하고, 검색 성공한 곡들로만 플레이리스트를 구성한다. (깔끔하고 단순함)

B) 무조건 플레이리스트 볼륨(예: 10곡)을 보존하기 위해, 검색 실패 시 사용자의 최근 재생 곡 목록에서 순차적으로 매칭되지 못한 빈 공간을 대체하여 채워 넣는다.

[Answer]: A

## Question 2

검색 정확도 향상과 매칭 다양성을 조화하기 위한 Spotify Search 쿼리 빌딩 전략을 어떻게 적용할까요?

A) (권장) 1차로 `"track:{title} artist:{artist}"` 형식의 엄격한 구조화 필터로 검색하고, 결과가 없으면 2차로 `"{title} {artist}"` 범용 단순 텍스트 조합으로 재검색을 시도하여 관용 매칭 폭을 넓힌다.

B) `"track:{title} artist:{artist}"` 엄격한 필터만 적용하여 조금이라도 정보가 맞지 않는 곡은 과감히 매칭 제외 처리한다. (구현 단순화 우선)

[Answer]: B

## 승인

모든 질문에 답한 뒤, 이 U-005 Functional Design 계획을 승인할지 표시해 주세요.

A) 승인하고 U-005 Functional Design 산출물 생성을 진행

B) 계획 수정을 요청

[Answer]: A
