'use client';

import { jsPDF } from 'jspdf';
import { getBackendApiUrl, authFetch } from '@/lib/api';

/**
 * Utility to render a DOM element (Newspaper Page) into a high-resolution Data URL image.
 * Uses html2canvas-pro with full support for modern CSS (oklch, color-mix, CSS Color 4).
 */
export async function renderElementToDataUrl(element: HTMLElement, scale: number = 1.25): Promise<string> {
  try {
    if (typeof document !== 'undefined' && document.fonts) {
      try {
        await document.fonts.ready;
      } catch (_) {}
    }

    // Wait for all images inside the element to complete loading
    const imgElements = Array.from(element.querySelectorAll('img'));
    if (imgElements.length > 0) {
      await Promise.all(
        imgElements.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            setTimeout(resolve, 1500); // 1.5s fallback timeout
          });
        })
      );
    }

    // Try html2canvas-pro first (supports Tailwind v4 oklch colors), fallback to html2canvas
    let html2canvas: any = null;
    try {
      const mod = await import('html2canvas-pro');
      html2canvas = mod.default || mod;
    } catch (e1) {
      try {
        const mod = await import('html2canvas');
        html2canvas = mod.default || mod;
      } catch (e2) {
        console.error('Neither html2canvas-pro nor html2canvas could be loaded:', e1, e2);
      }
    }

    if (html2canvas && element) {
      console.log('[E-Paper PDF] Capturing page element with html2canvas-pro, size:', element.offsetWidth, 'x', element.offsetHeight);

      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: false, // CRITICAL: NEVER TAINT CANVAS so toDataURL never throws SecurityError
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 10000,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1224,
        windowHeight: 1815,
        onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
          clonedEl.style.opacity = '1';
          clonedEl.style.visibility = 'visible';
          clonedEl.style.transform = 'none';

          if (clonedEl.parentElement) {
            clonedEl.parentElement.style.opacity = '1';
            clonedEl.parentElement.style.visibility = 'visible';
            clonedEl.parentElement.style.zIndex = '999999';
          }

          // Ensure all images in cloned DOM have crossOrigin set to anonymous
          const imgs = clonedEl.querySelectorAll('img');
          imgs.forEach((img) => {
            img.crossOrigin = 'anonymous';
          });
        },
      });

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      if (dataUrl && dataUrl.startsWith('data:image/') && dataUrl.length > 500) {
        console.log('[E-Paper PDF] Successfully generated page image, length:', dataUrl.length);
        return dataUrl;
      } else {
        console.warn('[E-Paper PDF] canvas.toDataURL produced empty or invalid image');
      }
    }
  } catch (err) {
    console.error('[E-Paper PDF] html2canvas render exception:', err);
  }
  return '';
}

/**
 * Compile an array of base64 page images into an authentic multi-page PDF document
 */
export async function buildPdfFromImages(
  images: string[],
  filename: string = 'GujaratPost_EPaper.pdf'
): Promise<{ pdfBlob: Blob; pdfDataUri: string }> {
  // Broadsheet dimensions matching newspaper template (1224 x 1815 pt)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [1224, 1815],
    compress: true,
  });

  let validPagesCount = 0;

  for (let idx = 0; idx < images.length; idx++) {
    const imgData = images[idx];
    if (idx > 0) {
      doc.addPage([1224, 1815], 'portrait');
    }
    if (imgData && imgData.startsWith('data:image')) {
      try {
        doc.addImage(imgData, 'JPEG', 0, 0, 1224, 1815, undefined, 'FAST');
        validPagesCount++;
      } catch (addErr) {
        console.warn(`Error adding page ${idx + 1} to PDF:`, addErr);
      }
    } else {
      console.warn(`[E-Paper PDF] Warning: Page ${idx + 1} has no valid image data!`);
    }
  }

  const pdfBlob = doc.output('blob');
  const pdfDataUri = doc.output('datauristring');
  console.log(`[E-Paper PDF] PDF built with ${validPagesCount}/${images.length} pages, size: ${pdfBlob.size} bytes`);
  return { pdfBlob, pdfDataUri };
}

/**
 * Convert a base64 Data URL to a Blob
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob | null> {
  try {
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (_) {
    return null;
  }
}

/**
 * Upload compiled PDF Blob to backend and return public /uploads/... URL
 */
export async function uploadPdfBlob(blob: Blob, filename: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', blob, filename);
    const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
      method: 'POST',
      body: formData,
    });
    if (res && res.ok) {
      const json = await res.json();
      return json?.data?.url || json?.url || '';
    }
  } catch (err) {
    console.warn('PDF upload error:', err);
  }
  return '';
}

/**
 * Upload image Blob (e.g. newspaper front page thumbnail) to backend
 */
export async function uploadImageBlob(blob: Blob, filename: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', blob, filename);
    const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
      method: 'POST',
      body: formData,
    });
    if (res && res.ok) {
      const json = await res.json();
      return json?.data?.url || json?.url || '';
    }
  } catch (err) {
    console.warn('Image upload error:', err);
  }
  return '';
}

/**
 * Trigger immediate browser download of a PDF Blob
 */
export function downloadPdfBlob(blob: Blob, filename: string = 'GujaratPost_EPaper.pdf') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
