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
  const displayTitle = language === 'en' ? title : language === 'hi' ? titleHi || title : titleGu || title;

  return (
    <div className="mb-0.5 flex items-center justify-between gap-2.5">
      <h2 className="section-heading text-xl font-black tracking-normal text-foreground md:text-2xl">
        {displayTitle}
        {language !== 'en' && <span className="ml-1 text-[12px] md:text-[13px] font-bold text-muted-foreground">{title}</span>}
      </h2>
      {href && (
        <Link href={href} className="shrink-0 rounded-full bg-accent px-2 py-1 text-[11px] font-black text-white transition hover:bg-red-700">
          View All
        </Link>
      )}
    </div>
  );
}
