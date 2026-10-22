'use client';

import { useEffect, useMemo, useState, useCallback, memo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsApk } from '@/lib/useIsApk';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle2, ArrowRight, Download } from 'lucide-react';
import { SocialIcon } from '@/components/ui/SocialLinks';
import { isMediaVideo, sanitizeImageUrl, formatImageDownloadUrl } from '@/lib/media';
import dynamic from 'next/dynamic';
import ArticleShareAudioBar from './components/ArticleShareAudioBar';

import RelatedStoriesSection from './components/RelatedStoriesSection';
import AlsoPanVacho from './components/AlsoPanVacho';
import MobileHeroArticleCard from '@/components/ui/MobileHeroArticleCard';

const ArticleInfiniteStream = dynamic(() => import('./components/ArticleInfiniteStream'));
const ArticlePdfPagesViewer = dynamic(() => import('@/components/sections/ArticlePdfPagesViewer'), { ssr: false });

const ReadingProgressBar = memo(function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return <div className="reading-progress" style={{ width: `${progress}%` }} />;
});

const ArticleContentBody = memo(function ArticleContentBody({ html }: { html: string }) {
  const bodyRef = useRef<HTMLDivElement>(null);

  const cleanHtml = useMemo(() => {
    return (html || '')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, ' ')
      .replace(
        /(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/[^"'\s)]+?\.)(?:jpg|jpeg|png|webp|gif)/gi,
        '$1avif'
      );
  }, [html]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.innerHTML = cleanHtml;
    }
  }, [cleanHtml]);

  // Both SSR and client initial render produce identical empty <div>
  // innerHTML is set imperatively after mount via ref — no hydration mismatch
  return (
    <div
      ref={bodyRef}
      className="article-body text-[17px] sm:text-[18px] leading-[1.8] sm:leading-[1.85] text-neutral-900 dark:text-neutral-100 prose dark:prose-invert max-w-none [&_p]:text-[17px] sm:[&_p]:text-[18px] [&_p]:leading-[1.8] sm:[&_p]:leading-[1.85] [&_p]:my-2 [&_b]:font-extrabold [&_strong]:font-extrabold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through [&_a]:text-[#B3121B] [&_a]:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:list-item [&_li]:my-1 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#B3121B] [&_blockquote]:pl-4 [&_blockquote]:font-bold [&_blockquote]:not-italic [&_blockquote]:my-3 [&_img]:rounded-xl [&_figure]:my-4"
    />
  );
});

const DetailSlideVideo = memo(function DetailSlideVideo({
  src,
  isActive,
  onEnded,
}: {
  src: string;
  isActive: boolean;
  onEnded: () => void;
}) {
  const vidRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isActive && vidRef.current) {
      vidRef.current.currentTime = 0;
      vidRef.current.defaultMuted = true;
      vidRef.current.play().catch(() => { });
    } else if (!isActive && vidRef.current) {
      vidRef.current.pause();
    }
  }, [isActive]);

  return (
    <video
      ref={vidRef}
      src={src}
      controls
      playsInline
      autoPlay
      muted
      onEnded={onEnded}
      className="h-full w-full object-cover"
      poster="/assets/placeholder.jpg"
    />
  );
});
import { Article, Language } from '@/types';
import {
  formatDate,
  formatViews,
  getArticleContent,
  getArticleExcerptHtml,
  getArticleTitle,
  getCategoryLabel,
  getLocalized,
  normalizeDisplayText,
} from '@/data';
import { useApp } from '@/components/AppProvider';
import { useAutoTranslate, useAutoTranslateHtml } from '@/lib/translate';
import Advertisement from '@/components/ads/Advertisement';
import { toGu } from '@/lib/utils';
import { getBackendApiUrl, getHeroSettings } from '@/lib/api';
import AdSectionBanner from '@/components/ads/AdSectionBanner';
import { AutoArticleTitle, AutoArticleBreadcrumbTitle } from '@/components/ui/AutoTranslatedArticleText';

const CATEGORY_SLUG_MAP: Record<string, string> = {
  'trending': 'trending',
  'breaking': 'trending',

  // Gujarati
  'ગુજરાત': 'gujarat',
  'અમદાવાદ': 'ahmedabad',
  'ગાંધીનગર': 'gandhinagar',
  'સુરત': 'surat',
  'વડોદરા': 'vadodara',
  'રાજકોટ': 'rajkot',
  'ભારત': 'india',
  'વિશ્વ': 'world',
  'બિઝનેસ': 'business',
  'ગોલ્ડ - સિલ્વર': 'business',
  'સ્પોર્ટ્સ': 'sports',
  'રમત-ગમત': 'sports',
  'મનોરંજન': 'entertainment',
  'ટેકનોલોજી': 'technology',
  'શિક્ષણ': 'education',
  'ફેક્ટ ચેક': 'fact-check',
  'ચૂંટણી 2027': 'election',
  'ટ્રેન્ડિંગ': 'trending',

  // Hindi
  'गुजरात': 'gujarat',
  'अहमदाबाद': 'ahmedabad',
  'गांधीनगर': 'gandhinagar',
  'सूरत': 'surat',
  'वडोदरा': 'vadodara',
  'राजकोट': 'rajkot',
  'भारत': 'india',
  'विश्व': 'world',
  'बिजनेस': 'business',
  'खेल': 'sports',
  'मनोरंजन': 'entertainment',
  'टेक्नोलॉजी': 'technology',
  'शिक्षा': 'education',
  'फैक्ट चेक': 'fact-check',
  'चुनाव २०२७': 'election',
  'ट्रेंडिंग': 'trending',
};

function getTopicHref(tag: string): string {
  if (!tag) return '/search';
  const trimmed = tag.trim();
  const lower = trimmed.toLowerCase();
  const catSlug = CATEGORY_SLUG_MAP[trimmed] || CATEGORY_SLUG_MAP[lower];
  if (catSlug) {
    return `/category/${catSlug}`;
  }
  return `/search?q=${encodeURIComponent(trimmed)}`;
}

const DEMO_THUMBNAILS = [
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=80',
];

function getCardThumbnail(art: any, index: number = 0): string {
  const raw = art?.image || art?.featuredImage || art?.thumbnail;
  if (
    raw &&
    raw.trim() !== '' &&
    !raw.includes('photo-1599930113854') &&
    !raw.includes('photo-1589308078059') &&
    !raw.includes('placehold.co')
  ) {
    return raw;
  }
  let hash = index;
  if (art?.id || art?.slug) {
    const key = art.id || art.slug;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
  }
  return DEMO_THUMBNAILS[Math.abs(hash) % DEMO_THUMBNAILS.length];
}

function formatPdfDownloadUrl(url: string): string {
  if (!url || url === '#' || !url.trim()) return '';
  const cleanUrl = url.trim();

  // If already routed through download-pdf proxy
  if (cleanUrl.includes('/api/public/download-pdf')) {
    return cleanUrl;
  }

  return `/api/public/download-pdf?url=${encodeURIComponent(cleanUrl)}`;
}

function buildTwitterCardHtml(url: string, language?: string): string {
  const cleanUrl = url && url.trim() !== '#' ? url.trim() : '#';
  const isGu = language === 'gu';
  const isHi = language === 'hi';
  const title = 'View Official Post on X (Twitter)';
  const sub = isGu
    ? 'સત્તાવાર ટ્વીટ જોવા માટે અહીં ક્લિક કરો'
    : isHi
      ? 'आधिकारिक ट्वीट देखने के लिए यहाँ क्लिक करें'
      : 'Click to view official post on X';
  const btn = isGu ? 'ટ્વીટ જુઓ ↗' : isHi ? 'ट्वीट देखें ↗' : 'View Post ↗';

  return `<div class="gp-x-card my-6">
    <div style="display:flex;align-items:center;gap:14px;min-width:0;position:relative;z-index:1">
      <span class="gp-x-icon">𝕏</span>
      <div style="min-width:0">
        <span class="gp-x-title">${title}</span>
        <span class="gp-x-sub">${sub}</span>
      </div>
    </div>
    <a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="gp-x-btn" style="position:relative;z-index:1">
      <span>${btn}</span>
    </a>
  </div>`;
}

function buildPdfCardHtml(url: string, language?: string): string {
  const downloadUrl = formatPdfDownloadUrl(url);
  if (!downloadUrl) return '';
  const fileName = (url || '').split('/').pop()?.split('?')[0] || 'Official_Document.pdf';
  const isGu = language === 'gu';
  const isHi = language === 'hi';
  const title = isGu
    ? 'સંદર્ભિત સત્તાવાર PDF દસ્તાવેજ'
    : isHi
      ? 'संलग्न आधिकारिक पीडीएफ दस्तावेज़'
      : 'Attached Official Document (PDF)';
  const sub = isGu
    ? 'ચકાસાયેલ સત્તાવાર સરકારી / પ્રેસ દસ્તાવેજ'
    : isHi
      ? 'सत्यापित आधिकारिक दस्तावेज़'
      : 'Verified Official Document';
  const btn = isGu ? 'ડાઉનલોડ PDF' : isHi ? 'डाउनलोड पीडीएफ' : 'Download PDF';

  return `<div class="gp-pdf-card my-6" data-pdf-url="${url.trim()}">
    <div class="gp-pdf-inner">
      <div class="gp-pdf-icon-wrap">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      </div>
      <div class="gp-pdf-text">
        <span class="gp-pdf-title">${title}</span>
        <span class="gp-pdf-sub">${sub}</span>
      </div>
    </div>
    <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer" download="${fileName}" class="gp-pdf-btn">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      <span>${btn}</span>
    </a>
  </div>`;
}

