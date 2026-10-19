'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  ExternalLink,
  Mail,
  Phone,
  User,
  Calendar,
  X,
  Check,
  AlertCircle,
  HelpCircle,
  Inbox,
  Sparkles,
} from 'lucide-react';
import {
  getAdminFeedbacks,
  updateAdminFeedbackStatus,
  deleteAdminFeedback,
} from '@/lib/api';

interface FeedbackItem {
  id: string;
  type: 'FEEDBACK' | 'COMPLAINT';
  name: string;
  email: string;
  phone?: string | null;
  category: string;
  subject: string;
  message: string;
  articleUrl?: string | null;
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED';
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState({
    all: 0,
    feedback: 0,
    complaint: 0,
    pending: 0,
    inReview: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'FEEDBACK' | 'COMPLAINT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_REVIEW' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item for modal
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [modalStatus, setModalStatus] = useState<'PENDING' | 'IN_REVIEW' | 'RESOLVED'>('PENDING');
  const [modalNotes, setModalNotes] = useState('');
  const [modalUpdating, setModalUpdating] = useState(false);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminFeedbacks({
        type: typeFilter,
        status: statusFilter,
        search: searchQuery.trim() || undefined,
        limit: 150,
      });

      setItems(data?.items || []);
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load feedback records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, statusFilter]);

