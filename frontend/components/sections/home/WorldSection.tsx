'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import type { Article, Language } from '@/types';
import { formatTime } from '@/data';
import { getPublicArticles } from '@/lib/api';
import SidebarAdBanner from '@/components/ads/SidebarAdBanner';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle, AutoArticleExcerpt, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import { stripHtmlTags, DEMO_IMAGES, getMockRelativeTime } from './homeHelpers';

const WORLD_SLUGS = ['world', 'international', 'videsh'];

function isWorldArticle(art: Article): boolean {
  const slug = (
    (art as any).category?.slug ||
    (art as any).categorySlug ||
    (art as any).category ||
    ''
  ).toLowerCase().trim();
  const name = (
    (art as any).category?.name ||
    (art as any).categoryName ||
    ''
  ).toLowerCase().trim();
  const nameGu = (
    (art as any).category?.nameGu ||
    (art as any).categoryGu ||
    ''
  ).toLowerCase().trim();
  const loc = (art.location || '').toLowerCase().trim();

  return (
    WORLD_SLUGS.includes(slug) ||
    WORLD_SLUGS.includes(name) ||
    nameGu.includes('વિશ્વ') ||
    nameGu.includes('વિદેશ') ||
    name.includes('world') ||
    name.includes('international') ||
    loc === 'international'
  );
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
    { symbol: '$', code: 'USD', pair: 'USD/INR', nameEn: 'US Dollar', nameGu: 'યુએસ ડોલર', nameHi: 'यूएस डॉलर', rate: 86.85, change: 0.12, bgColor: 'bg-green-500/10', textColor: 'text-green-600' },
    { symbol: '€', code: 'EUR', pair: 'EUR/INR', nameEn: 'Euro', nameGu: 'યુરો', nameHi: 'यूरो', rate: 90.45, change: -0.20, bgColor: 'bg-blue-500/10', textColor: 'text-blue-600' },
    { symbol: 'د.إ', code: 'AED', pair: 'AED/INR', nameEn: 'UAE Dirham', nameGu: 'યુએઈ દિરહામ', nameHi: 'યુએઈ દિરહામ', rate: 23.64, change: -0.05, bgColor: 'bg-emerald-500/10', textColor: 'text-emerald-600' },
    { symbol: 'A$', code: 'AUD', pair: 'AUD/INR', nameEn: 'Australian Dollar', nameGu: 'ઓસ્ટ્રેલિયન ડોલર', nameHi: 'ऑस्ट्रेलियन डॉलर', rate: 55.48, change: 0.03, bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-600' },
    { symbol: '£', code: 'GBP', pair: 'GBP/INR', nameEn: 'British Pound', nameGu: 'બ્રિટિશ પાઉન્ડ', nameHi: 'ब्रिटिश पाउंड', rate: 108.78, change: 0.00, bgColor: 'bg-amber-500/10', textColor: 'text-amber-600' },
    { symbol: 'C$', code: 'CAD', pair: 'CAD/INR', nameEn: 'Canadian Dollar', nameGu: 'કેનેડિયન ડોલર', nameHi: 'कनाडाई डॉलर', rate: 61.20, change: 0.08, bgColor: 'bg-red-500/10', textColor: 'text-red-600' },
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
      <div className="flex items-center justify-between pb-1 mb-2 select-none border-b border-border/80">
        <span className="text-[#B3121B] font-extrabold text-[14px] md:text-[15px]">
          {language === 'gu' ? '• વિદેશી ચલણ' : language === 'hi' ? '• विदेशी मुद्रा' : '• Foreign Exchange'}
        </span>
        <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live {lastUpdated}</span>
        </span>
      </div>
      <div className="border border-border/80 rounded-sm bg-card divide-y divide-border/60 shadow-sm">
        {rates.map((item) => {
          const name = language === 'gu' ? item.nameGu : language === 'hi' ? item.nameHi : item.nameEn;
          const isUp = item.change > 0;
          const isDown = item.change < 0;

          return (
            <div key={item.code} className="flex items-center justify-between p-2.5 px-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${item.bgColor} ${item.textColor} font-extrabold text-[12px] select-none shrink-0`}>
                  {item.symbol}
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-black text-foreground">{name}</span>
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase leading-none mt-0.5">{item.pair}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-black text-foreground">₹{item.rate.toFixed(2)}</span>
                <span className={`text-[10.5px] font-black tracking-tight select-none ${isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-muted-foreground'}`}>
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
  }
];

/* --- World Section ("વિશ્વ" Zone) ----------------------------- */
export default function WorldSection({ language, initialArticles }: { language: Language; initialArticles?: Article[] }) {
  const initialWorld = useMemo(() => {
    return (initialArticles || []).filter(isWorldArticle);
  }, [initialArticles]);

  const [dbWorldArticles, setDbWorldArticles] = useState<Article[]>(initialWorld);
  const [loading, setLoading] = useState(initialWorld.length < 5);

  useEffect(() => {
    const preFetched = (initialArticles || []).filter(isWorldArticle);
    if (preFetched.length >= 5) {
      setDbWorldArticles(preFetched.slice(0, 10));
      setLoading(false);
      return;
    }

    Promise.all([
      getPublicArticles({ categorySlug: 'world', sort: 'latest', limit: 10 }).catch(() => null),
      getPublicArticles({ categorySlug: 'international', sort: 'latest', limit: 10 }).catch(() => null),
    ]).then(([res1, res2]) => {
      const combined = [
        ...(res1?.articles || []),
        ...(res2?.articles || []),
        ...preFetched,
      ];
      const seen = new Set<string>();
      const unique = combined.filter((a) => {
        if (!a?.id || seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
      unique.sort(
        (a, b) =>
          new Date(b.publishedAt || (b as any).createdAt || 0).getTime() -
          new Date(a.publishedAt || (a as any).createdAt || 0).getTime()
      );

      if (unique.length > 0) {
        setDbWorldArticles(unique.slice(0, 10));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [initialArticles]);

  const featured = useMemo(() => {
    if (dbWorldArticles.length > 0) {
      const art = dbWorldArticles[0];
      return {
        id: art.id,
        slug: art.slug,
        image: art.image || (art as any).imageUrl || (art as any).featuredImage || DEMO_IMAGES[0],
        categoryGu: (art as any).categoryGu || (art as any).category?.nameGu || (art as any).category?.name || art.category || 'વિશ્વ',
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

  const cardsList = useMemo(() => {
    const list: Array<{ id: string; slug: string; image: string; article: Article | null; titleGu: string; categoryGu: string; time: string }> = [];
    dbWorldArticles.slice(1, 5).forEach((art) => {
      list.push({
        id: art.id,
        slug: art.slug,
        image: art.image || (art as any).imageUrl || (art as any).featuredImage || DEMO_IMAGES[1],
        categoryGu: (art as any).categoryGu || (art as any).category?.nameGu || (art as any).category?.name || art.category || 'વિશ્વ',
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

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-6">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'વિશ્વ' : language === 'hi' ? 'विश्व' : 'World'}
        </span>
        <Link
          href="/category/world"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More News →'}
        </Link>
      </div>

      {/* Grid: Left column (main news) vs Right column (sidebar/widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-8 items-start">

        {/* Left Column: Big horizontal featured card + 4-column horizontal card list */}
        <div className="flex flex-col min-w-0">

          {/* Big Horizontal Featured Card */}
          <Link
            href={`/news/${featured.slug}`}
            className="group grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border/80 rounded-sm p-5 md:p-6 mb-8 hover:shadow-sm transition-shadow duration-200"
          >
            {/* Content Left */}
            <div className="flex flex-col justify-center min-w-0 order-2 md:order-1">
              <span className="text-red-600 font-extrabold text-[12px] md:text-[13px] mb-2 select-none uppercase tracking-wide">
                <AutoTranslateString text={featured.categoryGu} language={language} />
              </span>
              <h3 className="text-[17px] md:text-[19px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors">
                {featured.article
                  ? <AutoArticleTitle article={featured.article} language={language} />
                  : <AutoTranslateString text={featured.titleGu} language={language} />}
              </h3>
              <p className="text-muted-foreground text-[13px] leading-relaxed mt-3.5 line-clamp-4 select-none">
                {featured.article
                  ? <AutoArticleExcerpt article={featured.article} language={language} />
                  : <AutoTranslateString text={stripHtmlTags(featured.excerptGu)} language={language} />}
              </p>
            </div>

            {/* Image Right with Watermark */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm bg-muted order-1 md:order-2">
              <ArticleMedia
                src={featured.image}
                alt={featured.titleGu}
                className="transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-[9.5px] font-black px-2 py-0.5 rounded-sm select-none tracking-tight">
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
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5">
                    <ArticleMedia
                      src={card.image}
                      alt={card.titleGu}
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <span className="text-[#B3121B] font-extrabold text-[12px] md:text-[13px] mb-1.5 select-none uppercase leading-none">
                    <AutoTranslateString text={card.categoryGu} language={language} />
                  </span>
                  <h4 className="text-[13px] md:text-[13.5px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
                    {card.article
                      ? <AutoArticleTitle article={card.article} language={language} />
                      : <AutoTranslateString text={card.titleGu} language={language} />}
                  </h4>
                </Link>

              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="flex flex-col gap-6">

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

        </div>

      </div>
    </div>
  );
}
export { WorldSection };

