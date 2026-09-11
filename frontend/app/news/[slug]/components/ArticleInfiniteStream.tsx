'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Article, Language } from '@/types';
import { normalizeDisplayText, formatDate, getCategoryLabel, getArticleTitle } from '@/data';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';

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
    <div className="article-grid mt-8 border-t border-neutral-200 dark:border-neutral-800 !pt-8" suppressHydrationWarning>
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
                    <span className="mx-0.5">:</span>
                    <span className="text-red-700 dark:text-red-400 font-bold">
                      <AutoArticleTitle article={streamArticle} language={language} />
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

                  <div className="article-body space-y-4 text-[16px] leading-relaxed text-foreground mb-6 text-left w-full">
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
                    <div className="w-full mt-4 mb-5">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {readAlsoArticles.map((raArt, index) => {
                          const raCat = normalizeDisplayText(getCategoryLabel(raArt, language) || raArt.category || '');
                          return (
                            <Link
                              key={`stream-${streamArticle.id}-ra-${raArt.id}-${index}`}
                              href={`/news/${raArt.slug}`}
                              className="group flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-[#B3121B]/30 hover:shadow-[0_4px_20px_rgba(179,18,27,0.1)] dark:hover:shadow-[0_4px_20px_rgba(179,18,27,0.15)] hover:-translate-y-0.5 transition-all duration-300 text-left"
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
                              <span className="shrink-0 mt-1 text-neutral-400 group-hover:text-[#B3121B] transition-colors duration-200 text-sm">→</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
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

        {/* Read Also Section for Primary Article */}
        {related.length > 0 && (
          <div className="w-full mt-6 mb-6">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="block w-[4px] h-5 rounded-full bg-[#B3121B]"></span>
                <span className="block w-[3px] h-3.5 rounded-full bg-[#B3121B]/40"></span>
              </div>
              <h4 className="font-extrabold text-[15px] uppercase tracking-widest text-[#B3121B]">
                {uiLabel(language, { en: 'Read Also', gu: 'આ પણ વાંચો', hi: 'યહ ભી પઢ઼ેં' })}
              </h4>
              <div className="flex-1 h-px bg-gradient-to-r from-[#B3121B]/20 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {related.slice(0, 4).map((raArt, index) => {
                const raCat = normalizeDisplayText(getCategoryLabel(raArt, language));
                return (
                  <Link
                    key={`bottom-ra-${raArt.id}-${index}`}
                    href={`/news/${raArt.slug}`}
                    className="group flex gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-[#B3121B]/30 hover:shadow-[0_4px_20px_rgba(179,18,27,0.1)] dark:hover:shadow-[0_4px_20px_rgba(179,18,27,0.15)] hover:-translate-y-0.5 transition-all duration-300 items-start text-left"
                  >
                    <div className="relative h-[70px] w-[90px] shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800 shadow-sm">
                      <Image
                        src={getCardThumbnail(raArt, index)}
                        alt={getArticleTitle(raArt, language)}
                        fill
                        sizes="90px"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/90x70/e2e8f0/94a3b8?text=GP'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#B3121B] opacity-80">{raCat}</span>
                      <p className="line-clamp-3 text-[13px] font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-[#B3121B] dark:group-hover:text-red-400 transition-colors duration-200 leading-snug">
                        <AutoArticleTitle article={raArt} language={language} />
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Topics Tags for Primary Article */}
        <div className="flex flex-wrap items-center gap-2 mt-5 select-none">
          <span className="topics-title font-extrabold text-neutral-900 dark:text-white mr-2 text-[14.5px] tracking-wide uppercase border-b-2 border-[#B3121B] pb-0.5">
            {uiLabel(language, { en: 'Topics:', gu: 'ટોપિક્સ:', hi: 'વિષય:' })}
          </span>
          {(language === 'en' ? article.tags : language === 'hi' ? (article.tagsHi?.length ? article.tagsHi : article.tags) : (article.tagsGu?.length ? article.tagsGu : article.tags)).map((tag, tIdx) => (
            <Link
              key={tIdx}
              href={getTopicHref(tag)}
              className="topic-pill cursor-pointer bg-neutral-100 dark:bg-neutral-800/80 hover:bg-[#B3121B] dark:hover:bg-[#B3121B] text-neutral-800 dark:text-neutral-200 hover:text-white dark:hover:text-white rounded-full px-4 py-1.5 text-xs font-bold border border-neutral-300 dark:border-neutral-700 hover:border-[#B3121B] dark:hover:border-[#B3121B] shadow-sm transition-all duration-200"
            >
              {normalizeDisplayText(tag)}
            </Link>
          ))}
        </div>
      </article>

      <aside className="select-none h-fit sticky top-[100px]" style={{ width: '100%', maxWidth: '336px' }} suppressHydrationWarning>
        {/* Heading and recommended stories stick together below header */}
        <div className="wtitle mb-3">
          <span className="d"></span>
          <span>{uiLabel(language, { en: 'Recommended Stories', gu: 'તમારા માટે ભલામણ', hi: 'આપકે લિએ અનુશંસિત' })}</span>
        </div>
        <div className="space-y-0">
          {sidebarRecommendedPool.slice(0, 4).map((item, index) => {
            const itemCategory = normalizeDisplayText(getCategoryLabel(item, language));
            return (
              <Link key={item.id} href={`/news/${item.slug}`} className="s-compact hover:opacity-85 transition-opacity">
                <div>
                  <span className="kick">{itemCategory}</span>
                  <h3><AutoArticleTitle article={item} language={language} /></h3>
                  <div className="meta">
                    <span suppressHydrationWarning>{formatDate(item.publishedAt)}</span>
                  </div>
                </div>
                <div className="imgwrap">
                  <Image src={getCardThumbnail(item, index)} alt={item.title} fill sizes="92px" className="object-cover" />
                </div>
              </Link>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
