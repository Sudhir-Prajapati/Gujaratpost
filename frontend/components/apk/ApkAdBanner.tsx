'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ExternalLink, Sparkles } from 'lucide-react';
import { getPublicAds } from '@/lib/api';
import { useApp } from '@/components/AppProvider';

interface ApkAdBannerProps {
  section?: string;
  slotIndex?: number;
  className?: string;
}

export default function ApkAdBanner({
  section,
  slotIndex = 0,
  className = '',
}: ApkAdBannerProps) {
  const { language } = useApp();
  const [ads, setAds] = useState<any[]>([]);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  useEffect(() => {
    let isMounted = true;
    getPublicAds()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          // Filter only active ads with at least one image
          const activeAds = data.filter((a: any) => {
            if (!a || a.isActive === false) return false;
            return Boolean((a.image1 || a.image2 || a.image3)?.trim());
          });
          setAds(activeAds);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  if (ads.length === 0) return null;

  // Pick ad: match preferred section if specified, else pick by slotIndex
  let selectedAd: any = null;
  if (section) {
    selectedAd = ads.find(
      (a) => (a.section || '').toUpperCase() === section.toUpperCase()
    );
  }
  if (!selectedAd) {
    selectedAd = ads[slotIndex % ads.length];
  }

  if (!selectedAd) return null;

  // Collect available images and links for this ad
  const mediaItems: { image: string; link: string }[] = [];
  ['1', '2', '3'].forEach((num) => {
    const img = (selectedAd[`image${num}`] || '').trim();
    const lnk = (selectedAd[`link${num}`] || '').trim();
    if (img) {
      mediaItems.push({ image: img, link: lnk || '#' });
    }
  });

  if (mediaItems.length === 0) return null;

  const currentMedia = mediaItems[currentImgIdx % mediaItems.length] || mediaItems[0];
  const isVideo =
    (selectedAd.mediaType || '').toUpperCase() === 'VIDEO' ||
    /\.(mp4|webm|mov)(\?.*)?$/i.test(currentMedia.image);

  const adLabel =
    language === 'hi' ? 'विज्ञापन' : language === 'en' ? 'Ad' : 'જાહેરાત';
  const sponsoredLabel =
    language === 'hi' ? 'प्रायोजित' : language === 'en' ? 'Sponsored' : 'પ્રાયોજિત';
  const actionLabel =
    language === 'hi' ? 'देखें' : language === 'en' ? 'View' : 'હવે જુઓ';

  return (
    <div className={`px-3.5 my-3 select-none ${className}`}>
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#18181b] border border-gray-200/90 dark:border-gray-800 shadow-xs hover:shadow-md transition-all duration-300">
        {/* Top Header Strip: Ad Badge & Title */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50/90 dark:bg-[#1f2026] border-b border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center gap-1.5">
            <span className="bg-[#B3121B] text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase">
              {adLabel}
            </span>
            <span className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
              {selectedAd.title || sponsoredLabel}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            <span>{sponsoredLabel}</span>
          </div>
        </div>

        {/* Media Creative */}
        <a
          href={currentMedia.link && currentMedia.link !== '#' ? currentMedia.link : undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="group block relative w-full aspect-[16/7] bg-slate-900 overflow-hidden cursor-pointer active:opacity-95"
        >
          {isVideo ? (
            <video
              src={currentMedia.image}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={currentMedia.image}
              alt={selectedAd.title || 'Advertisement'}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-102"
              sizes="(max-width: 640px) 100vw, 450px"
            />
          )}

          {/* Action CTA Overlay if link exists */}
          {currentMedia.link && currentMedia.link !== '#' && (
            <div className="absolute bottom-2 right-2 z-10">
              <span className="flex items-center gap-1 bg-black/75 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/20 shadow-md group-hover:bg-[#B3121B] transition">
                <span>{actionLabel}</span>
                <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
              </span>
            </div>
          )}
        </a>
      </div>
    </div>
  );
}
