'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import SupportModal from '@/components/ui/SupportModal';
import { useIsApk } from '@/lib/useIsApk';
import { getPublicSupportDetails } from '@/lib/api';

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
  supportEnabled: boolean;
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
  supportEnabled: true,
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
  const { isApk, isReady: isApkReady } = useIsApk();
  const [theme, setTheme] = useState<Theme>('light');
  const [apkTheme, setApkTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('gu');
  const [fsLevel, setFsLevel] = useState<number>(1);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportEnabled, setSupportEnabled] = useState(true);
  const [preferencesReady, setPreferencesReady] = useState(false);

  const openSupportModal = () => {
    if (supportEnabled) setSupportModalOpen(true);
  };
  const closeSupportModal = () => setSupportModalOpen(false);

  useEffect(() => {
    let active = true;
    const refreshSupportVisibility = async () => {
      const details = await getPublicSupportDetails();
      if (!active || !details) return;
      const enabled = details.supportEnabled !== false;
      setSupportEnabled(enabled);
      if (!enabled) setSupportModalOpen(false);
    };

    refreshSupportVisibility();
    const interval = window.setInterval(refreshSupportVisibility, 30000);
    window.addEventListener('focus', refreshSupportVisibility);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshSupportVisibility);
    };
  }, []);

  useEffect(() => {
    const handleGlobalSupportOpen = () => {
      if (supportEnabled) setSupportModalOpen(true);
    };
    window.addEventListener('gp-open-support', handleGlobalSupportOpen);
    return () => window.removeEventListener('gp-open-support', handleGlobalSupportOpen);
  }, [supportEnabled]);

  useLayoutEffect(() => {
    let savedTheme: string | null = null;
    let savedApkTheme: string | null = null;
    let savedLanguage: string | null = null;
    let savedFsLevel: string | null = null;

    clearGoogleTranslateCookie();

    try {
      savedTheme = localStorage.getItem('gp-theme');
      savedApkTheme = localStorage.getItem('gp-apk-theme');
      savedLanguage = sessionStorage.getItem('gp-lang') || localStorage.getItem('gp-lang');
      savedFsLevel = localStorage.getItem('gp-fs-level');
    } catch (e) {
      console.warn('LocalStorage not accessible:', e);
    }

    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
    if (savedApkTheme === 'light' || savedApkTheme === 'dark') setApkTheme(savedApkTheme);

    // Check if URL has an explicit lang parameter (e.g. from Facebook, X, WhatsApp share)
    let urlLang: string | null = null;
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const l = params.get('lang');
        if (l === 'gu' || l === 'hi' || l === 'en') {
          urlLang = l;
        }
      }
    } catch {}

    const effectiveLanguage = urlLang || savedLanguage;

    if (effectiveLanguage === 'gu' || effectiveLanguage === 'en' || effectiveLanguage === 'hi') {
      setLanguage(effectiveLanguage as Language);
      if (urlLang) {
        try {
          sessionStorage.setItem('gp-lang', urlLang);
          localStorage.setItem('gp-lang', urlLang);
        } catch {}
      }
    } else {
      // First-time session: no preference saved → persist 'gu' as the session default
      try {
        sessionStorage.setItem('gp-lang', 'gu');
        localStorage.setItem('gp-lang', 'gu');
      } catch (e) {
        console.warn('Failed to save default language:', e);
      }
      // State already initialised to 'gu', nothing else to do
    }

    if (savedFsLevel !== null) {
      const level = parseInt(savedFsLevel, 10);
      if (!isNaN(level) && level >= 0 && level <= 3) setFsLevel(level);
    }

    setPreferencesReady(true);
  }, []);

  // Theme application:
  // If isApk is true, apply apkTheme ONLY.
  // If isApk is false (standard website or web mobile view), apply website theme ONLY.
  useLayoutEffect(() => {
    if (!preferencesReady || !isApkReady) return;
    const activeTheme = isApk ? apkTheme : theme;
    document.documentElement.classList.toggle('dark', activeTheme === 'dark');
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.style.setProperty('--gp-font-size', FONT_SIZES[fsLevel]);

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
  }, [theme, apkTheme, isApk, isApkReady, fsLevel, preferencesReady]);

  useLayoutEffect(() => {
    if (!preferencesReady) return;
    document.documentElement.removeAttribute('data-gp-language-pending');
    document.documentElement.lang = language;
    clearGoogleTranslateCookie();

    try {
      sessionStorage.setItem('gp-lang', language);
      localStorage.setItem('gp-lang', language);
    } catch (e) {
      console.warn('Failed to save language to storage:', e);
    }
  }, [language, preferencesReady]);

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

  const handleSetLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    try {
      sessionStorage.setItem('gp-lang', nextLanguage);
      localStorage.setItem('gp-lang', nextLanguage);
      window.dispatchEvent(new CustomEvent('gp-language-changed', { detail: nextLanguage }));
    } catch (e) {
      console.warn('Failed to persist language:', e);
    }
  };
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
      supportEnabled,
      openSupportModal,
      closeSupportModal,
    }),
    [theme, apkTheme, language, fsLevel, supportModalOpen, supportEnabled, isApk],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      {supportEnabled && <SupportModal isOpen={supportModalOpen} onClose={closeSupportModal} />}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

