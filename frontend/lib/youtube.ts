/**
 * Extract a clean 11-character YouTube video ID from any input:
 * - Bare ID:           ituhQR8gwas
 * - Watch URL:         https://www.youtube.com/watch?v=ituhQR8gwas&t=2s
 * - Share link:        https://youtu.be/ituhQR8gwas?si=XAI...
 * - Shorts URL:        https://www.youtube.com/shorts/ituhQR8gwas
 * - Embed URL:         https://www.youtube.com/embed/ituhQR8gwas
 * - Full URL already:  returns same URL if no match (safe fallback)
 */
export function safeYouTubeId(input: string | null | undefined): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Already a clean 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  // Match all known YouTube URL patterns
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,                            // ?v=ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,                       // youtu.be/ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,            // /shorts/ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,             // /embed/ID
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,                 // /v/ID
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,         // watch?...v=ID
  ];

  for (const pattern of patterns) {
    const m = trimmed.match(pattern);
    if (m?.[1]) return m[1];
  }

  // Return trimmed as-is (bare ID that didn't pass the regex length check)
  return trimmed;
}

/**
 * Generate a safe YouTube embed URL from any input (URL or ID)
 */
export function youtubeEmbedUrl(input: string | null | undefined, params = ''): string {
  const id = safeYouTubeId(input);
  if (!id) return '';
  return `https://www.youtube-nocookie.com/embed/${id}${params ? '?' + params : ''}`;
}

/**
 * Generate a safe YouTube thumbnail URL from any input
 */
export function youtubeThumbnail(input: string | null | undefined, quality: 'hq' | 'mq' | 'sd' = 'hq'): string {
  const id = safeYouTubeId(input);
  if (!id) return '';
  return `https://i.ytimg.com/vi/${id}/${quality}default.jpg`;
}
