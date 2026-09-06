'use client';

import React, { useEffect, useState } from 'react';
import { Language } from '@/types';

// ─── In-memory cache ──────────────────────────────────────────────────────────
const memoryCache: Record<string, string> = {};
const CACHE_PREFIX = 'gp_tr_v6';

// ─── In-flight deduplication: same key won't fire a second fetch ──────────────
const inFlight: Record<string, Promise<string>> = {};

// ─── Concurrency limiter: max 20 parallel translate requests ──────────────────
const MAX_CONCURRENT = 20;
let activeCount = 0;
const waitQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    waitQueue.push(() => {
      activeCount++;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeCount--;
  const next = waitQueue.shift();
  if (next) next();
}

function isBadCacheValue(val: string, original: string, targetLang: Language): boolean {
  if (!val || typeof val !== 'string' || !val.trim()) return true;
  const valTrimmed = val.trim();

  // If target is English, but value still contains Gujarati script, it's untranslated/bad cache!
  if (targetLang === 'en' && /[\u0A80-\u0AFF]/.test(valTrimmed)) {
    return true;
  }
  // If target is Hindi, but value still contains Gujarati script and no Devanagari, it's bad cache!
  if (targetLang === 'hi' && /[\u0A80-\u0AFF]/.test(valTrimmed) && !/[\u0900-\u097F]/.test(valTrimmed)) {
    return true;
  }
  return false;
}

function getPersistentCache(key: string): string | null {
  try {
    if (typeof window !== 'undefined') {
      const sessVal = sessionStorage.getItem(`${CACHE_PREFIX}_${key}`);
      if (sessVal) return sessVal;
      const localVal = localStorage.getItem(`${CACHE_PREFIX}_${key}`);
      if (localVal) return localVal;
    }
  } catch { }
  return null;
}

function setPersistentCache(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && value) {
      sessionStorage.setItem(`${CACHE_PREFIX}_${key}`, value);
      localStorage.setItem(`${CACHE_PREFIX}_${key}`, value);
    }
  } catch { }
}

/**
 * Translates text to the target language using the Google Translate API.
 * - Uses in-memory & persistent storage cache to avoid re-translating the same text.
 * - Deduplicates identical in-flight requests (same text + lang won't fetch twice).
 * - Limits to MAX_CONCURRENT parallel fetches to prevent API flooding.
 */
