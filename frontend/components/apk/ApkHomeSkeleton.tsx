'use client';

export default function ApkHomeSkeleton() {
  return (
    <div className="max-w-md mx-auto w-full pb-12 select-none">
      <style>{`
        @keyframes apk-sk-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .apk-sk {
          position: relative;
          overflow: hidden;
          background-color: #e5e7eb;
        }
        .dark .apk-sk {
          background-color: #27272a;
        }
        .apk-sk::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%);
          animation: apk-sk-sweep 1.5s ease-in-out infinite;
        }
        .dark .apk-sk::after {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
        }
      `}</style>

      {/* ── 1. HERO FEATURED CAROUSEL SKELETON ────────────────────────── */}
      <div className="px-3.5 pt-3 pb-2">
        <div className="apk-sk relative aspect-[16/10] sm:aspect-video w-full rounded-2xl p-3.5 flex flex-col justify-between shadow-xs border border-gray-200/70 dark:border-gray-800">
          {/* Top row: VIDEOS badge + 1/5 counter */}
          <div className="flex items-center justify-between z-10">
            <div className="h-5 w-20 rounded-full bg-gray-300/80 dark:bg-gray-700/80" />
            <div className="h-5 w-10 rounded-full bg-gray-300/80 dark:bg-gray-700/80" />
          </div>
          {/* Bottom row: Category tag + 2 title lines */}
          <div className="space-y-2 z-10">
            <div className="h-4 w-14 rounded bg-gray-300/80 dark:bg-gray-700/80" />
            <div className="h-5 w-11/12 rounded bg-gray-300/80 dark:bg-gray-700/80" />
            <div className="h-5 w-4/5 rounded bg-gray-300/80 dark:bg-gray-700/80" />
          </div>
        </div>
      </div>

      {/* ── 2. "ટોપ સમાચાર" (TOP NEWS) SKELETON ─────────────────────────── */}
      <div className="my-2">
        {/* Section Header */}
        <div className="px-3.5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B3121B]/40 animate-pulse" />
            <div className="apk-sk h-4.5 w-28 rounded-md" />
          </div>
          <div className="apk-sk h-3.5 w-16 rounded-md" />
        </div>

        {/* 2 Side-by-Side News Cards Grid */}
        <div className="px-3.5 grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200/90 dark:border-gray-800 shadow-xs overflow-hidden flex flex-col"
            >
              {/* Thumbnail */}
              <div className="apk-sk relative aspect-[16/10] w-full" />
              {/* Text Lines */}
              <div className="p-2.5 flex flex-col gap-2">
                <div className="apk-sk h-3.5 w-full rounded" />
                <div className="apk-sk h-3.5 w-4/5 rounded" />
                <div className="apk-sk h-2.5 w-1/2 rounded mt-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. "ઇન્સ્ટાગ્રામ રીલ્સ" (REELS) SKELETON ─────────────────────── */}
      <div className="my-3">
        {/* Section Header */}
        <div className="px-3.5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="apk-sk w-6 h-6 rounded-lg" />
            <div className="apk-sk h-4.5 w-32 rounded-md" />
          </div>
          <div className="apk-sk h-3.5 w-16 rounded-md" />
        </div>

        {/* Reels Horizontal Scroll */}
        <div className="px-3.5 flex gap-2.5 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="apk-sk shrink-0 w-[115px] aspect-[9/16] rounded-xl border border-gray-200/80 dark:border-gray-800"
            />
          ))}
        </div>
      </div>

      {/* ── 4. LATEST FEED CARDS SKELETON ─────────────────────────────── */}
      <div className="my-2">
        <div className="px-3.5 py-2 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B3121B]/40 animate-pulse" />
          <div className="apk-sk h-4.5 w-36 rounded-md" />
        </div>
        <div className="px-3.5 space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200/90 dark:border-gray-800 p-3 flex gap-3 items-center shadow-xs"
            >
              <div className="apk-sk w-24 h-18 rounded-lg shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="apk-sk h-3 w-16 rounded" />
                <div className="apk-sk h-4 w-full rounded" />
                <div className="apk-sk h-4 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
