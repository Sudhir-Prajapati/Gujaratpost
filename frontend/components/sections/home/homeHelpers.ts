import type { Language } from '@/types';

export const stripHtmlTags = (str?: string) => (str || '').replace(/<[^>]*>?/gm, '').replace(/!\[.*?\]\(.*?\)/g, '');

export const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
];

export const MOCK_TITLE_MAP: Record<string, { en: string; hi: string }> = {
  'સંસદનું ચોમાસુ સત્ર આજથી! અનેક મોટા ખરડા પર થશે ઘમાસાણ': {
    en: 'Parliament Monsoon Session begins today! Clash expected over key bills',
    hi: 'संसद का मानसून सत्र आज से! कई बड़े विधेयकों पर होगा हंगामा'
  },
  'ખુશખબર! GDP વૃદ્ધિ દર અંદાજ કરતાં વધુ નોંધાયો': {
    en: 'Good news! GDP growth rate exceeds expectations',
    hi: 'खुशखबरी! जीडीपी वृद्धि दर अनुमान से अधिक दर्ज'
  },
  'બે નવી વંદે ભારત ટ્રેનોને લીલી ઝંડી, જાણો રૂટ': {
    en: 'Two new Vande Bharat trains flagged off, know routes',
    hi: 'दो नई वंदे भारत ट्रेनों को हरी झंडी, जानें रूट'
  },
  'કેન્દ્ર સરકારની મોટી જાહેરાત! નવી યોજનાથી કરોડો લોકોને લાભ': {
    en: 'Center announces new scheme, millions to benefit',
    hi: 'केंद्र सरकार की बड़ी घोषणा! नई योजना से करोड़ों को लाभ'
  },
  'નવી રાષ્ટ્રીય શિક્ષણ નીતિનો બીજો તબક્કો આગામી સત્રથી લાગુ, જાણો શું બદલાશે': {
    en: 'Second phase of New National Education Policy from next session, know details',
    hi: 'नई राष्ट्रीय शिक्षा नीति का दूसरा चरण अगले सत्र से लागू, जानें क्या बदलेगा'
  },
  'ભારતીય સેનાને મળી મોટી તાકાત! સ્વદેશી બનાવટનું નવું સંરક્ષણ સાધન સામેલ': {
    en: 'Indian Army gets major boost! New indigenous defense equipment inducted',
    hi: 'भारतीय सेना को मिली बड़ी ताकत! नया स्वदेशी रक्षा उपकरण शामिल'
  },
  'સુપ્રીમ કોર્ટનો મોટો ચુકાદો! લાખો કેસોને સીધી અસર': {
    en: 'Supreme Court historic judgment! Direct impact on millions of cases',
    hi: 'सुप्रीम कोर्ट का बड़ा फैसला! लाखों मामलों पर सीधा असर'
  },
  'કરોડો લોકોને ફાયદો! કેન્દ્રે જાહેર કરી નવી આરોગ્ય વીમા યોજના': {
    en: 'Millions to benefit! Center launches new health insurance scheme',
    hi: 'करोड़ों लोगों को फायदा! केंद्र ने घोषित की नई स्वास्थ्य बीमा योजना'
  },
  'ખેડૂતો માટે ખુશખબર! નવી MSP જાહેર, કઠોળના ભાવમાં વધારો': {
    en: 'Good news for farmers! New MSP declared, pulse prices hiked',
    hi: 'किसानों के लिए खुशखबरी! नई एमएसपी घोषित, दालों के दाम बढ़े'
  },
};

export const getMockTitle = (item: any, language: Language): string => {
  if (!item) return '';
  if (language === 'en') {
    if (item.titleEn) return item.titleEn;
    if (item.title) return item.title;
    if (item.titleGu && MOCK_TITLE_MAP[item.titleGu]) return MOCK_TITLE_MAP[item.titleGu].en;
    return item.titleGu || '';
  }
  if (language === 'hi') {
    if (item.titleHi) return item.titleHi;
    if (item.titleGu && MOCK_TITLE_MAP[item.titleGu]) return MOCK_TITLE_MAP[item.titleGu].hi;
    return item.titleGu || item.title || '';
  }
  return item.titleGu || item.title || '';
};

