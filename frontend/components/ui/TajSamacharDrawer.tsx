'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getPublicArticles } from '@/lib/api';
import { Article } from '@/types';
import { Megaphone, X, Clock } from 'lucide-react';
import ArticleMedia from '@/components/ui/ArticleMedia';
import { useIsApk } from '@/lib/useIsApk';

// Helper to resolve absolute or relative image URLs cleanly
function getFullImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&q=80';
  }
  const clean = url.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  if (clean.startsWith('/uploads/') || clean.startsWith('uploads/')) {
    const backendOrigin = typeof window !== 'undefined'
      ? (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') ? 'http://127.0.0.1:5000' : '')
      : 'http://127.0.0.1:5000';
    const path = clean.startsWith('/') ? clean : `/${clean}`;
    return `${backendOrigin}${path}`;
  }
  if (clean.startsWith('/')) {
    return clean;
  }
  return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&q=80';
}

// Relative time formatting helper matching the screenshot (e.g. "13 hrs ago")
function getRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'હમણાં જ';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'હમણાં જ';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHrs < 24) return `${diffHrs} hrs ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  } catch {
    return 'હમણાં જ';
  }
}

// Fallback articles to render if backend API is initializing or offline
const FALLBACK_ARTICLES: Partial<Article>[] = [
  {
    id: 'ts-1',
    slug: 'super-specialty-hospital-waiting-staff',
    title: 'ધૂળ ખાતી સુપરસ્પેશ્યિલિટી: 200 કરોડના ખર્ચે ગરીબ દર્દીઓ માટે અધ્યતન 7 વિભાગો તૈયાર કરાયા, ડોક્ટરના અભાવે બન્યા શોભા...',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80',
    publishedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
    category: 'GUJARAT'
  },
  {
    id: 'ts-2',
    slug: 'talawala-mahadev-temple-shravan',
    title: 'ભારતમાં ક્યાં આવેલુ છે \'તાળાવાળા મહાદેવ\' નું મંદિર? શ્રાવણમાં દર્શન માટે ઉમટે ભક્તોની ભીડ',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80',
    publishedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
    category: 'GUJARAT'
  },
  {
    id: 'ts-3',
    slug: 'nag-panchami-2026-pooja-vidhi-muhurat',
    title: 'Nag Panchami 2026: નાગ પંચમીના દિવસે નાગદેવતાની પૂજા શા માટે કરવામાં આવે છે? જાણો પૂજાની વિધિ અને શુભ મુહૂર્ત',
    image: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=600&q=80',
    publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    category: 'RELIGION'
  },
  {
    id: 'ts-4',
    slug: 'gujarat-heavy-rain-alert-next-7-days',
    title: 'ગુજરાતમાં ભારે વરસાદની તાજી આગાહી: દક્ષિણ ગુજરાત અને સૌરાષ્ટ્રમાં મેઘરાજાની તોફાની બેટિંગ, નદીઓ બે કાંઠે',
    image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&q=80',
    publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    category: 'WEATHER'
  },
  {
    id: 'ts-5',
    slug: 'gujarat-assembly-election-preparations',
    title: 'ચૂંટણી 2027 તૈયારીઓ તેજ: ભાજપ અને કોંગ્રેસ બંને પક્ષો દ્વારા બેઠકોનો દોર શરુ, પ્રદેશ પ્રમુખે આપ્યા નિર્દેશ',
    image: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&q=80',
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    category: 'POLITICS'
  },
  {
    id: 'ts-6',
    slug: 'panchmahal-pavagadh-unesco-development',
    title: 'પંચમહાલ પાવાગઢ મહાકાળી ધામ અને ચાંપાનેર યુનેસ્કો સાઇટનો ભવ્ય વિકાસ',
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=600&q=80',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    category: 'GUJARAT'
  },
  {
    id: 'ts-7',
    slug: 'banaskantha-banas-dairy-solar-gobar-gas',
    title: 'બનાસકાંઠા પાલનપુર બનાસ ડેરી: બટાકા પ્રોસેસિંગ અને સોલાર ગોબર ગેસ પ્લાન્ટ',
    image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&q=80',
    publishedAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    category: 'BUSINESS'
  },
  {
    id: 'ts-8',
    slug: 'sabarkantha-sabar-dairy-solar-milk-powder',
    title: 'સાબરકાંઠા હિંમતનગર સાબર ડેરી: નવો સોલાર અને મિલ્ક પાવડર પ્લાન્ટ લોન્ચ',
    image: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=600&q=80',
    publishedAt: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
    category: 'BUSINESS'
  },
  {
    id: 'ts-9',
    slug: 'narmada-statue-of-unity-visitors-record',
    title: 'નર્મદા એકતા નગર સ્ટેચ્યુ ઓફ યુનિટી: ૧.૫ કરોડથી વધુ સહેલાણીઓએ મુલાકાત લીધી',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80',
    publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    category: 'TOURISM'
  }
];

export default function TajSamacharDrawer() {
  const pathname = usePathname();
  const { isApk } = useIsApk();
  const [isOpen, setIsOpen] = useState(false);
  const [articles, setArticles] = useState<any[]>(FALLBACK_ARTICLES);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Lazy load latest news only when user opens drawer
  useEffect(() => {
    if (!isOpen || hasFetched) return;
    let isMounted = true;
    async function loadLatestNews() {
      try {
        setLoading(true);
        const res = await getPublicArticles({ page: 1, limit: 15 });
        if (isMounted) {
          setHasFetched(true);
          if (res?.articles && res.articles.length > 0) {
            setArticles(res.articles);
            if (res.articles.length < 15) setHasMore(false);
          }
        }
      } catch (err) {
        // Keeps fallback articles safely
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLatestNews();

    return () => {
      isMounted = false;
    };
  }, [isOpen, hasFetched]);

  if (pathname?.startsWith('/admin') || (isApk && pathname?.startsWith('/shorts'))) {
    return null;
  }

  // Fetch more articles seamlessly in the background as user reaches ~7th article
  const loadMoreArticles = async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await getPublicArticles({ page: nextPage, limit: 15 });
      if (res?.articles && res.articles.length > 0) {
        setArticles((prev) => {
          const existingKeys = new Set(prev.map((a) => String(a.id || a.slug)));
          const uniqueNew = res.articles.filter((a) => !existingKeys.has(String(a.id || a.slug)));
          if (uniqueNew.length === 0) {
            setHasMore(false);
            return prev;
          }
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
        if (nextPage >= (res.totalPages || 10)) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Early prefetch: trigger when user is ~350px from bottom (around 7th article position)
    if (scrollHeight - scrollTop - clientHeight < 350 && hasMore && !loadingMore && !loading) {
      loadMoreArticles();
    }
  };

  return (
    <>
      <style>{`
        @keyframes periodicPulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          25% {
            transform: scale(1.85);
            opacity: 0;
          }
          100% {
            transform: scale(1.85);
            opacity: 0;
          }
        }
        .animate-periodic-ping {
          animation: periodicPulse 4s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Floating Megaphone Button (Bottom Left) */}
      <div className={`fixed ${isApk ? 'bottom-[72px] left-4 z-45' : 'bottom-6 left-6 z-[9990]'} flex items-center gap-3`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="તાજા સમાચાર (Latest News)"
          title="તાજા સમાચાર જુઓ"
          className="relative group flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-red-600 via-red-700 to-black text-white shadow-xl shadow-red-900/40 border-2 border-white/30 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none"
        >
          {/* Periodic pulse ring animation (expands every 4 seconds) */}
          <span className="absolute -inset-1 rounded-full bg-red-600/60 animate-periodic-ping pointer-events-none" />
          <Megaphone className="w-5 h-5 text-white relative z-10 transition-transform group-hover:rotate-12" />
        </button>
      </div>

      {/* Latest News Floating Drawer / Modal Box */}
      {isOpen && (
        <>
          {isApk && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[9994] animate-in fade-in duration-200"
              onClick={() => setIsOpen(false)}
            />
          )}
          <div className={`fixed ${isApk ? 'bottom-[72px] left-3 right-3 max-h-[76vh]' : 'bottom-24 left-4 sm:left-6 w-[calc(100vw-32px)] sm:w-[410px] max-h-[82vh]'} z-[9995] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-red-900/20 overflow-hidden flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-bottom-4`}>

          {/* Header Bar - Red & Black Theme (Bigger & Vertically Centered) */}
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-black text-white px-5 py-3 flex items-center justify-between shadow-md relative overflow-hidden min-h-[48px]">
            {/* Background subtle sheen */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />

            <div className="flex items-center gap-2.5 z-10 my-auto">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <h3 className="text-base sm:text-lg font-bold tracking-wide text-white drop-shadow-sm font-gujarati leading-none flex items-center">
                તાજા સમાચાર
              </h3>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-colors focus:outline-none z-10 my-auto"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Drawer Body - Scrollable Article List with Infinite Scroll */}
          <div
            onScroll={handleScroll}
            className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-800 p-2 max-h-[440px] custom-scrollbar bg-white dark:bg-gray-900"
          >
            {loading ? (
              // Loading Skeleton
              <div className="space-y-4 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-24 h-20 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                હાલ કોઈ તાજા સમાચાર ઉપલબ્ધ નથી.
              </div>
            ) : (
              <>
                {articles.map((item, idx) => {
                  const articleSlug = item.slug || `news-${item.id}`;
                  const rawImg = item.image || item.featuredImage || item.thumbnail;
                  const imageSrc = getFullImageUrl(rawImg);
                  const timeAgo = getRelativeTime(item.publishedAt || item.createdAt || new Date().toISOString());

                  return (
                    <Link
                      key={`${item.id || item.slug}-${idx}`}
                      href={`/news/${articleSlug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 p-3 hover:bg-red-50/60 dark:hover:bg-red-950/20 rounded-xl transition-all duration-200 group cursor-pointer"
                    >
                      {/* Thumbnail Image */}
                      <div className="w-24 h-20 sm:w-28 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 relative bg-gray-100 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-sm">
                        <ArticleMedia
                          src={imageSrc}
                          alt={item.titleGu || item.title || 'Taj Samachar'}
                          fill
                          className="group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Title & Metadata */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                        <h4 className="text-[14px] sm:text-[14.5px] font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-3 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors font-gujarati">
                          {item.titleGu || item.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-2 text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                          <Clock className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                          <span>{timeAgo}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {/* Bottom Spinner when loading more articles */}
                {loadingMore && (
                  <div className="flex items-center justify-center p-3 text-red-700 gap-2 text-xs font-semibold animate-pulse bg-red-50/40 dark:bg-red-950/10 rounded-xl my-1">
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    વધુ તાજા સમાચાર લોડ થઈ રહ્યા છે...
                  </div>
                )}
              </>
            )}
          </div>
          </div>
        </>
      )}
    </>
  );
}
