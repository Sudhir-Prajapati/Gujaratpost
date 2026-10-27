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

  // Filter out tiny or empty chunks
  return sentences.filter((s) => s.replace(/^[.,?!।\s]+$/, '').length > 0);
}

// Global active player state to ensure only one audio plays at any time
let activeAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let currentPlayId = 0;

export function stopArticleAudio() {
  currentPlayId++;

  // Stop any streaming audio
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = '';
    } catch {}
    activeAudio = null;
  }

  // Stop any browser speech synthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    activeUtterance = null;
  }
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
  body?: string;
  excerpt?: string;
  language: Language;
  onStart?: () => void;
  onChunkChange?: (chunkIndex: number, chunkText: string, totalChunks: number) => void;
  onEnd?: () => void;
  onError?: (err?: any) => void;
}

export function playArticleAudio({
  title,
  body,
  excerpt,
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
    // 1. Prepare full speech text: Heading (title) + Full Description (body / excerpt)
    const cleanTitle = cleanTextForSpeech(title);
    const cleanBody = cleanTextForSpeech(body || excerpt || '');

    // Full text is Title first, then full body
    let combinedText = cleanTitle ? `${cleanTitle}. ${cleanBody}` : cleanBody;
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

    // 4. Check if device has a reliable native voice for the language
    // Gujarati on iOS/Windows almost never has a native voice, so fallback to high-quality /api/tts stream
    const nativeVoice = getBestVoice(language);
    const shouldUseBrowserSpeech = nativeVoice !== null && (language !== 'gu' || nativeVoice.lang.toLowerCase().startsWith('gu'));

    if (shouldUseBrowserSpeech && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // ══════════════════════════════════════════════════════════════════════════════
      // MODE A: Device Native SpeechSynthesis with chunk queueing & visual tracking
      // ══════════════════════════════════════════════════════════════════════════════
      let chunkIndex = 0;

      const speakNextChunk = () => {
        if (playId !== currentPlayId) return;

        if (chunkIndex >= chunks.length) {
          if (onChunkChange) onChunkChange(-1, '', chunks.length);
          if (onEnd) onEnd();
          return;
        }

        const currentIndex = chunkIndex;
        const text = chunks[chunkIndex++];
        const utterance = new SpeechSynthesisUtterance(text);
        activeUtterance = utterance;

        if (nativeVoice) {
          utterance.voice = nativeVoice;
        }
        utterance.lang = language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN';
        utterance.rate = 0.95; // slightly relaxed natural pace

        utterance.onstart = () => {
          if (playId === currentPlayId && onChunkChange) {
            onChunkChange(currentIndex, text, chunks.length);
          }
        };

        // Also broadcast immediately in case onstart is delayed in some mobile browsers
        if (onChunkChange) {
          onChunkChange(currentIndex, text, chunks.length);
        }

        utterance.onend = () => {
          if (playId === currentPlayId) {
            speakNextChunk();
          }
        };

        utterance.onerror = (e) => {
          // If interrupted by cancel, ignore
          if (e.error === 'interrupted' || e.error === 'canceled') return;
          console.warn('[Web Speech Error]:', e);
          if (playId === currentPlayId) {
            speakNextChunk();
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      speakNextChunk();
    } else {
      // ══════════════════════════════════════════════════════════════════════════════
      // MODE B: High-Quality Audio Stream via /api/tts (Guaranteed for iPhone, Windows & all devices)
      // ══════════════════════════════════════════════════════════════════════════════
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

        const audio = new Audio(audioUrl);
        activeAudio = audio;

        // Broadcast active sentence to highlight in RED
        if (onChunkChange) {
          onChunkChange(currentIndex, chunkText, chunks.length);
        }

        // Preload the next chunk in background for seamless playback without pauses
        if (chunkIndex < chunks.length) {
          const nextUrl = `/api/tts?lang=${encodeURIComponent(language)}&text=${encodeURIComponent(chunks[chunkIndex])}`;
          const preloader = new Audio();
          preloader.preload = 'auto';
          preloader.src = nextUrl;
        }

        audio.onended = () => {
          if (playId === currentPlayId) {
            playNextAudioChunk();
          }
        };

        audio.onerror = (err) => {
          console.warn('[Audio Stream Chunk Error]:', err);
          // Continue to next chunk on transient network glitch
          if (playId === currentPlayId) {
            playNextAudioChunk();
          }
        };

        audio.play().catch((err) => {
          // Autoplay policy or user cancellation
          if (err.name !== 'AbortError') {
            console.warn('[Audio Play Error]:', err);
          }
          if (playId === currentPlayId && chunkIndex < chunks.length) {
            playNextAudioChunk();
          } else if (onEnd) {
            if (onChunkChange) onChunkChange(-1, '', chunks.length);
            onEnd();
          }
        });
      };

      playNextAudioChunk();
    }
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
