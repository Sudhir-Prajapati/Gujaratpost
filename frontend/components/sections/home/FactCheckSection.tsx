'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Eye, ChevronRight } from 'lucide-react';
import type { Article, Language } from '@/types';
import { getLocalized } from '@/data';
import { getPublicArticles } from '@/lib/api';
import { stripHtmlTags, getMockTitle } from './homeHelpers';
import AdSectionBanner from '@/components/ads/AdSectionBanner';
import MobileModernArticleCard from '@/components/ui/MobileModernArticleCard';
import { AutoArticleTitle, AutoArticleExcerpt, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import { sanitizeImageUrl } from '@/lib/media';

const mockFactCheckList = [
  {
    id: 'fc-1',
    slug: 'viral-video-not-from-gujarat-floods-521',
    image: '/assets/demo/2.jpg',
    status: 'misleading', // ભ્રામક
    statusLabelGu: 'ભ્રામક',
    titleGu: 'સાવધાન! વાયરલ વીડિયો ગુજરાતના પૂરનો નથી, જૂનો અને અલગ રાજ્યનો છે'
  },
  {
    id: 'fc-2',
    slug: 'gujarat-farmer-support-scheme-amount-increased-522',
    image: '/assets/demo/1.jpg',
    status: 'true', // સાચું
    statusLabelGu: 'સાચું',
    titleGu: 'હા, રાજ્યમાં ખેડૂત સહાય યોજનાની રકમમાં ખરેખર વધારો કરાયો છે!'
  },
  {
    id: 'fc-3',
    slug: 'social-media-petrol-price-fake-523',
    image: '/assets/demo/8.jpg',
    status: 'fake', // ખોટો દાવો
    statusLabelGu: 'ખોટો દાવો',
    titleGu: 'સોશિયલ મીડિયા પર ફરતો મેસેજ: "કાલથી પેટ્રોલ ₹50 થશે" – જાણો હકીકત'
  },
  {
    id: 'fc-4',
    slug: 'schools-closed-next-week-rumor-busted-524',
    image: '/assets/demo/3.jpg',
    status: 'misleading', // ભ્રામક
    statusLabelGu: 'ભ્રામક',
    titleGu: 'શું ખરેખર રાજ્યમાં તમામ શાળાઓ આગામી સપ્તાહથી બંધ રહેશે? જાણો સાચી વિગત'
  },
  {
    id: 'fc-5',
    slug: 'senior-citizens-bus-fare-discount-true-525',
    image: '/assets/demo/6.jpg',
    status: 'true', // સાચું
    statusLabelGu: 'સાચું',
    titleGu: 'હા, રાજ્ય સરકારે વરિષ્ઠ નાગરિકો માટે બસ ભાડામાં ખરેખર છૂટ જાહેર કરી છે'
  },
  {
    id: 'fc-6',
    slug: 'whatsapp-new-bank-rules-message-fake-526',
    image: '/assets/demo/7.jpg',
    status: 'fake', // ખોટો દાવો
    statusLabelGu: 'ખોટો દાવો',
    titleGu: 'વોટ્સએપ પર ફરતો "નવો બેંક નિયમ" મેસેજ ખોટો, RBIએ કર્યો ઈનકાર'
  },
  {
    id: 'fc-7',
    slug: 'ahmedabad-bridge-collapse-image-from-other-country-527',
    image: '/assets/demo/4.jpg',
    status: 'misleading', // ભ્રામક
    statusLabelGu: 'ભ્રામક',
    titleGu: 'એ તસવીર અમદાવાદ પુલ તૂટવાની નથી, ત્રણ વર્ષ જૂની અને બીજા દેશની છે'
  },
  {
    id: 'fc-8',
    slug: 'online-registration-new-job-recruitment-starts-528',
    image: '/assets/demo/5.jpg',
    status: 'true', // સાચું
    statusLabelGu: 'સાચું',
    titleGu: 'હા, રાજ્યમાં નવી રોજગાર ભરતી માટે ઓનલાઈન અરજી ખરેખર શરૂ થઈ ગઈ છે'
  }
];

function getArticleImage(art: any, fallback = '/assets/demo/2.jpg'): string {
  const raw = art?.featuredImage || art?.image || (art?.media && art.media[0]?.url) || '';
  if (raw && typeof raw === 'string' && raw.trim() !== '') {
    return sanitizeImageUrl(raw.trim());
  }
  return fallback;
}

/* --- Fact Check Section ("ફેક્ટ ચેક" Zone) ----------------------------- */
export default function FactCheckSection({ language, initialArticles }: { language: Language; initialArticles?: Article[] }) {
  const sortFactCheckLatest = useCallback((list: Article[]) => {
    return [...(list || [])].sort((a: any, b: any) => {
      const aNum = typeof a?.articleNumber === 'number' ? a.articleNumber : (parseInt(a?.articleNumber, 10) || 0);
      const bNum = typeof b?.articleNumber === 'number' ? b.articleNumber : (parseInt(b?.articleNumber, 10) || 0);
      if (bNum > 0 && aNum > 0 && bNum !== aNum) return bNum - aNum;
      if (bNum > 0 && aNum === 0) return -1;
      if (aNum > 0 && bNum === 0) return 1;
      const timeA = new Date(a?.publishedAt || a?.createdAt || 0).getTime();
      const timeB = new Date(b?.publishedAt || b?.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, []);

  const [factCheckArticles, setFactCheckArticles] = useState<Article[]>(() => sortFactCheckLatest(initialArticles || []));

  // Sync state if initialArticles prop changes from parent
  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) {
      setFactCheckArticles((prev) => {
        const map = new Map<string, Article>();
        prev.forEach((a) => { if (a?.id) map.set(a.id, a); });
        initialArticles.forEach((a) => { if (a?.id) map.set(a.id, a); });
        return sortFactCheckLatest(Array.from(map.values())).slice(0, 12);
      });
    }
  }, [initialArticles, sortFactCheckLatest]);

  const fetchFreshFactCheckArticles = useCallback(async () => {
    try {
      const [res1, res2] = await Promise.all([
        getPublicArticles({ categorySlug: 'fact-check', limit: 15, sort: 'latest' }).catch(() => null),
        getPublicArticles({ categorySlug: 'factcheck', limit: 15, sort: 'latest' }).catch(() => null),
      ]);
      const fetched = [
        ...(res1?.articles || []),
        ...(res2?.articles || []),
      ];
      if (fetched.length > 0) {
        setFactCheckArticles((prev) => {
          const map = new Map<string, Article>();
          fetched.forEach((a) => { if (a?.id) map.set(a.id, a); });
          prev.forEach((a) => { if (a?.id && !map.has(a.id)) map.set(a.id, a); });
          (initialArticles || []).forEach((a) => { if (a?.id && !map.has(a.id)) map.set(a.id, a); });
          return sortFactCheckLatest(Array.from(map.values())).slice(0, 12);
        });
      }
    } catch {
      // keep existing
    }
  }, [initialArticles, sortFactCheckLatest]);

  useEffect(() => {
    // Always ensure full fact check articles list (at least 7 items for featured + 6 grid cards)
    if (!initialArticles || initialArticles.length < 7) {
      fetchFreshFactCheckArticles();
    }

    const handleSync = () => {
      fetchFreshFactCheckArticles();
    };

    window.addEventListener('gp-articles-updated', handleSync);

    return () => {
      window.removeEventListener('gp-articles-updated', handleSync);
    };
  }, [fetchFreshFactCheckArticles, initialArticles]);

  const getStatusInfo = (art: any) => {
    const tagStr = (art?.tagsGu?.[0] || art?.tags?.[0] || art?.titleGu || art?.title || '').toLowerCase();
    if (tagStr.includes('સાચું') || tagStr.includes('true') || tagStr.includes('સત્ય') || tagStr.includes('सच')) {
      return { labelGu: 'સાચું', labelHi: 'सच', labelEn: 'TRUE', color: 'text-green-600' };
    }
    if (tagStr.includes('ભ્રામક') || tagStr.includes('misleading') || tagStr.includes('અધૂરું') || tagStr.includes('भ्रामक')) {
      return { labelGu: 'ભ્રામક', labelHi: 'भ्रामक', labelEn: 'MISLEADING', color: 'text-yellow-600' };
    }
    return { labelGu: 'ખોટો દાવો', labelHi: 'झूठा दावा', labelEn: 'FAKE CLAIM', color: 'text-red-600' };
  };

  const hasDb = factCheckArticles.length > 0;
  const featArt = hasDb ? factCheckArticles[0] : null;
  const gridDbList = hasDb ? factCheckArticles.slice(1, 7) : [];

  const featStatus = featArt ? getStatusInfo(featArt) : { labelGu: 'ખોટો દાવો', labelHi: 'झूठा दावा', labelEn: 'FAKE CLAIM', color: 'text-red-600' };
  const featTitle = featArt ? getLocalized(language, { en: featArt.title, gu: featArt.titleGu || featArt.title, hi: (featArt as any).titleHi || featArt.title }) : (
    language === 'gu'
      ? 'શું સરકારે ખરેખર બધા વિદ્યાર્થીઓને મફત લેપટોપ આપવાની જાહેરાત કરી? જાણો સત્ય'
      : 'Did government really announce free laptops for all students? Know truth'
  );
  const featExcerpt = featArt ? stripHtmlTags(getLocalized(language, {
    en: featArt.excerpt || (featArt as any).content || '',
    gu: featArt.excerptGu || featArt.excerpt || (featArt as any).contentGu || (featArt as any).content || '',
    hi: (featArt as any).excerptHi || featArt.excerpt || (featArt as any).contentHi || (featArt as any).content || '',
  })) : (
    language === 'gu'
      ? 'ગુજરાત પોસ્ટની તપાસમાં જાણવા મળ્યું કે વાયરલ પરિપત્ર બનાવટી છે – શિક્ષણ વિભાગે આવી કોઈ જાહેરાત કરી નથી.'
      : 'Gujarat Post investigation revealed that the viral circular is fake – the education department has made no such announcement.'
  );
  const featSlug = featArt ? featArt.slug : 'fake-news-alert-free-laptop-scheme-circular-busted-520';
  const featImage = getArticleImage(featArt, '/assets/demo/5.jpg');

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-2" suppressHydrationWarning>
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 md:pb-2.5 mb-2.5 md:mb-4">
        <span className="section-heading-badge bg-[#B3121B] text-white px-5 py-2.5 text-[19px] md:text-[21px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'ફેક્ટ ચેક' : language === 'hi' ? 'तथ्य जांच' : 'Fact Check'}
        </span>
        <Link
          href="/category/fact-check"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[20px] md:text-[21px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : language === 'hi' ? 'और देखें →' : 'More →'}
        </Link>
      </div>

      {/* Grid: 3 columns layout (1 column for featured, 2 columns for list grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-8 items-start">

        {/* Left Column: Big Featured Fact Check Card (Spans 1 column on desktop) */}
        <div className="lg:col-span-1 flex flex-col min-w-0">
          <Link
            href={`/news/${featSlug}`}
            className="group flex flex-col"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl md:rounded-2xl border border-border/15 bg-zinc-100 dark:bg-neutral-900 mb-2 md:mb-3 shadow-sm">
              <Image
                src={featImage}
                alt="Fact Check Featured"
                fill
                sizes="(max-width: 1024px) 100vw, 35vw"
                className="object-cover transition-transform duration-300"
              />
            </div>
            <span className={`flex items-center gap-1 font-extrabold text-[12px] md:text-[13px] mb-1.5 select-none uppercase tracking-wide ${featStatus.color}`}>
              <span className="text-[10px]">●</span>
              {language === 'gu' ? featStatus.labelGu : language === 'hi' ? featStatus.labelHi : featStatus.labelEn}
            </span>
            <h3 className="text-[16px] md:text-[17.5px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
              {featArt ? (
                <AutoArticleTitle article={featArt} language={language} />
              ) : (
                <AutoTranslateString text={featTitle} language={language} />
              )}
            </h3>
            {featArt ? (
              <p className="text-muted-foreground text-[13.5px] leading-relaxed mt-2.5 line-clamp-3 select-none">
                <AutoArticleExcerpt article={featArt} language={language} />
              </p>
            ) : featExcerpt ? (
              <p className="text-muted-foreground text-[13.5px] leading-relaxed mt-2.5 line-clamp-3 select-none">
                <AutoTranslateString text={featExcerpt} language={language} />
              </p>
            ) : null}
          </Link>

        </div>

        {/* Right Column: Grid of 6 Fact Check items (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2 pt-1 lg:pt-0">
          {/* Mobile View (< md): Modern Separated Cards with Category Pill & WhatsApp Share */}
          <div className="md:hidden flex flex-col gap-3.5">
            {hasDb && gridDbList.length > 0 ? (
              gridDbList.map((item, idx) => (
                <MobileModernArticleCard
                  key={`fc-mob-${item.id}-${idx}`}
                  article={item}
                  language={language}
                  index={idx}
                  defaultCategoryLabel={language === 'gu' ? 'ફેક્ટ ચેક' : language === 'hi' ? 'फैक्ट चेक' : 'Fact Check'}
                  defaultCategorySlug="fact-check"
                />
              ))
            ) : (
              mockFactCheckList.slice(0, 6).map((item, idx) => (
                <MobileModernArticleCard
                  key={`fc-mob-mock-${item.id}-${idx}`}
                  article={item}
                  language={language}
                  index={idx}
                  defaultCategoryLabel={item.statusLabelGu || (language === 'gu' ? 'ફેક્ટ ચેક' : language === 'hi' ? 'फैक्ट चेक' : 'Fact Check')}
                  defaultCategorySlug="fact-check"
                />
              ))
            )}
          </div>

          {/* Desktop View (>= md): 2-column grid with Image on LEFT and Content on RIGHT */}
          <div className="hidden md:grid md:grid-cols-2 gap-x-5 lg:gap-x-6 gap-y-4 lg:gap-y-5">
            {hasDb && gridDbList.length > 0 ? (
              gridDbList.map((item) => {
                const st = getStatusInfo(item);
                return (
                  <Link
                    key={item.id}
                    href={`/news/${item.slug}`}
                    className="group flex gap-3.5 hover:bg-muted/10 transition-colors p-1 rounded-md"
                  >
                    {/* Image Left */}
                    <div className="relative w-[155px] h-[102px] lg:w-[170px] lg:h-[110px] shrink-0 overflow-hidden rounded-xl border border-border/15 bg-muted shadow-2xs">
                      <Image
                        src={getArticleImage(item, '/assets/demo/2.jpg')}
                        alt={item.titleGu || item.title || 'Fact Check'}
                        fill
                        sizes="(max-width: 1024px) 155px, 170px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Content Right */}
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      {/* Status Dot + Category Label */}
                      <div className="flex mb-1">
                        <span className={`flex items-center gap-1 text-[11px] font-black select-none leading-none uppercase ${st.color}`}>
                          <span className="text-[10px]">●</span>
                          {language === 'gu' ? st.labelGu : language === 'hi' ? st.labelHi : st.labelEn}
                        </span>
                      </div>
                      <h4 className="text-[13.5px] md:text-[14px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
                        <AutoArticleTitle article={item} language={language} />
                      </h4>
                    </div>
                  </Link>
                );
              })
            ) : (
              mockFactCheckList.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="group flex gap-3.5 hover:bg-muted/10 transition-colors p-1 rounded-md"
                >
                  {/* Image Left */}
                  <div className="relative w-[155px] h-[102px] lg:w-[170px] lg:h-[110px] shrink-0 overflow-hidden rounded-xl border border-border/15 bg-muted shadow-2xs">
                    <Image
                      src={item.image}
                      alt={item.titleGu}
                      fill
                      sizes="(max-width: 1024px) 155px, 170px"
                      className="object-cover transition-transform duration-300"
                    />
                  </div>

                  {/* Content Right */}
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    {/* Status Dot + Category Label */}
                    <div className="flex mb-1">
                      <span className={`flex items-center gap-1 text-[11px] font-black select-none leading-none uppercase ${item.status === 'true'
                        ? 'text-green-600'
                        : item.status === 'fake'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                        }`}>
                        <span className="text-[10px]">●</span>
                        {language === 'gu' ? item.statusLabelGu : language === 'hi' ? (item.status === 'true' ? 'सच' : item.status === 'fake' ? 'झूठा दावा' : 'भ्रामक') : item.status.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="text-[13.5px] md:text-[14px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
                      <AutoTranslateString text={item.titleGu} language={language} />
                    </h4>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
export { FactCheckSection };





