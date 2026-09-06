'use client';

import React from 'react';
import { Page4Data } from './types';
import { EditableTextSlot } from './EditableTextSlot';
import { EditableImageSlot } from './EditableImageSlot';
import { Trophy, Film, Sparkles } from 'lucide-react';

interface Page4SportsProps {
  data: Page4Data;
  onChange: (newData: Page4Data) => void;
  selectedPath?: string;
  onSelectSlot?: (path: string, label: string) => void;
  onImportClick?: (slotPath: string, label: string) => void;
  onOpenHoroscopeEditor?: () => void;
}

export const Page4Sports: React.FC<Page4SportsProps> = ({
  data,
  onChange,
  selectedPath,
  onSelectSlot,
  onImportClick,
  onOpenHoroscopeEditor,
}) => {
  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const clone = JSON.parse(JSON.stringify(data));
    let current = clone;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onChange(clone);
  };

  return (
    <div className="w-[800px] min-h-[1130px] bg-[#fffdfa] text-slate-900 shadow-2xl border border-slate-300 p-6 flex flex-col font-serif select-none box-border">
      {/* Top Header Bar */}
      <div className="border-b-2 border-slate-900 pb-2 mb-3 flex justify-between items-center font-sans text-xs">
        <span className="font-bold text-red-800 tracking-wider">ગુજરાત પોસ્ટ • ઈ-પેપર</span>
        <EditableTextSlot
          tagName="h2"
          value={data.sectionTitle}
          onChange={(val) => updateField('sectionTitle', val)}
          isSelected={selectedPath === 'sectionTitle'}
          onSelect={() => onSelectSlot?.('sectionTitle', 'વિભાગ શિર્ષક')}
          className="text-base font-extrabold text-slate-900 tracking-wide uppercase"
        />
        <span className="font-bold text-slate-700">પાનું ૪ (BACK PAGE)</span>
      </div>

      {/* Grid 1: Sports & Entertainment (Top Half) */}
      <div className="grid grid-cols-12 gap-4 border-b-2 border-slate-900 pb-4 mb-3">
        {/* Sports Section (7 Cols) */}
        <div className="col-span-7 border-r border-slate-300 pr-3 space-y-2">
          <div className="flex justify-between items-center border-b-2 border-emerald-800 pb-1">
            <span className="font-sans font-bold text-xs text-emerald-900 uppercase tracking-wide flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-emerald-700" />
              રમત-ગમત જગત (SPORTS)
            </span>
            {onImportClick && (
              <button
                onClick={() => onImportClick('mainSportsStory', 'સ્પોર્ટ્સ સમાચાર')}
                className="text-[9px] text-blue-700 hover:underline font-sans"
              >
                ઇમ્પોર્ટ
              </button>
            )}
          </div>

          <EditableTextSlot
            tagName="h3"
            value={data.mainSportsStory.headline}
            onChange={(val) => updateField('mainSportsStory.headline', val)}
            isSelected={selectedPath === 'mainSportsStory.headline'}
            onSelect={() => onSelectSlot?.('mainSportsStory.headline', 'સ્પોર્ટ્સ હેડલાઇન')}
            className="text-xl font-black text-slate-950 leading-snug font-serif"
            maxLength={100}
          />

          <div className="bg-emerald-50 text-emerald-900 px-2 py-1 rounded text-[11px] font-sans font-bold border border-emerald-200">
            <EditableTextSlot
              value={data.matchInfo}
              onChange={(val) => updateField('matchInfo', val)}
              isSelected={selectedPath === 'matchInfo'}
              onSelect={() => onSelectSlot?.('matchInfo', 'મેચ વિગત (Match Info)')}
            />
          </div>

          <EditableImageSlot
            src={data.mainSportsStory.image}
            onImageChange={(img) => updateField('mainSportsStory.image', img)}
            isSelected={selectedPath === 'mainSportsStory.image'}
            onSelect={() => onSelectSlot?.('mainSportsStory.image', 'સ્પોર્ટ્સ ઈમેજ')}
            containerHeight="160px"
          />

          <EditableTextSlot
            value={data.mainSportsStory.articleBody}
            onChange={(val) => updateField('mainSportsStory.articleBody', val)}
            isSelected={selectedPath === 'mainSportsStory.articleBody'}
            onSelect={() => onSelectSlot?.('mainSportsStory.articleBody', 'સ્પોર્ટ્સ અહેવાલ વિગત')}
            className="text-xs leading-relaxed text-slate-800 font-serif text-justify"
            multiline
          />
        </div>

        {/* Entertainment Section (5 Cols) */}
        <div className="col-span-5 pl-1 space-y-2">
          <div className="flex justify-between items-center border-b-2 border-purple-800 pb-1">
            <span className="font-sans font-bold text-xs text-purple-900 uppercase tracking-wide flex items-center gap-1">
              <Film className="w-3.5 h-3.5 text-purple-700" />
              સિનેમા અને મનોરંજન
            </span>
            {onImportClick && (
              <button
                onClick={() => onImportClick('entertainmentStory', 'મનોરંજન સમાચાર')}
                className="text-[9px] text-blue-700 hover:underline font-sans"
              >
                ઇમ્પોર્ટ
              </button>
            )}
          </div>

          <EditableTextSlot
            tagName="h3"
            value={data.entertainmentStory.headline}
            onChange={(val) => updateField('entertainmentStory.headline', val)}
            isSelected={selectedPath === 'entertainmentStory.headline'}
            onSelect={() => onSelectSlot?.('entertainmentStory.headline', 'મનોરંજન હેડલાઇન')}
            className="text-base font-black text-slate-950 leading-snug font-serif"
            maxLength={85}
          />

          <EditableImageSlot
            src={data.entertainmentStory.image}
            onImageChange={(img) => updateField('entertainmentStory.image', img)}
            isSelected={selectedPath === 'entertainmentStory.image'}
            onSelect={() => onSelectSlot?.('entertainmentStory.image', 'મનોરંજન ઈમેજ')}
            containerHeight="145px"
          />

          <EditableTextSlot
            value={data.entertainmentStory.articleBody}
            onChange={(val) => updateField('entertainmentStory.articleBody', val)}
            isSelected={selectedPath === 'entertainmentStory.articleBody'}
            onSelect={() => onSelectSlot?.('entertainmentStory.articleBody', 'મનોરંજન વિગત')}
            className="text-xs leading-relaxed text-slate-800 font-serif"
            multiline
          />
        </div>
      </div>

      {/* Predefined 12 Zodiac Horoscope Grid */}
      <div className="bg-purple-50/50 border border-purple-200/80 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between border-b border-purple-200 pb-1 mb-2 font-sans">
          <div className="flex items-center gap-1.5 font-bold text-purple-950 text-xs">
            <Sparkles className="w-4 h-4 text-purple-700" />
            <span>દૈનિક રાશિભવિષ્ય (TODAY'S HOROSCOPE)</span>
          </div>
          {onOpenHoroscopeEditor && (
            <button
              onClick={onOpenHoroscopeEditor}
              className="text-[10px] text-purple-700 hover:underline font-semibold bg-white px-2 py-0.5 rounded border border-purple-300"
            >
              બધી ૧૨ રાશિઓ સુધારો
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 text-[10px]">
          {data.horoscope.map((item, idx) => (
            <div key={item.signEn || idx} className="bg-white p-1.5 rounded border border-purple-100 shadow-sm space-y-0.5">
              <div className="flex justify-between items-center font-bold text-purple-950 border-b border-purple-100 pb-0.5">
                <span>{item.signGu}</span>
                <span className="text-[8px] text-purple-400 font-normal">({item.signEn})</span>
              </div>
              <EditableTextSlot
                value={item.prediction}
                onChange={(val) => updateField(`horoscope.${idx}.prediction`, val)}
                isSelected={selectedPath === `horoscope.${idx}.prediction`}
                onSelect={() => onSelectSlot?.(`horoscope.${idx}.prediction`, `${item.signGu} રાશિ ભવિષ્ય`)}
                className="text-[10px] leading-tight text-slate-700 font-serif line-clamp-3"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Back Advertisement Banner */}
      <div className="mt-auto pt-2 border-t-2 border-slate-900">
        <div className="text-[9px] font-sans text-slate-400 text-center uppercase tracking-widest mb-1">
          — બેક પેજ જાહેરાત (BACK ADVERTISEMENT BANNER) —
        </div>
        <EditableImageSlot
          src={data.advertisement.image}
          onImageChange={(img) => updateField('advertisement.image', img)}
          isSelected={selectedPath === 'advertisement.image'}
          onSelect={() => onSelectSlot?.('advertisement.image', 'બેક પેજ જાહેરાત')}
          containerHeight="100px"
          alt="Back Page Advertisement Banner"
        />
      </div>
    </div>
  );
};
