import React from 'react';

export const GUJARATI_ZODIAC_DATES: Record<string, string> = {
  aries: '(21 માર્ - 19 એપ્રિ)',
  taurus: '(20 એપ્રિ - 20 મે)',
  gemini: '(21 મે - 20 જૂન)',
  cancer: '(21 જૂન - 22 જુલાઈ)',
  leo: '(23 જુલાઈ - 22 ઑગ)',
  virgo: '(23 ઑગ - 22 સપ્ટે)',
  libra: '(23 સપ્ટે - 22 ઑક્ટો)',
  scorpio: '(23 ઑક્ટો - 21 નવે)',
  sagittarius: '(22 નવે - 21 ડિસે)',
  capricorn: '(22 ડિસે - 19 જાન)',
  aquarius: '(20 જાન - 18 ફેબ્રુ)',
  pisces: '(19 ફેબ્રુ - 20 માર્ચ)',
};

export const HINDI_ZODIAC_DATES: Record<string, string> = {
  aries: '(21 मार्च - 19 अप्रैल)',
  taurus: '(20 अप्रैल - 20 मई)',
  gemini: '(21 मई - 20 जून)',
  cancer: '(21 जून - 22 जुलाई)',
  leo: '(23 जुलाई - 22 अगस्त)',
  virgo: '(23 अगस्त - 22 सितंबर)',
  libra: '(23 सितंबर - 22 अक्टूबर)',
  scorpio: '(23 अक्टूबर - 21 नवंबर)',
  sagittarius: '(22 नवंबर - 21 दिसंबर)',
  capricorn: '(22 दिसंबर - 19 जनवरी)',
  aquarius: '(20 जनवरी - 18 फरवरी)',
  pisces: '(19 फरवरी - 20 मार्च)',
};

export const ENGLISH_ZODIAC_DATES: Record<string, string> = {
  aries: '(Mar 21 - Apr 19)',
  taurus: '(Apr 20 - May 20)',
  gemini: '(May 21 - Jun 20)',
  cancer: '(Jun 21 - Jul 22)',
  leo: '(Jul 23 - Aug 22)',
  virgo: '(Aug 23 - Sep 22)',
  libra: '(Sep 23 - Oct 22)',
  scorpio: '(Oct 23 - Nov 21)',
  sagittarius: '(Nov 22 - Dec 21)',
  capricorn: '(Dec 22 - Jan 19)',
  aquarius: '(Jan 20 - Feb 18)',
  pisces: '(Feb 19 - Mar 20)',
};

