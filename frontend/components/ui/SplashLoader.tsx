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
      className={`fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-[#040810] transition-opacity duration-500 ease-in-out select-none overflow-hidden h-screen w-screen ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
          <div className="w-72 h-72 rounded-full bg-[#B3121B]/35 blur-3xl animate-pulse-glow" />
          <div className="absolute w-72 h-72 rounded-full border border-[#B3121B]/40 animate-ripple-1" />
          <div className="absolute w-84 h-84 rounded-full border border-[#B3121B]/25 animate-ripple-2" />
        </div>

        {/* Orbiting Laser Ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-rotate-orbit">
          <div className="w-76 h-28 rounded-[100%] border-2 border-dashed border-[#B3121B] shadow-[0_0_20px_#B3121B] opacity-85" />
        </div>

        {/* Dynamic Floor Shadow below Mic Handle */}
        <div className="absolute bottom-3 w-28 h-5 rounded-full bg-black/90 blur-md animate-floor-shadow" />

        {/* 3D ROTATING NEWS REPORTER MICROPHONE (REALISTIC BROADCAST STYLING) */}
        <div className="animate-mic-3d relative flex flex-col items-center justify-center w-36 h-76">
          
          {/* 1. MIC HEAD (Real Broadcast Foam / Mesh Capsule with Domed Top) */}
          <div className="relative w-[52px] h-[74px] rounded-t-[26px] rounded-b-[6px] overflow-hidden bg-gradient-to-r from-[#141416] via-[#28282c] to-[#0a0a0c] shadow-[0_12px_28px_rgba(0,0,0,0.95)] z-20 flex flex-col items-center justify-between border-t border-x border-zinc-700/50">
            {/* Realistic Micro-Mesh Texture Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#3e3e46_1px,transparent_1px)] [background-size:3px_3px] opacity-90" />
            
            {/* 3D Curved Specular Glare along Left Edge */}
            <div className="absolute left-1.5 top-2 bottom-3 w-2.5 rounded-l-full bg-gradient-to-r from-white/25 via-white/5 to-transparent blur-[0.6px] z-10" />
            
            {/* Right Side Ambient Shadow for Cylindrical Depth */}
            <div className="absolute right-0 inset-y-0 w-3.5 bg-gradient-to-l from-black/80 to-transparent z-10" />
            
            {/* Horizontal Capsule Mid-Seam Line */}
            <div className="absolute bottom-3 inset-x-0 h-0.5 bg-black/80 shadow-[0_1px_0_rgba(255,255,255,0.08)] z-10" />
          </div>

          {/* Capsule Base Ring Collar */}
          <div className="w-[48px] h-[8px] bg-gradient-to-r from-zinc-800 via-zinc-500 to-black rounded-xs border-y border-zinc-700/80 shadow-md z-20" />

          {/* Conical Neck (Transition into Flag) */}
          <div className="w-[34px] h-[14px] bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-950 z-10 border-x border-zinc-800 shadow-inner" />

          {/* 2. 3D CUBE MIC FLAG (124px x 50px x 124px with Gujarat Post Logo) */}
          <div className="cube-flag relative w-[124px] h-[50px] z-10">
            {/* FRONT FACE */}
            <div
              className="absolute inset-0 bg-[#0c0c0e] border border-zinc-800 shadow-[0_15px_35px_rgba(0,0,0,0.95)] rounded-lg p-1 flex items-center justify-center overflow-hidden"
              style={{ transform: 'rotateY(0deg) translateZ(62px)', backfaceVisibility: 'hidden' }}
            >
              <div className="relative w-full h-full rounded-md bg-gradient-to-r from-[#9e0d15] via-[#B3121B] to-[#85080f] border border-red-500/40 p-1 flex items-center justify-center overflow-hidden shadow-inner">
                {/* Specular Light Sweep */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/18 to-transparent pointer-events-none z-10" />
                <Image
                  src="/assets/gujarat-post-logo-chip.png"
                  alt="Gujarat Post Logo"
                  fill
                  className="object-contain p-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                  priority
                />
              </div>
            </div>

            {/* BACK FACE */}
            <div
              className="absolute inset-0 bg-[#0c0c0e] border border-zinc-800 shadow-[0_15px_35px_rgba(0,0,0,0.95)] rounded-lg p-1 flex items-center justify-center overflow-hidden"
              style={{ transform: 'rotateY(180deg) translateZ(62px)', backfaceVisibility: 'hidden' }}
            >
              <div className="relative w-full h-full rounded-md bg-gradient-to-r from-[#9e0d15] via-[#B3121B] to-[#85080f] border border-red-500/40 p-1 flex items-center justify-center overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/18 to-transparent pointer-events-none z-10" />
                <Image
                  src="/assets/gujarat-post-logo-chip.png"
                  alt="Gujarat Post Logo"
                  fill
                  className="object-contain p-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                  priority
                />
              </div>
            </div>

            {/* RIGHT FACE */}
            <div
              className="absolute inset-0 bg-[#0c0c0e] border border-zinc-800 shadow-[0_15px_35px_rgba(0,0,0,0.95)] rounded-lg p-1 flex items-center justify-center overflow-hidden"
              style={{ transform: 'rotateY(90deg) translateZ(62px)', backfaceVisibility: 'hidden' }}
            >
              <div className="relative w-full h-full rounded-md bg-gradient-to-r from-[#9e0d15] via-[#B3121B] to-[#85080f] border border-red-500/40 p-1 flex items-center justify-center overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/18 to-transparent pointer-events-none z-10" />
                <Image
                  src="/assets/gujarat-post-logo-chip.png"
                  alt="Gujarat Post Logo"
                  fill
                  className="object-contain p-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                  priority
                />
              </div>
            </div>

            {/* LEFT FACE */}
            <div
              className="absolute inset-0 bg-[#0c0c0e] border border-zinc-800 shadow-[0_15px_35px_rgba(0,0,0,0.95)] rounded-lg p-1 flex items-center justify-center overflow-hidden"
              style={{ transform: 'rotateY(-90deg) translateZ(62px)', backfaceVisibility: 'hidden' }}
            >
              <div className="relative w-full h-full rounded-md bg-gradient-to-r from-[#9e0d15] via-[#B3121B] to-[#85080f] border border-red-500/40 p-1 flex items-center justify-center overflow-hidden shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/18 to-transparent pointer-events-none z-10" />
                <Image
                  src="/assets/gujarat-post-logo-chip.png"
                  alt="Gujarat Post Logo"
                  fill
                  className="object-contain p-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                  priority
                />
              </div>
            </div>

            {/* TOP CAP (Seals 3D Cube with Central Mic Neck Hole) */}
            <div
              className="absolute w-[124px] h-[124px] bg-[#0e0e11] border border-zinc-800 shadow-inner flex items-center justify-center"
              style={{ transform: 'rotateX(90deg) translateZ(25px)', top: '-37px' }}
            >
              {/* Beveled Central Hole for Mic Shaft */}
              <div className="w-9 h-9 rounded-full bg-black border-2 border-zinc-700/80 shadow-inner" />
            </div>

            {/* BOTTOM CAP (Seals 3D Cube with Central Handle Hole) */}
            <div
              className="absolute w-[124px] h-[124px] bg-[#0e0e11] border border-zinc-800 shadow-inner flex items-center justify-center"
              style={{ transform: 'rotateX(-90deg) translateZ(25px)', top: '-37px' }}
            >
              {/* Beveled Central Hole for Mic Handle */}
              <div className="w-8 h-8 rounded-full bg-black border-2 border-zinc-700/80 shadow-inner" />
            </div>
          </div>

          {/* 3. UPPER HANDLE COLLAR */}
          <div className="w-[26px] h-[8px] bg-gradient-to-r from-zinc-800 via-zinc-600 to-black border-y border-zinc-700 z-10 shadow-sm" />

          {/* 4. SLEEK NEWS REPORTER MIC HANDLE (NO HAND - PURE MICROPHONE) */}
          <div className="relative w-[26px] h-[115px] bg-gradient-to-r from-[#141416] via-[#2a2a2f] to-[#0a0a0c] shadow-2xl overflow-hidden flex flex-col items-center justify-between p-1 z-10 border-x border-zinc-800/80">
            {/* Realistic Vertical Specular Highlight Strip */}
            <div className="absolute left-1 inset-y-0 w-1.5 bg-gradient-to-r from-white/20 via-white/5 to-transparent blur-[0.4px]" />
            
            {/* On/Off Switch Oval Recess */}
            <div className="w-3 h-6 bg-zinc-950 rounded-full border border-zinc-700/80 flex items-center justify-center shadow-inner mt-3.5 z-10">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_4px_#ef4444]" />
            </div>

            {/* Lower Grip Ring Texture Lines */}
            <div className="w-full space-y-1.5 mb-2 z-10">
              <div className="w-full h-[1.5px] bg-zinc-950 border-t border-zinc-800" />
              <div className="w-full h-[1.5px] bg-zinc-950 border-t border-zinc-800" />
            </div>
          </div>

          {/* 5. STEPPED METALLIC XLR BASE */}
          <div className="w-[20px] h-[6px] bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-900 border-t border-zinc-950 z-10" />
          <div className="w-[16px] h-[12px] bg-gradient-to-r from-zinc-600 via-zinc-300 to-zinc-800 rounded-b-md shadow-md flex items-center justify-center z-10">
            {/* Gold Terminal Contact Pin */}
            <div className="w-2 h-1 bg-amber-400 rounded-xs shadow-[0_0_3px_#fbbf24]" />
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
        Real Stories. <span className="text-[#B3121B]">Real Gujarat.</span>
      </p>

      {/* Modern Sweep Loader Bar */}
      <div className="mt-8 h-1 w-52 overflow-hidden rounded-full bg-white/10 shadow-inner">
        <div className="h-full w-28 bg-gradient-to-r from-transparent via-[#B3121B] to-transparent animate-sweep" />
      </div>
    </div>
  );
}
