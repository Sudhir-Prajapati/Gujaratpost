'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Upload, 
  Trash2, 
  Edit2, 
  Loader2, 
  X, 
  Image as ImageIcon,
  Camera,
  Copyright,
  Compass,
  Plus
} from 'lucide-react';

interface PhotoData {
  id: string;
  src: string;
  alt: string;
  caption: string;
  captionGu: string;
  captionHi: string;
  category: string;
  photographer: string;
  copyright: string;
  createdAt: string;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);

  // Form states for Upload
  const [uploading, setUploading] = useState(false);
  const [src, setSrc] = useState('');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [captionGu, setCaptionGu] = useState('');
  const [captionHi, setCaptionHi] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [copyright, setCopyright] = useState('');
  const [formLang, setFormLang] = useState<'en' | 'gu' | 'hi'>('en');

  // Fetch photos
  useEffect(() => {
    async function loadPhotos() {
      setLoading(true);
      try {
        const url = `/api/admin/gallery?page=${page}&limit=12&query=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch gallery photos');
        setPhotos(json.data.photos || []);
        setTotalPages(json.data.totalPages || 1);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPhotos();
  }, [page, query]);

  // Handle local file upload first to retrieve URL
  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setSrc(json.url);
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  // Submit new photo to gallery db
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!src) return alert('Please upload or provide an image URL');
    setUploading(true);
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          src, alt, caption, captionGu, captionHi, photographer, copyright
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save photo');
      
      // Reset & refresh
      setUploadModalOpen(false);
      setSrc('');
      setAlt('');
      setCaption('');
      setCaptionGu('');
      setCaptionHi('');
      setPhotographer('');
      setCopyright('');
      setPage(1);
      // reload photos
      const reloadRes = await fetch(`/api/admin/gallery?page=1&limit=12&query=${encodeURIComponent(query)}`);
      const reloadJson = await reloadRes.json();
      if (reloadRes.ok) setPhotos(reloadJson.data.photos);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete photo
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo from the gallery?')) return;
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete photo');
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Edit Modal
  const openEdit = (photo: PhotoData) => {
    setSelectedPhoto(photo);
    setAlt(photo.alt);
    setCaption(photo.caption);
    setCaptionGu(photo.captionGu);
    setCaptionHi(photo.captionHi);
    setPhotographer(photo.photographer);
    setCopyright(photo.copyright);
    setFormLang('en');
    setEditModalOpen(true);
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhoto) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/admin/gallery/${selectedPhoto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          src: selectedPhoto.src, alt, caption, captionGu, captionHi, photographer, copyright
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update photo details');

      setPhotos(prev => prev.map(p => p.id === selectedPhoto.id ? json.data : p));
      setEditModalOpen(false);
      setSelectedPhoto(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Gallery Management</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Upload, search, and manage high-quality media assets for your news articles.
          </p>
        </div>
        <button
          onClick={() => {
            setFormLang('en');
            setUploadModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shrink-0"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by caption, alt text or photographer..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
          />
        </div>
      </div>

      {/* Photo Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
          <span className="mt-2 text-sm">Querying media archive...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">{error}</div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-2xl border-dashed bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-400">
          <ImageIcon className="h-12 w-12 text-zinc-300 mb-2" />
          <p className="text-sm font-semibold">No media items found</p>
          <p className="text-xs text-zinc-500">Try uploading a new photo or refining your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <div 
              key={photo.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Image Preview */}
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-150 dark:bg-zinc-950">
                <img 
                  src={photo.src} 
                  alt={photo.alt}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>

              {/* Details */}
              <div className="flex-1 p-4 flex flex-col justify-between space-y-3">
                <div>
                  <p className="line-clamp-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    {photo.caption || 'No caption'}
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono mt-1 select-all truncate">
                    URL: {photo.src}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 border-t pt-2 border-zinc-100 dark:border-zinc-800">
                  <span className="flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">{photo.photographer || 'Staff'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Copyright className="h-3 w-3" />
                    <span className="truncate max-w-[80px]">{photo.copyright || 'GP'}</span>
                  </span>
                </div>
              </div>

              {/* Hover overlay actions */}
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-zinc-900/80 backdrop-blur p-1 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-850">
                <button
                  onClick={() => openEdit(photo)}
                  className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 rounded-lg"
                  title="Edit details"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 rounded-lg"
                  title="Delete image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && photos.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <span className="text-xs font-semibold text-zinc-500">
            Showing Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-850"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:pointer-events-none dark:border-zinc-850"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ─── UPLOAD IMAGE MODAL ─── */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-150 dark:border-zinc-850">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-zinc-500" />
                Upload New Image
              </h3>
              <button 
                onClick={() => setUploadModalOpen(false)}
                className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Upload selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Select File
                </label>
                <div className="flex gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLocalFileUpload}
                    className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-950/20"
                  />
                  {uploading && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold px-2">
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-400" /> Uploading...
                    </div>
                  )}
                </div>
              </div>

              {/* Or manual URL */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Or Image Source URL
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={src}
                  onChange={(e) => setSrc(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
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
                    Caption (EN)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              )}

              {formLang === 'gu' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Caption (GU)
                  </label>
                  <input
                    type="text"
                    value={captionGu}
                    onChange={(e) => setCaptionGu(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              )}

              {formLang === 'hi' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Caption (HI)
                  </label>
                  <input
                    type="text"
                    value={captionHi}
                    onChange={(e) => setCaptionHi(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Alt Text
                  </label>
                  <input
                    type="text"
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Photographer
                  </label>
                  <input
                    type="text"
                    value={photographer}
                    onChange={(e) => setPhotographer(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Copyright Holder
                </label>
                <input
                  type="text"
                  placeholder="Gujarat Post News"
                  value={copyright}
                  onChange={(e) => setCopyright(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-55 dark:border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !src}
                  className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-850 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT IMAGE MODAL ─── */}
      {editModalOpen && selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-150 dark:border-zinc-850">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-zinc-500" />
                Edit Image Metadata
              </h3>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-100">
                <img src={selectedPhoto.src} alt={alt} className="w-full h-full object-cover" />
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
                    Caption (EN)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              )}

              {formLang === 'gu' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Caption (GU)
                  </label>
                  <input
                    type="text"
                    value={captionGu}
                    onChange={(e) => setCaptionGu(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              )}

              {formLang === 'hi' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Caption (HI)
                  </label>
                  <input
                    type="text"
                    value={captionHi}
                    onChange={(e) => setCaptionHi(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Alt Text
                  </label>
                  <input
                    type="text"
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Photographer
                  </label>
                  <input
                    type="text"
                    value={photographer}
                    onChange={(e) => setPhotographer(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Copyright Holder
                </label>
                <input
                  type="text"
                  value={copyright}
                  onChange={(e) => setCopyright(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                />
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
                  disabled={uploading}
                  className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-850 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
