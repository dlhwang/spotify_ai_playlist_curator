import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/server/services/auth-service";
import { SpotifyService } from "@/server/services/spotify-service";
import { LlmClient } from "@/server/services/llm-client";
import { Track } from "@/domain/track";
import { CurationSpecs, CurationValidationIssue, ProceduralCurationResult } from "@/domain/curation";
import { MappedTrack } from "@/domain/search";

type CurationProgressStage =
  | "recentTracks"
  | "specExtraction"
  | "searchPlanning"
  | "candidateSearch"
  | "candidateEvaluation"
  | "artistExpansion"
  | "finalCuration"
  | "fallback"
  | "complete";

interface CurationProgressEvent {
  type: "progress";
  stage: CurationProgressStage;
  message: string;
  detail?: string;
  progress: number;
}

interface CurationResultEvent {
  type: "result";
  data: ProceduralCurationResult;
  progress: 100;
}

interface CurationErrorEvent {
  type: "error";
  error: string;
  message: string;
}

type CurationStreamEvent = CurationProgressEvent | CurationResultEvent | CurationErrorEvent;
type CookieStore = Awaited<ReturnType<typeof cookies>>;
type ProgressReporter = (event: CurationProgressEvent) => void;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const authService = new AuthService();
    const spotifyService = new SpotifyService(authService);

    // 1. 세션 쿠키 검증
    const session = authService.getSession(cookieStore);
    if (!session) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 }
      );
    }

    // 2. 바디 데이터 파싱
    let userPrompt = "";
    let streamProgress = false;
    try {
      const body = await request.json();
      userPrompt = body.userPrompt || "";
      streamProgress = body.streamProgress === true;
    } catch (e) {
      console.warn("Failed to parse request body JSON, using empty prompt instead", e);
      userPrompt = "";
    }

    const acceptsStream = request.headers.get("accept")?.includes("application/x-ndjson") ?? false;

    // 3. Curation API Key 설정 및 LlmClient 실행
    const apiKey = process.env.LLM_API_KEY;
    const llmClient = new LlmClient(apiKey);

    if (streamProgress || acceptsStream) {
      return createCurationProgressStream({
        cookieStore,
        spotifyService,
        llmClient,
        userPrompt,
      });
    }

    const curation = await runProceduralCuration({
      cookieStore,
      spotifyService,
      llmClient,
      userPrompt,
    });

    return NextResponse.json(curation);
  } catch (error) {
    console.error("Curation handler failed unexpectedly:", error);
    return NextResponse.json(
      { error: "curation_failed" },
      { status: 500 }
    );
  }
}

