/**
 * Utility functions for handling article media (images & videos)
 */

export function isMediaVideo(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase().trim();
  return (
    lower.includes('/video/upload/') ||
    lower.includes('/video/') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.m4v') ||
    lower.endsWith('.ogv') ||
    lower.includes('.mp4?') ||
    lower.includes('.webm?') ||
    lower.includes('.mov?')
  );
}

export function getVideoPosterUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '/assets/demo/1.jpg';
  const clean = url.trim();
  if (!isMediaVideo(clean)) return clean;

  // Cloudinary video transformation to extract high-quality poster frame
  if (clean.includes('res.cloudinary.com') && clean.includes('/video/upload/')) {
    const poster = clean
      .replace(/\/video\/upload\/(?:v\d+\/)?/, (match) => {
        return match.replace('/video/upload/', '/video/upload/so_0,f_jpg,q_auto,w_800/');
      })
      .replace(/\.[a-zA-Z0-9]+$/, '') + '.jpg';
    return poster;
  }

  return clean;
}

/**
 * Safely optimize Cloudinary image delivery URLs by injecting standard f_auto,q_auto
 * capabilities without changing file extensions, dimensions, or aspect ratios.
 * 
 * Rules:
 * 1. Never transforms video URLs.
 * 2. Never transforms PDFs or raw documents.
 * 3. Never alters non-Cloudinary URLs.
 * 4. Preserves public IDs, version identifiers, folders, file extensions, and query parameters.
 * 5. Avoids duplicate transformation parameters.
 * 6. Does NOT rewrite file extensions to .avif.
 */
export function optimizeCloudinaryUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();

  // Strip enclosing quotes if present
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }

  // Handle legacy multiple comma-separated URLs (e.g. "url1, url2") without splitting Cloudinary transformation params
  if (clean.includes(',') && /,\s*https?:\/\//i.test(clean)) {
    const parts = clean.split(/,\s*https?:\/\//i);
    clean = parts[0]?.trim() || '';
  }

  // Preserve non-Cloudinary URLs untouched
  if (!clean.includes('res.cloudinary.com')) return clean;

  const lower = clean.toLowerCase();

  // Never transform video URLs
  if (isMediaVideo(clean)) {
    return clean;
  }

  // Never transform raw PDFs or documents
  if (
    lower.endsWith('.pdf') ||
    lower.includes('.pdf?') ||
    lower.endsWith('.doc') ||
    lower.endsWith('.docx')
  ) {
    return clean;
  }

  // Normalize misclassified /raw/upload/ to /image/upload/ for valid image file extensions only
  if (clean.includes('/raw/upload/') && /\.(?:jpg|jpeg|png|webp|gif|jfif|bmp|svg)(?:\?.*)?$/i.test(clean)) {
    clean = clean.replace('/raw/upload/', '/image/upload/');
  }

  // Must be a Cloudinary image delivery URL
  if (!clean.includes('/image/upload/')) return clean;

  // Never modify attachment download directives
  if (clean.includes('/fl_attachment')) return clean;

  const uploadSegment = '/image/upload/';
  const uploadIndex = clean.indexOf(uploadSegment);
  const prefix = clean.substring(0, uploadIndex + uploadSegment.length);
  const rest = clean.substring(uploadIndex + uploadSegment.length);

  // Check if f_auto or q_auto already exist in the URL transformation segment
  const hasFAuto = /[\/,]f_auto([\/,]|$)/.test(clean);
  const hasQAuto = /[\/,]q_auto([\/,]|$)/.test(clean);

  if (hasFAuto && hasQAuto) {
    return clean;
  }

  const addParams: string[] = [];
  if (!hasFAuto) addParams.push('f_auto');
  if (!hasQAuto) addParams.push('q_auto');
  const paramStr = addParams.join(',');

  return prefix + paramStr + '/' + rest;
}

export function sanitizeImageUrl(url?: string | null): string {
  return optimizeCloudinaryUrl(url);
}

