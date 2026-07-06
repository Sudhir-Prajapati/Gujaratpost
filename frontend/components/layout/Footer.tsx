'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ArrowRight,
    Mail,
    MapPin,
    Radio,
    ChevronRight,
    Users,
    BookOpen,
} from 'lucide-react';
import { NAV_ITEMS } from '@/data';
import { SocialLinks } from '@/components/ui/SocialLinks';

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
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M3 5.27v13.46c0 .87.87 1.41 1.63.97l11.66-6.73c.75-.43.75-1.51 0-1.94L4.63 4.3C3.87 3.86 3 4.4 3 5.27z" />
            <path d="M17.47 11.23L4.76 3.89c-.38-.22-.84-.13-1.12.22l11.13 11.13 2.7-2.7c.39-.4.39-1.02 0-1.31z" />
        </svg>
    );
}

function YouTubeIcon({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837z" />
            <polygon points="9.545 15.568 15.818 12 9.545 8.432 9.545 15.568" fill="#040810" />
        </svg>
    );
}

/* ─── Link data ─────────────────────────────────────────────────────────── */
const companyLinks = [
    ['About Us', '/about'],
    ['Contact Us', '/contact'],
    ['Advertise', '/advertise'],
    ['Careers', '/careers'],
    ['Complaint', '/complaint-redressal'],
];

const informationLinks = [
    ['Privacy Policy', '/privacy-policy'],
    ['Terms & Conditions', '/terms'],
    ['Cookie Policy', '/cookie-policy'],
    ['Disclaimer', '/disclaimer'],
    ['Sitemap', '/sitemap.xml'],
];

const mediaLinks = [
    { label: 'Watch Never Ends', href: '/watch', isLive: true },
    { label: 'Latest Videos', href: '/videos' },
    { label: 'Shorts', href: '/shorts' },
    { label: 'Photo Stories', href: '/photos' },
    { label: 'E-Paper', href: '/epaper', isNew: true },
];

