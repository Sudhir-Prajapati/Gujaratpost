'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Flame, ChevronRight } from 'lucide-react';
import type { Article, Language } from '@/types';
import { formatTime } from '@/data';
import { getPublicArticles } from '@/lib/api';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import { DEMO_IMAGES, getMockRelativeTime } from './homeHelpers';


const mockPoliticsColumns = [
  {
    colId: 'pol-col-1',
    featured: {
      id: 'pol-feat-1',
      slug: 'gujarat-election-2027-preparations-active-501',
      image: '/assets/demo/4.jpg',
      categoryGu: 'ચૂંટણી',
      titleGu: 'ગુજરાત ચૂંટણી 2027 નજીક! જિલ્લાઓમાં તૈયારીઓ તેજ, સત્તાધારી પક્ષ સક્રિય',
      relativeTimeGu: '1 કલાક પહેલાં',
      views: 71000
    },
    subs: [
      {
        id: 'pol-sub-1-1',
        slug: 'delhi-politics-seat-sharing-talks-500',
        titleGu: 'સીટ શેરીંગ ફોર્મ્યુલા નક્કી: ગઠબંધન પક્ષો વચ્ચે બેઠકોની વહેંચણી ફાઈનલ'
      },
      {
        id: 'pol-sub-1-2',
        slug: 'state-assembly-speaker-rules-501',
        titleGu: 'વિધાનસભા સ્પીકરની ચેતવણી: તમામ સભ્યોને ગૃહની ગરિમા જાળવવા આદેશ'
      },
      {
        id: 'pol-sub-1-3',
        slug: 'government-policy-infrastructure-development-502',
        titleGu: 'નવા ઇન્ફ્રાસ્ટ્રક્ચર પ્રોજેક્ટ્સને મંજૂરી: રાજ્ય સરકારનો મોટો નિર્ણય'
      }
    ]
  },
  {
    colId: 'pol-col-2',
    featured: {
      id: 'pol-feat-2',
      slug: 'aap-ground-network-expansion-gujarat-502',
      image: '/assets/demo/1.jpg',
      categoryGu: 'AAP',
      titleGu: 'AAPનો મોટો દાવો! ગ્રામ્ય ગુજરાતમાં ભૂ-સ્તરીય નેટવર્ક વિસ્તાર્યું',
      relativeTimeGu: '2 કલાક પહેલાં'
    },
    subs: [
      {
        id: 'pol-sub-2-1',
        slug: 'ahmedabad-municipal-commissioner-dispute-503',
        titleGu: 'મોટો વિવાદ! અમદાવાદ મ્યુનિ. કમિશનરે તંત્ર સામે વાંધો ઉઠાવ્યો'
      },
      {
        id: 'pol-sub-2-2',
        slug: 'military-training-irregularities-promotions-cancelled-504',
        titleGu: 'સૈન્ય તાલીમમાં મોટી ગેરરીતિ! 100થી વધુ પ્રમોશન રદ કરાયા'
      },
      {
        id: 'pol-sub-2-3',
        slug: 'congress-unveils-strategy-2027-election-505',
        titleGu: 'કોંગ્રેસે ખોલ્યા પત્તા! 2027 ચૂંટણી ઝુંબેશ વ્યુહ જાહેર કર્યો'
      }
    ]
  },
  {
    colId: 'pol-col-3',
    featured: {
      id: 'pol-feat-3',
      slug: 'assembly-monsoon-session-commotion-unemployment-506',
      image: '/assets/demo/3.jpg',
      categoryGu: 'વિધાનસભા',
      titleGu: 'વિધાનસભા ચોમાસુ સત્રમાં હોબાળો! વિપક્ષે બેરોજગારી મુદ્દે સ્થગન પ્રસ્તાવ આપ્યો',
      relativeTimeGu: '3 કલાક પહેલાં'
    },
    subs: [
      {
        id: 'pol-sub-3-1',
        slug: 'high-court-notice-state-govt-recruitment-507',
        titleGu: 'હાઈકોર્ટની આકરી નોટિસ! રાજ્ય સરકારને ભરતી પ્રક્રિયા અંગે જવાબ માંગ્યો'
      },
      {
        id: 'pol-sub-3-2',
        slug: 'union-minister-gujarat-visit-industrial-corridor-announcement-508',
        titleGu: 'કેન્દ્રીય મંત્રીની ગુજરાત મુલાકાત! નવા ઔદ્યોગિક કોરિડોરની જાહેરાત શક્ય'
      },
      {
        id: 'pol-sub-3-3',
        slug: 'voter-list-revision-campaign-starts-online-registration-appeal-509',
        titleGu: 'મતદાર યાદી સુધારણા ઝુંબેશ શરૂ! નાગરિકોને ઓનલાઈન નોંધણીની અપીલ'
      }
    ]
  }
];

