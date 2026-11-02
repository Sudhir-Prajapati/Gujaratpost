'use client';

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <>
      <style>{`
        @keyframes skeleton-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .sk-bar {
          position: relative;
          overflow: hidden;
          background-color: #e2e8f0;
          border-radius: 6px;
        }
        .dark .sk-bar {
          background-color: #334155;
        }
        .sk-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%);
          animation: skeleton-sweep 1.5s ease-in-out infinite;
        }
        .dark .sk-bar::after {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
        }
      `}</style>
      <div className={`sk-bar ${className}`} />
    </>
  );
}

/* ── Single news card skeleton ──────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Shimmer className="aspect-[16/10] w-full rounded-xl" />
      <Shimmer className="h-3 w-16 rounded-full mt-1" />
      <Shimmer className="h-4 w-full" />
      <Shimmer className="h-4 w-4/5" />
      <Shimmer className="h-3 w-24 mt-1 rounded-full" />
    </div>
  );
}

/* ── Horizontal compact card skeleton ──────────────────────── */
function CompactCardSkeleton() {
  return (
    <div className="flex items-start gap-3 border-b border-border py-3">
      <Shimmer className="h-[72px] w-[100px] shrink-0 rounded-lg" />
      <div className="flex-1 flex flex-col gap-2 pt-1">
        <Shimmer className="h-3 w-14 rounded-full" />
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-20 mt-1 rounded-full" />
      </div>
    </div>
  );
}

