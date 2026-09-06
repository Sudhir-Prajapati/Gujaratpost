'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Upload,
  UploadCloud,
  Trash2,
  Edit2,
  Loader2,
  X,
  Image as ImageIcon,
  Camera,
  Copyright,
  Compass,
  Plus,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Check
} from 'lucide-react';
import { getBackendApiUrl, authFetch } from '@/lib/api';
import { PHOTOS } from '@/data';

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

function CustomCategorySelect({
  selectedCategory,
  onSelectCategory,
  availableCategories,
}: {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  availableCategories: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryIcon = (cat: string) => {
    if (cat.includes('ધર્મ')) return '🕌';
    if (cat.includes('ઉત્સવ')) return '🎉';
    if (cat.includes('પ્રવાસ')) return '✈️';
    if (cat.includes('ખેલ')) return '🏏';
    if (cat.includes('સંસ્કૃતિ')) return '🎭';
    if (cat.includes('રાજકારણ')) return '🏛️';
    return '📁';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between select-none">
        <span>કેટેગરી (CATEGORY)</span>
        {selectedCategory && (
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 lowercase">
            સેલેક્ટેડ: {selectedCategory}
          </span>
        )}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-xl border border-zinc-200 bg-white dark:bg-zinc-900/90 px-4 py-3 text-sm font-extrabold text-zinc-900 transition-all hover:bg-zinc-50 hover:border-red-500/40 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-zinc-800 dark:text-white cursor-pointer shadow-sm"
      >
        <span className="flex items-center gap-2">
          {selectedCategory ? (
            <span className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-3 py-1 rounded-lg text-xs font-black border border-red-200 dark:border-red-900/50">
              <span>{getCategoryIcon(selectedCategory)}</span>
              <span>{selectedCategory}</span>
            </span>
          ) : (
            <span className="text-zinc-400 text-sm font-semibold">કેટેગરી પસંદ કરો...</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-red-600' : ''}`} />
      </button>

      {/* Floating Absolute Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[100] max-h-60 overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
          {availableCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onSelectCategory(cat);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-extrabold text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#B3121B] text-white shadow-md'
                    : 'text-zinc-800 hover:bg-red-50 hover:text-red-600 dark:text-zinc-200 dark:hover:bg-zinc-800/80 dark:hover:text-red-400'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{getCategoryIcon(cat)}</span>
                  <span>{cat}</span>
                </span>
                {isSelected && <Check className="h-4 w-4 text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
  const [photographer, setPhotographer] = useState('Gujarat Post Team');
  const [copyright, setCopyright] = useState('© Gujarat Post');
  const [category, setCategory] = useState('');
  const DEFAULT_CATEGORIES = ['ધર્મ', 'ઉત્સવ', 'પ્રવાસ', 'ખેલ', 'સંસ્કૃતિ', 'મનોરંજન', 'ગુજરાત'];
  const [availableCategories, setAvailableCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('gp-gallery-categories');
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
    return DEFAULT_CATEGORIES;
  });
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formLang, setFormLang] = useState<'gu' | 'en' | 'hi'>('gu');

  // Custom Centered Alert / Notification Modal State
  const [toastModal, setToastModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success', title = '') => {
    setToastModal({
      isOpen: true,
      title: title || (type === 'success' ? 'સફળતા' : 'ધ્યાન આપો'),
      message,
      type,
    });
  };

  // Fetch photos
  useEffect(() => {
    async function loadPhotos() {
      setLoading(true);
      try {
        const url = getBackendApiUrl(`/api/admin/gallery?page=${page}&limit=100&query=${encodeURIComponent(query)}`);
        const res = await authFetch(url);
        const json = await res.json();
        let fetchedPhotos: any[] = (res.ok && json.data?.photos) ? json.data.photos : [];
        // Only pad with defaults if the API returned fewer than 5 (minimum 5 guarantee)
        if (fetchedPhotos.length < 5) {
          const existingIds = new Set(fetchedPhotos.map((p: any) => p.id || p.src));
          for (const defPhoto of PHOTOS) {
            if (fetchedPhotos.length >= 5) break;
            if (!existingIds.has(defPhoto.id) && !existingIds.has(defPhoto.src)) {
              fetchedPhotos.push(defPhoto);
            }
          }
        }
        setPhotos(fetchedPhotos);
        setTotalPages(json.data?.totalPages || 1);

        // Merge categories from fetched photos into localStorage-persisted list
        const extraCats = fetchedPhotos.map((p: any) => p.category).filter(Boolean);
        if (extraCats.length > 0) {
          setAvailableCategories(prev => {
            const merged = Array.from(new Set([...prev, ...extraCats]));
            try { localStorage.setItem('gp-gallery-categories', JSON.stringify(merged)); } catch { }
            return merged;
          });
        }
      } catch (err: any) {
        setPhotos(PHOTOS as any);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }
    loadPhotos();
  }, [page, query]);

  // Add new category handler — persists to localStorage
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (availableCategories.includes(trimmed)) {
      showNotification(`"${trimmed}" category already exists.`, 'error', 'ધ્યાન આપો');
      return;
    }
    setAvailableCategories(prev => {
      const updated = [...prev, trimmed];
      try { localStorage.setItem('gp-gallery-categories', JSON.stringify(updated)); } catch { }
      return updated;
    });
    setNewCategoryName('');
    setNewCategoryModalOpen(false);
    showNotification(`"${trimmed}" category added successfully!`, 'success', 'સફળતા');
  };

  // Handle local file upload first to retrieve URL
  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setSrc(json.url);
    } catch (err: any) {
      showNotification(err.message || 'ઈમેજ અપલોડ કરવામાં ભૂલ આવી', 'error');
    } finally {
      setUploading(false);
    }
  };



  // Submit new photo to gallery db
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!src) return showNotification('કૃપા કરીને ઈમેજ લિંક દાખલ કરો અથવા કમ્પ્યુટરથી ઈમેજ ફાઇલ પસંદ કરો', 'error');
    setUploading(true);
    try {
      const finalCat = category || 'ધર્મ';

      if (finalCat) {
        setAvailableCategories(prev => Array.from(new Set([...prev, finalCat])));
      }

      const res = await authFetch(getBackendApiUrl('/api/admin/gallery'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          src,
          alt: alt || captionGu || 'Gujarat Post Gallery',
          caption: caption || captionGu,
          captionGu: captionGu || caption,
          captionHi,
          category: finalCat,
          photographer: photographer || 'Gujarat Post Team',
          copyright: copyright || '© Gujarat Post'
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'ઈમેજ સેવ કરવામાં ભૂલ આવી');

      const savedPhoto = json.data || {
        id: `photo-${Date.now()}`,
        src,
        alt: alt || captionGu || 'Gujarat Post Gallery',
        caption: caption || captionGu,
        captionGu: captionGu || caption,
        category,
        photographer: photographer || 'Gujarat Post Team',
        copyright: copyright || '© Gujarat Post',
        createdAt: new Date().toISOString()
      };

      // Reset & update list while preserving minimum 5 photos
      setPhotos(prev => {
        let updated = [savedPhoto, ...prev.filter(p => p.id !== savedPhoto.id)];
        if (updated.length < 5) {
          const existingIds = new Set(updated.map((p: any) => p.id || p.src));
          for (const defPhoto of PHOTOS) {
            if (updated.length >= 5) break;
            if (!existingIds.has(defPhoto.id) && !existingIds.has(defPhoto.src)) {
              updated.push(defPhoto);
            }
          }
        }
        return updated;
      });
      setUploadModalOpen(false);
      setSrc('');
      setAlt('');
      setCaption('');
      setCaptionGu('');
      setCaptionHi('');
      setCategory('ધર્મ');
      setPhotographer('Gujarat Post Team');
      setCopyright('© Gujarat Post');
      showNotification('ઈમેજ સફળતાપૂર્વક સેવ થઈ ગઈ છે!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'ઈમેજ સેવ કરવામાં ભૂલ આવી', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Delete photo
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo from the gallery?')) return;
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/gallery/${id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete photo');
      setPhotos(prev => prev.filter(p => p.id !== id));
      showNotification('ઈમેજ સેવ સફળતાપૂર્વક ડિલીટ થઈ ગઈ છે!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'ડિલીટ કરવામાં ભૂલ આવી', 'error');
    }
  };

  // Open Edit Modal
  const openEdit = (photo: PhotoData) => {
    setSelectedPhoto(photo);
    setAlt(photo.alt || '');
    setCaption(photo.caption || '');
    setCaptionGu(photo.captionGu || photo.caption || '');
    setCaptionHi(photo.captionHi || '');
    const currentCat = photo.category || '';
    setCategory(currentCat);
    if (currentCat && !availableCategories.includes(currentCat)) {
      setAvailableCategories(prev => [...prev, currentCat]);
    }
    setPhotographer(photo.photographer || 'Gujarat Post Team');
    setCopyright(photo.copyright || '© Gujarat Post');
    setFormLang('gu');
    setEditModalOpen(true);
  };

  // Submit Edit Form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhoto) return;
    setUploading(true);
    try {
      const finalCat = category || 'ધર્મ';

      if (finalCat) {
        setAvailableCategories(prev => Array.from(new Set([...prev, finalCat])));
      }

      const res = await authFetch(getBackendApiUrl(`/api/admin/gallery/${selectedPhoto.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          src: selectedPhoto.src, alt, caption, captionGu, captionHi, category: finalCat, photographer, copyright
        }),
      });
      const json = await res.json();
      const updatedPhoto = {
        ...selectedPhoto,
        ...(json.data || {}),
        category: finalCat,
        captionGu: captionGu || caption,
        caption: caption || captionGu,
        alt: alt || captionGu || 'Gujarat Post Gallery',
        photographer,
        copyright
      };

      setPhotos(prev => prev.map(p => p.id === selectedPhoto.id ? updatedPhoto : p));
      setEditModalOpen(false);
      setSelectedPhoto(null);
      showNotification('ફોટો કેટેગરી અને ડિટેલ્સ સફળતાપૂર્વક અપડેટ થઈ ગઈ છે!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'અપડેટ કરવામાં ભૂલ આવી', 'error');
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setNewCategoryModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-900 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white cursor-pointer whitespace-nowrap w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 text-[#B3121B] shrink-0" />
            <span>કેટેગરી ઉમેરો (Add Category)</span>
          </button>

          <button
            onClick={() => {
              setFormLang('en');
              setUploadModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-all hover:bg-[#8e0e15] shadow-md shadow-[#B3121B]/20 cursor-pointer whitespace-nowrap w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span>Upload Image</span>
          </button>
        </div>
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
              {/* Image Preview with Category Badge */}
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-150 dark:bg-zinc-950">
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="inline-flex items-center rounded-lg bg-[#B3121B] px-2.5 py-1 text-xs font-black text-white shadow-md">
                    {photo.category || '—'}
                  </span>
                </div>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setUploadModalOpen(false)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-7 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-5 cursor-default animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 border-zinc-150 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-100 dark:bg-red-950/50 text-[#B3121B] rounded-2xl">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white">
                    નવી ઈમેજ અપલોડ કરો (Upload Image)
                  </h3>
                  <p className="text-xs font-semibold text-zinc-500">
                    ગેલેરીમાં નવી તસવીર ઉમેરો અથવા URL દાખલ કરો
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Upload selector / Live Preview */}
              <div>
                <label className="block text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  ૧. કમ્પ્યુટરથી ઈમેજ પસંદ કરો (Select Image File from PC)
                </label>
                
                {src ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-red-500/40 bg-zinc-950 shadow-md group">
                    <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <span className="text-white text-xs font-black bg-black/70 px-3.5 py-1.5 rounded-full backdrop-blur">
                        ઇમેજ તૈયાર છે (Image Ready)
                      </span>
                      <button
                        type="button"
                        onClick={() => setSrc('')}
                        className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full shadow-lg transition transform hover:scale-110 cursor-pointer"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="relative flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-950/30 hover:bg-red-50/40 dark:hover:bg-red-950/20 hover:border-red-500/50 transition-all cursor-pointer group p-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 bg-red-100 dark:bg-red-950/60 text-[#B3121B] dark:text-red-400 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                        {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-zinc-800 dark:text-zinc-200">
                          {uploading ? 'અપલોડ થઈ રહ્યું છે...' : 'અહીં ક્લિક કરીને ફાઈલ પસંદ કરો'}
                        </p>
                        <p className="text-xs font-bold text-zinc-400">
                          PNG, JPG, WEBP (Max 10MB)
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLocalFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Divider OR */}
              <div className="relative flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <span className="relative bg-white dark:bg-zinc-900 px-3 text-[11px] font-black uppercase text-zinc-400 tracking-wider select-none">
                  અથવા ઈમેજ URL લિંક (OR VIA IMAGE URL)
                </span>
              </div>

              {/* Or manual URL */}
              <div>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={src}
                  onChange={(e) => setSrc(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-white transition-all shadow-sm"
                />
              </div>

              {/* Gujarati Title & Caption */}
              <div>
                <label className="block text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  ટાઇટલ / કેપ્શન (ગુજરાતી)
                </label>
                <input
                  type="text"
                  placeholder="અહીં ગુજરાતીમાં શીર્ષક લખો..."
                  value={captionGu}
                  onChange={(e) => {
                    setCaptionGu(e.target.value);
                    setCaption(e.target.value);
                    setAlt(e.target.value);
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-white transition-all shadow-sm"
                />
              </div>

              {/* Custom Category Selection */}
              <CustomCategorySelect
                selectedCategory={category}
                onSelectCategory={setCategory}
                availableCategories={availableCategories}
              />

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Photographer
                  </label>
                  <input
                    type="text"
                    value={photographer}
                    onChange={(e) => setPhotographer(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-white transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Copyright Holder
                  </label>
                  <input
                    type="text"
                    placeholder="© Gujarat Post"
                    value={copyright}
                    onChange={(e) => setCopyright(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-white transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-bold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !src}
                  className="rounded-xl bg-[#B3121B] px-6 py-2.5 text-sm font-black text-white hover:bg-[#8e0e15] shadow-lg shadow-[#B3121B]/25 disabled:opacity-50 transition cursor-pointer active:scale-95"
                >
                  {uploading ? 'અપલોડ થઈ રહ્યું છે...' : 'સેવ કરો (Save Photo)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT IMAGE MODAL ─── */}
      {editModalOpen && selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
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

              {/* Gujarati Title & Caption */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  ટાઇટલ / કેપ્શન (ગુજરાતી)
                </label>
                <input
                  type="text"
                  placeholder="અહીં ગુજરાતીમાં શીર્ષક લખો..."
                  value={captionGu}
                  onChange={(e) => {
                    setCaptionGu(e.target.value);
                    setCaption(e.target.value);
                    setAlt(e.target.value);
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm font-bold text-foreground focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                />
              </div>

              {/* Custom Category Selection */}
              <CustomCategorySelect
                selectedCategory={category}
                onSelectCategory={setCategory}
                availableCategories={availableCategories}
              />

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
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

      {/* ─── CENTERED CUSTOM ALERT / NOTIFICATION MODAL ─── */}
      {toastModal.isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setToastModal(prev => ({ ...prev, isOpen: false }))}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 text-center space-y-4 animate-in zoom-in-95 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon Badge */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#B3121B]/10 text-[#B3121B] dark:bg-[#B3121B]/20">
              {toastModal.type === 'success' ? (
                <CheckCircle2 className="h-8 w-8 text-[#B3121B]" />
              ) : (
                <AlertCircle className="h-8 w-8 text-[#B3121B]" />
              )}
            </div>

            {/* Title & Message */}
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                {toastModal.title}
              </h3>
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300 leading-relaxed px-2">
                {toastModal.message}
              </p>
            </div>

            {/* Centered Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setToastModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full rounded-xl bg-[#B3121B] py-3 text-sm font-black text-white hover:bg-[#8e0e15] shadow-lg shadow-[#B3121B]/25 transition cursor-pointer"
              >
                બરાબર (OK)
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── ADD NEW CATEGORY MODAL ─── */}
      {newCategoryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => setNewCategoryModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4 cursor-default animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 border-zinc-150 dark:border-zinc-850">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#B3121B]" />
                નવી કેટેગરી ઉમેરો (Add Category)
              </h3>
              <button
                onClick={() => setNewCategoryModalOpen(false)}
                className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  કેટેગરીનું નામ (Category Name)
                </label>
                <input
                  type="text"
                  placeholder="દા.ત. શિરોમણિ, રાજકારણ, ખેલ-જગત..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#B3121B]/30 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  autoFocus
                />
              </div>

              {/* Existing Categories Badges List */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  હાલની કેટેગરીઓ (Existing Categories)
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-zinc-150 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/40 max-h-36 overflow-y-auto">
                  {availableCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-[#B3121B]/10 text-[#B3121B] dark:bg-[#B3121B]/20"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setNewCategoryModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCategoryName.trim()}
                  className="rounded-xl bg-[#B3121B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#8e0e15] disabled:opacity-50 transition cursor-pointer"
                >
                  સેવ કેટેગરી (Save Category)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
