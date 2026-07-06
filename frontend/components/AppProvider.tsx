'use client';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import NewsLoader from '@/components/ui/NewsLoader';

type Theme = 'light' | 'dark';
type Language = 'gu' | 'en' | 'hi';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (l: Language) => void;
}

const AppContext = createContext<AppContextType>({
  theme: 'light',
  toggleTheme: () => {},
  language: 'gu',
  setLanguage: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('gu');
  const [showMicLoader, setShowMicLoader] = useState(true);
  const hydrated = useRef(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('gp-theme');
    const savedLanguage = localStorage.getItem('gp-lang');

    const frame = window.requestAnimationFrame(() => {
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }

      if (savedLanguage === 'gu' || savedLanguage === 'en' || savedLanguage === 'hi') {
        setLanguage(savedLanguage);
      }

      hydrated.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMicLoader(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.lang = language;

    if (!hydrated.current) return;

    localStorage.setItem('gp-theme', theme);
    localStorage.setItem('gp-lang', language);
  }, [theme, language]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  const handleSetLanguage = (l: Language) => {
    setLanguage(l);
  };

  const value = useMemo(
    () => ({ theme, toggleTheme, language, setLanguage: handleSetLanguage }),
    [theme, language],
  );

  return (
    <AppContext.Provider value={value}>
      {showMicLoader ? <NewsLoader fullPage /> : children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
