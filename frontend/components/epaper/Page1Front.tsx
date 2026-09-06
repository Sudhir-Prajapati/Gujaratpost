'use client';

import React from 'react';
import { Page1Data } from './types';
import { EditableTextSlot } from './EditableTextSlot';
import { EditableImageSlot } from './EditableImageSlot';
import { Upload } from 'lucide-react';

interface Page1FrontProps {
  data: Page1Data;
  onChange: (newData: Page1Data) => void;
  selectedPath?: string;
  onSelectSlot?: (path: string, label: string) => void;
  onImportClick?: (slotPath: string, label: string) => void;
}

export const Page1Front: React.FC<Page1FrontProps> = ({
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
      {/* 1. Top Notice Header */}
      <div className="border-b border-slate-800 pb-1 mb-2 flex justify-between items-center text-[10px] text-slate-700 font-sans tracking-wide">
        <EditableTextSlot
          value={data.headerNotice}
          onChange={(val) => updateField('headerNotice', val)}
          isSelected={selectedPath === 'headerNotice'}
          onSelect={() => onSelectSlot?.('headerNotice', 'હેડર સૂચના')}
          className="font-medium text-slate-800"
          maxLength={90}
        />
        <div className="flex gap-3 font-semibold text-slate-900 shrink-0">
          <span>ઈ-પેપર આવૃત્તિ</span>
          <span>•</span>
          <span>પૃષ્ઠ ૧ (FRONT PAGE)</span>
        </div>
      </div>

      {/* 2. Main Masthead Header */}
      <div className="border-y-2 border-slate-900 py-3 mb-3 text-center bg-amber-50/20">
        <div className="flex justify-between items-end px-2 border-b border-slate-400 pb-2 mb-2 font-sans text-xs">
          <div className="text-left space-y-0.5">
            <span className="font-bold text-red-700 block text-xs">સ્થળ:</span>
            <EditableTextSlot
              value={data.city}
              onChange={(val) => updateField('city', val)}
              isSelected={selectedPath === 'city'}
              onSelect={() => onSelectSlot?.('city', 'શહેર / મથક')}
              className="font-bold text-slate-900 text-xs"
            />
          </div>

          <div className="text-center">
            <EditableTextSlot
              value={data.mastheadTagline}
              onChange={(val) => updateField('mastheadTagline', val)}
              isSelected={selectedPath === 'mastheadTagline'}
              onSelect={() => onSelectSlot?.('mastheadTagline', 'ટૅગલાઇન')}
              className="text-xs italic text-slate-700 font-semibold"
            />
          </div>

          <div className="text-right space-y-0.5">
            <span className="font-bold text-red-700 block text-xs">કિંમત:</span>
            <EditableTextSlot
              value={data.price}
              onChange={(val) => updateField('price', val)}
              isSelected={selectedPath === 'price'}
              onSelect={() => onSelectSlot?.('price', 'કિંમત')}
              className="font-bold text-slate-900 text-xs"
            />
          </div>
        </div>

        {/* Big Masthead Title */}
        <div className="my-1">
          <EditableTextSlot
            tagName="h1"
            value={data.mastheadTitle}
            onChange={(val) => updateField('mastheadTitle', val)}
            isSelected={selectedPath === 'mastheadTitle'}
            onSelect={() => onSelectSlot?.('mastheadTitle', 'માસ્ટહેડ શિર્ષક')}
            className="text-5xl font-extrabold tracking-tight text-red-800 font-serif drop-shadow-sm leading-tight text-center"
          />
        </div>

        {/* Date & Edition Metadata Bar */}
        <div className="flex justify-between items-center px-4 border-t border-slate-900 pt-1.5 mt-2 font-sans text-xs font-bold text-slate-800">
          <EditableTextSlot
            value={data.date}
            onChange={(val) => updateField('date', val)}
            isSelected={selectedPath === 'date'}
            onSelect={() => onSelectSlot?.('date', 'તારીખ')}
            className="text-slate-900"
          />
          <EditableTextSlot
            value={data.editionInfo}
            onChange={(val) => updateField('editionInfo', val)}
            isSelected={selectedPath === 'editionInfo'}
            onSelect={() => onSelectSlot?.('editionInfo', 'આવૃત્તિ વિગત')}
            className="text-slate-800"
          />
        </div>
      </div>

      {/* 3. Main Lead Story & Secondary Grid Layout */}
      <div className="grid grid-cols-12 gap-4 border-b-2 border-slate-900 pb-4 mb-3 flex-1">
        {/* Left Column: Lead Story (8 Cols) */}
        <div className="col-span-8 pr-3 border-r border-slate-300 space-y-2">
          <div className="flex justify-between items-center">
            <span className="bg-red-800 text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded tracking-wider uppercase">
              <EditableTextSlot
                value={data.leadStory.category}
                onChange={(val) => updateField('leadStory.category', val)}
                isSelected={selectedPath === 'leadStory.category'}
                onSelect={() => onSelectSlot?.('leadStory.category', 'મુખ્ય સમાચાર કેટેગરી')}
              />
            </span>
            {onImportClick && (
              <button
                onClick={() => onImportClick('leadStory', 'મુખ્ય સમાચાર (Lead Story)')}
                className="text-[10px] text-blue-700 hover:underline font-sans font-semibold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
              >
                + વેબસાઇટ પરથી ઇમ્પોર્ટ કરો
              </button>
            )}
          </div>

          <EditableTextSlot
            tagName="h2"
            value={data.leadStory.headline}
            onChange={(val) => updateField('leadStory.headline', val)}
            isSelected={selectedPath === 'leadStory.headline'}
            onSelect={() => onSelectSlot?.('leadStory.headline', 'મુખ્ય સમાચાર હેડલાઇન')}
            className="text-2xl font-black text-slate-950 leading-snug font-serif"
            maxLength={110}
          />

          <EditableTextSlot
            tagName="h3"
            value={data.leadStory.subheadline || ''}
            onChange={(val) => updateField('leadStory.subheadline', val)}
            isSelected={selectedPath === 'leadStory.subheadline'}
            onSelect={() => onSelectSlot?.('leadStory.subheadline', 'મુખ્ય સમાચાર સબહેડલાઇન')}
            className="text-xs font-bold text-slate-700 leading-relaxed font-sans italic"
            maxLength={130}
          />

          {/* Lead Image Slot */}
          <div className="my-2">
            <EditableImageSlot
              src={data.leadStory.image}
              onImageChange={(img) => updateField('leadStory.image', img)}
              isSelected={selectedPath === 'leadStory.image'}
              onSelect={() => onSelectSlot?.('leadStory.image', 'મુખ્ય સમાચાર ઈમેજ')}
              containerHeight="220px"
              alt="Lead Story Image"
            />
            {data.leadStory.caption && (
              <EditableTextSlot
                value={data.leadStory.caption}
                onChange={(val) => updateField('leadStory.caption', val)}
                isSelected={selectedPath === 'leadStory.caption'}
                onSelect={() => onSelectSlot?.('leadStory.caption', 'ઈમેજ કૅપ્શન')}
                className="text-[10px] text-slate-500 italic mt-1 font-sans text-center"
              />
            )}
          </div>

          {/* Lead Article Body (Multi-column effect) */}
          <div className="text-xs leading-relaxed text-slate-800 font-serif text-justify columns-2 gap-3 pt-1 border-t border-slate-200">
            <EditableTextSlot
              value={data.leadStory.articleBody}
              onChange={(val) => updateField('leadStory.articleBody', val)}
              isSelected={selectedPath === 'leadStory.articleBody'}
              onSelect={() => onSelectSlot?.('leadStory.articleBody', 'મુખ્ય સમાચાર વિગત')}
              multiline
            />
          </div>
        </div>

        {/* Right Column: Secondary Stories (4 Cols) */}
        <div className="col-span-4 pl-1 space-y-4">
          <div className="border-b-2 border-red-800 pb-1 font-sans font-bold text-xs text-red-800 uppercase tracking-wide">
            વિશેષ અહેવાલ
          </div>

          {data.secondaryStories.map((sec, idx) => (
            <div key={sec.id || idx} className="space-y-2 border-b border-slate-200 pb-3 last:border-b-0">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-sans font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                  <EditableTextSlot
                    value={sec.category}
                    onChange={(val) => updateField(`secondaryStories.${idx}.category`, val)}
                    isSelected={selectedPath === `secondaryStories.${idx}.category`}
                    onSelect={() => onSelectSlot?.(`secondaryStories.${idx}.category`, `ગૌણ સમાચાર ${idx + 1} કેટેગરી`)}
                  />
                </span>
                {onImportClick && (
                  <button
                    onClick={() => onImportClick(`secondaryStories.${idx}`, `ગૌણ સમાચાર ${idx + 1}`)}
                    className="text-[9px] text-blue-700 hover:underline font-sans"
                  >
                    ઇમ્પોર્ટ
                  </button>
                )}
              </div>

              <EditableTextSlot
                tagName="h4"
                value={sec.headline}
                onChange={(val) => updateField(`secondaryStories.${idx}.headline`, val)}
                isSelected={selectedPath === `secondaryStories.${idx}.headline`}
                onSelect={() => onSelectSlot?.(`secondaryStories.${idx}.headline`, `ગૌણ સમાચાર ${idx + 1} હેડલાઇન`)}
                className="text-sm font-bold text-slate-900 leading-snug font-serif"
                maxLength={85}
              />

              <EditableImageSlot
                src={sec.image}
                onImageChange={(img) => updateField(`secondaryStories.${idx}.image`, img)}
                isSelected={selectedPath === `secondaryStories.${idx}.image`}
                onSelect={() => onSelectSlot?.(`secondaryStories.${idx}.image`, `ગૌણ સમાચાર ${idx + 1} ઈમેજ`)}
                containerHeight="110px"
              />

              <EditableTextSlot
                value={sec.articleBody}
                onChange={(val) => updateField(`secondaryStories.${idx}.articleBody`, val)}
                isSelected={selectedPath === `secondaryStories.${idx}.articleBody`}
                onSelect={() => onSelectSlot?.(`secondaryStories.${idx}.articleBody`, `ગૌણ સમાચાર ${idx + 1} વિગત`)}
                className="text-[11px] leading-snug text-slate-700 font-serif line-clamp-4"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Bottom News Cards Section (3 Columns) */}
      <div className="mb-3">
        <div className="font-sans font-bold text-xs text-slate-900 border-b border-slate-900 pb-1 mb-2 uppercase tracking-wider flex justify-between">
          <span>જિલ્લા અને સ્થાનિક અહેવાલ</span>
          <span className="text-[10px] text-slate-500 font-normal">સૌજન્ય: ગુજરાત પોસ્ટ નેટવર્ક</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {data.bottomStories.map((bot, idx) => (
            <div key={bot.id || idx} className="bg-slate-50/60 border border-slate-200 p-2 rounded space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-sans font-bold bg-amber-100 text-amber-900 px-1 py-0.5 rounded">
                  <EditableTextSlot
                    value={bot.category}
                    onChange={(val) => updateField(`bottomStories.${idx}.category`, val)}
                    isSelected={selectedPath === `bottomStories.${idx}.category`}
                    onSelect={() => onSelectSlot?.(`bottomStories.${idx}.category`, `તળિયા સમાચાર ${idx + 1} કેટેગરી`)}
                  />
                </span>
              </div>

              <EditableImageSlot
                src={bot.image}
                onImageChange={(img) => updateField(`bottomStories.${idx}.image`, img)}
                isSelected={selectedPath === `bottomStories.${idx}.image`}
                onSelect={() => onSelectSlot?.(`bottomStories.${idx}.image`, `તળિયા સમાચાર ${idx + 1} ઈમેજ`)}
                containerHeight="85px"
              />

              <EditableTextSlot
                tagName="h4"
                value={bot.headline}
                onChange={(val) => updateField(`bottomStories.${idx}.headline`, val)}
                isSelected={selectedPath === `bottomStories.${idx}.headline`}
                onSelect={() => onSelectSlot?.(`bottomStories.${idx}.headline`, `તળિયા સમાચાર ${idx + 1} હેડલાઇન`)}
                className="text-xs font-bold text-slate-900 leading-tight font-serif"
                maxLength={65}
              />

              <EditableTextSlot
                value={bot.articleBody}
                onChange={(val) => updateField(`bottomStories.${idx}.articleBody`, val)}
                isSelected={selectedPath === `bottomStories.${idx}.articleBody`}
                onSelect={() => onSelectSlot?.(`bottomStories.${idx}.articleBody`, `તળિયા સમાચાર ${idx + 1} વિગત`)}
                className="text-[10px] leading-tight text-slate-600 font-serif line-clamp-3"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 5. Predefined Bottom Advertisement Slot */}
      <div className="mt-auto pt-2 border-t-2 border-slate-900">
        <div className="text-[9px] font-sans text-slate-400 text-center uppercase tracking-widest mb-1">
          — જાહેરાત (ADVERTISEMENT) —
        </div>
        <EditableImageSlot
          src={data.advertisement.image}
          onImageChange={(img) => updateField('advertisement.image', img)}
          isSelected={selectedPath === 'advertisement.image'}
          onSelect={() => onSelectSlot?.('advertisement.image', 'ફ્રન્ટ પેજ જાહેરાત')}
          containerHeight="90px"
          alt="Front Page Advertisement Banner"
        />
      </div>
    </div>
  );
};
