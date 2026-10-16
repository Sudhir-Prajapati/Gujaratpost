/**
 * XML and HTML Sanitization Utilities for RSS feed generation and feed parsing.
 */

/**
 * Escapes characters for XML attribute or text node inclusion.
 */
export function escapeXml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wraps text into a CDATA block, escaping any nested CDATA closing sequences (]]>).
 */
export function wrapCdata(str?: string | null): string {
  if (!str) return '';
  const sanitized = String(str).replace(/\]\]>/g, ']]]]><![CDATA[>');
  return `<![CDATA[${sanitized}]]>`;
}

/**
 * Strips all HTML tags and leaves clean plain text (useful for RSS descriptions / excerpts).
 */
export function stripHtmlTags(html?: string | null): string {
  if (!html) return '';
  return String(html)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitizes rich HTML content imported from external RSS feeds:
 * - Strips `<script>`, `<style>`, `<iframe>`, `<embed>`, `<object>`, `<form>`, `<input>`, `<meta>`, `<link>`
 * - Strips all `on*` inline event handlers (e.g. `onclick`, `onload`, `onerror`)
 * - Strips `javascript:`, `data:`, `vbscript:` in `href` and `src` attributes
 */
export function sanitizeHtmlContent(dirtyHtml?: string | null): string {
  if (!dirtyHtml) return '';
  let clean = String(dirtyHtml);

  // 1. Remove dangerous elements and their inner content
  clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  clean = clean.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  clean = clean.replace(/<embed[^>]*>[\s\S]*?<\/embed>/gi, '');
  clean = clean.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
  clean = clean.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');

  // 2. Remove isolated void tags of dangerous elements
  clean = clean.replace(/<\/?(script|style|iframe|embed|object|form|meta|link|base)[^>]*>/gi, '');

  // 3. Remove all inline event handlers (on[a-z]+="...")
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*(['"]).*?\1/gi, '');
  clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*[^>\s]+/gi, '');

  // 4. Neutralize javascript: and vbscript: URIs in href and src
  clean = clean.replace(/href\s*=\s*(['"])\s*(javascript|vbscript|data):.*?\1/gi, 'href="#"');
  clean = clean.replace(/src\s*=\s*(['"])\s*(javascript|vbscript):.*?\1/gi, 'src=""');

  return clean.trim();
}

/**
 * Normalizes URLs (e.g., strips tracking parameters like utm_*, trims whitespace).
 */
export function normalizeSourceUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  try {
    const trimmed = rawUrl.trim();
    const url = new URL(trimmed);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
    for (const p of trackingParams) {
      url.searchParams.delete(p);
    }
    return url.toString();
  } catch {
    return (rawUrl || '').trim();
  }
}