const stats = [
    { icon: Users,       value: '5.2M+',  label: 'Monthly Readers',  color: 'text-red-400',  bg: 'bg-red-500/10',  border: 'border-red-500/20'  },
    { icon: YouTubeIcon, value: '1.5M+',  label: 'Subscribers',      color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { icon: Mail,        value: '250K+',  label: 'Newsletter',        color: 'text-red-300',  bg: 'bg-red-400/10',  border: 'border-red-400/20'  },
    { icon: Radio,       value: '24 × 7', label: 'Live Updates',      color: 'text-red-500',  bg: 'bg-red-500/10',  border: 'border-red-500/20'  },
];

/* ─── FooterLink ────────────────────────────────────────────────────────── */
const FooterLink = ({
    href,
    children,
    isLive,
    isNew,
}: {
    href: string;
    children: React.ReactNode;
    isLive?: boolean;
    isNew?: boolean;
}) => (
    <Link
        href={href}
        className="group flex items-center justify-between text-[12px] font-medium text-white/50 transition-all duration-200 hover:text-red-400"
    >
        <div className="flex items-center gap-1 overflow-hidden">
            <ChevronRight className="h-3 w-3 text-red-500 opacity-0 -ml-3 transition-all duration-200 group-hover:opacity-100 group-hover:ml-0 shrink-0" />
            <span className="transition-transform duration-200 group-hover:translate-x-0.5 truncate">{children}</span>
        </div>
        {isLive && (
            <span className="ml-2 shrink-0 inline-flex items-center rounded-full bg-red-500/10 px-1.5 py-px text-[8px] font-black text-red-400 ring-1 ring-inset ring-red-500/25 animate-pulse">
                LIVE
            </span>
        )}
        {isNew && (
            <span className="ml-2 shrink-0 inline-flex items-center rounded-full bg-blue-500/10 px-1.5 py-px text-[8px] font-black text-blue-400 ring-1 ring-inset ring-blue-500/25">
                NEW
            </span>
        )}
    </Link>
);

/* ─── Column heading ────────────────────────────────────────────────────── */
const ColHead = ({ children }: { children: React.ReactNode }) => (
    <h3 className="mb-2.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-white/70">
        <span className="h-[5px] w-[5px] rounded-full bg-red-500 shrink-0" />
        {children}
    </h3>
);

/* ─── Footer ────────────────────────────────────────────────────────────── */
export default function Footer({ isInline = false }: { isInline?: boolean }) {
    const pathname = usePathname();

    if (pathname === '/login' || pathname.startsWith('/admin')) {
        return null;
    }

    // Hide global footer on feed pages — it's rendered inline there
    const isFeedPage = pathname === '/watch' || pathname === '/shorts';
    if (isFeedPage && !isInline) return null;

    const wrap = isInline ? 'pt-3 pb-2' : 'pt-5 pb-0';

    return (
        <footer className="relative overflow-hidden bg-gradient-to-b from-[#07101e] to-[#040810] text-white">
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

            {/* Subtle glow orbs */}
            <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-red-600/8 blur-[80px]" />
            <div className="pointer-events-none absolute bottom-0 left-1/4 h-48 w-96 rounded-full bg-red-600/5 blur-[60px]" />

            <div className={`relative mx-auto max-w-screen-xl px-4 ${wrap}`}>

                {/* ── ROW 1: Brand  +  Newsletter ── */}
                <div className="flex flex-col gap-4 border-b border-white/[0.07] pb-4 lg:flex-row lg:items-center lg:justify-between">

                    {/* Brand block */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Link href="/" className="group/logo flex items-center gap-2.5">
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-sm font-black shadow-lg ring-1 ring-red-500/30 transition-transform duration-300 group-hover/logo:scale-105">
                                GP
                            </span>
                            <span>
                                <span className="block text-base font-black tracking-tight text-white group-hover/logo:text-red-400 transition-colors duration-300">Gujarat Post</span>
                                <span className="block text-[9px] font-semibold text-white/40">ગુજરાતનું વિશ્વસનીય ન્યૂઝ નેટવર્ક</span>
                            </span>
                        </Link>
                        <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-white/10">
                            <p className="flex items-center gap-1.5 text-[11px] text-white/45">
                                <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                                Ahmedabad, Gujarat
                            </p>
                            <p className="flex items-center gap-1.5 text-[11px] text-white/45">
                                <Radio className="h-3 w-3 text-red-500 animate-pulse shrink-0" />
                                24 × 7 Newsroom
                            </p>
                        </div>
                    </div>

                    {/* Newsletter form */}
                    <form
                        className="flex w-full max-w-md items-center gap-2"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-red-400 shrink-0">
                            <Mail className="h-3 w-3 text-red-500" />
                            <span className="hidden sm:inline">Daily Brief</span>
                        </div>
                        <label className="sr-only" htmlFor="footer-email">Email address</label>
                        <input
                            id="footer-email"
                            type="email"
                            required
                            placeholder="Your email address"
                            className="h-8 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-red-500/60 focus:bg-white/[0.05] focus:ring-1 focus:ring-red-500/20"
                        />
                        <button
                            type="submit"
                            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-red-600 to-rose-500 px-3.5 text-[11px] font-black text-white shadow-md transition-all duration-200 hover:from-red-500 hover:to-rose-400 hover:-translate-y-px"
                        >
                            Subscribe <ArrowRight className="h-3 w-3" />
                        </button>
                    </form>
                </div>

                {/* ── ROW 2: Links grid ── */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 py-4 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">

                    {/* Col 1: Brand description + socials + app */}
                    <div className="col-span-2 sm:col-span-3 lg:col-span-1 flex flex-col gap-2.5">
                        <p className="text-[11px] leading-relaxed text-white/45">
                            Independent reporting &amp; breaking news from every corner of Gujarat—in Gujarati, Hindi &amp; English.
                        </p>
                        <SocialLinks size="sm" className="mt-0.5" />
                        {/* App buttons */}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            <a
                                href="https://apps.apple.com"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.015] px-2 py-1 text-white hover:border-red-500/30 hover:bg-red-500/[0.03] transition-all duration-200"
                            >
                                <AppleIcon className="h-3.5 w-3.5" />
                                <div className="leading-none">
                                    <span className="block text-[6.5px] text-white/40 uppercase tracking-wide">Download on</span>
                                    <span className="block text-[9px] font-bold mt-px">App Store</span>
                                </div>
                            </a>
                            <a
                                href="https://play.google.com"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.015] px-2 py-1 text-white hover:border-red-500/30 hover:bg-red-500/[0.03] transition-all duration-200"
                            >
                                <PlayStoreIcon className="h-3.5 w-3.5" />
                                <div className="leading-none">
                                    <span className="block text-[6.5px] text-white/40 uppercase tracking-wide">Get it on</span>
                                    <span className="block text-[9px] font-bold mt-px">Google Play</span>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Col 2: Explore */}
                    <div>
                        <ColHead>Explore</ColHead>
                        <ul className="space-y-1.5">
                            {NAV_ITEMS.slice(1, 9).map((item) => (
                                <li key={item.href}>
                                    <FooterLink href={item.href}>{item.label}</FooterLink>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Col 3: Watch & Read */}
                    <div>
                        <ColHead>Watch &amp; Read</ColHead>
                        <ul className="space-y-1.5 mb-2.5">
                            {mediaLinks.map((item) => (
                                <li key={item.href}>
                                    <FooterLink href={item.href} isLive={item.isLive} isNew={item.isNew}>
                                        {item.label}
                                    </FooterLink>
                                </li>
                            ))}
                        </ul>
                        <Link
                            href="/epaper"
                            className="inline-flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/[0.03] px-2 py-1 text-[9px] font-bold text-red-400 transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/8 hover:text-white"
                        >
                            <BookOpen className="h-3 w-3 text-red-500 shrink-0" /> E-Paper
                        </Link>
                    </div>

                    {/* Col 4: Company */}
                    <div>
                        <ColHead>Company</ColHead>
                        <ul className="space-y-1.5">
                            {companyLinks.map(([label, href]) => (
                                <li key={href}>
                                    <FooterLink href={href}>{label}</FooterLink>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Col 5: Information */}
                    <div>
                        <ColHead>Information</ColHead>
                        <ul className="space-y-1.5">
                            {informationLinks.map(([label, href]) => (
                                <li key={href}>
                                    <FooterLink href={href}>{label}</FooterLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ── ROW 3: Stats strip ── */}
                <div className="border-t border-white/[0.07] py-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {stats.map(({ icon: Icon, value, label, color, bg, border }) => (
                            <div
                                key={label}
                                className={`group flex items-center gap-2.5 rounded-lg border ${border} ${bg} px-3 py-2 transition-all duration-200 hover:brightness-125`}
                            >
                                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${bg} ${color} border ${border}`}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                    <span className="block text-sm font-black leading-none text-white">{value}</span>
                                    <span className="block text-[8px] font-bold uppercase tracking-wider text-white/35 mt-0.5">{label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* ── Copyright bar ── */}
            <div className="border-t border-white/[0.06] bg-black/20">
                <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[10px] text-white/35">
                    <p>© {new Date().getFullYear()} Gujarat Post Media. All rights reserved.</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {[['DNPA Code', '/dnpa-code'], ['CSR Policy', '/csr-policy'], ['Sitemap', '/sitemap.xml'], ['RSS', '/rss.xml']].map(([label, href]) => (
                            <Link key={href} href={href} className="transition duration-200 hover:text-red-400">{label}</Link>
                        ))}
                    </div>
                    <p className="font-semibold text-white/20 tracking-wider">RNI/GJ-DEMO/2026</p>
                </div>
            </div>
        </footer>
    );
}
