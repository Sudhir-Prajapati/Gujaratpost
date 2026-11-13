'use client';

/* eslint-disable @next/next/no-html-link-for-pages */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bookmark,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Search,
  Sun,
  User,
  X,
  Home,
  Heart,
  Globe,
  MapPin,
  Calendar,
  Zap,
  Leaf,
  Newspaper,
  TrendingUp,
  Trophy,
  Laptop,
  Film,
  HeartPulse,
  Sprout,
  ShieldAlert,
  CheckCircle2,
  Flame,
  Video,
  Camera,
  Mic,
  Coins,
  MoreHorizontal,
  CloudSun,
  ArrowRight,
  LogIn,
  Share2,
} from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { SocialLinks } from '@/components/ui/SocialLinks';
import Advertisement from '@/components/ads/Advertisement';
import DistrictBar from './DistrictBar';
import { getPublicCategories } from '@/lib/api';
import { isHiddenFromNavbar } from '@/lib/header-navigation';
import UserAuthModal from '@/components/ui/UserAuthModal';
import { prefetchSupportDetails } from '@/components/ui/SupportModal';
import DynamicCalendarIcon from '@/components/ui/DynamicCalendarIcon';
import CalendarModal from '@/components/ui/CalendarModal';

const languageLabels = {
  gu: 'ગુજરાતી',
  en: 'English',
  hi: 'हिन्दी',
};

const formatTopBarDate = (lang: string) => {
  const d = new Date();
  if (lang === 'gu') {
    const monthsGu = [
      'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
      'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર',
    ];
    return `${monthsGu[d.getMonth()]}, ${d.getFullYear()}`;
  }
  if (lang === 'hi') {
    const monthsHi = [
      'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
      'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
    ];
    return `${monthsHi[d.getMonth()]}, ${d.getFullYear()}`;
  }
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

function getCategoryIcon(slug: string, name?: string) {
  const s = (slug || '').toLowerCase().replace('/category/', '').replace('/', '');
  const n = (name || '').toLowerCase();

  // Cities
  if (s === 'ahmedabad' || s === 'surat' || s === 'rajkot' || s === 'vadodara' || s === 'gandhinagar' || s === 'other-cities' || s === 'othercities' || s === 'other' || n.includes('શહેરો')) {
    return <MapPin className="h-5 w-5 text-red-600 shrink-0" />;
  }

  // Gujarat
  if (s === 'gujarat' || n.includes('ગુજરાત') || n.includes('gujarat')) {
    return (
      <img
        src="/assets/GujaratLogo.png"
        alt="Gujarat"
        className="h-5 w-5 object-contain shrink-0"
      />
    );
  }

  // Bharat / National / India
  if (s === 'national' || s === 'india' || s === 'bharat' || n.includes('ભારત') || n.includes('भारत')) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-500 shrink-0" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    );
  }

  // World / Vishva
  if (s === 'world' || s === 'international' || s === 'vishva' || n.includes('વિશ્વ') || n.includes('विश्व')) {
    return <Globe className="h-5 w-5 text-blue-500 shrink-0" />;
  }

  // Politics / Rajniti / Rajkaran
  if (s === 'politics' || s === 'rajaniti' || n.includes('રાજ') || n.includes('राजनीति')) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-800 dark:text-amber-600 shrink-0" fill="currentColor">
        <path d="M12 1 2 6v2h20V6L12 1zm-7 9v9h2v-9H5zm4 0v9h2v-9H9zm4 0v9h2v-9h-2zm4 0v9h2v-9h-2zm-15 11v2h20v-2H2z" />
      </svg>
    );
  }

  // Business
  if (s === 'business' || s === 'bigness' || s === 'market' || n.includes('બિઝનેસ') || n.includes('बिजनेस')) {
    return <TrendingUp className="h-5 w-5 text-red-600 shrink-0" />;
  }

  // Sports / Krida
  if (s === 'sports' || s === 'krida' || n.includes('ક્રીડા') || n.includes('રમત') || n.includes('खेल')) {
    return <Trophy className="h-5 w-5 text-yellow-500 shrink-0" />;
  }

  // Technology
  if (s === 'technology' || s === 'tech' || n.includes('ટેક') || n.includes('तकनीक')) {
    return <Laptop className="h-5 w-5 text-sky-500 shrink-0" />;
  }

  // Entertainment / Manoranjan
  if (s === 'entertainment' || s === 'manoranjan' || n.includes('મનોરંજન') || n.includes('मनोरंजन')) {
    return <Film className="h-5 w-5 text-red-600 shrink-0" />;
  }

  // Health
  if (s === 'health' || n.includes('હેલ્થ') || n.includes('સ્વાસ્થ્ય') || n.includes('स्वास्थ्य')) {
    return <HeartPulse className="h-5 w-5 text-red-600 shrink-0" />;
  }

  // Agriculture / Krushi
  if (s === 'krushi' || s === 'agriculture' || n.includes('કૃષિ') || n.includes('ખેતી') || n.includes('कृषि')) {
    return <Sprout className="h-5 w-5 text-emerald-600 shrink-0" />;
  }

  // Education / Shikshan
  if (s === 'education' || s === 'shikshan' || n.includes('શિક્ષણ') || n.includes('शिक्षा')) {
    return <BookOpen className="h-5 w-5 text-red-600 shrink-0" />;
  }

  // Crime
  if (s === 'crime' || n.includes('ક્રાઇમ') || n.includes('अपराध')) {
    return <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />;
  }

  // Fact check
  if (s.includes('fact') || n.includes('ફેક્ટ') || n.includes('फैक्ट')) {
    return <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0" />;
  }

  // Trending
  if (s.includes('trend') || n.includes('ટ્રેન્ડ') || n.includes('ट्रेंड')) {
    return <Flame className="h-5 w-5 text-orange-500 shrink-0" />;
  }

  // Videos
  if (s.includes('video') || n.includes('વીડિયો') || n.includes('वीडियो')) {
    return <Video className="h-5 w-5 text-red-600 shrink-0" />;
  }

  // Photos / Gallery
  if (s.includes('photo') || s.includes('gallery') || n.includes('ફોટો') || n.includes('फोटो')) {
    return <Camera className="h-5 w-5 text-purple-600 shrink-0" />;
  }

  // Podcasts
  if (s.includes('podcast') || n.includes('પોડકાસ્ટ')) {
    return <Mic className="h-5 w-5 text-violet-600 shrink-0" />;
  }

  // Weather / Rain
  if (s.includes('weather') || s.includes('varsad') || s.includes('rain') || n.includes('હવામાન') || n.includes('વરસાદ')) {
    return <CloudSun className="h-5 w-5 text-sky-500 shrink-0" />;
  }

  // Gold - Silver
  if (s.includes('gold') || n.includes('ગોલ્ડ') || n.includes('સોના')) {
    return <Coins className="h-5 w-5 text-amber-500 shrink-0" />;
  }

  // Default / More
  return <MoreHorizontal className="h-5 w-5 text-zinc-500 shrink-0" />;
}

const cityTranslations: Record<string, { gu: string; hi: string; en: string }> = {
  'અમદાવાદ': { gu: 'અમદાવાદ', hi: 'अहमदाबाद', en: 'Ahmedabad' },
  'સુરત': { gu: 'સુરત', hi: 'सूरत', en: 'Surat' },
  'વડોદરા': { gu: 'વડોદરા', hi: 'वडोदरा', en: 'Vadodara' },
  'રાજકોટ': { gu: 'રાજકોટ', hi: 'राजकोट', en: 'Rajkot' },
  'ગાંધીનગર': { gu: 'ગાંધીનગર', hi: 'गांधीनगर', en: 'Gandhinagar' },
  'અન્ય': { gu: 'અન્ય', hi: 'अन्य', en: 'Other' },
  'અન્ય શહેરો': { gu: 'અન્ય શહેરો', hi: 'अन्य शहर', en: 'Other Cities' },
};

const cityCategoryPaths: Record<string, string> = {
  'અમદાવાદ': '/category/ahmedabad',
  'વડોદરા': '/category/vadodara',
  'સુરત': '/category/surat',
  'ગાંધીનગર': '/category/gandhinagar',
  'રાજકોટ': '/category/rajkot',
  'અન્ય શહેરો': '/category/other-cities',
};

function AppleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.72-1.18 1.86-1.03 2.97 1.12.09 2.27-.6 2.98-1.41z" />
    </svg>
  );
}

function PlayStoreIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 466 511.98" className={className}>
      <path fill="#EA4335" d="M199.9 237.8 1.4 470.17c7.22 24.57 30.16 41.81 55.8 41.81 11.16 0 20.93-2.79 29.3-8.37l244.16-139.46L199.9 237.8z" />
      <path fill="#FBBC04" d="m433.91 205.1-104.65-60-111.61 110.22 113.01 108.83 104.64-58.6c18.14-9.77 30.7-29.3 30.7-50.23-1.4-20.93-13.95-40.46-32.09-50.22z" />
      <path fill="#34A853" d="M199.42 273.45 329.27 145.1 87.9 8.37C79.53 2.79 68.36 0 57.2 0 30.7 0 6.98 18.14 1.4 41.86l198.02 231.59z" />
      <path fill="#4285F4" d="M1.39 41.86C0 46.04 0 51.63 0 57.2v397.64c0 5.57 0 9.76 1.4 15.34l216.27-214.86L1.39 41.86z" />
    </svg>
  );
}

// The city navigation links shown in the nav bar and mobile drawer
const CITY_NAV_LINKS = [
  { label: 'Ahmedabad', labelGu: 'અમદાવાદ', labelHi: 'अहमदाबाद', href: '/category/ahmedabad', slug: 'ahmedabad' },
  { label: 'Surat', labelGu: 'સુરત', labelHi: 'सूरत', href: '/category/surat', slug: 'surat' },
  { label: 'Rajkot', labelGu: 'રાજકોટ', labelHi: 'राजकोट', href: '/category/rajkot', slug: 'rajkot' },
  { label: 'Vadodara', labelGu: 'વડોદરા', labelHi: 'वडोदरा', href: '/category/vadodara', slug: 'vadodara' },
  { label: 'Gandhinagar', labelGu: 'ગાંધીનગર', labelHi: 'गांधीनगर', href: '/category/gandhinagar', slug: 'gandhinagar' },
  { label: 'Other Cities', labelGu: 'અન્ય શહેરો', labelHi: 'अन्य शहर', href: '/category/other-cities', slug: 'other-cities' },
];

const NAV_LINKS = [
  { label: 'Home', labelGu: 'હોમ', labelHi: 'होम', href: '/' },
  { label: 'Video', labelGu: 'વીડિયો', labelHi: 'वीडियो', href: '/videos' },
  { label: 'Gujarat', labelGu: 'ગુજરાત', labelHi: 'गुजरात', href: '/category/gujarat' },
  { label: 'Ahmedabad', labelGu: 'અમદાવાદ', labelHi: 'अहमदाबाद', href: '/category/ahmedabad' },
  { label: 'Surat', labelGu: 'સુરત', labelHi: 'सूरत', href: '/category/surat' },
  { label: 'Rajkot', labelGu: 'રાજકોટ', labelHi: 'राजकोट', href: '/category/rajkot' },
  { label: 'Vadodara', labelGu: 'વડોદરા', labelHi: 'वडोदरा', href: '/category/vadodara' },
  { label: 'Gandhinagar', labelGu: 'ગાંધીનગર', labelHi: 'गांधीनगर', href: '/category/gandhinagar' },
  { label: 'Other Cities', labelGu: 'અન્ય શહેરો', labelHi: 'अन्य शहर', href: '/category/other-cities' },
  { label: 'India', labelGu: 'ભારત', labelHi: 'भारत', href: '/category/national' },
  { label: 'World', labelGu: 'વિશ્વ', labelHi: 'विश्व', href: '/category/world' },
  { label: 'Politics', labelGu: 'રાજકારણ', labelHi: 'राजनीति', href: '/category/politics' },
  { label: 'Crime', labelGu: 'ક્રાઇમ', labelHi: 'क्राइम', href: '/category/crime' },
  { label: 'Health', labelGu: 'હેલ્થ', labelHi: 'स्वास्थ्य', href: '/category/health' },
  { label: 'Entertainment', labelGu: 'મનોરંજન', labelHi: 'मनोरंजन', href: '/category/entertainment' },
  { label: 'Technology', labelGu: 'ટેક્નોલોજી', labelHi: 'टेक्नोलॉजी', href: '/category/technology' },
  { label: 'Fact Check', labelGu: 'ફેક્ટ ચેક', labelHi: 'फैक्टर चेक', href: '/category/fact-check' },
  { label: 'Trending', labelGu: 'ટ્રેન્ડિંગ', labelHi: 'ट्रेंडिंग', href: '/category/trending' },
];

// The links shown under the "More/Other" (અન્ય) dropdown
const OTHER_LINKS = [
  { label: 'Gold - Silver', labelGu: 'ગોલ્ડ - સિલ્વર', labelHi: 'गोल्ड - सिल्वर', href: '/category/gold-silver' },
];

// Slugs explicitly hidden from the navbar / "અન્ય" dropdown (accessible directly via category pages)
export { HIDDEN_NAVBAR_SLUGS, isHiddenFromNavbar } from '@/lib/header-navigation';

const formatOnlyMonthYear = (lang: string) => {
  const d = new Date();
  if (lang === 'gu') {
    const monthsGu = [
      'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
      'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર',
    ];
    return `${monthsGu[d.getMonth()]}, ${d.getFullYear()}`;
  }
  if (lang === 'hi') {
    const monthsHi = [
      'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
      'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
    ];
    return `${monthsHi[d.getMonth()]}, ${d.getFullYear()}`;
  }
  return `${d.toLocaleDateString('en-GB', { month: 'long' })}, ${d.getFullYear()}`;
};