export async function translateOnFly(text: string, targetLang: Language): Promise<string> {
  if (!text || !text.trim()) return '';

  const trimmed = text.trim();

  // Handle HTML: extract plain text for translation
  const hasHtml = /<[a-z][\s\S]*>/i.test(trimmed);
  let textToTranslate = trimmed;
  if (hasHtml) {
    // Preserve complex multi-block HTML (figure/img/iframe/table) as-is
    if (
      trimmed.includes('<figure') ||
      trimmed.includes('<iframe') ||
      trimmed.includes('<img') ||
      trimmed.includes('<table')
    ) {
      return trimmed;
    }
    textToTranslate = trimmed.replace(/<[^>]*>/g, '').trim();
  }

  if (!textToTranslate) return trimmed;

  if (isAlreadyTargetLanguage(textToTranslate, targetLang)) return trimmed;

  const sourceLang = detectSourceLanguage(textToTranslate, targetLang);
  const cacheKey = `${sourceLang}:${targetLang}:${textToTranslate}`;

  // 1. Memory Cache hit
  if (memoryCache[cacheKey]) {
    const cached = memoryCache[cacheKey];
    if (!isBadCacheValue(cached, textToTranslate, targetLang)) {
      return hasHtml ? trimmed.replace(textToTranslate, cached) : cached;
    }
  }

  // 2. Persistent Storage Cache hit
  const persistent = getPersistentCache(cacheKey);
  if (persistent && !isBadCacheValue(persistent, textToTranslate, targetLang)) {
    memoryCache[cacheKey] = persistent;
    return hasHtml ? trimmed.replace(textToTranslate, persistent) : persistent;
  }

  // 3. Deduplicate: if already in-flight for this key, await the same promise
  if (cacheKey in inFlight) {
    const result = await inFlight[cacheKey];
    if (result && !isBadCacheValue(result, textToTranslate, targetLang)) {
      return hasHtml ? trimmed.replace(textToTranslate, result) : result;
    }
  }

  // Start a new fetch — guarded by the concurrency limiter
  const fetchPromise: Promise<string> = (async () => {
    await acquireSlot();
    try {
      const endpoints = [
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`,
        `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`,
      ];

      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();
          if (data && data[0] && Array.isArray(data[0])) {
            const translated = data[0].map((chunk: any) => chunk[0] || '').join('');
            if (translated && translated.trim() && !isBadCacheValue(translated, textToTranslate, targetLang)) {
              memoryCache[cacheKey] = translated;
              setPersistentCache(cacheKey, translated);
              return hasHtml ? trimmed.replace(textToTranslate, translated) : translated;
            }
          }
        } catch {
          // try next endpoint
        }
      }
    } catch (e) {
      console.warn('translateOnFly error:', e);
    } finally {
      releaseSlot();
      delete inFlight[cacheKey];
    }
    return trimmed;
  })();

  inFlight[cacheKey] = fetchPromise;
  return fetchPromise;
}

function isAlreadyTargetLanguage(text: string, targetLang: Language): boolean {
  const plain = text.replace(/<[^>]*>/g, '').trim();
  if (!plain) return true;

  const hasGujarati = /[\u0A80-\u0AFF]/.test(plain);
  const hasDevanagari = /[\u0900-\u097F]/.test(plain);

  if (targetLang === 'gu') return hasGujarati && !hasDevanagari;
  if (targetLang === 'hi') return hasDevanagari && !hasGujarati;
  return !hasGujarati && !hasDevanagari;
}

function detectSourceLanguage(text: string, targetLang: Language): Language | 'auto' {
  const plain = text.replace(/<[^>]*>/g, '').trim();
  if (!plain) return 'auto';

  const gujaratiCount = (plain.match(/[\u0A80-\u0AFF]/g) || []).length;
  const devanagariCount = (plain.match(/[\u0900-\u097F]/g) || []).length;

  if (gujaratiCount > 0 && gujaratiCount >= devanagariCount) return 'gu';
  if (devanagariCount > 0) return 'hi';
  if (/[A-Za-z]/.test(plain)) return 'en';
  return targetLang === 'en' ? 'auto' : 'en';
}

function shouldTranslateTextNode(text: string, targetLang: Language): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  return !isAlreadyTargetLanguage(trimmed, targetLang);
}

async function translatePlainTextPreserveLayout(text: string, targetLang: Language): Promise<string> {
  const parts = text.split(/(\r?\n+)/);

  const translatedParts = await Promise.all(parts.map(async (part) => {
    const trimmed = part.trim();
    if (!trimmed) return part;
    if (/^!\[[^\]]*\]\((https?:\/\/|\/)/i.test(trimmed)) return part;
    if (/^https?:\/\//i.test(trimmed)) return part;
    if (isAlreadyTargetLanguage(trimmed, targetLang)) return part;

    const leading = part.match(/^\s*/)?.[0] || '';
    const trailing = part.match(/\s*$/)?.[0] || '';
    const translated = await translateOnFly(trimmed, targetLang);
    return `${leading}${translated || trimmed}${trailing}`;
  }));

  return translatedParts.join('');
}

export async function translateHtmlOnFly(html: string, targetLang: Language): Promise<string> {
  if (!html || !html.trim()) return html || '';
  if (isAlreadyTargetLanguage(html, targetLang)) return html;

  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return translatePlainTextPreserveLayout(html, targetLang);
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return translateOnFly(html, targetLang);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return html;

  const nodes: Text[] = [];
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();

  while (current) {
    const textNode = current as Text;
    const parentTag = textNode.parentElement?.tagName.toLowerCase();
    if (parentTag !== 'script' && parentTag !== 'style' && shouldTranslateTextNode(textNode.nodeValue || '', targetLang)) {
      nodes.push(textNode);
    }
    current = walker.nextNode();
  }

  await Promise.all(nodes.map(async (node) => {
    const original = node.nodeValue || '';
    const leading = original.match(/^\s*/)?.[0] || '';
    const trailing = original.match(/\s*$/)?.[0] || '';
    const translated = await translateOnFly(original.trim(), targetLang);
    node.nodeValue = `${leading}${translated}${trailing}`;
  }));

  return root.innerHTML || html;
}

/**
 * React hook: translates `text` to `targetLang` in the background.
 * - Resolves synchronously from memory cache when possible.
 * - Defers persistent storage check to useEffect to guarantee 100% SSR hydration matching.
 * - Uses a cancellation flag so stale async results are discarded.
 */
export function useAutoTranslate(text: string, targetLang: Language): string {
  // Resolve initial value from memoryCache only (same on server and initial client render)
  const getInitialValue = (): string => {
    if (!text || typeof text !== 'string' || !text.trim()) return text || '';
    if (
      text.includes('<figure') ||
      text.includes('<iframe') ||
      text.includes('<img') ||
      text.includes('<table')
    ) return text;

    const plain = text.replace(/<[^>]*>/g, '').trim();
    if (isAlreadyTargetLanguage(plain, targetLang)) return text;

    const sourceLang = detectSourceLanguage(plain, targetLang);
    const cacheKey = `${sourceLang}:${targetLang}:${plain}`;

    const mem = memoryCache[cacheKey];
    if (mem && !isBadCacheValue(mem, plain, targetLang)) {
      return mem;
    }

    return '';
  };

  const [translatedText, setTranslatedText] = useState<string>(getInitialValue);

  useEffect(() => {
    let cancelled = false;

    if (!text || typeof text !== 'string' || !text.trim()) {
      setTranslatedText(text || '');
      return;
    }

    if (
      text.includes('<figure') ||
      text.includes('<iframe') ||
      text.includes('<img') ||
      text.includes('<table')
    ) {
      setTranslatedText(text);
      return;
    }

    const plain = text.replace(/<[^>]*>/g, '').trim();
    if (isAlreadyTargetLanguage(plain, targetLang)) {
      setTranslatedText(text);
      return;
    }

    const sourceLang = detectSourceLanguage(plain, targetLang);
    const cacheKey = `${sourceLang}:${targetLang}:${plain}`;

    // Read persistent storage in useEffect (after hydration is complete!)
    const persistent = getPersistentCache(cacheKey);
    if (persistent && !isBadCacheValue(persistent, plain, targetLang)) {
      memoryCache[cacheKey] = persistent;
      setTranslatedText(persistent);
      return;
    }

    translateOnFly(text, targetLang).then((result) => {
      if (!cancelled && result && !isBadCacheValue(result, plain, targetLang)) {
        setTranslatedText(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [text, targetLang]);

  return translatedText;
}

export function useAutoTranslateHtml(html: string, targetLang: Language): string {
  const getInitialValue = (): string => {
    if (!html || typeof html !== 'string' || !html.trim()) return html || '';
    return isAlreadyTargetLanguage(html, targetLang) ? html : '';
  };

  const [translatedHtml, setTranslatedHtml] = useState<string>(getInitialValue);

  useEffect(() => {
    let cancelled = false;

    if (!html || typeof html !== 'string' || !html.trim()) {
      setTranslatedHtml(html || '');
      return;
    }

    if (isAlreadyTargetLanguage(html, targetLang)) {
      setTranslatedHtml(html);
      return;
    }

    translateHtmlOnFly(html, targetLang).then((result) => {
      if (!cancelled && result) {
        setTranslatedHtml(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [html, targetLang]);

  return translatedHtml;
}

/**
 * React Component for inline translated text.
 */
export function TranslatedText({ text, className = '' }: { text: string; className?: string }) {
  return React.createElement('span', { className }, text || '');
}
