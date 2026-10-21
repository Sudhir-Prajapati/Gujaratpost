'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-4K0RT88M7L';

function GoogleAnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  // Track page views on route changes without duplicate initial page view
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!GA_ID) return;

    const query = searchParams?.toString();
    const url = pathname + (query ? `?${query}` : '');

    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('config', GA_ID, {
        page_path: url,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [pathname, searchParams]);

  // Listen to cookie consent updates and update Google Consent Mode v2 accordingly
  useEffect(() => {
    const handleConsentUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      const preferences = customEvent.detail?.preferences;
      if (!preferences) return;

      if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
        (window as any).gtag('consent', 'update', {
          analytics_storage: preferences.analytics ? 'granted' : 'denied',
          ad_storage: preferences.marketing ? 'granted' : 'denied',
          ad_user_data: preferences.marketing ? 'granted' : 'denied',
          ad_personalization: preferences.marketing ? 'granted' : 'denied',
        });

        // When user grants analytics consent, trigger page_view so GA4 Realtime records the visit immediately
        if (preferences.analytics && GA_ID) {
          (window as any).gtag('event', 'page_view', {
            page_path: window.location.pathname + (window.location.search || ''),
            page_location: window.location.href,
            page_title: document.title,
          });
        }
      }
    };

    window.addEventListener('gp-cookie-consent-updated', handleConsentUpdated);
    return () => {
      window.removeEventListener('gp-cookie-consent-updated', handleConsentUpdated);
    };
  }, []);

  return null;
}

export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      {/* 1. Google Consent Mode v2 Default Configuration (runs synchronously before tags) */}
      <Script
        id="google-consent-mode"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            // Set default consent state
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'wait_for_update': 500
            });

            // If user has already accepted cookies in past sessions, grant immediately
            try {
              var cookieMatch = document.cookie.match(/(?:^|;\\s*)gp_cookie_consent=([^;]*)/);
              var raw = cookieMatch ? cookieMatch[1] : (window.localStorage ? localStorage.getItem('gp_cookie_consent') : null);
              if (raw) {
                var record = JSON.parse(decodeURIComponent(raw));
                if (record && record.preferences) {
                  gtag('consent', 'update', {
                    'analytics_storage': record.preferences.analytics ? 'granted' : 'denied',
                    'ad_storage': record.preferences.marketing ? 'granted' : 'denied',
                    'ad_user_data': record.preferences.marketing ? 'granted' : 'denied',
                    'ad_personalization': record.preferences.marketing ? 'granted' : 'denied'
                  });
                }
              }
            } catch(e) {}
          `,
        }}
      />

      {/* 2. Load Google Tag Manager / gtag.js */}
      <Script
        id="google-analytics-tag"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />

      {/* 3. Initialize gtag with Measurement ID */}
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
              page_location: window.location.href,
              page_title: document.title,
              send_page_view: true
            });
          `,
        }}
      />

      {/* 4. Client-side route changes and consent update listener (wrapped in Suspense) */}
      <Suspense fallback={null}>
        <GoogleAnalyticsRouteTracker />
      </Suspense>
    </>
  );
}
