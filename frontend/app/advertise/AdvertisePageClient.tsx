'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { SocialLinks } from '@/components/ui/SocialLinks';

interface AppLinks {
  playStore?: string;
  appStore?: string;
}

interface AdvertisePageData {
  pageTitle?: string;
  description?: string;
  officeAddress?: string;
  locationUrl?: string;
  contactPhone?: string;
  onlineAdsEmail?: string;
  printAdsEmail?: string;
  websiteUrl?: string;
  socialLinksJson?: any;
  appLinksJson?: AppLinks;
}

interface Props {
  initialData?: AdvertisePageData | null;
}

/* ─── App Store Badges ──────────────────────────────────────────────────── */
function PlayStoreBadge({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-black hover:bg-neutral-900 border border-neutral-700/80 text-white shadow-sm transition hover:scale-105 active:scale-95 group"
    >
      <svg viewBox="0 0 466 511.98" className="h-6 w-6">
        <path fill="#EA4335" d="M199.9 237.8 1.4 470.17c7.22 24.57 30.16 41.81 55.8 41.81 11.16 0 20.93-2.79 29.3-8.37l244.16-139.46L199.9 237.8z" />
        <path fill="#FBBC04" d="m433.91 205.1-104.65-60-111.61 110.22 113.01 108.83 104.64-58.6c18.14-9.77 30.7-29.3 30.7-50.23-1.4-20.93-13.95-40.46-32.09-50.22z" />
        <path fill="#34A853" d="M199.42 273.45 329.27 145.1 87.9 8.37C79.53 2.79 68.36 0 57.2 0 30.7 0 6.98 18.14 1.4 41.86l198.02 231.59z" />
        <path fill="#4285F4" d="M1.39 41.86C0 46.04 0 51.63 0 57.2v397.64c0 5.57 0 9.76 1.4 15.34l216.27-214.86L1.39 41.86z" />
      </svg>
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">GET IT ON</span>
        <span className="text-sm font-black text-white font-sans">Google Play</span>
      </div>
    </a>
  );
}

function AppStoreBadge({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-black hover:bg-neutral-900 border border-neutral-700/80 text-white shadow-sm transition hover:scale-105 active:scale-95 group"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.72-1.18 1.86-1.03 2.97 1.12.09 2.27-.6 2.98-1.41z" />
      </svg>
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Download on the</span>
        <span className="text-sm font-black text-white font-sans">App Store</span>
      </div>
    </a>
  );
}

export default function AdvertisePageClient({ initialData }: Props) {
  const data = initialData || {};

  const pageTitle = data.pageTitle || 'Advertise With Us';
  const description =
    data.description ||
    'Gujarat Post is one of the premier digital media networks in Gujarat, delivering sharp, authentic, and credible journalism catering to millions of Gujarati readers across the globe. Started with a mission to bring truth and unbiased news, Gujarat Post has made a special place in the hearts of Gujarati-speaking readers. We are committed to empowering citizens by providing verified news, investigative reporting, analytical editorials, and hyperlocal updates across all 33 districts of Gujarat. We have established a commanding digital presence across Web, E-Paper, Video, and Social Platforms.';

  const officeAddress =
    data.officeAddress ||
    'Gujarat Post Bhavan, S.G. Highway, Prahlad Nagar, Vastrapur, Ahmedabad, Gujarat 380015';

  const locationUrl =
    data.locationUrl || 'https://maps.google.com/?q=Gujarat+Post+Bhavan+Ahmedabad';

  const contactPhone = data.contactPhone || '079 4000 4000 / +91 99099 07237';
  const onlineAdsEmail = data.onlineAdsEmail || 'digital.advertising@gujaratpost.in';
  const printAdsEmail = data.printAdsEmail || 'advt@gujaratpost.in & epaper@gujaratpost.in';
  const websiteUrl = data.websiteUrl || 'https://gujaratpost.in/';



  const appLinks: AppLinks = {
    playStore: 'https://play.google.com/store/apps/details?id=com.gujaratpost.app',
    appStore: 'https://apps.apple.com',
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <Link href="/" className="hover:text-red-600 transition">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-900 dark:text-white font-semibold">Advertise With Us</span>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-7">
        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {pageTitle}
          </h1>
          <div className="mt-2.5 h-1 w-16 bg-red-600 rounded-full" />
        </div>

        {/* Intro Paragraph */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-normal text-justify sm:text-left">
            {description}
          </p>
        </div>

        {/* Info List Section */}
        <div className="space-y-6 pt-2 border-t border-gray-100 dark:border-gray-800/80">
          {/* Address */}
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>Address:</span>
            </h2>
            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {officeAddress}
            </div>
            {locationUrl && (
              <div className="pt-0.5">
                <a
                  href={locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-red-600 hover:text-red-700 underline decoration-red-400 underline-offset-2 transition"
                >
                  <span>Location</span>
                  <ExternalLink className="w-3 h-3 text-red-600" />
                </a>
              </div>
            )}
          </div>

          {/* Contact no */}
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Contact no:
            </h2>
            <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
              {contactPhone}
            </div>
          </div>

          {/* Online Advertising */}
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Online Advertising:
            </h2>
            <div className="text-xs sm:text-sm font-medium">
              <a
                href={`mailto:${onlineAdsEmail.split('&')[0]?.trim() || onlineAdsEmail}`}
                className="text-red-600 hover:text-red-700 hover:underline break-all"
              >
                {onlineAdsEmail}
              </a>
            </div>
          </div>

          {/* Print Advertising */}
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Print Advertising:
            </h2>
            <div className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 break-all">
              {printAdsEmail}
            </div>
          </div>

          {/* Website */}
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Website:
            </h2>
            <div className="text-xs sm:text-sm font-medium">
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-700 hover:underline break-all"
              >
                {websiteUrl}
              </a>
            </div>
          </div>

          {/* Follow us */}
          <div className="space-y-2.5 pt-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Follow us:
            </h2>
            <SocialLinks size="md" />
          </div>

          {/* Download App from */}
          <div className="space-y-2.5 pt-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Download App from:
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              {appLinks.playStore && (
                <PlayStoreBadge url={appLinks.playStore} />
              )}
              {appLinks.appStore && (
                <AppStoreBadge url={appLinks.appStore} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
