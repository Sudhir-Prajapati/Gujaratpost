'use client';

import { useState, useEffect } from 'react';
import { getBackendApiUrl, authFetch, getPublicCategories } from '@/lib/api';
import { clearApiCache } from '@/lib/api';
import { safeYouTubeId } from '@/lib/youtube';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  X,
  Video as VideoIcon,
  Play,
  Clock,
  Bookmark,
  Radio,
  Star,
  StarOff,
  Download,
  Eye,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

function YoutubeIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M22.5 7.1a2.8 2.8 0 0 0-2-2C18.7 4.6 12 4.6 12 4.6s-6.7 0-8.5.5a2.8 2.8 0 0 0-2 2A29.5 29.5 0 0 0 1 12a29.5 29.5 0 0 0 .5 4.9 2.8 2.8 0 0 0 2 2c1.8.5 8.5.5 8.5.5s6.7 0 8.5-.5a2.8 2.8 0 0 0 2-2A29.5 29.5 0 0 0 23 12a29.5 29.5 0 0 0-.5-4.9Z" />
      <path fill="white" d="m9.8 15.2 5.6-3.2-5.6-3.2v6.4Z" />
    </svg>
  );
}

interface VideoData {
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
  categoryId?: string | null;
  categoryName?: string | null;
  category?: { id: string; name: string; nameGu: string; color: string | null } | null;
  isFeatured: boolean;
  channel: string | null;
  views: number;
  publishedAt: string;
  createdAt: string;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideosCount, setTotalVideosCount] = useState(0);
  const [totalFeaturedCount, setTotalFeaturedCount] = useState(0);

  // Categories list state
  const [categories, setCategories] = useState<any[]>([]);

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importingCv, setImportingCv] = useState<any>(null);
  const [importCategoryId, setImportCategoryId] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoData | null>(null);
  const [deleteTargetVideo, setDeleteTargetVideo] = useState<VideoData | null>(null);
  const [deletingVideo, setDeletingVideo] = useState(false);

  // Tab state: 'saved' = DB videos, 'channel' = live YouTube channel
  const [activeTab, setActiveTab] = useState<'saved' | 'channel'>('saved');

  // Channel videos state
  const [channelVideos, setChannelVideos] = useState<any[]>([]);
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelImporting, setChannelImporting] = useState<string | null>(null);
  const [channelFeaturing, setChannelFeaturing] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [featuredIds, setFeaturedIds] = useState<Map<string, string>>(new Map()); // youtubeId -> DB id

  // Form states
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [titleGu, setTitleGu] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [type, setType] = useState('video'); // video | short | podcast | interview
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('0:00');
  const [isFeatured, setIsFeatured] = useState(false);
  const [channel, setChannel] = useState('Gujarat Post News');

  // Fetch categories on mount
  useEffect(() => {
    getPublicCategories()
      .then((cats) => {
        if (cats && Array.isArray(cats)) {
          setCategories(cats);
        }
      })
      .catch(() => { });
  }, []);

  // Extract YouTube video ID from any URL format
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
    const extractedId = extractYouTubeId(raw);
    setYoutubeId(extractedId);
    if (raw.toLowerCase().includes('/shorts/')) {
      setType('short');
    }
  };

  const [syncingYouTube, setSyncingYouTube] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Fetch videos
  const loadVideos = async () => {
    setLoading(true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/videos?page=${page}&limit=12&query=${encodeURIComponent(query)}&type=video`));
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch videos');
      const loadedVideos: VideoData[] = json.data.videos || [];
      const regularVideosOnly = loadedVideos.filter((v: VideoData) => v.type === 'video' || !v.type);
      setVideos(regularVideosOnly);
      setTotalPages(json.data.totalPages || 1);
      if (json.data.total !== undefined) setTotalVideosCount(json.data.total);
      if (json.data.totalFeatured !== undefined) setTotalFeaturedCount(json.data.totalFeatured);
      else setTotalFeaturedCount(regularVideosOnly.filter((v: VideoData) => v.isFeatured).length);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [page, query]);

  // One-click / background sync with YouTube channel
  const handleSyncYouTubeChannel = async (silent = false) => {
    if (!silent) setSyncingYouTube(true);
    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/videos/sync-youtube'), {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok) {
        if (!silent) {
          setSyncMessage(`✅ Synced ${json.data?.syncedCount || 0} YouTube videos (${json.data?.newCount || 0} newly saved). Top 20 latest are auto-featured!`);
          setTimeout(() => setSyncMessage(null), 6000);
        }
        loadVideos();
      } else if (!silent) {
        alert(json.error || 'Failed to sync YouTube channel');
      }
    } catch (e: any) {
      if (!silent) alert(e.message || 'YouTube sync failed');
    } finally {
      if (!silent) setSyncingYouTube(false);
    }
  };

  // Background auto-sync when page mounts
  useEffect(() => {
    handleSyncYouTubeChannel(true);
  }, []);

  // Load channel videos from YouTube RSS
  const loadChannelVideos = async () => {
    setChannelLoading(true);
    try {
      const res = await fetch('/api/youtube-videos?type=video');
      const json = await res.json();
      setChannelVideos(json.data || []);
    } catch { }
    finally { setChannelLoading(false); }
  };

  // Build a set of saved YouTube IDs from DB when channel tab opens
  useEffect(() => {
    if (activeTab !== 'channel') return;
    loadChannelVideos();
    authFetch(getBackendApiUrl('/api/admin/videos?page=1&limit=200'))
      .then(r => r.json())
      .then(json => {
        const saved = new Set<string>();
        const featured = new Map<string, string>();
        (json.data?.videos || []).forEach((v: VideoData) => {
          saved.add(safeYouTubeId(v.youtubeId));
          if (v.isFeatured) featured.set(safeYouTubeId(v.youtubeId), v.id);
        });
        setSavedIds(saved);
        setFeaturedIds(featured);
      })
      .catch(() => { });
  }, [activeTab]);

  // Open Import Modal for a Channel Video
  const openImportModal = (cv: any) => {
    setImportingCv(cv);
    setImportCategoryId('');
    setImportModalOpen(true);
  };

  // Confirm and save imported video into DB
  const handleConfirmImport = async () => {
    if (!importingCv) return;
    const cleanId = safeYouTubeId(importingCv.youtubeId);
    setChannelImporting(cleanId);
    try {
      const selectedCatObj = categories.find((c) => c.id === importCategoryId);
      const res = await authFetch(getBackendApiUrl('/api/admin/videos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: importingCv.title,
          titleGu: importingCv.title,
          titleHi: importingCv.title,
          youtubeId: cleanId,
          type: 'video',
          description: '',
          duration: importingCv.duration || '0:00',
          isFeatured: true,
          channel: 'Gujarat Post News',
          categoryId: importCategoryId || null,
          categoryName: selectedCatObj ? selectedCatObj.name : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Import failed');
      setSavedIds(prev => new Set([...prev, cleanId]));
      setImportModalOpen(false);
      setImportingCv(null);
      loadVideos();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setChannelImporting(null);
    }
  };

  // Toggle featured for a channel video (auto-saves to DB if not yet saved)
  const toggleFeatured = async (cv: any) => {
    const cleanId = safeYouTubeId(cv.youtubeId);
    setChannelFeaturing(cleanId);
    try {
      // 1. Fetch saved videos from DB to find exact record by YouTube ID
      const res = await authFetch(getBackendApiUrl('/api/admin/videos?page=1&limit=200'));
      const json = await res.json();
      const allDbVideos: VideoData[] = json.data?.videos || [];
      const dbVideo = allDbVideos.find((v: VideoData) => safeYouTubeId(v.youtubeId) === cleanId);

      if (dbVideo) {
        const newFeatured = !dbVideo.isFeatured;
        const upRes = await authFetch(getBackendApiUrl(`/api/admin/videos/${dbVideo.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFeatured: newFeatured }),
        });
        if (!upRes.ok) throw new Error('Failed to update feature status');

        setFeaturedIds(prev => {
          const next = new Map(prev);
          if (newFeatured) next.set(cleanId, dbVideo.id);
          else next.delete(cleanId);
          return next;
        });
        setVideos(prev => prev.map(v => (safeYouTubeId(v.youtubeId) === cleanId ? { ...v, isFeatured: newFeatured } : v)));
      } else {
        // Auto-create in DB with isFeatured: true seamlessly
        const createRes = await authFetch(getBackendApiUrl('/api/admin/videos'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: cv.title,
            titleGu: cv.title,
            titleHi: cv.title,
            youtubeId: cleanId,
            type: 'video',
            description: '',
            duration: cv.duration || '0:00',
            isFeatured: true,
            channel: 'Gujarat Post News',
          }),
        });
        const createJson = await createRes.json();
        if (!createRes.ok) throw new Error(createJson.error || 'Failed to feature video');
        const createdDbVideo = createJson.data;
        setSavedIds(prev => new Set([...prev, cleanId]));
        setFeaturedIds(prev => new Map(prev).set(cleanId, createdDbVideo.id));
        setVideos(prev => [createdDbVideo, ...prev]);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setChannelFeaturing(null);
    }
  };

  // Toggle featured status for a video in Saved Videos tab
  const handleToggleFeaturedSaved = async (video: VideoData) => {
    const newFeatured = !video.isFeatured;
    try {
      const upRes = await authFetch(getBackendApiUrl(`/api/admin/videos/${video.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: newFeatured }),
      });
      const upJson = await upRes.json();
      if (!upRes.ok) throw new Error(upJson.error || 'Failed to update feature status');

      const cleanId = safeYouTubeId(video.youtubeId);
      setVideos(prev => prev.map(v => (v.id === video.id ? { ...v, isFeatured: newFeatured } : v)));
      setFeaturedIds(prev => {
        const next = new Map(prev);
        if (newFeatured) next.set(cleanId, video.id);
        else next.delete(cleanId);
        return next;
      });
    } catch (err: any) {
      alert(err.message);
    }
  };




  // Open Edit Modal
  const openEdit = (video: VideoData) => {
    setSelectedVideo(video);
    setTitle(video.title);
    setTitleGu(video.titleGu);
    setTitleHi(video.titleHi);
    setYoutubeId(video.youtubeId);
    setType(video.type);
    setCategoryId(video.categoryId || '');
    setDescription(video.description || '');
    setDuration(video.duration);
    setIsFeatured(video.isFeatured);
    setChannel(video.channel || 'Gujarat Post News');
    setEditModalOpen(true);
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideo) return;

    if (selectedVideo.isFeatured && !isFeatured) {
      const resCount = await authFetch(getBackendApiUrl('/api/admin/videos?page=1&limit=200'));
      const jsonCount = await resCount.json();
      const featCount = (jsonCount.data?.videos || []).filter((v: any) => v.isFeatured).length;
      if (featCount <= 3) {
        alert('Minimum 3 featured videos are required for the homepage layout! Please feature another video before unfeaturing this one.');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/videos/${selectedVideo.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleGu,
          titleGu,
          titleHi: titleGu,
          youtubeId,
          type,
          description,
          duration,
          isFeatured,
          channel,
          categoryId: categoryId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update video');

      clearApiCache();

      setVideos(prev => prev.map(v => v.id === selectedVideo.id ? json.data : v));
      setFeaturedIds(prev => {
        const next = new Map(prev);
        const cleanId = safeYouTubeId(youtubeId);
        if (isFeatured) next.set(cleanId, selectedVideo.id);
        else next.delete(cleanId);
        return next;
      });
      setEditModalOpen(false);
      setSelectedVideo(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Video
  const confirmDeleteVideo = async () => {
    if (!deleteTargetVideo) return;
    setDeletingVideo(true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/videos/${deleteTargetVideo.id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete video');
      setVideos(prev => prev.filter(v => v.id !== deleteTargetVideo.id));
      setTotalVideosCount(prev => Math.max(0, prev - 1));
      setFeaturedIds(prev => {
        const next = new Map(prev);
        next.delete(safeYouTubeId(deleteTargetVideo.youtubeId));
        return next;
      });
      setDeleteTargetVideo(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete video');
    } finally {
      setDeletingVideo(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Video Management</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Auto-sync YouTube channel videos, automatically save them into database, and feature latest top 20 videos.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleSyncYouTubeChannel(false)}
            disabled={syncingYouTube}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-700 shadow-sm shadow-red-600/20 disabled:opacity-50 cursor-pointer"
            title="Auto-sync and save all YouTube channel videos"
          >
            <RefreshCw className={`h-4 w-4 ${syncingYouTube ? 'animate-spin' : ''}`} />
            <span>{syncingYouTube ? 'Syncing YouTube...' : '⚡ Auto-Sync YouTube'}</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-2 animate-fade-in">
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900 w-fit">
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${activeTab === 'saved'
            ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
        >
          <VideoIcon className="h-4 w-4" />
          Saved Videos
        </button>
        <button
          onClick={() => setActiveTab('channel')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${activeTab === 'channel'
            ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
        >
          <YoutubeIcon className="h-4 w-4 text-red-500" />
          Channel Videos
        </button>
      </div>

      {/* ─── SAVED VIDEOS TAB ─── */}
      {activeTab === 'saved' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-lg">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search title or description..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-200 shadow-sm">
                <VideoIcon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                <span>Total Videos: <strong className="text-zinc-950 dark:text-white">{totalVideosCount || videos.length}</strong></span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 shadow-sm">
                <Bookmark className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>Featured: <strong className="text-amber-950 dark:text-amber-200">{totalFeaturedCount || videos.filter(v => v.isFeatured).length}</strong></span>
              </div>
            </div>
          </div>

          {/* Videos Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
              <span className="mt-2 text-sm">Querying video feeds...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">{error}</div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border rounded-2xl border-dashed bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-400">
              <VideoIcon className="h-12 w-12 text-zinc-300 mb-2" />
              <p className="text-sm font-semibold">No videos found</p>
              <p className="text-xs text-zinc-500">Add a YouTube link to feature videos on the portal.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {/* Thumbnail Container */}
                  <div
                    className="relative aspect-video w-full overflow-hidden bg-zinc-900 cursor-pointer"
                    onClick={() => setPreviewVideo(video)}
                  >
                    <img
                      src={video.thumbnail || `https://i.ytimg.com/vi/${safeYouTubeId(video.youtubeId)}/hqdefault.jpg`}
                      alt={video.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        const cId = safeYouTubeId(video.youtubeId);
                        if (cId && !img.src.includes('hqdefault.jpg')) {
                          img.src = `https://i.ytimg.com/vi/${cId}/hqdefault.jpg`;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover:bg-black/25 transition">
                      <span className="h-12 w-12 bg-white/95 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition duration-300">
                        <Play className="h-5 w-5 text-zinc-900 fill-current ml-0.5" />
                      </span>
                    </div>
                    {/* Type Badge */}
                    <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider font-mono">
                      {video.type}
                    </span>
                    {/* Duration */}
                    <span className="absolute bottom-2 left-2 rounded bg-zinc-900/85 px-1.5 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {video.duration}
                    </span>
                    {/* Featured Badge */}
                    {video.isFeatured && (
                      <span className="absolute top-2 left-2 rounded bg-accent px-1.5 py-0.5 text-[9px] font-black text-white flex items-center gap-1 uppercase tracking-wide">
                        <Bookmark className="h-2.5 w-2.5 fill-current" /> Featured
                      </span>
                    )}
                  </div>

                  {/* Text detail */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      {(video.categoryName || video.category?.name) && (
                        <div className="mb-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold bg-red-50 text-[#B3121B] dark:bg-red-950/40 dark:text-red-300">
                            <FolderOpen className="h-3 w-3" />
                            <span>{video.category?.nameGu || video.categoryName || video.category?.name}</span>
                          </span>
                        </div>
                      )}
                      <p className="line-clamp-2 text-sm font-bold text-zinc-900 dark:text-white group-hover:text-accent transition-colors">
                        {video.title}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-mono mt-1">
                        YT ID: {video.youtubeId}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 mt-4 border-t pt-3 border-zinc-100 dark:border-zinc-800">
                      <button
                        onClick={() => handleToggleFeaturedSaved(video)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${video.isFeatured
                          ? 'bg-yellow-400 text-yellow-950 hover:bg-yellow-300 dark:bg-yellow-500 dark:text-yellow-950 shadow-sm'
                          : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 shadow-sm'
                          }`}
                      >
                        {video.isFeatured ? (
                          <><StarOff className="h-3.5 w-3.5" /> Unfeature</>
                        ) : (
                          <><Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> Feature</>
                        )}
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(video)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white"
                          title="Edit metadata"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetVideo(video)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-950/20"
                          title="Delete video"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && videos.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-500">
                Showing Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-55 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-850"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-55 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-850"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── CHANNEL VIDEOS TAB ─── */}
      {activeTab === 'channel' && (
        <div className="space-y-4">
          {/* Channel header */}
          <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                <YoutubeIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Gujarat Post — Live YouTube Channel</p>
                <p className="text-xs text-zinc-500">Showing latest videos (no Shorts) — use ⭐ to feature or 📥 to import</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSyncYouTubeChannel(false)}
                disabled={syncingYouTube}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncingYouTube ? 'animate-spin' : ''}`} />
                {syncingYouTube ? 'Syncing...' : '⚡ Sync & Save All to Database'}
              </button>
              <button
                onClick={loadChannelVideos}
                disabled={channelLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${channelLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Channel videos grid */}
          {channelLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Loader2 className="h-10 w-10 animate-spin text-red-400" />
              <span className="mt-2 text-sm">Fetching from YouTube channel...</span>
            </div>
          ) : channelVideos.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">No videos found from channel.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {channelVideos.map((cv: any) => {
                const cleanId = safeYouTubeId(cv.youtubeId);
                const isSaved = savedIds.has(cleanId);
                const isFeat = featuredIds.has(cleanId);
                const isImporting = channelImporting === cv.youtubeId;
                const isFeaturing = channelFeaturing === cleanId;
                const publishedDate = cv.publishedAt
                  ? (cv.publishedAt.includes('ago') || cv.publishedAt.includes('day') || cv.publishedAt.includes('month') || cv.publishedAt.includes('year') || cv.publishedAt.includes('hour'))
                    ? cv.publishedAt
                    : !isNaN(Date.parse(cv.publishedAt))
                      ? new Date(cv.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : cv.publishedAt
                  : '';
                return (
                  <div key={cv.youtubeId} className={`group relative flex flex-col rounded-2xl border bg-white overflow-hidden shadow-sm transition-all hover:shadow-md dark:bg-zinc-900 ${isFeat ? 'border-yellow-400 dark:border-yellow-500' : 'border-zinc-200 dark:border-zinc-800'}`}>
                    {/* Featured badge */}
                    {isFeat && (
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-black text-yellow-900">
                        <Star className="h-2.5 w-2.5 fill-current" /> FEATURED
                      </div>
                    )}
                    {/* Saved badge */}
                    {isSaved && !isFeat && (
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-black text-white">
                        ✓ SAVED
                      </div>
                    )}
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800">
                      <img
                        src={cv.thumbnail || `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`}
                        alt={cv.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e: any) => { e.target.src = `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`; }}
                      />
                      <a
                        href={`https://www.youtube.com/watch?v=${cleanId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-all"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-all">
                          <Play className="h-4 w-4 fill-current" />
                        </span>
                      </a>
                    </div>
                    {/* Info */}
                    <div className="flex flex-col gap-2 p-3 flex-1">
                      <p className="line-clamp-2 text-xs font-bold leading-snug text-zinc-900 dark:text-white">{cv.title}</p>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{cv.duration}</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{cv.views?.toLocaleString()}</span>
                        <span>{publishedDate}</span>
                      </div>
                      {/* Action buttons */}
                      <div className="mt-auto flex items-center gap-2 pt-1">
                        {isSaved ? (
                          <button
                            onClick={() => toggleFeatured(cv)}
                            disabled={isFeaturing}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${isFeat
                              ? 'bg-yellow-400 text-yellow-950 hover:bg-yellow-300 dark:bg-yellow-500 dark:text-yellow-950 shadow-sm'
                              : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 shadow-sm'
                              }`}
                          >
                            {isFeaturing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isFeat ? (
                              <><StarOff className="h-3.5 w-3.5" /> Unfeature</>
                            ) : (
                              <><Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> Feature</>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => openImportModal(cv)}
                            disabled={isImporting || channelImporting === safeYouTubeId(cv.youtubeId)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-sm transition-all"
                          >
                            {isImporting || channelImporting === safeYouTubeId(cv.youtubeId) ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            {isImporting || channelImporting === safeYouTubeId(cv.youtubeId) ? 'Importing...' : 'Import'}
                          </button>
                        )}
                      </div>


                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── IMPORT VIDEO MODAL WITH CATEGORY SELECTOR ─── */}
      {importModalOpen && importingCv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-150 dark:border-zinc-850">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Download className="h-5 w-5 text-red-500" />
                Import & Categorize Video
              </h3>
              <button
                onClick={() => { setImportModalOpen(false); setImportingCv(null); }}
                className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-3 items-center rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3 border border-zinc-200 dark:border-zinc-700">
              <img
                src={importingCv.thumbnail || `https://i.ytimg.com/vi/${safeYouTubeId(importingCv.youtubeId)}/hqdefault.jpg`}
                alt={importingCv.title}
                className="h-16 w-24 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-2 leading-snug">{importingCv.title}</p>
                <p className="text-[11px] text-zinc-500 mt-1 font-mono">Duration: {importingCv.duration || '0:00'}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Select Category for Video (કૅટેગરી પસંદ કરો)
              </label>
              <select
                value={importCategoryId}
                onChange={(e) => setImportCategoryId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
              >
                <option value="">Select Category (Optional / Default)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.nameGu || cat.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setImportModalOpen(false); setImportingCv(null); }}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={channelImporting === safeYouTubeId(importingCv.youtubeId)}
                className="flex items-center gap-2 rounded-xl bg-[#B3121B] px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-sm transition-all"
              >
                {channelImporting === safeYouTubeId(importingCv.youtubeId) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Save & Import Video
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ─── EDIT VIDEO MODAL ─── */}
      {editModalOpen && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-150 dark:border-zinc-850">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-zinc-500" />
                Edit Video Details
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  YouTube URL અથવા Video ID
                </label>
                <input
                  type="text"
                  placeholder="YouTube link paste કરો (youtu.be/... અથવા youtube.com/watch?v=...)"
                  value={youtubeId}
                  onChange={(e) => handleYoutubeInputChange(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    handleYoutubeInputChange(e.clipboardData.getData('text'));
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  required
                />
                {youtubeId && /^[a-zA-Z0-9_-]{11}$/.test(youtubeId) && (
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950/20">
                    <img
                      src={`https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`}
                      alt="thumbnail"
                      className="h-10 w-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div>
                      <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">✓ Video ID મળ્યો</p>
                      <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300">{youtubeId}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Gujarati title only */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  શીર્ષક (ગુજરાતી)
                </label>
                <input
                  type="text"
                  value={titleGu}
                  onChange={(e) => setTitleGu(e.target.value)}
                  placeholder="ગુજરાતીમાં શીર્ષક લખો..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  required
                />
              </div>

              {/* Video metadata settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Video Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  >
                    <option value="video">Standard Video</option>
                    <option value="short">YouTube Short</option>
                    <option value="podcast">Podcast</option>
                    <option value="interview">Interview</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              </div>

              {/* Category selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Category (કૅટેગરી)
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                >
                  <option value="">Select Category (Optional)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.nameGu || cat.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editIsFeatured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-zinc-300 accent-primary"
                />
                <label htmlFor="editIsFeatured" className="text-sm font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer">
                  Feature this video on homepage slider
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PLAY PREVIEW MODAL ─── */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4">
          <div className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
            <button
              onClick={() => setPreviewVideo(null)}
              className="absolute top-3 right-3 z-10 rounded-full p-2 bg-black/60 hover:bg-black/90 text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${safeYouTubeId(previewVideo.youtubeId)}?autoplay=1`}
              title={previewVideo.title}
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
      {/* ─── CUSTOM DELETE VIDEO CONFIRMATION MODAL ─── */}
      {deleteTargetVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => !deletingVideo && setDeleteTargetVideo(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-center">
            {/* Red Alert Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 text-[#B3121B] shadow-inner">
              <Trash2 className="h-7 w-7" />
            </div>

            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              Delete Video?
            </h3>
            <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-0.5">
              વીડિયો ડિલીટ કરવાની ખાતરી
            </p>

            {/* Video Preview Card */}
            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/60 text-left">
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                <img
                  src={deleteTargetVideo.thumbnail || `https://i.ytimg.com/vi/${safeYouTubeId(deleteTargetVideo.youtubeId)}/hqdefault.jpg`}
                  alt={deleteTargetVideo.title}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-black text-white uppercase font-mono">
                  {deleteTargetVideo.type || 'VIDEO'}
                </span>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {deleteTargetVideo.titleGu || deleteTargetVideo.title}
                </p>
                <p className="mt-1 text-[10px] font-mono text-zinc-400">
                  YT ID: {deleteTargetVideo.youtubeId}
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to delete this video? It will be permanently removed from the website and database.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={deletingVideo}
                onClick={() => setDeleteTargetVideo(null)}
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition disabled:opacity-50 cursor-pointer"
              >
                Cancel (રદ કરો)
              </button>
              <button
                type="button"
                disabled={deletingVideo}
                onClick={confirmDeleteVideo}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] py-2.5 text-xs font-black text-white hover:bg-red-700 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {deletingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deletingVideo ? 'Deleting...' : 'Delete Video'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
