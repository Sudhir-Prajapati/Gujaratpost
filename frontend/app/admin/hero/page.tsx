'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, RefreshCw, Eye, CheckCircle2, XCircle,
  LayoutTemplate, ArrowUpRight, Trash2, Save,
  Calendar, User, Tag, X, ImageIcon, GripVertical, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getBackendApiUrl, authFetch, getPublicArticles, clearApiCache, getHeroSettings, updateHeroSettings } from '@/lib/api';
import ArticleMedia from '@/components/ui/ArticleMedia';


/* ─── Types ──────────────────────────────────────────────────────────── */
type CatObj = { id: string; name: string; slug?: string };
type AuthorObj = { id: string; name: string; authorName?: string };

type Article = {
  id: string;
  articleNumber?: number;
  titleGu?: string;
  title?: string;
  titleEn?: string;
  slug: string;
  image?: string;
  featuredImage?: string;
  category?: string | CatObj;
  author?: string | AuthorObj;
  isFeatured: boolean;
  isTrending: boolean;
  status?: string;
  publishedAt?: string;
  createdAt?: string;
};

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
];

function getArticleImage(article?: Article | null): string {
  if (!article) return DEMO_IMAGES[0];
  const rawImage = (article as any).featuredImage || article.image || (article as any).thumbnail;
  if (rawImage && typeof rawImage === 'string' && rawImage.trim() !== '') {
    return rawImage.trim();
  }
  let hash = 0;
  const key = article.id || article.slug || article.titleGu || article.title || '';
  for (let i = 0; i < key.length; i++) { hash = (hash << 5) - hash + key.charCodeAt(i); hash |= 0; }
  return DEMO_IMAGES[Math.abs(hash) % DEMO_IMAGES.length];
}
function catName(c?: string | CatObj) { return !c ? '' : typeof c === 'string' ? c : (c.name ?? ''); }
function authorName(a?: string | AuthorObj) { return !a ? '' : typeof a === 'string' ? a : (a.authorName ?? a.name ?? ''); }
function fmtDate(d?: string) { return !d ? '' : new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
function getTitle(a?: Article | null) { return !a ? '' : (a.titleGu ?? a.title ?? a.titleEn ?? 'Untitled'); }

/* ─── Inline Search Dropdown ─────────────────────────────────────────── */
function ArticleSearchBox({
  placeholder = 'Search articles...',
  onSelect,
  excluded = [],
  allArticles,
  maxLimit,
}: {
  placeholder?: string;
  onSelect: (a: Article) => void;
  excluded?: string[];
  allArticles: Article[];
  maxLimit?: number;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sourcePool = maxLimit && maxLimit > 0 ? allArticles.slice(0, maxLimit) : allArticles;
  const available = sourcePool.filter((a) => !excluded.includes(a.id));
  const results = q.trim()
    ? available.filter((a) => {
        const low = q.toLowerCase().replace(/^#/, '').trim();
        const numMatch = a.articleNumber ? String(a.articleNumber).includes(low) : false;
        return (
          (a.titleGu ?? a.title ?? '').toLowerCase().includes(low) ||
          catName(a.category).toLowerCase().includes(low) ||
          numMatch
        );
      }).slice(0, 100)
    : available.slice(0, 100);

  return (
    <div ref={ref} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-9 pr-4 py-2.5 text-[12px] font-medium text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-[#B3121B]/60 focus:ring-2 focus:ring-[#B3121B]/15 focus:bg-white dark:focus:bg-zinc-900 transition-all"
        />
        {q && (
          <button
            onClick={() => { setQ(''); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center hover:bg-zinc-300 transition"
          >
            <X className="h-2.5 w-2.5 text-zinc-500" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[0_12px_40px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 z-20">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300">
              {q.trim() ? `${results.length} search results` : `Select from Latest ${available.length} Published Articles`}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[10px] font-bold text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition flex items-center gap-1 cursor-pointer"
            >
              Close ✕
            </button>
          </div>
          {/* Scrollable list container */}
          <div className="overflow-y-auto max-h-60 divide-y divide-zinc-100 dark:divide-zinc-800">
            {results.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => { onSelect(a); setQ(''); setOpen(false); }}
                className="group flex items-center gap-3 w-full px-3.5 py-2.5 text-left hover:bg-[#B3121B]/5 active:bg-[#B3121B]/10 transition-colors"
              >
                <div className="relative h-9 w-14 shrink-0 rounded-lg overflow-hidden bg-zinc-100 shadow-sm">
                  <ArticleMedia src={getArticleImage(a)} alt="" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-100 line-clamp-1 group-hover:text-[#B3121B] transition-colors">{getTitle(a)}</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">
                    {a.articleNumber ? `#${a.articleNumber} • ` : ''}
                    {catName(a.category)} {(a.publishedAt ?? a.createdAt) && `• ${fmtDate(a.publishedAt ?? a.createdAt)}`}
                  </p>
                </div>
                <div className="shrink-0 h-5 w-5 rounded-full border border-zinc-200 dark:border-zinc-700 group-hover:border-[#B3121B] group-hover:bg-[#B3121B] flex items-center justify-center transition-all">
                  <svg className="h-2.5 w-2.5 text-transparent group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Visual Slot Card ────────────────────────────────────────────────── */
function SlotCard({
  slotNum,
  article,
  onSelect,
  onRemove,
  allArticles,
  excluded,
}: {
  slotNum: number;
  article: Article | null;
  onSelect: (a: Article) => void;
  onRemove: () => void;
  allArticles: Article[];
  excluded: string[];
}) {
  const [showSearch, setShowSearch] = useState(false);
  const slotLabels = ['Left Card', 'Centre Card', 'Right Card'];

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
      {/* Slot Badge */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#B3121B] text-white text-[11px] font-black">
            {slotNum}
          </span>
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{slotLabels[slotNum - 1]}</span>
        </div>
        {article && (
          <button
            onClick={onRemove}
            className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-red-500 transition"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        )}
      </div>

      {/* Image Preview — overflow-hidden applied HERE so rounded corners clip the image only */}
      <div className="relative w-full aspect-[16/10] bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {article ? (
          <ArticleMedia
            src={getArticleImage(article)}
            alt={getTitle(article)}
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-300 dark:text-zinc-600">
            <ImageIcon className="h-8 w-8" />
            <span className="text-[11px] font-semibold">No article selected</span>
          </div>
        )}
        {/* Overlay gradient when article exists */}
        {article && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        )}
        {/* Category & Article Number badges */}
        {article && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-[#B3121B] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
              {catName(article.category) || 'News'}
            </span>
            {article.articleNumber && (
              <span className="inline-flex items-center rounded-full bg-black/75 backdrop-blur-sm border border-white/20 px-2 py-0.5 text-[9px] font-black text-white">
                #{article.articleNumber}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Article Info */}
      <div className="px-4 py-3 flex-1 flex flex-col gap-2">
        {article ? (
          <>
            <p className="text-[12px] font-black text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-snug">
              {getTitle(article)}
            </p>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] text-zinc-400">
              {article.articleNumber && (
                <span className="inline-flex items-center font-black text-[#B3121B] bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded text-[9px]">
                  #{article.articleNumber}
                </span>
              )}
              {authorName(article.author) && (
                <span className="flex items-center gap-1"><User className="h-2.5 w-2.5" />{authorName(article.author)}</span>
              )}
              {(article.publishedAt ?? article.createdAt) && (
                <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{fmtDate(article.publishedAt ?? article.createdAt)}</span>
              )}
              {catName(article.category) && (
                <span className="flex items-center gap-1"><Tag className="h-2.5 w-2.5" />{catName(article.category)}</span>
              )}
            </div>
          </>
        ) : (
          <p className="text-[11px] text-zinc-400 italic">Click below to choose an article for this slot</p>
        )}

        {/* Change / Select button */}
        <button
          onClick={() => setShowSearch((v) => !v)}
          className={`mt-auto flex items-center justify-center gap-2 w-full rounded-xl text-[11px] font-bold py-2.5 transition-all ${
            showSearch
              ? 'bg-[#B3121B] text-white shadow-md shadow-[#B3121B]/20'
              : article
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[#B3121B]/10 hover:text-[#B3121B]'
              : 'bg-[#B3121B] text-white hover:bg-[#8E0E15] shadow-sm shadow-[#B3121B]/30'
          }`}
        >
          {showSearch ? (
            <><X className="h-3.5 w-3.5" /> Close Search</>
          ) : (
            <><RefreshCw className="h-3.5 w-3.5" /> {article ? 'Change Article' : 'Select Article'}</>
          )}
        </button>

        {/* Inline search panel */}
        {showSearch && (
          <div className="mt-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 p-2.5">
            <ArticleSearchBox
              allArticles={allArticles}
              excluded={excluded}
              placeholder="Type to search articles..."
              onSelect={(a) => { onSelect(a); setShowSearch(false); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────── */
export default function HeroManagerPage() {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const DEFAULT_TOPICS = ['ચૂંટણી 2026', 'વરસાદ', 'સોના-ચાંદી', 'ક્રિકેટ', 'મેટ્રો', 'સેમિકન્ડક્ટર', 'ડાયમંડ ઉદ્યોગ', 'ટ્રાફિક'];

  // 3 bottom image slots, trending topics & trending news slider articles
  const [slots, setSlots] = useState<(Article | null)[]>([null, null, null]);
  const [trendingTopics, setTrendingTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [trendingNewsArticles, setTrendingNewsArticles] = useState<Article[]>([]);
  const [savingTrendingNews, setSavingTrendingNews] = useState(false);
  const [popularNewsArticles, setPopularNewsArticles] = useState<Article[]>([]);
  const [savingPopularNews, setSavingPopularNews] = useState(false);
  const [draggedPopularIndex, setDraggedPopularIndex] = useState<number | null>(null);

  const [mostReadArticles, setMostReadArticles] = useState<Article[]>([]);
  const [savingMostRead, setSavingMostRead] = useState(false);

  const [heroGridArticles, setHeroGridArticles] = useState<Article[]>([]);
  const [savingHeroGrid, setSavingHeroGrid] = useState(false);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const triggerOnDemandRevalidate = () => {
    clearApiCache();
    fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/' }),
    }).catch(() => {});
  };

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      clearApiCache();
      const [pubRes, heroRes] = await Promise.all([
        getPublicArticles({ limit: 300 }),
        getHeroSettings(),
      ]);

      const arts = (pubRes.articles || []) as unknown as Article[];
      setAllArticles(arts);

      const featured = arts.filter((a) => a.isFeatured);
      const serverGrid = Array.isArray((heroRes as any)?.heroGridArticles) ? (heroRes as any).heroGridArticles : [];
      const combinedGrid = [...featured, ...serverGrid, ...arts].filter((a, idx, arr) => a && arr.findIndex((x) => x?.id === a.id) === idx);
      setHeroGridArticles(combinedGrid.slice(0, 16));

      const defaultSlots = [
        featured[0] || arts[0] || null,
        featured[1] || arts[1] || null,
        featured[2] || arts[2] || null,
      ];

      if (heroRes && Array.isArray(heroRes.slots) && heroRes.slots.length > 0) {
        setSlots([
          heroRes.slots[0] ? (heroRes.slots[0] as unknown as Article) : defaultSlots[0],
          heroRes.slots[1] ? (heroRes.slots[1] as unknown as Article) : defaultSlots[1],
          heroRes.slots[2] ? (heroRes.slots[2] as unknown as Article) : defaultSlots[2],
        ]);
      } else {
        setSlots(defaultSlots);
      }

      if (heroRes && (heroRes as any).trendingTopics && Array.isArray((heroRes as any).trendingTopics)) {
        setTrendingTopics((heroRes as any).trendingTopics);
      } else if (heroRes && heroRes.setting?.trendingTopics && Array.isArray(heroRes.setting.trendingTopics)) {
        setTrendingTopics(heroRes.setting.trendingTopics);
      }

      const trending = arts.filter((a) => a.isTrending);
      const serverTrending = Array.isArray((heroRes as any)?.trendingNewsArticles) ? (heroRes as any).trendingNewsArticles : [];
      const combinedTrending = [...trending, ...serverTrending].filter((a, idx, arr) => a && arr.findIndex((x) => x?.id === a.id) === idx);
      setTrendingNewsArticles(combinedTrending.slice(0, 10));

      if (heroRes && Array.isArray((heroRes as any).popularNewsArticles) && (heroRes as any).popularNewsArticles.length > 0) {
        setPopularNewsArticles((heroRes as any).popularNewsArticles as unknown as Article[]);
      } else {
        setPopularNewsArticles(arts.slice(0, 12));
      }

      if (heroRes && Array.isArray((heroRes as any).mostReadArticles) && (heroRes as any).mostReadArticles.length > 0) {
        setMostReadArticles((heroRes as any).mostReadArticles as unknown as Article[]);
      } else {
        setMostReadArticles(arts.slice(0, 5));
      }
    } catch {
      showToast('Failed to load hero section articles', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  const usedIds = slots.filter(Boolean).map((a) => a!.id);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        slot1Id: slots[0]?.id || null,
        slot2Id: slots[1]?.id || null,
        slot3Id: slots[2]?.id || null,
        trendingTopics: trendingTopics,
        trendingNewsIds: trendingNewsArticles.map((a) => a.id),
        popularNewsIds: popularNewsArticles.map((a) => a.id),
        heroGridIds: heroGridArticles.map((a) => a.id),
      };

      const res = await updateHeroSettings(payload);

      if (res && res.success) {
        triggerOnDemandRevalidate();
        showToast('✅ Saved! Hero section cards & trending topics updated successfully.', true);
        if (res.data?.slots) {
          setSlots([
            res.data.slots[0] ? (res.data.slots[0] as unknown as Article) : null,
            res.data.slots[1] ? (res.data.slots[1] as unknown as Article) : null,
            res.data.slots[2] ? (res.data.slots[2] as unknown as Article) : null,
          ]);
        }
        if (res.data?.trendingTopics && Array.isArray(res.data.trendingTopics)) {
          setTrendingTopics(res.data.trendingTopics);
        }
      } else {
        showToast('Some updates failed. Please try again.', false);
      }
    } catch {
      showToast('Save failed. Please try again.', false);
    } finally {
      setSaving(false);
    }
  };

  const [savingTopics, setSavingTopics] = useState(false);

  const handleAddTopic = () => {
    const val = newTopicInput.trim().replace(/^#/, '');
    if (!val) return;
    if (trendingTopics.length >= 8) {
      showToast('⚠️ Limit reached (8 topics max). Please remove one topic first before adding a new one.', false);
      return;
    }
    if (trendingTopics.includes(val)) {
      showToast('Topic already exists in list', false);
      return;
    }
    setTrendingTopics((prev) => [...prev, val]);
    setNewTopicInput('');
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setTrendingTopics((prev) => prev.filter((t) => t !== topicToRemove));
  };

  const handleResetTopics = () => {
    setTrendingTopics(DEFAULT_TOPICS);
    showToast('Reset to default topics', true);
  };

  const handleSaveTrendingTopics = async () => {
    setSavingTopics(true);
    try {
      const payload = {
        slot1Id: slots[0]?.id || null,
        slot2Id: slots[1]?.id || null,
        slot3Id: slots[2]?.id || null,
        trendingTopics: trendingTopics,
        trendingNewsIds: trendingNewsArticles.map((a) => a.id),
      };

      const res = await updateHeroSettings(payload);

      if (res && res.success) {
        triggerOnDemandRevalidate();
        showToast('✅ Saved! Trending topics updated live on user side.', true);
        if (res.data?.trendingTopics && Array.isArray(res.data.trendingTopics)) {
          setTrendingTopics(res.data.trendingTopics);
        }
      } else {
        showToast('Failed to save trending topics. Please try again.', false);
      }
    } catch {
      showToast('Save failed. Please try again.', false);
    } finally {
      setSavingTopics(false);
    }
  };

  const handleAddTrendingNewsArticle = (art: Article) => {
    if (trendingNewsArticles.some((a) => a.id === art.id)) {
      showToast('Article already in Trending News list', false);
      return;
    }
    if (trendingNewsArticles.length >= 10) {
      showToast('⚠️ Limit reached (10 articles max for Trending News). Please remove one first.', false);
      return;
    }
    setTrendingNewsArticles((prev) => [...prev, art]);
  };

  const handleRemoveTrendingNewsArticle = (id: string) => {
    setTrendingNewsArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setTrendingNewsArticles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
    setDraggedIndex(targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveTrendingArticle = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= trendingNewsArticles.length) return;
    setTrendingNewsArticles((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = temp;
      return updated;
    });
  };

  const handleSaveTrendingNews = async () => {
    setSavingTrendingNews(true);
    try {
      const payload = {
        slot1Id: slots[0]?.id || null,
        slot2Id: slots[1]?.id || null,
        slot3Id: slots[2]?.id || null,
        trendingTopics: trendingTopics,
        trendingNewsIds: trendingNewsArticles.map((a) => a.id),
        popularNewsIds: popularNewsArticles.map((a) => a.id),
      };

      const res = await updateHeroSettings(payload);

      if (res && res.success) {
        triggerOnDemandRevalidate();
        showToast('✅ Saved! Trending News slider articles updated live on user side.', true);
        if (res.data?.trendingNewsArticles && Array.isArray(res.data.trendingNewsArticles)) {
          setTrendingNewsArticles(res.data.trendingNewsArticles as unknown as Article[]);
        }
      } else {
        showToast('Failed to save Trending News articles. Please try again.', false);
      }
    } catch {
      showToast('Save failed. Please try again.', false);
    } finally {
      setSavingTrendingNews(false);
    }
  };

  const handleAddPopularNewsArticle = (art: Article) => {
    if (popularNewsArticles.some((a) => a.id === art.id)) {
      showToast('Article already in Popular News list', false);
      return;
    }
    if (popularNewsArticles.length >= 12) {
      showToast('⚠️ Limit reached (12 articles max for Popular News). Please remove one first.', false);
      return;
    }
    setPopularNewsArticles((prev) => [...prev, art]);
  };

  const handleRemovePopularNewsArticle = (id: string) => {
    setPopularNewsArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDragStartPopular = (e: React.DragEvent, index: number) => {
    setDraggedPopularIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverPopular = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedPopularIndex === null || draggedPopularIndex === targetIndex) return;

    setPopularNewsArticles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedPopularIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
    setDraggedPopularIndex(targetIndex);
  };

  const handleDragEndPopular = () => {
    setDraggedPopularIndex(null);
  };

  const movePopularArticle = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= popularNewsArticles.length) return;
    setPopularNewsArticles((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = temp;
      return updated;
    });
  };

  const handleSavePopularNews = async () => {
    setSavingPopularNews(true);
    try {
      const payload = {
        slot1Id: slots[0]?.id || null,
        slot2Id: slots[1]?.id || null,
        slot3Id: slots[2]?.id || null,
        trendingTopics: trendingTopics,
        trendingNewsIds: trendingNewsArticles.map((a) => a.id),
        popularNewsIds: popularNewsArticles.map((a) => a.id),
      };

      const res = await updateHeroSettings(payload);

      if (res && res.success) {
        triggerOnDemandRevalidate();
        showToast('✅ Saved! Popular News slider articles updated live on user side.', true);
        if (res.data?.popularNewsArticles && Array.isArray(res.data.popularNewsArticles)) {
          setPopularNewsArticles(res.data.popularNewsArticles as unknown as Article[]);
        }
      } else {
        showToast('Failed to save Popular News articles. Please try again.', false);
      }
    } catch {
      showToast('Save failed. Please try again.', false);
    } finally {
      setSavingPopularNews(false);
    }
  };

  const handleAddMostReadArticle = (art: Article) => {
    if (mostReadArticles.some((a) => a.id === art.id)) {
      showToast('Article already in Most Read list', false);
      return;
    }
    if (mostReadArticles.length >= 5) {
      showToast('⚠️ Limit reached (5 articles max for Most Read). Please remove one first.', false);
      return;
    }
    setMostReadArticles((prev) => [...prev, art]);
  };

  const handleRemoveMostReadArticle = (id: string) => {
    setMostReadArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const [draggedMostReadIndex, setDraggedMostReadIndex] = useState<number | null>(null);

  const handleDragStartMostRead = (e: React.DragEvent, index: number) => {
    setDraggedMostReadIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {}
  };

  const handleDragOverMostRead = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedMostReadIndex === null || draggedMostReadIndex === targetIndex) return;

    setMostReadArticles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedMostReadIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
    setDraggedMostReadIndex(targetIndex);
  };

  const handleDragEndMostRead = () => {
    setDraggedMostReadIndex(null);
  };

  const moveMostReadArticle = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= mostReadArticles.length) return;
    setMostReadArticles((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = temp;
      return updated;
    });
  };

  const handleSaveMostRead = async () => {
    setSavingMostRead(true);
    try {
      const payload = {
        slot1Id: slots[0]?.id || null,
        slot2Id: slots[1]?.id || null,
        slot3Id: slots[2]?.id || null,
        trendingTopics: trendingTopics,
        trendingNewsIds: trendingNewsArticles.map((a) => a.id),
        popularNewsIds: popularNewsArticles.map((a) => a.id),
        mostReadIds: mostReadArticles.map((a) => a.id),
        heroGridIds: JSON.stringify(heroGridArticles.map((a) => a.id)),
      };

      const res = await updateHeroSettings(payload);

      if (res && res.success) {
        triggerOnDemandRevalidate();
        showToast('✅ Saved! Most Read (સૌથી વધુ વંચાયેલા) articles updated live on user side.', true);
        if (res.data?.mostReadArticles && Array.isArray(res.data.mostReadArticles)) {
          setMostReadArticles(res.data.mostReadArticles as unknown as Article[]);
        }
      } else {
        showToast('Failed to save Most Read articles. Please try again.', false);
      }
    } catch {
      showToast('Save failed. Please try again.', false);
    } finally {
      setSavingMostRead(false);
    }
  };

  const [draggedHeroIndex, setDraggedHeroIndex] = useState<number | null>(null);

  const handleHeroDragStart = (e: React.DragEvent, index: number) => {
    setDraggedHeroIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(index));
    } catch {}
  };

  const handleHeroDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedHeroIndex === null || draggedHeroIndex === targetIndex) return;

    setHeroGridArticles((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedHeroIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
    setDraggedHeroIndex(targetIndex);
  };

  const handleHeroDragEnd = () => {
    setDraggedHeroIndex(null);
  };

  const moveHeroGridArticle = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= heroGridArticles.length) return;
    setHeroGridArticles((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = temp;
      return updated;
    });
  };

  const handleRemoveHeroGridArticle = (id: string) => {
    setHeroGridArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddHeroGridArticle = (art: Article) => {
    if (heroGridArticles.some((a) => a.id === art.id)) {
      showToast('Article is already in Hero Grid list', false);
      return;
    }
    setHeroGridArticles((prev) => [...prev, art]);
  };

  const handleSaveHeroGrid = async () => {
    setSavingHeroGrid(true);
    try {
      const payload = {
        slot1Id: slots[0]?.id || null,
        slot2Id: slots[1]?.id || null,
        slot3Id: slots[2]?.id || null,
        trendingTopics: trendingTopics,
        trendingNewsIds: trendingNewsArticles.map((a) => a.id),
        popularNewsIds: popularNewsArticles.map((a) => a.id),
        heroGridIds: heroGridArticles.map((a) => a.id),
      };

      const res = await updateHeroSettings(payload);

      if (res && res.success) {
        triggerOnDemandRevalidate();
        showToast('✅ Saved! Top Main Hero Grid positions updated live on user side.', true);
        if (res.data?.heroGridArticles && Array.isArray(res.data.heroGridArticles)) {
          setHeroGridArticles(res.data.heroGridArticles as unknown as Article[]);
        }
      } else {
        showToast('Failed to save Hero Grid positions. Please try again.', false);
      }
    } catch {
      showToast('Save failed. Please try again.', false);
    } finally {
      setSavingHeroGrid(false);
    }
  };

  const [savingBottomSlots, setSavingBottomSlots] = useState(false);

  const handleSaveBottomSlots = async () => {
    setSavingBottomSlots(true);
    try {
      const payload = {
        slot1Id: slots[0]?.id || null,
        slot2Id: slots[1]?.id || null,
        slot3Id: slots[2]?.id || null,
        trendingTopics: trendingTopics,
        trendingNewsIds: trendingNewsArticles.map((a) => a.id),
        popularNewsIds: popularNewsArticles.map((a) => a.id),
        heroGridIds: heroGridArticles.map((a) => a.id),
      };

      const res = await updateHeroSettings(payload);

      if (res && res.success) {
        triggerOnDemandRevalidate();
        showToast('✅ Saved! Bottom Row 3 Image Cards updated live on user side.', true);
        if (res.data?.slots) {
          setSlots([
            res.data.slots[0] ? (res.data.slots[0] as unknown as Article) : null,
            res.data.slots[1] ? (res.data.slots[1] as unknown as Article) : null,
            res.data.slots[2] ? (res.data.slots[2] as unknown as Article) : null,
          ]);
        }
      } else {
        showToast('Failed to save Bottom Cards. Please try again.', false);
      }
    } catch {
      showToast('Save failed. Please try again.', false);
    } finally {
      setSavingBottomSlots(false);
    }
  };

  const setSlot = (idx: number, art: Article) => {
    setSlots((prev) => { const next = [...prev]; next[idx] = art; return next; });
  };
  const removeSlot = (idx: number) => {
    setSlots((prev) => { const next = [...prev]; next[idx] = null; return next; });
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6 text-[#B3121B]" />
            Hero Section Manager
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage all hero sections, main grid positions, bottom image slots, and news sliders for the homepage.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-3 sm:mt-0 shrink-0">
          <Link href="/" target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 transition">
            <Eye className="h-4 w-4" /> Preview Homepage <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3.5 sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Total Articles</p>
          <p className="mt-1 text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">{allArticles.length}</p>
          <p className="text-xs text-zinc-400 mt-0.5">Published news</p>
        </div>
        <div className="rounded-xl border border-[#B3121B]/25 bg-red-50 dark:bg-red-950/20 p-3.5 sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#B3121B]">Slots Filled</p>
          <p className="mt-1 text-2xl sm:text-3xl font-black text-[#B3121B]">{usedIds.length} / 3</p>
          <p className="text-xs text-[#B3121B]/60 mt-0.5">Bottom row image cards</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3.5 sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Available</p>
          <p className="mt-1 text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">{allArticles.length - usedIds.length}</p>
          <p className="text-xs text-zinc-400 mt-0.5">Remaining articles</p>
        </div>
      </div>

      {/* 3-Column Slot Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-32 text-zinc-400">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Loading articles...
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════════════════════════
             MAIN HERO GRID (13 POSITIONS MANAGEMENT)
             ════════════════════════════════════════════════════════════════ */}
          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <span className="text-xl">🏆</span>
                  <h3 className="text-base font-black text-zinc-900 dark:text-white">
                    Top Main Hero Grid (13 Article Positions)
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-red-50 text-[#B3121B] border-red-200 dark:bg-red-950/40 dark:border-red-800 shrink-0">
                    {heroGridArticles.length} / 13 Positions
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  Manage the exact positions of articles displayed in the top homepage Hero Grid: 
                  <strong> Position #1 = Spotlight Banner</strong>, 
                  <strong> Positions #2 & #3 = Top Middle Image Cards</strong>, 
                  <strong> Positions #4 to #13 = Middle Headline List</strong>.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveHeroGrid}
                  disabled={savingHeroGrid}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#B3121B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/20 disabled:opacity-50 cursor-pointer"
                >
                  {savingHeroGrid ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {savingHeroGrid ? 'Saving Hero Grid...' : 'Save Hero Grid Positions'}
                </button>
              </div>
            </div>

            {/* Quick Article Search to Add Position */}
            <div className="mb-6 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3 border border-zinc-200 dark:border-zinc-700">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                ➕ Add Article to Hero Grid Positions
              </p>
              <ArticleSearchBox
                allArticles={allArticles}
                excluded={heroGridArticles.map((a) => a.id)}
                maxLimit={100}
                placeholder="Search latest 100 articles by title or #articleNumber to add to Hero Grid..."
                onSelect={(art) => handleAddHeroGridArticle(art)}
              />
            </div>

            {/* Grid List of Positions */}
            <div className="space-y-3">
              {heroGridArticles.map((art, index) => {
                const isSpotlight = index === 0;
                const isTopCard = index === 1 || index === 2;
                const slotTitle = isSpotlight
                  ? '🌟 Main Hero Spotlight Banner (#1 Big Card)'
                  : isTopCard
                  ? `🖼️ Middle Column - Top Image Card #${index}`
                  : `📰 Middle Column - Text Headline #${index - 2}`;

                const isDragging = draggedHeroIndex === index;

                return (
                  <div
                    key={art.id}
                    draggable
                    onDragStart={(e) => handleHeroDragStart(e, index)}
                    onDragOver={(e) => handleHeroDragOver(e, index)}
                    onDragEnd={handleHeroDragEnd}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                      isDragging ? 'opacity-40 scale-[0.98] border-dashed border-[#B3121B]' : ''
                    } ${
                      isSpotlight
                        ? 'border-[#B3121B]/40 bg-red-50/40 dark:bg-red-950/10'
                        : isTopCard
                        ? 'border-blue-200 bg-blue-50/20 dark:border-blue-900/40 dark:bg-blue-950/10'
                        : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/80'
                    } hover:shadow-md`}
                  >
                    {/* Left Info */}
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1 w-full">
                      <div className="flex items-center gap-1.5 shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 mt-0.5 sm:mt-0" title="Drag to reorder position">
                        <GripVertical className="h-4 sm:h-5 w-4 sm:w-5" />
                        <span className={`h-6 sm:h-7 w-6 sm:w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black text-white ${
                          isSpotlight ? 'bg-[#B3121B]' : isTopCard ? 'bg-blue-600' : 'bg-zinc-700'
                        }`}>
                          #{index + 1}
                        </span>
                      </div>

                      <div className="relative h-11 w-15 sm:h-12 sm:w-16 shrink-0 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200/60 dark:border-zinc-800 shadow-2xs">
                        <ArticleMedia src={getArticleImage(art)} alt="" className="object-cover" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isSpotlight ? 'bg-red-100 text-[#B3121B]' : isTopCard ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {slotTitle}
                          </span>
                          {art.articleNumber && (
                            <span className="text-[9px] sm:text-[10px] font-bold text-[#B3121B] bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                              #{art.articleNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 line-clamp-2 sm:line-clamp-1 leading-snug mt-1">
                          {getTitle(art)}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                          {catName(art.category)} • {authorName(art.author)} {(art.publishedAt || art.createdAt) && `• ${fmtDate(art.publishedAt || art.createdAt)}`}
                        </p>
                      </div>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-0 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/80 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => moveHeroGridArticle(index, -1)}
                        disabled={index === 0}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Move Up 1 Position"
                      >
                        ⬆️ Move Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveHeroGridArticle(index, 1)}
                        disabled={index === heroGridArticles.length - 1}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Move Down 1 Position"
                      >
                        ⬇️ Move Down
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveHeroGridArticle(art.id)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold text-red-600 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Remove from Hero Grid"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* ════════════════════════════════════════════════════════════════
             BOTTOM ROW 3 IMAGE CARDS MANAGEMENT
             ════════════════════════════════════════════════════════════════ */}
          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <span className="text-xl">📌</span>
                  <h3 className="text-base font-black text-zinc-900 dark:text-white">
                    Bottom Row 3 Image Cards (હરોળના 3 ઈમેજ કાર્ડ્સ)
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 shrink-0">
                    {usedIds.length} / 3 Cards Selected
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  Pick the 3 image cards displayed in the bottom row of the homepage hero section.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveBottomSlots}
                disabled={savingBottomSlots}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#B3121B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/20 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {savingBottomSlots ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {savingBottomSlots ? 'Saving Bottom Cards...' : 'Save Bottom 3 Cards'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {[0, 1, 2].map((idx) => (
                <SlotCard
                  key={idx}
                  slotNum={idx + 1}
                  article={slots[idx]}
                  onSelect={(a) => setSlot(idx, a)}
                  onRemove={() => removeSlot(idx)}
                  allArticles={allArticles}
                  excluded={usedIds.filter((id) => id !== slots[idx]?.id)}
                />
              ))}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
             POPULAR NEWS 12 POSITIONS MANAGEMENT (લોકપ્રિય સમાચાર)
             ════════════════════════════════════════════════════════════════ */}
          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <span className="text-xl">🔥</span>
                  <h3 className="text-base font-black text-zinc-900 dark:text-white">
                    Popular News Slider (લોકપ્રિય સમાચાર)
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 shrink-0">
                    {popularNewsArticles.length} / 12 Positions
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  Manage the 12 articles displayed in the "લોકપ્રિય સમાચાર" (Popular News) slider on the homepage. Use Move Up / Move Down or Drag & Drop to change exact rank #1 to #12.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSavePopularNews}
                disabled={savingPopularNews}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#B3121B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/20 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {savingPopularNews ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {savingPopularNews ? 'Saving Popular News...' : 'Save Popular News 12 Positions'}
              </button>
            </div>

            {/* Quick Article Search to Add Position */}
            <div className="mb-6 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3 border border-zinc-200 dark:border-zinc-700">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                ➕ Add Article to Popular News Slider (લોકપ્રિય સમાચાર)
              </p>
              <ArticleSearchBox
                allArticles={allArticles}
                excluded={popularNewsArticles.map((a) => a.id)}
                maxLimit={100}
                placeholder={popularNewsArticles.length >= 12 ? '[ Limit 12 reached — remove an article to add new ]' : 'Search latest 100 articles by title or #articleNumber to add to Popular News...'}
                onSelect={(art) => handleAddPopularNewsArticle(art)}
              />
            </div>

            {/* List of Popular News Positions */}
            <div className="space-y-3">
              {popularNewsArticles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-xs text-zinc-400">
                  No articles assigned. Default published articles will be displayed automatically.
                </div>
              ) : (
                popularNewsArticles.map((art, idx) => {
                  const isDragging = draggedPopularIndex === idx;
                  return (
                    <div
                      key={art.id}
                      draggable
                      onDragStart={(e) => handleDragStartPopular(e, idx)}
                      onDragOver={(e) => handleDragOverPopular(e, idx)}
                      onDragEnd={handleDragEndPopular}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-3.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/80 transition-all hover:border-[#B3121B]/40 cursor-grab active:cursor-grabbing select-none ${
                        isDragging ? 'opacity-40 scale-[0.98] border-dashed border-[#B3121B]' : ''
                      } hover:shadow-md`}
                    >
                      {/* Left Info */}
                      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1 w-full">
                        <div className="flex items-center gap-1.5 shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 mt-0.5 sm:mt-0" title="Drag to reorder rank">
                          <GripVertical className="h-4 sm:h-5 w-4 sm:w-5" />
                          <span className="h-6 sm:h-7 w-6 sm:w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black text-white bg-[#B3121B]">
                            #{idx + 1}
                          </span>
                        </div>

                        <div className="relative h-11 w-15 sm:h-12 sm:w-16 shrink-0 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200/60 dark:border-zinc-800 shadow-2xs">
                          <ArticleMedia src={getArticleImage(art)} alt="" className="object-cover" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                              Popular Rank #{idx + 1}
                            </span>
                            {art.articleNumber && (
                              <span className="text-[9px] sm:text-[10px] font-bold text-[#B3121B] bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                                #{art.articleNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 line-clamp-2 sm:line-clamp-1 leading-snug mt-1">
                            {getTitle(art)}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                            {catName(art.category)} • {authorName(art.author)} {(art.publishedAt || art.createdAt) && `• ${fmtDate(art.publishedAt || art.createdAt)}`}
                          </p>
                        </div>
                      </div>

                      {/* Right Controls */}
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-0 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/80 pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => movePopularArticle(idx, -1)}
                          disabled={idx === 0}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                          title="Move Up 1 Position"
                        >
                          ⬆️ Move Up
                        </button>
                        <button
                          type="button"
                          onClick={() => movePopularArticle(idx, 1)}
                          disabled={idx === popularNewsArticles.length - 1}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                          title="Move Down 1 Position"
                        >
                          ⬇️ Move Down
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePopularNewsArticle(art.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold text-red-600 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          title="Remove from Popular News"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
             MOST READ 5 POSITIONS MANAGEMENT (સૌથી વધુ વંચાયેલા)
             ════════════════════════════════════════════════════════════════ */}
          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <span className="text-xl">🔥</span>
                  <h3 className="text-base font-black text-zinc-900 dark:text-white">
                    Most Read 5 Positions (સૌથી વધુ વંચાયેલા)
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 shrink-0">
                    {mostReadArticles.length} / 5 Positions
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  Manage the 5 articles displayed in the "સૌથી વધુ વંચાયેલા" (Most Read) sidebar widget on the homepage. Move up / down to reorder rank #1 to #5.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveMostRead}
                disabled={savingMostRead}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#B3121B] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/20 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {savingMostRead ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {savingMostRead ? 'Saving Most Read...' : 'Save Most Read 5 Positions'}
              </button>
            </div>

            {/* Quick Article Search to Add Position */}
            <div className="mb-6 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3 border border-zinc-200 dark:border-zinc-700">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                ➕ Add Article to Most Read 5 Positions (સૌથી વધુ વંચાયેલા)
              </p>
              <ArticleSearchBox
                allArticles={allArticles}
                excluded={mostReadArticles.map((a) => a.id)}
                maxLimit={100}
                placeholder={mostReadArticles.length >= 5 ? '[ Limit 5 reached — remove an article to add new ]' : 'Search latest 100 articles by title or #articleNumber to add to Most Read...'}
                onSelect={(art) => handleAddMostReadArticle(art)}
              />
            </div>

            {/* List of 5 Most Read Positions */}
            <div className="space-y-3">
              {mostReadArticles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-xs text-zinc-400">
                  No articles assigned. Default published articles will be displayed automatically.
                </div>
              ) : (
                mostReadArticles.map((art, idx) => {
                  const isDragging = draggedMostReadIndex === idx;
                  return (
                    <div
                      key={art.id}
                      draggable
                      onDragStart={(e) => handleDragStartMostRead(e, idx)}
                      onDragOver={(e) => handleDragOverMostRead(e, idx)}
                      onDragEnd={handleDragEndMostRead}
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-3.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/80 transition-all hover:border-[#B3121B]/40 cursor-grab active:cursor-grabbing select-none ${
                        isDragging ? 'opacity-40 scale-[0.98] border-dashed border-[#B3121B]' : ''
                      } hover:shadow-md`}
                    >
                      {/* Left Info */}
                      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1 w-full">
                        <div className="flex items-center gap-1.5 shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 mt-0.5 sm:mt-0" title="Drag to reorder rank">
                          <GripVertical className="h-4 sm:h-5 w-4 sm:w-5" />
                          <span className="h-6 sm:h-7 w-6 sm:w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black text-white bg-[#B3121B]">
                            #{idx + 1}
                          </span>
                        </div>

                        <div className="relative h-11 w-15 sm:h-12 sm:w-16 shrink-0 rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200/60 dark:border-zinc-800 shadow-2xs">
                          <ArticleMedia src={getArticleImage(art)} alt="" className="object-cover" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                              Most Read Rank #{idx + 1}
                            </span>
                            {art.articleNumber && (
                              <span className="text-[9px] sm:text-[10px] font-bold text-[#B3121B] bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                                #{art.articleNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 line-clamp-2 sm:line-clamp-1 leading-snug mt-1">
                            {getTitle(art)}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                            {catName(art.category)} • {authorName(art.author)} {(art.publishedAt || art.createdAt) && `• ${fmtDate(art.publishedAt || art.createdAt)}`}
                          </p>
                        </div>
                      </div>

                      {/* Right Controls */}
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-2.5 sm:mt-0 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/80 pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => moveMostReadArticle(idx, -1)}
                          disabled={idx === 0}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                          title="Move Up 1 Position"
                        >
                          ⬆️ Move Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveMostReadArticle(idx, 1)}
                          disabled={idx === mostReadArticles.length - 1}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                          title="Move Down 1 Position"
                        >
                          ⬇️ Move Down
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMostReadArticle(art.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] sm:text-xs font-bold text-red-600 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          title="Remove from Most Read"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800 mb-4 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <h3 className="text-base font-black text-zinc-900 dark:text-white">Trending Topics (Trending વિષયો)</h3>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${trendingTopics.length >= 8 ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700' : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'} shrink-0`}>
                      {trendingTopics.length} / 8 Max
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">Maximum 8 trending topic pills allowed. If you want to add a new topic, remove an existing topic first.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetTopics}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer self-start sm:self-auto"
              >
                Reset Defaults
              </button>
            </div>

            {/* List of current topic pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {trendingTopics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3.5 py-1.5 text-xs font-extrabold text-zinc-800 border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 shadow-xs"
                >
                  <span className="text-[#B3121B] font-black">#</span> {topic}
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(topic)}
                    className="ml-1 text-zinc-400 hover:text-red-500 focus:outline-none cursor-pointer"
                    title="Remove topic"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add new topic tag input & Dedicated Save Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 w-full sm:max-w-lg flex-1">
                <input
                  type="text"
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTopic(); } }}
                  placeholder={trendingTopics.length >= 8 ? '[ Limit 8 reached — remove a topic to add new ]' : '[ Enter new topic, e.g. વડોદરા ]'}
                  disabled={trendingTopics.length >= 8}
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-extrabold text-zinc-900 focus:border-[#B3121B] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddTopic}
                  disabled={trendingTopics.length >= 8}
                  className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                >
                  + Add Topic
                </button>
              </div>

              {/* Dedicated Save Trending Topics Button */}
              <button
                type="button"
                onClick={handleSaveTrendingTopics}
                disabled={savingTopics}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] hover:bg-[#B3121B]/90 px-5 py-2.5 text-xs font-black text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingTopics ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Trending Topics</span>
              </button>
            </div>
          </div>

          {/* Managing Trending News Section (ટ્રેન્ડિંગ ન્યૂઝ Slider) */}
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-3.5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800 mb-5 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <h3 className="text-base font-black text-zinc-900 dark:text-white">Trending News Slider (ટ્રેન્ડિંગ ન્યૂઝ)</h3>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${trendingNewsArticles.length >= 10 ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700' : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'} shrink-0`}>
                      {trendingNewsArticles.length} / 10 Max
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">Select up to 10 articles to feature in the horizontal Trending News (ટ્રેન્ડિંગ ન્યૂઝ) slider on the homepage.</p>
                </div>
              </div>

              {/* Dedicated Save Trending News Button */}
              <button
                type="button"
                onClick={handleSaveTrendingNews}
                disabled={savingTrendingNews}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] hover:bg-[#B3121B]/90 px-5 py-2.5 text-xs font-black text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {savingTrendingNews ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Trending News</span>
              </button>
            </div>

            {/* Article Search Box for Trending News */}
            <div className="mb-5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                + Add Article to Trending News Slider
              </label>
              <ArticleSearchBox
                placeholder={trendingNewsArticles.length >= 10 ? '[ Limit 10 reached — remove an article to add new ]' : 'Search published articles by title, article #, or category to add to Trending News...'}
                onSelect={(art) => handleAddTrendingNewsArticle(art)}
                excluded={trendingNewsArticles.map((a) => a.id)}
                allArticles={allArticles}
              />
            </div>

            {/* Current Selected Trending News Articles Grid */}
            {trendingNewsArticles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center text-xs text-zinc-400">
                No articles assigned. Default top trending articles will be displayed automatically.
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex-wrap gap-1">
                  <span className="flex items-center gap-1.5">
                    <GripVertical className="h-3.5 w-3.5 text-[#B3121B]" />
                    <span><strong>Drag & Drop</strong> cards to change order, or use <strong>&lt; / &gt; arrows</strong> below cards.</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">Order 1 to {trendingNewsArticles.length}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
                  {trendingNewsArticles.map((art, idx) => (
                    <div
                      key={art.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-2.5 transition-all duration-150 cursor-grab active:cursor-grabbing group ${
                        draggedIndex === idx
                          ? 'border-[#B3121B] bg-[#B3121B]/10 shadow-xl scale-105 z-20 ring-2 ring-[#B3121B]/40'
                          : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-800/40 hover:border-[#B3121B]/50 hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Thumbnail, Rank Badge & Drag Handle */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-zinc-100 mb-2">
                          <ArticleMedia src={getArticleImage(art)} alt="" className="object-cover pointer-events-none" />

                          {/* Rank Badge */}
                          <span className="absolute top-1.5 left-1.5 flex h-5 sm:h-6 w-5 sm:w-6 items-center justify-center rounded-full bg-[#B3121B] text-white text-[10px] sm:text-[11px] font-black shadow-md z-10 select-none">
                            {idx + 1}
                          </span>

                          {/* Drag Handle Icon Indicator */}
                          <div className="absolute top-1.5 left-7 sm:left-8 flex h-5 sm:h-6 w-5 sm:w-6 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-xs opacity-70 group-hover:opacity-100 transition z-10" title="Click & Drag to reorder">
                            <GripVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveTrendingNewsArticle(art.id); }}
                            className="absolute top-1.5 right-1.5 flex h-5 sm:h-6 w-5 sm:w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600 transition cursor-pointer z-10"
                            title="Remove from Trending News"
                          >
                            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug select-none">
                          {getTitle(art)}
                        </p>
                      </div>

                      {/* Bottom Footer with Article Info & Left/Right Reorder Arrows */}
                      <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-zinc-400 pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="truncate max-w-[50px] sm:max-w-[60px]">{art.articleNumber ? `#${art.articleNumber}` : catName(art.category)}</span>

                        {/* Reorder Buttons (Move Left & Right) */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveTrendingArticle(idx, -1); }}
                            disabled={idx === 0}
                            className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-[#B3121B] hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-200 disabled:hover:text-zinc-700 transition cursor-pointer"
                            title="Move left/up"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveTrendingArticle(idx, 1); }}
                            disabled={idx === trendingNewsArticles.length - 1}
                            className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-[#B3121B] hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-200 disabled:hover:text-zinc-700 transition cursor-pointer"
                            title="Move right/down"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Info note */}
          <div className="mt-6 rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20 px-4 py-3 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <span className="mt-0.5 shrink-0 inline-flex h-4 w-4 items-center justify-center rounded-full border border-blue-400 text-[10px] font-black">i</span>
            <span><strong>Note:</strong> Top Main Hero Grid, Bottom row image cards, Most Read 5 Positions, Trending Topics, and Trending News slider articles can all be saved independently using their dedicated <strong>Save</strong> buttons.</span>
          </div>
        </>
      )}
    </div>
  );
}
