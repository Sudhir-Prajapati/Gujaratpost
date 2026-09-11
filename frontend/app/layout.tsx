import type { Metadata } from "next";
import "./globals.css";
import { Noto_Sans_Gujarati, Hind_Vadodara } from "next/font/google";
import { AppProvider } from "@/components/AppProvider";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://gujaratpost.example.com"),
  manifest: "/manifest.json",
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
    url: "/",
    siteName: "Gujarat Post",
    locale: "gu_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gujarat Post",
    description: "Latest Gujarati breaking news.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="gu" data-scroll-behavior="smooth" className={`${notoSansGujarati.variable} ${hindVadodara.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://www.youtube.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <AppProvider>
          <MainLayoutWrapper>{children}</MainLayoutWrapper>
        </AppProvider>
        <ScrollToTop />
      </body>
    </html>
  );
}
