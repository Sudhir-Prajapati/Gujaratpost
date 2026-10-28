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
    // Remove (KEY HIGHLIGHTS) / એક નજરમાં headers
    .replace(/^##\s*📌?\s*(એક નજરમાં|KEY HIGHLIGHTS|एक नजर में|AT A GLANCE).*?$/gmi, ' ')
    .replace(/(એક નજરમાં|KEY HIGHLIGHTS|एक नजर में|AT A GLANCE)/gi, ' ')
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

export interface PlayArticleOptions {
  title: string;
  subheading?: string;
  excerpt?: string;
  body?: string;
  language: Language;
  onStart?: () => void;
  onChunkChange?: (chunkIndex: number, chunkText: string, totalChunks: number) => void;
  onEnd?: () => void;
  onError?: (err?: any) => void;
}

export function playArticleAudio({
  title,
  subheading,
  excerpt,
  body,
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
    // 1. Prepare speech text in natural visual reading order:
    // Heading (title) -> Subheading (subheading / excerpt) -> Body Description (body)
    const cleanTitle = cleanTextForSpeech(title);
    let cleanSubheading = cleanTextForSpeech(subheading || excerpt || '');
    let cleanBody = cleanTextForSpeech(body || '');

    const norm = (s: string) => s.toLowerCase().replace(/[\s.,?!।:;'"“”\-–—]/g, '');
    const normTitle = norm(cleanTitle);

    // If subheading is identical to or starts with title, remove duplicate title part
    if (cleanSubheading && normTitle) {
      const normSub = norm(cleanSubheading);
      if (normSub === normTitle) {
        cleanSubheading = '';
      } else if (normSub.startsWith(normTitle)) {
        cleanSubheading = cleanSubheading.slice(cleanTitle.length).replace(/^[.,?!।\s]+/, '').trim();
      }
    }

    // If body begins with the title, remove duplicate title from body
    if (cleanBody && normTitle) {
      const normBody = norm(cleanBody);
      if (normBody.startsWith(normTitle)) {
        cleanBody = cleanBody.slice(cleanTitle.length).replace(/^[.,?!।\s]+/, '').trim();
      }
    }

    // If body begins with the subheading, remove duplicate subheading from body so it's not spoken twice
    if (cleanBody && cleanSubheading) {
      const normSub = norm(cleanSubheading);
      const normBody = norm(cleanBody);
      if (normBody.startsWith(normSub)) {
        cleanBody = cleanBody.slice(cleanSubheading.length).replace(/^[.,?!।\s]+/, '').trim();
      }
    }

    // Assemble text parts: Title -> Subheading -> Body
    const parts: string[] = [];
    if (cleanTitle) parts.push(cleanTitle);
    if (cleanSubheading) parts.push(cleanSubheading);
    if (cleanBody) parts.push(cleanBody);

    let combinedText = parts.join('. ');
    if (!combinedText) {
      if (playId === currentPlayId && onError) onError(new Error('No text to read'));
      return;
    }

    // 2. Real-time language check:
    // If the text passed is NOT yet in the requested language (e.g. user switched language in header without reload),
    // automatically translate the clean speech text to the target language on the fly in ~100-200ms!
    if (!isAlreadyTargetLanguage(combinedText, language)) {
      try {
        const translated = await translateOnFly(combinedText, language);
        if (playId !== currentPlayId) return; // user cancelled/switched again
        if (translated && translated.trim()) {
          combinedText = translated;
        }
      } catch (err) {
        console.warn('[TTS translateOnFly error]:', err);
      }
    }

    if (playId !== currentPlayId) return;

    // 3. Break into natural sentence chunks (approx 60-140 chars)
    const chunks = chunkTextIntoSentences(combinedText);
    if (chunks.length === 0) {
      if (playId === currentPlayId && onError) onError(new Error('No readable sentences found'));
      return;
    }

    if (onStart) onStart();

    // 4. Play via high-quality Google TTS Audio stream (/api/tts)
    // HTML5 audio stops instantly when paused and works identically across all devices
    if (!activeAudio && typeof window !== 'undefined') {
      activeAudio = new Audio();
    }
    const player = activeAudio;
    if (!player) return;

    let chunkIndex = 0;

    const playNextAudioChunk = () => {
      if (playId !== currentPlayId) return;

      if (chunkIndex >= chunks.length) {
        if (onChunkChange) onChunkChange(-1, '', chunks.length);
        if (onEnd) onEnd();
        return;
      }

      const currentIndex = chunkIndex;
      const chunkText = chunks[chunkIndex++];
      const audioUrl = `/api/tts?lang=${encodeURIComponent(language)}&text=${encodeURIComponent(chunkText)}`;

      // Broadcast active sentence to highlight in RED
      if (onChunkChange) {
        onChunkChange(currentIndex, chunkText, chunks.length);
      }

      // Preload next chunk
      if (chunkIndex < chunks.length) {
        const nextUrl = `/api/tts?lang=${encodeURIComponent(language)}&text=${encodeURIComponent(chunks[chunkIndex])}`;
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
        if (playId === currentPlayId && chunkIndex < chunks.length) {
          playNextAudioChunk();
        } else if (playId === currentPlayId && onEnd) {
          if (onChunkChange) onChunkChange(-1, '', chunks.length);
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
