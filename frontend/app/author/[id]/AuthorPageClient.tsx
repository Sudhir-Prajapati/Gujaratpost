'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye, MapPin, BookOpen } from 'lucide-react';
import { formatViews, getArticleTitle, getCategoryLabel, getLocalized } from '@/data';
import { getCategoryColor } from '@/lib/utils';
import { useApp } from '@/components/AppProvider';
import type { Author, Article } from '@/types';

interface AuthorPageClientProps {
  author: Author;
  articles: Article[];
}

export default function AuthorPageClient({ author, articles }: AuthorPageClientProps) {
  const { language } = useApp();

  const authorName = getLocalized(language, {
    en: author.name,
    gu: author.nameGu,
    hi: author.nameHi,
  });

  const authorDesignation = getLocalized(language, {
    en: author.designation,
    gu: author.designationGu,
    hi: author.designationHi,
  });

  const authorBio = getLocalized(language, {
    en: author.bio,
    gu: author.bioGu,
    hi: author.bioHi,
  });

  // Extract author initials for avatar fallback
  const initials = authorName.slice(0, 2);

  // Label translations
  const articlesCountText = getLocalized(language, {
    en: 'articles',
    gu: 'લેખ',
    hi: 'लेख',
  });

  const designationPrefix = getLocalized(language, {
    en: 'Author Profile',
    gu: 'લેખક પ્રોફાઇલ',
    hi: 'लेखक प्रोफ़ाइल',
  });

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground select-none">
        <Link href="/" className="hover:text-accent">Home</Link>
        <span>›</span>
        <span className="text-foreground/80">{designationPrefix}</span>
        <span>›</span>
        <span className="font-bold text-foreground">{authorName}</span>
      </nav>

      {/* Author Header card */}
      <div className="mb-10 flex flex-col md:flex-row items-center md:items-start gap-6 border-b border-border pb-8">
        <div className="relative h-24 w-24 md:h-28 md:w-28 shrink-0 overflow-hidden rounded-full border-2 border-accent bg-accent/5 shadow-md flex items-center justify-center">
          {author.image ? (
            <Image
              src={author.image}
              alt={authorName}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <span className="text-2xl font-black text-accent">{initials}</span>
          )}
        </div>

        <div className="text-center md:text-left flex-1 min-w-0">
          <span className="text-xs font-black uppercase tracking-wider text-accent bg-accent/5 px-2.5 py-1 rounded-md">
            {authorDesignation}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-foreground mt-2.5 mb-2 leading-none">
            {authorName}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl font-medium">
            {authorBio}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-muted-foreground select-none font-sans">
            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-sm">
              <BookOpen className="h-3.5 w-3.5" />
              <b className="text-foreground">{articles.length}</b> {articlesCountText}
            </span>
            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-sm">
              <MapPin className="h-3.5 w-3.5" />
              Gujarat
            </span>
          </div>
        </div>
      </div>

      {/* Grid of author's articles */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => {
          const title = getArticleTitle(article, language);
          const category = getCategoryLabel(article, language);
          const categoryColor = getCategoryColor(article.category);
          return (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-300 group-hover:scale-103"
                />
                {article.isBreaking && (
                  <span className="absolute left-2 top-2 rounded bg-accent px-1.5 py-0.5 text-[9px] font-black text-white">
                    BREAKING
                  </span>
                )}
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <span className="cat-badge mb-2 inline-block shrink-0" style={{ background: categoryColor, fontSize: '0.65rem', padding: '0.15rem 0.55rem' }}>
                    {category}
                  </span>
                  <h3 className="line-clamp-2 text-[14px] sm:text-[15px] font-black leading-snug text-foreground group-hover:text-accent transition-colors">
                    {title}
                  </h3>
                </div>
                <div className="mt-4 flex items-center justify-end text-[11px] font-semibold text-muted-foreground border-t border-border/40 pt-2.5 select-none font-sans">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatViews(article.views)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
