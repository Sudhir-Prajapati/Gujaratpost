import React, { useRef } from 'react';
import { Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { useEpaperReadOnly } from './EpaperReadOnlyContext';

interface EditableImageSlotProps {
  src?: string;
  onImageChange?: (newSrc: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  aspectRatio?: string; // e.g. '16/9', '4/3', '1/1'
  className?: string;
  containerHeight?: string;
  alt?: string;
  objectFit?: 'cover' | 'contain';
  actionsClassName?: string;
  readOnly?: boolean;
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
  objectFit = 'cover',
  actionsClassName,
  readOnly,
}) => {
  const contextReadOnly = useEpaperReadOnly();
  const isReadOnly = Boolean(readOnly ?? (contextReadOnly || (!onImageChange && !onSelect)));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fallbackNewsImage = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80';

  if (isReadOnly) {
    const effectiveSrc = (src && !src.startsWith('blob:') && src.trim().length > 0) ? src : fallbackNewsImage;
    return (
      <div
        className={`relative overflow-hidden bg-slate-100 select-none pointer-events-none ${className}`}
        style={{
          aspectRatio: aspectRatio || undefined,
          height: containerHeight || undefined,
        }}
      >
        <img
          src={effectiveSrc}
          alt={alt}
          crossOrigin="anonymous"
          onError={(e) => {
            if (e.currentTarget.src !== fallbackNewsImage) {
              e.currentTarget.src = fallbackNewsImage;
            }
          }}
          className={`w-full h-full block select-none ${
            objectFit === 'contain' ? 'object-contain' : 'object-cover'
          }`}
          style={{ width: '100%', height: '100%', objectFit }}
        />
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) onSelect();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && onImageChange) {
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
          crossOrigin="anonymous"
          onError={(e) => {
            if (e.currentTarget.src !== fallbackNewsImage) {
              e.currentTarget.src = fallbackNewsImage;
            }
          }}
          className={`w-full h-full block select-none pointer-events-none transition-transform duration-300 group-hover:scale-105 ${
            objectFit === 'contain' ? 'object-contain' : 'object-cover'
          }`}
          style={{ width: '100%', height: '100%', objectFit }}
        />
      ) : (
        <div className={`h-full flex flex-col items-center justify-center p-3 text-slate-400 bg-slate-50 border-2 border-dashed border-slate-300 ${actionsClassName || 'w-full'}`}>
          <ImageIcon className="w-8 h-8 mb-1 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">ઈમેજ અપલોડ કરો</span>
        </div>
      )}

      {/* Action Overlay on Hover/Select */}
      <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-opacity duration-200 ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <div className={`h-full flex items-center justify-center gap-2 ${actionsClassName || 'w-full'}`}>
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
                if (onImageChange) onImageChange('');
              }}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
              title="ઈમેજ દૂર કરો"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
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
