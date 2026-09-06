'use client';

import React from 'react';
import { ZodiacSign } from './types';
import { Sparkles } from 'lucide-react';

interface HoroscopeEditorProps {
  horoscope: ZodiacSign[];
  onChange: (newHoroscope: ZodiacSign[]) => void;
}

export const HoroscopeEditor: React.FC<HoroscopeEditorProps> = ({ horoscope, onChange }) => {
  const handlePredictionChange = (index: number, text: string) => {
    const updated = [...horoscope];
    updated[index] = {
      ...updated[index],
      prediction: text,
    };
    onChange(updated);
  };

  return (
    <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-2 text-purple-900 font-semibold text-sm border-b border-purple-200 pb-2">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <span>રાશિભવિષ્ય ૧૨ રાશિઓ (Horoscope 12 Signs)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
        {horoscope.map((item, idx) => (
          <div key={item.signEn || idx} className="bg-white p-2 rounded border border-purple-100 shadow-sm space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-purple-950">
              <span>{item.signGu}</span>
              <span className="text-[10px] text-purple-500 font-normal">({item.signEn})</span>
            </div>
            <textarea
              rows={2}
              value={item.prediction}
              onChange={(e) => handlePredictionChange(idx, e.target.value)}
              className="w-full p-1.5 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-purple-500 resize-none"
              placeholder={`${item.signGu} રાશિફળ...`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
