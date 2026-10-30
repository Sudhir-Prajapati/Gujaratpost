function postUrl(value: string): string | null {
  try {
    const url = new URL(value.replace(/&amp;/g, '&').trim());
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (!['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'].includes(url.hostname)) return null;
    if (!/^\/(?:[^/]+\/status|i\/web\/status)\/\d+\/?$/.test(url.pathname)) return null;
    return `https://x.com${url.pathname.replace(/\/$/, '')}`;
  } catch { return null; }
}

export function buildTwitterPostButton(url: string, language?: string): string {
  const href = postUrl(url);
  if (!href) return '';
  const label = language === 'gu' ? 'ટ્વીટ જુઓ ↗' : language === 'hi' ? 'ट्वीट देखें ↗' : 'View Post on X ↗';
  return `<div class="my-6" data-gp-x-link><a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;padding:12px 20px;border-radius:12px;background:#000;color:#fff;text-decoration:none;font-weight:700">${label}</a></div>`;
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
