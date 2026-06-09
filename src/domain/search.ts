export interface MappedTrack {
  /** Spotify track identifier (e.g. "4iV5W9...") */
  id: string;

  /** Spotify resource URI (e.g. "spotify:track:4iV5W9...") */
  uri: string;

  /** Track title */
  title: string;

  /** Primary artist name */
  artistName: string;
}

export interface SearchCurationResult {
  /** 플레이리스트 추천 제목 */
  title: string;

  /** 플레이리스트 추천 설명 */
  description: string;

  /** URI 매핑이 완료된 실제 Spotify 트랙 목록 */
  tracks: MappedTrack[];
}

export interface RawSpotifySearchResponse {
  tracks: {
    items: Array<{
      id: string;
      uri: string;
      name: string;
      artists: Array<{
        name: string;
      }>;
    }>;
  };
}
