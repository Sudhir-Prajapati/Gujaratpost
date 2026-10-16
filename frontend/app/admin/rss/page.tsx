'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Rss,
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Eye,
  Send,
  Sliders,
  X,
  Sparkles,
  FileText,
  ShieldCheck,
  Play,
  Activity,
  Check,
} from 'lucide-react';
import { getBackendApiUrl, authFetch } from '@/lib/api';

interface RssFetchLog {
  id: string;
  sourceId: string;
  source?: { id: string; name: string; url: string } | null;
  status: 'SUCCESS' | 'ERROR' | 'SKIPPED_NOT_MODIFIED';
  itemsFound: number;
  itemsImported: number;
  errorMessage?: string | null;
  durationMs: number;
  createdAt: string;
}

interface RssSource {
  id: string;
  name: string;
  url: string;
  categoryId: string | null;
  category?: { id: string; name: string; nameGu: string; slug: string } | null;
  isActive: boolean;
  pollingInterval: number;
  lastFetchedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  itemCount: number;
  createdAt: string;
  _count?: { items: number; logs: number };
}

interface RssItem {
  id: string;
  sourceId: string;
  guid: string;
  sourceUrl: string;
  title: string;
  titleGu?: string | null;
  excerpt?: string | null;
  content?: string | null;
  author?: string | null;
  imageUrl?: string | null;
  categoryName?: string | null;
  targetCategoryId?: string | null;
  targetCategory?: { id: string; name: string; nameGu: string; slug: string } | null;
  pubDate?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  publishedPostId?: string | null;
  createdAt: string;
  source?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  nameGu: string;
  slug: string;
}

interface PreviewItem {
  title: string;
  link: string;
  pubDate: string | null;
  excerpt: string;
  imageUrl: string;
}

interface FeedPreviewResult {
  success: boolean;
  title: string;
  description: string;
  link: string;
  itemCount: number;
  previewItems: PreviewItem[];
}

function getErrorMessage(err: unknown, defaultMsg: string): string {
  if (err instanceof Error) return err.message;
  return defaultMsg;
}

