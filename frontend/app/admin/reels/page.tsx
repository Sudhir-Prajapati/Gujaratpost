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
  ExternalLink,
  Plus,
  Link as LinkIcon
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
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // URL sync state
  const [reelUrlInput, setReelUrlInput] = useState('');
  const [syncingUrl, setSyncingUrl] = useState(false);
  const [showUrlBox, setShowUrlBox] = useState(false);

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

  // Sync single or multiple reels by URL (without cookies)
  const handleSyncByUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reelUrlInput.trim()) return;

    setSyncingUrl(true);
    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/reels/sync-url'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: reelUrlInput.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        clearApiCache();
        const msg = json.message || '✅ Reel synced successfully using URL!';
        setSyncMsg(msg);
        setReelUrlInput('');
        setShowUrlBox(false);
        setTimeout(() => setSyncMsg(null), 6000);
        await loadReels();
      } else {
        alert(json.error || 'Failed to sync reel by URL');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSyncingUrl(false);
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
            Auto-synced directly from official @gujaratpost.in Instagram account or added via Reel URL without cookies.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 flex-wrap">
          <button
            onClick={() => setShowUrlBox((prev) => !prev)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 transition-all shadow-sm cursor-pointer"
            title="Add a single reel by URL"
          >
            <Plus className="h-4 w-4 text-[#B3121B]" />
            <span>Add Reel by URL</span>
          </button>

          <button
            onClick={() => handleSyncInstagram(false)}
            disabled={syncing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] hover:bg-red-700 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-sm shadow-red-600/20 disabled:opacity-50 cursor-pointer active:scale-95 whitespace-nowrap"
            title="Sync all latest Instagram Reels from @gujaratpost.in without cookies"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Instagram...' : '⚡ Auto-Sync Instagram Reels'}</span>
          </button>
        </div>
      </div>

      {/* Sync by URL Box */}
      {showUrlBox && (
        <form
          onSubmit={handleSyncByUrl}
          className="flex flex-col gap-3 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-[#B3121B]" />
              <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                Add Instagram Reel(s) by URL (કૂકીઝ વગર ડાયરેક્ટ URL સિંક)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowUrlBox(false);
                setReelUrlInput('');
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            ℹ️ <strong>માહિતી:</strong> Instagram લોગઇન વગર પબ્લિક પ્રોફાઇલ પર ફક્ત ૧૨ લેટેસ્ટ રિલ્સ જ બતાવે છે. અન્ય અથવા જૂની રિલ્સ ઉમેરવા માટે નીચે ૧ કે તેથી વધુ Reel URLs (એક લાઈનમાં એક) પેસ્ટ કરો:
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <textarea
                rows={2}
                placeholder="Paste Instagram Reel URL(s), e.g.&#10;https://www.instagram.com/reel/DSvBjEOEZCv/&#10;https://www.instagram.com/reel/Db2NMohRDw_/"
                value={reelUrlInput}
                onChange={(e) => setReelUrlInput(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-3 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B3121B] font-mono resize-y"
              />
            </div>
            <div className="flex sm:flex-col justify-end gap-2 shrink-0">
              <button
                type="submit"
                disabled={syncingUrl || !reelUrlInput.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] hover:bg-red-700 px-5 py-3 text-xs sm:text-sm font-bold text-white transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {syncingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span>{syncingUrl ? 'Fetching Reel(s)...' : 'Sync Reel(s)'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

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
            <p className="text-xs text-zinc-500 mt-1">Click &quot;⚡ Auto-Sync Instagram Reels&quot; above to fetch latest reels.</p>
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
                      <img
                        src={thumbUrl}
                        alt={reel.heading || 'Instagram Reel'}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const url = reel.instaUrl || reel.videoUrl || '';
                          const m = url.match(/(?:p|reel)\/([A-Za-z0-9_-]+)/);
                          if (m?.[1] && !target.src.includes(`/media/?size=l`)) {
                            target.src = `https://www.instagram.com/p/${m[1]}/media/?size=l`;
                          }
                        }}
                      />
                    )}

                    {/* Gradient Overlay for Readable Text */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                    {/* Instagram badge in top corner */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
                      <span>REEL</span>
                    </div>

                    {/* Views pill if available */}
                    {viewsText && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md">
                        <Eye className="h-3 w-3" />
                        <span>{viewsText}</span>
                      </div>
                    )}

                    {/* Play Icon in center on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-md shadow-lg scale-90 group-hover:scale-100 transition-transform">
                        <Play className="h-5 w-5 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end text-white">
                      <p className="line-clamp-2 text-xs font-bold leading-tight drop-shadow-md text-zinc-100 mb-2">
                        {reel.headingGu || reel.heading || 'Gujarat Post Reel'}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-white/15">
                        <span className="text-[10px] text-zinc-300 font-medium">
                          {reel.createdAt ? new Date(reel.createdAt).toLocaleDateString('gu-IN') : 'Recent'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {reel.instaUrl && (
                            <a
                              href={reel.instaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-lg p-1.5 text-zinc-300 hover:bg-white/20 hover:text-white backdrop-blur transition"
                              title="Open on Instagram"
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