  // Client search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenDetailModal = (item: FeedbackItem) => {
    setSelectedItem(item);
    setModalStatus(item.status);
    setModalNotes(item.adminNotes || '');
  };

  const handleCloseDetailModal = () => {
    setSelectedItem(null);
  };

  const handleSaveModal = async () => {
    if (!selectedItem) return;
    setModalUpdating(true);
    try {
      await updateAdminFeedbackStatus(selectedItem.id, {
        status: modalStatus,
        adminNotes: modalNotes,
      });

      // Update local state
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItem.id
            ? { ...i, status: modalStatus, adminNotes: modalNotes }
            : i
        )
      );

      showToast('Status and notes updated successfully!');
      handleCloseDetailModal();
      fetchData(); // Refresh counts
    } catch (err: any) {
      showToast(err?.message || 'Failed to update record', 'error');
    } finally {
      setModalUpdating(false);
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: 'PENDING' | 'IN_REVIEW' | 'RESOLVED') => {
    try {
      await updateAdminFeedbackStatus(id, { status: newStatus });
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
      );
      showToast(`Status updated to ${newStatus}`);
      fetchData();
    } catch (err: any) {
      showToast('Failed to change status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteAdminFeedback(deletingId);
      setItems((prev) => prev.filter((i) => i.id !== deletingId));
      showToast('Record deleted successfully!');
      setDeletingId(null);
      fetchData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete record', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCsv = () => {
    if (items.length === 0) return;
    const headers = ['ID,Type,Date,Name,Email,Phone,Category,Subject,Message,ArticleURL,Status,AdminNotes'];
    const rows = items.map((i) => {
      const escape = (str?: string | null) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        i.id,
        i.type,
        new Date(i.createdAt).toLocaleString('en-IN'),
        escape(i.name),
        escape(i.email),
        escape(i.phone),
        escape(i.category),
        escape(i.subject),
        escape(i.message),
        escape(i.articleUrl),
        i.status,
        escape(i.adminNotes),
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `feedback_complaints_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-bold transition-all animate-bounce ${
            toastMessage.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
          }`}
        >
          {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                પ્રતિસાદ અને તકરાર નિવારણ (Feedback & Complaints)
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                વાચકોના પ્રતિસાદ, સૂચનો અને સમાચાર સંબંધી તકરારો/ફરિયાદોનું કેન્દ્રીય વ્યવસ્થાપન.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 disabled:opacity-50 transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>રીફ્રેશ (Refresh)</span>
          </button>
        </div>
      </div>

      {/* ── KPI Stats Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* All */}
        <button
          type="button"
          onClick={() => { setTypeFilter('ALL'); setStatusFilter('ALL'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            typeFilter === 'ALL' && statusFilter === 'ALL'
              ? 'border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800 shadow-sm ring-2 ring-zinc-900/10'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
            <span>બધા (All)</span>
            <Inbox className="w-4 h-4 text-zinc-400" />
          </div>
          <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.all}</span>
        </button>

        {/* Feedbacks */}
        <button
          type="button"
          onClick={() => { setTypeFilter('FEEDBACK'); setStatusFilter('ALL'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            typeFilter === 'FEEDBACK'
              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 shadow-sm ring-2 ring-blue-500/20'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <span>પ્રતિસાદ (Feedbacks)</span>
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.feedback}</span>
        </button>

        {/* Complaints */}
        <button
          type="button"
          onClick={() => { setTypeFilter('COMPLAINT'); setStatusFilter('ALL'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            typeFilter === 'COMPLAINT'
              ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 shadow-sm ring-2 ring-rose-500/20'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
            <span>ફરિયાદો (Complaints)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.complaint}</span>
        </button>

        {/* Pending Action */}
        <button
          type="button"
          onClick={() => { setStatusFilter('PENDING'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'PENDING'
              ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 shadow-sm ring-2 ring-amber-500/20'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
            <span>બાકી (Pending)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.pending}</span>
        </button>

        {/* Resolved */}
        <button
          type="button"
          onClick={() => { setStatusFilter('RESOLVED'); }}
          className={`p-4 rounded-2xl border text-left transition-all ${
            statusFilter === 'RESOLVED'
              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-sm ring-2 ring-emerald-500/20'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <span>નિરાકરણ (Resolved)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.resolved}</span>
        </button>
      </div>

      {/* ── Toolbar: Search & Tab Filters ── */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-full md:w-auto">
            {(['ALL', 'FEEDBACK', 'COMPLAINT'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  typeFilter === t
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {t === 'ALL' && 'બધા (All Types)'}
                {t === 'FEEDBACK' && 'પ્રતિસાદ (Feedbacks)'}
                {t === 'COMPLAINT' && 'તકરાર (Complaints)'}
              </button>
            ))}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-full md:w-auto">
            {(['ALL', 'PENDING', 'IN_REVIEW', 'RESOLVED'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`flex-1 md:flex-initial px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === s
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {s === 'ALL' && 'All Status'}
                {s === 'PENDING' && 'Pending'}
                {s === 'IN_REVIEW' && 'In Review'}
                {s === 'RESOLVED' && 'Resolved'}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search name, email, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Data Table ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-500 font-medium">રેકોર્ડ્સ લોડ થઈ રહ્યા છે...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200">કોઈ રેકોર્ડ મળ્યો નથી</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              પસંદ કરેલા ફિલ્ટર્સ અથવા સર્ચ મુજબ કોઈ પ્રતિસાદ કે ફરિયાદ ઉપલબ્ધ નથી.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-850/50 text-zinc-500 dark:text-zinc-400 uppercase font-black tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">તારીખ (Date)</th>
                  <th className="py-3.5 px-4">પ્રકાર (Type)</th>
                  <th className="py-3.5 px-4">વાચક (Citizen / User)</th>
                  <th className="py-3.5 px-4">કેટેગરી & વિષય (Topic)</th>
                  <th className="py-3.5 px-4">સંદેશ (Message)</th>
                  <th className="py-3.5 px-4">સ્થિતિ (Status)</th>
                  <th className="py-3.5 px-4 text-right">ક્રિયા (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800/80">
                {items.map((item) => {
                  const dateStr = new Date(item.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const timeStr = new Date(item.createdAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-850/40 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{dateStr}</div>
                        <div className="text-[10px] text-zinc-400 font-medium">{timeStr}</div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.type === 'COMPLAINT' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            COMPLAINT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                            <MessageSquare className="w-3 h-3 text-blue-500" />
                            FEEDBACK
                          </span>
                        )}
                      </td>

                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                          {item.name}
                        </div>
                        <div className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                          <a href={`mailto:${item.email}`} className="hover:text-red-500 truncate max-w-[150px]">
                            {item.email}
                          </a>
                        </div>
                        {item.phone && (
                          <div className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                            <a href={`tel:${item.phone}`} className="hover:text-red-500">
                              {item.phone}
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Category & Subject */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 mb-1">
                          {item.category}
                        </span>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 text-xs">
                          {item.subject}
                        </div>
                        {item.articleUrl && (
                          <a
                            href={item.articleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:underline mt-0.5"
                          >
                            <span>સંદર્ભ લિંક (Article)</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>

                      {/* Message Preview */}
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <p className="text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleQuickStatusChange(
                              item.id,
                              e.target.value as 'PENDING' | 'IN_REVIEW' | 'RESOLVED'
                            )
                          }
                          className={`text-[11px] font-black rounded-lg px-2.5 py-1 border transition-all cursor-pointer focus:outline-none ${
                            item.status === 'RESOLVED'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : item.status === 'IN_REVIEW'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-500/30'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          }`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="IN_REVIEW">IN REVIEW</option>
                          <option value="RESOLVED">RESOLVED</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetailModal(item)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                            title="વિગતો જુઓ (View Details)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(item.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            title="ડિલીટ કરો (Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail & Action Modal ── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <span
                  className={`p-2 rounded-xl ${
                    selectedItem.type === 'COMPLAINT'
                      ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600'
                      : 'bg-blue-100 dark:bg-blue-950/50 text-blue-600'
                  }`}
                >
                  {selectedItem.type === 'COMPLAINT' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <MessageSquare className="w-5 h-5" />
                  )}
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                    {selectedItem.type === 'COMPLAINT' ? 'ફરિયાદ વિગતો (Complaint Details)' : 'પ્રતિસાદ વિગતો (Feedback Details)'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    ID: {selectedItem.id.slice(0, 8).toUpperCase()} • {new Date(selectedItem.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDetailModal}
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* User Info Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                <div>
                  <span className="text-zinc-400 block text-[10px] font-bold uppercase">નામ (Name)</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{selectedItem.name}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] font-bold uppercase">ઇમેઇલ (Email)</span>
                  <a href={`mailto:${selectedItem.email}`} className="font-bold text-red-500 hover:underline">
                    {selectedItem.email}
                  </a>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] font-bold uppercase">મોબાઇલ (Phone)</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {selectedItem.phone || 'Not provided'}
                  </span>
                </div>
              </div>

              {/* Subject & Category */}
              <div>
                <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-1">
                  વિષય & કેટેગરી (Subject & Category)
                </span>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 mb-1">
                    {selectedItem.category}
                  </span>
                  <p className="font-bold text-zinc-900 dark:text-white text-sm">{selectedItem.subject}</p>
                </div>
              </div>

              {/* Article URL if present */}
              {selectedItem.articleUrl && (
                <div>
                  <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-1">
                    સંદર્ભ આર્ટિકલ લિંક (Article URL)
                  </span>
                  <a
                    href={selectedItem.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold hover:underline border border-red-500/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{selectedItem.articleUrl}</span>
                  </a>
                </div>
              )}

              {/* Full Message */}
              <div>
                <span className="text-zinc-400 block text-[10px] font-bold uppercase mb-1">
                  સંપૂર્ણ સંદેશ (Full Message)
                </span>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedItem.message}
                </div>
              </div>

              {/* Status Update & Admin Notes */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    સ્થિતિ અપડેટ કરો (Update Status):
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl font-bold text-xs border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  >
                    <option value="PENDING">PENDING (બાકી)</option>
                    <option value="IN_REVIEW">IN REVIEW (તપાસ હેઠળ)</option>
                    <option value="RESOLVED">RESOLVED (નિરાકરણ થઈ ગયું)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    એડમિન આંતરિક નોંધ (Internal Admin Notes / Action Taken):
                  </label>
                  <textarea
                    rows={3}
                    maxLength={1000}
                    placeholder="દા.ત. લેખકના ધ્યાને લાવીને પેરાગ્રાફ 2 માં તારીખ સુધારી છે અથવા વાચકને ઇમેઇલ મોકલ્યો છે..."
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs resize-none max-h-[120px] overflow-y-auto"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 p-4 sm:p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850">
              <button
                type="button"
                onClick={handleCloseDetailModal}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                બંધ કરો (Close)
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={modalUpdating}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-60 shadow-md"
              >
                {modalUpdating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>સાચવી રહ્યું છે...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>સેવ કરો (Save Changes)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-zinc-900 dark:text-white">રેકોર્ડ ડિલીટ કરવો છે?</h4>
              <p className="text-xs text-zinc-500 mt-1">
                આ રેકોર્ડ કાયમ માટે ડિલીટ થઈ જશે. શું આપ આગળ વધવા માંગો છો?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                રદ કરો (Cancel)
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-60"
              >
                {isDeleting ? 'ડિલીટ થઈ રહ્યું છે...' : 'હા, ડિલીટ કરો'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
