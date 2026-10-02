'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Heart } from 'lucide-react';
import { SOCIAL_LINKS, SocialIcon } from '@/components/ui/SocialLinks';
import AdSectionBanner from '@/components/ads/AdSectionBanner';
import RandomAdsSection from '@/components/ads/RandomAdsSection';
import { useApp } from '@/components/AppProvider';

/* ─── Social Icon Button with brand hover color ─────────────────────────── */
const INSTAGRAM_GRADIENT = 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';

function SocialIconButton({ item }: { item: typeof SOCIAL_LINKS[number] }) {
    const [hovered, setHovered] = useState(false);

    const hoverStyle = hovered
        ? item.platform === 'instagram'
            ? { background: INSTAGRAM_GRADIENT, borderColor: 'transparent' }
            : { backgroundColor: item.hoverBg, borderColor: item.hoverBg }
        : {};

    return (
        <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            title={item.label}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={hoverStyle}
            className="h-9 w-9 rounded-full border border-white/20 bg-white/10 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md cursor-pointer"
        >
            <SocialIcon platform={item.platform} className="h-4 w-4" />
        </a>
    );
}

/* ─── Inline SVG icons ──────────────────────────────────────────────────── */
function AppleIcon({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.72-1.18 1.86-1.03 2.97 1.12.09 2.27-.6 2.98-1.41z" />
        </svg>
    );
}

function PlayStoreIcon({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg viewBox="0 0 466 511.98" className={className}>
            <path fill="#EA4335" d="M199.9 237.8 1.4 470.17c7.22 24.57 30.16 41.81 55.8 41.81 11.16 0 20.93-2.79 29.3-8.37l244.16-139.46L199.9 237.8z" />
            <path fill="#FBBC04" d="m433.91 205.1-104.65-60-111.61 110.22 113.01 108.83 104.64-58.6c18.14-9.77 30.7-29.3 30.7-50.23-1.4-20.93-13.95-40.46-32.09-50.22z" />
            <path fill="#34A853" d="M199.42 273.45 329.27 145.1 87.9 8.37C79.53 2.79 68.36 0 57.2 0 30.7 0 6.98 18.14 1.4 41.86l198.02 231.59z" />
            <path fill="#4285F4" d="M1.39 41.86C0 46.04 0 51.63 0 57.2v397.64c0 5.57 0 9.76 1.4 15.34l216.27-214.86L1.39 41.86z" />
        </svg>
    );
}

/* ─── Links data ─────────────────────────────────────────────────────────── */
const topics1Links = [
    { label: 'Videos', href: '/videos' },
    { label: 'Gujarat', href: '/category/gujarat' },
    { label: 'Ahmedabad', href: '/category/ahmedabad' },
    { label: 'Gandhinagar', href: '/category/gandhinagar' },
    { label: 'Surat', href: '/category/surat' },
    { label: 'Vadodara', href: '/category/vadodara' },
    { label: 'Rajkot', href: '/category/rajkot' },
    { label: 'Other Cities', href: '/category/gujarat' },
    { label: 'Gujarat Election 2027', href: '/category/election-2027' },
];

const topics2Links = [
    { label: 'About Us', href: '/about' },
    { label: 'Entertainment', href: '/category/entertainment' },
    { label: 'Technology', href: '/category/technology' },
    { label: 'Photo Gallery', href: '/photos' },
    { label: 'Instagram', href: '/category/instagram' },
    { label: 'Web Stories', href: '/category/webstory' },
    { label: 'Weather', href: '/category/weather' },
    { label: 'Gold-Silver', href: '/category/gold-silver' },
    { label: 'News Brief', href: '/category/news-brief' }
];

const topics3Links = [
    { label: 'India', href: '/category/national' },
    { label: 'World', href: '/category/world' },
    { label: 'Politics', href: '/category/politics' },
    { label: 'Crime', href: '/category/crime' },
    { label: 'Fact Check', href: '/category/fact-check' },
    { label: 'Trending News', href: '/category/trending' },
    { label: 'Podcast', href: '/videos?tab=podcast' },
    { label: 'E-Paper', href: '/epaper' },
];

const companyLinks = [
    { label: 'Health', href: '/category/health' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Advertise With Us', href: '/advertise' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms Of Use', href: '/terms' },
    { label: 'Disclaimer', href: '/disclaimer' },
    { label: 'Site Map', href: '/sitemap' },
    { label: 'RSS Terms of Service', href: '/rss-terms-of-service' },
    { label: 'Feedback', href: '/feedback' },
];

