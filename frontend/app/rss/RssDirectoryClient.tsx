'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Rss,
  Copy,
  Check,
  ExternalLink,
  Search,
  Radio,
  Layers,
} from 'lucide-react';
import { useApp } from '@/components/AppProvider';

interface CategoryItem {
  id: string;
  name: string;
  nameGu: string;
  nameHi?: string;
  slug: string;
  descriptionGu?: string;
  descriptionHi?: string;
  descriptionEn?: string;
}

interface Props {
  categories: CategoryItem[];
  siteUrl: string;
}

const RSS_STRINGS = {
  gu: {
    badge: 'RSS 2.0 & Dailyhunt ફીડ્સ ડિરેક્ટરી',
    title: 'ગુજરાત પોસ્ટ RSS ફીડ્સ ડિરેક્ટરી',
    subtitle:
      'તમારી પસંદગીની કેટેગરીના New RSS URLs અથવા Old Link URLs બંને સરળતાથી કૉપિ કરો અને તમારા ફીડ રીડરમાં સેટ કરો.',
    searchPlaceholder: 'કેટેગરી શોધો (Search Category)...',
    mainFeedTitle: 'સંપૂર્ણ ગુજરાત પોસ્ટ ફીડ (તમામ સમાચારો — All Stories)',
    mainFeedDesc: 'વેબસાઇટના તમામ લેટેસ્ટ પબ્લિશ્ડ સમાચારો આ બંને ફીડ્સમાં સતત અપડેટ થાય છે.',
    mainFeedBadge: 'Main Feed',
    newFormatBadge: 'New Modern Format',
    oldLinkBadge: 'OLD LINK',
    copyNew: 'Copy New URL',
    copyOld: 'Copy Old Link URL',
    copied: 'કૉપિ થઈ ગયું!',
    copiedShort: 'કૉપિ થઈ!',
    openXml: 'XML ફીડ ખોલો',
    openOld: 'જૂની લિંક ફીડ ખોલો',
    categoryFeedsTitle: 'કેટેગરી RSS ફીડ્સ',
    filterBoth: 'બંને URLs (Both)',
    filterNew: 'New XML',
    filterOld: 'Old Link',
    showAll: 'બધા બતાવો',
    noCategoryTitle: (q: string) => `"${q}" માટે કોઈ કેટેગરી મળી નથી`,
    noCategoryDesc: 'બીજો શબ્દ શોધો અથવા સર્ચ ક્લિયર કરો.',
    clearSearch: 'સર્ચ ક્લિયર કરો',
    copyNewShort: 'Copy New',
    copyOldShort: 'Copy Old Link',
  },
  hi: {
    badge: 'RSS 2.0 और Dailyhunt फीड्स डायरेक्टरी',
    title: 'गुजरात पोस्ट RSS फीड्स डायरेक्टरी',
    subtitle:
      'अपनी पसंदीदा कैटेगरी के New RSS URLs या Old Link URLs दोनों आसानी से कॉपी करें और अपने फीड रीडर में सेट करें।',
    searchPlaceholder: 'कैटेगरी खोजें (Search Category)...',
    mainFeedTitle: 'संपूर्ण गुजरात पोस्ट फीड (सभी समाचार — All Stories)',
    mainFeedDesc: 'वेबसाइट के सभी नवीनतम प्रकाशित समाचार इन दोनों फीड्स में लगातार अपडेट होते हैं।',
    mainFeedBadge: 'Main Feed',
    newFormatBadge: 'नया आधुनिक फॉर्मेट',
    oldLinkBadge: 'OLD LINK',
    copyNew: 'Copy New URL',
    copyOld: 'Copy Old Link URL',
    copied: 'कॉपी हो गया!',
    copiedShort: 'कॉपी हुआ!',
    openXml: 'XML फीड खोलें',
    openOld: 'पुरानी लिंक फीड खोलें',
    categoryFeedsTitle: 'कैटेगरी RSS फीड्स',
    filterBoth: 'दोनों URLs (Both)',
    filterNew: 'New XML',
    filterOld: 'Old Link',
    showAll: 'सभी दिखाएं',
    noCategoryTitle: (q: string) => `"${q}" के लिए कोई कैटेगरी नहीं मिली`,
    noCategoryDesc: 'दूसरा शब्द खोजें या खोज साफ़ करें।',
    clearSearch: 'खोज साफ़ करें',
    copyNewShort: 'Copy New',
    copyOldShort: 'Copy Old Link',
  },
  en: {
    badge: 'RSS 2.0 & Dailyhunt Feeds Directory',
    title: 'Gujarat Post RSS Feeds Directory',
    subtitle:
      'Easily copy both New RSS URLs or Old Link URLs for your preferred categories and configure them in your feed reader.',
    searchPlaceholder: 'Search category...',
    mainFeedTitle: 'Complete Gujarat Post Feed (All Stories)',
    mainFeedDesc: 'All latest published articles across the website are updated continuously in both feeds.',
    mainFeedBadge: 'Main Feed',
    newFormatBadge: 'New Modern Format',
    oldLinkBadge: 'OLD LINK',
    copyNew: 'Copy New URL',
    copyOld: 'Copy Old Link URL',
    copied: 'Copied!',
    copiedShort: 'Copied!',
    openXml: 'Open XML Feed',
    openOld: 'Open Old Link Feed',
    categoryFeedsTitle: 'Category RSS Feeds',
    filterBoth: 'Both URLs',
    filterNew: 'New XML',
    filterOld: 'Old Link',
    showAll: 'Show All',
    noCategoryTitle: (q: string) => `No categories found for "${q}"`,
    noCategoryDesc: 'Try searching for a different keyword or clear your search.',
    clearSearch: 'Clear Search',
    copyNewShort: 'Copy New',
    copyOldShort: 'Copy Old Link',
  },
};

