'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

import { useApp } from '@/components/AppProvider';

export default function SplashLoader() {
  const { language } = useApp();
  const [visible, setVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Check if splash loader has already been shown in this browser session
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem('gp_splash_shown') === 'true') {
        setShouldRender(false);
        return;
      }
    } catch { }

    // Lock both html and body scrolling so no vertical scrollbar or scrolling occurs during loader
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    let minTimePassed = false;
    let dataReady = typeof window !== 'undefined' && (window as any).__gpDataReady === true;

    const finishLoading = () => {
      setVisible(false);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('gp_splash_shown', 'true');
        }
      } catch { }
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      setTimeout(() => {
        setShouldRender(false);
      }, 500);
    };

    // Show 3D Microphone Loader for minimum 1.6s for smooth aesthetic UX
    const minTimer = setTimeout(() => {
      minTimePassed = true;
      if (dataReady) {
        finishLoading();
      }
    }, 1600);

    // Safety fallback so loader never hangs if network is offline
    const maxTimer = setTimeout(() => {
      finishLoading();
    }, 3500);

    const handleDataReady = () => {
      dataReady = true;
      if (minTimePassed) {
        finishLoading();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('gp-data-ready', handleDataReady);
    }

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('gp-data-ready', handleDataReady);
      }
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[#040810] transition-opacity duration-500 ease-in-out select-none overflow-hidden h-screen w-screen ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <style>{`
        .perspective-container {
          perspective: 1400px;
          perspective-origin: 50% 45%;
        }

        @keyframes mic-spin-3d {
          0% {
            transform: translateY(0px) rotateY(0deg) rotateX(6deg);
          }
          25% {
            transform: translateY(-12px) rotateY(90deg) rotateX(-2deg);
          }
          50% {
            transform: translateY(-20px) rotateY(180deg) rotateX(6deg);
          }
          75% {
            transform: translateY(-12px) rotateY(270deg) rotateX(-2deg);
          }
          100% {
            transform: translateY(0px) rotateY(360deg) rotateX(6deg);
          }
        }

        @keyframes floor-shadow {
          0%, 100% { transform: scale(1); opacity: 0.75; }
          50%       { transform: scale(0.72); opacity: 0.35; }
        }

        @keyframes ripple {
          0%   { transform: scale(0.8); opacity: 0.9; }
          100% { transform: scale(1.45); opacity: 0; }
        }

        @keyframes glow {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.95; }
        }

        @keyframes sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes rotate-orbit {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .animate-mic-3d {
          animation: mic-spin-3d 5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          transform-style: preserve-3d;
          will-change: transform;
        }

        .cube-flag {
          transform-style: preserve-3d;
          will-change: transform;
        }

        .animate-floor-shadow {
          animation: floor-shadow 5s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          will-change: transform, opacity;
        }

        .animate-pulse-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .animate-ripple-1 {
          animation: ripple 2.4s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
          transform-origin: center;
        }

        .animate-ripple-2 {
          animation: ripple 2.4s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
          animation-delay: 1.2s;
          transform-origin: center;
        }

        .animate-sweep {
          animation: sweep 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .animate-rotate-orbit {
          animation: rotate-orbit 12s linear infinite;
        }
      `}</style>

      {/* 3D Perspective Animation Container */}
      <div className="perspective-container relative mb-8 flex items-center justify-center h-84 w-84">
        {/* Ambient Red Glow Halo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 rounded-full bg-[#e62117]/35 blur-3xl animate-pulse-glow" />
          <div className="absolute w-72 h-72 rounded-full border border-[#e62117]/40 animate-ripple-1" />
          <div className="absolute w-84 h-84 rounded-full border border-[#e62117]/25 animate-ripple-2" />
        </div>

        {/* Orbiting Laser Ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-rotate-orbit">
          <div className="w-76 h-28 rounded-[100%] border-2 border-dashed border-[#e62117] shadow-[0_0_20px_#e62117] opacity-85" />
        </div>

        {/* Dynamic Floor Shadow below Mic Handle */}
        <div className="absolute bottom-2 w-32 h-6 rounded-full bg-black/90 blur-md animate-floor-shadow" />

        {/* 3D ROTATING NEWS MICROPHONE (ULTRA-REALISTIC 3D STYLING) */}
        <div className="animate-mic-3d relative flex flex-col items-center justify-center w-48 h-76">
          
          {/* 1. MIC HEAD (Ultra-Detailed 3D Spherical Metallic Grill) */}
          <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-slate-100 via-zinc-400 to-zinc-950 shadow-[0_15px_30px_rgba(0,0,0,0.9)] border-[3.5px] border-zinc-400 flex items-center justify-center overflow-hidden z-20">
            {/* Metallic Grid Mesh Texture */}
            <div className="absolute inset-0 bg-[radial-gradient(#000_1.8px,transparent_1.8px)] [background-size:5px_5px] opacity-80" />
            
            {/* Dual Chrome Center Bands with Red Accent Line */}
            <div className="absolute w-full h-4 bg-gradient-to-r from-zinc-500 via-white to-zinc-600 shadow-md border-y border-zinc-800 z-10 flex items-center justify-center">
              <div className="w-full h-0.5 bg-[#e62117] shadow-[0_0_4px_#e62117]" />
            </div>

            {/* 3D Glossy Spherical Glare Highlight */}
            <div className="absolute top-2.5 left-4 w-11 h-11 rounded-full bg-gradient-to-br from-white/80 via-white/40 to-transparent blur-[1.5px] z-20" />
            
            {/* Bottom Ambient Occlusion Shadow */}
            <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-15" />
          </div>

          {/* 2. POLISHED CHROME CONNECTOR NECK */}
          <div className="w-7 h-5 bg-gradient-to-r from-zinc-500 via-white to-zinc-800 border-x border-zinc-600 shadow-lg z-10" />

          {/* 3. 3D CUBE MIC FLAG (150px x 150px x 100px) */}
          <div className="cube-flag relative w-40 h-26 z-10">
            {/* FRONT FACE */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#c8000a] via-[#e62117] to-[#780005] border-2 border-red-400/80 shadow-[0_15px_35px_rgba(0,0,0,0.95)] rounded-xl flex items-center justify-center p-1.5 overflow-hidden"
              style={{ transform: 'rotateY(0deg) translateZ(80px)', backfaceVisibility: 'hidden' }}
            >
              <div className="relative w-full h-full bg-[#080808] rounded-lg p-2 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-inner">
                {/* Specular Light Sweep */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-10" />
                <Image
                  src="/assets/logoblack.png"
                  alt="Gujarat Post Logo"
                  fill
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>
            </div>

            {/* BACK FACE */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#c8000a] via-[#e62117] to-[#780005] border-2 border-red-400/80 shadow-[0_15px_35px_rgba(0,0,0,0.95)] rounded-xl flex items-center justify-center p-1.5 overflow-hidden"
              style={{ transform: 'rotateY(180deg) translateZ(80px)', backfaceVisibility: 'hidden' }}
            >
              <div className="relative w-full h-full bg-[#080808] rounded-lg p-2 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-10" />
                <Image
                  src="/assets/logoblack.png"
                  alt="Gujarat Post Logo"
                  fill
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>
            </div>

            {/* RIGHT FACE */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#c8000a] via-[#e62117] to-[#780005] border-2 border-red-400/80 shadow-[0_15px_35px_rgba(0,0,0,0.95)] rounded-xl flex items-center justify-center p-1.5 overflow-hidden"
              style={{ transform: 'rotateY(90deg) translateZ(80px)', backfaceVisibility: 'hidden' }}
            >
              <div className="relative w-full h-full bg-[#080808] rounded-lg p-2 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-10" />
                <Image
                  src="/assets/logoblack.png"
                  alt="Gujarat Post Logo"
                  fill
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>
            </div>

            {/* LEFT FACE */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#c8000a] via-[#e62117] to-[#780005] border-2 border-red-400/80 shadow-[0_15px_35px_rgba(0,0,0,0.95)] rounded-xl flex items-center justify-center p-1.5 overflow-hidden"
              style={{ transform: 'rotateY(-90deg) translateZ(80px)', backfaceVisibility: 'hidden' }}
            >
              <div className="relative w-full h-full bg-[#080808] rounded-lg p-2 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-10" />
                <Image
                  src="/assets/logoblack.png"
                  alt="Gujarat Post Logo"
                  fill
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>
            </div>

            {/* TOP CAP (Seals 3D Cube) */}
            <div
              className="absolute w-40 h-40 bg-gradient-to-tr from-[#6b0207] via-[#3a0003] to-[#140001] border border-red-700/80 shadow-inner"
              style={{ transform: 'rotateX(90deg) translateZ(52px)', top: '-28px' }}
            />
            {/* BOTTOM CAP (Seals 3D Cube) */}
            <div
              className="absolute w-40 h-40 bg-gradient-to-tr from-[#1c1c1c] via-[#0d0d0d] to-[#050505] border border-zinc-800 shadow-inner"
              style={{ transform: 'rotateX(-90deg) translateZ(52px)', top: '-28px' }}
            />
          </div>

          {/* 4. CHROME CONNECTOR COLLAR */}
          <div className="w-8 h-3.5 bg-gradient-to-r from-zinc-500 via-white to-zinc-800 border-x border-zinc-700 shadow-md z-10" />

          {/* 5. HEAVY NEWS REPORTER MIC HANDLE */}
          <div className="relative w-11 h-36 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black rounded-b-2xl border-x-2 border-zinc-700 shadow-2xl overflow-hidden flex flex-col items-center justify-between p-1 z-10">
            {/* Glossy Vertical Metallic Reflection Strip */}
            <div className="absolute inset-y-0 left-2 w-2 bg-gradient-to-r from-white/30 to-transparent blur-[0.5px]" />
            
            {/* Grip Ring Lines */}
            <div className="w-full space-y-2 mt-3 z-10">
              <div className="w-full h-1 bg-zinc-950 border-y border-zinc-700" />
              <div className="w-full h-1 bg-zinc-950 border-y border-zinc-700" />
              <div className="w-full h-1 bg-zinc-950 border-y border-zinc-700" />
            </div>

            {/* Metallic XLR Cable Jack Base with Gold Pins */}
            <div className="w-9 h-4 bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-600 rounded-b-lg border-t border-zinc-800 shadow-md flex items-center justify-center z-10">
              <div className="w-3.5 h-1 bg-amber-400 rounded-xs shadow-[0_0_2px_#fbbf24]" />
            </div>
          </div>

        </div>
      </div>

      {/* Official Gujarat Post Black Logo */}
      <div className="relative h-14 w-64 sm:h-16 sm:w-72 my-1 flex items-center justify-center filter drop-shadow-lg">
        <Image
          src="/assets/logoblack.png"
          alt="Gujarat Post Logo"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Brand Slogan */}
      <p className="mt-2 text-xs sm:text-sm font-extrabold text-[#a3a3a3] uppercase tracking-widest leading-none select-none" translate="no">
        Real Stories. <span className="text-[#e62117]">Real Gujarat.</span>
      </p>

      {/* Modern Sweep Loader Bar */}
      <div className="mt-8 h-1 w-52 overflow-hidden rounded-full bg-white/10 shadow-inner">
        <div className="h-full w-28 bg-gradient-to-r from-transparent via-[#e62117] to-transparent animate-sweep" />
      </div>
    </div>
  );
}