const formatDateLong = (lang: string) => {
  const locale = lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-GB';
  return new Date().toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateShort = (lang: string) => {
  const locale = lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-GB';
  return new Date().toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const CATEGORY_TRANSLATIONS: Record<string, { en: string; hi: string; gu: string }> = {
  ahmedabad: { en: 'Ahmedabad', hi: 'अहमदाबाद', gu: 'અમદાવાદ' },
  surat: { en: 'Surat', hi: 'सूरत', gu: 'સુરત' },
  rajkot: { en: 'Rajkot', hi: 'राजकोट', gu: 'રાજકોટ' },
  vadodara: { en: 'Vadodara', hi: 'वडोदरा', gu: 'વડોદરા' },
  gandhinagar: { en: 'Gandhinagar', hi: 'गांधीनगर', gu: 'ગાંધીનગર' },
  videos: { en: 'Video', hi: 'वीडियो', gu: 'વીડિયો' },
  video: { en: 'Video', hi: 'वीडियो', gu: 'વીડિયો' },
  gujarat: { en: 'Gujarat', hi: 'गुजरात', gu: 'ગુજરાત' },
  national: { en: 'National', hi: 'भारत', gu: 'ભારત' },
  india: { en: 'India', hi: 'भारत', gu: 'ભારત' },
  world: { en: 'World', hi: 'विश्व', gu: 'વિશ્વ' },
  politics: { en: 'Politics', hi: 'राजनीति', gu: 'રાજનીતિ' },
  rajaniti: { en: 'Politics', hi: 'राजनीति', gu: 'રાજનીતિ' },
  crime: { en: 'Crime', hi: 'अपराध', gu: 'ક્રાઇમ' },
  health: { en: 'Health', hi: 'स्वास्थ्य', gu: 'હેલ્થ' },
  entertainment: { en: 'Entertainment', hi: 'मनोरंजन', gu: 'મનોરંજન' },
  manoranjan: { en: 'Entertainment', hi: 'मनोरंजन', gu: 'મનોરંજન' },
  technology: { en: 'Technology', hi: 'तकनीक', gu: 'ટેકનોલોજી' },
  photos: { en: 'Photo Gallery', hi: 'फोटो गैलरी', gu: 'ફોટો ગેલેરી' },
  'photo-gallery': { en: 'Photo Gallery', hi: 'फोटो गैलरी', gu: 'ફોટો ગેલેરી' },
  'fact-check': { en: 'Fact Check', hi: 'फैक्ट चेक', gu: 'ફેક્ટ ચેક' },
  factcheck: { en: 'Fact Check', hi: 'फैक्ट चेक', gu: 'ફેક્ટ ચેક' },
  trending: { en: 'Trending', hi: 'ट्रेंडिंग', gu: 'ટ્રેન્ડિંગ' },
  tranding: { en: 'Trending', hi: 'ट्रेंडिंग', gu: 'ટ્રેન્ડિંગ' },
  instagram: { en: 'Instagram', hi: 'इंस्टाग्राम', gu: 'ઇન્સ્ટાગ્રામ' },
  shorts: { en: 'Shorts', hi: 'शॉर्ट्स', gu: 'શોર્ટ્સ' },
  'web-stories': { en: 'Web Stories', hi: 'वेब स्टोरीज़', gu: 'વેબસ્ટોરી' },
  'varsad': { en: 'Rainfall', hi: 'वर्षा', gu: 'વરસાદ' },
  'rain': { en: 'Rainfall', hi: 'वर्षा', gu: 'વરસાદ' },
  'weather': { en: 'Weather', hi: 'मौसम', gu: 'હવામાન' },
  'sports': { en: 'Sports', hi: 'खेल', gu: 'રમત-જગત' },
  'education': { en: 'Education', hi: 'शिक्षा', gu: 'શિક્ષણ' },
  'lifestyle': { en: 'Lifestyle', hi: 'लाइफस्टाइल', gu: 'લાઇફસ્ટાઇલ' },
  'gold-silver': { en: 'Gold - Silver', hi: 'गोल्ड - सिल्वर', gu: 'ગોલ્ડ - સિલ્વર' },
  'webstory': { en: 'Webstory', hi: 'वेब स्टोरीज', gu: 'વેબસ્ટોરી' },
  'election-2027': { en: 'Election 2027', hi: 'चुनाव 2027', gu: 'ચૂંટણી 2027' },
  'election': { en: 'Election 2027', hi: 'चुनाव 2027', gu: 'ચૂંટણી 2027' },
  'podcasts': { en: 'Podcast', hi: 'पॉडकास्ट', gu: 'પોડકાસ્ટ' },
  'podcast': { en: 'Podcast', hi: 'पॉडकास्ट', gu: 'પોડકાસ્ટ' },
};

export default function Header() {
  const pathname = usePathname();
  if (pathname === '/login' || pathname === '/cms-admin' || pathname.startsWith('/admin')) {
    return null;
  }

  const router = useRouter();
  const { theme, toggleTheme, language, setLanguage, fsLevel, incFs, decFs, openSupportModal, supportEnabled, epaperEnabled } = useApp();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedCity, setSelectedCity] = useState('અમદાવાદ');
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [otherMenuOpen, setOtherMenuOpen] = useState(false);
  const [liveTemp, setLiveTemp] = useState('28°C');
  const [liveWeatherIcon, setLiveWeatherIcon] = useState('⛅');

  useEffect(() => {
    fetch('/api/weather-multi')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json?.data?.weatherData) {
          const w = json.data.weatherData[selectedCity] || json.data.weatherData.Ahmedabad;
          if (w?.temp) setLiveTemp(w.temp);
          if (w?.icon) setLiveWeatherIcon(w.icon);
        }
      })
      .catch(() => {});
  }, [selectedCity]);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [dropdownLeft, setDropdownLeft] = useState<number | null>(null);
  const [hideStickyNav, setHideStickyNav] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(84);

  useEffect(() => {
    const handleScroll = () => {
      const infiniteAdEl = document.getElementById('infinite-ads-section');
      if (!infiniteAdEl) {
        setHideStickyNav(false);
        return;
      }
      const rect = infiniteAdEl.getBoundingClientRect();
      if (rect.top <= 100) {
        setHideStickyNav(true);
      } else {
        setHideStickyNav(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Close menu and release any scroll lock on navigation
  useEffect(() => {
    setMenuOpen(false);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, [pathname]);

  // Measure header height so mobile menu overlay starts right below it
  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.getBoundingClientRect().height);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [mounted, menuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const updateSavedCount = () => {
    try {
      const stored = localStorage.getItem('gp-saved-articles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedCount(parsed.length);
          return;
        }
      }
      setSavedCount(0);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    try {
      const savedCity = localStorage.getItem('gp-selected-city');
      if (savedCity) {
        setSelectedCity(savedCity);
      } else {
        localStorage.setItem('gp-selected-city', 'અમદાવાદ');
      }
    } catch (e) {
      console.warn(e);
    }
    updateSavedCount();
    window.addEventListener('gp-saved-changed', updateSavedCount);
    window.addEventListener('storage', updateSavedCount);
    return () => {
      window.removeEventListener('gp-saved-changed', updateSavedCount);
      window.removeEventListener('storage', updateSavedCount);
    };
  }, []);

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setCityModalOpen(false);
    try {
      localStorage.setItem('gp-selected-city', city);
      window.dispatchEvent(new CustomEvent('gp-city-changed', { detail: city }));
    } catch (e) {
      console.warn(e);
    }
    const cityPath = cityCategoryPaths[city];
    if (cityPath) router.push(cityPath);
  };

  useEffect(() => {
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageChosen, setLanguageChosen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // On mount: check if user has explicitly chosen a language this session
  useEffect(() => {
    try {
      if (sessionStorage.getItem('gp-lang-chosen') === 'true') {
        setLanguageChosen(true);
      }
    } catch (e) {
      // sessionStorage not available — treat as not chosen
    }
  }, []);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const [dbCategories, setDbCategories] = useState<any[]>([]);

  useEffect(() => {
    getPublicCategories({ showInHeader: true })
      .then((cats) => {
        if (cats && Array.isArray(cats) && cats.length > 0) {
          setDbCategories(cats);
        }
      })
      .catch(() => { });
  }, []);

  const { navLinks, otherLinks } = useMemo(() => {
    if (!dbCategories || dbCategories.length === 0) {
      return {
        navLinks: NAV_LINKS.filter((l) => !isHiddenFromNavbar(l)),
        otherLinks: OTHER_LINKS.filter((l) => !isHiddenFromNavbar(l)),
      };
    }

    const mapCategory = (c: any) => {
      const slugLower = (c.slug || '').toLowerCase();
      let href = `/category/${c.slug}`;
      if (slugLower === 'home' || slugLower === 'main') href = '/';
      else if (slugLower === 'videos' || slugLower === 'video') href = '/videos';
      else if (slugLower === 'photos' || slugLower === 'photo-gallery' || slugLower === 'gallery') href = '/photos';
      else if (slugLower === 'podcasts') href = '/videos?tab=podcast';
      else if (slugLower === 'shorts') href = '/shorts';
      else if (slugLower === 'reels' || slugLower === 'instagram' || slugLower === 'instagram-reels' || slugLower === 'insta' || slugLower === 'insta-reels') href = '/instagram';
      else if (slugLower === 'epaper') href = '/epaper';
      else if (slugLower === 'web-stories' || slugLower === 'webstory') href = '/web-stories';

      const staticTrans = CATEGORY_TRANSLATIONS[slugLower];
      let labelEn = (staticTrans && staticTrans.en) || c.nameEn || c.name;
      if (labelEn === 'Videos') labelEn = 'Video';
      const labelGu = (staticTrans && staticTrans.gu) || c.nameGu || c.name;
      const labelHi = (staticTrans && staticTrans.hi) || c.nameHi || c.name;

      return { label: labelEn, labelGu, labelHi, href };
    };

    // Unified Header Categories: all active header categories (excluding hidden categories)
    const headerCats = dbCategories
      .filter((c) => !isHiddenFromNavbar(c) && (epaperEnabled || (c.slug || '').toLowerCase() !== 'epaper'))
      .sort((a: any, b: any) => (b.headerOrder ?? b.displayOrder ?? 0) - (a.headerOrder ?? a.displayOrder ?? 0));

    const homeLink = { label: 'Home', labelGu: 'હોમ', labelHi: 'होम', href: '/' };
    const videoLink = { label: 'Video', labelGu: 'વીડિયો', labelHi: 'वीडियो', href: '/videos' };
    const gujaratLink = { label: 'Gujarat', labelGu: 'ગુજરાત', labelHi: 'ગુજરાત', href: '/category/gujarat' };

    // Explicit major cities in exact user-requested sequence:
    // Ahmedabad -> Surat -> Rajkot -> Vadodara -> Gandhinagar -> Other Cities
    const citySequence = ['ahmedabad', 'surat', 'rajkot', 'vadodara', 'gandhinagar', 'other-cities'];
    const cityLinks = citySequence.map((slug) => {
      const foundInDb = dbCategories.find((c) => (c.slug || '').toLowerCase() === slug);
      if (foundInDb) return mapCategory(foundInDb);
      const fallback = CITY_NAV_LINKS.find((c) => c.slug === slug);
      return fallback || { label: slug, labelGu: slug, labelHi: slug, href: `/category/${slug}` };
    });

    const cityHrefs = new Set(cityLinks.map((l) => l.href));

    const nonHomeLinks = headerCats
      .map(mapCategory)
      .filter((l) => l.href !== '/' && !isHiddenFromNavbar(l));

    // Remove video, gujarat, and cities from remaining pool to avoid any duplicates
    const otherCategories = nonHomeLinks.filter(
      (l) => l.href !== '/videos' && l.href !== '/category/gujarat' && !cityHrefs.has(l.href)
    );

    // Exact requested sequence: Home -> Video -> Gujarat -> Ahmedabad -> Surat -> Rajkot -> Vadodara -> Gandhinagar -> Other Categories
    const orderedNonHomeLinks = [videoLink, gujaratLink, ...cityLinks, ...otherCategories];

    // Main navbar links (accommodates major cities + primary news categories)
    const mainNavLinks = orderedNonHomeLinks.slice(0, 18);
    // Categories from index 18 onwards go into "અન્ય" dropdown
    const dropdownLinks = orderedNonHomeLinks.slice(18);

    const mainNav = [homeLink, ...mainNavLinks];

        return { navLinks: mainNav, otherLinks: dropdownLinks };
  }, [dbCategories]);

  const allDrawerCategories = useMemo(() => {
    // Exact sequence matching top navbar slider:
    // Gujarat -> Bharat -> World -> Politics -> Crime -> Health -> Entertainment -> Technology -> Fact Check -> Trending -> Video -> More
    const gujaratItem = navLinks.find((l: any) => (l.slug || '').toLowerCase() === 'gujarat' || l.href === '/category/gujarat') || {
      label: 'Gujarat',
      labelGu: 'ગુજરાત',
      labelHi: 'गुजरात',
      href: '/category/gujarat',
      slug: 'gujarat',
    };

    const preferredSlugs = [
      'national',
      'world',
      'politics',
      'crime',
      'health',
      'entertainment',
      'technology',
      'fact-check',
      'trending',
      'videos',
    ];

    const result: any[] = [{ ...gujaratItem, slug: (gujaratItem as any).slug || 'gujarat' }];

    preferredSlugs.forEach((slug) => {
      const foundInNav = navLinks.find((l: any) => {
        const lSlug = (l.slug || (l.href ? l.href.replace(/^\/category\//, '').replace(/^\//, '') : '')).toLowerCase();
        return lSlug === slug || (slug === 'videos' && (lSlug === 'videos' || l.href === '/videos'));
      });
      if (foundInNav) {
        result.push({ ...foundInNav, slug: (foundInNav as any).slug || slug });
      } else {
        const fallbackMap: Record<string, any> = {
          national: { label: 'India', labelGu: 'ભારત', labelHi: 'भारत', href: '/category/national', slug: 'national' },
          world: { label: 'World', labelGu: 'વિશ્વ', labelHi: 'विश्व', href: '/category/world', slug: 'world' },
          politics: { label: 'Politics', labelGu: 'રાજનીતિ', labelHi: 'राजनीति', href: '/category/politics', slug: 'politics' },
          crime: { label: 'Crime', labelGu: 'ક્રાઇમ', labelHi: 'क्राइम', href: '/category/crime', slug: 'crime' },
          health: { label: 'Health', labelGu: 'હેલ્થ', labelHi: 'स्वास्थ्य', href: '/category/health', slug: 'health' },
          entertainment: { label: 'Entertainment', labelGu: 'મનોરંજન', labelHi: 'मनोरंजन', href: '/category/entertainment', slug: 'entertainment' },
          technology: { label: 'Technology', labelGu: 'ટેકનોલોજી', labelHi: 'तकनीक', href: '/category/technology', slug: 'technology' },
          'fact-check': { label: 'Fact Check', labelGu: 'ફેક્ટ ચેક', labelHi: 'फैक्ट चेक', href: '/category/fact-check', slug: 'fact-check' },
          trending: { label: 'Trending', labelGu: 'ટ્રેન્ડિંગ', labelHi: 'ट्रेंडिंग', href: '/category/trending', slug: 'trending' },
          videos: { label: 'Video', labelGu: 'વીડિયો', labelHi: 'वीडियो', href: '/videos', slug: 'videos' },
        };
        if (fallbackMap[slug]) {
          result.push(fallbackMap[slug]);
        }
      }
    });

    // Add 'More' (વધુ) at the end
    result.push({
      label: 'More',
      labelGu: 'વધુ',
      labelHi: 'अधिक',
      href: '/categories',
      slug: 'more',
    });

    return result;
  }, [navLinks]);

  // Determine active link: exact match for home, startsWith for others
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href + '?');
  };

  const getNavLabel = (link: { label: string; labelGu?: string; labelHi?: string }) => {
    if (language === 'hi') return link.labelHi || link.label;
    if (language === 'gu') return link.labelGu || link.label;
    if (link.label === 'Videos') return 'Video';
    return link.label;
  };

  // Desktop navbar horizontal scroll arrows state
  const navScrollRef = useRef<HTMLUListElement>(null);
  const [canNavScrollLeft, setCanNavScrollLeft] = useState(false);
  const [canNavScrollRight, setCanNavScrollRight] = useState(false);
  const isGujarati = !mounted || !languageChosen || language === 'gu';

  const checkNavScroll = useCallback(() => {
    const el = navScrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth - el.clientWidth > 4;
    setCanNavScrollLeft(el.scrollLeft > 4);
    setCanNavScrollRight(hasOverflow && el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
  }, []);

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;
    checkNavScroll();
    const t1 = setTimeout(checkNavScroll, 60);
    const t2 = setTimeout(checkNavScroll, 300);

    el.addEventListener('scroll', checkNavScroll, { passive: true });
    window.addEventListener('resize', checkNavScroll);
    const ro = new ResizeObserver(checkNavScroll);
    ro.observe(el);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      el.removeEventListener('scroll', checkNavScroll);
      window.removeEventListener('resize', checkNavScroll);
      ro.disconnect();
    };
  }, [checkNavScroll, language, navLinks]);

  const handleNavScrollLeft = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const el = navScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: -220, behavior: 'smooth' });
    setTimeout(checkNavScroll, 250);
  };

  const handleNavScrollRight = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const el = navScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: 220, behavior: 'smooth' });
    setTimeout(checkNavScroll, 250);
  };

  return (
    <>
      <header ref={headerRef} className="relative z-[60] bg-card/95">
        {/* Top bar: date + weather/city + quick actions */}
        <div className="bg-black text-white select-none">
          <div className="mx-auto flex max-w-screen-xl max-w-header-layout items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-1.5 min-h-[38px]">
            {/* Left: Date with Dynamic Calendar Icon & Red Divider */}
            <div className="min-w-0 flex items-center gap-2 sm:gap-3 text-sm font-semibold opacity-95">
              <button
                type="button"
                onClick={() => setCalendarModalOpen(true)}
                className="flex items-center hover:opacity-90 transition-opacity cursor-pointer select-none group tracking-tight"
                title={language === 'en' ? 'Open Calendar' : 'કેલેન્ડર જુઓ'}
              >
                <DynamicCalendarIcon size="md" language={language} className="group-hover:scale-105 transition-transform" />
                <span className="w-[2px] h-[22px] bg-[#C8101E] mx-2.5 rounded-full inline-block shrink-0" />
                <span className="text-[14.5px] sm:text-[16px] font-black text-white whitespace-nowrap">
                  {mounted ? formatOnlyMonthYear(language) : 'નવેમ્બર, 2026'}
                </span>
              </button>

              {/* City location badge (desktop only, hidden on mobile matching reference) */}
              <div className="hidden sm:inline-flex items-center gap-2 sm:gap-3">
                <span className="opacity-40 select-none">|</span>
                <button
                  type="button"
                  onClick={() => setCityModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11.5px] sm:text-xs font-black text-white hover:text-red-200 transition duration-150 cursor-pointer bg-zinc-800/90 hover:bg-zinc-700 px-2 sm:px-2.5 py-0.5 rounded-full select-none font-sans shrink-0 border border-zinc-700 shadow-2xs"
                >
                  <span>📍</span>
                  <span>{cityTranslations[selectedCity]?.[language] || selectedCity}</span>
                </button>
              </div>
            </div>

            {/* Right: Desktop App buttons & Social links */}
            <div className="flex items-center gap-3.5 shrink-0 max-md:hidden">
              <div className="flex items-center gap-2.5">
                <a
                  href="https://apps.apple.com/in/app/gujarat-post/id6475000526"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-900 px-3.5 py-1.5 text-[13px] font-black text-white hover:border-zinc-400 hover:bg-zinc-800 transition-all hover:scale-[1.03] active:scale-95 shadow-sm select-none cursor-pointer"
                >
                  <AppleIcon className="h-4.5 w-4.5 text-white shrink-0" />
                  <span translate="no">App Store</span>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.gujaratpost.app"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-900 px-3.5 py-1.5 text-[13px] font-black text-white hover:border-zinc-400 hover:bg-zinc-800 transition-all hover:scale-[1.03] active:scale-95 shadow-sm select-none cursor-pointer"
                >
                  <PlayStoreIcon className="h-4.5 w-4.5 shrink-0" />
                  <span translate="no">Google Play</span>
                </a>
              </div>
              <span className="opacity-20 select-none text-current">|</span>
              <SocialLinks size="sm" hrefOverrides={{ news: 'https://news.google.com/search?q=gujaratpost&hl=gu-IN&gl=IN&ceid=IN%3Agu', whatsapp: 'https://wa.me/919909907237' }} />
            </div>

            {/* Right: Mobile quick access badges (BRIEF & AQI matching reference pills) */}
            <div className="flex md:hidden items-center gap-2 shrink-0">
              <Link
                href="/news-brief"
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black border-[1.8px] border-[#E5201E] hover:bg-zinc-900 active:bg-zinc-800 text-white transition-all duration-150 active:scale-95 shadow-sm"
                title="News Brief"
              >
                <Zap className="h-3.5 w-3.5 text-[#E5201E] fill-[#E5201E] shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-white text-[12.5px] font-black uppercase tracking-wider leading-none">BRIEF</span>
              </Link>
              <Link
                href="/aqi"
                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black border-[1.8px] border-[#F59E0B] hover:bg-zinc-900 active:bg-zinc-800 text-white transition-all duration-150 active:scale-95 shadow-sm"
                title="Weather & AQI"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 text-[#F59E0B] shrink-0 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="M20 12h2" />
                  <path d="m19.07 4.93-1.41 1.41" />
                  <path d="M15.9 16A5 5 0 1 0 9 10.45" />
                  <path d="M17 20h-9a4 4 0 0 1 0-8h.4" />
                </svg>
                <span className="text-white text-[12.5px] font-black uppercase tracking-wider leading-none">AQI</span>
              </Link>
            </div>
          </div>
        </div>


        {/* Logo + Controls */}
        <div className="w-full flex items-center justify-between gap-1.5 sm:gap-4 px-2 sm:px-4 py-2 sm:py-2.5 relative">
          {/* Slogan on top, Logo below */}
          <div className="flex flex-col items-start gap-0.5 select-none shrink-0">
            {/* Slogan */}
            <div className="flex flex-col justify-center leading-tight pl-1 sm:pl-1.5 md:pl-2">
              <p
                className="text-[13px] sm:text-[14.5px] md:text-[16px] font-black font-sans tracking-wide text-foreground whitespace-nowrap select-none"
                style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                translate="no"
              >
                <span className="hidden sm:inline">Real Stories. <span className="text-red-600 font-black">Real Gujarat.</span></span>
              </p>
            </div>

            {/* Logo */}
            <Link href="/" className="group relative flex shrink-0 items-center">
              <div className="relative block h-8 sm:h-10 md:h-12 lg:h-14 w-32 sm:w-44 md:w-54 lg:w-60 overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]">
                <Image
                  src="/GujaratpostFinalLogo.png"
                  alt="Gujarat Post"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 640px) 160px, (max-width: 1024px) 216px, 240px"
                  className="object-contain object-left"
                />
              </div>
            </Link>
          </div>

          {/* Header Ad Slot (visible on desktop) */}
          <div className="hidden lg:flex flex-1 min-w-[400px] mx-1 2xl:mx-2" style={{ height: 105 }}>
            <Advertisement position="header" className="w-full h-full" />
          </div>

          {/* Right-side Group: News Brief + Weather/AQI + Search + Controls */}
          <div className="ml-auto flex items-center gap-1 select-none shrink-0">
            {/* News Brief + Weather/AQI + Search Container (desktop only) */}
            <div className="hidden md:flex items-center gap-3 lg:gap-4 select-none shrink-0">
              {/* NEWS BRIEF Button */}
              <Link
                href="/news-brief"
                className="group flex items-center gap-1.5 hover:opacity-90 transition-all select-none active:scale-[0.98]"
              >
                <Image
                  src="/rightSide.png"
                  alt="NEWS BRIEF"
                  width={20}
                  height={20}
                  className="shrink-0 object-contain transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{ width: 20, height: 20 }}
                />
                <span translate="no" className="font-black font-sans text-[18px] tracking-wider text-black dark:text-white uppercase leading-none select-none group-hover:text-[#B3121B] transition-colors duration-200">
                  NEWS BRIEF
                </span>
              </Link>

              {/* AQI Button */}
              <Link
                href="/aqi"
                title={language === 'gu' ? 'હવામાન અને AQI' : language === 'hi' ? 'मौसम और AQI' : 'Weather & AQI'}
                className="group flex items-center gap-1.5 hover:opacity-90 transition-all select-none active:scale-[0.98] cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-amber-500 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="M20 12h2" />
                  <path d="m19.07 4.93-1.41 1.41" />
                  <path d="M15.9 16A5 5 0 1 0 9 10.45" />
                  <path d="M17 20h-9a4 4 0 0 1 0-8h.4" />
                </svg>
                <span translate="no" className="font-black font-sans text-[18px] tracking-wider text-black dark:text-white uppercase leading-none select-none group-hover:text-[#B3121B] transition-colors duration-200">
                  AQI
                </span>
              </Link>

              {/* Compact Search Trigger */}
              <div
                className="relative w-[140px] lg:w-[180px] flex items-center cursor-pointer group shrink-0 active:scale-[0.98] transition-transform duration-150"
                onClick={() => router.push('/search')}
              >
                <div className="h-[34px] w-full rounded-full border border-zinc-400 dark:border-zinc-700 bg-muted/80 dark:bg-zinc-900/60 py-1.5 pl-10 pr-3.5 text-[13px] text-muted-foreground transition-all duration-200 group-hover:border-red-600 dark:group-hover:border-red-500 group-hover:bg-card dark:group-hover:bg-zinc-800/90 group-hover:text-foreground group-hover:shadow-sm group-hover:ring-1 group-hover:ring-red-600/30 dark:group-hover:ring-red-500/30 select-none flex items-center shadow-2xs">
                  {language === 'gu' ? 'સમાચાર શોધો...' : language === 'hi' ? 'समाचार खोजें...' : 'Search news...'}
                </div>
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:scale-110 transition-all duration-200">
                  <Search className="h-[14px] w-[14px]" />
                </span>
              </div>
            </div>

            {/* Controls (Mobile + Desktop compact icons) */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {/* Mobile Search Icon Button */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-foreground transition hover:bg-zinc-200 active:scale-95 shrink-0"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Language switcher */}
              <div className="relative z-50 transition-all duration-300 notranslate shrink-0">
                <button
                  type="button"
                  onClick={() => setLanguageOpen((value) => !value)}
                  className={`inline-flex h-8 sm:h-9 items-center gap-1 sm:gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 sm:px-3 text-[11.5px] sm:text-[13px] font-black text-foreground transition-all duration-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer shadow-2xs active:scale-95 ${
                    languageOpen ? 'ring-2 ring-red-600/50 bg-secondary' : ''
                  }`}
                  aria-label="Switch language"
                  aria-expanded={languageOpen}
                >
                  <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-zinc-700 dark:text-zinc-300" />
                  <span className="hidden sm:inline font-black">
                    {languageChosen ? languageLabels[language] : 'Language'}
                  </span>
                  <span className="sm:hidden font-black">
                    {languageChosen ? (language === 'gu' ? 'ગુજ' : language === 'hi' ? 'હિ' : 'EN') : 'Lang'}
                  </span>
                  <ChevronDown strokeWidth={2.5} className={`h-3 w-3 sm:h-4 sm:w-4 shrink-0 transition-transform duration-300 ${languageOpen ? 'rotate-180 text-red-600' : ''}`} />
                </button>

                {languageOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[9998] cursor-default"
                      onClick={() => setLanguageOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-[9999] mt-2 w-36 rounded-xl border border-border/90 bg-card p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-md origin-top-right transition-all duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 notranslate">
                      {(['gu', 'en', 'hi'] as const).map((item) => {
                        const isSelected = languageChosen && language === item;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setLanguage(item);
                              setLanguageOpen(false);
                              setLanguageChosen(true);
                              try { sessionStorage.setItem('gp-lang-chosen', 'true'); } catch (e) { }
                            }}
                            className={`flex items-center justify-between w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition-all duration-150 cursor-pointer hover:scale-[1.02] active:scale-98 ${
                              isSelected
                                ? 'bg-red-600 text-white font-extrabold shadow-sm'
                                : 'text-foreground hover:bg-muted'
                            }`}
                          >
                            <span>{languageLabels[item]}</span>
                            {isSelected && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="group inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-foreground transition-all duration-200 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-500 shrink-0 active:scale-95 shadow-2xs cursor-pointer"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 group-hover:rotate-45" />
                ) : (
                  <Moon className="h-4 w-4 transition-transform duration-200 group-hover:-rotate-12" />
                )}
              </button>

              {/* Saved News (Desktop) */}
              <Link
                href="/saved"
                className="group relative hidden md:inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-zinc-400 dark:border-zinc-700 bg-muted text-foreground transition-all duration-200 hover:border-red-600 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 hover:scale-105 active:scale-95 shrink-0 shadow-2xs cursor-pointer"
                title={language === 'gu' ? 'સાચવેલા સમાચાર' : language === 'hi' ? 'सहेजे गए समाचार' : 'Saved News'}
                aria-label={language === 'gu' ? 'સાચવેલા સમાચાર' : language === 'hi' ? 'सहेजे गए समाचार' : 'Saved News'}
              >
                <Bookmark className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                {savedCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#B3121B] text-[9.5px] font-black text-white shadow-sm ring-1 ring-white dark:ring-zinc-900">
                    {savedCount > 99 ? '99+' : savedCount}
                  </span>
                )}
              </Link>

              {/* User / Login profile button (Matches Reference: circular red button with white user icon on mobile & desktop) */}
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0"
                aria-label="Sign In"
                title="Sign In"
              >
                <User className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {/* Mobile Full-Width Search Overlay Bar */}
          {searchOpen && (
            <div className="absolute inset-0 z-50 flex items-center bg-card px-3 md:hidden animate-in fade-in duration-200">
              <form onSubmit={submitSearch} className="relative w-full flex items-center gap-2">
                <div className="relative flex-1 flex items-center">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={language === 'gu' ? 'સમાચાર શોધો...' : language === 'hi' ? 'समाचार खोजें...' : 'Search news...'}
                    className="h-10 w-full rounded-full border border-border bg-muted py-2 pl-9 pr-8 text-sm text-foreground outline-none focus:border-accent focus:bg-card shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30 text-card hover:bg-muted-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="h-9 px-3.5 rounded-full bg-accent text-white text-xs font-black shrink-0 active:scale-95 shadow-sm"
                >
                  {language === 'gu' ? 'શોધો' : language === 'hi' ? 'खोजें' : 'Search'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground shrink-0"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Row 3: Mobile Category Navigation Row (Matches Reference Exactly) */}
        <div className="flex md:hidden items-center border-b border-border bg-white dark:bg-card px-2 py-0.5 select-none relative z-10 shadow-xs">
          {/* Home icon button with red underline indicator */}
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className={`relative shrink-0 flex items-center gap-1 px-2.5 py-2 text-[15px] font-black transition-colors ${
              pathname === '/' ? 'text-red-600' : 'text-zinc-800 dark:text-zinc-200 hover:text-red-600'
            }`}
          >
            <Home className="h-4 w-4 shrink-0 text-red-600" />
            <span>{language === 'gu' ? 'હોમ' : language === 'hi' ? 'होम' : 'Home'}</span>
            {pathname === '/' && (
              <span className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full bg-red-600" />
            )}
          </Link>

          {/* Horizontal scrollable categories */}
          <div className="flex-1 min-w-0 flex items-center gap-3.5 overflow-x-auto scrollbar-none py-1.5 px-1.5 text-[15px] font-black whitespace-nowrap">
            {navLinks.filter((l) => l.href !== '/').map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`relative py-1 px-1 transition-colors shrink-0 ${
                    active ? 'text-red-600 font-black' : 'text-zinc-800 dark:text-zinc-200 hover:text-red-600'
                  }`}
                >
                  <span>{getNavLabel(link)}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-red-600" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Hamburger menu button on the right */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="shrink-0 p-1.5 ml-1 text-zinc-900 dark:text-zinc-100 hover:text-red-600 active:scale-90 transition-all cursor-pointer"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <X className="h-6 w-6 stroke-[2.2] text-red-600" />
            ) : (
              <Menu className="h-6 w-6 stroke-[2.2]" />
            )}
          </button>
        </div>

        {/* -- Full-Screen Mobile Menu Drawer Overlay (below header) ------------- */}
        <div
          className="fixed inset-x-0 bottom-0 z-[999999] flex flex-col bg-[#F9FAFB] dark:bg-zinc-950 text-foreground md:hidden overflow-y-auto select-none"
          style={{
            top: `${headerHeight}px`,
            opacity: menuOpen ? 1 : 0,
            visibility: menuOpen ? 'visible' : 'hidden',
            display: menuOpen ? 'flex' : 'none',
            transform: menuOpen ? 'translateY(0)' : 'translateY(-10px)',
            pointerEvents: menuOpen ? 'auto' : 'none',
            transition: 'opacity 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1), visibility 0.2s',
          }}
        >
          {/* Menu Drawer Content Container */}
          <div className="px-3.5 py-3.5 space-y-3.5 pb-24">
            {/* 4. Login Section Card */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFF0F2] dark:bg-red-950/25 border border-red-100 dark:border-red-900/30 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shrink-0 shadow-xs">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h4 className="text-[14.5px] font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                    {language === 'gu' ? 'સાઇન ઇન / એકાઉન્ટ' : language === 'hi' ? 'साइन इन / खाता' : 'Sign In / Account'}
                  </h4>
                  <p className="text-[11.5px] font-medium text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
                    {language === 'gu' ? 'તમારા માટે વિવિધ સમાચાર અને અપડેટ્સ મેળવો' : language === 'hi' ? 'आपके लिए विभिन्न समाचार और अपडेट प्राप्त करें' : 'Get personalized news and updates'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="shrink-0 ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-500 text-xs font-black hover:bg-red-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{language === 'gu' ? 'લોગિન' : language === 'hi' ? 'लॉगिन' : 'Login'}</span>
              </button>
            </div>

            {/* 5. Quick Access Cards (Grid 4 Cols) */}
            <div className="grid grid-cols-4 gap-2">
              {/* Card 1: Saved News */}
              <Link
                href="/saved"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center justify-center text-center p-2 rounded-2xl bg-[#FEECEF] dark:bg-red-950/25 border border-red-100 dark:border-red-900/30 hover:scale-[1.02] active:scale-95 transition-all shadow-2xs min-h-[92px]"
              >
                <Bookmark className="h-5 w-5 text-red-600 mb-1.5" />
                <span className="text-[11.5px] font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                  {language === 'gu' ? 'સાચવેલા સમાચાર' : language === 'hi' ? 'सहेजे गए' : 'Saved News'}
                </span>
                {savedCount > 0 && (
                  <span className="text-[10px] font-bold text-red-600 mt-0.5">
                    ({savedCount})
                  </span>
                )}
              </Link>

              {/* Card 2: BRIEF */}
              <Link
                href="/news-brief"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center justify-center text-center p-2 rounded-2xl bg-[#FEF7E6] dark:bg-amber-950/25 border border-amber-100 dark:border-amber-900/30 hover:scale-[1.02] active:scale-95 transition-all shadow-2xs min-h-[92px]"
              >
                <Zap className="h-5 w-5 text-amber-500 fill-amber-500 mb-1.5" />
                <span className="text-[12.5px] font-black text-zinc-900 dark:text-zinc-100 leading-tight">BRIEF</span>
                <span className="text-[9.5px] font-semibold text-zinc-500 dark:text-zinc-400 leading-none mt-0.5">
                  {language === 'gu' ? '(ઝડપી સમાચાર)' : language === 'hi' ? '(त्वरित)' : '(Brief)'}
                </span>
              </Link>

              {/* Card 3: AQI */}
              <Link
                href="/aqi"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center justify-center text-center p-2 rounded-2xl bg-[#E8F7EE] dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/30 hover:scale-[1.02] active:scale-95 transition-all shadow-2xs min-h-[92px]"
              >
                <Leaf className="h-5 w-5 text-emerald-600 fill-emerald-600 mb-1.5" />
                <span className="text-[12.5px] font-black text-zinc-900 dark:text-zinc-100 leading-tight">AQI</span>
                <span className="text-[9.5px] font-semibold text-zinc-500 dark:text-zinc-400 leading-none mt-0.5">
                  {language === 'gu' ? '(હવાના ગુણવત્તા)' : language === 'hi' ? '(वायु गुणवत्ता)' : '(Air)'}
                </span>
              </Link>

              {/* Card 4: E-Paper */}
              <a
                href="/epaper"
                onClick={() => setMenuOpen(false)}
                className="flex flex-col items-center justify-center text-center p-2 rounded-2xl bg-[#E6F2FE] dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/30 hover:scale-[1.02] active:scale-95 transition-all shadow-2xs min-h-[92px]"
              >
                <Newspaper className="h-5 w-5 text-blue-600 mb-1.5" />
                <span className="text-[12px] font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                  {language === 'gu' ? 'ઈ-પેપર' : language === 'hi' ? 'ई-पेपर' : 'E-Paper'}
                </span>
              </a>
            </div>

            {/* Quick Cities Navigation Row (Ahmedabad, Surat, Rajkot, Vadodara, Gandhinagar) */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="h-4 w-1 rounded-full bg-red-600 shrink-0" />
                <h3 className="text-[14px] font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-red-600" />
                  <span>{language === 'gu' ? 'મુખ્ય શહેરો' : language === 'hi' ? 'प्रमुख शहर' : 'Major Cities'}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-0.5">
                {CITY_NAV_LINKS.map((city) => {
                  const active = isActive(city.href);
                  return (
                    <Link
                      key={city.href}
                      href={city.href}
                      onClick={() => setMenuOpen(false)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-[12.5px] font-black border transition-all ${
                        active
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-red-300'
                      }`}
                    >
                      {getNavLabel(city)}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 6. News Categories – TWO COLUMN LAYOUT */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-5 w-1 rounded-full bg-red-600 shrink-0" />
                  <h3 className="text-[15px] font-black text-zinc-900 dark:text-zinc-100">
                    {language === 'gu' ? 'વર્ગો (Categories)' : language === 'hi' ? 'वर्ग (Categories)' : 'Categories'}
                  </h3>
                </div>
                <Link
                  href="/categories"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center gap-1 text-xs font-black text-red-600 hover:text-red-700 transition"
                >
                  <span>{language === 'gu' ? 'બધા વર્ગો જુઓ' : language === 'hi' ? 'सभी वर्ग देखें' : 'View All'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* TWO COLUMN GRID */}
              <div className="grid grid-cols-2 gap-2.5">
                {allDrawerCategories.map((cat, idx) => {
                  const active = isActive(cat.href);
                  return (
                    <Link
                      key={`${cat.href}-${idx}`}
                      href={cat.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-zinc-900 shadow-2xs hover:scale-[1.01] active:scale-98 transition-all h-[50px] ${
                        active
                          ? 'border-red-600 ring-1 ring-red-600/40 text-red-600'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getCategoryIcon(cat.slug || '', getNavLabel(cat))}
                        <span className="truncate font-black text-[13px]">
                          {getNavLabel(cat)}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0 ml-1" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 7. App Promotion Section */}
            <div className="rounded-2xl bg-black text-white p-3.5 border border-zinc-800 shadow-md relative overflow-hidden">
              <div className="flex items-center gap-3">
                {/* Smartphone mockups graphic */}
                <div className="relative shrink-0 w-22 h-26 flex items-center justify-center">
                  <div className="absolute left-0 top-1 w-15 h-24 rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden shadow-lg -rotate-6">
                    <div className="h-3 bg-red-600 flex items-center justify-center px-1">
                      <span className="text-[5px] font-black text-white">GUJARAT POST</span>
                    </div>
                    <div className="p-1 space-y-1">
                      <div className="h-6 rounded bg-zinc-800" />
                      <div className="h-1.5 w-3/4 bg-zinc-700 rounded" />
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 w-15 h-24 rounded-xl border border-zinc-600 bg-zinc-950 overflow-hidden shadow-2xl rotate-3">
                    <div className="h-3.5 bg-[#B3121B] flex items-center justify-center px-1">
                      <span className="text-[5px] font-black text-white tracking-tight">GUJARAT POST</span>
                    </div>
                    <div className="p-1 space-y-1">
                      <div className="h-7 rounded bg-zinc-800 flex items-center justify-center">
                        <img src="/GujaratpostFinalLogo.png" alt="logo" className="h-2.5 w-9 object-contain" />
                      </div>
                      <div className="h-1.5 w-full bg-zinc-700 rounded" />
                      <div className="h-1.5 w-2/3 bg-zinc-700 rounded" />
                    </div>
                  </div>
                </div>

                {/* Text and buttons */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-black text-white leading-tight">Gujarat Post App</h4>
                  <h5 className="text-[12.5px] font-bold text-white leading-tight mt-0.5">
                    {language === 'gu' ? 'હવે તમારા મોબાઇલમાં' : language === 'hi' ? 'अब आपके मोबाइल में' : 'Now on your Mobile'}
                  </h5>
                  <p className="text-[10px] font-normal text-zinc-400 mt-1 leading-snug">
                    {language === 'gu'
                      ? 'ઝડપી, વિશ્વસનીય અને અપડેટેડ સમાચાર માટે એપ ડાઉનલોડ કરો.'
                      : language === 'hi'
                      ? 'त्वरित, विश्वसनीय और अद्यतन समाचार के लिए ऐप डाउनलोड करें।'
                      : 'Download the app for fast and reliable news updates.'}
                  </p>

                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    <a
                      href="https://apps.apple.com/in/app/gujarat-post/id6475000526"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 py-1 px-1.5 text-white hover:border-zinc-500 active:scale-95 transition-all shadow-xs"
                    >
                      <AppleIcon className="h-3.5 w-3.5 text-white shrink-0" />
                      <span translate="no" className="text-[10px] font-black text-white tracking-tight">App Store</span>
                    </a>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.gujaratpost.app"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 py-1 px-1.5 text-white hover:border-zinc-500 active:scale-95 transition-all shadow-xs"
                    >
                      <PlayStoreIcon className="h-3.5 w-3.5 shrink-0" />
                      <span translate="no" className="text-[10px] font-black text-white tracking-tight">Google Play</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 8. Social Media Section */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 shrink-0">Follow Us :</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Facebook */}
                <a
                  href="https://www.facebook.com/gujpost.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-[#1877F2] text-white hover:scale-110 active:scale-95 transition-transform shadow-xs"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                    <path d="M14.2 8.2V6.8c0-.7.5-.9.9-.9h2.2V2.1L14.2 2c-3.5 0-4.3 2.1-4.3 4.1v2.1H7.8v4.2h2.1V22h4.3v-9.6h2.9l.5-4.2h-3.4Z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/gujaratpost.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] text-white hover:scale-110 active:scale-95 transition-transform shadow-xs"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4.2" />
                    <circle cx="17.4" cy="6.7" r="1.2" fill="currentColor" />
                  </svg>
                </a>
                {/* YouTube */}
                <a
                  href="https://www.youtube.com/@Gujaratpostnews"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-[#FF0000] text-white hover:scale-110 active:scale-95 transition-transform shadow-xs"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M21.58 7.19a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.68.49a2.7 2.7 0 0 0-1.9 1.9A28.4 28.4 0 0 0 2 12a28.4 28.4 0 0 0 .42 4.81 2.7 2.7 0 0 0 1.9 1.9c1.68.49 7.68.49 7.68.49s6 0 7.68-.49a2.7 2.7 0 0 0 1.9-1.9A28.4 28.4 0 0 0 22 12a28.4 28.4 0 0 0-.42-4.81ZM10 15V9l5.2 3L10 15Z" />
                  </svg>
                </a>
                {/* WhatsApp */}
                <a
                  href="https://wa.me/919909907237"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-[#25D366] text-white hover:scale-110 active:scale-95 transition-transform shadow-xs"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12.004 2.003A9.998 9.998 0 0 0 2 12.001c0 1.762.46 3.418 1.268 4.858L2.05 21.78a.5.5 0 0 0 .607.632l5.09-1.336A9.953 9.953 0 0 0 12.004 22c5.522 0 9.998-4.477 9.998-9.999S17.526 2.003 12.004 2.003zm0 18.001a8.299 8.299 0 0 1-4.232-1.156l-.303-.18-3.024.793.808-2.955-.198-.32A8.3 8.3 0 0 1 3.7 12.001c0-4.584 3.73-8.31 8.304-8.31 4.576 0 8.305 3.726 8.305 8.31 0 4.583-3.73 8.303-8.305 8.303z"/>
                  </svg>
                </a>
                {/* X */}
                <a
                  href="https://x.com/maheshrpat59606"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-black text-white hover:scale-110 active:scale-95 transition-transform shadow-xs"
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                    <path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.8-6.3L6.7 22H3.5l7.2-8.3L3 2h6.3l4.4 5.8L18.9 2Zm-1.1 17.9h1.7L8.4 4H6.6l11.2 15.9Z" />
                  </svg>
                </a>
                {/* Google News */}
                <a
                  href="https://news.google.com/search?q=gujaratpost&hl=gu-IN&gl=IN&ceid=IN%3Agu"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Google News"
                  title="Google News"
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-[#4285F4] text-white hover:scale-110 active:scale-95 transition-transform shadow-xs"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H6v-6h5v6zm7 0h-5v-2h5v2zm0-4h-5v-2h5v2zm0-4H6V7h12v2z"/>
                  </svg>
                </a>
                {/* Share */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      if (navigator.share) {
                        navigator.share({ title: 'Gujarat Post', url: window.location.origin }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(window.location.origin);
                        alert('Link copied to clipboard!');
                      }
                    }
                  }}
                  aria-label="Share"
                  className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:scale-110 active:scale-95 transition-transform shadow-xs cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* -- Sticky Nav Section (Category Bar + District Bar) (Desktop only) ------------------ */}
      <div className={`${hideStickyNav ? 'relative z-50' : 'sticky top-0 z-50'} bg-card/98 shadow-md transition-all duration-300 hidden md:block`}>
        {/* Desktop Nav Bar */}
        <nav
          className="hidden border-y-2 border-zinc-400 bg-card/98 md:block dark:border-zinc-600"
          aria-label="Main navigation"
        >
          <div className="mx-auto max-w-[1700px] px-1.5 sm:px-2 xl:px-3 flex items-center gap-1 xl:gap-1.5 relative">
            {/* Main scrollable navigation list with Left & Right scroll arrows */}
            <div className={`relative min-w-0 overflow-hidden flex items-center ${isGujarati ? 'flex-initial max-w-full' : 'flex-1'}`}>
              {/* Left Scroll Arrow Button */}
              {canNavScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center bg-gradient-to-r from-card via-card/90 to-transparent pr-4 pl-0.5 pointer-events-none">
                  <button
                    type="button"
                    onClick={handleNavScrollLeft}
                    aria-label="Scroll navigation left"
                    className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border/70 shadow-md text-foreground/80 hover:text-accent hover:border-accent/40 active:scale-90 transition-all duration-150 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              )}

              <ul
                ref={navScrollRef}
                className={`flex items-center gap-0 overflow-x-auto scrollbar-none scroll-smooth ${isGujarati ? '' : 'w-full'}`}
              >
                {navLinks.map((link, idx) => {
                  const active = isActive(link.href);
                  return (
                    <li key={`${link.href}-${link.label || ''}-${idx}-${language}`} className="shrink-0">
                      <a
                        href={link.href}
                        className={`relative flex h-11 items-center justify-center whitespace-nowrap ${link.href === '/' ? 'px-2.5 sm:px-3' : 'px-2 sm:px-2.5 xl:px-3 2xl:px-3.5'
                          } text-[14px] xl:text-[14.5px] 2xl:text-[15px] font-bold tracking-tight transition-colors duration-150 ${active
                            ? 'text-accent'
                            : 'text-foreground hover:text-accent'
                          }`}
                        aria-current={active ? 'page' : undefined}
                        aria-label={link.href === '/' ? 'Home' : undefined}
                        title={link.href === '/' ? getNavLabel(link) : undefined}
                      >
                        {link.href === '/' ? (
                          <Home className="h-5 w-5 sm:h-[22px] sm:w-[22px] shrink-0 text-accent transition-transform duration-200 hover:scale-110" strokeWidth={2.3} />
                        ) : (
                          getNavLabel(link)
                        )}
                        {/* Active indicator – thick red underline */}
                        {active && (
                          <span
                            className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-accent"
                            aria-hidden="true"
                          />
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>

              {/* Right Scroll Arrow Button */}
              {canNavScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-end bg-gradient-to-l from-card via-card/90 to-transparent pl-4 pr-0.5 pointer-events-none">
                  <button
                    type="button"
                    onClick={handleNavScrollRight}
                    aria-label="Scroll navigation right"
                    className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-card border border-border/70 shadow-md text-foreground/80 hover:text-accent hover:border-accent/40 active:scale-90 transition-all duration-150 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>

            {/* Other / અન્ય Dropdown Trigger — sits right after the last nav link (Podcast) */}
            {otherLinks.length > 0 && (
              <div
                ref={triggerRef}
                className="relative shrink-0"
                onMouseEnter={() => {
                  setOtherMenuOpen(true);
                  const rect = triggerRef.current?.getBoundingClientRect();
                  const navWrapper = triggerRef.current?.closest('nav > div');
                  const navRect = navWrapper?.getBoundingClientRect();
                  if (rect && navRect) {
                    setDropdownLeft(rect.left - navRect.left);
                  }
                }}
                onMouseLeave={() => setOtherMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    const rect = triggerRef.current?.getBoundingClientRect();
                    const navWrapper = triggerRef.current?.closest('nav > div');
                    const navRect = navWrapper?.getBoundingClientRect();
                    if (rect && navRect) {
                      setDropdownLeft(rect.left - navRect.left);
                    }
                    setOtherMenuOpen(!otherMenuOpen);
                  }}
                  className={`relative flex h-11 items-center gap-1 whitespace-nowrap px-2 sm:px-2.5 xl:px-3 2xl:px-3.5 text-[14px] xl:text-[14.5px] 2xl:text-[15px] font-bold sm:font-black tracking-tight transition-colors duration-150 cursor-pointer ${otherMenuOpen ? 'text-accent' : 'text-foreground hover:text-accent'
                    }`}
                  style={{ fontWeight: 800 }}
                >
                  <span key={language} className="font-bold sm:font-black" style={{ fontWeight: 800 }}>{language === 'gu' ? 'અન્ય' : language === 'hi' ? 'अन्य' : 'More'}</span>
                  <ChevronDown strokeWidth={2.5} className={`h-4 w-4 transition-transform duration-200 ${otherMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}

            {/* Non-scrollable controls pinned to the right (Support Us & E-Paper CTAs) */}
            <div className="ml-auto flex items-center gap-1.5 xl:gap-2 shrink-0 pl-2 xl:pl-3 border-l border-border/40 h-11 relative">
              {/* Support Us CTA */}
              {supportEnabled && <button
                type="button"
                onClick={openSupportModal}
                onMouseEnter={prefetchSupportDetails}
                className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-lg bg-red-600 px-3 text-[13px] font-black text-white shadow-md shadow-red-900/20 ring-1 ring-red-600/40 transition-all duration-200 hover:bg-red-700 hover:shadow-lg hover:scale-[1.03] active:scale-95 cursor-pointer"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" aria-hidden="true" />
                <Heart className="h-4 w-4 shrink-0 fill-current text-white animate-pulse" />
                <span className="tracking-wide font-black text-[13px]">{language === 'gu' ? 'સપોર્ટ કરો' : language === 'hi' ? 'सपोर्ट करें' : 'Support Us'}</span>
              </button>}

              {/* E-Paper CTA */}
              {epaperEnabled && (
                <a
                  href="/epaper"
                  className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-lg bg-red-600 px-3 text-[13px] font-black text-white shadow-md shadow-red-900/30 ring-1 ring-red-600/40 transition-all duration-200 hover:bg-red-700 hover:shadow-lg hover:shadow-red-900/40 hover:scale-[1.03] active:scale-95"
                >
                  {/* shimmer sweep on hover */}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" aria-hidden="true" />
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span className="tracking-wide font-black text-[13px]">{language === 'gu' ? 'ઈ-પેપર' : language === 'hi' ? 'ई-पेपर' : 'E-Paper'}</span>
                  {/* live pulse dot */}
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                </a>
              )}
            </div>

            {otherMenuOpen && otherLinks.length > 0 && (
              <div
                className="absolute z-50 min-w-48 max-w-64 max-h-[min(480px,75vh)] overflow-y-auto overscroll-contain rounded-xl border border-border/80 bg-card/95 backdrop-blur-md p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 [scrollbar-width:thin] [scrollbar-color:rgba(160,160,160,0.4)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent"
                style={{
                  top: '100%',
                  left: dropdownLeft !== null ? `${dropdownLeft}px` : undefined,
                }}
                onMouseEnter={() => setOtherMenuOpen(true)}
                onMouseLeave={() => setOtherMenuOpen(false)}
              >
                {otherLinks.map((link, idx) => {
                  const active = isActive(link.href);
                  return (
                    <a
                      key={`${link.href}-${link.label || ''}-${idx}-${language}`}
                      href={link.href}
                      onClick={() => setOtherMenuOpen(false)}
                      className={`block rounded-md px-3.5 py-2 text-left text-[14px] font-bold transition-colors duration-150 ${active
                        ? 'bg-accent/10 text-accent'
                        : 'text-foreground hover:bg-muted hover:text-accent'
                        }`}
                    >
                      {getNavLabel(link)}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* District Bar */}
        <div>
          <DistrictBar navLinks={navLinks} otherLinks={otherLinks} />
        </div>
      </div>

      {/* City selection modal */}
      {cityModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs transition-opacity duration-300">
          <div className="w-full max-w-sm scale-100 rounded-lg border border-border bg-card p-5 shadow-2xl transition-all duration-300">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-[15px] font-black text-foreground flex items-center gap-1.5 select-none">
                <span>📍</span>
                {language === 'gu' ? 'શહેર પસંદ કરો' : language === 'hi' ? 'शहर का चयन करें' : 'Select Your City'}
              </h3>
              <button
                type="button"
                onClick={() => setCityModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {['અમદાવાદ', 'સુરત', 'રાજકોટ', 'વડોદરા', 'ગાંધીનગર', 'અન્ય શહેરો'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSelectCity(city)}
                  className={`rounded border py-2.5 text-xs font-black transition-all cursor-pointer text-center ${selectedCity === city
                    ? 'border-accent bg-accent/5 text-accent shadow-sm font-sans'
                    : 'border-border bg-card hover:bg-muted hover:border-foreground/20 text-foreground'
                    }`}
                >
                  {cityTranslations[city]?.[language] || city}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Auth Modal */}
      <UserAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        language={language}
      />

      {/* Calendar & Date Modal */}
      <CalendarModal
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        language={language}
      />
    </>
  );
}
