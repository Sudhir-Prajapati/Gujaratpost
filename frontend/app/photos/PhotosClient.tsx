'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PHOTOS, getLocalized, getCategoryLabel } from '@/data';
import { useApp } from '@/components/AppProvider';
import AePanVachoSection from '@/components/sections/AePanVachoSection';
import { getPublicArticles } from '@/lib/api';
import { AutoArticleTitle, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';

const FALLBACK_NEWS_IMAGES = [
  'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=90',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=90',
];

function PhotoCardImage({ src: rawSrc, alt, index }: { src?: string; alt: string; index: number }) {
  const fallback = FALLBACK_NEWS_IMAGES[index % FALLBACK_NEWS_IMAGES.length];
  const [src, setSrc] = useState(rawSrc || fallback);

  useEffect(() => {
    setSrc(rawSrc || fallback);
  }, [rawSrc, fallback]);

  return (
    <Image 
      src={src} 
      alt={alt} 
      fill 
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" 
      className="object-contain transition-transform duration-700 ease-out" 
      onError={() => setSrc(fallback)}
    />
  );
}

interface PhotosClientProps {
  initialPhotos: any[];
}

export default function PhotosClient({ initialPhotos }: PhotosClientProps) {
  const { language } = useApp();
  const [latestArticles, setLatestArticles] = useState<any[]>([]);
  const [latestPage, setLatestPage] = useState(1);
  const [latestTotalPages, setLatestTotalPages] = useState(1);
  const [loadingMoreLatest, setLoadingMoreLatest] = useState(false);
  let photoList = [...(initialPhotos || [])];
  if (photoList.length < 5) {
    const existingIds = new Set(photoList.map(p => p.id || p.src));
    for (const defPhoto of PHOTOS) {
      if (photoList.length >= 5) break;
      if (!existingIds.has(defPhoto.id) && !existingIds.has(defPhoto.src)) {
        photoList.push(defPhoto);
      }
    }
  }
  const gallery = photoList;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    getPublicArticles({ page: 1, limit: 8, sort: 'latest' })
      .then((res) => {
        setLatestArticles(res?.articles?.slice(0, 8) || []);
        setLatestTotalPages(res?.totalPages || 1);
      })
      .catch(() => {});
  }, []);

  const loadMoreLatest = async () => {
    if (loadingMoreLatest || latestPage >= latestTotalPages) return;
    setLoadingMoreLatest(true);
    try {
      const nextPage = latestPage + 1;
      const res = await getPublicArticles({ page: nextPage, limit: 8, sort: 'latest' });
      const newArticles = res?.articles || [];
      setLatestArticles((current) => {
        const existingIds = new Set(current.map((article) => article.id || article.slug));
        return [...current, ...newArticles.filter((article) => !existingIds.has(article.id || article.slug))];
      });
      setLatestPage(nextPage);
      setLatestTotalPages(res?.totalPages || nextPage);
    } catch {
      // Keep the existing news visible if another page cannot be loaded.
    } finally {
      setLoadingMoreLatest(false);
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <header className="mb-8 border-b border-border/60 pb-5">
        <h1 className="text-3xl font-black text-foreground tracking-tight">
          {getLocalized(language, { en: 'Photo Gallery', gu: 'ફોટો ગેલેરી', hi: 'फोटो गैलरी' })}
        </h1>
        <p className="text-sm font-semibold text-muted-foreground mt-1.5">
          {getLocalized(language, { 
            en: 'Latest Gujarat news moments in pictures.', 
            gu: 'ગુજરાતના તાજા સમાચારના દૃશ્યો.', 
            hi: 'गुजरात की ताजा खबरों की तस्वीरें.' 
          })}
        </p>
      </header>

      {/* 4-Column Uniform Grid matching Image 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {gallery.map((photo, index) => {
          const categoryText = language === 'gu'
            ? (photo.categoryGu || photo.category || 'સમાચાર')
            : language === 'hi'
            ? (photo.categoryHi || 'समाचार')
            : (photo.categoryEn || 'News');
          const captionSource = photo.caption || photo.captionGu || photo.alt || '';

          return (
            <Link 
              key={`${photo.id}-${index}`} 
              href={`/photos/${photo.id}`} 
              className="group relative block w-full overflow-hidden rounded-2xl shadow-md border border-border/20 bg-card aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:border-[#B3121B]/40 select-none"
            >
              <PhotoCardImage 
                src={photo.src} 
                alt={captionSource || 'Gallery Photo'} 
                index={index}
              />

              {/* Subtle top shadow for category badge readability */}
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none" />

              {/* Deep dark gradient overlay at bottom for title and CTA readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

              {/* Category Badge matching Image 2 */}
              <div className="absolute top-3.5 left-3.5 z-10">
                <span className="inline-block rounded-md bg-[#B3121B] px-2.5 py-0.5 text-[11px] font-black text-white uppercase tracking-wide shadow-md">
                  <AutoTranslateString text={categoryText} language={language} />
                </span>
              </div>

              {/* Title & Call-to-action overlay matching Image 2 */}
              <div className="absolute bottom-0 inset-x-0 p-4 pt-8 z-10 pointer-events-none">
                <h2 className="text-white text-[14px] sm:text-[15px] font-black leading-snug line-clamp-2 drop-shadow-md select-none transition-transform duration-300 group-hover:-translate-y-0.5">
                  <AutoTranslateString text={captionSource} language={language} />
                </h2>

                {/* "— ફોટો જુઓ >" Link matching Image 2 */}
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="h-[2px] w-5 rounded-full bg-[#B3121B] shrink-0" />
                  <span className="text-white text-[12px] sm:text-[13px] font-bold tracking-wide">
                    {getLocalized(language, { en: 'View Photos', gu: 'ફોટો જુઓ', hi: 'फोटो देखें' })}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#B3121B] stroke-[3] transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {latestArticles.length > 0 && (
        <section className="mt-10 border-t border-border pt-6">
          <div className="flex items-center gap-2.5 mb-5 pb-2 border-b-2 border-border">
            <span className="w-2.5 h-5 bg-accent rounded-sm inline-block shrink-0" />
            <h2 className="text-base md:text-lg font-black text-foreground">
              {language === 'gu' ? 'તાજા સમાચાર' : language === 'hi' ? 'ताज़ा समाचार' : 'Latest News'}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {latestArticles.map((article) => {
              const title = language === 'gu'
                ? (article.titleGu || article.title)
                : language === 'hi'
                  ? (article.titleHi || article.title)
                  : article.title;
              const image = article.featuredImage || article.image || article.thumbnail || '/assets/gujarat-post-logo.png';
              const publishedAt = article.publishedAt || article.createdAt;
              const dateLabel = publishedAt
                ? new Intl.DateTimeFormat(language === 'gu' ? 'gu-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium' }).format(new Date(publishedAt))
                : '';

              return (
                <Link
                  key={article.id || article.slug}
                  href={`/news/${article.slug}`}
                  className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <Image
                      src={image}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] font-black text-accent uppercase tracking-wider line-clamp-1">
                      <AutoTranslateString text={getCategoryLabel(article, language)} language={language} />
                    </span>
                    <h3 className="mt-1 text-[12.5px] md:text-sm font-bold leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2">
                      <AutoArticleTitle article={article} language={language} />
                    </h3>
                    {dateLabel && <span className="mt-2 block text-[10px] font-semibold text-muted-foreground">{dateLabel}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
          {latestPage < latestTotalPages && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={loadMoreLatest}
                disabled={loadingMoreLatest}
                className="inline-flex items-center gap-2 rounded-full border border-accent px-6 py-2 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-white disabled:cursor-wait disabled:opacity-60"
              >
                {loadingMoreLatest
                  ? (language === 'gu' ? 'લોડ થઈ રહ્યું છે...' : language === 'hi' ? 'लोड हो रहा है...' : 'Loading...')
                  : (language === 'gu' ? 'વધુ વાંચો' : language === 'hi' ? 'और पढ़ें' : 'Read more')}
                {!loadingMoreLatest && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          )}
        </section>
      )}

      <AePanVachoSection language={language} />
    </div>
  );
}
