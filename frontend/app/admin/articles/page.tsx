'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  AlertCircle,
  Loader2,
  Globe2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

interface ArticleData {
  id: string;
  slug: string;
  title: string;
  titleGu: string;
  titleHi: string;
  featuredImage: string;
  views: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
  publishedAt: string;
  authorId: string;
  author: {
    id: string;
    name: string;
  };
  category: {
    name: string;
    slug: string;
  };
}

interface CategoryData {
  id: string;
  slug: string;
  name: string;
}

export default function ArticleList() {
  const router = useRouter();

  // Search & Filter state
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Table state
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // UI indicators
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [langTab, setLangTab] = useState<'en' | 'gu' | 'hi'>('en');
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
    onConfirm: () => {},
  });

  // Fetch logged in user role
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.authenticated) {
          setUserRole(json.data.user.role);
          setUserAuthorId(json.data.user.authorId);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Categories for dropdown filter
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        const json = await res.json();
        if (res.ok) setCategories(json.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  // Fetch Articles
  useEffect(() => {
    async function loadArticles() {
      setLoading(true);
      setError(null);
      try {
        const url = new URL('/api/admin/articles', window.location.origin);
        url.searchParams.set('page', String(page));
        url.searchParams.set('limit', '10');
        if (query.trim()) url.searchParams.set('query', query);
        if (selectedCategory) url.searchParams.set('categorySlug', selectedCategory);
        if (selectedStatus) url.searchParams.set('status', selectedStatus);

        const res = await fetch(url);
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
  }, [page, query, selectedCategory, selectedStatus]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
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
          const res = await fetch(`/api/admin/articles/${id}`, {
            method: 'DELETE',
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Failed to delete article.');

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
          const detailRes = await fetch(`/api/admin/articles/${art.id}`);
          const detailJson = await detailRes.json();
          if (!detailRes.ok) throw new Error(detailJson.error || 'Failed to fetch article details.');

          const fullData = detailJson.data;

          const updateRes = await fetch(`/api/admin/articles/${art.id}`, {
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
          const detailRes = await fetch(`/api/admin/articles/${art.id}`);
          const detailJson = await detailRes.json();
          if (!detailRes.ok) throw new Error(detailJson.error || 'Failed to fetch article details.');

          const fullData = detailJson.data;

          const updateRes = await fetch(`/api/admin/articles/${art.id}`, {
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
      DRAFT: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
      SCHEDULED: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      ARCHIVED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
    };
    return (
      <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 focus:outline-none dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Write Article</span>
        </a>
      </div>

      {/* Language Filter & Search Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
        {/* Search & Category Inputs */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search title, content, or tags..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white dark:focus:border-primary"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-4 pr-10 text-sm text-zinc-900 focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400">
              <Filter className="h-4 w-4" />
            </span>
          </div>

          {/* Status Dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-4 pr-10 text-sm text-zinc-900 focus:border-primary focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400">
              <Filter className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Translation Preview Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1 dark:bg-zinc-950 self-start md:self-auto">
          <button
            onClick={() => setLangTab('en')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              langTab === 'en'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLangTab('gu')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              langTab === 'gu'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            ગુજરાતી
          </button>
          <button
            onClick={() => setLangTab('hi')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              langTab === 'hi'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
            }`}
          >
            हिन्दी
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        
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
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <AlertCircle className="h-10 w-10 mb-2 text-zinc-300" />
            <span className="text-sm">No articles match your search query.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50 font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-4">Article</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Views</th>
                  <th className="px-6 py-4">Published At</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {articles.map((art) => (
                  <tr key={art.id} className="group hover:bg-zinc-50/40 dark:hover:bg-zinc-950/10 transition-colors">
                    {/* Thumbnail & Title */}
                    <td className="px-6 py-4 font-medium min-w-[320px]">
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-20 overflow-hidden rounded bg-zinc-100">
                          <img
                            src={art.featuredImage}
                            alt="thumb"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=300&q=80';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="line-clamp-2 text-zinc-900 font-bold leading-tight dark:text-white">
                            {langTab === 'en' ? art.title : langTab === 'gu' ? art.titleGu : art.titleHi}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-1 uppercase font-semibold tracking-wider font-mono">
                            slug: {art.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400 font-medium">
                      {art.category.name}
                    </td>

                    {/* Author */}
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400 font-medium">
                      {art.author.name}
                    </td>

                    {/* Views */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                        <Eye className="h-4 w-4 text-zinc-400" />
                        <span className="font-semibold">{art.views.toLocaleString('en-IN')}</span>
                      </div>
                    </td>

                    {/* Published Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                      {formatDate(art.publishedAt)}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(art.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2.5">
                        {userRole !== 'REPORTER' && art.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => handleQuickPublish(art)}
                            className="rounded-lg p-1.5 text-green-600 hover:bg-green-105 hover:text-green-900 dark:text-green-400 dark:hover:bg-green-950/20"
                            title="Quick Publish"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {userRole !== 'REPORTER' && art.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleQuickUnpublish(art)}
                            className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/20"
                            title="Revert to Draft"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        {userRole !== 'REPORTER' || art.authorId === userAuthorId ? (
                          <a
                            href={`/admin/articles/${art.id}/edit`}
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-150 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </a>
                        ) : (
                          <span
                            className="p-1.5 text-zinc-300 dark:text-zinc-700 cursor-not-allowed"
                            title="Forbidden: You cannot edit other authors' articles"
                          >
                            <Edit2 className="h-4 w-4 opacity-40" />
                          </span>
                        )}
                        {userRole !== 'REPORTER' && (
                          <button
                            onClick={() => handleDelete(art.id)}
                            disabled={deletingId === art.id}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-650 dark:text-red-400 dark:hover:bg-red-950/20 disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === art.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
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
          <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500">
              Showing {articles.length} of {totalArticles} results
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="rounded-xl border border-zinc-200 p-2 text-zinc-550 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:hover:bg-zinc-950/40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-xs font-bold text-zinc-650 dark:text-zinc-400 px-2">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="rounded-xl border border-zinc-200 p-2 text-zinc-550 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-800 dark:hover:bg-zinc-950/40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ─── CUSTOM CONFIRMATION DIALOG MODAL ─── */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-md transform overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 text-left align-middle shadow-xl transition-all dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
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
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
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
    </div>
  );
}
