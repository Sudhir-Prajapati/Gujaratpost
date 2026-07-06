'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getLocalized } from '@/data';

interface ZodiacSign {
  id: string;
  name: string;
  nameGu: string;
  nameHi: string;
  image: string;
  prediction: string;
  predictionGu: string;
}

const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    id: 'aries',
    name: 'Aries',
    nameGu: 'મેષ',
    nameHi: 'मेष',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&h=200&fit=crop&q=80',
    prediction: 'Your energy levels will be high today. Great opportunities await in your professional career.',
    predictionGu: 'આજનો દિવસ તમારા માટે ઉર્જાવાન રહેશે. કાર્યક્ષેત્રમાં નવી તકો પ્રાપ્ત થવાની પ્રબળ સંભાવના છે.',
  },
  {
    id: 'taurus',
    name: 'Taurus',
    nameGu: 'વૃષભ',
    nameHi: 'वृषभ',
    image: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=200&h=200&fit=crop&q=80',
    prediction: 'Focus on financial planning today. Patience in communication will resolve personal issues.',
    predictionGu: 'નાણાકીય બાબતોમાં સાવધાની રાખવી. વાણી પર સંયમ રાખવાથી પારિવારિક વિવાદો ટળી શકે છે.',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    nameGu: 'મિથુન',
    nameHi: 'मिथुन',
    image: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=200&h=200&fit=crop&q=80',
    prediction: 'A creative solution to a long-standing task brings joy. Travel plans are favored.',
    predictionGu: 'લાંબા સમયથી અટકેલા કામો પૂર્ણ થતાં મન પ્રસન્ન રહેશે. નવી મુસાફરીના યોગ બની રહ્યા છે.',
  },
  {
    id: 'cancer',
    name: 'Cancer',
    nameGu: 'કર્ક',
    nameHi: 'कर्क',
    image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=200&h=200&fit=crop&q=80',
    prediction: 'Trust your intuition today. Spend time with family members to strengthen emotional bonds.',
    predictionGu: 'આજે તમારી આંતરપ્રજ્ઞા પર વિશ્વાસ રાખો. પરિવાર સાથે શાંતિપૂર્ણ સમય વિતાવવો લાભદાયી રહેશે.',
  },
  {
    id: 'leo',
    name: 'Leo',
    nameGu: 'સિંહ',
    nameHi: 'सिंह',
    image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=200&h=200&fit=crop&q=80',
    prediction: 'Leadership roles will suit you today. Keep a check on your health and eat fresh.',
    predictionGu: 'આજે નેતૃત્વ ગુણો ખીલી ઉઠશે. સ્વાસ્થ્ય પ્રત્યે થોડી કાળજી રાખવાની જરૂરિયાત છે.',
  },
  {
    id: 'virgo',
    name: 'Virgo',
    nameGu: 'કન્યા',
    nameHi: 'कन्या',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&h=200&fit=crop&q=80',
    prediction: 'Attention to detail will earn you praise at work. A good day for romantic matters.',
    predictionGu: 'કામની બારીકીઓ પર ધ્યાન આપવાથી યશ મળશે. દાંપત્યજીવનમાં મધુરતા વધવાના સંકેત છે.',
  },
  {
    id: 'libra',
    name: 'Libra',
    nameGu: 'તુલા',
    nameHi: 'तुला',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&h=200&fit=crop&q=80',
    prediction: 'Balance is key today. Partnerships in business will prove to be highly profitable.',
    predictionGu: 'જીવનમાં સંતુલન જાળવી રાખવું જરૂરી છે. વેપારમાં ભાગીદારીથી આર્થિક ફાયદો થઈ શકે છે.',
  },
  {
    id: 'scorpio',
    name: 'Scorpio',
    nameGu: 'વૃશ્ચિક',
    nameHi: 'वृश्चिक',
    image: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=200&h=200&fit=crop&q=80',
    prediction: 'Determination will help you overcome any hurdles. Keep secrets to yourself.',
    predictionGu: 'મક્કમ નિર્ણય શક્તિ તમને મુશ્કેલીઓમાંથી બહાર લાવશે. ગુપ્ત બાબતો કોઈની સાથે શેર ન કરવી.',
  },
  {
    id: 'sagittarius',
    name: 'Sagittarius',
    nameGu: 'ધન',
    nameHi: 'धनु',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=200&h=200&fit=crop&q=80',
    prediction: 'Optimism guide your actions today. Spiritual pursuits provide inner peace and clarity.',
    predictionGu: 'આશાવાદી વલણ તમારા કાર્યોને સફળ બનાવશે. આધ્યાત્મિકતા તરફ રસ વધવાથી માનસિક શાંતિ મળશે.',
  },
  {
    id: 'capricorn',
    name: 'Capricorn',
    nameGu: 'મકર',
    nameHi: 'मकर',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop&q=80',
    prediction: 'Hard work begins to pay off. Stay disciplined and focus on long term career goals.',
    predictionGu: 'મહેનતનું ફળ મળવાની શરૂઆત થશે. શિસ્તબદ્ધ રહીને લાંબા ગાળાના આયોજન પર ધ્યાન કેન્દ્રિત કરો.',
  },
  {
    id: 'aquarius',
    name: 'Aquarius',
    nameGu: 'કુંભ',
    nameHi: 'कुंभ',
    image: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=200&h=200&fit=crop&q=80',
    prediction: 'New networking channels open up. Trust your creative intellect for business expansion.',
    predictionGu: 'સંપર્કોની નવી શ્રેણી ખુલશે. વેપારના વિસ્તરણ માટે બૌદ્ધિક ક્ષમતાનો ઉપયોગ કરવો હિતાવહ છે.',
  },
  {
    id: 'pisces',
    name: 'Pisces',
    nameGu: 'મીન',
    nameHi: 'मीन',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&h=200&fit=crop&q=80',
    prediction: 'A day of dream interpretation and emotional healing. Health parameters look excellent.',
    predictionGu: 'માનસિક અને ભાવનાત્મક ક્ષેત્રે રાહત અનુભવાશે. એકંદરે આરોગ્ય સારું અને સુદ્રઢ રહેશે.',
  }
];

