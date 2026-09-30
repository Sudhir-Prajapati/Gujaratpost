import { Newspaper } from 'lucide-react';

export const SOCIAL_LINKS = [
  { label: 'Facebook', platform: 'facebook', href: 'https://www.facebook.com/gujaratpostnews', hover: 'hover:bg-[#1877f2]', hoverBg: '#1877f2' },
  { label: 'Instagram', platform: 'instagram', href: 'https://www.instagram.com/gujaratpost.in/', hover: 'hover:bg-gradient-to-br hover:from-[#833ab4] hover:via-[#fd1d1d] hover:to-[#fcb045]', hoverBg: '#c13584' },
  { label: 'YouTube', platform: 'youtube', href: 'https://www.youtube.com/@Gujaratpostnews', hover: 'hover:bg-[#ff0000]', hoverBg: '#ff0000' },
  { label: 'WhatsApp', platform: 'whatsapp', href: 'https://whatsapp.com/channel/0029Va9y6Xn9RZAY5m4f8V1a', hover: 'hover:bg-[#25d366]', hoverBg: '#25d366' },
  { label: 'X', platform: 'x', href: 'https://x.com/gujaratpostnews', hover: 'hover:bg-black', hoverBg: '#000000' },
  { label: 'Google News', platform: 'news', href: 'https://news.google.com/publications/CAAqBwgKMMT_nwsw5-axAw', hover: 'hover:bg-[#4285f4]', hoverBg: '#4285f4' },
] as const;

export type SocialPlatform = (typeof SOCIAL_LINKS)[number]['platform'];

export function SocialIcon({ platform, className = 'h-4 w-4' }: { platform: SocialPlatform; className?: string }) {

  if (platform === 'whatsapp') return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12.004 2.003A9.998 9.998 0 0 0 2 12.001c0 1.762.46 3.418 1.268 4.858L2.05 21.78a.5.5 0 0 0 .607.632l5.09-1.336A9.953 9.953 0 0 0 12.004 22c5.522 0 9.998-4.477 9.998-9.999S17.526 2.003 12.004 2.003zm0 18.001a8.299 8.299 0 0 1-4.232-1.156l-.303-.18-3.024.793.808-2.955-.198-.32A8.3 8.3 0 0 1 3.7 12.001c0-4.584 3.73-8.31 8.304-8.31 4.576 0 8.305 3.726 8.305 8.31 0 4.583-3.73 8.303-8.305 8.303z"/>
    </svg>
  );
  if (platform === 'news') return <Newspaper className={className} strokeWidth={2} />;
  if (platform === 'facebook') return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path fill="currentColor" d="M14.2 8.2V6.8c0-.7.5-.9.9-.9h2.2V2.1L14.2 2c-3.5 0-4.3 2.1-4.3 4.1v2.1H7.8v4.2h2.1V22h4.3v-9.6h2.9l.5-4.2h-3.4Z" /></svg>;
  if (platform === 'instagram') return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.4" cy="6.7" r="1.2" fill="currentColor" /></svg>;
  if (platform === 'youtube') return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M21.58 7.19a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.68.49a2.7 2.7 0 0 0-1.9 1.9A28.4 28.4 0 0 0 2 12a28.4 28.4 0 0 0 .42 4.81 2.7 2.7 0 0 0 1.9 1.9c1.68.49 7.68.49 7.68.49s6 0 7.68-.49a2.7 2.7 0 0 0 1.9-1.9A28.4 28.4 0 0 0 22 12a28.4 28.4 0 0 0-.42-4.81ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  );
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path fill="currentColor" d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.8-6.3L6.7 22H3.5l7.2-8.3L3 2h6.3l4.4 5.8L18.9 2Zm-1.1 17.9h1.7L8.4 4H6.6l11.2 15.9Z" /></svg>;
}

export function SocialLinks({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dimensions = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {SOCIAL_LINKS.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          title={item.label}
          className={`group inline-flex ${dimensions} items-center justify-center rounded-full border border-current/15 bg-current/8 text-current shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-transparent hover:text-white hover:shadow-lg ${item.hover}`}
        >
          <SocialIcon platform={item.platform} className={`${iconSize} transition-transform duration-200 group-hover:scale-110`} />
        </a>
      ))}
    </div>
  );
}
