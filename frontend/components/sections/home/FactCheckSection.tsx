'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Eye, ChevronRight } from 'lucide-react';
import type { Article, Language } from '@/types';
import { getLocalized } from '@/data';
import { getPublicArticles } from '@/lib/api';
import { stripHtmlTags, getMockTitle } from './homeHelpers';

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

/* --- Fact Check Section ("ફેક્ટ ચેક" Zone) ----------------------------- */
export default function FactCheckSection({ language, initialArticles }: { language: Language; initialArticles?: Article[] }) {
  const [factCheckArticles, setFactCheckArticles] = useState<Article[]>(initialArticles || []);

  useEffect(() => {
    if (initialArticles && initialArticles.length >= 3) return;
    getPublicArticles({ categorySlug: 'fact-check', limit: 9 }).then((res) => {
      if (res && res.articles && res.articles.length > 0) {
        setFactCheckArticles(res.articles);
      } else {
        getPublicArticles({ categorySlug: 'factcheck', limit: 9 }).then((res2) => {
          if (res2 && res2.articles && res2.articles.length > 0) {
            setFactCheckArticles(res2.articles);
          }
        });
      }
    });
  }, [initialArticles]);

  const getStatusInfo = (art: any) => {
    const tagStr = (art.tagsGu?.[0] || art.tags?.[0] || art.titleGu || art.title || '').toLowerCase();
    if (tagStr.includes('સાચું') || tagStr.includes('true') || tagStr.includes('સત્ય')) {
      return { labelGu: 'સાચું', labelEn: 'TRUE', color: 'text-green-600' };
    }
    if (tagStr.includes('ભ્રામક') || tagStr.includes('misleading') || tagStr.includes('અધૂરું')) {
      return { labelGu: 'ભ્રામક', labelEn: 'MISLEADING', color: 'text-yellow-600' };
    }
    return { labelGu: 'ખોટો દાવો', labelEn: 'FAKE CLAIM', color: 'text-red-600' };
  };

  const hasDb = factCheckArticles.length > 0;
  const featArt = hasDb ? factCheckArticles[0] : null;
  const gridDbList = hasDb ? factCheckArticles.slice(1, 9) : [];

  const featStatus = featArt ? getStatusInfo(featArt) : { labelGu: 'ખોટો દાવો', labelEn: 'FAKE CLAIM', color: 'text-red-600' };
  const featTitle = featArt ? getLocalized(language, { en: featArt.title, gu: featArt.titleGu || featArt.title, hi: (featArt as any).titleHi || featArt.title }) : (
    language === 'gu'
      ? 'શું સરકારે ખરેખર બધા વિદ્યાર્થીઓને મફત લેપટોપ આપવાની જાહેરાત કરી? જાણો સત્ય'
      : 'Did government really announce free laptops for all students? Know truth'
  );
  const featExcerpt = featArt ? stripHtmlTags(getLocalized(language, { en: featArt.excerpt, gu: featArt.excerptGu || featArt.excerpt, hi: (featArt as any).excerptHi || featArt.excerpt })) : (
    language === 'gu'
      ? 'ગુજરાત પોસ્ટની તપાસમાં જાણવા મળ્યું કે વાયરલ પરિપત્ર બનાવટી છે – શિક્ષણ વિભાગે આવી કોઈ જાહેરાત કરી નથી.'
      : 'Gujarat Post investigation revealed that the viral circular is fake – the education department has made no such announcement.'
  );
  const featSlug = featArt ? featArt.slug : 'fake-news-alert-free-laptop-scheme-circular-busted-520';
  const featImage = featArt?.image || '/assets/demo/5.jpg';

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-10">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-6">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[19px] md:text-[21px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'ફેક્ટ  ચેક' : language === 'hi' ? 'तथ्य  जांच' : 'Fact  Check'}
        </span>
        <Link
          href="/category/fact-check"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[15px] md:text-[16px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More →'}
        </Link>
      </div>

      {/* Grid: 3 columns layout (1 column for featured, 2 columns for list grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Column: Big Featured Fact Check Card (Spans 1 column on desktop) */}
        <div className="lg:col-span-1 flex flex-col min-w-0">
          <Link
            href={`/news/${featSlug}`}
            className="group flex flex-col"
          >
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-3.5">
              <Image
                src={featImage}
                alt="Fact Check Featured"
                fill
                sizes="(max-width: 1024px) 100vw, 35vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span className={`flex items-center gap-1 font-extrabold text-[12px] md:text-[13px] mb-1.5 select-none uppercase tracking-wide ${featStatus.color}`}>
              <span className="text-[10px]">●</span>
              {language === 'gu' ? featStatus.labelGu : featStatus.labelEn}
            </span>
            <h3 className="text-[15px] md:text-[16px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
              {featTitle}
            </h3>
            <p className="text-muted-foreground text-[12.5px] leading-relaxed mt-2.5 line-clamp-3 select-none">
              {featExcerpt}
            </p>
          </Link>

        </div>

        {/* Right Column: Grid of 8 Fact Check items (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4 lg:pt-0">
          {hasDb && gridDbList.length > 0 ? (
            gridDbList.map((item) => {
              const st = getStatusInfo(item);
              const title = getLocalized(language, { en: item.title, gu: item.titleGu || item.title, hi: (item as any).titleHi || item.title });
              return (
                <Link
                  key={item.id}
                  href={`/news/${item.slug}`}
                  className="group flex gap-4 hover:bg-muted/10 transition-colors p-1"
                >
                  {/* Image Left */}
                  <div className="relative h-[68px] w-[100px] shrink-0 overflow-hidden rounded-sm border border-border/10 bg-muted">
                    <Image
                      src={item.image || '/assets/demo/2.jpg'}
                      alt={title}
                      fill
                      sizes="100px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Content Right */}
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    {/* Status Dot + Category Label */}
                    <div className="flex mb-1">
                      <span className={`flex items-center gap-1 text-[11px] font-black select-none leading-none uppercase ${st.color}`}>
                        <span className="text-[10px]">●</span>
                        {language === 'gu' ? st.labelGu : st.labelEn}
                      </span>
                    </div>
                    <h4 className="text-[12.5px] md:text-[13px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                      {title}
                    </h4>
                  </div>
                </Link>
              );
            })
          ) : (
            mockFactCheckList.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="group flex gap-4 hover:bg-muted/10 transition-colors p-1"
              >
                {/* Image Left */}
                <div className="relative h-[68px] w-[100px] shrink-0 overflow-hidden rounded-sm border border-border/10 bg-muted">
                  <Image
                    src={item.image}
                    alt={item.titleGu}
                    fill
                    sizes="100px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
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
                      {language === 'gu' ? item.statusLabelGu : item.status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-[12.5px] md:text-[13px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                    {getMockTitle(item, language)}
                  </h4>
                </div>
              </Link>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
export { FactCheckSection };