/* ─── NavColumn Component ─────────────────────────────────────────────────── */
function NavColumn({
    title,
    links,
    titleHref,
    onSupportClick,
    delay = 0,
}: {
    title: string;
    links: { label: string; href: string; isSupport?: boolean }[];
    titleHref?: string;
    onSupportClick?: () => void;
    delay?: number;
}) {
    return (
        <div className="group/col">
            <div className="mb-3.5 select-none">
                {titleHref ? (
                    <Link href={titleHref} className="inline-flex flex-col items-start cursor-pointer group/title">
                        <div className="flex items-center gap-1.5 transition-transform duration-300 group-hover/col:-translate-y-0.5">
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_6px_#ef4444]" />
                            </span>
                            <span
                                className="font-black text-[17px] leading-tight uppercase tracking-tight transition-all duration-300 footer-title-shimmer"
                                style={{ animationDelay: `${delay}s` }}
                            >
                                {title}
                            </span>
                        </div>
                        {/* Animated accent underline */}
                        <div className="relative mt-2 h-[2.5px] w-7 bg-slate-800 rounded-full overflow-hidden transition-all duration-300 group-hover/col:w-16 shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 rounded-full animate-pulse" />
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent w-full footer-bar-sweep"
                                style={{ animationDelay: `${delay}s` }}
                            />
                        </div>
                    </Link>
                ) : (
                    <div className="inline-flex flex-col items-start cursor-default group/title">
                        <div className="flex items-center gap-1.5 transition-transform duration-300 group-hover/col:-translate-y-0.5">
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_6px_#ef4444]" />
                            </span>
                            <h3
                                className="font-black text-[17px] leading-tight uppercase tracking-tight transition-all duration-300 footer-title-shimmer"
                                style={{ animationDelay: `${delay}s` }}
                            >
                                {title}
                            </h3>
                        </div>
                        {/* Animated accent underline */}
                        <div className="relative mt-2 h-[2.5px] w-7 bg-slate-800 rounded-full overflow-hidden transition-all duration-300 group-hover/col:w-16 shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 rounded-full animate-pulse" />
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent w-full footer-bar-sweep"
                                style={{ animationDelay: `${delay}s` }}
                            />
                        </div>
                    </div>
                )}
            </div>
            <ul className="space-y-2">
                {links.map((item) => (
                    <li key={item.label} className="overflow-hidden">
                        {item.isSupport ? (
                            <button
                                type="button"
                                onClick={onSupportClick}
                                className="group text-[15px] font-black text-rose-400 hover:text-rose-300 transition-all duration-200 flex items-center gap-1.5 leading-snug cursor-pointer hover:translate-x-1.5 hover:scale-[1.06] origin-left"
                            >
                                <Heart className="h-3.5 w-3.5 fill-current group-hover:scale-110 transition-transform duration-200" />
                                <span>{item.label}</span>
                            </button>
                        ) : (
                            <Link
                                href={item.href}
                                className="group text-[15px] font-semibold text-slate-300 hover:text-white transition-all duration-200 block leading-snug hover:translate-x-1.5 hover:scale-[1.06] origin-left relative pl-0 hover:pl-2"
                            >
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0 group-hover:w-1 h-3.5 bg-red-500 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100" />
                                {item.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* ─── Footer Component ─────────────────────────────────────────────────── */
export default function Footer({ isInline = false }: { isInline?: boolean }) {
    const { language, openSupportModal } = useApp();
    const pathname = usePathname();

    if (pathname === '/login' || pathname.startsWith('/admin')) {
        return null;
    }

    // Hide global footer on feed pages — it's rendered inline there
    const isFeedPage = pathname === '/watch' || pathname === '/shorts';
    if (isFeedPage && !isInline) return null;

    const wrap = isInline ? 'pt-2 pb-1.5' : 'pt-4 pb-3';

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
@keyframes footerTitleShimmer {
  0% { background-position: -200% 0; }
  50%, 100% { background-position: 200% 0; }
}
@keyframes footerBarSweep {
  0% { transform: translateX(-100%); }
  50%, 100% { transform: translateX(100%); }
}
.footer-title-shimmer {
  background: linear-gradient(
    90deg,
    #ffffff 0%,
    #ffffff 30%,
    #ef4444 48%,
    #fca5a5 52%,
    #ffffff 70%,
    #ffffff 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: footerTitleShimmer 4s ease-in-out infinite;
  display: inline-block;
}
.footer-bar-sweep {
  animation: footerBarSweep 4s ease-in-out infinite;
}
            ` }} />
            {!isInline && (
                <div className="w-full bg-background text-foreground overflow-hidden">
                    <AdSectionBanner section="FOOTER" />
                    <RandomAdsSection />
                </div>
            )}
            <footer
                data-theme="dark"
                className="bg-[#050B14] text-white border-t border-slate-900 select-none w-full relative"
            >
            <div className={`w-full px-4 sm:px-6 md:px-8 lg:px-10 ${wrap}`}>

                {/* ── Main Layout: Logo left, Nav columns pushed right ── */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-0 pb-4 border-b border-slate-800/80">

                    {/* Logo & Brand */}
                    <div className="flex flex-col items-start gap-1 lg:w-72 flex-shrink-0 select-none">
                        {/* Slogan */}
                        <div className="flex flex-col justify-center leading-tight pl-1 sm:pl-1.5 md:pl-2">
                            <p
                                className="text-[12px] sm:text-[14px] md:text-[15px] font-black font-sans tracking-wide text-white whitespace-nowrap select-none"
                                style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                                translate="no"
                            >
                                Real Stories. <span className="text-red-600">Real Gujarat.</span>
                            </p>
                        </div>

                        {/* Unified Logo & Support Button Container - Exact Same Width & Matching Ends */}
                        <div className="w-[220px] sm:w-[245px] lg:w-[260px] flex flex-col items-start">
                            {/* Logo */}
                            <Link href="/" className="group block w-full transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]">
                                <Image
                                    src="/assets/gujarat-post-logo-cms.png"
                                    alt="Gujarat Post"
                                    width={940}
                                    height={208}
                                    priority
                                    unoptimized
                                    style={{ width: '100%', height: 'auto', display: 'block' }}
                                    className="w-full h-auto object-contain block drop-shadow-sm"
                                />
                            </Link>

                            {/* Support Us Button in Footer */}
                            <button
                                type="button"
                                onClick={openSupportModal}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-3 py-2.5 sm:py-3 text-white shadow-lg shadow-red-900/40 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer border border-red-400/40 select-none"
                            >
                                <Heart className="h-4.5 w-4.5 sm:h-5 sm:w-5 fill-current animate-pulse text-white shrink-0" />
                                <span className="text-[13.5px] sm:text-[15px] font-extrabold tracking-wide whitespace-nowrap drop-shadow-sm">
                                    {language === 'gu' ? 'ગુજરાત પોસ્ટને સપોર્ટ કરો' : language === 'hi' ? 'गुजरात पोस्ट को सपोर्ट करें' : 'Support Gujarat Post'}
                                </span>
                            </button>
                            {/* Social Icons — same width as button, spread end to end */}
                            <div className="flex items-center justify-between w-full mt-3">
                                {SOCIAL_LINKS.map((item) => (
                                    <SocialIconButton key={item.label} item={item} />
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Nav columns — pushed to the right */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 lg:pl-10">

                        {/* Topics Col 1 */}
                        <NavColumn title="Topics" links={topics1Links} delay={0} />

                        {/* Topics Col 2 */}
                        <NavColumn title="Topics" links={topics2Links} delay={0.7} />

                        {/* Topics Col 3 */}
                        <NavColumn title="Topics" links={topics3Links} delay={1.4} />

                        {/* Company Col 4 */}
                        <NavColumn title="Company" links={companyLinks} onSupportClick={openSupportModal} delay={2.1} />

                    </div>

                </div>

                {/* ── Middle Row: Socials & App Store Downloads ── */}
                {/* <div className="pt-6 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-800/80">

                    

                </div> */}

                {/* ── Bottom Bar: Legal Policies & Copyright ── */}
                <div className="pt-3 border-t border-slate-900/60 mt-3 grid grid-cols-1 md:grid-cols-3 items-center gap-3 text-[11px] font-extrabold text-slate-400">

                    {/* Left Column: empty spacer on desktop to keep middle centered */}
                    <div className="hidden md:block" />

                    {/* Center Column: Legal links & Copyright */}
                    <div className="flex flex-col items-center justify-center gap-2.5 text-center">
                        {/* Policy Links Row */}
                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
                            {[
                                ['Complaign Redressal', '/complaign-redressal'],
                                ['Your Privacy Choices', '/privacy-choices'],
                                ["Children's Privacy Policy", '/children-privacy'],
                                ['Cookie Settings', '/cookie-settings'],
                                ['DNPA Code Of Ethics', '/dnpa-code-of-ethics'],
                            ].map(([label, href]) => (
                                <Link key={href} href={href} className="hover:text-white transition-colors duration-200">
                                    {label}
                                </Link>
                            ))}
                        </div>

                        {/* Copyright Line */}
                        <div className="flex flex-col items-center justify-center gap-1 text-slate-500 font-extrabold text-[10.5px] mt-0.5">
                            <p>External links are provided for reference purposes. © {new Date().getFullYear()} GUJARAT POST MEDIA. ALL RIGHTS RESERVED.</p>
                            <p className="tracking-wider text-slate-400 font-black">RNI/GJ-DEMO/2026</p>
                        </div>
                    </div>

                    {/* Right Column: Badges (aligned to the right on desktop, centered on mobile) */}
                    <div className="flex items-center justify-center md:justify-end gap-3 select-none">
                        {/* App Store Badge */}
                        <a
                            href="https://apps.apple.com"
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-white hover:border-zinc-500 hover:bg-zinc-800 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md select-none cursor-pointer"
                        >
                            <AppleIcon className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-110" />
                            <div className="leading-tight text-left" translate="no">
                                <span className="block text-[9px] text-zinc-400 font-extrabold uppercase tracking-tight">Download on the</span>
                                <span className="block text-[14px] font-black text-white tracking-tight">App Store</span>
                            </div>
                        </a>

                        {/* Google Play Badge */}
                        <a
                            href="https://play.google.com"
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-white hover:border-zinc-500 hover:bg-zinc-800 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md select-none cursor-pointer"
                        >
                            <PlayStoreIcon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                            <div className="leading-tight text-left" translate="no">
                                <span className="block text-[9px] text-zinc-400 font-extrabold uppercase tracking-tight">Get it on</span>
                                <span className="block text-[14px] font-black text-white tracking-tight">Google Play</span>
                            </div>
                        </a>
                    </div>
                </div>

            </div>
        </footer>
    </>
    );
}
