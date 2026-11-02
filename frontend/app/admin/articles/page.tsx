'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {

  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Filter,
  Calendar,
  AlertCircle,
  Loader2,
  Globe2,
  CheckCircle2,
  RotateCcw,
  X,
  User,
  Tag,
  FileText,
  Film,
  Clock,
} from 'lucide-react';
import { getBackendApiUrl, authFetch, clearApiCache } from '@/lib/api';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { isDisplayOnlySectionCategory } from '@/components/sections/ArticleForm';

interface ArticleData {
  id: string;
  slug: string;
  articleNumber?: number;
  title: string;
  titleGu: string;
  titleHi: string;
  featuredImage: string;
  views: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  scheduledAt?: string;
  authorId: string;
  author: {
    id: string;
    name: string;
  };
  isFeatured?: boolean;
  isTrending?: boolean;
  isBreaking?: boolean;
  category: {
    id?: string;
    name: string;
    slug: string;
  };
  categories?: {
    categoryId: string;
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
}

interface CategoryData {
  id: string;
  slug: string;
  name: string;
  isActive?: boolean;
}

export default function ArticleList() {
  const router = useRouter();

  const FILTER_STORAGE_KEY = 'admin_articles_filter_state';

  // Persistence initialization flag to ensure saved state is loaded before fetching/overwriting
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Search & Filter state
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState<string>('1');

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    try {
      const [y, m, d] = selectedDate.split('-');
      if (y && m && d) {
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }
    } catch (e) { }
    return selectedDate;
  }, [selectedDate]);

  // Restore saved search and filter state on mount (from URL search params or sessionStorage)
  useEffect(() => {
    try {
      // 1. Check URL query params first
      const searchParams = new URLSearchParams(window.location.search);
      const urlQuery = searchParams.get('query');
      const urlCategory = searchParams.get('category') || searchParams.get('categorySlug');
      const urlStatus = searchParams.get('status');
      const urlDate = searchParams.get('date');
      const urlPage = searchParams.get('page');
      const urlLimit = searchParams.get('limit') || searchParams.get('pageSize');

      let restoredQuery = '';
      let restoredCat = '';
      let restoredStatus = '';
      let restoredDate = '';
      let restoredPage = 1;
      let restoredLimit = 10;

      if (urlQuery !== null || urlCategory !== null || urlStatus !== null || urlDate !== null || urlPage !== null || urlLimit !== null) {
        restoredQuery = urlQuery || '';
        restoredCat = urlCategory || '';
        restoredStatus = urlStatus || '';
        restoredDate = urlDate || '';
        restoredPage = urlPage ? Math.max(1, parseInt(urlPage, 10)) : 1;
        restoredLimit = urlLimit ? parseInt(urlLimit, 10) : 10;
      } else {
        // 2. Check sessionStorage
        const saved = sessionStorage.getItem(FILTER_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          restoredQuery = parsed.query || '';
          restoredCat = parsed.category || '';
          restoredStatus = parsed.status || '';
          restoredDate = parsed.date || '';
          restoredPage = typeof parsed.page === 'number' && parsed.page > 0 ? parsed.page : 1;
          restoredLimit = typeof parsed.pageSize === 'number' && parsed.pageSize > 0 ? parsed.pageSize : 10;
        }
      }

      if (restoredQuery) setQuery(restoredQuery);
      if (restoredCat) setSelectedCategory(restoredCat);
      if (restoredStatus) setSelectedStatus(restoredStatus);
      if (restoredDate) setSelectedDate(restoredDate);
      if (restoredPage > 1) setPage(restoredPage);
      if (restoredLimit !== 10) setPageSize(restoredLimit);
    } catch (e) {
      console.error('Error restoring filter state', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Sync active search and filter state to sessionStorage and update the browser address bar
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify({
          query,
          category: selectedCategory,
          status: selectedStatus,
          date: selectedDate,
          page,
          pageSize,
        })
      );

      const params = new URLSearchParams();
      if (query.trim()) params.set('query', query.trim());
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedStatus) params.set('status', selectedStatus);
      if (selectedDate) params.set('date', selectedDate);
      if (page > 1) params.set('page', String(page));
      if (pageSize !== 10) params.set('limit', String(pageSize));

      const qs = params.toString();
      const newUrl = window.location.pathname + (qs ? `?${qs}` : '');
      window.history.replaceState(null, '', newUrl);
    } catch (e) { }
  }, [isInitialized, query, selectedCategory, selectedStatus, selectedDate, page, pageSize]);

  // UI indicators
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [langTab, setLangTab] = useState<'en' | 'gu' | 'hi'>('gu');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userAuthorId, setUserAuthorId] = useState<string | null>(null);

  // Custom confirm dialog state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  // Review Modal state
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    article: ArticleData | null;
    fullData: any | null;
    loading: boolean;
    activeMediaIndex: number;
  }>({
    isOpen: false,
    article: null,
    fullData: null,
    loading: false,
    activeMediaIndex: 0,
  });

  // Lock background body scrolling when modal is open
  useEffect(() => {
    if (reviewModal.isOpen || confirmModal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [reviewModal.isOpen, confirmModal.isOpen]);

  // Extract all images & videos associated with the article
  const extractAllMedia = (art: ArticleData | null, fullData: any): string[] => {
    if (!art && !fullData) return [];
    const mediaList: string[] = [];
    const add = (url?: any) => {
      if (url && typeof url === 'string' && url.trim() && !mediaList.includes(url.trim())) {
        mediaList.push(url.trim());
      }
    };

    // 1. Featured image & video URLs
    add(fullData?.featuredImage || art?.featuredImage);
    add(fullData?.videoUrl || fullData?.youtubeUrl || fullData?.video);

    // 2. Direct secondary image properties (image2..image10)
    const source = fullData || art || {};
    ['image2', 'image3', 'image4', 'image5', 'image6', 'image7', 'image8', 'image9', 'image10', 'galleryImage2', 'secondaryImage'].forEach((prop) => {
      add(source[prop]);
    });

    // 3. Array properties: galleryImages, images, gallery
    const arrays = [fullData?.galleryImages, fullData?.images, fullData?.gallery, (art as any)?.galleryImages, (art as any)?.images];
    arrays.forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (typeof item === 'string') add(item);
          else if (item && typeof item === 'object' && item.url) add(item.url);
        });
      }
    });

    // 4. Extract markdown image URLs ![...](url) & HTML img/video/iframe src from content
    const contentStr = `${fullData?.content || ''}\n${fullData?.contentGu || ''}\n${fullData?.contentHi || ''}`;
    const mdMatches = contentStr.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+|\/uploads\/[^\s)]+|\/assets\/[^\s)]+)\)/gi);
    for (const match of mdMatches) {
      if (match[1]) add(match[1]);
    }

    const htmlImgMatches = contentStr.matchAll(/<(?:img|iframe|video)[^>]+src=["'](https?:\/\/[^"']+|\/uploads\/[^"']+|\/assets\/[^"']+)["']/gi);
    for (const match of htmlImgMatches) {
      if (match[1]) add(match[1]);
    }

    return mediaList.filter(Boolean);
  };

  // Handle opening review modal
  const handleOpenReview = async (art: ArticleData) => {
    setReviewModal({
      isOpen: true,
      article: art,
      fullData: null,
      loading: true,
      activeMediaIndex: 0,
    });

    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/articles/${art.id}`));
      const json = await res.json();
      if (res.ok) {
        const detail = json.data?.article || json.data;
        setReviewModal(prev => ({
          ...prev,
          fullData: detail,
          loading: false,
        }));
      } else {
        setReviewModal(prev => ({
          ...prev,
          loading: false,
        }));
      }
    } catch (err) {
      console.error('Failed to load article detail for review', err);
      setReviewModal(prev => ({
        ...prev,
        loading: false,
      }));
    }
  };

  // Fetch logged in user role
  useEffect(() => {
    authFetch(getBackendApiUrl('/api/auth/me'))
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          setUserRole(json.data.user.role);
          setUserAuthorId(json.data.user.authorId);
        }
      })
      .catch(() => { });
  }, []);

  // Fetch Categories for dropdown filter
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await authFetch(getBackendApiUrl('/api/admin/categories'));
        const json = await res.json();
        if (res.ok) {
          const raw: CategoryData[] = json.data || [];
          setCategories(raw.filter((c) => !isDisplayOnlySectionCategory(c) && c.isActive !== false));
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Articles
  useEffect(() => {
    if (!isInitialized) return;

    async function loadArticles() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(pageSize));
        if (query.trim()) params.set('query', query.trim());
        if (selectedCategory) params.set('categorySlug', selectedCategory);
        if (selectedStatus) params.set('status', selectedStatus);
        if (selectedDate) params.set('date', selectedDate);

        const res = await authFetch(getBackendApiUrl(`/api/admin/articles?${params.toString()}`));
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || 'Failed to retrieve articles.');

        setArticles(json.data.articles || []);
        setTotalArticles(json.data.total || 0);
        setTotalPages(json.data.totalPages || 1);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, [isInitialized, page, pageSize, query, selectedCategory, selectedStatus, selectedDate]);

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  // Scroll helpers
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    const height = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    window.scrollTo({ top: height, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: height, behavior: 'smooth' });
    document.body.scrollTo({ top: height, behavior: 'smooth' });
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      setPageInput(String(newPage));
    }
  };

  const handlePageInputSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseInt(pageInput, 10);
    if (!isNaN(num)) {
      const clamped = Math.max(1, Math.min(totalPages, num));
      setPageInput(String(clamped));
      if (clamped !== page) {
        handlePageChange(clamped);
      }
    } else {
      setPageInput(String(page));
    }
  };

  // Handle Soft-Delete
  const handleDelete = (id: string) => {
    const art = articles.find((a) => a.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Delete Article',
      message: `Are you sure you want to delete the article "${art?.title || 'this article'}"?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setDeletingId(id);
        try {
          const res = await authFetch(getBackendApiUrl(`/api/admin/articles/${id}`), {
            method: 'DELETE',
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Failed to delete article.');

          clearApiCache();
          fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '/' }),
          }).catch(() => { });

          // Refresh list
          setArticles((prev) => prev.filter((art) => art.id !== id));
          setTotalArticles((prev) => Math.max(0, prev - 1));
        } catch (err: any) {
          alert(err.message);
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  // Handle Quick Publish
  const handleQuickPublish = (art: ArticleData) => {
    setConfirmModal({
      isOpen: true,
      title: 'Publish Article',
      message: `Are you sure you want to publish "${art.title}" immediately?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const detailRes = await authFetch(getBackendApiUrl(`/api/admin/articles/${art.id}`));
          const detailJson = await detailRes.json();
          if (!detailRes.ok) throw new Error(detailJson.error || 'Failed to fetch article details.');

          const fullData = detailJson.data;

          const updateRes = await authFetch(getBackendApiUrl(`/api/admin/articles/${art.id}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...fullData,
              status: 'PUBLISHED',
              isPublished: true,
              publishedAt: new Date().toISOString()
            })
          });
          const updateJson = await updateRes.json();
          if (!updateRes.ok) throw new Error(updateJson.error || 'Failed to publish article.');

          clearApiCache();
          fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '/', slug: art.slug }),
          }).catch(() => { });

          setArticles(prev => prev.map(a => a.id === art.id ? { ...a, status: 'PUBLISHED', publishedAt: new Date().toISOString() } : a));
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  // Handle Quick Unpublish (Convert back to Draft)
  const handleQuickUnpublish = (art: ArticleData) => {
    setConfirmModal({
      isOpen: true,
      title: 'Convert to Draft',
      message: `Are you sure you want to revert "${art.title}" back to Draft?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const detailRes = await authFetch(getBackendApiUrl(`/api/admin/articles/${art.id}`));
          const detailJson = await detailRes.json();
          if (!detailRes.ok) throw new Error(detailJson.error || 'Failed to fetch article details.');

          const fullData = detailJson.data;

          const updateRes = await authFetch(getBackendApiUrl(`/api/admin/articles/${art.id}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...fullData,
              status: 'DRAFT',
              isPublished: false
            })
          });
          const updateJson = await updateRes.json();
          if (!updateRes.ok) throw new Error(updateJson.error || 'Failed to revert article to draft.');

          clearApiCache();
          fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '/', slug: art.slug }),
          }).catch(() => { });

          setArticles(prev => prev.map(a => a.id === art.id ? { ...a, status: 'DRAFT' } : a));
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  const getStatusBadge = (status: ArticleData['status']) => {
    const styles = {
      PUBLISHED: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30',
      DRAFT: 'bg-zinc-100 text-zinc-600 border-gray-400 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
      SCHEDULED: 'bg-amber-50 text-amber-700 border-amber-400 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      ARCHIVED: 'bg-red-50 text-red-700 border-red-400 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
    };
    return (
      <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPublishDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: '—', time: '' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: '—', time: '' };

    let date = '';
    let time = '';

    try {
      date = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
      time = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }).toUpperCase();
    } catch {
      date = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      time = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).toUpperCase();
    }

    return { date, time };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Articles</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your news streams, breaking alerts, and drafts.
          </p>
        </div>

        {/* Create Link */}
        <a
          href="/admin/articles/create"
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-base font-semibold tracking-wide text-white transition-all hover:bg-zinc-800 focus:outline-none dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shrink-0"
        >
          <Plus className="h-5 w-5" />
          <span>Write Article</span>
        </a>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-2xl border border-black bg-white p-4 dark:border-zinc-600 dark:bg-zinc-900 shadow-xs space-y-3">
        {/* Row 1: Full-width Prominent Search Bar */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400 pointer-events-none">
            <Search className={`h-4 w-4 transition-colors ${isSearchFocused || query ? 'text-[#B3121B]' : 'text-zinc-400'}`} />
          </span>
          <input
            type="text"
            placeholder="Search by title, content, tags, or article #..."
            value={query}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className={`w-full rounded-xl border border-black bg-zinc-50 py-2.5 pl-10 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all dark:border-zinc-600 dark:bg-zinc-950/40 dark:text-white ${
              isSearchFocused || query
                ? 'border-black dark:border-white ring-2 ring-black/10 dark:ring-white/20 bg-white dark:bg-zinc-900 shadow-xs'
                : 'focus:border-black dark:focus:border-white'
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setPage(1);
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Row 2: Perfectly Aligned Filters & Table Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-zinc-150 dark:border-zinc-800">
          {/* Filters on Left */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Dropdown */}
            <div className="relative min-w-[150px]">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-black bg-zinc-50 py-2 pl-3.5 pr-9 text-xs sm:text-sm font-semibold text-zinc-900 focus:border-black focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/40 dark:text-white dark:focus:border-white cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="home">Home / News</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400">
                <Filter className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Status Dropdown */}
            <div className="relative min-w-[140px]">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-black bg-zinc-50 py-2 pl-3.5 pr-9 text-xs sm:text-sm font-semibold text-zinc-900 focus:border-black focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/40 dark:text-white dark:focus:border-white cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400">
                <Filter className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Date Filter Input */}
            <div className="relative min-w-[155px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
                <Calendar className="h-3.5 w-3.5" />
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-black bg-zinc-50 py-2 pl-9 pr-8 text-xs sm:text-sm font-semibold text-zinc-900 focus:border-black focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/40 dark:text-white dark:focus:border-white cursor-pointer"
                title="Filter articles by date"
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate('');
                    setPage(1);
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  title="Clear date filter"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Reset All Filters button */}
            {(query || selectedCategory || selectedStatus || selectedDate) && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedCategory('');
                  setSelectedStatus('');
                  setSelectedDate('');
                  setPage(1);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-900"
                title="Reset all filters and search"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Controls on Right (Per Page + To Bottom) */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Per Page Selector in toolbar */}
            <div className="relative min-w-[130px]">
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10) || 10)}
                className="w-full appearance-none rounded-xl border border-black bg-zinc-50 py-2 pl-3.5 pr-8 text-xs sm:text-sm font-semibold text-zinc-900 focus:border-black focus:outline-none dark:border-zinc-600 dark:bg-zinc-950/40 dark:text-white dark:focus:border-white cursor-pointer"
                title="Articles per page"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={200}>200 per page</option>
                <option value={300}>300 per page</option>
                <option value={500}>500 per page</option>
              </select>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400">
                <ChevronDown className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Quick Scroll to Bottom Button in toolbar */}
            <button
              type="button"
              onClick={scrollToBottom}
              className="inline-flex items-center gap-1.5 rounded-xl border border-black bg-zinc-50 dark:bg-zinc-950/40 py-2 px-3 text-xs sm:text-sm font-bold text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition active:scale-95 shadow-2xs cursor-pointer whitespace-nowrap"
              title="Come to bottom (પેજના તળિયે જાઓ)"
            >
              <ArrowDown className="h-3.5 w-3.5 text-[#B3121B]" />
              <span>To Bottom</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        key={loading ? 'loading' : error ? 'error' : articles.length === 0 ? `empty-${selectedDate || 'none'}` : `table-${page}`}
        className="rounded-2xl border border-black bg-white overflow-hidden shadow-sm dark:border-zinc-600 dark:bg-zinc-900 w-full max-w-full"
      >

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
            <span className="mt-2 text-sm">Querying news repository...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-red-500 bg-red-50/10">
            <AlertCircle className="h-10 w-10 mb-2" />
            <span className="font-bold">Failed to load articles</span>
            <span className="text-sm mt-1">{error}</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            {selectedDate ? (
              <div className="flex flex-col items-center max-w-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 mb-4 ring-8 ring-amber-50/50 dark:ring-amber-950/10">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  No articles published or uploaded on this date
                </h3>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  No news articles were posted on <span key={selectedDate} className="font-semibold text-zinc-700 dark:text-zinc-300">{formattedSelectedDate}</span>. Try selecting another date or clear the filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate('');
                    setPage(1);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-sm cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear Date Filter</span>
                </button>
              </div>
            ) : query || selectedCategory || selectedStatus ? (
              <div className="flex flex-col items-center max-w-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 mb-4">
                  <Filter className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  No matching articles found
                </h3>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  No articles matched your active search query or selected category/status filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelectedCategory('');
                    setSelectedStatus('');
                    setSelectedDate('');
                    setPage(1);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center max-w-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  No articles available
                </h3>
                <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  No news articles have been uploaded or published yet.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/admin/articles/create')}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Write Article</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[1200px] border-collapse text-left text-sm [&_tr>*:first-child]:border-l-0 [&_tr>*:last-child]:border-r-0 [&_thead_tr:first-child>*]:border-t-0 [&_tbody_tr:last-child>*]:border-b-0">
              <thead className="bg-[#f8f9fa] font-bold uppercase tracking-wider text-sm text-zinc-650 dark:bg-zinc-950/70 dark:text-zinc-300 select-none">
                <tr>
                  <th className="px-4 py-3 border border-black dark:border-zinc-600 text-center text-base">Article</th>
                  <th className="px-4 py-3 border border-black dark:border-zinc-600 text-center text-base whitespace-nowrap">Category</th>
                  <th className="px-4 py-3 border border-black dark:border-zinc-600 text-center text-base whitespace-nowrap">Author</th>
                  <th className="px-4 py-3 border border-black dark:border-zinc-600 text-center text-base whitespace-nowrap">Views</th>
                  <th className="px-4 py-3 border border-black dark:border-zinc-600 text-center text-base whitespace-nowrap">Published At</th>
                  <th className="px-4 py-3 border border-black dark:border-zinc-600 text-center text-base whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 border border-black dark:border-zinc-600 text-center text-base">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-sky-50/50 dark:bg-sky-950/20">
                {articles.map((art) => (
                  <tr key={art.id} className="group hover:bg-sky-100/60 dark:hover:bg-sky-950/35 transition-colors">
                    {/* Thumbnail & Title */}
                    <td className="px-4 py-3 font-medium min-w-[360px] border border-black dark:border-zinc-600">
                      <div
                        onClick={() => handleOpenReview(art)}
                        className="flex items-center gap-4 cursor-pointer group/title"
                      >
                        <div className="relative h-20 w-32 sm:h-22 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-zinc-100 border border-gray-400 dark:border-zinc-700 shadow-2xs">
                          <ArticleMedia
                            src={art.featuredImage}
                            alt="thumb"
                            className="group-hover/title:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="line-clamp-2 text-zinc-900 font-semibold text-base leading-normal dark:text-white group-hover/title:text-[#B3121B] dark:group-hover/title:text-red-400 transition-colors">
                            {art.titleGu || art.title || art.titleHi}
                          </p>
                          <div className="flex items-center gap-2">
                            {art.articleNumber && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-red-50 text-[#B3121B] border border-red-300 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400 text-xs font-medium font-mono">
                                #{art.articleNumber}
                              </span>
                            )}
                            <span className="text-xs text-zinc-500 uppercase font-medium tracking-wider font-mono truncate max-w-[220px]">
                              slug: {art.slug}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 text-center text-sm border border-black dark:border-zinc-600">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300 shadow-2xs">
                          {art.category.name}
                        </span>
                        {(() => {
                          const catItems: string[] = [];
                          if (art.isFeatured && art.category?.name?.toLowerCase() !== 'home') {
                            catItems.push('Home');
                          }
                          (art.categories || []).forEach((c) => {
                            const name = c.category?.name;
                            if (name && name.toLowerCase() !== art.category?.name?.toLowerCase() && !catItems.includes(name)) {
                              catItems.push(name);
                            }
                          });
                          if (catItems.length === 0) return null;
                          return (
                            <div className="flex flex-wrap items-center justify-center gap-1 max-w-[200px]" title={catItems.join(', ')}>
                              {catItems.slice(0, 3).map((catName, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300"
                                >
                                  {catName}
                                </span>
                              ))}
                              {catItems.length > 3 && (
                                <span className="inline-flex items-center px-1 py-0.5 rounded text-[9.5px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400">
                                  +{catItems.length - 3}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm text-zinc-700 dark:text-zinc-300 font-medium border border-black dark:border-zinc-600">
                      {art.author.name}
                    </td>

                    {/* Views */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-center border border-black dark:border-zinc-600">
                      <div className="flex items-center justify-center gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                        <Eye className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="font-medium">{art.views.toLocaleString('en-IN')}</span>
                      </div>
                    </td>

                    {/* Published Date & Time */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-center text-sm border border-black dark:border-zinc-600">
                      {(() => {
                        const rawDate = (art.status === 'SCHEDULED' && art.scheduledAt)
                          ? art.scheduledAt
                          : (art.publishedAt || art.createdAt || art.updatedAt);
                        const { date, time } = formatPublishDateTime(rawDate);
                        return (
                          <div className="flex flex-col items-center justify-center leading-tight gap-1">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[13.5px]">
                              {date}
                            </span>
                            {time && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                                <Clock className="h-3 w-3 text-zinc-400 shrink-0" />
                                <span>{time}</span>
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-center border border-black dark:border-zinc-600">
                      {getStatusBadge(art.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap border border-black dark:border-zinc-600">
                      <div className="flex items-center justify-center gap-2.5">
                        {/* Dedicated Article Review Button */}
                        <button
                          onClick={() => handleOpenReview(art)}
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-400/80 hover:bg-blue-100 hover:text-blue-900 dark:bg-blue-950/50 dark:border-blue-800/60 dark:text-blue-300 dark:hover:bg-blue-900/60 transition-all shadow-2xs"
                          title="Review Article & Preview"
                        >
                          <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span>Review</span>
                        </button>
                        {userRole !== 'REPORTER' && art.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => handleQuickPublish(art)}
                            className="rounded-lg p-2 text-green-600 hover:bg-green-100 hover:text-green-900 dark:text-green-400 dark:hover:bg-green-950/20 transition-colors"
                            title="Quick Publish"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                        )}
                        {userRole !== 'REPORTER' && art.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleQuickUnpublish(art)}
                            className="rounded-lg p-2 text-amber-600 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/20 transition-colors"
                            title="Revert to Draft"
                          >
                            <RotateCcw className="h-5 w-5" />
                          </button>
                        )}
                        {userRole !== 'REPORTER' || art.authorId === userAuthorId ? (
                          <a
                            href={`/admin/articles/${art.id}/edit`}
                            className="rounded-lg p-2 text-zinc-500 hover:bg-slate-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-slate-700/60 dark:hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-5 w-5" />
                          </a>
                        ) : (
                          <span
                            className="rounded-lg p-2 text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                            title="Forbidden: You cannot edit other authors' articles"
                          >
                            <Edit2 className="h-5 w-5 opacity-40" />
                          </span>
                        )}
                        {userRole !== 'REPORTER' && (
                          <button
                            onClick={() => handleDelete(art.id)}
                            disabled={deletingId === art.id}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-650 dark:text-red-400 dark:hover:bg-red-950/20 disabled:opacity-50 transition-colors"
                            title="Delete"
                          >
                            {deletingId === art.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && !error && totalArticles > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-400 px-6 py-4 dark:border-zinc-700">
            <div className="flex flex-wrap items-center gap-3.5">
              <span className="text-base font-medium text-slate-600 dark:text-slate-400">
                Showing <strong className="text-slate-900 dark:text-white font-bold">{articles.length}</strong> of{' '}
                <strong className="text-slate-900 dark:text-white font-bold">{totalArticles}</strong> results
              </span>

              <div className="flex items-center gap-2 pl-3 border-l border-zinc-300 dark:border-zinc-700">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Show:
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10) || 10)}
                  className="rounded-lg border border-gray-400 bg-white dark:bg-zinc-900 px-2.5 py-1 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:border-black dark:focus:border-white focus:outline-none dark:border-zinc-700 cursor-pointer shadow-2xs"
                  title="Change number of articles shown per page"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={300}>300</option>
                  <option value={500}>500</option>
                </select>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  per page
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {/* Page navigation controls */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* First page button */}
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={page === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-400 text-zinc-600 hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                  title="First page (Page 1)"
                >
                  <ChevronsLeft className="h-5 w-5" />
                </button>

                {/* Previous page button */}
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-400 text-zinc-600 hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Editable Page Input: Page [ 2 ] of 87 */}
                <form
                  onSubmit={handlePageInputSubmit}
                  className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap px-1"
                >
                  <span>Page</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={handlePageInputSubmit}
                    onFocus={(e) => e.target.select()}
                    className="w-14 sm:w-16 h-10 px-1 text-center font-black text-sm sm:text-base rounded-xl border-2 border-gray-400 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B3121B] focus:border-[#B3121B] dark:border-zinc-700 shadow-xs transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text hover:border-black dark:hover:border-white"
                    title={`Type a page number (1 to ${totalPages}) and press Enter to jump`}
                  />
                  <span>of {totalPages}</span>

                  {pageInput !== String(page) && pageInput.trim() !== '' && (
                    <button
                      type="submit"
                      className="ml-1 h-8 px-2.5 rounded-lg bg-[#B3121B] hover:bg-red-700 text-white text-xs font-black transition active:scale-95 shadow-sm cursor-pointer"
                      title="Jump to page"
                    >
                      Go
                    </button>
                  )}
                </form>

                {/* Next page button */}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-400 text-zinc-600 hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Last page button */}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={page === totalPages}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-400 text-zinc-600 hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition active:scale-95 cursor-pointer"
                  title={`Last page (Page ${totalPages})`}
                >
                  <ChevronsRight className="h-5 w-5" />
                </button>
              </div>

              {/* Divider */}
              <div className="hidden sm:block h-6 w-px bg-zinc-300 dark:bg-zinc-700" />

              {/* Neatly integrated To Top button */}
              <button
                type="button"
                onClick={scrollToTop}
                className="group inline-flex h-10 items-center gap-1.5 rounded-xl border border-gray-400 bg-white dark:bg-zinc-900 px-3.5 text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 hover:bg-[#B3121B] hover:text-white hover:border-[#B3121B] dark:hover:bg-[#B3121B] dark:hover:text-white dark:hover:border-[#B3121B] transition-all active:scale-95 shadow-2xs cursor-pointer whitespace-nowrap"
                title="Come to top (ટોચ પર જાઓ)"
              >
                <ArrowUp className="h-4 w-4 text-[#B3121B] group-hover:text-white transition-colors" />
                <span>To Top</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ─── CUSTOM CONFIRMATION DIALOG MODAL ─── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-md transform overflow-hidden rounded-2xl border border-gray-400 bg-white p-6 text-left align-middle shadow-xl transition-all dark:border-zinc-700 dark:bg-zinc-900 space-y-4">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-amber-500/10 p-2 text-amber-500 shrink-0 mt-0.5">
                <AlertCircle className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-6">
                  {confirmModal.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="rounded-xl border border-gray-400 px-4 py-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-850 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ARTICLE REVIEW MODAL ─── */}
      {reviewModal.isOpen && reviewModal.article && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/65 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border border-gray-400 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-400 px-6 py-4 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-950/40">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-bold shrink-0">
                  <Eye className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
                      Article Review
                    </h2>
                    {getStatusBadge(reviewModal.article.status)}
                    {reviewModal.article.articleNumber && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50 text-[#B3121B] border border-red-300 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400 text-xs font-mono font-bold">
                        #{reviewModal.article.articleNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Inspect headline, full content body, media preview, and article metadata.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                title="Close Modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {reviewModal.loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                  <span className="text-sm font-semibold">Loading full article details...</span>
                </div>
              ) : (
                <>
                  {/* Metadata Header Bar */}
                  <div className="flex items-center justify-between border-b border-gray-400 dark:border-zinc-700 pb-3">
                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        {reviewModal.fullData?.author?.name || reviewModal.article.author.name}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-zinc-400" />
                        {reviewModal.article.views} views
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Published: {(() => {
                          const rawDate = (reviewModal.article.status === 'SCHEDULED' && (reviewModal.fullData?.scheduledAt || reviewModal.article.scheduledAt))
                            ? (reviewModal.fullData?.scheduledAt || reviewModal.article.scheduledAt)
                            : (reviewModal.fullData?.publishedAt || reviewModal.article.publishedAt || reviewModal.fullData?.createdAt || reviewModal.article.createdAt);
                          const { date, time } = formatPublishDateTime(rawDate);
                          return time ? `${date} at ${time}` : date;
                        })()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Category Info */}
                  <div className="space-y-1">
                    <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white leading-snug">
                      {reviewModal.fullData?.titleGu || reviewModal.article.titleGu || reviewModal.fullData?.title || reviewModal.article.title}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-500 dark:text-zinc-400">
                      <span>Category:</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        {reviewModal.article.category.name} (Main)
                      </span>
                      {(() => {
                        const rawCats = reviewModal.fullData?.categories || reviewModal.article.categories || [];
                        const additional: string[] = [];
                        if (
                          (reviewModal.fullData?.isFeatured || reviewModal.article.isFeatured) &&
                          reviewModal.article?.category?.name?.toLowerCase() !== 'home'
                        ) {
                          additional.push('Home');
                        }
                        rawCats.forEach((c: any) => {
                          const name = c.category?.name || c.name;
                          if (name && name.toLowerCase() !== reviewModal.article?.category?.name?.toLowerCase() && !additional.includes(name)) {
                            additional.push(name);
                          }
                        });
                        if (additional.length === 0) return null;
                        return (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-zinc-400 font-mono">| Additional:</span>
                            {additional.map((catName: string, i: number) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              >
                                {catName}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                      <span className="text-zinc-400 font-mono">| Slug: <span className="font-bold text-zinc-700 dark:text-zinc-300">{reviewModal.article.slug}</span></span>
                    </div>
                  </div>

                  {/* Media Gallery (Shows ALL images and videos if 1, 2, 5 or more) */}
                  {(() => {
                    const allMedia = extractAllMedia(reviewModal.article, reviewModal.fullData);
                    if (allMedia.length === 0) return null;
                    const currentIndex = Math.min(reviewModal.activeMediaIndex, allMedia.length - 1);

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <Film className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            Article Media ({allMedia.length} {allMedia.length === 1 ? 'Media Item' : 'Images & Videos'})
                          </h4>
                          {allMedia.length > 1 && (
                            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 px-2.5 py-0.5 rounded-full">
                              Media {currentIndex + 1} of {allMedia.length}
                            </span>
                          )}
                        </div>

                        {/* Main Active Media Display */}
                        <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-zinc-950 border border-gray-400 dark:border-zinc-700 shadow-md group">
                          <ArticleMedia
                            src={allMedia[currentIndex]}
                            alt={`Media ${currentIndex + 1}`}
                            className="w-full h-full object-contain"
                            videoControls={false}
                            showPlayBadge={false}
                            autoPlay={true}
                          />

                          {/* Navigation Arrows if > 1 media items */}
                          {allMedia.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() => setReviewModal(prev => ({ ...prev, activeMediaIndex: (currentIndex - 1 + allMedia.length) % allMedia.length }))}
                                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/90 backdrop-blur-xs transition-all shadow-md z-10"
                                title="Previous Media"
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setReviewModal(prev => ({ ...prev, activeMediaIndex: (currentIndex + 1) % allMedia.length }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/90 backdrop-blur-xs transition-all shadow-md z-10"
                                title="Next Media"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Thumbnails Grid for ALL Images & Videos */}
                        {allMedia.length > 1 && (
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 pt-1">
                            {allMedia.map((mediaUrl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setReviewModal(prev => ({ ...prev, activeMediaIndex: idx }))}
                                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${currentIndex === idx
                                  ? 'border-blue-600 ring-2 ring-blue-500/30 scale-95'
                                  : 'border-transparent opacity-75 hover:opacity-100 hover:scale-105'
                                  }`}
                              >
                                <ArticleMedia
                                  src={mediaUrl}
                                  alt={`Thumb ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  showPlayBadge={true}
                                  autoPlay={false}
                                />
                                <span className="absolute bottom-1 right-1 text-[9px] font-black text-white bg-black/75 px-1 py-0.2 rounded-xs">
                                  #{idx + 1}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Excerpt Section */}
                  {(reviewModal.fullData?.excerptGu || reviewModal.fullData?.excerpt || reviewModal.fullData?.excerptHi) && (
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-gray-400 dark:bg-zinc-950/40 dark:border-zinc-700">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Article Excerpt / Summary</h4>
                      <p className="text-sm italic text-zinc-700 dark:text-zinc-300">
                        {reviewModal.fullData?.excerptGu || reviewModal.fullData?.excerpt || reviewModal.fullData?.excerptHi}
                      </p>
                    </div>
                  )}

                  {/* Main Body Content */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Full Content Body</h4>
                    <div className="p-5 rounded-2xl border border-gray-400 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-950/20 text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed prose max-w-none dark:prose-invert">
                      {(() => {
                        const rawContent = reviewModal.fullData?.contentGu || reviewModal.fullData?.content || reviewModal.fullData?.contentHi;

                        if (!rawContent) {
                          return <p className="text-zinc-400 italic">No text content available.</p>;
                        }

                        return <div dangerouslySetInnerHTML={{ __html: rawContent }} />;
                      })()}
                    </div>
                  </div>

                  {/* Tags list */}
                  {reviewModal.fullData?.tags && reviewModal.fullData.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" /> Tags:
                      </span>
                      {reviewModal.fullData.tags.map((t: any, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          #{t.tag?.name || t.name || t}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-400 px-6 py-4 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-950/40">
              <div className="flex items-center gap-2">
                {/* View Live Article Button */}
                <a
                  href={`/news/${reviewModal.article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-400 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-xs"
                >
                  <Globe2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>View Live Site</span>
                </a>

                {/* Edit Article Link */}
                {(userRole !== 'REPORTER' || reviewModal.article.authorId === userAuthorId) && (
                  <a
                    href={`/admin/articles/${reviewModal.article.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-400 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-xs"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Edit Article</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Quick Publish / Unpublish inside modal */}
                {userRole !== 'REPORTER' && reviewModal.article.status !== 'PUBLISHED' && (
                  <button
                    onClick={() => {
                      const art = reviewModal.article!;
                      setReviewModal(prev => ({ ...prev, isOpen: false }));
                      handleQuickPublish(art);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Approve & Publish</span>
                  </button>
                )}

                {userRole !== 'REPORTER' && reviewModal.article.status === 'PUBLISHED' && (
                  <button
                    onClick={() => {
                      const art = reviewModal.article!;
                      setReviewModal(prev => ({ ...prev, isOpen: false }));
                      handleQuickUnpublish(art);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Convert to Draft</span>
                  </button>
                )}

                {/* Close button */}
                <button
                  onClick={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
                  className="rounded-xl border border-gray-400 px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
