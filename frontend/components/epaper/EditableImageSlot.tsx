'use client';

import React, { useRef } from 'react';
import { Image as ImageIcon, Upload, RefreshCw, Trash2 } from 'lucide-react';

interface EditableImageSlotProps {
  src: string;
  onImageChange: (newSrc: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  aspectRatio?: string; // e.g. '16/9', '4/3', '1/1'
  className?: string;
  containerHeight?: string;
  alt?: string;
}

export const EditableImageSlot: React.FC<EditableImageSlotProps> = ({
  src,
  onImageChange,
  isSelected,
  onSelect,
  aspectRatio,
  className = '',
  containerHeight,
  alt = 'Newspaper Slot Image',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) onSelect();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImageChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative overflow-hidden bg-slate-100 transition-all cursor-pointer rounded border ${
        isSelected
          ? 'ring-2 ring-blue-600 border-blue-600'
          : 'border-slate-300 hover:border-amber-500'
      } ${className}`}
      style={{
        aspectRatio: aspectRatio || undefined,
        height: containerHeight || undefined,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover block select-none pointer-events-none transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-3 text-slate-400 bg-slate-50 border-2 border-dashed border-slate-300">
          <ImageIcon className="w-8 h-8 mb-1 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">ઈમેજ અપલોડ કરો</span>
        </div>
      )}

      {/* Action Overlay on Hover/Select */}
      <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center gap-2 transition-opacity duration-200 ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
          title="નવી ઈમેજ અપલોડ કરો"
        >
          <Upload className="w-4 h-4" />
        </button>

        {src && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onImageChange('');
            }}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
            title="ઈમેજ દૂર કરો"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
