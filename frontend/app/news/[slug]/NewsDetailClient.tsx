'use client';

import { useEffect, useMemo, useState, useCallback, memo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { isMediaVideo, sanitizeImageUrl } from '@/lib/media';

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

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.innerHTML = html;
    }
  }, [html]);

  // Both SSR and client initial render produce identical empty <div>
  // innerHTML is set imperatively after mount via ref â€” no hydration mismatch
  return (
    <div
      ref={bodyRef}
      className="article-body space-y-4 text-base leading-relaxed text-neutral-900 dark:text-neutral-100 prose dark:prose-invert max-w-none [&_b]:font-extrabold [&_strong]:font-extrabold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through [&_a]:text-[#B3121B] [&_a]:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:list-item [&_li]:my-1 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#B3121B] [&_blockquote]:pl-4 [&_blockquote]:font-bold [&_blockquote]:not-italic [&_blockquote]:my-3 [&_img]:rounded-xl [&_figure]:my-6"
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
  formatTime,
  formatViews,
  getArticleContent,
  getArticleExcerptHtml,
  getArticleTitle,
  getCategoryLabel,
  getLocalized,
  getRelativeTime,
  normalizeDisplayText,
} from '@/data';
import { useApp } from '@/components/AppProvider';
import { useAutoTranslate, useAutoTranslateHtml } from '@/lib/translate';
import Advertisement from '@/components/ads/Advertisement';
import { toGu } from '@/lib/utils';
import { NativeAdsSection } from '@/components/sections/HeroSection';
import { getBackendApiUrl, getHeroSettings } from '@/lib/api';
import AdSectionBanner from '@/components/ads/AdSectionBanner';
import { AutoArticleTitle } from '@/components/ui/AutoTranslatedArticleText';

const CATEGORY_SLUG_MAP: Record<string, string> = {
  'gujarat': 'gujarat',
  'ahmedabad': 'ahmedabad',
  'gandhinagar': 'gandhinagar',
  'surat': 'surat',
  'vadodara': 'vadodara',
  'rajkot': 'rajkot',
  'state': 'state',
  'india': 'india',
  'world': 'world',
  'business': 'business',
  'sports': 'sports',
  'entertainment': 'entertainment',
  'technology': 'technology',
  'education': 'education',
  'fact-check': 'fact-check',
  'factcheck': 'fact-check',
  'election': 'election',
  'trending': 'trending',

  'àª—à«àªœàª°àª¾àª¤': 'gujarat',
  'àª…àª®àª¦àª¾àªµàª¾àª¦': 'ahmedabad',
  'àª…àª¹àª®àª¦àª¾àª¬àª¾àª¦': 'ahmedabad',
  'àª—àª¾àª‚àª§à«€àª¨àª—àª°': 'gandhinagar',
  'àª¸à«àª°àª¤': 'surat',
  'àªµàª¡à«‹àª¦àª°àª¾': 'vadodara',
  'àª°àª¾àªœàª•à«‹àªŸ': 'rajkot',
  'àª­àª¾àª°àª¤': 'india',
  'àªµàª¿àª¶à«àªµ': 'world',
  'àª¬àª¿àªàª¨à«‡àª¸': 'business',
  'àª—à«‹àª²à«àª¡ - àª¸àª¿àª²à«àªµàª°': 'business',
  'àª¸à«àªªà«‹àª°à«àªŸà«àª¸': 'sports',
  'àª°àª®àª¤-àª—àª®àª¤': 'sports',
  'àª®àª¨à«‹àª°àª‚àªœàª¨': 'entertainment',
  'àªŸà«‡àª•àª¨à«‹àª²à«‹àªœà«€': 'technology',
  'àª¶àª¿àª•à«àª·àª£': 'education',
  'àª«à«‡àª•à«àªŸ àªšà«‡àª•': 'fact-check',
  'àªšà«‚àª‚àªŸàª£à«€ 2027': 'election',
  'àªŸà«àª°à«‡àª¨à«àª¡àª¿àª‚àª—': 'trending',

  'à¤—à¥à¤œà¤°à¤¾à¤¤': 'gujarat',
  'à¤…à¤¹à¤®à¤¦à¤¾à¤¬à¤¾à¤¦': 'ahmedabad',
  'à¤—à¤¾à¤‚à¤§à¥€à¤¨à¤—à¤°': 'gandhinagar',
  'à¤¸à¥‚à¤°à¤¤': 'surat',
  'à¤µà¤¡à¥‹à¤¦à¤°à¤¾': 'vadodara',
  'à¤°à¤¾à¤œà¤•à¥‹à¤Ÿ': 'rajkot',
  'à¤­à¤¾à¤°à¤¤': 'india',
  'à¤µà¤¿à¤¶à¥à¤µ': 'world',
  'à¤¬à¤¿à¤œà¤¨à¥‡à¤¸': 'business',
  'à¤–à¥‡à¤²': 'sports',
  'à¤®à¤¨à¥‹à¤°à¤‚à¤œà¤¨': 'entertainment',
  'à¤Ÿà¥‡à¤•à¥à¤¨à¥‹à¤²à¥‰à¤œà¥€': 'technology',
  'à¤¶à¤¿à¤•à¥à¤·à¤¾': 'education',
  'à¤«à¥ˆà¤•à¥à¤Ÿ à¤šà¥‡à¤•': 'fact-check',
  'à¤šà¥à¤¨à¤¾à¤µ à¥¨à¥¦à¥¨à¥­': 'election',
  'à¤Ÿà¥à¤°à¥‡à¤‚à¤¡à¤¿à¤‚à¤—': 'trending',
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

  return getBackendApiUrl(`/api/public/download-pdf?url=${encodeURIComponent(cleanUrl)}`);
}

function buildPdfCardHtml(url: string, titleText: string, descText: string, btnText: string): string {
  const downloadUrl = formatPdfDownloadUrl(url);
  if (!downloadUrl) return '';
  const fileName = downloadUrl.split('/').pop()?.split('?')[0] || 'Official_Document.pdf';
  return `<div class="gp-pdf-card-v2" style="display:flex;flex-direction:column;align-items:flex-start;gap:12px;padding:20px 22px;border-radius:16px;background:#ffffff;border:1px solid rgba(0,0,0,0.08);margin:24px 0;box-shadow:0 4px 18px rgba(0,0,0,0.03);">
    <div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;">
      <div class="gp-pdf-v2-title" style="color:#0f172a;font-weight:800;font-size:16px;line-height:1.3;letter-spacing:-0.01em;">${titleText}</div>
      <div class="gp-pdf-v2-sub" style="color:#64748b;font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px;">
        <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;"></span>
        <span>${descText}</span>
      </div>
    </div>
    <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer" download="${fileName}" data-pdfv2="1" style="display:inline-flex;align-items:center;gap:9px;padding:12px 24px;border-radius:12px;background:#18181b;color:#ffffff !important;font-weight:700;font-size:14.5px;text-decoration:none !important;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.25);transition:transform 0.2s;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      <span style="color:#ffffff !important;">${btnText}</span>
    </a>
  </div>`;
}

