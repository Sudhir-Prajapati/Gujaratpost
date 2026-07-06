import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import Header from "@/components/layout/Header";
import BreakingTicker from "@/components/layout/BreakingTicker";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://gujaratpost.example.com"),
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
    <html lang="gu" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;500;600;700;800;900&family=Mukta+Vaani:wght@400;500;600;700;800&family=Noto+Sans+Gujarati:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <AppProvider>
          <Header />
          <BreakingTicker />
          <main>{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
