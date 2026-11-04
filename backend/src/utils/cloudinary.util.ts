/**
 * GujaratPost Centralized Cloudinary URL Optimization Utility (Backend)
 *
 * Injects safe f_auto,q_auto parameters into Cloudinary image delivery URLs:
 * 1. Preserves original file extensions (never rewrites to .avif).
 * 2. Preserves public IDs, version identifiers, folder structures, and query parameters.
 * 3. Preserves non-Cloudinary URLs completely untouched.
 * 4. Never transforms video URLs.
 * 5. Never transforms raw PDFs or documents.
 * 6. Avoids duplicate transformation parameters.
 * 7. Normalizes misclassified /raw/upload/ to /image/upload/ for image file extensions only.
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

export function sanitizeUrlInContent(text?: string | null): string {
  if (!text) return '';
  return text.replace(/(https:\/\/res\.cloudinary\.com\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp|gif|svg|avif))/gi, (imgUrl) => {
    return optimizeCloudinaryUrl(imgUrl);
  });
}

