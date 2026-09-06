'use client';

import React from 'react';
import { Page3Data } from './types';
import { EditableTextSlot } from './EditableTextSlot';
import { EditableImageSlot } from './EditableImageSlot';
import { Coins, TrendingUp, UserCheck } from 'lucide-react';

interface Page3BusinessProps {
  data: Page3Data;
  onChange: (newData: Page3Data) => void;
  selectedPath?: string;
  onSelectSlot?: (path: string, label: string) => void;
  onImportClick?: (slotPath: string, label: string) => void;
}

export const Page3Business: React.FC<Page3BusinessProps> = ({
  data,
  onChange,
  selectedPath,
  onSelectSlot,
  onImportClick,
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
        <span className="font-bold text-slate-700">પૃષ્ઠ ૩ (PAGE 3)</span>
      </div>

      {/* Main Grid: Business & Politics (Top Half) */}
      <div className="grid grid-cols-12 gap-4 border-b-2 border-slate-900 pb-4 mb-4">
        {/* Business Section (6 Cols) */}
        <div className="col-span-6 border-r border-slate-300 pr-3 space-y-2">
          <div className="flex justify-between items-center border-b-2 border-blue-900 pb-1">
            <span className="font-sans font-bold text-xs text-blue-900 uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
              બિઝનેસ અને અર્થતંત્ર
            </span>
            {onImportClick && (
              <button
                onClick={() => onImportClick('businessStory', 'બિઝનેસ સમાચાર')}
                className="text-[9px] text-blue-700 hover:underline font-sans"
              >
                ઇમ્પોર્ટ
              </button>
            )}
          </div>

          <EditableTextSlot
            tagName="h3"
            value={data.businessStory.headline}
            onChange={(val) => updateField('businessStory.headline', val)}
            isSelected={selectedPath === 'businessStory.headline'}
            onSelect={() => onSelectSlot?.('businessStory.headline', 'બિઝનેસ હેડલાઇન')}
            className="text-lg font-black text-slate-950 leading-snug font-serif"
            maxLength={90}
          />

          <EditableImageSlot
            src={data.businessStory.image}
            onImageChange={(img) => updateField('businessStory.image', img)}
            isSelected={selectedPath === 'businessStory.image'}
            onSelect={() => onSelectSlot?.('businessStory.image', 'બિઝનેસ ઈમેજ')}
            containerHeight="140px"
          />

          <EditableTextSlot
            value={data.businessStory.articleBody}
            onChange={(val) => updateField('businessStory.articleBody', val)}
            isSelected={selectedPath === 'businessStory.articleBody'}
            onSelect={() => onSelectSlot?.('businessStory.articleBody', 'બિઝનેસ અહેવાલ વિગત')}
            className="text-xs leading-relaxed text-slate-800 font-serif text-justify"
            multiline
          />
        </div>

        {/* Politics Section (6 Cols) */}
        <div className="col-span-6 pl-1 space-y-2">
          <div className="flex justify-between items-center border-b-2 border-red-900 pb-1">
            <span className="font-sans font-bold text-xs text-red-900 uppercase tracking-wide">
              રાજકારણ અને રાષ્ટ્રીય નીતિઓ
            </span>
            {onImportClick && (
              <button
                onClick={() => onImportClick('politicsStory', 'રાજકારણ સમાચાર')}
                className="text-[9px] text-blue-700 hover:underline font-sans"
              >
                ઇમ્પોર્ટ
              </button>
            )}
          </div>

          <EditableTextSlot
            tagName="h3"
            value={data.politicsStory.headline}
            onChange={(val) => updateField('politicsStory.headline', val)}
            isSelected={selectedPath === 'politicsStory.headline'}
            onSelect={() => onSelectSlot?.('politicsStory.headline', 'રાજકારણ હેડલાઇન')}
            className="text-lg font-black text-slate-950 leading-snug font-serif"
            maxLength={90}
          />

          <EditableImageSlot
            src={data.politicsStory.image}
            onImageChange={(img) => updateField('politicsStory.image', img)}
            isSelected={selectedPath === 'politicsStory.image'}
            onSelect={() => onSelectSlot?.('politicsStory.image', 'રાજકારણ ઈમેજ')}
            containerHeight="140px"
          />

          <EditableTextSlot
            value={data.politicsStory.articleBody}
            onChange={(val) => updateField('politicsStory.articleBody', val)}
            isSelected={selectedPath === 'politicsStory.articleBody'}
            onSelect={() => onSelectSlot?.('politicsStory.articleBody', 'રાજકારણ વિગત')}
            className="text-xs leading-relaxed text-slate-800 font-serif text-justify"
            multiline
          />
        </div>
      </div>

      {/* Predefined Market Rates Box */}
      <div className="bg-amber-100/60 border-2 border-amber-300 rounded-lg p-3 mb-4 font-sans">
        <div className="flex items-center justify-between border-b border-amber-300 pb-1 mb-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
            <Coins className="w-4 h-4 text-amber-700" />
            <span>આજના બજાર ભાવ (TODAY'S MARKET RATES)</span>
          </div>
          <span className="text-[10px] text-amber-800 italic">લાઇવ બોલચાલ ભાવ</span>
        </div>

        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div className="bg-white p-2 rounded border border-amber-200 shadow-sm">
            <div className="text-[10px] text-slate-500 font-semibold">સોનું (24K)</div>
            <EditableTextSlot
              value={data.marketRates.gold24k}
              onChange={(val) => updateField('marketRates.gold24k', val)}
              isSelected={selectedPath === 'marketRates.gold24k'}
              onSelect={() => onSelectSlot?.('marketRates.gold24k', 'સોનું 24K')}
              className="font-bold text-amber-900 text-xs"
            />
          </div>

          <div className="bg-white p-2 rounded border border-amber-200 shadow-sm">
            <div className="text-[10px] text-slate-500 font-semibold">સોનું (22K)</div>
            <EditableTextSlot
              value={data.marketRates.gold22k}
              onChange={(val) => updateField('marketRates.gold22k', val)}
              isSelected={selectedPath === 'marketRates.gold22k'}
              onSelect={() => onSelectSlot?.('marketRates.gold22k', 'સોનું 22K')}
              className="font-bold text-amber-900 text-xs"
            />
          </div>

          <div className="bg-white p-2 rounded border border-amber-200 shadow-sm">
            <div className="text-[10px] text-slate-500 font-semibold">ચાંદી (1KG)</div>
            <EditableTextSlot
              value={data.marketRates.silver1kg}
              onChange={(val) => updateField('marketRates.silver1kg', val)}
              isSelected={selectedPath === 'marketRates.silver1kg'}
              onSelect={() => onSelectSlot?.('marketRates.silver1kg', 'ચાંદી 1KG')}
              className="font-bold text-slate-900 text-xs"
            />
          </div>

          <div className="bg-white p-2 rounded border border-amber-200 shadow-sm">
            <div className="text-[10px] text-slate-500 font-semibold">SENSEX</div>
            <EditableTextSlot
              value={data.marketRates.sensex}
              onChange={(val) => updateField('marketRates.sensex', val)}
              isSelected={selectedPath === 'marketRates.sensex'}
              onSelect={() => onSelectSlot?.('marketRates.sensex', 'સેન્સેક્સ')}
              className="font-bold text-green-700 text-xs"
            />
          </div>

          <div className="bg-white p-2 rounded border border-amber-200 shadow-sm">
            <div className="text-[10px] text-slate-500 font-semibold">NIFTY</div>
            <EditableTextSlot
              value={data.marketRates.nifty}
              onChange={(val) => updateField('marketRates.nifty', val)}
              isSelected={selectedPath === 'marketRates.nifty'}
              onSelect={() => onSelectSlot?.('marketRates.nifty', 'નિફ્ટી')}
              className="font-bold text-green-700 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Editorial / Chief Editor Section */}
      <div className="border-t-2 border-b-2 border-slate-900 py-3 mb-3 bg-slate-50/50">
        <div className="flex items-center gap-2 border-b border-slate-300 pb-1 mb-2 font-sans">
          <UserCheck className="w-4 h-4 text-red-800" />
          <span className="font-extrabold text-xs text-red-800 uppercase tracking-wide">
            તંત્રીલેખ (CHIEF EDITOR'S COLUMN)
          </span>
        </div>

        <EditableTextSlot
          tagName="h3"
          value={data.editorial.title}
          onChange={(val) => updateField('editorial.title', val)}
          isSelected={selectedPath === 'editorial.title'}
          onSelect={() => onSelectSlot?.('editorial.title', 'તંત્રીલેખ શિર્ષક')}
          className="text-lg font-black text-slate-900 mb-2 leading-snug"
        />

        <div className="flex gap-3 items-start">
          {data.editorial.authorImage && (
            <div className="shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 border-slate-400">
              <EditableImageSlot
                src={data.editorial.authorImage}
                onImageChange={(img) => updateField('editorial.authorImage', img)}
                isSelected={selectedPath === 'editorial.authorImage'}
                onSelect={() => onSelectSlot?.('editorial.authorImage', 'મુખ્ય તંત્રી ઈમેજ')}
                containerHeight="64px"
              />
            </div>
          )}

          <div className="flex-1 space-y-1">
            <div className="flex items-baseline gap-2 font-sans">
              <EditableTextSlot
                value={data.editorial.authorName}
                onChange={(val) => updateField('editorial.authorName', val)}
                isSelected={selectedPath === 'editorial.authorName'}
                onSelect={() => onSelectSlot?.('editorial.authorName', 'તંત્રીનું નામ')}
                className="font-bold text-slate-900 text-xs"
              />
              <EditableTextSlot
                value={data.editorial.authorRole}
                onChange={(val) => updateField('editorial.authorRole', val)}
                isSelected={selectedPath === 'editorial.authorRole'}
                onSelect={() => onSelectSlot?.('editorial.authorRole', 'તંત્રીનો હોદ્દો')}
                className="text-[10px] text-slate-500 italic"
              />
            </div>

            <EditableTextSlot
              value={data.editorial.editorialText}
              onChange={(val) => updateField('editorial.editorialText', val)}
              isSelected={selectedPath === 'editorial.editorialText'}
              onSelect={() => onSelectSlot?.('editorial.editorialText', 'તંત્રીલેખ વિગત')}
              className="text-xs leading-relaxed text-slate-800 italic font-serif text-justify"
              multiline
            />
          </div>
        </div>
      </div>

      {/* Mid Advertisement Slot */}
      <div className="mt-auto pt-2">
        <div className="text-[9px] font-sans text-slate-400 text-center uppercase tracking-widest mb-1">
          — જાહેરાત (ADVERTISEMENT) —
        </div>
        <EditableImageSlot
          src={data.advertisement.image}
          onImageChange={(img) => updateField('advertisement.image', img)}
          isSelected={selectedPath === 'advertisement.image'}
          onSelect={() => onSelectSlot?.('advertisement.image', 'પેજ ૩ જાહેરાત')}
          containerHeight="90px"
          alt="Page 3 Advertisement Banner"
        />
      </div>
    </div>
  );
};
