export interface Track {
  /** Spotify track identifier (e.g. "4iV5W9...") */
  id: string;
  
  /** Spotify resource URI (e.g. "spotify:track:4iV5W9...") */
  uri: string;
  
  /** Track title */
  title: string;
  
  /** Primary artist name */
  artistName: string;
}

export interface CurationInput {
  /** Natural language curation prompt from user */
  userPrompt: string;
  
  /** Deduplicated list of recently played tracks */
  recentTracks: Track[];
}
