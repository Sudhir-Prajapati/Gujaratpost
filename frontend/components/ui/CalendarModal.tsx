'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft, ChevronRight, Newspaper, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import DynamicCalendarIcon from './DynamicCalendarIcon';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
}

const MONTH_NAMES_GU = [
  'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
  'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર',
];

const MONTH_NAMES_HI = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
];

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS_GU = ['રવિ', 'સોમ', 'મંગળ', 'બુધ', 'ગુરુ', 'શુક્ર', 'શનિ'];
const WEEKDAYS_HI = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DAYS_FULL_GU = ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર'];

export default function CalendarModal({
  isOpen,
  onClose,
  language = 'gu',
}: CalendarModalProps) {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Reset to today whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setCurrentYear(now.getFullYear());
      setCurrentMonth(now.getMonth());
      setSelectedDate(now);
    }
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Month navigation
  const prevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(now);
  }, []);

  // Compute calendar days
  const calendarData = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: currentMonth === 0 ? 11 : currentMonth - 1,
        year: currentMonth === 0 ? currentYear - 1 : currentYear,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      days.push({
        day: d,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill a complete 35 or 42 grid
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        day: d,
        month: currentMonth === 11 ? 0 : currentMonth + 1,
        year: currentMonth === 11 ? currentYear + 1 : currentYear,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  if (!isOpen) return null;

  const monthNames = language === 'hi' ? MONTH_NAMES_HI : language === 'en' ? MONTH_NAMES_EN : MONTH_NAMES_GU;
  const weekdays = language === 'hi' ? WEEKDAYS_HI : language === 'en' ? WEEKDAYS_EN : WEEKDAYS_GU;

  const isToday = (d: number, m: number, y: number) => {
    return (
      d === today.getDate() &&
      m === today.getMonth() &&
      y === today.getFullYear()
    );
  };

  const isSelected = (d: number, m: number, y: number) => {
    return (
      d === selectedDate.getDate() &&
      m === selectedDate.getMonth() &&
      y === selectedDate.getFullYear()
    );
  };

  const formatDateYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleOpenEpaper = () => {
    const dateStr = formatDateYMD(selectedDate);
    onClose();
    router.push(`/epaper?date=${dateStr}`);
  };

  const handleOpenNews = () => {
    onClose();
    router.push('/');
  };

  // Selected date details
  const selDay = selectedDate.getDate();
  const selMonthName = monthNames[selectedDate.getMonth()];
  const selYear = selectedDate.getFullYear();
  const selWeekday = DAYS_FULL_GU[selectedDate.getDay()];
  const isSelectedDateToday = isToday(selDay, selectedDate.getMonth(), selYear);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col text-foreground transition-all transform scale-100 animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#D71914] text-white">
          <div className="flex items-center gap-2">
            <DynamicCalendarIcon date={selectedDate} size="md" language={language} />
            <h2 id="calendar-modal-title" className="text-base sm:text-lg font-black tracking-tight">
              {language === 'en' ? 'Calendar & Date' : 'કેલેન્ડર અને તારીખ'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close calendar"
            className="rounded-full p-1 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Date Summary Banner */}
        <div className="px-4 py-3 bg-red-50 dark:bg-zinc-800/60 border-b border-red-100 dark:border-zinc-700/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {isSelectedDateToday ? 'આજની તારીખ (Today)' : 'પસંદ કરેલ તારીખ'}
            </div>
            <div className="text-sm sm:text-base font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
              <span>{selDay} {selMonthName}, {selYear}</span>
              <span className="text-xs font-bold text-[#D71914]">| {selWeekday}</span>
            </div>
          </div>
          {!isSelectedDateToday && (
            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#D71914] text-white hover:bg-[#b51410] transition-colors shadow-2xs"
            >
              આજે (Today)
            </button>
          )}
        </div>

        {/* Calendar Body */}
        <div className="p-4 space-y-3">
          {/* Month / Year Navigator */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm sm:text-base font-black text-foreground">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((wd, i) => (
              <div
                key={wd}
                className={`text-[11px] sm:text-xs font-bold py-1 ${
                  i === 0 ? 'text-[#D71914]' : 'text-muted-foreground'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarData.map((slot, index) => {
              const todayFlag = isToday(slot.day, slot.month, slot.year);
              const selectedFlag = isSelected(slot.day, slot.month, slot.year);

              return (
                <button
                  key={`${slot.year}-${slot.month}-${slot.day}-${index}`}
                  type="button"
                  onClick={() => {
                    setSelectedDate(new Date(slot.year, slot.month, slot.day));
                    if (!slot.isCurrentMonth) {
                      setCurrentMonth(slot.month);
                      setCurrentYear(slot.year);
                    }
                  }}
                  className={`h-9 w-full rounded-lg text-xs sm:text-sm font-bold flex flex-col items-center justify-center transition-all relative ${
                    selectedFlag
                      ? 'bg-[#D71914] text-white shadow-md font-black scale-105 z-10'
                      : todayFlag
                      ? 'border-2 border-[#D71914] text-[#D71914] font-black bg-red-50/50 dark:bg-red-950/20'
                      : slot.isCurrentMonth
                      ? 'text-foreground hover:bg-muted'
                      : 'text-muted-foreground/35 hover:text-muted-foreground'
                  }`}
                >
                  <span>{slot.day}</span>
                  {todayFlag && !selectedFlag && (
                    <span className="w-1 h-1 rounded-full bg-[#D71914] absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-muted/40 border-t border-border flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleOpenEpaper}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#D71914] text-white font-bold text-xs sm:text-sm hover:bg-[#b51410] transition-all shadow-sm active:scale-95"
          >
            <Newspaper className="w-4 h-4" />
            <span>આ તારીખનું ઇ-પેપર (E-Paper)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleOpenNews}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-foreground font-bold text-xs sm:text-sm hover:bg-muted transition-all active:scale-95"
          >
            <CalendarIcon className="w-4 h-4 text-[#D71914]" />
            <span>તાજા સમાચાર</span>
          </button>
        </div>
      </div>
    </div>
  );
}

