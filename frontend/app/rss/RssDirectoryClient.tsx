'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Rss,
  Copy,
  Check,
  ExternalLink,
  Search,
  Sparkles,
  Radio,
  MapPin,
  Flame,
  Globe2,
  TrendingUp,
  Cpu,
  Tv,
  Briefcase,
  ShieldCheck,
  CloudRain,
  Share2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  nameGu: string;
  slug: string;
  descriptionGu?: string;
  group?: string;
}

interface Props {
  categories: CategoryItem[];
  siteUrl: string;
}

export default function RssDirectoryClient({ categories, siteUrl }: Props) {
  const [search, setSearch] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const [cleanSiteUrl, setCleanSiteUrl] = useState(
    siteUrl ? siteUrl.replace(/\/+$/, '') : 'http://localhost:3000'
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setCleanSiteUrl(window.location.origin);
    }
  }, []);

  const copyToClipboard = async (url: string, slugKey: string) => {
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
      setCopiedSlug(slugKey);
      setTimeout(() => setCopiedSlug(null), 2500);
    } catch {
      // Fallback: prompt copy
      window.prompt('Copy feed URL:', url);
    }
  };

  // Curated category groupings with thematic icons
  const CATEGORY_GROUPS = [
    {
      id: 'cities',
      titleGu: 'શહેરો અને હાયપરલોકલ સમાચાર',
      titleEn: 'Cities & Hyperlocal',
      icon: MapPin,
      slugs: ['ahmedabad', 'surat', 'vadodara', 'rajkot', 'gandhinagar', 'other-cities'],
      color: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      id: 'news-politics',
      titleGu: 'ગુજરાત, રાષ્ટ્રીય અને રાજનીતિ',
      titleEn: 'State, National & Politics',
      icon: Globe2,
      slugs: ['gujarat', 'national', 'world', 'politics', 'breaking-news', 'latest-news', 'trending'],
      color: 'text-red-600 dark:text-red-400',
      badgeBg: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    },
    {
      id: 'business-tech',
      titleGu: 'બિઝનેસ, બજારો અને ટેકનોલોજી',
      titleEn: 'Business, Markets & Technology',
      icon: TrendingUp,
      slugs: ['business', 'gold-silver', 'technology', 'jobs', 'education'],
      color: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'special-lifestyle',
      titleGu: 'સ્પોર્ટ્સ, મનોરંજન અને લાઈફસ્ટાઈલ',
      titleEn: 'Sports, Entertainment & Desks',
      icon: Sparkles,
      slugs: ['sports', 'entertainment', 'lifestyle', 'crime', 'health', 'weather', 'varsad', 'fact-check', 'editorial'],
      color: 'text-purple-600 dark:text-purple-400',
      badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
  ];

  // Filtered categories based on search input
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.nameGu.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q)
    );
  }, [categories, search]);

  const mainFeedUrl = `${cleanSiteUrl}/rss.xml`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Top Banner & Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 mb-3">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>RSS 2.0 Feeds & Syndication</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                ગુજરાત પોસ્ટ RSS ફીડ્સ ડિરેક્ટરી
              </h1>
              <p className="mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                ગુજરાત પોસ્ટના દરેક મુખ્ય વિષય, શહેર અને કેટેગરીના તાજા સમાચારો તમારા મનપસંદ RSS Reader માં મફતમાં મેળવો.
              </p>
            </div>

            {/* Live Search Input */}
            <div className="w-full md:w-80">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="કેટેગરી શોધો (Search Category)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* PRIMARY FEED HERO CARD */}
        {!search && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-rose-600 to-amber-600 p-6 sm:p-8 text-white shadow-xl">
            <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Rss className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                    સર્વગ્રાહી ન્યૂઝ સ્ટ્રીમ (All Stories)
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  સંપૂર્ણ ગુજરાત પોસ્ટ RSS ફીડ
                </h2>
                <p className="text-white/80 text-sm max-w-xl">
                  બ્રેકિંગ ન્યૂઝ, રાજ્ય, દેશ-વિદેશ, બિઝનેસ અને રમત-ગમત સહિતના તમામ લાઇવ સમાચારો એક જ મુખ્ય ફીડમાં.
                </p>
                <div className="font-mono text-xs text-white/90 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg inline-block break-all border border-white/10">
                  {mainFeedUrl}
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => copyToClipboard(mainFeedUrl, 'all')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white text-zinc-900 hover:bg-zinc-100 font-bold text-xs sm:text-sm rounded-xl shadow transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                >
                  {copiedSlug === 'all' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>URL કૉપિ થઈ ગઈ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-zinc-700" />
                      <span>Copy Feed URL</span>
                    </>
                  )}
                </button>

                <a
                  href="/rss.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 bg-black/20 hover:bg-black/30 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Feed XML</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* CATEGORY FEEDS SECTION */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                દરેક કેટેગરી મુજબ RSS ફીડ્સ ({filteredCategories.length})
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                તમારી પસંદગીના ચોક્કસ વિષય કે શહેરના RSS ફીડ્સ સબ્સ્ક્રાઇબ કરો.
              </p>
            </div>
            {search && (
              <span className="text-xs text-zinc-400 font-mono">
                Found {filteredCategories.length} categories
              </span>
            )}
          </div>

          {/* Grouped Category Display when not searching */}
          {!search ? (
            <div className="space-y-10">
              {CATEGORY_GROUPS.map((group) => {
                const groupCats = categories.filter((c) => group.slugs.includes(c.slug));
                if (groupCats.length === 0) return null;
                const GroupIcon = group.icon;

                return (
                  <div key={group.id} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${group.badgeBg}`}>
                        <GroupIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                          {group.titleGu}
                        </h4>
                        <span className="text-xs text-zinc-400">{group.titleEn}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupCats.map((cat) => {
                        const feedUrl = `${cleanSiteUrl}/rss/${cat.slug}.xml`;
                        const isCopied = copiedSlug === cat.slug;

                        return (
                          <div
                            key={cat.id}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs hover:border-orange-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${group.badgeBg}`}>
                                  {cat.name}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                  RSS 2.0
                                </span>
                              </div>

                              <h5 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 transition-colors">
                                {cat.nameGu || cat.name}
                              </h5>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                                {cat.name} news real-time updates and articles
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[150px]">
                                /rss/{cat.slug}.xml
                              </span>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => copyToClipboard(feedUrl, cat.slug)}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                                    isCopied
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600'
                                  }`}
                                  title="Copy category RSS feed URL"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                </button>

                                <a
                                  href={`/rss/${cat.slug}.xml`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition"
                                  title="Open XML Feed"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Other Active Categories Not Grouped */}
              {(() => {
                const groupedSlugs = new Set(CATEGORY_GROUPS.flatMap((g) => g.slugs));
                const remaining = categories.filter((c) => !groupedSlugs.has(c.slug));
                if (remaining.length === 0) return null;

                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Rss className="w-4 h-4 text-orange-500" />
                      <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                        અન્ય કેટેગરીઝ (All Other Categories)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {remaining.map((cat) => {
                        const feedUrl = `${cleanSiteUrl}/rss/${cat.slug}.xml`;
                        const isCopied = copiedSlug === cat.slug;

                        return (
                          <div
                            key={cat.id}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs hover:border-orange-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                  {cat.name}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                  RSS 2.0
                                </span>
                              </div>

                              <h5 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 transition-colors">
                                {cat.nameGu || cat.name}
                              </h5>
                            </div>

                            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                              <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[150px]">
                                /rss/{cat.slug}.xml
                              </span>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => copyToClipboard(feedUrl, cat.slug)}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                                    isCopied
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600'
                                  }`}
                                  title="Copy category RSS feed URL"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                </button>

                                <a
                                  href={`/rss/${cat.slug}.xml`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition"
                                  title="Open XML Feed"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Search Results Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.length === 0 ? (
                <div className="col-span-full py-16 text-center text-zinc-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                  <p className="font-semibold">"{search}" માટે કોઈ કેટેગરી મળી નથી</p>
                  <p className="text-xs mt-1">બીજો શબ્દ શોધો અથવા સર્ચ ક્લિયર કરો.</p>
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const feedUrl = `${cleanSiteUrl}/rss/${cat.slug}.xml`;
                  const isCopied = copiedSlug === cat.slug;

                  return (
                    <div
                      key={cat.id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs hover:border-orange-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {cat.name}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            RSS 2.0
                          </span>
                        </div>

                        <h5 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 transition-colors">
                          {cat.nameGu || cat.name}
                        </h5>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[150px]">
                          /rss/{cat.slug}.xml
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => copyToClipboard(feedUrl, cat.slug)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                                : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600'
                            }`}
                            title="Copy category RSS feed URL"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </button>

                          <a
                            href={`/rss/${cat.slug}.xml`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition"
                            title="Open XML Feed"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* HOW TO USE RSS READERS SECTION */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center border border-orange-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                RSS ફીડ્સનો ઉપયોગ કેવી રીતે કરવો? (How to Subscribe)
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500">
                કોઈપણ RSS Reader એપ અથવા સર્વિસમાં ગુજરાત પોસ્ટના સમાચારો મફતમાં મેળવો.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="w-7 h-7 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs mb-3">
                1
              </span>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">URL કૉપિ કરો</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                ઉપર આપેલ કોઈપણ કેટેગરી કે ઓલ-ન્યૂઝ ફીડમાંથી "Copy" બટન દબાવીને XML લિંક કૉપિ કરો.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="w-7 h-7 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs mb-3">
                2
              </span>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">રીડર એપમાં ઉમેરો</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Feedly, Inoreader, Apple News, NetNewsWire અથવા Thunderbird માં "Add Feed / Subscribe" પર પેસ્ટ કરો.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <span className="w-7 h-7 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-xs mb-3">
                3
              </span>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">રીઅલ-ટાઇમ અપડેટ્સ</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                દરેક બ્રેકિંગ સમાચાર સીધા તમારા ફોન કે ડેસ્કટોપ પર કોઈ પણ જાહેરખબર કે વિક્ષેપ વગર વાંચો.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>
                સંપૂર્ણ RSS 2.0, Media RSS (MRSS) અને ETag 304 હાઈ-સ્પીડ કેશિંગ સપોર્ટેડ.
              </span>
            </div>
            <Link
              href="/rss-terms-of-service"
              className="text-orange-600 dark:text-orange-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>RSS સિન્ડિકેશન શરતો (Terms)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
