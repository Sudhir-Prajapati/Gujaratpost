export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-95H476MCPR';

/**
 * Sends a custom pageview event to Google Analytics
 */
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function' && GA_TRACKING_ID) {
    (window as any).gtag('event', 'page_view', {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }
};

/**
 * Sends a custom event to Google Analytics
 */
export const event = ({
  action,
  category,
  label,
  value,
  params,
}: {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  params?: Record<string, any>;
}) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...(params || {}),
    });
  }
};
