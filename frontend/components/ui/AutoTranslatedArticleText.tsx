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
