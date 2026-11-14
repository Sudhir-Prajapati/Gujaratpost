'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import type { Article, Language } from '@/types';
import { formatTime } from '@/data';
import { getPublicArticles } from '@/lib/api';
import SidebarAdBanner from '@/components/ads/SidebarAdBanner';
import AdSectionBanner from '@/components/ads/AdSectionBanner';
import ArticleMedia from '@/components/ui/ArticleMedia';
import MobileModernArticleCard from '@/components/ui/MobileModernArticleCard';
import { AutoArticleTitle, AutoArticleExcerpt, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import { stripHtmlTags, DEMO_IMAGES, getMockRelativeTime } from './homeHelpers';

const WORLD_SLUGS = ['world', 'international', 'videsh'];
const WORLD_CATEGORY_IDS = [
  'f7afc75b-6ce9-4e78-942e-569780c4ea25', // World (વિશ્વ)
  'e57b253f-5950-437f-83f0-30532883d3f3', // International
];

function isWorldArticle(art: Article): boolean {
  if (!art) return false;

  // 1. Check primary category ID
  const primaryCatId = (art as any).categoryId || (art as any).category?.id || '';
  if (WORLD_CATEGORY_IDS.includes(primaryCatId)) return true;

  // 2. Check additional category IDs
  if (Array.isArray((art as any).categories)) {
    for (const item of (art as any).categories) {
      const id = item?.id || item?.categoryId || item?.category?.id;
      if (id && WORLD_CATEGORY_IDS.includes(id)) return true;
    }
  }

  // 3. Collect all category tokens (slugs, names, locations)
  const tokens: string[] = [];
  const add = (val: any) => {
    if (typeof val === 'string' && val.trim()) tokens.push(val.toLowerCase().trim());
  };

  add(primaryCatId);
  add((art as any).categorySlug);
  if (typeof art.category === 'string') {
    add(art.category);
  } else if (art.category && typeof art.category === 'object') {
    add((art.category as any).id);
    add((art.category as any).slug);
    add((art.category as any).name);
    add((art.category as any).nameGu);
  }
  add((art as any).categoryName);
  add((art as any).categoryGu);
  add(art.location);

  if (Array.isArray((art as any).categories)) {
    for (const item of (art as any).categories) {
      if (!item) continue;
      add(item.id);
      add(item.categoryId);
      add(item.slug);
      add(item.name);
      add(item.nameGu);
      if (item.category && typeof item.category === 'object') {
        add(item.category.id);
        add(item.category.slug);
        add(item.category.name);
        add(item.category.nameGu);
      }
    }
  }

  return tokens.some((token) =>
    WORLD_SLUGS.includes(token) ||
    token.includes('world') ||
    token.includes('international') ||
    token.includes('વિશ્વ') ||
    token.includes('વિદેશ')
  );
}

function resolveWorldCategoryName(art: any, language: Language = 'gu'): string {
  if (!art) return language === 'en' ? 'World' : language === 'hi' ? 'विश्व' : 'વિશ્વ';

  // Check additional categories first if primary is not world/international
  if (Array.isArray(art.categories)) {
    for (const item of art.categories) {
      const catObj = item.category || item;
      const s = (catObj.slug || '').toLowerCase();
      const n = (catObj.name || '').toLowerCase();
      const gu = catObj.nameGu || '';
      if (s === 'world' || n === 'world' || gu.includes('વિશ્વ')) {
        return language === 'en' ? (catObj.name || 'World') : language === 'hi' ? (catObj.nameHi || 'विश्व') : (gu || 'વિશ્વ');
      }
      if (s === 'international' || n === 'international' || gu.includes('આંતરરાષ્ટ્રીય')) {
        return language === 'en' ? (catObj.name || 'International') : language === 'hi' ? (catObj.nameHi || 'अंतर्राष्ट्रीय') : (gu || 'આંતરરાષ્ટ્રીય');
      }
    }
  }

  const primSlug = (art.categorySlug || art.category?.slug || '').toLowerCase();
  const primName = (art.categoryName || art.category?.name || (typeof art.category === 'string' ? art.category : '') || '').toLowerCase();
  if (primSlug === 'world' || primName === 'world') {
    return language === 'en' ? 'World' : language === 'hi' ? 'विश्व' : 'વિશ્વ';
  }
  if (primSlug === 'international' || primName === 'international') {
    return language === 'en' ? 'International' : language === 'hi' ? 'अंतर्राष्ट्रीय' : 'આંતરરાષ્ટ્રીય';
  }

  return (art as any).categoryGu || (art as any).category?.nameGu || (art as any).category?.name || art.category || (language === 'en' ? 'World' : 'વિશ્વ');
}

function sortWorldArticlesLatest(list: Article[]): Article[] {
  return [...list].sort((a: any, b: any) => {
    const aNum = typeof a?.articleNumber === 'number' ? a.articleNumber : (parseInt(a?.articleNumber, 10) || 0);
    const bNum = typeof b?.articleNumber === 'number' ? b.articleNumber : (parseInt(b?.articleNumber, 10) || 0);
    if (bNum > 0 && aNum > 0 && bNum !== aNum) return bNum - aNum;
    if (bNum > 0 && aNum === 0) return -1;
    if (aNum > 0 && bNum === 0) return 1;
    const aTime = new Date(a?.publishedAt || a?.createdAt || 0).getTime();
    const bTime = new Date(b?.publishedAt || b?.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

/* --- Dynamic Foreign Exchange Rates Widget ──────────────────────────────── */
function CurrencyRatesWidget({ language }: { language: Language }) {
  const [rates, setRates] = useState<Array<{
    symbol: string;
    code: string;
    pair: string;
    nameEn: string;
    nameGu: string;
    nameHi: string;
    rate: number;
    change: number;
    bgColor: string;
    textColor: string;
  }>>([
    { symbol: '$', code: 'USD', pair: 'USD/INR', nameEn: 'US Dollar', nameGu: 'યુએસ ડૉલર', nameHi: 'यूएस डॉलर', rate: 86.85, change: 0.12, bgColor: 'bg-green-500/10', textColor: 'text-green-600' },
    { symbol: '€', code: 'EUR', pair: 'EUR/INR', nameEn: 'Euro', nameGu: 'યુરો', nameHi: 'यूरो', rate: 90.45, change: -0.20, bgColor: 'bg-blue-500/10', textColor: 'text-blue-600' },
    { symbol: 'د.إ', code: 'AED', pair: 'AED/INR', nameEn: 'UAE Dirham', nameGu: 'યુએઈ દિરહામ', nameHi: 'યુએઈ દિરહામ', rate: 23.64, change: -0.05, bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-600' },
    { symbol: 'A$', code: 'AUD', pair: 'AUD/INR', nameEn: 'Australian Dollar', nameGu: 'ઑસ્ટ્રેલિયન ડૉલર', nameHi: 'ऑस्ट्रेलियन डॉलर', rate: 55.48, change: 0.03, bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-600' },
    { symbol: '£', code: 'GBP', pair: 'GBP/INR', nameEn: 'British Pound', nameGu: 'બ્રિટિશ પાઉન્ડ', nameHi: 'ब्रिटिश पाउंड', rate: 108.78, change: 0.00, bgColor: 'bg-amber-500/10', textColor: 'text-amber-600' },
  ]);

  const [lastUpdated, setLastUpdated] = useState<string>('Live');

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.result === 'success' && data.rates && data.rates.INR) {
          const usdInr = data.rates.INR;
          const getInrRate = (currCode: string) => {
            if (currCode === 'USD') return usdInr;
            if (data.rates[currCode]) return usdInr / data.rates[currCode];
            return null;
          };

          setRates((prev) =>
            prev.map((item) => {
              const liveRate = getInrRate(item.code);
              if (liveRate) {
                const diff = liveRate - item.rate;
                return {
                  ...item,
                  rate: Number(liveRate.toFixed(2)),
                  change: Number(diff.toFixed(2)),
                };
              }
              return item;
            })
          );
          setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        }
      })
      .catch(() => {
        // Fallback gracefully to preset exchange rates
      });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between pb-1.5 mb-1.5 select-none border-b border-border/80">
        <span className="text-[#B3121B] font-extrabold text-[15px] md:text-[16px]">
          {language === 'gu' ? '• વિદેશી ચલણ' : language === 'hi' ? '• विदेशी मुद्रा' : '• Foreign Exchange'}
        </span>
        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live {lastUpdated}</span>
        </span>
      </div>
      <div className="border border-border/80 rounded-xl bg-card divide-y divide-border/60 shadow-sm overflow-hidden">
        {rates.slice(0, 5).map((item) => {
          const name = item.nameEn;
          const isUp = item.change > 0;
          const isDown = item.change < 0;

          return (
            <div key={item.code} className="flex items-center justify-between py-1.5 px-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${item.bgColor} ${item.textColor} font-black text-[13px] select-none shrink-0`}>
                  {item.symbol}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[14px] md:text-[15px] font-black leading-tight text-foreground truncate">{name}</span>
                  <span className="text-[10px] md:text-[10.5px] text-muted-foreground font-bold uppercase leading-none mt-0.5">{item.pair}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 md:gap-3 shrink-0">
                <span className="text-[15.5px] md:text-[16.5px] font-black text-foreground tracking-tight">₹{item.rate.toFixed(2)}</span>
                <span className={`text-[12px] md:text-[13px] font-black tracking-tight select-none min-w-[56px] text-right ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {isUp ? `▲ +${item.change.toFixed(2)}` : isDown ? `▼ ${item.change.toFixed(2)}` : '— Stable'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const mockWorldFeatured = {
  id: 'w-feat',
  slug: 'india-major-victory-un-broad-support-proposal-551',
  image: '/assets/demo/8.jpg',
  categoryGu: 'સંયુક્ત રાષ્ટ્ર',
  titleGu: 'ભારતની મોટી જીત! સંયુક્ત રાષ્ટ્રમાં પ્રસ્તાવને વ્યાપક સમર્થન',
  excerptGu: 'મોટાભાગના સભ્ય દેશોએ ભારતના પ્રસ્તાવને ટેકો આપતા આંતરરાષ્ટ્રીય મંચ પર દેશની સ્થિતિ વધુ મજબૂત બની.',
  watermarkGu: 'ગુજરાત પોસ્ટ'
};

const mockWorldCards = [
  {
    id: 'w-card-1',
    slug: 'europe-new-trade-treaty-signed-india-benefits-552',
    image: '/assets/demo/1.jpg',
    categoryGu: 'યુરોપ',
    titleGu: 'યુરોપમાં નવી વ્યાપાર સંધિ પર હસ્તાક્ષર, ભારતને પણ ફાયદો',
    relativeTimeGu: '3 કલાક પહેલાં',
    views: 74000
  },
  {
    id: 'w-card-2',
    slug: 'usa-indian-community-huge-cultural-event-553',
    image: '/assets/demo/3.jpg',
    categoryGu: 'અમેરિકા',
    titleGu: 'અમેરિકામાં ભારતીય સમુદાયનું વિશાળ સાંસ્કૃતિક આયોજન, જુઓ ઝલક',
    relativeTimeGu: '4 કલાક પહેલાં',
    views: 78000
  },
  {
    id: 'w-card-3',
    slug: 'asian-countries-new-economic-partnership-announced-554',
    image: '/assets/demo/2.jpg',
    categoryGu: 'એશિયા',
    titleGu: 'એશિયાઈ દેશો વચ્ચે નવી આર્થિક ભાગીદારીની મોટી જાહેરાત',
    relativeTimeGu: '5 કલાક પહેલાં',
    views: 81000
  },
  {
    id: 'w-card-4',
    slug: 'gulf-countries-indian-workers-welfare-scheme-555',
    image: '/assets/demo/7.jpg',
    categoryGu: 'મધ્ય-પૂર્વ',
    titleGu: 'ગલ્ફ દેશોમાં ભારતીય શ્રમિકો માટે ખુશખબર! નવી કલ્યાણ યોજના જાહેર',
    relativeTimeGu: '6 કલાક પહેલાં',
    views: 90000
  },
  {
    id: 'w-card-5',
    slug: 'global-space-research-breakthrough-india-556',
    image: '/assets/demo/4.jpg',
    categoryGu: 'વિશ્વ',
    titleGu: 'અવકાશ વિજ્ઞાન ક્ષેત્રે ભારતની ઐતિહાસિક સિદ્ધિ, વિશ્વભરમાં પ્રશંસા',
    relativeTimeGu: '7 કલાક પહેલાં',
    views: 85000
  },
  {
    id: 'w-card-6',
    slug: 'global-economic-forum-digital-innovation-557',
    image: '/assets/demo/6.jpg',
    categoryGu: 'વિશ્વ',
    titleGu: 'વૈશ્વિક આર્થિક મંચ પર ભારતનું મોટું સંબોધન, ડિજિટલ ક્ષેત્રે નવી તકો',
    relativeTimeGu: '8 કલાક પહેલાં',
    views: 89000
  }
];

/* --- World Section ("વિશ્વ" Zone) ----------------------------- */
export default function WorldSection({ language, initialArticles }: { language: Language; initialArticles?: Article[] }) {
  const initialWorld = useMemo(() => {
    return sortWorldArticlesLatest((initialArticles || []).filter(isWorldArticle));
  }, [initialArticles]);

  const [dbWorldArticles, setDbWorldArticles] = useState<Article[]>(initialWorld);
  const [loading, setLoading] = useState(initialWorld.length === 0);

  // Sync state if initialArticles prop changes from parent
  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) {
      const filtered = (initialArticles || []).filter(isWorldArticle);
      if (filtered.length > 0) {
        setDbWorldArticles((prev) => {
          const map = new Map<string, Article>();
          prev.forEach((a) => { if (a?.id) map.set(a.id, a); });
          filtered.forEach((a) => { if (a?.id) map.set(a.id, a); });
          return sortWorldArticlesLatest(Array.from(map.values())).slice(0, 10);
        });
      }
    }
  }, [initialArticles]);

  // Always fetch fresh latest articles directly from the API
  const fetchFreshWorldArticles = useCallback(async () => {
    try {
      const [res1, res2] = await Promise.all([
        getPublicArticles({ categorySlug: 'world', sort: 'latest', limit: 10 }).catch(() => null),
        getPublicArticles({ categorySlug: 'international', sort: 'latest', limit: 10 }).catch(() => null),
      ]);
      const fetched = [
        ...(res1?.articles || []),
        ...(res2?.articles || []),
      ];
      if (fetched.length > 0) {
        setDbWorldArticles((prev) => {
          const map = new Map<string, Article>();
          // 1. Newly fetched articles get priority
          fetched.forEach((a) => { if (a?.id) map.set(a.id, a); });
          // 2. Merge with previous state to avoid losing articles
          prev.forEach((a) => { if (a?.id && !map.has(a.id)) map.set(a.id, a); });
          // 3. Merge with initialArticles
          (initialArticles || []).filter(isWorldArticle).forEach((a) => {
            if (a?.id && !map.has(a.id)) map.set(a.id, a);
          });
          const sorted = sortWorldArticlesLatest(Array.from(map.values()));
          return sorted.slice(0, 10);
        });
      }
    } catch {
      // Retain existing articles on network error
    } finally {
      setLoading(false);
    }
  }, [initialArticles]);

  useEffect(() => {
    // Always fetch fresh latest articles from API on client mount to ensure real-time CMS sync
    fetchFreshWorldArticles();

    const handleSync = () => {
      fetchFreshWorldArticles();
    };

    window.addEventListener('gp-articles-updated', handleSync);

    return () => {
      window.removeEventListener('gp-articles-updated', handleSync);
    };
  }, [fetchFreshWorldArticles]);

  const featured = useMemo(() => {
    if (dbWorldArticles.length > 0) {
      const art = dbWorldArticles[0];
      return {
        id: art.id,
        slug: art.slug,
        image: art.image || (art as any).imageUrl || (art as any).featuredImage || DEMO_IMAGES[0],
        categoryGu: resolveWorldCategoryName(art, language),
        article: art as Article,
        titleGu: art.titleGu || art.title,
        excerptGu: art.excerptGu || art.excerpt || '',
        watermarkGu: 'ગુજરાત પોસ્ટ',
      };
    }
    return {
      id: mockWorldFeatured.id,
      slug: mockWorldFeatured.slug,
      image: mockWorldFeatured.image,
      categoryGu: mockWorldFeatured.categoryGu,
      article: null as Article | null,
      titleGu: mockWorldFeatured.titleGu,
      excerptGu: mockWorldFeatured.excerptGu,
      watermarkGu: 'ગુજરાત પોસ્ટ',
    };
  }, [dbWorldArticles]);

  // Desktop view: strictly 4 vertical cards (unchanged)
  const cardsList = useMemo(() => {
    const list: Array<{ id: string; slug: string; image: string; article: Article | null; titleGu: string; categoryGu: string; time: string }> = [];
    dbWorldArticles.slice(1, 5).forEach((art) => {
      list.push({
        id: art.id,
        slug: art.slug,
        image: art.image || (art as any).imageUrl || (art as any).featuredImage || DEMO_IMAGES[1],
        categoryGu: resolveWorldCategoryName(art, language),
        article: art,
        titleGu: art.titleGu || art.title,
        time: formatTime(art.publishedAt),
      });
    });
    if (list.length < 4) {
      mockWorldCards.forEach((card) => {
        if (list.length < 4 && !list.some((item) => item.id === card.id)) {
          list.push({
            id: card.id,
            slug: card.slug,
            image: card.image,
            categoryGu: card.categoryGu,
            article: null,
            titleGu: card.titleGu,
            time: getMockRelativeTime(card.relativeTimeGu, language),
          });
        }
      });
    }
    return list;
  }, [dbWorldArticles, language]);

  // Mobile view: 1 more card added for mobile screen only (displays 6 cards + 1 featured = 7 news total)
  const mobileCardsList = useMemo(() => {
    const list: Array<{ id: string; slug: string; image: string; article: Article | null; titleGu: string; categoryGu: string; time: string }> = [];
    dbWorldArticles.slice(1, 8).forEach((art) => {
      list.push({
        id: art.id,
        slug: art.slug,
        image: art.image || (art as any).imageUrl || (art as any).featuredImage || DEMO_IMAGES[1],
        categoryGu: resolveWorldCategoryName(art, language),
        article: art,
        titleGu: art.titleGu || art.title,
        time: formatTime(art.publishedAt),
      });
    });
    if (list.length < 6) {
      mockWorldCards.forEach((card) => {
        if (list.length < 6 && !list.some((item) => item.id === card.id)) {
          list.push({
            id: card.id,
            slug: card.slug,
            image: card.image,
            categoryGu: card.categoryGu,
            article: null,
            titleGu: card.titleGu,
            time: getMockRelativeTime(card.relativeTimeGu, language),
          });
        }
      });
    }
    return list;
  }, [dbWorldArticles, language]);

  // Sidebar World Articles for Desktop (displays below CurrencyRatesWidget to eliminate whitespace)
  const sidebarWorldArticles = useMemo(() => {
    const list: Array<{ id: string; slug: string; image: string; article: Article | null; titleGu: string; categoryGu: string; time: string }> = [];
    dbWorldArticles.slice(5, 9).forEach((art) => {
      list.push({
        id: art.id,
        slug: art.slug,
        image: art.image || (art as any).imageUrl || (art as any).featuredImage || DEMO_IMAGES[2],
        categoryGu: resolveWorldCategoryName(art, language),
        article: art,
        titleGu: art.titleGu || art.title,
        time: formatTime(art.publishedAt),
      });
    });
    if (list.length < 3) {
      mockWorldCards.slice(4).forEach((card) => {
        if (list.length < 3 && !list.some((item) => item.id === card.id)) {
          list.push({
            id: card.id,
            slug: card.slug,
            image: card.image,
            categoryGu: card.categoryGu,
            article: null,
            titleGu: card.titleGu,
            time: getMockRelativeTime(card.relativeTimeGu, language),
          });
        }
      });
    }
    if (list.length < 3) {
      mockWorldCards.forEach((card) => {
        if (list.length < 3 && !list.some((item) => item.id === card.id)) {
          list.push({
            id: card.id,
            slug: card.slug,
            image: card.image,
            categoryGu: card.categoryGu,
            article: null,
            titleGu: card.titleGu,
            time: getMockRelativeTime(card.relativeTimeGu, language),
          });
        }
      });
    }
    return list;
  }, [dbWorldArticles, language]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-4 md:mt-5 pt-0">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 mb-4">
        <span className="section-heading-badge bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'વિશ્વ' : language === 'hi' ? 'विश्व' : 'World'}
        </span>
        <Link
          href="/category/world"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[20px] md:text-[21px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : language === 'hi' ? 'और देखें →' : 'More News →'}
        </Link>
      </div>

      {/* Grid: Left column (main news) vs Right column (sidebar/widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-4 lg:gap-8 items-start">

        {/* Left Column: Big horizontal featured card + 4-column horizontal card list */}
        <div className="flex flex-col min-w-0">

          {/* Mobile View (< md): Modern Separated Cards with Category Pill & WhatsApp Share */}
          <div className="md:hidden flex flex-col gap-3.5 mt-2">
            {(featured ? [featured, ...mobileCardsList] : mobileCardsList).map((card, idx) => (
              <MobileModernArticleCard
                key={`world-mob-${card.id}-${idx}`}
                article={card.article || card}
                language={language}
                index={idx}
                defaultCategoryLabel={card.categoryGu || (language === 'gu' ? 'વિશ્વ' : language === 'hi' ? 'विदेश' : 'World')}
                defaultCategorySlug="world"
              />
            ))}
          </div>

          {/* Desktop View (>= md): Exactly preserved big horizontal featured card + 4-column cards */}
          <div className="hidden md:flex flex-col">
            {/* Big Horizontal Featured Card */}
            <Link
              href={`/news/${featured.slug}`}
              className="group grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border/80 rounded-sm p-5 md:p-6 mb-5 md:mb-6 hover:shadow-sm transition-shadow duration-200"
            >
              {/* Content Left */}
              <div className="flex flex-col justify-center min-w-0 order-2 md:order-1">
                <span className="text-red-600 font-extrabold text-[12px] md:text-[13px] mb-2 select-none uppercase tracking-wide">
                  <AutoTranslateString text={featured.categoryGu} language={language} />
                </span>
                <h3 className="text-[18px] md:text-[20.5px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors">
                  {featured.article
                    ? <AutoArticleTitle article={featured.article} language={language} />
                    : <AutoTranslateString text={featured.titleGu} language={language} />}
                </h3>
                <p className="text-muted-foreground text-[14px] leading-relaxed mt-3.5 line-clamp-4 select-none">
                  {featured.article
                    ? <AutoArticleExcerpt article={featured.article} language={language} />
                    : <AutoTranslateString text={stripHtmlTags(featured.excerptGu)} language={language} />}
                </p>
              </div>

              {/* Image Right with Watermark */}
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl md:rounded-2xl border border-border/15 bg-muted order-1 md:order-2 shadow-sm">
                <ArticleMedia
                  src={featured.image}
                  alt={featured.titleGu}
                  className="transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <span className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-xs text-white text-[9.5px] font-black px-2.5 py-0.5 rounded-md select-none tracking-tight shadow">
                  {featured.watermarkGu}
                </span>
              </div>
            </Link>

            {/* Grid of 4 Vertical Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {cardsList.map((card) => (
                <div key={card.id} className="flex flex-col min-w-0">
                  <Link
                    href={`/news/${card.slug}`}
                    className="group flex flex-col"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl md:rounded-2xl border border-border/15 bg-muted mb-2.5 shadow-sm">
                      <ArticleMedia
                        src={card.image}
                        alt={card.titleGu}
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <span className="text-[#B3121B] font-extrabold text-[12px] md:text-[13px] mb-1.5 select-none uppercase leading-none">
                      <AutoTranslateString text={card.categoryGu} language={language} />
                    </span>
                    <h4 className="text-[14px] md:text-[14.5px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
                      {card.article
                        ? <AutoArticleTitle article={card.article} language={language} />
                        : <AutoTranslateString text={card.titleGu} language={language} />}
                    </h4>
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Widgets */}
        <div className="flex flex-col gap-2.5 select-none">

          <SidebarAdBanner
            slot="SIDEBAR_WORLD"
            language={language}
            fallbackTitleGu="ડ્રીમ હોમ્સ"
            fallbackTitleEn="Dream Homes"
            fallbackTagGu="તમારું સપનાનું ઘર — 0% પ્રોસેસિંગ ફી સાથે"
            fallbackTagEn="Your dream home — with 0% processing fee"
            fallbackCtaGu="વધુ જાણો"
            fallbackCtaEn="Learn More"
            fallbackGradient="#0E8044"
            minHeight={180}
            enableTributeSlides={false}
          />

          {/* Dynamic Foreign Currency Widget */}
          <CurrencyRatesWidget language={language} />

          {/* Dedicated Top World News Widget for Desktop to eliminate whitespace below Currency Rates */}
          {sidebarWorldArticles.length > 0 && (
            <div className="hidden lg:flex flex-col rounded-xl border border-border/80 bg-card p-3.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/80 pb-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#B3121B] text-[15px] font-extrabold">♦</span>
                  <h3 className="text-[15px] font-black text-foreground">
                    {language === 'gu' ? 'વિશ્વ સમાચાર' : language === 'hi' ? 'विश्व समाचार' : 'World News'}
                  </h3>
                </div>
                <Link
                  href="/category/world"
                  className="text-[#B3121B] hover:text-red-700 font-bold text-[12px] hover:underline"
                >
                  {language === 'gu' ? 'બધા જુઓ →' : language === 'hi' ? 'सभी देखें →' : 'View all →'}
                </Link>
              </div>

              <div className="flex flex-col divide-y divide-border/50">
                {sidebarWorldArticles.map((item) => (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className="group flex items-start gap-3 py-2.5 hover:bg-muted/30 transition-colors rounded-md px-1"
                  >
                    <div className="relative w-20 h-14 shrink-0 overflow-hidden rounded-lg bg-muted border border-border/30">
                      <ArticleMedia
                        src={item.image}
                        alt={item.titleGu}
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[#B3121B] font-extrabold text-[10.5px] uppercase leading-none mb-1">
                        <AutoTranslateString text={item.categoryGu} language={language} />
                      </span>
                      <h4 className="text-[13px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2" style={{ fontFamily: "'Hind Vadodara', 'Noto Sans Gujarati', sans-serif" }}>
                        {item.article
                          ? <AutoArticleTitle article={item.article} language={language} />
                          : <AutoTranslateString text={item.titleGu} language={language} />}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-medium mt-1">
                        {item.time}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
export { WorldSection };





