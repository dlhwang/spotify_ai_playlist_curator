# Spotify MCP 검토 메모

## 입력 요약

사용자는 Spotify MCP server README를 공유했고, 이미 fork를 떠 둔 상태라고
알렸다. MCP를 Spotify AI playlist curator MVP에 활용하면 좋을지 검토한다.

## README에서 확인한 기능

- Spotify 검색, 현재 재생 정보, 사용자 playlist, playlist track, 최근 재생,
  좋아요 트랙 조회를 제공한다.
- playlist 생성, track 추가, playlist 수정, track 제거, 순서 변경을 제공한다.
- 재생, 일시정지, queue 추가, 볼륨 조절 같은 playback 제어를 제공한다.
- Node.js 기반 MCP server로 실행되며, Spotify OAuth token을 local
  `spotify-config.json`에 저장하는 흐름을 사용한다.
- Claude Desktop, Cursor, Cline 같은 AI assistant 도구와 연결하는 목적이
  README의 중심이다.

## MVP 요구사항과의 적합성

### 잘 맞는 부분

- playlist 생성과 track 추가 기능은 현재 Story S-006과 직접 관련이 있다.
- liked songs, recently played, playlist tracks 조회는 취향 분석 입력으로
  활용 가능성이 있다.
- MCP tool schema와 Spotify API 호출 분리는 우리 adapter 설계의 참고자료가
  될 수 있다.
- 개발 중 AI assistant를 통해 실제 Spotify 계정으로 빠르게 검색하거나
  playlist 생성 동작을 확인하는 데 유용할 수 있다.

### 조심해야 할 부분

- 현재 MVP는 Next.js + TypeScript + Vercel serverless 앱이다. 별도 장기 실행
  MCP server를 앱 런타임 의존성으로 두면 배포 구조가 복잡해진다.
- README의 인증 흐름은 local config 파일에 token을 저장한다. 사용자-facing
  웹 앱의 다중 사용자 OAuth 흐름과 바로 맞지 않는다.
- playback 제어와 volume 기능은 Spotify Premium 또는 활성 device 제약이
  있으며, 현재 MVP 핵심 목표인 playlist 큐레이션과는 우선순위가 낮다.
- MCP는 AI assistant와 Spotify 사이의 도구 서버에 가깝고, 브라우저 사용자와
  Next.js Route Handler 사이의 public app API를 대체하지 않는다.

## 최종 결정

**MVP에서는 Spotify MCP를 사용하지 않는다.**

이유는 현재 필요한 기능이 Spotify Web API 직접 호출로 충분히 구현 가능하기
때문이다. 별도 MCP server를 두면 인증, 배포, 테스트 경계가 불필요하게
복잡해진다.

fork한 MCP server는 현재 MVP 범위 밖으로 둔다. 향후 AI assistant가 사용자를
대신해 Spotify를 조작하는 별도 기능을 제품 범위에 넣을 때만 재검토한다.

## Workflow Planning 반영 사항

- Application Design에서 `SpotifyApiPort` 또는 유사한 adapter 경계를 둔다.
- Code Generation에서는 앱 런타임이 Spotify Web API를 직접 호출하는 구조를
  우선한다.
- MCP fork는 MVP 필수 build/test gate와 애플리케이션 의존성에 포함하지
  않는다.
- 향후 AI agent가 사용자를 대신해 playlist를 조작하는 기능을 제품 범위에
  넣는다면 MCP 기반 통합을 별도 story 또는 extension으로 재평가한다.
