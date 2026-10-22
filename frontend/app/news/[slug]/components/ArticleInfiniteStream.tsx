'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Article, Language } from '@/types';
import { normalizeDisplayText, formatDate, getCategoryLabel, getArticleTitle, SITE_URL } from '@/data';
import { AutoArticleTitle, AutoArticleBreadcrumbTitle } from '@/components/ui/AutoTranslatedArticleText';
import MobileHeroArticleCard from '@/components/ui/MobileHeroArticleCard';

interface ArticleInfiniteStreamProps {
  mounted: boolean;
  streamList: Article[];
  article: Article;
  language: Language;
  mostReadArticles: Article[];
  trending: Article[];
  related: Article[];
  savedIds: string[];
  getCardThumbnail: (item: Article, index: number) => string;
  DEMO_THUMBNAILS: string[];
  uiLabel: (language: Language, values: { en: string; gu: string; hi: string }) => string;
  getArticleContent: (article: Article, language: Language) => string;
  parseArticleBodyBlocks: (content: string) => string[];
  sanitizeParagraphHtml: (raw: string, language: Language) => string;
  getStreamTags: (article: Article) => string[];
  getTopicHref: (tag: string) => string;
  TranslatedInlineText: React.ComponentType<{ text: string; language: Language }>;
  TranslatedParagraph: React.ComponentType<{ rawHtml: string; language: Language }>;
  sidebarRecommendedPool: Article[];
}

