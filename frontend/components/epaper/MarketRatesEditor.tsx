'use client';

import React from 'react';
import { MarketRates } from './types';
import { TrendingUp, Coins, DollarSign } from 'lucide-react';

interface MarketRatesEditorProps {
  data: MarketRates;
  onChange: (newData: MarketRates) => void;
}

export const MarketRatesEditor: React.FC<MarketRatesEditorProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof MarketRates, val: string) => {
    onChange({
      ...data,
      [field]: val,
    });
  };

  return (
    <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm border-b border-amber-200 pb-2">
        <Coins className="w-4 h-4 text-amber-600" />
        <span>બજાર ભાવ સેક્શન (Market Rates)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block text-gray-700 font-medium mb-1">સોનું 24K (Gold 24K)</label>
          <input
            type="text"
            value={data.gold24k}
            onChange={(e) => handleChange('gold24k', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-amber-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">સોનું 22K (Gold 22K)</label>
          <input
            type="text"
            value={data.gold22k}
            onChange={(e) => handleChange('gold22k', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-amber-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">ચાંદી 1KG (Silver 1kg)</label>
          <input
            type="text"
            value={data.silver1kg}
            onChange={(e) => handleChange('silver1kg', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-amber-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">સેન્સેક્સ (Sensex)</label>
          <input
            type="text"
            value={data.sensex}
            onChange={(e) => handleChange('sensex', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-amber-500 bg-white"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-gray-700 font-medium mb-1">નિફ્ટી (Nifty)</label>
          <input
            type="text"
            value={data.nifty}
            onChange={(e) => handleChange('nifty', e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-amber-500 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
