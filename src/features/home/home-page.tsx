"use client";

export function HomePage() {
  return (
    <main className="min-h-screen bg-mist text-ink">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-moss">
              Spotify AI Playlist Curator
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                지금 분위기에 맞는 Spotify playlist를 바로 만듭니다.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-neutral-700">
                최근 재생 기록과 자연어 요청을 바탕으로 playlist 제목, 설명,
                전체 분위기 요약을 만들고 Spotify에 저장하는 MVP입니다.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex h-12 items-center justify-center rounded-md bg-moss px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#334b3a] focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
                data-testid="home-connect-spotify-button"
                type="button"
              >
                Spotify로 시작
              </button>
              <button
                className="inline-flex h-12 items-center justify-center rounded-md border border-neutral-300 bg-white px-5 text-sm font-semibold text-ink transition hover:border-moss hover:text-moss focus:outline-none focus:ring-2 focus:ring-moss focus:ring-offset-2"
                data-testid="home-preview-flow-button"
                type="button"
              >
                큐레이션 흐름 보기
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="space-y-4">
              <label
                className="block text-sm font-semibold text-neutral-800"
                htmlFor="curation-prompt-preview"
              >
                원하는 분위기
              </label>
              <textarea
                className="min-h-32 w-full resize-none rounded-md border border-neutral-300 p-3 text-sm leading-6 outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/20"
                data-testid="home-prompt-preview-textarea"
                defaultValue="퇴근길에 들을 수 있는 차분하지만 리듬감 있는 playlist"
                id="curation-prompt-preview"
                readOnly
              />
              <div className="rounded-md bg-mist p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-coral">
                  Preview
                </p>
                <h2 className="mt-2 text-xl font-semibold text-ink">
                  Neon Evening Reset
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-700">
                  하루를 내려놓는 부드러운 비트와 선명한 멜로디를 중심으로
                  만든 저녁용 playlist 초안입니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
