'use client';

import { useState, useEffect, useRef } from 'react';
import { getBackendApiUrl, authFetch } from '@/lib/api';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  X, 
  Image as ImageIcon,
  BookOpen
} from 'lucide-react';
import Image from 'next/image';

interface WebStoryData {
  id: string;
  heading: string;
  headingGu: string | null;
  headingHi: string | null;
  image1: string;
  image2: string | null;
  image3: string | null;
  image4: string | null;
  image5: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function WebStoriesPage() {
  const [stories, setStories] = useState<WebStoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<WebStoryData | null>(null);

  // Form states
  const [saving, setSaving] = useState(false);
  const [heading, setHeading] = useState('');
  const [headingGu, setHeadingGu] = useState('');
  const [headingHi, setHeadingHi] = useState('');
  const [image1, setImage1] = useState('');
  const [image2, setImage2] = useState('');
  const [image3, setImage3] = useState('');
  const [image4, setImage4] = useState('');
  const [image5, setImage5] = useState('');
  const [isActive, setIsActive] = useState(true);

  // File upload states
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);

  // Fetch stories
  const loadStories = async () => {
    setLoading(true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/web-stories`));
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch web stories');
      setStories(json.data.stories || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const resetForm = () => {
    setHeading('');
    setHeadingGu('');
    setHeadingHi('');
    setImage1('');
    setImage2('');
    setImage3('');
    setImage4('');
    setImage5('');
    setIsActive(true);
    setSelectedStory(null);
  };

  const openAddModal = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const openEditModal = (story: WebStoryData) => {
    resetForm();
    setSelectedStory(story);
    setHeading(story.heading);
    setHeadingGu(story.headingGu || '');
    setHeadingHi(story.headingHi || '');
    setImage1(story.image1);
    setImage2(story.image2 || '');
    setImage3(story.image3 || '');
    setImage4(story.image4 || '');
    setImage5(story.image5 || '');
    setIsActive(story.isActive);
    setEditModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(imageIndex);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      
      const uploadedUrl = json.url || json.data?.url;
      if (imageIndex === 1) setImage1(uploadedUrl);
      if (imageIndex === 2) setImage2(uploadedUrl);
      if (imageIndex === 3) setImage3(uploadedUrl);
      if (imageIndex === 4) setImage4(uploadedUrl);
      if (imageIndex === 5) setImage5(uploadedUrl);

    } catch (err: any) {
      alert(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSave = async () => {
    if (!heading) {
      alert('Heading (English) is required');
      return;
    }
    if (!image1) {
      alert('At least Image 1 is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        heading,
        headingGu,
        headingHi,
        image1,
        image2,
        image3,
        image4,
        image5,
        isActive,
      };

      const url = selectedStory 
        ? getBackendApiUrl(`/api/admin/web-stories/${selectedStory.id}`)
        : getBackendApiUrl(`/api/admin/web-stories`);
        
      const method = selectedStory ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save web story');

      setAddModalOpen(false);
      setEditModalOpen(false);
      loadStories();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this web story?')) return;
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/web-stories/${id}`), {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete');
      }
      loadStories();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const ImageUploaderBlock = ({ 
    index, 
    value, 
    setValue 
  }: { 
    index: number, 
    value: string, 
    setValue: (val: string) => void 
  }) => {
    return (
      <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-800">
        {value ? (
          <>
            <Image src={value} alt={`Slide ${index}`} fill className="object-cover" />
            <button
              onClick={() => setValue('')}
              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 z-10"
              title="Remove image"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            {uploadingImage === index ? (
              <div className="flex flex-col items-center text-primary">
                <Loader2 size={24} className="animate-spin mb-2" />
                <span className="text-xs">Uploading...</span>
              </div>
            ) : (
              <>
                <ImageIcon size={24} className="text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 mb-2">Image {index} {index === 1 ? '*' : ''}</span>
                <label className="cursor-pointer bg-primary/10 text-primary px-3 py-1.5 rounded text-sm hover:bg-primary/20 transition-colors">
                  Select
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, index)}
                  />
                </label>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="text-primary" />
            Web Stories
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage your image-based web stories. You can upload up to 5 images per story.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-bold text-sm shrink-0"
        >
          <Plus size={18} />
          <span>Add Web Story</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 dark:bg-red-900/20 dark:border-red-900/50">
          {error}
        </div>
      )}

      {/* Main content */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 size={32} className="animate-spin mb-4 text-primary" />
            <p>Loading web stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
              <BookOpen size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Web Stories Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
              Create your first web story to display it on the website.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-bold text-sm"
            >
              <Plus size={18} />
              <span>Add Web Story</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">Preview</th>
                    <th className="px-6 py-4 font-medium">Heading (EN / GU)</th>
                    <th className="px-6 py-4 font-medium">Images</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {stories.map((story) => {
                    let imageCount = 0;
                    if (story.image1) imageCount++;
                    if (story.image2) imageCount++;
                    if (story.image3) imageCount++;
                    if (story.image4) imageCount++;
                    if (story.image5) imageCount++;

                    return (
                      <tr key={story.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-16 h-24 relative rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700">
                            <Image src={story.image1} alt="Cover" fill className="object-cover" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white mb-1">{story.heading}</div>
                          {story.headingGu && <div className="text-gray-500 dark:text-gray-400 text-xs">{story.headingGu}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {imageCount} / 5
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            story.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {story.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                          {new Date(story.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(story)}
                              className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(story.id)}
                              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-800">
              {stories.map((story) => {
                let imageCount = 0;
                if (story.image1) imageCount++;
                if (story.image2) imageCount++;
                if (story.image3) imageCount++;
                if (story.image4) imageCount++;
                if (story.image5) imageCount++;

                return (
                  <div key={story.id} className="p-3.5 flex gap-3 items-start">
                    <div className="w-16 h-24 relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0 shadow-xs border border-gray-200 dark:border-gray-700">
                      <Image src={story.image1} alt="Cover" fill className="object-cover" />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            story.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {story.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400">
                            {imageCount} / 5 Images
                          </span>
                        </div>

                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug">
                          {story.heading}
                        </h4>
                        {story.headingGu && (
                          <p className="text-gray-500 dark:text-gray-400 text-[11px] line-clamp-1 mt-0.5">
                            {story.headingGu}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800/80 text-[10px] text-gray-400">
                        <span>{new Date(story.createdAt).toLocaleDateString()}</span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(story)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-primary hover:text-white transition-colors"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(story.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(addModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl shadow-xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editModalOpen ? 'Edit Web Story' : 'Add New Web Story'}
              </h2>
              <button
                onClick={() => {
                  setAddModalOpen(false);
                  setEditModalOpen(false);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Heading (English) *
                    </label>
                    <input
                      type="text"
                      value={heading}
                      onChange={(e) => setHeading(e.target.value)}
                      placeholder="Enter heading..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Heading (Gujarati)
                    </label>
                    <input
                      type="text"
                      value={headingGu}
                      onChange={(e) => setHeadingGu(e.target.value)}
                      placeholder="Enter Gujarati heading..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Heading (Hindi)
                    </label>
                    <input
                      type="text"
                      value={headingHi}
                      onChange={(e) => setHeadingHi(e.target.value)}
                      placeholder="Enter Hindi heading..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Story Images (Up to 5)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Upload portrait images (9:16 ratio recommended).</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-[250px] overflow-y-auto pr-2">
                    <ImageUploaderBlock index={1} value={image1} setValue={setImage1} />
                    <ImageUploaderBlock index={2} value={image2} setValue={setImage2} />
                    <ImageUploaderBlock index={3} value={image3} setValue={setImage3} />
                    <ImageUploaderBlock index={4} value={image4} setValue={setImage4} />
                    <ImageUploaderBlock index={5} value={image5} setValue={setImage5} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active (visible on website)
                </label>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                  setAddModalOpen(false);
                  setEditModalOpen(false);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !heading || !image1}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editModalOpen ? 'Update Story' : 'Save Story'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
