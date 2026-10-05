'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Vote, ChevronRight, TrendingUp } from 'lucide-react';
import type { Article, Language } from '@/types';
import { getArticleTitle } from '@/data';
import { getPublicArticles } from '@/lib/api';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle, AutoArticleExcerpt, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import AdSectionBanner from '@/components/ads/AdSectionBanner';

const FALLBACK_ELECTION_ARTICLES: any[] = [
  {
    id: 'elec-fallback-1',
    slug: 'gujarat-assembly-election-2027-ground-preparations-underway',
    title: 'Gujarat Election 2027: Political parties gear up with ground campaigns across districts',
    titleGu: 'ગુજરાત ચૂંટણી 2027: તમામ 182 બેઠકો માટે રાજકીય પક્ષોએ શરૂ કરી જમીની તૈયારીઓ, સંગઠન બેઠકો તેજ',
    excerptGu: 'વિધાનસભા ચૂંટણી 2027ને ધ્યાનમાં રાખીને સત્તાધારી પક્ષ અને વિપક્ષ બંને દ્વારા પાયાના સ્તરે સંગઠન મજબૂત કરવા કાર્યક્રમો જાહેર કરાયા.',
    image: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'elec-fallback-2',
    slug: 'gujarat-election-2027-voter-list-revision-drive',
    title: 'Voter list revision drive announced across Gujarat ahead of upcoming assembly elections',
    titleGu: 'ચૂંટણી પંચ દ્વારા મતદાર યાદી સુધારણા ઝુંબેશ શરૂ: નવા યુવા મતદારો માટે ઓનલાઇન રજિસ્ટ્રેશન પ્રક્રિયા',
    image: 'https://images.unsplash.com/photo-1575320181282-9afab399332c?auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'elec-fallback-3',
    slug: 'gujarat-2027-district-wise-political-equations',
    title: 'District-wise political analysis: Key constituencies to watch in 2027 elections',
    titleGu: 'સૌરાષ્ટ્ર અને ઉત્તર ગુજરાતમાં નવા સમીકરણો: સ્થાનિક મુદ્દાઓ અને ખેડૂત કલ્યાણ યોજનાઓ પર ચર્ચા',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'elec-fallback-4',
    slug: 'parties-focus-on-youth-and-employment-for-2027',
    title: 'Parties focus heavily on youth voter engagement and development agenda',
    titleGu: 'યુવા મતદારો અને રોજગાર મુદ્દો કેન્દ્રસ્થાને: ડિજિટલ પ્રચાર અને સોશિયલ મીડિયા વોર શરૂ',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'elec-fallback-5',
    slug: 'rural-gujarat-infrastructure-survey-ahead-of-polls',
    title: 'Rural infrastructure and civic governance become focal points in poll debates',
    titleGu: 'ગ્રામીણ વિકાસ અને ઈન્ફ્રાસ્ટ્રક્ચર પ્રોજેક્ટ્સની સમીક્ષા: ગ્રામસભા અને લોકસંપર્ક યાત્રાઓનું આયોજન',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'elec-fallback-6',
    slug: 'women-representation-in-gujarat-politics-2027',
    title: 'Women leadership and community participation in Gujarat election landscape',
    titleGu: 'મહિલા નેતૃત્વ અને પંચાયતોમાં સહભાગિતા: પક્ષો દ્વારા મહિલા વિંગ સક્રિય કરવા વિશેષ સૂચનાઓ',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    publishedAt: new Date().toISOString(),
  },
];

