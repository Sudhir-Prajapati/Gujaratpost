'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getPublicAds } from '@/lib/api';

export interface RandomAdItem {
  id: string;
  image: string;
  link: string;
  titleGu: string;
  titleEn: string;
  titleHi: string;
  descriptionGu?: string;
  descriptionEn?: string;
  descriptionHi?: string;
  sourceGu: string;
  sourceEn: string;
  sourceHi: string;
  buttonGu?: string;
  buttonEn?: string;
  buttonHi?: string;
}

export default function RandomAdsSection() {
  const { language } = useApp();
  const [adItems, setAdItems] = useState<RandomAdItem[]>([]);
  const [visibleSectionsCount, setVisibleSectionsCount] = useState<number>(1);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPublicAds()
      .then((adsRes) => {
        if (!adsRes || !Array.isArray(adsRes) || adsRes.length === 0) return;

        const collected: RandomAdItem[] = [];

        // Parse ALL active ads configured from the Admin panel
        adsRes.forEach((ad: any) => {
          if (!ad || ad.isActive === false) return;

          ['1', '2', '3'].forEach((num) => {
            const img = ad[`image${num}`];
            const link = ad[`link${num}`];
            if (img && typeof img === 'string' && img.trim() !== '') {
              const adTitle = ad.title || 'સ્પેશિયલ સ્પોન્સર ઓફર';
              collected.push({
                id: `${ad.id}-${num}`,
                image: img.trim(),
                link: link && typeof link === 'string' && link.trim() !== '' ? link.trim() : '#',
                titleGu: adTitle,
                titleEn: adTitle,
                titleHi: adTitle,
                sourceGu: ad.section ? `${ad.section} | પ્રાયોજિત` : 'પ્રાયોજિત',
                sourceEn: ad.section ? `${ad.section} | Sponsored` : 'Sponsored',
                sourceHi: ad.section ? `${ad.section} | प्रायोजित` : 'प्रायोजित',
                buttonGu: 'હવે જુઓ',
                buttonEn: 'View Now',
                buttonHi: 'अभी देखें',
              });
            }
          });
        });

        if (collected.length > 0) {
          const finalPool = [...collected];
          let fillIdx = 0;
          while (finalPool.length % 7 !== 0) {
            finalPool.push({
              ...collected[fillIdx % collected.length],
              id: `dyn-repeat-${finalPool.length}`,
            });
            fillIdx++;
          }
          setAdItems(finalPool);
        }
      })
      .catch(() => {});
  }, []);

  const totalSections = Math.max(1, Math.ceil(adItems.length / 7));

  // Trigger loading Section 2 when user reaches the bottom/end of Section 1 on scroll
  useEffect(() => {
    const el = triggerRef.current;
    if (!el || visibleSectionsCount >= totalSections) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingNext) {
          setIsLoadingNext(true);
          setTimeout(() => {
            setVisibleSectionsCount((prev) => Math.min(prev + 1, totalSections));
            setIsLoadingNext(false);
          }, 350);
        }
      },
      { rootMargin: '120px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visibleSectionsCount, totalSections, isLoadingNext]);

  // If no dynamic ads exist from the API, render nothing
  if (adItems.length === 0) {
    return null;
  }

  // Chunk items into 7 ads per section
  const sectionsCount = Math.max(1, Math.ceil(adItems.length / 7));
  const sections: RandomAdItem[][] = [];

  for (let i = 0; i < sectionsCount; i++) {
    const chunk = adItems.slice(i * 7, (i + 1) * 7);
    while (chunk.length < 7 && adItems.length > 0) {
      chunk.push({
        ...adItems[chunk.length % adItems.length],
        id: `dyn-chunk-pad-${i}-${chunk.length}`,
      });
    }
    sections.push(chunk);
  }

  const getTitle = (item: RandomAdItem) => {
    if (language === 'hi') return item.titleHi || item.titleGu || item.titleEn;
    if (language === 'en') return item.titleEn || item.titleGu;
    return item.titleGu || item.titleEn;
  };

  const getDesc = (item: RandomAdItem) => {
    if (language === 'hi') return item.descriptionHi || item.descriptionGu || item.descriptionEn;
    if (language === 'en') return item.descriptionEn || item.descriptionGu;
    return item.descriptionGu || item.descriptionEn;
  };

  const getSource = (item: RandomAdItem) => {
    if (language === 'hi') return item.sourceHi || item.sourceGu;
    if (language === 'en') return item.sourceEn || item.sourceGu;
    return item.sourceGu || item.sourceEn;
  };

  const getBtn = (item: RandomAdItem) => {
    if (language === 'hi') return item.buttonHi || item.buttonGu || 'अभी देखें';
    if (language === 'en') return item.buttonEn || item.buttonGu || 'View Now';
    return item.buttonGu || 'હવે ખરીદો';
  };

  return (
    <section id="infinite-ads-section" className="mx-auto max-w-screen-xl px-2 sm:px-4 py-8 select-none">
      {sections.slice(0, visibleSectionsCount).map((secItems, secIdx) => {
        const item1 = secItems[0];
        const item2 = secItems[1];
        const item3 = secItems[2];
        const item4 = secItems[3];
        const item5 = secItems[4];
        const item6 = secItems[5];
        const item7 = secItems[6];

        return (
          <div key={secIdx} className="mb-10 space-y-6">
            {/* Top Header Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/80" />
              </div>
              <span className="relative bg-background px-4 text-[13px] md:text-[14px] font-extrabold text-muted-foreground uppercase tracking-widest select-none">
                {language === 'gu' ? 'તમને આ પણ ગમશે' : language === 'hi' ? 'आपको यह भी पसंद आ सकता है' : 'You May Also Like'}
              </span>
            </div>

            {/* 7-Card Sponsored Grid Container */}
            <div className="bg-card/90 dark:bg-card border border-border/80 rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
              
              {/* ── ROW 1: 2 Horizontal Cards ─────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1 */}
                <a
                  href={item1.link !== '#' ? item1.link : undefined}
                  target={item1.link !== '#' ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="group flex flex-col sm:flex-row gap-4 bg-background dark:bg-card/40 border border-border/60 rounded-2xl p-3.5 sm:p-4 hover:border-red-500/40 hover:shadow-md transition-all duration-300 min-w-0"
                >
                  <div className="relative w-full sm:w-[45%] aspect-[4/3] shrink-0 overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={item1.image}
                      alt={getTitle(item1)}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-between min-w-0 flex-1 py-1">
                    <div>
                      <h4 className="text-[14.5px] sm:text-[15.5px] font-black text-foreground leading-snug line-clamp-2 group-hover:text-[#B3121B] transition-colors">
                        {getTitle(item1)}
                      </h4>
                      {getDesc(item1) && (
                        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 mt-1.5 font-medium">
                          {getDesc(item1)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                      <span className="text-[11px] font-bold text-muted-foreground/90">
                        {getSource(item1)}
                      </span>
                      {item1.buttonGu && (
                        <span className="text-[11.5px] font-black text-[#B3121B] border border-red-500/60 rounded-full px-3 py-0.5 hover:bg-[#B3121B] hover:text-white transition-colors">
                          {getBtn(item1)}
                        </span>
                      )}
                    </div>
                  </div>
                </a>

                {/* Card 2 */}
                <a
                  href={item2.link !== '#' ? item2.link : undefined}
                  target={item2.link !== '#' ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="group flex flex-col sm:flex-row gap-4 bg-background dark:bg-card/40 border border-border/60 rounded-2xl p-3.5 sm:p-4 hover:border-red-500/40 hover:shadow-md transition-all duration-300 min-w-0"
                >
                  <div className="relative w-full sm:w-[45%] aspect-[4/3] shrink-0 overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={item2.image}
                      alt={getTitle(item2)}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-between min-w-0 flex-1 py-1">
                    <div>
                      <h4 className="text-[14.5px] sm:text-[15.5px] font-black text-foreground leading-snug line-clamp-3 group-hover:text-[#B3121B] transition-colors">
                        {getTitle(item2)}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                      <span className="text-[11px] font-bold text-muted-foreground/90">
                        {getSource(item2)}
                      </span>
                    </div>
                  </div>
                </a>
              </div>

              {/* ── ROW 2: 3 Vertical Cards ─────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 3 */}
                <a
                  href={item3.link !== '#' ? item3.link : undefined}
                  target={item3.link !== '#' ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-background dark:bg-card/40 border border-border/60 rounded-2xl p-3.5 sm:p-4 hover:border-red-500/40 hover:shadow-md transition-all duration-300 min-w-0"
                >
                  <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xl bg-muted mb-3">
                    <Image
                      src={item3.image}
                      alt={getTitle(item3)}
                      fill
                      sizes="(max-width: 768px) 100vw, 30vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="text-[14.5px] font-black text-foreground leading-snug line-clamp-2 group-hover:text-[#B3121B] transition-colors">
                        {getTitle(item3)}
                      </h4>
                      {getDesc(item3) && (
                        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 mt-1.5 font-medium">
                          {getDesc(item3)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-border/40">
                      <span className="text-[11px] font-bold text-muted-foreground/90">
                        {getSource(item3)}
                      </span>
                      {item3.buttonGu && (
                        <span className="text-[11.5px] font-black text-[#B3121B] border border-red-500/60 rounded-full px-3 py-0.5 hover:bg-[#B3121B] hover:text-white transition-colors">
                          {getBtn(item3)}
                        </span>
                      )}
                    </div>
                  </div>
                </a>

                {/* Card 4 */}
                <a
                  href={item4.link !== '#' ? item4.link : undefined}
                  target={item4.link !== '#' ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-background dark:bg-card/40 border border-border/60 rounded-2xl p-3.5 sm:p-4 hover:border-red-500/40 hover:shadow-md transition-all duration-300 min-w-0"
                >
                  <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xl bg-muted mb-3">
                    <Image
                      src={item4.image}
                      alt={getTitle(item4)}
                      fill
                      sizes="(max-width: 768px) 100vw, 30vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="text-[14.5px] font-black text-foreground leading-snug line-clamp-3 group-hover:text-[#B3121B] transition-colors">
                        {getTitle(item4)}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-border/40">
                      <span className="text-[11px] font-bold text-muted-foreground/90">
                        {getSource(item4)}
                      </span>
                    </div>
                  </div>
                </a>

                {/* Card 5 */}
                <a
                  href={item5.link !== '#' ? item5.link : undefined}
                  target={item5.link !== '#' ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-background dark:bg-card/40 border border-border/60 rounded-2xl p-3.5 sm:p-4 hover:border-red-500/40 hover:shadow-md transition-all duration-300 min-w-0"
                >
                  <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xl bg-muted mb-3">
                    <Image
                      src={item5.image}
                      alt={getTitle(item5)}
                      fill
                      sizes="(max-width: 768px) 100vw, 30vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="text-[14.5px] font-black text-foreground leading-snug line-clamp-3 group-hover:text-[#B3121B] transition-colors">
                        {getTitle(item5)}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-border/40">
                      <span className="text-[11px] font-bold text-muted-foreground/90">
                        {getSource(item5)}
                      </span>
                    </div>
                  </div>
                </a>
              </div>

              {/* ── ROW 3: 2 Horizontal Cards ─────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 6 */}
                <a
                  href={item6.link !== '#' ? item6.link : undefined}
                  target={item6.link !== '#' ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="group flex flex-col sm:flex-row gap-4 bg-background dark:bg-card/40 border border-border/60 rounded-2xl p-3.5 sm:p-4 hover:border-red-500/40 hover:shadow-md transition-all duration-300 min-w-0"
                >
                  <div className="relative w-full sm:w-[45%] aspect-[4/3] shrink-0 overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={item6.image}
                      alt={getTitle(item6)}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-between min-w-0 flex-1 py-1">
                    <div>
                      <h4 className="text-[14.5px] sm:text-[15.5px] font-black text-foreground leading-snug line-clamp-2 group-hover:text-[#B3121B] transition-colors">
                        {getTitle(item6)}
                      </h4>
                      {getDesc(item6) && (
                        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 mt-1.5 font-medium">
                          {getDesc(item6)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                      <span className="text-[11px] font-bold text-muted-foreground/90">
                        {getSource(item6)}
                      </span>
                      {item6.buttonGu && (
                        <span className="text-[11.5px] font-black text-[#B3121B] border border-red-500/60 rounded-full px-3 py-0.5 hover:bg-[#B3121B] hover:text-white transition-colors">
                          {getBtn(item6)}
                        </span>
                      )}
                    </div>
                  </div>
                </a>

                {/* Card 7 */}
                <a
                  href={item7.link !== '#' ? item7.link : undefined}
                  target={item7.link !== '#' ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="group flex flex-col sm:flex-row gap-4 bg-background dark:bg-card/40 border border-border/60 rounded-2xl p-3.5 sm:p-4 hover:border-red-500/40 hover:shadow-md transition-all duration-300 min-w-0"
                >
                  <div className="relative w-full sm:w-[45%] aspect-[4/3] shrink-0 overflow-hidden rounded-xl bg-muted">
                    <Image
                      src={item7.image}
                      alt={getTitle(item7)}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col justify-between min-w-0 flex-1 py-1">
                    <div>
                      <h4 className="text-[14.5px] sm:text-[15.5px] font-black text-foreground leading-snug line-clamp-3 group-hover:text-[#B3121B] transition-colors">
                        {getTitle(item7)}
                      </h4>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                      <span className="text-[11px] font-bold text-muted-foreground/90">
                        {getSource(item7)}
                      </span>
                    </div>
                  </div>
                </a>
              </div>

            </div>

            {/* Bottom Separator / More Sponsored Links Divider */}
            {secIdx < visibleSectionsCount - 1 && (
              <div className="relative flex items-center justify-center pt-6 pb-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/80" />
                </div>
                <span className="relative bg-background px-4 text-[12px] md:text-[13px] font-extrabold text-muted-foreground select-none border border-border/80 rounded-full py-1">
                  {language === 'gu' ? 'પ્રાયોજિત લિંક્સ' : language === 'hi' ? 'प्रायोजित लिंक्स' : 'Sponsored Links'}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Sensor Target & Loading Text matching live site screenshot */}
      {visibleSectionsCount < sections.length && (
        <div ref={triggerRef} className="py-6 text-center select-none">
          <p className="text-slate-400 dark:text-slate-500 text-[13.5px] md:text-[14.5px] font-bold tracking-wide">
            {language === 'gu' ? 'વધુ લોડ થઈ રહ્યું છે...' : language === 'hi' ? 'और लोड हो रहा है...' : 'Loading more...'}
          </p>
        </div>
      )}
    </section>
  );
}
