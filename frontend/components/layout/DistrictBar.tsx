'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/components/AppProvider';

const DISTRICTS = [
  { gu: 'અમદાવાદ', hi: 'अहमदाबाद', en: 'Ahmedabad', slug: 'ahmedabad' },
  { gu: 'ગાંધીનગર', hi: 'गांधीनगर', en: 'Gandhinagar', slug: 'gandhinagar' },
  { gu: 'સુરત', hi: 'સુરત', en: 'Surat', slug: 'surat' },
  { gu: 'વડોદરા', hi: 'वडोदरा', en: 'Vadodara', slug: 'vadodara' },
  { gu: 'રાજકોટ', hi: 'રાજકોટ', en: 'Rajkot', slug: 'rajkot' },
  { gu: 'અન્ય શહેરો', hi: 'अन्य शहर', en: 'Other Cities', slug: 'other-cities' }
];

export default function DistrictBar() {
  const { language } = useApp();
  const pathname = usePathname();
  const [gujaratCategories, setGujaratCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCats = () => {
      import('@/lib/api').then(({ getPublicCategories }) => {
        getPublicCategories({ showInHeader: true, headerType: 'GUJARAT' })
          .then((cats) => {
            if (cats && Array.isArray(cats) && cats.length > 0) {
              setGujaratCategories(cats.sort((a, b) => (b.headerOrder ?? b.displayOrder ?? 0) - (a.headerOrder ?? a.displayOrder ?? 0)));
            }
          })
          .catch(() => {});
      });
    };

    fetchCats();
    window.addEventListener('focus', fetchCats);
    window.addEventListener('gp-categories-updated', fetchCats);
    return () => {
      window.removeEventListener('focus', fetchCats);
      window.removeEventListener('gp-categories-updated', fetchCats);
    };
  }, []);

  const isActive = (slug: string) => {
    return pathname === `/category/${slug}` || pathname.startsWith(`/category/${slug}/`);
  };

  const displayList = useMemo(() => {
    const rawList = gujaratCategories && gujaratCategories.length > 0
      ? gujaratCategories.map((cat) => {
        const slug = (cat.slug || '').toLowerCase();
        const distMatch = DISTRICTS.find((d) => d.slug === slug);
        let label = cat.name;
        if (distMatch) {
          label = language === 'hi' ? distMatch.hi : language === 'gu' ? distMatch.gu : distMatch.en;
        } else {
          label = language === 'hi' ? (cat.nameHi || cat.name) : language === 'gu' ? (cat.nameGu || cat.name) : (cat.nameGu || cat.name);
        }
        return { slug: cat.slug, label };
      })
      : DISTRICTS.map((dist) => ({
        slug: dist.slug,
        label: language === 'hi' ? dist.hi : language === 'gu' ? dist.gu : dist.en,
      }));

    // Ensure Ahmedabad starts first right after the Gujarat logo
    return [...rawList].sort((a, b) => {
      if (a.slug === 'ahmedabad') return -1;
      if (b.slug === 'ahmedabad') return 1;
      return 0;
    });
  }, [gujaratCategories, language]);

  return (
    <div className="w-full border-t border-border/40 bg-card/95 backdrop-blur-md select-none">
      <div className="mx-auto flex max-w-[1700px] items-center gap-2 px-1.5 sm:px-2 xl:px-3">
        {/* Gujarat Map Logo and vertical separator */}
        <Link
          href="/category/gujarat"
          className="flex items-center justify-center shrink-0 ml-1 sm:ml-2.5 pr-1.5 sm:pr-2 border-r border-border/60 h-8 md:h-9 self-center overflow-hidden"
          title={language === 'gu' ? 'ગુજરાત' : language === 'hi' ? 'गुजरात' : 'Gujarat'}
        >
          <img
            src="/assets/GujaratLogo.png"
            alt="Gujarat Logo"
            width={28} height={24} style={{ height: "24px", maxHeight: "24px", width: "auto", maxWidth: "36px", objectFit: "contain" }} className="district-gujarat-logo h-6 md:h-7.5 max-h-6 md:max-h-7.5 w-auto object-contain transition-transform duration-200 hover:scale-105 cursor-pointer select-none shrink-0"
          />
        </Link>

        {/* Scrollable list of Districts - Ahmedabad starts immediately with minimal spacing */}
        <div className="flex-1 overflow-x-auto scrollbar-none overscroll-x-contain touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex items-center gap-4 sm:gap-4.5 md:gap-5 py-0 pl-1 pr-3 md:pr-4">
            {displayList.map((item) => {
              const active = isActive(item.slug);
              return (
                <Link
                  key={`${item.slug}-${language}`}
                  href={`/category/${item.slug}`}
                  className={`relative flex shrink-0 h-10 md:h-11 items-center whitespace-nowrap text-[15.5px] sm:text-[16px] md:text-[16px] font-extrabold tracking-tight transition-colors duration-150 ${active ? 'text-accent font-black' : 'text-foreground hover:text-accent'
                    }`}
                  style={{ fontWeight: 800 }}
                  aria-current={active ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-accent"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
