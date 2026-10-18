function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-white/[0.07] ${className}`}
    />
  );
}

export function MarketDashboardSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading market dashboard"
      className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-8 text-slate-100 sm:px-6 lg:px-8"
    >
      <span className="sr-only">Loading live market data…</span>
      <section>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-32" />
            <SkeletonBlock className="h-10 w-64 max-w-full" />
            <SkeletonBlock className="h-4 w-80 max-w-full" />
          </div>
          <SkeletonBlock className="h-9 w-40 rounded-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={index}
              className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5"
            >
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="mt-6 h-7 w-40" />
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-3 w-36" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <article
              key={index}
              className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-4"
            >
              <SkeletonBlock className="h-9 w-36" />
              <SkeletonBlock className="mt-5 h-4 w-full" />
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
        <article className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5 sm:p-6">
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="mt-8 h-56 w-full sm:h-72" />
        </article>
        <article className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5 sm:p-6">
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="mt-6 h-24 w-full" />
        </article>
      </section>

      <section className="mt-8 rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-9 w-64" />
        </div>
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBlock key={index} className="h-10 w-full" />
          ))}
        </div>
      </section>
    </main>
  );
}
