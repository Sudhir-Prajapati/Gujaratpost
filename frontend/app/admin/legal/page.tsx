'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Save,
  ExternalLink,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Bold,
  List,
  Eye,
  Edit3,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Cookie,
} from 'lucide-react';
import { getAdminLegalPage, updateAdminLegalPage } from '@/lib/api';
import { FormattedLegalText } from '@/components/legal/LegalPageClient';

interface LegalSection {
  id: string;
  title: string;
  content: string;
}

interface LegalPageForm {
  id: string;
  slug: string;
  pageTitle: string;
  lastUpdated: string;
  introText: string;
  sections: LegalSection[];
}

const TABS = [
  {
    id: 'privacy-policy',
    label: 'Privacy Policy',
    publicHref: '/privacy-policy',
    icon: ShieldCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'terms-of-use',
    label: 'Terms of Use',
    publicHref: '/terms',
    icon: Scale,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'disclaimer',
    label: 'Disclaimer',
    publicHref: '/disclaimer',
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    id: 'cookie-policy',
    label: 'Cookie Policy',
    publicHref: '/cookie-policy',
    icon: Cookie,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
  },
];

export default function AdminLegalPage() {
  const [activeTab, setActiveTab] = useState<'privacy-policy' | 'terms-of-use' | 'disclaimer' | 'cookie-policy'>('privacy-policy');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState<LegalPageForm>({
    id: 'privacy-policy',
    slug: 'privacy-policy',
    pageTitle: 'Privacy Policy',
    lastUpdated: 'Last Updated: October 2026',
    introText: '',
    sections: [],
  });

  useEffect(() => {
    loadPage(activeTab);
  }, [activeTab]);

  const loadPage = async (slug: string) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await getAdminLegalPage(slug);
      if (data) {
        setFormData({
          id: data.id || slug,
          slug: data.slug || slug,
          pageTitle: data.pageTitle || '',
          lastUpdated: data.lastUpdated || '',
          introText: data.introText || '',
          sections: (data.sections || []).map((sec: any, idx: number) => ({
            id: sec.id || `sec-${idx + 1}-${Date.now()}`,
            title: sec.title || `Point ${idx + 1}`,
            content: sec.content || '',
          })),
        });
      }
    } catch (err: any) {
      console.error('Error loading legal page:', err);
      setErrorMessage(err.message || 'Failed to load page content.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage('');
      setSaveSuccess(false);

      if (!formData.pageTitle.trim()) {
        setErrorMessage('Page title cannot be empty.');
        setSaving(false);
        return;
      }

      await updateAdminLegalPage(activeTab, {
        pageTitle: formData.pageTitle.trim(),
        lastUpdated: formData.lastUpdated.trim(),
        introText: formData.introText.trim(),
        sections: formData.sections.map((s, idx) => ({
          id: s.id || `sec-${idx + 1}`,
          title: s.title.trim(),
          content: s.content.trim(),
        })),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Error saving legal page:', err);
      setErrorMessage(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // Section manipulation helpers
  const handleAddSection = () => {
    const nextNumber = formData.sections.length + 1;
    const newSection: LegalSection = {
      id: `sec-${Date.now()}`,
      title: `${nextNumber}. `,
      content: '',
    };
    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const handleRemoveSection = (index: number) => {
    if (!confirm('Are you sure you want to remove this point?')) return;
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== index),
    }));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.sections.length) return;

    const updated = [...formData.sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setFormData((prev) => ({ ...prev, sections: updated }));
  };

  const handleSectionChange = (index: number, field: 'title' | 'content', value: string) => {
    setFormData((prev) => {
      const nextSections = [...prev.sections];
      nextSections[index] = { ...nextSections[index], [field]: value };
      return { ...prev, sections: nextSections };
    });
  };

  const insertFormatting = (index: number, formatType: 'bold' | 'bullet' | 'break') => {
    const current = formData.sections[index]?.content || '';
    let appended = '';

    if (formatType === 'bold') {
      appended = current ? `${current} **Bold Word:** ` : '**Bold Word:** ';
    } else if (formatType === 'bullet') {
      appended = current ? `${current}\n• **Key Term:** Details here` : '• **Key Term:** Details here';
    } else if (formatType === 'break') {
      appended = `${current}\n\n`;
    }

    handleSectionChange(index, 'content', appended);
  };

  const currentTabMeta = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
                Legal & Policy Pages Management
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Manage Privacy Policy, Terms of Use, Disclaimer, and Cookie Policy with custom points, bold words, and spacing.
              </p>
            </div>
          </div>
        </div>

        {/* Global Save & View Live Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href={currentTabMeta.publicHref}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View Live Page</span>
          </Link>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black shadow-md shadow-red-600/20 transition disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Status Messages ── */}
      {saveSuccess && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold animate-in fade-in">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{formData.pageTitle} has been saved successfully and is now live on the website!</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs sm:text-sm font-semibold">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Tab Bar: 3 Pages Switcher ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setViewMode('edit');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Edit Mode vs Live Preview Switcher */}
        <div className="inline-flex items-center p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'edit'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'preview'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Live Preview</span>
          </button>
        </div>
      </div>

      {/* ── Loading Spinner ── */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-zinc-500">Loading {currentTabMeta.label}...</span>
          </div>
        </div>
      ) : viewMode === 'preview' ? (
        /* ── Live Preview Mode ── */
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Live Public Page Preview ({formData.pageTitle})
              </span>
            </div>
            <button
              onClick={() => setViewMode('edit')}
              className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
            >
              Switch back to Editor
            </button>
          </div>

          <header className="space-y-2 border-b border-zinc-100 dark:border-zinc-800 pb-5">
            <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
              {formData.pageTitle}
            </h1>
            {formData.lastUpdated && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{formData.lastUpdated}</p>
            )}
          </header>

          {formData.introText && (
            <div className="prose max-w-none text-sm sm:text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
              <FormattedLegalText text={formData.introText} />
            </div>
          )}

          {formData.sections.length > 0 && (
            <div className="space-y-8 pt-2">
              {formData.sections.map((sec, idx) => (
                <div key={sec.id || idx} className="space-y-2.5 pt-2">
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                    {sec.title}
                  </h2>
                  <div className="pl-0 sm:pl-1">
                    <FormattedLegalText text={sec.content} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Edit Mode ── */
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Page Title & Effective Date */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-600" />
              <span>1. Basic Page Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Page Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pageTitle}
                  onChange={(e) => setFormData({ ...formData, pageTitle: e.target.value })}
                  placeholder="e.g. Privacy Policy"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Last Updated / Effective Date
                </label>
                <input
                  type="text"
                  value={formData.lastUpdated}
                  onChange={(e) => setFormData({ ...formData, lastUpdated: e.target.value })}
                  placeholder="e.g. Last Updated: October 2026"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Introduction Text */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Introductory Overview (Paragraphs before numbered points)
                </label>
                <span className="text-[11px] text-zinc-400">Separate paragraphs with Enter</span>
              </div>
              <textarea
                rows={4}
                value={formData.introText}
                onChange={(e) => setFormData({ ...formData, introText: e.target.value })}
                placeholder="Enter introductory paragraphs describing the purpose of this policy..."
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 leading-relaxed focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Section 2: Point-by-Point Sections List */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                  <List className="h-4 w-4 text-red-600" />
                  <span>2. Point-Wise Policy Sections ({formData.sections.length} Points)</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
                  Add numbered points with bold words and bullet points. Clean spacing between points is automatically preserved.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSection}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Add Point / Section</span>
              </button>
            </div>

            {/* List of Points */}
            <div className="space-y-5 pt-1">
              {formData.sections.map((section, index) => (
                <div
                  key={section.id || index}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 p-4 sm:p-5 space-y-3 relative group"
                >
                  {/* Point Header Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Point #{index + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => handleMoveSection(index, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveSection(index, 'down')}
                        disabled={index === formData.sections.length - 1}
                        title="Move Down"
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(index)}
                        title="Delete Point"
                        className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Point Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      Point Title (e.g. {index + 1}. Title)
                    </label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                      placeholder={`e.g. ${index + 1}. Consent of the User`}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm font-bold text-zinc-900 focus:border-red-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-100"
                    />
                  </div>

                  {/* Point Content with Toolbar */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        Point Content & Details
                      </label>

                      {/* Quick Formatting Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => insertFormatting(index, 'bold')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-200/80 dark:bg-zinc-700 hover:bg-zinc-300 text-[11px] font-bold text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                          title="Insert **Bold Word:**"
                        >
                          <Bold className="h-3 w-3" />
                          <span>Bold Word</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => insertFormatting(index, 'bullet')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-200/80 dark:bg-zinc-700 hover:bg-zinc-300 text-[11px] font-bold text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                          title="Insert • Bullet Point"
                        >
                          <List className="h-3 w-3" />
                          <span>Bullet Point</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => insertFormatting(index, 'break')}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-200/80 dark:bg-zinc-700 hover:bg-zinc-300 text-[11px] font-bold text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
                          title="Insert Space between paragraphs"
                        >
                          <span>+ Space</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={5}
                      value={section.content}
                      onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                      placeholder="Write content for this point. Use **words** for bold, or • for bullet points..."
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs sm:text-sm text-zinc-900 leading-relaxed focus:border-red-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-100 font-sans"
                    />

                    {/* Live Preview of formatted point */}
                    {section.content && (
                      <div className="mt-2.5 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                          Preview of Point #{index + 1}:
                        </span>
                        <FormattedLegalText text={section.content} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Add Point Button */}
            <button
              type="button"
              onClick={handleAddSection}
              className="w-full py-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-red-500 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Another Point / Section</span>
            </button>
          </div>

          {/* Bottom Save Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black shadow-md shadow-red-600/25 transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving {formData.pageTitle}...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save {formData.pageTitle}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
