'use client';



import { useState, useEffect, useMemo } from 'react';
import {
  Rss,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  ShieldCheck,
  Check,
  Copy,
  Layers,
  FileText,
  Activity,
  Globe,
  Radio,
} from 'lucide-react';
import { getBackendApiUrl, authFetch } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  nameGu: string;
  slug: string;
  isActive?: boolean;
  color?: string | null;
  _count?: {
    posts: number;
    videos?: number;
  };
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

function getLegacyFeedPath(slug: string): string {
  const s = (slug || '').trim().toLowerCase();
  if (s === 'photos' || s === 'gallery') return '/rss-feed-gallery.php';
  const map: Record<string, string> = {
    home: 'news',
    news: 'news',
    'other-cities': 'others',
    others: 'others',
    world: 'international',
    international: 'international',
    trending: 'popular-stories',
    'popular-stories': 'popular-stories',
    entertainment: 'entertainment-life-style',
    'entertainment-life-style': 'entertainment-life-style',
    videos: 'video',
    video: 'video',
    instagram: 'instagram',
    reels: 'instagram',
    health: 'health',
    technology: 'technology',
    tech: 'technology',
    crime: 'crime',
    politics: 'politics',
    gujarat: 'gujarat',
    gandhinagar: 'gandhinagar',
    ahmedabad: 'ahmedabad',
    surat: 'surat',
    vadodara: 'vadodara',
    rajkot: 'rajkot',
    national: 'national',
    'fact-check': 'fact-check',
  };
  const nameParam = map[s] || s;
  return `/rss-feed-politics.php?name=${encodeURIComponent(nameParam)}`;
}

function getErrorMessage(err: unknown, defaultMsg: string): string {
  if (err instanceof Error) return err.message;
  return defaultMsg;
}