export default function AstrologySection() {
  const { language } = useApp();
  const [selectedZodiac, setSelectedZodiac] = useState<ZodiacSign | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 10);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="bg-card border-b border-border py-5 relative overflow-hidden">
      <div className="mx-auto max-w-screen-xl px-4 relative">
        {/* Title Block */}
        <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-2">
          <span className="rounded bg-[#c0392b] px-3.5 py-1.5 text-xs sm:text-sm font-black text-white uppercase tracking-wider shadow-sm">
            {getLocalized(language, { en: 'Astrology', gu: 'જ્યોતિષ શાસ્ત્ર', hi: 'ज्योतिष शास्त्र' })}
          </span>
        </div>

        {/* Scrollable Layout */}
        <div className="relative group/slider-wrap">
          {showLeftArrow && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="absolute left-1 sm:-left-5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/85 dark:bg-slate-900/85 backdrop-blur shadow-lg text-foreground hover:bg-white dark:hover:bg-slate-950 transition-all duration-200"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
            </button>
          )}

          {showRightArrow && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="absolute right-1 sm:-right-5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/85 dark:bg-slate-900/85 backdrop-blur shadow-lg text-foreground hover:bg-white dark:hover:bg-slate-950 transition-all duration-200"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5 stroke-[2.5]" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="scrollbar-hide flex gap-6 overflow-x-auto scroll-smooth py-2 justify-between items-center px-2"
          >
            {ZODIAC_SIGNS.map((sign) => {
              const displayGu = sign.nameGu;
              const displayEn = sign.name;
              return (
                <div
                  key={sign.id}
                  onClick={() => setSelectedZodiac(sign)}
                  className="flex flex-col items-center shrink-0 cursor-pointer select-none group text-center"
                >
                  {/* Gujarati Name on Top */}
                  <span className="text-[13px] font-bold text-foreground group-hover:text-accent transition-colors">
                    {displayGu}
                  </span>

                  {/* Circle Illustration */}
                  <div className="my-1.5 rounded-full border border-border bg-card p-[1.5px] shadow-sm transition duration-300 group-hover:scale-105 group-active:scale-95">
                    <div className="relative rounded-full overflow-hidden h-[62px] w-[62px] md:h-[72px] md:w-[72px] bg-slate-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sign.image}
                        alt={sign.name}
                        className="h-full w-full object-cover"
                        style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* English Name at Bottom */}
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {displayEn}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Rashifal Horoscope Modal */}
      {selectedZodiac && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedZodiac(null)} />
          
          <div className="relative w-full max-w-md rounded-3xl overflow-hidden bg-card border border-border p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-center">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedZodiac(null)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground/10 transition"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Zodiac Header Illustration */}
            <div className="mx-auto mt-4 rounded-full border border-border p-1 shadow-md w-24 h-24 overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedZodiac.image}
                alt={selectedZodiac.name}
                className="rounded-full w-full h-full object-cover"
                style={{ height: '100%', width: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Zodiac Titles */}
            <h3 className="mt-4 text-xl font-black text-foreground">
              {selectedZodiac.nameGu} ({selectedZodiac.name})
            </h3>
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mt-1">
              {getLocalized(language, { en: 'Daily Horoscope', gu: 'આજનું રાશિફળ', hi: 'आज का राशिफल' })}
            </p>

            {/* Horoscope Prediction Text */}
            <div className="mt-5 border-t border-border/80 pt-4 text-left">
              <p className="text-sm font-black text-foreground leading-relaxed">
                {language === 'gu' ? selectedZodiac.predictionGu : selectedZodiac.prediction}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => setSelectedZodiac(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-[#c0392b] text-white text-sm font-bold shadow-md hover:bg-red-700 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
