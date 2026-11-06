'use client';

import type { Article, Language } from '@/types';
import { getArticleExcerpt, getArticleTitle, getArticleContent } from '@/data';
import { useAutoTranslate } from '@/lib/translate';

type ArticleField = 'title' | 'excerpt' | 'content';

function getFieldValue(article: Article, field: ArticleField, language: Language): string {
  if (field === 'title') return getArticleTitle(article, language);
  if (field === 'excerpt') return getArticleExcerpt(article, language);
  if (field === 'content') return getArticleContent(article, language);

  const en = (article as any)[field] || '';
  const gu = (article as any)[`${field}Gu`] || '';
  const hi = (article as any)[`${field}Hi`] || '';

  if (language === 'hi') return hi || gu || en;
  if (language === 'gu') return gu || hi || en;
  return en || gu || hi;
}

export function AutoTranslatedArticleText({
  article,
  field,
  language,
  fallback = '',
}: {
  article: Article;
  field: ArticleField;
  language: Language;
  fallback?: string;
}) {
  const sourceText = getFieldValue(article, field, language) || fallback;
  const translatedText = useAutoTranslate(sourceText, language);

  if ((language === 'en' || language === 'hi') && !translatedText && /[\u0A80-\u0AFF]/.test(sourceText)) {
    const explicitEn = (article as any)?.titleEn || (article as any)?.excerptEn || (article as any)?.englishTitle;
    const explicitHi = (article as any)?.titleHi && /[\u0900-\u097F]/.test((article as any).titleHi) ? (article as any).titleHi : null;
    if (language === 'hi' && explicitHi) return <span suppressHydrationWarning>{explicitHi}</span>;
    if (language === 'en' && explicitEn) return <span suppressHydrationWarning>{explicitEn}</span>;
  }

  return <span suppressHydrationWarning>{translatedText || sourceText}</span>;
}

export function AutoArticleTitle({ article, language, fallback }: { article: Article; language: Language; fallback?: string }) {
  return <AutoTranslatedArticleText article={article} field="title" language={language} fallback={fallback} />;
}

export function AutoArticleTitleWithPrefix({
  article,
  language,
  prefixClassName = 'text-[#B3121B] font-black mr-1',
  fallback = '',
}: {
  article: Article;
  language: Language;
  prefixClassName?: string;
  fallback?: string;
}) {
  const sourceText = getFieldValue(article, 'title', language) || fallback;
  const translatedText = useAutoTranslate(sourceText, language);

  let finalTitle = translatedText || sourceText;

  if ((language === 'en' || language === 'hi') && !translatedText && /[\u0A80-\u0AFF]/.test(sourceText)) {
    const explicitEn = (article as any)?.titleEn || (article as any)?.englishTitle;
    const explicitHi = (article as any)?.titleHi && /[\u0900-\u097F]/.test((article as any).titleHi) ? (article as any).titleHi : null;
    if (language === 'hi' && explicitHi) finalTitle = explicitHi;
    if (language === 'en' && explicitEn) finalTitle = explicitEn;
  }

  const colonIdx = finalTitle.indexOf(':');
  const hasPrefix = colonIdx > 2 && colonIdx <= 48;

  if (hasPrefix) {
    const prefix = finalTitle.substring(0, colonIdx + 1);
    const rest = finalTitle.substring(colonIdx + 1).trim();
    return (
      <span suppressHydrationWarning>
        <span className={prefixClassName}>{prefix}</span>{' '}
        <span>{rest}</span>
      </span>
    );
  }

  return <span suppressHydrationWarning>{finalTitle}</span>;
}

export function AutoArticleExcerpt({ article, language, fallback }: { article: Article; language: Language; fallback?: string }) {
  return <AutoTranslatedArticleText article={article} field="excerpt" language={language} fallback={fallback} />;
}

