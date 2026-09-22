'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Upload,
  Link as LinkIcon,
  Eye,
  Loader2,
  AlertCircle,
  LayoutGrid,
  ExternalLink,
  Layers,
  Sparkles,
  Video,
  ImageIcon,
  Sidebar,
  Sliders,
  PanelTop,
} from 'lucide-react';
import { getBackendApiUrl, authFetch, clearApiCache } from '@/lib/api';

const HEADER_SLOTS = [
  {
    id: 'HEADER',
    label: 'Top Header Ad Banner (728×90)',
    description: 'Header advertisement banner displayed at top next to Gujarat Post logo (728×90 desktop banner)',
  },
];

const HOME_SECTIONS = [
  { id: 'ARTICLE_BOTTOM', label: 'Article Bottom Horizontal Ad Banner (After Description)', description: 'Horizontal ad banner displayed directly after article description/body text' },
  { id: 'IN_ARTICLE', label: 'In-Article Body Ad Banner (Inside Paragraphs)', description: 'Banner displayed inside article content between paragraphs when expanded' },
  { id: 'AFTER_HERO', label: 'After Hero Section (Top Banner)', description: 'Placed directly below the main hero news grid' },
  { id: 'AFTER_TRENDING', label: 'After Trending Section', description: 'Placed below trending news & ticker section' },
  { id: 'AFTER_WEBSTORIES', label: 'After Web Stories', description: 'Placed below interactive web stories bar' },
  { id: 'AFTER_VIDEOS', label: 'After Latest Videos', description: 'Placed below video section' },
  { id: 'AFTER_GALLERY', label: 'After Photo Gallery', description: 'Placed below photo gallery section' },
  { id: 'RANDOM_ADS_1', label: 'Random Bottom Ads (Section 1 - 7 Cards)', description: 'Displays in 7-card grid section at bottom of website' },
  { id: 'RANDOM_ADS_2', label: 'Random Bottom Ads (Section 2 - 7 Cards)', description: 'Displays in 2nd 7-card grid section at bottom of website' },
  { id: 'RANDOM_ADS_3', label: 'Random Bottom Ads (Section 3 - 7 Cards)', description: 'Displays in 3rd 7-card grid section at bottom of website' },
];

const FIXED_SIDEBAR_SLOTS = [
  {
    id: 'SIDEBAR_HERO_TOP',
    label: 'Sidebar Ad 1 (Hero Top Right)',
    description: 'Fixed top right sidebar ad (Default: Orange Mega Sale Days banner)',
    defaultColor: 'linear-gradient(135deg,#FF6B35,#C81D25)',
  },
  {
    id: 'SIDEBAR_GUJARAT',
    label: 'Sidebar Ad 2 (Gujarat Section)',
    description: 'Fixed sidebar ad alongside Gujarat hyperlocal news (Default: Dark Blue Easy Personal Loan banner)',
    defaultColor: 'linear-gradient(135deg,#0f3d70,#001f3f)',
  },
  {
    id: 'SIDEBAR_WORLD',
    label: 'Sidebar Ad 3 (World Section)',
    description: 'Fixed sidebar ad alongside World / Vishw news (Default: Green Dream Homes banner)',
    defaultColor: '#0E8044',
  },
  {
    id: 'SIDEBAR_POPULAR',
    label: 'Sidebar Ad 4 (Popular Section)',
    description: 'Fixed sidebar ad alongside Popular news (Default: Purple Recharge Plus banner)',
    defaultColor: 'linear-gradient(135deg,#5D3FD3,#4A2CA8)',
  },
];

const isValidMediaUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return true;
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
};

