'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPublicArticles } from '@/lib/api';
import { AutoArticleTitle, AutoTranslateString } from '@/components/ui/AutoTranslatedArticleText';
import ArticleMedia from '@/components/ui/ArticleMedia';
import MobileModernArticleCard from '@/components/ui/MobileModernArticleCard';

interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  titleGu?: string;
  titleHi?: string;
  featuredImage?: string;
  image?: string;
  category?: any;
  customCategoryLabel?: string;
}

interface AePanVachoSectionProps {
  language?: string;
  spacingClassName?: string;
}

export default function AePanVachoSection({ language = 'gu', spacingClassName = 'mt-12' }: AePanVachoSectionProps) {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getPublicArticles({ categorySlug: 'crime', limit: 15 }),
      getPublicArticles({ categorySlug: 'fact-check', limit: 15 }),
    ])
      .then(([crimeRes, factRes]) => {
        if (!isMounted) return;
        const crimes: ArticleItem[] = crimeRes?.articles || [];
        const facts: ArticleItem[] = factRes?.articles || [];

        // Interleave Crime and Fact Check articles matching Image 4 (Crime, Fact Check, Crime, Fact Check...)
        const combined: ArticleItem[] = [];
        const maxLen = Math.max(crimes.length, facts.length);
        for (let i = 0; i < maxLen; i++) {
          if (crimes[i]) {
            combined.push({
              ...crimes[i],
              customCategoryLabel: language === 'gu' ? 'ક્રાઇમ' : language === 'hi' ? 'क्राइम' : 'Crime',
            });
          }
          if (facts[i]) {
            combined.push({
              ...facts[i],
              customCategoryLabel: language === 'gu' ? 'ફેક્ટ ચેક' : language === 'hi' ? 'फैक्ट चेक' : 'Fact Check',
            });
          }
        }

        // Take strictly 24 articles for an 8-row 3-column grid
        setArticles(combined.slice(0, 24));
      })
      .catch((err) => {
        console.error('Error fetching Ae Pan Vacho articles:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [language]);

  return (
    <section className={`${spacingClassName} pt-6 border-t border-border select-none`}>
      {/* ── HEADER MATCHING IMAGE 4: RED BADGE [આ પણ વાંચો] ── */}
      <div className="mb-5 sm:mb-6">
        <span className="bg-[#B3121B] text-white text-base sm:text-lg md:text-[20px] font-black px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl uppercase tracking-wide inline-block shadow-lg">
          {language === 'gu' ? 'આ પણ વાંચો' : language === 'hi' ? 'यह भी पढ़ें' : 'Also Read'}
        </span>
      </div>

      {/* ── 3-COLUMN ARTICLE GRID (9 ITEMS) MATCHING IMAGE 4 ── */}
      {articles.length > 0 ? (
        <>
          {/* ─── DESKTOP VIEW (>= md): 3-Column Grid ─── */}
          <div className="hidden md:grid md:grid-cols-3 gap-x-5 gap-y-6 sm:gap-y-7">
            {articles.map((art) => {
              const title = language === 'gu'
                ? (art.titleGu || art.title)
                : language === 'hi'
                  ? (art.titleHi || art.title)
                  : art.title;
              const image = art.featuredImage || art.image || '/assets/demo/1.jpg';

              return (
                <Link
                  key={art.id || art.slug}
                  href={`/news/${art.slug}`}
                  className="group flex flex-col cursor-pointer"
                >
                  {/* 16:9 Image */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted shadow-xs">
                    <ArticleMedia
                      src={image}
                      alt={title}
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>

                  {/* Content: Category Label + Title */}
                  <div className="mt-2.5 flex flex-col">
                    <span className="text-[11px] sm:text-[11.5px] font-black text-[#B3121B] uppercase tracking-wide">
                      {art.customCategoryLabel ? (
                        <AutoTranslateString text={art.customCategoryLabel} language={language as any} />
                      ) : null}
                    </span>
                    <h4 className="mt-1 text-[13.5px] sm:text-[14.5px] font-bold leading-snug text-foreground group-hover:text-[#B3121B] transition-colors line-clamp-2">
                      <AutoArticleTitle article={art as any} language={language as any} />
                    </h4>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ─── MOBILE VIEW (< md): Modern Separated Cards with Category Pill & WhatsApp Share ─── */}
          <div className="flex md:hidden flex-col gap-3.5">
            {articles.map((art, idx) => (
              <MobileModernArticleCard
                key={art.id || art.slug || idx}
                article={art as any}
                language={language as any}
                index={idx}
                catLabel={art.customCategoryLabel}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl">
          {loading
            ? (language === 'gu' ? 'સમાચાર લોડ થઈ રહ્યા છે...' : language === 'hi' ? 'समाचार लोड हो रहे हैं...' : 'Loading...')
            : (language === 'gu' ? 'હાલમાં કોઈ સમાચાર ઉપલબ્ધ નથી' : language === 'hi' ? 'फिलहाल कोई समाचार उपलब्ध नहीं है' : 'No articles available')}
        </div>
      )}
    </section>
  );
}
