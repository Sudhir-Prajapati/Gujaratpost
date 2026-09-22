'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Film,
  Download,
  CheckCircle2,
  ExternalLink,
  Sparkles
} from 'lucide-react';

function YoutubeShortsBadgeIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M17.77 10.32l-1.2-.5a3.9 3.9 0 0 0-5.18-2.22l-3.32 1.57a3.9 3.9 0 0 0-2.23 5.17 3.86 3.86 0 0 0 5.17 2.23l1.2.5a3.9 3.9 0 0 0 5.18 2.22l3.32-1.57a3.9 3.9 0 0 0 2.23-5.17 3.86 3.86 0 0 0-5.17-2.23z"
        fill="#FF0000"
      />
      <polygon points="10 9.5 15 12 10 14.5 10 9.5" fill="#FFFFFF" />
    </svg>
  );
}

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

  // Tab State: 'saved' = Database Shorts, 'channel' = Live YouTube Channel Shorts
  const [activeTab, setActiveTab] = useState<'saved' | 'channel'>('saved');

  // Channel live shorts state
  const [channelShorts, setChannelShorts] = useState<any[]>([]);
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelImporting, setChannelImporting] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [featuredIds, setFeaturedIds] = useState<Map<string, string>>(new Map()); // youtubeId -> DB id

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedShort, setSelectedShort] = useState<ShortData | null>(null);
  const [previewShort, setPreviewShort] = useState<ShortData | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states for Add / Edit
  const [saving, setSaving] = useState(false);
  const [formTitleGu, setFormTitleGu] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formYoutubeInput, setFormYoutubeInput] = useState('');
  const [formYoutubeId, setFormYoutubeId] = useState('');
  const [formDuration, setFormDuration] = useState('0:58');
  const [formIsFeatured, setFormIsFeatured] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  // Clean YouTube ID extraction
  const extractYouTubeId = (input: string): string => {
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const patterns = [
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /[?&]v=([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const m = trimmed.match(pattern);
      if (m) return m[1];
    }
    return trimmed;
  };

  const handleYoutubeInputChange = (raw: string) => {
    setFormYoutubeInput(raw);
    const extracted = extractYouTubeId(raw);
    setFormYoutubeId(extracted);
  };

  // Fetch DB Short Videos (type=short)
  const loadShorts = useCallback(async () => {
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

      // Track saved IDs and featured IDs for live tab correlation
      const sIds = new Set<string>();
      const fIds = new Map<string, string>();
      loaded.forEach((v) => {
        const cId = safeYouTubeId(v.youtubeId);
        sIds.add(cId);
        if (v.isFeatured) fIds.set(cId, v.id);
      });
      setSavedIds(sIds);
      setFeaturedIds(fIds);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  // Auto-sync Shorts directly from YouTube channel via backend
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
          setSyncMsg(`✅ Synced ${json.data?.syncedCount || 0} YouTube Shorts (${json.data?.newCount || 0} newly saved). Top 40 are featured for homepage!`);
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

  // Load live shorts from YouTube channel
  const loadChannelShorts = async () => {
    setChannelLoading(true);
    try {
      const res = await fetch('/api/youtube-videos?type=short');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setChannelShorts(json.data);
      } else {
        setChannelShorts([]);
      }
    } catch {
      setChannelShorts([]);
    } finally {
      setChannelLoading(false);
    }
  };

  useEffect(() => {
    loadShorts();
  }, [loadShorts]);

  useEffect(() => {
    if (activeTab === 'channel' && channelShorts.length === 0) {
      loadChannelShorts();
    }
  }, [activeTab]);

  // Toggle Featured Status (Pins to Top 40)
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
      setFeaturedIds((prev) => {
        const next = new Map(prev);
        const cId = safeYouTubeId(short.youtubeId);
        if (newFeatured) next.set(cId, short.id);
        else next.delete(cId);
        return next;
      });
      setTotalFeaturedCount((prev) => (newFeatured ? prev + 1 : Math.max(0, prev - 1)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Edit Modal
  const openEdit = (short: ShortData) => {
    setSelectedShort(short);
    setFormTitleGu(short.titleGu || short.title);
    setFormTitle(short.title || short.titleGu);
    setFormYoutubeInput(short.youtubeId);
    setFormYoutubeId(short.youtubeId);
    setFormDuration(short.duration || '0:58');
    setFormIsFeatured(short.isFeatured);
    setEditModalOpen(true);
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShort) return;
    setSaving(true);
    try {
      const finalTitle = formTitleGu.trim() || formTitle.trim() || selectedShort.title;
      const res = await authFetch(getBackendApiUrl(`/api/admin/videos/${selectedShort.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTitle,
          titleGu: formTitleGu.trim() || finalTitle,
          titleHi: finalTitle,
          youtubeId: formYoutubeId || selectedShort.youtubeId,
          type: 'short',
          duration: formDuration || '0:58',
          isFeatured: formIsFeatured,
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
      setTotalShortsCount((prev) => Math.max(0, prev - 1));
      setDeleteTargetId(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Import a single channel short directly into DB
  const importChannelShort = async (cs: any) => {
    const cleanId = safeYouTubeId(cs.youtubeId);
    setChannelImporting(cleanId);
    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/videos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cs.title,
          titleGu: cs.title,
          titleHi: cs.title,
          youtubeId: cleanId,
          type: 'short',
          duration: cs.duration || '0:58',
          isFeatured: true,
          channel: 'Gujarat Post News',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to import short');

      clearApiCache();
      setSavedIds((prev) => new Set([...prev, cleanId]));
      setFeaturedIds((prev) => new Map(prev).set(cleanId, json.data.id));
      await loadShorts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setChannelImporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5 border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white flex items-start sm:items-center gap-2.5">
            <span className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/20 shrink-0 mt-0.5 sm:mt-0">
              <Film className="h-4 sm:h-5 w-4 sm:w-5" />
            </span>
            <span className="leading-snug">
              YouTube Shorts Management <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 block sm:inline">(શોર્ટ વીડિયો મેનેજમેન્ટ)</span>
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage 9:16 vertical shorts. Top 40 latest & featured shorts appear directly on the homepage carousel.
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0 flex-wrap">
          <button
            onClick={() => handleSyncShorts(false)}
            disabled={syncing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-all hover:bg-red-700 shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            title="Auto-sync and save all YouTube channel Shorts"
          >
            <RefreshCw className={`h-4 w-4 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing YouTube...' : '⚡ Auto-Sync Channel Shorts'}</span>
          </button>
        </div>
      </div>

      {/* Sync notification toast */}
      {syncMsg && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-sm animate-in fade-in duration-200">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {syncMsg}
          </span>
          <button onClick={() => setSyncMsg(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Primary Tab Bar */}
      <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 px-1 text-sm font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'saved'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          સેવ કરેલા શોર્ટ્સ (Saved in Database)
          <span className="ml-2 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-600 dark:text-zinc-300">
            {totalShortsCount || shorts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('channel')}
          className={`pb-3 px-1 text-sm font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === 'channel'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          યુટ્યુબ ચેનલ લાઇવ (Live YouTube Channel)
          {channelShorts.length > 0 && (
            <span className="ml-2 rounded-full bg-red-100 dark:bg-red-950/50 px-2 py-0.5 text-xs font-bold text-red-600 dark:text-red-400">
              {channelShorts.length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB 1: SAVED SHORTS IN DATABASE ── */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          {/* Search bar & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search short video title or YouTube ID..."
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
                <Film className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span>Total Shorts: <strong className="text-zinc-950 dark:text-white">{totalShortsCount || shorts.length}</strong></span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 shadow-sm">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>Top 40 Featured: <strong className="text-amber-950 dark:text-amber-200">{totalFeaturedCount || shorts.filter(s => s.isFeatured).length}</strong></span>
              </div>
            </div>
          </div>

          {/* Shorts Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Loader2 className="h-10 w-10 animate-spin text-red-600" />
              <span className="mt-2 text-sm font-semibold">Loading Short Videos...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500 font-bold">{error}</div>
          ) : shorts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border rounded-2xl border-dashed bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-400">
              <Film className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-2" />
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No short videos found</p>
              <p className="text-xs text-zinc-500 mt-1">Click &quot;⚡ Auto-Sync Channel Shorts&quot; or import from the Live YouTube Channel tab to populate.</p>
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
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[9px] font-black text-white shadow-md uppercase tracking-wider">
                      <Star className="h-3 w-3 fill-current" /> TOP 40 FEATURED
                    </div>
                  )}

                  {/* YouTube Shorts Icon on Top-Right */}
                  <div className="absolute top-2.5 right-2.5 z-20">
                    <span className="h-7 w-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center shadow">
                      <YoutubeShortsBadgeIcon className="h-4 w-4" />
                    </span>
                  </div>

                  {/* Vertical 9:16 Aspect Thumbnail Container */}
                  <div
                    className="relative aspect-[9/16] w-full overflow-hidden bg-black cursor-pointer"
                    style={{
                      backgroundImage: `url(https://i.ytimg.com/vi/${safeYouTubeId(short.youtubeId)}/hqdefault.jpg)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                    onClick={() => setPreviewShort(short)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        short.thumbnail &&
                        short.thumbnail.startsWith('http') &&
                        !short.thumbnail.includes('ytimg.com') &&
                        !short.thumbnail.includes('youtube.com')
                          ? short.thumbnail
                          : `https://i.ytimg.com/vi/${safeYouTubeId(short.youtubeId)}/oar2.jpg`
                      }
                      alt={short.titleGu || short.title}
                      className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        const cId = safeYouTubeId(short.youtubeId);
                        if (img.src.includes('oar2.jpg')) {
                          img.src = `https://i.ytimg.com/vi/${cId}/hqdefault.jpg`;
                        } else if (img.src.includes('hqdefault.jpg')) {
                          img.src = `https://i.ytimg.com/vi/${cId}/mqdefault.jpg`;
                        }
                      }}
                    />

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/10" />

                    {/* Center Red Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <span className="h-11 w-11 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition">
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      </span>
                    </div>

                    {/* Title & Actions Overlay at bottom */}
                    <div className="absolute bottom-0 inset-x-0 p-2.5 sm:p-3 z-10 flex flex-col justify-end space-y-1.5">
                      <p className="line-clamp-2 text-xs font-bold text-white leading-snug drop-shadow-md">
                        {short.titleGu || short.title}
                      </p>

                      {/* Views & Duration */}
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-300 drop-shadow">
                        <Eye className="h-3 w-3 text-zinc-400" />
                        <span>{short.views ? (short.views >= 1000 ? `${(short.views / 1000).toFixed(1)}K` : `${short.views}`) : '1.2K'} વ્યુ</span>
                        <span className="text-zinc-500">•</span>
                        <Clock className="h-3 w-3 text-zinc-400" />
                        <span>{short.duration || '0:58'}</span>
                      </div>

                      {/* Action Buttons Row - ALWAYS FULLY VISIBLE */}
                      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-white/20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFeatured(short);
                          }}
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black backdrop-blur transition cursor-pointer ${
                            short.isFeatured
                              ? 'text-yellow-300 bg-yellow-500/25 border border-yellow-400/40 shadow-xs'
                              : 'text-zinc-200 bg-black/60 hover:bg-white/20 border border-white/15'
                          }`}
                          title={short.isFeatured ? 'Remove from Top 40 Featured' : 'Feature in Top 40'}
                        >
                          <Star className={`h-3 w-3 ${short.isFeatured ? 'fill-current text-yellow-400' : 'text-zinc-300'}`} />
                          <span>{short.isFeatured ? 'Top 40' : 'Feature'}</span>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(short);
                            }}
                            className="rounded-lg p-1.5 text-zinc-200 bg-black/60 hover:bg-white/25 hover:text-white border border-white/15 backdrop-blur transition cursor-pointer"
                            title="Edit short"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(short.id);
                            }}
                            className="rounded-lg p-1.5 text-white bg-red-600/90 hover:bg-red-600 border border-red-500 backdrop-blur transition cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                            title="Delete short"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-800 dark:text-zinc-300 dark:hover:!bg-zinc-800 dark:hover:!text-white cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-800 dark:text-zinc-300 dark:hover:!bg-zinc-800 dark:hover:!text-white cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: LIVE YOUTUBE CHANNEL SHORTS ── */}
      {activeTab === 'channel' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <YoutubeShortsBadgeIcon className="h-5 w-5" />
                <span>Live Channel Shorts (@Gujaratpostnews)</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Directly stream and import any shorts published on your official YouTube channel.
              </p>
            </div>

            <button
              onClick={loadChannelShorts}
              disabled={channelLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:!bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-white px-3.5 py-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${channelLoading ? 'animate-spin' : ''}`} />
              <span>Reload Channel Feed</span>
            </button>
          </div>

          {channelLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Loader2 className="h-10 w-10 animate-spin text-red-600" />
              <span className="mt-2 text-sm font-semibold">Scraping YouTube Channel Shorts...</span>
            </div>
          ) : channelShorts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border rounded-2xl border-dashed bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-400">
              <Film className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mb-2" />
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No channel shorts loaded</p>
              <p className="text-xs text-zinc-500 mt-1">Click &quot;Reload Channel Feed&quot; to fetch latest shorts from YouTube.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {channelShorts.map((cs: any) => {
                const cId = safeYouTubeId(cs.youtubeId);
                const isSaved = savedIds.has(cId);
                const isF = featuredIds.has(cId);
                const isImp = channelImporting === cId;

                return (
                  <div
                    key={cId}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-md dark:border-zinc-800 transition-all hover:scale-[1.02] hover:shadow-xl"
                  >
                    {/* Status Badge */}
                    <div className="absolute top-2.5 left-2.5 z-20">
                      {isF ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[9px] font-black text-white shadow uppercase">
                          <Star className="h-3 w-3 fill-current" /> TOP 40
                        </span>
                      ) : isSaved ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white shadow uppercase">
                          <CheckCircle2 className="h-3 w-3" /> SAVED
                        </span>
                      ) : null}
                    </div>

                    {/* Thumbnail */}
                    <div
                      className="relative aspect-[9/16] w-full overflow-hidden bg-black"
                      style={{
                        backgroundImage: `url(https://i.ytimg.com/vi/${cId}/hqdefault.jpg)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://i.ytimg.com/vi/${cId}/oar2.jpg`}
                        alt={cs.title}
                        className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (img.src.includes('oar2.jpg')) {
                            img.src = `https://i.ytimg.com/vi/${cId}/hqdefault.jpg`;
                          } else if (img.src.includes('hqdefault.jpg')) {
                            img.src = `https://i.ytimg.com/vi/${cId}/mqdefault.jpg`;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/10" />

                      {/* Title & Import Button at bottom */}
                      <div className="absolute bottom-0 inset-x-0 p-3 z-10 flex flex-col justify-end space-y-2">
                        <p className="line-clamp-2 text-xs font-bold text-white leading-snug drop-shadow-md">
                          {cs.title}
                        </p>

                        <div className="pt-1">
                          {isSaved ? (
                            <div className="flex items-center justify-between text-[11px] font-extrabold text-emerald-400">
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> In Database
                              </span>
                              <a
                                href={`https://www.youtube.com/shorts/${cId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-white/70 hover:text-white"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          ) : (
                            <button
                              onClick={() => importChannelShort(cs)}
                              disabled={isImp}
                              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-extrabold shadow cursor-pointer disabled:opacity-50"
                            >
                              {isImp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                              <span>{isImp ? 'Importing...' : 'ઇમ્પોર્ટ (Import)'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── EDIT SHORT MODAL ── */}
      {editModalOpen && selectedShort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-4 dark:border-zinc-800">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-red-600" />
                <span>શોર્ટ એડિટ કરો (Edit Short Video)</span>
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:!bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                  ટાઇટલ / શીર્ષક (Title) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitleGu}
                  onChange={(e) => setFormTitleGu(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    YouTube ID
                  </label>
                  <input
                    type="text"
                    value={formYoutubeId}
                    onChange={(e) => handleYoutubeInputChange(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                    સમયગાળો (Duration)
                  </label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="h-4 w-4 rounded accent-red-600"
                  />
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                    ⭐ Top 40 Featured (હોમપેજ પર બતાવો)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:!bg-zinc-800 dark:hover:!text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:opacity-50 shadow-md shadow-red-600/20 cursor-pointer"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{saving ? 'સેવિંગ...' : 'ફેરફારો સેવ કરો (Save Changes)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteTargetId && (() => {
        const targetShort = shorts.find((s) => s.id === deleteTargetId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className="absolute inset-0"
              onClick={() => !deleting && setDeleteTargetId(null)}
            />
            <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 z-10 animate-in zoom-in-95 duration-200 text-center">
              {/* Red Alert Icon */}
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 text-[#B3121B] shadow-inner">
                <Trash2 className="h-7 w-7" />
              </div>

              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                Delete YouTube Short?
              </h3>
              <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-0.5">
                શું તમે આ શોર્ટ વીડિયો ડિલીટ કરવા માંગો છો?
              </p>

              {/* Short Preview Card */}
              {targetShort && (
                <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/60 text-left">
                  <div className="flex gap-3 p-3 items-center">
                    <div className="w-14 h-20 relative rounded-lg overflow-hidden bg-black shrink-0 border border-zinc-200 dark:border-zinc-700">
                      <img
                        src={
                          targetShort.thumbnail && targetShort.thumbnail.startsWith('http')
                            ? targetShort.thumbnail
                            : `https://i.ytimg.com/vi/${safeYouTubeId(targetShort.youtubeId)}/hqdefault.jpg`
                        }
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                        {targetShort.titleGu || targetShort.title}
                      </h4>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-mono mt-1">
                        YT ID: {targetShort.youtubeId}
                      </p>
                      {targetShort.isFeatured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white mt-1.5">
                          ★ TOP 40 FEATURED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
                આ ક્રિયા પૂર્વવત્ કરી શકાશે નહીં. આ શોર્ટ ડેટાબેઝમાંથી કાયમ માટે દૂર કરવામાં આવશે.
              </p>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteTargetId(null)}
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition disabled:opacity-50 cursor-pointer"
                >
                  Cancel (રદ કરો)
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={confirmDeleteShort}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] py-2.5 text-xs font-black text-white hover:bg-red-700 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  <span>{deleting ? 'ડિલીટ થઈ રહ્યું છે...' : 'ડિલીટ કરો (Delete)'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── PREVIEW MODAL ── */}
      {previewShort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-black border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-zinc-950">
              <span className="text-xs font-black text-white truncate max-w-[260px]">
                {previewShort.titleGu || previewShort.title}
              </span>
              <button
                onClick={() => setPreviewShort(null)}
                className="rounded-full p-1 text-white/70 hover:text-white hover:bg-white/20 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-[9/16] w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${safeYouTubeId(previewShort.youtubeId)}?autoplay=1&rel=0&modestbranding=1`}
                title={previewShort.title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
