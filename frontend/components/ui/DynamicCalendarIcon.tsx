'use client';

import React from 'react';

interface DynamicCalendarIconProps {
  date?: Date;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  language?: string;
}

export default function DynamicCalendarIcon({
  date,
  className = '',
  size = 'md',
}: DynamicCalendarIconProps) {
  const d = date || new Date();
  const day = d.getDate();

  // Size configurations
  const dimensions = {
    sm: 'w-[18px] h-[19px] rounded-[3.5px]',
    md: 'w-[24px] h-[25px] rounded-[5px]',
    lg: 'w-[28px] h-[30px] rounded-[6px]',
  }[size];

  const headerHeight = {
    sm: 'h-[5px]',
    md: 'h-[7px]',
    lg: 'h-[8.5px]',
  }[size];

  const ringStyles = {
    sm: 'w-[2px] h-[2.5px] top-[1px]',
    md: 'w-[2.5px] h-[3.5px] top-[1.5px]',
    lg: 'w-[3px] h-[4.5px] top-[2px]',
  }[size];

  const ringLeft = {
    sm: 'left-[3px]',
    md: 'left-[4px]',
    lg: 'left-[5.5px]',
  }[size];

  const ringRight = {
    sm: 'right-[3px]',
    md: 'right-[4px]',
    lg: 'right-[5.5px]',
  }[size];

  const dayText = {
    sm: 'text-[10.5px]',
    md: 'text-[13.5px]',
    lg: 'text-[16px]',
  }[size];

  return (
    <span
      className={`relative inline-flex flex-col items-center justify-between overflow-hidden bg-white shadow-xs border border-zinc-300/90 dark:border-zinc-700/90 shrink-0 select-none align-middle ${dimensions} ${className}`}
      aria-label={`તારીખ: ${day}`}
      role="img"
    >
      {/* Mini binder rings / clips at top */}
      <span
        className={`absolute bg-white/90 rounded-full z-10 pointer-events-none shadow-2xs ${ringStyles} ${ringLeft}`}
      />
      <span
        className={`absolute bg-white/90 rounded-full z-10 pointer-events-none shadow-2xs ${ringStyles} ${ringRight}`}
      />

      {/* Solid Red header banner without month text */}
      <span className={`w-full bg-[#C8101E] shrink-0 ${headerHeight}`} />

      {/* White body with Day Number only */}
      <span
        className={`w-full flex-1 flex items-center justify-center font-black text-zinc-900 leading-none pb-[0.5px] tracking-tight ${dayText}`}
      >
        {day}
      </span>
    </span>
  );
}