function getLegacyFeedPath(slug: string, lang?: string): string {
  const s = (slug || '').trim().toLowerCase();
  const langQuery = lang && lang !== 'gu' ? `lang=${encodeURIComponent(lang)}` : '';

  if (s === 'photos' || s === 'gallery') {
    return langQuery ? `/rss-feed-gallery.php?${langQuery}` : '/rss-feed-gallery.php';
  }

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
    shorts: 'video',
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
  const base = `/rss-feed-politics.php?name=${encodeURIComponent(nameParam)}`;
  return langQuery ? `${base}&${langQuery}` : base;
}

export default function RssDirectoryClient({ categories, siteUrl }: Props) {
  const { language } = useApp();
  const t = RSS_STRINGS[language] || RSS_STRINGS.gu;

  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<'both' | 'new' | 'old'>('both');

  const [cleanSiteUrl, setCleanSiteUrl] = useState(
    siteUrl ? siteUrl.replace(/\/+$/, '') : 'http://localhost:3000'
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setCleanSiteUrl(window.location.origin);
    }
  }, []);

  const copyToClipboard = async (url: string, key: string) => {
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
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      window.prompt('Copy feed URL:', url);
    }
  };

  // Filter categories by search input (matches English name, Gujarati name, Hindi name, or slug)
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (cat) =>
        (cat.name && cat.name.toLowerCase().includes(q)) ||
        (cat.nameGu && cat.nameGu.toLowerCase().includes(q)) ||
        (cat.nameHi && cat.nameHi.toLowerCase().includes(q)) ||
        (cat.slug && cat.slug.toLowerCase().includes(q))
    );
  }, [categories, search]);

  const langQuery = language !== 'gu' ? `?lang=${language}` : '';
  const mainNewFeedPath = `/rss.xml${langQuery}`;
  const mainNewFeedUrl = `${cleanSiteUrl}${mainNewFeedPath}`;

  const mainOldFeedPath = getLegacyFeedPath('home', language);
  const mainOldFeedUrl = `${cleanSiteUrl}${mainOldFeedPath}`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* ── Header ── */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 mb-3">
                <Radio className="w-3.5 h-3.5 text-orange-500" />
                <span>{t.badge}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {t.title}
              </h1>
              <p className="mt-1.5 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl">
                {t.subtitle}
              </p>
            </div>

            {/* Quick Live Search */}
            <div className="w-full md:w-80">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ── Main All-Stories Feed Strip with BOTH New & Old URLs ── */}
        {!search && (
          <div className="bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-950/60 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Rss className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
                    {t.mainFeedTitle}
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                    {t.mainFeedBadge}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {t.mainFeedDesc}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              {/* Option A: New Modern URL */}
              <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-500 text-white">
                      {t.newFormatBadge}
                    </span>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {mainNewFeedPath}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400 truncate">
                    {mainNewFeedUrl}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(mainNewFeedUrl, '__main_new__')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                      copiedKey === '__main_new__'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white dark:bg-zinc-800 border-orange-300 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-zinc-700 text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {copiedKey === '__main_new__' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t.copyNew}</span>
                      </>
                    )}
                  </button>
                  <a
                    href={mainNewFeedPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-orange-300 dark:border-orange-800 bg-white dark:bg-zinc-800 text-orange-600 hover:bg-orange-100 dark:hover:bg-zinc-700 transition flex items-center justify-center cursor-pointer"
                    title={t.openXml}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Option B: Old Link URL */}
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-600 text-white">
                      {t.oldLinkBadge}
                    </span>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {mainOldFeedPath}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400 truncate">
                    {mainOldFeedUrl}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(mainOldFeedUrl, '__main_old__')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                      copiedKey === '__main_old__'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white dark:bg-zinc-800 border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-zinc-700 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {copiedKey === '__main_old__' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t.copyOld}</span>
                      </>
                    )}
                  </button>
                  <a
                    href={mainOldFeedPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-zinc-800 text-blue-600 hover:bg-blue-100 dark:hover:bg-zinc-700 transition flex items-center justify-center cursor-pointer"
                    title={t.openOld}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Category Header, Format Filter & Count ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {t.categoryFeedsTitle}
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {filteredCategories.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Filter Pills */}
            <div className="inline-flex items-center p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-800 text-xs font-medium">
              <button
                onClick={() => setFormatFilter('both')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  formatFilter === 'both'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                {t.filterBoth}
              </button>
              <button
                onClick={() => setFormatFilter('new')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  formatFilter === 'new'
                    ? 'bg-orange-500 text-white font-bold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                {t.filterNew}
              </button>
              <button
                onClick={() => setFormatFilter('old')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  formatFilter === 'old'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                }`}
              >
                {t.filterOld}
              </button>
            </div>

            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-orange-600 dark:text-orange-400 hover:underline cursor-pointer ml-2"
              >
                {t.showAll}
              </button>
            )}
          </div>
        </div>

        {/* ── Category Cards Grid ── */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-12 px-4 text-center">
            <Search className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              {t.noCategoryTitle(search)}
            </p>
            <p className="text-xs text-zinc-500 mt-1">{t.noCategoryDesc}</p>
            <button
              onClick={() => setSearch('')}
              className="mt-3 px-3.5 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              {t.clearSearch}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCategories.map((cat) => {
              const catName =
                language === 'en'
                  ? cat.name
                  : language === 'hi'
                  ? cat.nameHi || cat.name
                  : cat.nameGu || cat.name;

              const catDesc =
                language === 'en'
                  ? cat.descriptionEn || cat.descriptionGu
                  : language === 'hi'
                  ? cat.descriptionHi || cat.descriptionGu
                  : cat.descriptionGu || cat.descriptionEn;

              const newFeedPath = `/rss/${cat.slug}.xml${langQuery}`;
              const newFeedUrl = `${cleanSiteUrl}${newFeedPath}`;

              const legacyPath = getLegacyFeedPath(cat.slug, language);
              const legacyUrl = `${cleanSiteUrl}${legacyPath}`;

              const isCopiedNew = copiedKey === `new-${cat.slug}`;
              const isCopiedOld = copiedKey === `old-${cat.slug}`;

              return (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 hover:border-orange-300 dark:hover:border-zinc-700 hover:shadow-sm transition flex flex-col justify-between gap-4"
                >
                  {/* Top: Category Title & Slug Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-md font-medium">
                        {cat.name}
                      </span>
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded border border-orange-200/60 dark:border-orange-900/50">
                        {cat.slug}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {catName}
                    </h4>
                    {catDesc && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                        {catDesc}
                      </p>
                    )}
                  </div>

                  {/* Feed URL Boxes (New and/or Old depending on filter) */}
                  <div className="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    {/* 1. New RSS URL Row */}
                    {(formatFilter === 'both' || formatFilter === 'new') && (
                      <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-orange-500 text-white leading-none">
                              {t.filterNew}
                            </span>
                            <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300 truncate">
                              {newFeedPath}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => copyToClipboard(newFeedUrl, `new-${cat.slug}`)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                              isCopiedNew
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 text-zinc-700 dark:text-zinc-300'
                            }`}
                            title="Copy New RSS URL"
                          >
                            {isCopiedNew ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>{t.copiedShort}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>{t.copyNewShort}</span>
                              </>
                            )}
                          </button>

                          <a
                            href={newFeedPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-orange-600 hover:border-orange-300 transition flex items-center justify-center cursor-pointer"
                            title={t.openXml}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* 2. Old Link URL Row */}
                    {(formatFilter === 'both' || formatFilter === 'old') && (
                      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white leading-none">
                              {t.oldLinkBadge}
                            </span>
                            <span className="font-mono text-xs text-blue-900 dark:text-blue-300 truncate">
                              {legacyPath}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => copyToClipboard(legacyUrl, `old-${cat.slug}`)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                              isCopiedOld
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white dark:bg-zinc-900 border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950 text-blue-700 dark:text-blue-300'
                            }`}
                            title="Copy Old Link URL"
                          >
                            {isCopiedOld ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>{t.copiedShort}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>{t.copyOldShort}</span>
                              </>
                            )}
                          </button>

                          <a
                            href={legacyPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition flex items-center justify-center cursor-pointer"
                            title={t.openOld}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