function upgradeEmbedCards(rawHtml: string, language?: string, articlePdfUrl?: string): string {
  if (!rawHtml && !articlePdfUrl) return '';

  let cleaned = rawHtml || '';

  // Clean duplicate fl_attachment if any in legacy content
  cleaned = cleaned.replace(/\/fl_attachment\/fl_attachment\//gi, '/fl_attachment/');

  // Upgrade Twitter / X cards
  cleaned = cleaned.replace(
    /<(div|p)[^>]*class=["'][^"']*(?:border|rounded|bg-|p-|my-|gp-x)[^"']*["'][^>]*>[\s\S]*?(?:View Tweet|View Official Post|Post on X|Twitter|àª¸àª¤à«àª¤àª¾àªµàª¾àª° àªŸà«àªµà«€àªŸ)[\s\S]*?<\/(?:div|p)>/gi,
    (match) => {
      if (match.startsWith('<div class="gp-x-card"') || (match.includes('gp-x-card') && !match.includes('border-red'))) {
        return match;
      }
      const hrefMatch = match.match(/href=["']([^"']+)["']/i);
      const url = (hrefMatch && hrefMatch[1]) ? hrefMatch[1] : '#';
      const guLabel = language === 'gu' ? 'àª¸àª¤à«àª¤àª¾àªµàª¾àª° àªŸà«àªµà«€àªŸ àªœà«‹àªµàª¾ àª®àª¾àªŸà«‡ àª…àª¹à«€ àª•à«àª²àª¿àª• àª•àª°à«‹' : language === 'hi' ? 'àª†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• à¤Ÿà¥à¤µà¥€à¤Ÿ à¤¦à¥‡à¤–à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤¯à¤¹à¤¾à¤‚ à¤•à¥à¤²à¤¿à¤• à¤•à¤°à¥‡à¤‚' : 'Click to view the official post on X';
      const guBtn = language === 'gu' ? 'àªŸà«àªµà«€àªŸ àªœà«àª“ â†—' : language === 'hi' ? 'àªŸà«àªµà«€àªŸ Ø¯ÛŒÚ©Ú¾ÛŒÚº â†—' : 'View Post â†—';
      return `<div class="gp-x-card"><div style="display:flex;align-items:center;gap:14px;min-width:0;position:relative;z-index:1"><span class="gp-x-icon">ð•</span><div style="min-width:0"><span class="gp-x-title">View Official Post on X (Twitter)</span><span class="gp-x-sub">${guLabel}</span></div></div><a href="${url}" target="_blank" rel="noopener noreferrer" class="gp-x-btn" style="position:relative;z-index:1"><span>${guBtn}</span></a></div>`;
    }
  );

  // Upgrade ALL PDF Attachment card blocks (old gp-pdf-card or legacy red border boxes) to premium red v2 card
  cleaned = cleaned.replace(
    /<div[^>]*class=["'][^"']*(?:gp-pdf-card|gp-pdf-card-v2|border-red-200|border-red-900|from-red-50|via-rose-50)[^"']*["'][\s\S]*?<\/div>(?:\s*<\/div>)?/gi,
    (match) => {
      let extractUrl = '';
      const proxyParam = match.match(/download-pdf\?url=([^"'\s&]+)/i);
      if (proxyParam && proxyParam[1]) {
        extractUrl = decodeURIComponent(proxyParam[1]);
      } else {
        const hrefMatch = match.match(/href=["']([^"']+)["']/i);
        if (hrefMatch && hrefMatch[1] && hrefMatch[1] !== '#') extractUrl = hrefMatch[1];
      }

      const finalPdfUrl = extractUrl || articlePdfUrl || '';
      if (!finalPdfUrl || finalPdfUrl === '#' || !finalPdfUrl.trim()) return '';

      const titleText = language === 'gu' ? 'àª¸àª‚àª¦àª°à«àª­àª¿àª¤ àª¸àª¤à«àª¤àª¾àªµàª¾àª° PDF àª¦àª¸à«àª¤àª¾àªµà«‡àªœ' : language === 'hi' ? 'à¤¸à¤‚à¤²à¤—à¥à¤¨ à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• à¤ªà¥€à¤¡à¥€à¤à¤« à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ' : 'Attached Official Document (PDF)';
      const descText = language === 'gu' ? 'àªšàª•àª¾àª¸àª¾àª¯à«‡àª² àª¸àª¤à«àª¤àª¾àªµàª¾àª° PDF àª¦àª¸à«àª¤àª¾àªµà«‡àªœ' : language === 'hi' ? 'àª¸àª¤à«àª¯àª¾àªªàª¿àª¤ àª…àª§àª¿àª•àª¾àª°àª¿àª• àªªà«€àª¡à«€àªàª« àª¦àª¸à«àª¤àª¾àªµà«‡àªœ' : 'Verified Official PDF Document';
      const btnText = language === 'gu' ? 'àª¡àª¾àª‰àª¨àª²à«‹àª¡ PDF' : language === 'hi' ? 'àª¡àª¾àª‰àª¨àª²à«‹àª¡ àªªà«€àª¡à«€àªàª«' : 'Download PDF';
      return buildPdfCardHtml(finalPdfUrl, titleText, descText, btnText);
    }
  );

  // Strip orphan standalone buttons
  cleaned = cleaned.replace(/<a[^>]*>[\s\S]*?(?:Download\s*PDF|Attached Official Document|Official Document \(PDF\)|Attached PDF|àª¡àª¾àª‰àª¨àª²à«‹àª¡\s*PDF|àª¡àª¾àª‰àª¨àª²à«‹àª¡\s*àªªà«€àª¡à«€àªàª«|àª¡àª¾àª‰àª¨àª²à«‹àª¡|Download|àªŸà«àªµà«€àªŸ\s*àªœà«àª“|View\s*Post|Open\s*Tweet)[\s\S]*?<\/a>/gi, (match) => {
    if (match.includes('gp-pdf-btn') || match.includes('gp-x-btn') || match.includes('gp-pdf-card') || match.includes('gp-x-card') || match.includes('data-pdfv2')) return match;
    return '';
  });

  // Remove any leftover empty red border container divs
  cleaned = cleaned.replace(/<div[^>]*class=["'][^"']*(?:border-red-200|border-red-900|from-red-50|via-rose-50|gp-pdf-card)[^"']*["']>\s*<\/div>/gi, '');

  return cleaned;
  // Strip orphan standalone buttons
  cleaned = cleaned.replace(/<a[^>]*>[\s\S]*?(?:Download\s*PDF|Attached Official Document|Official Document \(PDF\)|Attached PDF|àª¡àª¾àª‰àª¨àª²à«‹àª¡\s*PDF|àª¡àª¾àª‰àª¨àª²à«‹àª¡\s*àªªà«€àª¡à«€àªàª«|àª¡àª¾àª‰àª¨àª²à«‹àª¡|Download|àªŸà«àªµà«€àªŸ\s*àªœà«àª“|View\s*Post|Open\s*Tweet)[\s\S]*?<\/a>/gi, (match) => {
    if (match.includes('gp-pdf-btn') || match.includes('gp-x-btn') || match.includes('gp-pdf-card') || match.includes('gp-x-card') || match.includes('data-pdfv2')) return match;
    return '';
  });

  // Remove any leftover empty red border container divs
  cleaned = cleaned.replace(/<div[^>]*class=["'][^"']*(?:border-red-200|border-red-900|from-red-50|via-rose-50|gp-pdf-card)[^"']*["']>\s*<\/div>/gi, '');

  return cleaned;
}

function stripArticleUtilityLines(rawHtml: string): string {
  return (rawHtml || '')
    .replace(/^#{1,6}\s*(?:[\u{1F4CC}\uFE0F]\s*)?.*(?:KEY\s*HIGHLIGHTS|AT\s*A\s*GLANCE).*$/gimu, '')
    .replace(/^#{1,6}\s*[\u{1F4CC}\uFE0F]\s*.*$/gmu, '');
}

function normalizeArticleMarkdown(rawHtml: string): string {
  return stripArticleUtilityLines(rawHtml)
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h2>$1</h2>');
}

const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\s*\(\s*((?:https?:\/\/|\/uploads\/|\/assets\/)[^)]+)\s*\)/gi;

function isGalleryImageAlt(alt: string): boolean {
  return /gallery\s*image|àª—à«‡àª²à«‡àª°à«€|à¤—à¥ˆà¤²à¤°à¥€|à¤›à¤µà¤¿|àª›àª¬à«€/i.test(alt || '');
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
    .replace(/^##\s*ðŸ“Œ?\s*(àªàª• àª¨àªœàª°àª®àª¾àª‚|KEY HIGHLIGHTS|à¤à¤• à¤¨à¤œà¤° à¤®à¥‡à¤‚|AT A GLANCE).*?$/gmi, '')
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
            const lTrim = line.trim();
            if (lTrim) rawBlocks.push(lTrim);
          });
        }
      }
      rawBlocks.push(match.trim());
      currentBody = currentBody.substring(idx + match.length);
    });
    if (currentBody.trim()) {
      currentBody.trim().split(/\n+/).forEach((line) => {
        const lTrim = line.trim();
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
    let trimmed = block.trim();
    if (!trimmed) continue;

    const plainText = trimmed.replace(/<[^>]*>/g, '').trim();

    if (!plainText && !trimmed.includes('<img') && !trimmed.includes('![')) {
      continue;
    }

    if (
      plainText.includes('KEY HIGHLIGHTS') ||
      plainText.includes('àªàª• àª¨àªœàª°àª®àª¾àª‚') ||
      plainText.includes('à¤à¤• à¤¨à¤œà¤° à¤®à¥‡à¤‚') ||
      plainText.includes('AT A GLANCE') ||
      plainText.includes('ðŸ“Œ') ||
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
      if (galleryImageCount > 1) {
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
    .replace(/^##\s*ðŸ“Œ?\s*(àªàª• àª¨àªœàª°àª®àª¾àª‚|KEY HIGHLIGHTS|à¤à¤• à¤¨à¤œà¤° à¤®à¥‡à¤‚|AT A GLANCE).*?$/gmi, '')
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

  // Upgrade X / Twitter card blocks to premium design
  cleaned = cleaned.replace(
    /<(div|p)[^>]+(?:class|style)=["'][^"']*(?:border|rounded|bg-|p-|my-)[^"']*["'][^>]*>(?:(?!<\/(?:div|p)>)[\s\S])*?(?:View Tweet|View Official Post|Post on X|Twitter)(?:(?!<\/(?:div|p)>)[\s\S])*?<\/(?:div|p)>/gi,
    (match) => {
      if (match.includes('gp-x-card')) return match;
      const hrefMatch = match.match(/href=["']([^"']+)["']/i);
      const url = (hrefMatch && hrefMatch[1]) ? hrefMatch[1] : '#';
      const guLabel = language === 'gu' ? 'àª¸àª¤à«àª¤àª¾àªµàª¾àª° àªŸà«àªµà«€àªŸ àªœà«‹àªµàª¾ àª®àª¾àªŸà«‡ àª…àª¹à«€ àª•à«àª²àª¿àª• àª•àª°à«‹' : language === 'hi' ? 'à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• à¤Ÿà¥à¤µà¥€à¤Ÿ à¤¦à¥‡à¤–à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤¯à¤¹à¤¾à¤‚ à¤•à¥à¤²à¤¿à¤• à¤•à¤°à¥‡à¤‚' : 'Click to view the official post on X';
      const guBtn = language === 'gu' ? 'àªŸà«àªµà«€àªŸ àªœà«àª“ â†—' : language === 'hi' ? 'à¤Ÿà¥à¤µà¥€à¤Ÿ à¤¦à¥‡à¤–à¥‡à¤‚ â†—' : 'View Post â†—';
      return `<div class="gp-x-card"><div style="display:flex;align-items:center;gap:14px;min-width:0;position:relative;z-index:1"><span class="gp-x-icon">ð•</span><div style="min-width:0"><span class="gp-x-title">View Official Post on X (Twitter)</span><span class="gp-x-sub">${guLabel}</span></div></div><a href="${url}" target="_blank" rel="noopener noreferrer" class="gp-x-btn" style="position:relative;z-index:1"><span>${guBtn}</span></a></div>`;
    }
  );

  // Upgrade PDF Attachment card blocks to premium design (matches entire legacy container box)
  cleaned = cleaned.replace(
    /<(div|p)[^>]*class=["'][^"']*(?:border-red|from-red|via-rose|rounded-2xl|my-6|my-4|gp-pdf)[^"']*["'][^>]*>[\s\S]*?(?:Attached Official Document|Official Document \(PDF\)|Attached PDF|Download PDF|àª¡àª¾àª‰àª¨àª²à«‹àª¡\s*PDF)[\s\S]*?<\/(?:div|p)>(?:\s*<\/div>)?/gi,
    (match) => {
      // If it's already a clean single gp-pdf-card without legacy outer wrappers, keep it
      if (match.startsWith('<div class="gp-pdf-card"') || (match.includes('gp-pdf-card') && !match.includes('border-red') && !match.includes('from-red'))) {
        return match;
      }
      const hrefMatch = match.match(/href=["']([^"']+)["']/i);
      const url = (hrefMatch && hrefMatch[1]) ? hrefMatch[1] : '#';
      const titleText = language === 'gu' ? 'àª¸àª‚àª¦àª°à«àª­àª¿àª¤ àª¸àª¤à«àª¤àª¾àªµàª¾àª° PDF àª¦àª¸à«àª¤àª¾àªµà«‡àªœ' : language === 'hi' ? 'à¤¸à¤‚à¤²à¤—à¥à¤¨ à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• à¤ªà¥€à¤¡à¥€à¤à¤« à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ' : 'Attached Official Document (PDF)';
      const descText = language === 'gu' ? 'àªšàª•àª¾àª¸àª¾àª¯à«‡àª² àª¸àª¤à«àª¤àª¾àªµàª¾àª° PDF àª¦àª¸à«àª¤àª¾àªµà«‡àªœ' : language === 'hi' ? 'àª¸àª¤à«àª¯àª¾àªªàª¿àª¤ àª…àª§àª¿àª•àª¾àª°àª¿àª• àªªà«€àª¡à«€àªàª« àª¦àª¸à«àª¤àª¾àªµà«‡àªœ' : 'Verified Official PDF Document';
      const btnText = language === 'gu' ? 'àª¡àª¾àª‰àª¨àª²à«‹àª¡ PDF' : language === 'hi' ? 'àª¡àª¾àª‰àª¨àª²à«‹àª¡ àªªà«€àª¡à«€àªàª«' : 'Download PDF';
      return buildPdfCardHtml(url, titleText, descText, btnText);
    }
  );

  // Strip ALL orphan/standalone Download PDF & Twitter buttons (catches plain text, spans, icons, arrows)
  cleaned = cleaned.replace(/<a[^>]*>[\s\S]*?(?:Download\s*PDF|Attached Official Document|Official Document \(PDF\)|Attached PDF|àª¡àª¾àª‰àª¨àª²à«‹àª¡\s*PDF|àª¡àª¾àª‰àª¨àª²à«‹àª¡\s*àªªà«€àª¡à«€àªàª«|àª¡àª¾àª‰àª¨àª²à«‹àª¡|Download|àªŸà«àªµà«€àªŸ\s*àªœà«àª“|View\s*Post|Open\s*Tweet)[\s\S]*?<\/a>/gi, (match) => {
    // Only keep if it contains the full container card or button class
    if (match.includes('gp-pdf-btn') || match.includes('gp-x-btn') || match.includes('gp-pdf-card') || match.includes('gp-x-card') || match.includes('data-pdfv2')) return match;
    return '';
  });
  cleaned = cleaned.replace(/<button[^>]*>[\s\S]*?(?:Download\s*PDF|Attached Official Document|Official Document \(PDF\)|Attached PDF|àª¡àª¾àª‰àª¨àª²à«‹àª¡\s*PDF|àª¡àª¾àª‰àª¨àª²à«‹àª¡\s*àªªà«€àª¡à«€àªàª«|àª¡àª¾àª‰àª¨àª²à«‹àª¡|Download|àªŸà«àªµà«€àªŸ\s*àªœà«àª“|View\s*Post|Open\s*Tweet)[\s\S]*?<\/button>/gi, (match) => {
    if (match.includes('gp-pdf-btn') || match.includes('gp-x-btn') || match.includes('gp-pdf-card') || match.includes('gp-x-card') || match.includes('data-pdfv2')) return match;
    return '';
  });

  // Remove leftover legacy PDF card fragments (old class names, no longer used by the new design)
  cleaned = cleaned.replace(/<div[^>]*class="gp-pdf-inner"[\s\S]*?<\/div>\s*<\/div>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*class="gp-pdf-icon-wrap"[^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*class="gp-pdf-text"[^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<span[^>]*class="gp-pdf-title"[^>]*>[\s\S]*?<\/span>/gi, '');
  cleaned = cleaned.replace(/<span[^>]*class="gp-pdf-sub"[^>]*>[\s\S]*?<\/span>/gi, '');
  cleaned = cleaned.replace(/<a[^>]*class="gp-pdf-btn"[^>]*>[\s\S]*?<\/a>/gi, '');

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
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [adSlide, setAdSlide] = useState(0);
  const [relatedLimit, setRelatedLimit] = useState(8);
  const [isContentExpanded, setIsContentExpanded] = useState(false);

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
  const authorDesignation = getLocalized(language, {
    en: article.author.designation,
    gu: article.author.designationGu,
    hi: article.author.designationHi,
  });
  const authorBio = getLocalized(language, { en: article.author.bio, gu: article.author.bioGu, hi: article.author.bioHi });
  const tags = (language === 'en' ? article.tags : language === 'hi' ? (article.tagsHi?.length ? article.tagsHi : article.tags) : (article.tagsGu?.length ? article.tagsGu : article.tags)) || article.tags || [];
  const isTrafficArticle = article.slug.includes('traffic-rules') || article.slug.includes('penalty-and-locations');

  const paragraphs = useMemo(() => body.split(/\n\n+/), [body]);

  const displayParagraphs = useMemo(() => {
    return parseArticleBodyBlocks(body, language, (article as any)?.pdfUrl || (article as any)?.pdf);
  }, [body, language, article]);

  const formattedArticleBodyHtml = useMemo(() => {
    if (!body) return '';

    let cleaned = normalizeArticleMarkdown(upgradeEmbedCards(body, language, (article as any)?.pdfUrl || (article as any)?.pdf))
      .replace(/^##\s*ðŸ“Œ?\s*(àªàª• àª¨àªœàª°àª®àª¾àª‚|KEY HIGHLIGHTS|à¤à¤• à¤¨à¤œà¤° à¤®à¥‡à¤‚|AT A GLANCE).*?$/gmi, '')
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
      const quoteLines = lines.filter((l: string) => l.startsWith('>') && !l.includes('> â€”') && !l.includes('> -'));
      const quoteText = quoteLines.map((l: string) => l.replace(/^>\s*"?/, '').replace(/"?$/, '')).join(' ').trim();
      const citeLine = lines.find((l: string) => l.includes('> â€”') || l.includes('> -'));
      const citeText = citeLine ? citeLine.replace(/^>\s*â€”\s*/, '').replace(/^>\s*-\s*/, '').trim() : '';
      const finalQuote = (quoteText || bqBlock.replace(/^>\s*"?/, '').replace(/"?$/, '')).replace(/^"/, '').replace(/"$/, '');

      return buildStyledQuoteHtml(finalQuote, citeText);
    });

    // Convert markdown images after translation as labels may no longer be English.
    cleaned = convertMarkdownImagesToFigures(cleaned, title);

    // Upgrade X / Twitter cards styling in body HTML
    cleaned = cleaned.replace(
      /<(div|p)[^>]+(?:class|style)=["'][^"']*(?:border|rounded|bg-|p-|my-)[^"']*["'][^>]*>(?:(?!<\/(?:div|p)>)[\s\S])*?(?:View Tweet|View Official Post|Post on X|Twitter)(?:(?!<\/(?:div|p)>)[\s\S])*?<\/(?:div|p)>/gi,
      (match) => {
        if (match.includes('gp-x-card')) return match;
        const hrefMatch = match.match(/href=["']([^"']+)["']/i);
        const url = (hrefMatch && hrefMatch[1]) ? hrefMatch[1] : (article as any).twitterUrl || (article as any).tweetUrl || '#';
        const guLabel = language === 'gu' ? 'àª¸àª¤à«àª¤àª¾àªµàª¾àª° àªŸà«àªµà«€àªŸ àªœà«‹àªµàª¾ àª®àª¾àªŸà«‡ àª…àª¹à«€ àª•à«àª²àª¿àª• àª•àª°à«‹' : language === 'hi' ? 'à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• à¤Ÿà¥à¤µà¥€à¤Ÿ à¤¦à¥‡à¤–à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤¯à¤¹à¤¾à¤‚ à¤•à¥à¤²à¤¿à¤• à¤•à¤°à¥‡à¤‚' : 'Click to view the official post on X';
        const guBtn = language === 'gu' ? 'àªŸà«àªµà«€àªŸ àªœà«àª“ â†—' : language === 'hi' ? 'à¤Ÿà¥à¤µà¥€à¤Ÿ à¤¦à¥‡à¤–à¥‡à¤‚ â†—' : 'View Post â†—';
        return `<div class="gp-x-card">
          <div style="display:flex;align-items:center;gap:14px;min-width:0;position:relative;z-index:1">
            <span class="gp-x-icon">ð•</span>
            <div style="min-width:0">
              <span class="gp-x-title">View Official Post on X (Twitter)</span>
              <span class="gp-x-sub">${guLabel}</span>
            </div>
          </div>
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="gp-x-btn" style="position:relative;z-index:1">
            <span>${guBtn}</span>
          </a>
        </div>`;
      }
    );

    // Collapse multiple nested blockquotes
    cleaned = cleaned
      .replace(/(<blockquote[^>]*>\s*)+/gi, '<blockquote class="my-6 border-l-[3px] border-[#B3121B] pl-4 py-1 font-sans font-bold text-neutral-900 dark:text-white">')
      .replace(/(\s*<\/blockquote>)+/gi, '</blockquote>');

    // Auto-link plain URLs that are not inside href="..."
    cleaned = cleaned.replace(/(^|[\s>(])(https?:\/\/[^\s<"']+)/g, (match, prefix, url) => {
      return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#B3121B] font-bold underline hover:text-[#8E0E15] break-all">${url}</a>`;
    });

    // If cleaned does not contain HTML block tags, wrap paragraphs in <p> tags
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

    // Append PDF card if set on article object and not already present in body HTML
    const pdfDocumentUrl = (article as any).pdfUrl || (article as any).pdf;
    if (pdfDocumentUrl && pdfDocumentUrl.trim() && !cleaned.includes('gp-pdf-card')) {
      const titleText = language === 'gu' ? 'àª¸àª‚àª¦àª°à«àª­àª¿àª¤ àª¸àª¤à«àª¤àª¾àªµàª¾àª° PDF àª¦àª¸à«àª¤àª¾àªµà«‡àªœ' : language === 'hi' ? 'à¤¸à¤‚à¤²à¤—à¥à¤¨ à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• à¤ªà¥€à¤¡à¥€à¤à¤« à¤¦à¤¸à¥à¤¤à¤¾à¤µà¥‡à¤œ' : 'Attached Official Document (PDF)';
      const descText = language === 'gu' ? 'àªšàª•àª¾àª¸àª¾àª¯à«‡àª² àª¸àª¤à«àª¤àª¾àªµàª¾àª° PDF àª¦àª¸à«àª¤àª¾àªµà«‡àªœ' : language === 'hi' ? 'àª¸àª¤à«àª¯àª¾àªªàª¿àª¤ àª…àª§àª¿àª•àª¾àª°àª¿àª• àªªà«€àª¡à«€àªàª« àª¦àª¸à«àª¤àª¾àªµà«‡àªœ' : 'Verified Official PDF Document';
      const btnText = language === 'gu' ? 'àª¡àª¾àª‰àª¨àª²à«‹àª¡ PDF' : language === 'hi' ? 'àª¡àª¾àª‰àª¨àª²à«‹àª¡ àªªà«€àª¡à«€àªàª«' : 'Download PDF';
      cleaned += buildPdfCardHtml(pdfDocumentUrl.trim(), titleText, descText, btnText);
    }

    return cleaned;
  }, [body, title, language, article]);



  const gistPoints = useMemo(() => {
    const rawContent = getArticleContent(article, 'gu') || article.content || (article as any).contentGu || (article as any).contentHi || '';
    const points: string[] = [];

    const cleanStr = (s: string) => {
      return normalizeDisplayText(s)
        .replace(/<[^>]*>/g, '')
        .replace(/^[•*\-#\d\.\s📌]+/, '')
        .replace(/^[â€¢*\-#\d\.\sðŸ“Œ]+/, '')
        .replace(/^[â€¢*\-#\d\.\s]+/, '')
        .replace(/[📌ðŸ“Œ]/gi, '')
        .replace(/#+/g, '')
        .replace(/\(KEY HIGHLIGHTS\)/gi, '')
        .replace(/એક નજરમાં/gi, '')
        .replace(/एक नजर में/gi, '')
        .replace(/àªàª• àª¨àªœàª°àª®àª¾àª‚/gi, '')
        .replace(/à¤à¤• à¤¨à¤œà¤° à¤®à¥‡à¤‚/gi, '')
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
        trimmed.includes('àªàª• àª¨àªœàª°àª®àª¾àª‚') ||
        trimmed.includes('à¤à¤• à¤¨à¤œà¤° à¤®à¥‡à¤‚') ||
        trimmed.includes('AT A GLANCE') ||
        trimmed.includes('📌') ||
        trimmed.includes('ðŸ“Œ')
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
        trimmed.startsWith('â€¢') ||
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
      return ['àªšà«‚àª‚àªŸàª£à«€ 2027', 'àªµàª°àª¸àª¾àª¦', 'àª¸à«‹àª¨àª¾-àªšàª¾àª‚àª¦à«€', 'àª•à«àª°àª¿àª•à«‡àªŸ', 'àª®à«‡àªŸà«àª°à«‹', 'àª¸à«‡àª®àª¿àª•àª¨à«àª¡àª•à«àªŸàª°', 'àª¡àª¾àª¯àª®àª‚àª¡ àª‰àª¦à«àª¯à«‹àª—', 'àªŸà«àª°àª¾àª«àª¿àª•'];
    } else if (language === 'hi') {
      return ['à¤šà¥à¤¨à¤¾à¤µ à¥¨à¥¦à¥¨à¥­', 'à¤¬à¤¾à¤°à¤¿à¤¶', 'à¤¸à¥‹à¤¨à¤¾-à¤šà¤¾à¤‚à¤¦à¥€', 'à¤•à¥à¤°à¤¿à¤•à¥‡à¤Ÿ', 'à¤®à¥‡à¤Ÿà¥à¤°à¥‹', 'à¤¸à¥‡à¤®à¥€à¤•à¤‚à¤¡à¤•à¥à¤Ÿà¤°', 'à¤¹à¥€à¤°à¤¾ à¤‰à¤¦à¥à¤¯à¥‹à¤—', 'à¤¯à¤¾à¤¤à¤¾à¤¯à¤¾à¤¤'];
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
    const textLength = (article.content || '').length + ((article as any).contentGu || '').length + (article.excerpt || '').length;
    if (textLength < 350) return 3;
    if (textLength < 800) return 4;
    return 5;
  }, [article]);

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
    const priorityCatKeywords = ['gujarat', 'india', 'world', 'politics', 'business', 'àª—à«àªœàª°àª¾àª¤', 'àª­àª¾àª°àª¤', 'àªµàª¿àª¶à«àªµ', 'àª°àª¾àªœàª¨à«€àª¤àª¿', 'àªµà«àª¯àª¾àªªàª¾àª°'];

    // Gather candidate articles excluding main article & all stream articles
    const pool = [...trending, ...related, ...mostReadArticles].filter(
      (item, index, self) => !excludeIds.has(String(item.id)) && self.findIndex(t => String(t.id) === String(item.id)) === index
    );

    // Filter for State & National top headlines first
    const stateNationalCandidates = pool.filter(cand => {
      const cat = (cand.category || '').toLowerCase().trim();
      return priorityCatKeywords.some(kw => cat.includes(kw) || kw.includes(cat));
    });

    const poolToUse = stateNationalCandidates.length >= 4 ? stateNationalCandidates : pool;

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
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(title)}`,
      icon: (className: string) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.03-.75 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.2z" /></svg>,
      style: 'bg-[#229ed9]/8 text-[#229ed9] border border-[#229ed9]/10 hover:bg-[#229ed9]/15'
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
      ? ['àª¸àª®àª¾àªšàª¾àª°', 'àª—à«àªœàª°àª¾àª¤', 'àª²àª¾àª‡àªµ', 'àª…àª®àª¦àª¾àªµàª¾àª¦', 'àª¬à«àª°à«‡àª•àª¿àª‚àª— àª¨à«àª¯à«‚àª', 'àª•à«àª°àª¿àª•à«‡àªŸ', 'àª¸à«àªªà«‹àª°à«àªŸà«àª¸', 'àª¬à«‹àª²àª¿àªµà«‚àª¡', 'àªàª¨à«àªŸàª°àªŸà«‡àª‡àª¨àª®à«‡àª¨à«àªŸ', 'àª°àª¾àªœàª•àª¾àª°àª£', 'àª¬àª¿àªàª¨à«‡àª¸', 'àªŸà«‡àª•àª¨à«‹àª²à«‹àªœà«€', 'àªµà«‡àª§àª°', 'àª°àª¾àªœàª•à«‹àªŸ', 'àª¸à«àª°àª¤', 'àªµàª¡à«‹àª¦àª°àª¾', 'àª²àª¾àª‡àª«àª¸à«àªŸàª¾àª‡àª²', 'àª°àª¾àª·à«àªŸà«àª°à«€àª¯', 'àª†àª‚àª¤àª°àª°àª¾àª·à«àªŸà«àª°à«€àª¯', 'àªµàª¿àª¶à«‡àª·', 'àª®àª¨à«‹àª°àª‚àªœàª¨', 'àª°àª®àª¤àª—àª®àª¤']
      : language === 'hi'
        ? ['à¤¸à¤®à¤¾à¤šà¤¾à¤°', 'à¤—à¥à¤œà¤°à¤¾à¤¤', 'à¤²à¤¾à¤‡à¤µ', 'à¤…à¤¹à¤®à¤¦à¤¾à¤¬à¤¾à¤¦', 'à¤¬à¥à¤°à¥‡à¤•à¤¿à¤‚à¤— à¤¨à¥à¤¯à¥‚à¤œ', 'à¤•à¥à¤°à¤¿à¤•à¥‡à¤Ÿ', 'à¤¸à¥à¤ªà¥‹à¤°à¥à¤Ÿà¥à¤¸', 'à¤¬à¥‰à¤²à¥€à¤µà¥à¤¡', 'à¤®à¤¨à¥‹à¤°à¤‚à¤œà¤¨', 'à¤°à¤¾à¤œà¤¨à¥€à¤¤à¤¿', 'à¤¬à¤¿à¤œà¤¨à¥‡à¤¸', 'à¤Ÿà¥‡à¤•à¥à¤¨à¥‹à¤²à¥‰à¤œà¥€', 'à¤®à¥Œà¤¸à¤®', 'à¤°à¤¾à¤œà¤•à¥‹à¤Ÿ', 'à¤¸à¥‚à¤°à¤¤', 'à¤µà¤¡à¥‹à¤¦à¤°à¤¾', 'à¤²à¤¾à¤‡à¤«à¤¸à¥à¤Ÿà¤¾à¤‡à¤²', 'à¤°à¤¾à¤·à¥à¤Ÿà¥à¤°à¥€à¤¯', 'à¤…à¤‚à¤¤à¤°à¤°à¤¾à¤·à¥à¤Ÿà¥à¤°à¥€à¤¯', 'à¤µà¤¿à¤¶à¥‡à¤·', 'à¤–à¥‡à¤²']
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

  return (
    <>
      <ReadingProgressBar />
      <div className="wrap py-6">
        <div key={`${article.id}-${language}`} className="article-grid" suppressHydrationWarning>
          <article suppressHydrationWarning>
            <nav className="breadcrumb select-none flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-neutral-500 font-medium">
              <Link href="/" className="hover:text-[var(--red)] transition-colors">
                {uiLabel(language, { en: 'Home', gu: 'àª¹à«‹àª®', hi: 'à¤¹à¥‹à¤®' })}
              </Link>
              <span>/</span>
              <Link href={`/category/${article.category.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-[var(--red)] transition-colors">
                {category}
              </Link>
              <span>/</span>
              <span>
                {uiLabel(language, { en: 'Ahmedabad', gu: 'àª…àª®àª¦àª¾àªµàª¾àª¦', hi: 'à¤…à¤¹à¤®à¤¦à¤¾à¤¬à¤¾à¤¦' })}
              </span>
              <span className="mx-0.5">:</span>
              <span className="text-red-700 dark:text-red-400 font-bold">
                {title}
              </span>
            </nav>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="art-kick">
                <span className="bar"></span>
                <span>{category} · {uiLabel(language, { en: 'Ahmedabad', gu: 'àª…àª®àª¦àª¾àªµàª¾àª¦', hi: 'à¤…à¤¹à¤®à¤¦à¤¾à¤¬à¤¾à¤¦' })}</span>
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
                  {authorAvatarImage ? (
                    <img src={authorAvatarImage} alt={authorName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{authorName.substring(0, 2)}</span>
                  )}
                </Link>
                <div>
                  <div className="text-[13.5px]">
                    <span className="text-[var(--ink-2)]">{uiLabel(language, { en: 'Author:', gu: 'àª²à«‡àª–àª•:', hi: 'à¤²à¥‡à¤–à¤•:' })} </span>
                    <Link href={`/author/${article.author.id}`} className="font-bold text-[var(--red)] hover:underline">
                      {authorName}
                    </Link>
                  </div>
                  <div className="text-[12px] text-[var(--ink-3)] mt-[2px]" suppressHydrationWarning>
                    {language === 'gu' ? (
                      <span suppressHydrationWarning>પ્રકાશિત: {formatDate(article.publishedAt)}, {formatTime(article.publishedAt)} · <span className="text-[var(--red)] font-bold" suppressHydrationWarning>અપડેટ: {getRelativeTime((article as any).updatedAt || article.publishedAt, 'gu')}</span></span>
                    ) : language === 'hi' ? (
                      <span suppressHydrationWarning>प्रकाशित: {formatDate(article.publishedAt)}, {formatTime(article.publishedAt)} · <span className="text-[var(--red)] font-bold" suppressHydrationWarning>अपडेट: {getRelativeTime((article as any).updatedAt || article.publishedAt, 'hi')}</span></span>
                    ) : (
<span suppressHydrationWarning>Published: {formatDate(article.publishedAt)}, {formatTime(article.publishedAt)} · <span className="text-[var(--red)] font-bold" suppressHydrationWarning>Updated: {getRelativeTime((article as any).updatedAt || article.publishedAt, 'en')}</span></span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[12.5px] text-[var(--ink-2)]">
                  ⏱ {language === 'gu' ? `વાંચન સમય: ${article.readingTime} મિનિટ` : language === 'hi' ? `पठन समय: ${article.readingTime} मिनट` : `Read time: ${article.readingTime} mins`}
                </span>
                {/* Google News Follow Badge */}
                <a
                  href="https://news.google.com/publications/CAAqBwgKMJq4lgswrOalAw"
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

            {/* Gist: àªàª• àª¨àªœàª°àª®àª¾àª‚ */}
            {gistPoints.length > 0 && (
              <div className="my-6 rounded-r-xl border-l-4 border-[#B3121B] bg-neutral-50 dark:bg-neutral-900/60 p-4 shadow-sm">
                <div className="flex items-center gap-2 font-black text-[#B3121B] text-base mb-3 select-none">
                  <span className="text-[#B3121B] font-bold text-sm">♦</span>
                  <span>{uiLabel(language, { en: 'At a Glance', gu: 'àªàª• àª¨àªœàª°àª®àª¾àª‚', hi: 'à¤à¤• à¤¨à¤œà¤° à¤®à¥‡à¤‚' })}</span>
                </div>
                <ul className="space-y-2.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
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

            <figure className="article-fig">
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
              </div>
              <figcaption>
                <span>
                  {isTrafficArticle && language === 'gu'
                    ? 'àª…àª®àª¦àª¾àªµàª¾àª¦àª¨àª¾ SG àª¹àª¾àªˆàªµà«‡ àªªàª° àª¨àªµà«€ àªŸà«àª°àª¾àª«àª¿àª• àª¸àª¿àª—à«àª¨àª² àªªà«àª°àª£àª¾àª²à«€.'
                    : isTrafficArticle && language === 'hi'
                      ? 'à¤…à¤¹à¤®à¤¦à¤¾à¤¬à¤¾à¤¦ à¤•à¥‡ à¤à¤¸à¤œà¥€ à¤¹à¤¾à¤ˆà¤µà¥‡ à¤ªà¤° à¤¨à¤ˆ à¤Ÿà¥à¤°à¥ˆà¤«à¤¿à¤• à¤¸à¤‚à¤•à¥‡à¤¤ à¤ªà¥à¤°à¤£à¤¾à¤²à¥€à¥¤'
                      : isTrafficArticle
                        ? 'New traffic signal system on SG Highway in Ahmedabad.'
                        : title}
                </span>
                <span style={{ whiteSpace: 'nowrap' }}>
                  {uiLabel(language, { en: 'Photo: Gujarat Post', gu: 'àª¤àª¸àªµà«€àª°: àª—à«àªœàª°àª¾àª¤ àªªà«‹àª¸à«àªŸ', hi: 'à¤¤à¤¸à¥à¤µà¥€à¤°: à¤—à¥à¤œà¤°à¤¾à¤¤ à¤ªà¥‹à¤¸à¥à¤Ÿ' })}
                </span>
              </figcaption>
            </figure>

            <div className="share-row-custom select-none flex flex-wrap gap-3 items-center mb-6 p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm backdrop-blur-sm">
              <span className="lbl font-black text-neutral-900 dark:text-neutral-100 mr-1 text-[14px] tracking-wide uppercase flex items-center gap-1.5 select-none">
                <span className="h-2 w-2 rounded-full bg-[#B3121B] animate-ping" />
                {uiLabel(language, { en: 'Share:', gu: 'àª¶à«‡àª° àª•àª°à«‹:', hi: 'à¤¶à¥‡à¤¯à¤° à¤•à¤°à¥‡à¤‚:' })}
              </span>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${title} ${articleUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                title={uiLabel(language, { en: 'WhatsApp', gu: 'àªµà«‹àªŸà«àª¸àªàªª', hi: 'à¤µà¥à¤¹à¤¾à¤Ÿà¥à¤¸à¤à¤ª' })}
                className="group relative flex items-center justify-center w-11 h-11 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-[0_8px_20px_rgba(37,211,102,0.35)] hover:border-[#25D366]"
              >
                <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] shrink-0 transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110">
                  <path fill="#25D366" d="M12.01 0a12 12 0 0 0-10.4 18l-1.6 5.8 6-1.6a12 12 0 1 0 6-22.2z" />
                  <path fill="#FFF" d="M16.9 14.1c-.3-.1-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.8-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.5 0-.2-.1-.4-.2-.6-.2-.4-.7-1.7-1-2.3-.3-.6-.6-.5-.8-.5H8c-.2 0-.6.1-.9.4C6.8 7.3 6 8.1 6 9.8c0 1.7 1.2 3.4 1.4 3.6.2.2 2.4 3.7 5.9 5.2.8.3 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.1-.3-.2-.5-.3z" />
                </svg>
              </a>

              {/* Dailyhunt */}
              <a
                href="https://profile.dailyhunt.in/gujaratpost"
                target="_blank"
                rel="noreferrer"
                title={uiLabel(language, { en: 'Dailyhunt', gu: 'àª¡à«‡àª‡àª²à«€àª¹àª¨à«àªŸ', hi: 'à¤¡à¥‡à¤²à¥€à¤¹à¤‚à¤¤' })}
                className="group relative flex items-center justify-center w-11 h-11 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-[0_8px_20px_rgba(251,188,5,0.35)] hover:border-[#FBBC05]"
              >
                <svg viewBox="0 0 48 48" className="w-[21px] h-[21px] shrink-0 transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110">
                  <path fill="#093492" d="M20.99 12.49 C21.62 14.48 21.86 21.86 21.86 21.86 C21.86 21.86 14.15 21.83 12.51 21.18 C8.59 19.61 5.5 17.07 5.5 13.08 C5.5 9.13 8.64 5.64 12.94 5.64 C17.17 5.64 19.77 8.69 20.99 12.49 Z" />
                  <path fill="#FBBC05" d="M35.51 20.99 C33.52 21.62 26.14 21.86 26.14 21.86 C26.14 21.86 26.17 14.15 26.82 12.51 C28.39 8.59 30.93 5.5 34.92 5.5 C38.87 5.5 42.36 8.64 42.36 12.94 C42.36 17.17 39.31 19.77 35.51 20.99 Z" />
                  <path fill="#ED1C24" d="M27.01 35.51 C26.38 33.52 26.14 26.14 26.14 26.14 C26.14 26.14 33.85 26.17 35.49 26.82 C39.41 28.39 42.5 30.93 42.5 34.92 C42.5 38.87 39.36 42.36 35.06 42.36 C30.83 42.36 28.23 39.31 27.01 35.51 Z" />
                  <path fill="#47B609" d="M12.49 27.01 C14.48 26.38 21.86 26.14 21.86 26.14 C21.86 26.14 21.83 33.85 21.18 35.49 C19.61 39.41 17.07 42.5 13.08 42.5 C9.13 42.5 5.64 39.36 5.64 35.06 C5.64 30.83 8.69 28.23 12.49 27.01 Z" />
                </svg>
              </a>

              {/* Google News */}
              <a
                href="https://news.google.com/search?q=Gujarat+Post"
                target="_blank"
                rel="noreferrer"
                title={uiLabel(language, { en: 'Google News', gu: 'àª—à«‚àª—àª² àª¨à«àª¯à«‚àª', hi: 'à¤—à¥‚à¤—à¤² à¤¨à¥à¤¯à¥‚à¤œà¤¼' })}
                className="group relative flex items-center justify-center w-11 h-11 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-[0_8px_20px_rgba(66,133,244,0.35)] hover:border-[#4285F4]"
              >
                <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] shrink-0 transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110">
                  <rect x="2" y="2" width="8" height="20" rx="1.5" fill="#4285F4" />
                  <rect x="12" y="3" width="10" height="3.5" rx="1" fill="#EA4335" />
                  <rect x="12" y="9" width="10" height="3.5" rx="1" fill="#FBBC05" />
                  <rect x="12" y="15" width="10" height="6" rx="1" fill="#34A853" />
                </svg>
              </a>

              {/* Print */}
              <button
                type="button"
                onClick={() => window.print()}
                title={uiLabel(language, { en: 'Print', gu: 'àªªà«àª°àª¿àª¨à«àªŸ', hi: 'à¤ªà¥à¤°à¤¿à¤‚à¤Ÿ' })}
                className="group relative flex items-center justify-center w-11 h-11 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current stroke-2 shrink-0 transition-transform duration-300 group-hover:rotate-[-12deg]" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
              </button>

              {/* Copy Link */}
              <button
                type="button"
                onClick={copyUrl}
                title={copied ? uiLabel(language, { en: 'Copied', gu: 'àª•à«‰àªªàª¿ àª¥àªˆ', hi: 'à¤•à¥‰à¤ªà¥€ à¤¹à¥à¤†' }) : uiLabel(language, { en: 'Copy Link', gu: 'àª²àª¿àª‚àª• àª•à«‰àªªàª¿ àª•àª°à«‹', hi: 'à¤²à¤¿à¤‚à¤• à¤•à¥‰à¤ªà¥€ à¤•à¤°à¥‡à¤‚' })}
                className={`group relative flex items-center justify-center w-11 h-11 rounded-full border transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm ${copied
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 shadow-[0_8px_20px_rgba(16,185,129,0.35)] scale-110'
                  : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-[#B3121B] hover:text-[#B3121B] hover:shadow-[0_8px_20px_rgba(179,18,27,0.35)]'
                  }`}
              >
                {copied ? (
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current stroke-[2.5] shrink-0 animate-bounce">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current stroke-2 shrink-0 transition-transform duration-300 group-hover:rotate-[15deg]" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                )}
              </button>

              {/* Save / Bookmark */}
              <button
                type="button"
                onClick={handleToggleSave}
                title={saved ? uiLabel(language, { en: 'Saved', gu: 'àª¸àª¾àªšàªµà«‡àª²à«àª‚', hi: 'à¤¸à¤¹à¥‡à¤œà¤¾ à¤—à¤¯à¤¾' }) : uiLabel(language, { en: 'Save', gu: 'àª¸àª¾àªšàªµà«‹', hi: 'à¤¸à¤¹à¥‡à¤œà¥‡à¤‚' })}
                className={`group relative flex items-center justify-center w-11 h-11 rounded-full border transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm ${saved
                  ? 'border-[#B3121B] bg-red-50 text-[#B3121B] dark:bg-red-950/40 shadow-[0_8px_20px_rgba(179,18,27,0.35)]'
                  : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-[#B3121B] hover:text-[#B3121B] hover:shadow-[0_8px_20px_rgba(179,18,27,0.35)]'
                  }`}
              >
                <svg viewBox="0 0 24 24" className={`w-[18px] h-[18px] shrink-0 ${saved ? 'fill-current' : 'fill-none'} stroke-current stroke-2 transition-transform duration-300 group-hover:scale-110`} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>

              {/* Audio / Speaker */}
              <button
                type="button"
                onClick={toggleAudio}
                title={speaking ? uiLabel(language, { en: 'Stop', gu: 'àª¬àª‚àª§ àª•àª°à«‹', hi: 'à¤°à¥‹à¤•à¥‡à¤‚' }) : uiLabel(language, { en: 'Audio', gu: 'àª“àª¡àª¿àª¯à«‹', hi: 'à¤‘à¤¡à¤¿à¤¯à¥‹' })}
                className={`group relative flex items-center justify-center w-11 h-11 rounded-full border transition-all duration-300 hover:scale-[1.15] hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm ${speaking
                  ? 'border-[#B3121B] bg-red-50 text-[#B3121B] dark:bg-red-950/40 shadow-[0_8px_20px_rgba(179,18,27,0.35)] animate-pulse'
                  : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-[#B3121B] hover:text-[#B3121B] hover:shadow-[0_8px_20px_rgba(179,18,27,0.35)]'
                  }`}
              >
                <svg viewBox="0 0 24 24" className={`w-[18px] h-[18px] fill-none stroke-current stroke-2 shrink-0 transition-transform duration-300 ${speaking ? 'animate-bounce' : 'group-hover:rotate-[12deg]'}`} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </button>
            </div>

            {/* Article Main Content Body â€” with "àªµàª§à« àªµàª¾àª‚àªšà«‹" (Read More) expand button */}
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
                    {/* Horizontal Ad Banner placed directly after article description */}
                    <AdSectionBanner section="ARTICLE_BOTTOM" fallbackToDefault className="my-6" />
                  </div>
                );
              }

              return (
                <div className="relative">
                  <ArticleContentBody html={topHtml} />

                  {/* IN_ARTICLE Ad Banner displayed inside description BEFORE the "àªµàª§à« àªµàª¾àª‚àªšà«‹" button */}
                  <AdSectionBanner section="IN_ARTICLE" fallbackToDefault className="my-6" />

                  {!isContentExpanded ? (
                    <div className="relative pt-2 pb-2">
                      {/* Smooth gradient fade overlay */}
                      <div className="absolute -top-28 inset-x-0 h-28 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#0d1117] dark:via-[#0d1117]/90 dark:to-transparent pointer-events-none" />

                      {/* Vadhu Vacho (Read More) Expand Button */}
                      <div className="flex flex-col items-center justify-center relative z-20 pt-2 pb-4">
                        <button
                          type="button"
                          onClick={() => setIsContentExpanded(true)}
                          className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#B3121B] hover:bg-red-700 text-white font-black text-sm sm:text-base shadow-xl shadow-red-900/30 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer select-none border-2 border-white/20"
                        >
                          <span>{uiLabel(language, { en: 'Read More', gu: 'àªµàª§à« àªµàª¾àª‚àªšà«‹', hi: 'à¤”à¤° à¤ªà¥à¥‡à¤‚' })}</span>
                          <ChevronDown className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-0.5 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 transition-all duration-500 ease-in-out">
                      <ArticleContentBody html={bottomHtml} />

                      {/* Horizontal Ad Banner placed directly after full article description */}
                      <AdSectionBanner section="ARTICLE_BOTTOM" fallbackToDefault className="my-6" />

                      {/* Collapse / Read Less Button */}
                      <div className="flex justify-center pt-6 pb-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsContentExpanded(false);
                            window.scrollTo({ top: 380, behavior: 'smooth' });
                          }}
                          className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-extrabold text-xs transition-all duration-200 cursor-pointer select-none shadow-sm"
                        >
                          <span>{uiLabel(language, { en: 'Read Less', gu: 'àª“àª›à«àª‚ àªµàª¾àª‚àªšà«‹', hi: 'à¤•à¤® à¤ªà¥à¥‡à¤‚' })}</span>
                          <ChevronUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          </article>

          <aside className="side select-none" style={{ alignSelf: 'stretch' }} suppressHydrationWarning>
            <div className="side-sticky sticky top-20 transition-all duration-300">
              {/* Most Read widget */}
              <div className="mostread">
                <div className="wtitle">
                  <span className="d"></span>
                  <span>{uiLabel(language, { en: 'Most Read', gu: 'àª¸à«Œàª¥à«€ àªµàª§à« àªµàª‚àªšàª¾àª¯à«‡àª²àª¾', hi: 'à¤¸à¤¬à¤¸à¥‡ à¤œà¥à¤¯à¤¾à¤¦à¤¾ à¤ªà¤¢à¤¼à¥‡ à¤—à¤' })}</span>
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
                  <span>{uiLabel(language, { en: 'Recommended Stories', gu: 'àª¤àª®àª¾àª°àª¾ àª®àª¾àªŸà«‡ àª­àª²àª¾àª®àª£', hi: 'à¤†à¤ªà¤•à¥‡ à¤²à¤¿à¤ à¤…à¤¨à¥à¤¶à¤‚à¤¸à¤¿à¤¤' })}</span>
                </div>
                <div className="space-y-0 mt-3">
                  {sidebarRecommendedPool.slice(0, isContentExpanded ? 8 : 2).map((item, index) => {
                    const itemCategory = normalizeDisplayText(getCategoryLabel(item, language));
                    return (
                      <Link key={item.id || index} href={`/news/${item.slug}`} className="s-compact hover:opacity-85 transition-opacity">
                        <div>
                          <span className="kick">{itemCategory}</span>
                          <h3><AutoArticleTitle article={item} language={language} /></h3>
                          <div className="meta">
                            <span suppressHydrationWarning>{formatDate(item.publishedAt, language)}</span>
                          </div>
                        </div>
                        <div className="imgwrap">
                          <Image src={getCardThumbnail(item, index)} alt={item.title} fill sizes="92px" className="object-cover" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* WhatsApp Promo Card */}
              <div className="wa-card">
                <div className="h">
<span className="wi">💬</span>
<span>{uiLabel(language, { en: 'WhatsApp Channel', gu: 'WhatsApp àªšà«‡àª¨àª²', hi: 'WhatsApp à¤šà¥ˆà¤¨à¤²' })}</span>
                </div>
                <p>
                  {language === 'gu'
? 'તમારા શહેરના સમાચાર સૌથી પહેલા સીધા તમારા ફોન પર મેળવો.'
                    : language === 'hi'
? 'अपने शहर की खबरें सबसे पहले सीधे अपने फोन पर प्राप्त करें।'
                      : 'Get breaking news first directly on your phone.'}
                </p>
                <button type="button">
{uiLabel(language, { en: 'Follow Channel', gu: 'àªšà«‡àª¨àª² àª«à«‹àª²à«‹ àª•àª°à«‹', hi: 'à¤šà¥ˆà¤¨à¤² à¤«à¥‰à¤²à¥‹ à¤•à¤°à¥‡à¤‚' })}
                </button>
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

        <section className="art-related select-none w-full mt-8">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1.5">
              <span className="block w-[4px] h-6 rounded-full bg-[#B3121B]"></span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {uiLabel(language, { en: 'Related Stories', gu: 'àª¸àª‚àª¬àª‚àª§àª¿àª¤ àª¸àª®àª¾àªšàª¾àª°', hi: 'à¤¸à¤‚à¤¬à¤‚à¤§à¤¿à¤¤ à¤–à¤¬à¤°à¥‡à¤‚' })}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-neutral-200 dark:from-neutral-700 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.slice(0, relatedLimit).map((item, index) => {
              const itemCategory = normalizeDisplayText(getCategoryLabel(item, language));
              const isSaved = savedIds.includes(item.id);
              return (
                <div key={item.id} className="zoomhost relative group flex flex-col">
                  <Link href={`/news/${item.slug}`} className="s-standard flex flex-col group">
                    <div className="imgwrap relative aspect-[3/2] overflow-hidden rounded-md mb-2 bg-neutral-100 dark:bg-neutral-800">
                      <Image
                        src={getCardThumbnail(item, index)}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEMO_THUMBNAILS[index % DEMO_THUMBNAILS.length];
                        }}
                      />
                      {isSaved && (
                        <span className="absolute top-2 right-2 z-10 bg-white/90 dark:bg-black/90 p-1.5 rounded-full text-xs shadow-md">
                          🔖
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="kick mb-1 mt-0.5">{itemCategory}</span>
                      <h3 className="line-clamp-3 leading-snug text-foreground hover:text-accent transition-colors">
                        <AutoArticleTitle article={item} language={language} />
                      </h3>
                      <div className="meta select-none">
                        <span suppressHydrationWarning>{formatDate(item.publishedAt, language)}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-8">
            {relatedLimit < related.length ? (
              <button
                type="button"
                onClick={() => setRelatedLimit((prev) => prev + 4)}
                className="group flex items-center gap-2 px-7 py-3 rounded-full border-2 border-[#B3121B] text-[#B3121B] font-black text-sm hover:bg-[#B3121B] hover:text-white transition-all duration-300 shadow-sm hover:shadow-[0_4px_20px_rgba(179,18,27,0.3)] active:scale-95"
              >
                {uiLabel(language, { en: 'View More', gu: 'àªµàª§à« àªœà«àª“', hi: 'à¤…à¤§à¤¿à¤• à¤¦à¥‡à¤–à¥‡à¤‚' })}
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2.5] transition-transform duration-300 group-hover:translate-y-0.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            ) : (
              <Link
                href={`/category/${(article.category || 'all').toLowerCase().replace(/\s+/g, '-')}`}
                className="group flex items-center gap-2 px-7 py-3 rounded-full border-2 border-[#B3121B] text-[#B3121B] font-black text-sm hover:bg-[#B3121B] hover:text-white transition-all duration-300 shadow-sm hover:shadow-[0_4px_20px_rgba(179,18,27,0.3)] active:scale-95"
              >
                {uiLabel(language, { en: 'View All News', gu: 'àª¬àª§àª¾ àª¸àª®àª¾àªšàª¾àª° àªœà«àª“', hi: 'à¤¸à¤­à¥€ à¤¸à¤®à¤¾à¤šà¤¾à¤° à¤¦à¥‡à¤–à¥‡à¤‚' })}
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2.5] transition-transform duration-300 group-hover:translate-x-0.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            )}
          </div>
        </section>

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
const streamCity = uiLabel(language, { en: 'Ahmedabad', gu: 'àª…àª®àª¦àª¾àªµàª¾àª¦', hi: 'à¤…à¤¹à¤®à¤¦à¤¾à¤¬à¤¾à¤¦' });

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
{uiLabel(language, { en: 'Home', gu: 'àª¹à«‹àª®', hi: 'à¤¹à¥‹à¤®' })}
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
                              .filter((l) => l.startsWith('>') && !l.includes('> â€”') && !l.includes('> -'))
                              .map((l) => l.replace(/^>\s*"?/, '').replace(/"?$/, ''))
                              .join(' ');
                            const citeLine = lines.find((l) => l.includes('> â€”') || l.includes('> -'));
                            const citeText = citeLine ? citeLine.replace(/^>\s*â€”\s*/, '').replace(/^>\s*-\s*/, '').trim() : '';

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
{uiLabel(language, { en: 'Read Also', gu: 'àª† àªªàª£ àªµàª¾àª‚àªšà«‹', hi: 'à¤¯à¤¹ à¤­à¥€ à¤ªà¤¢à¤¼à¥‡à¤‚' })}
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
{uiLabel(language, { en: 'Topics:', gu: 'àªŸà«‹àªªàª¿àª•à«àª¸:', hi: 'à¤µà¤¿à¤·à¤¯:' })}
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
{uiLabel(language, { en: 'Read Also', gu: 'àª† àªªàª£ àªµàª¾àª‚àªšà«‹', hi: 'à¤¯à¤¹ à¤­à¥€ à¤ªà¤¢à¤¼à¥‡à¤‚' })}
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
{uiLabel(language, { en: 'Topics:', gu: 'àªŸà«‹àªªàª¿àª•à«àª¸:', hi: 'à¤µà¤¿à¤·à¤¯:' })}
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
<span>{uiLabel(language, { en: 'Recommended Stories', gu: 'àª¤àª®àª¾àª°àª¾ àª®àª¾àªŸà«‡ àª­àª²àª¾àª®àª£', hi: 'à¤†à¤ªà¤•à¥‡ à¤²à¤¿à¤ à¤…à¤¨à¥à¤¶à¤‚à¤¸à¤¿à¤¤' })}</span>
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

        {/* Sponsored Native Ads Section (Infinite Lazy Loaded Scroll) */}
        <NativeAdsSection language={language} />
      </div>
      <div style={{ height: '50px' }} />
    </>
  );
}

