'use client';

import { useEffect, useMemo, useState, useCallback, memo, useRef, Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsApk } from '@/lib/useIsApk';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { SocialIcon } from '@/components/ui/SocialLinks';
import { isMediaVideo, sanitizeImageUrl } from '@/lib/media';
import { buildTwitterPostButton, normalizeTwitterPostLinks } from '@/lib/article-social-links';
import dynamic from 'next/dynamic';
import ArticleShareAudioBar from './components/ArticleShareAudioBar';
import { playArticleAudio, stopArticleAudio, cleanTextForSpeech } from '@/lib/articleTtsPlayer';

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

function balanceHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') return '';
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const tagRegex = /<\/?([a-z0-9]+)(?:\s+[^>]*)?>/gi;

  let result = '';
  let lastIndex = 0;
  const stack: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();
    const matchIndex = match.index;

    // Append text content before this tag
    result += html.slice(lastIndex, matchIndex);
    lastIndex = matchIndex + fullTag.length;

    if (voidTags.has(tagName) || fullTag.endsWith('/>')) {
      result += fullTag;
      continue;
    }

    if (fullTag.startsWith('</')) {
      const lastIdx = stack.lastIndexOf(tagName);
      if (lastIdx !== -1) {
        // Close any nested open tags that were inside this element
        while (stack.length > lastIdx + 1) {
          const popped = stack.pop();
          result += `</${popped}>`;
        }
        stack.pop();
        result += fullTag;
      } else {
        // Stray closing tag with no matching opening tag in this HTML fragment.
        // Dropping it prevents breaking or prematurely closing ancestor container elements in SSR / DOM tree.
      }
    } else {
      stack.push(tagName);
      result += fullTag;
    }
  }

  result += html.slice(lastIndex);

  // Close any remaining unclosed opening tags in reverse order
  while (stack.length > 0) {
    const tag = stack.pop();
    result += `</${tag}>`;
  }

  return result;
}

