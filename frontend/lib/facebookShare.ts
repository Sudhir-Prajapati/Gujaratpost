const PUBLIC_SITE_ORIGIN = new URL('https://gujaratpost.in');

/**
 * Normalizes any local or relative URL into the canonical public production URL.
 * Required so cloud scrapers (Facebook, X/Twitter, WhatsApp, LinkedIn) can crawl the real page.
 */
export function getPublicShareUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return 'https://gujaratpost.in';
  try {
    const url = new URL(rawUrl);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]') {
      url.protocol = PUBLIC_SITE_ORIGIN.protocol;
      url.host = PUBLIC_SITE_ORIGIN.host;
      url.port = '';
    }
    return url.toString();
  } catch {
    if (rawUrl.startsWith('/')) {
      return `https://gujaratpost.in${rawUrl}`;
    }
    return rawUrl;
  }
}

/**
 * Normalizes an image URL for social media Open Graph & Twitter crawlers.
 * - Converts AVIF to standard JPEG (which Facebook and Twitter crawlers require).
 * - For Cloudinary, applies /f_jpg,q_auto,w_1200,h_630,c_fill/ transformation.
 * - Ensures absolute HTTPS URL.
 */
export function getOpenGraphImageUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'https://gujaratpost.in/assets/logo.png';
  }
  let url = rawUrl.trim();
  if (!url) return 'https://gujaratpost.in/assets/logo.png';

  // If it's a relative URL, prepend public site origin
  if (url.startsWith('/')) {
    url = `https://gujaratpost.in${url}`;
  }

  // Cloudinary: force JPEG 1200x630 for Facebook & Twitter bots
  if (url.includes('cloudinary.com')) {
    url = url.replace(/\.avif(\?.*)?$/i, '.jpg$1');
    if (url.includes('/upload/') && !url.includes('/f_jpg') && !url.includes('/f_auto')) {
      url = url.replace('/upload/', '/upload/f_jpg,q_auto,w_1200,h_630,c_fill/');
    }
  } else if (url.endsWith('.avif')) {
    url = url.replace(/\.avif$/i, '.jpg');
  }

  // Ensure HTTPS for secure scrapers
  if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    url = url.replace('http://', 'https://');
  }

  return url;
}

export function getFacebookShareHref(articleUrl: string): string {
  const publicUrl = getPublicShareUrl(articleUrl);
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;
}

export function getTwitterShareHref(articleUrl: string, title: string = ''): string {
  const publicUrl = getPublicShareUrl(articleUrl);
  const cleanTitle = title ? title.replace(/<[^>]*>/g, '').trim() : '';
  const text = cleanTitle ? `${cleanTitle}\n\n` : '';
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(publicUrl)}`;
}

export function getWhatsAppShareHref(articleUrl: string, title: string = ''): string {
  const publicUrl = getPublicShareUrl(articleUrl);
  const cleanTitle = title ? title.replace(/<[^>]*>/g, '').trim() : '';
  const text = cleanTitle ? `${cleanTitle}\n\n${publicUrl}` : publicUrl;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getLinkedInShareHref(articleUrl: string): string {
  const publicUrl = getPublicShareUrl(articleUrl);
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`;
}