/* ── Section heading skeleton ───────────────────────────────── */
function SectionHeadingSkeleton() {
  return (
    <div className="flex items-center gap-3 mb-5 border-b border-border pb-3">
      <Shimmer className="h-7 w-28 rounded" />
      <Shimmer className="h-px flex-1" />
      <Shimmer className="h-4 w-20 rounded-full" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   HOME PAGE SKELETON
   ════════════════════════════════════════════════════════════ */
export function HomePageSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 animate-pulse">
      {/* Hero row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mb-10">
        {/* Main hero card */}
        <Shimmer className="aspect-[16/9] w-full rounded-xl" />
        {/* Side stack */}
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <CompactCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Section 1 */}
      <SectionHeadingSkeleton />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
        {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
      </div>

      {/* Section 2 */}
      <SectionHeadingSkeleton />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-10">
        {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
      </div>

      {/* Section 3 */}
      <SectionHeadingSkeleton />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ARTICLE DETAIL SKELETON
   ════════════════════════════════════════════════════════════ */
export function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <style>{`
        @keyframes skeleton-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .sk-bar {
          position: relative;
          overflow: hidden;
          background-color: #e2e8f0;
          border-radius: 6px;
        }
        .dark .sk-bar {
          background-color: #334155;
        }
        .sk-bar::after {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%);
          animation: skeleton-sweep 1.5s ease-in-out infinite;
        }
        .dark .sk-bar::after {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">

        {/* ── Main Article Column ── */}
        <div className="min-w-0 space-y-0">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4">
            <div className="sk-bar h-3 w-16 rounded-full" />
            <div className="sk-bar h-3 w-3 rounded-full" />
            <div className="sk-bar h-3 w-28 rounded-full" />
          </div>

          {/* Category badge */}
          <div className="sk-bar h-6 w-24 rounded-full mb-4" />

          {/* Title — 3 lines */}
          <div className="sk-bar h-8 w-full rounded-lg mb-2" />
          <div className="sk-bar h-8 w-11/12 rounded-lg mb-2" />
          <div className="sk-bar h-8 w-3/4 rounded-lg mb-5" />

          {/* Excerpt — 2 lines */}
          <div className="sk-bar h-5 w-full rounded mb-2" />
          <div className="sk-bar h-5 w-4/5 rounded mb-6" />

          {/* Author byline */}
          <div className="flex items-center gap-3 py-4 border-y border-border/40 mb-6">
            <div className="sk-bar h-11 w-11 rounded-full shrink-0" />
            <div className="flex flex-col gap-2">
              <div className="sk-bar h-4 w-32 rounded" />
              <div className="sk-bar h-3 w-44 rounded-full" />
            </div>
            <div className="ml-auto flex gap-2">
              <div className="sk-bar h-8 w-8 rounded-full" />
              <div className="sk-bar h-8 w-8 rounded-full" />
              <div className="sk-bar h-8 w-8 rounded-full" />
            </div>
          </div>

          {/* Hero image */}
          <div className="sk-bar aspect-[16/9] w-full rounded-2xl mb-7" />

          {/* Body paragraphs */}
          <div className="space-y-3">
            <div className="sk-bar h-4 w-full rounded" />
            <div className="sk-bar h-4 w-11/12 rounded" />
            <div className="sk-bar h-4 w-full rounded" />
            <div className="sk-bar h-4 w-10/12 rounded" />
            <div className="sk-bar h-4 w-full rounded" />
          </div>

          {/* Pull-quote / highlight box */}
          <div className="my-7 pl-5 border-l-4 border-muted space-y-2">
            <div className="sk-bar h-5 w-48 rounded" />
            <div className="sk-bar h-4 w-full rounded" />
            <div className="sk-bar h-4 w-11/12 rounded" />
            <div className="sk-bar h-4 w-3/4 rounded" />
          </div>

          {/* More body */}
          <div className="space-y-3">
            <div className="sk-bar h-4 w-full rounded" />
            <div className="sk-bar h-4 w-5/6 rounded" />
            <div className="sk-bar h-4 w-full rounded" />
            <div className="sk-bar h-4 w-4/5 rounded" />
            <div className="sk-bar h-4 w-full rounded" />
            <div className="sk-bar h-4 w-3/4 rounded" />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-8">
            {[56, 72, 48, 64, 80].map((w, i) => (
              <div key={i} className="sk-bar h-7 rounded-full" style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="hidden lg:flex flex-col gap-6 sticky top-20">
          {/* Ad placeholder */}
          <div className="sk-bar h-[250px] w-full rounded-xl" />

          {/* Related articles heading */}
          <div className="flex items-center gap-3 border-b border-border/40 pb-3">
            <div className="sk-bar h-1 w-1 rounded-full" />
            <div className="sk-bar h-5 w-32 rounded" />
            <div className="sk-bar flex-1 h-px" />
          </div>

          {/* Related article cards */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 border-b border-border/30 pb-4">
              <div className="sk-bar h-[72px] w-[100px] shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="sk-bar h-3 w-14 rounded-full" />
                <div className="sk-bar h-4 w-full rounded" />
                <div className="sk-bar h-4 w-3/4 rounded" />
                <div className="sk-bar h-3 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ════════════════════════════════════════════════════════════
   SEARCH PAGE SKELETON
   ════════════════════════════════════════════════════════════ */
export function SearchPageSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 animate-pulse">
      {/* Header */}
      <Shimmer className="h-3 w-40 rounded-full mb-3" />
      <Shimmer className="h-10 w-72 mb-6" />
      {/* Search bar */}
      <Shimmer className="h-14 w-full max-w-3xl rounded-xl mb-10" />
      {/* Section label */}
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-3">
        <Shimmer className="h-5 w-28" />
        <Shimmer className="h-3 w-20 rounded-full" />
      </div>
      {/* Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CATEGORY PAGE SKELETON
   ════════════════════════════════════════════════════════════ */
export function CategoryPageSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 animate-pulse">
      {/* Category header */}
      <Shimmer className="h-8 w-48 mb-2" />
      <Shimmer className="h-4 w-64 mb-8 rounded-full" />
      {/* Filter pills */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Shimmer key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {/* Cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   VIDEOS PAGE SKELETON
   ════════════════════════════════════════════════════════════ */
export function VideosPageSkeleton() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 animate-pulse">
      {/* Channel Header Banner Skeleton */}
      <Shimmer className="w-full aspect-[4/1] md:aspect-[6/1] rounded-2xl mb-8" />
      
      {/* Main Grid: Body + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mb-10">
        <div className="flex flex-col gap-6">
          <SectionHeadingSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <SectionHeadingSkeleton />
          {[1, 2, 3, 4].map((i) => <CompactCardSkeleton key={i} />)}
        </div>
      </div>

      {/* Shorts Section Heading */}
      <SectionHeadingSkeleton />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-10">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Shimmer className="aspect-[9/16] w-full rounded-2xl" />
            <Shimmer className="h-4 w-5/6" />
            <Shimmer className="h-3 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