export function RedZodiacIcon({ id, className = "h-7 w-7" }: { id: string; className?: string }) {
  const sign = (id || '').toLowerCase().trim();

  switch (sign) {
    case 'aries':
      // Ram horns symbol matching reference
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#D71914" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21V9" />
          <path d="M12 9C10.5 5.5 7 4 4.5 5.5C2 7 2.5 11 5 11.5C7.5 12 9 10 9 10" />
          <path d="M12 9C13.5 5.5 17 4 19.5 5.5C22 7 21.5 11 19 11.5C16.5 12 15 10 15 10" />
        </svg>
      );

    case 'taurus':
      // Bull head with horns matching reference
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#D71914" stroke="#D71914" strokeWidth="0.5">
          <path d="M4 3.5C4 7 7 9.5 9.5 10C8.5 10.8 7.8 12 7.8 13.5C7.8 16 9.8 18 12 18C14.2 18 16.2 16 16.2 13.5C16.2 12 15.5 10.8 14.5 10C17 9.5 20 7 20 3.5C18.2 4.2 16.2 5.5 15 7C14.2 6.5 13.2 6.2 12 6.2C10.8 6.2 9.8 6.5 9 7C7.8 5.5 5.8 4.2 4 3.5Z" />
          <circle cx="12" cy="13.5" r="3.2" fill="#FFF5F5" />
          <ellipse cx="12" cy="14" rx="1.6" ry="1.2" fill="#D71914" />
        </svg>
      );

    case 'gemini':
      // Roman numeral II with top & bottom serif bars matching reference
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#D71914" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4H19" />
          <path d="M5 20H19" />
          <path d="M9 4.5V19.5" />
          <path d="M15 4.5V19.5" />
        </svg>
      );

    case 'cancer':
      // Crab glyph with pincers matching reference
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#D71914">
          <ellipse cx="12" cy="13" rx="4.5" ry="3.5" />
          {/* Pincers */}
          <path d="M6.5 7C5 8.5 5 11.5 6.5 13C7.5 11.5 7.5 8.5 6.5 7Z" />
          <path d="M17.5 7C19 8.5 19 11.5 17.5 13C16.5 11.5 16.5 8.5 17.5 7Z" />
          <path d="M7 10C5 9 3.5 7.5 4 5C6 5.5 7.5 7 8 9" stroke="#D71914" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17 10C19 9 20.5 7.5 20 5C18 5.5 16.5 7 16 9" stroke="#D71914" strokeWidth="1.8" strokeLinecap="round" />
          {/* Legs */}
          <path d="M8 15L4.5 17M8 16.5L5 19M16 15L19.5 17M16 16.5L19 19" stroke="#D71914" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'leo':
      // Lion head profile matching reference
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#D71914">
          <path d="M12 4C8 4 6 7 6 10C6 11.8 7 13.2 8 14C7.5 15 6 16.5 4.5 16.5C3.5 16.5 3 17 3 18C3 19 4.5 20 6.5 20C10 20 12 17 12 14.5C12 13.5 12.5 12.8 13.2 12.2C14 13.5 15.5 14.5 17.5 14.5C19.5 14.5 21 13 21 11C21 9 19.5 7.5 17.5 7.5C16 7.5 14.8 8.2 14 9.2C13.8 6.5 13.2 4 12 4ZM17.5 9.5C18.3 9.5 19 10.2 19 11C19 11.8 18.3 12.5 17.5 12.5C16.7 12.5 16 11.8 16 11C16 10.2 16.7 9.5 17.5 9.5Z" />
        </svg>
      );

    case 'virgo':
      // Maiden silhouette profile with flowing hair matching reference
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#D71914">
          <path d="M12 3C9.8 3 8 4.8 8 7C8 8.2 8.5 9.3 9.3 10.1C8 11.2 7 13 7 15C7 18.5 10 21 13.5 21C16 21 18 19.5 18 17C18 15.2 17 13.8 15.5 13C16.5 12.2 17 11 17 9.5C17 6.8 15 4.5 12.5 4.1V3H12ZM12 5C13.8 5 15 6.5 15 8.5C15 9.8 14.2 11 13 11.5V10C13 9.4 12.6 9 12 9C11.4 9 11 9.4 11 10V12.2C9.8 12.8 9 14 9 15.5C9 17.5 11 19 13.2 19C15 19 16.2 18 16.2 16.5C16.2 15.2 15.2 14.2 14 14.2C13.4 14.2 13 14.6 13 15.2C13 15.8 13.4 16.2 14 16.2C14.3 16.2 14.5 16.4 14.5 16.7C14.5 17.2 13.8 17.5 13.2 17.5C11.8 17.5 10.8 16.5 10.8 15.2C10.8 13.8 12 12.8 13.5 12.8C14.5 12.8 15.5 13.4 15.8 14.2C16.5 14.8 17 15.8 17 17C17 18.8 15.2 20 13.2 20C10.5 20 8.5 17.8 8.5 15C8.5 13.2 9.5 11.5 11 10.8V7C11 5.8 11.8 5 12 5Z" />
        </svg>
      );

    case 'libra':
      // Balance scale matching reference
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#D71914" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Base and central beam */}
          <path d="M12 4V19" />
          <path d="M8 20H16" />
          {/* Top balance bar */}
          <path d="M4 8H20" />
          {/* Left pan */}
          <path d="M4 8L1.5 14H6.5L4 8Z" fill="#D71914" fillOpacity="0.2" />
          {/* Right pan */}
          <path d="M20 8L17.5 14H22.5L20 8Z" fill="#D71914" fillOpacity="0.2" />
        </svg>
      );

    case 'scorpio':
      // Scorpion with claws & stinger matching reference
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#D71914">
          <ellipse cx="11" cy="13" rx="3.5" ry="5" />
          {/* Head & claws */}
          <path d="M11 7L7 4M7 4L5 6M7 4L8 2" stroke="#D71914" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 7L15 4M15 4L17 6M15 4L14 2" stroke="#D71914" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          {/* Stinger tail */}
          <path d="M11 18C11 20.5 14 22 16.5 21C19 20 19.5 17.5 18 16C16.8 14.8 15 15.5 16 16.8M18 16L20 15" stroke="#D71914" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Walking legs */}
          <path d="M8 11L4 10M8 13L4 13.5M8 15L4.5 16.5M14 11L18 10M14 13L18 13.5M14 15L17.5 16.5" stroke="#D71914" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    case 'sagittarius':
      // Bow and arrow aimed diagonally up-right matching reference
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#D71914" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {/* Arrow */}
          <path d="M7 17L19 5" />
          <path d="M13 5H19V11" />
          {/* Crossbar */}
          <path d="M10 10L14 14" />
          {/* Bow arc */}
          <path d="M5 13C6.5 15.5 8.5 17.5 11 19" />
        </svg>
      );

    case 'capricorn':
      // Mountain goat head with curved horns matching reference
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#D71914">
          <path d="M12 5.5C11 3.5 8 2.5 5.5 4C3 5.5 3.5 8 5 9.5C6.5 11 8.5 10.5 9.5 9.5C9.5 12 8.5 14 7.5 15.5C6.5 17 5 18 3.5 18C2.5 18 2 19 2 20C2 21 3.5 22 5.5 22C9.5 22 12.5 18.5 13 14C14 15 15.5 15.5 17 15.5C19.5 15.5 21.5 13.5 21.5 11C21.5 8.5 19.5 6.5 17 6.5C15 6.5 13.5 7.8 13 9.5C12.8 7.8 12.5 6.5 12 5.5ZM17 8.5C18.4 8.5 19.5 9.6 19.5 11C19.5 12.4 18.4 13.5 17 13.5C15.6 13.5 14.5 12.4 14.5 11C14.5 9.6 15.6 8.5 17 8.5ZM6.5 5.5C7.5 5.5 8.5 6.2 8.8 7C8 7.5 7 7.5 6.2 7C5.5 6.5 5.8 5.5 6.5 5.5Z" />
        </svg>
      );

    case 'aquarius':
      // Two horizontal wavy zigzag water lines matching reference
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#D71914" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9L7.5 6L11 9L14.5 6L18 9L21.5 6" />
          <path d="M4 17L7.5 14L11 17L14.5 14L18 17L21.5 14" />
        </svg>
      );

    case 'pisces':
      // Two arched fish swimming in opposite directions matching reference
      return (
        <svg viewBox="0 0 24 24" className={className} fill="#D71914">
          {/* Top fish swimming right */}
          <path d="M4 8C7 5.5 12 5 16 7L19 5V10L16 8C13 9.5 8 9.5 4 8Z" />
          {/* Bottom fish swimming left */}
          <path d="M20 16C17 18.5 12 19 8 17L5 19V14L8 16C11 14.5 16 14.5 20 16Z" />
          {/* Connecting line */}
          <path d="M12 6V18" stroke="#D71914" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#D71914" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