export default function AdminRssPage() {
  const [activeTab, setActiveTab] = useState<'sources' | 'items' | 'logs'>('sources');

  // Sources State
  const [sources, setSources] = useState<RssSource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);

  // Items (Moderation Queue) State
  const [items, setItems] = useState<RssItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Logs State
  const [logs, setLogs] = useState<RssFetchLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Modals & Forms State
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [editingSource, setEditingSource] = useState<RssSource | null>(null);
  const [sourceForm, setSourceForm] = useState({
    name: '',
    url: '',
    categoryId: '',
    pollingInterval: 60,
    isActive: true,
  });

  // Test Feed State
  const [testUrl, setTestUrl] = useState('');
  const [testingFeed, setTestingFeed] = useState(false);
  const [testResult, setTestResult] = useState<FeedPreviewResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  // Item Preview & Publish Modal
  const [selectedItem, setSelectedItem] = useState<RssItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [publishForm, setPublishForm] = useState({
    categoryId: '',
    title: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    isFeatured: false,
    isTrending: false,
    isBreaking: false,
  });
  const [publishing, setPublishing] = useState(false);

  // Syncing state tracker
  const [syncingSourceId, setSyncingSourceId] = useState<string | null>(null);
  const [alertBanner, setAlertBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertBanner({ type, message });
    setTimeout(() => setAlertBanner(null), 6000);
  };

  const fetchSources = async () => {
    setLoadingSources(true);
    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/rss/sources'));
      const json = await res.json();
      if (json?.success && json.data?.sources) {
        setSources(json.data.sources);
      }
    } catch {
      showAlert('error', 'Failed to load RSS sources.');
    } finally {
      setLoadingSources(false);
    }
  };

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '15',
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(sourceFilter ? { sourceId: sourceFilter } : {}),
        ...(searchQuery ? { query: searchQuery } : {}),
      });

      const res = await authFetch(getBackendApiUrl(`/api/admin/rss/items?${params.toString()}`));
      const json = await res.json();
      if (json?.success && json.data) {
        setItems(json.data.items || []);
        if (json.data.pagination) {
          setTotalPages(json.data.pagination.totalPages || 1);
          setTotalItems(json.data.pagination.total || 0);
        }
      }
    } catch {
      showAlert('error', 'Failed to load RSS items.');
    } finally {
      setLoadingItems(false);
    }
  };

  // Load Categories & Sources on mount
  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      // 1. Load Categories with fallbacks
      try {
        let loadedCats: Category[] = [];

        // Try admin categories first
        try {
          const catRes = await authFetch(getBackendApiUrl('/api/admin/categories'));
          if (catRes.ok) {
            const catJson = await catRes.json();
            if (Array.isArray(catJson?.data)) {
              loadedCats = catJson.data;
            } else if (Array.isArray(catJson?.data?.categories)) {
              loadedCats = catJson.data.categories;
            }
          }
        } catch {}

        // Fallback to public categories endpoint
        if (loadedCats.length === 0) {
          try {
            const pubRes = await fetch(getBackendApiUrl('/api/public/categories'));
            if (pubRes.ok) {
              const pubJson = await pubRes.json();
              if (Array.isArray(pubJson?.data?.categories)) {
                loadedCats = pubJson.data.categories;
              } else if (Array.isArray(pubJson?.data)) {
                loadedCats = pubJson.data;
              }
            }
          } catch {}
        }

        if (!ignore && loadedCats.length > 0) {
          setCategories(loadedCats);
        }
      } catch (err) {
        console.warn('Error loading categories:', err);
      }

      // 2. Load RSS sources
      try {
        const srcRes = await authFetch(getBackendApiUrl('/api/admin/rss/sources'));
        if (srcRes.ok) {
          const srcJson = await srcRes.json();
          if (!ignore && srcJson?.success && srcJson.data?.sources) {
            setSources(srcJson.data.sources);
          }
        }
      } catch {
        if (!ignore) {
          showAlert('error', 'Failed to load RSS sources.');
        }
      } finally {
        if (!ignore) {
          setLoadingSources(false);
        }
      }
    }
    loadInitial();
    return () => {
      ignore = true;
    };
  }, []);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/rss/logs?limit=50'));
      const json = await res.json();
      if (json?.success && json.data?.logs) {
        setLogs(json.data.logs);
      }
    } catch {
      showAlert('error', 'Failed to load RSS fetch logs.');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Reload Items when filters or page change
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
      return;
    }
    if (activeTab !== 'items') return;
    let ignore = false;
    async function loadItems() {
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: '15',
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(sourceFilter ? { sourceId: sourceFilter } : {}),
          ...(searchQuery ? { query: searchQuery } : {}),
        });
        const res = await authFetch(getBackendApiUrl(`/api/admin/rss/items?${params.toString()}`));
        const json = await res.json();
        if (!ignore && json?.success && json.data) {
          setItems(json.data.items || []);
          if (json.data.pagination) {
            setTotalPages(json.data.pagination.totalPages || 1);
            setTotalItems(json.data.pagination.total || 0);
          }
        }
      } catch {
        if (!ignore) {
          showAlert('error', 'Failed to load RSS items.');
        }
      } finally {
        if (!ignore) {
          setLoadingItems(false);
        }
      }
    }
    loadItems();
    return () => {
      ignore = true;
    };
  }, [activeTab, currentPage, statusFilter, sourceFilter, searchQuery]);

  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceForm.name.trim() || !sourceForm.url.trim()) {
      showAlert('error', 'Source name and URL are required.');
      return;
    }

    try {
      const endpoint = editingSource
        ? `/api/admin/rss/sources/${editingSource.id}`
        : '/api/admin/rss/sources';
      const method = editingSource ? 'PUT' : 'POST';

      const res = await authFetch(getBackendApiUrl(endpoint), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceForm),
      });

      const json = await res.json();
      if (json?.success) {
        showAlert('success', editingSource ? 'Source updated successfully' : 'Source added successfully');
        setShowSourceModal(false);
        setEditingSource(null);
        setSourceForm({ name: '', url: '', categoryId: '', pollingInterval: 60, isActive: true });
        fetchSources();
      } else {
        showAlert('error', json?.message || 'Failed to save source.');
      }
    } catch (err: unknown) {
      showAlert('error', getErrorMessage(err, 'An error occurred.'));
    }
  };

  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? All related pending items will be removed.`)) {
      return;
    }

    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/rss/sources/${id}`), {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json?.success) {
        showAlert('success', 'Source deleted successfully');
        fetchSources();
      } else {
        showAlert('error', json?.message || 'Failed to delete source');
      }
    } catch (err: unknown) {
      showAlert('error', getErrorMessage(err, 'Error deleting source'));
    }
  };

  const handleSyncSource = async (id: string) => {
    setSyncingSourceId(id);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/rss/sources/${id}/sync`), {
        method: 'POST',
      });
      const json = await res.json();
      if (json?.success) {
        const d = json.data;
        if (d.status === 'SUCCESS') {
          showAlert('success', `Sync complete: Found ${d.itemsFound} items, imported ${d.itemsImported} new entries.`);
        } else if (d.status === 'SKIPPED_NOT_MODIFIED') {
          showAlert('success', 'Feed has not changed since last check (304 Not Modified).');
        } else {
          showAlert('error', `Sync notice: ${d.errorMessage || 'Completed with errors'}`);
        }
        fetchSources();
      } else {
        showAlert('error', json?.message || 'Sync failed');
      }
    } catch (err: unknown) {
      showAlert('error', getErrorMessage(err, 'Sync failed due to network error'));
    } finally {
      setSyncingSourceId(null);
    }
  };

  const handleTestFeed = async () => {
    if (!testUrl.trim()) return;
    setTestingFeed(true);
    setTestError(null);
    setTestResult(null);

    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/rss/test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl.trim() }),
      });
      const json = await res.json();
      if (json?.success && json.data) {
        setTestResult(json.data);
      } else {
        setTestError(json?.message || 'Validation failed.');
      }
    } catch (err: unknown) {
      setTestError(getErrorMessage(err, 'Error verifying feed.'));
    } finally {
      setTestingFeed(false);
    }
  };

  const openItemModal = (item: RssItem) => {
    setSelectedItem(item);
    setPublishForm({
      categoryId: item.targetCategoryId || item.source?.id ? (categories[0]?.id || '') : '',
      title: item.titleGu || item.title || '',
      excerpt: item.excerpt || '',
      content: item.content || item.excerpt || '',
      imageUrl: item.imageUrl || '',
      isFeatured: false,
      isTrending: false,
      isBreaking: false,
    });
    setShowItemModal(true);
  };

  const handlePublishItem = async () => {
    if (!selectedItem) return;
    setPublishing(true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/rss/items/${selectedItem.id}/publish`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishForm),
      });
      const json = await res.json();
      if (json?.success) {
        showAlert('success', 'Article converted & published successfully to GujaratPost news feed!');
        setShowItemModal(false);
        setSelectedItem(null);
        fetchItems();
      } else {
        showAlert('error', json?.message || 'Failed to publish article.');
      }
    } catch (err: unknown) {
      showAlert('error', getErrorMessage(err, 'Error publishing article'));
    } finally {
      setPublishing(false);
    }
  };

  const handleRejectItem = async (itemId: string) => {
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/rss/items/${itemId}/reject`), {
        method: 'POST',
      });
      const json = await res.json();
      if (json?.success) {
        showAlert('success', 'Item rejected');
        fetchItems();
      } else {
        showAlert('error', json?.message || 'Failed to reject');
      }
    } catch (err: unknown) {
      showAlert('error', getErrorMessage(err, 'Error rejecting item'));
    }
  };

  const handleToggleSource = async (id: string) => {
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/rss/sources/${id}/toggle`), {
        method: 'PUT',
      });
      const json = await res.json();
      if (json?.success) {
        showAlert('success', json.data?.isActive ? 'Source activated' : 'Source paused');
        fetchSources();
      } else {
        showAlert('error', json?.message || 'Failed to toggle source');
      }
    } catch (err: unknown) {
      showAlert('error', getErrorMessage(err, 'Error toggling source'));
    }
  };

  const handleApproveItem = async (itemId: string) => {
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/rss/items/${itemId}/approve`), {
        method: 'POST',
      });
      const json = await res.json();
      if (json?.success) {
        showAlert('success', 'Story approved for publication');
        if (showItemModal && selectedItem?.id === itemId) {
          setShowItemModal(false);
          setSelectedItem(null);
        }
        fetchItems();
      } else {
        showAlert('error', json?.message || 'Failed to approve story');
      }
    } catch (err: unknown) {
      showAlert('error', getErrorMessage(err, 'Error approving story'));
    }
  };


  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-6 lg:p-8">
      {/* Alert Banner */}
      {alertBanner && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between border shadow-sm transition-all ${
            alertBanner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {alertBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{alertBanner.message}</span>
          </div>
          <button onClick={() => setAlertBanner(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Rss className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">RSS Feed Management</h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Configure external news sources, review imported feeds, and manage public RSS feeds.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTestUrl('');
              setTestResult(null);
              setTestError(null);
              setShowTestModal(true);
            }}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-2 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Test Feed URL</span>
          </button>

          <button
            onClick={() => {
              setEditingSource(null);
              setSourceForm({
                name: '',
                url: '',
                categoryId: categories[0]?.id || '',
                pollingInterval: 60,
                isActive: true,
              });
              setShowSourceModal(true);
            }}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Feed Source</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab('sources')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'sources'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configured Sources ({sources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'items'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Review & Import Queue</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Sync Logs & Health</span>
        </button>
      </div>

      {/* TAB 1: CONFIGURED SOURCES */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          {loadingSources ? (
            <div className="py-20 text-center text-zinc-400 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-orange-500" />
              <p>Loading configured RSS sources...</p>
            </div>
          ) : sources.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto mb-4">
                <Rss className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No RSS Feed Sources Registered</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
                Add verified external news outlets or press release feeds to curate and review incoming stories before publishing.
              </p>
              <button
                onClick={() => {
                  setEditingSource(null);
                  setSourceForm({
                    name: '',
                    url: '',
                    categoryId: categories[0]?.id || '',
                    pollingInterval: 60,
                    isActive: true,
                  });
                  setShowSourceModal(true);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Feed</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sources.map((src) => {
                const isSyncing = syncingSourceId === src.id;
                return (
                  <div
                    key={src.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              src.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                            }`}
                          />
                          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">{src.name}</h3>
                        </div>

                        <button
                          onClick={() => handleToggleSource(src.id)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition cursor-pointer hover:opacity-80 ${
                            src.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                          }`}
                          title="Click to toggle active/paused"
                        >
                          {src.isActive ? 'Active' : 'Paused'}
                        </button>
                      </div>

                      <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80 mb-4 font-mono text-xs text-zinc-600 dark:text-zinc-400 break-all flex items-center justify-between gap-2">
                        <span className="truncate">{src.url}</span>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-orange-500 shrink-0"
                          title="Open original feed"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                          <span className="text-zinc-400 block mb-0.5">Category</span>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {src.category?.nameGu || src.category?.name || 'Unassigned'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                          <span className="text-zinc-400 block mb-0.5">Polling Rate</span>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            Every {src.pollingInterval} mins
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 col-span-2 sm:col-span-1">
                          <span className="text-zinc-400 block mb-0.5">Imported</span>
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {src.itemCount || src._count?.items || 0} stories
                          </span>
                        </div>
                      </div>

                      {/* Error State if any */}
                      {src.lastError && (
                        <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs mb-4 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{src.lastError}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                      <span>
                        Last synced:{' '}
                        {src.lastSuccessAt
                          ? new Date(src.lastSuccessAt).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : 'Never'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSyncSource(src.id)}
                          disabled={isSyncing}
                          className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition flex items-center gap-1 font-medium disabled:opacity-50"
                          title="Fetch and sync feed now"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-orange-500' : ''}`} />
                          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingSource(src);
                            setSourceForm({
                              name: src.name,
                              url: src.url,
                              categoryId: src.categoryId || '',
                              pollingInterval: src.pollingInterval,
                              isActive: src.isActive,
                            });
                            setShowSourceModal(true);
                          }}
                          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition"
                          title="Edit source"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteSource(src.id, src.name)}
                          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:border-red-900 transition text-zinc-400"
                          title="Delete source"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IMPORT QUEUE & MODERATION */}
      {activeTab === 'items' && (
        <div className="space-y-6">
          {/* Queue Filters */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {['PENDING', 'APPROVED', 'PUBLISHED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition shrink-0 ${
                    statusFilter === st
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Sources</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 md:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setCurrentPage(1);
                      fetchItems();
                    }
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Items Table / Cards */}
          {loadingItems ? (
            <div className="py-20 text-center text-zinc-400 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-orange-500" />
              <p>Loading queue items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-sm">
              <FileText className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
              <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Queue is empty</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                No imported articles match current status filter ({statusFilter}).
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {item.imageUrl ? (
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-100 dark:bg-zinc-800/40">
                        <Image
                          src={item.imageUrl}
                          alt={item.title || 'RSS item image'}
                          fill
                          unoptimized
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0 bg-zinc-50 dark:bg-zinc-800/40">
                        <Rss className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                          {item.source?.name || 'External'}
                        </span>
                        {item.categoryName && (
                          <span className="text-[11px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                            {item.categoryName}
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-400">
                          {item.pubDate
                            ? new Date(item.pubDate).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : 'Unknown date'}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{item.excerpt}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-100 dark:border-zinc-800">
                    {item.status === 'PENDING' && (
                      <button
                        onClick={() => handleApproveItem(item.id)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition flex items-center gap-1 shadow-sm"
                        title="Approve story"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    <button
                      onClick={() => openItemModal(item)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review & Publish</span>
                    </button>

                    {item.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleRejectItem(item.id)}
                        className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-zinc-400 transition"
                        title="Reject story"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition"
                        title="View original article"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                  <span className="text-zinc-500">
                    Showing page {currentPage} of {totalPages} ({totalItems} stories)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SYNC LOGS & HEALTH */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">RSS Sync Logs & Diagnostics</h3>
              <p className="text-xs text-zinc-500">History of background polling, HTTP 304 caching, and error logs.</p>
            </div>
            <button
              onClick={fetchLogs}
              disabled={loadingLogs}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin text-orange-500' : ''}`} />
              <span>Refresh Logs</span>
            </button>
          </div>

          {loadingLogs ? (
            <div className="py-20 text-center text-zinc-400 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-orange-500" />
              <p>Loading sync logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
              <Activity className="w-10 h-10 mx-auto mb-3 text-zinc-400" />
              <p className="font-medium">No sync logs recorded yet</p>
              <p className="text-xs mt-1">Logs are automatically created when RSS feeds are polled or manually synced.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Found</th>
                      <th className="px-4 py-3">Imported</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Details / Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {logs.map((log) => {
                      const isSuccess = log.status === 'SUCCESS';
                      const is304 = log.status === 'SKIPPED_NOT_MODIFIED';
                      return (
                        <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="px-4 py-3 whitespace-nowrap text-zinc-500 font-mono">
                            {new Date(log.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'medium',
                            })}
                          </td>
                          <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                            {log.source?.name || 'Unknown source'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${
                                isSuccess
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : is304
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 font-semibold">{log.itemsFound}</td>
                          <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">{log.itemsImported}</td>
                          <td className="px-4 py-3 text-zinc-500">{log.durationMs ? `${log.durationMs}ms` : '—'}</td>
                          <td className="px-4 py-3 text-zinc-500 max-w-xs truncate" title={log.errorMessage || ''}>
                            {log.errorMessage ? (
                              <span className="text-red-500 font-medium">{log.errorMessage}</span>
                            ) : is304 ? (
                              <span className="text-zinc-400">ETag / Last-Modified match</span>
                            ) : (
                              <span className="text-zinc-400">OK</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT SOURCE */}
      {showSourceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingSource ? 'Edit RSS Feed Source' : 'Register New RSS Feed Source'}
              </h3>
              <button onClick={() => setShowSourceModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSource} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Source Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gujarat Information Dept, PIB Gujarat"
                  value={sourceForm.name}
                  onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Feed XML URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/feed.xml or /rss"
                  value={sourceForm.url}
                  onChange={(e) => setSourceForm({ ...sourceForm, url: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Protected against SSRF. In development mode, localhost is supported for local feed testing.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Default Category
                  </label>
                  <select
                    value={sourceForm.categoryId}
                    onChange={(e) => setSourceForm({ ...sourceForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    <option value="">No default category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameGu || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Polling Interval (Mins)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={1440}
                    value={sourceForm.pollingInterval}
                    onChange={(e) =>
                      setSourceForm({ ...sourceForm, pollingInterval: parseInt(e.target.value, 10) || 60 })
                    }
                    className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={sourceForm.isActive}
                  onChange={(e) => setSourceForm({ ...sourceForm, isActive: e.target.checked })}
                  className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Enable automatic background polling for this source
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowSourceModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition shadow-sm"
                >
                  {editingSource ? 'Update Source' : 'Register Source'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TEST FEED VALIDATION */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-lg">Safe Feed URL Validator & Preview</h3>
              </div>
              <button onClick={() => setShowTestModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Enter external RSS/Atom XML URL..."
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <button
                  onClick={handleTestFeed}
                  disabled={testingFeed || !testUrl.trim()}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 transition flex items-center gap-2 shadow-sm shrink-0"
                >
                  {testingFeed ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>Validate Feed</span>
                </button>
              </div>

              {testError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-start gap-2">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">Validation Blocked</span>
                    <span>{testError}</span>
                  </div>
                </div>
              )}

              {testResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold block text-sm">{testResult.title}</span>
                      <span className="opacity-80">{testResult.description || 'No description provided'}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 font-bold shrink-0">
                      {testResult.itemCount} items found
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Extracted Sample Entries
                  </h4>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {testResult.previewItems.map((pi: PreviewItem, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs flex items-start gap-3"
                      >
                        {pi.imageUrl && (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 bg-zinc-100 dark:bg-zinc-800">
                            <Image
                              src={pi.imageUrl}
                              alt={pi.title || 'Feed preview'}
                              fill
                              unoptimized
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h5 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">{pi.title}</h5>
                          <p className="text-zinc-500 line-clamp-1">{pi.excerpt}</p>
                          <span className="text-[10px] text-zinc-400 mt-1 block">
                            {pi.pubDate ? new Date(pi.pubDate).toLocaleString() : 'No date'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end shrink-0">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW & PUBLISH ITEM */}
      {showItemModal && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-lg">Review & Publish Article</h3>
              </div>
              <button onClick={() => setShowItemModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Article Title (Gujarati / English) *
                </label>
                <input
                  type="text"
                  value={publishForm.title}
                  onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Target Category *
                  </label>
                  <select
                    value={publishForm.categoryId}
                    onChange={(e) => setPublishForm({ ...publishForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameGu || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    value={publishForm.imageUrl}
                    onChange={(e) => setPublishForm({ ...publishForm, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {publishForm.imageUrl && (
                <div className="relative w-full h-36 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/40">
                  <Image
                    src={publishForm.imageUrl}
                    alt="Article image preview"
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Excerpt / Summary
                </label>
                <textarea
                  rows={2}
                  value={publishForm.excerpt}
                  onChange={(e) => setPublishForm({ ...publishForm, excerpt: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Article Body
                </label>
                <textarea
                  rows={6}
                  value={publishForm.content}
                  onChange={(e) => setPublishForm({ ...publishForm, content: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none font-sans"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishForm.isFeatured}
                    onChange={(e) => setPublishForm({ ...publishForm, isFeatured: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>Hero / Featured</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishForm.isTrending}
                    onChange={(e) => setPublishForm({ ...publishForm, isTrending: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>Trending</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishForm.isBreaking}
                    onChange={(e) => setPublishForm({ ...publishForm, isBreaking: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>Breaking Ticker</span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleRejectItem(selectedItem.id)}
                className="px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
              >
                Reject Story
              </button>

              <div className="flex items-center gap-2">
                {selectedItem?.status === 'PENDING' && (
                  <button
                    onClick={() => handleApproveItem(selectedItem.id)}
                    className="px-3.5 py-2 text-xs font-semibold text-emerald-600 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Story</span>
                  </button>
                )}
                <button
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishItem}
                  disabled={publishing || !publishForm.title.trim()}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {publishing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Publish to GujaratPost</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