async function runProceduralCuration({
  cookieStore,
  spotifyService,
  llmClient,
  userPrompt,
  reportProgress,
}: {
  cookieStore: CookieStore;
  spotifyService: SpotifyService;
  llmClient: LlmClient;
  userPrompt: string;
  reportProgress?: ProgressReporter;
}): Promise<ProceduralCurationResult> {
  reportProgress?.({
    type: "progress",
    stage: "recentTracks",
    message: "최근 감상 이력을 불러오고 있어요.",
    detail: "Spotify에서 사용자의 최근 재생 트랙을 확인합니다.",
    progress: 10,
  });

  // Spotify 최근 재생 트랙 조회 (실패 시 빈 리스트로 복원력을 유지하여 무중단 큐레이션 수행)
  let recentTracks: Track[] = [];
  try {
    recentTracks = await spotifyService.getRecentlyPlayedTracks(cookieStore);
  } catch (spotifyError) {
    console.warn("Failed to get recently played tracks, proceeding curation with empty tracks", spotifyError);
    recentTracks = [];
  }

  // 절차형 RAG 큐레이션 수행
  try {
    reportProgress?.({
      type: "progress",
      stage: "specExtraction",
      message: "프롬프트를 3가지 SPEC으로 나누고 있어요.",
      detail: "장르/감성, 장소/상황, 아티스트/곡 단서를 분리합니다.",
      progress: 24,
      });
      const specs = await llmClient.extractCurationSpecs(userPrompt, recentTracks);

    reportProgress?.({
      type: "progress",
      stage: "searchPlanning",
      message: "Spotify Search용 검색 라운드를 설계하고 있어요.",
      detail: "각 SPEC을 실제 검색 query 묶음으로 변환합니다.",
      progress: 38,
    });
    const searchPlan = await llmClient.createSearchPlan(specs, recentTracks);

    reportProgress?.({
      type: "progress",
      stage: "candidateSearch",
      message: "실존 트랙 후보를 Spotify에서 찾고 있어요.",
      detail: "여러 query와 offset으로 후보군을 넓게 수집합니다.",
      progress: 52,
      });
    const primaryCandidates = filterTracksByLineupConstraints(
      await spotifyService.searchTracksByQueryRounds(cookieStore, searchPlan),
      specs
    );

    reportProgress?.({
      type: "progress",
      stage: "candidateEvaluation",
      message: "후보군이 요청한 분위기를 충분히 덮는지 점검하고 있어요.",
      detail: `${primaryCandidates.length}개 1차 후보를 기준으로 부족한 단서를 찾습니다.`,
      progress: 66,
    });
    const coverage = await llmClient.evaluateCandidateCoverage(specs, primaryCandidates);
    const artistDepthTargets = filterArtistDepthTargetsByLineupConstraints(
      coverage.artistDepthTargets,
      specs
    );

    reportProgress?.({
      type: "progress",
      stage: "artistExpansion",
      message: "아티스트별 곡 수를 보강하고 있어요.",
      detail: "가능하면 한 아티스트당 최소 3곡 후보가 나오도록 추가 검색합니다.",
      progress: 78,
    });
    const expandedCandidates = filterTracksByLineupConstraints(
      await spotifyService.expandArtistDepthCandidates(cookieStore, artistDepthTargets),
      specs
    );
    const candidates = deduplicateTracks([...primaryCandidates, ...expandedCandidates]);

    if (candidates.length === 0) {
      reportProgress?.({
        type: "progress",
        stage: "fallback",
        message: "검색 후보가 부족해 최근 감상 이력으로 임시 큐레이션을 만들고 있어요.",
        progress: 92,
      });
      return createFallbackResult(recentTracks);
    }

    reportProgress?.({
      type: "progress",
      stage: "finalCuration",
      message: "수집한 실존 후보 중 최종 플레이리스트를 고르고 있어요.",
      detail: `${candidates.length}개 후보에서 흐름과 중복을 조정합니다.`,
      progress: 90,
    });
    const curation = await llmClient.curateWithExpandedCandidates(
      userPrompt,
      specs,
      candidates,
      recentTracks
    );

    reportProgress?.({
      type: "progress",
      stage: "complete",
      message: isStrictLineupMode(specs)
        ? "라인업 제약과 중복을 검증하고 있어요."
        : "큐레이션을 마무리하고 있어요.",
      progress: 96,
    });

    return validateAndRepairCuration(curation, specs, candidates);
  } catch (ragError) {
    console.warn("Procedural RAG curation failed, falling back to recent tracks:", ragError);
    reportProgress?.({
      type: "progress",
      stage: "fallback",
      message: "AI 큐레이션이 잠시 막혀 최근 감상 이력 기반으로 복구하고 있어요.",
      progress: 92,
    });
    return createFallbackResult(recentTracks);
  }
}

function filterArtistDepthTargetsByLineupConstraints(
  targets: Array<{ artistName: string; requestedMinimum: number; queries: string[] }>,
  specs: CurationSpecs
) {
  if (!isStrictLineupMode(specs)) {
    return targets;
  }

  return targets.filter((target) => isAllowedArtist(target.artistName, specs));
}

function filterTracksByLineupConstraints(tracks: MappedTrack[], specs: CurationSpecs): MappedTrack[] {
  if (!isStrictLineupMode(specs)) {
    return tracks;
  }

  return tracks.filter((track) => isAllowedArtist(track.artistName, specs));
}

function validateAndRepairCuration(
  curation: ProceduralCurationResult,
  specs: CurationSpecs,
  candidates: MappedTrack[]
): ProceduralCurationResult {
  const seen = new Set<string>();
  const hardConstraintViolations: CurationValidationIssue[] = [];
  const repairActions: CurationValidationIssue[] = [];
  const repairedTracks: MappedTrack[] = [];

  for (const track of curation.tracks) {
    const key = track.id || track.uri;
    if (!key || !track.uri?.startsWith("spotify:track:")) {
      const issue = {
        type: "missing_spotify_uri" as const,
        trackId: track.id,
        artistName: track.artistName,
        reason: "Spotify track URI가 없어 최종 결과에서 제거했습니다.",
      };
      hardConstraintViolations.push(issue);
      repairActions.push(issue);
      continue;
    }

    if (seen.has(key)) {
      const issue = {
        type: "duplicate_track" as const,
        trackId: track.id,
        artistName: track.artistName,
        reason: "중복 트랙이라 최종 결과에서 제거했습니다.",
      };
      hardConstraintViolations.push(issue);
      repairActions.push(issue);
      continue;
    }

    if (isStrictLineupMode(specs) && !isAllowedArtist(track.artistName, specs)) {
      const issue = {
        type: "artist_not_allowed" as const,
        trackId: track.id,
        artistName: track.artistName,
        reason: "라인업 allowlist에 없는 아티스트라 최종 결과에서 제거했습니다.",
      };
      hardConstraintViolations.push(issue);
      repairActions.push(issue);
      continue;
    }

    seen.add(key);
    repairedTracks.push(track);
  }

  const fallbackTracks = repairedTracks.length > 0
    ? repairedTracks
    : selectRepairTracks(candidates, specs);

  if (repairedTracks.length === 0 && fallbackTracks.length > 0) {
    repairActions.push({
      type: "artist_not_allowed",
      reason: "검증 후 남은 트랙이 없어 검증된 후보군에서 축소 결과를 재구성했습니다.",
    });
  }

  const coverageWarnings = buildCoverageWarnings(fallbackTracks, specs);

  return {
    ...curation,
    description: repairActions.length > 0
      ? `${curation.description} 일부 트랙은 검증 단계에서 제외되거나 검증된 후보로 대체되었습니다.`
      : curation.description,
    tracks: fallbackTracks,
    artistDepthNotes: curation.artistDepthNotes,
    validation: {
      passed: validateRepairedTracks(fallbackTracks, specs),
      hardConstraintViolations,
      coverageWarnings,
      repairActions,
    },
  };
}

