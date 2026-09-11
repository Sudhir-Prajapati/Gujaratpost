'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useIsApk } from '@/lib/useIsApk';

export default function ScrollToTop() {
  const pathname = usePathname();
  const { isApk } = useIsApk();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => {
      const isSplashActive = document.body.classList.contains('splash-active');
      setVisible(!isSplashActive && window.scrollY > 400);
    };
    // Check immediately in case user reloads while scrolled
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!mounted || pathname?.startsWith('/admin')) return null;

  const bottomPos = isApk ? '72px' : '32px';
  const rightPos = isApk ? '16px' : '32px';
  const size = isApk ? '40px' : '50px';

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="ઉપર જાઓ"
      style={{
        position: 'fixed',
        bottom: bottomPos,
        right: rightPos,
        zIndex: isApk ? 45 : 9990,
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#e11d2e',
        color: '#ffffff',
        border: '2px solid rgba(255,255,255,0.3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(225,29,46,0.45), 0 2px 6px rgba(0,0,0,0.25)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.8)',
        transition: 'opacity 0.3s ease, transform 0.3s ease, bottom 0.2s ease',
        outline: 'none',
      }}
    >
      {/* Chevron Up arrow */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={isApk ? 18 : 24}
        height={isApk ? 18 : 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}