const mockPoliticsBottomCards = [
  {
    id: 'pol-bot-1',
    slug: 'cm-meeting-vibrant-gujarat-rural-development-511',
    image: '/assets/demo/5.jpg',
    categoryGu: 'મુખ્યમંત્રી',
    titleGu: 'CMની મોટી બેઠક! વિકાસ પ્રોજેક્ટ માટે સમીક્ષા, ગ્રામીણ વિસ્તારો પર ભાર',
    relativeTimeGu: '2 કલાક પહેલાં',
    views: 74000
  },
  {
    id: 'pol-bot-2',
    slug: 'bjp-state-executive-meeting-organization-expansion-512',
    image: '/assets/demo/6.jpg',
    categoryGu: 'ભાજપ',
    titleGu: 'ભાજપ પ્રદેશ કારોબારીની બેઠકમાં સંગઠન વિસ્તરણ પર મોટી ચર્ચા',
    relativeTimeGu: '3 કલાક પહેલાં',
    views: 78000
  },
  {
    id: 'pol-bot-3',
    slug: 'police-recruitment-10000-posts-513',
    image: '/assets/demo/2.jpg',
    categoryGu: 'ગૃહ વિભાગ',
    titleGu: 'યુવાનો માટે મોટી તક! પોલીસ ભરતીમાં 10,000 જગ્યાઓ ટૂંક સમયમાં ભરાશે',
    relativeTimeGu: '12 કલાક પહેલાં',
    views: 33000
  },
  {
    id: 'pol-bot-4',
    slug: 'municipal-corporation-election-ward-delimitation-514',
    image: '/assets/demo/3.jpg',
    categoryGu: 'સ્થાનિક સ્વરાજ્ય',
    titleGu: 'મહાનગરપાલિકા ચૂંટણી નજીક! વોર્ડ સીમાંકનની પ્રક્રિયા શરૂ',
    relativeTimeGu: '13 કલાક પહેલાં',
    views: 46000
  },
  {
    id: 'pol-bot-5',
    slug: 'alliance-possibility-before-next-election-515',
    image: '/assets/demo/7.jpg',
    categoryGu: 'ગઠબંધન',
    titleGu: 'આગામી ચૂંટણી પહેલાં મોટી હલચલ! નાના પક્ષો વચ્ચે ગઠબંધનની શક્યતાઓ તપાસાઈ રહી છે',
    relativeTimeGu: '14 કલાક પહેલાં',
    views: 52000
  },
  {
    id: 'pol-bot-6',
    slug: 'gujarat-assembly-session-dates-declared-516',
    image: '/assets/demo/4.jpg',
    categoryGu: 'વિધાનસભા',
    titleGu: 'વિધાનસભાનું ચોમાસું સત્ર ટૂંક સમયમાં યોજાશે! મહત્વના વિધેયકો રજૂ થવાની શક્યતા',
    relativeTimeGu: '15 કલાક પહેલાં',
    views: 61000
  }
];