function upgradeEmbedCards(rawHtml: string, language?: string, articlePdfUrl?: string, hasPdfPages?: boolean): string {
  if (!rawHtml && !articlePdfUrl) return '';

  let cleaned = rawHtml || '';

  // Clean duplicate fl_attachment if any in legacy content
  cleaned = cleaned.replace(/\/fl_attachment\/fl_attachment\//gi, '/fl_attachment/');

  // Upgrade Twitter / X cards to clean official design
  cleaned = cleaned.replace(
    /<(div|p)[^>]*class=["'][^"']*(?:border|rounded|bg-|p-|my-|gp-x)[^"']*["'][^>]*>[\s\S]*?(?:View Tweet|View Official Post|Post on X|Twitter|ટ્વીટ)[\s\S]*?<\/(?:div|p)>(?:\s*<\/div>)?/gi,
    (match) => {
      const hrefMatch = match.match(/href=["']([^"']+)["']/i);
      const url = hrefMatch && hrefMatch[1] && hrefMatch[1] !== '#' ? hrefMatch[1] : '#';
      return buildTwitterCardHtml(url, language);
    }
  );

  // Extract PDF URL from body or props
  let detectedPdf = articlePdfUrl || '';
  if (!detectedPdf) {
    const pdfMatch =
      cleaned.match(/data-pdf-url=["']([^"']+)["']/i) ||
      cleaned.match(/gp-pdf-card[\s\S]*?href=["']([^"']+)["']/i) ||
      cleaned.match(/href=["']([^"']+\.pdf(?:\?[^"']*)?|\/uploads\/[^"']+\.pdf(?:\?[^"']*)?)["']/i);
    if (pdfMatch && pdfMatch[1]) detectedPdf = pdfMatch[1];
  }

  // Strip ALL PDF cards, fragments, and legacy boxes completely from the body paragraphs
  cleaned = cleaned
    .replace(/<div[^>]*class=["'][^"']*(?:gp-pdf-card|gp-pdf-card-v2|border-red-200|border-red-900|from-red-50|via-rose-50)[^"']*["'][\s\S]*?<\/a>\s*<\/div>/gi, '')
    .replace(/<div[^>]*class=["'][^"']*(?:gp-pdf-card|gp-pdf-card-v2)[^"']*["'][\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*data-pdf-url=["'][^"']*["'][\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class=["'][^"']*gp-pdf-pages-viewer[^"']*["'][\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class=["'][^"']*gp-pdf-inner[^"']*["'][\s\S]*?<\/div>/gi, '')
    .replace(/<a[^>]*class=["'][^"']*gp-pdf-btn[^"']*["'][\s\S]*?<\/a>/gi, '');

  // Strip orphan standalone buttons
  cleaned = cleaned.replace(/<a[^>]*>[\s\S]*?(?:Download\s*PDF|Attached Official Document|Official Document \(PDF\)|Attached PDF|ડાઉનલોડ\s*PDF|ડાઉનલોડ|Download)[\s\S]*?<\/a>/gi, (match) => {
    if (match.includes('gp-pdf-btn') || match.includes('gp-x-btn') || match.includes('gp-pdf-card') || match.includes('gp-x-card')) return match;
    return '';
  });

  // Remove any leftover empty container divs
  cleaned = cleaned.replace(/<div[^>]*class=["'][^"']*(?:border-red-200|border-red-900|from-red-50|via-rose-50|gp-pdf-card)[^"']*["']>\s*<\/div>/gi, '');

  // If a PDF is attached AND the full page-by-page reader is NOT active, append EXACTLY ONE clean PDF card
  if (detectedPdf && detectedPdf.trim() && detectedPdf !== '#' && !hasPdfPages) {
    cleaned += '\n\n' + buildPdfCardHtml(detectedPdf.trim(), language);
  }

  return cleaned.trim();
}

function stripArticleUtilityLines(rawHtml: string): string {
  return (rawHtml || '')
    .replace(/^#{1,6}\s*(?:[\u{1F4CC}\uFE0F]\s*)?.*(?:KEY\s*HIGHLIGHTS|AT\s*A\s*GLANCE).*$/gimu, '')
    .replace(/^#{1,6}\s*[\u{1F4CC}\uFE0F]\s*.*$/gmu, '');
}

function normalizeArticleMarkdown(rawHtml: string): string {
  const clean = (rawHtml || '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, ' ');
  return stripArticleUtilityLines(clean)
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h2>$1</h2>');
}

const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\s*\(\s*((?:https?:\/\/|\/uploads\/|\/assets\/)[^)]+)\s*\)/gi;

function isGalleryImageAlt(alt: string): boolean {
  return /gallery\s*image|ગેલેરી|गैलरी|छवि|છબી/i.test(alt || '');
}

function convertMarkdownImagesToFigures(rawHtml: string, titleText: string, includeCaption = false): string {
  let galleryCount = 0;

  return (rawHtml || '').replace(MARKDOWN_IMAGE_RE, (match, alt, url) => {
    const cleanAlt = (alt || '').trim();
    const cleanUrl = (url || '').replace(/\s+/g, '').trim();
    const isGallery = isGalleryImageAlt(cleanAlt);

    if (isGallery) {
      galleryCount++;
      if (galleryCount > 1) return '';
    }

    const caption = includeCaption
      ? `<figcaption class="flex items-center justify-between text-xs text-neutral-500 font-medium"><span>${cleanAlt || 'Gujarat Post'}</span><span>તસવીર: ગુજરાત પોસ્ટ</span></figcaption>`
      : cleanAlt && !isGallery
        ? `<figcaption class="text-xs text-center text-neutral-500 font-medium">${cleanAlt}</figcaption>`
        : '';

    return `<figure class="my-6 space-y-2"><div class="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black/5 dark:bg-black/40 shadow-sm"><img src="${sanitizeImageUrl(cleanUrl)}" alt="${cleanAlt || titleText || 'Gujarat Post Image'}" class="w-full h-full object-cover" /></div>${caption}</figure>`;
  });
}

function parseArticleBodyBlocks(rawBody: string, language?: string, articlePdfUrl?: string): string[] {
  if (!rawBody) return [];

  let cleaned = normalizeArticleMarkdown(upgradeEmbedCards(rawBody, language, articlePdfUrl))
    .replace(/^##\s*📌?\s*(એક નજરમાં|KEY HIGHLIGHTS|एक नजर में|AT A GLANCE).*?$/gmi, '')
    .replace(/----------------+/g, '')
    .replace(/\s*data-start="[^"]*"/gi, '')
    .replace(/\s*data-end="[^"]*"/gi, '')
    .replace(/\s*data-content-reference-start="[^"]*"/gi, '')
    .replace(/\s*data-content-reference-end="[^"]*"/gi, '')
    .replace(/\s*data-state="[^"]*"/gi, '')
    .replace(/\s*data-section-id="[^"]*"/gi, '')
    .replace(/<span[^>]*class="[^"]*selectionAnchor[^"]*"[^>]*><\/span>/gi, '')
    .replace(/<span[^>]*class="[^"]*contents[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '$1')
    .replace(/<span[^>]*><\/span>/gi, '');

  const htmlTagRegex = /<(p|blockquote|h1|h2|h3|figure|div)[^>]*>[\s\S]*?<\/\1>/gi;
  const htmlMatches = cleaned.match(htmlTagRegex);

  let rawBlocks: string[] = [];

  if (htmlMatches && htmlMatches.length > 0) {
    let currentBody = cleaned;
    htmlMatches.forEach((match) => {
      const idx = currentBody.indexOf(match);
      if (idx > 0) {
        const before = currentBody.substring(0, idx).trim();
        if (before) {
          before.split(/\n+/).forEach((line) => {
            const lTrim = line.replace(/\\r|\\n/g, '').trim();
            if (lTrim) rawBlocks.push(lTrim);
          });
        }
      }
      rawBlocks.push(match.trim());
      currentBody = currentBody.substring(idx + match.length);
    });
    if (currentBody.trim()) {
      currentBody.trim().split(/\n+/).forEach((line) => {
        const lTrim = line.replace(/\\r|\\n/g, '').trim();
        if (lTrim) rawBlocks.push(lTrim);
      });
    }
  } else {
    const rawChunks = cleaned.split(/\n\s*\n+/);
    rawChunks.forEach((chunk) => {
      const cTrim = chunk.trim();
      if (!cTrim) return;
      if (cTrim.startsWith('>')) {
        rawBlocks.push(cTrim);
      } else {
        cTrim.split(/\n+/).forEach((line) => {
          const lTrim = line.trim();
          if (lTrim) rawBlocks.push(lTrim);
        });
      }
    });
  }

  const result: string[] = [];
  let galleryImageCount = 0;

  for (const block of rawBlocks) {
    let trimmed = block.replace(/\\r\\n/g, ' ').replace(/\\r|\\n/g, ' ').trim();
    if (!trimmed) continue;

    const plainText = trimmed.replace(/<[^>]*>/g, '').replace(/\\r|\\n/g, '').trim();

    if (!plainText && !trimmed.includes('<img') && !trimmed.includes('![')) {
      continue;
    }

    if (
      plainText.includes('KEY HIGHLIGHTS') ||
      plainText.includes('એક નજરમાં') ||
      plainText.includes('एक नजर में') ||
      plainText.includes('AT A GLANCE') ||
      plainText.includes('📌') ||
      plainText.startsWith('----------------') ||
      plainText.startsWith('---')
    ) {
      continue;
    }

    if (trimmed.startsWith('>')) {
      if (result.length > 0 && result[result.length - 1].startsWith('>')) {
        result[result.length - 1] += `\n${trimmed}`;
        continue;
      }
    }

    const isGalleryImg = trimmed.match(/!\[Gallery Image \d+\]\((https?:\/\/[^\s)]+|\/uploads\/[^\s)]+|\/assets\/[^\s)]+)\)/i);
    if (isGalleryImg) {
      galleryImageCount++;
      if (galleryImageCount > 10) {
        continue;
      }
    }

    result.push(trimmed);
  }

  return result;
}

function sanitizeParagraphHtml(html: string, language?: string): string {
  if (!html) return '';

  let cleaned = normalizeArticleMarkdown(html)
    .replace(/^##\s*📌?\s*(એક નજરમાં|KEY HIGHLIGHTS|एक नजर में|AT A GLANCE).*?$/gmi, '')
    .replace(/----------------+/g, '')
    .replace(/\s*data-start="[^"]*"/gi, '')
    .replace(/\s*data-end="[^"]*"/gi, '')
    .replace(/\s*data-content-reference-start="[^"]*"/gi, '')
    .replace(/\s*data-content-reference-end="[^"]*"/gi, '')
    .replace(/\s*data-state="[^"]*"/gi, '')
    .replace(/\s*data-section-id="[^"]*"/gi, '')
    .replace(/<span[^>]*class="[^"]*selectionAnchor[^"]*"[^>]*><\/span>/gi, '')
    .replace(/<span[^>]*class="[^"]*contents[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '$1')
    .replace(/<span[^>]*><\/span>/gi, '');

  cleaned = upgradeMarkdownQuotes(cleaned);
  cleaned = convertMarkdownImagesToFigures(cleaned, 'Gujarat Post Image', true);

  // Convert plain URLs to styled clickable links if not inside HTML attributes
  cleaned = cleaned.replace(/(^|[\s>(])(https?:\/\/[^\s<"']+)/g, (match, prefix, url) => {
    return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#B3121B] font-bold underline hover:text-red-700 break-all">${url}</a>`;
  });

  cleaned = cleaned.replace(/<p\s+class="[^"]*"[^>]*>/gi, '<p>');

  return cleaned.trim();
}
function TranslatedInlineText({ text, language }: { text: string; language: Language }) {
  const translatedText = useAutoTranslate(text, language);
  return <>{translatedText}</>;
}

function buildStyledQuoteHtml(quoteText: string, citeText = ''): string {
  const finalQuote = quoteText
    .replace(/^["“”]+|["“”]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const finalCite = citeText.replace(/^[—-]\s*/, '').replace(/\s+/g, ' ').trim();

  if (!finalQuote) return '';

  return `\n<blockquote class="my-6 border-l-[3px] border-[#B3121B] pl-4 py-1 font-sans"><p class="text-lg md:text-[21px] font-bold text-neutral-900 dark:text-white leading-snug">"${finalQuote}"</p>${finalCite ? `<cite class="block mt-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400 not-italic">— ${finalCite}</cite>` : ''}</blockquote>\n`;
}

function upgradeMarkdownQuotes(rawHtml: string): string {
  return rawHtml
    .replace(/&gt;/gi, '>')
    .replace(/(?:^|\n)\s*>\s*["“”]?([\s\S]*?)["“”]?\s*>\s*[—-]\s*([^\n<]+)/g, (_match, quote, cite) => buildStyledQuoteHtml(quote, cite))
    .replace(/(?:^|\n)\s*>\s*["“”]?([^<\n]+?)["“”]?\s*[—-]\s*([^\n<]+)/g, (_match, quote, cite) => buildStyledQuoteHtml(quote, cite))
    .replace(/(?:^|\n)\s*>\s*["“”]?([^<\n]+?)["“”]?\s*$/gm, (_match, quote) => buildStyledQuoteHtml(quote));
}

function TranslatedParagraph({ rawHtml, language }: { rawHtml: string; language: Language }) {
  const translatedHtml = useAutoTranslateHtml(rawHtml, language);

  return (
    <div
      className="text-base leading-relaxed text-neutral-900 dark:text-neutral-100 prose dark:prose-invert max-w-none [&_b]:font-extrabold [&_strong]:font-extrabold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through [&_a]:text-[#B3121B] [&_a]:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#B3121B] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: translatedHtml }}
    />
  );
}

function uiLabel(language: Language, values: { en: string; gu: string; hi: string }): string {
  return normalizeDisplayText(language === 'gu' ? values.gu : language === 'hi' ? values.hi : values.en);
}

interface Props {
  article: Article;
  related: Article[];
  trending: Article[];
  articleUrl: string;
}

export default function NewsDetailClient({ article, related, trending, articleUrl }: Props) {
  const { language } = useApp();
  const router = useRouter();
  const { isApk } = useIsApk();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const [swipeFeedback, setSwipeFeedback] = useState<'left' | 'right' | null>(null);

  // Prefetch adjacent articles in APK mode for instant swipe transitions
  useEffect(() => {
    if (!isApk) return;
    const nextArt = related?.[0] || trending?.[0];
    const otherArt = related?.[1] || trending?.[1];
    if (nextArt?.slug) router.prefetch(`/news/${nextArt.slug}`);
    if (otherArt?.slug) router.prefetch(`/news/${otherArt.slug}`);
  }, [isApk, related, trending, router]);

  // Swipe right / left gesture to open other article (APK only)
  useEffect(() => {
    if (!isApk) return;

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('iframe') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.no-swipe')
      ) {
        return;
      }
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isSwiping.current = true;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping.current || touchStartX.current === null || touchStartY.current === null) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const diffX = endX - touchStartX.current;
      const diffY = endY - touchStartY.current;

      touchStartX.current = null;
      touchStartY.current = null;
      isSwiping.current = false;

      // Swipe threshold: moved at least 50px horizontally, and angle is predominantly horizontal
      if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
        if (diffX > 0) {
          // Swiped right (Left-to-right slice)
          const targetArticle = related?.[0] || trending?.[0];
          if (targetArticle?.slug) {
            setSwipeFeedback('right');
            router.push(`/news/${targetArticle.slug}`);
          }
        } else {
          // Swiped left (Right-to-left slice)
          const targetArticle = related?.[1] || related?.[0] || trending?.[0];
          if (targetArticle?.slug) {
            setSwipeFeedback('left');
            router.push(`/news/${targetArticle.slug}`);
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isApk, related, trending, router]);
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [adSlide, setAdSlide] = useState(0);
  const [relatedLimit, setRelatedLimit] = useState(8);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [sidebarMoreRecommended, setSidebarMoreRecommended] = useState(false);
  const isRecommendedExpanded = isContentExpanded || sidebarMoreRecommended;

  const [mostReadArticles, setMostReadArticles] = useState<typeof trending>(trending.slice(0, 5));

  // Mounted guard: prevents language-dependent SSR/client HTML mismatch
  useEffect(() => { setMounted(true); }, []);

  // Fetch hero-settings to get the same Most Read list as the home screen
  useEffect(() => {
    getHeroSettings().then((heroRes: any) => {
      const customMostRead: typeof trending = (heroRes?.mostReadArticles || []).filter(Boolean);
      if (customMostRead.length > 0) {
        setMostReadArticles(customMostRead);
      } else {
        setMostReadArticles(trending.slice(0, 5));
      }
    }).catch(() => {
      setMostReadArticles(trending.slice(0, 5));
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setAdSlide((prev) => (prev === 0 ? 1 : 0));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Scroll to top when opening a new article
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [article?.id, article?.slug]);

  // Increment view count in real browser when reader opens the article page (Deduplicated per session)
  useEffect(() => {
    if (article?.id) {
      const storageKey = `gp_viewed_art_${article.id}`;
      try {
        if (!sessionStorage.getItem(storageKey)) {
          sessionStorage.setItem(storageKey, '1');
          const endpoint = getBackendApiUrl(`/api/public/articles/${article.id}/view`);
          fetch(endpoint, { method: 'POST' }).catch(() => { });
        }
      } catch {
        const endpoint = getBackendApiUrl(`/api/public/articles/${article.id}/view`);
        fetch(endpoint, { method: 'POST' }).catch(() => { });
      }
    }
  }, [article?.id]);

  // 100% Reliable PDF Download & Open in New Tab Interceptor
  useEffect(() => {
    const handlePdfClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const pdfAnchor = target.closest('a[download], a[data-pdfv2="1"], a.gp-pdf-btn, a[href*=".pdf"]') as HTMLAnchorElement | null;
      if (!pdfAnchor) return;

      const rawHref = pdfAnchor.getAttribute('href');
      if (!rawHref || rawHref === '#') return;

      e.preventDefault();
      e.stopPropagation();

      let targetUrl = rawHref.trim();
      if (targetUrl.includes('download-pdf?url=')) {
        const paramMatch = targetUrl.match(/download-pdf\?url=([^"'\s&]+)/i);
        if (paramMatch && paramMatch[1]) {
          targetUrl = decodeURIComponent(paramMatch[1]);
        }
      }

      targetUrl = formatPdfDownloadUrl(targetUrl);

      // Immediately open PDF in a new window/tab page
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    };

    document.addEventListener('click', handlePdfClick, true);
    return () => {
      document.removeEventListener('click', handlePdfClick, true);
    };
  }, []);

  const slideImages = useMemo(() => {
    const images: string[] = [];
    if (article.image) images.push(sanitizeImageUrl(article.image));
    if ((article as any).featuredImage) {
      const feat = sanitizeImageUrl((article as any).featuredImage);
      if (!images.includes(feat)) images.push(feat);
    }

    // Extract secondary images from direct properties if present
    ['image2', 'image3', 'image4', 'image5', 'image6', 'image7', 'image8', 'image9', 'image10', 'galleryImage2', 'secondaryImage'].forEach((prop) => {
      const val = (article as any)[prop];
      if (val && typeof val === 'string' && val.trim()) {
        const clean = sanitizeImageUrl(val);
        if (!images.includes(clean)) images.push(clean);
      }
    });

    // Extract markdown image URLs ![...](url) from all article content strings
    const rawContent = `${article.content || ''}\n${(article as any).contentGu || ''}\n${(article as any).contentHi || ''}`;
    const matches = rawContent.matchAll(/!\[(?:Gallery Image \d+|.*?)\]\((https?:\/\/[^\s)]+|\/uploads\/[^\s)]+|\/assets\/[^\s)]+)\)/gi);
    for (const match of matches) {
      if (match[1]) {
        const clean = sanitizeImageUrl(match[1]);
        if (!images.includes(clean)) images.push(clean);
      }
    }

    const extraImages = (article as any).images || (article as any).gallery || (article as any).galleryImages || [];
    if (Array.isArray(extraImages)) {
      extraImages.forEach((img) => {
        if (img && typeof img === 'string' && img.trim()) {
          const clean = sanitizeImageUrl(img);
          if (!images.includes(clean)) images.push(clean);
        }
      });
    }

    const validImages = images.filter((img) => img && typeof img === 'string' && img.trim() !== '');
    const uniqueImages = Array.from(new Set(validImages));
    return uniqueImages.length > 0 ? uniqueImages : ['/assets/placeholder.jpg'];
  }, [article]);

  const handleNextImage = useCallback(() => {
    if (slideImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % slideImages.length);
  }, [slideImages.length]);

  const handlePrevImage = useCallback(() => {
    if (slideImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + slideImages.length) % slideImages.length);
  }, [slideImages.length]);

  useEffect(() => {
    if (slideImages.length <= 1) return;
    const currentSrc = slideImages[activeImageIndex];
    if (isMediaVideo(currentSrc)) return;
    const timer = setInterval(() => {
      handleNextImage();
    }, 4000);
    return () => clearInterval(timer);
  }, [handleNextImage, slideImages, activeImageIndex]);

  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    const handleSavedChange = () => {
      try {
        const stored = localStorage.getItem('gp-saved-articles');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setSavedIds(parsed);
          }
        }
      } catch (e) { }
    };

    try {
      const stored = localStorage.getItem('gp-saved-articles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedIds(parsed);
          if (parsed.includes(article.id)) {
            setSaved(true);
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    window.addEventListener('gp-saved-changed', handleSavedChange);
    return () => window.removeEventListener('gp-saved-changed', handleSavedChange);
  }, [article.id]);

  const handleToggleSave = () => {
    const nextSaved = !saved;
    setSaved(nextSaved);
    try {
      const stored = localStorage.getItem('gp-saved-articles');
      let parsed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) parsed = [];
      if (nextSaved) {
        if (!parsed.includes(article.id)) {
          parsed.push(article.id);
        }
      } else {
        parsed = parsed.filter((id: string) => id !== article.id);
      }
      localStorage.setItem('gp-saved-articles', JSON.stringify(parsed));
      window.dispatchEvent(new Event('gp-saved-changed'));
    } catch (e) {
      console.warn('Failed to save article:', e);
    }
  };

  const rawTitle = getArticleTitle(article, language);
  const rawExcerpt = getArticleExcerptHtml(article, language);
  const rawBody = getArticleContent(article, language);
  const title = useAutoTranslate(rawTitle, language);
  const excerpt = useAutoTranslateHtml(rawExcerpt, language);
  const body = useAutoTranslateHtml(rawBody, language);
  const category = normalizeDisplayText(getCategoryLabel(article, language));
  const authorName = getLocalized(language, { en: article.author.name, gu: article.author.nameGu, hi: article.author.nameHi });
  const authorAvatarImage = article.author?.image || (article.author as any)?.imageUrl || (article.author as any)?.avatar || '';
  const hasAuthorPhoto = Boolean(authorAvatarImage) && !/^(editor|સંપાદક|संपादक)$/i.test(authorName.trim());
  const authorDesignation = getLocalized(language, {
    en: article.author.designation,
    gu: article.author.designationGu,
    hi: article.author.designationHi,
  });
  const authorBio = getLocalized(language, { en: article.author.bio, gu: article.author.bioGu, hi: article.author.bioHi });
  const tags = (language === 'en' ? article.tags : language === 'hi' ? (article.tagsHi?.length ? article.tagsHi : article.tags) : (article.tagsGu?.length ? article.tagsGu : article.tags)) || article.tags || [];

  const readAlsoPool = useMemo(() => {
    const seen = new Set<string>([String(article?.id || '')]);
    const list: Article[] = [];
    const pool = [...(related || []), ...(trending || []), ...(mostReadArticles || [])];
    for (const item of pool) {
      if (!item) continue;
      const id = String(item.id || '');
      if (id && !seen.has(id)) {
        seen.add(id);
        list.push(item);
      }
    }
    return list.slice(0, 4);
  }, [article?.id, related, trending, mostReadArticles]);

  const isTrafficArticle = article.slug.includes('traffic-rules') || article.slug.includes('penalty-and-locations');

  const paragraphs = useMemo(() => body.split(/\n\n+/), [body]);

  const displayParagraphs = useMemo(() => {
    return parseArticleBodyBlocks(body, language, (article as any)?.pdfUrl || (article as any)?.pdf);
  }, [body, language, article]);

  const pdfDocumentUrl = useMemo(() => {
    let rawPdf = (article as any)?.pdfUrl || (article as any)?.pdf || '';
    if (!rawPdf && body) {
      const match =
        body.match(/gp-pdf-card[\s\S]*?href=["']([^"']+)["']/i) ||
        body.match(/data-pdf-url=["']([^"']+)["']/i) ||
        body.match(/href=["']([^"']+\.pdf(?:\?[^"']*)?|\/uploads\/[^"']+\.pdf(?:\?[^"']*)?)["']/i);
      if (match && match[1]) rawPdf = match[1];
    }
    return rawPdf;
  }, [article, body]);

  const hasPdfPages = useMemo(() => {
    if (!pdfDocumentUrl || !pdfDocumentUrl.trim()) return false;
    return Boolean(
      (article as any)?.showPdfPages ||
      body?.includes('data-show-pages="true"') ||
      body?.includes('gp-pdf-pages-viewer') ||
      (article as any)?.content?.includes('data-show-pages="true"') ||
      (article as any)?.contentGu?.includes('data-show-pages="true"') ||
      (article as any)?.contentHi?.includes('data-show-pages="true"') ||
      (article as any)?.content?.includes('gp-pdf-pages-viewer') ||
      (article as any)?.contentGu?.includes('gp-pdf-pages-viewer') ||
      (article as any)?.contentHi?.includes('gp-pdf-pages-viewer')
    );
  }, [article, body, pdfDocumentUrl]);

  const formattedArticleBodyHtml = useMemo(() => {
    if (!body) return '';

    let cleaned = normalizeArticleMarkdown(upgradeEmbedCards(body, language, (article as any)?.pdfUrl || (article as any)?.pdf, hasPdfPages))
      .replace(/^##\s*📌?\s*(એક નજરમાં|KEY HIGHLIGHTS|एक नजर में|AT A GLANCE).*?$/gmi, '')
      .replace(/----------------+/g, '')
      .replace(/\s*data-start="[^"]*"/gi, '')
      .replace(/\s*data-end="[^"]*"/gi, '')
      .replace(/\s*data-content-reference-start="[^"]*"/gi, '')
      .replace(/\s*data-content-reference-end="[^"]*"/gi, '')
      .replace(/\s*data-state="[^"]*"/gi, '')
      .replace(/\s*data-section-id="[^"]*"/gi, '')
      .replace(/<span[^>]*class="[^"]*selectionAnchor[^"]*"[^>]*><\/span>/gi, '')
      .replace(/<span[^>]*class="[^"]*contents[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '$1')
      .replace(/<span[^>]*><\/span>/gi, '');

    // Convert markdown blockquotes (> "Quote"\n> — Author) to styled HTML blockquotes
    cleaned = upgradeMarkdownQuotes(cleaned).replace(/(?:^|\n)(>[^\n]+(?:\n>[^\n]+)*)/g, (match, bqBlock) => {
      const lines = bqBlock.split('\n');
      const quoteLines = lines.filter((l: string) => l.startsWith('>') && !l.includes('> —') && !l.includes('> -'));
      const quoteText = quoteLines.map((l: string) => l.replace(/^>\s*"?/, '').replace(/"?$/, '')).join(' ').trim();
      const citeLine = lines.find((l: string) => l.includes('> —') || l.includes('> -'));
      const citeText = citeLine ? citeLine.replace(/^>\s*—\s*/, '').replace(/^>\s*-\s*/, '').trim() : '';
      const finalQuote = (quoteText || bqBlock.replace(/^>\s*"?/, '').replace(/"?$/, '')).replace(/^"/, '').replace(/"$/, '');

      return buildStyledQuoteHtml(finalQuote, citeText);
    });

    // Convert markdown images after translation as labels may no longer be English.
    cleaned = convertMarkdownImagesToFigures(cleaned, title);

    // Collapse multiple nested blockquotes
    cleaned = cleaned
      .replace(/(<blockquote[^>]*>\s*)+/gi, '<blockquote class="my-6 border-l-[3px] border-[#B3121B] pl-4 py-1 font-sans font-bold text-neutral-900 dark:text-white">')
      .replace(/(\s*<\/blockquote>)+/gi, '</blockquote>');

    // Auto-link plain URLs that are not inside href="..."
    cleaned = cleaned.replace(/(^|[\s>(])(https?:\/\/[^\s<"']+)/g, (match, prefix, url) => {
      return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#B3121B] font-bold underline hover:text-[#8E0E15] break-all">${url}</a>`;
    });

    // Append YouTube embed if set on article object and not already present in body HTML
    const ytUrl = (article as any).youtubeUrl || (article as any).youtube;
    if (ytUrl && ytUrl.trim() && !cleaned.includes('iframe') && !cleaned.includes('youtube.com/embed')) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = ytUrl.match(regExp);
      const embedUrl = match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
      if (embedUrl) {
        cleaned += `<div class="my-6 aspect-video w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-md"><iframe src="${embedUrl}" class="h-full w-full" allowfullscreen frameborder="0"></iframe></div>`;
      }
    }

    // Append Twitter card if set on article object and not already present in body HTML
    const twUrl = (article as any).twitterUrl || (article as any).twitter;
    if (twUrl && twUrl.trim() && !cleaned.includes('gp-x-card')) {
      cleaned += buildTwitterCardHtml(twUrl.trim(), language);
    }

    return cleaned;
  }, [body, title, language, article, hasPdfPages]);

  const gistPoints = useMemo(() => {
    const rawContent = getArticleContent(article, 'gu') || article.content || (article as any).contentGu || (article as any).contentHi || '';
    const points: string[] = [];

    const cleanStr = (s: string) => {
      return normalizeDisplayText(s)
        .replace(/<[^>]*>/g, '')
        .replace(/^[•*\-#\d\.\s📌]+/, '')
        .replace(/^[•*\-#\d\.\s📌]+/, '')
        .replace(/^[•*\-#\d\.\s]+/, '')
        .replace(/[📌📌]/gi, '')
        .replace(/#+/g, '')
        .replace(/\(KEY HIGHLIGHTS\)/gi, '')
        .replace(/એક નજરમાં/gi, '')
        .replace(/एक नजर में/gi, '')
        .replace(/AT A GLANCE/gi, '')
        .replace(/[*#]/g, '')
        .trim();
    };

    const lines = rawContent.split(/\r?\n/);
    let insideHighlights = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (
        trimmed.includes('KEY HIGHLIGHTS') ||
        normalizeDisplayText(trimmed).includes('એક નજરમાં') ||
        normalizeDisplayText(trimmed).includes('एक नजर में') ||
        trimmed.includes('AT A GLANCE') ||
        trimmed.includes('📌') ||
        trimmed.includes('📌')
      ) {
        insideHighlights = true;
        continue;
      }

      if (insideHighlights) {
        if (trimmed.startsWith('---') || trimmed.startsWith('***')) {
          if (points.length > 0) {
            insideHighlights = false;
            continue;
          }
        }
        const cleaned = cleanStr(trimmed);
        if (cleaned.length > 5 && !points.includes(cleaned)) {
          points.push(cleaned);
        }
      } else if (
        trimmed.startsWith('•') ||
        trimmed.startsWith('•') ||
        trimmed.startsWith('-') ||
        trimmed.startsWith('*')
      ) {
        const cleaned = cleanStr(trimmed);
        if (cleaned.length > 8 && !points.includes(cleaned)) {
          points.push(cleaned);
        }
      }
    }

    if (points.length === 0) {
      const cleanTitle = cleanStr(rawTitle);
      const cleanExcerpt = cleanStr(rawExcerpt);

      if (cleanTitle) points.push(cleanTitle);
      if (cleanExcerpt && cleanExcerpt !== cleanTitle) points.push(cleanExcerpt);
    }

    return points.slice(0, 10);
  }, [rawTitle, rawExcerpt, article]);

  const trendingTopics = useMemo(() => {
    if (language === 'gu') {
      return ['ચૂંટણી 2027', 'વરસાદ', 'સોના-ચાંદી', 'ક્રિકેટ', 'મેટ્રો', 'સેમિકન્ડક્ટર', 'ડાયમંડ ઉદ્યોગ', 'ટ્રાફિક'];
    } else if (language === 'hi') {
      return ['चुनाव 2027', 'बारिश', 'सोना-चांदी', 'क्रिकेट', 'मेट्रो', 'सेमीकंडक्टर', 'हीरा उद्योग', 'यातायात'];
    } else {
      return ['Election 2027', 'Rain', 'Gold-Silver', 'Cricket', 'Metro', 'Semiconductor', 'Diamond Industry', 'Traffic'];
    }
  }, [language]);

  // Dynamically calculate sidebar item limits based on main article content length
  const recommendedLimit = useMemo(() => {
    const textLength = (article.content || '').length + ((article as any).contentGu || '').length + (article.excerpt || '').length;
    if (textLength < 350) return 2;
    if (textLength < 800) return 3;
    return 5;
  }, [article]);

  const trendingLimit = useMemo(() => {
    if (!isContentExpanded) return 3;
    const textLength = (article.content || '').length + ((article as any).contentGu || '').length + (article.excerpt || '').length;
    if (textLength < 350) return 3;
    if (textLength < 800) return 4;
    return 5;
  }, [article, isContentExpanded]);

  const streamList = useMemo(() => {
    const mainId = String(article.id);
    return [...related, ...trending]
      .filter((item, index, self) => String(item.id) !== mainId && self.findIndex(t => String(t.id) === String(item.id)) === index)
      .slice(0, 8);
  }, [related, trending, article.id]);

  const sidebarRecommendedPool = useMemo(() => {
    const mainId = String(article.id);
    const excludeIds = new Set([mainId, ...streamList.map(a => String(a.id))]);

    // Priority State & National top headline categories
    const priorityCatKeywords = ['gujarat', 'india', 'world', 'politics', 'business', 'ગુજરાત', 'ભારત', 'વિશ્વ', 'રાજનીતિ', 'વેપાર'];

    // Gather candidate articles excluding main article & all stream articles
    const pool = [...trending, ...related, ...mostReadArticles].filter(
      (item, index, self) => !excludeIds.has(String(item.id)) && self.findIndex(t => String(t.id) === String(item.id)) === index
    );

    // Filter for State & National top headlines first
    const stateNationalCandidates = pool.filter(cand => {
      const cat = (cand.category || '').toLowerCase().trim();
      return priorityCatKeywords.some(kw => cat.includes(kw) || kw.includes(cat));
    });

    // Combine priority State & National candidates first, filled with other articles from pool
    const poolToUse = [...stateNationalCandidates, ...pool.filter(cand => !stateNationalCandidates.includes(cand))];

    // Group by category to favor category variety in sidebar
    const byCategory = new Map<string, Article>();
    for (const cand of poolToUse) {
      const cat = (cand.category || '').toLowerCase().trim();
      if (!byCategory.has(cat)) {
        byCategory.set(cat, cand);
      }
    }

    const distinctCatArts = Array.from(byCategory.values());
    const combinedPool = [...distinctCatArts, ...poolToUse.filter(a => !distinctCatArts.includes(a))];
    return combinedPool.slice(0, 10);
  }, [article.id, streamList, trending, related, mostReadArticles]);

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(articleUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const toggleAudio = () => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(`${title}. ${excerpt.replace(/<[^>]*>/g, '')}`);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN';
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const shareLinks = [
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`,
      icon: (className: string) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
      style: 'bg-[#1877f2]/8 text-[#1877f2] border border-[#1877f2]/10 hover:bg-[#1877f2]/15'
    },
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${articleUrl}`)}`,
      icon: (className: string) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>,
      style: 'bg-[#25d366]/8 text-[#25d366] border border-[#25d366]/10 hover:bg-[#25d366]/15'
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(articleUrl)}`,
      icon: (className: string) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
      style: 'bg-black/[0.03] dark:bg-white/[0.03] text-foreground border border-foreground/10 hover:bg-black/[0.06] dark:hover:bg-white/[0.06]'
    },
    {
      label: 'Google News',
      href: `https://news.google.com/search?q=Gujarat+Post`,
      icon: (className: string) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 10h-4v-2h4v2zm0-4h-4V6h4v2zm-5 8H5v-2h8v2zm5 0h-4v-2h4v2zM12 6H5v6h7V6z" /></svg>,
      style: 'bg-[#4285f4]/8 text-[#4285f4] border border-[#4285f4]/10 hover:bg-[#4285f4]/15'
    },
  ];

  // Helper to generate between 10 and 20 unique tags for a stream article
  const getStreamTags = (streamArticle: any) => {
    let ownTags: string[] = [];
    if (language === 'gu') {
      ownTags = streamArticle.tagsGu || streamArticle.tags || [];
    } else if (language === 'hi') {
      ownTags = streamArticle.tagsHi || streamArticle.tags || [];
    } else {
      ownTags = streamArticle.tags || [];
    }

    ownTags = ownTags.filter((t: string) => t && t.trim() !== '');

    const otherTagsSet = new Set<string>();
    const allArticles = [article, ...related, ...trending];
    allArticles.forEach(art => {
      const tags = (language === 'gu' ? art.tagsGu : language === 'hi' ? art.tagsHi : art.tags) || [];
      tags.forEach((t: string) => {
        if (t && t.trim() !== '') {
          otherTagsSet.add(t.trim());
        }
      });
    });

    const fallbackTags = language === 'gu'
      ? ['સમાચાર', 'ગુજરાત', 'લાઇવ', 'અમદાવાદ', 'બ્રેકિંગ ન્યૂઝ', 'ક્રિકેટ', 'સ્પોર્ટ્સ', 'બોલિવૂડ', 'એન્ટરટેઇનમેન્ટ', 'રાજકારણ', 'બિઝનેસ', 'ટેકનોલોજી', 'વેધર', 'રાજકોટ', 'સુરત', 'વડોદરા', 'લાઇફસ્ટાઇલ', 'રાષ્ટ્રીય', 'આંતરરાષ્ટ્રીય', 'વિશેષ', 'મનોરંજન', 'રમતગમત']
      : language === 'hi'
        ? ['समाचार', 'गुजरात', 'लाइव', 'अहमदाबाद', 'ब्रेकिंग न्यूज़', 'क्रिकेट', 'स्पोर्ट्स', 'बॉलीवुड', 'मनोरंजन', 'राजनीति', 'बिजनेस', 'टेक्नोलॉजी', 'मौसम', 'राजकोट', 'सूरत', 'वडोदरा', 'लाइफस्टाइल', 'राष्ट्रीय', 'अंतरराष्ट्रीय', 'विशेष', 'खेल']
        : ['News', 'Gujarat', 'Live', 'Ahmedabad', 'Breaking News', 'Cricket', 'Sports', 'Bollywood', 'Entertainment', 'Politics', 'Business', 'Technology', 'Weather', 'Rajkot', 'Surat', 'Vadodara', 'Lifestyle', 'National', 'International', 'Special', 'Entertainment', 'Sports'];

    fallbackTags.forEach(t => otherTagsSet.add(t));

    const finalTagsSet = new Set<string>(ownTags);
    const otherTagsArray = Array.from(otherTagsSet);
    for (const tag of otherTagsArray) {
      if (finalTagsSet.size >= 15) break; // target 15 tags
      finalTagsSet.add(tag);
    }

    const finalTags = Array.from(finalTagsSet).slice(0, 20);

    // Ensure we meet the absolute minimum of 10 tags
    while (finalTags.length < 10) {
      const nextFallback = fallbackTags.find(f => !finalTags.includes(f));
      if (nextFallback) {
        finalTags.push(nextFallback);
      } else {
        break;
      }
    }

    return finalTags.slice(0, 20).map((tag) => normalizeDisplayText(tag));
  };

  const getLocationDisplay = (loc: string | null | undefined, lang: Language) => {
    const cleanLoc = (loc || '').trim();
    const map: Record<string, { en: string; gu: string; hi: string }> = {
      'ahmedabad': { en: 'Ahmedabad', gu: 'અમદાવાદ', hi: 'अहमदाबाद' },
      'gandhinagar': { en: 'Gandhinagar', gu: 'ગાંધીનગર', hi: 'ગાંધીનગર' },
      'surat': { en: 'Surat', gu: 'સુરત', hi: 'સુરત' },
      'vadodara': { en: 'Vadodara', gu: 'વડોદરા', hi: 'વડોદરા' },
      'rajkot': { en: 'Rajkot', gu: 'રાજકોટ', hi: 'રાજકોટ' },
      'bhavnagar': { en: 'Bhavnagar', gu: 'ભાવનગર', hi: 'ભાવનગર' },
      'jamnagar': { en: 'Jamnagar', gu: 'જામનગર', hi: 'જામનગર' },
      'junagadh': { en: 'Junagadh', gu: 'જૂનાગઢ', hi: 'જૂનાગઢ' },
      'kutch': { en: 'Kutch', gu: 'કચ્છ', hi: 'કચ્છ' },
      'anand': { en: 'Anand', gu: 'આણંદ', hi: 'આણંદ' },
      'gujarat': { en: 'Gujarat', gu: 'ગુજરાત', hi: 'ગુજરાત' },
      'national': { en: 'National', gu: 'દેશ', hi: 'દેશ' },
    };
    const key = cleanLoc.toLowerCase();
    if (map[key]) {
      return uiLabel(lang, map[key]);
    }
    return cleanLoc || uiLabel(lang, { en: 'Ahmedabad', gu: 'અમદાવાદ', hi: 'અહમદાબાદ' });
  };

  const rawLocationDisplay = getLocationDisplay(article.location, language);
  const cityLocationLabel = (rawLocationDisplay.toLowerCase() === category.toLowerCase())
    ? uiLabel(language, { en: 'Ahmedabad', gu: 'અમદાવાદ', hi: 'અહમદાબાદ' })
    : rawLocationDisplay;

  return (
    <>
      <ReadingProgressBar />
      <div className="wrap w-full max-w-[1240px] mx-auto px-3 sm:px-5 lg:px-6 py-2 overflow-x-clip">
        <div key={`${article.id}-${language}`} className="article-grid" suppressHydrationWarning>
          <article suppressHydrationWarning>
            <nav className="breadcrumb select-none flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-neutral-500 font-medium">
              <Link href="/" className="hover:text-[var(--red)] transition-colors">
                {uiLabel(language, { en: 'Home', gu: 'હોમ', hi: 'होम' })}
              </Link>
              <span>/</span>
              <Link href={`/category/${article.category.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-[var(--red)] transition-colors">
                {category}
              </Link>
              <span>/</span>
              <span>{cityLocationLabel}</span>
              <span>/</span>
              <span className="text-neutral-700 dark:text-neutral-300 font-normal">
                <AutoArticleBreadcrumbTitle article={article} />
              </span>
            </nav>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="art-kick">
                <span className="bar"></span>
                <span>{category} · {cityLocationLabel}</span>
              </div>
              {article.isBreaking && <span className="live-badge rounded bg-accent px-2 py-1 text-xs font-black text-white ml-2">BREAKING</span>}
            </div>

            <h1 className="article-title">{title}</h1>
            <div
              className="article-sub [&_b]:font-extrabold [&_strong]:font-extrabold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: excerpt }}
            />

            <div className="byline select-none">
              <div className="flex items-center gap-[11px]">
                <Link href={`/author/${article.author.id}`} className="shrink-0 w-[38px] h-[38px] rounded-full bg-[var(--red)] text-white flex items-center justify-center font-bold text-sm hover:opacity-90 transition-opacity overflow-hidden border border-[#B3121B]/20 shadow-xs">
                  {hasAuthorPhoto ? (
                    <img src={authorAvatarImage} alt={authorName} className="w-full h-full object-cover" />
                  ) : (
                    <span>GP</span>
                  )}
                </Link>
                <div>
                  <div className="text-[13.5px]">
                    <span className="text-[var(--ink-2)]">{uiLabel(language, { en: 'Author:', gu: 'લેખક:', hi: 'लेखक:' })} </span>
                    <Link href={`/author/${article.author.id}`} className="font-bold text-[var(--red)] hover:underline">
                      {authorName}
                    </Link>
                  </div>

                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[12.5px] text-[var(--ink-2)]">
                  ⏱ {language === 'gu' ? `વાંચન સમય: ${article.readingTime} મિનિટ` : language === 'hi' ? `पठन समय: ${article.readingTime} मिनट` : `Read time: ${article.readingTime} mins`}
                </span>
                {/* Google News Follow Badge */}
                <a
                  href="https://news.google.com/search?q=gujaratpost&hl=gu-IN&gl=IN&ceid=IN%3Agu"
                  target="_blank"
                  rel="noreferrer"
                  title="Follow Gujarat Post on Google News"
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-md hover:border-[#4285F4]/50 transition-all duration-200 hover:scale-[1.03] active:scale-95 select-none"
                  style={{ textDecoration: 'none' }}
                >
                  {/* GN coloured icon */}
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
                    <rect x="2" y="2" width="8.5" height="20" rx="1.5" fill="#4285F4" />
                    <rect x="12.5" y="3" width="9.5" height="3.8" rx="1" fill="#EA4335" />
                    <rect x="12.5" y="9.1" width="9.5" height="3.8" rx="1" fill="#FBBC05" />
                    <rect x="12.5" y="15.2" width="9.5" height="6.5" rx="1" fill="#34A853" />
                  </svg>
                  <span className="flex flex-col leading-tight">
                    <span className="text-[8px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">FOLLOW ON</span>
                    <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-100 tracking-tight" style={{ fontFamily: 'Google Sans, sans-serif' }}>Google News</span>
                  </span>
                </a>
              </div>
            </div>

            {/* Gist: એક નજરમાં */}
            {gistPoints.length > 0 && (
              <div className="my-2 rounded-r-xl border-l-4 border-[#B3121B] bg-neutral-50 dark:bg-neutral-900/60 p-4 shadow-sm">
                <div className="flex items-center gap-2 font-black text-[#B3121B] text-base mb-3 select-none">
                  <span className="text-[#B3121B] font-bold text-sm">♦</span>
                  <span>{uiLabel(language, { en: 'At a Glance', gu: 'એક નજરમાં', hi: 'एक नजर में' })}</span>
                </div>
                <ul className="space-y-2.5 text-[15px] sm:text-[15.5px] font-semibold text-neutral-800 dark:text-neutral-200">
                  {gistPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2.5">
                      <span className="text-[#B3121B] font-bold mt-0.5 shrink-0 select-none">•</span>
                      <span className="leading-relaxed">
                        <TranslatedInlineText text={point} language={language} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <figure className="article-fig mb-3">
              <div className="imgwrap relative aspect-[16/9] overflow-hidden bg-black/5 dark:bg-black/40 rounded-lg shadow-sm group">
                {/* Indicator Badge (only if multiple images exist) */}
                {slideImages.length > 1 && (
                  <div className="absolute top-3.5 left-3.5 z-20 bg-black/75 backdrop-blur-sm text-white font-black text-xs px-2.5 py-1 rounded select-none shadow">
                    {language === 'gu'
                      ? `${toGu(activeImageIndex + 1)} / ${toGu(slideImages.length)}`
                      : `${activeImageIndex + 1} / ${slideImages.length}`}
                  </div>
                )}

                {/* Slider Prev / Next Arrows */}
                {slideImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      aria-label="Previous slide"
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      aria-label="Next slide"
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {slideImages.map((src, index) => {
                  const isVideo = isMediaVideo(src);
                  const isActive = index === activeImageIndex;
                  return (
                    <div
                      key={src + index}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                    >
                      {isVideo ? (
                        <DetailSlideVideo
                          src={src}
                          isActive={isActive}
                          onEnded={handleNextImage}
                        />
                      ) : (
                        <Image
                          src={sanitizeImageUrl(src) || '/assets/placeholder.jpg'}
                          alt={`${article.title} slide ${index + 1}`}
                          fill
                          unoptimized={true}
                          sizes="(max-width: 1024px) 100vw, 66vw"
                          className="object-cover"
                          loading={index === 0 ? 'eager' : 'lazy'}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src && !target.src.includes('placehold.co')) {
                              target.src = 'https://placehold.co/800x500/e2e8f0/94a3b8?text=Gujarat+Post';
                            }
                          }}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Download AVIF Image Button */}
                {slideImages[activeImageIndex] && !isMediaVideo(slideImages[activeImageIndex]) && (
                  <a
                    href={formatImageDownloadUrl(slideImages[activeImageIndex], `${article.slug || 'gujarat-post'}-${activeImageIndex + 1}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`${article.slug || 'gujarat-post'}-${activeImageIndex + 1}.avif`}
                    title="Download image in AVIF format (.avif)"
                    className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/75 hover:bg-black text-white text-xs font-bold backdrop-blur-sm border border-white/20 transition-all opacity-90 hover:opacity-100 shadow-md active:scale-95 group/dl"
                    suppressHydrationWarning
                  >
                    <Download className="w-3.5 h-3.5 text-white/90 group-hover/dl:text-white" />
                    <span>{language === 'gu' ? 'AVIF ડાઉનલોડ' : language === 'hi' ? 'AVIF डाउनलोड' : 'Download AVIF'}</span>
                  </a>
                )}
              </div>
              <figcaption>
                <span>
                  {isTrafficArticle && language === 'gu'
                    ? 'અમદાવાદના SG હાઇવે પર નવી ટ્રાફિક સિગ્નલ પ્રણાલી.'
                    : isTrafficArticle && language === 'hi'
                      ? 'अहमदाबाद के एसजी हाईवे पर नई ट्रैफिक संकेत प्रणाली।'
                      : isTrafficArticle && language === 'hi'
                        ? 'अहमदाबाद के एसजी हाईवे पर नई ट्रैफिक संकेत प्रणाली।'
                        : isTrafficArticle
                          ? 'New traffic signal system on SG Highway in Ahmedabad.'
                          : title}
                </span>
                <span style={{ whiteSpace: 'nowrap' }}>
                  {uiLabel(language, { en: 'Photo: Gujarat Post', gu: 'તસવીર: ગુજરાત પોસ્ટ', hi: 'तस्वीर: ગુજરાત પોસ્ટ' })}
                </span>
              </figcaption>
            </figure>

            <ArticleShareAudioBar
              title={title}
              articleUrl={articleUrl}
              language={language}
              copied={copied}
              copyUrl={copyUrl}
              saved={saved}
              handleToggleSave={handleToggleSave}
              speaking={speaking}
              toggleAudio={toggleAudio}
              isApk={isApk}
              uiLabel={uiLabel}
            />

            {/* Article Main Content Body — with "વધુ વાંચો" (Read More) expand button */}
            {(() => {
              const SPLIT_AT = 2;
              const splitHtml = (html: string, atPara: number): [string, string] => {
                if (!html) return ['', ''];
                let count = 0;
                let idx = -1;
                let search = 0;
                while (count < atPara) {
                  const next = html.indexOf('</p>', search);
                  if (next === -1) break;
                  count++;
                  idx = next + 4;
                  search = idx;
                }
                if (idx === -1 || count < atPara) return [html, ''];
                return [html.slice(0, idx), html.slice(idx)];
              };
              const [topHtml, bottomHtml] = splitHtml(formattedArticleBodyHtml, SPLIT_AT);

              if (!bottomHtml) {
                return (
                  <div>
                    <ArticleContentBody html={formattedArticleBodyHtml} />

                    {/* Full PDF Page-by-Page Document Viewer */}
                    {hasPdfPages && pdfDocumentUrl && (
                      <ArticlePdfPagesViewer
                        pdfUrl={pdfDocumentUrl}
                        language={language}
                        title={language === 'gu' ? 'સંદર્ભિત સત્તાવાર PDF દસ્તાવેજ' : language === 'hi' ? 'संलग्न आधिकारिक पीडीएफ दस्तावेज़' : 'Attached Official Document (PDF)'}
                      />
                    )}

                    {/* Horizontal Ad Banner placed directly after article description */}
                    <AdSectionBanner section="ARTICLE_BOTTOM" className="my-6" />

                    {/* Aa Pan Vacho (Also Read) directly inside article after 2nd Ad */}
                    {readAlsoPool.length > 0 && (
                      <AlsoPanVacho
                        articles={readAlsoPool}
                        language={language}
                        getCardThumbnail={getCardThumbnail}
                        DEMO_THUMBNAILS={DEMO_THUMBNAILS}
                        uiLabel={uiLabel}
                      />
                    )}

                    {/* Topics Tags directly inside article after Aa Pan Vacho */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mt-5 mb-4 select-none">
                        <span className="topics-title font-extrabold text-neutral-900 dark:text-white mr-2 text-[14.5px] tracking-wide uppercase border-b-2 border-[#B3121B] pb-0.5">
                          {uiLabel(language, { en: 'Topics:', gu: 'ટોપિક્સ:', hi: 'વિષય:' })}
                        </span>
                        {tags.map((tag, tIdx) => (
                          <Link
                            key={tIdx}
                            href={getTopicHref(tag)}
                            className="topic-pill cursor-pointer bg-neutral-100 dark:bg-neutral-800/80 hover:bg-[#B3121B] dark:hover:bg-[#B3121B] text-neutral-800 dark:text-neutral-200 hover:text-white dark:hover:text-white rounded-full px-4 py-1.5 text-xs font-bold border border-neutral-300 dark:border-neutral-700 hover:border-[#B3121B] dark:hover:border-[#B3121B] shadow-sm transition-all duration-200"
                          >
                            {normalizeDisplayText(tag)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div className="relative">
                  <ArticleContentBody html={topHtml} />

                  {/* IN_ARTICLE Ad Banner displayed inside description */}
                  <AdSectionBanner section="IN_ARTICLE" className="my-6" />

                  {!isContentExpanded ? (
                    <div className="relative pt-2 pb-2">
                      {/* Smooth gradient fade overlay */}
                      <div className="absolute -top-28 inset-x-0 h-28 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#0d1117] dark:via-[#0d1117]/90 dark:to-transparent pointer-events-none" />

                      {/* Vadhu Vacho (Read More) Expand Button */}
                      <div className="flex flex-col items-center justify-center relative z-20 pt-2 pb-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsContentExpanded(true);
                            setSidebarMoreRecommended(true);
                          }}
                          className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#B3121B] hover:bg-red-700 text-white shadow-xl shadow-red-900/30 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer select-none border-2 border-white/20"
                        >
                          <span className="text-base font-black tracking-wide leading-none">
                            {uiLabel(language, { en: 'Read More', gu: 'વધુ વાંચો', hi: 'और पढ़ें' })}
                          </span>
                          <ChevronDown className="w-4.5 h-4.5 transition-transform duration-300 group-hover:translate-y-0.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 transition-all duration-500 ease-in-out">
                      <ArticleContentBody html={bottomHtml} />

                      {/* Full PDF Page-by-Page Document Viewer */}
                      {hasPdfPages && pdfDocumentUrl && (
                        <ArticlePdfPagesViewer
                          pdfUrl={pdfDocumentUrl}
                          language={language}
                          title={language === 'gu' ? 'સંદર્ભિત સત્તાવાર PDF દસ્તાવેજ' : language === 'hi' ? 'संलग्न आधिकारिक पीडीएफ दस्तावेज़' : 'Attached Official Document (PDF)'}
                        />
                      )}

                      {/* Horizontal Ad Banner placed directly after full article description */}
                      <AdSectionBanner section="ARTICLE_BOTTOM" className="my-6" />

                      {/* Aa Pan Vacho (Also Read) directly inside article after 2nd Ad */}
                      {readAlsoPool.length > 0 && (
                        <AlsoPanVacho
                          articles={readAlsoPool}
                          language={language}
                          getCardThumbnail={getCardThumbnail}
                          DEMO_THUMBNAILS={DEMO_THUMBNAILS}
                          uiLabel={uiLabel}
                        />
                      )}

                      {/* Topics Tags directly inside article after Aa Pan Vacho */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-5 mb-4 select-none">
                          <span className="topics-title font-extrabold text-neutral-900 dark:text-white mr-2 text-[14.5px] tracking-wide uppercase border-b-2 border-[#B3121B] pb-0.5">
                            {uiLabel(language, { en: 'Topics:', gu: 'ટોપિક્સ:', hi: 'વિષય:' })}
                          </span>
                          {tags.map((tag, tIdx) => (
                            <Link
                              key={tIdx}
                              href={getTopicHref(tag)}
                              className="topic-pill cursor-pointer bg-neutral-100 dark:bg-neutral-800/80 hover:bg-[#B3121B] dark:hover:bg-[#B3121B] text-neutral-800 dark:text-neutral-200 hover:text-white dark:hover:text-white rounded-full px-4 py-1.5 text-xs font-bold border border-neutral-300 dark:border-neutral-700 hover:border-[#B3121B] dark:hover:border-[#B3121B] shadow-sm transition-all duration-200"
                            >
                              {normalizeDisplayText(tag)}
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Collapse / Read Less Button */}
                      <div className="flex justify-center pt-6 pb-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsContentExpanded(false);
                            setSidebarMoreRecommended(false);
                            window.scrollTo({ top: 380, behavior: 'smooth' });
                          }}
                          className="group inline-flex items-center gap-2 px-7 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-all duration-200 cursor-pointer select-none shadow-sm active:scale-95"
                        >
                          <span className="text-base md:text-lg font-black tracking-wide leading-none">
                            {uiLabel(language, { en: 'Read Less', gu: 'ટૂંકમાં વાંચો', hi: 'कम पढ़ें' })}
                          </span>
                          <ChevronUp className="w-4.5 h-4.5 transition-transform duration-300 group-hover:-translate-y-0.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          </article>

          <aside className="side select-none w-full max-w-[340px] min-w-0" style={{ alignSelf: 'stretch' }} suppressHydrationWarning>
            <div className="side-sticky sticky top-20 transition-all duration-300">
              {/* Most Read widget */}
              <div className="mostread">
                <div className="wtitle">
                  <span className="d"></span>
                  <span>{uiLabel(language, { en: 'Most Read', gu: 'સૌથી વધુ વંચાયેલા', hi: 'सबसे ज्यादा पढ़े गए' })}</span>
                </div>
                <div className="space-y-0 mt-3">
                  {mostReadArticles.slice(0, trendingLimit).map((item, index) => {
                    const rankNum = String(index + 1);

                    return (
                      <Link key={item.id} href={`/news/${item.slug}`} className="s-rank hover:opacity-85 transition-opacity">
                        <span className="n">{rankNum}</span>
                        <h3><AutoArticleTitle article={item} language={language} /></h3>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Advertisement */}
              <Advertisement position="sidebar" />

              {/* Recommended stories */}
              <div>
                <div className="wtitle">
                  <span className="d"></span>
                  <span>{uiLabel(language, { en: 'Recommended Stories', gu: 'તમારા માટે ભલામણ', hi: 'आपके लिए अनुशंसित' })}</span>
                </div>

                {/* Mobile view (< md): Hero Section style list */}
                <div className="flex flex-col divide-y divide-border/60 md:hidden mt-3">
                  {sidebarRecommendedPool.slice(0, isRecommendedExpanded ? 8 : 2).map((item, index) => (
                    <MobileHeroArticleCard
                      key={`rec-mob-${item.id || index}`}
                      article={item}
                      language={language}
                      index={index}
                    />
                  ))}
                </div>

                {/* Desktop view (>= md): UNTOUCHED */}
                <div className="hidden md:block space-y-0 mt-3 transition-all duration-300">
                  {sidebarRecommendedPool.slice(0, isRecommendedExpanded ? 8 : 2).map((item, index) => {
                    const itemCategory = normalizeDisplayText(getCategoryLabel(item, language));
                    return (
                      <Link
                        key={item.id || index}
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

                {!isRecommendedExpanded && sidebarRecommendedPool.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setSidebarMoreRecommended(true)}
                    className="mt-3 w-full py-2 px-3 text-center text-[12.5px] font-bold text-[#B3121B] hover:text-white hover:bg-[#B3121B] rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none shadow-xs active:scale-95"
                  >
                    <span>{uiLabel(language, { en: 'View More Stories', gu: 'વધુ સમાચાર જુઓ', hi: 'और खबरें देखें' })}</span>
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}
              </div>

              {/* WhatsApp Channel widget */}
              <div className="relative w-full overflow-hidden rounded-2xl border-2 border-emerald-400/80 dark:border-emerald-600/60 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-5 shadow-[0_8px_24px_rgba(37,211,102,0.12)] hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-[0_8px_28px_rgba(37,211,102,0.2)] transition-all border-t-[3px] border-t-[#25D366]">
                {/* Ambient decorative WhatsApp glow */}
                <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-[#25D366]/10 blur-2xl" />

                <div className="relative z-10 flex items-center gap-3">
                  {/* WhatsApp branded icon badge */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-md shadow-emerald-500/25 ring-4 ring-[#25D366]/10">
                    <SocialIcon platform="whatsapp" className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-[16px] text-slate-900 dark:text-white tracking-tight leading-snug">
                        {language === 'gu' ? 'WhatsApp ચેનલ' : language === 'hi' ? 'व्हाट्सएप चैनल' : 'WhatsApp Channel'}
                      </h3>
                      <CheckCircle2 className="h-4 w-4 text-[#25D366] shrink-0 fill-[#25D366] text-white" />
                    </div>
                    <span className="text-[13px] md:text-[11.5px] font-bold text-emerald-700 dark:text-emerald-400">
                      {language === 'gu' ? 'સત્તાવાર ન્યૂઝ અપડેટ્સ' : language === 'hi' ? 'આधिकारिक સમાચાર અપડેટ' : 'Official News Updates'}
                    </span>
                  </div>
                </div>

                <p className="relative z-10 text-[14px] md:text-[12.5px] text-slate-600 dark:text-slate-300 leading-relaxed my-3.5 font-medium">
                  {language === 'gu'
                    ? 'તમારા શહેરના તાજા અને મહત્વના સમાચાર સૌથી પહેલા સીધા તમારા ફોન પર મેળવો.'
                    : language === 'hi'
                      ? 'अपने शहर के ताजा और महत्वपूर्ण समाचार सबसे पहले सीधे अपने फोन पर पाएं।'
                      : 'Get breaking news and vital updates of your city first, directly on your phone.'}
                </p>

                <a
                  href="https://api.whatsapp.com/send/?phone=919909907237&text&type=phone_number&app_absent=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#25D366] via-[#1fad53] to-[#128C7E] hover:from-[#20bd5a] hover:to-[#0f7a6d] text-white font-black text-[15px] md:text-[13.5px] py-3 md:py-2.5 px-4 rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] transition-all cursor-pointer group/btn select-none"
                >
                  <SocialIcon platform="whatsapp" className="h-4.5 w-4.5 text-white shrink-0" />
                  <span>{language === 'gu' ? 'ચેનલ ફોલો કરો' : language === 'hi' ? 'चैनल फॉलो करें' : 'Follow Channel'}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1 shrink-0" />
                </a>
              </div>

              {/* Trending Topics Tags */}
              {/* <div className="mt-6">
                <div className="flex items-center gap-2 border-b-2 border-[#B3121B] pb-2.5 mb-3.5">
                  <span className="bg-[#B3121B] text-white font-black text-[12px] px-2.5 py-0.5 rounded-sm select-none tracking-wide uppercase">
                    Trending Topics
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingTopics.slice(0, 8).map((tag, index) => (
                    <Link
                      key={index}
                      href={`/search?q=${encodeURIComponent(tag)}`}
                      className="group inline-flex items-center gap-0.5 border-2 border-[#B3121B]/30 text-[12px] font-black px-3 py-1.5 rounded-full text-foreground hover:border-[#B3121B] hover:bg-[#B3121B] hover:text-white transition-all bg-card cursor-pointer select-none shadow-sm hover:shadow-md"
                    >
                      <span className="text-[#B3121B] font-black group-hover:text-white transition-colors">#</span>{tag}
                    </Link>
                  ))}
                </div>
              </div> */}
            </div>
          </aside>
        </div>

        <RelatedStoriesSection
          article={article}
          related={related}
          language={language}
          savedIds={savedIds}
          relatedLimit={relatedLimit}
          setRelatedLimit={setRelatedLimit}
          getCardThumbnail={getCardThumbnail}
          DEMO_THUMBNAILS={DEMO_THUMBNAILS}
          uiLabel={uiLabel}
        />

        <ArticleInfiniteStream
          mounted={mounted}
          streamList={streamList}
          article={article}
          language={language}
          mostReadArticles={mostReadArticles}
          trending={trending}
          related={related}
          savedIds={savedIds}
          getCardThumbnail={getCardThumbnail}
          DEMO_THUMBNAILS={DEMO_THUMBNAILS}
          uiLabel={uiLabel}
          getArticleContent={getArticleContent}
          parseArticleBodyBlocks={parseArticleBodyBlocks}
          sanitizeParagraphHtml={sanitizeParagraphHtml}
          getStreamTags={getStreamTags}
          getTopicHref={getTopicHref}
          TranslatedInlineText={TranslatedInlineText}
          TranslatedParagraph={TranslatedParagraph}
          sidebarRecommendedPool={sidebarRecommendedPool}
        /></div>
      <div style={{ height: '50px' }} />
      {/* APK Swipe Floating Notification / Indicator */}
      {isApk && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none">
          {swipeFeedback ? (
            <div className="bg-black/90 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-md shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in zoom-in-95">
              <span>{language === 'hi' ? 'अगला लेख लोड हो रहा है...' : language === 'en' ? 'Loading next article...' : 'આગલો લેખ લોડ થઈ રહ્યો છે...'}</span>
            </div>
          ) : (
            <div className="bg-black/70 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-lg border border-white/10 flex items-center gap-1.5 opacity-75">
              <span>{language === 'hi' ? '⇄ स्वाइप करें: अन्य लेख पढ़ें' : language === 'en' ? '⇄ Swipe to read next article' : '⇄ સ્વાઇપ કરો: બીજો લેખ વાંચો'}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

