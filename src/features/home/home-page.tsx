"use client";

import { useState } from "react";

interface HomePageProps {
  isAuthenticated?: boolean;
}

interface CurationTrack {
  id: string;
  uri: string;
  title: string;
  artistName: string;
}

interface CurationResult {
  title: string;
  description: string;
  tracks: CurationTrack[];
}

export function HomePage({ isAuthenticated = false }: HomePageProps) {
  const [prompt, setPrompt] = useState("퇴근길에 들을 수 있는 차분하지만 리듬감 있는 playlist");
  const [isLoading, setIsLoading] = useState(false);
  const [curationResult, setCurationResult] = useState<CurationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPlaylistId, setSavedPlaylistId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    window.location.href = "/api/spotify/logout";
  };

  const handleCurate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setCurationResult(null);
    setSavedPlaylistId(null);
    setError(null);

    try {
      const res = await fetch("/api/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: prompt }),
      });

      if (!res.ok) {
        throw new Error("Curation request failed");
      }

      const data = await res.json();
      setCurationResult(data);
    } catch (e) {
      console.error(e);
      setError("큐레이션 생성에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!curationResult) return;
    setIsSaving(true);
    setError(null);

    try {
      const trackUris = curationResult.tracks.map((t) => t.uri);
      const res = await fetch("/api/spotify/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: curationResult.title,
          description: curationResult.description,
          trackUris,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save playlist");
      }

      const data = await res.json();
      setSavedPlaylistId(data.playlistId);
    } catch (e) {
      console.error(e);
      setError("Spotify 저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -right-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          
          {/* Left panel: Info and Curation Action */}
          <div className="space-y-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                Spotify AI Curator v1.0
              </span>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                분위기 맞춤형 AI 플레이리스트
              </h1>
              <p className="max-w-xl text-lg text-slate-400 leading-relaxed">
                현재 느끼는 감정이나 분위기를 자연어로 입력하면, 최근 나의 Spotify 감상 기록을 반영해 어울리는 곡들을 선정하고 나만의 플레이리스트로 저장합니다.
              </p>
            </div>

            {/* Prompt Form or Login prompt */}
            {isAuthenticated ? (
              <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="curation-prompt" className="text-sm font-semibold text-slate-200">
                      원하는 분위기를 상세히 말해주세요
                    </label>
                    <span 
                      className="text-xs text-emerald-400 font-medium"
                      data-testid="home-status-connected"
                    >
                      ● Spotify 연결됨
                    </span>
                  </div>
                  <textarea
                    id="curation-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                    className="min-h-[100px] w-full rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition resize-none disabled:opacity-50"
                    placeholder="예: 비오는 날 밤에 드라이브하며 듣기 좋은 로파이 음악"
                    data-testid="home-prompt-preview-textarea"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleCurate}
                    disabled={isLoading || !prompt.trim()}
                    className="flex-1 sm:flex-initial inline-flex h-12 items-center justify-center rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 transition disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-emerald-500/10"
                    type="button"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        큐레이팅 진행 중...
                      </span>
                    ) : "플레이리스트 생성"}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 px-5 text-sm font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition active:bg-slate-900"
                    data-testid="home-disconnect-spotify-button"
                    type="button"
                  >
                    연결 해제 (로그아웃)
                  </button>
                </div>

                {error && (
                  <p className="text-xs text-rose-400 mt-2 font-medium bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                    ⚠️ {error}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    window.location.href = "/api/spotify/login";
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 transition shadow-lg shadow-emerald-500/10"
                  data-testid="home-connect-spotify-button"
                  type="button"
                >
                  Spotify로 연동하여 시작
                </button>
                <button
                  onClick={() => {
                    setPrompt("퇴근길에 들을 수 있는 차분하지만 리듬감 있는 playlist");
                    setCurationResult({
                      title: "Neon Evening Reset",
                      description: "하루를 내려놓는 부드러운 비트와 선명한 멜로디를 중심으로 만든 저녁용 playlist 초안입니다.",
                      tracks: [
                        { id: "mock-1", uri: "spotify:track:1", title: "Stay", artistName: "The Kid LAROI, Justin Bieber" },
                        { id: "mock-2", uri: "spotify:track:2", title: "Coffee", artistName: "beabadoobee" },
                        { id: "mock-3", uri: "spotify:track:3", title: "Comethru", artistName: "Jeremy Zucker" },
                      ]
                    });
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 px-5 text-sm font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition"
                  data-testid="home-preview-flow-button"
                  type="button"
                >
                  미리보기 흐름 가동
                </button>
              </div>
            )}
          </div>

          {/* Right panel: Curation Results & Actions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl shadow-2xl space-y-6">
            
            {/* Curation state display */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                <div className="relative flex items-center justify-center">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-500" />
                  <span className="absolute text-emerald-400 font-bold">AI</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-200">AI 플레이리스트 조율 중</h3>
                  <p className="text-xs text-slate-500 max-w-[280px]">
                    사용자 감정과 최근 재생한 Spotify 선곡 데이터를 혼합 분석하고 있습니다. 잠시만 기다려주세요.
                  </p>
                </div>
              </div>
            ) : curationResult ? (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase">
                    AI Curated Result
                  </span>
                  <h2 className="mt-1 text-2xl font-bold text-white leading-tight">
                    {curationResult.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    {curationResult.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    추천 트랙 목록 ({curationResult.tracks.length}곡)
                  </h4>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 pr-1 space-y-1">
                    {curationResult.tracks.map((track, i) => (
                      <div key={track.id || i} className="flex items-center gap-3 py-2.5">
                        <span className="w-5 text-xs text-slate-600 font-semibold text-center">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-200 truncate">{track.title}</p>
                          <p className="text-xs text-slate-500 truncate">{track.artistName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Curation Action */}
                {isAuthenticated && (
                  <div className="pt-2 border-t border-slate-800/80">
                    {savedPlaylistId ? (
                      <div className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/20 text-center space-y-3">
                        <p className="text-sm font-semibold text-emerald-400">
                          🎉 Spotify 계정에 저장 완료!
                        </p>
                        <a
                          href={`https://open.spotify.com/playlist/${savedPlaylistId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                        >
                          Spotify 앱에서 열기
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full inline-flex h-11 items-center justify-center rounded-xl bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 transition disabled:opacity-50"
                        type="button"
                      >
                        {isSaving ? "Spotify에 저장하는 중..." : "이 플레이리스트를 내 Spotify에 저장"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <svg className="h-10 w-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="mt-3 text-sm font-medium">분위기를 입력하면 완성본이 여기에 표시됩니다</p>
              </div>
            )}
          </div>
          
        </div>
      </section>
    </main>
  );
}
