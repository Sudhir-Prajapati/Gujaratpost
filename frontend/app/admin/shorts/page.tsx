'use client';

import { useState, useEffect } from 'react';
import { getBackendApiUrl, authFetch, clearApiCache } from '@/lib/api';
import { safeYouTubeId } from '@/lib/youtube';
import { 
  Search, 
  Trash2, 
  Edit2, 
  Loader2, 
  X, 
  Play, 
  Clock, 
  Star,
  StarOff,
  Eye,
  RefreshCw,
  Film
} from 'lucide-react';

interface ShortData {
  id: string;
  title: string;
  titleGu: string;
  titleHi: string;
  description: string | null;
  thumbnail: string;
  youtubeId: string;
  embedUrl: string;
  duration: string;
  type: string;
  isFeatured: boolean;
  channel: string | null;
  views: number;
  publishedAt: string;
  createdAt: string;
}

export default function ShortsPage() {
  const [shorts, setShorts] = useState<ShortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalShortsCount, setTotalShortsCount] = useState(0);
  const [totalFeaturedCount, setTotalFeaturedCount] = useState(0);

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedShort, setSelectedShort] = useState<ShortData | null>(null);
  const [previewShort, setPreviewShort] = useState<ShortData | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states for Edit
  const [saving, setSaving] = useState(false);
  const [titleGu, setTitleGu] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [duration, setDuration] = useState('0:45');
  const [isFeatured, setIsFeatured] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // Extract YouTube ID
  const extractYouTubeId = (input: string): string => {
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /[?&]v=([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const m = trimmed.match(pattern);
      if (m) return m[1];
    }
    return trimmed;
  };

  const handleYoutubeInputChange = (raw: string) => {
    setYoutubeId(extractYouTubeId(raw));
  };

  // Fetch DB Short Videos (type=short) sorted by isFeatured desc, publishedAt desc
  const loadShorts = async () => {
    setLoading(true);
    try {
      const res = await authFetch(
        getBackendApiUrl(`/api/admin/videos?page=${page}&limit=24&query=${encodeURIComponent(query)}&type=short`)
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch short videos');
      const loaded: ShortData[] = json.data.videos || [];
      setShorts(loaded);
      setTotalPages(json.data.totalPages || 1);
      if (json.data.total !== undefined) setTotalShortsCount(json.data.total);
      if (json.data.totalFeatured !== undefined) setTotalFeaturedCount(json.data.totalFeatured);
      else setTotalFeaturedCount(loaded.filter((s: ShortData) => s.isFeatured).length);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-sync Shorts directly from YouTube channel via backend (automatic on load, or manual click)
  const handleSyncShorts = async (silent = false) => {
    if (!silent) setSyncing(true);
    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/videos/sync-youtube-shorts'), {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok) {
        clearApiCache();
        if (!silent) {
          setSyncMsg(`✅ Synced ${json.data?.syncedCount || 0} YouTube Shorts (${json.data?.newCount || 0} newly saved). Top 20 latest are auto-featured!`);
          setTimeout(() => setSyncMsg(null), 6000);
        }
        await loadShorts();
      } else if (!silent) {
        alert(json.error || 'Failed to sync YouTube Shorts');
      }
    } catch (err: any) {
      if (!silent) alert(err.message);
    } finally {
      if (!silent) setSyncing(false);
    }
  };

  // Automatic sync on component mount / page change (NO click required!)
  useEffect(() => {
    loadShorts();
    handleSyncShorts(true);
  }, [page, query]);

  // Toggle Featured Status
  const handleToggleFeatured = async (short: ShortData) => {
    const newFeatured = !short.isFeatured;
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/videos/${short.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: newFeatured }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update feature status');
      clearApiCache();
      setShorts((prev) => prev.map((s) => (s.id === short.id ? { ...s, isFeatured: newFeatured } : s)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Edit Modal
  const openEdit = (short: ShortData) => {
    setSelectedShort(short);
    setTitleGu(short.titleGu || short.title);
    setYoutubeId(short.youtubeId);
    setDuration(short.duration || '0:45');
    setIsFeatured(short.isFeatured);
    setEditModalOpen(true);
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShort) return;
    setSaving(true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/videos/${selectedShort.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleGu,
          titleGu,
          titleHi: titleGu,
          youtubeId,
          type: 'short',
          duration: duration || '0:45',
          isFeatured,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update short video');

      clearApiCache();
      setShorts((prev) => prev.map((s) => (s.id === selectedShort.id ? json.data : s)));
      setEditModalOpen(false);
      setSelectedShort(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Custom Delete Dialog Modal
  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  // Perform Delete operation
  const confirmDeleteShort = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/videos/${deleteTargetId}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete short video');
      clearApiCache();
      setShorts((prev) => prev.filter((s) => s.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5 border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white flex items-start sm:items-center gap-2.5">
            <span className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl bg-[#B3121B] text-white shadow-md shrink-0 mt-0.5 sm:mt-0">
              <Film className="h-4 sm:h-5 w-4 sm:w-5" />
            </span>
            <span className="leading-snug">
              Short Videos Management <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 block sm:inline">(શોર્ટ વીડિયો)</span>
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Auto-synced directly from YouTube channel. Top 20 latest Shorts are automatically featured for the homepage carousel.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={() => handleSyncShorts(false)}
            disabled={syncing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-all hover:bg-red-700 shadow-sm shadow-red-600/20 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            title="Auto-sync and save all YouTube channel Shorts"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing YouTube...' : '⚡ Auto-Sync YouTube Shorts'}</span>
          </button>
        </div>
      </div>

      {/* Sync notification toast */}
      {syncMsg && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-sm animate-in fade-in duration-200">
          <span>{syncMsg}</span>
          <button onClick={() => setSyncMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Shorts Container */}
      <div className="space-y-6">
        {/* Search bar & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search short video title..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 shadow-sm">
              <Film className="h-4 w-4 text-[#B3121B]" />
              <span>Total Shorts: <strong className="text-zinc-950 dark:text-white">{totalShortsCount || shorts.length}</strong></span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 shadow-sm">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>Featured: <strong className="text-amber-950 dark:text-amber-200">{totalFeaturedCount || shorts.filter(s => s.isFeatured).length}</strong></span>
            </div>
          </div>
        </div>

        {/* Shorts Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="h-10 w-10 animate-spin text-[#B3121B]" />
            <span className="mt-2 text-sm font-semibold">Loading Short Videos...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 font-bold">{error}</div>
        ) : shorts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border rounded-2xl border-dashed bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-400">
            <Film className="h-12 w-12 text-zinc-300 mb-2" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No short videos found</p>
            <p className="text-xs text-zinc-500 mt-1">Shorts will automatically appear from YouTube channel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {shorts.map((short) => (
              <div
                key={short.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-md dark:border-zinc-800 transition-all hover:scale-[1.02] hover:shadow-xl"
              >
                {/* Featured Badge on Top-Left */}
                {short.isFeatured && (
                  <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 rounded-md bg-[#B3121B] px-2 py-0.5 text-[9px] font-black text-white shadow-md uppercase tracking-wider">
                    <Star className="h-3 w-3 fill-current" /> FEATURED
                  </div>
                )}

                {/* Vertical 9:16 Aspect Thumbnail Container */}
                <div
                  className="relative aspect-[9/16] w-full overflow-hidden bg-black cursor-pointer"
                  onClick={() => setPreviewShort(short)}
                >
                  {/* 1080x1920 HD Vertical Frame Thumbnail */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://i.ytimg.com/vi/${safeYouTubeId(short.youtubeId)}/frame0.jpg`}
                    alt={short.titleGu || short.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${safeYouTubeId(short.youtubeId)}/hqdefault.jpg`;
                    }}
                  />

                  {/* Dark gradient overlay matching YouTube */}
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
                      {short.titleGu || short.title}
                    </p>

                    <div className="flex items-center justify-between gap-1 mt-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-white/90 drop-shadow">
                        <Eye className="h-3 w-3 text-white/80" />
                        <span>{short.views ? (short.views >= 1000 ? `${(short.views / 1000).toFixed(1)}K` : `${short.views}`) : '75'} વ્યુ</span>
                        <span>|</span>
                        <Clock className="h-3 w-3 text-white/80" />
                        <span>{short.duration || '0:58'}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFeatured(short);
                          }}
                          className={`rounded-lg p-1.5 backdrop-blur transition ${
                            short.isFeatured
                              ? 'text-yellow-400 hover:bg-yellow-400/20'
                              : 'text-white/60 hover:bg-white/20 hover:text-white'
                          }`}
                          title={short.isFeatured ? 'Unfeature Short' : 'Feature Short'}
                        >
                          {short.isFeatured ? (
                            <Star className="h-3.5 w-3.5 fill-current text-yellow-400" />
                          ) : (
                            <StarOff className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(short);
                          }}
                          className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(short.id);
                          }}
                          className="rounded-lg p-1.5 text-red-400 hover:bg-red-950/60 hover:text-red-200 backdrop-blur"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── EDIT SHORT MODAL ─── */}
      {editModalOpen && selectedShort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-[#B3121B]" />
                Edit Short Video
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  YouTube Shorts Link / Video ID
                </label>
                <input
                  type="text"
                  value={youtubeId}
                  onChange={(e) => handleYoutubeInputChange(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  શીર્ષક (ગુજરાતી)
                </label>
                <input
                  type="text"
                  value={titleGu}
                  onChange={(e) => setTitleGu(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-[#B3121B] focus:ring-[#B3121B]"
                    />
                    Feature on Homepage
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-4 border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#B3121B] px-5 py-2 text-xs font-black text-white hover:bg-red-700 shadow-md transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Short Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PREVIEW MODAL ─── */}
      {previewShort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setPreviewShort(null)} />
          <div className="relative w-full max-w-xs aspect-[9/16] max-h-[80vh] rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 z-10">
            <button
              onClick={() => setPreviewShort(null)}
              className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${safeYouTubeId(previewShort.youtubeId)}?autoplay=1&rel=0`}
              title="YouTube Shorts player"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}

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
              Delete Short Video?
            </h3>
            <p className="mt-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to delete this short video? It will be removed from the homepage Short Videos carousel.
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
                onClick={confirmDeleteShort}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] py-2.5 text-xs font-black text-white hover:bg-red-700 shadow-md transition disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? 'Deleting...' : 'Delete Video'}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
