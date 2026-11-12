'use client';

import React from 'react';

interface DynamicCalendarIconProps {
  date?: Date;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  language?: string;
}

const guMonthsShort = [
  'જાન્યુ', 'ફેબ્રુ', 'માર્ચ', 'એપ્રિ', 'મે', 'જૂન',
  'જુલાઈ', 'ઓગ', 'સપ્ટે', 'ઓક્ટો', 'નવે', 'ડિસે',
];

const hiMonthsShort = [
  'जन', 'फ़र', 'मार्च', 'अप्रै', 'मई', 'जून',
  'जुला', 'अग', 'सित', 'अक्तू', 'नव', 'दिस',
];

export default function DynamicCalendarIcon({
  date,
  className = '',
  size = 'md',
  language = 'gu',
}: DynamicCalendarIconProps) {
  const d = date || new Date();
  const day = d.getDate();
  const monthIdx = d.getMonth();

  let monthLabel = 'NOV';
  if (language === 'gu') {
    monthLabel = guMonthsShort[monthIdx];
  } else if (language === 'hi') {
    monthLabel = hiMonthsShort[monthIdx];
  } else {
    monthLabel = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  }

  // Size configurations
  const dimensions = {
    sm: 'w-[17px] h-[18px]',
    md: 'w-[20px] h-[21px]',
    lg: 'w-[24px] h-[26px]',
  }[size];

  const headerText = {
    sm: 'text-[6px] py-[0.5px]',
    md: 'text-[7px] py-[1px]',
    lg: 'text-[8.5px] py-[1.5px]',
  }[size];

  const dayText = {
    sm: 'text-[9px]',
    md: 'text-[10.5px]',
    lg: 'text-[13px]',
  }[size];

  return (
    <span
      className={`relative inline-flex flex-col items-center justify-between rounded-[4px] overflow-hidden bg-white shadow-xs border border-zinc-300/80 dark:border-zinc-700/80 shrink-0 select-none align-middle ${dimensions} ${className}`}
      aria-label={`તારીખ: ${day} ${monthLabel}`}
      role="img"
    >
      {/* Mini binder rings at top */}
      <span className="absolute top-[1.5px] left-[3px] w-[2px] h-[2.5px] bg-zinc-900/60 rounded-full z-10 pointer-events-none" />
      <span className="absolute top-[1.5px] right-[3px] w-[2px] h-[2.5px] bg-zinc-900/60 rounded-full z-10 pointer-events-none" />

      {/* Red header banner with Month */}
      <span
        className={`w-full bg-[#D71914] text-white font-black tracking-tight text-center leading-none uppercase truncate px-0.5 ${headerText}`}
      >
        {monthLabel}
      </span>

      {/* White body with Day Number */}
      <span
        className={`w-full flex-1 flex items-center justify-center font-black text-zinc-900 dark:text-zinc-900 leading-none pb-[1px] tracking-tighter ${dayText}`}
      >
        {day}
      </span>
    </span>
  );
}

