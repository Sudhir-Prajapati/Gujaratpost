'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, Flower2, Flame, Star, Cake, Calendar, User } from 'lucide-react';
import type { TributeItem } from '@/lib/api';

export interface TributeCardProps {
  tribute: TributeItem;
  className?: string;
  minHeight?: number;
  showBadge?: boolean;
}

export default function TributeCard({
  tribute,
  className = '',
  minHeight,
  showBadge = true,
}: TributeCardProps) {
  const isBirthday = tribute.type === 'BIRTHDAY';
  const template = tribute.templateId || (isBirthday ? 'golden' : 'shanti');
  const photo = tribute.photo?.trim();

  // Helper to safely format image source
  const hasPhoto = Boolean(photo && photo !== '');

  // ══════════════════════════════════════════════════════════════
  // 1. BIRTHDAY TEMPLATES
  // ══════════════════════════════════════════════════════════════

  // A. Golden Royal Birthday (શાહી સુવર્ણ)
  if (isBirthday && (template === 'golden' || template === 'royal')) {
    const isNavyRoyal = template === 'royal';
    const bgGradient = isNavyRoyal
      ? 'from-slate-950 via-indigo-950 to-slate-900 border-amber-400/40 text-amber-100'
      : 'from-amber-950 via-red-950 to-amber-900 border-amber-400/50 text-amber-50';

    return (
      <div
        className={`relative w-full h-full overflow-hidden rounded-xl border-2 p-3 shadow-md flex flex-col justify-between select-none bg-gradient-to-br ${bgGradient} ${className}`}
        style={{ height: '100%', minHeight: minHeight ? `${minHeight}px` : '100%' }}
      >
        {/* Decorative Golden Corner Accents */}
        <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-red-500/20 blur-xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="flex items-center justify-between z-10 gap-2 border-b border-amber-400/20 pb-1 mb-1">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Sparkles className="h-3.5 w-3.5 fill-amber-300 animate-pulse text-amber-300 shrink-0" />
            <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-200">
              જન્મદિવસની હાર્દિક શુભકામના
            </span>
          </div>
          {showBadge && (
            <span className="flex items-center gap-1 text-[8.5px] font-black px-1.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 shrink-0">
              <Cake className="h-2.5 w-2.5" />
              <span>Happy Birthday</span>
            </span>
          )}
        </div>

        {/* Center Content: Photo + Details */}
        <div className="flex items-center gap-2.5 z-10 my-auto">
          {/* Photo Frame */}
          <div className="relative shrink-0">
            <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-md ring-2 ring-amber-400/50">
              <div className="relative h-full w-full rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
                {hasPhoto ? (
                  <Image
                    src={photo!}
                    alt={tribute.name}
                    fill
                    unoptimized={photo!.startsWith('http')}
                    className="object-cover object-top"
                  />
                ) : (
                  <User className="h-7 w-7 text-amber-300" />
                )}
              </div>
            </div>
            {/* Sparkle badge on photo */}
            <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow border border-amber-200">
              <Star className="h-2.5 w-2.5 fill-current" />
            </div>
          </div>

          {/* Text Information */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] sm:text-[15px] font-black text-amber-100 tracking-tight leading-snug drop-shadow-sm truncate">
              {tribute.name}
            </h4>
            {tribute.date && (
              <p className="text-[10px] font-bold text-amber-300/90 flex items-center gap-1 mt-0.5">
                <Calendar className="h-2.5 w-2.5" />
                <span>{tribute.date}</span>
              </p>
            )}
            <p className="text-[10.5px] font-semibold text-amber-100/85 mt-0.5 line-clamp-2 leading-tight italic">
              {tribute.info || 'ઈશ્વર આપને દીર્ઘાયુ, ઉત્તમ સ્વાસ્થ્ય અને અખૂટ સફળતા પ્રદાન કરે તેવી પ્રાર્થના!'}
            </p>
          </div>
        </div>

        {/* Bottom Ribbon */}
        <div className="mt-1 pt-1 border-t border-amber-400/20 text-center z-10">
          <span className="text-[9.5px] font-bold text-amber-300/80 tracking-wide">
            ✨ ગુજરાત પોસ્ટ પરિવાર તરફથી ઉજ્જવળ ભવિષ્યની શુભકામનાઓ ✨
          </span>
        </div>
      </div>
    );
  }

  // B. Festive Gujarati Marigold (ઉત્સવ ગુજરાતી)
  if (isBirthday && template === 'festive') {
    return (
      <div
        className={`relative w-full h-full overflow-hidden rounded-xl border-2 border-orange-400/50 p-3 shadow-md flex flex-col justify-between select-none bg-gradient-to-br from-orange-600 via-amber-600 to-rose-600 text-white ${className}`}
        style={{ height: '100%', minHeight: minHeight ? `${minHeight}px` : '100%' }}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between z-10 gap-2 border-b border-white/20 pb-1 mb-1">
          <div className="flex items-center gap-1.5 text-yellow-200">
            <Flower2 className="h-3.5 w-3.5 text-yellow-200 shrink-0" />
            <span className="text-[10.5px] font-black uppercase tracking-wider text-yellow-100">
              શુભ જન્મદિન અભિનંદન
            </span>
          </div>
          {showBadge && (
            <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-white shrink-0">
              🎉 શુભકામના
            </span>
          )}
        </div>

        {/* Center Content */}
        <div className="flex items-center gap-2.5 z-10 my-auto">
          {/* Photo */}
          <div className="relative shrink-0">
            <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl p-1 bg-gradient-to-tr from-yellow-300 via-white to-amber-300 shadow-md">
              <div className="relative h-full w-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                {hasPhoto ? (
                  <Image
                    src={photo!}
                    alt={tribute.name}
                    fill
                    unoptimized={photo!.startsWith('http')}
                    className="object-cover object-top"
                  />
                ) : (
                  <User className="h-7 w-7 text-yellow-200" />
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] sm:text-[15px] font-black text-white tracking-tight leading-snug drop-shadow truncate">
              {tribute.name}
            </h4>
            {tribute.date && (
              <p className="text-[10px] font-bold text-yellow-200 flex items-center gap-1 mt-0.5">
                <Calendar className="h-2.5 w-2.5" />
                <span>{tribute.date}</span>
              </p>
            )}
            <p className="text-[10.5px] font-medium text-white/95 mt-0.5 line-clamp-2 leading-tight">
              {tribute.info || 'આપનું જીવન સુખ, શાંતિ, સમૃદ્ધિ અને આનંદથી સદાય મહેકતું રહે તેવી મંગલકામના!'}
            </p>
          </div>
        </div>

        {/* Bottom Wish Tag */}
        <div className="mt-1 pt-1 border-t border-white/20 text-center z-10">
          <span className="text-[9.5px] font-extrabold text-yellow-100 tracking-wider">
            🌸 દીર્ઘાયુ ભવઃ • સદાય હસતા રહો 🌸
          </span>
        </div>
      </div>
    );
  }

  // C. Celebration Balloons & Confetti (બર્થડે ઉત્સવ)
  if (isBirthday) {
    return (
      <div
        className={`relative w-full h-full overflow-hidden rounded-xl border-2 border-pink-400/40 p-3 shadow-md flex flex-col justify-between select-none bg-gradient-to-br from-purple-900 via-pink-900 to-rose-950 text-white ${className}`}
        style={{ height: '100%', minHeight: minHeight ? `${minHeight}px` : '100%' }}
      >
        <div className="flex items-center justify-between z-10 gap-2 border-b border-pink-400/20 pb-1 mb-1">
          <div className="flex items-center gap-1.5 text-pink-300">
            <Cake className="h-3.5 w-3.5 text-pink-300 shrink-0" />
            <span className="text-[10.5px] font-black uppercase tracking-wider text-pink-100">
              Happy Birthday! જન્મદિવસ મુબારક
            </span>
          </div>
          {showBadge && (
            <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/30 text-pink-200 shrink-0">
              🎈 Celebration
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 z-10 my-auto">
          <div className="relative shrink-0">
            <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-full p-1 bg-gradient-to-tr from-pink-400 via-amber-300 to-purple-400 shadow-md">
              <div className="relative h-full w-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                {hasPhoto ? (
                  <Image
                    src={photo!}
                    alt={tribute.name}
                    fill
                    unoptimized={photo!.startsWith('http')}
                    className="object-cover object-top"
                  />
                ) : (
                  <User className="h-7 w-7 text-pink-200" />
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-[14px] sm:text-[15px] font-black text-white tracking-tight leading-snug truncate">
              {tribute.name}
            </h4>
            {tribute.date && (
              <p className="text-[10px] font-bold text-pink-200 flex items-center gap-1 mt-0.5">
                <Calendar className="h-2.5 w-2.5" />
                <span>{tribute.date}</span>
              </p>
            )}
            <p className="text-[10.5px] font-medium text-pink-100/90 mt-0.5 line-clamp-2 leading-tight">
              {tribute.info || 'જન્મદિવસની હૃદયપૂર્વકની અનેક અનેક શુભકામનાઓ! સદૈવ પ્રગતિના પંથે આગળ વધો.'}
            </p>
          </div>
        </div>

        <div className="mt-1 pt-1 border-t border-pink-400/20 text-center z-10">
          <span className="text-[9.5px] font-bold text-pink-200 tracking-wide">
            🎂 Best Wishes from Gujarat Post News 🎂
          </span>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // 2. SHRADHANJALI TEMPLATES
  // ══════════════════════════════════════════════════════════════

  // A. Divya Om Shanti White & Gold (દિવ્ય ઓમ શાંતિ)
  if (!isBirthday && (template === 'shanti' || template === 'eternal')) {
    return (
      <div
        className={`relative w-full h-full overflow-hidden rounded-xl border-2 border-amber-300/60 dark:border-amber-500/40 p-3 shadow-md flex flex-col justify-between select-none bg-gradient-to-b from-stone-50 via-amber-50/50 to-stone-100 dark:from-stone-950 dark:via-zinc-900 dark:to-stone-900 text-stone-900 dark:text-stone-100 ${className}`}
        style={{ height: '100%', minHeight: minHeight ? `${minHeight}px` : '100%' }}
      >
        {/* Subtle Sacred Border Pattern */}
        <div className="absolute inset-1 rounded-lg border border-amber-300/30 dark:border-amber-600/20 pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between z-10 gap-2 border-b border-stone-200 dark:border-stone-800 pb-1 mb-1">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
            <Flame className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-[10.5px] font-black uppercase tracking-wider">
              ।। ૐ શાંતિ ૐ ।। ભાવપૂર્ણ શ્રદ્ધાંજલિ
            </span>
          </div>
          {showBadge && (
            <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 shrink-0">
              શ્રદ્ધાંજલિ
            </span>
          )}
        </div>

        {/* Center Content */}
        <div className="flex items-center gap-2.5 z-10 my-auto">
          {/* Photo Frame with Garland Effect */}
          <div className="relative shrink-0">
            <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-lg p-1 bg-gradient-to-b from-amber-200 via-stone-200 to-amber-300 dark:from-amber-700 dark:via-stone-700 dark:to-amber-800 shadow-md border border-stone-300 dark:border-stone-700">
              <div className="relative h-full w-full rounded overflow-hidden bg-stone-200 dark:bg-stone-900 flex items-center justify-center grayscale-[20%]">
                {hasPhoto ? (
                  <Image
                    src={photo!}
                    alt={tribute.name}
                    fill
                    unoptimized={photo!.startsWith('http')}
                    className="object-cover object-top"
                  />
                ) : (
                  <User className="h-7 w-7 text-stone-400" />
                )}
              </div>
            </div>
            {/* Small lotus icon */}
            <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 p-0.5 rounded-full shadow border border-amber-300 dark:border-amber-600">
              <Flower2 className="h-2.5 w-2.5" />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-widest block">
              સ્વર્ગસ્થ
            </span>
            <h4 className="text-[14px] sm:text-[15px] font-black text-stone-900 dark:text-stone-100 tracking-tight leading-snug truncate">
              {tribute.name}
            </h4>
            {tribute.date && (
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                <Calendar className="h-2.5 w-2.5" />
                <span>સ્મૃતિ: {tribute.date}</span>
              </p>
            )}
            <p className="text-[10.5px] font-medium text-stone-600 dark:text-stone-300 mt-0.5 line-clamp-2 leading-tight">
              {tribute.info || 'પરમકૃપાળુ પરમાત્મા દિવંગત પુણ્યાત્માને પોતાના શ્રીચરણોમાં પરમ શાંતિ અર્પે.'}
            </p>
          </div>
        </div>

        {/* Bottom Prayer */}
        <div className="mt-1 pt-1 border-t border-stone-200 dark:border-stone-800 text-center z-10">
          <span className="text-[9.5px] font-bold text-stone-500 dark:text-stone-400 tracking-wide">
            🙏 પ્રભુ આપના દિવ્ય આત્માને ચિર શાંતિ બક્ષે • શોકમગ્ન પરિવાર 🙏
          </span>
        </div>
      </div>
    );
  }

  // B. Pavitra Smruti / Floral Garland Theme (પવિત્ર સ્મૃતિ / હાર માળા)
  if (!isBirthday && template === 'smruti') {
    return (
      <div
        className={`relative w-full h-full overflow-hidden rounded-xl border-2 border-stone-300 dark:border-stone-700 p-3 shadow-md flex flex-col justify-between select-none bg-gradient-to-br from-stone-100 via-orange-50/40 to-stone-200 dark:from-stone-950 dark:via-zinc-900 dark:to-neutral-900 text-stone-900 dark:text-stone-100 ${className}`}
        style={{ height: '100%', minHeight: minHeight ? `${minHeight}px` : '100%' }}
      >
        <div className="flex items-center justify-between z-10 gap-2 border-b border-stone-300 dark:border-stone-800 pb-1 mb-1">
          <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-black text-[10.5px] uppercase tracking-wider">
            <span>🌸 પવિત્ર સ્મરણાંજલિ 🌸</span>
          </div>
          {showBadge && (
            <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 shrink-0">
              બેસણું / સ્મૃતિ
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 z-10 my-auto">
          {/* Garland Frame */}
          <div className="relative shrink-0 p-1 rounded-full border-2 border-dashed border-amber-400/80 bg-amber-50 dark:bg-stone-900">
            <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-full overflow-hidden relative shadow-inner flex items-center justify-center bg-stone-300 dark:bg-stone-800">
              {hasPhoto ? (
                <Image
                  src={photo!}
                  alt={tribute.name}
                  fill
                  unoptimized={photo!.startsWith('http')}
                  className="object-cover object-top"
                />
              ) : (
                <User className="h-7 w-7 text-stone-500" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase">
              સ્વર્ગીય પુણ્યાત્મા
            </span>
            <h4 className="text-[14px] sm:text-[15px] font-black text-stone-900 dark:text-stone-100 tracking-tight leading-snug truncate">
              {tribute.name}
            </h4>
            {tribute.date && (
              <p className="text-[10px] font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1 mt-0.5">
                <Calendar className="h-2.5 w-2.5 text-amber-600" />
                <span>{tribute.date}</span>
              </p>
            )}
            <p className="text-[10.5px] font-medium text-stone-600 dark:text-stone-300 mt-0.5 line-clamp-2 leading-tight">
              {tribute.info || 'આપની પવિત્ર સ્મૃતિ સદાય અમારા હૃદયમાં જીવંત રહેશે. પ્રભુ આત્માને મોક્ષ આપે.'}
            </p>
          </div>
        </div>

        <div className="mt-1 pt-1 border-t border-stone-200 dark:border-stone-800 text-center z-10">
          <span className="text-[9.5px] font-bold text-stone-500 dark:text-stone-400 tracking-wide">
            ।। શાંતિઃ શાંતિઃ શાંતિઃ ।।
          </span>
        </div>
      </div>
    );
  }

  // C. Bhavpurna Pranam Sandalwood (ભાવપૂર્ણ પ્રણામ)
  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-xl border-2 border-stone-400/40 p-3 shadow-md flex flex-col justify-between select-none bg-gradient-to-br from-neutral-100 via-stone-100 to-neutral-200 dark:from-neutral-950 dark:via-stone-900 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100 ${className}`}
      style={{ height: '100%', minHeight: minHeight ? `${minHeight}px` : '100%' }}
    >
      <div className="flex items-center justify-between z-10 gap-2 border-b border-stone-300 dark:border-stone-700 pb-1 mb-1">
        <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300 font-black text-[10.5px] uppercase tracking-wider">
          <span>🙏 ભાવપૂર્ણ શ્રદ્ધાંજલિ 🙏</span>
        </div>
        {showBadge && (
          <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-full bg-stone-300 dark:bg-stone-800 text-stone-800 dark:text-stone-200 shrink-0">
            ૐ શાંતિ
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 z-10 my-auto">
        <div className="relative shrink-0">
          <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-lg p-1 bg-stone-300 dark:bg-stone-700 shadow-md">
            <div className="relative h-full w-full rounded overflow-hidden bg-stone-200 dark:bg-stone-900 flex items-center justify-center">
              {hasPhoto ? (
                <Image
                  src={photo!}
                  alt={tribute.name}
                  fill
                  unoptimized={photo!.startsWith('http')}
                  className="object-cover object-top"
                />
              ) : (
                <User className="h-7 w-7 text-stone-500" />
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] sm:text-[15px] font-black text-stone-900 dark:text-stone-100 tracking-tight leading-snug truncate">
            {tribute.name}
          </h4>
          {tribute.date && (
            <p className="text-[10px] font-bold text-stone-600 dark:text-stone-400 flex items-center gap-1 mt-0.5">
              <Calendar className="h-2.5 w-2.5" />
              <span>{tribute.date}</span>
            </p>
          )}
          <p className="text-[10.5px] font-medium text-stone-600 dark:text-stone-300 mt-0.5 line-clamp-2 leading-tight">
            {tribute.info || 'પરમપિતા પરમેશ્વર દિવંગત આત્માને શાશ્વત શાંતિ પ્રદાન કરે.'}
          </p>
        </div>
      </div>

      <div className="mt-1 pt-1 border-t border-stone-300 dark:border-stone-800 text-center z-10">
        <span className="text-[9.5px] font-bold text-stone-500 dark:text-stone-400 tracking-wide">
          ભાવભરી સ્મરણાંજલિ
        </span>
      </div>
    </div>
  );
}