function selectRepairTracks(candidates: MappedTrack[], specs: CurationSpecs): MappedTrack[] {
  return filterTracksByLineupConstraints(candidates, specs).slice(0, 30);
}

function buildCoverageWarnings(tracks: MappedTrack[], specs: CurationSpecs): CurationValidationIssue[] {
  const artistCounts = new Map<string, number>();
  for (const track of tracks) {
    artistCounts.set(track.artistName, (artistCounts.get(track.artistName) || 0) + 1);
  }

  return Array.from(artistCounts.entries())
    .filter(([, selectedCount]) => selectedCount < 3)
    .map(([artistName, selectedCount]) => ({
      type: "artist_depth_shortage" as const,
      artistName,
      reason: isStrictLineupMode(specs)
        ? `라인업 내 Spotify 후보 중 ${artistName}의 선택 곡이 ${selectedCount}곡입니다.`
        : `Spotify 후보 중 ${artistName}의 선택 곡이 ${selectedCount}곡입니다.`,
    }));
}

function validateRepairedTracks(tracks: MappedTrack[], specs: CurationSpecs): boolean {
  if (tracks.length === 0) {
    return false;
  }

  return tracks.every((track) => {
    const hasUri = track.uri?.startsWith("spotify:track:");
    const allowed = !isStrictLineupMode(specs) || isAllowedArtist(track.artistName, specs);
    return hasUri && allowed;
  });
}

function isStrictLineupMode(specs: CurationSpecs): boolean {
  return specs.constraints?.mode === "lineup"
    && specs.constraints.lineupConstraint === "strict"
    && (specs.constraints.allowedArtists?.length || 0) > 0;
}

function isAllowedArtist(artistName: string, specs: CurationSpecs): boolean {
  const allowedArtists = specs.constraints?.allowedArtists || [];
  const aliases = specs.constraints?.allowedArtistAliases || {};
  const normalizedArtistName = normalizeArtistName(artistName);
  const allowedNames = allowedArtists.flatMap((allowedArtist) => [
    allowedArtist,
    ...(aliases[allowedArtist] || []),
  ]);

  return allowedNames.some((allowedName) => {
    const normalizedAllowedName = normalizeArtistName(allowedName);
    return normalizedArtistName === normalizedAllowedName
      || normalizedArtistName.includes(normalizedAllowedName)
      || normalizedAllowedName.includes(normalizedArtistName);
  });
}

function normalizeArtistName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\s._\-!！"'`’‘“”()[\]{}]+/g, "")
    .trim();
}

function createCurationProgressStream({
  cookieStore,
  spotifyService,
  llmClient,
  userPrompt,
}: {
  cookieStore: CookieStore;
  spotifyService: SpotifyService;
  llmClient: LlmClient;
  userPrompt: string;
}) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: CurationStreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        const curation = await runProceduralCuration({
          cookieStore,
          spotifyService,
          llmClient,
          userPrompt,
          reportProgress: send,
        });

        send({
          type: "result",
          data: curation,
          progress: 100,
        });
      } catch (error) {
        console.error("Curation progress stream failed unexpectedly:", error);
        send({
          type: "error",
          error: "curation_failed",
          message: "큐레이션 진행 중 오류가 발생했습니다. 다시 시도해 주세요.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

function deduplicateTracks(tracks: MappedTrack[]): MappedTrack[] {
  const seen = new Set<string>();
  const deduplicated: MappedTrack[] = [];

  for (const track of tracks) {
    const key = track.id || track.uri;
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduplicated.push(track);
  }

  return deduplicated;
}

function createFallbackResult(recentTracks: Track[]): ProceduralCurationResult {
  return {
    title: "AI Curated Playlist",
    description: "AI 큐레이션 처리에 일시적인 오류가 발생하여, 사용자의 최근 재생 곡 목록을 기반으로 임시 구성된 플레이리스트입니다.",
    tracks: recentTracks.slice(0, 30).map((track) => ({
      id: track.id,
      uri: track.uri,
      title: track.title,
      artistName: track.artistName,
    })),
  };
}
