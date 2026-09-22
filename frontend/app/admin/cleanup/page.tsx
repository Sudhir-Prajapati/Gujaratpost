'use client';

import { useState } from 'react';
import {
  Trash2,
  Database,
  ShieldAlert,
  AlertTriangle,
  Check,
  X,
  Calendar,
  Info,
  FileText,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { getBackendApiUrl, authFetch } from '@/lib/api';
import Link from 'next/link';

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  author: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  DRAFT: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
};

function getDefaultFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().split('T')[0];
}
function getDefaultTo() {
  return new Date().toISOString().split('T')[0];
}

export default function DataCleanupPage() {
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState(getDefaultTo);

  // Article list state
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 20;
  const [listLoading, setListLoading] = useState(false);

  // Delete state
  const [confirmStep, setConfirmStep] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ deleted: number; from: string; to: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setArticles([]);
    setTotal(null);
    setPage(1);
    setConfirmStep(false);
    setResult(null);
    setError(null);
  };

  const fetchArticles = async (pg = 1) => {
    if (!from || !to) return;
    setListLoading(true);
    setError(null);
    setConfirmStep(false);
    setResult(null);
    try {
      const url = getBackendApiUrl(`/api/admin/articles/range-list?from=${from}&to=${to}&page=${pg}&limit=${LIMIT}`);
      const res = await authFetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch articles');
      setArticles(json.data.articles);
      setTotal(json.data.total);
      setPage(pg);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setListLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/articles/bulk-delete-range'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, confirm: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Deletion failed');
      setResult({ deleted: json.data.deleted, from, to });
      setConfirmStep(false);
      setArticles([]);
      setTotal(null);
    } catch (e: any) {
      setError(e.message);
      setConfirmStep(false);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = total !== null ? Math.ceil(total / LIMIT) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 shadow">
          <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
        </span>
        <div>
          <h1 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            ડેટા ક્લીનઅપ ટૂલ
            <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              Super Admin Only
            </span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
            Database Article Cleanup — Date Range Selection
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 px-4 py-3.5">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 space-y-1">
          <p className="font-black">આ ટૂલ શું કરે છે?</p>
          <p>તમે <strong>From</strong> અને <strong>To</strong> તારીખ પસંદ કરો, તે વચ્ચેના આર્ટિકલ્સ જુઓ, અને <strong>એક ક્લિકમાં</strong> ડિલીટ કરો. ડિલીટ ક્રિયા <strong>ઉલટાવી શકાતી નથી.</strong></p>
        </div>
      </div>

      {/* Date Range Card */}
      <div className="rounded-3xl border-2 border-red-100 dark:border-red-900/40 bg-white dark:bg-zinc-900 p-6 shadow-lg space-y-5">

        {/* Date Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              <Calendar className="h-3.5 w-3.5 inline mr-1 text-red-400" />
              From (શરૂ)
            </label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => { setFrom(e.target.value); reset(); }}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              <Calendar className="h-3.5 w-3.5 inline mr-1 text-red-400" />
              To (અંત)
            </label>
            <input
              type="date"
              value={to}
              min={from}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => { setTo(e.target.value); reset(); }}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-black text-zinc-400 self-center">Quick:</span>
          {[
            { label: 'છેલ્લો 1 મહિનો', months: 1 },
            { label: 'છેલ્લા 3 મહિના', months: 3 },
            { label: 'છેલ્લા 6 મહિના', months: 6 },
            { label: 'છેલ્લું 1 વર્ષ', months: 12 },
          ].map(({ label, months }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                const t = new Date().toISOString().split('T')[0];
                const f = new Date();
                f.setMonth(f.getMonth() - months);
                setFrom(f.toISOString().split('T')[0]);
                setTo(t);
                reset();
              }}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-black text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-zinc-400 font-medium">
          Range: <strong className="text-zinc-600 dark:text-zinc-300">{from}</strong> → <strong className="text-zinc-600 dark:text-zinc-300">{to}</strong>
        </p>

        {/* Fetch Articles Button */}
        <button
          type="button"
          disabled={listLoading || !from || !to}
          onClick={() => fetchArticles(1)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-700 text-white text-sm font-black hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
        >
          {listLoading ? (
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          {listLoading ? 'Loading...' : 'આર્ટિકલ જુઓ (Fetch Articles)'}
        </button>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <p className="text-xs font-bold text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success */}
        {result && (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
            <Check className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                ✅ {new Intl.NumberFormat('en-IN').format(result.deleted)} articles deleted!
              </p>
              <p className="text-xs text-emerald-600/70 mt-0.5">
                Range: {result.from} → {result.to}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Article List */}
      {total !== null && (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">

          {/* List Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-zinc-500" />
              <span className="font-black text-zinc-800 dark:text-zinc-200">Articles in Range</span>
              <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-black px-2.5 py-0.5 rounded-full">
                {new Intl.NumberFormat('en-IN').format(total)} total
              </span>
            </div>
            {total > 0 && !result && (
              <button
                type="button"
                onClick={() => setConfirmStep(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition shadow shadow-red-600/20 active:scale-95 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                બધા ડિલીટ કરો ({new Intl.NumberFormat('en-IN').format(total)})
              </button>
            )}
          </div>

          {/* Empty */}
          {total === 0 && (
            <div className="py-12 text-center">
              <Check className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-zinc-500">No articles found in this date range. ✓</p>
            </div>
          )}

          {/* Article Rows */}
          {articles.length > 0 && (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {articles.map((art, i) => (
                <div key={art.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                  <span className="text-xs font-black text-zinc-400 w-6 text-right shrink-0">
                    {(page - 1) * LIMIT + i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 line-clamp-1">
                      {art.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-zinc-400">
                        {new Date(art.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {art.author?.name && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <span className="text-[10px] font-bold text-zinc-400">{art.author.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[art.status] || 'bg-zinc-100 text-zinc-500'}`}>
                    {art.status.replace('_', ' ')}
                  </span>
                  <a
                    href={`/news/${art.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30">
              <span className="text-xs font-bold text-zinc-500">
                Page {page} of {totalPages} • {new Intl.NumberFormat('en-IN').format(total!)} articles
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || listLoading}
                  onClick={() => fetchArticles(page - 1)}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-black px-2">{page} / {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages || listLoading}
                  onClick={() => fetchArticles(page + 1)}
                  className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── CUSTOM BULK DELETE CONFIRMATION MODAL ─── */}
      {confirmStep && !result && total !== null && total > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => !deleting && setConfirmStep(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            {/* Close X Button */}
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirmStep(false)}
              className="absolute top-5 right-5 rounded-xl p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header Icon + Title */}
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 shadow-inner shrink-0 mt-0.5">
                <ShieldAlert className="h-7 w-7" />
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-full">
                    Irreversible Action
                  </span>
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-snug mt-1.5">
                  બધા આર્ટિકલ્સ ડિલીટ કરવા છે?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Permanently delete selected database articles
                </p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="mt-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">કુલ આર્ટિકલ્સ (Total Articles):</span>
                <span className="text-sm font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 rounded-lg border border-red-200/50 dark:border-red-900/50 font-mono">
                  {new Intl.NumberFormat('en-IN').format(total)} Articles
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-200/60 dark:border-zinc-800/60 pt-2.5">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">તારીખ ગાળો (Date Range):</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                  {from} → {to}
                </span>
              </div>
            </div>

            {/* Critical Warning Callout */}
            <div className="mt-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800 dark:text-red-300 leading-relaxed font-medium">
                <p className="font-bold">⚠️ ચેતવણી: આ ક્રિયા પાછી વાળી શકાતી નથી (Permanent)!</p>
                <p className="mt-0.5 text-red-700/80 dark:text-red-400/80">
                  આ તારીખ વચ્ચેના તમામ {new Intl.NumberFormat('en-IN').format(total)} આર્ટિકલ્સ ડેટાબેઝમાંથી કાયમ માટે રદ થઈ જશે.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmStep(false)}
                className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition disabled:opacity-50 cursor-pointer"
              >
                રદ કરો (Cancel)
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-red-600/30 transition disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {deleting ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>
                  {deleting
                    ? 'ડિલીટ થઈ રહ્યું છે...'
                    : `હા, બધા ${new Intl.NumberFormat('en-IN').format(total)} આર્ટિકલ્સ કાઢો`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
