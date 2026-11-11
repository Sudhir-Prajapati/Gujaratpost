'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Camera } from 'lucide-react';
import { PHOTOS, getLocalized, getCategoryLabel } from '@/data';
import { useApp } from '@/components/AppProvider';
import AePanVachoSection from '@/components/sections/AePanVachoSection';
import { getPublicArticles, getPublicGallery } from '@/lib/api';
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

function resolvePhotoUrl(val: any, fallback: string = ''): string {
  if (!val) return fallback;
  let raw = typeof val === 'string' ? val : (val.src || val.coverImage || val.image || val.thumbnail);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0];
          return typeof first === 'string' ? first : (first?.src || first?.url || fallback);
        }
      } catch {}
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return trimmed;
    }
  }
  if (typeof val === 'object' && Array.isArray(val.images) && val.images.length > 0) {
    const first = val.images[0];
    return typeof first === 'string' ? first : (first?.src || first?.url || fallback);
  }
  return fallback;
}

function PhotoCardImage({ src: rawSrc, alt, index }: { src?: any; alt: string; index: number }) {
  const fallback = FALLBACK_NEWS_IMAGES[index % FALLBACK_NEWS_IMAGES.length];
  const initial = resolvePhotoUrl(rawSrc, fallback);
  const [src, setSrc] = useState(initial);

  useEffect(() => {
    setSrc(resolvePhotoUrl(rawSrc, fallback));
  }, [rawSrc, fallback]);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className="object-cover transition-transform duration-700 ease-out"
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
  const [photos, setPhotos] = useState<any[]>(initialPhotos || []);

  useEffect(() => {
    getPublicGallery({ limit: 60 })
      .then((res) => {
        if (res && res.length > 0) {
          setPhotos(res.filter((p: any) => p && (p.src || p.id)));
        }
      })
      .catch(() => { });
  }, []);

  let photoList = photos.length > 0 ? [...photos] : [...(initialPhotos || [])];
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
      .catch(() => { });
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
    <div className="mx-auto max-w-screen-xl px-4 pt-3 pb-8">
      <header className="flex items-center justify-between border-b border-border pb-2 mb-4">
        <h1 className="flex items-center select-none leading-none">
          <span className="inline-block w-1.5 self-stretch rounded-sm bg-[#B3121B] mr-2.5 my-0.5" style={{ minHeight: '1.4em' }} aria-hidden="true" />
          <span className="text-[26px] sm:text-[24px] md:text-[21px] font-black tracking-tight text-foreground">
            {getLocalized(language, { en: 'Photo Gallery', gu: 'ફોટો ગેલેરી', hi: 'फोटो गैलरी' })}
          </span>
        </h1>
      </header>

      {/* Photo Gallery Grid matching Home Page Card Dimensions */}
      <div className="w-full flex flex-col items-center sm:flex-row sm:flex-wrap sm:justify-center gap-5 sm:gap-6 mx-auto">
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
              className="group relative flex flex-shrink-0 w-[82vw] sm:w-[45vw] md:w-[320px] lg:w-[350px] h-[280px] md:h-[350px] mx-auto sm:mx-0 overflow-hidden rounded-2xl shadow-lg border border-border/10 bg-card select-none transition-transform duration-300 hover:-translate-y-1"
            >
              <PhotoCardImage
                src={photo.src}
                alt={captionSource || 'Gallery Photo'}
                index={index}
              />

              {/* Top ambient gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Bottom dark gradient overlay */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent transition-opacity duration-300 group-hover:opacity-100 pointer-events-none"
                style={{ opacity: 0.88 }}
              />

              {/* Category Badge & Photo Count Badge */}
              <div className="absolute top-3.5 inset-x-3.5 z-10 flex items-center justify-between">
                <span className="inline-block rounded-md bg-[#B3121B] px-2.5 py-0.5 text-[11px] font-black text-white uppercase tracking-wide shadow-md">
                  <AutoTranslateString text={categoryText} language={language} />
                </span>
                {Array.isArray(photo.images) && photo.images.length > 1 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/75 backdrop-blur-sm px-2 py-0.5 text-[11px] font-black text-white shadow-md border border-white/20">
                    <Camera className="w-3 h-3 text-red-400" />
                    <span>{photo.images.length}</span>
                  </span>
                )}
              </div>

              {/* Title & Call-to-action overlay matching Image 2 */}
              <div className="absolute bottom-0 inset-x-0 p-4 pt-8 z-10 pointer-events-none">
                <h2 className="text-white text-[14px] sm:text-[15px] font-black leading-snug line-clamp-2 drop-shadow-md select-none transition-transform duration-300 group-hover:-translate-y-0.5">
                  <AutoTranslateString text={captionSource} language={language} />
                </h2>

                {/* "— ફોટો જુઓ >" Link matching Home page */}
                <div className="flex items-center gap-2 mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                  <div className="h-[2.5px] w-7 rounded-full bg-[#B3121B]" />
                  <span className="text-white text-[13.5px] md:text-[14.5px] font-extrabold tracking-wide">
                    {language === 'gu' ? 'ફોટો જુઓ' : language === 'hi' ? 'फोटो देखें' : 'View Photos'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#B3121B] stroke-[3]" />
                </div>
              </div>

              {/* Border glow on hover matching Home page */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: 'inset 0 0 0 2px #B3121B' }}
              />
            </Link>
          );
        })}
      </div>

      {latestArticles.length > 0 && (
        <section className="mt-10 border-t border-border pt-6">
          <div className="flex items-center gap-2.5 mb-5 pb-2 border-b-2 border-border">
            <span className="w-2.5 h-5 bg-accent rounded-sm inline-block shrink-0" />
            <h2 className="text-base md:text-lg font-black text-foreground">
              {language === 'gu' ? 'લેટેસ્ટ સમાચાર' : language === 'hi' ? 'ताज़ा समाचार' : 'Latest News'}
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
                  <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-neutral-900">
                    <Image
                      src={image}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300"
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
                className="group inline-flex items-center gap-2.5 rounded-full border-2 border-accent px-9 py-3 text-accent hover:bg-accent hover:text-white transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
              >
                <span className="text-lg md:text-xl font-black tracking-wide leading-none">
                  {loadingMoreLatest
                    ? (language === 'gu' ? 'લોડ થઈ રહ્યું છે...' : language === 'hi' ? 'लोड हो रहा है...' : 'Loading...')
                    : (language === 'gu' ? 'વધુ વાંચો' : language === 'hi' ? 'और पढ़ें' : 'Read more')}
                </span>
                {!loadingMoreLatest && <ChevronRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5 stroke-[3]" />}
              </button>
            </div>
          )}
        </section>
      )}

      <AePanVachoSection language={language} />
    </div>
  );
}
