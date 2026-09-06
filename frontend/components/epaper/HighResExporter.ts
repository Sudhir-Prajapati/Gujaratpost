'use client';

/**
 * Utility to render a DOM element (Newspaper Page) into a high-resolution Data URL image
 */
export async function renderElementToDataUrl(element: HTMLElement, scale: number = 2): Promise<string> {
  // Try html2canvas if available
  try {
    const html2canvas = (await import('html2canvas')).default;
    if (html2canvas) {
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fffdfa',
        logging: false,
      });
      return canvas.toDataURL('image/jpeg', 0.90);
    }
  } catch (err) {
    console.warn('html2canvas import fallback to SVG canvas rendering', err);
  }

  // Fallback: Native SVG foreignObject canvas rendering
  return new Promise((resolve) => {
    try {
      const width = element.offsetWidth || 800;
      const height = element.offsetHeight || 1130;

      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve('');
        return;
      }

      ctx.scale(scale, scale);

      // Clone HTML and sanitize
      const clone = element.cloneNode(true) as HTMLElement;
      const data = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            <style>
              * { box-sizing: border-box; }
              body { margin: 0; background-color: #fffdfa; font-family: serif; }
            </style>
            ${clone.outerHTML}
          </div>
        </foreignObject>
      </svg>`;

      const img = new Image();
      const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);

      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.90));
      };

      img.onerror = () => {
        resolve('');
      };

      img.src = svgUrl;
    } catch (_) {
      resolve('');
    }
  });
}
