'use client';

import type { Language } from '@/types';
import { translateOnFly, isAlreadyTargetLanguage } from '@/lib/translate';

// Helper: Strip HTML tags and markdown, leave clean readable speech text
export function cleanTextForSpeech(htmlOrText: string): string {
  if (!htmlOrText) return '';

  return htmlOrText
    // Remove scripts, styles, embeds
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ' ')
    // Remove markdown utility lines like "## KEY HIGHLIGHTS"
    .replace(/^#{1,6}\s*📌?.*(KEY HIGHLIGHTS|AT A GLANCE).*$/gmi, ' ')
    // Replace block tags with period/newline to maintain sentence rhythm
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '. ')
    .replace(/<br\s*\/?>/gi, '. ')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown headers, bold, italics, bullets, separators
    .replace(/^[#*>\-\s]+/gm, '')
    .replace(/[*_~`]/g, '')
    // Remove HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z0-9#]+;/gi, ' ')
    // Remove common visual symbols/emojis
    .replace(/[📌👉▶•●✓✔✕✖★☆—–_]/g, ' ')
    // Normalize punctuation & whitespace
    .replace(/\s+/g, ' ')
    .replace(/\.{2,}/g, '.')
    .replace(/\s*([.,?!।])\s*/g, '$1 ')
    .trim();
}

// Helper: Split text into natural chunks (approx 60-140 chars)
export function chunkTextIntoSentences(text: string, maxLen = 140): string[] {
  if (!text) return [];

  // Split by sentence terminators (Gujarati/Hindi danda ।, period, question, exclamation)
  const rawParts = text.split(/([।?!.]|\n+)/);
  const sentences: string[] = [];
  let buffer = '';

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    if (!part) continue;

    if (part === '।' || part === '.' || part === '?' || part === '!' || part.startsWith('\n')) {
      buffer += part;
      if (buffer.trim().length > 0) {
        sentences.push(buffer.trim());
        buffer = '';
      }
    } else {
      buffer += (buffer ? ' ' : '') + part.trim();
      if (buffer.length >= maxLen) {
        // If too long without punctuation, split by comma or spaces
        const subParts = buffer.split(/([,;:\s]+)/);
        let subBuffer = '';
        for (const sub of subParts) {
          if ((subBuffer + sub).length > maxLen && subBuffer.trim()) {
            sentences.push(subBuffer.trim());
            subBuffer = sub;
          } else {
            subBuffer += sub;
          }
        }
        buffer = subBuffer;
      }
    }
  }

  if (buffer.trim()) {
    sentences.push(buffer.trim());
  }

  // Filter out tiny or empty chunks, and DEDUPLICATE any consecutive duplicate chunks
  const cleaned: string[] = [];
  for (const s of sentences) {
    const trimmed = s.replace(/^[.,?!।\s]+|[.,?!।\s]+$/g, '').trim();
    if (trimmed.length > 2) {
      const prev = cleaned[cleaned.length - 1];
      const normCur = trimmed.toLowerCase().replace(/[\s.,?!।:;-]/g, '');
      const normPrev = prev ? prev.toLowerCase().replace(/[\s.,?!।:;-]/g, '') : '';
      if (!normPrev || normPrev !== normCur) {
        cleaned.push(trimmed);
      }
    }
  }

  return cleaned;
}

// Global active player state to ensure only one audio plays at any time
let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let currentPlayId = 0;

export function isArticleAudioPlaying(): boolean {
  if (activeAudio && !activeAudio.paused && activeAudio.currentTime > 0) return true;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) return true;
  return false;
}

export function stopArticleAudio() {
  currentPlayId++;

  // 1. Immediately pause and flush HTML5 audio
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = '';
      activeAudio.load();
    } catch {}
  }

  // 2. Force stop browser speech synthesis (with Chrome pause+cancel workaround)
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.pause();
      window.speechSynthesis.cancel();
      setTimeout(() => {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }, 20);
    } catch {}
    activeUtterance = null;
  }

  // 3. Broadcast global stop event to keep all UI buttons in sync
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('gp-tts-stop'));
    } catch {}
  }
}

// Automatically stop audio on browser back/forward or tab unload
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    stopArticleAudio();
  });
  window.addEventListener('beforeunload', () => {
    stopArticleAudio();
  });
}

export function hasNativeVoice(lang: Language): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return false;

  const targetPrefix = lang === 'hi' ? 'hi' : lang === 'en' ? 'en' : 'gu';
  return voices.some(
    (v) =>
      v.lang.toLowerCase().startsWith(targetPrefix) ||
      v.name.toLowerCase().includes(lang === 'gu' ? 'gujarati' : lang === 'hi' ? 'hindi' : 'english')
  );
}

export function getBestVoice(lang: Language): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  if (lang === 'gu') {
    const guVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('gu') || v.name.toLowerCase().includes('gujarati')
    );
    if (guVoice) return guVoice;
  }

  if (lang === 'hi') {
    const hiVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi')
    );
    if (hiVoice) return hiVoice;
  }

  if (lang === 'en') {
    // Prefer Indian English voice if available
    const enInVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('en-in') || v.name.toLowerCase().includes('india')
    );
    if (enInVoice) return enInVoice;
    return voices.find((v) => v.lang.toLowerCase().startsWith('en')) || null;
  }

  return null;
}

export interface SpeechItem {
  text: string;
  elemIndex: number;
}

export interface PlayArticleOptions {
  title: string;
  subheading?: string;
  excerpt?: string;
  highlights?: string[];
  body?: string;
  items?: SpeechItem[];
  language: Language;
  onStart?: () => void;
  onChunkChange?: (chunkIndex: number, chunkText: string, totalChunks: number, elemIndex?: number, rawChunkText?: string) => void;
  onEnd?: () => void;
  onError?: (err?: any) => void;
}

export function playArticleAudio({
  title,
  subheading,
  excerpt,
  highlights,
  body,
  items,
  language,
  onStart,
  onChunkChange,
  onEnd,
  onError,
}: PlayArticleOptions): () => void {
  stopArticleAudio();

  const playId = ++currentPlayId;

  // Immediately kick off asynchronous text preparation & language alignment
  (async () => {
interface ChunkEntry {
      chunkText: string;
      elemIndex: number;
    }

    const chunkEntries: ChunkEntry[] = [];

    if (items && Array.isArray(items) && items.length > 0) {
      // Direct element-by-element chunking with 100% accurate element index tracking!
      for (const item of items) {
        const clean = cleanTextForSpeech(item.text);
        if (!clean || clean.length < 2) continue;
        const subChunks = chunkTextIntoSentences(clean);
        for (const sc of subChunks) {
          if (sc && sc.trim().length > 1) {
            chunkEntries.push({ chunkText: sc.trim(), elemIndex: item.elemIndex });
          }
        }
      }
    } else {
      const cleanTitle = cleanTextForSpeech(title);
      let cleanSubheading = cleanTextForSpeech(subheading || excerpt || '');
      let cleanBody = cleanTextForSpeech(body || '');

      const norm = (s: string) => s.toLowerCase().replace(/[\s.,?!।:;'"“”\-–—#*•]/g, '');
      const normTitle = norm(cleanTitle);

      if (cleanSubheading && normTitle) {
        const normSub = norm(cleanSubheading);
        if (normSub === normTitle) {
          cleanSubheading = '';
        } else if (normSub.startsWith(normTitle)) {
          cleanSubheading = cleanSubheading.slice(cleanTitle.length).replace(/^[.,?!।\s]+/, '').trim();
        }
      }

      let curElemIdx = 0;
      if (cleanTitle) {
        const tChunks = chunkTextIntoSentences(cleanTitle);
        tChunks.forEach((c) => chunkEntries.push({ chunkText: c, elemIndex: 0 }));
        curElemIdx++;
      }
      if (cleanSubheading) {
        const sChunks = chunkTextIntoSentences(cleanSubheading);
        sChunks.forEach((c) => chunkEntries.push({ chunkText: c, elemIndex: curElemIdx }));
        curElemIdx++;
      }
      if (highlights && Array.isArray(highlights) && highlights.length > 0) {
        highlights.forEach((h) => {
          const ch = cleanTextForSpeech(h);
          if (ch && ch.length > 2) {
            const hChunks = chunkTextIntoSentences(ch);
            hChunks.forEach((c) => chunkEntries.push({ chunkText: c, elemIndex: curElemIdx }));
            curElemIdx++;
          }
        });
      }
      if (cleanBody) {
        const bChunks = chunkTextIntoSentences(cleanBody);
        bChunks.forEach((c: string) => chunkEntries.push({ chunkText: c, elemIndex: curElemIdx }));
      }
    }

    if (chunkEntries.length === 0) {
      if (playId === currentPlayId && onError) onError(new Error('No readable sentences found'));
      return;
    }

    if (onStart) onStart();

    // 3. Play via high-quality Google TTS Audio stream (/api/tts)
    if (!activeAudio && typeof window !== 'undefined') {
      activeAudio = new Audio();
    }
    const player = activeAudio;
    if (!player) return;

    let chunkIndex = 0;

    const playNextAudioChunk = async () => {
      if (playId !== currentPlayId) return;

      if (chunkIndex >= chunkEntries.length) {
        if (onChunkChange) onChunkChange(-1, '', chunkEntries.length, -1);
        if (onEnd) onEnd();
        return;
      }

      const currentIndex = chunkIndex;
      const currentEntry = chunkEntries[chunkIndex++];
      const rawChunk = currentEntry.chunkText;
      const elemIndex = currentEntry.elemIndex;
      let chunkText = rawChunk;

      // Real-time language check: if chunk text does not match target language, translate this chunk in ~20ms
      // Universal check works across EN -> HI, EN -> GU, GU -> HI, HI -> GU, etc.
      if (!isAlreadyTargetLanguage(chunkText, language)) {
        try {
          const tr = await translateOnFly(chunkText, language);
          if (playId !== currentPlayId) return;
          if (tr && tr.trim()) chunkText = tr.trim();
        } catch {}
      }

      if (playId !== currentPlayId) return;

      const audioUrl = `/api/tts?lang=${encodeURIComponent(language)}&text=${encodeURIComponent(chunkText)}`;

      // Broadcast active sentence and exact element index to highlight in RED
      if (onChunkChange) {
        onChunkChange(currentIndex, chunkText, chunkEntries.length, elemIndex, rawChunk);
      }

      // Preload next chunk
      if (chunkIndex < chunkEntries.length) {
        const nextChunk = chunkEntries[chunkIndex].chunkText;
        const nextUrl = `/api/tts?lang=${encodeURIComponent(language)}&text=${encodeURIComponent(nextChunk)}`;
        const preloader = new Audio();
        preloader.preload = 'auto';
        preloader.src = nextUrl;
      }

      player.onended = () => {
        if (playId === currentPlayId) {
          playNextAudioChunk();
        }
      };

      player.onerror = (err) => {
        console.warn('[Audio Stream Chunk Error]:', err);
        if (playId === currentPlayId) {
          playNextAudioChunk();
        }
      };

      player.src = audioUrl;
      player.load();
      player.play().catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('[Audio Play Error]:', err);
        }
        if (playId === currentPlayId && chunkIndex < chunkEntries.length) {
          playNextAudioChunk();
        } else if (playId === currentPlayId && onEnd) {
          if (onChunkChange) onChunkChange(-1, '', chunkEntries.length, -1);
          onEnd();
        }
      });
    };

    playNextAudioChunk();
  })();

  // Return cancel function
  return () => {
    if (playId === currentPlayId) {
      stopArticleAudio();
      if (onChunkChange) onChunkChange(-1, '', 0);
      if (onEnd) onEnd();
    }
  };
}