function ArticleStreamShareBar({
  article,
  language,
  uiLabel,
}: {
  article: Article;
  language: Language;
  uiLabel: ArticleInfiniteStreamProps['uiLabel'];
}) {
  const [copied, setCopied] = React.useState(false);
  const title = getArticleTitle(article, language) || article.title || '';
  const articleUrl = `${SITE_URL.replace(/\/$/, '')}/news/${article.slug}`;
  const buttonClass = 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800';

  const copyArticleLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt('Copy article link:', articleUrl);
    }
  };

  return (
    <div className="mb-3 flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/60">
      <span className="mr-1 text-sm font-black text-neutral-900 dark:text-neutral-100">
        {uiLabel(language, { en: 'Share:', gu: 'શેર કરો:', hi: 'शेयर करें:' })}
      </span>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${articleUrl}`)}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on WhatsApp"
        title="WhatsApp"
        className={`${buttonClass} hover:border-[#25D366]`}
      >
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden="true">
          <path fill="#25D366" d="M12.01 0a12 12 0 0 0-10.4 18l-1.6 5.8 6-1.6a12 12 0 1 0 6-22.2z" />
          <path fill="#FFF" d="M16.9 14.1c-.3-.1-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.5 0-.2-.1-.4-.2-.6-.2-.4-.7-1.7-1-2.3-.3-.6-.6-.5-.8-.5H8c-.2 0-.6.1-.9.4C6.8 7.3 6 8.1 6 9.8c0 1.7 1.2 3.4 1.4 3.6.2.2 2.4 3.7 5.9 5.2.8.3 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.1-.3-.2-.5-.3z" />
        </svg>
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on Facebook"
        title="Facebook"
        className={`${buttonClass} text-[#1877F2] hover:border-[#1877F2]`}
      >
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(articleUrl)}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on X"
        title="X"
        className={`${buttonClass} text-black hover:border-black dark:text-white dark:hover:border-white`}
      >
        <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <a
        href="https://m.dailyhunt.in/news/india/gujarati/gujarat-post-epaper-gujpost"
        target="_blank"
        rel="noreferrer"
        aria-label="Gujarat Post on Dailyhunt"
        title="Dailyhunt"
        className={`${buttonClass} hover:border-[#FBBC05]`}
      >
        <svg viewBox="0 0 48 48" className="h-[22px] w-[22px]" aria-hidden="true">
          <path fill="#093492" d="M20.99 12.49 C21.62 14.48 21.86 21.86 21.86 21.86 C21.86 21.86 14.15 21.83 12.51 21.18 C8.59 19.61 5.5 17.07 5.5 13.08 C5.5 9.13 8.64 5.64 12.94 5.64 C17.17 5.64 19.77 8.69 20.99 12.49 Z" />
          <path fill="#FBBC05" d="M35.51 20.99 C33.52 21.62 26.14 21.86 26.14 21.86 C26.14 21.86 26.17 14.15 26.82 12.51 C28.39 8.59 30.93 5.5 34.92 5.5 C38.87 5.5 42.36 8.64 42.36 12.94 C42.36 17.17 39.31 19.77 35.51 20.99 Z" />
          <path fill="#ED1C24" d="M27.01 35.51 C26.38 33.52 26.14 26.14 26.14 26.14 C26.14 26.14 33.85 26.17 35.49 26.82 C39.41 28.39 42.5 30.93 42.5 34.92 C42.5 38.87 39.36 42.36 35.06 42.36 C30.83 42.36 28.23 39.31 27.01 35.51 Z" />
          <path fill="#47B609" d="M12.49 27.01 C14.48 26.38 21.86 26.14 21.86 26.14 C21.86 26.14 21.83 33.85 21.18 35.49 C19.61 39.41 17.07 42.5 13.08 42.5 C9.13 42.5 5.64 39.36 5.64 35.06 C5.64 30.83 8.69 28.23 12.49 27.01 Z" />
        </svg>
      </a>
      <button
        type="button"
        onClick={copyArticleLink}
        aria-label={copied ? 'Article link copied' : 'Copy article link'}
        title={copied ? 'Copied' : 'Copy link'}
        className={`${buttonClass} ${copied ? 'border-[#B3121B] text-[#B3121B]' : 'hover:border-[#B3121B] hover:text-[#B3121B]'}`}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12 4 4L19 6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function ArticleInfiniteStream({
  mounted,
  streamList,
  article,
  language,
  mostReadArticles,
  trending,
  related,
  savedIds,
  getCardThumbnail,
  DEMO_THUMBNAILS,
  uiLabel,
  getArticleContent,
  parseArticleBodyBlocks,
  sanitizeParagraphHtml,
  getStreamTags,
  getTopicHref,
  TranslatedInlineText,
  TranslatedParagraph,
  sidebarRecommendedPool,
}: ArticleInfiniteStreamProps) {
  return (
    <div className="article-grid mt-3.5 border-t border-neutral-200 dark:border-neutral-800 !pt-3.5" suppressHydrationWarning>
      <article className="article-stream-container select-none w-full" suppressHydrationWarning>
        <div className="space-y-5" suppressHydrationWarning>
          {mounted && (() => {
            // Global set to track used Read Also article IDs across all stream items
            const usedReadAlsoIds = new Set<string>();

            return streamList.map((streamArticle) => {
              const streamCategory = normalizeDisplayText(getCategoryLabel(streamArticle, language));
              const streamBody = getArticleContent(streamArticle, language);
              const streamParagraphs = parseArticleBodyBlocks(streamBody);
              const streamCity = uiLabel(language, { en: 'Ahmedabad', gu: 'અમદાવાદ', hi: 'अहमदाबाद' });

              const mainId = String(article.id);
              const streamArtId = String(streamArticle.id);

              // Calculate compulsory 4 Read Also articles ensuring 4 STRICTLY DIFFERENT categories
              const rawPool = [...mostReadArticles, ...trending, ...related].filter(
                (a, idx, self) => String(a.id) !== mainId && String(a.id) !== streamArtId && self.findIndex(t => String(t.id) === String(a.id)) === idx
              );

              const streamCatSlug = (streamArticle.category || '').toLowerCase().replace(/\s+/g, '-');
              const streamCatName = (streamArticle.category || '').toLowerCase().trim() || 'general';

              // Prefer unused articles first
              let availablePool = rawPool.filter(cand => !usedReadAlsoIds.has(String(cand.id)));
              if (availablePool.length < 4) {
                availablePool = rawPool.filter(cand => String(cand.id) !== streamArtId);
              }

              // Group candidates by unique category name
              const byCategory = new Map<string, Article[]>();
              for (const cand of availablePool) {
                const cSlug = (cand.category || '').toLowerCase().replace(/\s+/g, '-');
                const cName = (cand.category || '').toLowerCase().trim() || 'general';

                if ((cSlug === streamCatSlug || cName === streamCatName) && availablePool.length >= 8) {
                  continue;
                }
                if (!byCategory.has(cName)) {
                  byCategory.set(cName, []);
                }
                byCategory.get(cName)!.push(cand);
              }

              if (byCategory.size < 4) {
                for (const cand of availablePool) {
                  const cName = (cand.category || '').toLowerCase().trim() || 'general';
                  if (!byCategory.has(cName)) {
                    byCategory.set(cName, []);
                  }
                  byCategory.get(cName)!.push(cand);
                }
              }

              const categoryTopArticles: Article[] = [];
              for (const [, catArts] of byCategory.entries()) {
                const sortedCatArts = [...catArts].sort((a, b) => {
                  const isMostReadA = mostReadArticles.some(m => m.id === a.id) ? 20 : 0;
                  const isMostReadB = mostReadArticles.some(m => m.id === b.id) ? 20 : 0;
                  const scoreA = isMostReadA + (a.isTrending ? 10 : 0) + (a.isFeatured ? 5 : 0) + Math.min((a.views || 0) / 100, 5);
                  const scoreB = isMostReadB + (b.isTrending ? 10 : 0) + (b.isFeatured ? 5 : 0) + Math.min((b.views || 0) / 100, 5);
                  return scoreB - scoreA;
                });
                categoryTopArticles.push(sortedCatArts[0]);
              }

              categoryTopArticles.sort((a, b) => {
                const isMostReadA = mostReadArticles.some(m => m.id === a.id) ? 20 : 0;
                const isMostReadB = mostReadArticles.some(m => m.id === b.id) ? 20 : 0;
                const scoreA = isMostReadA + (a.isTrending ? 10 : 0) + (a.isFeatured ? 5 : 0) + Math.min((a.views || 0) / 100, 5);
                const scoreB = isMostReadB + (b.isTrending ? 10 : 0) + (b.isFeatured ? 5 : 0) + Math.min((b.views || 0) / 100, 5);
                return scoreB - scoreA;
              });

              const readAlsoArticles = categoryTopArticles.slice(0, 4);

              if (readAlsoArticles.length < 4) {
                for (const cand of availablePool) {
                  if (readAlsoArticles.length >= 4) break;
                  if (!readAlsoArticles.some(r => r.id === cand.id)) {
                    readAlsoArticles.push(cand);
                  }
                }
              }

              readAlsoArticles.forEach(a => usedReadAlsoIds.add(String(a.id)));

              return (
                <div key={streamArticle.id} className="article-stream-item border-b border-neutral-200 dark:border-neutral-800 pb-5 last:border-b-0 text-left flex flex-col items-start w-full">
                  <nav className="breadcrumb select-none flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-neutral-500 font-medium mb-3 w-full text-left justify-start">
                    <Link href="/" className="hover:text-[var(--red)] transition-colors">
                      {uiLabel(language, { en: 'Home', gu: 'હોમ', hi: 'होम' })}
                    </Link>
                    <span>/</span>
                    <Link href={`/category/${streamArticle.category.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-[var(--red)] transition-colors">
                      {streamCategory}
                    </Link>
                    <span>/</span>
                    <span>{streamCity}</span>
                    <span>/</span>
                    <span className="text-neutral-700 dark:text-neutral-300 font-normal">
                      <AutoArticleBreadcrumbTitle article={streamArticle} />
                    </span>
                  </nav>

                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-foreground tracking-tight mb-4 text-left w-full">
                    <AutoArticleTitle article={streamArticle} language={language} />
                  </h2>

                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-black rounded-lg shadow-sm mb-6 mt-4">
                    <Image
                      src={streamArticle.image}
                      alt={getArticleTitle(streamArticle, language)}
                      fill
                      sizes="(max-width: 1024px) 100vw, 760px"
                      className="object-cover"
                    />
                  </div>

                  <div className="article-body space-y-4 text-[17px] sm:text-[18px] leading-[1.8] sm:leading-[1.85] text-foreground mb-2.5 text-left w-full">
                    {streamParagraphs.map((p, pIdx) => {
                      const trimmed = p.trim();
                      if (!trimmed) return null;

                      if (trimmed.startsWith('> ') || trimmed.startsWith('>"') || trimmed.startsWith('> "')) {
                        const lines = trimmed.split('\n');
                        const quoteText = lines
                          .filter((l) => l.startsWith('>') && !l.includes('> —') && !l.includes('> -'))
                          .map((l) => l.replace(/^>\s*"?/, '').replace(/"?$/, ''))
                          .join(' ');
                        const citeLine = lines.find((l) => l.includes('> —') || l.includes('> -'));
                        const citeText = citeLine ? citeLine.replace(/^>\s*—\s*/, '').replace(/^>\s*-\s*/, '').trim() : '';

                        return (
                          <blockquote key={pIdx} className="my-6 rounded-r-xl border-l-4 border-[#B3121B] bg-neutral-50 p-4 dark:bg-neutral-900/60 shadow-sm">
                            <p className="text-base font-bold text-neutral-900 dark:text-white leading-relaxed">
                              &quot;<TranslatedInlineText text={quoteText || trimmed.replace(/^>\s*/, '')} language={language} />&quot;
                            </p>
                            {citeText && (
                              <cite className="block mt-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 not-italic">
                                — {citeText}
                              </cite>
                            )}
                          </blockquote>
                        );
                      }

                      const cleanedParagraph = sanitizeParagraphHtml(trimmed, language);
                      if (!cleanedParagraph) return null;

                      return (
                        <TranslatedParagraph
                          key={pIdx}
                          rawHtml={cleanedParagraph}
                          language={language}
                        />
                      );
                    })}
                  </div>

                  {readAlsoArticles.length > 0 && (
                    <>
                    <ArticleStreamShareBar article={streamArticle} language={language} uiLabel={uiLabel} />
                    <div className="w-full mt-2.5 mb-4">
                      {/* Section header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="block w-[4px] h-5 rounded-full bg-[#B3121B]"></span>
                        </div>
                        <h4 className="font-extrabold text-[15px] uppercase tracking-widest text-[#B3121B]">
                          {uiLabel(language, { en: 'Read Also', gu: 'આ પણ વાંચો', hi: 'यह भी पढ़ें' })}
                        </h4>
                        <div className="flex-1 h-px bg-gradient-to-r from-[#B3121B]/20 to-transparent"></div>
                      </div>

                      {/* Mobile View (< md): Hero Section style list */}
                      <div className="flex flex-col divide-y divide-border/60 md:hidden">
                        {readAlsoArticles.map((raArt, index) => (
                          <MobileHeroArticleCard
                            key={`mobile-stream-${streamArticle.id}-ra-${raArt.id}-${index}`}
                            article={raArt}
                            language={language}
                            index={index}
                          />
                        ))}
                      </div>

                      {/* Desktop View (>= md): existing 2-column card grid */}
                      <div className="hidden md:grid md:grid-cols-2 gap-3">
                        {readAlsoArticles.map((raArt, index) => {
                          const raCat = normalizeDisplayText(getCategoryLabel(raArt, language) || raArt.category || '');
                          return (
                            <Link
                              key={`stream-${streamArticle.id}-ra-${raArt.id}-${index}`}
                              href={`/news/${raArt.slug}`}
                              className="group flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-xs hover:border-[#B3121B] hover:shadow-[0_6px_20px_rgba(179,18,27,0.12)] dark:hover:shadow-[0_6px_20px_rgba(179,18,27,0.22)] hover:-translate-y-0.5 transition-all duration-300 text-left"
                            >
                              {/* Thumbnail Image */}
                              <div className="relative h-[70px] w-[90px] shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 shadow-sm">
                                <Image
                                  src={getCardThumbnail(raArt, index)}
                                  alt={getArticleTitle(raArt, language)}
                                  fill
                                  sizes="90px"
                                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEMO_THUMBNAILS[index % DEMO_THUMBNAILS.length];
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </div>
                              {/* Content */}
                              <div className="min-w-0 flex-1 flex flex-col gap-1">
                                <span className="block text-[10.5px] font-black uppercase tracking-wider text-[#B3121B] opacity-85">{raCat}</span>
                                <p className="line-clamp-3 text-[13px] font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-[#B3121B] dark:group-hover:text-red-400 transition-colors duration-200 leading-snug">
                                  <AutoArticleTitle article={raArt} language={language} />
                                </p>
                              </div>
                              {/* Arrow indicator */}
                              <span className="shrink-0 mt-1 text-neutral-400 group-hover:text-[#B3121B] group-hover:translate-x-1 transition-all duration-200 text-sm font-bold">→</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                    </>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-5 select-none">
                    <span className="topics-title font-extrabold text-neutral-900 dark:text-white mr-2 text-[14.5px] tracking-wide uppercase border-b-2 border-[#B3121B] pb-0.5">
                      {uiLabel(language, { en: 'Topics:', gu: 'ટોપિક્સ:', hi: 'વિષય:' })}
                    </span>
                    {getStreamTags(streamArticle).map((tag, tIdx) => (
                      <Link
                        key={tIdx}
                        href={getTopicHref(tag)}
                        className="topic-pill cursor-pointer bg-neutral-100 dark:bg-neutral-800/80 hover:bg-[#B3121B] dark:hover:bg-[#B3121B] text-neutral-800 dark:text-neutral-200 hover:text-white dark:hover:text-white rounded-full px-4 py-1.5 text-xs font-bold border border-neutral-300 dark:border-neutral-700 hover:border-[#B3121B] dark:hover:border-[#B3121B] shadow-sm transition-all duration-200"
                      >
                        {normalizeDisplayText(tag)}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </article>

      <aside className="select-none h-fit sticky top-[100px] w-full max-w-[340px] min-w-0 overflow-hidden" suppressHydrationWarning>
        {/* Heading and recommended stories stick together below header */}
        <div className="wtitle mb-3">
          <span className="d"></span>
          <span>{uiLabel(language, { en: 'Recommended Stories', gu: 'તમારા માટે ભલામણ', hi: 'आपके लिए अनुशंसित' })}</span>
        </div>

        {/* Mobile View (< md): Hero Section style list */}
        <div className="flex flex-col divide-y divide-border/60 md:hidden">
          {sidebarRecommendedPool.slice(0, 6).map((item, index) => (
            <MobileHeroArticleCard
              key={`stream-rec-mob-${item.id || index}`}
              article={item}
              language={language}
              index={index}
            />
          ))}
        </div>

        {/* Desktop View (>= md): existing */}
        <div className="hidden md:block space-y-0">
          {sidebarRecommendedPool.slice(0, 6).map((item, index) => {
            const itemCategory = normalizeDisplayText(getCategoryLabel(item, language));
            return (
              <Link
                key={item.id}
                href={`/news/${item.slug}`}
                className="group flex items-start gap-3 py-2.5 border-b border-neutral-200/80 dark:border-neutral-800 last:border-b-0 text-left hover:opacity-90 transition-all"
              >
                <div className="min-w-0 flex-1 pr-1">
                  <span className="block text-[11px] font-black uppercase tracking-wide text-[#B3121B] dark:text-red-500 mb-0.5">
                    {itemCategory}
                  </span>
                  <h3 className="text-[13.5px] sm:text-[14px] font-bold leading-snug tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-[#B3121B] dark:group-hover:text-red-400 transition-colors line-clamp-3">
                    <AutoArticleTitle article={item} language={language} />
                  </h3>
                </div>
                <div className="relative w-[108px] sm:w-[114px] h-[72px] sm:h-[76px] shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 shadow-xs self-start">
                  <Image
                    src={getCardThumbnail(item, index)}
                    alt={item.title || ''}
                    fill
                    sizes="114px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