export function AutoTranslatedText({
  values,
  language,
  fallback = '',
}: {
  values: { en?: string; gu?: string; hi?: string };
  language: Language;
  fallback?: string;
}) {
  const sourceText =
    language === 'hi'
      ? (values.hi && /[\u0900-\u097F]/.test(values.hi) ? values.hi : values.gu || values.en || fallback)
      : language === 'gu'
        ? values.gu || values.hi || values.en || fallback
        : (values.en && !/[\u0A80-\u0AFF]/.test(values.en) ? values.en : values.gu || values.hi || fallback);
  const translatedText = useAutoTranslate(sourceText, language);

  if ((language === 'en' || language === 'hi') && !translatedText && /[\u0A80-\u0AFF]/.test(sourceText)) {
    if (language === 'hi' && values.hi && /[\u0900-\u097F]/.test(values.hi)) return <span suppressHydrationWarning>{values.hi}</span>;
    if (language === 'en' && values.en && !/[\u0A80-\u0AFF]/.test(values.en)) return <span suppressHydrationWarning>{values.en}</span>;
  }

  return <span suppressHydrationWarning>{translatedText || sourceText}</span>;
}

export function AutoTranslateString({ text, language }: { text: string; language: Language }) {
  const translatedText = useAutoTranslate(text, language);

  return <span suppressHydrationWarning>{translatedText || text}</span>;
}

/**
 * Resolves the purest English title for news breadcrumbs,
 * ensuring English headline formatting like:
 * "Saudi Arabia Airport & Oil Facility Attack | Houthi Rebels Strike"
 */
export function getEnglishBreadcrumbTitle(article: Article, autoTranslatedEn?: string): string {
  if (!article) return '';

  const hasIndic = (s: string) => /[\u0900-\u0D7F]/.test(s || '');
  const hasLatin = (s: string) => /[a-zA-Z]{3,}/.test(s || '');

  // 1. If explicit title is already in English (Latin letters and no Indic script)
  const rawTitle = (article.title || '').trim();
  if (rawTitle && hasLatin(rawTitle) && !hasIndic(rawTitle)) {
    return rawTitle;
  }

  // 2. If article.seoTitle has clean English title or bilingual segment
  const seoTitle = ((article as any).seoTitle || '').trim();
  if (seoTitle) {
    if (seoTitle.includes('|')) {
      const parts = seoTitle.split('|').map((p: string) => p.trim());
      const enParts = parts.filter(
        (p: string) => hasLatin(p) && !hasIndic(p) && !/^(gujaratpost|gujarat post|news|\s)*$/i.test(p)
      );
      if (enParts.length > 0) {
        return enParts.join(' | ');
      }
    } else if (hasLatin(seoTitle) && !hasIndic(seoTitle)) {
      const cleaned = seoTitle.replace(/[-|]?\s*(gujaratpost|gujarat post|news)\s*$/gi, '').trim();
      if (cleaned.length > 3) return cleaned;
    }
  }

  // 3. If dynamic English translation is resolved
  if (autoTranslatedEn && typeof autoTranslatedEn === 'string') {
    const cleanTr = autoTranslatedEn.trim().replace(/\.$/, '');
    if (hasLatin(cleanTr) && !hasIndic(cleanTr)) {
      return cleanTr;
    }
  }

  // 4. Derive from clean English slug
  const slug = (article.slug || '').trim();
  if (slug && !slug.includes('-k-') && !slug.includes('-d-rg-') && !slug.includes('-z-')) {
    const rawWords = slug.replace(/-\d+$/, '').split('-').filter(Boolean);
    if (rawWords.length >= 2) {
      return rawWords
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  // Fallback to title
  return rawTitle || (article as any).titleGu || '';
}

export function AutoArticleBreadcrumbTitle({
  article,
  fallback = '',
}: {
  article: Article;
  fallback?: string;
}) {
  const sourceText = (article as any)?.titleGu || article?.title || fallback;
  const autoTranslatedEn = useAutoTranslate(sourceText, 'en');

  const englishTitle = getEnglishBreadcrumbTitle(article, autoTranslatedEn) || fallback || sourceText;

  return <span suppressHydrationWarning>{englishTitle}</span>;
}
