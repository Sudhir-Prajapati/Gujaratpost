'use client';



import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, RefreshCw, Eye, EyeOff, AlertTriangle, CheckCircle2, XCircle,
  LayoutTemplate, ArrowUpRight, Trash2, Save,
  Calendar, User, Tag, X, ImageIcon, GripVertical, ChevronLeft, ChevronRight,
  Layers, MoveHorizontal, ArrowUp, ArrowDown, Clock, Sparkles, Check,
  Plus, PenLine, Pencil, FileText, Link as LinkIcon,
  Upload, UploadCloud, Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getBackendApiUrl, authFetch, getPublicArticles, clearApiCache, clearApiCacheAndBroadcast, getHeroSettings, updateHeroSettings } from '@/lib/api';
import ArticleMedia from '@/components/ui/ArticleMedia';
import BreakingNewsShowcase, { type BreakingSlide } from '@/components/sections/BreakingNewsShowcase';


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
  isBreaking?: boolean;
  status?: string;
  views?: number;
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
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-400 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-10 pr-10 py-3 text-base font-semibold text-zinc-800 dark:text-zinc-200 placeholder:text-base placeholder:text-zinc-400 focus:outline-none focus:border-[#B3121B]/60 focus:ring-2 focus:ring-[#B3121B]/15 focus:bg-white dark:focus:bg-zinc-900 transition-all shadow-xs"
        />
        {q && (
          <button
            onClick={() => { setQ(''); setOpen(false); }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center hover:bg-zinc-300 transition cursor-pointer"
          >
            <X className="h-3 w-3 text-zinc-500" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-2xl border border-gray-400 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[0_12px_40px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border-b border-gray-400 dark:border-zinc-700 z-20">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
              {q.trim() ? `${results.length} search results` : `Select from Latest ${available.length} Published Articles`}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition flex items-center gap-1 cursor-pointer"
            >
              Close ✕
            </button>
          </div>
          {/* Scrollable list container */}
          <div className="overflow-y-auto max-h-64 divide-y divide-gray-400 dark:divide-zinc-800">
            {results.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => { onSelect(a); setQ(''); setOpen(false); }}
                className="group flex items-center gap-3.5 w-full px-4 py-3 text-left hover:bg-[#B3121B]/5 active:bg-[#B3121B]/10 transition-colors cursor-pointer"
              >
                <div className="relative h-11 w-16 shrink-0 rounded-lg overflow-hidden bg-zinc-100 shadow-sm border border-gray-400 dark:border-zinc-700">
                  <ArticleMedia src={getArticleImage(a)} alt="" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-[#B3121B] transition-colors">{getTitle(a)}</p>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                    {a.articleNumber ? `#${a.articleNumber} • ` : ''}
                    {catName(a.category)} {(a.publishedAt ?? a.createdAt) && `• ${fmtDate(a.publishedAt ?? a.createdAt)}`}
                  </p>
                </div>
                <div className="shrink-0 h-6 w-6 rounded-full border border-gray-400 dark:border-zinc-700 group-hover:border-[#B3121B] group-hover:bg-[#B3121B] flex items-center justify-center transition-all">
                  <svg className="h-3 w-3 text-transparent group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
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
    <div className="flex flex-col rounded-2xl border border-gray-400 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
      {/* Slot Badge */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-gray-400 dark:border-zinc-700">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#B3121B] text-white text-xs font-black">
            {slotNum}
          </span>
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{slotLabels[slotNum - 1]}</span>
        </div>
        {article && (
          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-red-500 transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" /> Remove
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
            <span className="text-xs font-semibold">No article selected</span>
          </div>
        )}
        {/* Overlay gradient when article exists */}
        {article && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        )}
        {/* Category & Article Number badges */}
        {article && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-[#B3121B] px-2.5 py-1 text-xs font-black uppercase tracking-wide text-white">
              {catName(article.category) || 'News'}
            </span>
            {article.articleNumber && (
              <span className="inline-flex items-center rounded-full bg-black/75 backdrop-blur-sm border border-white/20 px-2.5 py-1 text-xs font-black text-white">
                #{article.articleNumber}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Article Info */}
      <div className="px-4 py-3.5 flex-1 flex flex-col gap-2.5">
        {article ? (
          <>
            <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
              {getTitle(article)}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-semibold">
              {article.articleNumber && (
                <span className="inline-flex items-center font-black text-[#B3121B] bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded text-xs">
                  #{article.articleNumber}
                </span>
              )}
              {authorName(article.author) && (
                <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{authorName(article.author)}</span>
              )}
              {(article.publishedAt ?? article.createdAt) && (
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fmtDate(article.publishedAt ?? article.createdAt)}</span>
              )}
              {catName(article.category) && (
                <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" />{catName(article.category)}</span>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs sm:text-sm text-zinc-400 italic">Click below to choose an article for this slot</p>
        )}

        {/* Change / Select button */}
        <button
          onClick={() => setShowSearch((v) => !v)}
          className={`mt-auto flex items-center justify-center gap-2 w-full rounded-xl text-sm sm:text-base font-bold py-3 transition-all cursor-pointer ${showSearch
              ? 'bg-[#B3121B] text-white shadow-md shadow-[#B3121B]/20'
              : article
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[#B3121B]/10 hover:text-[#B3121B]'
                : 'bg-[#B3121B] text-white hover:bg-[#8E0E15] shadow-sm shadow-[#B3121B]/30'
            }`}
        >
          {showSearch ? (
            <><X className="h-4 w-4" /> Close Search</>
          ) : (
            <><RefreshCw className="h-4 w-4" /> {article ? 'Change Article' : 'Select Article'}</>
          )}
        </button>

        {/* Inline search panel */}
        {showSearch && (
          <div className="mt-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-gray-400 dark:border-zinc-700 p-2.5">
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

/* ─── Election Banner Helper Icons for Admin Preview ───────────────── */
function renderAdminPartyLogo(party: { name?: string; nameGu?: string; logoUrl?: string; id?: string }) {
  const nameLower = ((party.name || party.nameGu || '') + '').toLowerCase();
  const idLower = ((party.id || '') + '').toLowerCase();

  // 1. BJP Lotus Symbol - Orange Rounded Square
  if (nameLower.includes('bjp') || nameLower.includes('ભાજપ') || idLower.includes('bjp')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#FF7A00] to-[#E65100] flex items-center justify-center shadow-2xs p-1.5 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15 C45 30 38 48 38 65 C44 68 56 68 62 65 C62 48 55 30 50 15 Z" fill="#FF5500" stroke="#000" strokeWidth="2.5" />
          <path d="M35 30 C28 42 22 55 24 66 C30 68 36 67 40 64 C38 52 36 40 35 30 Z" fill="#FF6B00" stroke="#000" strokeWidth="2.5" />
          <path d="M65 30 C72 42 78 55 76 66 C70 68 64 67 60 64 C62 52 64 40 65 30 Z" fill="#FF6B00" stroke="#000" strokeWidth="2.5" />
          <path d="M22 45 C15 55 12 65 16 72 C22 73 28 71 31 66 C27 58 24 51 22 45 Z" fill="#FF7700" stroke="#000" strokeWidth="2.5" />
          <path d="M78 45 C85 55 88 65 84 72 C78 73 72 71 69 66 C73 58 76 51 78 45 Z" fill="#FF7700" stroke="#000" strokeWidth="2.5" />
          <path d="M22 74 C35 81 65 81 78 74 C72 70 28 70 22 74 Z" fill="#138808" stroke="#000" strokeWidth="2" />
          <path d="M48 76 L48 88 L52 88 L52 76 Z" fill="#000" />
        </svg>
      </div>
    );
  }

  // 2. Congress Hand Symbol - Blue Rounded Square
  if (nameLower.includes('cong') || nameLower.includes('કોંગ્રેસ') || nameLower.includes('inc') || idLower.includes('cong')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#0084FF] to-[#0055D4] flex items-center justify-center shadow-2xs p-1.5 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs" xmlns="http://www.w3.org/2000/svg">
          <path d="M48 8 C45 8 43 10 43 14 L43 42 C41 42 39 43 38 45 L38 20 C38 16 36 14 34 14 C32 14 30 16 30 20 L30 48 C28 48 27 50 26 51 L26 28 C26 24 24 22 22 22 C20 22 18 24 18 28 L18 60 C18 78 30 92 48 92 C66 92 76 78 76 60 L76 34 C76 30 74 28 72 28 C70 28 68 30 68 34 L68 48 C66 48 64 46 64 44 L64 14 C64 10 62 8 60 8 C58 8 56 10 56 14 L56 42 C54 42 51 42 49 42 L49 14 C49 10 47 8 48 8 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
          <rect x="25" y="53" width="44" height="6.5" fill="#FF9933" rx="1" />
          <rect x="23" y="62" width="48" height="6.5" fill="#FFFFFF" rx="1" />
          <rect x="25" y="71" width="44" height="6.5" fill="#138808" rx="1" />
        </svg>
      </div>
    );
  }

  // 3. AAP Broom & Text Symbol - Golden Yellow Rounded Square
  if (nameLower.includes('aap') || nameLower.includes('આપ') || idLower.includes('aap')) {
    return (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#FFBE00] to-[#E5A800] flex flex-col items-center justify-center shadow-2xs p-1 shrink-0 text-[#004B87]">
        <span className="text-[12px] font-black tracking-tight leading-none">aap</span>
        <div className="w-6 h-1.5 bg-[#004B87] rounded-xs mt-1"></div>
      </div>
    );
  }

  // 4. Other / Group Symbol - Slate Rounded Square
  return (
    <div className="w-10 h-10 rounded-xl bg-[#475569] flex items-center justify-center text-white shadow-2xs shrink-0">
      <Users className="w-5 h-5" />
    </div>
  );
}

function renderAdminGujaratMap() {
  return (
    <div className="w-9 h-9 flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 100 100"
        className="w-8 h-8 fill-[#DC2626] drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M48,15 C56,16 63,14 69,18 C75,23 83,24 87,30 C89,35 86,42 83,46 C80,51 77,59 78,66 C79,71 74,74 69,73 C62,72 57,67 52,69 C45,71 39,66 35,61 C30,56 25,55 21,48 C18,41 21,34 28,31 C34,28 39,20 44,15 Z M26,42 C29,45 34,47 39,45 C44,43 49,47 50,51 C46,54 39,56 33,52 C28,49 25,45 26,42 Z" />
      </svg>
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
  // 'auto' = latest articles from API automatically; 'manual' = admin picks specific articles
  const [bottomSlotsMode, setBottomSlotsMode] = useState<'auto' | 'manual'>('auto');
  const [trendingTopics, setTrendingTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [newTopicInput, setNewTopicInput] = useState('');
  const [trendingNewsArticles, setTrendingNewsArticles] = useState<Article[]>([]);
  const [savingTrendingNews, setSavingTrendingNews] = useState(false);
  const [popularNewsArticles, setPopularNewsArticles] = useState<Article[]>([]);
  const [savingPopularNews, setSavingPopularNews] = useState(false);
  const [draggedPopularIndex, setDraggedPopularIndex] = useState<number | null>(null);

  const [mostReadArticles, setMostReadArticles] = useState<Article[]>([]);

  // ─── ELECTION BANNER STATES ──────────────────────────────────────────
  const [electionBannerEnabled, setElectionBannerEnabled] = useState(false);
  const [electionBannerTitle, setElectionBannerTitle] = useState('ગુજરાત ચૂંટણી 2026');
  const [electionBannerLive, setElectionBannerLive] = useState(true);
  const [electionBannerMapUrl, setElectionBannerMapUrl] = useState('');
  const [electionBannerTotalSeats, setElectionBannerTotalSeats] = useState<number | string>(182);
  const [electionBannerMajority, setElectionBannerMajority] = useState<number | string>(92);
  const [electionBannerShowAllPages, setElectionBannerShowAllPages] = useState(false);
  const [electionParties, setElectionParties] = useState<any[]>([
    { id: 'bjp', name: 'BJP', nameGu: 'BJP', logoUrl: '', seats: 100, won: 82, leads: 18, trailing: 0, color: '#FF6B00' },
    { id: 'cong', name: 'Congress', nameGu: 'Congress', logoUrl: '', seats: 55, won: 38, leads: 17, trailing: 0, color: '#19AAED' },
    { id: 'aap', name: 'AAP', nameGu: 'AAP', logoUrl: '', seats: 15, won: 8, leads: 7, trailing: 0, color: '#0066CC' },
    { id: 'oth', name: 'અન્ય', nameGu: 'અન્ય', logoUrl: '', seats: 12, won: 6, leads: 6, trailing: 0, color: '#6B7280' },
  ]);
  const [savingElectionBanner, setSavingElectionBanner] = useState(false);
  const [uploadingPartyLogoIdx, setUploadingPartyLogoIdx] = useState<number | null>(null);
  const [uploadingMapIcon, setUploadingMapIcon] = useState(false);

  // ── TV BREAKING NEWS SHOWCASE BANNER STATES ──
  const [breakingBannerEnabled, setBreakingBannerEnabled] = useState(false);
  const [breakingBannerBadgeText, setBreakingBannerBadgeText] = useState('BREAKING NEWS');
  const [breakingBannerInterval, setBreakingBannerInterval] = useState<number>(4);
  const [breakingSlides, setBreakingSlides] = useState<BreakingSlide[]>([
    {
      id: 'slide-1',
      image: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?auto=format&fit=crop&w=1200&q=80',
      link: '',
      texts: [
        'વિશાખાપટ્ટનમની ઓઇલ રિફાઇનરીમાં ભીષણ વિસ્ફોટ',
        'વિસ્ફોટ બાદ આકાશમાં ધુમાડાના ગોટેગોટા છવાયા, ફાયર બ્રિગેડની ૧૦ ગાડીઓ પહોંચી',
        'તમામ કર્મચારીઓને તાત્કાલિક સુરક્ષિત સ્થળે ખસેડાયા, કોઈ જાનહાનિના અહેવાલ નથી',
      ],
    },
    {
      id: 'slide-2',
      image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
      link: '',
      texts: [
        'ગુજરાતમાં આગામી ૪૮ કલાક ભારેથી અતિભારે વરસાદની હવામાન વિભાગની આગાહી',
        'દક્ષિણ ગુજરાત અને સૌરાષ્ટ્રના દરિયાકાંઠાના વિસ્તારોમાં યલો એલર્ટ જાહેર કરાયું',
      ],
    },
  ]);
  const [savingBreakingBanner, setSavingBreakingBanner] = useState(false);
  const [uploadingSlideImgIdx, setUploadingSlideImgIdx] = useState<number | null>(null);
  const [mostReadMode, setMostReadMode] = useState<'auto' | 'manual'>('auto');
  const [autoMostReadArticles, setAutoMostReadArticles] = useState<Article[]>([]);
  const [savingMostRead, setSavingMostRead] = useState(false);

  const [heroGridArticles, setHeroGridArticles] = useState<Article[]>([]);
  const [heroGridMode, setHeroGridMode] = useState<'auto' | 'manual'>('auto');
  const [savingHeroGrid, setSavingHeroGrid] = useState(false);

  // Custom headline & link item type
  interface CustomHeadlineItem {
    id: string;
    heading: string;
    link: string;
  }

  // Breaking News ticker badge label, mode, speed and custom articles / custom headlines
  const [tickerBadgeText, setTickerBadgeText] = useState('બ્રેકિંગ ન્યૂઝ');
  const [tickerMode, setTickerMode] = useState<'scroll' | 'single'>('scroll');
  const [tickerSpeed, setTickerSpeed] = useState<number>(4500);
  const [tickerHidden, setTickerHidden] = useState<boolean>(false);
  const [showTickerSettingsWhileHidden, setShowTickerSettingsWhileHidden] = useState(false);
  const [tickerSourceType, setTickerSourceType] = useState<'articles' | 'custom'>('articles');
  const [selectedTickerArticles, setSelectedTickerArticles] = useState<Article[]>([]);
  const [customTickerHeadlines, setCustomTickerHeadlines] = useState<CustomHeadlineItem[]>([]);
  const [newCustomHeading, setNewCustomHeading] = useState('');
  const [newCustomLink, setNewCustomLink] = useState('');
  const [editingHeadlineId, setEditingHeadlineId] = useState<string | null>(null);
  const [editingHeadingText, setEditingHeadingText] = useState('');
  const [editingLinkText, setEditingLinkText] = useState('');
  const [savingTickerBadge, setSavingTickerBadge] = useState(false);
  const [previewTickerIndex, setPreviewTickerIndex] = useState(0);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const triggerOnDemandRevalidate = () => {
    // Clear cache + broadcast to ALL open tabs (user homepage will re-fetch instantly)
    clearApiCacheAndBroadcast();
    fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/' }),
    }).catch(() => { });
  };

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      clearApiCache();
      const [pubRes, heroRes] = await Promise.all([
        getPublicArticles({ limit: 300 }),
        getHeroSettings(true),
      ]);

      const arts = (pubRes.articles || []) as unknown as Article[];
      setAllArticles(arts);

      // Parse and populate ticker badge label, mode, speed, and custom articles
      if (heroRes) {
        const rawLabel = (heroRes as any)?.tickerLabel || heroRes?.setting?.tickerLabel;
        if (rawLabel) {
          try {
            const parsed = typeof rawLabel === 'string' && rawLabel.trim().startsWith('{') ? JSON.parse(rawLabel) : rawLabel;
            if (typeof parsed === 'object' && parsed !== null) {
              setTickerBadgeText(parsed.text || parsed.gu || parsed.en || parsed.hi || 'બ્રેકિંગ ન્યૂઝ');
              if (parsed.mode === 'single' || parsed.mode === 'scroll') {
                setTickerMode(parsed.mode);
              }
              if (parsed.speed && typeof parsed.speed === 'number') {
                setTickerSpeed(parsed.speed);
              }
              if (typeof parsed.hidden === 'boolean') {
                setTickerHidden(parsed.hidden);
              } else if (parsed.hidden === 'true') {
                setTickerHidden(true);
              } else if (parsed.hidden === 'false') {
                setTickerHidden(false);
              }
              if (parsed.sourceType === 'custom' || parsed.sourceType === 'articles') {
                setTickerSourceType(parsed.sourceType);
              }
              if (Array.isArray(parsed.customHeadlines)) {
                setCustomTickerHeadlines(
                  parsed.customHeadlines
                    .filter((h: any) => h && (h.heading || h.title))
                    .map((h: any, i: number) => ({
                      id: h.id || `custom-${i}`,
                      heading: h.heading || h.title || '',
                      link: h.link || h.url || '',
                    }))
                );
              }
              if (Array.isArray(parsed.articleIds) && parsed.articleIds.length > 0) {
                const artMap = new Map<string, Article>();
                arts.forEach((a) => artMap.set(a.id, a));
                const foundArts = parsed.articleIds.map((id: string) => artMap.get(id)).filter(Boolean) as Article[];
                setSelectedTickerArticles(foundArts);
              }
            } else if (typeof parsed === 'string') {
              setTickerBadgeText(parsed);
            }
          } catch {
            setTickerBadgeText(rawLabel);
          }
        }
      }

      // Populate TV Breaking News Showcase Banner
      const bBannerEnabled = (heroRes as any)?.breakingBannerEnabled ?? heroRes?.setting?.breakingBannerEnabled ?? false;
      setBreakingBannerEnabled(Boolean(bBannerEnabled));

      const rawBreakingJson = (heroRes as any)?.breakingBannerJson || heroRes?.setting?.breakingBannerJson;
      if (rawBreakingJson) {
        try {
          const parsed = typeof rawBreakingJson === 'string' ? JSON.parse(rawBreakingJson) : rawBreakingJson;
          if (parsed && typeof parsed === 'object') {
            if (parsed.badgeText) setBreakingBannerBadgeText(parsed.badgeText);
            if (parsed.intervalSeconds) setBreakingBannerInterval(Number(parsed.intervalSeconds) || 4);
            if (Array.isArray(parsed.slides) && parsed.slides.length > 0) {
              setBreakingSlides(parsed.slides);
            }
          }
        } catch {}
      }

      // Populate Election Banner
      const bannerEnabled = (heroRes as any)?.electionBannerEnabled ?? heroRes?.setting?.electionBannerEnabled ?? false;
      setElectionBannerEnabled(Boolean(bannerEnabled));

      const rawBannerJson = (heroRes as any)?.electionBannerJson || heroRes?.setting?.electionBannerJson;
      if (rawBannerJson) {
        try {
          const parsed = typeof rawBannerJson === 'string' ? JSON.parse(rawBannerJson) : rawBannerJson;
          if (parsed && typeof parsed === 'object') {
            if (parsed.title) setElectionBannerTitle(parsed.title);
            if (parsed.showLive !== undefined) setElectionBannerLive(Boolean(parsed.showLive));
            if (parsed.mapIconUrl !== undefined) setElectionBannerMapUrl(parsed.mapIconUrl || '');
            if (parsed.totalSeats !== undefined) setElectionBannerTotalSeats(parsed.totalSeats);
            if (parsed.majorityTarget !== undefined) setElectionBannerMajority(parsed.majorityTarget);
            if (parsed.showOnAllPages !== undefined) setElectionBannerShowAllPages(Boolean(parsed.showOnAllPages));
            if (Array.isArray(parsed.parties) && parsed.parties.length > 0) {
              setElectionParties(parsed.parties.map((p: any) => {
                const nameLower = ((p.name || p.nameGu || '') + '').toLowerCase();
                const seatsNum = Number(p.seats) || 0;
                let won = p.won;
                let leads = p.leads;
                let trailing = p.trailing !== undefined && p.trailing !== '' ? p.trailing : 0;
                if (won === undefined || won === '' || leads === undefined || leads === '') {
                  if (nameLower.includes('bjp') || nameLower.includes('ભાજપ')) {
                    won = 82; leads = 18; trailing = 0;
                  } else if (nameLower.includes('cong') || nameLower.includes('કોંગ્રેસ')) {
                    won = 38; leads = 17; trailing = 0;
                  } else if (nameLower.includes('aap') || nameLower.includes('આપ')) {
                    won = 8; leads = 7; trailing = 0;
                  } else if (nameLower.includes('અન્ય') || nameLower.includes('oth')) {
                    won = 6; leads = 6; trailing = 0;
                  } else {
                    won = Math.round(seatsNum * 0.7);
                    leads = Math.max(0, seatsNum - Number(won));
                    trailing = 0;
                  }
                }
                return {
                  ...p,
                  won: Number(won) || 0,
                  leads: Number(leads) || 0,
                  trailing: Number(trailing) || 0,
                  logoUrl: p.logoUrl && p.logoUrl.includes('wikimedia.org') ? '' : (p.logoUrl || ''),
                };
              }));
            }
          }
        } catch {}
      }

      const serverGridMode = (heroRes as any)?.heroGridMode || heroRes?.setting?.heroGridMode || 'auto';
      setHeroGridMode(serverGridMode);

      const serverGrid = Array.isArray((heroRes as any)?.heroGridArticles) ? (heroRes as any).heroGridArticles : [];
      if (serverGridMode === 'manual') {
        setHeroGridArticles(serverGrid.slice(0, 9));
      } else {
        const combinedGrid = [...serverGrid, ...arts].filter((a, idx, arr) => a && arr.findIndex((x) => x?.id === a.id) === idx);
        setHeroGridArticles(combinedGrid.slice(0, 9));
      }

      // Default slots: Articles 10, 11, 12 from published list (the bottom 3 cards)
      const defaultSlots = [
        arts[9] || arts[0] || null,
        arts[10] || arts[1] || null,
        arts[11] || arts[2] || null,
      ];

      if (heroRes && Array.isArray(heroRes.slots) && heroRes.slots.length > 0) {
        setSlots([
          heroRes.slots[0] ? (heroRes.slots[0] as unknown as Article) : (heroRes.setting?.slot1Id ? null : defaultSlots[0]),
          heroRes.slots[1] ? (heroRes.slots[1] as unknown as Article) : (heroRes.setting?.slot2Id ? null : defaultSlots[1]),
          heroRes.slots[2] ? (heroRes.slots[2] as unknown as Article) : (heroRes.setting?.slot3Id ? null : defaultSlots[2]),
        ]);
        // Detect mode: if all slot IDs are explicitly null in setting, it's auto mode
        const hasManualSlots = heroRes.setting?.slot1Id || heroRes.setting?.slot2Id || heroRes.setting?.slot3Id;
        setBottomSlotsMode(hasManualSlots ? 'manual' : 'auto');
      } else {
        setSlots(defaultSlots);
        setBottomSlotsMode('auto');
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

      const serverMostReadMode = (heroRes as any)?.mostReadMode || heroRes?.setting?.mostReadMode || 'auto';
      setMostReadMode(serverMostReadMode);

      const serverAutoMostRead = Array.isArray((heroRes as any)?.autoMostReadArticles) ? (heroRes as any).autoMostReadArticles : [];
      setAutoMostReadArticles(serverAutoMostRead);

      if (heroRes && Array.isArray((heroRes as any).mostReadArticles) && (heroRes as any).mostReadArticles.length > 0) {
        setMostReadArticles(((heroRes as any).mostReadArticles as unknown as Article[]).slice(0, 10));
      } else if (serverAutoMostRead.length > 0) {
        setMostReadArticles(serverAutoMostRead.slice(0, 10));
      } else {
        setMostReadArticles(arts.slice(0, 10));
      }
    } catch {
      showToast('Failed to load hero section articles', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  // Preview cycling in Single mode
  useEffect(() => {
    if (tickerMode !== 'single') return;
    const count =
      tickerSourceType === 'custom'
        ? customTickerHeadlines.length
        : selectedTickerArticles.length;
    if (count <= 1) {
      setPreviewTickerIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setPreviewTickerIndex((prev) => (prev + 1) % count);
    }, tickerSpeed);
    return () => clearInterval(interval);
  }, [tickerMode, tickerSpeed, tickerSourceType, selectedTickerArticles.length, customTickerHeadlines.length]);

  const handleMoveTickerArticle = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= selectedTickerArticles.length) return;
    const copy = [...selectedTickerArticles];
    const item = copy[index];
    copy[index] = copy[target];
    copy[target] = item;
    setSelectedTickerArticles(copy);
  };

  const handleRemoveTickerArticle = (index: number) => {
    setSelectedTickerArticles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTickerArticle = (article: Article) => {
    if (selectedTickerArticles.some((a) => a.id === article.id)) {
      showToast('Article is already in the ticker list', false);
      return;
    }
    setSelectedTickerArticles((prev) => [...prev, article]);
    showToast(`Added "${getTitle(article).slice(0, 30)}..." to ticker`, true);
  };

  const handleAddCustomHeadline = () => {
    if (!newCustomHeading.trim()) return;
    const newItem: CustomHeadlineItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      heading: newCustomHeading.trim(),
      link: newCustomLink.trim(),
    };
    setCustomTickerHeadlines((prev) => [...prev, newItem]);
    setNewCustomHeading('');
    setNewCustomLink('');
    showToast('Added custom headline to ticker', true);
  };

  const handleMoveCustomHeadline = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= customTickerHeadlines.length) return;
    const copy = [...customTickerHeadlines];
    const item = copy[index];
    copy[index] = copy[target];
    copy[target] = item;
    setCustomTickerHeadlines(copy);
  };

  const handleRemoveCustomHeadline = (index: number) => {
    setCustomTickerHeadlines((prev) => prev.filter((_, i) => i !== index));
    if (editingHeadlineId && customTickerHeadlines[index]?.id === editingHeadlineId) {
      setEditingHeadlineId(null);
      setEditingHeadingText('');
      setEditingLinkText('');
    }
  };

  const handleStartEditCustomHeadline = (item: CustomHeadlineItem) => {
    setEditingHeadlineId(item.id);
    setEditingHeadingText(item.heading);
    setEditingLinkText(item.link || '');
  };

  const handleCancelEditCustomHeadline = () => {
    setEditingHeadlineId(null);
    setEditingHeadingText('');
    setEditingLinkText('');
  };

  const handleSaveEditCustomHeadline = (id: string) => {
    if (!editingHeadingText.trim()) {
      showToast('Headline cannot be empty', false);
      return;
    }
    setCustomTickerHeadlines((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, heading: editingHeadingText.trim(), link: editingLinkText.trim() }
          : item
      )
    );
    setEditingHeadlineId(null);
    setEditingHeadingText('');
    setEditingLinkText('');
    showToast('Headline updated successfully', true);
  };

  /**
   * Single-click instant toggle for showing or completely hiding the Breaking News Ticker.
   * Immediately updates UI state, sets localStorage for 0ms cross-tab sync via 'storage' event,
   * broadcasts to all open browser windows, and auto-saves to backend database.
   */
  const handleToggleTickerVisibility = async (hide: boolean) => {
    // 1. Instantly update local state
    setTickerHidden(hide);

    // 2. Instantly update localStorage and cookies so any user-facing tab immediately hides or shows
    if (typeof window !== 'undefined') {
      localStorage.setItem('gp_ticker_hidden', hide ? 'true' : 'false');
      try {
        document.cookie = `gp_ticker_hidden=${hide ? 'true' : 'false'}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {}
    }

    // 3. Instantly broadcast via BroadcastChannel to all open browser tabs
    clearApiCacheAndBroadcast({ type: 'TICKER_SETTINGS_UPDATED', hidden: hide });

    // 4. Instant user toast notification
    showToast(
      hide
        ? '✅ Single click applied! Breaking News Ticker (both Continuous & Single) is now COMPLETELY HIDDEN on user side.'
        : '✅ Single click applied! Breaking News Ticker is now LIVE on user side.',
      true
    );

    // 5. Auto-save to backend database immediately
    try {
      const payloadObj = {
        text: tickerBadgeText.trim() || 'બ્રેકિંગ ન્યૂઝ',
        mode: tickerMode,
        speed: tickerSpeed,
        sourceType: tickerSourceType,
        articleIds: tickerSourceType === 'articles' ? selectedTickerArticles.map((a) => a.id) : [],
        customHeadlines: tickerSourceType === 'custom' ? customTickerHeadlines : [],
        hidden: hide,
      };
      const payload = {
        tickerLabel: JSON.stringify(payloadObj),
      };
      const res = await updateHeroSettings(payload);
      if (res && res.success) {
        clearApiCacheAndBroadcast({ type: 'TICKER_SETTINGS_UPDATED', hidden: hide });
        triggerOnDemandRevalidate();
      }
    } catch (err) {
      console.error('Failed to auto-save ticker visibility:', err);
    }
  };

  // ─── ELECTION BANNER HANDLERS ───────────────────────────────────────
  const handleUploadSlideImage = async (file: File, slideIdx: number) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', false);
      return;
    }
    setUploadingSlideImgIdx(slideIdx);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      const url = data?.data?.url || data?.url;
      if (url) {
        setBreakingSlides(prev => {
          const next = [...prev];
          next[slideIdx] = { ...next[slideIdx], image: url };
          return next;
        });
        showToast('Slide image uploaded successfully!', true);
      } else {
        showToast('Upload succeeded but no image URL was returned.', false);
      }
    } catch (e: any) {
      showToast(e?.message || 'Error uploading slide image', false);
    } finally {
      setUploadingSlideImgIdx(null);
    }
  };

  const handleAddBreakingSlide = () => {
    setBreakingSlides(prev => [
      ...prev,
      {
        id: 'slide-' + Date.now(),
        image: '',
        link: '',
        texts: ['નવી બ્રેકિંગ ન્યૂઝ હેડલાઇન લખો...'],
      },
    ]);
  };

  const handleRemoveBreakingSlide = (idx: number) => {
    setBreakingSlides(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMoveBreakingSlide = (idx: number, direction: 'up' | 'down') => {
    setBreakingSlides(prev => {
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  const handleSlideChange = (idx: number, field: string, value: string) => {
    setBreakingSlides(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleAddSlideText = (slideIdx: number) => {
    setBreakingSlides(prev => {
      const next = [...prev];
      const currentTexts = next[slideIdx]?.texts || [];
      next[slideIdx] = {
        ...next[slideIdx],
        texts: [...currentTexts, 'નવો મુદ્દો...'],
      };
      return next;
    });
  };

  const handleRemoveSlideText = (slideIdx: number, textIdx: number) => {
    setBreakingSlides(prev => {
      const next = [...prev];
      const currentTexts = (next[slideIdx]?.texts || []).filter((_, i) => i !== textIdx);
      next[slideIdx] = {
        ...next[slideIdx],
        texts: currentTexts.length > 0 ? currentTexts : ['મુદ્દો ૧'],
      };
      return next;
    });
  };

  const handleSlideTextChange = (slideIdx: number, textIdx: number, value: string) => {
    setBreakingSlides(prev => {
      const next = [...prev];
      const currentTexts = [...(next[slideIdx]?.texts || [])];
      currentTexts[textIdx] = value;
      next[slideIdx] = {
        ...next[slideIdx],
        texts: currentTexts,
      };
      return next;
    });
  };

  const handleMoveSlideText = (slideIdx: number, textIdx: number, direction: 'up' | 'down') => {
    setBreakingSlides(prev => {
      const next = [...prev];
      const currentTexts = [...(next[slideIdx]?.texts || [])];
      const targetIdx = direction === 'up' ? textIdx - 1 : textIdx + 1;
      if (targetIdx < 0 || targetIdx >= currentTexts.length) return prev;
      const temp = currentTexts[textIdx];
      currentTexts[textIdx] = currentTexts[targetIdx];
      currentTexts[targetIdx] = temp;
      next[slideIdx] = {
        ...next[slideIdx],
        texts: currentTexts,
      };
      return next;
    });
  };

  const handleSaveBreakingBanner = async () => {
    setSavingBreakingBanner(true);
    try {
      const bannerPayload = {
        badgeText: breakingBannerBadgeText.trim() || 'BREAKING NEWS',
        intervalSeconds: Number(breakingBannerInterval) || 4,
        slides: breakingSlides,
      };

      const res = await updateHeroSettings({
        breakingBannerEnabled,
        breakingBannerJson: JSON.stringify(bannerPayload),
      });

      if (res && res.success) {
        clearApiCacheAndBroadcast({
          type: 'BREAKING_BANNER_UPDATED',
          enabled: breakingBannerEnabled,
          config: bannerPayload,
        });
        triggerOnDemandRevalidate();
        showToast(
          breakingBannerEnabled
            ? '✅ Saved! TV Breaking News Showcase Banner is now LIVE on homepage.'
            : '✅ Saved! TV Breaking News Showcase Banner is now DISABLED (hidden).',
          true
        );
      } else {
        showToast('Failed to save Breaking News Banner. Please try again.', false);
      }
    } catch {
      showToast('Save failed. Please try again.', false);
    } finally {
      setSavingBreakingBanner(false);
    }
  };

  const handleToggleElectionBanner = async (targetState: boolean) => {
    setElectionBannerEnabled(targetState);
    setSavingElectionBanner(true);
    try {
      const bannerPayload = {
        title: electionBannerTitle.trim() || 'ગુજરાત ચૂંટણી 2026',
        showLive: electionBannerLive,
        mapIconUrl: electionBannerMapUrl.trim(),
        totalSeats: electionBannerTotalSeats,
        majorityTarget: electionBannerMajority,
        showOnAllPages: electionBannerShowAllPages,
        parties: electionParties,
      };

      const res = await updateHeroSettings({
        electionBannerEnabled: targetState,
        electionBannerJson: JSON.stringify(bannerPayload),
      });

      if (res && res.success) {
        clearApiCacheAndBroadcast({
          type: 'ELECTION_BANNER_UPDATED',
          enabled: targetState,
        });
        triggerOnDemandRevalidate();
        showToast(
          targetState
            ? '✅ Saved! Election Banner is now LIVE on homepage.'
            : '✅ Saved! Election Banner is DISABLED (hidden from homepage).',
          true
        );
      } else {
        showToast('Failed to save Election Banner status.', false);
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving Election Banner status.', false);
    } finally {
      setSavingElectionBanner(false);
    }
  };

  const handleToggleBreakingBanner = async (targetState: boolean) => {
    setBreakingBannerEnabled(targetState);
    setSavingBreakingBanner(true);
    try {
      const bannerPayload = {
        badgeText: breakingBannerBadgeText.trim() || 'BREAKING NEWS',
        intervalSeconds: breakingBannerInterval,
        slides: breakingSlides,
      };

      const res = await updateHeroSettings({
        breakingBannerEnabled: targetState,
        breakingBannerJson: JSON.stringify(bannerPayload),
      });

      if (res && res.success) {
        clearApiCacheAndBroadcast({
          type: 'BREAKING_BANNER_UPDATED',
          enabled: targetState,
          config: bannerPayload,
        });
        triggerOnDemandRevalidate();
        showToast(
          targetState
            ? '✅ Saved! TV Breaking News Showcase is now LIVE on homepage.'
            : '✅ Saved! TV Breaking News Showcase is DISABLED (hidden from homepage).',
          true
        );
      } else {
        showToast('Failed to save TV Breaking News Showcase status.', false);
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving TV Breaking News Showcase status.', false);
    } finally {
      setSavingBreakingBanner(false);
    }
  };

  const handleSaveElectionBanner = async () => {
    setSavingElectionBanner(true);
    try {
      const bannerPayload = {
        title: electionBannerTitle.trim() || 'ગુજરાત ચૂંટણી 2026',
        showLive: electionBannerLive,
        mapIconUrl: electionBannerMapUrl.trim(),
        totalSeats: electionBannerTotalSeats,
        majorityTarget: electionBannerMajority,
        showOnAllPages: electionBannerShowAllPages,
        parties: electionParties,
      };

      const res = await updateHeroSettings({
        electionBannerEnabled,
        electionBannerJson: JSON.stringify(bannerPayload),
      });

      if (res && res.success) {
        clearApiCacheAndBroadcast({
          type: 'ELECTION_BANNER_UPDATED',
          enabled: electionBannerEnabled,
        });
        triggerOnDemandRevalidate();
        showToast(
          electionBannerEnabled
            ? '✅ Saved! Election Banner is now LIVE on homepage.'
            : '✅ Saved! Election Banner is DISABLED (hidden).',
          true
        );
      } else {
        showToast('Failed to save Election Banner settings. Please try again.', false);
      }
    } catch (err: any) {
      showToast(err?.message || 'Error saving election banner settings.', false);
    } finally {
      setSavingElectionBanner(false);
    }
  };

  const handleUploadPartyLogo = async (file: File, index: number) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, SVG, WebP)', false);
      return;
    }
    setUploadingPartyLogoIdx(index);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      const rawUrl = data.url || data.data?.url || data.secure_url || '';
      const url = rawUrl.includes('res.cloudinary.com') ? rawUrl.replace(/\.avif(\?.*)?$/i, '.png$1') : rawUrl;
      if (url) {
        setElectionParties(prev => {
          const next = [...prev];
          next[index] = { ...next[index], logoUrl: url };
          return next;
        });
        showToast('Party logo uploaded successfully!', true);
      } else {
        showToast('Upload succeeded but no image URL was returned.', false);
      }
    } catch (e: any) {
      showToast(e?.message || 'Error uploading party logo', false);
    } finally {
      setUploadingPartyLogoIdx(null);
    }
  };

  const handleUploadMapIcon = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Please select a valid image file', false);
      return;
    }
    setUploadingMapIcon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      const rawUrl = data.url || data.data?.url || data.secure_url || '';
      const url = rawUrl.includes('res.cloudinary.com') ? rawUrl.replace(/\.avif(\?.*)?$/i, '.png$1') : rawUrl;
      if (url) {
        setElectionBannerMapUrl(url);
        showToast('Election map / header logo uploaded successfully!', true);
      }
    } catch (e: any) {
      showToast(e?.message || 'Error uploading map logo', false);
    } finally {
      setUploadingMapIcon(false);
    }
  };

  const handleAddParty = () => {
    setElectionParties(prev => [
      ...prev,
      {
        id: 'party-' + Date.now(),
        name: 'નવો પક્ષ',
        nameGu: 'નવો પક્ષ',
        logoUrl: '',
        seats: 0,
        won: 0,
        leads: 0,
        trailing: 0,
        color: '#6B7280',
      },
    ]);
  };

  const handleRemoveParty = (index: number) => {
    setElectionParties(prev => prev.filter((_, i) => i !== index));
  };

  const handlePartyChange = (index: number, field: string, value: any) => {
    setElectionParties(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveTickerBadge = async () => {
    if (!tickerHidden) {
      if (tickerSourceType === 'articles' && selectedTickerArticles.length === 0) {
        showToast('⚠️ Please select at least 1 article for the ticker.', false);
        return;
      }
      if (tickerSourceType === 'custom' && customTickerHeadlines.length === 0) {
        showToast('⚠️ Please enter at least 1 headline with link for the ticker.', false);
        return;
      }
    }
    setSavingTickerBadge(true);
    try {
      const payloadObj = {
        text: tickerBadgeText.trim() || 'બ્રેકિંગ ન્યૂઝ',
        mode: tickerMode,
        speed: tickerSpeed,
        sourceType: tickerSourceType,
        articleIds: tickerSourceType === 'articles' ? selectedTickerArticles.map((a) => a.id) : [],
        customHeadlines: tickerSourceType === 'custom' ? customTickerHeadlines : [],
        hidden: tickerHidden,
      };
      const payload = {
        tickerLabel: JSON.stringify(payloadObj),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('gp_ticker_hidden', tickerHidden ? 'true' : 'false');
        try {
          document.cookie = `gp_ticker_hidden=${tickerHidden ? 'true' : 'false'}; path=/; max-age=31536000; SameSite=Lax`;
        } catch {}
      }
      const res = await updateHeroSettings(payload);
      if (res && res.success) {
        clearApiCacheAndBroadcast({ type: 'TICKER_SETTINGS_UPDATED', hidden: tickerHidden });
        triggerOnDemandRevalidate();
        showToast(
          tickerHidden
            ? '✅ Saved! Breaking News ticker is now HIDDEN on the user side.'
            : '✅ Saved! Breaking News ticker settings updated live on user side.',
          true
        );
      } else {
        showToast('Failed to save ticker settings. Please try again.', false);
      }
    } catch {
      showToast('Save failed. Please try again.', false);
    } finally {
      setSavingTickerBadge(false);
    }
  };

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
      showToast('Article already in Fact Check News list', false);
      return;
    }
    if (trendingNewsArticles.length >= 10) {
      showToast('⚠️ Limit reached (10 articles max for Fact Check News). Please remove one first.', false);
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
        showToast('✅ Saved! Fact Check News slider articles updated live on user side.', true);
        if (res.data?.trendingNewsArticles && Array.isArray(res.data.trendingNewsArticles)) {
          setTrendingNewsArticles(res.data.trendingNewsArticles as unknown as Article[]);
        }
      } else {
        showToast('Failed to save Fact Check News articles. Please try again.', false);
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
    if (mostReadArticles.length >= 10) {
      showToast('⚠️ Limit reached (10 articles max for Most Read). Please remove one first.', false);
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
    } catch { }
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
        mostReadIds: mostReadArticles.slice(0, 10).map((a) => a.id),
        mostReadMode,
        heroGridIds: JSON.stringify(heroGridArticles.map((a) => a.id)),
        heroGridMode,
      };

      const res = await updateHeroSettings(payload);

      if (res && res.success) {
        triggerOnDemandRevalidate();
        showToast('✅ Saved! Most Read (સૌથી વધુ વંચાયેલા) articles updated live on user side.', true);
        if (res.data?.mostReadArticles && Array.isArray(res.data.mostReadArticles)) {
          setMostReadArticles((res.data.mostReadArticles as unknown as Article[]).slice(0, 10));
        }
        if (res.data?.mostReadMode) {
          setMostReadMode(res.data.mostReadMode);
        }
        if (res.data?.autoMostReadArticles && Array.isArray(res.data.autoMostReadArticles)) {
          setAutoMostReadArticles(res.data.autoMostReadArticles);
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
    } catch { }
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
    if (heroGridArticles.length >= 9) {
      showToast('⚠️ Limit reached (maximum 9 articles for Top Hero Grid). Please remove an article first.', false);
      return;
    }
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
        heroGridMode,
      };

      const res = await updateHeroSettings(payload);

      if (res && res.success) {
        triggerOnDemandRevalidate();
        showToast('✅ Saved! Top Main Hero Grid settings updated live on user side.', true);
        if (res.data?.heroGridArticles && Array.isArray(res.data.heroGridArticles)) {
          setHeroGridArticles(res.data.heroGridArticles as unknown as Article[]);
        }
        if (res.data?.heroGridMode) {
          setHeroGridMode(res.data.heroGridMode);
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
      // In auto mode, clear all slot IDs so frontend uses latest articles automatically
      const payload = bottomSlotsMode === 'auto'
        ? { slot1Id: null, slot2Id: null, slot3Id: null }
        : {
            slot1Id: slots[0]?.id || null,
            slot2Id: slots[1]?.id || null,
            slot3Id: slots[2]?.id || null,
          };

      const res = await updateHeroSettings(payload);

      if (res && res.success) {
        triggerOnDemandRevalidate();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gp-hero-updated'));
          window.dispatchEvent(new CustomEvent('gp-articles-updated'));
        }
        if (bottomSlotsMode === 'auto') {
          showToast('✅ Saved! Auto Mode enabled — bottom cards now update automatically from API.', true);
        } else {
          showToast('✅ Saved! Manual Mode — Bottom Row 3 Image Cards updated live on user side.', true);
          if (res.data?.slots) {
            setSlots([
              res.data.slots[0] ? (res.data.slots[0] as unknown as Article) : null,
              res.data.slots[1] ? (res.data.slots[1] as unknown as Article) : null,
              res.data.slots[2] ? (res.data.slots[2] as unknown as Article) : null,
            ]);
          }
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
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <LayoutTemplate className="h-7 w-7 sm:h-8 sm:w-8 text-[#B3121B]" />
            Hero Section Manager
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-medium">
            Manage all hero sections, main grid positions, bottom image slots, and news sliders for the homepage.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-3 sm:mt-0 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-400 dark:border-zinc-700 bg-white hover:bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white px-4 py-2.5 text-sm sm:text-base font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Eye className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
            <span>Preview Homepage</span>
            <ArrowUpRight className="h-4 w-4 text-zinc-400 dark:text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5">
        <div className="rounded-xl border border-sky-400 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/30 p-5 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">Total Articles</p>
          <p className="mt-2 text-5xl sm:text-6xl font-black text-black dark:text-white leading-none">{allArticles.length}</p>
          <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mt-2">Published news</p>
        </div>
        <div className="rounded-xl border border-sky-400 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/30 p-5 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">Slots Filled</p>
          <p className="mt-2 text-5xl sm:text-6xl font-black text-black dark:text-white leading-none">{usedIds.length} / 3</p>
          <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mt-2">Bottom row image cards</p>
        </div>
        <div className="rounded-xl border border-sky-400 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/30 p-5 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">Available</p>
          <p className="mt-2 text-5xl sm:text-6xl font-black text-black dark:text-white leading-none">{allArticles.length - usedIds.length}</p>
          <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300 mt-2">Remaining articles</p>
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
             BREAKING NEWS TICKER SETTINGS (MODE & ARTICLE SELECTION)
             ════════════════════════════════════════════════════════════════ */}
          <div className="mb-8 rounded-2xl border border-gray-400 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-400 pb-4 dark:border-zinc-700 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="flex h-3.5 w-3.5 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${tickerHidden ? 'bg-amber-500' : 'bg-red-500'} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${tickerHidden ? 'bg-amber-600' : 'bg-red-600'}`}></span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                    Breaking News Ticker Settings
                  </h3>
                  {tickerHidden ? (
                    <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1.5 shadow-2xs">
                      <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                      Hidden on Website (વેબસાઇટ પર છુપાયેલ છે)
                    </span>
                  ) : (
                    <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs">
                      <Eye className="h-3.5 w-3.5 text-emerald-600" />
                      Live Header Bar (વેબસાઇટ પર લાઈવ)
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-medium mt-1.5">
                  Choose display style (Continuous Marquee vs Single One-by-One), customize badge label, show/hide section, and select specific articles to feature.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveTickerBadge}
                disabled={savingTickerBadge}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] px-6 py-3 text-sm sm:text-base font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/25 disabled:opacity-50 cursor-pointer"
              >
                {savingTickerBadge ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingTickerBadge ? 'Saving Settings...' : 'Save Ticker Settings'}
              </button>
            </div>

            {/* ── Section Display Status (Show vs Hide Fully) ── */}
            <div className="mb-6 p-4 sm:p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <label className="block text-sm sm:text-base font-black text-zinc-900 dark:text-white">
                    Section Display Status (આ સેક્શન વેબસાઇટ પર દેખાડવું કે સંપૂર્ણ છુપાવવું?)
                  </label>
                  <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
                    Choose whether the top Breaking News Ticker is visible to visitors or completely hidden.
                  </p>
                </div>
                <span className={`text-xs font-black px-3 py-1 rounded-full border shrink-0 ${
                  tickerHidden
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                }`}>
                  {tickerHidden ? '● હાલમાં છુપાયેલ છે (Currently Hidden)' : '● લાઈવ ચાલુ છે (Currently Visible)'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option A: Show Section (Visible) */}
                <div
                  onClick={() => handleToggleTickerVisibility(false)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    !tickerHidden
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${!tickerHidden ? 'bg-emerald-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}>
                        <Eye className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                          Show Section (વેબસાઇટ પર દેખાડો)
                          {!tickerHidden && (
                            <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">Active</span>
                          )}
                        </h4>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                          User-side Live & Visible (Single-click)
                        </p>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                      !tickerHidden ? 'border-emerald-600 bg-emerald-600' : 'border-zinc-400'
                    }`}>
                      {!tickerHidden && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">
                    ક્લિક કરતાં જ આ બ્રેકિંગ ન્યૂઝ ટિકર વેબસાઇટની સૌથી ટોચ પર લાઈવ દેખાવા લાગશે.
                  </p>
                </div>

                {/* Option B: Hide Section (Hidden) */}
                <div
                  onClick={() => handleToggleTickerVisibility(true)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    tickerHidden
                      ? 'border-red-600 bg-red-50/60 dark:bg-red-950/20 shadow-sm ring-2 ring-red-500/20'
                      : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${tickerHidden ? 'bg-red-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}>
                        <EyeOff className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                          Hide This Section Fully (સંપૂર્ણ છુપાવો)
                          {tickerHidden && (
                            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">Hidden</span>
                          )}
                        </h4>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                          Continuous & Single both 100% hidden (Single-click)
                        </p>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                      tickerHidden ? 'border-red-600 bg-red-600' : 'border-zinc-400'
                    }`}>
                      {tickerHidden && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">
                    સિંગલ ક્લિક પર જ Continuous Marquee અને Single Headline બંને યુઝર સાઇટ પરથી સંપૂર્ણ બંધ થઈ જશે.
                  </p>
                </div>
              </div>

              {tickerHidden && (
                <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-50 via-amber-50 to-red-50 dark:from-red-950/40 dark:via-zinc-900 dark:to-red-950/40 border-2 border-red-300 dark:border-red-800 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <EyeOff className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-red-950 dark:text-red-200">
                          બંને મોડ્સ (Continuous Marquee & Single Headline) સંપૂર્ણપણે બંધ છે
                        </h4>
                        <p className="text-xs sm:text-sm text-red-800 dark:text-red-300 font-medium mt-0.5">
                          Both Continuous Marquee Scroll and Single Headline Slider are 100% hidden on the user website. Instant single-click sync active.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleTickerVisibility(false)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-700 transition shadow-sm cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        Turn ON (ચાલુ કરો)
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTickerSettingsWhileHidden((prev) => !prev)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer"
                      >
                        {showTickerSettingsWhileHidden ? 'Hide Details' : 'Configure Settings'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* When Section is NOT hidden, or when admin explicitly clicks "Configure Settings" while hidden */}
            {(!tickerHidden || showTickerSettingsWhileHidden) && (
              <>
                {/* 1. Mode Selection (Option 1 vs Option 2) */}
                <div className="mb-6">
                  <label className="block text-sm sm:text-base font-bold text-zinc-900 dark:text-white mb-2.5">
                    1. Choose Display Mode (ડિસ્પ્લે પદ્ધતિ પસંદ કરો)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option 1: Continuous Marquee Scroll */}
                    <div
                      onClick={() => setTickerMode('scroll')}
                      className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${tickerMode === 'scroll'
                          ? 'border-[#B3121B] bg-red-50/40 dark:bg-red-950/20 shadow-sm'
                          : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 hover:border-zinc-400'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${tickerMode === 'scroll' ? 'bg-[#B3121B] text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}>
                            <MoveHorizontal className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                              Continuous Marquee Scroll
                            </h4>
                            <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                              સતત સ્ક્રોલિંગ (Left to Left continuous stream)
                            </p>
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${tickerMode === 'scroll' ? 'border-[#B3121B] bg-[#B3121B]' : 'border-zinc-400'
                          }`}>
                          {tickerMode === 'scroll' && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">
                        બધી હેડલાઇન્સ જમણેથી ડાબે એકધારા પ્રવાહમાં સતત સ્ક્રોલ થશે. યુઝર માઉસ રાખે ત્યારે પોઝ થશે.
                      </p>
                    </div>

                    {/* Option 2: Single Headline One-by-One */}
                    <div
                      onClick={() => setTickerMode('single')}
                      className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${tickerMode === 'single'
                          ? 'border-[#B3121B] bg-red-50/40 dark:bg-red-950/20 shadow-sm'
                          : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 hover:border-zinc-400'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${tickerMode === 'single' ? 'bg-[#B3121B] text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}>
                            <Layers className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                              Single Headline One-by-One
                              <span className="text-xs bg-[#B3121B] text-white px-2 py-0.5 rounded-full font-bold">New</span>
                            </h4>
                            <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                              એક પછી એક હેડલાઇન સ્લાઇડર (Single article transition)
                            </p>
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${tickerMode === 'single' ? 'border-[#B3121B] bg-[#B3121B]' : 'border-zinc-400'
                          }`}>
                          {tickerMode === 'single' && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">
                        સ્ક્રીન પર એક જ આર્ટિકલ દેખાશે. થોડી સેકન્ડ પછી સ્મૂધ એનિમેશન સાથે આપમેળે બીજો આર્ટિકલ આવશે.
                      </p>
                    </div>
                  </div>

                  {/* Speed Selector (Active when Single mode is selected) */}
                  {tickerMode === 'single' && (
                    <div className="mt-4 p-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#B3121B]" />
                        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                          સ્લાઇડ બદલાવવાનો સમય (Slide Duration per Article):
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { ms: 3000, label: '3s (ઝડપી)' },
                          { ms: 4500, label: '4.5s (ડિફોલ્ટ)' },
                          { ms: 6000, label: '6s (સામાન્ય)' },
                          { ms: 8000, label: '8s (શાંતિથી)' },
                        ].map((opt) => (
                          <button
                            key={opt.ms}
                            type="button"
                            onClick={() => setTickerSpeed(opt.ms)}
                            className={`text-xs sm:text-sm px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${tickerSpeed === opt.ms
                                ? 'bg-[#B3121B] text-white shadow-xs'
                                : 'bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400'
                              }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Badge Text Input */}
                <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 space-y-2">
                    <label className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                      <span>2. Badge Text / Label (હેડર બેજ લખાણ)</span>
                      <span className="text-xs sm:text-sm text-zinc-500 font-medium">Type any text in any language</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={tickerBadgeText}
                        onChange={(e) => setTickerBadgeText(e.target.value)}
                        placeholder="Enter badge text (e.g. બ્રેકિંગ ન્યૂઝ, BREAKING NEWS, લાઈવ સમાચાર...)"
                        className="w-full rounded-xl border border-zinc-400 bg-white px-4 py-3 text-base font-semibold text-zinc-900 focus:border-[#B3121B] focus:ring-2 focus:ring-[#B3121B]/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 placeholder:text-base placeholder:font-normal placeholder:text-zinc-400 shadow-xs"
                      />
                      {tickerBadgeText && (
                        <button
                          type="button"
                          onClick={() => setTickerBadgeText('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                          title="Clear text"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs sm:text-sm text-zinc-500 font-semibold">Quick suggestions:</span>
                      {['બ્રેકિંગ ન્યૂઝ', 'BREAKING NEWS', 'લાઈવ સમાચાર', 'LIVE UPDATES', 'ખાસ અહેવાલ'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTickerBadgeText(preset)}
                          className={`text-xs sm:text-sm px-3.5 py-1 rounded-full border font-semibold transition cursor-pointer ${tickerBadgeText === preset
                              ? 'bg-[#B3121B] text-white border-[#B3121B]'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-gray-400 dark:border-zinc-700 hover:border-zinc-400'
                            }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Preview Card */}
                  <div className={`rounded-xl border p-4 flex flex-col justify-center transition-all ${
                    tickerHidden
                      ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-gray-400 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/40'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Live Bar Preview</span>
                      <div className="flex items-center gap-2">
                        {tickerHidden ? (
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                            <EyeOff className="h-3 w-3" /> Hidden on Website
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                            <Eye className="h-3 w-3" /> Visible Live
                          </span>
                        )}
                        <span className="text-xs font-bold text-[#B3121B]">
                          {tickerMode === 'single' ? 'Single One-by-One' : 'Continuous Scroll'}
                        </span>
                      </div>
                    </div>
                    <div className={`overflow-hidden rounded-lg border border-gray-400 dark:border-zinc-700 bg-white dark:bg-zinc-900 transition-opacity ${tickerHidden ? 'opacity-50' : 'opacity-100'}`}>
                      <div className="flex items-center gap-2 p-1.5 min-h-[44px]">
                        <div className="flex shrink-0 items-center gap-1.5 bg-black px-3 py-1.5 text-xs sm:text-sm font-black tracking-wide text-white border-r-2 border-[#B3121B] rounded-xs select-none">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                          </span>
                          <span>{tickerBadgeText || 'બ્રેકિંગ ન્યૂઝ'}</span>
                        </div>

                        {tickerMode === 'single' ? (
                          <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden px-2 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                            <div className="flex items-center gap-2 truncate">
                              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 shrink-0"></span>
                              <span className="truncate">
                                {tickerSourceType === 'custom'
                                  ? customTickerHeadlines.length > 0
                                    ? customTickerHeadlines[previewTickerIndex % customTickerHeadlines.length]?.heading
                                    : 'કસ્ટમ હેડિંગ દાખલ કરો (Enter custom headline below)...'
                                  : selectedTickerArticles.length > 0
                                  ? getTitle(selectedTickerArticles[previewTickerIndex % selectedTickerArticles.length])
                                  : 'નીચેથી આર્ટિકલ્સ પસંદ કરો (Select articles below)...'}
                              </span>
                            </div>
                            {tickerSourceType === 'custom' ? (
                              customTickerHeadlines.length > 0 && (
                                <div className="flex items-center gap-1.5 shrink-0 text-xs text-zinc-400 font-bold">
                                  <span>
                                    {(previewTickerIndex % customTickerHeadlines.length) + 1} / {customTickerHeadlines.length}
                                  </span>
                                </div>
                              )
                            ) : (
                              selectedTickerArticles.length > 0 && (
                                <div className="flex items-center gap-1.5 shrink-0 text-xs text-zinc-400 font-bold">
                                  <span>
                                    {(previewTickerIndex % selectedTickerArticles.length) + 1} / {selectedTickerArticles.length}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="flex-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-medium italic truncate pl-1.5">
                            {allArticles.filter((a) => a.isBreaking).length > 0
                              ? allArticles.filter((a) => a.isBreaking).map((a) => getTitle(a)).slice(0, 5).join('  ●  ')
                              : allArticles.slice(0, 4).map((a) => getTitle(a)).join('  ●  ')}
                          </div>
                        )}
                      </div>
                    </div>
                    {tickerHidden && (
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 mt-2 flex items-center gap-1">
                        <EyeOff className="h-3 w-3" /> Note: Ticker is hidden. When saved, this bar will not show on the website.
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Ticker Content Source (FOR BOTH CONTINUOUS MARQUEE & SINGLE HEADLINE) */}
                <div className="pt-4 border-t border-gray-300 dark:border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <label className="block text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                        3. Ticker Content Source (ટીકર માટે લખાણ અને લિંક પસંદ કરો)
                      </label>
                      <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
                        Choose whether to select existing news articles or manually type custom breaking headlines with links (applies to {tickerMode === 'scroll' ? 'Continuous Marquee Scroll' : 'Single Headline Slider'}).
                      </p>
                    </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#B3121B]/10 text-[#B3121B] border border-[#B3121B]/20 shrink-0">
                        {tickerSourceType === 'custom'
                          ? `${customTickerHeadlines.length} headlines added`
                          : `${selectedTickerArticles.length} articles selected`}
                      </span>
                    </div>

                    {/* Mode Selector Tabs: [ 📰 Select from Articles ] vs [ ✍️ Enter Heading & Link ] */}
                    <div className="flex items-center gap-2 p-1.5 bg-zinc-200/80 dark:bg-zinc-800/90 rounded-2xl border border-zinc-300 dark:border-zinc-700 w-full sm:w-fit mb-4 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setTickerSourceType('articles')}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          tickerSourceType === 'articles'
                            ? 'bg-white dark:bg-zinc-900 text-[#B3121B] shadow-sm'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        <FileText className="h-4 w-4" />
                        <span>આર્ટિકલ્સમાંથી પસંદ કરો (Select Articles / Selected by Admin)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTickerSourceType('custom')}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          tickerSourceType === 'custom'
                            ? 'bg-white dark:bg-zinc-900 text-[#B3121B] shadow-sm'
                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        <PenLine className="h-4 w-4" />
                        <span>હેડિંગ અને લિંક જાતે લખો (Custom Heading & Link)</span>
                      </button>
                    </div>

                    {/* SUB-SECTION A: SELECT ARTICLES FROM DATABASE */}
                    {tickerSourceType === 'articles' ? (
                      <div className="p-4 sm:p-5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 space-y-4">
                        {/* Search box to add articles */}
                        <ArticleSearchBox
                          allArticles={allArticles}
                          excluded={selectedTickerArticles.map((a) => a.id)}
                          placeholder="Search news by title, category or article # to add to slider..."
                          onSelect={handleAddTickerArticle}
                        />

                        {/* List of currently selected ticker articles */}
                        {selectedTickerArticles.length === 0 ? (
                          <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 border-2 border-dashed border-red-300 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/10 rounded-xl p-4">
                            <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                              No articles selected yet for Single Headline Slider.
                            </p>
                            <p className="text-xs mt-1 text-zinc-500">
                              Please search in the box above to select at least 1 or more articles to rotate one-by-one.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 mt-3 max-h-[380px] overflow-y-auto pr-1">
                            {selectedTickerArticles.map((art, idx) => (
                              <div
                                key={art.id}
                                className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xs"
                              >
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-black text-zinc-600 dark:text-zinc-400 shrink-0">
                                  #{idx + 1}
                                </span>

                                <div className="h-10 w-14 relative rounded-md overflow-hidden bg-zinc-100 shrink-0">
                                  <ArticleMedia
                                    src={getArticleImage(art)}
                                    alt={getTitle(art)}
                                    fill
                                    className="object-cover"
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                    {getTitle(art)}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium mt-0.5">
                                    {catName(art.category) && <span>{catName(art.category)}</span>}
                                    {art.publishedAt && <span>• {fmtDate(art.publishedAt)}</span>}
                                  </div>
                                </div>

                                {/* Reorder and Delete buttons */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveTickerArticle(idx, 'up')}
                                    disabled={idx === 0}
                                    title="Move up"
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveTickerArticle(idx, 'down')}
                                    disabled={idx === selectedTickerArticles.length - 1}
                                    title="Move down"
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTickerArticle(idx)}
                                    title="Remove from slider"
                                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* SUB-SECTION B: ENTER CUSTOM HEADING AND LINK */
                      <div className="p-4 sm:p-5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 space-y-4">
                        {/* Input form to add a custom heading & link */}
                        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            <PenLine className="h-4 w-4 text-[#B3121B]" />
                            <span>નવું હેડિંગ અને લિંક ઉમેરો (Add New Headline & Link)</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-7">
                              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                Headline / Heading (મુખ્ય હેડિંગ લખાણ) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={newCustomHeading}
                                onChange={(e) => setNewCustomHeading(e.target.value)}
                                placeholder="દા.ત. બ્રેકિંગ: ગુજરાતમાં ભારે વરસાદને પગલે શાળાઓમાં રજા જાહેર..."
                                className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#B3121B] shadow-2xs"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomHeadline();
                                  }
                                }}
                              />
                            </div>

                            <div className="md:col-span-5">
                              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                Article Link / URL (આર્ટિકલ લિંક અથવા URL)
                              </label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                  <input
                                    type="text"
                                    value={newCustomLink}
                                    onChange={(e) => setNewCustomLink(e.target.value)}
                                    placeholder="દા.ત. /news/slug અથવા https://..."
                                    className="w-full pl-9 pr-3 py-2.5 text-sm font-medium rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#B3121B] shadow-2xs"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCustomHeadline();
                                      }
                                    }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={handleAddCustomHeadline}
                                  disabled={!newCustomHeading.trim()}
                                  className="px-4 py-2.5 rounded-xl bg-[#B3121B] hover:bg-[#900e15] disabled:opacity-40 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>Add</span>
                                </button>
                              </div>
                            </div>
                          </div>
                          <p className="text-[11px] text-zinc-500 font-medium">
                            💡 Tip: Enter the full breaking news sentence and optional link (e.g. website link, internal article page `/news/article-slug`, or external URL).
                          </p>
                        </div>

                        {/* List of custom entered headlines */}
                        {customTickerHeadlines.length === 0 ? (
                          <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 border-2 border-dashed border-red-300 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/10 rounded-xl p-4">
                            <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                              No custom headlines entered yet.
                            </p>
                            <p className="text-xs mt-1 text-zinc-500">
                              Please enter a Headline and Link in the box above and click "Add" to rotate one-by-one in the slider.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 mt-3 max-h-[380px] overflow-y-auto pr-1">
                            {customTickerHeadlines.map((h, idx) => {
                              const isEditing = editingHeadlineId === h.id;

                              if (isEditing) {
                                return (
                                  <div
                                    key={h.id}
                                    className="p-3.5 rounded-xl border-2 border-[#B3121B]/60 bg-red-50/30 dark:bg-zinc-900 shadow-sm space-y-3 transition-all"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[#B3121B] text-[11px] font-black text-white shrink-0">
                                          #{idx + 1}
                                        </span>
                                        <span className="text-xs font-bold text-[#B3121B] dark:text-red-400 flex items-center gap-1">
                                          <Pencil className="h-3.5 w-3.5" /> હેડિંગમાં ફેરફાર કરો (Edit Headline #{idx + 1})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleSaveEditCustomHeadline(h.id)}
                                          disabled={!editingHeadingText.trim()}
                                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#B3121B] hover:bg-[#900e15] disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition shadow-2xs"
                                        >
                                          <Check className="h-3.5 w-3.5" />
                                          <span>Save</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={handleCancelEditCustomHeadline}
                                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer transition"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                          <span>Cancel</span>
                                        </button>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                                      <div className="md:col-span-7">
                                        <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                          Headline / Heading (મુખ્ય હેડિંગ લખાણ) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                          type="text"
                                          value={editingHeadingText}
                                          onChange={(e) => setEditingHeadingText(e.target.value)}
                                          placeholder="Enter headline..."
                                          className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#B3121B] shadow-2xs"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleSaveEditCustomHeadline(h.id);
                                            } else if (e.key === 'Escape') {
                                              e.preventDefault();
                                              handleCancelEditCustomHeadline();
                                            }
                                          }}
                                          autoFocus
                                        />
                                      </div>

                                      <div className="md:col-span-5">
                                        <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                          Article Link / URL (આર્ટિકલ લિંક અથવા URL)
                                        </label>
                                        <div className="relative">
                                          <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                          <input
                                            type="text"
                                            value={editingLinkText}
                                            onChange={(e) => setEditingLinkText(e.target.value)}
                                            placeholder="દા.ત. /news/slug અથવા https://..."
                                            className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#B3121B] shadow-2xs"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSaveEditCustomHeadline(h.id);
                                              } else if (e.key === 'Escape') {
                                                e.preventDefault();
                                                handleCancelEditCustomHeadline();
                                              }
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={h.id}
                                  className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xs hover:border-zinc-300 transition-all"
                                >
                                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-black text-zinc-600 dark:text-zinc-400 shrink-0">
                                    #{idx + 1}
                                  </span>

                                  <div className="h-9 w-9 rounded-lg bg-red-50 dark:bg-red-950/40 text-[#B3121B] flex items-center justify-center shrink-0">
                                    <PenLine className="h-4 w-4" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                      {h.heading}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium mt-0.5">
                                      {h.link ? (
                                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 truncate max-w-[320px]">
                                          <LinkIcon className="h-3 w-3 shrink-0" />
                                          <span className="truncate">{h.link}</span>
                                        </span>
                                      ) : (
                                        <span className="text-zinc-400 italic">No link attached</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Edit, Reorder and Delete buttons */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditCustomHeadline(h)}
                                      title="Edit headline & link (લખાણ કે લિંક સુધારો)"
                                      className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/40 cursor-pointer transition"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveCustomHeadline(idx, 'up')}
                                      disabled={idx === 0}
                                      title="Move up"
                                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition"
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveCustomHeadline(idx, 'down')}
                                      disabled={idx === customTickerHeadlines.length - 1}
                                      title="Move down"
                                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition"
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCustomHeadline(idx)}
                                      title="Remove from slider"
                                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                </div>

                {/* Bottom Save Action Bar */}
                <div className="mt-6 pt-4 border-t border-gray-300 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs sm:text-sm text-zinc-500 font-semibold text-center sm:text-left">
                    All changes will apply immediately to the user-side top Breaking News ticker.
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveTickerBadge}
                    disabled={savingTickerBadge}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] px-8 py-3 text-sm sm:text-base font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/25 disabled:opacity-50 cursor-pointer"
                  >
                    {savingTickerBadge ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingTickerBadge ? 'Saving Settings...' : 'Save Ticker Settings'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════
             ELECTION LIVE BANNER WIDGET MANAGEMENT (ચૂંટણી પરિણામ બેનર)
             ════════════════════════════════════════════════════════════════ */}
          <div className="mb-8 rounded-2xl border border-red-300/80 bg-white p-4 sm:p-6 shadow-sm dark:border-red-950 dark:bg-zinc-900 transition-all">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 dark:border-zinc-800 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <span className="text-2xl">🗳️</span>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                    Election Live Results Banner (ચૂંટણી પરિણામ લાઈવ બેનર)
                  </h3>
                  {electionBannerEnabled ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-400 shrink-0">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      🟢 LIVE ON HOMEPAGE
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 rounded-full border bg-zinc-100 text-zinc-600 border-gray-400 dark:bg-zinc-800 dark:text-zinc-400 shrink-0">
                      ⚪ DISABLED (HIDDEN)
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                  Placed between the Breaking News Ticker and Top Hero Section. Manage party seat counts, party logos, title, and live indicators.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                {/* Toggle Enable/Disable Button */}
                <button
                  type="button"
                  onClick={() => handleToggleElectionBanner(!electionBannerEnabled)}
                  disabled={savingElectionBanner}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer ${
                    electionBannerEnabled
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  {electionBannerEnabled ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Disable Banner (Hide)
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Enable Banner (Show)
                    </>
                  )}
                </button>

                {/* Prominent Save button visible when disabled to confirm disable in DB */}
                {!electionBannerEnabled && (
                  <button
                    type="button"
                    onClick={handleSaveElectionBanner}
                    disabled={savingElectionBanner}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#B3121B] hover:bg-[#8E0E15] text-white shadow-md shadow-[#B3121B]/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingElectionBanner ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingElectionBanner ? 'Saving...' : 'Save (Confirm Disable)'}
                  </button>
                )}
              </div>
            </div>

            {/* If Disabled: Show Informative Card with Save Button to Confirm Disable */}
            {!electionBannerEnabled && (
              <div className="mt-4 p-5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
                    <EyeOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-950 dark:text-red-200">
                      Election Banner Status: Disabled (Hidden from Homepage)
                    </h4>
                    <p className="text-xs text-red-700/80 dark:text-red-400/90 mt-0.5">
                      Click the Save button to confirm and save this setting so the election banner is hidden from all users on the homepage.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveElectionBanner}
                  disabled={savingElectionBanner}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/25 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {savingElectionBanner ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingElectionBanner ? 'Saving...' : 'Save & Confirm Disable (સાચવો)'}
                </button>
              </div>
            )}

            {/* Banner Config Body */}
            {electionBannerEnabled && (
              <div className="space-y-6">
                {/* 1. General Info & Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Banner Title (શીર્ષક)
                    </label>
                    <input
                      type="text"
                      value={electionBannerTitle}
                      onChange={(e) => setElectionBannerTitle(e.target.value)}
                      placeholder="ગુજરાત ચૂંટણી 2026"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm font-semibold"
                    />
                  </div>

                  {/* Total Seats */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Total Seats (કુલ બેઠકો 🪑)
                    </label>
                    <input
                      type="number"
                      value={electionBannerTotalSeats}
                      onChange={(e) => setElectionBannerTotalSeats(e.target.value)}
                      placeholder="182"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm font-semibold"
                    />
                  </div>

                  {/* Majority Target */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Majority Target (બહુમતી માટે 🎯)
                    </label>
                    <input
                      type="number"
                      value={electionBannerMajority}
                      onChange={(e) => setElectionBannerMajority(e.target.value)}
                      placeholder="92"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm font-semibold"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={electionBannerLive}
                        onChange={(e) => setElectionBannerLive(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                      />
                      <span>Show LIVE Red Pulsing Badge</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={electionBannerShowAllPages}
                        onChange={(e) => setElectionBannerShowAllPages(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                      />
                      <span>Show on All Pages (default: Homepage only)</span>
                    </label>
                  </div>
                </div>

                {/* 2. Map / Header Logo Upload */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                        <span>Header Map / Icon Logo (વૈકલ્પિક નકશો / લોગો)</span>
                        {electionBannerMapUrl ? (
                          <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            Custom Uploaded
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            Default Gujarat Map Active
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Upload your custom logo/map from your device, or leave default to use the clean red Gujarat state silhouette.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {electionBannerMapUrl ? (
                        <div className="relative w-12 h-12 rounded-xl border border-zinc-300 dark:border-zinc-600 overflow-hidden shrink-0 bg-white shadow-xs">
                          <Image src={electionBannerMapUrl} alt="Map" fill className="object-contain p-0.5" unoptimized />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-xs">
                          {renderAdminGujaratMap()}
                        </div>
                      )}

                      <div className="flex flex-col gap-1 w-full sm:w-auto">
                        <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-[0.98]">
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingMapIcon ? 'Uploading...' : '📁 Upload Map from Device'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingMapIcon}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadMapIcon(f);
                              e.target.value = '';
                            }}
                          />
                        </label>

                        {electionBannerMapUrl && (
                          <button
                            type="button"
                            onClick={() => setElectionBannerMapUrl('')}
                            className="text-xs text-red-600 hover:underline font-bold text-center"
                          >
                            Reset to Default Gujarat Map
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Optional Manual Map URL input */}
                  <details className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/60 text-[11px] text-zinc-500">
                    <summary className="cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 font-semibold select-none">
                      🔗 Or enter map image URL manually (વૈકલ્પિક URL)
                    </summary>
                    <div className="mt-1.5">
                      <input
                        type="text"
                        value={electionBannerMapUrl || ''}
                        onChange={(e) => setElectionBannerMapUrl(e.target.value)}
                        placeholder="https://example.com/map.png"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 font-mono"
                      />
                    </div>
                  </details>
                </div>

                {/* 3. Parties & Seats Counters */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-zinc-900 dark:text-white">
                        Parties & Seat Counts (રાજકીય પક્ષો અને બેઠકોની સંખ્યા)
                      </h4>
                      <p className="text-xs text-zinc-500">
                        Upload custom logos directly from your mobile/PC device or use built-in party symbols. All updates appear immediately on the homepage.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddParty}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold shadow-xs hover:opacity-90 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Party (નવો પક્ષ)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {electionParties.map((party, idx) => (
                      <div
                        key={party.id || idx}
                        className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 shadow-xs space-y-3"
                      >
                        {/* Header: Party Index & Delete */}
                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 text-[10px] font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-black text-zinc-900 dark:text-white truncate">
                              {party.nameGu || party.name || `Party #${idx + 1}`}
                            </span>
                          </div>

                          {electionParties.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveParty(idx)}
                              className="text-zinc-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
                              title="Delete Party"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Party Logo Box: Prominent Device Upload */}
                        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wide">
                              Party Logo
                            </label>
                            {party.logoUrl ? (
                              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                Uploaded
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                Built-in Logo
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5">
                            {/* Visual Logo Preview */}
                            <div className="relative w-12 h-12 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-xs">
                              {party.logoUrl ? (
                                <Image src={party.logoUrl.replace(/\.avif(\?.*)?$/i, '.png$1')} alt={party.name} fill className="object-contain p-1" unoptimized />
                              ) : (
                                renderAdminPartyLogo(party)
                              )}
                            </div>

                            {/* Prominent Upload from Device Button */}
                            <div className="flex-1 space-y-1">
                              <label className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold shadow-xs cursor-pointer transition-all active:scale-[0.98]">
                                <Upload className="w-3.5 h-3.5" />
                                {uploadingPartyLogoIdx === idx ? 'Uploading...' : 'Upload from Device'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={uploadingPartyLogoIdx === idx}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleUploadPartyLogo(f, idx);
                                    e.target.value = '';
                                  }}
                                />
                              </label>

                              {party.logoUrl && (
                                <button
                                  type="button"
                                  onClick={() => handlePartyChange(idx, 'logoUrl', '')}
                                  className="w-full text-center text-[10px] text-zinc-500 hover:text-red-600 font-semibold py-0.5 transition-colors"
                                >
                                  Reset to built-in logo
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Optional manual URL input (collapsed by default) */}
                          <details className="pt-1 text-[10px] text-zinc-500">
                            <summary className="cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 font-semibold select-none flex items-center gap-1">
                              <span>🔗 Or enter image URL manually</span>
                            </summary>
                            <div className="mt-1.5">
                              <input
                                type="text"
                                value={party.logoUrl || ''}
                                onChange={(e) => handlePartyChange(idx, 'logoUrl', e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 text-[10px] text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 font-mono truncate"
                              />
                            </div>
                          </details>
                        </div>

                        {/* Party Name */}
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">Party Name</label>
                          <input
                            type="text"
                            value={party.nameGu || party.name}
                            onChange={(e) => handlePartyChange(idx, 'name', e.target.value)}
                            placeholder="BJP"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold bg-zinc-50 dark:bg-zinc-900 focus:bg-white focus:border-red-500 transition-colors"
                          />
                        </div>

                        {/* Seats Count */}
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">Seats Count (બેઠકો)</label>
                          <input
                            type="number"
                            value={party.seats}
                            onChange={(e) => handlePartyChange(idx, 'seats', Number(e.target.value))}
                            placeholder="100"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm font-black text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-900 focus:bg-white focus:border-red-500 transition-colors"
                          />
                        </div>

                        {/* Live Details (જીત / આગે / પાછળ) */}
                        <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center justify-between">
                            <span>Live Details</span>
                            <span className="text-[9px] text-zinc-400 font-normal">જીત / આગે / પાછળ</span>
                          </label>
                          <div className="grid grid-cols-3 gap-1.5 mt-1">
                            <div>
                              <span className="text-[9px] font-bold text-zinc-400 block text-center">જીત</span>
                              <input
                                type="number"
                                value={party.won !== undefined ? party.won : ''}
                                onChange={(e) => handlePartyChange(idx, 'won', e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="82"
                                className="w-full px-1.5 py-1 text-center rounded border border-zinc-200 dark:border-zinc-700 text-xs font-bold bg-zinc-50 dark:bg-zinc-900 focus:bg-white focus:border-red-500"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-zinc-400 block text-center">આગે</span>
                              <input
                                type="number"
                                value={party.leads !== undefined ? party.leads : ''}
                                onChange={(e) => handlePartyChange(idx, 'leads', e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="18"
                                className="w-full px-1.5 py-1 text-center rounded border border-zinc-200 dark:border-zinc-700 text-xs font-bold bg-zinc-50 dark:bg-zinc-900 focus:bg-white focus:border-red-500"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-zinc-400 block text-center">પાછળ</span>
                              <input
                                type="number"
                                value={party.trailing !== undefined ? party.trailing : ''}
                                onChange={(e) => handlePartyChange(idx, 'trailing', e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="0"
                                className="w-full px-1.5 py-1 text-center rounded border border-zinc-200 dark:border-zinc-700 text-xs font-bold bg-zinc-50 dark:bg-zinc-900 focus:bg-white focus:border-red-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Live Visual Preview */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Live Preview (કેવું દેખાશે):</span>
                    <span className="text-[10px] text-zinc-400 font-normal">Real-time simulation of user homepage</span>
                  </div>
                  <div className="w-full bg-white dark:bg-zinc-950 border border-red-200 dark:border-red-950/60 rounded-2xl p-3 shadow-xs overflow-x-auto">
                    <div className="flex items-center gap-4 min-w-max">
                      {/* Left: Map + Title */}
                      <div className="flex items-center gap-3 pr-4 border-r-2 border-red-200 dark:border-red-950">
                        {electionBannerMapUrl ? (
                          <div className="relative w-9 h-9">
                            <Image src={electionBannerMapUrl} alt="Map" fill className="object-contain" unoptimized />
                          </div>
                        ) : (
                          renderAdminGujaratMap()
                        )}
                        <div>
                          <div className="text-xs font-black text-gray-900 dark:text-gray-100">{electionBannerTitle}</div>
                          {electionBannerLive && (
                            <span className="inline-block bg-red-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                              ● LIVE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Parties */}
                      <div className="flex items-center gap-2.5">
                        {electionParties.map((p, i) => {
                          const nameLower = ((p.name || p.nameGu || '') + '').toLowerCase();
                          const seatsNum = Number(p.seats) || 0;
                          let won = p.won;
                          let leads = p.leads;
                          let trailing = p.trailing !== undefined && p.trailing !== '' ? p.trailing : 0;
                          if (won === undefined || won === '' || leads === undefined || leads === '') {
                            if (nameLower.includes('bjp') || nameLower.includes('ભાજપ')) {
                              won = 82; leads = 18; trailing = 0;
                            } else if (nameLower.includes('cong') || nameLower.includes('કોંગ્રેસ')) {
                              won = 38; leads = 17; trailing = 0;
                            } else if (nameLower.includes('aap') || nameLower.includes('આપ')) {
                              won = 8; leads = 7; trailing = 0;
                            } else if (nameLower.includes('અન્ય') || nameLower.includes('oth')) {
                              won = 6; leads = 6; trailing = 0;
                            } else {
                              won = Math.round(seatsNum * 0.7);
                              leads = Math.max(0, seatsNum - Number(won));
                              trailing = 0;
                            }
                          }
                          const isBjp = nameLower.includes('bjp') || nameLower.includes('ભાજપ');
                          const wonColor = isBjp ? 'text-red-600' : 'text-blue-600';

                          return (
                            <div key={i} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-2.5 shadow-2xs min-w-[130px] flex flex-col justify-between">
                              <div className="flex items-center gap-2">
                                {p.logoUrl ? (
                                  <div className="relative w-8 h-8 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden shrink-0">
                                    <Image src={p.logoUrl.replace(/\.avif(\?.*)?$/i, '.png$1')} alt={p.name} fill className="object-contain p-0.5" unoptimized />
                                  </div>
                                ) : (
                                  <div className="scale-90 origin-center shrink-0">
                                    {renderAdminPartyLogo(p)}
                                  </div>
                                )}
                                <div>
                                  <div className="text-[11px] text-gray-700 dark:text-zinc-300 font-bold leading-tight">{p.nameGu || p.name}</div>
                                  <div className="text-base font-black text-gray-950 dark:text-gray-100 leading-none mt-0.5">{p.seats}</div>
                                </div>
                              </div>
                              <div className="border-t border-gray-100 dark:border-zinc-800 my-1.5" />
                              <div className="grid grid-cols-3 text-center text-[10px]">
                                <div>
                                  <span className="text-gray-500 block text-[9px] font-bold">જીત</span>
                                  <span className={`font-black ${wonColor}`}>{won}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[9px] font-bold">આગે</span>
                                  <span className="font-black text-blue-600">{leads}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block text-[9px] font-bold">પાછળ</span>
                                  <span className="font-black text-red-500">{trailing}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800"></div>

                      {/* Total */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-base">🪑</span>
                        <div>
                          <div className="text-[9px] text-gray-500 dark:text-zinc-400 font-bold">કુલ બેઠકો</div>
                          <div className="text-xs font-black text-gray-900 dark:text-gray-100">{electionBannerTotalSeats}</div>
                        </div>
                      </div>

                      {/* Majority */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-base">🎯</span>
                        <div>
                          <div className="text-[9px] text-gray-500 dark:text-zinc-400 font-bold">બહુમતી માટે</div>
                          <div className="text-xs font-black text-gray-900 dark:text-gray-100">{electionBannerMajority}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Bottom Save Action Bar */}
                <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs sm:text-sm text-zinc-500 font-semibold text-center sm:text-left">
                    Click Save to immediately publish all election counts and settings live to the user homepage.
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveElectionBanner}
                    disabled={savingElectionBanner}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] px-8 py-3 text-sm sm:text-base font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/25 disabled:opacity-50 cursor-pointer"
                  >
                    {savingElectionBanner ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingElectionBanner ? 'Saving Election Banner...' : 'Save Election Banner'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════
             TV BREAKING NEWS SHOWCASE BANNER (ટીવી બ્રેકિંગ ન્યૂઝ બેનર)
             ════════════════════════════════════════════════════════════════ */}
          <div className="mb-8 rounded-2xl border-2 border-red-500/80 bg-white p-4 sm:p-6 shadow-sm dark:border-red-600 dark:bg-zinc-900 transition-all">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 dark:border-zinc-800 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <span className="text-2xl">🚨</span>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                    TV Breaking News Showcase (ટીવી બ્રેકિંગ ન્યૂઝ બેનર)
                  </h3>
                  {breakingBannerEnabled ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border bg-red-50 text-red-700 border-red-400 dark:bg-red-950/40 dark:border-red-700 dark:text-red-400 shrink-0">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      🔴 LIVE ON HOMEPAGE
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 rounded-full border bg-zinc-100 text-zinc-600 border-gray-400 dark:bg-zinc-800 dark:text-zinc-400 shrink-0">
                      ⚪ DISABLED (HIDDEN)
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                  Placed between Election Banner and Hero Section. Displays an image on the left with sequentially transitioning headlines on the right (Text 1 → Text 2 → Text 3 → Next Image).
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggleBreakingBanner(!breakingBannerEnabled)}
                  disabled={savingBreakingBanner}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer ${
                    breakingBannerEnabled
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  {breakingBannerEnabled ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Disable Showcase (Hide)
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Enable Showcase (Show)
                    </>
                  )}
                </button>

                {!breakingBannerEnabled && (
                  <button
                    type="button"
                    onClick={handleSaveBreakingBanner}
                    disabled={savingBreakingBanner}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#B3121B] hover:bg-[#8E0E15] text-white shadow-md shadow-[#B3121B]/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingBreakingBanner ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingBreakingBanner ? 'Saving...' : 'Save (Confirm Disable)'}
                  </button>
                )}
              </div>
            </div>

            {/* If Disabled */}
            {!breakingBannerEnabled && (
              <div className="mt-4 p-5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0 text-red-600 dark:text-red-400">
                    <EyeOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-950 dark:text-red-200">
                      TV Breaking News Showcase: Disabled (Hidden from Homepage)
                    </h4>
                    <p className="text-xs text-red-700/80 dark:text-red-400/90 mt-0.5">
                      Enable this feature to display high-impact TV broadcast style breaking news with sequential multi-text animation above the Hero section.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveBreakingBanner}
                  disabled={savingBreakingBanner}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/25 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {savingBreakingBanner ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingBreakingBanner ? 'Saving...' : 'Save & Confirm (સાચવો)'}
                </button>
              </div>
            )}

            {/* If Enabled */}
            {breakingBannerEnabled && (
              <div className="space-y-6">
                {/* 1. Badge Text & Speed Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Badge Label / Header (હેડર બેજ લખાણ)
                    </label>
                    <input
                      type="text"
                      value={breakingBannerBadgeText}
                      onChange={(e) => setBreakingBannerBadgeText(e.target.value)}
                      placeholder="દા.ત. BREAKING NEWS અથવા બ્રેકિંગ ન્યૂઝ"
                      className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm font-bold text-zinc-900 dark:text-white focus:border-red-500 focus:outline-hidden"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['BREAKING NEWS', 'બ્રેકિંગ ન્યૂઝ', 'લાઈવ સમાચાર', 'ખાસ અહેવાલ', 'LIVE UPDATES'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setBreakingBannerBadgeText(s)}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border transition cursor-pointer ${
                            breakingBannerBadgeText === s
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-red-400'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Headline Transition Speed (દરેક મુદ્દાનો સમયગાળો)
                    </label>
                    <select
                      value={breakingBannerInterval}
                      onChange={(e) => setBreakingBannerInterval(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm font-bold text-zinc-900 dark:text-white focus:border-red-500 focus:outline-hidden"
                    >
                      <option value={3}>3 સેકન્ડ (ઝડપી સ્પીડ - 3 Seconds)</option>
                      <option value={4}>4 સેકન્ડ (સામાન્ય ભલામણ - 4 Seconds Recommended)</option>
                      <option value={5}>5 સેકન્ડ (મધ્યમ સ્પીડ - 5 Seconds)</option>
                      <option value={6}>6 સેકન્ડ (ધીમી સ્પીડ - 6 Seconds)</option>
                    </select>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      દરેક લાઈન આટલા સમય માટે સ્ક્રીન પર રહેશે અને પછી આપમેળે આગળનો મુદ્દો / સ્લાઇડ આવશે.
                    </p>
                  </div>
                </div>

                {/* 2. Slides Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <span>🖼️</span> Breaking News Slides (સ્લાઇડ્સ અને મુદ્દાઓનું લિસ્ટ)
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        દરેક સ્લાઇડમાં ૧ તસવીર (ડાબી બાજુ) અને ૧ થી વધુ મુદ્દા/હેડલાઇન્સ (જમણી બાજુ) સેટ કરો.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddBreakingSlide}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      નવી સ્લાઇડ ઉમેરો (Add Slide)
                    </button>
                  </div>

                  {/* List of slides */}
                  <div className="space-y-4">
                    {breakingSlides.map((slide, sIdx) => (
                      <div
                        key={slide.id || sIdx}
                        className="p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 space-y-4"
                      >
                        {/* Slide Top Bar */}
                        <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-zinc-800 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white text-xs font-black">
                              {sIdx + 1}
                            </span>
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">
                              સ્લાઇડ #{sIdx + 1}
                            </span>
                            <span className="text-xs text-zinc-500">
                              ({(slide.texts || []).length} મુદ્દાઓ)
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleMoveBreakingSlide(sIdx, 'up')}
                              disabled={sIdx === 0}
                              title="Move up"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveBreakingSlide(sIdx, 'down')}
                              disabled={sIdx === breakingSlides.length - 1}
                              title="Move down"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer transition"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveBreakingSlide(sIdx)}
                              disabled={breakingSlides.length <= 1}
                              title="Delete slide"
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 cursor-pointer transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Image & Link configuration */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                          {/* Image Box (Left) */}
                          <div className="lg:col-span-5 space-y-2">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                              <span>તસવીર (Slide Image)</span>
                              {slide.image && (
                                <button
                                  type="button"
                                  onClick={() => handleSlideChange(sIdx, 'image', '')}
                                  className="text-[10px] text-red-600 hover:underline cursor-pointer"
                                >
                                  હટાવો (Remove)
                                </button>
                              )}
                            </label>

                            <div className="flex items-center gap-3">
                              {/* Thumbnail preview */}
                              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-gray-300 dark:border-zinc-700 bg-black flex items-center justify-center">
                                {slide.image ? (
                                  <Image
                                    src={slide.image}
                                    alt="Slide preview"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="text-center p-1">
                                    <ImageIcon className="h-6 w-6 text-zinc-500 mx-auto" />
                                    <span className="text-[9px] text-zinc-500">No Image</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 space-y-1.5">
                                {/* Upload button */}
                                <label className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 active:scale-95 transition cursor-pointer shadow-xs">
                                  <Upload className="h-3.5 w-3.5" />
                                  <span>{uploadingSlideImgIdx === sIdx ? 'અપલોડ થઈ રહ્યું છે...' : 'તસવીર અપલોડ કરો'}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingSlideImgIdx === sIdx}
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleUploadSlideImage(f, sIdx);
                                      e.target.value = '';
                                    }}
                                  />
                                </label>

                                <input
                                  type="text"
                                  value={slide.image || ''}
                                  onChange={(e) => handleSlideChange(sIdx, 'image', e.target.value)}
                                  placeholder="અથવા Image URL પેસ્ટ કરો"
                                  className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-900 dark:text-white focus:border-red-500 focus:outline-hidden"
                                />
                              </div>
                            </div>

                            {/* Optional link */}
                            <div className="pt-1 space-y-1">
                              <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                                <LinkIcon className="h-3 w-3" />
                                <span>આર્ટિકલ લિંક / URL (વૈકલ્પિક - Optional Link)</span>
                              </label>
                              <input
                                type="text"
                                value={slide.link || ''}
                                onChange={(e) => handleSlideChange(sIdx, 'link', e.target.value)}
                                placeholder="દા.ત. /news/article-slug અથવા https://..."
                                className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-900 dark:text-white focus:border-red-500 focus:outline-hidden"
                              />
                            </div>
                          </div>

                          {/* Multi-Headline Texts (Right) */}
                          <div className="lg:col-span-7 space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                હેડલાઇન લખાણ / મુદ્દાઓ (Sequential Headline Texts)
                              </label>
                              <button
                                type="button"
                                onClick={() => handleAddSlideText(sIdx)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                              >
                                <Plus className="h-3 w-3" />
                                <span>નવો મુદ્દો ઉમેરો (Add Text Point)</span>
                              </button>
                            </div>

                            <div className="space-y-2">
                              {(slide.texts || []).map((txt, tIdx) => (
                                <div key={tIdx} className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-700 text-[11px] font-black text-zinc-700 dark:text-zinc-300">
                                    {tIdx + 1}
                                  </span>

                                  <input
                                    type="text"
                                    value={txt}
                                    onChange={(e) => handleSlideTextChange(sIdx, tIdx, e.target.value)}
                                    placeholder={`મુદ્દો #${tIdx + 1} નું લખાણ લખો...`}
                                    className="flex-1 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white focus:border-red-500 focus:outline-hidden"
                                  />

                                  <div className="flex items-center gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveSlideText(sIdx, tIdx, 'up')}
                                      disabled={tIdx === 0}
                                      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                                      title="Up"
                                    >
                                      <ArrowUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveSlideText(sIdx, tIdx, 'down')}
                                      disabled={tIdx === (slide.texts || []).length - 1}
                                      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                                      title="Down"
                                    >
                                      <ArrowDown className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSlideText(sIdx, tIdx)}
                                      disabled={(slide.texts || []).length <= 1}
                                      className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-20 cursor-pointer"
                                      title="Remove text"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Live Interactive Admin Preview */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📺</span>
                      <h4 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white">
                        Live Admin Preview (યુઝર સાઇડ કેવું દેખાશે તેનું લાઈવ પ્રિવ્યુ)
                      </h4>
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      લાઈવ એનિમેશન ચાલુ છે
                    </span>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-black/40 p-2 sm:p-4">
                    <BreakingNewsShowcase
                      previewMode={true}
                      previewConfig={{
                        enabled: true,
                        badgeText: breakingBannerBadgeText,
                        intervalSeconds: breakingBannerInterval,
                        slides: breakingSlides,
                      }}
                    />
                  </div>
                </div>

                {/* 4. Bottom Save Action Bar */}
                <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs sm:text-sm text-zinc-500 font-semibold text-center sm:text-left">
                    Click Save to immediately publish the TV Breaking News Showcase Banner live to the user homepage.
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveBreakingBanner}
                    disabled={savingBreakingBanner}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] px-8 py-3 text-sm sm:text-base font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/25 disabled:opacity-50 cursor-pointer"
                  >
                    {savingBreakingBanner ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingBreakingBanner ? 'Saving Breaking Banner...' : 'Save Breaking News Banner (સાચવો)'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════
             MAIN HERO GRID (9 POSITIONS MANAGEMENT - AUTO VS MANUAL)
             ════════════════════════════════════════════════════════════════ */}
          <div className="mb-8 rounded-2xl border border-gray-400 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-400 pb-4 dark:border-zinc-700 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                    Top Main Hero Grid (9 Article Positions) (મુખ્ય હેરો ગ્રીડ - માત્ર 9 આર્ટિકલ્સ)
                  </h3>
                  {heroGridMode === 'manual' ? (
                    <span className="text-sm font-bold px-3 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-400 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300 shrink-0">
                      🖊️ MANUAL ({heroGridArticles.length} / 9 Article{heroGridArticles.length === 1 ? '' : 's'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-400 shrink-0">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      🔄 AUTO LIVE (9 Latest News)
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-medium mt-1.5">
                  Manage the top homepage Hero Grid (strictly 9 articles: 3 in Spotlight Slider on the left + 6 in Middle Column on the right). The 3 bottom cards below are a completely separate section. Choose between <strong>Automatic Mode</strong> (all 9 positions filled automatically with latest published news) or <strong>Manual Mode</strong> (manually choose and order exact articles: add 1 article to show ONLY 1 spotlight card; 2 articles to show ONLY 2; 3 articles to show ONLY 3; or configure up to 9 articles).
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveHeroGrid}
                  disabled={savingHeroGrid}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/20 disabled:opacity-50 cursor-pointer"
                >
                  {savingHeroGrid ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingHeroGrid ? 'Saving Hero Grid...' : 'Save Hero Grid Settings'}
                </button>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="mb-6 p-4 rounded-xl border border-gray-400 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
              <p className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                Hero Grid Display Mode (હેરો ગ્રીડ મોડ પસંદ કરો)
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Auto Mode Option */}
                <button
                  type="button"
                  onClick={() => setHeroGridMode('auto')}
                  className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    heroGridMode === 'auto'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/10'
                      : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10'
                  }`}
                >
                  <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                    heroGridMode === 'auto' ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-400 dark:border-zinc-500'
                  }`}>
                    {heroGridMode === 'auto' && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-black flex items-center gap-2 ${
                      heroGridMode === 'auto' ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'
                    }`}>
                      🔄 Automatic Mode (સ્વયંસંચાલિત)
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">DEFAULT</span>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                      Automatically fills ONLY the 9 hero grid positions from latest news in database (3 rotating in Spotlight Slider + 6 in Middle Column). When a new article is posted, it automatically shifts in at Position #1.
                    </p>
                  </div>
                </button>

                {/* Manual Mode Option */}
                <button
                  type="button"
                  onClick={() => {
                    setHeroGridMode('manual');
                    if (heroGridArticles.length === 0) {
                      setHeroGridArticles(allArticles.slice(0, 9));
                    }
                  }}
                  className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    heroGridMode === 'manual'
                      ? 'border-[#B3121B] bg-red-50 dark:bg-red-950/20 shadow-md shadow-[#B3121B]/10'
                      : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-[#B3121B]/50 hover:bg-red-50/50 dark:hover:bg-red-950/10'
                  }`}
                >
                  <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                    heroGridMode === 'manual' ? 'border-[#B3121B] bg-[#B3121B]' : 'border-zinc-400 dark:border-zinc-500'
                  }`}>
                    {heroGridMode === 'manual' && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-black ${
                      heroGridMode === 'manual' ? 'text-[#B3121B]' : 'text-zinc-800 dark:text-zinc-200'
                    }`}>
                      🖊️ Manual Mode (મેન્યુઅલ સિલેક્શન - મહત્તમ 9 આર્ટિકલ્સ)
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                      Automatic articles are completely hidden. Pick exactly which articles to show (up to 9): 1 article shows only 1 static spotlight card, 2 articles shows 2, 3 articles shows 3, up to 9 articles.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* ── Auto Mode Live Preview ── */}
            {heroGridMode === 'auto' && (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-sm font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Live Auto-Feed Active (ટોપ 9 ઓટોમેટિક આર્ટિકલ્સ)
                  </p>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 ml-auto bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                    9 Articles Auto-Managed from DB
                  </span>
                </div>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mb-4 font-medium">
                  The homepage hero section automatically displays the latest 9 published articles in real-time. Positions #1, #8, #9 are in the Spotlight Slider (rotating with 1/3 badge), and positions #2 to #7 are the 6 image cards in the middle column.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {allArticles.slice(0, 3).map((art, idx) => (
                    <div key={art.id || idx} className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                      <div className="relative w-full aspect-[16/10] bg-zinc-100 dark:bg-zinc-800">
                        <ArticleMedia src={getArticleImage(art)} alt={getTitle(art)} className="object-cover" />
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-xs">
                            {idx === 0 ? 'SPOTLIGHT #1' : `MIDDLE CARD #${idx}`}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                          {getTitle(art)}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">
                          {catName(art.category)} · {fmtDate(art.publishedAt ?? art.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHeroGridMode('manual');
                    setHeroGridArticles(allArticles.slice(0, 9));
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border border-emerald-400 bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                >
                  🖊️ Switch to Manual Mode using current 9 articles
                </button>
              </div>
            )}

            {/* ── Manual Mode Configuration ── */}
            {heroGridMode === 'manual' && (
              <div className="space-y-4">
                {/* Dynamic Status / Behavior Hint */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  heroGridArticles.length === 1
                    ? 'border-blue-300 bg-blue-50/80 dark:border-blue-800 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                    : heroGridArticles.length === 2
                    ? 'border-indigo-300 bg-indigo-50/80 dark:border-indigo-800 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
                    : heroGridArticles.length === 3
                    ? 'border-purple-300 bg-purple-50/80 dark:border-purple-800 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200'
                    : heroGridArticles.length >= 4 && heroGridArticles.length <= 7
                    ? 'border-teal-300 bg-teal-50/80 dark:border-teal-800 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200'
                    : heroGridArticles.length === 8
                    ? 'border-cyan-300 bg-cyan-50/80 dark:border-cyan-800 dark:bg-cyan-950/30 text-cyan-900 dark:text-cyan-200'
                    : heroGridArticles.length === 9
                    ? 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                    : 'border-amber-300 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                }`}>
                  <span className="text-xl">
                    {heroGridArticles.length === 1 ? '🎯' : heroGridArticles.length === 2 ? '👥' : heroGridArticles.length === 3 ? '🎠' : heroGridArticles.length >= 4 ? '📌' : '⚠️'}
                  </span>
                  <div>
                    <p className="text-sm font-black">
                      {heroGridArticles.length === 0 && 'No Articles Added Yet (કૃપા કરીને નીચેથી આર્ટિકલ ઉમેરો)'}
                      {heroGridArticles.length === 1 && 'Single Article Mode (માત્ર 1 આર્ટિકલ મોડ - સ્પોટલાઇટ સ્લાઇડ 1)'}
                      {heroGridArticles.length === 2 && '2 Articles Mode (2 આર્ટિકલ્સ મોડ - 2 સ્પોટલાઇટ સ્લાઇડ્સ)'}
                      {heroGridArticles.length === 3 && '3 Articles Mode (3 આર્ટિકલ્સ મોડ - 3 સ્પોટલાઇટ સ્લાઇડ્સ)'}
                      {heroGridArticles.length >= 4 && heroGridArticles.length <= 8 && `${heroGridArticles.length} Articles Mode (3 સ્પોટલાઇટ સ્લાઇડ્સ + ${heroGridArticles.length - 3} મિડલ કાર્ડ્સ)`}
                      {heroGridArticles.length === 9 && 'Full 9 Articles Mode (સંપૂર્ણ 9 આર્ટિકલ્સ મોડ - 3 સ્પોટલાઇટ સ્લાઇડ્સ + 6 મિડલ કાર્ડ્સ)'}
                    </p>
                    <p className="text-xs mt-1 font-medium leading-relaxed">
                      {heroGridArticles.length === 0 && 'Automatic articles are hidden. Add 1, 2, 3, or more articles below (maximum 9). If saved with 0 articles, it safely falls back to latest news.'}
                      {heroGridArticles.length === 1 && 'The homepage hero section displays Position #1 in the Spotlight Slider. Middle column is hidden.'}
                      {heroGridArticles.length === 2 && 'The homepage hero section displays Positions #1 and #2 as 2 rotating slides in the Spotlight Slider.'}
                      {heroGridArticles.length === 3 && 'The homepage hero section displays Positions #1, #2, and #3 as 3 rotating slides in the Spotlight Slider.'}
                      {heroGridArticles.length >= 4 && heroGridArticles.length <= 8 && `Displays Positions #1, #2, #3 in the Spotlight Slider, and Positions #4 to #${heroGridArticles.length} in the Middle Column.`}
                      {heroGridArticles.length === 9 && 'Displays Positions #1, #2, #3 as 3 rotating slides in the Spotlight Slider (in exact latest order: 1, 2, 3), and Positions #4 to #9 as all 6 Middle Column image cards.'}
                    </p>
                  </div>
                </div>

                {/* Quick Toolbar: Search + Quick Populate + Clear */}
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3.5 border border-gray-400 dark:border-zinc-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      ➕ Add Article to Hero Grid (આર્ટિકલ સર્ચ કરો અને ઉમેરો - મહત્તમ 9)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHeroGridArticles(allArticles.slice(0, 9))}
                        className="text-xs font-bold px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition cursor-pointer"
                      >
                        📋 Fill Latest 9
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroGridArticles([])}
                        className="text-xs font-bold px-2.5 py-1 rounded bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 transition cursor-pointer"
                      >
                        🗑️ Clear All
                      </button>
                    </div>
                  </div>
                  {heroGridArticles.length >= 9 ? (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                      <span>🔒 Maximum 9 articles reached for this section.</span>
                      <span className="text-[11px] font-normal">To replace an article, remove one below first.</span>
                    </div>
                  ) : (
                    <ArticleSearchBox
                      allArticles={allArticles}
                      excluded={heroGridArticles.map((a) => a.id)}
                      maxLimit={100}
                      placeholder={`Search latest 100 articles by title or #articleNumber to add (${9 - heroGridArticles.length} slot${9 - heroGridArticles.length === 1 ? '' : 's'} remaining)...`}
                      onSelect={(art) => handleAddHeroGridArticle(art)}
                    />
                  )}
                </div>

                {/* Grid List of Positions */}
                {heroGridArticles.length === 0 ? (
                  <div className="text-center py-8 rounded-xl border border-dashed border-gray-400 dark:border-zinc-700 text-zinc-400">
                    <p className="text-sm font-bold">No manual articles selected yet.</p>
                    <p className="text-xs text-zinc-500 mt-1">Search above to add 1, 2, 3, or up to 9 articles for the hero section.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {heroGridArticles.map((art, index) => {
                      const isSpotlightSlide = index < 3;
                      const isMiddleCard = index >= 3 && index < 9;

                      const slotTitle = isSpotlightSlide
                        ? `🌟 Spotlight Slider (Slide #${index + 1} of 3)`
                        : isMiddleCard
                          ? `🖼️ Middle Column - Card #${index - 2} of 6`
                          : `📰 Position #${index + 1}`;

                      const isDragging = draggedHeroIndex === index;

                      return (
                        <div
                          key={art.id}
                          draggable
                          onDragStart={(e) => handleHeroDragStart(e, index)}
                          onDragOver={(e) => handleHeroDragOver(e, index)}
                          onDragEnd={handleHeroDragEnd}
                          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                            isDragging ? 'opacity-40 scale-[0.98] border-dashed border-[#B3121B]' : ''
                          } ${
                            isSpotlightSlide
                              ? 'border-[#B3121B]/40 bg-red-50/40 dark:bg-red-950/10'
                              : 'border-blue-400 bg-blue-50/20 dark:border-blue-900/40 dark:bg-blue-950/10'
                          } hover:shadow-md`}
                        >
                          {/* Left Info */}
                          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1 w-full">
                            <div className="flex items-center gap-2 shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 mt-0.5 sm:mt-0" title="Drag to reorder position">
                              <GripVertical className="h-4 sm:h-5 w-4 sm:w-5" />
                              <span className={`h-7 sm:h-8 w-7 sm:w-8 shrink-0 rounded-full flex items-center justify-center text-xs sm:text-sm font-black text-white ${
                                isSpotlightSlide ? 'bg-[#B3121B]' : 'bg-blue-600'
                              }`}>
                                #{index + 1}
                              </span>
                            </div>

                            <div className="relative h-12 w-16 sm:h-14 sm:w-20 shrink-0 rounded-lg overflow-hidden bg-zinc-100 border border-gray-400 dark:border-zinc-700 shadow-2xs">
                              <ArticleMedia src={getArticleImage(art)} alt="" className="object-cover" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                                  isSpotlightSlide
                                    ? 'bg-red-100 text-[#B3121B]'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {slotTitle}
                                </span>
                                {art.articleNumber && (
                                  <span className="text-[10px] sm:text-xs font-bold text-[#B3121B] bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-400 dark:border-red-800">
                                    #{art.articleNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug mt-1">
                                {getTitle(art)}
                              </p>
                              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-semibold mt-1 truncate">
                                {catName(art.category)} • {authorName(art.author)} {(art.publishedAt || art.createdAt) && `• ${fmtDate(art.publishedAt || art.createdAt)}`}
                              </p>
                            </div>
                          </div>

                          {/* Right Controls */}
                          <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 border-gray-400 dark:border-zinc-800/80 pt-2.5 sm:pt-0">
                            <button
                              type="button"
                              onClick={() => moveHeroGridArticle(index, -1)}
                              disabled={index === 0}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg border border-gray-400 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                              title="Move Up 1 Position"
                            >
                              ⬆️ Move Up
                            </button>
                            <button
                              type="button"
                              onClick={() => moveHeroGridArticle(index, 1)}
                              disabled={index === heroGridArticles.length - 1}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg border border-gray-400 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                              title="Move Down 1 Position"
                            >
                              ⬇️ Move Down
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveHeroGridArticle(art.id)}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-red-600 rounded-lg border border-red-400 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                              title="Remove from Hero Grid"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* ════════════════════════════════════════════════════════════════
             BOTTOM ROW 3 IMAGE CARDS MANAGEMENT
             ════════════════════════════════════════════════════════════════ */}
          <div className="mb-8 rounded-2xl border border-gray-400 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-400 pb-4 dark:border-zinc-700 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <span className="text-2xl">📌</span>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                    Bottom Row 3 Image Cards (હરોળના 3 ઈમેજ કાર્ડ્સ - અલગ સેક્શન)
                  </h3>
                  {bottomSlotsMode === 'manual' && (
                    <span className="text-sm font-bold px-3 py-1 rounded-full border bg-zinc-100 text-zinc-700 border-gray-400 dark:bg-zinc-800 dark:text-zinc-300 shrink-0">
                      {usedIds.length} / 3 Cards Selected
                    </span>
                  )}
                  {bottomSlotsMode === 'auto' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-400 shrink-0">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      AUTO LIVE
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-medium mt-1.5">
                  {bottomSlotsMode === 'auto'
                    ? '🔄 Auto Mode: These 3 bottom cards appear directly below the 9-article hero grid. They automatically show the next latest articles from the API and update instantly when new articles are published.'
                    : '🖊️ Manual Mode: Pick specific articles for each of the 3 bottom image cards that appear directly below the 9-article hero grid.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveBottomSlots}
                disabled={savingBottomSlots}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/20 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {savingBottomSlots ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingBottomSlots ? 'Saving...' : bottomSlotsMode === 'auto' ? 'Save Auto Mode' : 'Save Manual Cards'}
              </button>
            </div>

            {/* ── Mode Toggle ── */}
            <div className="mb-6 p-4 rounded-xl border border-gray-400 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
              <p className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Display Mode</p>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Auto Mode Option */}
                <button
                  type="button"
                  onClick={() => setBottomSlotsMode('auto')}
                  className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    bottomSlotsMode === 'auto'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/10'
                      : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10'
                  }`}
                >
                  <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                    bottomSlotsMode === 'auto' ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-400 dark:border-zinc-500'
                  }`}>
                    {bottomSlotsMode === 'auto' && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-black flex items-center gap-2 ${
                      bottomSlotsMode === 'auto' ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'
                    }`}>
                      🔄 Auto Mode
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">RECOMMENDED</span>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                      Articles update automatically — the 3 latest published articles from the API are shown. No manual selection needed.
                    </p>
                  </div>
                </button>

                {/* Manual Mode Option */}
                <button
                  type="button"
                  onClick={() => setBottomSlotsMode('manual')}
                  className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    bottomSlotsMode === 'manual'
                      ? 'border-[#B3121B] bg-red-50 dark:bg-red-950/20 shadow-md shadow-[#B3121B]/10'
                      : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-[#B3121B]/50 hover:bg-red-50/50 dark:hover:bg-red-950/10'
                  }`}
                >
                  <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                    bottomSlotsMode === 'manual' ? 'border-[#B3121B] bg-[#B3121B]' : 'border-zinc-400 dark:border-zinc-500'
                  }`}>
                    {bottomSlotsMode === 'manual' && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-black ${
                      bottomSlotsMode === 'manual' ? 'text-[#B3121B]' : 'text-zinc-800 dark:text-zinc-200'
                    }`}>
                      🖊️ Manual Mode
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                      Hand-pick exactly which articles appear in each card position. Articles stay fixed until you change them manually.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* ── Auto Mode Preview ── */}
            {bottomSlotsMode === 'auto' && (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Live Auto-Feed Preview</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium ml-auto">Showing latest 3 articles from API</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[allArticles[9] || allArticles[0], allArticles[10] || allArticles[1], allArticles[11] || allArticles[2]].map((art, idx) => art ? (
                    <div key={art.id} className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
                      <div className="relative w-full aspect-[16/9] bg-zinc-100 dark:bg-zinc-800">
                        <ArticleMedia src={getArticleImage(art)} alt={getTitle(art)} className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                            AUTO #{idx + 1}
                          </span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                          {getTitle(art)}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">
                          {catName(art.category)} · {fmtDate(art.publishedAt ?? art.createdAt)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 p-6 flex items-center justify-center">
                      <p className="text-xs text-emerald-600 dark:text-emerald-500 font-semibold">Article #{idx + 10} loading...</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-emerald-600 dark:text-emerald-500 font-medium text-center">
                  ✅ These articles update automatically whenever new content is published. No action required.
                </p>
              </div>
            )}

            {/* ── Manual Mode Card Slots ── */}
            {bottomSlotsMode === 'manual' && (
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
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════
             POPULAR NEWS 12 POSITIONS MANAGEMENT (લોકપ્રિય સમાચાર)
             ════════════════════════════════════════════════════════════════ */}
          <div className="mb-8 rounded-2xl border border-gray-400 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-400 pb-4 dark:border-zinc-700 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <span className="text-2xl">🔥</span>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                    Popular News Slider (લોકપ્રિય સમાચાર)
                  </h3>
                  <span className="text-sm font-bold px-3 py-1 rounded-full border bg-amber-50 text-amber-800 border-amber-400 dark:bg-amber-950/40 dark:border-amber-800 shrink-0">
                    {popularNewsArticles.length} / 12 Positions
                  </span>
                </div>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-medium mt-1.5">
                  Manage the 12 articles displayed in the &quot;લોકપ્રિય સમાચાર&quot; (Popular News) slider on the homepage. Use Move Up / Move Down or Drag &amp; Drop to change exact rank #1 to #12.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSavePopularNews}
                disabled={savingPopularNews}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/20 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {savingPopularNews ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingPopularNews ? 'Saving Popular News...' : 'Save Popular News 12 Positions'}
              </button>
            </div>

            {/* Quick Article Search to Add Position */}
            <div className="mb-6 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3.5 border border-gray-400 dark:border-zinc-700">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
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
                <div className="rounded-xl border border-dashed border-gray-400 dark:border-zinc-700 p-6 text-center text-sm text-zinc-400">
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
                      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border border-gray-400 bg-white dark:border-zinc-700 dark:bg-zinc-900/80 transition-all hover:border-[#B3121B]/40 cursor-grab active:cursor-grabbing select-none ${isDragging ? 'opacity-40 scale-[0.98] border-dashed border-[#B3121B]' : ''
                        } hover:shadow-md`}
                    >
                      {/* Left Info */}
                      <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1 w-full">
                        <div className="flex items-center gap-2 shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 mt-0.5 sm:mt-0" title="Drag to reorder rank">
                          <GripVertical className="h-4 sm:h-5 w-4 sm:w-5" />
                          <span className="h-7 sm:h-8 w-7 sm:w-8 shrink-0 rounded-full flex items-center justify-center text-xs sm:text-sm font-black text-white bg-[#B3121B]">
                            #{idx + 1}
                          </span>
                        </div>

                        <div className="relative h-12 w-16 sm:h-14 sm:w-20 shrink-0 rounded-lg overflow-hidden bg-zinc-100 border border-gray-400 dark:border-zinc-700 shadow-2xs">
                          <ArticleMedia src={getArticleImage(art)} alt="" className="object-cover" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                              Popular Rank #{idx + 1}
                            </span>
                            {art.articleNumber && (
                              <span className="text-[10px] sm:text-xs font-bold text-[#B3121B] bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-400 dark:border-red-800">
                                #{art.articleNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug mt-1">
                            {getTitle(art)}
                          </p>
                          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-semibold mt-1 truncate">
                            {catName(art.category)} • {authorName(art.author)} {(art.publishedAt || art.createdAt) && `• ${fmtDate(art.publishedAt || art.createdAt)}`}
                          </p>
                        </div>
                      </div>

                      {/* Right Controls */}
                      <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 border-gray-400 dark:border-zinc-800/80 pt-2.5 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => movePopularArticle(idx, -1)}
                          disabled={idx === 0}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg border border-gray-400 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                          title="Move Up 1 Position"
                        >
                          ⬆️ Move Up
                        </button>
                        <button
                          type="button"
                          onClick={() => movePopularArticle(idx, 1)}
                          disabled={idx === popularNewsArticles.length - 1}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg border border-gray-400 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                          title="Move Down 1 Position"
                        >
                          ⬇️ Move Down
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePopularNewsArticle(art.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-red-600 rounded-lg border border-red-400 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
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
             MOST READ 10 POSITIONS MANAGEMENT (સૌથી વધુ વંચાયેલા - ટોપ 10)
             ════════════════════════════════════════════════════════════════ */}
          <div className="mb-8 rounded-2xl border border-gray-400 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-400 pb-4 dark:border-zinc-700 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <span className="text-2xl">🔥</span>
                  <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                    Most Read 10 Positions (સૌથી વધુ વંચાયેલા)
                  </h3>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border shrink-0 ${
                    mostReadMode === 'auto'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-400 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300'
                  }`}>
                    {mostReadMode === 'auto' ? '⚡ Auto Mode (Top 10 Past 7 Days)' : `${mostReadArticles.length} / 10 Positions (Manual)`}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-medium mt-1.5">
                  Manage the Top 10 articles displayed in the &quot;સૌથી વધુ વંચાયેલા&quot; (Most Read) sidebar widget on the homepage. Toggle between Automatic (past 7 days most read) or Manual (admin-curated positions #1 to #10).
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveMostRead}
                disabled={savingMostRead}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#8E0E15] transition shadow-md shadow-[#B3121B]/20 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {savingMostRead ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingMostRead ? 'Saving Most Read...' : 'Save Most Read Settings'}
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="mb-6 p-4 rounded-xl border border-gray-400 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
              <p className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                Most Read Display Mode (સૌથી વધુ વંચાયેલા મોડ પસંદ કરો)
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Auto Mode Option */}
                <button
                  type="button"
                  onClick={() => setMostReadMode('auto')}
                  className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    mostReadMode === 'auto'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/10'
                      : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10'
                  }`}
                >
                  <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                    mostReadMode === 'auto' ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-400 dark:border-zinc-500'
                  }`}>
                    {mostReadMode === 'auto' && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-black flex items-center gap-2 ${
                      mostReadMode === 'auto' ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'
                    }`}>
                      ⚡ Automatic Mode (છેલ્લા ૭ દિવસના સૌથી વધુ વંચાયેલા)
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">DEFAULT</span>
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                      આજના દિવસથી પાછલા ૭ દિવસ (છેલ્લા ૧ અઠવાડિયા) ના સૌથી વધુ વંચાયેલા ૧૦ સમાચાર ડેટાબેઝના વ્યુઝ કાઉન્ટના આધારે ઓટોમેટિકલી રેન્ક #1 થી #10 પર ગોઠવાય છે અને દર અઠવાડિયે આપમેળે બદલાય છે.
                    </p>
                  </div>
                </button>

                {/* Manual Mode Option */}
                <button
                  type="button"
                  onClick={() => {
                    setMostReadMode('manual');
                    if (mostReadArticles.length === 0 && autoMostReadArticles.length > 0) {
                      setMostReadArticles(autoMostReadArticles.slice(0, 10));
                    }
                  }}
                  className={`flex-1 flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    mostReadMode === 'manual'
                      ? 'border-[#B3121B] bg-red-50 dark:bg-red-950/20 shadow-md shadow-[#B3121B]/10'
                      : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 hover:border-[#B3121B]/50 hover:bg-red-50/50 dark:hover:bg-red-950/10'
                  }`}
                >
                  <div className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                    mostReadMode === 'manual' ? 'border-[#B3121B] bg-[#B3121B]' : 'border-zinc-400 dark:border-zinc-500'
                  }`}>
                    {mostReadMode === 'manual' && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-black ${
                      mostReadMode === 'manual' ? 'text-[#B3121B]' : 'text-zinc-800 dark:text-zinc-200'
                    }`}>
                      ✍️ Manual Mode (મેન્યુઅલ કસ્ટમાઇઝેશન - ૧૦ પોઝિશન્સ)
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                      એડમિન પોતાની પસંદગી મુજબ કોઈપણ ૧૦ સમાચાર સર્ચ કરીને રેન્ક #1 થી #10 પર ગોઠવી શકે છે. ઉપર-નીચે ખસેડી અથવા ડ્રેગ કરીને ક્રમ બદલી શકાય છે.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* ── Auto Mode Live Preview ── */}
            {mostReadMode === 'auto' && (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 sm:p-5 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-emerald-200 dark:border-emerald-800/80 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-sm font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      Live Auto-Feed Active (છેલ્લા ૭ દિવસના ટોપ 10 સમાચાર)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (autoMostReadArticles.length > 0) {
                        setMostReadArticles(autoMostReadArticles.slice(0, 10));
                      }
                      setMostReadMode('manual');
                      showToast('Loaded 10 Auto articles into Manual Editor. You can now reorder or adjust.', true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-400 text-emerald-800 dark:text-emerald-200 bg-white dark:bg-emerald-950 hover:bg-emerald-100 transition cursor-pointer self-start sm:self-auto"
                  >
                    📋 Load These 10 Into Manual Editor
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(autoMostReadArticles.length > 0 ? autoMostReadArticles : mostReadArticles).slice(0, 10).map((art, idx) => (
                    <div
                      key={`auto-read-${art.id || idx}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-white/90 dark:bg-zinc-900/90 gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-black text-white bg-emerald-600">
                          #{idx + 1}
                        </span>
                        <div className="relative h-10 w-14 shrink-0 rounded-md overflow-hidden bg-zinc-100 border border-emerald-200 dark:border-emerald-800">
                          <ArticleMedia src={getArticleImage(art)} alt="" className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                              Rank #{idx + 1}
                            </span>
                            {art.views !== undefined && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                👁️ {art.views || 0} Views
                              </span>
                            )}
                            {art.articleNumber && (
                              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                #{art.articleNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                            {getTitle(art)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 hidden sm:inline">
                        ✓ Auto Ranked
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Manual Mode Controls ── */}
            {mostReadMode === 'manual' && (
              <>
                {/* Quick Article Search to Add Position */}
                <div className="mb-6 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3.5 border border-gray-400 dark:border-zinc-700">
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                    ➕ Add Article to Most Read 10 Positions (સૌથી વધુ વંચાયેલા)
                  </p>
                  <ArticleSearchBox
                    allArticles={allArticles}
                    excluded={mostReadArticles.map((a) => a.id)}
                    maxLimit={100}
                    placeholder={mostReadArticles.length >= 10 ? '[ Limit 10 reached — remove an article to add new ]' : 'Search latest 100 articles by title or #articleNumber to add to Most Read...'}
                    onSelect={(art) => handleAddMostReadArticle(art)}
                  />
                </div>

                {/* List of 10 Most Read Positions */}
                <div className="space-y-3">
                  {mostReadArticles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-400 dark:border-zinc-700 p-6 text-center text-sm text-zinc-400">
                      No articles assigned. Default top read articles from database will be displayed automatically.
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
                          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 sm:p-4 rounded-xl border border-gray-400 bg-white dark:border-zinc-700 dark:bg-zinc-900/80 transition-all hover:border-[#B3121B]/40 cursor-grab active:cursor-grabbing select-none ${isDragging ? 'opacity-40 scale-[0.98] border-dashed border-[#B3121B]' : ''
                            } hover:shadow-md`}
                        >
                          {/* Left Info */}
                          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1 w-full">
                            <div className="flex items-center gap-2 shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 mt-0.5 sm:mt-0" title="Drag to reorder rank">
                              <GripVertical className="h-4 sm:h-5 w-4 sm:w-5" />
                              <span className="h-7 sm:h-8 w-7 sm:w-8 shrink-0 rounded-full flex items-center justify-center text-xs sm:text-sm font-black text-white bg-[#B3121B]">
                                #{idx + 1}
                              </span>
                            </div>

                            <div className="relative h-12 w-16 sm:h-14 sm:w-20 shrink-0 rounded-lg overflow-hidden bg-zinc-100 border border-gray-400 dark:border-zinc-700 shadow-2xs">
                              <ArticleMedia src={getArticleImage(art)} alt="" className="object-cover" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                  Most Read Rank #{idx + 1}
                                </span>
                                {art.views !== undefined && (
                                  <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                                    👁️ {art.views || 0} Views
                                  </span>
                                )}
                                {art.articleNumber && (
                                  <span className="text-[10px] sm:text-xs font-bold text-[#B3121B] bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-400 dark:border-red-800">
                                    #{art.articleNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug mt-1">
                                {getTitle(art)}
                              </p>
                              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-semibold mt-1 truncate">
                                {catName(art.category)} • {authorName(art.author)} {(art.publishedAt || art.createdAt) && `• ${fmtDate(art.publishedAt || art.createdAt)}`}
                              </p>
                            </div>
                          </div>

                          {/* Right Controls */}
                          <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 border-gray-400 dark:border-zinc-800/80 pt-2.5 sm:pt-0">
                            <button
                              type="button"
                              onClick={() => moveMostReadArticle(idx, -1)}
                              disabled={idx === 0}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg border border-gray-400 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                              title="Move Up 1 Position"
                            >
                              ⬆️ Move Up
                            </button>
                            <button
                              type="button"
                              onClick={() => moveMostReadArticle(idx, 1)}
                              disabled={idx === mostReadArticles.length - 1}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-lg border border-gray-400 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                              title="Move Down 1 Position"
                            >
                              ⬇️ Move Down
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMostReadArticle(art.id)}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-red-600 rounded-lg border border-red-400 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
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
              </>
            )}
          </div>
          <div className="mt-8 rounded-2xl border border-gray-400 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-400 pb-4 dark:border-zinc-700 mb-5 gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">Trending Topics (Trending વિષયો)</h3>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${trendingTopics.length >= 8 ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700' : 'bg-zinc-100 text-zinc-600 border-gray-400 dark:bg-zinc-800 dark:text-zinc-300'} shrink-0`}>
                      {trendingTopics.length} / 8 Max
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-medium mt-1">Maximum 8 trending topic pills allowed. If you want to add a new topic, remove an existing topic first.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetTopics}
                className="text-sm font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer self-start sm:self-auto"
              >
                Reset Defaults
              </button>
            </div>

            {/* List of current topic pills */}
            <div className="flex flex-wrap gap-2.5 mb-6">
              {trendingTopics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-base font-bold text-zinc-800 border border-gray-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 shadow-xs"
                >
                  <span className="text-[#B3121B] font-black">#</span> {topic}
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(topic)}
                    className="ml-1 text-zinc-400 hover:text-red-500 focus:outline-none cursor-pointer"
                    title="Remove topic"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add new topic tag input & Dedicated Save Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-400 dark:border-zinc-700">
              <div className="flex items-center gap-2 w-full sm:max-w-lg flex-1">
                <input
                  type="text"
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTopic(); } }}
                  placeholder={trendingTopics.length >= 8 ? '[ Limit 8 reached — remove a topic to add new ]' : '[ Enter new topic, e.g. વડોદરા ]'}
                  disabled={trendingTopics.length >= 8}
                  className="flex-1 rounded-xl border border-gray-400 bg-zinc-50 px-4 py-3 text-base font-bold text-zinc-900 focus:border-[#B3121B] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-white placeholder:text-base"
                />
                <button
                  type="button"
                  onClick={handleAddTopic}
                  disabled={trendingTopics.length >= 8}
                  className="shrink-0 rounded-xl bg-zinc-900 px-5 py-3 text-base font-bold text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                >
                  + Add Topic
                </button>
              </div>

              {/* Dedicated Save Trending Topics Button */}
              <button
                type="button"
                onClick={handleSaveTrendingTopics}
                disabled={savingTopics}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] hover:bg-[#B3121B]/90 px-6 py-3 text-sm sm:text-base font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingTopics ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Trending Topics</span>
              </button>
            </div>
          </div>

          {/* Managing Fact Check News Section (ફેક્ટ ચેક ન્યૂઝ Slider) */}
          <div className="mt-8 rounded-2xl border border-gray-400 bg-white p-4 sm:p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-400 pb-4 dark:border-zinc-700 mb-5 gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">Fact Check News Slider (ફેક્ટ ચેક ન્યૂઝ)</h3>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${trendingNewsArticles.length >= 10 ? 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700' : 'bg-zinc-100 text-zinc-600 border-gray-400 dark:bg-zinc-800 dark:text-zinc-300'} shrink-0`}>
                      {trendingNewsArticles.length} / 10 Max
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-medium mt-1">Select up to 10 articles to feature in the horizontal Fact Check News (ફેક્ટ ચેક ન્યૂઝ) slider on the homepage.</p>
                </div>
              </div>

              {/* Dedicated Save Fact Check News Button */}
              <button
                type="button"
                onClick={handleSaveTrendingNews}
                disabled={savingTrendingNews}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] hover:bg-[#B3121B]/90 px-6 py-3 text-sm sm:text-base font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {savingTrendingNews ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Fact Check News</span>
              </button>
            </div>

            {/* Article Search Box for Fact Check News */}
            <div className="mb-5">
              <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                + Add Article to Fact Check News Slider
              </label>
              <ArticleSearchBox
                placeholder={trendingNewsArticles.length >= 10 ? '[ Limit 10 reached — remove an article to add new ]' : 'Search published articles by title, article #, or category to add to Fact Check News...'}
                onSelect={(art) => handleAddTrendingNewsArticle(art)}
                excluded={trendingNewsArticles.map((a) => a.id)}
                allArticles={allArticles}
              />
            </div>

            {/* Current Selected Fact Check News Articles Grid */}
            {trendingNewsArticles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-400 dark:border-zinc-700 p-8 text-center text-sm text-zinc-400">
                No articles assigned. Default top Fact Check articles will be displayed automatically.
              </div>
            ) : (
              <>
                <div className="mb-3.5 flex items-center justify-between text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 flex-wrap gap-1">
                  <span className="flex items-center gap-1.5">
                    <GripVertical className="h-4 w-4 text-[#B3121B]" />
                    <span><strong>Drag & Drop</strong> cards to change order, or use <strong>&lt; / &gt; arrows</strong> below cards.</span>
                  </span>
                  <span className="text-xs sm:text-sm text-zinc-400 font-medium">Order 1 to {trendingNewsArticles.length}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                  {trendingNewsArticles.map((art, idx) => (
                    <div
                      key={art.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-3 transition-all duration-150 cursor-grab active:cursor-grabbing group ${draggedIndex === idx
                          ? 'border-[#B3121B] bg-[#B3121B]/10 shadow-xl scale-105 z-20 ring-2 ring-[#B3121B]/40'
                          : 'border-gray-400 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/40 hover:border-[#B3121B]/50 hover:shadow-md'
                        }`}
                    >
                      <div>
                        {/* Thumbnail, Rank Badge & Drag Handle */}
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-zinc-100 mb-2.5">
                          <ArticleMedia src={getArticleImage(art)} alt="" className="object-cover pointer-events-none" />

                          {/* Rank Badge */}
                          <span className="absolute top-1.5 left-1.5 flex h-6 sm:h-7 w-6 sm:w-7 items-center justify-center rounded-full bg-[#B3121B] text-white text-xs sm:text-sm font-black shadow-md z-10 select-none">
                            {idx + 1}
                          </span>

                          {/* Drag Handle Icon Indicator */}
                          <div className="absolute top-1.5 left-8 sm:left-9 flex h-6 sm:h-7 w-6 sm:w-7 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-xs opacity-70 group-hover:opacity-100 transition z-10" title="Click & Drag to reorder">
                            <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveTrendingNewsArticle(art.id); }}
                            className="absolute top-1.5 right-1.5 flex h-6 sm:h-7 w-6 sm:w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-600 transition cursor-pointer z-10"
                            title="Remove from Fact Check News"
                          >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug select-none">
                          {getTitle(art)}
                        </p>
                      </div>

                      {/* Bottom Footer with Article Info & Left/Right Reorder Arrows */}
                      <div className="mt-2.5 flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400 pt-2 border-t border-gray-400 dark:border-zinc-700">
                        <span className="truncate max-w-[65px] sm:max-w-[80px]">{art.articleNumber ? `#${art.articleNumber}` : catName(art.category)}</span>

                        {/* Reorder Buttons (Move Left & Right) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveTrendingArticle(idx, -1); }}
                            disabled={idx === 0}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-[#B3121B] hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-200 disabled:hover:text-zinc-700 transition cursor-pointer"
                            title="Move left/up"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveTrendingArticle(idx, 1); }}
                            disabled={idx === trendingNewsArticles.length - 1}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-[#B3121B] hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-200 disabled:hover:text-zinc-700 transition cursor-pointer"
                            title="Move right/down"
                          >
                            <ChevronRight className="h-4 w-4" />
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
          <div className="mt-6 rounded-xl border border-blue-400 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20 px-4 py-3 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <span className="mt-0.5 shrink-0 inline-flex h-4 w-4 items-center justify-center rounded-full border border-blue-400 text-[10px] font-black">i</span>
            <span><strong>Note:</strong> Main Hero Spotlight Slider, Top Main Hero Grid, Bottom row image cards, Most Read 10 Positions, Trending Topics, and Fact Check News slider articles can all be saved independently using their dedicated <strong>Save</strong> buttons.</span>
          </div>
        </>
      )}
    </div>
  );
}