export default function AdminRssPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [copiedCategorySlug, setCopiedCategorySlug] = useState<string | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [cleanOriginUrl, setCleanOriginUrl] = useState('http://localhost:3000');
  const [alertBanner, setAlertBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Test Feed Modal State
  const [testUrl, setTestUrl] = useState('');
  const [testingFeed, setTestingFeed] = useState(false);
  const [testResult, setTestResult] = useState<FeedPreviewResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlertBanner({ type, message });
    setTimeout(() => setAlertBanner(null), 5000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setCleanOriginUrl(window.location.origin);
    }
  }, []);

  // Load Categories on mount
  useEffect(() => {
    let ignore = false;
    async function loadCategories() {
      setLoadingCategories(true);
      try {
        let loadedCats: Category[] = [];

        // 1. Try admin categories first
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

        // 2. Fallback to public categories endpoint
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
      } finally {
        if (!ignore) setLoadingCategories(false);
      }
    }

    loadCategories();
    return () => {
      ignore = true;
    };
  }, []);

  const copyCategoryUrl = async (url: string, key: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedCategorySlug(key);
      showAlert('success', `RSS URL કૉપિ થઈ ગઈ: ${url}`);
      setTimeout(() => setCopiedCategorySlug(null), 2500);
    } catch {
      window.prompt('Copy feed URL:', url);
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

  const filteredCategories = useMemo(() => {
    const q = categorySearchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (cat) =>
        (cat.name && cat.name.toLowerCase().includes(q)) ||
        (cat.nameGu && cat.nameGu.toLowerCase().includes(q)) ||
        (cat.slug && cat.slug.toLowerCase().includes(q))
    );
  }, [categories, categorySearchQuery]);

  const activeCategoriesCount = useMemo(
    () => categories.filter((c) => c.isActive !== false).length,
    [categories]
  );

  const totalArticlesCount = useMemo(
    () => categories.reduce((sum, c) => sum + (c._count?.posts || 0), 0),
    [categories]
  );

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
          <button onClick={() => setAlertBanner(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Rss className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                ગુજરાત પોસ્ટ RSS ફીડ્સ મેનેજમેન્ટ
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                વેબસાઇટની દરેક કેટેગરી અને તમામ સમાચારોના સત્તાવાર RSS 2.0 XML એન્ડપોઇન્ટ્સ.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTestUrl(`${cleanOriginUrl}/rss.xml`);
              setTestResult(null);
              setTestError(null);
              setShowTestModal(true);
            }}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Test Feed XML</span>
          </button>

          <a
            href="/rss"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Public /rss</span>
          </a>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-orange-500" />
            <span>Total Categories</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {categories.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Auto-generated feeds</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            <span>Active Feeds</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {activeCategoriesCount}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Live RSS 2.0 endpoints</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Syndicated Articles</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            {totalArticlesCount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Across all categories</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-purple-500" />
            <span>Feed Protocol</span>
          </div>
          <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
            RSS 2.0 + MRSS
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">UTF-8 Gujarati Unicode</div>
        </div>
      </div>

      {/* Main All-Stories Feed Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-rose-600 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Rss className="w-4 h-4 text-white" />
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              મુખ્ય ફીડ (All Published Stories)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            સંપૂર્ણ ગુજરાત પોસ્ટ RSS ફીડ (All Stories)
          </h2>
          <p className="text-white/80 text-xs sm:text-sm mt-1">
            નવા RSS 2.0 XML અને ડેઇલીહન્ટ જૂના PHP ફોર્મેટ બંને ઉપલબ્ધ છે.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          {/* New Modern URL Copy */}
          <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/20">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white text-orange-700">
              New
            </span>
            <button
              onClick={() => copyCategoryUrl(`${cleanOriginUrl}/rss.xml`, '__all_new__')}
              className="px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20 rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="Copy New RSS URL"
            >
              {copiedCategorySlug === '__all_new__' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>કૉપિ થઈ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy New (/rss.xml)</span>
                </>
              )}
            </button>
            <a
              href="/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg hover:bg-white/20 text-white transition flex items-center justify-center cursor-pointer"
              title="Open XML"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Dailyhunt Old PHP URL Copy */}
          <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/20">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500 text-white">
              Dailyhunt
            </span>
            <button
              onClick={() => copyCategoryUrl(`${cleanOriginUrl}/rss-feed-politics.php?name=news`, '__all_old__')}
              className="px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20 rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="Copy Dailyhunt Old PHP URL"
            >
              {copiedCategorySlug === '__all_old__' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>કૉપિ થઈ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Dailyhunt PHP</span>
                </>
              )}
            </button>
            <a
              href="/rss-feed-politics.php?name=news"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg hover:bg-white/20 text-white transition flex items-center justify-center cursor-pointer"
              title="Open Dailyhunt PHP XML"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Category Feeds Table Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                દરેક કેટેગરીના RSS ફીડ્સ ({categories.length})
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              દરેક કેટેગરીનું RSS ફીડ આપોઆપ જનરેટ થાય છે. નવી કેટેગરી બનાવતાં તરત જ અહીં ઉપલબ્ધ થઈ જશે.
            </p>
          </div>

          {/* Live Filter Input */}
          <div className="w-full sm:w-72">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search category or slug..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
              />
              {categorySearchQuery && (
                <button
                  onClick={() => setCategorySearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Table */}
        {loadingCategories ? (
          <div className="py-16 text-center text-zinc-400">
            <p>Loading category feeds...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <p>"{categorySearchQuery}" માટે કોઈ કેટેગરી મળી નથી.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px]">
                  <th className="pb-3 px-3 font-semibold">Category Name</th>
                  <th className="pb-3 px-3 font-semibold">Slug</th>
                  <th className="pb-3 px-3 font-semibold">Articles</th>
                  <th className="pb-3 px-3 font-semibold">Status</th>
                  <th className="pb-3 px-3 font-semibold">Feed URLs (New & Dailyhunt)</th>
                  <th className="pb-3 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filteredCategories.map((cat) => {
                  const newPath = `/rss/${cat.slug}.xml`;
                  const newFeedUrl = `${cleanOriginUrl}${newPath}`;
                  const legacyPath = getLegacyFeedPath(cat.slug);
                  const legacyUrl = `${cleanOriginUrl}${legacyPath}`;
                  const isCopiedNew = copiedCategorySlug === `new-${cat.slug}`;
                  const isCopiedOld = copiedCategorySlug === `old-${cat.slug}`;
                  const isActive = cat.isActive !== false;

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                          {cat.nameGu || cat.name}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {cat.name}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          {cat.slug}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {cat._count?.posts ?? '—'}
                        </span>
                        <span className="text-[10px] text-zinc-400 ml-1">posts</span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-zinc-400'
                            }`}
                          />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="space-y-1.5 min-w-[280px]">
                          {/* New URL Row */}
                          <div className="flex items-center justify-between gap-1.5 bg-orange-50/50 dark:bg-orange-950/20 px-2 py-1 rounded-md border border-orange-200/50 dark:border-orange-900/40">
                            <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-orange-500 text-white leading-none">
                              New
                            </span>
                            <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300 truncate flex-1" title={newFeedUrl}>
                              {newPath}
                            </span>
                            <button
                              onClick={() => copyCategoryUrl(newFeedUrl, `new-${cat.slug}`)}
                              className="px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:text-orange-600 rounded flex items-center gap-1 cursor-pointer"
                              title="Copy New URL"
                            >
                              {isCopiedNew ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{isCopiedNew ? 'Done' : 'Copy'}</span>
                            </button>
                            <a
                              href={newPath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-0.5 text-zinc-400 hover:text-orange-600"
                              title="Open New XML"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          {/* Dailyhunt Old PHP URL Row */}
                          <div className="flex items-center justify-between gap-1.5 bg-blue-50/50 dark:bg-blue-950/20 px-2 py-1 rounded-md border border-blue-200/50 dark:border-blue-900/40">
                            <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-blue-600 text-white leading-none">
                              Dailyhunt
                            </span>
                            <span className="font-mono text-[11px] text-blue-900 dark:text-blue-300 truncate flex-1" title={legacyUrl}>
                              {legacyPath}
                            </span>
                            <button
                              onClick={() => copyCategoryUrl(legacyUrl, `old-${cat.slug}`)}
                              className="px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-zinc-900 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded flex items-center gap-1 cursor-pointer"
                              title="Copy Dailyhunt URL"
                            >
                              {isCopiedOld ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{isCopiedOld ? 'Done' : 'Copy'}</span>
                            </button>
                            <a
                              href={legacyPath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-0.5 text-blue-500 hover:text-blue-700"
                              title="Open Dailyhunt Feed"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setTestUrl(legacyUrl);
                            setTestResult(null);
                            setTestError(null);
                            setShowTestModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-emerald-600 transition inline-flex items-center gap-1 cursor-pointer"
                          title="Validate feed"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Validate</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FEED TESTER MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-lg">Test & Validate RSS Feed</h3>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Check XML formatting, channel headers, and item structure without making database changes.
            </p>

            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Enter RSS Feed URL (e.g. http://localhost:3000/rss/gujarat.xml)"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 font-mono"
              />
              <button
                onClick={handleTestFeed}
                disabled={testingFeed || !testUrl.trim()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
              >
                {testingFeed ? 'Checking...' : 'Validate'}
              </button>
            </div>

            {testError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs">
                {testError}
              </div>
            )}

            {testResult && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs flex items-center justify-between">
                  <span className="font-bold">✅ Feed is valid and active</span>
                  <span className="font-mono">{testResult.itemCount} items parsed</span>
                </div>

                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-800/40 text-xs space-y-1">
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {testResult.title}
                  </div>
                  <div className="text-zinc-500">{testResult.description}</div>
                </div>

                {testResult.previewItems.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-bold text-xs uppercase tracking-wider text-zinc-400">
                      Recent Stories in Feed
                    </h5>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                      {testResult.previewItems.map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-white dark:bg-zinc-900 text-xs">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-orange-500 block truncate"
                          >
                            {item.title}
                          </a>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {item.pubDate ? new Date(item.pubDate).toLocaleString('en-IN') : 'No pubDate'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
