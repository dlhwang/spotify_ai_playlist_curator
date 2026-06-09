import { Track } from "./track";

export interface CuratedTrack {
  /** 추천된 곡의 제목 (예: "Stay") */
  title: string;
  
  /** 추천된 곡의 아티스트 이름 (예: "The Kid LAROI") */
  artistName: string;
}

export interface CuratedPlaylist {
  /** 생성할 플레이리스트의 추천 제목 */
  title: string;
  
  /** 생성할 플레이리스트의 추천 설명 */
  description: string;
  
  /** AI가 추천한 텍스트 기반 트랙 리스트 (최대 10~15곡) */
  tracks: CuratedTrack[];
}

/**
 * 큐레이션 실패 시 최근 재생 곡 목록을 기반으로 폴백 플레이리스트를 생성합니다.
 * @param recentTracks 사용자가 전달한 최근 재생 트랙 목록
 */
export function createFallbackPlaylist(recentTracks: Track[]): CuratedPlaylist {
  const tracks: CuratedTrack[] = recentTracks.slice(0, 10).map((track) => ({
    title: track.title,
    artistName: track.artistName,
  }));

  return {
    title: "AI Curated Playlist",
    description: "AI 큐레이션 처리에 일시적인 오류가 발생하여, 사용자의 최근 재생 곡 목록을 기반으로 임시 구성된 플레이리스트입니다.",
    tracks,
  };
}
