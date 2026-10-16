'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Save,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Globe,
  Sparkles,
  Link as LinkIcon,
  ShieldCheck,
} from 'lucide-react';
import { getAdminAdvertise, updateAdminAdvertise } from '@/lib/api';

const DEFAULT_DESCRIPTION =
  'Gujarat Post is one of the premier digital media networks in Gujarat, delivering sharp, authentic, and credible journalism catering to millions of Gujarati readers across the globe. Started with a mission to bring truth and unbiased news, Gujarat Post has made a special place in the hearts of Gujarati-speaking readers. We are committed to empowering citizens by providing verified news, investigative reporting, analytical editorials, and hyperlocal updates across all 33 districts of Gujarat. We have established a commanding digital presence across Web, E-Paper, Video, and Social Platforms.';

export default function AdminAdvertisePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    pageTitle: 'Advertise With Us',
    description: DEFAULT_DESCRIPTION,
    officeAddress: 'Gujarat Post Bhavan, S.G. Highway, Prahlad Nagar, Vastrapur, Ahmedabad, Gujarat 380015',
    locationUrl: 'https://maps.google.com/?q=Gujarat+Post+Bhavan+Ahmedabad',
    contactPhone: '079 4000 4000 / +91 99099 07237',
    onlineAdsEmail: 'digital.advertising@gujaratpost.in',
    printAdsEmail: 'advt@gujaratpost.in & epaper@gujaratpost.in',
    websiteUrl: 'https://gujaratpost.in/',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getAdminAdvertise();
      if (data) {
        setFormData({
          pageTitle: data.pageTitle || 'Advertise With Us',
          description: data.description || DEFAULT_DESCRIPTION,
          officeAddress: data.officeAddress || '',
          locationUrl: data.locationUrl || '',
          contactPhone: data.contactPhone || '',
          onlineAdsEmail: data.onlineAdsEmail || '',
          printAdsEmail: data.printAdsEmail || '',
          websiteUrl: data.websiteUrl || 'https://gujaratpost.in/',
        });
      }
    } catch (err: any) {
      console.error('Error loading advertise settings:', err);
      setErrorMessage(err.message || 'Failed to load advertise settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage('');
      setSaveSuccess(false);

      await updateAdminAdvertise(formData);

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err: any) {
      console.error('Error updating advertise settings:', err);
      setErrorMessage(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading Advertise Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Advertise Page Settings
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Customize the public Advertise With Us information, address, emails, phone, and website.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/advertise"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs sm:text-sm font-semibold transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Live Page</span>
          </Link>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-600/25 transition disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-sm font-medium">
            Advertise With Us settings updated successfully! Changes are live on the public page.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div className="text-sm font-medium">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Page Title & Media Group Overview */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <Sparkles className="w-4 h-4 text-red-600" />
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              1. Title & Media Group Intro
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Page Title
            </label>
            <input
              type="text"
              value={formData.pageTitle}
              onChange={(e) => setFormData({ ...formData, pageTitle: e.target.value })}
              placeholder="Advertise With Us"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              About / Media Group Description Paragraph
            </label>
            <textarea
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe Gujarat Post, readership reach, and digital presence..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm leading-relaxed focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 2: Address & Location Link */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <MapPin className="w-4 h-4 text-red-600" />
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              2. Address & Location
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Office Address
            </label>
            <textarea
              rows={2}
              value={formData.officeAddress}
              onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
              placeholder="Gujarat Post Bhavan, S.G. Highway, Prahlad Nagar, Vastrapur, Ahmedabad, Gujarat 380015"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-red-600" />
              <span>Location (Google Maps Link)</span>
            </label>
            <input
              type="text"
              value={formData.locationUrl}
              onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
              placeholder="https://maps.google.com/?q=..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-mono text-xs"
            />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Links directly from the &ldquo;Location ↗&rdquo; link on the public page.
            </p>
          </div>
        </div>

        {/* Section 3: Contact Number, Advertising Emails & Website */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <Phone className="w-4 h-4 text-red-600" />
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              3. Contact, Advertising Emails & Website
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-red-600" />
                <span>Contact no</span>
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="079 4000 4000 / +91 99099 07237"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-red-600" />
                <span>Website</span>
              </label>
              <input
                type="text"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://gujaratpost.in/"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-red-600" />
                <span>Online Advertising (Email)</span>
              </label>
              <input
                type="text"
                value={formData.onlineAdsEmail}
                onChange={(e) => setFormData({ ...formData, onlineAdsEmail: e.target.value })}
                placeholder="digital.advertising@gujaratpost.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                <span>Print Advertising (Email)</span>
              </label>
              <input
                type="text"
                value={formData.printAdsEmail}
                onChange={(e) => setFormData({ ...formData, printAdsEmail: e.target.value })}
                placeholder="advt@gujaratpost.in & epaper@gujaratpost.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Informational banner: Default links notice */}
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong>Default Website Links:</strong> Social Media links (WhatsApp, Facebook, X, Instagram, Telegram, YouTube) and App Store links automatically use Gujarat Post&apos;s centralized website default links across both Contact Us and Advertise pages.
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl flex items-center justify-between">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Changes save to database and immediately update the live <strong className="text-gray-900 dark:text-white">/advertise</strong> page.
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-bold shadow-md shadow-red-600/25 transition disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