export default function AdminAdsPage() {
  const [activeTab, setActiveTab] = useState<'header' | 'section' | 'sidebar' | 'random'>('header');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [modalFilter, setModalFilter] = useState<'all' | 'active' | 'remaining'>('all');
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [selectedSection, setSelectedSection] = useState<string>('HEADER');
  const [adTitle, setAdTitle] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [imageCount, setImageCount] = useState<number>(1); // 1, 2, or 3 images for section
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');

  // Image/Video & Link fields
  const [image1, setImage1] = useState('');
  const [link1, setLink1] = useState('');

  const [image2, setImage2] = useState('');
  const [link2, setLink2] = useState('');

  const [image3, setImage3] = useState('');
  const [link3, setLink3] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetAd, setDeleteTargetAd] = useState<{ id: string; title: string; section: string } | null>(null);
  const [deletingAd, setDeletingAd] = useState(false);

  const fileInputRefs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
  ];

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/ads'));
      const json = await res.json();
      if (json.success && json.data?.ads) {
        setAds(json.data.ads);
      }
    } catch (err) {
      console.error('Failed to load advertisements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const resetForm = () => {
    if (activeTab === 'header') {
      setSelectedSection('HEADER');
    } else if (activeTab === 'sidebar') {
      setSelectedSection('SIDEBAR_HERO_TOP');
    } else if (activeTab === 'random') {
      setSelectedSection('RANDOM_ADS_1');
    } else {
      setSelectedSection('AFTER_HERO');
    }
    setAdTitle('');
    setIsActive(true);
    setImageCount(1);
    setMediaType('IMAGE');
    setImage1('');
    setLink1('');
    setImage2('');
    setLink2('');
    setImage3('');
    setLink3('');
    setEditingId(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Switch tab resets form state accordingly
  const handleTabChange = (tab: 'header' | 'section' | 'sidebar' | 'random') => {
    setActiveTab(tab);
    resetForm();
    if (tab === 'header') {
      setSelectedSection('HEADER');
    } else if (tab === 'sidebar') {
      setSelectedSection('SIDEBAR_HERO_TOP');
    } else if (tab === 'random') {
      setSelectedSection('RANDOM_ADS_1');
    } else {
      setSelectedSection('AFTER_HERO');
    }
  };

  const handleEdit = (ad: any) => {
    if (ad.section === 'HEADER') {
      setActiveTab('header');
    } else if (FIXED_SIDEBAR_SLOTS.some((s) => s.id === ad.section)) {
      setActiveTab('sidebar');
    } else if (ad.section.startsWith('RANDOM_ADS_') || ad.section.includes('RANDOM')) {
      setActiveTab('random');
    } else {
      setActiveTab('section');
    }

    setSelectedSection(ad.section);
    setAdTitle(ad.title || '');
    setIsActive(ad.isActive);
    setMediaType(ad.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE');

    setImage1(ad.image1 || '');
    setLink1(ad.link1 || '');

    setImage2(ad.image2 || '');
    setLink2(ad.link2 || '');

    setImage3(ad.image3 || '');
    setLink3(ad.link3 || '');

    let count = 1;
    if (ad.image3) count = 3;
    else if (ad.image2) count = 2;
    setImageCount(count);

    setEditingId(ad.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!file) return;
    setErrorMessage('');

    // Strictly validate media type based on selected mediaType (Video vs Image)
    const isVideoMode = (activeTab === 'header' || activeTab === 'sidebar') && mediaType === 'VIDEO';
    if (isVideoMode && !file.type.startsWith('video/')) {
      setErrorMessage('Only video files (MP4, WebM, MOV) can be uploaded when Video Banner mode is selected.');
      return;
    }
    if (!isVideoMode && !file.type.startsWith('image/')) {
      setErrorMessage('Only image files (JPG, PNG, WebP, GIF) can be uploaded when Image Banner mode is selected.');
      return;
    }

    setUploadingIndex(index);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      const url = json.url || json.data?.url;
      if (res.ok && url) {
        if (index === 0) setImage1(url);
        else if (index === 1) setImage2(url);
        else if (index === 2) setImage3(url);
      } else {
        setErrorMessage(json.error || json.message || 'Failed to upload file');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload error');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedSection) {
      setErrorMessage('Please select a target advertisement slot');
      return;
    }

    if (!image1 || !isValidMediaUrl(image1)) {
      setErrorMessage(
        activeTab === 'header'
          ? 'Please provide a valid Image or Video URL/file for the header ad banner'
          : activeTab === 'sidebar'
          ? 'Please provide a valid Image or Video URL/file for the sidebar ad'
          : 'Please provide at least Image 1'
      );
      return;
    }

    if (activeTab === 'section' && imageCount >= 2 && (!image2 || !isValidMediaUrl(image2))) {
      setErrorMessage('Please provide Image 2 or change image count to 1');
      return;
    }

    if (activeTab === 'section' && imageCount >= 3 && (!image3 || !isValidMediaUrl(image3))) {
      setErrorMessage('Please provide Image 3 or change image count to 2');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        section: selectedSection,
        title: adTitle || `Ad Banner for ${selectedSection}`,
        isActive,
        mediaType,
        image1: image1 || null,
        link1: link1 || null,
        image2: activeTab === 'section' && imageCount >= 2 ? image2 || null : null,
        link2: activeTab === 'section' && imageCount >= 2 ? link2 || null : null,
        image3: activeTab === 'section' && imageCount >= 3 ? image3 || null : null,
        link3: activeTab === 'section' && imageCount >= 3 ? link3 || null : null,
      };

      const res = await authFetch(getBackendApiUrl('/api/admin/ads'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        clearApiCache();
        setSuccessMessage('Advertisement saved successfully!');
        resetForm();
        fetchAds();
      } else {
        setErrorMessage(json.error || 'Failed to save advertisement');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving advertisement');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/ads/${id}/toggle`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setAds(ads.map((a) => (a.id === id ? { ...a, isActive: !currentStatus } : a)));
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleToggleRandom = async (id: string, currentStatus: boolean) => {
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/ads/${id}/toggle-random`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeInRandom: !currentStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setAds(ads.map((a) => (a.id === id ? { ...a, includeInRandom: !currentStatus } : a)));
        setSuccessMessage('Random pool status updated successfully!');
      }
    } catch (err) {
      console.error('Failed to toggle random status:', err);
    }
  };

  const confirmDeleteAd = async () => {
    if (!deleteTargetAd) return;
    setDeletingAd(true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/ads/${deleteTargetAd.id}`), {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setAds((prev) => prev.filter((a) => a.id !== deleteTargetAd.id));
        clearApiCache();
        setSuccessMessage('જાહેરાત સફળતાપૂર્વક ડિલીટ થઈ ગઈ છે!');
        setDeleteTargetAd(null);
      } else {
        setErrorMessage(json.error || json.message || 'Failed to delete ad');
      }
    } catch (err: any) {
      console.error('Failed to delete ad:', err);
      setErrorMessage(err.message || 'Failed to delete ad');
    } finally {
      setDeletingAd(false);
    }
  };

  const filteredAdsList = ads.filter((ad) => {
    if (activeTab === 'header') return ad.section === 'HEADER';
    if (activeTab === 'sidebar') return FIXED_SIDEBAR_SLOTS.some((s) => s.id === ad.section);
    if (activeTab === 'random') return Boolean(ad.includeInRandom) || ad.section?.includes('RANDOM');
    return ad.section !== 'HEADER' && !FIXED_SIDEBAR_SLOTS.some((s) => s.id === ad.section);
  });

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
              <Megaphone className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              Advertisement Manager
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage Header Banners (728×90), In-Between Section Ads, and Fixed Right Sidebar Ads easily.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-4 py-2.5 text-sm font-bold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            title="Open modal preview showing all configured ad slots, filled locations, and status"
          >
            <Eye className="h-4 w-4" />
            <span>Full Page Live Ad Preview</span>
            <Sparkles className="h-3.5 w-3.5 opacity-90 animate-pulse" />
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <X className="h-4 w-4" /> Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl max-w-2xl border border-zinc-200 dark:border-zinc-700/50">
        <button
          type="button"
          onClick={() => handleTabChange('header')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'header'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-800'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <PanelTop className="h-4 w-4 text-emerald-500" />
          <span>Header Ad (728×90)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('section')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'section'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-800'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <LayoutGrid className="h-4 w-4 text-red-500" />
          <span>In-Between Section Ads</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('sidebar')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'sidebar'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-800'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Sidebar className="h-4 w-4 text-blue-500" />
          <span>Fixed Sidebar Ads</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('random')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'random'
              ? 'bg-white dark:bg-zinc-900 text-[#B3121B] dark:text-red-400 shadow-sm border border-red-200 dark:border-red-900/50'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Layers className="h-4 w-4 text-[#B3121B]" />
          <span>Random Bottom Ads</span>
        </button>
      </div>

      {/* Option 1: Existing Advertisements Selector for Random Bottom Ads Tab */}
      {activeTab === 'random' && (
        <div className="space-y-6">
          {/* Compact & Readable Header Banner for Random Ads Tab */}
          <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-red-950 via-[#700910] to-red-950 text-white shadow-sm border border-red-700/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-white/10 border border-white/20 text-amber-300 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                    Random Bottom Advertisements Pool
                  </h2>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    7-Card Grid
                  </span>
                </div>
                <p className="text-[11px] text-red-100/90 font-medium mt-0.5">
                  <strong>Option 1:</strong> Select existing website ads below &nbsp;•&nbsp; <strong>Option 2:</strong> Create a new custom ad for bottom section.
                </p>
              </div>
            </div>
          </div>

          {/* Option 1 Card: Select Existing Ads */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-950/60 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-[#B3121B]" /> Option 1: Select Existing Website Advertisements
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Toggle on any existing ad (Header, Sidebar, In-between section) to automatically display it in the bottom Random Ads grid!
                </p>
              </div>
              <span className="text-xs font-black text-[#B3121B] dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3.5 py-1 rounded-full border border-red-200 dark:border-red-900/60">
                {ads.filter((a) => a.includeInRandom || a.section?.includes('RANDOM')).length} Active in Pool
              </span>
            </div>

            {ads.length === 0 ? (
              <div className="py-6 text-center text-zinc-400 text-xs">
                No existing advertisements found on website. You can create a new advertisement below.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ads.map((ad) => {
                  const isIncluded = Boolean(ad.includeInRandom) || ad.section?.includes('RANDOM');
                  const secLabel =
                    HEADER_SLOTS.find((s) => s.id === ad.section)?.label ||
                    FIXED_SIDEBAR_SLOTS.find((s) => s.id === ad.section)?.label ||
                    HOME_SECTIONS.find((s) => s.id === ad.section)?.label ||
                    ad.section;

                  return (
                    <div
                      key={ad.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                        isIncluded
                          ? 'border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20 shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Thumbnail */}
                        <div className="relative h-14 w-20 shrink-0 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-800">
                          {ad.image1 ? (
                            <Image src={ad.image1} alt={ad.title || 'Ad'} fill unoptimized={true} className="object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-zinc-400 font-bold">AD</div>
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <span className="inline-block text-[9px] font-black uppercase text-[#B3121B] dark:text-red-300 bg-red-100/80 dark:bg-red-950/60 px-2 py-0.5 rounded truncate max-w-full">
                            {secLabel}
                          </span>
                          <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                            {ad.title || 'Untitled Ad'}
                          </h4>
                          <p className="text-[10px] font-bold text-zinc-500">
                            {isIncluded ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                ● Visible in Random Section
                              </span>
                            ) : (
                              <span className="text-zinc-400 flex items-center gap-1">
                                ○ Deselected (Hidden from Random)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Deselect / Select Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleRandom(ad.id, isIncluded)}
                        className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all shadow-sm ${
                          isIncluded
                            ? 'bg-[#B3121B] hover:bg-zinc-900 text-white'
                            : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-[#B3121B] hover:text-white border border-zinc-300 dark:border-zinc-700'
                        }`}
                      >
                        {isIncluded ? (
                          <>
                            <X className="h-3.5 w-3.5" />
                            <span>Deselect from Random Pool (Hide)</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#B3121B]" />
                            <span>+ Select for Random Pool (Show)</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Form & Preview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-red-500" />
              {editingId
                ? `Edit ${
                    activeTab === 'header'
                      ? 'Header Ad Banner'
                      : activeTab === 'sidebar'
                      ? 'Fixed Sidebar Ad'
                      : activeTab === 'random'
                      ? 'Random Bottom Ad'
                      : 'Section Ad'
                  }`
                : activeTab === 'random'
                ? 'Option 2: Create New Custom Random Ad'
                : `Add ${
                    activeTab === 'header'
                      ? 'Header Ad Banner'
                      : activeTab === 'sidebar'
                      ? 'Fixed Sidebar Ad'
                      : 'New Section Ad'
                  }`}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">Status:</span>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActive ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-bold ${isActive ? 'text-emerald-600' : 'text-zinc-400'}`}>
                {isActive ? 'Active' : 'Draft'}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-200 dark:border-emerald-800">
              <Check className="h-5 w-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Slot / Section Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">
                1. Target Position / Slot <span className="text-red-500">*</span>
              </label>
              {activeTab === 'header' ? (
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {HEADER_SLOTS.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.label}
                    </option>
                  ))}
                </select>
              ) : activeTab === 'sidebar' ? (
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {FIXED_SIDEBAR_SLOTS.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  {HOME_SECTIONS.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.label}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-zinc-500">
                {activeTab === 'header'
                  ? HEADER_SLOTS.find((s) => s.id === selectedSection)?.description
                  : activeTab === 'sidebar'
                  ? FIXED_SIDEBAR_SLOTS.find((s) => s.id === selectedSection)?.description
                  : HOME_SECTIONS.find((s) => s.id === selectedSection)?.description}
              </p>
            </div>

            {/* Optional Title */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Ad Title / Reference Label <span className="text-xs font-normal text-zinc-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="e.g. Top Header Brand Promotion 2026"
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:border-red-500 focus:outline-none"
              />
            </div>

            {/* Media Type Selector (For Header & Fixed Sidebar Ads) */}
            {(activeTab === 'header' || activeTab === 'sidebar') && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  2. Media Type (Image or Video) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMediaType('IMAGE')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      mediaType === 'IMAGE'
                        ? 'border-red-600 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Image Banner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMediaType('VIDEO')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      mediaType === 'VIDEO'
                        ? 'border-red-600 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    <Video className="h-4 w-4" />
                    <span>Video Banner</span>
                  </button>
                </div>
              </div>
            )}

            {/* Image Count Selector (For In-Between Section Ads) */}
            {activeTab === 'section' && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  2. Number of Ad Images <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setImageCount(num)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        imageCount === num
                          ? 'border-red-600 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                      }`}
                    >
                      <span className="text-base font-black">{num} {num === 1 ? 'Image' : 'Images'}</span>
                      <span className="text-[11px] opacity-80 mt-0.5">
                        {num === 1 ? '100% Width' : num === 2 ? '50% / 50%' : '33.3% Each'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Media Upload & Link Input Fields */}
            <div className="space-y-5 pt-2">
              {(activeTab === 'header' || activeTab === 'sidebar' ? [0] : [0, 1, 2].slice(0, imageCount)).map((idx) => {
                const imgVal = idx === 0 ? image1 : idx === 1 ? image2 : image3;
                const setImgVal = idx === 0 ? setImage1 : idx === 1 ? setImage2 : setImage3;
                const linkVal = idx === 0 ? link1 : idx === 1 ? link2 : link3;
                const setLinkVal = idx === 0 ? setLink1 : idx === 1 ? setLink2 : setLink3;
                const isMediaValid = isValidMediaUrl(imgVal);

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                        {activeTab === 'header' ? (
                          mediaType === 'VIDEO' ? <Video className="h-3.5 w-3.5" /> : <PanelTop className="h-3.5 w-3.5" />
                        ) : activeTab === 'sidebar' ? (
                          mediaType === 'VIDEO' ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />
                        ) : (
                          <LayoutGrid className="h-3.5 w-3.5" />
                        )}
                        {activeTab === 'header'
                          ? 'Header Media & Link'
                          : activeTab === 'sidebar'
                          ? 'Sidebar Media & Link'
                          : `Ad Image Slot ${idx + 1}`}
                      </span>
                      {activeTab === 'header' && (
                        <span className="text-[11px] text-zinc-400 font-semibold">Recommended: 728×90 banner</span>
                      )}
                      {activeTab === 'section' && (
                        <span className="text-[11px] text-zinc-400 font-semibold">
                          {imageCount === 1 ? 'Full Banner' : imageCount === 2 ? 'Half Banner' : '1/3 Banner'}
                        </span>
                      )}
                    </div>

                    {/* Field 1: Media (Image or Video) */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {(activeTab === 'header' || activeTab === 'sidebar') && mediaType === 'VIDEO'
                          ? 'Video File (MP4/WebM Upload) or Video URL'
                          : 'Image File (Upload) or Image URL'}{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={imgVal}
                          onChange={(e) => setImgVal(e.target.value)}
                          placeholder={
                            (activeTab === 'header' || activeTab === 'sidebar') && mediaType === 'VIDEO'
                              ? 'https://example.com/banner-video.mp4'
                              : 'https://example.com/banner-image.jpg'
                          }
                          className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                        />
                        <input
                          type="file"
                          ref={fileInputRefs[idx]}
                          accept={(activeTab === 'header' || activeTab === 'sidebar') && mediaType === 'VIDEO' ? 'video/mp4,video/webm,video/quicktime,video/*' : 'image/*'}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileUpload(idx, e.target.files[0]);
                          }}
                        />
                        <button
                          type="button"
                          disabled={uploadingIndex === idx}
                          onClick={() => fileInputRefs[idx].current?.click()}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-xs font-bold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shrink-0 disabled:opacity-50"
                        >
                          {uploadingIndex === idx ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          <span>Upload File</span>
                        </button>
                      </div>

                      {/* Media Preview */}
                      {imgVal && (
                        <div className="relative h-32 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-900 mt-2 flex items-center justify-center">
                          {isMediaValid ? (
                            mediaType === 'VIDEO' || /\.(mp4|webm|mov)(\?.*)?$/i.test(imgVal) ? (
                              <video src={imgVal} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                            ) : (
                              <Image
                                src={imgVal}
                                alt={`Preview ${idx + 1}`}
                                fill
                                unoptimized={true}
                                className="object-cover"
                              />
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center text-amber-400 text-xs p-2">
                              <span>Enter valid URL or upload a file</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setImgVal('')}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-red-600 transition"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Field 2: Redirect Link */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Redirect Target Link URL (Opens when clicked)
                      </label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <input
                          type="url"
                          value={linkVal}
                          onChange={(e) => setLinkVal(e.target.value)}
                          placeholder="https://yourbrand.com/promo-landing"
                          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Buttons */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 text-sm font-bold shadow-md shadow-red-950/20 transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>
                  {editingId
                    ? activeTab === 'header'
                      ? 'Update Header Ad'
                      : activeTab === 'sidebar'
                      ? 'Update Sidebar Ad'
                      : 'Update Section Ad'
                    : activeTab === 'header'
                    ? 'Save Header Ad'
                    : activeTab === 'sidebar'
                    ? 'Save Sidebar Ad'
                    : 'Save Section Ad'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview & Configured Ads (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Preview Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-500" /> Live Layout Preview
              </h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
                {activeTab === 'header'
                  ? '728×90 Banner'
                  : activeTab === 'sidebar'
                  ? `${mediaType} Banner`
                  : imageCount === 1 ? '100% Width' : imageCount === 2 ? '50% / 50%' : '33.3% Grid'}
              </span>
            </div>

            <p className="text-xs text-zinc-500">
              Target Slot: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{selectedSection}</span>
            </p>

            {/* Simulated Banner Container */}
            <div className="p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950">
              {activeTab === 'header' ? (
                <div className="relative aspect-[21/6] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-[#0c1729] flex items-center justify-between p-3 text-white">
                  {isValidMediaUrl(image1) ? (
                    mediaType === 'VIDEO' || /\.(mp4|webm|mov)(\?.*)?$/i.test(image1) ? (
                      <video src={image1} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <Image src={image1} alt="Header Ad Preview" fill unoptimized={true} className="object-cover" />
                    )
                  ) : (
                    <div className="flex items-center justify-between w-full z-10 px-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-red-600 text-white">
                          <Megaphone className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-red-400 tracking-wider">Grow with Gujarat Post</p>
                          <p className="text-xs font-bold">Put your brand in front of Gujarat.</p>
                        </div>
                      </div>
                      <div className="text-[10px] bg-white text-black font-bold px-2 py-1 rounded-full">
                        Advertise now ↗
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-20">
                    HEADER AD · 728×90
                  </div>
                </div>
              ) : activeTab === 'sidebar' ? (
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900 flex flex-col items-center justify-center text-center p-2">
                  {isValidMediaUrl(image1) ? (
                    mediaType === 'VIDEO' || /\.(mp4|webm|mov)(\?.*)?$/i.test(image1) ? (
                      <video src={image1} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                    ) : (
                      <Image src={image1} alt="Sidebar Preview" fill unoptimized={true} className="object-cover" />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-400 text-xs p-4">
                      <Sidebar className="h-6 w-6 mb-1 opacity-50" />
                      <span className="font-bold">Default Banner Active</span>
                      <span className="text-[10px] text-zinc-500 mt-1">Upload custom media to override default card</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    SIDEBAR AD
                  </div>
                </div>
              ) : (
                <div
                  className={`grid gap-2 ${
                    imageCount === 1
                      ? 'grid-cols-1'
                      : imageCount === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-3'
                  }`}
                >
                  {[0, 1, 2].slice(0, imageCount).map((idx) => {
                    const img = idx === 0 ? image1 : idx === 1 ? image2 : image3;

                    return (
                      <div
                        key={idx}
                        className="relative aspect-[16/8] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-800 flex flex-col items-center justify-center text-center p-2 group"
                      >
                        {isValidMediaUrl(img) ? (
                          <Image
                            src={img}
                            alt={`Slot ${idx + 1}`}
                            fill
                            unoptimized={true}
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-zinc-400 text-[10px]">
                            <Upload className="h-4 w-4 mb-1 opacity-50" />
                            <span>Slot {idx + 1} Image</span>
                          </div>
                        )}
                        <div className="absolute top-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          AD {idx + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Configured Ads List for Active Tab */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <Layers className="h-4 w-4 text-blue-500" />
              {activeTab === 'header'
                ? 'Configured Header Ad'
                : activeTab === 'sidebar'
                ? 'Configured Sidebar Ads'
                : 'Configured Section Ads'}{' '}
              ({filteredAdsList.length})
            </h3>
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-zinc-400">
                <Loader2 className="h-6 w-6 animate-spin mb-2 text-red-500" />
                <span className="text-xs">Loading advertisements...</span>
              </div>
            ) : filteredAdsList.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs">
                No custom {activeTab} ad created yet. Fill the form to add one.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAdsList.map((ad) => {
                  const secLabel =
                    HEADER_SLOTS.find((s) => s.id === ad.section)?.label ||
                    FIXED_SIDEBAR_SLOTS.find((s) => s.id === ad.section)?.label ||
                    HOME_SECTIONS.find((s) => s.id === ad.section)?.label ||
                    ad.section;

                  return (
                    <div
                      key={ad.id}
                      className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                            {ad.title || secLabel}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                              ad.isActive
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {ad.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {secLabel} • <span className="font-semibold">{ad.mediaType || 'IMAGE'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(ad.id, ad.isActive)}
                          title="Toggle Active Status"
                          className={`p-1.5 rounded-lg border transition ${
                            ad.isActive
                              ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              : 'border-zinc-300 text-zinc-400 hover:bg-zinc-200'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(ad)}
                          title="Edit Ad"
                          className="p-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetAd({ id: ad.id, title: ad.title || '', section: secLabel })}
                          title="Delete Ad"
                          className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Page Live Ad Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-lg shadow-red-600/30">
                    <Eye className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                      Full Website Advertisement Placement & Live Status Map
                    </h2>
                    <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                      Inspect all active custom ads vs remaining unfilled slots across Gujarat Post news portal.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-2.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Filter & Stats Bar */}
            <div className="bg-zinc-100/90 dark:bg-zinc-850 p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              {/* Interactive Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 p-1 bg-zinc-200/80 dark:bg-zinc-800 rounded-2xl border border-zinc-300/50 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setModalFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl font-black transition-all ${
                    modalFilter === 'all'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  All Placement Slots (15)
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilter('active')}
                  className={`px-3.5 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                    modalFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" /> Active Live Ads ({ads.filter((a) => a.isActive).length})
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilter('remaining')}
                  className={`px-3.5 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                    modalFilter === 'remaining'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5" /> Remaining Unfilled ({15 - ads.filter((a) => a.isActive).length})
                </button>
              </div>

              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold transition shadow-md shadow-red-600/20 active:scale-95"
              >
                <span>Open Live News Website</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-8 flex-1 bg-zinc-50/60 dark:bg-zinc-900/60">

              {modalFilter === 'remaining' && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-bold flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    Showing <strong>{15 - ads.filter((a) => a.isActive).length} Remaining Ad Slots</strong> that currently do not have a custom admin ad uploaded. Click <strong>"+ Setup"</strong> to configure any empty slot!
                  </span>
                </div>
              )}

              {/* SECTION 1: ARTICLE DETAIL PAGE ADS */}
              {(modalFilter === 'all' || modalFilter === 'active' || modalFilter === 'remaining') && (
                <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" /> 1. Article Page News Reader Ads (2 Slots)
                    </h3>
                    <span className="text-[11px] font-extrabold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                      Displayed inside News Article Detail Page
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['IN_ARTICLE', 'ARTICLE_BOTTOM'].map((sectionId) => {
                      const foundAd = ads.find((a) => a.section === sectionId);
                      const isFilled = Boolean(foundAd && foundAd.isActive);

                      if (modalFilter === 'active' && !isFilled) return null;
                      if (modalFilter === 'remaining' && isFilled) return null;

                      const imageList = [foundAd?.image1, foundAd?.image2, foundAd?.image3].filter(Boolean);

                      return (
                        <div key={sectionId} className={`p-4 sm:p-5 rounded-2xl border transition-all ${isFilled ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 shadow-sm' : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/40'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-black text-sm sm:text-base text-zinc-900 dark:text-zinc-100">{sectionId === 'IN_ARTICLE' ? 'In-Article Body Ad Banner' : 'Article Bottom Horizontal Ad Banner'}</span>
                              <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">Position: {sectionId === 'IN_ARTICLE' ? 'Inside article body' : 'Below article description'}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-xl text-[10px] font-black shrink-0 ${isFilled ? 'bg-emerald-600 text-white shadow-sm' : 'bg-amber-600 text-white'}`}>
                              {isFilled ? '🟢 ACTIVE AD LIVE' : '⚠️ REMAINING (EMPTY)'}
                            </span>
                          </div>

                          <div className="mt-4">
                            {isFilled && imageList.length > 0 ? (
                              <div className={`grid gap-2 ${imageList.length === 3 ? 'grid-cols-3' : imageList.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {imageList.map((imgUrl, idx) => (
                                  <div key={idx} className="relative h-24 sm:h-28 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-zinc-700">
                                    <Image src={imgUrl!} alt={`Ad Image ${idx + 1}`} fill className="object-cover" />
                                    <span className="absolute bottom-1 right-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-[9px] font-black">
                                      Card {idx + 1}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="h-24 rounded-xl bg-amber-500/10 border-2 border-dashed border-amber-500/30 flex items-center justify-center p-4 text-center">
                                <div className="text-amber-800 dark:text-amber-300">
                                  <p className="text-xs font-black">No Custom Admin Ad Uploaded</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-zinc-500">
                              {isFilled ? `Layout: ${imageList.length} Split Card(s)` : 'Status: Unassigned Slot'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowPreviewModal(false);
                                if (foundAd) handleEdit(foundAd);
                                else {
                                  setActiveTab('section');
                                  setSelectedSection(sectionId);
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition shadow-sm ${
                                isFilled
                                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:scale-105'
                                  : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105'
                              }`}
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>{foundAd ? 'Edit' : '+ Setup'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: TOP HEADER NAV AD */}
              {(modalFilter === 'all' || modalFilter === 'active' || modalFilter === 'remaining') && (
                <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2">
                      <PanelTop className="h-4 w-4" /> 2. Top Navigation Header Ad Banner (728×90)
                    </h3>
                    <span className="text-[11px] font-extrabold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                      Displayed next to top Gujarat Post logo
                    </span>
                  </div>

                  {(() => {
                    const foundAd = ads.find((a) => a.section === 'HEADER');
                    const isFilled = Boolean(foundAd && foundAd.isActive);

                    if (modalFilter === 'active' && !isFilled) return null;
                    if (modalFilter === 'remaining' && isFilled) return null;

                    return (
                      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${isFilled ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 shadow-sm' : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/40'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <span className="font-black text-sm sm:text-base text-zinc-900 dark:text-zinc-100">Top Header Ad Banner (728×90 Desktop)</span>
                            <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">Position: Header bar top right side next to main logo</p>
                          </div>
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black ${isFilled ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                            {isFilled ? `🟢 ACTIVE (${foundAd?.mediaType || 'IMAGE'})` : '⚠️ REMAINING (EMPTY)'}
                          </span>
                        </div>

                        <div className="mt-4 relative h-24 w-full rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                          {isFilled && foundAd?.image1 ? (
                            foundAd.mediaType === 'VIDEO' ? (
                              <video src={foundAd.image1} autoPlay loop muted playsInline className="h-full w-full object-cover" />
                            ) : (
                              <Image src={foundAd.image1} alt="Header Ad" fill className="object-contain" />
                            )
                          ) : (
                            <div className="text-center p-3">
                              <p className="text-xs font-black text-amber-800 dark:text-amber-300">No Custom Header Banner Uploaded</p>
                              <span className="text-[10px] text-zinc-400">Default Gujarat Post promo active</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPreviewModal(false);
                              if (foundAd) handleEdit(foundAd);
                              else {
                                setActiveTab('header');
                                setSelectedSection('HEADER');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition shadow-sm ${
                              isFilled
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:scale-105'
                                : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105'
                            }`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>{foundAd ? 'Edit Header Ad' : '+ Setup Header Ad Now'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SECTION 3: FIXED RIGHT SIDEBAR ADS */}
              {(modalFilter === 'all' || modalFilter === 'active' || modalFilter === 'remaining') && (
                <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2">
                      <Sidebar className="h-4 w-4" /> 3. Fixed Right Sidebar Banners (4 Column Slots)
                    </h3>
                    <span className="text-[11px] font-extrabold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                      Displayed alongside news sections on right side
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {FIXED_SIDEBAR_SLOTS.map((slot) => {
                      const foundAd = ads.find((a) => a.section === slot.id);
                      const isFilled = Boolean(foundAd && foundAd.isActive);

                      if (modalFilter === 'active' && !isFilled) return null;
                      if (modalFilter === 'remaining' && isFilled) return null;

                      return (
                        <div key={slot.id} className={`p-4 rounded-2xl border transition-all ${isFilled ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40' : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/40'}`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate">{slot.label}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${isFilled ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                              {isFilled ? '🟢 LIVE' : '⚠️ EMPTY'}
                            </span>
                          </div>

                          <div className="mt-3 relative h-24 w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-950 flex items-center justify-center">
                            {isFilled && foundAd?.image1 ? (
                              <Image src={foundAd.image1} alt={slot.label} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full p-2 flex items-center justify-center text-center" style={{ background: slot.defaultColor }}>
                                <span className="text-[9px] font-bold text-white leading-tight">{slot.description}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setShowPreviewModal(false);
                                if (foundAd) handleEdit(foundAd);
                                else {
                                  setActiveTab('sidebar');
                                  setSelectedSection(slot.id);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                              }}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black transition shadow-sm ${
                                isFilled
                                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:scale-105'
                                  : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105'
                              }`}
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>{foundAd ? 'Edit' : '+ Setup'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 4: HOMEPAGE IN-BETWEEN SECTION BANNERS */}
              {(modalFilter === 'all' || modalFilter === 'active' || modalFilter === 'remaining') && (
                <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2">
                      <Layers className="h-4 w-4" /> 4. Homepage Section In-Between Banners (5 Slots)
                    </h3>
                    <span className="text-[11px] font-extrabold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                      Full-width section breaks on homepage
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { id: 'AFTER_HERO', label: 'After Hero Section Banner' },
                      { id: 'AFTER_TRENDING', label: 'After Trending News Banner' },
                      { id: 'AFTER_WEBSTORIES', label: 'After Web Stories Banner' },
                      { id: 'AFTER_VIDEOS', label: 'After Latest Videos Banner' },
                      { id: 'AFTER_GALLERY', label: 'After Photo Gallery Banner' },
                    ].map((slot) => {
                      const foundAd = ads.find((a) => a.section === slot.id);
                      const isFilled = Boolean(foundAd && foundAd.isActive);

                      if (modalFilter === 'active' && !isFilled) return null;
                      if (modalFilter === 'remaining' && isFilled) return null;

                      const imageList = [foundAd?.image1, foundAd?.image2, foundAd?.image3].filter(Boolean);

                      return (
                        <div key={slot.id} className={`p-4 rounded-2xl border transition-all ${isFilled ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 shadow-sm' : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/40'}`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate">{slot.label}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${isFilled ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                              {isFilled ? '🟢 LIVE' : '⚠️ EMPTY'}
                            </span>
                          </div>

                          <div className="mt-3">
                            {isFilled && imageList.length > 0 ? (
                              <div className={`grid gap-1.5 ${imageList.length === 3 ? 'grid-cols-3' : imageList.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {imageList.map((imgUrl, idx) => (
                                  <div key={idx} className="relative h-20 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-zinc-700">
                                    <Image src={imgUrl!} alt={`Ad Image ${idx + 1}`} fill className="object-cover" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="h-20 rounded-lg bg-amber-500/10 border border-dashed border-amber-500/30 flex items-center justify-center p-2 text-center">
                                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Default Promo Banner Active</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setShowPreviewModal(false);
                                if (foundAd) handleEdit(foundAd);
                                else {
                                  setActiveTab('section');
                                  setSelectedSection(slot.id);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                              }}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black transition shadow-sm ${
                                isFilled
                                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:scale-105'
                                  : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105'
                              }`}
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>{foundAd ? 'Edit' : '+ Setup'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 5: RANDOM BOTTOM 7-CARD GRID ADS */}
              {(modalFilter === 'all' || modalFilter === 'active' || modalFilter === 'remaining') && (
                <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> 5. Random Bottom 7-Card Grid Pool Banners (3 Sections)
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Interactive promo grid pool at website bottom. Combines custom random ads & selected pool ads.
                      </p>
                    </div>
                    <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800/60 shrink-0">
                      {ads.filter((a) => a.isActive !== false && (Boolean(a.includeInRandom) || a.section?.includes('RANDOM'))).length} Active Ads in Random Pool
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(() => {
                      const allPoolAds = ads.filter(
                        (a) => a.isActive !== false && (Boolean(a.includeInRandom) || a.section?.includes('RANDOM'))
                      );

                      return [
                        { id: 'RANDOM_ADS_1', label: 'Random Ads Section 1', range: [0, 2] },
                        { id: 'RANDOM_ADS_2', label: 'Random Ads Section 2', range: [2, 4] },
                        { id: 'RANDOM_ADS_3', label: 'Random Ads Section 3', range: [4, 8] },
                      ].map((slot, sIdx) => {
                        const directAd = ads.find((a) => a.section === slot.id && a.isActive !== false);
                        const assignedPoolAds = allPoolAds.slice(slot.range[0], slot.range[1]);
                        
                        const displayAds = directAd
                          ? [directAd, ...assignedPoolAds.filter(a => a.id !== directAd.id)]
                          : assignedPoolAds.length > 0
                          ? assignedPoolAds
                          : (allPoolAds.length > 0 && sIdx === 0 ? allPoolAds : []);

                        const isFilled = displayAds.length > 0;

                        if (modalFilter === 'active' && !isFilled) return null;
                        if (modalFilter === 'remaining' && isFilled) return null;

                        const imageList = displayAds.flatMap((a) => [a.image1, a.image2, a.image3]).filter(Boolean);

                        return (
                          <div key={slot.id} className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${isFilled ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 shadow-sm' : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/40'}`}>
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate">{slot.label}</span>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black shrink-0 ${isFilled ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                                  {isFilled ? `🟢 LIVE (${displayAds.length} Ad${displayAds.length > 1 ? 's' : ''})` : '⚠️ EMPTY'}
                                </span>
                              </div>

                              <div className="mt-3">
                                {isFilled && imageList.length > 0 ? (
                                  <div className={`grid gap-1.5 ${imageList.length >= 3 ? 'grid-cols-3' : imageList.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {imageList.slice(0, 3).map((imgUrl, idx) => (
                                      <div key={idx} className="relative h-20 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-zinc-700">
                                        <Image src={imgUrl!} alt={`Random Card ${idx + 1}`} fill className="object-cover" />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="h-20 rounded-lg bg-amber-500/10 border border-dashed border-amber-500/30 flex items-center justify-center p-2 text-center">
                                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Random Default Grid Pool Active</span>
                                  </div>
                                )}
                              </div>

                              {displayAds.length > 0 && (
                                <div className="mt-2.5 space-y-1">
                                  {displayAds.map((adItem) => {
                                    const itemSecLabel =
                                      HEADER_SLOTS.find((s) => s.id === adItem.section)?.label ||
                                      FIXED_SIDEBAR_SLOTS.find((s) => s.id === adItem.section)?.label ||
                                      HOME_SECTIONS.find((s) => s.id === adItem.section)?.label ||
                                      adItem.section;
                                    return (
                                      <div key={adItem.id} className="flex items-center justify-between text-[10px] font-bold bg-white/70 dark:bg-zinc-800/60 p-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                                        <span className="truncate text-zinc-800 dark:text-zinc-200">{adItem.title || itemSecLabel}</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">Active</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPreviewModal(false);
                                  const targetAd = displayAds[0] || directAd;
                                  if (targetAd) handleEdit(targetAd);
                                  else {
                                    setActiveTab('random');
                                    setSelectedSection(slot.id);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }
                                }}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black transition shadow-sm ${
                                  isFilled
                                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:scale-105'
                                    : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105'
                                }`}
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>{displayAds.length > 0 ? 'Edit' : '+ Setup'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:border-zinc-950 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500">
                Setup ad slots to increase monetization efficiency across the portal.
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-6 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-xs sm:text-sm hover:opacity-90 transition shadow-sm"
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ─── CUSTOM DELETE AD CONFIRMATION MODAL ─── */}
      {deleteTargetAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => !deletingAd && setDeleteTargetAd(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-center">
            {/* Red Alert Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60 text-[#B3121B] shadow-inner">
              <Trash2 className="h-7 w-7" />
            </div>

            <h3 className="text-base font-black text-zinc-900 dark:text-white">
              Delete Advertisement?
            </h3>
            <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-0.5">
              જાહેરાત કન્ફિગરેશન ડિલીટ કરવાની ખાતરી
            </p>

            {/* Target Details Card */}
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-left dark:border-zinc-800 dark:bg-zinc-950/60">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Slot / Position
              </div>
              <div className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100 truncate mt-0.5">
                {deleteTargetAd.section}
              </div>
              {deleteTargetAd.title && (
                <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-300 truncate">
                  <span className="font-semibold text-zinc-400">Label: </span>
                  {deleteTargetAd.title}
                </div>
              )}
            </div>

            <p className="mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to delete this advertisement? It will be removed from the portal immediately.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={deletingAd}
                onClick={() => setDeleteTargetAd(null)}
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition disabled:opacity-50 cursor-pointer"
              >
                Cancel (રદ કરો)
              </button>
              <button
                type="button"
                disabled={deletingAd}
                onClick={confirmDeleteAd}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] py-2.5 text-xs font-black text-white hover:bg-red-700 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {deletingAd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deletingAd ? 'Deleting...' : 'Delete Ad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
