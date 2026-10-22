'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Info,
  Save,
  ExternalLink,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Building2,
  Target,
  BarChart3,
  ShieldCheck,
  Users,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  RefreshCw,
  Sparkles,
  Upload,
  UploadCloud,
  X,
  Cloud,
  Camera,
  Check,
  HelpCircle,
} from 'lucide-react';
import { getAdminAbout, updateAdminAbout, getBackendApiUrl, authFetch } from '@/lib/api';

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'story' | 'mission' | 'stats' | 'values' | 'team' | 'contact'>('story');

  // Cloudinary image upload states
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [bannerUploadSuccess, setBannerUploadSuccess] = useState(false);
  const [uploadingMemberIdx, setUploadingMemberIdx] = useState<number | null>(null);
  const [memberUploadSuccessIdx, setMemberUploadSuccessIdx] = useState<number | null>(null);
  const [showManualBannerUrl, setShowManualBannerUrl] = useState(false);

  // Form states - Unified direct fields without language splits
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    bannerImage: '',
    mission: '',
    vision: '',
    rulesTitle: 'અમારા અડગ નિયમો',
    rulesJson: [] as string[],
    valuesJson: [] as Array<{
      icon: string;
      title: string;
      desc: string;
    }>,
    statsJson: [] as Array<{
      value: string;
      label: string;
    }>,
    teamJson: [] as Array<{
      name: string;
      role: string;
      image?: string;
      email?: string;
    }>,
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    whatsappNumber: '',
  });

  const fetchAboutSettings = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getAdminAbout();
      if (data) {
        setFormData({
          title: data.title || data.titleGu || data.titleEn || data.titleHi || '',
          subtitle: data.subtitle || data.subtitleGu || data.subtitleEn || data.subtitleHi || '',
          description: data.description || data.descriptionGu || data.descriptionEn || data.descriptionHi || '',
          bannerImage: data.bannerImage || '',
          mission: data.mission || data.missionGu || data.missionEn || data.missionHi || '',
          vision: data.vision || data.visionGu || data.visionEn || data.visionHi || '',
          rulesTitle: data.rulesTitle || 'અમારા અડગ નિયમો',
          rulesJson: Array.isArray(data.rulesJson) && data.rulesJson.length > 0
            ? data.rulesJson.slice(0, 4)
            : [
                '૧૦૦% તથ્ય ચકાસણી (Fact Checked)',
                'કોઈપણ ફેક ન્યૂઝ સામે શૂન્ય સહિષ્ણુતા',
                'ગ્રાઉન્ડ રિયાલિટી રિપોર્ટિંગ',
                'વાચકોની પ્રાઈવસીનું સંપૂર્ણ સન્માન',
              ],
          statsJson: Array.isArray(data.statsJson)
            ? data.statsJson.map((s: any) => ({
                value: s.value || '',
                label: s.label || s.labelGu || s.labelEn || s.labelHi || '',
              }))
            : [],
          valuesJson: Array.isArray(data.valuesJson)
            ? data.valuesJson.map((v: any) => ({
                icon: v.icon || 'ShieldCheck',
                title: v.title || v.titleGu || v.titleEn || v.titleHi || '',
                desc: v.desc || v.descGu || v.descEn || v.descHi || '',
              }))
            : [],
          teamJson: Array.isArray(data.teamJson)
            ? data.teamJson.map((t: any) => ({
                name: t.name || t.nameEn || '',
                role: t.role || t.roleEn || '',
                image: t.image || '',
                email: t.email || '',
              }))
            : [],
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          contactAddress: data.contactAddress || '',
          whatsappNumber: data.whatsappNumber || '',
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load About settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAboutSettings();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      await updateAdminAbout(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Cloudinary Image Upload Helper
  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file (PNG, JPG, WebP, GIF, etc.)');
    }
    const data = new FormData();
    data.append('file', file);

    const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
      method: 'POST',
      body: data,
    });
    const json = await res.json();
    const url = json?.url || json?.data?.url;
    if (!res.ok || !url) {
      throw new Error(json?.error || json?.message || 'Failed to upload image to Cloudinary');
    }
    return url;
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    setBannerUploadSuccess(false);
    setErrorMessage('');

    try {
      const uploadedUrl = await uploadImageToCloudinary(file);
      handleChange('bannerImage', uploadedUrl);
      setBannerUploadSuccess(true);
      setTimeout(() => setBannerUploadSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading banner image to Cloudinary');
    } finally {
      setUploadingBanner(false);
      e.target.value = '';
    }
  };

  const handleMemberPhotoUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMemberIdx(idx);
    setMemberUploadSuccessIdx(null);
    setErrorMessage('');

    try {
      const uploadedUrl = await uploadImageToCloudinary(file);
      handleUpdateTeamMember(idx, 'image', uploadedUrl);
      setMemberUploadSuccessIdx(idx);
      setTimeout(() => setMemberUploadSuccessIdx(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading member photo to Cloudinary');
    } finally {
      setUploadingMemberIdx(null);
      e.target.value = '';
    }
  };

  // Rules handlers (Strict Maximum 4)
  const handleAddRule = () => {
    if (formData.rulesJson.length >= 4) return;
    setFormData((prev) => ({
      ...prev,
      rulesJson: [...prev.rulesJson, 'નવો નિયમ / New Editorial Standard'],
    }));
  };

  const handleUpdateRule = (idx: number, val: string) => {
    setFormData((prev) => {
      const copy = [...prev.rulesJson];
      copy[idx] = val;
      return { ...prev, rulesJson: copy };
    });
  };

  const handleRemoveRule = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      rulesJson: prev.rulesJson.filter((_, i) => i !== idx),
    }));
  };

  // Stats handlers
  const handleAddStat = () => {
    setFormData((prev) => ({
      ...prev,
      statsJson: [...prev.statsJson, { value: '10K+', label: 'નવો આંકડો / New Metric' }],
    }));
  };

  const handleUpdateStat = (idx: number, field: string, val: string) => {
    setFormData((prev) => {
      const copy = [...prev.statsJson];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, statsJson: copy };
    });
  };

  const handleRemoveStat = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      statsJson: prev.statsJson.filter((_, i) => i !== idx),
    }));
  };

  // Values handlers
  const handleAddValue = () => {
    setFormData((prev) => ({
      ...prev,
      valuesJson: [
        ...prev.valuesJson,
        {
          icon: 'ShieldCheck',
          title: 'નવું મૂલ્ય / New Principle',
          desc: 'વિગત / Explanation',
        },
      ],
    }));
  };

  const handleUpdateValue = (idx: number, field: string, val: string) => {
    setFormData((prev) => {
      const copy = [...prev.valuesJson];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, valuesJson: copy };
    });
  };

  const handleRemoveValue = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      valuesJson: prev.valuesJson.filter((_, i) => i !== idx),
    }));
  };

  // Team handlers
  const handleAddTeamMember = () => {
    setFormData((prev) => ({
      ...prev,
      teamJson: [
        ...prev.teamJson,
        {
          name: '',
          role: '',
          image: '',
          email: '',
        },
      ],
    }));
  };

  const handleUpdateTeamMember = (idx: number, field: string, val: string) => {
    setFormData((prev) => {
      const copy = [...prev.teamJson];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, teamJson: copy };
    });
  };

  const handleRemoveTeamMember = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      teamJson: prev.teamJson.filter((_, i) => i !== idx),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 space-y-3">
        <RefreshCw className="h-8 w-8 text-red-600 animate-spin" />
        <p className="text-sm font-bold text-gray-500">About Us સેટિંગ્સ લોડ થઈ રહ્યા છે...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-10">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-600/10 text-red-600">
              <Info className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>About Us Page Manager</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-neutral-400">
                  અમારો પરિચય
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                પરિચય પેજની તમામ વિગતો, ફોટો, નિયમો, મિશન, આંકડા અને સંપર્ક અહીંથી સરળતાથી બદલો.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/about"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>વેબસાઇટ પર જુઓ (View Public)</span>
          </Link>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-black bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{saving ? 'સાચવી રહ્યા છે...' : 'સાચવો (Save)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Notifications & Alerts */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-bold animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>✓ તમામ ફેરફારો સફળતાપૂર્વક સાચવાઈ ગયા છે! વેબસાઇટ પર તરત જ લાઈવ થઈ ગયા છે.</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm font-bold">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Quick Section Navigation Cards (Visual Overview) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          {
            key: 'story',
            title: '૧. મુખ્ય પરિચય',
            sub: 'Title, Banner & Rules',
            icon: Building2,
            badge: `${formData.rulesJson.length}/4 નિયમો`,
          },
          {
            key: 'mission',
            title: '૨. ધ્યેય & દ્રષ્ટિ',
            sub: 'Mission & Vision',
            icon: Target,
            badge: formData.mission ? 'લખેલ છે' : 'ખાલી',
          },
          {
            key: 'stats',
            title: '૩. મુખ્ય આંકડાઓ',
            sub: 'Impact Numbers',
            icon: BarChart3,
            badge: `${formData.statsJson.length} બોક્સ`,
          },
          {
            key: 'values',
            title: '૪. મૂલ્યો & સિદ્ધાંતો',
            sub: 'Core Principles',
            icon: ShieldCheck,
            badge: `${formData.valuesJson.length} સ્તંભો`,
          },
          {
            key: 'team',
            title: '૫. સંપાદકીય ટીમ',
            sub: 'Editorial Team',
            icon: Users,
            badge: `${formData.teamJson.length} સભ્યો`,
          },
          {
            key: 'contact',
            title: '૬. સંપર્ક & સરનામું',
            sub: 'Office & Phone',
            icon: MapPin,
            badge: formData.contactPhone ? 'તૈયાર' : 'અપૂર્ણ',
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`p-3 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between gap-2 ${
                isActive
                  ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                  : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-gray-800 hover:border-red-300 text-gray-800 dark:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-red-600'}`} />
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {tab.badge}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-black tracking-tight leading-snug">{tab.title}</h3>
                <p className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                  {tab.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================
            TAB 1: STORY, HERO BANNER & STRICT MAX 4 EDITORIAL RULES
           ======================================================== */}
        {activeTab === 'story' && (
          <div className="bg-white dark:bg-zinc-900 p-5 sm:p-7 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-7 shadow-xs">
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-red-600" />
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                    મુખ્ય પરિચય, બેનર ફોટો અને નિયમો (Intro, Banner & Rules)
                  </h2>
                  <p className="text-xs text-gray-500">
                    આ માહિતી પરિચય પેજ પર સૌથી ઉપર દેખાય છે.
                  </p>
                </div>
              </div>
            </div>

            {/* 1.1 Page Title & Subtitle */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    પેજનું મુખ્ય હેડિંગ (Page Title)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="દા.ત. ગુજરાત પોસ્ટ વિશે"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">પેજ પર સૌથી મોટા અક્ષરે દેખાતું ટાઇટલ</span>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    ટેગલાઇન / સબટાઇટલ (Subtitle / Tagline)
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => handleChange('subtitle', e.target.value)}
                    placeholder="દા.ત. સત્ય, સચોટતા અને વિશ્વસનીય પત્રકારત્વનું અગ્રણી ડિજિટલ માધ્યમ"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">ટાઇટલની નીચે દેખાતી ટૂંકી વ્યાખ્યા</span>
                </div>
              </div>

              {/* 1.2 Story / Description */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  અમારી પત્રકારત્વ યાત્રા / વિગતવાર પરિચય (About Story)
                </label>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="ગુજરાત પોસ્ટ વિશે વિસ્તૃત વિગત અહીં લખો..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none leading-relaxed"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  તમે પેરેગ્રાફ મુજબ લખી શકો છો. પેજ પર સુંદર રીતે ફોર્મેટ થશે.
                </span>
              </div>
            </div>

            {/* 1.3 Hero Banner Image - Easy Upload from Local PC to Cloudinary */}
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-zinc-800/50 border border-neutral-200 dark:border-neutral-700 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-red-600/10 text-red-600">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
                      મુખ્ય બેનર ફોટો (Hero Banner Image)
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      કમ્પ્યુટરમાંથી સીધો ફોટો અપલોડ કરો. ક્લાઉડિનરીમાં સુરક્ષિત રીતે સંગ્રહ થશે.
                    </p>
                    <span className="inline-flex items-center gap-0.5 mt-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[10px] font-black">
                      <span className="text-red-500">*</span>&nbsp;Mandatory &bull; JPG / PNG / WEBP &bull; Max 5 MB &bull; Min 1200&times;400 px (Landscape)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    <Cloud className="h-3 w-3" />
                    <span>Cloudinary Storage</span>
                  </span>
                  {formData.bannerImage && formData.bannerImage.includes('cloudinary') && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                      <Check className="h-3.5 w-3.5" />
                      સક્રિય
                    </span>
                  )}
                </div>
              </div>

              {/* Upload Action Area */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  id="hero-banner-file-input"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  disabled={uploadingBanner}
                  className="hidden"
                />

                <label
                  htmlFor="hero-banner-file-input"
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer shadow-md select-none active:scale-95 ${
                    uploadingBanner
                      ? 'bg-neutral-300 text-neutral-600 cursor-wait'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                  }`}
                >
                  {uploadingBanner ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Cloudinary પર અપલોડ થઈ રહ્યો છે...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      <span>📂 કમ્પ્યુટરમાંથી ફોટો અપલોડ કરો (Upload from PC)</span>
                    </>
                  )}
                </label>

                {formData.bannerImage && (
                  <button
                    type="button"
                    onClick={() => handleChange('bannerImage', '')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 hover:border-red-600 text-gray-600 dark:text-gray-300 hover:text-red-600 text-xs font-bold transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>ફોટો દૂર કરો (Remove)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowManualBannerUrl(!showManualBannerUrl)}
                  className="text-xs text-gray-500 hover:text-red-600 underline font-medium cursor-pointer ml-auto"
                >
                  {showManualBannerUrl ? 'URL છુપાવો (Hide URL)' : 'અથવા ડાયરેક્ટ URL નાખો (Paste URL)'}
                </button>
              </div>

              {bannerUploadSuccess && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>સરસ! ફોટો સફળતાપૂર્વક અપલોડ થઈ ગયો છે અને લાઈવ થઈ ગયો છે.</span>
                </div>
              )}

              {/* Optional Manual URL Input */}
              {showManualBannerUrl && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Image URL (Cloudinary અથવા અન્ય વેબ લિંક):
                  </label>
                  <input
                    type="url"
                    value={formData.bannerImage}
                    onChange={(e) => handleChange('bannerImage', e.target.value)}
                    placeholder="https://res.cloudinary.com/... or https://..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-900 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none"
                  />
                </div>
              )}

              {/* Banner Live Preview */}
              {formData.bannerImage && (
                <div className="relative w-full h-44 sm:h-56 rounded-2xl overflow-hidden border border-gray-300 dark:border-gray-700 bg-black shadow-inner">
                  <img
                    src={formData.bannerImage}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                    <span className="text-xs font-black drop-shadow">
                      Gujarat Post • બેનર લાઈવ પ્રિવ્યુ
                    </span>
                    <a
                      href={formData.bannerImage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition"
                    >
                      ઓરિજિનલ જુઓ ↗
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* 1.4 Editorial Rules & Standards (Strict Maximum 4) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-600/15 text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                      <span>અમારા અડગ નિયમો (Editorial Rules / Commitments)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                        {formData.rulesJson.length} / 4 મહત્તમ (Max)
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      પરિચય પેજ પર સ્ટોરીની નીચે ૪ બોક્સમાં ગ્રીન ચેકમાર્ક સાથે દેખાશે.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddRule}
                  disabled={formData.rulesJson.length >= 4}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer select-none shrink-0 ${
                    formData.rulesJson.length >= 4
                      ? 'bg-neutral-200 dark:bg-zinc-800 text-neutral-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>
                    {formData.rulesJson.length >= 4 ? '✓ ૪ નિયમો પૂર્ણ (Max 4 Reached)' : '+ નવો નિયમ ઉમેરો'}
                  </span>
                </button>
              </div>

              {/* Rules Heading input */}
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <label className="block text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  નિયમોનું હેડિંગ (Section Title)
                </label>
                <input
                  type="text"
                  value={formData.rulesTitle}
                  onChange={(e) => handleChange('rulesTitle', e.target.value)}
                  placeholder="અમારા અડગ નિયમો"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Rule list cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {formData.rulesJson.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 shadow-2xs"
                  >
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-black shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => handleUpdateRule(idx, e.target.value)}
                      placeholder={`નિયમ #${idx + 1}...`}
                      className="flex-1 px-2.5 py-1 text-xs font-bold text-gray-800 dark:text-gray-200 bg-transparent border-0 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition cursor-pointer"
                      title="Delete rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {formData.rulesJson.length === 0 && (
                <div className="text-center py-4 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  <p className="text-xs text-gray-500">હાલમાં કોઈ નિયમ ઉમેરેલ નથી. મહત્તમ ૪ નિયમો ઉમેરી શકાય છે.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: MISSION & VISION STATEMENTS
           ======================================================== */}
        {activeTab === 'mission' && (
          <div className="bg-white dark:bg-zinc-900 p-5 sm:p-7 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
              <Target className="h-5 w-5 text-red-600" />
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                  ધ્યેય અને દ્રષ્ટિકોણ (Mission & Vision Statements)
                </h2>
                <p className="text-xs text-gray-500">
                  આ કાર્ડ્સ પરિચય પેજ પર જમણી બાજુ લાલ અને ગોલ્ડન રંગના આકર્ષક બોક્સમાં દેખાય છે.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Mission Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-2.5">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Target className="h-4 w-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider">અમારું ધ્યેય (Our Mission)</h3>
                </div>
                <textarea
                  rows={4}
                  value={formData.mission}
                  onChange={(e) => handleChange('mission', e.target.value)}
                  placeholder="અમારો સંકલ્પ છે કે છેવાડાના માનવી સુધી સાચો અવાજ પહોંચાડવો..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
                <span className="text-[11px] text-gray-400">લાલ રંગના કાર્ડમાં દેખાશે.</span>
              </div>

              {/* Vision Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <BarChart3 className="h-4 w-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider">અમારો દ્રષ્ટિકોણ (Our Vision)</h3>
                </div>
                <textarea
                  rows={4}
                  value={formData.vision}
                  onChange={(e) => handleChange('vision', e.target.value)}
                  placeholder="ગુજરાતનું સૌથી વિશ્વસનીય અને લોકપ્રિય ડિજિટલ સમાચાર માધ્યમ બનવું..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[11px] text-gray-400">સફેદ/ગોલ્ડન કાર્ડમાં દેખાશે.</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: IMPACT METRICS (STATS)
           ======================================================== */}
        {activeTab === 'stats' && (
          <div className="bg-white dark:bg-zinc-900 p-5 sm:p-7 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-red-600" />
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                    મુખ્ય આંકડાઓ અને સિદ્ધિઓ (Key Numbers & Impact)
                  </h2>
                  <p className="text-xs text-gray-500">
                    આ આંકડાઓ બેનરની બરોબર નીચે દેખાય છે (દા.ત. 10M+, 33 જિલ્લા, 50K+ સમાચારો).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddStat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition cursor-pointer active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ નવો આંકડો ઉમેરો</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.statsJson.map((stat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-gray-700 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-red-600">આંકડો #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStat(idx)}
                      className="text-gray-400 hover:text-red-600 transition p-1 cursor-pointer"
                      title="Delete metric"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                      મોટો આંકડો (Value)
                    </label>
                    <input
                      type="text"
                      value={stat.value}
                      onChange={(e) => handleUpdateStat(idx, 'value', e.target.value)}
                      placeholder="દા.ત. 10M+, 33, 50K+"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900 text-base font-black text-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                      વિગત / વર્ણન (Label)
                    </label>
                    <input
                      type="text"
                      value={stat.label}
                      onChange={(e) => handleUpdateStat(idx, 'label', e.target.value)}
                      placeholder="દા.ત. માસિક વાચકો"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900 text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {formData.statsJson.length === 0 && (
              <div className="text-center py-6 bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-xs text-gray-500">કોઈ આંકડો ઉમેરેલ નથી. ઉપર &quot;+ નવો આંકડો ઉમેરો&quot; પર ક્લિક કરો.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 4: CORE VALUES & GUIDING PRINCIPLES
           ======================================================== */}
        {activeTab === 'values' && (
          <div className="bg-white dark:bg-zinc-900 p-5 sm:p-7 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-red-600" />
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                    મૂલ્યો અને સિદ્ધાંતો (Core Values & Pillars)
                  </h2>
                  <p className="text-xs text-gray-500">
                    અમારા પત્રકારત્વના પાયાના મૂલ્યો (સત્ય, ઝડપ, જનસામાન્યનો અવાજ, નિષ્પક્ષતા).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddValue}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition cursor-pointer active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ નવું મૂલ્ય ઉમેરો</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formData.valuesJson.map((val, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-gray-700 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-red-600">સ્તંભ #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(idx)}
                      className="text-gray-400 hover:text-red-600 transition p-1 cursor-pointer"
                      title="Delete value"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                        આઇકોન (Icon)
                      </label>
                      <select
                        value={val.icon}
                        onChange={(e) => handleUpdateValue(idx, 'icon', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900 text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none"
                      >
                        <option value="ShieldCheck">🛡️ Shield (સત્ય)</option>
                        <option value="Zap">⚡ Zap (ઝડપ)</option>
                        <option value="Users">👥 Users (જનઅવાજ)</option>
                        <option value="Award">🏆 Award (નિષ્પક્ષ)</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                        શીર્ષક (Title)
                      </label>
                      <input
                        type="text"
                        value={val.title}
                        onChange={(e) => handleUpdateValue(idx, 'title', e.target.value)}
                        placeholder="દા.ત. સત્ય અને પારદર્શિતા"
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900 text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                      સમજૂતી (Description)
                    </label>
                    <textarea
                      rows={2}
                      value={val.desc}
                      onChange={(e) => handleUpdateValue(idx, 'desc', e.target.value)}
                      placeholder="મૂલ્યની વિગતવાર સમજૂતી..."
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {formData.valuesJson.length === 0 && (
              <div className="text-center py-6 bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-xs text-gray-500">કોઈ મૂલ્ય ઉમેરેલ નથી. &quot;+ નવું મૂલ્ય ઉમેરો&quot; પર ક્લિક કરો.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 5: EDITORIAL TEAM WITH CLOUDINARY PHOTO UPLOAD
           ======================================================== */}
        {activeTab === 'team' && (
          <div className="bg-white dark:bg-zinc-900 p-5 sm:p-7 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-red-600" />
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                    સંપાદકીય ટીમ અને બોર્ડ (Leadership & Editorial Board)
                  </h2>
                  <p className="text-xs text-gray-500">
                    મુખ્ય તંત્રી, પત્રકારો અને સંપાદકોના નામ, હોદ્દો અને ફોટો અહીંથી મેનેજ કરો.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddTeamMember}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition cursor-pointer active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ નવો સભ્ય ઉમેરો</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.teamJson.map((member, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-gray-700 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-xs font-black text-red-600">ટીમ સભ્ય #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTeamMember(idx)}
                      className="text-gray-400 hover:text-red-600 transition p-1 cursor-pointer"
                      title="Delete member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Member Photo Upload Box */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-700">
                    <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-red-600/30 bg-neutral-200 dark:bg-neutral-800 shrink-0">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name || 'Member'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-gray-400 text-base">
                          {(member.name || 'M').charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        id={`member-photo-upload-${idx}`}
                        accept="image/*"
                        onChange={(e) => handleMemberPhotoUpload(idx, e)}
                        disabled={uploadingMemberIdx === idx}
                        className="hidden"
                      />
                      <label
                        htmlFor={`member-photo-upload-${idx}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs select-none ${
                          uploadingMemberIdx === idx
                            ? 'bg-neutral-200 text-neutral-500 cursor-wait'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900'
                        }`}
                      >
                        {uploadingMemberIdx === idx ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>અપલોડ થઈ રહ્યો છે...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="h-3.5 w-3.5" />
                            <span>ફોટો અપલોડ કરો</span>
                          </>
                        )}
                      </label>
                      <span className="block mt-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400">
                        <span className="text-red-500">*</span> JPG/PNG &bull; Max 1 MB &bull; Square (200&times;200 px)
                      </span>

                      {memberUploadSuccessIdx === idx && (
                        <span className="block text-[10px] text-emerald-600 font-bold">
                          ✓ Cloudinary પર સેવ થઈ ગયો!
                        </span>
                      )}

                      {member.image && (
                        <button
                          type="button"
                          onClick={() => handleUpdateTeamMember(idx, 'image', '')}
                          className="block text-[10px] text-gray-400 hover:text-red-600 transition cursor-pointer"
                        >
                          ફોટો હટાવો
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                      પૂરું નામ (Full Name)
                    </label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleUpdateTeamMember(idx, 'name', e.target.value)}
                      placeholder="દા.ત. મહેશભાઈ પટેલ"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900 text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                      હોદ્દો / પદ (Role / Title)
                    </label>
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) => handleUpdateTeamMember(idx, 'role', e.target.value)}
                      placeholder="દા.ત. તંત્રી & સંસ્થાપક"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900 text-xs font-bold text-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">
                      ઈમેલ (Email)
                    </label>
                    <input
                      type="email"
                      value={member.email || ''}
                      onChange={(e) => handleUpdateTeamMember(idx, 'email', e.target.value)}
                      placeholder="editor@gujaratpost.in"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-900 text-xs font-medium text-gray-700 dark:text-gray-300 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {formData.teamJson.length === 0 && (
              <div className="text-center py-6 bg-gray-50 dark:bg-zinc-800/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-xs text-gray-500">કોઈ ટીમ સભ્ય ઉમેરેલ નથી. &quot;+ નવો સભ્ય ઉમેરો&quot; પર ક્લિક કરો.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 6: CONTACT & OFFICE DETAILS
           ======================================================== */}
        {activeTab === 'contact' && (
          <div className="bg-white dark:bg-zinc-900 p-5 sm:p-7 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
              <MapPin className="h-5 w-5 text-red-600" />
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                  સંપર્ક અને મુખ્ય કાર્યાલય (Contact & Office Details)
                </h2>
                <p className="text-xs text-gray-500">
                  વાચકો અને જાહેર જનતા માટે સંપર્ક માહિતી (સરનામું, ઈમેલ, ફોન અને વોટ્સએપ).
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  મુખ્ય કાર્યાલયનું સરનામું (Office Address)
                </label>
                <textarea
                  rows={3}
                  value={formData.contactAddress}
                  onChange={(e) => handleChange('contactAddress', e.target.value)}
                  placeholder="દા.ત. ગુજરાત પોસ્ટ મીડિયા, અમદાવાદ, ગુજરાત - ૩૮૦૦૦૧"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    સત્તાવાર સંપર્ક ઈમેલ (Official Contact Email)
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="contact@gujaratpost.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    ફોન નંબર (Contact Phone Number)
                  </label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                    placeholder="+91 99099 07237"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  વોટ્સએપ હેલ્પલાઇન નંબર (WhatsApp Number)
                </label>
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                    placeholder="+91 99099 07237"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  આ નંબર પર ક્લિક કરવાથી વાચક સીધો વોટ્સએપ પર ગુજરાત પોસ્ટ સાથે વાતચીત કરી શકશે.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Standard Inline Save Action at bottom of form */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 shadow-xs">
          <span className="text-xs text-gray-500">
            ફેરફારો સેવ કરવા માટે &quot;સાચવો&quot; બટન દબાવો.
          </span>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>સાચવી રહ્યા છે...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>સાચવો (Save All Changes)</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
