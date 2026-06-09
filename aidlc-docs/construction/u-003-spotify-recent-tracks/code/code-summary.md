# U-003 최근 재생 곡 연동 코드 요약

<!-- markdownlint-disable MD013 -->

## 구현 개요

본 단위(U-003)에서는 사용자의 최근 재생 곡 목록을 Spotify API로부터 안전하게 수집하고 정제하는 기능을 구현하였습니다. 5초 타임아웃 제한 및 401 오류 시 백엔드 내부에서의 1회 자동 갱신(AuthService 연동) 및 재시도를 구현하여 신뢰성을 확보하였습니다. 비즈니스 룰에 따라 플레이리스트 생성에 필요한 최소한의 필수 도메인 정보(ID, URI, 곡 제목, 아티스트명)만 추출하여 중복을 제거하며, 최근 재생 곡 이력이 빈 경우에도 무중단으로 동작하도록 설계하였습니다.

## 생성 및 변경된 파일 목록

- **도메인 엔티티**:
  - `src/domain/track.ts`: `Track` 엔티티 및 `CurationInput` 인터페이스 선언
- **비즈니스 서비스**:
  - `src/server/services/spotify-service.ts`: AbortController 기반 5초 타임아웃 제어, 401 오류 시 자동 리프레시 재시도, 중복 제거 및 데이터 최소 추출 정제 로직 구현
  - `src/server/services/spotify-service.test.ts`: 타임아웃 예외 차단, 중복 제거 정제, 401 자동 복구, 빈 이력 대응 시나리오 검증
- **API Route Handler**:
  - `app/api/spotify/tracks/route.ts`: 쿠키 세션 검증 후 최근 재생 곡 도메인 리스트 반환 및 에러 제어

## 제외 범위 및 사유

- **음원 상세 분석 데이터(Audio Features) 수집**: MVP의 플레이리스트 큐레이션 속도와 구현 단순화 제약에 부합하기 위해, 상세 오디오 분석 수집은 제외하고 제목 및 아티스트 텍스트만 최소 추출하도록 설계하였습니다.
- **인메모리/Redis 캐싱**: 큐레이션을 시작하는 최초 진입 시점에는 항상 실시간 최신 재생 이력을 제공하는 것이 최근 재생 취향 반영 요구사항에 충합하며, MVP 경량화를 유지하기 위해 인메모리 임시 캐싱은 배제하였습니다.

## 품질 검증 요약

| Requirement/Story | 검증 증적 |
| :--- | :--- |
| NFR-001 (API Timeout) | AbortController 기반 5초 타임아웃 차단 테스트 통과 |
| NFR-002 (Error Redirection) | 403, 429, 5xx 에러 포착 시 대표 오류 리다이렉트 동작 확인 |
| NFR-003 (Token Retry) | 401 Unauthorized 시 AuthService 자동 리프레시 및 1회 재요청 성공 검증 |
| NFR-004 (Mocking/Testability) | Fetch API/Node-fetch mock을 활용한 로컬 무의존성 검증 성공 |
| S-003 (Recent Tracks Collect) | 최근 재생 곡 리스트 연동 및 중복 곡 필터링 테스트 완수 |
