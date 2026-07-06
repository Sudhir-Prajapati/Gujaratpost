import { MessageCircle, Newspaper, Send } from 'lucide-react';

export const SOCIAL_LINKS = [
  { label: 'Facebook', platform: 'facebook', href: '#', hover: 'hover:bg-[#1877f2]' },
  { label: 'Instagram', platform: 'instagram', href: '#', hover: 'hover:bg-gradient-to-br hover:from-[#833ab4] hover:via-[#fd1d1d] hover:to-[#fcb045]' },
  { label: 'YouTube', platform: 'youtube', href: 'https://www.youtube.com/@Gujaratpostnews', hover: 'hover:bg-[#ff0000]' },
  { label: 'Telegram', platform: 'telegram', href: '#', hover: 'hover:bg-[#229ed9]' },
  { label: 'WhatsApp', platform: 'whatsapp', href: '#', hover: 'hover:bg-[#25d366]' },
  { label: 'X', platform: 'x', href: '#', hover: 'hover:bg-black' },
  { label: 'Google News', platform: 'news', href: '#', hover: 'hover:bg-[#4285f4]' },
] as const;

export type SocialPlatform = (typeof SOCIAL_LINKS)[number]['platform'];

export function SocialIcon({ platform, className = 'h-4 w-4' }: { platform: SocialPlatform; className?: string }) {
  if (platform === 'telegram') return <Send className={className} fill="currentColor" strokeWidth={1.5} />;
  if (platform === 'whatsapp') return <MessageCircle className={className} fill="currentColor" strokeWidth={1.5} />;
  if (platform === 'news') return <Newspaper className={className} strokeWidth={2} />;
  if (platform === 'facebook') return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path fill="currentColor" d="M14.2 8.2V6.8c0-.7.5-.9.9-.9h2.2V2.1L14.2 2c-3.5 0-4.3 2.1-4.3 4.1v2.1H7.8v4.2h2.1V22h4.3v-9.6h2.9l.5-4.2h-3.4Z" /></svg>;
  if (platform === 'instagram') return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.4" cy="6.7" r="1.2" fill="currentColor" /></svg>;
  if (platform === 'youtube') return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path fill="currentColor" d="M22.5 7.1a2.8 2.8 0 0 0-2-2C18.7 4.6 12 4.6 12 4.6s-6.7 0-8.5.5a2.8 2.8 0 0 0-2 2A29.5 29.5 0 0 0 1 12a29.5 29.5 0 0 0 .5 4.9 2.8 2.8 0 0 0 2 2c1.8.5 8.5.5 8.5.5s6.7 0 8.5-.5a2.8 2.8 0 0 0 2-2A29.5 29.5 0 0 0 23 12a29.5 29.5 0 0 0-.5-4.9Z" /><path fill="#111827" d="m9.8 15.2 5.6-3.2-5.6-3.2v6.4Z" /></svg>;
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path fill="currentColor" d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.8-6.3L6.7 22H3.5l7.2-8.3L3 2h6.3l4.4 5.8L18.9 2Zm-1.1 17.9h1.7L8.4 4H6.6l11.2 15.9Z" /></svg>;
}

export function SocialLinks({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dimensions = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {SOCIAL_LINKS.map((item) => (
        <a key={item.label} href={item.href} target={item.platform === 'youtube' ? '_blank' : undefined} rel={item.platform === 'youtube' ? 'noreferrer' : undefined} aria-label={item.label} title={item.label} className={`group inline-flex ${dimensions} items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-transparent hover:text-white hover:shadow-lg ${item.hover}`}>
          <SocialIcon platform={item.platform} className={`${iconSize} transition-transform duration-200 group-hover:scale-110`} />
        </a>
      ))}
    </div>
  );
}
