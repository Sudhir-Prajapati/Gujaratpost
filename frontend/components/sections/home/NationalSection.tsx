'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, ChevronRight, TrendingUp } from 'lucide-react';
import type { Article, Language } from '@/types';
import { formatTime } from '@/data';
import { getPublicArticles } from '@/lib/api';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import { DEMO_IMAGES, getMockRelativeTime } from './homeHelpers';

const mockNationalColumns = [
  {
    colId: 'nat-col-1',
    featured: {
      id: 'nat-feat-1',
      slug: 'parliament-monsoon-session-starts-today-531',
      image: '/assets/demo/2.jpg',
      titleGu: 'સંસદનું ચોમાસુ સત્ર આજથી! અનેક મોટા ખરડા પર થશે ઘમાસાણ',
      relativeTimeGu: '1 કલાક પહેલાં',
      views: 74000
    },
    subs: [
      {
        id: 'nat-sub-1-1',
        slug: 'gdp-growth-exceeds-estimate-532',
        image: '/assets/demo/7.jpg',
        titleGu: 'ખુશખબર! GDP વૃદ્ધિ દર અંદાજ કરતાં વધુ નોંધાયો',
        relativeTimeGu: '2 કલાક પહેલાં',
        views: 78000
      },
      {
        id: 'nat-sub-1-2',
        slug: 'two-new-vande-bharat-trains-flagged-off-533',
        image: '/assets/demo/8.jpg',
        titleGu: 'બે નવી વંદે ભારત ટ્રેનોને લીલી ઝંડી, જાણો રૂટ',
        relativeTimeGu: '3 કલાક પહેલાં',
        views: 81000
      },
      {
        id: 'nat-sub-1-3',
        slug: 'central-government-announcement-millions-benefit-534',
        image: '/assets/demo/4.jpg',
        titleGu: 'કેન્દ્ર સરકારની મોટી જાહેરાત! નવી યોજનાથી કરોડો લોકોને લાભ',
        relativeTimeGu: '4 કલાક પહેલાં',
        views: 60000
      }
    ]
  },
  {
    colId: 'nat-col-2',
    featured: {
      id: 'nat-feat-2',
      slug: 'new-education-policy-second-phase-implementation-535',
      image: '/assets/demo/5.jpg',
      titleGu: 'નવી રાષ્ટ્રીય શિક્ષણ નીતિનો બીજો તબક્કો આગામી સત્રથી લાગુ, જાણો શું બદલાશે',
      relativeTimeGu: '5 કલાક પહેલાં',
      views: 110000
    },
    subs: [
      {
        id: 'nat-sub-2-1',
        slug: 'indian-army-indigenous-defense-equipment-536',
        image: '/assets/demo/6.jpg',
        titleGu: 'ભારતીય સેનાને મળી મોટી તાકાત! સ્વદેશી બનાવટનું નવું સંરક્ષણ સાધન સામેલ',
        relativeTimeGu: '6 કલાક પહેલાં',
        views: 120000
      },
      {
        id: 'nat-sub-2-2',
        slug: 'supreme-court-historic-judgment-impact-millions-537',
        image: '/assets/demo/1.jpg',
        titleGu: 'સુપ્રીમ કોર્ટનો મોટો ચુકાદો! લાખો કેસોને સીધી અસર',
        relativeTimeGu: '7 કલાક પહેલાં',
        views: 140000,
        isHighlighted: true
      },
      {
        id: 'nat-sub-2-3',
        slug: 'new-health-insurance-scheme-announced-538',
        image: '/assets/demo/8.jpg',
        titleGu: 'કરોડો લોકોને ફાયદો! કેન્દ્રે જાહેર કરી નવી આરોગ્ય વીમા યોજના',
        relativeTimeGu: '8 કલાક પહેલાં',
        views: 160000
      }
    ]
  },
  {
    colId: 'nat-col-3',
    featured: {
      id: 'nat-feat-3',
      slug: 'farmers-good-news-new-msp-declared-539',
      image: '/assets/demo/5.jpg',
      titleGu: 'ખેડૂતો માટે ખુશખબર! નવી MSP જાહેર, કઠોળના ભાવમાં વધારો',
      relativeTimeGu: '6 કલાક પહેલાં',
      views: 12000
    },
    subs: [
      {
        id: 'nat-sub-3-1',
        slug: '6g-trials-start-in-india-testing-soon-540',
        image: '/assets/demo/7.jpg',
        titleGu: 'દેશમાં 6G ટ્રાયલ શરૂ! ટૂંક સમયમાં પસંદગીના શહેરોમાં ટેસ્ટિંગ',
        relativeTimeGu: '10 કલાક પહેલાં',
        views: 27000
      },
      {
        id: 'nat-sub-3-2',
        slug: 'women-entrepreneurs-loan-scheme-zero-interest-541',
        image: '/assets/demo/4.jpg',
        titleGu: 'મહિલા ઉદ્યોગ સાહસિકો માટે મોટી રાહત! નવી લોન યોજનામાં 0% વ્યાજ',
        relativeTimeGu: '11 કલાક પહેલાં',
        views: 33000
      },
      {
        id: 'nat-sub-3-3',
        slug: 'new-expressway-network-approved-connect-10-cities-542',
        image: '/assets/demo/8.jpg',
        titleGu: 'દેશના 10 મોટા શહેરોને જોડતો નવો એક્સપ્રેસવે નેટવર્ક મંજૂર!',
        relativeTimeGu: '12 કલાક પહેલાં',
        views: 46000
      }
    ]
  }
];

