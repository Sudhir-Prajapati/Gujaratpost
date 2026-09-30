import Link from 'next/link';
import { Language } from '@/types';

interface SectionHeaderProps {
  title: string;
  titleGu?: string;
  titleHi?: string;
  href?: string;
  language?: Language;
}

export default function SectionHeader({ title, titleGu, titleHi, href, language = 'gu' }: SectionHeaderProps) {
  const rawTitle = language === 'en' ? title : language === 'hi' ? titleHi || title : titleGu || title;
  const displayTitle = rawTitle.replace(/\s+/g, '   ');

  return (
    <div className="mb-0.5 flex items-center justify-between gap-2.5">
      <h2 className="section-heading text-xl font-black tracking-normal text-foreground md:text-2xl">
        {displayTitle}
        {language !== 'en' && <span className="ml-2 text-[12px] md:text-[13px] font-bold text-muted-foreground">{title.replace(/\s+/g, '   ')}</span>}
      </h2>
      {href && (
        <Link href={href} className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-[13px] md:text-[14px] font-black text-white transition hover:bg-red-700">
          View All
        </Link>
      )}
    </div>
  );
}
