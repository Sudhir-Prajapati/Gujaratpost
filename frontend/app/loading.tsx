'use client';

export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] w-full overflow-hidden bg-transparent">
      <div className="h-full w-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 animate-pulse" />
    </div>
  );
}