export function stripHighlightsBlock(text: string): string {
  if (!text) return '';
  let out = text;

  // 1. Matches ## (or HTML) header down to closing dashes (with optional <p> wrappers)
  out = out.replace(
    /(?:^|\n)\s*(?:<p[^>]*>)?\s*(?:##\s*)?📌?\s*(?:એક નજરમાં|एक नजर में|AT A GLANCE|KEY HIGHLIGHTS|HIGHLIGHTS)[^\n<]*(?:<\/p>)?[\s\r\n]*(?:<p[^>]*>)?\s*[-*—_]{3,}\s*(?:<\/p>)?[\s\S]*?(?:<p[^>]*>)?\s*[-*—_]{3,}\s*(?:<\/p>)?/gi,
    ''
  );

  // 2. Matches header down to next section, standard HTML tag, or blank line followed by non-bullet text
  out = out.replace(
    /(?:^|\n)\s*(?:<p[^>]*>)?\s*(?:##\s*)?📌?\s*(?:એક નજરમાં|एक नजर में|AT A GLANCE|KEY HIGHLIGHTS|HIGHLIGHTS)[^\n<]*(?:<\/p>)?[\s\S]*?(?=(?:<h[1-6]|<div|<p(?:\s+[^>]*>|(?!\s*•|\s*&bull;))|<!-- gp-section|\n\s*\n\s*[^\s•*\-#<]))/gi,
    ''
  );

  // 3. Fallback for standalone header line
  out = out.replace(
    /(?:^|\n)\s*(?:<p[^>]*>)?\s*(?:##\s*)?📌?\s*(?:એક નજરમાં|एक नजर में|AT A GLANCE|KEY HIGHLIGHTS|HIGHLIGHTS)[^\n<]*(?:<\/p>)?/gi,
    ''
  );

  // 4. Dashed line block at the beginning without header: ----- text -----
  out = out.replace(
    /^[\s\r\n]*(?:<p[^>]*>)?\s*[-*—_]{3,}\s*(?:<\/p>)?[\s\S]*?(?:<p[^>]*>)?\s*[-*—_]{3,}\s*(?:<\/p>)?/i,
    ''
  );

  // 5. Strip leftover delimiter dashes
  out = out.replace(/(?:<p[^>]*>)?\s*[-*—_]{3,}\s*(?:<\/p>)?/gi, '');

  return out.trim();
}

const ArticleContentBody = memo(function ArticleContentBody({
  html,
}: {
  html: string;
  activeSpeechText?: string;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef<string>('');

  const cleanHtml = useMemo(() => {
    let raw = stripHighlightsBlock(html || '')
      .replace(/\\r\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\r/g, '')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, ' ')
      .replace(
        /(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/[^"'\s)]+?\.)(?:jpg|jpeg|png|webp|gif)/gi,
        '$1avif'
      );

    // Remove empty spacer divs and spacer paragraphs
    raw = raw
      .replace(/<div\b[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/div>/gi, '')
      .replace(/<p\b[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/p>/gi, '');

    // Transform any Twitter embed (figure with iframe, raw iframe, or blockquote) into a clean native Twitter blockquote
    raw = raw.replace(
      /<figure[^>]*data-article-social-platform=["']twitter["'][^>]*>[\s\S]*?<\/figure>/gi,
      (match) => {
        const urlMatch =
          match.match(/data-article-social-url=["']([^"']+)["']/i) ||
          match.match(/href=["'](https?:\/\/(?:twitter\.com|x\.com)\/[^"']+)["']/i) ||
          match.match(/https?:\/\/(?:twitter\.com|x\.com)\/(?:[a-zA-Z0-9_]+\/status|i\/status)\/\d+/i);
        const tweetUrl = urlMatch ? (urlMatch[1] || urlMatch[0]).replace(/&amp;/g, '&') : '';
        if (!tweetUrl) return match;
        return `<div class="gp-twitter-embed-wrap my-4 flex justify-center w-full" data-tweet-url="${tweetUrl}"><blockquote class="twitter-tweet" data-dnt="true" data-theme="light"><a href="${tweetUrl}">View post on X</a></blockquote></div>`;
      }
    );

    // Also transform any standalone Twitter iframes
    raw = raw.replace(
      /<iframe[^>]*(?:data-social-platform=["']twitter["']|srcdoc=["'][^"']*twitter\.com\/widgets\.js)[^>]*>[\s\S]*?<\/iframe>/gi,
      (match) => {
        const urlMatch =
          match.match(/(?:href=|data-article-social-url=)["'](https?:\/\/(?:twitter\.com|x\.com)\/[^"']+)["']/i) ||
          match.match(/https?:\/\/(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/\d+/i);
        const tweetUrl = urlMatch ? (urlMatch[1] || urlMatch[0]) : '';
        if (!tweetUrl) return '';
        return `<div class="gp-twitter-embed-wrap my-4 flex justify-center w-full" data-tweet-url="${tweetUrl}"><blockquote class="twitter-tweet" data-dnt="true" data-theme="light"><a href="${tweetUrl}">View post on X</a></blockquote></div>`;
      }
    );

    // Convert paragraph-level <div> to <p class="article-para my-3">
    raw = raw.replace(/<div\b([^>]*)>([\s\S]*?)<\/div>/gi, (match, attrs, inner) => {
      if (/<(div|blockquote|figure|table|iframe|hr|h[1-6]|ul|ol)\b/i.test(inner)) {
        return match;
      }
      const plain = inner.replace(/<[^>]*>/g, '').trim();
      if (!plain) return '';
      return `<p class="article-para my-3"${attrs}>${inner}</p>`;
    });

    const blocks = raw.split(/\n\s*\n+/);
    const wrapped = blocks.map((b) => {
      const t = b.trim();
      if (!t) return '';
      if (/^<(p|div|blockquote|figure|h[1-6]|ul|ol|table|iframe|hr)\b/i.test(t)) return balanceHtmlTags(t);
      return `<p class="article-para my-3">${t}</p>`;
    });
    return balanceHtmlTags(wrapped.filter(Boolean).join('\n\n'));
  }, [html]);

  useEffect(() => {
    if (bodyRef.current && lastHtmlRef.current !== cleanHtml) {
      lastHtmlRef.current = cleanHtml;
      bodyRef.current.innerHTML = cleanHtml;
    }

    let pollTimer: any = null;

    // 1. Render Twitter widgets natively on the page (safely deduplicated & throttled)
    const renderTwitter = () => {
      if (typeof window === 'undefined' || !bodyRef.current) return;

      // Find all twitter-tweet blockquotes that have NOT yet been rendered or initiated
      const pendingTweets = bodyRef.current.querySelectorAll<HTMLElement>(
        'blockquote.twitter-tweet:not(.twitter-tweet-rendered):not([data-gp-loading="true"])'
      );
      if (pendingTweets.length === 0) return;

      // Mark all pending tweets immediately so subsequent calls or re-renders NEVER trigger duplicate network calls
      pendingTweets.forEach((el) => el.setAttribute('data-gp-loading', 'true'));

      const triggerLoad = () => {
        if (typeof window !== 'undefined' && bodyRef.current) {
          const tw = (window as any).twttr;
          if (tw && tw.widgets && typeof tw.widgets.load === 'function') {
            tw.widgets.load(bodyRef.current);
          }
        }
      };

      const tw = (window as any).twttr;
      if (tw && tw.widgets && typeof tw.widgets.load === 'function') {
        triggerLoad();
      } else {
        let script = document.getElementById('gp-twitter-widgets-js') as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement('script');
          script.id = 'gp-twitter-widgets-js';
          script.src = 'https://platform.twitter.com/widgets.js';
          script.async = true;
          script.charset = 'utf-8';
          script.onload = () => {
            triggerLoad();
          };
          document.body.appendChild(script);
        } else {
          // If script is already downloading, poll briefly until twttr.widgets is ready, then stop
          let tries = 0;
          pollTimer = setInterval(() => {
            tries++;
            if ((window as any).twttr?.widgets?.load) {
              clearInterval(pollTimer);
              triggerLoad();
            } else if (tries > 25) {
              clearInterval(pollTimer);
            }
          }, 100);
        }
      }
    };
    renderTwitter();

    // 2. Render Instagram embeds if present
    if (typeof window !== 'undefined' && (window as any).instgrm?.Embeds?.process) {
      (window as any).instgrm.Embeds.process();
    }

    // 3. Auto-adjust Twitter / Social iframes to their exact content height and eliminate extra whitespace
    const adjustIframes = () => {
      const iframes = document.querySelectorAll<HTMLIFrameElement>(
        'figure[data-article-social-platform="twitter"] iframe, iframe[data-social-platform="twitter"], iframe[srcdoc*="twitter"]'
      );
      iframes.forEach((iframe) => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            const tweet = doc.querySelector('.twitter-tweet-rendered') || doc.querySelector('.twitter-tweet');
            if (tweet) {
              const h = Math.ceil(tweet.getBoundingClientRect().height || (tweet as HTMLElement).offsetHeight);
              if (h > 50) {
                iframe.style.setProperty('height', `${h}px`, 'important');
                iframe.style.setProperty('min-height', `${h}px`, 'important');
                iframe.style.setProperty('max-height', `${h}px`, 'important');
                iframe.style.setProperty('aspect-ratio', 'auto', 'important');
                const fig = iframe.closest('figure');
                if (fig) {
                  fig.style.setProperty('height', 'auto', 'important');
                  fig.style.setProperty('margin-bottom', '0.75rem', 'important');
                }
              }
            } else {
              const scrollH = Math.ceil(doc.body?.scrollHeight || doc.documentElement?.scrollHeight || 0);
              if (scrollH > 100 && scrollH < 720) {
                iframe.style.setProperty('height', `${scrollH}px`, 'important');
                iframe.style.setProperty('aspect-ratio', 'auto', 'important');
              }
            }
          }
        } catch {
          // Handled via postMessage
        }
      });
    };

    adjustIframes();
    const interval = setInterval(adjustIframes, 200);
    const timeout = setTimeout(() => clearInterval(interval), 4000);

    const handleMessage = (event: MessageEvent) => {
      if (
        event.data &&
        (event.data.type === 'gp-embed-resize' || event.data.type === 'gp-twitter-resize') &&
        typeof event.data.height === 'number'
      ) {
        const h = event.data.height;
        if (h < 50) return;
        const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe');
        iframes?.forEach((iframe) => {
          let match = false;
          try {
            if (iframe.contentWindow === event.source) match = true;
          } catch {
            // cross origin
          }
          if (!match && event.data.url) {
            const srcdoc = iframe.getAttribute('srcdoc') || '';
            if (srcdoc.includes(event.data.url)) match = true;
          }
          if (match) {
            iframe.style.setProperty('height', `${h}px`, 'important');
            iframe.style.setProperty('min-height', `${h}px`, 'important');
            iframe.style.setProperty('max-height', `${h}px`, 'important');
            iframe.style.setProperty('aspect-ratio', 'auto', 'important');
            iframe.style.setProperty('overflow', 'hidden', 'important');
            const fig = iframe.closest('figure');
            if (fig) {
              fig.style.setProperty('height', 'auto', 'important');
              fig.style.setProperty('margin-bottom', '0.75rem', 'important');
            }
          }
        });
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener('message', handleMessage);
    };
  }, [cleanHtml]);

  // Both SSR and client initial render produce identical empty <div>
  // innerHTML is set imperatively after mount via ref — no hydration mismatch
  return (
    <div
      ref={bodyRef}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
      className="article-body text-[17px] sm:text-[18px] leading-[1.8] sm:leading-[1.85] text-neutral-900 dark:text-neutral-100 prose dark:prose-invert max-w-none [&_p]:text-[17px] sm:[&_p]:text-[18px] [&_p]:leading-[1.8] sm:[&_p]:leading-[1.85] [&_p]:my-2 [&_b]:font-extrabold [&_strong]:font-extrabold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through [&_a]:text-[#B3121B] [&_a]:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:list-item [&_li]:my-1 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#B3121B] [&_blockquote]:pl-4 [&_blockquote]:font-bold [&_blockquote]:not-italic [&_blockquote]:my-3 [&_img]:rounded-xl [&_figure]:my-4 [&_figure[data-article-social-platform]]:my-3 [&_figure[data-article-social-platform]]:w-full [&_figure[data-article-social-platform]]:flex [&_figure[data-article-social-platform]]:justify-center [&_iframe]:w-full [&_iframe:not([data-social-platform]):not([srcdoc])]:aspect-video [&_figure[data-article-social-platform]_iframe]:aspect-auto [&_figure[data-article-social-platform]_iframe]:max-w-[550px] [&_figure[data-article-social-platform]_iframe]:mx-auto [&_iframe[srcdoc]]:aspect-auto [&_iframe[srcdoc]]:max-w-[550px] [&_iframe[srcdoc]]:mx-auto [&_iframe]:rounded-xl [&_iframe]:shadow-md [&_video]:w-full [&_video]:rounded-xl"
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
      className="h-full w-full object-contain bg-black"
      poster="/assets/placeholder.jpg"
    />
  );
});
import { Article, Language } from '@/types';
import {
  formatDate,
  formatViews,
  formatArticleDateTime,
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
import {
  getFacebookShareHref,
  getTwitterShareHref,
  getWhatsAppShareHref,
} from '@/lib/facebookShare';
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
  return buildTwitterPostButton(url, language);
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

function upgradeEmbedCards(rawHtml: string, language?: string, articlePdfUrl?: string, hasPdfPages?: boolean, pdfPosition?: string): string {
  if (!rawHtml && !articlePdfUrl) return '';

  let cleaned = rawHtml || '';

  // Clean duplicate fl_attachment if any in legacy content
  cleaned = cleaned.replace(/\/fl_attachment\/fl_attachment\//gi, '/fl_attachment/');

  // Collapse saved cards and orphan links into one working post button.
  cleaned = normalizeTwitterPostLinks(cleaned, language);

  // Extract PDF URL from body or props
  let detectedPdf = articlePdfUrl || '';
  if (!detectedPdf) {
    const pdfMatch =
      cleaned.match(/data-pdf-url=["']([^"']+)["']/i) ||
      cleaned.match(/gp-pdf-card[\s\S]*?href=["']([^"']+)["']/i) ||
      cleaned.match(/href=["']([^"']+\.pdf(?:\?[^"']*)?|\/uploads\/[^"']+\.pdf(?:\?[^"']*)?)["']/i);
    if (pdfMatch && pdfMatch[1]) detectedPdf = pdfMatch[1];
  }

  const cleanPdf = detectedPdf ? detectedPdf.trim() : '';

  if (cleanPdf && cleanPdf !== '#') {
    const targetPdfBlock = hasPdfPages
      ? `<div class="gp-pdf-pages-viewer" data-pdf-url="${cleanPdf}"></div>`
      : buildPdfCardHtml(cleanPdf, language);

    // 1. Check for any existing inline PDF marker (viewer, card, placeholder, or token)
    const inlineMarkerPattern = /(?:<div[^>]*class=["'][^"']*(?:gp-pdf-card|gp-pdf-card-v2)[^"']*["'][\s\S]*?<\/a>\s*<\/div>|<div[^>]*class=["'][^"']*gp-pdf-pages-viewer[^"']*["'][^>]*>\s*<\/div>|<div[^>]*data-pdf-url=["'][^"']*["'][\s\S]*?<\/div>|\[PDF_DOCUMENT\])/i;

    if (inlineMarkerPattern.test(cleaned)) {
      let replaced = false;
      cleaned = cleaned.replace(new RegExp(inlineMarkerPattern.source, 'gi'), () => {
        if (!replaced) {
          replaced = true;
          return targetPdfBlock;
        }
        return '';
      });
    } else {
      // 2. No inline marker found, place accurately according to specified position
      const desiredPos = pdfPosition || cleaned.match(/data-pdf-position=["']([^"']+)["']/i)?.[1] || 'end';
      if (desiredPos === 'after_desc_1' && /<!--\s*gp-section-2\s*-->/i.test(cleaned)) {
        cleaned = cleaned.replace(/<!--\s*gp-section-2\s*-->/i, `${targetPdfBlock}\n\n<!-- gp-section-2 -->`);
      } else if (desiredPos === 'after_desc_2' && /<!--\s*gp-section-3\s*-->/i.test(cleaned)) {
        cleaned = cleaned.replace(/<!--\s*gp-section-3\s*-->/i, `${targetPdfBlock}\n\n<!-- gp-section-3 -->`);
      } else if (desiredPos.startsWith('after_desc_') && /<!--\s*gp-section-\d+\s*-->/i.test(cleaned)) {
        const targetNum = parseInt(desiredPos.replace('after_desc_', ''), 10);
        const nextSecNum = targetNum + 1;
        const nextSecRegex = new RegExp(`<!--\\s*gp-section-${nextSecNum}\\s*-->`, 'i');
        if (nextSecRegex.test(cleaned)) {
          cleaned = cleaned.replace(nextSecRegex, `${targetPdfBlock}\n\n<!-- gp-section-${nextSecNum} -->`);
        } else {
          cleaned += `\n\n${targetPdfBlock}`;
        }
      } else {
        // Default: at the end of the article
        cleaned += `\n\n${targetPdfBlock}`;
      }
    }

    // 3. Clean up any leftover duplicate PDF elements to ensure PDF only appears ONCE
    if (hasPdfPages) {
      cleaned = cleaned
        .replace(/<div[^>]*class=["'][^"']*(?:gp-pdf-card|gp-pdf-card-v2|border-red-200|border-red-900|from-red-50|via-rose-50)[^"']*["'][\s\S]*?<\/a>\s*<\/div>/gi, '')
        .replace(/<div[^>]*class=["'][^"']*(?:gp-pdf-card|gp-pdf-card-v2)[^"']*["'][\s\S]*?<\/div>/gi, '');
    } else {
      cleaned = cleaned.replace(/<div[^>]*class=["'][^"']*gp-pdf-pages-viewer[^"']*["'][\s\S]*?<\/div>/gi, '');
    }
  } else {
    // No PDF attached: strip all residual PDF tags
    cleaned = cleaned
      .replace(/<div[^>]*class=["'][^"']*(?:gp-pdf-card|gp-pdf-card-v2|border-red-200|border-red-900|from-red-50|via-rose-50)[^"']*["'][\s\S]*?<\/a>\s*<\/div>/gi, '')
      .replace(/<div[^>]*class=["'][^"']*(?:gp-pdf-card|gp-pdf-card-v2)[^"']*["'][\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*data-pdf-url=["'][^"']*["'][\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*class=["'][^"']*gp-pdf-pages-viewer[^"']*["'][\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*class=["'][^"']*gp-pdf-inner[^"']*["'][\s\S]*?<\/div>/gi, '')
      .replace(/<a[^>]*class=["'][^"']*gp-pdf-btn[^"']*["'][\s\S]*?<\/a>/gi, '');
  }

  // Strip orphan standalone buttons
  cleaned = cleaned.replace(/<a[^>]*>[\s\S]*?(?:Download\s*PDF|Attached Official Document|Official Document \(PDF\)|Attached PDF|ડાઉનલોડ\s*PDF|ડાઉનલોડ|Download)[\s\S]*?<\/a>/gi, (match) => {
    if (match.includes('gp-pdf-btn') || match.includes('gp-x-btn') || match.includes('gp-pdf-card') || match.includes('gp-x-card')) return match;
    return '';
  });

  // Remove any leftover empty container divs
  cleaned = cleaned.replace(/<div[^>]*class=["'][^"']*(?:border-red-200|border-red-900|from-red-50|via-rose-50|gp-pdf-card)[^"']*["']>\s*<\/div>/gi, '');

  return cleaned.trim();
}

function stripArticleUtilityLines(rawHtml: string): string {
  if (!rawHtml) return '';
  const withoutHighlights = stripHighlightsBlock(rawHtml);
  return withoutHighlights
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

    const safeImgUrl = sanitizeImageUrl(cleanUrl); return `<figure class="my-6 space-y-2"><div class="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-neutral-950 shadow-sm"><img src="${safeImgUrl}" alt="" aria-hidden="true" class="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-60 dark:opacity-40 pointer-events-none" /><div class="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-md pointer-events-none" aria-hidden="true"></div><img src="${safeImgUrl}" alt="${cleanAlt || titleText || 'Gujarat Post Image'}" class="relative z-10 w-full h-full object-contain" style="object-fit: contain; object-position: center;" /></div>${caption}</figure>`;
  });
}

function parseArticleBodyBlocks(rawBody: string, language?: string, articlePdfUrl?: string): string[] {
  if (!rawBody) return [];

  let cleaned = stripHighlightsBlock(normalizeArticleMarkdown(upgradeEmbedCards(rawBody, language, articlePdfUrl)))
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
  initialLanguage?: Language;
}

// Helper: Format Instagram URL or embed code to Embed iframe URL
function getInstagramEmbedUrl(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const iframeSrcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) return iframeSrcMatch[1];
  const permalinkMatch = trimmed.match(/data-instgrm-permalink=["']([^"']+)["']/i);
  if (permalinkMatch && permalinkMatch[1]) return getInstagramEmbedUrl(permalinkMatch[1]);
  const igMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv)\/([a-zA-Z0-9_-]+)/i);
  if (igMatch && igMatch[1]) {
    const isReel = trimmed.includes('/reel/') || trimmed.includes('/reels/');
    return `https://www.instagram.com/${isReel ? 'reel' : 'p'}/${igMatch[1]}/embed/`;
  }
  if (trimmed.includes('instagram.com') && trimmed.includes('/embed')) return trimmed;
  return trimmed;
}

// Helper: Format Facebook URL or embed code to Embed iframe URL
function getFacebookEmbedUrl(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const iframeSrcMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) return iframeSrcMatch[1].replace(/&amp;/g, '&');
  if (trimmed.includes('facebook.com/plugins/post.php') || trimmed.includes('facebook.com/plugins/video.php')) return trimmed.replace(/&amp;/g, '&');
  const isVideo = /watch|video|reel|fb\.watch/i.test(trimmed);
  const endpoint = isVideo ? 'https://www.facebook.com/plugins/video.php' : 'https://www.facebook.com/plugins/post.php';
  return `${endpoint}?href=${encodeURIComponent(trimmed)}&show_text=true&width=500`;
}

function getReadableArticleCandidates(root: HTMLElement): HTMLElement[] {
  const candidates: HTMLElement[] = [];
  const h1Elem = root.querySelector<HTMLElement>('h1');
  if (h1Elem) candidates.push(h1Elem);

  const subElem = root.querySelector<HTMLElement>('.article-sub');
  if (subElem) {
    const subParas = Array.from(subElem.querySelectorAll<HTMLElement>('p, li'));
    if (subParas.length > 0) {
      subParas.forEach((p) => {
        if ((p.textContent || '').trim().length > 3) candidates.push(p);
      });
    } else if ((subElem.textContent || '').trim().length > 3) {
      candidates.push(subElem);
    }
  }

  const gistItems = Array.from(root.querySelectorAll<HTMLElement>('.article-gist-item'));
  for (const g of gistItems) {
    if ((g.textContent || '').trim().length > 3 && !candidates.includes(g)) {
      candidates.push(g);
    }
  }

  // Support both p and div paragraphs inside .article-body
  const bodyElems = Array.from(
    root.querySelectorAll<HTMLElement>(
      '.article-body p, .article-body > div, .article-body > p, .article-body li, .article-body blockquote, .article-body h2, .article-body h3'
    )
  );

  for (const el of bodyElems) {
    if (
      !candidates.includes(el) &&
      el !== h1Elem &&
      el !== subElem &&
      !subElem?.contains(el) &&
      !el.closest('.byline') &&
      !el.closest('.art-kick') &&
      !el.closest('figure') &&
      !el.closest('.gp-pdf-card') &&
      !el.closest('.also-pan-vacho') &&
      !el.querySelector('p, div, blockquote, figure') // Leaf block elements only
    ) {
      const text = (el.textContent || '').trim();
      if (text.length > 3) {
        candidates.push(el);
      }
    }
  }

  return candidates;
}

function findMatchingCandidate(
  candidates: HTMLElement[],
  activeElemIndex: number,
  chunkText: string,
  rawChunk: string
): HTMLElement | null {
  if (!candidates || candidates.length === 0) return null;

  // 1. Direct index check (100% exact since speechItems is built directly in visual document order)
  if (activeElemIndex >= 0 && activeElemIndex < candidates.length) {
    return candidates[activeElemIndex];
  }

  // 2. Text search fallback if activeElemIndex was out of bounds
  const norm = (s: string) => (s || '').replace(/[\s.,?!।:;'"“”\-–—#*•’‘]/g, '').toLowerCase();
  const searchNorm = norm(chunkText || rawChunk || '');
  if (searchNorm.length >= 6) {
    const p10 = searchNorm.slice(0, Math.min(10, searchNorm.length));
    const p20 = searchNorm.slice(0, Math.min(20, searchNorm.length));
    const mid12 = searchNorm.length > 20 ? searchNorm.slice(8, 20) : '';

    for (const c of candidates) {
      const cNorm = norm(c.textContent || '');
      if (cNorm.includes(p20) || cNorm.includes(p10) || (mid12 && cNorm.includes(mid12))) {
        return c;
      }
    }
  }

  return null;
}

function splitArticleContent(html: string, atPara = 2): [string, string] {
  if (!html || typeof html !== 'string') return ['', ''];
  const trimmed = html.trim();
  if (trimmed.length < 350) return [trimmed, ''];

  let count = 0;
  let splitIndex = -1;
  let depth = 0;

  const tagRegex = /<(\/)?([a-z0-9]+)(?:\s+[^>]*)?>/gi;
  let lastBlockEnd = -1;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(trimmed)) !== null) {
    const isClosing = Boolean(match[1]);
    const tagName = match[2].toLowerCase();
    const tagEnd = match.index + match[0].length;

    if (['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName)) {
      continue;
    }

    if (['div', 'blockquote', 'figure', 'table', 'ul', 'ol', 'section'].includes(tagName)) {
      if (isClosing) {
        if (depth > 0) depth--;
        if (depth === 0) {
          count++;
          lastBlockEnd = tagEnd;
          if (count >= atPara && tagEnd >= 180) {
            splitIndex = tagEnd;
            break;
          }
        }
      } else {
        depth++;
      }
    } else if (tagName === 'p') {
      if (isClosing && depth === 0) {
        count++;
        lastBlockEnd = tagEnd;
        if (count >= atPara && tagEnd >= 180) {
          splitIndex = tagEnd;
          break;
        }
      }
    }
  }

  if (splitIndex === -1) {
    if (count >= atPara && lastBlockEnd > 0 && lastBlockEnd < trimmed.length - 80) {
      splitIndex = lastBlockEnd;
    } else {
      return [balanceHtmlTags(trimmed), ''];
    }
  }

  return [balanceHtmlTags(trimmed.slice(0, splitIndex).trim()), balanceHtmlTags(trimmed.slice(splitIndex).trim())];
}

export default function NewsDetailClient({ article, related, trending, articleUrl, initialLanguage }: Props) {
  const { language } = useApp();
  const router = useRouter();
  const { isApk } = useIsApk();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef(false);
  const [swipeFeedback, setSwipeFeedback] = useState<'left' | 'right' | null>(null);

  // Prefetch adjacent articles in APK mode safely after router initialization
  useEffect(() => {
    if (!isApk) return;
    const nextArt = related?.[0] || trending?.[0];
    const otherArt = related?.[1] || trending?.[1];

    const timer = setTimeout(() => {
      try {
        if (nextArt?.slug) router.prefetch(`/news/${nextArt.slug}`);
        if (otherArt?.slug) router.prefetch(`/news/${otherArt.slug}`);
      } catch {
        // Guard against premature Next.js router actions during early hydration
      }
    }, 1500);

    return () => clearTimeout(timer);
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
            try {
              router.push(`/news/${targetArticle.slug}`);
            } catch {
              window.location.href = `/news/${targetArticle.slug}`;
            }
          }
        } else {
          // Swiped left (Right-to-left slice)
          const targetArticle = related?.[1] || related?.[0] || trending?.[0];
          if (targetArticle?.slug) {
            setSwipeFeedback('left');
            try {
              router.push(`/news/${targetArticle.slug}`);
            } catch {
              window.location.href = `/news/${targetArticle.slug}`;
            }
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
  const [activeSpeechText, setActiveSpeechText] = useState('');
  const [activeSpeechRawText, setActiveSpeechRawText] = useState('');
  const [activeSpeechIndex, setActiveSpeechIndex] = useState(-1);
  const [activeSpeechElemIndex, setActiveSpeechElemIndex] = useState(-1);
  const [totalSpeechChunks, setTotalSpeechChunks] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [adSlide, setAdSlide] = useState(0);
  const [relatedLimit, setRelatedLimit] = useState(8);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [sidebarMoreRecommended, setSidebarMoreRecommended] = useState(false);
  const isRecommendedExpanded = isContentExpanded || sidebarMoreRecommended;

  const [mostReadArticles, setMostReadArticles] = useState<typeof trending>(trending.slice(0, 10));

  // Mounted guard: prevents language-dependent SSR/client HTML mismatch
  useEffect(() => { setMounted(true); }, []);

  // Fetch hero-settings to get the same Most Read list as the home screen
  useEffect(() => {
    getHeroSettings().then((heroRes: any) => {
      const customMostRead: typeof trending = (heroRes?.mostReadArticles || []).filter(Boolean);
      if (customMostRead.length > 0) {
        setMostReadArticles(customMostRead.slice(0, 10));
      } else {
        setMostReadArticles(trending.slice(0, 10));
      }
    }).catch(() => {
      setMostReadArticles(trending.slice(0, 10));
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

    let cleaned = stripHighlightsBlock(normalizeArticleMarkdown(upgradeEmbedCards(body, language, (article as any)?.pdfUrl || (article as any)?.pdf, hasPdfPages, (article as any)?.pdfPosition)))
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

    // Collapse multiple nested generic blockquotes (preserve twitter-tweet and instagram-media embeds)
    cleaned = cleaned
      .replace(/(<blockquote(?![^>]*class=["'][^"']*(?:twitter-tweet|instagram-media)[^"']*)[^>]*>\s*)+/gi, '<blockquote class="my-6 border-l-[3px] border-[#B3121B] pl-4 py-1 font-sans font-bold text-neutral-900 dark:text-white">')
      .replace(/(?<!<blockquote[^>]*>)(\s*<\/blockquote>)+/gi, '</blockquote>');

    // Auto-link standalone plain URLs in text (safely skipping HTML tags, attributes, and existing <a> tags)
    cleaned = cleaned.replace(/(<a\b[^>]*>[\s\S]*?<\/a>)|(<[^>]+>)|(^|[\s(])(https?:\/\/[^\s<"']+)/gi, (match, aTag, anyTag, prefix, url) => {
      if (aTag || anyTag) return match;
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
    if (twUrl && twUrl.trim() && !cleaned.includes('data-gp-x-link') && !cleaned.includes('data-article-social-platform="twitter"') && !cleaned.includes('x.com/') && !cleaned.includes('twitter.com/')) {
      cleaned += buildTwitterCardHtml(twUrl.trim(), language);
    }

    // Append Instagram embed if set on article object and not already present in body HTML
    const igUrl = (article as any).instagramUrl || (article as any).instagram;
    if (igUrl && igUrl.trim() && !cleaned.includes('instagram.com/')) {
      const igEmbed = getInstagramEmbedUrl(igUrl.trim());
      if (igEmbed) {
        cleaned += `<div class="my-6 mx-auto max-w-[540px] w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-md bg-white dark:bg-zinc-900"><iframe src="${igEmbed}" class="w-full min-h-[540px] border-0" allowtransparency="true" allowfullscreen="true" frameborder="0" scrolling="no"></iframe></div>`;
      }
    }

    // Append Facebook embed if set on article object and not already present in body HTML
    const fbUrl = (article as any).facebookUrl || (article as any).facebook;
    if (fbUrl && fbUrl.trim() && !cleaned.includes('facebook.com/plugins')) {
      const fbEmbed = getFacebookEmbedUrl(fbUrl.trim());
      if (fbEmbed) {
        cleaned += `<div class="my-6 mx-auto max-w-[540px] w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-md bg-white dark:bg-zinc-900"><iframe src="${fbEmbed}" class="w-full min-h-[460px] border-0" allowfullscreen="true" frameborder="0" scrolling="no" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe></div>`;
      }
    }

    // Clean empty spacer divs and empty paragraphs (safely preserving gp-pdf-pages-viewer and embed containers)
    cleaned = cleaned
      .replace(/<div\b(?![^>]*(?:gp-pdf-pages-viewer|data-pdf-url))[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/div>/gi, '')
      .replace(/<p\b[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/p>/gi, '');

    // Convert paragraph-level <div> into proper <p class="article-para my-3"> elements (excluding special widgets)
    cleaned = cleaned.replace(/<div\b([^>]*)>([\s\S]*?)<\/div>/gi, (match, attrs, inner) => {
      if (/<(div|blockquote|figure|table|iframe|hr|h[1-6]|ul|ol)\b/i.test(inner)) {
        return match;
      }
      if (/class=["'][^"']*(?:gp-pdf|twitter|instagram|facebook|aspect-video)/i.test(attrs) || /data-pdf-url/i.test(attrs)) {
        return match;
      }
      const plain = inner.replace(/<[^>]*>/g, '').trim();
      if (!plain) return '';
      return `<p class="article-para my-3"${attrs}>${inner}</p>`;
    });

    // Ensure all plain text paragraphs are properly wrapped in <p> elements
    const rawBlocks = cleaned.split(/\n\s*\n+/);
    const wrappedBlocks = rawBlocks.map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(p|div|blockquote|figure|h[1-6]|ul|ol|table|iframe|hr)\b/i.test(trimmed)) {
        return trimmed;
      }
      return `<p class="article-para my-3">${trimmed}</p>`;
    });
    cleaned = wrappedBlocks.filter(Boolean).join('\n\n');
    return cleaned;
  }, [body, title, language, article, hasPdfPages]);

  const gistPoints = useMemo(() => {
    const rawContent = getArticleContent(article, language) || article.content || (article as any).contentGu || (article as any).contentHi || '';
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
        .replace(/\s+/g, ' ')
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
        (trimmed.startsWith('##') && trimmed.includes('📌'))
      ) {
        insideHighlights = true;
        continue;
      }

      if (insideHighlights) {
        if (trimmed.startsWith('---') || trimmed.startsWith('***') || /^[-*—_]{3,}$/.test(trimmed)) {
          if (points.length > 0) {
            insideHighlights = false;
            break;
          }
          continue;
        }
        if (trimmed.startsWith('##') || trimmed.startsWith('<!--') || trimmed.startsWith('>')) {
          insideHighlights = false;
          break;
        }
        const cleaned = cleanStr(trimmed);
        if (cleaned.length > 3 && !points.includes(cleaned)) {
          points.push(cleaned);
        }
      }
    }

    // Explicit highlights from article object if not in body markdown
    if (points.length === 0) {
      const explicitHl = (language === 'gu' ? (article as any).highlightsGu : language === 'hi' ? (article as any).highlightsHi : (article as any).highlights) || (article as any).highlightsGu || (article as any).highlights;
      if (Array.isArray(explicitHl)) {
        for (const item of explicitHl) {
          const c = cleanStr(String(item));
          if (c.length > 3 && !points.includes(c)) points.push(c);
        }
      } else if (typeof explicitHl === 'string' && explicitHl.trim()) {
        const itemLines = explicitHl.split(/\r?\n/);
        for (const l of itemLines) {
          const c = cleanStr(l);
          if (c.length > 3 && !points.includes(c)) points.push(c);
        }
      }
    }

    // If only 1 point was found and it matches rawExcerpt or rawTitle (legacy fallback artifact), do not show it
    if (points.length === 1) {
      const cleanTitle = cleanStr(rawTitle);
      const cleanExcerpt = cleanStr(rawExcerpt);
      if (cleanStr(points[0]) === cleanExcerpt || cleanStr(points[0]) === cleanTitle) {
        return [];
      }
    }

    return points.slice(0, 10);
  }, [rawTitle, rawExcerpt, article, language]);

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
    const alreadyShownIds = new Set<string>([
      mainId,
      ...readAlsoPool.map((a) => String(a.id)),
    ]);

    // Also exclude articles that are displayed in RelatedStoriesSection (up to relatedLimit)
    const remainingRelated = (related || []).filter((item) => !alreadyShownIds.has(String(item.id)));
    const shownInRelated = remainingRelated.slice(0, relatedLimit);
    shownInRelated.forEach((a) => alreadyShownIds.add(String(a.id)));

    // Stream list should continue with the next related articles, then trending if needed, without repeating
    const pool = [...remainingRelated.slice(relatedLimit), ...(trending || [])];
    return pool
      .filter((item, index, self) => !alreadyShownIds.has(String(item.id)) && self.findIndex(t => String(t.id) === String(item.id)) === index)
      .slice(0, 8);
  }, [related, trending, article.id, readAlsoPool, relatedLimit]);

  const sidebarRecommendedPool = useMemo(() => {
    const mainId = String(article.id);
    const excludeIds = new Set([mainId, ...streamList.map(a => String(a.id))]);

    // Priority State & National top headline categories
    const priorityCatKeywords = ['gujarat', 'india', 'world', 'politics', 'business', 'ગુજરાત', 'ભારત', 'વિશ્વ', 'રાજનીતિ', 'વેપાર'];

    // Helper to identify health category articles (strictly excluded ONLY from this right sidebar)
    const isHealthArticle = (cand: any): boolean => {
      if (!cand) return false;
      const catSlug = String(
        cand.category ||
        cand.categorySlug ||
        cand.category?.slug ||
        cand.category?.name ||
        ''
      ).toLowerCase().trim();

      if (catSlug === 'health' || catSlug.includes('health') || catSlug.includes('હેલ્થ') || catSlug.includes('સ્વાસ્થ્ય')) {
        return true;
      }

      if (Array.isArray(cand.categories)) {
        for (const c of cand.categories) {
          const cSlug = String(c?.category?.slug || c?.category?.name || c?.slug || c?.name || '').toLowerCase().trim();
          if (cSlug === 'health' || cSlug.includes('health') || cSlug.includes('હેલ્થ') || cSlug.includes('સ્વાસ્થ્ય')) {
            return true;
          }
        }
      }

      return false;
    };

    // Gather candidate articles excluding main article, all stream articles, and health category articles
    const pool = [...trending, ...related, ...mostReadArticles].filter(
      (item, index, self) =>
        !excludeIds.has(String(item.id)) &&
        !isHealthArticle(item) &&
        self.findIndex(t => String(t.id) === String(item.id)) === index
    );

    // Filter for State & National top headlines first
    const stateNationalCandidates = pool.filter(cand => {
      const cat = String(cand.category || '').toLowerCase().trim();
      return priorityCatKeywords.some(kw => cat.includes(kw) || kw.includes(cat));
    });

    // Combine priority State & National candidates first, filled with other articles from pool
    const poolToUse = [...stateNationalCandidates, ...pool.filter(cand => !stateNationalCandidates.includes(cand))];

    // Group by category to favor category variety in sidebar
    const byCategory = new Map<string, Article>();
    for (const cand of poolToUse) {
      const cat = String(cand.category || '').toLowerCase().trim();
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

  const startAudio = useCallback((langToUse: Language = language) => {
    stopArticleAudio();
    setIsContentExpanded(true); // Automatically expand so reader can see highlighted text
    setSpeaking(true);

    const directTitle = getArticleTitle(article, langToUse) || article.title || '';
    const directExcerpt = (article.excerpt || (article as any).excerptGu || (article as any).excerptHi || '');
    const directBody = getArticleContent(article, langToUse) || (article as any).content || '';

    const speechTitle = (langToUse === language && title) ? title : directTitle;
    const speechExcerpt = (langToUse === language && excerpt) ? excerpt : directExcerpt;
    const speechBody =
      (langToUse === language && body && body.trim().length > 10 ? body : '') ||
      (directBody && directBody.trim().length > 10 ? directBody : '') ||
      (article as any).contentGu ||
      (article as any).contentHi ||
      (article as any).content ||
      '';

    // Build complete speech items in exact visual document order:
    // 0: Heading (Title)
    // 1: Subheading (Excerpt)
    // 2..K: Highlights (All points)
    // K..N: All Body Paragraphs (First to Last)
    const root = articleContainerRef.current;
    const domCandidates = root ? getReadableArticleCandidates(root) : [];

    const speechItems: { text: string; elemIndex: number }[] = [];

    // Count how many readable body candidates exist in the DOM
    const bodyCandidates = domCandidates.filter(
      (el) => el.closest('.article-body') || el.classList.contains('article-para')
    );

    // Prioritize direct DOM candidates if both headings and body candidates are ready
    if (domCandidates.length > 0 && bodyCandidates.length > 0) {
      domCandidates.forEach((el, idx) => {
        const t = cleanTextForSpeech(el.textContent || '');
        if (t.length > 2) {
          speechItems.push({ text: t, elemIndex: idx });
        }
      });
    }

    // Fallback if DOM candidates were not ready yet
    if (speechItems.length === 0) {
      let elemIdxCounter = 0;
      const cleanTitle = cleanTextForSpeech(speechTitle);
      if (cleanTitle) speechItems.push({ text: cleanTitle, elemIndex: elemIdxCounter++ });

      const cleanSub = cleanTextForSpeech(speechExcerpt);
      if (cleanSub && cleanSub !== cleanTitle) speechItems.push({ text: cleanSub, elemIndex: elemIdxCounter++ });

      if (gistPoints && Array.isArray(gistPoints)) {
        for (const pt of gistPoints) {
          const cleanPt = cleanTextForSpeech(pt);
          if (cleanPt && cleanPt.length > 2) speechItems.push({ text: cleanPt, elemIndex: elemIdxCounter++ });
        }
      }

      const bodyParagraphs = (displayParagraphs && displayParagraphs.length > 0)
        ? displayParagraphs
        : parseArticleBodyBlocks(speechBody, langToUse, (article as any)?.pdfUrl || (article as any)?.pdf);

      if (bodyParagraphs && bodyParagraphs.length > 0) {
        for (const p of bodyParagraphs) {
          const cleanP = cleanTextForSpeech(p);
          if (cleanP && cleanP.length > 3) speechItems.push({ text: cleanP, elemIndex: elemIdxCounter++ });
        }
      }
    }

    playArticleAudio({
      title: speechTitle,
      items: speechItems.length > 0 ? speechItems : undefined,
      subheading: speechExcerpt,
      excerpt: speechExcerpt,
      highlights: gistPoints,
      body: speechBody,
      language: langToUse,
      onStart: () => setSpeaking(true),
      onChunkChange: (idx, chunkText, total, elemIdx, rawChunk) => {
        setActiveSpeechIndex(idx);
        setActiveSpeechText(chunkText);
        setActiveSpeechRawText(rawChunk || chunkText);
        setActiveSpeechElemIndex(typeof elemIdx === 'number' && elemIdx >= 0 ? elemIdx : idx);
        setTotalSpeechChunks(total);
      },
      onEnd: () => {
        setSpeaking(false);
        setActiveSpeechIndex(-1);
        setActiveSpeechElemIndex(-1);
        setActiveSpeechText('');
        setActiveSpeechRawText('');
      },
      onError: () => {
        setSpeaking(false);
        setActiveSpeechIndex(-1);
        setActiveSpeechElemIndex(-1);
        setActiveSpeechText('');
        setActiveSpeechRawText('');
      },
    });
  }, [article, language, title, excerpt, gistPoints, body, displayParagraphs]);

  const toggleAudio = useCallback(() => {
    if (speaking) {
      stopArticleAudio();
      setSpeaking(false);
      setActiveSpeechIndex(-1);
      setActiveSpeechElemIndex(-1);
      setActiveSpeechText('');
      setActiveSpeechRawText('');
      return;
    }
    startAudio(language);
  }, [speaking, startAudio, language]);

  // If user switches language while audio is active, seamlessly re-speak in the new language without reload!
  useEffect(() => {
    lastSpeechElemIndex.current = 0;
    if (speaking) {
      stopArticleAudio();
      const timer = setTimeout(() => {
        startAudio(language);
      }, 80);
      return () => clearTimeout(timer);
    } else {
      setActiveSpeechIndex(-1);
      setActiveSpeechElemIndex(-1);
      setActiveSpeechText('');
      setActiveSpeechRawText('');
    }
  }, [language]);

  const articleContainerRef = useRef<HTMLElement>(null);
  const lastSpeechElemIndex = useRef(0);

  // Directly highlight current spoken sentence in RED in the article itself!
  useEffect(() => {
    const root = articleContainerRef.current;
    if (!root) return;

    // 1. Remove previous active speech highlights
    const prevActiveItems = root.querySelectorAll('[data-gp-speech-active="true"]');
    prevActiveItems.forEach((el) => {
      el.removeAttribute('data-gp-speech-active');
      const htmlEl = el as HTMLElement;
      htmlEl.style.borderLeft = '';
      htmlEl.style.borderBottom = '';
      htmlEl.style.backgroundColor = '';
      htmlEl.style.color = '';
      htmlEl.style.paddingLeft = '';
      htmlEl.style.paddingRight = '';
      htmlEl.style.paddingTop = '';
      htmlEl.style.paddingBottom = '';
      htmlEl.style.borderRadius = '';
      htmlEl.style.boxShadow = '';
    });

    const h1Elem = root.querySelector<HTMLElement>('h1');
    if (h1Elem) {
      h1Elem.removeAttribute('data-gp-speech-active');
      h1Elem.style.borderBottom = '';
      h1Elem.style.color = '';
      h1Elem.style.backgroundColor = '';
    }

    if (!speaking || activeSpeechElemIndex < 0) return;

    // 2. Match candidate element matching exact sentence or accurate element index
    const candidates = getReadableArticleCandidates(root);
    const bestElem = findMatchingCandidate(candidates, activeSpeechElemIndex, activeSpeechText, activeSpeechRawText);

    // 3. Highlight best matching element with the red line and background
    if (bestElem) {
      bestElem.setAttribute('data-gp-speech-active', 'true');
      if (bestElem.tagName === 'H1') {
        bestElem.style.borderBottom = '4px solid #B3121B';
        bestElem.style.color = '#B3121B';
        bestElem.style.backgroundColor = 'rgba(179, 18, 27, 0.05)';
      } else {
        bestElem.style.borderLeft = '4px solid #B3121B';
        bestElem.style.backgroundColor = 'rgba(179, 18, 27, 0.08)';
        bestElem.style.color = '#B3121B';
        bestElem.style.paddingLeft = '14px';
        bestElem.style.paddingRight = '8px';
        bestElem.style.paddingTop = '4px';
        bestElem.style.paddingBottom = '4px';
        bestElem.style.borderRadius = '0 6px 6px 0';
        bestElem.style.boxShadow = '0 1px 3px rgba(179, 18, 27, 0.12)';
        bestElem.style.transition = 'all 0.2s ease-in-out';
      }
      bestElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [speaking, activeSpeechElemIndex, activeSpeechText, activeSpeechRawText]);

  // Clean up and stop playing audio whenever article changes or component unmounts
  useEffect(() => {
    stopArticleAudio();
    setSpeaking(false);
    setActiveSpeechIndex(-1);
    setActiveSpeechText('');

    const onGlobalStop = () => {
      setSpeaking(false);
      setActiveSpeechIndex(-1);
      setActiveSpeechText('');
    };
    window.addEventListener('gp-tts-stop', onGlobalStop);

    return () => {
      stopArticleAudio();
      window.removeEventListener('gp-tts-stop', onGlobalStop);
    };
  }, [article.id, article.slug]);

  const shareLinks = [
    {
      label: 'Facebook',
      href: getFacebookShareHref(articleUrl),
      icon: (className: string) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
      style: 'bg-[#1877f2]/8 text-[#1877f2] border border-[#1877f2]/10 hover:bg-[#1877f2]/15'
    },
    {
      label: 'WhatsApp',
      href: getWhatsAppShareHref(articleUrl, title),
      icon: (className: string) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>,
      style: 'bg-[#25d366]/8 text-[#25d366] border border-[#25d366]/10 hover:bg-[#25d366]/15'
    },
    {
      label: 'X',
      href: getTwitterShareHref(articleUrl, title),
      icon: (className: string) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
      style: 'bg-black/[0.03] dark:bg-white/[0.03] text-foreground border border-foreground/10 hover:bg-black/[0.06] dark:hover:bg-white/[0.06]'
    },
    {
      label: 'Google News',
      href: 'https://news.google.com/search?q=gujaratpost&hl=gu-IN&gl=IN&ceid=IN%3Agu',
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
      'ahmedabad': { en: 'Ahmedabad', gu: '\u0a85\u0aae\u0aa6\u0abe\u0ab5\u0abe\u0aa6', hi: '\u0905\u0939\u092e\u0926\u093e\u092c\u093e\u0926' },
      'gandhinagar': { en: 'Gandhinagar', gu: '\u0a97\u0abe\u0a82\u0aa7\u0ac0\u0aa8\u0a97\u0ab0', hi: '\u0917\u093e\u0902\u0927\u0940\u0928\u0917\u0930' },
      'surat': { en: 'Surat', gu: '\u0ab8\u0ac1\u0ab0\u0aa4', hi: '\u0938\u0942\u0930\u0924' },
      'vadodara': { en: 'Vadodara', gu: '\u0ab5\u0aa1\u0acb\u0aa6\u0ab0\u0abe', hi: '\u0935\u0921\u094b\u0926\u0930\u093e' },
      'rajkot': { en: 'Rajkot', gu: '\u0ab0\u0abe\u0a9c\u0a95\u0acb\u0a9f', hi: '\u0930\u093e\u091c\u0915\u094b\u091f' },
      'bhavnagar': { en: 'Bhavnagar', gu: '\u0aad\u0abe\u0ab5\u0aa8\u0a97\u0ab0', hi: '\u092d\u093e\u0935\u0928\u0917\u0930' },
      'jamnagar': { en: 'Jamnagar', gu: '\u0a9c\u0abe\u0aae\u0aa8\u0a97\u0ab0', hi: '\u091c\u093e\u092e\u0928\u0917\u0930' },
      'junagadh': { en: 'Junagadh', gu: '\u0a9c\u0ac2\u0aa8\u0abe\u0a97\u0aa2', hi: '\u091c\u0942\u0928\u093e\u0917\u0922' },
      'kutch': { en: 'Kutch', gu: '\u0a95\u0a9a\u0acd\u0a9b', hi: '\u0915\u091a\u094d\u091b' },
      'anand': { en: 'Anand', gu: '\u0a86\u0aa3\u0a82\u0aa6', hi: '\u0906\u0923\u0902\u0926' },
      'gujarat': { en: 'Gujarat', gu: '\u0a97\u0ac1\u0a9c\u0ab0\u0abe\u0aa4', hi: '\u0917\u0941\u091c\u0930\u093e\u0924' },
      'national': { en: 'National', gu: '\u0aa6\u0ac7\u0ab6', hi: '\u0930\u093e\u0937\u094d\u091f\u094d\u0930\u0940\u092f' }
    };
    const key = cleanLoc.toLowerCase();
    if (map[key]) {
      return uiLabel(lang, map[key]);
    }
    return cleanLoc;
  };

  const rawLocationDisplay = getLocationDisplay(article.location, language);
  const cityLocationLabel = rawLocationDisplay.toLowerCase() === category.toLowerCase() ? '' : rawLocationDisplay;

  const publishedFormatted = formatArticleDateTime(article.publishedAt || (article as any).createdAt);
  const updatedFormatted = formatArticleDateTime(article.updatedAt || article.publishedAt || (article as any).createdAt);

  return (
    <>
      <ReadingProgressBar />
      <div className="wrap w-full max-w-[1240px] mx-auto px-3 sm:px-5 lg:px-6 py-2 overflow-x-clip">
        <div key={`${article.id}-${language}`} className="article-grid" suppressHydrationWarning>
          <article ref={articleContainerRef} suppressHydrationWarning>
            <nav data-nosnippet="true" className="breadcrumb select-none flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-neutral-500 font-medium">
              <Link href="/" className="hover:text-[var(--red)] transition-colors">
                {uiLabel(language, { en: 'Home', gu: 'હોમ', hi: 'होम' })}
              </Link>
              <span>/</span>
              <Link href={`/category/${article.category.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-[var(--red)] transition-colors">
                {category}
              </Link>
              {cityLocationLabel && (
                <>
                  <span>/</span>
                  <span>{cityLocationLabel}</span>
                </>
              )}
              <span>/</span>
              <span className="text-neutral-700 dark:text-neutral-300 font-normal">
                <AutoArticleBreadcrumbTitle article={article} />
              </span>
            </nav>

            <div data-nosnippet="true" className="mb-3 flex flex-wrap items-center gap-2">
              <div className="art-kick">
                <span className="bar"></span>
                <span>{category}{cityLocationLabel ? ` · ${cityLocationLabel}` : ''}</span>
              </div>
              {article.isBreaking && <span className="live-badge rounded bg-accent px-2 py-1 text-xs font-black text-white ml-2">BREAKING</span>}
            </div>

            <h1 className={`article-title transition-all duration-200 ${speaking && activeSpeechIndex === 0 ? 'text-[#B3121B] dark:text-red-400 font-black border-b-4 border-[#B3121B] pb-1.5' : ''}`}>
              {title}
            </h1>
            <div
              className="article-sub [&_b]:font-extrabold [&_strong]:font-extrabold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through [&_iframe]:w-full [&_iframe]:rounded-xl [&_iframe]:shadow-md [&_video]:w-full [&_video]:rounded-xl [&_figure]:my-4 [&_figure]:w-full [&_figure]:flex [&_figure]:justify-center"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: excerpt }}
            />

            <div data-nosnippet="true" className="byline select-none">
              <div className="flex items-center gap-[11px]">
                <Link href={`/author/${article.author.id}`} aria-label="Gujarat Post" className="shrink-0 w-[38px] h-[38px] rounded-full bg-white flex items-center justify-center hover:opacity-90 transition-opacity overflow-hidden border border-[#B3121B]/20 shadow-xs">
                  <Image src="/logo.png" alt="Gujarat Post" width={38} height={38} className="h-full w-full object-contain p-0.5" />
                </Link>
                <div>
                  <div className="text-[13.5px] leading-tight">
                    <span className="text-[var(--ink-2)]">Published by: </span>
                    <Link href={`/author/${article.author.id}`} className="font-bold text-[var(--red)] hover:underline">
                      {authorName}
                    </Link>
                  </div>
                  {publishedFormatted && (
                    <div className="text-[12px] text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1" suppressHydrationWarning>
                      <span>
                        <span className="font-medium text-neutral-600 dark:text-neutral-300">Published on:</span>{' '}
                        {publishedFormatted}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[12.5px] text-[var(--ink-2)]">
                  ⏱ {language === 'gu' ? `વાંચન સમય: ${article.readingTime || 3} મિનિટ` : language === 'hi' ? `पठन समय: ${article.readingTime || 3} मिनट` : `Read time: ${article.readingTime || 3} mins`}
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
              <div className="article-gist-container my-2 rounded-r-xl border-l-4 border-[#B3121B] bg-neutral-50 dark:bg-neutral-900/60 p-4 shadow-sm">
                <div className="flex items-center gap-2 font-black text-[#B3121B] text-base mb-3 select-none">
                  <span className="text-[#B3121B] font-bold text-sm">♦</span>
                  <span>{uiLabel(language, { en: 'At a Glance', gu: 'એક નજરમાં', hi: 'एक नजर में' })}</span>
                </div>
                <ul className="space-y-2.5 text-[15px] sm:text-[15.5px] font-semibold text-neutral-800 dark:text-neutral-200">
                  {gistPoints.map((point, index) => (
                    <li key={index} className="article-gist-item flex items-start gap-2.5">
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
              <div className="imgwrap relative aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-neutral-950 rounded-lg shadow-sm group">
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
                        <>
                          {/* Ambient blurred backdrop for letterbox areas */}
                          <img
                            src={sanitizeImageUrl(src) || '/assets/placeholder.jpg'}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-60 dark:opacity-40 pointer-events-none"
                          />
                          {/* Light / Dark tint wash overlay */}
                          <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-md pointer-events-none" aria-hidden="true" />

                          <Image
                            src={sanitizeImageUrl(src) || '/assets/placeholder.jpg'}
                            alt={`${article.title} slide ${index + 1}`}
                            fill
                            unoptimized={true}
                            sizes="(max-width: 1024px) 100vw, 66vw"
                            className="relative z-10 object-contain"
                            style={{ objectFit: 'contain', objectPosition: 'center' }}
                            loading={index === 0 ? 'eager' : 'lazy'}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src && !target.src.includes('placehold.co')) {
                                target.src = 'https://placehold.co/800x500/e2e8f0/94a3b8?text=Gujarat+Post';
                              }
                            }}
                          />
                        </>
                      )}
                    </div>
                  );
                })}

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
              subheading={excerpt}
              excerpt={excerpt}
              body={body}
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
              const [topHtml, bottomHtml] = splitArticleContent(formattedArticleBodyHtml, 2);
              const isExpandedState = isContentExpanded || speaking;
              const hasSplit = Boolean(bottomHtml);

              // Render HTML block with inline ArticlePdfPagesViewer wherever gp-pdf-pages-viewer marker appears
              const renderContentSection = (htmlBlock: string) => {
                if (!htmlBlock) return null;
                if (!hasPdfPages || !pdfDocumentUrl || !htmlBlock.includes('gp-pdf-pages-viewer')) {
                  return <ArticleContentBody html={htmlBlock} activeSpeechText={activeSpeechText} />;
                }

                const parts = htmlBlock.split(/(?:<div[^>]*class=["'][^"']*gp-pdf-pages-viewer[^"']*["'][^>]*>\s*<\/div>|<div[^>]*class=["'][^"']*gp-pdf-pages-viewer[^"']*["'][^>]*\/>)/i);
                if (parts.length <= 1) {
                  return <ArticleContentBody html={htmlBlock} activeSpeechText={activeSpeechText} />;
                }

                return (
                  <>
                    {parts.map((part, pIdx) => (
                      <Fragment key={pIdx}>
                        {part && part.trim() ? (
                          <ArticleContentBody html={part} activeSpeechText={activeSpeechText} />
                        ) : null}
                        {pIdx < parts.length - 1 && (
                          <ArticlePdfPagesViewer
                            pdfUrl={pdfDocumentUrl}
                            language={language}
                            title={language === 'gu' ? 'સંદર્ભિત સત્તાવાર PDF દસ્તાવેજ' : language === 'hi' ? 'संलग्न आधिकारिकપીડીએફ દસ્તાવેજ' : 'Attached Official Document (PDF)'}
                          />
                        )}
                      </Fragment>
                    ))}
                  </>
                );
              };

              return (
                <div className="relative" suppressHydrationWarning>
                  {renderContentSection(hasSplit ? topHtml : formattedArticleBodyHtml)}

                  {hasSplit && (
                    <>
                      {/* IN_ARTICLE Ad Banner displayed inside description */}
                      <AdSectionBanner section="IN_ARTICLE" className="my-6" />

                      {!isExpandedState && (
                        <div className="relative pt-2 pb-2" suppressHydrationWarning>
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
                              className="group inline-flex items-center gap-2.5 px-9 py-3.5 rounded-full bg-[#B3121B] hover:bg-red-700 text-white shadow-xl shadow-red-900/30 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer select-none border-2 border-white/20"
                            >
                              <span className="text-lg md:text-xl font-black tracking-wide leading-none">
                                {uiLabel(language, { en: 'Read More', gu: 'વધુ વાંચો', hi: 'और पढ़ें' })}
                              </span>
                              <ChevronDown className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-0.5 stroke-[3]" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <div className={hasSplit && !isExpandedState ? 'hidden' : 'space-y-4 transition-all duration-500 ease-in-out'} suppressHydrationWarning>
                    {hasSplit && isExpandedState && (
                      renderContentSection(bottomHtml)
                    )}

                    {/* Full PDF Page-by-Page Document Viewer (fallback if marker was not inside the body html) */}
                    {hasPdfPages && pdfDocumentUrl && !formattedArticleBodyHtml.includes('gp-pdf-pages-viewer') && (
                      <ArticlePdfPagesViewer
                        pdfUrl={pdfDocumentUrl}
                        language={language}
                        title={language === 'gu' ? 'સંદર્ભિત સત્તાવાર PDF દસ્તાવેજ' : language === 'hi' ? 'संलग्न आधिकारिकપીડીએફ દસ્તાવેજ' : 'Attached Official Document (PDF)'}
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
                    {hasSplit && (
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
                    )}
                  </div>
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

                {/* Mobile view (< md): Hero Section style list (1 more news added: 3 items) */}
                <div className="flex flex-col divide-y divide-border/60 md:hidden mt-3">
                  {sidebarRecommendedPool.slice(0, isRecommendedExpanded ? 8 : 3).map((item, index) => (
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
                        <div className="relative w-[108px] sm:w-[114px] h-[72px] sm:h-[76px] shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-neutral-900 shadow-xs self-start">
                          <img
                            src={getCardThumbnail(item, index)}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover scale-125 blur-xl opacity-60 dark:opacity-40 pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-xs pointer-events-none" aria-hidden="true" />
                          <Image
                            src={getCardThumbnail(item, index)}
                            alt={item.title || ''}
                            fill
                            sizes="114px"
                            className="relative z-10 object-contain transition-transform duration-300 group-hover:scale-105"
                            style={{ objectFit: 'contain', objectPosition: 'center' }}
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
                  href="https://www.whatsapp.com/channel/0029VaFFh7KIiRojqynnOX2N"
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
          excludeArticles={readAlsoPool}
          fallbackArticles={trending}
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