export default function ElectionSection({
  language,
  initialArticles,
}: {
  language: Language;
  initialArticles?: Article[];
}) {
  const [articles, setArticles] = useState<Article[]>(
    initialArticles && initialArticles.length >= 3 ? initialArticles : FALLBACK_ELECTION_ARTICLES
  );

  useEffect(() => {
    let isMounted = true;
    getPublicArticles({ categorySlug: 'election-2027', limit: 10 })
      .then((res) => {
        if (isMounted && res?.articles && res.articles.length > 0) {
          setArticles(res.articles);
        }
      })
      .catch(() => {
        // Fallback remains active
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const badgeTitle = language === 'gu' ? 'ચૂંટણી 2027' : language === 'hi' ? 'चुनाव 2027' : 'Election 2027';
  const subtitle =
    language === 'gu'
      ? 'ગુજરાત ચૂંટણી 2027 • વિશેષ કવરેજ, પક્ષોની તૈયારીઓ અને ગ્રાઉન્ડ રિપોર્ટ્સ'
      : language === 'hi'
      ? 'गुजरात चुनाव 2027 • विशेष कवरेज, दलों की तैयारी और ग्राउंड रिपोर्ट्स'
      : 'Gujarat Election 2027 • Special Coverage & Ground Reports';

  const lead = articles[0] || FALLBACK_ELECTION_ARTICLES[0];
  const sideList = articles.slice(1, 6);

  return (
    <section className="mx-auto max-w-screen-xl px-4 mt-4 mb-2 select-none" id="election-2027" suppressHydrationWarning>
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 mb-4">
        <div className="flex items-center gap-3">
          <span className="section-heading-badge bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg leading-none tracking-tight flex items-center gap-2 shadow-xs">
            <Vote className="h-4.5 w-4.5" />
            <span>{badgeTitle}</span>
          </span>
          <span className="hidden sm:inline-block text-[13px] md:text-[14px] font-bold text-muted-foreground truncate max-w-md">
            {subtitle}
          </span>
        </div>
        <Link
          href="/category/election-2027"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[15px] md:text-[16px] hover:underline shrink-0"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : language === 'hi' ? 'और देखें →' : 'View More →'}
        </Link>
      </div>

      {/* Grid Layout: Lead (7 cols) + Side List (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
        {/* Lead Article (Left 7 Cols) */}
        <div className="lg:col-span-7">
          <Link
            href={`/news/${lead.slug}`}
            className="group flex flex-col h-full rounded-2xl overflow-hidden border border-border/80 bg-card hover:border-[#B3121B]/40 shadow-xs hover:shadow-md transition-all duration-300"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
              <ArticleMedia
                src={lead.image || (lead as any).featuredImage || '/assets/demo/1.jpg'}
                alt={getArticleTitle(lead, language)}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
              <div className="absolute top-3 left-3 bg-[#B3121B] text-white text-[11px] font-black uppercase px-3 py-1 rounded-md shadow-md tracking-wider flex items-center gap-1.5">
                <Vote className="h-3 w-3" />
                <span>{language === 'gu' ? 'વિશેષ કવરેજ • ચૂંટણી 2027' : 'Special Coverage 2027'}</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
              <div>
                <h3 className="text-[18px] sm:text-[20px] md:text-[22px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                  <AutoArticleTitle article={lead} language={language} />
                </h3>
                <p className="mt-2 text-[14px] font-bold text-muted-foreground line-clamp-2 leading-relaxed">
                  <AutoArticleExcerpt article={lead} language={language} />
                </p>
              </div>

              <div className="flex items-center justify-end pt-3 mt-3 border-t border-border/50 text-[12px] font-bold text-muted-foreground">
                <span className="text-[#B3121B] font-black group-hover:underline">
                  {language === 'gu' ? 'સંપૂર્ણ અહેવાલ વાંચો →' : 'Read Full Story →'}
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Side Updates (Right 5 Cols) */}
        <div className="lg:col-span-5">
          {/* Mobile View (< md): Flat list with Text on LEFT, Thumbnail on RIGHT (like Image 2) */}
          <div className="md:hidden flex flex-col divide-y divide-border/40">
            {sideList.map((art, idx) => (
              <Link
                key={`mob-${art.id || idx}`}
                href={`/news/${art.slug}`}
                className="group flex flex-row items-center justify-between gap-3.5 py-3 px-1 hover:bg-muted/20 transition-all min-w-0"
              >
                {/* Content on Left */}
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] text-[#B3121B]">●</span>
                    <span className="text-[#B3121B] font-black text-[11px] uppercase tracking-wider select-none leading-none">
                      #{idx + 1} {language === 'gu' ? 'ચૂંટણી અપડેટ' : language === 'hi' ? 'चुनाव अपडेट' : 'Election Update'}
                    </span>
                  </div>
                  <h4 className="text-[15px] font-extrabold leading-[1.36] text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
                    <AutoArticleTitle article={art} language={language} />
                  </h4>
                </div>

                {/* Thumbnail on Right */}
                <div className="relative aspect-[16/10] w-[105px] h-[72px] shrink-0 rounded-lg overflow-hidden border border-border/10 bg-muted">
                  <ArticleMedia
                    src={art.image || (art as any).featuredImage || `/assets/demo/${(idx % 8) + 1}.jpg`}
                    alt={getArticleTitle(art, language)}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop View (>= md): Exactly preserved boxed cards with thumbnail on LEFT */}
          <div className="hidden md:flex flex-col gap-3">
            {sideList.map((art, idx) => (
              <Link
                key={art.id || idx}
                href={`/news/${art.slug}`}
                className="group flex items-center gap-3.5 p-3 rounded-xl border border-border/80 bg-card hover:border-[#B3121B]/40 hover:bg-muted/15 transition-all shadow-2xs"
              >
                <div className="relative h-[74px] w-[100px] sm:h-[80px] sm:w-[110px] shrink-0 rounded-lg overflow-hidden bg-muted border border-border/30">
                  <ArticleMedia
                    src={art.image || (art as any).featuredImage || `/assets/demo/${(idx % 8) + 1}.jpg`}
                    alt={getArticleTitle(art, language)}
                    className="object-cover transition-transform duration-300 group-hover:scale-108"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 text-[11px] font-black text-[#B3121B]">
                    <span>#{idx + 1}</span>
                    <span>•</span>
                    <span>{language === 'gu' ? 'ચૂંટણી અપડેટ' : 'Election Update'}</span>
                  </div>
                  <h4 className="text-[14px] sm:text-[14.5px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                    <AutoArticleTitle article={art} language={language} />
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
