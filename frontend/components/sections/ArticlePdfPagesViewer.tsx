'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { getBackendApiUrl } from '@/lib/api';

interface ArticlePdfPagesViewerProps {
  pdfUrl: string;
  title?: string;
  language?: string;
  className?: string;
}

// Global cache for loaded pdf.js library promise to prevent duplicate script injections
let pdfjsLoadPromise: Promise<any> | null = null;

function loadPdfJsLibrary(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'));
  if ((window as any).pdfjsLib) return Promise.resolve((window as any).pdfjsLib);

  if (pdfjsLoadPromise) return pdfjsLoadPromise;

  pdfjsLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-pdfjs="1"]');
    if (existing) {
      existing.addEventListener('load', () => {
        const lib = (window as any).pdfjsLib;
        if (lib) {
          lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(lib);
        } else {
          reject(new Error('pdfjsLib not available'));
        }
      });
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.setAttribute('data-pdfjs', '1');
    script.async = true;
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      if (lib) {
        lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(lib);
      } else {
        reject(new Error('pdfjsLib not available'));
      }
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });

  return pdfjsLoadPromise;
}

export default function ArticlePdfPagesViewer({
  pdfUrl,
  title,
  language = 'gu',
  className = '',
}: ArticlePdfPagesViewerProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [renderingProgress, setRenderingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Lightbox / Zoom Modal State
  const [activeModalPage, setActiveModalPage] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const isMountedRef = useRef(true);

  // Localized strings
  const labels = {
    badge: language === 'gu' ? 'સત્તાવાર PDF દસ્તાવેજ' : language === 'hi' ? 'आधिकारिक पीडीएफ दस्तावेज़' : 'Official PDF Document',
    verified: language === 'gu' ? 'ચકાસાયેલ સત્તાવાર સરકારી / પ્રેસ દસ્તાવેજ' : language === 'hi' ? 'सत्यापित आधिकारिक दस्तावेज़' : 'Verified Official Attached Document',
    totalPages: language === 'gu' ? 'કુલ પાના' : language === 'hi' ? 'कुल पृष्ठ' : 'Total Pages',
    pageOf: (current: number, total: number) =>
      language === 'gu'
        ? `પાનું ${current} / ${total}`
        : language === 'hi'
        ? `पृष्ठ ${current} / ${total}`
        : `Page ${current} of ${total}`,
    download: language === 'gu' ? 'ડાઉનલોડ PDF' : language === 'hi' ? 'डाउनलोड पीडीएफ' : 'Download PDF',
    openNewTab: language === 'gu' ? 'નવા ટેબમાં ખોલો' : language === 'hi' ? 'नई विंडो में खोलें' : 'Open in New Tab',
    zoomIn: language === 'gu' ? 'મોટું જુઓ' : language === 'hi' ? 'बड़ा देखें' : 'Zoom In / Click to View',
    loading: language === 'gu' ? 'દસ્તાવેજના પાના લોડ થઈ રહ્યા છે...' : language === 'hi' ? 'दस्तावेज़ के पृष्ठ लोड हो रहे हैं...' : 'Loading document pages...',
    rendering: (current: number, total: number) =>
      language === 'gu'
        ? `પાનું ${current} / ${total} રેન્ડર થઈ રહ્યું છે...`
        : language === 'hi'
        ? `पृष्ठ ${current} / ${total} रेंडर हो रहा है...`
        : `Rendering page ${current} of ${total}...`,
    fallbackTitle: language === 'gu' ? 'PDF દસ્તાવેજ દર્શક' : language === 'hi' ? 'पीडीएफ दस्तावेज़ व्यूअर' : 'PDF Document Viewer',
  };

  const getCleanPdfUrl = useCallback((rawUrl: string): string => {
    if (!rawUrl) return '';
    const clean = rawUrl.trim();
    if (clean.startsWith('/uploads/')) {
      return getBackendApiUrl(clean);
    }
    return clean;
  }, []);

  const cleanUrl = getCleanPdfUrl(pdfUrl);
  const fileName = cleanUrl.split('/').pop()?.split('?')[0] || 'Official_Document.pdf';

  useEffect(() => {
    isMountedRef.current = true;
    if (!cleanUrl) {
      setLoading(false);
      return;
    }

    let cancelLoading = false;

    async function renderPdfPages() {
      setLoading(true);
      setError(null);
      setPages([]);
      setTotalPages(0);
      setRenderingProgress(0);

      try {
        const pdfjsLib = await loadPdfJsLibrary();
        if (cancelLoading || !isMountedRef.current) return;

        // Try direct cleanUrl first; if CORS error, use proxy fallback
        let doc: any = null;
        try {
          const loadingTask = pdfjsLib.getDocument({
            url: cleanUrl,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
          });
          doc = await loadingTask.promise;
        } catch (initialErr) {
          // If direct fetch fails (e.g. CORS on third-party link), route through backend download proxy
          const proxyUrl = getBackendApiUrl(`/api/public/download-pdf?url=${encodeURIComponent(cleanUrl)}`);
          const fallbackTask = pdfjsLib.getDocument({
            url: proxyUrl,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
          });
          doc = await fallbackTask.promise;
        }

        if (cancelLoading || !isMountedRef.current || !doc) return;

        const numPages = doc.numPages;
        setTotalPages(numPages);

        const renderedList: string[] = [];

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          if (cancelLoading || !isMountedRef.current) break;

          setRenderingProgress(pageNum);

          const page = await doc.getPage(pageNum);
          // Scale 1.75 - 2.0 provides crisp typography on Retina, 4K and mobile devices
          const viewport = page.getViewport({ scale: 1.8 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            const imgData = canvas.toDataURL('image/jpeg', 0.92);
            renderedList.push(imgData);

            // Progressive state update so Page 1 appears immediately without waiting for all pages!
            if (isMountedRef.current && !cancelLoading) {
              setPages([...renderedList]);
            }
          }
        }
      } catch (err: any) {
        console.error('PDF rendering failed, enabling fallback embed:', err);
        if (isMountedRef.current && !cancelLoading) {
          setError(err.message || 'Failed to render PDF pages');
        }
      } finally {
        if (isMountedRef.current && !cancelLoading) {
          setLoading(false);
        }
      }
    }

    renderPdfPages();

    return () => {
      cancelLoading = true;
      isMountedRef.current = false;
    };
  }, [cleanUrl]);

  // Download PDF helper
  const handleDownloadPdf = () => {
    if (!cleanUrl) return;
    const a = document.createElement('a');
    a.href = cleanUrl.includes('/uploads/')
      ? cleanUrl
      : getBackendApiUrl(`/api/public/download-pdf?url=${encodeURIComponent(cleanUrl)}&download=true`);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!cleanUrl) return null;

  return (
    <div className={`my-8 select-none ${className}`}>
      {/* ─── HEADER ACTION TOOLBAR ─── */}
      <div className="rounded-2xl border border-red-200/90 bg-gradient-to-r from-red-50/90 via-rose-50/70 to-red-50/90 dark:border-red-950/60 dark:from-red-950/40 dark:via-zinc-900 dark:to-red-950/40 p-4 sm:p-5 shadow-xs mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/30">
              <FileText className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {title || labels.badge}
                </span>
                {totalPages > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-black text-red-700 dark:bg-red-900/60 dark:text-red-300">
                    {labels.totalPages}: {totalPages}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{labels.verified}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-xs sm:text-sm font-black transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
              title="Download original PDF document file"
            >
              <Download className="h-4 w-4 stroke-[2.5]" />
              <span>{labels.download}</span>
            </button>

            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
              title="Open document in full window"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.openNewTab}</span>
            </a>
          </div>
        </div>
      </div>

      {/* ─── LOADING STATE WITH PROGRESS ─── */}
      {loading && pages.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 text-slate-600 dark:text-slate-400 space-y-3">
          <Loader2 className="h-9 w-9 animate-spin text-red-600" />
          <p className="text-sm font-bold">{labels.loading}</p>
          {renderingProgress > 0 && totalPages > 0 && (
            <p className="text-xs text-slate-500 font-mono">
              {labels.rendering(renderingProgress, totalPages)}
            </p>
          )}
        </div>
      )}

      {/* ─── PAGE BY PAGE RENDERED STACK (IMAGES) ─── */}
      {pages.length > 0 && (
        <div className="space-y-6">
          {pages.map((imgSrc, idx) => (
            <div
              key={`pdf-page-${idx}`}
              className="group rounded-2xl overflow-hidden border border-gray-300/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-md transition-shadow hover:shadow-xl"
            >
              {/* Individual Page Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100/90 dark:bg-zinc-800/90 border-b border-gray-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-red-600 text-[11px] font-black text-white">
                    {idx + 1}
                  </span>
                  <span>{labels.pageOf(idx + 1, totalPages || pages.length)}</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setActiveModalPage(idx);
                    setZoomLevel(1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                  title="Click to view large with zoom"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>{labels.zoomIn}</span>
                </button>
              </div>

              {/* Page Image */}
              <div
                onClick={() => {
                  setActiveModalPage(idx);
                  setZoomLevel(1);
                }}
                className="p-2 sm:p-5 flex justify-center bg-zinc-50/70 dark:bg-zinc-950/60 cursor-zoom-in"
                title="Click image to open high-resolution zoom view"
              >
                <img
                  src={imgSrc}
                  alt={`Document Page ${idx + 1}`}
                  className="w-full h-auto max-w-full rounded-lg shadow-sm border border-gray-200/60 dark:border-zinc-800 transition-transform group-hover:scale-[1.004]"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              </div>
            </div>
          ))}

          {/* If still rendering additional pages */}
          {loading && renderingProgress > 0 && totalPages > pages.length && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs font-bold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-red-600" />
              <span>{labels.rendering(renderingProgress, totalPages)}</span>
            </div>
          )}
        </div>
      )}

      {/* ─── ERROR FALLBACK: IFRAME EMBED VIEWER ─── */}
      {!loading && error && pages.length === 0 && (
        <div className="rounded-2xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden shadow-md">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>{labels.fallbackTitle}</span>
            </span>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              {labels.download} ↗
            </button>
          </div>
          <iframe
            src={`${cleanUrl}#toolbar=1&navpanes=0`}
            className="w-full h-[650px] border-none"
            title="PDF Document"
          />
        </div>
      )}

      {/* ─── BOTTOM DOWNLOAD BANNER ─── */}
      <div className="mt-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/40 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>{fileName}</span>
        </span>
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="text-red-600 dark:text-red-400 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{labels.download} (Original File)</span>
        </button>
      </div>

      {/* ─── LIGHTBOX FULLSCREEN ZOOM MODAL ─── */}
      {activeModalPage !== null && pages[activeModalPage] && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in-0 duration-200">
          {/* Lightbox Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 text-white shrink-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-sm font-bold">
                {labels.pageOf(activeModalPage + 1, pages.length)}
              </span>

              <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-mono font-bold px-1.5 min-w-[3.5rem] text-center text-zinc-300">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.2))}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="px-2 py-0.5 rounded text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                  title="Reset Zoom"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{labels.download}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalPage(null)}
                className="rounded-lg p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Image Container */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-0">
            <img
              src={pages[activeModalPage]}
              alt={`Page ${activeModalPage + 1}`}
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              className="max-h-full max-w-full h-auto object-contain transition-transform duration-150 rounded shadow-2xl"
            />
          </div>

          {/* Lightbox Bottom Navigation Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/80 border-t border-zinc-800 shrink-0 text-white">
            <button
              type="button"
              disabled={activeModalPage === 0}
              onClick={() => {
                setActiveModalPage((p) => Math.max(0, (p ?? 0) - 1));
                setZoomLevel(1);
              }}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous Page</span>
            </button>

            <span className="text-xs font-bold text-zinc-400">
              {activeModalPage + 1} of {pages.length}
            </span>

            <button
              type="button"
              disabled={activeModalPage === pages.length - 1}
              onClick={() => {
                setActiveModalPage((p) => Math.min(pages.length - 1, (p ?? 0) + 1));
                setZoomLevel(1);
              }}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            >
              <span>Next Page</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
