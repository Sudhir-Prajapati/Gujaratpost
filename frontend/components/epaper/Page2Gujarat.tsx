'use client';

import React from 'react';
import { Page2Data } from './types';
import { EditableTextSlot } from './EditableTextSlot';
import { EditableImageSlot } from './EditableImageSlot';
import { MapPin } from 'lucide-react';

interface Page2GujaratProps {
  data: Page2Data;
  onChange: (newData: Page2Data) => void;
  selectedPath?: string;
  onSelectSlot?: (path: string, label: string) => void;
  onImportClick?: (slotPath: string, label: string) => void;
}

export const Page2Gujarat: React.FC<Page2GujaratProps> = ({
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
      {/* Top Page Header Bar */}
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
        <span className="font-bold text-slate-700">પૃષ્ઠ ૨ (PAGE 2)</span>
      </div>

      {/* Main District Spotlight Story */}
      <div className="bg-amber-50/40 border border-amber-200/80 p-4 rounded-lg mb-4 space-y-2">
        <div className="flex justify-between items-center border-b border-amber-300/60 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-red-700" />
            <span className="font-sans font-bold text-xs bg-red-800 text-white px-2 py-0.5 rounded">
              <EditableTextSlot
                value={data.mainDistrictStory.district || 'અમદાવાદ'}
                onChange={(val) => updateField('mainDistrictStory.district', val)}
                isSelected={selectedPath === 'mainDistrictStory.district'}
                onSelect={() => onSelectSlot?.('mainDistrictStory.district', 'મુખ્ય જિલ્લો')}
              />
            </span>
            <span className="text-xs text-amber-900 font-sans font-semibold">મુખ્ય અહેવાલ</span>
          </div>
          {onImportClick && (
            <button
              onClick={() => onImportClick('mainDistrictStory', 'મુખ્ય જિલ્લા અહેવાલ')}
              className="text-[10px] text-blue-700 hover:underline font-sans font-semibold bg-white px-2 py-0.5 rounded border border-blue-200"
            >
              + ઇમ્પોર્ટ
            </button>
          )}
        </div>

        <EditableTextSlot
          tagName="h3"
          value={data.mainDistrictStory.headline}
          onChange={(val) => updateField('mainDistrictStory.headline', val)}
          isSelected={selectedPath === 'mainDistrictStory.headline'}
          onSelect={() => onSelectSlot?.('mainDistrictStory.headline', 'મુખ્ય જિલ્લા હેડલાઇન')}
          className="text-2xl font-black text-slate-950 leading-snug font-serif"
          maxLength={110}
        />

        <div className="grid grid-cols-12 gap-4 pt-1">
          <div className="col-span-6">
            <EditableImageSlot
              src={data.mainDistrictStory.image}
              onImageChange={(img) => updateField('mainDistrictStory.image', img)}
              isSelected={selectedPath === 'mainDistrictStory.image'}
              onSelect={() => onSelectSlot?.('mainDistrictStory.image', 'મુખ્ય જિલ્લા ઈમેજ')}
              containerHeight="190px"
              alt="Main District Story Image"
            />
            {data.mainDistrictStory.caption && (
              <EditableTextSlot
                value={data.mainDistrictStory.caption}
                onChange={(val) => updateField('mainDistrictStory.caption', val)}
                isSelected={selectedPath === 'mainDistrictStory.caption'}
                onSelect={() => onSelectSlot?.('mainDistrictStory.caption', 'ઈમેજ કૅપ્શન')}
                className="text-[10px] text-slate-500 italic mt-1 font-sans text-center"
              />
            )}
          </div>

          <div className="col-span-6 text-xs text-slate-800 leading-relaxed font-serif text-justify">
            <EditableTextSlot
              value={data.mainDistrictStory.articleBody}
              onChange={(val) => updateField('mainDistrictStory.articleBody', val)}
              isSelected={selectedPath === 'mainDistrictStory.articleBody'}
              onSelect={() => onSelectSlot?.('mainDistrictStory.articleBody', 'મુખ્ય જિલ્લા અહેવાલ વિગત')}
              multiline
            />
          </div>
        </div>
      </div>

      {/* District Stories Grid (4 Cities: Surat, Rajkot, Vadodara, Bhavnagar) */}
      <div className="flex-1 space-y-3">
        <div className="font-sans font-bold text-xs text-slate-900 border-b-2 border-slate-900 pb-1 uppercase tracking-wider flex justify-between">
          <span>રાજ્યના પ્રમુખ જિલ્લાઓના સમાચાર</span>
          <span className="text-[10px] text-slate-500 font-normal">સુરત • રાજકોટ • વડોદરા • ભાવનગર</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {data.districtStories.map((dist, idx) => (
            <div key={dist.id || idx} className="border border-slate-200 p-3 rounded-lg bg-white shadow-sm space-y-2">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                <span className="text-[10px] font-sans font-bold bg-slate-800 text-white px-2 py-0.5 rounded flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <EditableTextSlot
                    value={dist.district || `જિલ્લો ${idx + 1}`}
                    onChange={(val) => updateField(`districtStories.${idx}.district`, val)}
                    isSelected={selectedPath === `districtStories.${idx}.district`}
                    onSelect={() => onSelectSlot?.(`districtStories.${idx}.district`, `જિલ્લો ${idx + 1} નામ`)}
                  />
                </span>
                {onImportClick && (
                  <button
                    onClick={() => onImportClick(`districtStories.${idx}`, `${dist.district || 'જિલ્લો'} સમાચાર`)}
                    className="text-[9px] text-blue-700 hover:underline font-sans"
                  >
                    ઇમ્પોર્ટ
                  </button>
                )}
              </div>

              <EditableTextSlot
                tagName="h4"
                value={dist.headline}
                onChange={(val) => updateField(`districtStories.${idx}.headline`, val)}
                isSelected={selectedPath === `districtStories.${idx}.headline`}
                onSelect={() => onSelectSlot?.(`districtStories.${idx}.headline`, `જિલ્લો ${idx + 1} હેડલાઇન`)}
                className="text-sm font-bold text-slate-900 leading-tight font-serif"
                maxLength={85}
              />

              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <EditableImageSlot
                    src={dist.image}
                    onImageChange={(img) => updateField(`districtStories.${idx}.image`, img)}
                    isSelected={selectedPath === `districtStories.${idx}.image`}
                    onSelect={() => onSelectSlot?.(`districtStories.${idx}.image`, `જિલ્લો ${idx + 1} ઈમેજ`)}
                    containerHeight="95px"
                  />
                </div>
                <div className="col-span-7 text-[11px] leading-snug text-slate-700 font-serif line-clamp-5">
                  <EditableTextSlot
                    value={dist.articleBody}
                    onChange={(val) => updateField(`districtStories.${idx}.articleBody`, val)}
                    isSelected={selectedPath === `districtStories.${idx}.articleBody`}
                    onSelect={() => onSelectSlot?.(`districtStories.${idx}.articleBody`, `જિલ્લો ${idx + 1} વિગત`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Page Footer */}
      <div className="mt-auto pt-3 border-t border-slate-300 text-[10px] font-sans text-slate-500 flex justify-between">
        <span>GUJARAT POST • DISTRICT NEWS SPECIAL</span>
        <span>પાનું ૨</span>
      </div>
    </div>
  );
};
