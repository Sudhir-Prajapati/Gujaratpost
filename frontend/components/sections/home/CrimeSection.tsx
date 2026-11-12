'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Play, ChevronRight, ChevronLeft, Shield, Sun, Cloud, CloudRain, Flame, Thermometer, Droplet, Wind, Sparkles, MapPin } from 'lucide-react';
import type { Article, Language } from '@/types';
import { formatTime, getLocationLabel, getLocalized } from '@/data';
import { getPublicArticles, getPublicWeather, getPublicAstrology } from '@/lib/api';
import { ZODIAC_SIGNS, ZodiacSign } from '@/components/sections/AstrologySection';
import { ZodiacIcon, GUJARAT_ZODIAC_LETTERS } from '@/components/ui/ZodiacIcon';
import { RedZodiacIcon, GUJARATI_ZODIAC_DATES, HINDI_ZODIAC_DATES, ENGLISH_ZODIAC_DATES } from '@/components/ui/RedZodiacIcon';
import ZodiacDetailModal from '@/components/sections/ZodiacDetailModal';
import ArticleMedia from '@/components/ui/ArticleMedia';
import MobileModernArticleCard from '@/components/ui/MobileModernArticleCard';
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
  const sortCrimeLatest = useCallback((list: Article[]) => {
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

  const [dbCrimeArticles, setDbCrimeArticles] = useState<Article[]>(() => sortCrimeLatest(initialArticles || []));
  const [weatherData, setWeatherData] = useState<any>(initialWeather || {
    city: 'અમદાવાદ',
    cityEn: 'Ahmedabad',
    temp: 32,
    humidity: 56,
    windSpeed: 12,
    conditionGu: 'આંશિક વાદળછાયું',
    conditionEn: 'Partly cloudy',
  });

  const [liveAqiVal, setLiveAqiVal] = useState<number>(72);

  useEffect(() => {
    // Live US AQI for Ahmedabad (lat: 23.0225, lon: 72.5714)
    fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=23.0225&longitude=72.5714&current=us_aqi')
      .then((res) => res.json())
      .then((data) => {
        if (data?.current?.us_aqi && typeof data.current.us_aqi === 'number') {
          setLiveAqiVal(Math.round(data.current.us_aqi));
        }
      })
      .catch(() => {});
  }, []);

  const aqiStatusText = useMemo(() => {
    if (language === 'gu') {
      if (liveAqiVal <= 100) return 'સારું';
      if (liveAqiVal <= 150) return 'મધ્યમ';
      if (liveAqiVal <= 200) return 'નબળું';
      return 'અસ્વસ્થ';
    }
    if (language === 'hi') {
      if (liveAqiVal <= 100) return 'अच्छा';
      if (liveAqiVal <= 150) return 'मध्यम';
      if (liveAqiVal <= 200) return 'खराब';
      return 'अस्वस्थ';
    }
    if (liveAqiVal <= 100) return 'Good';
    if (liveAqiVal <= 150) return 'Moderate';
    if (liveAqiVal <= 200) return 'Poor';
    return 'Unhealthy';
  }, [liveAqiVal, language]);

  // Sync state if initialArticles prop changes from parent
  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) {
      setDbCrimeArticles((prev) => {
        const map = new Map<string, Article>();
        prev.forEach((a) => { if (a?.id) map.set(a.id, a); });
        initialArticles.forEach((a) => { if (a?.id) map.set(a.id, a); });
        return sortCrimeLatest(Array.from(map.values())).slice(0, 25);
      });
    }
  }, [initialArticles, sortCrimeLatest]);

  const fetchFreshCrimeArticles = useCallback(async () => {
    try {
      const crimeRes = await getPublicArticles({ categorySlug: 'crime', limit: 25, sort: 'latest' });
      if (crimeRes && crimeRes.articles && crimeRes.articles.length > 0) {
        setDbCrimeArticles((prev) => {
          const map = new Map<string, Article>();
          crimeRes.articles.forEach((a) => { if (a?.id) map.set(a.id, a); });
          prev.forEach((a) => { if (a?.id && !map.has(a.id)) map.set(a.id, a); });
          (initialArticles || []).forEach((a) => { if (a?.id && !map.has(a.id)) map.set(a.id, a); });
          return sortCrimeLatest(Array.from(map.values())).slice(0, 25);
        });
      }
    } catch {
      // keep existing
    }
  }, [initialArticles, sortCrimeLatest]);

  useEffect(() => {
    // Fetch fresh articles if initial data was not provided or has fewer than 15 articles
    if (!initialArticles || initialArticles.length < 15) {
      fetchFreshCrimeArticles();
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

    const handleSync = () => {
      fetchFreshCrimeArticles();
    };

    window.addEventListener('gp-articles-updated', handleSync);

    return () => {
      window.removeEventListener('gp-articles-updated', handleSync);
    };
  }, [fetchFreshCrimeArticles, initialArticles, initialWeather, initialAstrology]);

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
      image: '/assets/demo/7.jpg',
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
      image: '/assets/demo/5.jpg',
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
      image: '/assets/demo/6.jpg',
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
      slug: 'cyber-crime-case-fraud-network-exposed-99',
      image: '/assets/demo/4.jpg',
      titleGu: 'સાયબર ક્રાઇમનો પર્દાફાશ! રાજ્યવ્યાપી કૌભાંડમાં મુખ્ય સૂત્રધાર સકંજામાં',
      title: 'Cyber crime busted! Mastermind arrested in statewide racket',
      titleHi: 'साइबर अपराध का पर्दाफाश! राज्यव्यापी गिरोह का सरगना गिरफ्तार',
      relativeTimeGu: '7 કલાક પહેલાં',
      relativeTime: '7 hours ago',
      relativeTimeHi: '7 घंटे પહેલાં',
      categoryGu: 'રાજકોટ',
      category: 'Rajkot',
      categoryHi: 'રાજકોટ',
      viewsGu: '95K',
      views: '95K'
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
      subs: []
    },
    {
      colId: 4,
      featured: {
        id: 'pf4',
        slug: 'high-profile-cyber-crime-gang-arrested-ahmedabad-310',
        image: '/assets/demo/5.jpg',
        titleGu: 'મોટો પર્દાફાશ! અમદાવાદમાં કરોડોની છેતરપિંડી કરતી આંતરરાજ્ય ગેંગ ઝડપાઈ',
        title: 'Major bust! Interstate gang committing fraud worth crores arrested in Ahmedabad',
        category: 'Crime'
      },
      subs: []
    },
    {
      colId: 5,
      featured: {
        id: 'pf5',
        slug: 'illicit-liquor-den-raided-rajkot-police-action-311',
        image: '/assets/demo/2.jpg',
        titleGu: 'રાજકોટ પોલીસે ગેરકાયદે દારૂના અડ્ડા પર દરોડો પાડી લાખોનો મુદ્દામાલ જપ્ત કર્યો',
        title: 'Rajkot police raided illegal liquor den, seized goods worth lakhs',
        category: 'Crime'
      },
      subs: []
    },
    {
      colId: 6,
      featured: {
        id: 'pf6',
        slug: 'gold-smuggling-racket-busted-at-airport-312',
        image: '/assets/demo/6.jpg',
        titleGu: 'એરપોર્ટ પરથી સોનાની દાણચોરીનું મોટું કૌભાંડ ઝડપાયું, 3 આરોપીઓની ધરપકડ',
        title: 'Major gold smuggling racket busted at airport, 3 accused arrested',
        category: 'Crime'
      },
      subs: []
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
      // Mobile shows six compact follow-up stories after the lead card.
      // Desktop keeps its existing three-story sidebar via the render class below.
      return dbCrimeArticles.slice(3, 9).map((art, idx) => {
        const locEn = getLocationLabel(art, 'en') || art.location || art.category || 'Crime';
        const locGu = getLocationLabel(art, 'gu') || (art as any).locationGu || art.categoryGu || art.category || 'કાઇમ';
        const locHi = getLocationLabel(art, 'hi') || (art as any).locationHi || art.categoryHi || art.category || 'क्राइम';
        return {
          id: art.id,
          slug: art.slug,
          image: art.image || (art as any).featuredImage || DEMO_IMAGES[(idx + 4) % DEMO_IMAGES.length],
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
          clockTime: art.publishedAt ? new Date(art.publishedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '10:45 AM',
        };
      });
    }
    return mockList.slice(0, 3).map((item) => ({ ...item, article: null as Article | null, clockTime: getMockTime(item.id) }));
  }, [dbCrimeArticles, language]);

  const popularColumns = useMemo(() => {
    // 1. Gather all article IDs used in the top slide carousel
    const usedIds = new Set<string>();
    slides.forEach((s) => {
      if (s.article?.id) usedIds.add(s.article.id);
      else if (s.id) usedIds.add(s.id);
    });

    // 2. Gather article IDs used in rightList on desktop (first 3 items displayed in top sidebar)
    rightList.slice(0, 3).forEach((r) => {
      if (r.article?.id) usedIds.add(r.article.id);
      else if (r.id) usedIds.add(r.id);
    });

    // 3. Filter dbCrimeArticles strictly to those NOT used in slides or rightList
    const unusedArticles = dbCrimeArticles.filter((art) => art?.id && !usedIds.has(art.id));

    if (unusedArticles.length > 0) {
      const distinctCols: any[] = [];
      const colUsedIds = new Set<string>();

      for (let i = 0; i < unusedArticles.length && distinctCols.length < 6; i++) {
        const featArt = unusedArticles[i];
        if (!featArt?.id || colUsedIds.has(featArt.id)) continue;
        colUsedIds.add(featArt.id);

        distinctCols.push({
          colId: distinctCols.length + 1,
          featured: {
            id: featArt.id,
            slug: featArt.slug,
            image: featArt.image || DEMO_IMAGES[distinctCols.length % DEMO_IMAGES.length],
            article: featArt as Article,
            title: featArt.title,
            titleGu: featArt.titleGu || featArt.title,
          },
          subs: [],
        });
      }

      if (distinctCols.length > 0) {
        return distinctCols;
      }
    }

    return mockPopularColumns.slice(0, 6).map((col) => ({
      colId: col.colId,
      featured: {
        id: col.featured.id,
        slug: col.featured.slug,
        image: col.featured.image,
        article: null as Article | null,
        title: getMockTitle(col.featured, language),
        titleGu: col.featured.titleGu,
      },
      subs: [],
    }));
  }, [dbCrimeArticles, slides, rightList, language]);

  const currentSlide = slides[slideIdx % slides.length];

  const leftContent = (
    <div className="flex flex-col min-w-0">

      {/* Crime Header */}
      <div className="flex items-end justify-between h-[46px] border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-2 md:pb-2.5 mb-2.5 md:mb-4">
        <span className="section-heading-badge bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
          {language === 'gu' ? 'ક્રાઇમ' : language === 'hi' ? 'क्राइम' : 'Crime'}
        </span>
        <Link
          href="/category/crime"
          className="text-[#B3121B] hover:text-red-700 font-extrabold text-[20px] md:text-[21px] hover:underline pb-0.5"
        >
          {language === 'gu' ? 'વધુ જુઓ →' : language === 'hi' ? 'और देखें →' : 'More →'}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.12fr_1fr] gap-2.5 md:gap-3 items-stretch">
        {/* Slide Carousel */}
        {currentSlide && (
          <div className="group relative flex flex-col min-w-0">
            <div>
              <div className="relative aspect-[16/9.5] w-full overflow-hidden rounded-sm border border-border/10 bg-muted">
                <Image
                  src={currentSlide.image}
                  alt={currentSlide.titleGu}
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover transition-transform duration-300"
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
            </div>

            <div className="mt-1.5 md:mt-2.5 flex flex-col justify-start">
              <span className="text-[#B3121B] font-extrabold text-[12px] md:text-[13px] mb-1 select-none uppercase tracking-wide leading-none">
                {getLocalized(language, { en: currentSlide.category, gu: currentSlide.categoryGu, hi: currentSlide.categoryHi })}
              </span>
              <Link href={`/news/${currentSlide.slug}`} className="group/link flex flex-col justify-start">
                <div className="h-[46px] md:h-[50px] min-h-[46px] md:min-h-[50px] overflow-hidden flex items-start">
                  <h3 className="font-extrabold text-[16px] md:text-[17.5px] leading-snug tracking-tight text-foreground hover:text-[#B3121B] transition-colors line-clamp-2">
                    {currentSlide.article
                      ? <AutoArticleTitle article={currentSlide.article} language={language} />
                      : <AutoTranslateString text={currentSlide.titleGu} language={language} />}
                  </h3>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Mobile View (< md): Modern Separated Cards with Category Pill & WhatsApp Share */}
        <div className="md:hidden flex flex-col gap-3.5 mt-2">
          {rightList.map((item, idx) => (
            <MobileModernArticleCard
              key={`crime-mob-${item.id}-${idx}`}
              article={item.article || item}
              language={language}
              index={idx}
              defaultCategoryLabel={getLocalized(language, { en: item.category, gu: item.categoryGu, hi: item.categoryHi })}
            />
          ))}
        </div>

        {/* Desktop View (>= md): Right side 3 articles with images matching slider height */}
        <div className="hidden md:flex flex-col justify-between min-w-0 md:border-l md:border-border/60 md:pl-2.5 divide-y divide-border/40 h-full">
          {rightList.slice(0, 3).map((item, idx) => (
            <Link
              key={`${item.id}-${idx}`}
              href={`/news/${item.slug}`}
              className="group flex flex-row items-center justify-between gap-3 bg-transparent transition-all py-2 first:pt-0 last:pb-0"
            >
              <div className="flex flex-col min-w-0 flex-1 pr-1">
                <span className="text-[#B3121B] font-black text-[11px] sm:text-[11.5px] uppercase tracking-wider mb-1 select-none leading-none">
                  {getLocalized(language, { en: item.category, gu: item.categoryGu, hi: item.categoryHi })}
                </span>
                <h4 className="text-[14.5px] font-extrabold leading-[1.32] text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-3">
                  {item.article
                    ? <AutoArticleTitle article={item.article} language={language} />
                    : <AutoTranslateString text={item.titleGu || item.title} language={language} />}
                </h4>
              </div>
              <div className="relative aspect-[16/10] w-[128px] h-[86px] sm:w-[138px] sm:h-[92px] shrink-0 overflow-hidden rounded-lg border border-border/15 bg-muted">
                <ArticleMedia
                  src={item.image}
                  alt={item.titleGu || item.title}
                  className="transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 3-Column Popular Stories Grid (Big 6 Cards: 2 rows of 3) */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 border-t border-border/40 pt-2.5 mt-2">
        {popularColumns.map((col) => (
          <div key={col.colId} className="flex flex-col min-w-0">
            <Link
              href={`/news/${col.featured.slug}`}
              className="group flex flex-col mb-2.5"
            >
              <div className="relative aspect-[16/10] md:aspect-[4/3] w-full overflow-hidden rounded-sm border border-border/10 bg-muted mb-2.5">
                <ArticleMedia
                  src={col.featured.image}
                  alt={col.featured.title}
                  className="transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h3 className="text-[14px] md:text-[14.5px] font-black leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                {col.featured.article ? (
                  <AutoArticleTitle article={col.featured.article} language={language} />
                ) : (
                  <AutoTranslateString text={col.featured.titleGu || col.featured.title} language={language} />
                )}
              </h3>
            </Link>
          </div>
        ))}
      </div>

    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col gap-6 select-none">

      {/* Redesigned AQI & Weather Container -> Click to open AQI page */}
      <Link
        href={weatherData.cityEn ? `/aqi?city=${encodeURIComponent(weatherData.cityEn)}` : '/aqi'}
        className="relative block rounded-[18px] text-white overflow-hidden shadow-lg border border-red-700/40 transition-all duration-300 hover:shadow-xl group select-none cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #B3121B 0%, #D71914 45%, #6A080B 100%)',
        }}
      >
        {/* Right Landmark Graphic (Ahmedabad heritage clock tower by the lake with reflection) */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[55%] sm:w-[52%] pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          {/* Smooth high-res landmark with left alpha fade */}
          <img
            src="/assets/ahmedabad-weather-monument.png"
            alt=""
            className="w-full h-full object-cover object-right opacity-95 transition-transform duration-500 group-hover:scale-105"
          />
          {/* Warm sunset dusk glow behind tower */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 65% 35%, rgba(255, 130, 45, 0.22) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Top Information: City & State */}
        <div className="relative z-10 px-4 pt-3.5 pb-2.5">
          <div className="flex items-center gap-1.5 text-white/95">
            <MapPin className="h-3.5 w-3.5 fill-white text-white drop-shadow-xs" />
            <span className="text-[13px] sm:text-[13.5px] font-bold tracking-wide drop-shadow-xs">
              {language === 'gu'
                ? `${weatherData.city || 'અમદાવાદ'}, ગુજરાત`
                : language === 'hi'
                ? `${weatherData.city || 'अहमदाबाद'}, गुजरात`
                : `${weatherData.cityEn || 'Ahmedabad'}, Gujarat`}
            </span>
          </div>

          {/* Temperature & Radiant Sun + Cloud Icon */}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[34px] sm:text-[38px] font-extrabold tracking-tight text-white leading-none drop-shadow-sm">
              {language === 'gu' ? toGuLocal(weatherData.temp ?? 32) : (weatherData.temp ?? 32)}°C
            </span>

            {/* Weather Icon (Golden Sun with Rays + White Cloud) */}
            <div className="relative h-9 w-10 flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg viewBox="0 0 36 32" className="h-full w-full drop-shadow-md">
                {/* Sun */}
                <circle cx="23" cy="12" r="7" fill="#FDB813" />
                <g stroke="#FDB813" strokeWidth="2" strokeLinecap="round">
                  <line x1="23" y1="2" x2="23" y2="4.5" />
                  <line x1="23" y1="19.5" x2="23" y2="22" />
                  <line x1="13" y1="12" x2="15.5" y2="12" />
                  <line x1="30.5" y1="12" x2="33" y2="12" />
                  <line x1="16" y1="5" x2="17.8" y2="6.8" />
                  <line x1="28.2" y1="17.2" x2="30" y2="19" />
                  <line x1="16" y1="19" x2="17.8" y2="17.2" />
                  <line x1="28.2" y1="6.8" x2="30" y2="5" />
                </g>
                {/* White Cloud */}
                <path
                  d="M10 26h16a5 5 0 0 0 1-9.9 7 7 0 0 0-13.6-2.1A5.5 5.5 0 0 0 10 26z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>
          </div>

          {/* Condition Text */}
          <p className="text-[12px] font-semibold text-white/90 mt-1 drop-shadow-xs">
            {language === 'gu'
              ? (weatherData.conditionGu || 'આંશિક વાદળછાયું')
              : language === 'hi'
              ? (weatherData.conditionHi || 'आंशिक बादल')
              : (weatherData.conditionEn || 'Partly cloudy')}
          </p>
        </div>

        {/* Bottom Information Row: Humidity | Wind | AQI Badge */}
        <div className="relative z-10 flex items-center justify-between px-3.5 py-2.5 bg-black/25 backdrop-blur-xs border-t border-white/15 text-[11.5px] font-bold text-white">
          {/* Humidity */}
          <div className="flex items-center gap-1.5 select-none">
            <Droplet className="h-3.5 w-3.5 fill-white/80 text-white stroke-[2.2]" />
            <span>
              {language === 'gu'
                ? `ભેજ ${toGuLocal(weatherData.humidity ?? 56)}%`
                : language === 'hi'
                ? `नमी ${weatherData.humidity ?? 56}%`
                : `Humidity ${weatherData.humidity ?? 56}%`}
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="h-3.5 w-px bg-white/25" />

          {/* Wind Speed */}
          <div className="flex items-center gap-1.5 select-none">
            <Wind className="h-3.5 w-3.5 text-white stroke-[2.2]" />
            <span>
              {language === 'gu'
                ? `પવન ${toGuLocal(weatherData.windSpeed ?? 12)} કિમી/ક`
                : language === 'hi'
                ? `हवा ${weatherData.windSpeed ?? 12} किमी/घં`
                : `Wind ${weatherData.windSpeed ?? 12} km/h`}
            </span>
          </div>

          {/* Vertical Divider */}
          <div className="h-3.5 w-px bg-white/25" />

          {/* AQI Indicator with Pill Badge */}
          <div className="flex items-center gap-1.5 select-none">
            {/* Leaf vector icon matching reference */}
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-white stroke-[2.2]" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
            <span className="text-white/95 tracking-wide">AQI</span>
            <span className="bg-black/40 text-white px-2 py-0.5 rounded-full text-[10.5px] font-extrabold tracking-tight border border-white/15 backdrop-blur-xs">
              {language === 'gu'
                ? `${toGuLocal(liveAqiVal)} (${aqiStatusText})`
                : `${liveAqiVal} (${aqiStatusText})`}
            </span>
          </div>
        </div>
      </Link>

      {/* Redesigned Today's Rashifal Container */}
      <div className="select-none">
        {/* Section Heading with Red Sparkle Icon */}
        <div className="flex items-center gap-2 mb-2.5">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#D71914] text-[#D71914]">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
          </svg>
          <h3 className="text-[19px] sm:text-[20px] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            {language === 'gu' ? 'રાશિફળ' : language === 'hi' ? 'राशिफल' : 'Horoscope'}
          </h3>
        </div>

        {/* 4-Column Zodiac Grid Container */}
        <div className="rounded-[18px] bg-white dark:bg-card p-2.5 sm:p-3 border border-[#F0DADA] dark:border-red-950/40 shadow-xs">
          <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
            {astrologySigns.map((sign) => {
              const isSelected = selectedZodiac?.id === sign.id;
              const dateRange = (language === 'gu'
                ? GUJARATI_ZODIAC_DATES[sign.id]
                : language === 'hi'
                ? HINDI_ZODIAC_DATES[sign.id]
                : ENGLISH_ZODIAC_DATES[sign.id]) || '';
              const primaryName = language === 'gu' ? sign.nameGu : language === 'hi' ? sign.nameHi : sign.name;

              return (
                <button
                  key={sign.id}
                  type="button"
                  onClick={() => setSelectedZodiac(sign)}
                  className={`relative flex flex-col items-center justify-center py-2.5 px-1 min-h-[90px] sm:min-h-[96px] rounded-xl border transition-all duration-200 cursor-pointer select-none text-center overflow-hidden group ${
                    isSelected
                      ? 'bg-[#FFEBEB] dark:bg-red-950/40 border-[#D71914] shadow-xs ring-1 ring-[#D71914]'
                      : 'bg-[#FFF5F5] dark:bg-red-950/15 hover:bg-[#FFEBEB] dark:hover:bg-red-950/30 border-[#F0DADA] dark:border-red-900/30 hover:border-[#D71914]/50'
                  }`}
                >
                  {/* Red Zodiac Vector Icon */}
                  <div className="flex h-7 w-7 items-center justify-center mb-1 select-none transition-transform duration-200 group-hover:scale-110">
                    <RedZodiacIcon id={sign.id} className="h-7 w-7" />
                  </div>

                  {/* Gujarati Zodiac Name */}
                  <span className="text-[14px] font-black leading-tight text-gray-900 dark:text-gray-100 select-none">
                    {primaryName}
                  </span>

                  {/* Date Range in Parentheses */}
                  <span className="text-[10px] sm:text-[10.5px] font-medium leading-tight text-gray-500 dark:text-gray-400 select-none mt-1 tracking-tight whitespace-nowrap">
                    {dateRange}
                  </span>
                </button>
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
    <section className="mx-auto max-w-screen-xl px-4 mt-6 md:mt-8 border-t border-border pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        {leftContent}
        {sidebarContent}
      </div>
      {zodiacModal}
    </section>
  );
}
export { CrimeSection };





