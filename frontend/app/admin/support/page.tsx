'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Heart, QrCode, Building2, Upload, Check, Copy, ShieldAlert, Save, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { getBackendApiUrl, authFetch } from '@/lib/api';

export default function AdminSupportPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    qrCodeImage: '',
    upiId: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    noteGu: '',
    noteEn: '',
    noteHi: '',
  });

  // Verify Role & Fetch Data
  useEffect(() => {
    authFetch(getBackendApiUrl('/api/auth/me'))
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json.data?.user) {
          const role = json.data.user.role;
          setUserRole(role);
          if (role === 'SUPER_ADMIN') {
            fetchSupportSettings();
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchSupportSettings = async () => {
    setLoading(true);
    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/support'));
      const json = await res.json();
      if (json?.success && json.data) {
        setForm({
          qrCodeImage: json.data.qrCodeImage || '',
          upiId: json.data.upiId || '',
          accountName: json.data.accountName || '',
          accountNumber: json.data.accountNumber || '',
          ifscCode: json.data.ifscCode || '',
          bankName: json.data.bankName || '',
          branchName: json.data.branchName || '',
          noteGu: json.data.noteGu || '',
          noteEn: json.data.noteEn || '',
          noteHi: json.data.noteHi || '',
        });
      }
    } catch (err) {
      console.error('Error loading support settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json?.success && json.url) {
        setForm((prev) => ({ ...prev, qrCodeImage: json.url }));
        setStatusMsg({ type: 'success', text: 'QR Code image uploaded successfully!' });
      } else {
        setStatusMsg({ type: 'error', text: json?.message || 'Failed to upload image' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Error uploading file' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/support'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (json?.success) {
        setStatusMsg({ type: 'success', text: 'Support details & QR code updated successfully!' });
      } else {
        setStatusMsg({ type: 'error', text: json?.message || 'Failed to save changes.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err?.message || 'Error saving support settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (userRole !== 'SUPER_ADMIN') {
    return (
      <div className="mx-auto max-w-xl py-16 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-600 mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Access Restricted</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Only <strong className="text-red-600 dark:text-red-400">Super Admin</strong> has permission to post/update the QR Code image and Bank information for reader support.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-wider mb-2">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Super Admin Only</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
            <Heart className="h-7 w-7 text-red-600 fill-current" />
            <span>Support QR & Bank Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Upload official QR code image and bank account information shown on user support modal & page.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSupportSettings}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reload</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-sm font-bold flex items-center justify-between animate-in fade-in duration-200 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="text-xs font-black underline">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: QR Code & UPI (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* QR Code Upload Box */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-red-600" />
              <span>Official QR Code Image</span>
            </h2>

            <div className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-center space-y-3">
              {form.qrCodeImage ? (
                <div className="relative w-48 h-48 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white p-2 shadow-md">
                  <Image
                    src={form.qrCodeImage}
                    alt="Support QR Code"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="py-8 space-y-2">
                  <QrCode className="mx-auto h-12 w-12 text-zinc-400" />
                  <p className="text-xs font-bold text-zinc-500">No QR Code Image Uploaded</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-black hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span>{form.qrCodeImage ? 'Change Image' : 'Upload QR Image'}</span>
                </button>

                {form.qrCodeImage && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, qrCodeImage: '' }))}
                    className="px-3 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-500/20 transition cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Direct Image URL input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                Or Image URL
              </label>
              <input
                type="text"
                value={form.qrCodeImage}
                onChange={(e) => setForm({ ...form, qrCodeImage: e.target.value })}
                placeholder="https://example.com/qr-code.png"
                className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* UPI Details Box */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>UPI Details</span>
            </h2>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                Official UPI ID
              </label>
              <input
                type="text"
                value={form.upiId}
                onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                placeholder="gujaratpost@upi"
                className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-600"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Bank Info & Notes (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Bank Account Details */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
            <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-red-600" />
              <span>Bank Account Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Account Name
                </label>
                <input
                  type="text"
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  placeholder="Gujarat Post Media Pvt Ltd"
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Account Number
                </label>
                <input
                  type="text"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder="9924038640"
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={form.ifscCode}
                  onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
                  placeholder="HDFC0001234"
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-600 uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="HDFC Bank"
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Branch Name & Address
                </label>
                <input
                  type="text"
                  value={form.branchName}
                  onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                  placeholder="Main Branch, SG Highway, Ahmedabad"
                  className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-600"
                />
              </div>
            </div>
          </div>

          {/* Reader Instructions / Note */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
            <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100">
              Reader Instructions & Note (સપોર્ટ સૂચના / નોંધ)
            </h2>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                Instruction Message / Note
              </label>
              <textarea
                rows={3}
                value={form.noteGu}
                onChange={(e) =>
                  setForm({
                    ...form,
                    noteGu: e.target.value,
                    noteEn: e.target.value,
                    noteHi: e.target.value,
                  })
                }
                placeholder="GPay, PhonePe, Paytm અથવા કોઈપણ UPI એપ વડે સ્કેન કરી સપોર્ટ આપી શકો છો."
                className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-600 resize-none"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-lg shadow-red-600/30 transition duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              <span>{saving ? 'Saving Changes...' : 'Save Support Details'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
