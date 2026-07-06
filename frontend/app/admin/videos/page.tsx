'use client';

import { useState, useEffect } from 'react';
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
  Radio 
} from 'lucide-react';

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
  isFeatured: boolean;
  publishedAt: string;
  channel: string | null;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoData | null>(null);

  // Form states
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [titleGu, setTitleGu] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [type, setType] = useState('video'); // video | short | podcast | interview
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('0:00');
  const [isFeatured, setIsFeatured] = useState(false);
  const [channel, setChannel] = useState('Gujarat Post News');
  const [formLang, setFormLang] = useState<'en' | 'gu' | 'hi'>('en');

  // Fetch videos
  useEffect(() => {
    async function loadVideos() {
      setLoading(true);
      try {
        const url = `/api/admin/videos?page=${page}&limit=12&query=${encodeURIComponent(query)}&type=${selectedType}`;
        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch videos');
        setVideos(json.data.videos || []);
        setTotalPages(json.data.totalPages || 1);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadVideos();
  }, [page, query, selectedType]);

  // Submit Add video
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !youtubeId) return alert('Title and YouTube Video ID are required');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, titleGu, titleHi, youtubeId, type, description, duration, isFeatured, channel
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save video');

      setAddModalOpen(false);
      setTitle('');
      setTitleGu('');
      setTitleHi('');
      setYoutubeId('');
      setType('video');
      setDescription('');
      setDuration('0:00');
      setIsFeatured(false);
      setPage(1);

      // reload list
      const rRes = await fetch(`/api/admin/videos?page=1&limit=12&query=${encodeURIComponent(query)}&type=${selectedType}`);
      const rJson = await rRes.json();
      if (rRes.ok) setVideos(rJson.data.videos);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
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
    setDescription(video.description || '');
    setDuration(video.duration);
    setIsFeatured(video.isFeatured);
    setChannel(video.channel || 'Gujarat Post News');
    setFormLang('en');
    setEditModalOpen(true);
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideo) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/videos/${selectedVideo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, titleGu, titleHi, youtubeId, type, description, duration, isFeatured, channel
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update video');

      setVideos(prev => prev.map(v => v.id === selectedVideo.id ? json.data : v));
      setEditModalOpen(false);
      setSelectedVideo(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Video
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      const res = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete video');
      setVideos(prev => prev.filter(v => v.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Video Management</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Embed, organize, and feature YouTube videos, shorts, podcasts, and interviews.
          </p>
        </div>
        <button
          onClick={() => {
            setFormLang('en');
            setAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Video</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
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

          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-4 text-sm text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="video">Standard Video</option>
            <option value="short">YouTube Short</option>
            <option value="podcast">Podcast</option>
            <option value="interview">Interview</option>
          </select>
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
                  src={video.thumbnail} 
                  alt={video.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
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
                  <p className="line-clamp-2 text-sm font-bold text-zinc-900 dark:text-white group-hover:text-accent transition-colors">
                    {video.title}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1">
                    YT ID: {video.youtubeId}
                  </p>
                </div>

                <div className="flex justify-end gap-1.5 mt-4 border-t pt-3 border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => openEdit(video)}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white"
                    title="Edit metadata"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-950/20"
                    title="Delete video"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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

      {/* ─── ADD VIDEO MODAL ─── */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-150 dark:border-zinc-850">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <VideoIcon className="h-5 w-5 text-zinc-500" />
                Add Video Embed
              </h3>
              <button 
                onClick={() => setAddModalOpen(false)}
                className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  YouTube Video ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. A_5vL-ngK4M (extract from YouTube URL)"
                  value={youtubeId}
                  onChange={(e) => setYoutubeId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  required
                />
              </div>

              {/* Language switcher tabs */}
              <div className="flex border-b border-zinc-150 dark:border-zinc-800 mb-2">
                {(['en', 'gu', 'hi'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setFormLang(lang)}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                      formLang === lang 
                        ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white' 
                        : 'border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'gu' ? 'ગુજરાતી' : 'हिन्दी'}
                  </button>
                ))}
              </div>

              {formLang === 'en' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Title (EN)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                    required
                  />
                </div>
              )}

              {formLang === 'gu' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Title (GU)
                  </label>
                  <input
                    type="text"
                    value={titleGu}
                    onChange={(e) => setTitleGu(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              )}

              {formLang === 'hi' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Title (HI)
                  </label>
                  <input
                    type="text"
                    value={titleHi}
                    onChange={(e) => setTitleHi(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              )}

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
                    placeholder="e.g. 12:45"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Brief summary of the video content..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-zinc-300 accent-primary"
                />
                <label htmlFor="isFeatured" className="text-sm font-bold text-zinc-650 dark:text-zinc-350 cursor-pointer">
                  Feature this video on homepage slider
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-55 dark:border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-850 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  Save Video
                </button>
              </div>
            </form>
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
                  YouTube Video ID
                </label>
                <input
                  type="text"
                  value={youtubeId}
                  onChange={(e) => setYoutubeId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  required
                />
              </div>

              {/* Language switcher tabs */}
              <div className="flex border-b border-zinc-150 dark:border-zinc-800 mb-2">
                {(['en', 'gu', 'hi'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setFormLang(lang)}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                      formLang === lang 
                        ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white' 
                        : 'border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'gu' ? 'ગુજરાતી' : 'हिन्दी'}
                  </button>
                ))}
              </div>

              {formLang === 'en' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Title (EN)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                    required
                  />
                </div>
              )}

              {formLang === 'gu' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Title (GU)
                  </label>
                  <input
                    type="text"
                    value={titleGu}
                    onChange={(e) => setTitleGu(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              )}

              {formLang === 'hi' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Title (HI)
                  </label>
                  <input
                    type="text"
                    value={titleHi}
                    onChange={(e) => setTitleHi(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              )}

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
                <label htmlFor="editIsFeatured" className="text-sm font-bold text-zinc-650 dark:text-zinc-350 cursor-pointer">
                  Feature this video on homepage slider
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-55 dark:border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-850 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
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
              src={`${previewVideo.embedUrl}?autoplay=1`}
              title={previewVideo.title}
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