export const getMockRelativeTime = (timeStrGu: string | undefined, language: Language): string => {
  if (!timeStrGu) return language === 'en' ? '1 hour ago' : language === 'hi' ? '1 घंटा पहले' : '1 કલાક પહેલાં';
  if (language === 'en') {
    if (timeStrGu.includes('1 કલાક')) return '1 hour ago';
    if (timeStrGu.includes('2 કલાક')) return '2 hours ago';
    if (timeStrGu.includes('3 કલાક')) return '3 hours ago';
    if (timeStrGu.includes('4 કલાક')) return '4 hours ago';
    if (timeStrGu.includes('5 કલાક')) return '5 hours ago';
    if (timeStrGu.includes('6 કલાક')) return '6 hours ago';
    if (timeStrGu.includes('7 કલાક')) return '7 hours ago';
    if (timeStrGu.includes('8 કલાક')) return '8 hours ago';
    if (timeStrGu.includes('10 કલાક')) return '10 hours ago';
    if (timeStrGu.includes('11 કલાક')) return '11 hours ago';
    if (timeStrGu.includes('12 કલાક')) return '12 hours ago';
    if (timeStrGu.includes('13 કલાક')) return '13 hours ago';
    if (timeStrGu.includes('14 કલાક')) return '14 hours ago';
    if (timeStrGu.includes('30 મિનિટ')) return '30 mins ago';
    return timeStrGu.replace('કલાક પહેલાં', 'hours ago').replace('મિનિટ પહેલાં', 'mins ago');
  }
  if (language === 'hi') {
    if (timeStrGu.includes('1 કલાક')) return '1 घंटा पहले';
    if (timeStrGu.includes('2 કલાક')) return '2 घंटे पहले';
    if (timeStrGu.includes('3 કલાક')) return '3 घंटे पहले';
    if (timeStrGu.includes('4 કલાક')) return '4 घंटे पहले';
    if (timeStrGu.includes('5 કલાક')) return '5 घंटे पहले';
    if (timeStrGu.includes('6 કલાક')) return '6 घंटे पहले';
    if (timeStrGu.includes('7 કલાક')) return '7 घंटे પહેલાં';
    if (timeStrGu.includes('8 કલાક')) return '8 घंटे पहले';
    if (timeStrGu.includes('10 કલાક')) return '10 घंटे पहले';
    if (timeStrGu.includes('11 કલાક')) return '11 घंटे पहले';
    if (timeStrGu.includes('12 કલાક')) return '12 घंटे पहले';
    if (timeStrGu.includes('13 કલાક')) return '13 घंटे पहले';
    if (timeStrGu.includes('14 કલાક')) return '14 घंटे पहले';
    if (timeStrGu.includes('30 મિનિટ')) return '30 मिनट पहले';
    return timeStrGu.replace('કલાક પહેલાં', 'ઘંટે પહેલાં').replace('મિનિટ પહેલાં', 'મિનટ પહેલાં');
  }
  return timeStrGu;
};

export const toGuLocal = (num: number | string): string => {
  const guDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return String(num).split('').map(char => {
    const digit = parseInt(char, 10);
    return isNaN(digit) ? char : guDigits[digit];
  }).join('');
};

export const getMockTime = (id: string): string => {
  switch (id) {
    case 'c1': return '10:30 AM';
    case 'c2': return '11:30 AM';
    case 'c3': return '12:30 PM';
    case 'l1': return '10:45 AM';
    case 'l2': return '11:15 AM';
    case 'l3': return '12:15 PM';
    case 'l4': return '01:05 PM';
    default: return '02:00 PM';
  }
};

export function cleanVideoTitle(str: string): string {
  if (!str) return '';
  return str.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

export const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  Ahmedabad: { lat: 23.0225, lon: 72.5714 },
  Surat: { lat: 21.1702, lon: 72.8311 },
  Vadodara: { lat: 22.3072, lon: 73.1812 },
  Rajkot: { lat: 22.3039, lon: 70.8022 },
  Gandhinagar: { lat: 23.2156, lon: 72.6369 },
};

export function parseWmoCode(code: number) {
  if (code === 0) return { desc: 'Clear sky', descGu: 'સ્વચ્છ આકાશ', icon: '☀️' };
  if (code <= 3) return { desc: 'Partly cloudy', descGu: 'આંશિક વાદળછાયું', icon: '⛅' };
  if (code <= 48) return { desc: 'Foggy', descGu: 'ધુમ્મસ', icon: '🌫️' };
  if (code <= 55) return { desc: 'Drizzle', descGu: 'ઝરમર વરસાદ', icon: '🌦️' };
  if (code <= 65) return { desc: 'Rain', descGu: 'વરસાદ', icon: '🌧️' };
  if (code <= 82) return { desc: 'Showers', descGu: 'ઝાપટાં', icon: '🌧️' };
  if (code <= 99) return { desc: 'Thunderstorm', descGu: 'ગાજવીજ સાથે વરસાદ', icon: '⛈️' };
  return { desc: 'Partly cloudy', descGu: 'આંશિક વાદળછાયું', icon: '⛅' };
}

export function parseAqi(val: number) {
  if (val <= 50) return { label: 'Good', labelGu: 'સારું' };
  if (val <= 100) return { label: 'Satisfactory', labelGu: 'સંતોષકારક' };
  if (val <= 200) return { label: 'Moderate', labelGu: 'સાધારણ' };
  if (val <= 300) return { label: 'Poor', labelGu: 'ખરાબ' };
  return { label: 'Very Poor', labelGu: 'અતિ ખરાબ' };
}

export function getLocalizedTrendingTags(lang: string) {
  if (lang === 'hi') return ['#चुनाव 2026', '#बारिश', '#सोना-चांदी', '#क्रिकेट', '#मेट्रो', '#सेमीकंडक्टर', '#डायमंड उद्योग', '#ट्रैफिक'];
  if (lang === 'en') return ['#Election 2026', '#Rain', '#Gold-Silver', '#Cricket', '#Metro', '#Semiconductor', '#Diamond Industry', '#Traffic'];
  return ['#ચૂંટણી 2026', '#વરસાદ', '#સોના-ચાંદી', '#ક્રિકેટ', '#મેટ્રો', '#સેમિકન્ડક્ટર', '#ડાયમંડ ઉદ્યોગ', '#ટ્રાફિક'];
}
