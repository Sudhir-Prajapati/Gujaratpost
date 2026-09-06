'use client';

import React from 'react';
import { Edit3 } from 'lucide-react';

interface EditableTextSlotProps {
  value: string;
  onChange: (newVal: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  maxLength?: number;
  className?: string;
  tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  placeholder?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
}

export const EditableTextSlot: React.FC<EditableTextSlotProps> = ({
  value,
  onChange,
  isSelected,
  onSelect,
  maxLength,
  className = '',
  tagName = 'p',
  placeholder = 'લખાણ દાખલ કરો...',
  style,
}) => {
  const isOverflow = maxLength ? value.length > maxLength : false;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) onSelect();
  };

  const Tag = tagName as any;

  return (
    <div
      onClick={handleClick}
      className={`group relative cursor-pointer transition-all rounded px-1 py-0.5 border border-dashed ${
        isSelected
          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-400/40'
          : isOverflow
          ? 'border-red-400 bg-red-50/40'
          : 'border-transparent hover:border-amber-400 hover:bg-amber-50/30'
      }`}
      style={style}
      title="ક્લિક કરીને લખાણ સુધારો"
    >
      <Tag className={`${className} ${!value ? 'italic text-gray-400' : ''}`}>
        {value || placeholder}
      </Tag>

      {/* Floating Edit Indicator on Hover/Select */}
      <span className={`absolute -top-2.5 -right-2 bg-blue-600 text-white rounded-full p-0.5 shadow-md text-[10px] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <Edit3 className="w-2.5 h-2.5" />
      </span>

      {/* Max length overflow warning badge */}
      {isOverflow && (
        <span className="absolute -bottom-4 right-0 bg-red-600 text-white text-[9px] px-1 rounded shadow">
          ખૂબ લાંબુ ({value.length}/{maxLength})
        </span>
      )}
    </div>
  );
};
