'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  Save,
  ExternalLink,
  Trash2,
  CheckCircle,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Shield,
  Share2,
  Inbox,
  Check,
  RefreshCw,
  Search,
  Eye,
  Send,
  HelpCircle,
  Map,
  Filter,
  CheckCheck,
  X,
  Copy,
  User,
  Calendar,
  Tag,
  MessageSquare,
  ChevronDown,
  Download,
} from 'lucide-react';
import {
  getAdminContact,
  updateAdminContact,
  getAdminContactMessages,
  toggleAdminContactMessageRead,
  deleteAdminContactMessage,
  markAllAdminContactMessagesRead,
} from '@/lib/api';

interface SocialLinks {
  whatsapp: string;
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
}

function cleanMapUrl(val: string): string {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  const match = trimmed.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

function getDepartmentBadge(dept?: string) {
  if (!dept) {
    return {
      bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
      dot: 'bg-zinc-400',
      label: 'General Inquiry',
    };
  }
  const d = dept.toLowerCase();
  if (d.includes('editorial') || d.includes('સંપાદકીય')) {
    return {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
      dot: 'bg-indigo-500',
      label: dept,
    };
  }
  if (d.includes('advertisement') || d.includes('જાહેરાત')) {
    return {
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
      dot: 'bg-amber-500',
      label: dept,
    };
  }
  if (d.includes('grievance') || d.includes('તકરાર')) {
    return {
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
      dot: 'bg-rose-500',
      label: dept,
    };
  }
  if (d.includes('e-paper') || d.includes('ઈ-પેપર')) {
    return {
      bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
      dot: 'bg-purple-500',
      label: dept,
    };
  }
  return {
    bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900',
    dot: 'bg-sky-500',
    label: dept,
  };
}

function getWhatsAppUrl(phone?: string, name?: string, subject?: string) {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return null;
  const fullPhone = digits.length === 10 ? `91${digits}` : digits;
  const topic = subject ? ` regarding "${subject}"` : '';
  const text = encodeURIComponent(
    `Hello ${name || ''}, Gujarat Post Editorial Team here. We received your inquiry${topic} on our portal and are contacting you.`
  );
  return `https://wa.me/${fullPhone}?text=${text}`;
}

function getInitials(name?: string) {
  if (!name || !name.trim()) return 'GP';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

function formatMessageTime(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminContactPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'main' | 'departments' | 'messages'>('main');

  // Contact settings form state
  const [formData, setFormData] = useState({
    pageTitle: 'સંપર્ક કરો (Contact Us)',
    pageSubtitle: 'કોઈપણ સમાચાર, પ્રેસ નોટ, જાહેરાત કે માહિતી માટે અમારો સંપર્ક સાધો.',
    headOfficeAddress: 'ગુજરાત પોસ્ટ ભવન, એસ.જી. હાઈવે, પ્રહલાદ નગર, અમદાવાદ - 380015, ગુજરાત.',
    primaryPhone: '+91 99099 07237',
    whatsappNumber: '+91 99099 07237',
    primaryEmail: 'contact@gujaratpost.in',
    workingHours: 'સોમવાર - શનિવાર: સવારે 9:00 થી રાત્રે 9:00 | 24x7 ન્યૂઝ ડેસ્ક',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117506.44754760882!2d72.43965561026046!3d23.02015809244018!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e848aba5bd449%3A0x4fcedd11614f6516!2sAhmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
    editorialEmail: 'editorial@gujaratpost.in',
    editorialPhone: '+91 99099 07237',
    adsEmail: 'ads@gujaratpost.in',
    adsPhone: '+91 99099 07237',
    grievanceName: 'મહેશ પટેલ (Mahesh Patel)',
    grievanceDesignation: 'તકરાર નિવારણ અધિકારી (Grievance Redressal Officer)',
    grievanceEmail: 'grievance@gujaratpost.in',
    grievanceAddress: 'ગુજરાત પોસ્ટ મુખ્ય કાર્યાલય, અમદાવાદ, ગુજરાત - 380015',
    socialLinks: {
      whatsapp: 'https://api.whatsapp.com/send/?phone=919909907237&text&type=phone_number&app_absent=0',
      facebook: 'https://www.facebook.com/Gujarat-Post-165183530766504',
      twitter: 'https://x.com/maheshrpat59606',
      instagram: 'https://instagram.com/gujaratpost',
      youtube: 'https://youtube.com/@gujaratpost',
    } as SocialLinks,
  });

  // Messages state & filters
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week'>('all');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getAdminContact();
      if (data) {
        setFormData({
          pageTitle: data.pageTitle || 'સંપર્ક કરો (Contact Us)',
          pageSubtitle: data.pageSubtitle || '',
          headOfficeAddress: data.headOfficeAddress || '',
          primaryPhone: data.primaryPhone || '+91 99099 07237',
          whatsappNumber: data.whatsappNumber || '+91 99099 07237',
          primaryEmail: data.primaryEmail || 'contact@gujaratpost.in',
          workingHours: data.workingHours || '',
          mapEmbedUrl: cleanMapUrl(data.mapEmbedUrl || ''),
          editorialEmail: data.editorialEmail || 'editorial@gujaratpost.in',
          editorialPhone: data.editorialPhone || '+91 99099 07237',
          adsEmail: data.adsEmail || 'ads@gujaratpost.in',
          adsPhone: data.adsPhone || '+91 99099 07237',
          grievanceName: data.grievanceName || 'મહેશ પટેલ (Mahesh Patel)',
          grievanceDesignation: data.grievanceDesignation || 'તકરાર નિવારણ અધિકારી (Grievance Redressal Officer)',
          grievanceEmail: data.grievanceEmail || 'grievance@gujaratpost.in',
          grievanceAddress: data.grievanceAddress || '',
          socialLinks: data.socialLinksJson && typeof data.socialLinksJson === 'object'
            ? data.socialLinksJson
            : formData.socialLinks,
        });
      }
    } catch (err: any) {
      console.error('Error loading contact settings:', err);
      setErrorMessage(err?.message || 'Failed to load contact settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const list = await getAdminContactMessages();
      setMessages(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchMessages();
  }, []);

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [activeTab]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const payload = {
        pageTitle: formData.pageTitle,
        pageSubtitle: formData.pageSubtitle,
        headOfficeAddress: formData.headOfficeAddress,
        primaryPhone: formData.primaryPhone,
        whatsappNumber: formData.whatsappNumber,
        primaryEmail: formData.primaryEmail,
        workingHours: formData.workingHours,
        mapEmbedUrl: cleanMapUrl(formData.mapEmbedUrl),
        editorialEmail: formData.editorialEmail,
        editorialPhone: formData.editorialPhone,
        adsEmail: formData.adsEmail,
        adsPhone: formData.adsPhone,
        grievanceName: formData.grievanceName,
        grievanceDesignation: formData.grievanceDesignation,
        grievanceEmail: formData.grievanceEmail,
        grievanceAddress: formData.grievanceAddress,
        bureauOfficesJson: [],
        socialLinksJson: formData.socialLinks,
      };

      await updateAdminContact(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error updating contact settings:', err);
      setErrorMessage(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Message read toggle
  const handleToggleRead = async (id: string, currentRead: boolean) => {
    try {
      await toggleAdminContactMessageRead(id, !currentRead);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: !currentRead } : m))
      );
      if (selectedMessage?.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, isRead: !currentRead } : null));
      }
    } catch (err) {
      console.error('Failed to toggle message read status:', err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('શું તમે ખરેખર આ સંદેશ ડિલીટ કરવા માંગો છો? (Are you sure you want to delete this message?)')) {
      return;
    }
    try {
      await deleteAdminContactMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAllRead) return;
    setMarkingAllRead(true);
    try {
      await markAllAdminContactMessagesRead();
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all messages as read:', err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleResetFilters = () => {
    setMessageSearch('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setTimeFilter('all');
    setDateSort('newest');
  };

  const handleExportCsv = () => {
    if (filteredMessages.length === 0) return;
    const headers = ['Date', 'Name', 'Email', 'Phone', 'Department', 'Subject', 'Message', 'Status'];
    const rows = filteredMessages.map((m) => [
      `"${new Date(m.createdAt).toLocaleString('en-IN')}"`,
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${(m.email || '').replace(/"/g, '""')}"`,
      `"${(m.phone || '').replace(/"/g, '""')}"`,
      `"${(m.department || '').replace(/"/g, '""')}"`,
      `"${(m.subject || '').replace(/"/g, '""')}"`,
      `"${(m.message || '').replace(/"/g, '""')}"`,
      `"${m.isRead ? 'Read' : 'Unread'}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gujarat_post_inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCount = messages.length;
  const unreadCount = messages.filter((m) => !m.isRead).length;
  const readCount = messages.filter((m) => m.isRead).length;
  const todayCount = messages.filter((m) => {
    const msgDate = new Date(m.createdAt);
    const now = new Date();
    return (
      msgDate.getDate() === now.getDate() &&
      msgDate.getMonth() === now.getMonth() &&
      msgDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    messages.forEach((m) => {
      if (m.department && m.department.trim()) {
        set.add(m.department.trim());
      }
    });
    return Array.from(set);
  }, [messages]);

  const hasActiveFilters =
    Boolean(messageSearch.trim()) ||
    statusFilter !== 'all' ||
    departmentFilter !== 'all' ||
    timeFilter !== 'all' ||
    dateSort !== 'newest';

  const filteredMessages = useMemo(() => {
    return messages
      .filter((m) => {
        // Status filter
        if (statusFilter === 'unread' && m.isRead) return false;
        if (statusFilter === 'read' && !m.isRead) return false;

        // Department filter
        if (departmentFilter !== 'all' && m.department?.trim() !== departmentFilter) {
          return false;
        }

        // Time filter
        if (timeFilter !== 'all') {
          const msgDate = new Date(m.createdAt);
          const now = new Date();
          if (timeFilter === 'today') {
            const isToday =
              msgDate.getDate() === now.getDate() &&
              msgDate.getMonth() === now.getMonth() &&
              msgDate.getFullYear() === now.getFullYear();
            if (!isToday) return false;
          } else if (timeFilter === 'week') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (msgDate < sevenDaysAgo) return false;
          }
        }

        // Search text
        if (messageSearch.trim()) {
          const q = messageSearch.toLowerCase();
          return (
            m.name?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q) ||
            m.phone?.toLowerCase().includes(q) ||
            m.subject?.toLowerCase().includes(q) ||
            m.department?.toLowerCase().includes(q) ||
            m.message?.toLowerCase().includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return dateSort === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [messages, messageSearch, statusFilter, departmentFilter, timeFilter, dateSort]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-[#28B5E8]" />
        <p className="text-sm font-medium text-zinc-500">સંપર્ક સેટિંગ્સ લોડ થઈ રહી છે...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 px-3 sm:px-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#28B5E8] to-[#1598c7] text-white shadow-md shadow-[#28B5E8]/20 shrink-0">
            <PhoneCall className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                સંપર્ક પેજ મેનેજમેન્ટ (Contact Us Settings)
              </h1>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                લાઇવ
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              મુખ્ય કાર્યાલયનું સરનામું, WhatsApp, ઈમેલ, રીજનલ બ્યુરો ઓફિસો અને મુલાકાતીઓના સંદેશાઓ મેનેજ કરો
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/contact"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs sm:text-sm font-bold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <ExternalLink className="h-4 w-4" />
            પેજ જુઓ (View)
          </Link>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#28B5E8] px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#28B5E8]/25 transition hover:bg-[#209ac7] disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'સેવ થાય છે...' : saveSuccess ? 'સેવ થઈ ગયું!' : 'ફેરફાર સેવ કરો'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span>સંપર્ક સેટિંગ્સ સફળતાપૂર્વક અપડેટ થઈ ગઈ છે! (Contact settings saved successfully)</span>
        </div>
      )}

      {/* ── Tabs Navigation ── */}
      <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('main')}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'main'
              ? 'border-[#28B5E8] text-[#28B5E8]'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Building2 className="h-4 w-4" />
          મુખ્ય કાર્યાલય & વિગતો (Main Office)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('departments')}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'departments'
              ? 'border-[#28B5E8] text-[#28B5E8]'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Shield className="h-4 w-4" />
          વિભાગો & તકરાર નિવારણ (Departments & Grievance)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'messages'
              ? 'border-[#28B5E8] text-[#28B5E8]'
              : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          <Inbox className="h-4 w-4" />
          આવેલા સંદેશાઓ (Messages Inbox)
          {unreadCount > 0 && (
            <span className="ml-1 rounded-full bg-red-500 px-2 py-0.2 text-[11px] font-black text-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab 1: Main Info & Office ── */}
      {activeTab === 'main' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-[#28B5E8]" />
              પેજ હેડર અને મુખ્ય સંપર્ક વિગતો
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  પેજ શીર્ષક (Page Header Title)
                </label>
                <input
                  type="text"
                  value={formData.pageTitle}
                  onChange={(e) => setFormData({ ...formData, pageTitle: e.target.value })}
                  placeholder="સંપર્ક કરો (Contact Us)"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none focus:ring-2 focus:ring-[#28B5E8]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  પેજ પેટા શીર્ષક / વર્ણન (Page Subtitle)
                </label>
                <textarea
                  rows={2}
                  value={formData.pageSubtitle}
                  onChange={(e) => setFormData({ ...formData, pageSubtitle: e.target.value })}
                  placeholder="કોઈપણ સમાચાર, પ્રેસ નોટ, જાહેરાત કે માહિતી માટે અમારા પત્રકાર મિત્રોનો સંપર્ક કરો..."
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none focus:ring-2 focus:ring-[#28B5E8]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  મુખ્ય કાર્યાલયનું સરનામું (Head Office Full Address)
                </label>
                <textarea
                  rows={2}
                  value={formData.headOfficeAddress}
                  onChange={(e) => setFormData({ ...formData, headOfficeAddress: e.target.value })}
                  placeholder="ગુજરાત પોસ્ટ ભવન, એસ.જી. હાઈવે, પ્રહલાદ નગર, અમદાવાદ - 380015, ગુજરાત."
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none focus:ring-2 focus:ring-[#28B5E8]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-blue-500" />
                  મુખ્ય ફોન નંબર (Primary Calling Phone)
                </label>
                <input
                  type="text"
                  value={formData.primaryPhone}
                  onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                  placeholder="+91 99099 07237"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none focus:ring-2 focus:ring-[#28B5E8]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                  વોટ્સએપ હેલ્પલાઇન (WhatsApp Helpline Direct)
                </label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="+91 99099 07237"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none focus:ring-2 focus:ring-[#28B5E8]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-amber-500" />
                  મુખ્ય સત્તાવાર ઈમેલ (Primary Official Email)
                </label>
                <input
                  type="email"
                  value={formData.primaryEmail}
                  onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                  placeholder="contact@gujaratpost.in"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none focus:ring-2 focus:ring-[#28B5E8]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-purple-500" />
                  કાર્યાલય સમય (Working Hours / News Desk)
                </label>
                <input
                  type="text"
                  value={formData.workingHours}
                  onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                  placeholder="સોમવાર - શનિવાર: સવારે 9:00 થી રાત્રે 9:00 | 24x7 ન્યૂઝ ડેસ્ક"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none focus:ring-2 focus:ring-[#28B5E8]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Map className="h-3.5 w-3.5 text-red-500" />
                  ગૂગલ મેપ્સ એમ્બેડ લિંક (Google Maps Embed URL)
                </label>
                <input
                  type="text"
                  value={formData.mapEmbedUrl}
                  onChange={(e) => {
                    const clean = cleanMapUrl(e.target.value);
                    setFormData({ ...formData, mapEmbedUrl: clean });
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    const clean = cleanMapUrl(pasted);
                    if (clean && clean !== pasted) {
                      e.preventDefault();
                      setFormData({ ...formData, mapEmbedUrl: clean });
                    }
                  }}
                  placeholder="https://www.google.com/maps/embed?..."
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none focus:ring-2 focus:ring-[#28B5E8]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 font-mono text-xs"
                />
                <p className="mt-1 text-[11px] text-zinc-500">
                  ગૂગલ મેપ પર Share &gt; Embed a map માંથી આખો iframe કોડ પેસ્ટ કરશો તો પણ લિંક આપોઆપ સેટ થઈ જશે.
                </p>
              </div>

              {formData.mapEmbedUrl && (
                <div className="md:col-span-2 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5">
                    <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                      મેપ પ્રિવ્યુ (Map Preview):
                    </p>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      સક્રિય મેપ લિંક
                    </span>
                  </div>
                  <iframe
                    src={cleanMapUrl(formData.mapEmbedUrl)}
                    width="100%"
                    height="240"
                    style={{ border: 0 }}
                    loading="lazy"
                    title="Map Preview"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Departments & Grievance ── */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          {/* Department contacts card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5 text-[#28B5E8]" />
              વિભાગીય સંપર્ક વિગતો (Department Contacts)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Editorial */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                <h3 className="text-sm font-black text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  સંપાદકીય વિભાગ (Editorial & News Desk)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      સંપાદકીય ઈમેલ (Editorial Email)
                    </label>
                    <input
                      type="email"
                      value={formData.editorialEmail}
                      onChange={(e) => setFormData({ ...formData, editorialEmail: e.target.value })}
                      placeholder="editorial@gujaratpost.in"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      સંપાદકીય ફોન (Editorial Phone)
                    </label>
                    <input
                      type="text"
                      value={formData.editorialPhone}
                      onChange={(e) => setFormData({ ...formData, editorialPhone: e.target.value })}
                      placeholder="+91 99099 07237"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Advertisement */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
                <h3 className="text-sm font-black text-amber-900 dark:text-amber-300 mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  જાહેરાત & માર્કેટિંગ (Advertisement & Business)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      જાહેરાત ઈમેલ (Ads Email)
                    </label>
                    <input
                      type="email"
                      value={formData.adsEmail}
                      onChange={(e) => setFormData({ ...formData, adsEmail: e.target.value })}
                      placeholder="ads@gujaratpost.in"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                      જાહેરાત ફોન (Ads Phone)
                    </label>
                    <input
                      type="text"
                      value={formData.adsPhone}
                      onChange={(e) => setFormData({ ...formData, adsPhone: e.target.value })}
                      placeholder="+91 99099 07237"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grievance officer card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                તકરાર નિવારણ અધિકારી (Grievance Redressal Officer)
              </h2>
              <span className="text-xs bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-bold px-2.5 py-1 rounded-md border border-red-200 dark:border-red-900">
                કાનૂની નિયમ (IT Rules 2021)
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              ડિજિટલ મીડિયા આચારસંહિતા હેઠળ વાચકોના વાંધા અને ફરિયાદોના નિવારણ માટે નિયુક્ત અધિકારીની વિગત:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  અધિકારીનું નામ (Officer Name)
                </label>
                <input
                  type="text"
                  value={formData.grievanceName}
                  onChange={(e) => setFormData({ ...formData, grievanceName: e.target.value })}
                  placeholder="મહેશ પટેલ (Mahesh Patel)"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  હોદ્દો (Designation)
                </label>
                <input
                  type="text"
                  value={formData.grievanceDesignation}
                  onChange={(e) => setFormData({ ...formData, grievanceDesignation: e.target.value })}
                  placeholder="તકરાર નિવારણ અધિકારી (Grievance Redressal Officer)"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  ફરિયાદ ઈમેલ (Grievance Email)
                </label>
                <input
                  type="email"
                  value={formData.grievanceEmail}
                  onChange={(e) => setFormData({ ...formData, grievanceEmail: e.target.value })}
                  placeholder="grievance@gujaratpost.in"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  સરનામું (Address)
                </label>
                <input
                  type="text"
                  value={formData.grievanceAddress}
                  onChange={(e) => setFormData({ ...formData, grievanceAddress: e.target.value })}
                  placeholder="ગુજરાત પોસ્ટ મુખ્ય કાર્યાલય, અમદાવાદ, ગુજરાત - 380015"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-[#28B5E8] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Social media links card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
              <Share2 className="h-5 w-5 text-purple-500" />
              સોશિયલ મીડિયા લિંક્સ (Social Media Links)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  WhatsApp Link / Channel
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.whatsapp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, whatsapp: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-[#28B5E8] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Facebook Page
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.facebook}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, facebook: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-[#28B5E8] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Twitter / X Profile
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.twitter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, twitter: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-[#28B5E8] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Instagram Profile
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.instagram}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, instagram: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-[#28B5E8] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  YouTube Channel
                </label>
                <input
                  type="text"
                  value={formData.socialLinks.youtube}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, youtube: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-[#28B5E8] focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Messages Inbox ── */}
      {activeTab === 'messages' && (
        <div className="space-y-5">
          {/* Top header bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-[#28B5E8]" />
                  <span>મુલાકાતીઓના સંદેશાઓ (Visitor Inquiries)</span>
                </h2>
                <span className="rounded-full bg-[#28B5E8]/10 px-2.5 py-0.5 text-xs font-black text-[#28B5E8]">
                  {totalCount} Total
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                વાચકો અને જાહેરાતકર્તાઓ દ્વારા પબ્લિક સંપર્ક પેજ પરથી મોકલાયેલા સંદેશાઓ અને પૂછપરછ.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Export CSV Button */}
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredMessages.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 transition cursor-pointer shadow-2xs"
                title="ડેટા CSV માં ડાઉનલોડ કરો"
              >
                <Download className="h-3.5 w-3.5 text-zinc-500" />
                <span>Export CSV</span>
              </button>

              {/* Mark All Read Button */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAllRead}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-900/40 transition cursor-pointer shadow-2xs"
                  title="બધા સંદેશાઓ વંચાઈ ગયા તરીકે માર્ક કરો"
                >
                  <CheckCheck className={`h-3.5 w-3.5 ${markingAllRead ? 'animate-spin' : ''}`} />
                  <span>બધા વંચાઈ ગયા (Mark All Read)</span>
                </button>
              )}

              {/* Refresh Button */}
              <button
                type="button"
                onClick={fetchMessages}
                disabled={messagesLoading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 cursor-pointer shadow-2xs transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${messagesLoading ? 'animate-spin' : ''}`} />
                <span>રીફ્રેશ (Refresh)</span>
              </button>
            </div>
          </div>

          {/* ── Status KPIs / Quick Filter Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* All */}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-200 text-left cursor-pointer group ${
                statusFilter === 'all'
                  ? 'border-[#28B5E8] bg-gradient-to-br from-[#28B5E8]/10 via-white to-sky-50/30 dark:from-[#28B5E8]/20 dark:via-zinc-900 dark:to-zinc-900 shadow-md ring-2 ring-[#28B5E8]/20'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                  All Messages (બધા)
                </span>
                <div
                  className={`p-2 rounded-xl transition ${
                    statusFilter === 'all'
                      ? 'bg-[#28B5E8] text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                  }`}
                >
                  <Inbox className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {totalCount}
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">total received</span>
              </div>
            </button>

            {/* Unread */}
            <button
              type="button"
              onClick={() => setStatusFilter('unread')}
              className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-200 text-left cursor-pointer group ${
                statusFilter === 'unread'
                  ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50/30 dark:from-emerald-500/20 dark:via-zinc-900 dark:to-zinc-900 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                    Unread (વણવાંચેલા)
                  </span>
                  {unreadCount > 0 && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <div
                  className={`p-2 rounded-xl transition ${
                    statusFilter === 'unread'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {unreadCount}
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">requires action</span>
              </div>
            </button>

            {/* Read */}
            <button
              type="button"
              onClick={() => setStatusFilter('read')}
              className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-200 text-left cursor-pointer group ${
                statusFilter === 'read'
                  ? 'border-blue-500 bg-gradient-to-br from-blue-500/10 via-white to-blue-50/30 dark:from-blue-500/20 dark:via-zinc-900 dark:to-zinc-900 shadow-md ring-2 ring-blue-500/20'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                  Read (વંચાઈ ગયેલા)
                </span>
                <div
                  className={`p-2 rounded-xl transition ${
                    statusFilter === 'read'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                  }`}
                >
                  <CheckCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {readCount}
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">completed</span>
              </div>
            </button>

            {/* Today */}
            <button
              type="button"
              onClick={() => setTimeFilter(timeFilter === 'today' ? 'all' : 'today')}
              className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-200 text-left cursor-pointer group ${
                timeFilter === 'today'
                  ? 'border-purple-500 bg-gradient-to-br from-purple-500/10 via-white to-purple-50/30 dark:from-purple-500/20 dark:via-zinc-900 dark:to-zinc-900 shadow-md ring-2 ring-purple-500/20'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold tracking-wider text-purple-600 dark:text-purple-400 uppercase">
                  Today (આજના)
                </span>
                <div
                  className={`p-2 rounded-xl transition ${
                    timeFilter === 'today'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
                  {todayCount}
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">new inquiries</span>
              </div>
            </button>
          </div>

          {/* ── Search & Filter Control Bar (Spacious & Responsive) ── */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
              {/* Search input */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  placeholder="નામ, ઈમેલ, ફોન, વિષય અથવા સંદેશમાં શોધો..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-zinc-900 focus:border-[#28B5E8] focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 transition shadow-2xs"
                />
                {messageSearch && (
                  <button
                    type="button"
                    onClick={() => setMessageSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Department filter */}
              <div className="w-full lg:w-64 shrink-0">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-800 focus:border-[#28B5E8] focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 font-medium cursor-pointer shadow-2xs transition"
                >
                  <option value="all">વિભાગ: બધા (All Departments)</option>
                  <option value="Editorial / News Tip">Editorial / News Tip</option>
                  <option value="Advertisement Inquiry">Advertisement Inquiry</option>
                  <option value="E-Paper / Subscription">E-Paper / Subscription</option>
                  <option value="Grievance / Correction">Grievance / Correction</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="સંપાદકીય / ન્યૂઝ ટીપ (Editorial)">સંપાદકીય (Editorial)</option>
                  <option value="જાહેરાત પૂછપરછ (Advertisement)">જાહેરાત (Advertisement)</option>
                  <option value="ઈ-પેપર / સબસ્ક્રિપ્શન (E-Paper)">ઈ-પેપર (E-Paper)</option>
                  <option value="તકરાર / સુધારો (Grievance)">તકરાર નિવારણ (Grievance)</option>
                  <option value="સામાન્ય પૂછપરછ (General)">સામાન્ય (General)</option>
                  {departmentsList
                    .filter(
                      (d: string) =>
                        ![
                          'Editorial / News Tip',
                          'Advertisement Inquiry',
                          'E-Paper / Subscription',
                          'Grievance / Correction',
                          'General Inquiry',
                          'સંપાદકીય / ન્યૂઝ ટીપ (Editorial)',
                          'જાહેરાત પૂછપરછ (Advertisement)',
                          'ઈ-પેપર / સબસ્ક્રિપ્શન (E-Paper)',
                          'તકરાર / સુધારો (Grievance)',
                          'સામાન્ય પૂછપરછ (General)',
                        ].includes(d)
                    )
                    .map((dept: string) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                </select>
              </div>

              {/* Time filter */}
              <div className="w-full sm:w-48 lg:w-44 shrink-0">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-800 focus:border-[#28B5E8] focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 font-medium cursor-pointer shadow-2xs transition"
                >
                  <option value="all">સમય: તમામ (All Time)</option>
                  <option value="today">આજે (Today)</option>
                  <option value="week">છેલ્લા 7 દિવસ (Last 7 Days)</option>
                </select>
              </div>

              {/* Sort Order */}
              <div className="w-full sm:w-48 lg:w-44 shrink-0">
                <select
                  value={dateSort}
                  onChange={(e) => setDateSort(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-800 focus:border-[#28B5E8] focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 font-medium cursor-pointer shadow-2xs transition"
                >
                  <option value="newest">સૌથી નવા પહેલા (Newest)</option>
                  <option value="oldest">સૌથી જૂના પહેલા (Oldest)</option>
                </select>
              </div>
            </div>

            {/* Active filters pill & results count */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <div className="text-zinc-500 font-medium flex items-center gap-2 flex-wrap">
                <span>
                  કુલ <span className="font-bold text-zinc-800 dark:text-zinc-200">{filteredMessages.length}</span> સંદેશાઓ મળ્યા
                  {hasActiveFilters && (
                    <span className="text-zinc-400"> (કુલ {totalCount} માંથી)</span>
                  )}
                </span>
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Status: {statusFilter}
                    <button type="button" onClick={() => setStatusFilter('all')} className="hover:text-red-500 cursor-pointer">×</button>
                  </span>
                )}
                {departmentFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Dept: {departmentFilter}
                    <button type="button" onClick={() => setDepartmentFilter('all')} className="hover:text-red-500 cursor-pointer">×</button>
                  </span>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 cursor-pointer transition hover:underline"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>ફિલ્ટર્સ સાફ કરો (Reset Filters)</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Messages List ── */}
          {filteredMessages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50">
              <Inbox className="mx-auto h-12 w-12 text-zinc-400 mb-2 opacity-40" />
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">કોઈ સંદેશ મળેલ નથી (No Messages Found)</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'પસંદ કરેલા ફિલ્ટર્સ મુજબ કોઈ સંદેશ મળ્યો નથી. ફિલ્ટર સાફ કરીને ફરી પ્રયાસ કરો.'
                  : 'મુલાકાતીઓ સંપર્ક પેજ પરથી ફોર્મ ભરશે ત્યારે તેમના સંદેશાઓ અહીં વિગતો સાથે દેખાશે.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>બધા ફિલ્ટર્સ સાફ કરો</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredMessages.map((msg: ContactMessageItem) => {
                const deptInfo = getDepartmentBadge(msg.department);
                const whatsappUrl = getWhatsAppUrl(msg.phone, msg.name, msg.subject);
                const initials = getInitials(msg.name);
                const timeAgo = formatMessageTime(msg.createdAt);

                return (
                  <div
                    key={msg.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      msg.isRead
                        ? 'border-zinc-200/90 bg-white/95 dark:border-zinc-800 dark:bg-zinc-900/90 shadow-2xs hover:shadow-sm border-l-4 border-l-zinc-300 dark:border-l-zinc-700'
                        : 'border-[#28B5E8]/40 bg-white dark:border-[#28B5E8]/30 dark:bg-zinc-900 shadow-sm hover:shadow-md border-l-4 border-l-[#28B5E8] ring-1 ring-[#28B5E8]/10'
                    }`}
                  >
                    <div className="p-3 sm:p-3.5 space-y-2">
                      {/* Top Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
                        {/* Sender Avatar & Info */}
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs tracking-wider ${
                              msg.isRead
                                ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                                : 'bg-gradient-to-tr from-[#28B5E8] to-blue-600 text-white shadow-blue-500/20'
                            }`}
                          >
                            {initials}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                              {msg.name}
                            </h3>
                            {/* Department badge with dot */}
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold border ${deptInfo.bg}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${deptInfo.dot}`} />
                              <span>{deptInfo.label}</span>
                            </span>
                            {/* Unread / Read indicator */}
                            {!msg.isRead ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                                નવો સંદેશ (Unread)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                <Check className="h-2.5 w-2.5 text-zinc-400" />
                                વંચાઈ ગયું
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timestamp & Quick Action Icons */}
                        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            <span title={new Date(msg.createdAt).toLocaleString('en-IN')}>
                              {timeAgo}
                            </span>
                          </div>

                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => setSelectedMessage(msg)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-[#28B5E8] hover:bg-[#28B5E8]/10 dark:hover:bg-zinc-800 transition cursor-pointer"
                              title="સંપૂર્ણ વિગતો જુઓ (View Full Details)"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition cursor-pointer"
                              title="સંદેશ ડિલીટ કરો"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Subject Line */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#28B5E8] bg-[#28B5E8]/10 px-1.5 py-0.5 rounded">
                          Subject
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {msg.subject}
                        </span>
                      </div>

                      {/* Compact Message Content Box */}
                      <div className="relative group/msg rounded-lg border border-zinc-200/70 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/30 px-3 py-2 text-xs sm:text-[13px] text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed shadow-2xs">
                        <p>{msg.message}</p>
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.message, `msg-${msg.id}`)}
                          className="absolute right-2 top-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/95 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shadow-2xs hover:bg-white cursor-pointer"
                          title="સંદેશ કોપી કરો"
                        >
                          {copiedKey === `msg-${msg.id}` ? (
                            <>
                              <Check className="h-2.5 w-2.5 text-emerald-500" />
                              <span className="text-emerald-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-2.5 w-2.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Bottom Contact & Action Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                        {/* Contact details */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Email */}
                          <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shadow-2xs">
                            <Mail className="h-3 w-3 text-blue-500 shrink-0" />
                            <a
                              href={`mailto:${msg.email}`}
                              className="font-medium text-blue-600 hover:underline dark:text-blue-400 text-xs"
                              title="ઈમેલ મોકલો"
                            >
                              {msg.email}
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyText(msg.email, `email-${msg.id}`)}
                              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition p-0.5 cursor-pointer"
                              title="ઈમેલ કોપી કરો"
                            >
                              {copiedKey === `email-${msg.id}` ? (
                                <Check className="h-2.5 w-2.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-2.5 w-2.5" />
                              )}
                            </button>
                          </div>

                          {/* Phone */}
                          {msg.phone && (
                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shadow-2xs">
                              <Phone className="h-3 w-3 text-emerald-500 shrink-0" />
                              <a
                                href={`tel:${msg.phone}`}
                                className="font-medium text-emerald-600 hover:underline dark:text-emerald-400 text-xs"
                                title="કૉલ કરો"
                              >
                                {msg.phone}
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyText(msg.phone || '', `phone-${msg.id}`)}
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition p-0.5 cursor-pointer"
                                title="ફોન નંબર કોપી કરો"
                              >
                                {copiedKey === `phone-${msg.id}` ? (
                                  <Check className="h-2.5 w-2.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-2.5 w-2.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Quick Interactive Actions (Only WhatsApp & Mark Read) */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Direct WhatsApp button */}
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] px-2.5 py-1 text-xs font-bold text-white shadow-2xs transition cursor-pointer active:scale-95"
                              title="વોટ્સએપ પર ચેટ કરો"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          {/* Mark Read/Unread Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleRead(msg.id, msg.isRead)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer shadow-2xs ${
                              msg.isRead
                                ? 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>{msg.isRead ? 'Mark Unread' : 'Mark Read'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Message Detail Modal (Slide-over / Dialog) ── */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#28B5E8] to-blue-600 text-white font-black text-sm shadow-md">
                  {getInitials(selectedMessage.name)}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                    {selectedMessage.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-500 font-medium">
                      {new Date(selectedMessage.createdAt).toLocaleString('gu-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${getDepartmentBadge(selectedMessage.department).bg}`}
                    >
                      {getDepartmentBadge(selectedMessage.department).label}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-400 block font-medium mb-0.5">Email Address:</span>
                <a href={`mailto:${selectedMessage.email}`} className="font-bold text-blue-600 hover:underline">
                  {selectedMessage.email}
                </a>
              </div>
              <div>
                <span className="text-zinc-400 block font-medium mb-0.5">Phone Number:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {selectedMessage.phone || 'Not provided'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-zinc-400 block font-medium mb-0.5">Subject:</span>
                <span className="font-bold text-zinc-900 dark:text-white text-sm">
                  {selectedMessage.subject}
                </span>
              </div>
            </div>

            {/* Full Message Body */}
            <div>
              <span className="text-xs font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">
                Full Inquiry Message
              </span>
              <div className="rounded-xl border border-zinc-200/80 bg-white dark:bg-zinc-800 p-4 text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed shadow-2xs font-sans">
                {selectedMessage.message}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                {selectedMessage.phone && getWhatsAppUrl(selectedMessage.phone, selectedMessage.name, selectedMessage.subject) && (
                  <a
                    href={getWhatsAppUrl(selectedMessage.phone, selectedMessage.name, selectedMessage.subject)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] px-4 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp Chat</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleToggleRead(selectedMessage.id, selectedMessage.isRead);
                    setSelectedMessage((prev) => (prev ? { ...prev, isRead: !prev.isRead } : null));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{selectedMessage.isRead ? 'Mark Unread' : 'Mark as Read'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteMessage(selectedMessage.id);
                  }}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                  title="Delete message"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Save Action Bar ── */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-zinc-500 flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-[#28B5E8]" />
          ફેરફારો તરત જ પબ્લિક સંપર્ક પેજ (<code className="font-mono text-[#28B5E8]">/contact</code>) પર લાઇવ થશે.
        </div>
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#28B5E8] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#28B5E8]/25 transition hover:bg-[#209ac7] disabled:opacity-60 cursor-pointer"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'સેવ થાય છે...' : saveSuccess ? 'સેવ થઈ ગયું!' : 'બધા ફેરફારો સેવ કરો (Save All)'}
        </button>
      </div>
    </div>
  );
}
