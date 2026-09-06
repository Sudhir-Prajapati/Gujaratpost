'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppProvider';

const DISTRICTS = [
  { gu: 'અમદાવાદ', hi: 'अहमदाबाद', en: 'Ahmedabad', slug: 'ahmedabad' },
  { gu: 'ગાંધીનગર', hi: 'गांधीनगर', en: 'Gandhinagar', slug: 'gandhinagar' },
  { gu: 'સુરત', hi: 'सूरत', en: 'Surat', slug: 'surat' },
  { gu: 'વડોદરા', hi: 'वडोदरा', en: 'Vadodara', slug: 'vadodara' },
  { gu: 'રાજકોટ', hi: 'राजकोट', en: 'Rajkot', slug: 'rajkot' },
  { gu: 'અન્ય શહેરો', hi: 'अन्य शहर', en: 'Other Cities', slug: 'other-cities' }
];

export default function DistrictBar() {
  const { language } = useApp();
  const [gujaratCategories, setGujaratCategories] = useState<any[]>([]);

  useEffect(() => {
    import('@/lib/api').then(({ getPublicCategories }) => {
      getPublicCategories({ showInHeader: true, headerType: 'GUJARAT' })
        .then((cats) => {
          if (cats && Array.isArray(cats)) {
            setGujaratCategories(cats.sort((a, b) => (b.headerOrder ?? b.displayOrder ?? 0) - (a.headerOrder ?? a.displayOrder ?? 0)));
          }
        })
        .catch(() => {});
    });
  }, []);

  const displayList = useMemo(() => {
    const seenSlugs = new Set<string>();
    const result: Array<{ slug: string; label: string }> = [];

    // 1. Add DB categories with headerType = 'GUJARAT' first
    gujaratCategories.forEach((cat) => {
      const slug = (cat.slug || '').toLowerCase();
      if (!seenSlugs.has(slug)) {
        seenSlugs.add(slug);
        const distMatch = DISTRICTS.find((d) => d.slug === slug);
        let label = cat.name;
        if (distMatch) {
          label = language === 'hi' ? distMatch.hi : language === 'gu' ? distMatch.gu : distMatch.en;
        } else {
          label = language === 'hi' ? (cat.nameHi || cat.name) : language === 'gu' ? (cat.nameGu || cat.name) : cat.name;
        }
        result.push({ slug: cat.slug, label });
      }
    });

    // 2. Add fallback static districts if not already present
    DISTRICTS.forEach((dist) => {
      const slug = dist.slug.toLowerCase();
      if (!seenSlugs.has(slug)) {
        seenSlugs.add(slug);
        const label = language === 'hi' ? dist.hi : language === 'gu' ? dist.gu : dist.en;
        result.push({ slug: dist.slug, label });
      }
    });

    return result;
  }, [gujaratCategories, language]);

  return (
    <div className="w-full border-t border-border/40 bg-card/95 backdrop-blur-md select-none py-1 md:py-2">
      <div className="mx-auto flex max-w-screen-xl max-w-header-layout items-center gap-2 md:gap-3.5 px-3 md:px-4">
        {/* Gujarat Map Logo and vertical separator */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0 pr-2 md:pr-3 border-r border-border/50">
          <img
            src="/assets/GujaratLogo.png"
            alt="Gujarat Logo"
            style={{ height: '28px', width: 'auto', display: 'block' }}
            className="object-contain transform transition-transform duration-300 hover:scale-110 cursor-pointer select-none md:h-[38px]"
          />
        </div>

        {/* Scrollable list of Districts */}
        <div className="flex-1 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-4 md:gap-6 py-0.5 pr-2 md:pr-4">
            
            {displayList.map((item) => (
              <Link
                key={`${item.slug}-${language}`}
                href={`/category/${item.slug}`}
                className="text-[13px] md:text-[16px] font-extrabold text-foreground hover:text-[#B3121B] transition-colors duration-150 whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
