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
  return clean;
}

export function formatEpaperPdfUrl(url?: string | null, page: number = 1): string {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();

  let envOrigin = process.env.NEXT_PUBLIC_BACKEND_URL
    ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/api\/?$/, '')
    : (process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/public\/?$/, '').replace(/\/api\/?$/, '')
      : '');
  if (process.env.NODE_ENV === 'production' && envOrigin && (envOrigin.includes('localhost') || envOrigin.includes('127.0.0.1'))) {
    envOrigin = '';
  }
  const backendOrigin = typeof window !== 'undefined'
    ? ''
    : (envOrigin || (process.env.NODE_ENV === 'production' ? 'https://gujaratpost.onrender.com' : 'http://127.0.0.1:5000'));

  if (clean.startsWith('/uploads/') || clean.includes('/uploads/')) {
    const filename = clean.split('/uploads/').pop()?.split('?')[0] || '';
    return `${backendOrigin}/uploads/${filename}#page=${page}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;
  }

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    if (clean.includes('/uploads/')) {
      const filename = clean.split('/uploads/').pop()?.split('?')[0] || '';
      return `${backendOrigin}/uploads/${filename}#page=${page}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;
    }
    const proxyUrl = `${backendOrigin}/api/public/download-pdf?url=${encodeURIComponent(clean)}`;
    return `${proxyUrl}#page=${page}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;
  }

  return `${clean}#page=${page}&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;
}

export function formatEpaperDownloadUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '#';
  const clean = url.trim();

  let envOrigin = process.env.NEXT_PUBLIC_BACKEND_URL
    ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/api\/?$/, '')
    : (process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/public\/?$/, '').replace(/\/api\/?$/, '')
      : '');
  if (process.env.NODE_ENV === 'production' && envOrigin && (envOrigin.includes('localhost') || envOrigin.includes('127.0.0.1'))) {
    envOrigin = '';
  }
  const backendOrigin = typeof window !== 'undefined'
    ? ''
    : (envOrigin || (process.env.NODE_ENV === 'production' ? 'https://gujaratpost.onrender.com' : 'http://127.0.0.1:5000'));

  if (clean.startsWith('/uploads/') || clean.includes('/uploads/')) {
    const filename = clean.split('/uploads/').pop()?.split('?')[0] || '';
    return `${backendOrigin}/uploads/${filename}`;
  }

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    if (clean.includes('/uploads/')) {
      const filename = clean.split('/uploads/').pop()?.split('?')[0] || '';
      return `${backendOrigin}/uploads/${filename}`;
    }
    return `${backendOrigin}/api/public/download-pdf?url=${encodeURIComponent(clean)}&download=true`;
  }

  return clean;
}