/* --- Politics Section ("રાજકારણ" Zone) ----------------------------- */
export default function PoliticsSection({ language, initialArticles }: { language: Language; initialArticles?: Article[] }) {
  const [dbPoliticsArticles, setDbPoliticsArticles] = useState<Article[]>(initialArticles || []);

  useEffect(() => {
    if (initialArticles && initialArticles.length >= 3) return;
    getPublicArticles({ categorySlug: 'politics', limit: 12 }).then((res) => {
      if (res && res.articles && res.articles.length > 0) {
        setDbPoliticsArticles(res.articles);
      }
    });
  }, [initialArticles]);

  const top3 = useMemo(() => {
    const list: Array<{ id: string; slug: string; image: string; article: Article | null; titleGu: string; categoryGu: string; time: string }> = [];
    dbPoliticsArticles.slice(0, 3).forEach((art) => {
      list.push({
        id: art.id,
        slug: art.slug,
        image: art.image || DEMO_IMAGES[0],
        categoryGu: art.categoryGu || art.category || 'રાજકારણ',
        article: art,
        titleGu: art.titleGu || art.title,
        time: formatTime(art.publishedAt),
      });
    });
    if (list.length < 3) {
      mockPoliticsColumns.forEach((col) => {
        if (list.length < 3 && !list.some((item) => item.id === col.featured.id)) {
          list.push({
            id: col.featured.id,
            slug: col.featured.slug,
            image: col.featured.image,
            categoryGu: col.featured.categoryGu,
            article: null,
            titleGu: col.featured.titleGu,
            time: getMockRelativeTime(col.featured.relativeTimeGu, language),
          });
        }
      });
    }
    return list;
  }, [dbPoliticsArticles, language]);

  const bottomGrid = useMemo(() => {
    const list: Array<{ id: string; slug: string; image: string; article: Article | null; titleGu: string; categoryGu: string; time: string }> = [];
    dbPoliticsArticles.slice(3, 9).forEach((art) => {
      list.push({
        id: art.id,
        slug: art.slug,
        image: art.image || DEMO_IMAGES[1],
        categoryGu: art.categoryGu || art.category || 'રાજકારણ',
        article: art,
        titleGu: art.titleGu || art.title,
        time: formatTime(art.publishedAt),
      });
    });
    if (list.length < 6) {
      mockPoliticsBottomCards.forEach((card) => {
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
  }, [dbPoliticsArticles, language]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 mt-8">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-6">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'રાજકારણ' : language === 'hi' ? 'राजनीति' : 'Politics'}
        </span>
        <Link
          href="/category/politics"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More →'}
        </Link>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {top3.map((card) => (
          <div key={card.id} className="flex flex-col min-w-0">
            <div className="flex flex-col min-w-0">
              <Link
                href={`/news/${card.slug}`}
                className="group flex flex-col mb-2.5"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5">
                  <ArticleMedia
                    src={card.image}
                    alt={card.titleGu}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="text-[#B3121B] font-extrabold text-[12px] md:text-[13px] mb-1.5 select-none uppercase">
                  <AutoTranslateString text={card.categoryGu} language={language} />
                </span>
                <h3 className="text-[14px] md:text-[15.5px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2 min-h-[40px] md:min-h-[46px]">
                  {card.article
                    ? <AutoArticleTitle article={card.article} language={language} />
                    : <AutoTranslateString text={card.titleGu} language={language} />}
                </h3>
              </Link>

              {/* Clock Meta Row */}
              <div className="flex items-center gap-1.5 mb-1 pb-2 border-b border-border/40 text-[10.5px] text-muted-foreground font-semibold">
                <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>{card.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 6-Card Politics Bottom Grid — Perfect 2x3 on Mobile, 3x2 on Tablet, 6-Col on Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 border-t border-border/40 pt-6 mt-6">
        {bottomGrid.map((card, idx) => {
          const isLastOdd = bottomGrid.length % 2 !== 0 && idx === bottomGrid.length - 1;
          return (
            <div
              key={card.id}
              className={`flex flex-col min-w-0 ${isLastOdd ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <Link
                href={`/news/${card.slug}`}
                className={`group flex ${isLastOdd ? 'flex-row sm:flex-col items-center sm:items-start gap-3 sm:gap-0' : 'flex-col'}`}
              >
                <div className={`relative aspect-[16/10] overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5 ${isLastOdd ? 'w-28 sm:w-full h-20 sm:h-auto shrink-0 mb-0 sm:mb-2.5' : 'w-full'}`}>
                  <ArticleMedia
                    src={card.image}
                    alt={card.titleGu}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[#B3121B] font-extrabold text-[11px] mb-1 select-none uppercase leading-none">
                    <AutoTranslateString text={card.categoryGu} language={language} />
                  </span>
                  <h4 className="text-[12.5px] md:text-[13px] font-extrabold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
                    {card.article
                      ? <AutoArticleTitle article={card.article} language={language} />
                      : <AutoTranslateString text={card.titleGu} language={language} />}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-2 text-[10.5px] text-muted-foreground font-semibold">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                    <span>{card.time}</span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
export { PoliticsSection };

