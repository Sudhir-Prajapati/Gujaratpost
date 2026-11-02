function postUrl(value: string): string | null {
  try {
    const url = new URL(value.replace(/&amp;/g, '&').trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password) return null;
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (!['x.com', 'twitter.com', 'mobile.twitter.com'].includes(host)) return null;
    return url.toString();
  } catch { return null; }
}

export function buildTwitterPostButton(url: string, language?: string): string {
  const href = postUrl(url);
  if (!href) return '';
  const isBroadcast = href.includes('/broadcasts/');
  const isSpace = href.includes('/spaces/');
  const label = isBroadcast
    ? (language === 'gu' ? 'X પર લાઈવ બ્રોડકાસ્ટ જુઓ ↗' : language === 'hi' ? 'X पर लाइव प्रसारण देखें ↗' : 'Watch Live Broadcast on X ↗')
    : isSpace
      ? (language === 'gu' ? 'X Spaces સાંભળો ↗' : language === 'hi' ? 'X Spaces सुनें ↗' : 'Listen to X Space ↗')
      : (language === 'gu' ? 'X (Twitter) પર જુઓ ↗' : language === 'hi' ? 'X पर देखें ↗' : 'View on X (Twitter) ↗');

  return `<div class="my-6 flex justify-center w-full" data-gp-x-link><a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:10px;padding:12px 22px;border-radius:12px;background:#000;color:#fff;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(0,0,0,0.15)"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg><span>${label}</span></a></div>`;
}

/** Remove legacy cards and orphan buttons, keeping one valid link per post. */
export function normalizeTwitterPostLinks(html: string, language?: string): string {
  if (!html) return '';

  // If the article already contains an embedded Twitter post (figure, blockquote, or wrapper),
  // leave it alone and do NOT append duplicate buttons at the bottom of the article.
  const hasTwitterEmbed = /data-article-social-platform=["']twitter["']|class=["'][^"']*twitter-tweet|gp-twitter-embed-wrap|data-social-platform=["']twitter["']/i.test(html);
  if (hasTwitterEmbed) {
    return html.replace(/<div\b[^>]*data-gp-x-link[^>]*>[\s\S]*?<\/div>/gi, '');
  }

  const posts = new Map<string, string>();
  const remember = (value: string) => {
    const url = postUrl(value);
    if (url) posts.set(url.match(/\/status\/(\d+)/)?.[1] || url, url);
  };
  for (const match of html.matchAll(/\bhref=["']([^"']+)["']/gi)) remember(match[1]);

  // Match the entire nested card rather than stopping at its first closing div.
  const ranges: { start: number; end: number }[] = [];
  const tags = /<\/?div\b[^>]*>/gi;
  let depth = 0;
  let start = -1;
  for (const match of html.matchAll(tags)) {
    const closing = /^<\//.test(match[0]);
    if (start < 0 && !closing && /\bclass=["'][^"']*\bgp-x-card\b/i.test(match[0])) {
      start = match.index;
      depth = 0;
    }
    if (start < 0) continue;
    depth += closing ? -1 : 1;
    if (depth === 0) {
      ranges.push({ start, end: match.index + match[0].length });
      start = -1;
    }
  }
  let cleaned = html;
  for (const range of ranges.reverse()) cleaned = cleaned.slice(0, range.start) + cleaned.slice(range.end);
  cleaned = cleaned.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (anchor) => {
    const href = anchor.match(/\bhref=["']([^"']+)["']/i)?.[1];
    return (href && postUrl(href)) || /\bclass=["'][^"']*\bgp-x-btn\b/i.test(anchor) ? '' : anchor;
  });
  cleaned = cleaned.replace(/<div\b[^>]*data-gp-x-link[^>]*>\s*<\/div>/gi, '');
  return cleaned + [...posts.values()].map((url) => buildTwitterPostButton(url, language)).join('');
}
