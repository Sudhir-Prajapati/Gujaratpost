'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useApp } from '@/components/AppProvider';

interface StoryItem {
  id: string;
  heading: string;
  headingGu: string;
  headingHi: string;
  images: string[];
}

import { getPublicWebStories } from '@/lib/api';

const AUTO_PLAY_DURATION = 5000;

export default function WebStoriesSection() {
  const { language } = useApp();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  useEffect(() => {
    getPublicWebStories().then((res) => {
      if (res && res.length > 0) {
        const formatted: StoryItem[] = res.map((ws: any) => {
          const images = [ws.image1, ws.image2, ws.image3, ws.image4, ws.image5].filter(Boolean);
          return {
            id: ws.id,
            heading: ws.heading,
            headingGu: ws.headingGu || ws.heading,
            headingHi: ws.headingHi || ws.heading,
            images,
          };
        });
        setStories(formatted);
      }
    });
  }, []);

  const [progress, setProgress] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const isPaused = useRef(false);

  const updateArrows = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 10);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  // Smooth Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el || isPaused.current || activeStoryIndex !== null) return;
      el.scrollLeft += 1;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
        el.scrollLeft = 0;
      }
    }, 25);
    return () => clearInterval(interval);
  }, [activeStoryIndex]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  const handleNext = useCallback(() => {
    if (activeStoryIndex === null) return;
    
    const currentStory = stories[activeStoryIndex];
    if (activeSlideIndex < currentStory.images.length - 1) {
      // Next slide in current story
      setActiveSlideIndex(prev => prev + 1);
      setProgress(0);
    } else if (activeStoryIndex < stories.length - 1) {
      // Next story
      setActiveStoryIndex(prev => (prev as number) + 1);
      setActiveSlideIndex(0);
      setProgress(0);
    } else {
      // Close modal
      setActiveStoryIndex(null);
      setActiveSlideIndex(0);
    }
  }, [activeStoryIndex, activeSlideIndex, stories]);

  const handlePrev = useCallback(() => {
    if (activeStoryIndex === null) return;
    
    if (activeSlideIndex > 0) {
      // Prev slide in current story
      setActiveSlideIndex(prev => prev - 1);
      setProgress(0);
    } else if (activeStoryIndex > 0) {
      // Prev story
      setActiveStoryIndex(prev => (prev as number) - 1);
      setActiveSlideIndex(stories[activeStoryIndex - 1].images.length - 1);
      setProgress(0);
    } else {
      // At the very beginning
      setProgress(0);
    }
  }, [activeStoryIndex, activeSlideIndex, stories]);

  useEffect(() => {
    if (activeStoryIndex === null) {
      setProgress(0);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const calculatedProgress = Math.min((elapsed / AUTO_PLAY_DURATION) * 100, 100);

      setProgress(calculatedProgress);

      if (calculatedProgress < 100) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        handleNext();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [activeStoryIndex, activeSlideIndex, handleNext]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = rect.width * 0.35;

    if (x < threshold) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  if (stories.length === 0) return null;

  return (
    <section className="mx-auto max-w-screen-xl px-4 mt-2.5 relative overflow-hidden select-none">
      <div className="relative">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b-[3.5px] border-slate-950 dark:border-slate-800 pb-3 mb-6">
          <span className="section-heading-badge bg-[#B3121B] text-white px-5 py-2.5 text-[17px] md:text-[19px] font-black rounded-lg select-none leading-none tracking-tight">
            {language === 'gu' ? 'વેબસ્ટોરી' : language === 'hi' ? 'वेब स्टोरीज' : 'Web Stories'}
          </span>
          <Link
            href="/category/webstory"
            className="text-[#B3121B] hover:text-red-700 font-extrabold text-[20px] md:text-[21px] hover:underline"
          >
            {language === 'gu' ? 'વધુ જુઓ →' : 'More →'}
          </Link>
        </div>

        {/* Stories Horizontal Grid Scroll */}
        <div
          className="relative group/slider-wrap"
          onMouseEnter={() => { isPaused.current = true; }}
          onMouseLeave={() => { isPaused.current = false; }}
        >
          {showLeftArrow && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleScroll('left');
              }}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/70 backdrop-blur-md shadow-lg text-[#B3121B] hover:bg-[#B3121B] hover:border-[#B3121B] transition-all cursor-pointer select-none group/btn"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-6 w-6 stroke-[3.5px] text-[#B3121B] group-hover/btn:text-white transition-colors" />
            </button>
          )}

          {showRightArrow && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleScroll('right');
              }}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/70 backdrop-blur-md shadow-lg text-[#B3121B] hover:bg-[#B3121B] hover:border-[#B3121B] transition-all cursor-pointer select-none group/btn"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-6 w-6 stroke-[3.5px] text-[#B3121B] group-hover/btn:text-white transition-colors" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="scrollbar-none flex gap-4 overflow-x-auto pb-2"
          >
            {stories.map((story, index) => {
              const displayTitle = language === 'gu' ? story.headingGu : language === 'hi' ? story.headingHi : story.heading;
              return (
                <div
                  key={story.id}
                  onClick={() => {
                    setActiveStoryIndex(index);
                    setActiveSlideIndex(0);
                    setProgress(0);
                  }}
                  className="flex-none w-[130px] sm:w-[155px] cursor-pointer snap-start group"
                >
                  {/* Vertical Story Card Layout */}
                  <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-border/10 bg-muted shadow-sm transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-md">
                    {/* Badge at top-left */}
                    <span className="absolute top-3 left-3 bg-[#c36f30]/90 text-white text-[9.5px] font-extrabold px-2 py-0.5 rounded-sm uppercase tracking-wide z-10 select-none">
                      {language === 'gu' ? 'વેબ સ્ટોરી' : 'Web Story'}
                    </span>

                    {/* Image */}
                    <Image
                      src={story.images[0]}
                      alt={displayTitle}
                      fill
                      sizes="(max-width: 640px) 130px, 155px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                    {/* Bottom Title Container */}
                    <div className="absolute bottom-0 inset-x-0 p-3 flex flex-col gap-1.5">
                      {/* Avatar & Title Group */}
                      <div className="flex items-center gap-2">
                        <div className="h-[22px] w-[22px] rounded-full bg-white flex items-center justify-center shrink-0">
                          <BookOpen size={12} className="text-[#B3121B]" />
                        </div>
                        <span className="text-[10px] text-white/95 font-black truncate drop-shadow">
                          Gujarat Post
                        </span>
                      </div>
                      <h4 className="text-[11px] sm:text-[11.5px] font-black leading-tight text-white line-clamp-2 drop-shadow-md">
                        {displayTitle}
                      </h4>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Story View Modal */}
      {activeStoryIndex !== null && stories[activeStoryIndex] && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-[420px] aspect-[9/16] bg-slate-900 rounded-lg overflow-hidden shadow-2xl mx-4">

            {/* Background Layer with opacity blur */}
            <div className="absolute inset-0">
              <Image
                src={stories[activeStoryIndex].images[activeSlideIndex]}
                alt="Story background"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Click/Interact Overlay */}
            <div className="absolute inset-0 z-10 cursor-pointer" onClick={handleModalClick} />

            {/* Top Bar with Progress indicators */}
            <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-20 flex flex-col gap-3">
              <div className="flex gap-1">
                {stories[activeStoryIndex].images.map((_, idx) => {
                  let widthPercent = 0;
                  if (idx < activeSlideIndex) widthPercent = 100;
                  else if (idx === activeSlideIndex) widthPercent = progress;

                  return (
                    <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-75 ease-linear"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Author & Header Close bar */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-white rounded-full flex items-center justify-center">
                    <BookOpen size={14} className="text-[#B3121B]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-xs font-black drop-shadow-md">
                      {language === 'gu' ? stories[activeStoryIndex].headingGu : language === 'hi' ? stories[activeStoryIndex].headingHi : stories[activeStoryIndex].heading}
                    </span>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveStoryIndex(null);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition z-20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Removed description box as stories don't have descriptions in new schema */}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


