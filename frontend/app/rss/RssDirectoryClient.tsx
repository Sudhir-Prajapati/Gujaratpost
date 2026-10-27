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
  Sparkles,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  nameGu: string;
  slug: string;
  descriptionGu?: string;
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
      setTimeout(() => setCopiedSlug(null), 2200);
    } catch {
      window.prompt('Copy feed URL:', url);
    }
  };

  // Filter categories by search input (matches Gujarati name, English name, or slug)
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (cat) =>
        (cat.name && cat.name.toLowerCase().includes(q)) ||
        (cat.nameGu && cat.nameGu.toLowerCase().includes(q)) ||
        (cat.slug && cat.slug.toLowerCase().includes(q))
    );
  }, [categories, search]);

  const mainFeedUrl = `${cleanSiteUrl}/rss.xml`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* ── Header ── */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 mb-3">
                <Radio className="w-3.5 h-3.5 text-orange-500" />
                <span>RSS 2.0 ફીડ્સ</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                ગુજરાત પોસ્ટ RSS ફીડ્સ ડિરેક્ટરી
              </h1>
              <p className="mt-1.5 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl">
                તમારી પસંદગીની કેટેગરીના RSS ફીડ્સ સરળતાથી મેળવો અને તમારા RSS રીડરમાં સબ્સ્ક્રાઇબ કરો.
              </p>
            </div>

            {/* Quick Live Search */}
            <div className="w-full md:w-80">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="કેટેગરી શોધો (Search Category)..."
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
        {/* ── Compact Main All-Stories Feed Strip ── */}
        {!search && (
          <div className="bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-950/60 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Rss className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    સંપૂર્ણ ગુજરાત પોસ્ટ ફીડ (તમામ સમાચારો)
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                    All Stories
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono">
                  {mainFeedUrl}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => copyToClipboard(mainFeedUrl, '__all__')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                  copiedSlug === '__all__'
                    ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-300'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-orange-50 dark:hover:bg-zinc-700 hover:text-orange-600'
                }`}
              >
                {copiedSlug === '__all__' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>URL કૉપિ થઈ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open XML</span>
              </a>
            </div>
          </div>
        )}

        {/* ── Category Header & Count ── */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              કેટેગરી RSS ફીડ્સ
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {filteredCategories.length}
            </span>
          </div>

          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
            >
              બધી કેટેગરીઝ બતાવો
            </button>
          )}
        </div>

        {/* ── Simple Category Cards Grid ── */}
        {filteredCategories.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-12 px-4 text-center">
            <Search className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              "{search}" માટે કોઈ કેટેગરી મળી નથી
            </p>
            <p className="text-xs text-zinc-500 mt-1">બીજો શબ્દ શોધો અથવા સર્ચ ક્લિયર કરો.</p>
            <button
              onClick={() => setSearch('')}
              className="mt-3 px-3.5 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
            >
              સર્ચ ક્લિયર કરો
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredCategories.map((cat) => {
              const feedUrl = `${cleanSiteUrl}/rss/${cat.slug}.xml`;
              const isCopied = copiedSlug === cat.slug;

              return (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-orange-400 dark:hover:border-orange-500/50 hover:shadow-sm transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                        {cat.name}
                      </span>
                      <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-200/50 dark:border-orange-900/50">
                        RSS 2.0
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 transition-colors">
                      {cat.nameGu || cat.name}
                    </h4>

                    <p className="font-mono text-[11px] text-zinc-400 truncate mt-1">
                      /rss/{cat.slug}.xml
                    </p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end gap-2">
                    <button
                      onClick={() => copyToClipboard(feedUrl, cat.slug)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600'
                      }`}
                      title="Copy category RSS feed URL"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>કૉપિ થયું</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`/rss/${cat.slug}.xml`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition flex items-center justify-center cursor-pointer"
                      title="Open XML Feed"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Dailyhunt & Legacy PHP Feeds Compatibility Section ── */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-1.5">
                <span>Dailyhunt & Aggregator Compatibility</span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                ડેઇલીહન્ટ (Dailyhunt) અને લીગસી PHP RSS ફીડ્સ
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                જૂની વેબસાઇટના આ તમામ PHP URLs નવા ડેટાબેઝ અને નવી સિસ્ટમ સાથે 100% ચાલુ રહેશે.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: 'મુખ્ય સમાચાર (General News)', path: '/rss-feed-politics.php?name=news', target: '/rss.xml', desc: 'તમામ સમાચારોની સંપૂર્ણ ફીડ' },
              { name: 'ગુજરાત (Gujarat)', path: '/rss-feed-politics.php?name=gujarat', target: '/rss/gujarat.xml', desc: 'સમગ્ર ગુજરાત રાજ્યના સમાચારો' },
              { name: 'ગાંધીનગર (Gandhinagar)', path: '/rss-feed-politics.php?name=gandhinagar', target: '/rss/gandhinagar.xml', desc: 'પાટનગર ગાંધીનગર સમાચારો' },
              { name: 'અમદાવાદ (Ahmedabad)', path: '/rss-feed-politics.php?name=ahmedabad', target: '/rss/ahmedabad.xml', desc: 'અમદાવાદ મહાનગર સમાચારો' },
              { name: 'સુરત (Surat)', path: '/rss-feed-politics.php?name=surat', target: '/rss/surat.xml', desc: 'સુરત શહેર અને જિલ્લા સમાચારો' },
              { name: 'વડોદરા (Vadodara)', path: '/rss-feed-politics.php?name=vadodara', target: '/rss/vadodara.xml', desc: 'વડોદરા શહેર સમાચારો' },
              { name: 'રાજકોટ (Rajkot)', path: '/rss-feed-politics.php?name=rajkot', target: '/rss/rajkot.xml', desc: 'રાજકોટ અને સૌરાષ્ટ્ર સમાચારો' },
              { name: 'અન્ય શહેરો (Other Cities)', path: '/rss-feed-politics.php?name=others', target: '/rss/other-cities.xml', desc: 'અન્ય શહેરો અને તાલુકા સમાચારો' },
              { name: 'ભારત (National)', path: '/rss-feed-politics.php?name=national', target: '/rss/national.xml', desc: 'દેશભરના રાષ્ટ્રીય સમાચારો' },
              { name: 'વિશ્વ (International)', path: '/rss-feed-politics.php?name=international', target: '/rss/world.xml', desc: 'આંતરરાષ્ટ્રીય વિશ્વ સમાચારો' },
              { name: 'મનોરંજન & લાઇફસ્ટાઇલ', path: '/rss-feed-politics.php?name=entertainment-life-style', target: '/rss/entertainment-life-style.xml', desc: 'બોલીવુડ અને લાઇફસ્ટાઇલ કવરેજ' },
              { name: 'લોકપ્રિય સ્ટોરીઝ (Trending)', path: '/rss-feed-politics.php?name=popular-stories', target: '/rss/trending.xml', desc: 'ટ્રેન્ડિંગ અને પોપ્યુલર સમાચારો' },
              { name: 'રાજનીતિ (Politics)', path: '/rss-feed-politics.php?name=politics', target: '/rss/politics.xml', desc: 'રાજકીય વિશ્લેષણ અને સમાચારો' },
              { name: 'ફેક્ટ ચેક (Fact Check)', path: '/rss-feed-politics.php?name=fact-check', target: '/rss/fact-check.xml', desc: 'સત્ય તપાસ અને વાયરલ ફેક્ટ ચેક' },
              { name: 'ફોટો ગેલેરી (Gallery)', path: '/rss-feed-gallery.php', target: '/rss/photos.xml', desc: 'તસવીરોમાં સમાચાર અને ફોટો ગેલેરી' },
            ].map((feed, idx) => {
              const fullUrl = `${cleanSiteUrl}${feed.path}`;
              const isCopied = copiedSlug === `legacy-${idx}`;

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                        {feed.name}
                      </h4>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                        {feed.target}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 break-all">
                      {feed.path}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end gap-2">
                    <button
                      onClick={() => copyToClipboard(fullUrl, `legacy-${idx}`)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                      }`}
                      title="Copy URL for Dailyhunt"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>કૉપિ થયું</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Legacy URL</span>
                        </>
                      )}
                    </button>

                    <a
                      href={feed.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition flex items-center justify-center cursor-pointer"
                      title="Test live XML feed"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

