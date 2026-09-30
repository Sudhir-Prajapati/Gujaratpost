'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  group?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  required = false,
  searchable = true,
  disabled = false,
  error = false,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected item label
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen, searchable]);

  // Filter options based on search query
  const filteredOptions = options.filter((opt) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase().trim();
    return (
      opt.label.toLowerCase().includes(query) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(query)) ||
      opt.value.toLowerCase().includes(query)
    );
  });

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for native HTML form validation if required */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required={required}
          className="sr-only pointer-events-none opacity-0 h-0 w-0 absolute"
          tabIndex={-1}
        />
      )}

      {/* Main Select Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded-xl border px-4 py-3 text-left text-base font-semibold flex items-center justify-between transition-all duration-200 outline-none shadow-sm ${
          error
            ? 'border-2 border-red-500 bg-red-50/80 text-red-900 ring-2 ring-red-500/20 dark:border-red-600 dark:bg-red-950/40 dark:text-red-200'
            : isOpen
              ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-zinc-900 dark:border-primary'
              : 'border-gray-400 bg-white hover:border-gray-500 dark:border-zinc-600 dark:bg-zinc-950/40 dark:hover:bg-zinc-900/60'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={`truncate ${selectedOption ? 'text-gray-900 dark:text-zinc-100 font-bold' : 'text-gray-500 dark:text-zinc-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-600 transition-transform duration-200 shrink-0 ml-2 dark:text-zinc-400 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl border border-gray-400 bg-white p-2 shadow-xl dark:border-zinc-600 dark:bg-zinc-900 animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Box (if searchable & options > 4) */}
          {searchable && options.length > 4 && (
            <div className="relative mb-2 px-1">
              <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="w-full rounded-lg border border-gray-400 bg-zinc-50 py-1.5 pl-8 pr-7 text-sm placeholder:text-gray-500 focus:border-primary focus:outline-none dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Options List with Custom Scrollbar */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-zinc-400 font-medium">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold'
                        : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="truncate flex items-center gap-1.5">
                      <span>{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-zinc-400 font-normal">({opt.sublabel})</span>
                      )}
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-red-600 dark:text-red-400" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
