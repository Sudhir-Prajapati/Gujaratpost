'use client';

export default function AqiSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-8 font-sans select-none animate-in fade-in duration-300">
      <style>{`
        @keyframes aqi-sk-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .aqi-sk {
          position: relative;
          overflow: hidden;
          background-color: #e5e7eb;
        }
        .dark .aqi-sk {
          background-color: #27272a;
        }
        .aqi-sk::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.65) 50%, transparent 100%);
          animation: aqi-sk-sweep 1.6s ease-in-out infinite;
        }
        .dark .aqi-sk::after {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
        }
      `}</style>

      {/* ── Breadcrumb Navigation Skeleton ── */}
      <div className="flex items-center gap-2">
        <div className="aqi-sk h-3.5 w-20 rounded-md" />
        <span className="text-neutral-300 text-xs">›</span>
        <div className="aqi-sk h-3.5 w-10 rounded-md" />
      </div>

      {/* ── Page Title Skeleton ── */}
      <div className="space-y-2">
        <div className="aqi-sk h-7 sm:h-9 w-64 sm:w-80 rounded-xl" />
      </div>

      {/* ── Tabs & Search Bar Skeleton ── */}
      <div className="space-y-0 relative">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Tabs */}
          <div className="flex items-end gap-1 select-none">
            <div className="h-10 sm:h-12 w-24 sm:w-32 rounded-t-xl sm:rounded-t-2xl bg-white dark:bg-zinc-900 border-t border-x border-neutral-200 dark:border-zinc-800 p-2 flex items-center justify-center gap-2">
              <div className="aqi-sk w-4 h-4 rounded-full" />
              <div className="aqi-sk h-4 w-12 rounded-md" />
            </div>
            <div className="h-9 sm:h-11 w-24 sm:w-32 rounded-t-xl sm:rounded-t-2xl bg-neutral-100 dark:bg-zinc-800/80 border-t border-x border-neutral-200/70 p-2 flex items-center justify-center gap-2">
              <div className="aqi-sk w-3.5 h-3.5 rounded-full" />
              <div className="aqi-sk h-3.5 w-14 rounded-md" />
            </div>
          </div>

          {/* Search Box */}
          <div className="aqi-sk h-8 sm:h-9 w-32 sm:w-64 rounded-xl" />
        </div>

        {/* ── Main Hero Card Skeleton ── */}
        <div className="relative overflow-hidden rounded-b-3xl rounded-tr-3xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-10 shadow-xl -mt-px">
          {/* Subtle dots pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] dark:bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 pt-2 pb-4">
            {/* Left Column: City + Meter Skeleton */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-4">
              {/* City Title */}
              <div className="aqi-sk h-8 sm:h-9 w-36 sm:w-44 rounded-xl" />

              {/* Arc Gauge Skeleton Graphic */}
              <div className="relative w-64 h-36 sm:w-80 sm:h-44 flex items-end justify-center">
                <svg className="w-full h-full" viewBox="0 0 200 115">
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                    strokeLinecap="round"
                    className="dark:stroke-zinc-800"
                  />
                  <path
                    d="M 20 100 A 80 80 0 0 1 100 20"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="16"
                    strokeLinecap="round"
                    className="dark:stroke-zinc-700 animate-pulse"
                  />
                </svg>

                <div className="absolute bottom-2 flex flex-col items-center space-y-1.5">
                  <div className="aqi-sk h-10 sm:h-12 w-20 sm:w-24 rounded-xl" />
                  <div className="aqi-sk h-3.5 w-12 rounded-md" />
                  <div className="aqi-sk h-2.5 w-16 rounded-md" />
                </div>
              </div>
            </div>

            {/* Right Column: Status & PM Values Skeleton */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-start space-y-6">
              <div className="space-y-2 flex flex-col items-center lg:items-start">
                <div className="aqi-sk h-4 w-24 rounded-md" />
                <div className="aqi-sk h-9 w-36 rounded-xl" />
              </div>

              {/* Dual PM 2.5 / PM 10 Box */}
              <div className="bg-white dark:bg-zinc-800 border border-neutral-200/80 dark:border-zinc-700 rounded-2xl p-3 shadow-md flex items-center gap-3 w-full max-w-xs sm:max-w-sm">
                <div className="flex-1 rounded-xl p-3 bg-neutral-50 dark:bg-zinc-900/60 text-center space-y-2">
                  <div className="aqi-sk h-3 w-14 rounded-md mx-auto" />
                  <div className="aqi-sk h-7 w-12 rounded-lg mx-auto" />
                </div>
                <div className="flex-1 rounded-xl p-3 bg-neutral-50 dark:bg-zinc-900/60 text-center space-y-2">
                  <div className="aqi-sk h-3 w-14 rounded-md mx-auto" />
                  <div className="aqi-sk h-7 w-12 rounded-lg mx-auto" />
                </div>
              </div>

              <div className="aqi-sk h-3 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Popular Cities Grid Skeleton ── */}
      <section className="pt-2">
        <div className="aqi-sk h-7 w-56 rounded-xl mx-auto mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-neutral-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center gap-3 shadow-xs"
            >
              <div className="aqi-sk w-10 h-10 rounded-full" />
              <div className="aqi-sk h-4 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Most vs Least Polluted Rankings Skeleton ── */}
      <section className="rounded-[2.5rem] bg-[#F8FAFC] dark:bg-zinc-900/60 p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, idx) => (
            <div
              key={idx}
              className="rounded-[2rem] border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-4"
            >
              <div className="aqi-sk h-7 w-48 rounded-xl mx-auto" />
              <div className="aqi-sk h-10 w-full rounded-xl" />
              <div className="space-y-3 pt-1">
                {[...Array(5)].map((_, row) => (
                  <div key={row} className="flex justify-between items-center py-2 px-3">
                    <div className="aqi-sk h-4 w-8 rounded" />
                    <div className="aqi-sk h-4 w-28 rounded" />
                    <div className="aqi-sk h-4 w-10 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
