import Link from 'next/link';
import { ArrowUpRight, BarChart3, Megaphone, Users } from 'lucide-react';

interface AdProps {
  position: 'header' | 'sidebar' | 'in-article' | 'footer' | 'banner';
  className?: string;
}

const adSizes: Record<AdProps['position'], { h: number; label: string }> = {
  header: { h: 90, label: '728 × 90' },
  sidebar: { h: 250, label: '300 × 250' },
  'in-article': { h: 250, label: 'In-article' },
  footer: { h: 90, label: '728 × 90' },
  banner: { h: 70, label: '468 × 60' },
};

export default function Advertisement({ position, className = '' }: AdProps) {
  const { h, label } = adSizes[position];
  const vertical = position === 'sidebar' || position === 'in-article';

  return (
    <aside
      aria-label="Advertisement"
      className={`group relative isolate overflow-hidden rounded-xl border border-slate-200 bg-[#0c1729] text-white shadow-sm ${className}`}
      style={{ minHeight: h }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(225,29,46,0.35),transparent_38%),linear-gradient(120deg,transparent,rgba(255,255,255,0.06))]" />
      <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[22px] border-white/[0.045]" />
      <div className="absolute bottom-1 right-2 text-[8px] font-bold uppercase tracking-widest text-white/28">Ad · {label}</div>

      <div className={`relative flex min-h-full w-full ${vertical ? 'flex-col items-start justify-center p-6' : 'items-center justify-between gap-4 px-5 py-3 sm:px-7'}`} style={{ minHeight: h }}>
        <div className={`flex min-w-0 ${vertical ? 'flex-col items-start' : 'items-center gap-4'}`}>
          <span className={`grid shrink-0 place-items-center rounded-xl bg-accent shadow-lg shadow-red-950/40 ${vertical ? 'mb-5 h-12 w-12' : 'h-10 w-10'}`}>
            <Megaphone className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-300">Grow with Gujarat Post</p>
            <h2 className={`${vertical ? 'mt-2 text-2xl' : 'mt-0.5 text-base sm:text-xl'} font-black leading-tight tracking-tight`}>
              Put your brand in front of Gujarat.
            </h2>
            {vertical && (
              <p className="mt-3 max-w-xs text-sm leading-5 text-white/55">Reach engaged readers across news, video, social and e-paper.</p>
            )}
          </div>
        </div>

        {vertical && (
          <div className="mt-5 flex items-center gap-5 border-y border-white/10 py-3 text-xs font-bold text-white/70">
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-red-400" /> 2M+ readers</span>
            <span className="inline-flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-red-400" /> High impact</span>
          </div>
        )}

        <Link
          href="/advertise"
          className={`${vertical ? 'mt-5' : ''} inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg`}
        >
          Advertise now <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
