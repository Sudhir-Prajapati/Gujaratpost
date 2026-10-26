import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Noto_Sans_Gujarati, Hind_Vadodara } from "next/font/google";
import { AppProvider } from "@/components/AppProvider";
import { CookieConsentProvider } from "@/components/consent/CookieConsentProvider";
import { CookieConsentBanner } from "@/components/consent/CookieConsentBanner";
import { CookieSettingsModal } from "@/components/consent/CookieSettingsModal";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";
import ScrollToTop from "@/components/ui/ScrollToTop";

const notoSansGujarati = Noto_Sans_Gujarati({
  subsets: ["gujarati", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-sans-gujarati",
  display: "swap",
});

const hindVadodara = Hind_Vadodara({
  subsets: ["gujarati", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-vadodara",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#B3121B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.startsWith("http")
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "https://gujaratpost.in"
  ),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gujarat Post",
  },
  title: {
    default: "Gujarat Post - Gujarati News Portal",
    template: "%s | Gujarat Post",
  },
  description: "Premium Gujarati news portal demo for breaking news, politics, crime, business, sports, videos and photo stories.",
  keywords: ["Gujarat news", "Gujarati news", "Gujarat Post", "Breaking news Gujarat", "Gujarat politics"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Gujarat Post",
    description: "Latest Gujarati breaking news, politics, business, sports and entertainment.",
    url: "https://gujaratpost.in",
    siteName: "Gujarat Post",
    locale: "gu_IN",
    type: "website",
    images: [
      {
        url: "https://gujaratpost.in/logo.png",
        width: 1200,
        height: 630,
        alt: "Gujarat Post",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gujarat Post",
    description: "Latest Gujarati breaking news.",
    site: "@gujaratpostin",
    images: ["https://gujaratpost.in/logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/assets/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/assets/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/assets/favicon-180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="gu" data-scroll-behavior="smooth" className={`${notoSansGujarati.variable} ${hindVadodara.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://img.youtube.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />

        {/* Google Analytics (GA4) — Direct in <head> like FinTrade */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <AppProvider>
          <CookieConsentProvider>
            <MainLayoutWrapper>{children}</MainLayoutWrapper>
            <CookieConsentBanner />
            <CookieSettingsModal />
          </CookieConsentProvider>
        </AppProvider>
        <ScrollToTop />
      </body>
    </html>
  );
}
