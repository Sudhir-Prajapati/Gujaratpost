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
            {total > 0 && !confirmStep && !result && (
              <button
                type="button"
                onClick={() => setConfirmStep(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 transition shadow"
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

          {/* Confirmation Box */}
          {confirmStep && !result && (
            <div className="m-4 rounded-2xl border-2 border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/30 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-7 w-7 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-base font-black text-red-800 dark:text-red-300">⚠️ Final Confirmation Required</p>
                  <p className="text-sm text-red-700/80 dark:text-red-400/70 mt-1 leading-relaxed">
                    You are about to permanently delete{' '}
                    <strong className="text-red-800 dark:text-red-300">{new Intl.NumberFormat('en-IN').format(total)}</strong>{' '}
                    articles between <strong>{from}</strong> and <strong>{to}</strong>.
                    <br />
                    <span className="font-black text-red-700 dark:text-red-400">This CANNOT be reversed.</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-black hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                >
                  {deleting ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {deleting ? 'Deleting...' : 'હા, કાઢો (Yes, Delete Permanently)'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmStep(false)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-sm font-black hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  <X className="h-4 w-4" />
                  રદ (Cancel)
                </button>
              </div>
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
    </div>
  );
}
