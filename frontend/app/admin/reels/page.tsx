'use client';

import { useState, useEffect, useRef } from 'react';
import { getBackendApiUrl, authFetch } from '@/lib/api';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  X, 
  Smartphone,
  Video
} from 'lucide-react';

interface ReelData {
  id: string;
  type: string;
  heading: string;
  headingGu: string;
  headingHi: string;
  videoUrl: string | null;
  instaUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function ReelsPage() {
  const [reels, setReels] = useState<ReelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedReel, setSelectedReel] = useState<ReelData | null>(null);

  // Form states
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState('INSTAGRAM'); // INSTAGRAM | VIDEO
  const [heading, setHeading] = useState('');
  const [headingGu, setHeadingGu] = useState('');
  const [headingHi, setHeadingHi] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [instaUrl, setInstaUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // File upload states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Fetch reels
  const loadReels = async () => {
    setLoading(true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/reels`));
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch reels');
      setReels(json.data.reels || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReels();
  }, []);

  const resetForm = () => {
    setType('INSTAGRAM');
    setHeading('');
    setHeadingGu('');
    setHeadingHi('');
    setVideoUrl('');
    setInstaUrl('');
    setIsActive(true);
    setSelectedReel(null);
  };

  const openAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const openEditModal = (reel: ReelData) => {
    resetForm();
    setSelectedReel(reel);
    setType(reel.type);
    setHeading(reel.heading);
    setHeadingGu(reel.headingGu);
    setHeadingHi(reel.headingHi);
    setVideoUrl(reel.videoUrl || '');
    setInstaUrl(reel.instaUrl || '');
    setIsActive(reel.isActive);
    setEditModalOpen(true);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setVideoUrl(json.url || json.data?.url);
    } catch (err: any) {
      alert(err.message || 'Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heading) return alert('English heading is required');
    if (type === 'VIDEO' && !videoUrl) return alert('Video upload is required for Video type');
    if (type === 'INSTAGRAM' && !instaUrl) return alert('Instagram URL is required for Instagram type');

    setSaving(true);
    try {
      const url = selectedReel ? `/api/admin/reels/${selectedReel.id}` : '/api/admin/reels';
      const method = selectedReel ? 'PUT' : 'POST';

      const res = await authFetch(getBackendApiUrl(url), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          heading,
          headingGu,
          headingHi,
          videoUrl: type === 'VIDEO' ? videoUrl : null,
          instaUrl: type === 'INSTAGRAM' ? instaUrl : null,
          isActive,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save reel');

      setAddModalOpen(false);
      setEditModalOpen(false);
      loadReels();
    } catch (err: any) {
      alert(err.message || 'Error saving reel');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reel?')) return;
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/reels/${id}`), { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete reel');
      }
      setReels(reels.filter(r => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting reel');
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 relative max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="h-8 w-8 text-[#B3121B]" />
            Instagram Reels
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
            Manage your reels and short videos.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#B3121B] hover:bg-red-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md transition-all hover:shadow-lg active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Reel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Heading (EN / GU / HI)</th>
                <th className="px-6 py-4">Content</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#B3121B]" />
                    <p className="font-semibold">Loading reels...</p>
                  </td>
                </tr>
              ) : reels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-semibold">
                    No reels found.
                  </td>
                </tr>
              ) : (
                reels.map((reel) => (
                  <tr key={reel.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      {reel.type === 'VIDEO' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-black">
                          <Video className="h-3.5 w-3.5" /> Video
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-pink-100 text-pink-700 text-xs font-black">
                          <Smartphone className="h-3.5 w-3.5" /> Insta Link
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{reel.heading}</div>
                      <div className="text-slate-500 text-xs mt-1">{reel.headingGu}</div>
                      <div className="text-slate-500 text-xs">{reel.headingHi}</div>
                    </td>
                    <td className="px-6 py-4">
                      {reel.type === 'VIDEO' ? (
                        <a href={reel.videoUrl || '#'} target="_blank" className="text-blue-600 hover:underline text-xs font-bold line-clamp-1 break-all">
                          View Video
                        </a>
                      ) : (
                        <a href={reel.instaUrl || '#'} target="_blank" className="text-pink-600 hover:underline text-xs font-bold line-clamp-1 break-all">
                          {reel.instaUrl}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black ${reel.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {reel.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(reel)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(reel.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(addModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {addModalOpen ? 'Add New Reel' : 'Edit Reel'}
              </h3>
              <button
                onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Upload Type
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm font-semibold focus:border-[#B3121B] focus:ring-[#B3121B]"
                    >
                      <option value="INSTAGRAM">Instagram Link</option>
                      <option value="VIDEO">Native Video Upload</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Heading (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={heading}
                      onChange={(e) => setHeading(e.target.value)}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm focus:border-[#B3121B] focus:ring-[#B3121B]"
                      placeholder="Enter heading..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Heading (Gujarati)
                    </label>
                    <input
                      type="text"
                      value={headingGu}
                      onChange={(e) => setHeadingGu(e.target.value)}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm focus:border-[#B3121B] focus:ring-[#B3121B]"
                      placeholder="Enter Gujarati heading..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Heading (Hindi)
                    </label>
                    <input
                      type="text"
                      value={headingHi}
                      onChange={(e) => setHeadingHi(e.target.value)}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm focus:border-[#B3121B] focus:ring-[#B3121B]"
                      placeholder="Enter Hindi heading..."
                    />
                  </div>
                </div>

                {type === 'INSTAGRAM' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Instagram Reel URL *
                    </label>
                    <input
                      type="url"
                      required={type === 'INSTAGRAM'}
                      value={instaUrl}
                      onChange={(e) => setInstaUrl(e.target.value)}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm focus:border-[#B3121B] focus:ring-[#B3121B]"
                      placeholder="https://instagram.com/reel/..."
                    />
                  </div>
                )}

                {type === 'VIDEO' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Upload Video *
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      ref={fileInputRef}
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingVideo}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {uploadingVideo ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                        ) : (
                          'Select Video File'
                        )}
                      </button>
                      {videoUrl && (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                          Video ready
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-[#B3121B] focus:ring-[#B3121B]"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Active (visible on website)
                  </label>
                </div>

              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setAddModalOpen(false); setEditModalOpen(false); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingVideo}
                  className="bg-[#B3121B] hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Reel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
