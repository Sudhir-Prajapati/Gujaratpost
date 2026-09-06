'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Newspaper,
  Save,
  Send,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Upload,
  ArrowLeft,
  Coins,
  Sparkles,
  Layers,
} from 'lucide-react';
import { NewspaperTemplateData, getDefaultTemplateData } from './types';
import { Page1Front } from './Page1Front';
import { Page2Gujarat } from './Page2Gujarat';
import { Page3Business } from './Page3Business';
import { Page4Sports } from './Page4Sports';
import { MarketRatesEditor } from './MarketRatesEditor';
import { HoroscopeEditor } from './HoroscopeEditor';
import { ArticleImportModal } from './ArticleImportModal';
import { renderElementToDataUrl } from './HighResExporter';

interface NewspaperTemplateBuilderProps {
  initialData?: NewspaperTemplateData | null;
  city: string;
  cityGu?: string;
  date: string;
  onSaveDraft: (templateData: NewspaperTemplateData, pageImages: string[]) => Promise<void>;
  onPublish: (templateData: NewspaperTemplateData, pageImages: string[]) => Promise<void>;
  onBackToDashboard: () => void;
}

export const NewspaperTemplateBuilder: React.FC<NewspaperTemplateBuilderProps> = ({
  initialData,
  city,
  cityGu,
  date,
  onSaveDraft,
  onPublish,
  onBackToDashboard,
}) => {
  const [data, setData] = useState<NewspaperTemplateData>(() => {
    if (initialData && initialData.page1) return initialData;
    return getDefaultTemplateData(cityGu || city, date);
  });

  const [activePage, setActivePage] = useState<1 | 2 | 3 | 4>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedPath, setSelectedPath] = useState<string>('leadStory.headline');
  const [selectedLabel, setSelectedLabel] = useState<string>('મુખ્ય સમાચાર હેડલાઇન');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Modals & Drawers
  const [articleImportOpen, setArticleImportOpen] = useState(false);
  const [importTargetSlot, setImportTargetSlot] = useState<{ path: string; label: string }>({
    path: 'leadStory',
    label: 'મુખ્ય સમાચાર (Lead Story)',
  });
  const [horoscopeModalOpen, setHoroscopeModalOpen] = useState(false);
  const [fullPreviewModalOpen, setFullPreviewModalOpen] = useState(false);
  const [validationWarningModalOpen, setValidationWarningModalOpen] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Refs for exporting page elements
  const pageRef = useRef<HTMLDivElement>(null);

  // Sync city/date when props change
  useEffect(() => {
    if (city || date) {
      setData((prev) => ({
        ...prev,
        page1: {
          ...prev.page1,
          city: cityGu || city || prev.page1.city,
          date: date || prev.page1.date,
        },
      }));
    }
  }, [city, cityGu, date]);

  // Selected slot helper to extract current field value
  const getNestedValue = (obj: any, path: string) => {
    if (!obj || !path) return '';
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current === undefined || current === null) return '';
      current = current[key];
    }
    return current ?? '';
  };

  const updateNestedValue = (path: string, value: any) => {
    const keys = path.split('.');
    const clone = JSON.parse(JSON.stringify(data));
    let pageKey: keyof NewspaperTemplateData = `page${activePage}` as any;
    let current = clone[pageKey];
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setData(clone);
  };

  const handleSelectSlot = (path: string, label: string) => {
    setSelectedPath(path);
    setSelectedLabel(label);
  };

  const handleOpenImport = (path: string, label: string) => {
    setImportTargetSlot({ path, label });
    setArticleImportOpen(true);
  };

  const handleImportSelectedArticle = (article: {
    headline: string;
    subheadline?: string;
    articleBody: string;
    image: string;
    category: string;
  }) => {
    const { path } = importTargetSlot;
    const pageKey: keyof NewspaperTemplateData = `page${activePage}` as any;
    const clone = JSON.parse(JSON.stringify(data));

    // Determine path targets
    let targetObj = clone[pageKey];
    const keys = path.split('.');
    for (const k of keys) {
      targetObj = targetObj[k];
    }

    if (targetObj) {
      if (article.headline) targetObj.headline = article.headline;
      if (article.subheadline && targetObj.subheadline !== undefined) targetObj.subheadline = article.subheadline;
      if (article.articleBody) targetObj.articleBody = article.articleBody;
      if (article.image) targetObj.image = article.image;
      if (article.category && targetObj.category !== undefined) targetObj.category = article.category;
    }

    setData(clone);
  };

  // Run newspaper content validation
  const validateTemplate = (): string[] => {
    const warnings: string[] = [];

    // Page 1 validation
    if (!data.page1.leadStory.headline?.trim()) {
      warnings.push('પેજ ૧: મુખ્ય સમાચાર હેડલાઇન ખાલી છે.');
    }
    if (!data.page1.leadStory.image) {
      warnings.push('પેજ ૧: મુખ્ય સમાચાર ઈમેજ અપલોડ કરેલ નથી.');
    }

    // Page 2 validation
    if (!data.page2.mainDistrictStory.headline?.trim()) {
      warnings.push('પેજ ૨: મુખ્ય જિલ્લા હેડલાઇન ખાલી છે.');
    }

    // Page 3 validation
    if (!data.page3.businessStory.headline?.trim()) {
      warnings.push('પેજ ૩: બિઝનેસ સમાચાર હેડલાઇન ખાલી છે.');
    }

    // Page 4 validation
    if (!data.page4.mainSportsStory.headline?.trim()) {
      warnings.push('પેજ ૪: સ્પોર્ટ્સ હેડલાઇન ખાલી છે.');
    }

    return warnings;
  };

  // Generate images for all 4 pages
  const captureAllPageImages = async (): Promise<string[]> => {
    if (!pageRef.current) return [];
    try {
      const dataUrl = await renderElementToDataUrl(pageRef.current, 2);
      return [dataUrl, dataUrl, dataUrl, dataUrl];
    } catch (err) {
      console.warn('Page capture notice:', err);
      return [];
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const images = await captureAllPageImages();
      await onSaveDraft(data, images);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishClick = () => {
    const warnings = validateTemplate();
    if (warnings.length > 0) {
      setValidationWarnings(warnings);
      setValidationWarningModalOpen(true);
    } else {
      executePublish();
    }
  };

  const executePublish = async () => {
    setValidationWarningModalOpen(false);
    setPublishing(true);
    try {
      const images = await captureAllPageImages();
      await onPublish(data, images);
    } finally {
      setPublishing(false);
    }
  };

  const currentPageData = data[`page${activePage}` as keyof NewspaperTemplateData];
  const currentValue = getNestedValue(currentPageData, selectedPath);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* 1. TOP BUILDER TOOLBAR HEADER */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>પાછા જાઓ</span>
          </button>

          <div className="h-5 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-red-500" />
            <div>
              <h2 className="text-sm font-bold text-white leading-none">
                4-પૃષ્ઠ ગુજરાતી અખબાર ટેમ્પલેટ બિલ્ડર
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {cityGu || city} આવૃત્તિ • {date}
              </p>
            </div>
          </div>
        </div>

        {/* Center Page Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          {([1, 2, 3, 4] as const).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => {
                setActivePage(pageNum);
                setSelectedPath(
                  pageNum === 1
                    ? 'leadStory.headline'
                    : pageNum === 2
                    ? 'mainDistrictStory.headline'
                    : pageNum === 3
                    ? 'businessStory.headline'
                    : 'mainSportsStory.headline'
                );
              }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                activePage === pageNum
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>પૃષ્ઠ {pageNum}</span>
            </button>
          ))}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 mr-2 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300 min-w-[45px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setFullPreviewModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>ફુલ પ્રીવ્યુ</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={saving || publishing}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-blue-400" />}
            <span>ડ્રાફ્ટ સેવ</span>
          </button>

          <button
            onClick={handlePublishClick}
            disabled={saving || publishing}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-1.5 rounded-lg font-bold shadow-lg shadow-red-900/30 transition-colors disabled:opacity-50"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>અખબાર પબ્લિશ કરો</span>
          </button>
        </div>
      </header>

      {/* 2. DUAL PANE CONTAINER */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: INSPECTOR & CONTENT EDITORS */}
        <div className="w-[360px] bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-400" />
                પસંદ કરેલ સ્લોટ સુધારો
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                {selectedLabel || selectedPath}
              </span>
            </div>

            {/* Field Input Editor */}
            {selectedPath.includes('image') ? (
              <div className="space-y-2">
                <label className="block text-xs text-slate-300 font-medium">ઈમેજ URL અથવા અપલોડ કરો</label>
                <input
                  type="text"
                  value={typeof currentValue === 'string' ? currentValue : ''}
                  onChange={(e) => updateNestedValue(selectedPath, e.target.value)}
                  placeholder="https://... ઈમેજ લિંક મૂકો"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <label className="flex-1 bg-blue-600/80 hover:bg-blue-600 text-white text-xs py-2 rounded-lg font-medium cursor-pointer text-center flex items-center justify-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>નવી ઈમેજ અપલોડ</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              updateNestedValue(selectedPath, ev.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs text-slate-300 font-medium">લખાણ કન્ટેન્ટ (Gujarati Text)</label>
                {selectedPath.includes('Body') || selectedPath.includes('editorialText') || selectedPath.includes('article') ? (
                  <textarea
                    rows={6}
                    value={typeof currentValue === 'string' ? currentValue : ''}
                    onChange={(e) => updateNestedValue(selectedPath, e.target.value)}
                    placeholder="અહી ગુજરાતી સમાચાર લખાણ લખો..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed"
                  />
                ) : (
                  <input
                    type="text"
                    value={typeof currentValue === 'string' ? currentValue : ''}
                    onChange={(e) => updateNestedValue(selectedPath, e.target.value)}
                    placeholder="અહી શિર્ષક / હેડલાઇન લખો..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                )}
              </div>
            )}
          </div>

          {/* Quick Import Button */}
          <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-blue-200">વેબસાઇટ આર્ટિકલ ઇમ્પોર્ટ</h4>
              <p className="text-[10px] text-blue-400/80">૧-ક્લિકમાં સમાચાર ભરો</p>
            </div>
            <button
              onClick={() => handleOpenImport(selectedPath.split('.')[0] || 'leadStory', selectedLabel)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              ઇમ્પોર્ટ
            </button>
          </div>

          {/* Page Specific Dedicated Editors */}
          {activePage === 3 && (
            <MarketRatesEditor
              data={data.page3.marketRates}
              onChange={(newRates) =>
                setData((prev) => ({
                  ...prev,
                  page3: {
                    ...prev.page3,
                    marketRates: newRates,
                  },
                }))
              }
            />
          )}

          {activePage === 4 && (
            <HoroscopeEditor
              horoscope={data.page4.horoscope}
              onChange={(newHoro) =>
                setData((prev) => ({
                  ...prev,
                  page4: {
                    ...prev.page4,
                    horoscope: newHoro,
                  },
                }))
              }
            />
          )}
        </div>

        {/* RIGHT PANEL: LIVE NEWSPAPER PREVIEW CANAVAS */}
        <div className="flex-1 bg-slate-900 overflow-auto flex justify-center p-8">
          <div
            className="transition-transform duration-200 origin-top shrink-0"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            <div ref={pageRef}>
              {activePage === 1 && (
                <Page1Front
                  data={data.page1}
                  onChange={(page1) => setData((prev) => ({ ...prev, page1 }))}
                  selectedPath={selectedPath}
                  onSelectSlot={handleSelectSlot}
                  onImportClick={handleOpenImport}
                />
              )}
              {activePage === 2 && (
                <Page2Gujarat
                  data={data.page2}
                  onChange={(page2) => setData((prev) => ({ ...prev, page2 }))}
                  selectedPath={selectedPath}
                  onSelectSlot={handleSelectSlot}
                  onImportClick={handleOpenImport}
                />
              )}
              {activePage === 3 && (
                <Page3Business
                  data={data.page3}
                  onChange={(page3) => setData((prev) => ({ ...prev, page3 }))}
                  selectedPath={selectedPath}
                  onSelectSlot={handleSelectSlot}
                  onImportClick={handleOpenImport}
                />
              )}
              {activePage === 4 && (
                <Page4Sports
                  data={data.page4}
                  onChange={(page4) => setData((prev) => ({ ...prev, page4 }))}
                  selectedPath={selectedPath}
                  onSelectSlot={handleSelectSlot}
                  onImportClick={handleOpenImport}
                  onOpenHoroscopeEditor={() => setHoroscopeModalOpen(true)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ARTICLE IMPORT MODAL */}
      <ArticleImportModal
        isOpen={articleImportOpen}
        onClose={() => setArticleImportOpen(false)}
        onSelectArticle={handleImportSelectedArticle}
        targetSlotLabel={importTargetSlot.label}
      />

      {/* VALIDATION WARNING MODAL */}
      {validationWarningModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>પબ્લિશ કરતા અગાઉ ચેતવણી (Validation Warning)</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-48 overflow-y-auto">
              {validationWarnings.map((warn, idx) => (
                <div key={idx} className="flex items-start gap-2 text-amber-200">
                  <span className="text-amber-400">•</span>
                  <span>{warn}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400">
              તમે આ સુધારા કરી શકો છો અથવા તો અત્યારે જ પબ્લિશ કરી શકો છો.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setValidationWarningModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                સુધારો કરવા પાછા જાઓ
              </button>
              <button
                onClick={executePublish}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md"
              >
                છતાં પણ પબ્લિશ કરો
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