/* --- National Section ("દેશ" Zone) ----------------------------- */
export default function NationalSection({ language }: { language: Language }) {
  const [dbNationalArticles, setDbNationalArticles] = useState<Article[]>([]);

  useEffect(() => {
    // Fetch national articles directly with categorySlug filter so we get all of them
    getPublicArticles({ categorySlug: 'national', limit: 12 }).then((res) => {
      if (res && res.articles && res.articles.length > 0) {
        setDbNationalArticles(res.articles);
      }
    });
  }, []);

  const top3 = useMemo(() => {
    const list: Array<{ id: string; slug: string; image: string; article: Article | null; titleGu: string; time: string }> = [];
    dbNationalArticles.slice(0, 3).forEach((art) => {
      list.push({
        id: art.id,
        slug: art.slug,
        image: art.image || DEMO_IMAGES[0],
        article: art,
        titleGu: art.titleGu || art.title,
        time: formatTime(art.publishedAt),
      });
    });
    if (list.length < 3) {
      mockNationalColumns.forEach((col) => {
        if (list.length < 3 && !list.some((item) => item.id === col.featured.id)) {
          list.push({ id: col.featured.id, slug: col.featured.slug, image: col.featured.image, article: null, titleGu: col.featured.titleGu, time: getMockRelativeTime(col.featured.relativeTimeGu, language) });
        }
      });
    }
    return list;
  }, [dbNationalArticles]);

  const bottomGrid = useMemo(() => {
    const list: Array<{ id: string; slug: string; image: string; article: Article | null; titleGu: string; time: string }> = [];
    dbNationalArticles.slice(3, 12).forEach((art) => {
      list.push({
        id: art.id,
        slug: art.slug,
        image: art.image || DEMO_IMAGES[1],
        article: art,
        titleGu: art.titleGu || art.title,
        time: formatTime(art.publishedAt),
      });
    });
    if (list.length < 9) {
      mockNationalColumns.forEach((col) => {
        col.subs.forEach((sub) => {
          if (list.length < 9 && !list.some((item) => item.id === sub.id)) {
            list.push({ id: sub.id, slug: sub.slug, image: sub.image, article: null, titleGu: sub.titleGu, time: getMockRelativeTime(sub.relativeTimeGu, language) });
          }
        });
      });
    }
    const col1 = list.filter((_, i) => i % 3 === 0);
    const col2 = list.filter((_, i) => i % 3 === 1);
    const col3 = list.filter((_, i) => i % 3 === 2);
    return { col1, col2, col3, totalRows: Math.max(col1.length, col2.length, col3.length) };
  }, [dbNationalArticles]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-1">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 mb-3.5">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'દેશ' : language === 'hi' ? 'देश' : 'National'}
        </span>
        <Link
          href="/category/national"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More →'}
        </Link>
      </div>

      {/* Top Row: 3 Featured Big Image Article Cards from DB */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-4">
        {top3.map((item) => (
          <div key={item.id} className="flex flex-col justify-between min-w-0 border-b border-border/40 pb-3">
            <Link href={`/news/${item.slug}`} className="group flex flex-col">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5">
                <ArticleMedia src={item.image} alt={item.titleGu} className="transition-transform duration-300 group-hover:scale-105" />
              </div>
              <h3 className="text-[14px] md:text-[15.5px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                {item.article
                  ? <AutoArticleTitle article={item.article} language={language} />
                  : <AutoTranslateString text={item.titleGu} language={language} />}
              </h3>
            </Link>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold mt-2.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>{item.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Grid: Sub-articles in 3 columns */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: bottomGrid.totalRows }).map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {[bottomGrid.col1[rowIdx], bottomGrid.col2[rowIdx], bottomGrid.col3[rowIdx]].map((sub, colIdx) => {
              if (!sub) return <div key={colIdx} />;
              return (
                <Link key={sub.id} href={`/news/${sub.slug}`} className="group flex gap-3 hover:bg-muted/10 transition-colors p-1 min-w-0">
                  <div className="relative h-[56px] w-[86px] shrink-0 overflow-hidden rounded-sm border border-border/10 bg-muted">
                    <ArticleMedia src={sub.image} alt={sub.titleGu} className="transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <h4 className="text-[12.5px] font-extrabold leading-snug line-clamp-2 text-foreground group-hover:text-[#B3121B] transition-colors">
                      {sub.article
                        ? <AutoArticleTitle article={sub.article} language={language} />
                        : <AutoTranslateString text={sub.titleGu} language={language} />}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground font-semibold">
                      <Clock className="h-3 w-3 text-muted-foreground/60" />
                      <span>{sub.time}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
export { NationalSection };

