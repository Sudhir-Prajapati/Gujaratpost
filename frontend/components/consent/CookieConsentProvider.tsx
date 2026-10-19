'use client';

import React, { createContext, useContext, useEffect, useState, useTransition, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  CookieConsentPreferences,
  CookieConsentRecord,
  DEFAULT_PREFERENCES,
  ALL_ALLOWED_PREFERENCES,
  getStoredConsent,
  saveConsentRecord,
} from '@/types/cookie-consent';

interface CookieConsentContextType {
  preferences: CookieConsentPreferences;
  hasDecided: boolean;
  isBannerOpen: boolean;
  isModalOpen: boolean;
  isMounted: boolean;
  acceptAll: () => void;
  rejectOptional: () => void;
  savePreferences: (prefs: Partial<CookieConsentPreferences>) => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(DEFAULT_PREFERENCES);
  const [hasDecided, setHasDecided] = useState<boolean>(true); // start as true to avoid hydration mismatch/flicker
  const [isBannerOpen, setIsBannerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Read stored consent synchronously once mounted on client
  useEffect(() => {
    setIsMounted(true);
    const existing = getStoredConsent();
    if (existing) {
      setPreferences(existing.preferences);
      setHasDecided(true);
      setIsBannerOpen(false);
    } else {
      setPreferences(DEFAULT_PREFERENCES);
      setHasDecided(false);
      // Suppress banner on administrative dashboard routes
      const isAdminRoute = pathname?.startsWith('/admin');
      if (!isAdminRoute) {
        setIsBannerOpen(true);
      }
    }
  }, [pathname]);

  // Listen for global modal open events (e.g. footer links, settings page)
  useEffect(() => {
    const handleOpenModal = () => setIsModalOpen(true);
    const handleConsentUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<CookieConsentRecord>;
      if (customEvent.detail && customEvent.detail.preferences) {
        setPreferences(customEvent.detail.preferences);
        setHasDecided(true);
        setIsBannerOpen(false);
      }
    };

    window.addEventListener('gp-open-cookie-settings', handleOpenModal);
    window.addEventListener('gp-cookie-consent-updated', handleConsentUpdated);

    return () => {
      window.removeEventListener('gp-open-cookie-settings', handleOpenModal);
      window.removeEventListener('gp-cookie-consent-updated', handleConsentUpdated);
    };
  }, []);

  const acceptAll = useCallback(() => {
    const saved = saveConsentRecord(ALL_ALLOWED_PREFERENCES);
    startTransition(() => {
      setPreferences(saved.preferences);
      setHasDecided(true);
      setIsBannerOpen(false);
      setIsModalOpen(false);
    });
  }, []);

  const rejectOptional = useCallback(() => {
    const saved = saveConsentRecord(DEFAULT_PREFERENCES);
    startTransition(() => {
      setPreferences(saved.preferences);
      setHasDecided(true);
      setIsBannerOpen(false);
      setIsModalOpen(false);
    });
  }, []);

  const handleSavePreferences = useCallback((newPrefs: Partial<CookieConsentPreferences>) => {
    const saved = saveConsentRecord(newPrefs);
    startTransition(() => {
      setPreferences(saved.preferences);
      setHasDecided(true);
      setIsBannerOpen(false);
      setIsModalOpen(false);
    });
  }, []);

  const openSettingsModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const value: CookieConsentContextType = {
    preferences,
    hasDecided,
    isBannerOpen: isMounted && isBannerOpen && !pathname?.startsWith('/admin'),
    isModalOpen,
    isMounted,
    acceptAll,
    rejectOptional,
    savePreferences: handleSavePreferences,
    openSettingsModal,
    closeSettingsModal,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextType {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}
