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

export function sanitizeImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  if (clean.includes(',')) {
    const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
    clean = parts[0] || '';
  }
  if (
    clean.includes('res.cloudinary.com') &&
    clean.includes('/raw/upload/') &&
    !clean.toLowerCase().endsWith('.pdf') &&
    !clean.toLowerCase().includes('.pdf?')
  ) {
    clean = clean.replace('/raw/upload/', '/image/upload/');
  }
  // Convert all Cloudinary images to .avif format for optimal web performance
  if (
    clean.includes('res.cloudinary.com') &&
    clean.includes('/image/upload/') &&
    !isMediaVideo(clean) &&
    !clean.toLowerCase().endsWith('.pdf') &&
    !clean.toLowerCase().includes('.pdf?')
  ) {
    clean = clean.replace(/\.(?:jpg|jpeg|png|webp|gif|jfif|bmp)(?:\?.*)?$/i, '.avif');
  }
  return clean;
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