function getBackendOrigin(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const rawUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
  let backendUrl = '';
  if (rawUrl && typeof rawUrl === 'string') {
    const trimmed = rawUrl.trim();
    if (trimmed && !trimmed.startsWith('/')) {
      try {
        const url = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
        if (!isProd || (url.hostname.includes('.') && url.hostname !== 'api')) {
          let pathname = url.pathname.replace(/\/+$/, '');
          if (pathname.endsWith('/api/public')) {
            pathname = pathname.slice(0, -'/api/public'.length);
          } else if (pathname.endsWith('/api')) {
            pathname = pathname.slice(0, -'/api'.length);
          }
          backendUrl = `${url.origin}${pathname}`;
        }
      } catch {
        backendUrl = '';
      }
    }
  }

  if (isProd) {
    if (!backendUrl || backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1') || backendUrl === 'https://api') {
      return 'https://api.gujaratpost.in';
    }
    return backendUrl;
  }
  let devUrl = backendUrl || 'http://127.0.0.1:5000';
  if (devUrl.includes('localhost:')) {
    devUrl = devUrl.replace('://localhost:', '://127.0.0.1:');
  }
  return devUrl;
}

export function formatEpaperPdfUrl(url?: string | null, page: number = 1): string {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();

  if (clean.startsWith('/uploads/') || clean.includes('/uploads/')) {
    const filename = clean.split('/uploads/').pop()?.split('?')[0] || '';
    return `/uploads/${filename}#page=${page}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;
  }

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    if (clean.includes('/uploads/')) {
      const filename = clean.split('/uploads/').pop()?.split('?')[0] || '';
      return `/uploads/${filename}#page=${page}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;
    }
    const proxyUrl = `/api/public/download-pdf?url=${encodeURIComponent(clean)}`;
    return `${proxyUrl}#page=${page}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;
  }

  return `${clean}#page=${page}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;
}

export function formatEpaperDownloadUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '#';
  const clean = url.trim();

  if (clean.startsWith('/uploads/') || clean.includes('/uploads/')) {
    const filename = clean.split('/uploads/').pop()?.split('?')[0] || '';
    return `/uploads/${filename}`;
  }

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    if (clean.includes('/uploads/')) {
      const filename = clean.split('/uploads/').pop()?.split('?')[0] || '';
      return `/uploads/${filename}`;
    }
    return `/api/public/download-pdf?url=${encodeURIComponent(clean)}&download=true`;
  }

  return clean;
}

/**
 * Format image URL for immediate download in AVIF format (.avif)
 */
export function formatImageDownloadUrl(url?: string | null, customFilename?: string): string {
  if (!url || typeof url !== 'string') return '#';
  const clean = sanitizeImageUrl(url);
  if (!clean || clean === '#') return '#';

  const baseName = (customFilename || clean.split('/').pop()?.split('?')[0] || 'gujarat-post-image')
    .replace(/\.[a-zA-Z0-9]+$/, '');

  // 1. Cloudinary URL: use native fl_attachment to force download as .avif
  if (clean.includes('res.cloudinary.com') && clean.includes('/image/upload/')) {
    let cloudUrl = clean.replace(/\.(?:jpg|jpeg|png|webp|gif|jfif|bmp)(?:\?.*)?$/i, '.avif');
    if (!cloudUrl.includes('/fl_attachment')) {
      cloudUrl = cloudUrl.replace(
        /\/image\/upload\/(?:v\d+\/)?/,
        (match) => match.replace('/image/upload/', `/image/upload/fl_attachment:${encodeURIComponent(baseName)}/`)
      );
    }
    return cloudUrl;
  }

  // 2. Fallback through backend proxy (relative URL consistent across SSR and client to prevent hydration mismatch)
  return `/api/public/download-image?url=${encodeURIComponent(clean)}&name=${encodeURIComponent(baseName)}`;
}
