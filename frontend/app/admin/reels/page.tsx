'use client';

import { useState, useEffect } from 'react';
import { getBackendApiUrl, authFetch, clearApiCache } from '@/lib/api';
import { 
  Search, 
  Trash2, 
  Loader2, 
  X, 
  Play, 
  Eye, 
  RefreshCw,
  Smartphone,
  ExternalLink
} from 'lucide-react';

interface ReelData {
  id: string;
  type: string;
  heading: string;
  headingGu: string;
  headingHi: string;
  videoUrl: string | null;
  instaUrl: string | null;
  thumbnail: string | null;
  views?: number;
  isActive: boolean;
  createdAt: string;
}

export function getAdminReelThumbnail(reel: ReelData): string | null {
  const url = (reel.videoUrl || reel.instaUrl || '').trim();
  const instaMatch = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i);
  const shortcode = instaMatch?.[1] || '';

  if (reel.thumbnail?.trim()) {
    const rawThumb = reel.thumbnail.trim();
    if (rawThumb.includes('instagram') || rawThumb.includes('fbcdn.net') || shortcode) {
      return `/api/instagram-image?url=${encodeURIComponent(rawThumb)}&shortcode=${shortcode}`;
    }
    return rawThumb;
  }

  if (shortcode) {
    return `/api/instagram-image?shortcode=${shortcode}`;
  }

  return null;
}

export default function ReelsPage() {
  const [reels, setReels] = useState<ReelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Modals state
  const [previewReel, setPreviewReel] = useState<ReelData | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // Fetch top 50 newest Reels from DB
  const loadReels = async () => {
    setLoading(true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/reels?limit=50`));
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch Instagram reels');
      const loaded: ReelData[] = json.data.reels || [];
      setReels(loaded);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sync Reels directly from Instagram handle @gujaratpost.in
  const handleSyncInstagram = async (silent = false) => {
    if (!silent) setSyncing(true);
    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/reels/sync'), {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok) {
        clearApiCache();
        if (!silent) {
          const newCount = json.data?.newCount ?? 0;
          const msg = json.message || (newCount > 0
            ? `✅ ${newCount} new reel${newCount > 1 ? 's' : ''} added from Instagram!`
            : `ℹ️ All reels are up to date! Currently no new reels uploaded on Instagram.`);
          setSyncMsg(msg);
          setTimeout(() => setSyncMsg(null), 6000);
        }
        await loadReels();
      } else if (!silent) {
        alert(json.error || 'Failed to sync Instagram reels');
      }
    } catch (err: any) {
      if (!silent) alert(err.message);
    } finally {
      if (!silent) setSyncing(false);
    }
  };


  useEffect(() => {
    loadReels();
  }, []);

  // Perform Delete operation
  const confirmDeleteReel = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/reels/${deleteTargetId}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete reel');
      clearApiCache();
      setReels((prev) => prev.filter((r) => r.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Filter reels by query search
  const filteredReels = reels.filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (r.heading && r.heading.toLowerCase().includes(q)) ||
      (r.headingGu && r.headingGu.toLowerCase().includes(q)) ||
      (r.headingHi && r.headingHi.toLowerCase().includes(q))
    );
  });

  const formatViews = (views?: number) => {
    if (!views || views <= 0) return null;
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${Math.round(views / 1000)}K`;
    return `${views}`;
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-8 pt-6">
      {/* Header matching YouTube Shorts Admin style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5 border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white flex items-start sm:items-center gap-2.5">
            <span className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl bg-[#B3121B] text-white shadow-md shrink-0 mt-0.5 sm:mt-0">
              <Smartphone className="h-4 sm:h-5 w-4 sm:w-5" />
            </span>
            <span className="leading-snug">
              Instagram Reels Management <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 block sm:inline">(ઇન્સ્ટાગ્રામ રિલ્સ)</span>
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Auto-synced directly from official @gujaratpost.in Instagram account.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={() => handleSyncInstagram(false)}
            disabled={syncing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] hover:bg-red-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-sm shadow-red-600/20 disabled:opacity-50 cursor-pointer active:scale-95 whitespace-nowrap"
            title="Sync all latest Instagram Reels from @gujaratpost.in"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Instagram...' : '⚡ Auto-Sync Instagram Reels'}</span>
          </button>
        </div>
      </div>

      {/* Sync notification toast banner */}
      {syncMsg && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-sm animate-in fade-in duration-200">
          <span>{syncMsg}</span>
          <button onClick={() => setSyncMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Reels Container */}
      <div className="space-y-6">
        {/* Search bar & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search reel headline..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 shadow-sm">
              <Smartphone className="h-4 w-4 text-[#B3121B]" />
              <span>Total Reels: <strong className="text-zinc-950 dark:text-white">{filteredReels.length}</strong></span>
            </div>
          </div>
        </div>

        {/* 9:16 Aspect Shorts-Style Card Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="h-10 w-10 animate-spin text-[#B3121B]" />
            <span className="mt-2 text-sm font-semibold">Loading Instagram Reels...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 font-bold">{error}</div>
        ) : filteredReels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border rounded-2xl border-dashed bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-400">
            <Smartphone className="h-12 w-12 text-zinc-300 mb-2" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No Instagram reels found</p>
            <p className="text-xs text-zinc-500 mt-1">Click "⚡ Auto-Sync Instagram Reels" above to fetch latest reels.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredReels.map((reel) => {
              const thumbUrl = getAdminReelThumbnail(reel);
              const viewsText = formatViews(reel.views);
              return (
                <div
                  key={reel.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-md dark:border-zinc-800 transition-all hover:scale-[1.02] hover:shadow-xl"
                >
                  {/* Vertical 9:16 Aspect Container */}
                  <div
                    className="relative aspect-[9/16] w-full overflow-hidden bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] cursor-pointer"
                    onClick={() => {
                      const url = reel.instaUrl || reel.videoUrl;
                      if (url) window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    {/* Cover Image */}
                    {thumbUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={thumbUrl}
                        alt={reel.heading}
                        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/10" />

                    {/* Center Red Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <span className="h-10 w-10 bg-[#B3121B] rounded-full flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition">
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      </span>
                    </div>

                    {/* Title & Actions Overlay at bottom */}
                    <div className="absolute bottom-0 inset-x-0 p-3 z-10 flex flex-col justify-end space-y-1.5">
                      <p className="line-clamp-2 text-xs font-bold text-white leading-snug drop-shadow-md">
                        {reel.headingGu || reel.heading}
                      </p>

                      <div className="flex items-center justify-between gap-1 mt-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-white/90 drop-shadow">
                          {viewsText ? (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-white/80" />
                              {viewsText} views
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Smartphone className="h-3 w-3 text-pink-400" />
                              Insta Reel
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {reel.instaUrl && (
                            <a
                              href={reel.instaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur"
                              title="View on Instagram"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTargetId(reel.id);
                            }}
                            className="rounded-lg p-1.5 text-red-400 hover:bg-red-950/60 hover:text-red-200 backdrop-blur"
                            title="Delete Reel"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── CUSTOM DELETE CONFIRMATION MODAL ─── */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => !deleting && setDeleteTargetId(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 text-[#B3121B] shadow-inner">
              <Trash2 className="h-7 w-7" />
            </div>

            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              Delete Instagram Reel?
            </h3>
            <p className="mt-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to delete this reel? It will be removed from the website Instagram Reels section.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition disabled:opacity-50"
              >
                Cancel (રદ કરો)
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteReel}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] py-2.5 text-xs font-black text-white hover:bg-red-700 shadow-md transition disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? 'Deleting...' : 'Delete Reel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
