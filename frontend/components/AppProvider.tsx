'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import SupportModal from '@/components/ui/SupportModal';
import { useIsApk } from '@/lib/useIsApk';

type Theme = 'light' | 'dark';
type Language = 'gu' | 'en' | 'hi';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  apkTheme: Theme;
  toggleApkTheme: () => void;
  language: Language;
  setLanguage: (l: Language) => void;
  fsLevel: number;
  incFs: () => void;
  decFs: () => void;
  supportModalOpen: boolean;
  openSupportModal: () => void;
  closeSupportModal: () => void;
}

const AppContext = createContext<AppContextType>({
  theme: 'light',
  toggleTheme: () => {},
  apkTheme: 'light',
  toggleApkTheme: () => {},
  language: 'gu',
  setLanguage: () => {},
  fsLevel: 1,
  incFs: () => {},
  decFs: () => {},
  supportModalOpen: false,
  openSupportModal: () => {},
  closeSupportModal: () => {},
});

const FONT_SIZES = ['14px', '16px', '18px', '20px'];

function clearGoogleTranslateCookie() {
  if (typeof document === 'undefined') return;

  try {
    const { hostname } = window.location;
    const domains = ['', hostname, `.${hostname}`];

    domains.forEach((domain) => {
      document.cookie = [
        'googtrans=',
        'expires=Thu, 01 Jan 1970 00:00:00 UTC',
        'path=/',
        domain ? `domain=${domain}` : '',
      ].filter(Boolean).join('; ');
    });
  } catch (e) {
    console.warn('Failed to clear Google Translate cookie:', e);
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isApk } = useIsApk();
  const [theme, setTheme] = useState<Theme>('light');
  const [apkTheme, setApkTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('gu');
  const [fsLevel, setFsLevel] = useState<number>(1);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const hydrated = useRef(false);

  const openSupportModal = () => setSupportModalOpen(true);
  const closeSupportModal = () => setSupportModalOpen(false);

  useEffect(() => {
    const handleGlobalSupportOpen = () => setSupportModalOpen(true);
    window.addEventListener('gp-open-support', handleGlobalSupportOpen);
    return () => window.removeEventListener('gp-open-support', handleGlobalSupportOpen);
  }, []);

  useEffect(() => {
    let savedTheme: string | null = null;
    let savedApkTheme: string | null = null;
    let savedLanguage: string | null = null;
    let savedFsLevel: string | null = null;

    clearGoogleTranslateCookie();

    try {
      savedTheme = localStorage.getItem('gp-theme');
      savedApkTheme = localStorage.getItem('gp-apk-theme');
      savedLanguage = sessionStorage.getItem('gp-lang'); // session-only: resets each new tab
      savedFsLevel = localStorage.getItem('gp-fs-level');
    } catch (e) {
      console.warn('LocalStorage not accessible:', e);
    }

    const frame = window.requestAnimationFrame(() => {
      if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
      if (savedApkTheme === 'light' || savedApkTheme === 'dark') setApkTheme(savedApkTheme);

      if (savedLanguage === 'gu' || savedLanguage === 'en' || savedLanguage === 'hi') {
        // User has an explicit saved preference — honour it
        setLanguage(savedLanguage as Language);
      } else {
        // First-time session: no preference saved → persist 'gu' as the session default
        try {
          sessionStorage.setItem('gp-lang', 'gu');
        } catch (e) {
          console.warn('Failed to save default language:', e);
        }
        // State already initialised to 'gu', nothing else to do
      }

      if (savedFsLevel !== null) {
        const level = parseInt(savedFsLevel, 10);
        if (!isNaN(level) && level >= 0 && level <= 3) setFsLevel(level);
      }

      hydrated.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Theme application:
  // If isApk is true, apply apkTheme ONLY.
  // If isApk is false (standard website or web mobile view), apply website theme ONLY.
  useEffect(() => {
    const activeTheme = isApk ? apkTheme : theme;
    document.documentElement.classList.toggle('dark', activeTheme === 'dark');
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.style.setProperty('--gp-font-size', FONT_SIZES[fsLevel]);

    if (!hydrated.current) return;
    try {
      if (isApk) {
        localStorage.setItem('gp-apk-theme', apkTheme);
      } else {
        localStorage.setItem('gp-theme', theme);
      }
      localStorage.setItem('gp-fs-level', String(fsLevel));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [theme, apkTheme, isApk, fsLevel]);

  useEffect(() => {
    document.documentElement.lang = language;
    clearGoogleTranslateCookie();

    if (!hydrated.current) return;
    try {
      sessionStorage.setItem('gp-lang', language); // session-only: resets each new tab
    } catch (e) {
      console.warn('Failed to save language to sessionStorage:', e);
    }
  }, [language]);

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  const toggleApkTheme = () => {
    setApkTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('gp-apk-theme', next);
      } catch (e) {
        console.warn('Failed to save apk theme:', e);
      }
      return next;
    });
  };

  const handleSetLanguage = (nextLanguage: Language) => setLanguage(nextLanguage);
  const incFs = () => setFsLevel((current) => Math.min(current + 1, 3));
  const decFs = () => setFsLevel((current) => Math.max(current - 1, 0));

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      apkTheme,
      toggleApkTheme,
      language,
      setLanguage: handleSetLanguage,
      fsLevel,
      incFs,
      decFs,
      supportModalOpen,
      openSupportModal,
      closeSupportModal,
    }),
    [theme, apkTheme, language, fsLevel, supportModalOpen, isApk],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <SupportModal isOpen={supportModalOpen} onClose={closeSupportModal} />
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

