'use client';

import React, { useState, useRef, useEffect, useMemo, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Eye, Play, ChevronRight, ChevronLeft, Shield, Sun, Cloud, CloudRain, Flame, Thermometer, Droplet, Wind, Sparkles } from 'lucide-react';
import type { Article, Language } from '@/types';
import { formatTime, getLocationLabel, getLocalized } from '@/data';
import { getPublicArticles, getPublicWeather, getPublicAstrology } from '@/lib/api';
import { ZODIAC_SIGNS, ZodiacSign } from '@/components/sections/AstrologySection';
import { ZodiacIcon, GUJARAT_ZODIAC_LETTERS } from '@/components/ui/ZodiacIcon';
import ZodiacDetailModal from '@/components/sections/ZodiacDetailModal';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { AutoArticleTitle, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import { DEMO_IMAGES, getMockTime, getMockTitle, getMockRelativeTime, toGuLocal } from './homeHelpers';

export default function CrimeSection({
  language,
  view = 'all',
  initialArticles,
  initialWeather,
  initialAstrology,
}: {
  language: Language;
  view?: 'content' | 'sidebar' | 'all';
  initialArticles?: Article[];
  initialWeather?: any;
  initialAstrology?: ZodiacSign[];
}) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [popularStartIndex, setPopularStartIndex] = useState(0);
  const [selectedZodiac, setSelectedZodiac] = useState<ZodiacSign | null>(null);
  const [astrologySigns, setAstrologySigns] = useState<ZodiacSign[]>(initialAstrology || ZODIAC_SIGNS);
  const [dbCrimeArticles, setDbCrimeArticles] = useState<Article[]>(initialArticles || []);
  const [weatherData, setWeatherData] = useState<any>(initialWeather || {
    city: 'અમદાવાદ',
    cityEn: 'Ahmedabad',
    temp: 32,
    humidity: 68,
    windSpeed: 14,
    conditionGu: 'આંશિક વાદળછાયું',
    conditionEn: 'Partly cloudy',
  });

  useEffect(() => {
    if (!initialArticles || initialArticles.length < 3) {
      getPublicArticles({ categorySlug: 'crime', limit: 25 }).then((crimeRes) => {
        if (crimeRes && crimeRes.articles && crimeRes.articles.length > 0) {
          setDbCrimeArticles(crimeRes.articles);
        }
      });
    }
    if (!initialWeather) {
      getPublicWeather('ahmedabad').then((wRes) => {
        if (wRes) {
          setWeatherData(wRes);
        }
      });
    }
    if (!initialAstrology) {
      getPublicAstrology().then((signs) => {
        if (Array.isArray(signs) && signs.length > 0) {
          setAstrologySigns(signs);
        }
      });
    }
  }, [initialArticles, initialWeather, initialAstrology]);

  const mockSlides = [
    {
      id: 'c1',
      slug: 'cyber-cell-busts-fake-investment-app-network-in-ahmedabad-93',
      image: '/assets/demo/3.jpg',
      titleGu: 'અમદાવાદમાં કરોડોનું કૌભાંડ! ફેક ઇન્વેસ્ટમેન્ટ એપ નેટવર્કનો પર્દાફાશ, અનેક ધરપકડ',
      title: 'Crores scam in Ahmedabad! Fake investment app network busted, many arrested',
      titleHi: 'अहमदाबाद में करोड़ों का घोटाला! फेक निवेश ऐप नेटवर्क का भंडाफोड़, कई गिरफ्तार',
      relativeTimeGu: '1 કલાક પહેલાં',
      relativeTime: '1 hour ago',
      relativeTimeHi: '1 घंटा पहले',
      categoryGu: 'અમદાવાદ',
      category: 'Ahmedabad',
      categoryHi: 'अहमदाबाद',
      viewsGu: '68K',
      views: '68K'
    },
    {
      id: 'c2',
      slug: 'surat-police-seize-contraband-worth-crores-in-joint-raid-94',
      image: '/assets/demo/6.jpg',
      titleGu: 'સુરત પોલીસની સંયુક્ત રેડ! કરોડોની મુદ્દામાલ જપ્ત',
      title: 'Joint raid by Surat police! Contraband worth crores seized',
      titleHi: 'सूरत पुलिस की संयुक्त छापेमारी! करोड़ों का माल जब्त',
      relativeTimeGu: '2 કલાક પહેલાં',
      relativeTime: '2 hours ago',
      relativeTimeHi: '2 घंटे पहले',
      categoryGu: 'સુરત',
      category: 'Surat',
      categoryHi: 'सूरत',
      viewsGu: '71K',
      views: '71K'
    },
    {
      id: 'c3',
      slug: 'kidnapping-racket-busted-in-rajkot-five-arrested-95',
      image: '/assets/demo/4.jpg',
      titleGu: 'રાજકોટમાં અપહરણ ગેંગનો પર્દાફાશ! પાંચ આરોપી ઝડપાયા',
      title: 'Kidnapping gang exposed in Rajkot! Five suspects arrested',
      titleHi: 'राजकोट में अपहरण गिरोह का पर्दाफाश! पांच आरोपी गिरफ्तार',
      relativeTimeGu: '3 કલાક પહેલાં',
      relativeTime: '3 hours ago',
      relativeTimeHi: '3 घंटे पहले',
      categoryGu: 'રાજકોટ',
      category: 'Rajkot',
      categoryHi: 'राजकोट',
      viewsGu: '74K',
      views: '74K'
    }
  ];

  const mockList = [
    {
      id: 'l1',
      slug: 'atm-skimming-gang-caught-after-months-of-investigation-96',
      titleGu: 'વડોદરામાં ATM સ્કીમિંગ ગેંગ ઝડપાઈ! મહિનાઓની તપાસ બાદ ભાંડો ફૂટ્યો',
      title: 'ATM skimming gang caught in Vadodara! Secret busted after months of investigation',
      titleHi: 'वडोदरा में एटीएम स्किमिंग गैंग पकड़ी गई! महीनों की जांच के बाद हुआ खुलासा',
      relativeTimeGu: '4 કલાક પહેલાં',
      relativeTime: '4 hours ago',
      relativeTimeHi: '4 घंटे पहले',
      categoryGu: 'વડોદરા',
      category: 'Vadodara',
      categoryHi: 'વડોદરા',
      viewsGu: '78K',
      views: '78K'
    },
    {
      id: 'l2',
      slug: 'drug-trafficking-route-from-pakistan-via-gujarat-busted-98',
      titleGu: 'ભાવનગરમાં દારૂનો મોટો જથ્થો ઝડપાયો, ત્રણ આરોપી કબજે',
      title: 'Huge alcohol haul seized in Bhavnagar, three suspects in custody',
      titleHi: 'भावनगर में शराब का बड़ा जहीरा जब्त, तीन आरोपी गिरफ्तार',
      relativeTimeGu: '5 કલાક પહેલાં',
      relativeTime: '5 hours ago',
      relativeTimeHi: '5 घंटे पहले',
      categoryGu: 'ભાવનગર',
      category: 'Bhavnagar',
      categoryHi: 'भावनगर',
      viewsGu: '81K',
      views: '81K'
    },
    {
      id: 'l3',
      slug: 'land-fraud-case-senior-official-arrested-in-vadodara-97',
      titleGu: 'જૂનાગઢમાં ઓનલાઇન લોન એપના નામે બ્લેકમેલિંગ! ફરિયાદ નોંધાઈ',
      title: 'Blackmailing in Junagadh in the name of online loan apps! FIR registered',
      titleHi: 'जूनागढ़ में ऑनलाइन लोन ऐप के नाम पर ब्लैकमेलिंग! शिकायत दर्ज',
      relativeTimeGu: '6 કલાક પહેલાં',
      relativeTime: '6 hours ago',
      relativeTimeHi: '6 घंटे पहले',
      categoryGu: 'જૂનાગઢ',
      category: 'Junagadh',
      categoryHi: 'जूनागढ़',
      viewsGu: '90K',
      views: '90K'
    },
    {
      id: 'l4',
      slug: 'land-fraud-case-senior-official-arrested-in-vadodara-97',
      titleGu: 'જૂનાગઢમાં ઓનલાઇન લોન એપના નામે બ્લેકમેલિંગ! ફરિયાદ નોંધાઈ',
      title: 'Blackmailing in Junagadh in the name of online loan apps! FIR registered',
      titleHi: 'जूनागढ़ में ऑनलाइन लोन ऐप के नाम पर ब्लैकमेलिंग! शिकायत दर्ज',
      relativeTimeGu: '6 કલાક પહેલાં',
      relativeTime: '6 hours ago',
      relativeTimeHi: '6 घंटे पहले',
      categoryGu: 'જૂનાગઢ',
      category: 'Junagadh',
      categoryHi: 'जूनागढ़',
      viewsGu: '90K',
      views: '90K'
    }
  ];

  const mockPopularColumns = [
    {
      colId: 1,
      featured: {
        id: 'pf1',
        slug: 'gujarat-election-2027-preparations-active-301',
        image: '/assets/demo/1.jpg',
        titleGu: 'ગુજરાત ચૂંટણી 2027 નજીક! જિલ્લાઓમાં તૈયારીઓ તેજ, સત્તાધારી પક્ષ સક્રિય',
        title: 'Gujarat Election 2027 near! Preparations active in districts',
        category: 'Politics'
      },
      subs: [
        {
          id: 'ps1_1',
          slug: 'cm-meeting-vibrant-gujarat-rural-development-302',
          image: '/assets/demo/3.jpg',
          titleGu: 'CMની મોટી બેઠક! વિકાસ પ્રોજેક્ટ માટે સમીક્ષા, ગ્રામીણ વિસ્તારો પર ભાર',
          relativeTimeGu: '2 કલાક પહેલાં',
          viewsGu: '33K'
        },
        {
          id: 'ps1_2',
          slug: 'bjp-state-executive-meeting-organization-expansion-303',
          image: '/assets/demo/2.jpg',
          titleGu: 'ભાજપ પ્રદેશ કારોબારીની બેઠકમાં સંગઠન વિસ્તરણ પર મોટી ચર્ચા',
          relativeTimeGu: '3 કલાક પહેલાં',
          viewsGu: '45K'
        },
        {
          id: 'ps1_3',
          slug: 'aap-claims-ground-level-network-expansion-gujarat-304',
          image: '/assets/demo/4.jpg',
          titleGu: 'AAPનો મોટો દાવો! ગ્રામ્ય ગુજરાતમાં ભૂ-સ્તરીય નેટવર્ક વિસ્તાર્યું',
          relativeTimeGu: '4 કલાક પહેલાં',
          viewsGu: '38K'
        }
      ]
    },
    {
      colId: 2,
      featured: {
        id: 'pf2',
        slug: 'major-controversy-ahmedabad-muni-commissioner-objection-305',
        image: '/assets/demo/7.jpg',
        titleGu: 'મોટો વિવાદ! અમદાવાદ મ્યુનિ. કમિશનરે તંત્ર સામે વાંધો ઉઠાવ્યો',
        title: 'Major controversy! Ahmedabad Muni Commissioner raises objection against system',
        category: 'Civic'
      },
      subs: [
        {
          id: 'ps2_1',
          slug: 'military-training-irregularities-promotions-cancelled-306',
          image: '/assets/demo/5.jpg',
          titleGu: 'સૈન્ય તાલીમમાં મોટી ગેરરીતિ! 100થી વધુ પ્રમોશન રદ કરાયા',
          relativeTimeGu: '4 કલાક પહેલાં',
          viewsGu: '28K'
        },
        {
          id: 'ps2_2',
          slug: 'congress-reveals-cards-election-campaign-strategy-307',
          image: '/assets/demo/6.jpg',
          titleGu: 'કોંગ્રેસે ખોલ્યા પત્તા! 2027 ચૂંટણી ઝુંબેશ વ્યૂહ જાહેર કર્યો',
          relativeTimeGu: '5 કલાક પહેલાં',
          viewsGu: '50K'
        },
        {
          id: 'ps2_3',
          slug: 'assembly-monsoon-session-hung-opposition-adjournment-motion-308',
          image: '/assets/demo/1.jpg',
          titleGu: 'વિધાનસભા ચોમાસુ સત્રમાં હોબાળો! વિપક્ષે બેરોજગારી મુદ્દે સ્થગન પ્રસ્તાવ આપ્યો',
          relativeTimeGu: '6 કલાક પહેલાં',
          viewsGu: '42K'
        }
      ]
    },
    {
      colId: 3,
      featured: {
        id: 'pf3',
        slug: 'high-court-strict-notice-state-government-recruitment-process-309',
        image: '/assets/demo/4.jpg',
        titleGu: 'હાઈકોર્ટની આકરી નોટિસ! રાજ્ય સરકારને ભરતી પ્રક્રિયા અંગે જવાબ માંગ્યો',
        title: 'Strict notice from High Court! State Government asked for response on recruitment process',
        category: 'Legal'
      },
      subs: [
        {
          id: 'ps3_1',
          slug: 'union-minister-visit-gujarat-industrial-corridor-302',
          image: '/assets/demo/8.jpg',
          titleGu: 'કેન્દ્રીય મંત્રીની ગુજરાત મુલાકાત! નવા ઔદ્યોગિક કોરિડોરની જાહેરાત શક્ય',
          relativeTimeGu: '1 કલાક પહેલાં',
          viewsGu: '62K'
        },
        {
          id: 'ps3_2',
          slug: 'voter-list-revision-campaign-starts-online-registration-appeal-311',
          image: '/assets/demo/1.jpg',
          titleGu: 'મતદાર યાદી સુધારણા ઝુંબેશ શરૂ! નાગરિકોને ઓનલાઈન નોંધણીની અપીલ',
          relativeTimeGu: '2 કલાક પહેલાં',
          viewsGu: '41K'
        },
        {
          id: 'ps3_3',
          slug: 'police-recruitment-10000-vacancies-filled-soon-315',
          image: '/assets/demo/7.jpg',
          titleGu: 'યુવાનો માટે મોટી તક! પોલીસ ભરતીમાં 10,000 જગ્યાઓ ટૂંક સમયમાં ભરાશે',
          relativeTimeGu: '3 કલાક પહેલાં',
          viewsGu: '55K'
        }
      ]
    }
  ];

  const mockZodiacArticles = [
    {
      id: 'za0',
      slug: 'gujarat-heavy-rain-alert-waterlogging-400',
      image: '/assets/demo/1.jpg',
      symbol: '1',
      titleGu: 'ગુજરાત ચૂંટણી 2027 નજીક! જિલ્લાઓમાં તૈયારીઓ તેજ, સત્તાધારી પક્ષ સક્રિય',
      relativeTimeGu: '30 મિનિટ પહેલાં',
      viewsGu: '2.5L'
    },
    {
      id: 'za1',
      slug: 'monsoon-2025-gujarat-rain-forecast-weather-dept-401',
      image: '/assets/demo/7.jpg',
      symbol: '2',
      titleGu: 'મોટો વિવાદ! અમદાવાદ મ્યુનિ. કમિશનરે તંત્ર સામે વાંધો ઉઠાવ્યો',
      relativeTimeGu: '1 કલાક પહેલાં',
      viewsGu: '1.8L'
    },
    {
      id: 'za2',
      slug: 'gold-silver-price-surge-latest-rates-today-402',
      image: '/assets/demo/5.jpg',
      symbol: '3',
      titleGu: 'હાઈકોર્ટની આકરી નોટિસ! રાજ્ય સરકારને ભરતી પ્રક્રિયા અંગે જવાબ માંગ્યો',
      relativeTimeGu: '2 કલાક પહેલાં',
      viewsGu: '1.5L'
    }
  ];

  const visiblePopularArticles = [
    mockZodiacArticles[popularStartIndex],
    mockZodiacArticles[(popularStartIndex + 1) % mockZodiacArticles.length],
    mockZodiacArticles[(popularStartIndex + 2) % mockZodiacArticles.length]
  ];

  const slides = useMemo(() => {
    if (dbCrimeArticles.length > 0) {
      return dbCrimeArticles.slice(0, 3).map((art) => {
        const locEn = getLocationLabel(art, 'en') || art.location || art.category || 'Crime';
        const locGu = getLocationLabel(art, 'gu') || (art as any).locationGu || art.categoryGu || art.category || 'કાઇમ';
        const locHi = getLocationLabel(art, 'hi') || (art as any).locationHi || art.categoryHi || art.category || 'क्राइम';
        return {
          id: art.id,
          slug: art.slug,
          image: art.image || DEMO_IMAGES[0],
          article: art as Article,
          category: locEn,
          categoryGu: locGu,
          categoryHi: locHi,
          title: art.title,
          titleGu: art.titleGu || art.title,
          titleHi: (art as any).titleHi || art.title,
          relativeTime: formatTime(art.publishedAt),
          relativeTimeGu: formatTime(art.publishedAt),
          relativeTimeHi: formatTime(art.publishedAt),
          clockTime: art.publishedAt ? new Date(art.publishedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '10:30 AM',
        };
      });
    }
    return mockSlides.map((s) => ({ ...s, article: null as Article | null, clockTime: getMockTime(s.id) }));
  }, [dbCrimeArticles]);

  const rightList = useMemo(() => {
    if (dbCrimeArticles.length > 3) {
      return dbCrimeArticles.slice(3, 8).map((art) => {
        const locEn = getLocationLabel(art, 'en') || art.location || art.category || 'Crime';
        const locGu = getLocationLabel(art, 'gu') || (art as any).locationGu || art.categoryGu || art.category || 'કાઇમ';
        const locHi = getLocationLabel(art, 'hi') || (art as any).locationHi || art.categoryHi || art.category || 'क्राइम';
        return {
          id: art.id,
          slug: art.slug,
          category: locEn,
          categoryGu: locGu,
          categoryHi: locHi,
          title: art.title,
          titleGu: art.titleGu || art.title,
          titleHi: (art as any).titleHi || art.title,
          relativeTime: formatTime(art.publishedAt),
          relativeTimeGu: formatTime(art.publishedAt),
          relativeTimeHi: formatTime(art.publishedAt),
          clockTime: art.publishedAt ? new Date(art.publishedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '10:45 AM',
        };
      });
    }
    return mockList.map((item) => ({ ...item, clockTime: getMockTime(item.id) }));
  }, [dbCrimeArticles, language]);

  const popularColumns = useMemo(() => {
    const remainingCrime = dbCrimeArticles.length > 8 ? dbCrimeArticles.slice(8) : dbCrimeArticles;
    const list = remainingCrime;
    if (list.length > 0) {
      const cols = [];
      for (let c = 0; c < 3; c++) {
        const featArt = list[c] || list[c % list.length];
        const subs = [];
        for (let s = 0; s < 3; s++) {
          const subIdx = 3 + c * 3 + s;
          const subArt = list[subIdx] || list[(c * 3 + s) % list.length];
          if (subArt) {
            subs.push({
              id: `${subArt.id}-c${c}-s${s}`,
              slug: subArt.slug,
              image: subArt.image || DEMO_IMAGES[s % DEMO_IMAGES.length],
              title: getLocalized(language, { en: subArt.title, gu: subArt.titleGu || subArt.title, hi: (subArt as any).titleHi || subArt.title }),
              time: formatTime(subArt.publishedAt),
            });
          }
        }
        cols.push({
          colId: c + 1,
          featured: {
            id: featArt.id,
            slug: featArt.slug,
            image: featArt.image || DEMO_IMAGES[c],
            title: getLocalized(language, { en: featArt.title, gu: featArt.titleGu || featArt.title, hi: (featArt as any).titleHi || featArt.title }),
          },
          subs,
        });
      }
      return cols;
    }

    return mockPopularColumns.map((col) => ({
      colId: col.colId,
      featured: {
        id: col.featured.id,
        slug: col.featured.slug,
        image: col.featured.image,
        title: getMockTitle(col.featured, language),
      },
      subs: col.subs.map((sub) => ({
        id: sub.id,
        slug: sub.slug,
        image: sub.image,
        title: getMockTitle(sub, language),
        time: getMockRelativeTime(sub.relativeTimeGu, language),
      })),
    }));
  }, [dbCrimeArticles, language]);

  const currentSlide = slides[slideIdx % slides.length];

  const leftContent = (
    <div className="flex flex-col min-w-0">

      {/* Crime Header */}
      <div className="flex items-end justify-between h-[46px] border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2.5 mb-6">
        <span className="bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'કાઇમ' : 'Crime'}
        </span>
        <Link
          href="/category/crime"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[13px] md:text-[14px] hover:underline pb-0.5"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : 'More See →'}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-8 items-stretch">
        {/* Slide Carousel */}
        {currentSlide && (
          <div className="group relative flex flex-col min-w-0 h-full">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted">
              <Image
                src={currentSlide.image}
                alt={currentSlide.titleGu}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <button
                type="button"
                onClick={() => setSlideIdx((prev) => (prev - 1 + slides.length) % slides.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/60 hover:bg-[#B3121B] hover:border-[#B3121B] text-white transition-all duration-200 shadow-md backdrop-blur-md z-10 cursor-pointer select-none"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5 stroke-[3px] text-white" />
              </button>
              <button
                type="button"
                onClick={() => setSlideIdx((prev) => (prev + 1) % slides.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/60 hover:bg-[#B3121B] hover:border-[#B3121B] text-white transition-all duration-200 shadow-md backdrop-blur-md z-10 cursor-pointer select-none"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5 stroke-[3px] text-white" />
              </button>
              <span className="absolute top-2.5 left-2.5 bg-black/70 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-sm z-10 select-none">
                {language === 'gu'
                  ? `${toGuLocal((slideIdx % slides.length) + 1)} / ${toGuLocal(slides.length)}`
                  : `${(slideIdx % slides.length) + 1} / ${slides.length}`}
              </span>
            </div>

            <div className="mt-3.5 flex flex-col flex-1 justify-between">
              <div>
                <span className="text-[#B3121B] font-extrabold text-[12px] md:text-[13px] mb-1 select-none uppercase tracking-wide">
                  {getLocalized(language, { en: currentSlide.category, gu: currentSlide.categoryGu, hi: currentSlide.categoryHi })}
                </span>
                <Link href={`/news/${currentSlide.slug}`} className="group/link flex flex-col justify-start">
                  <h3 className="font-extrabold text-[15.5px] md:text-[17px] leading-snug tracking-tight text-foreground hover:text-[#B3121B] transition-colors line-clamp-3">
                    {currentSlide.article
                      ? <AutoArticleTitle article={currentSlide.article} language={language} />
                      : <AutoTranslateString text={currentSlide.titleGu} language={language} />}
                  </h3>
                </Link>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold mt-auto pt-2 select-none">
                <span>
                  {getLocalized(language, { en: currentSlide.relativeTime, gu: currentSlide.relativeTimeGu, hi: currentSlide.relativeTimeHi })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span>{currentSlide.clockTime}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* List side updates (Text lists only, no images, matching the screen!) */}
        <div className="flex flex-col min-w-0 md:border-l md:border-border/60 md:pl-6 gap-0">

          {rightList.map((item, idx) => (
            <Link
              key={`${item.id}-${idx}`}
              href={`/news/${item.slug}`}
              className="group flex flex-col py-2 border-b border-border/40 last:border-b-0"
            >
              <span className="text-red-600 font-extrabold text-[11px] uppercase tracking-wide mb-0.5">
                {getLocalized(language, { en: item.category, gu: item.categoryGu, hi: item.categoryHi })}
              </span>
              <h4 className="text-[14px] md:text-[14.5px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                {getLocalized(language, { en: item.title, gu: item.titleGu, hi: item.titleHi })}
              </h4>
              <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px] text-muted-foreground font-semibold">
                <span>
                  {getLocalized(language, { en: item.relativeTime, gu: item.relativeTimeGu, hi: item.relativeTimeHi })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground/60" />
                  <span>{item.clockTime}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 3-Column Popular Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-border/40 pt-5 mt-3">
        {popularColumns.map((col) => (
          <div key={col.colId} className="flex flex-col min-w-0">
            <Link
              href={`/news/${col.featured.slug}`}
              className="group flex flex-col mb-2.5"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5">
                <ArticleMedia
                  src={col.featured.image}
                  alt={col.featured.title}
                  className="transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="text-[13px] md:text-[13.5px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                {col.featured.title}
              </h3>
            </Link>

            <div className="flex flex-col divide-y divide-border/40 border-t border-border/40 mt-1">
              {col.subs.slice(0, 3).map((sub, sIdx) => (
                <Link
                  key={`${col.colId}-${sub.id}-${sIdx}`}
                  href={`/news/${sub.slug}`}
                  className="group py-3 flex items-center gap-3"
                >
                  {/* Thumbnail photo on left */}
                  <div className="relative h-16 w-20 shrink-0 rounded-lg overflow-hidden border border-border/20 bg-muted">
                    <ArticleMedia
                      src={sub.image}
                      alt={sub.title}
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Title & Metadata on right */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <h4 className="text-[12.5px] md:text-[13px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                      {sub.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px] text-muted-foreground font-semibold select-none">
                      <span>{sub.time}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col gap-6 select-none">

      {/* Weather Widget */}
      <div className="rounded-sm bg-[#1A1A1A] text-white p-5 border border-border/10 shadow-md">
        <div className="flex items-center gap-1.5 mb-4 select-none">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
          <span className="text-[12px] md:text-[13px] font-black uppercase tracking-wider text-white/90">
            {language === 'gu' ? `હવામાન - ${weatherData.city || 'અમદાવાદ'}` : `Weather - ${weatherData.cityEn || 'Ahmedabad'}`}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <span className="text-4xl font-extrabold tracking-tight select-none">
              {language === 'gu' ? toGuLocal(weatherData.temp ?? 32) : (weatherData.temp ?? 32)}°
            </span>
            <p className="text-[12px] text-white/70 font-bold mt-1.5 select-none">
              {language === 'gu' ? (weatherData.conditionGu || 'આંશિક વાદળછાયું') : (weatherData.conditionEn || 'Partly cloudy')}
            </p>
          </div>

          <div className="relative h-12 w-12 text-yellow-400 select-none">
            <svg viewBox="0 0 24 24" className="h-full w-full fill-current">
              <path d="M19 12a7 7 0 1 0-7 7 7 7 0 0 0 7-7zm-7 5a5 5 0 1 1 5-5 5 5 0 0 1-5 5z" />
              <path d="M12 2a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1zm0 16a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1zm10-7h-1a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2zM4 11H3a1 1 0 0 0 0 2h1a1 1 0 0 0 0-2zm15.07-5.07a1 1 0 0 0-1.42 0l-.7.7a1 1 0 0 0 1.42 1.42l.7-.7a1 1 0 0 0 0-1.42zm-12.73 12.7a1 1 0 0 0-1.42 0l-.7.7a1 1 0 0 0 1.42 1.42l.7-.7a1 1 0 0 0 0-1.42zm12.73 0a1 1 0 0 0 0-1.42l-.7-.7a1 1 0 0 0-1.42 1.42l.7.7a1 1 0 0 0 1.42 0zm-12.73-12.7a1 1 0 0 0 0-1.42l-.7-.7a1 1 0 0 0-1.42 1.42l.7.7a1 1 0 0 0 1.42 0z" />
            </svg>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-6 text-[12px] font-bold text-white/80">
          <span className="flex items-center gap-1.5 select-none">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-2">
              <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-13-7-13S5 10.7 5 15a7 7 0 0 0 7 7z" />
            </svg>
            {language === 'gu' ? `ભેજ ${toGuLocal(weatherData.humidity ?? 68)}%` : `Humidity ${weatherData.humidity ?? 68}%`}
          </span>
          <span className="flex items-center gap-1.5 select-none">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-2">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.59-6.59A2 2 0 1 1 19 12H2" />
            </svg>
            {language === 'gu' ? `પવન ${toGuLocal(weatherData.windSpeed ?? 14)} કિમી` : `Wind ${weatherData.windSpeed ?? 14} km/h`}
          </span>
        </div>
      </div>

      {/* WhatsApp Channel widget */}
      <div className="w-full rounded-sm border border-[#16794A] bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2.5 font-black text-[14.5px] text-foreground">
          <span className="flex h-7.5 w-7.5 items-center justify-center rounded-sm bg-[#16794A] text-white text-[15px] font-bold select-none">
            💬
          </span>
          <span>{language === 'gu' ? 'WhatsApp ચેનલ' : 'WhatsApp Channel'}</span>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed my-3 font-semibold">
          {language === 'gu' ? 'બ્રેકિંગ ન્યૂઝ સૌથી પહેલા સીધા તમારા ફોન પર મેળવો.' : 'Get breaking news first directly on your phone.'}
        </p>
        <button className="w-full bg-[#16794A] hover:bg-[#12613b] text-white font-extrabold text-[12.5px] py-2.5 rounded-sm active:scale-[0.99] transition-all cursor-pointer">
          {language === 'gu' ? 'ચેનલ ફોલો કરો' : 'Follow Channel'}
        </button>
      </div>

      {/* Today's Horoscope Widget */}
      <div>
        <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
          <span className="text-[#B3121B] font-black text-[13.5px] md:text-[14px] flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-pulse" />
            {language === 'gu' ? '• આજનું રાશિફળ' : language === 'hi' ? '• आज का राशिफल' : '• Today\'s Horoscope'}
          </span>
        </div>
        <div className="border border-purple-500/20 dark:border-purple-500/30 rounded-xl bg-card p-2 sm:p-2.5 shadow-sm">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {astrologySigns.map((sign) => {
              const isSelected = selectedZodiac?.id === sign.id;
              const letters = (sign as any).lettersGu ? `(${(sign as any).lettersGu})` : GUJARAT_ZODIAC_LETTERS[sign.id] || `(${sign.name})`;
              const primaryName = language === 'gu' ? sign.nameGu : language === 'hi' ? sign.nameHi : sign.name;
              const subName = language === 'gu' ? letters : language === 'hi' ? letters : `(${sign.name})`;

              return (
                <div
                  key={sign.id}
                  onClick={() => setSelectedZodiac(sign)}
                  className={`relative flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg border transition-all duration-200 cursor-pointer select-none text-center overflow-hidden ${isSelected
                      ? 'bg-[#FFF8F0] dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 shadow-xs'
                      : 'bg-background hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border-border/60 hover:border-amber-300/60'
                    }`}
                >
                  {/* SVG Illustration Icon */}
                  <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center mb-1 select-none">
                    <ZodiacIcon id={sign.id} className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>

                  {/* Gujarati Name */}
                  <span className={`text-[12px] sm:text-[12.5px] font-black leading-tight select-none ${isSelected ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'
                    }`}>
                    {primaryName}
                  </span>

                  {/* Gujarati Initial Letters (અ, લ, ઈ) */}
                  <span className={`text-[9.5px] sm:text-[10px] font-semibold leading-tight select-none mt-0.5 ${isSelected ? 'text-amber-600 dark:text-amber-300 font-bold' : 'text-muted-foreground'
                    }`}>
                    {subName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );

  const zodiacModal = selectedZodiac && (
    <ZodiacDetailModal
      sign={selectedZodiac}
      onClose={() => setSelectedZodiac(null)}
      language={language}
    />
  );

  if (view === 'content') {
    return leftContent;
  }

  if (view === 'sidebar') {
    return (
      <>
        {sidebarContent}
        {zodiacModal}
      </>
    );
  }

  return (
    <section className="mt-2.5 border-t border-border pt-3.5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        {leftContent}
        {sidebarContent}
      </div>
      {zodiacModal}
    </section>
  );
}
export { CrimeSection };

