'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Copy,
  Check,
  Plus,
  AlertCircle,
  Filter,
  Shield,
  Smartphone,
  Laptop,
  Calendar,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Activity,
  Globe,
} from 'lucide-react';
import {
  getAdminWebsiteUsers,
  updateAdminWebsiteUser,
  deleteAdminWebsiteUser,
  createAdminWebsiteUser,
} from '@/lib/api';

interface WebsiteUserItem {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  status: 'ACTIVE' | 'BLOCKED';
  isVerified: boolean;
  loginCount: number;
  lastLoginAt: string;
  lastIp?: string | null;
  userAgent?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StatsData {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  loginsToday: number;
  totalLogins: number;
}

export default function AdminWebsiteUsersPage() {
  const [items, setItems] = useState<WebsiteUserItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    loginsToday: 0,
    totalLogins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [newModalError, setNewModalError] = useState<string | null>(null);

  // Delete modal
  const [deletingUser, setDeletingUser] = useState<WebsiteUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status toggle loading
  const [statusTogglingId, setStatusTogglingId] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load website users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminWebsiteUsers({
        page,
        limit,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
        sort: 'lastLoginAt',
        order: 'DESC',
      });

      setItems(data?.items || []);
      setTotal(data?.total || 0);
      setTotalPages(data?.totalPages || 1);
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      console.error('Failed to load website users:', err);
      setError(err?.message || 'Failed to load website login users.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, searchQuery]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle Copy Email
  const handleCopyEmail = (email: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(email);
      setCopiedId(id);
      showToast(`Copied ${email} to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Handle Toggle Status (ACTIVE <-> BLOCKED)
  const handleToggleStatus = async (user: WebsiteUserItem) => {
    const nextStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    setStatusTogglingId(user.id);
    try {
      await updateAdminWebsiteUser(user.id, { status: nextStatus });
      setItems((prev) =>
        prev.map((item) => (item.id === user.id ? { ...item, status: nextStatus } : item))
      );
      showToast(`User status changed to ${nextStatus}.`);
      // Refresh stats
      loadUsers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update user status.', 'error');
    } finally {
      setStatusTogglingId(null);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await deleteAdminWebsiteUser(deletingUser.id);
      setItems((prev) => prev.filter((item) => item.id !== deletingUser.id));
      showToast('Website user deleted successfully.');
      setDeletingUser(null);
      loadUsers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete user.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Add New User Manually
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setNewModalError('Please enter a valid email address.');
      return;
    }
    setIsSubmittingNew(true);
    setNewModalError(null);
    try {
      await createAdminWebsiteUser({
        email: newEmail.trim().toLowerCase(),
        name: newName.trim() || undefined,
        phone: newPhone.trim() || undefined,
        notes: newNotes.trim() || undefined,
        status: 'ACTIVE',
      });
      showToast('Website user added successfully.');
      setIsAddModalOpen(false);
      setNewEmail('');
      setNewName('');
      setNewPhone('');
      setNewNotes('');
      loadUsers();
    } catch (err: any) {
      setNewModalError(err?.message || 'Failed to add user.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (items.length === 0) {
      showToast('No users to export.', 'error');
      return;
    }

    const headers = ['Email', 'Name', 'Phone', 'Status', 'Verified', 'Login Count', 'Last Login', 'Registered Date', 'Last IP'];
    const rows = items.map((u) => [
      `"${u.email}"`,
      `"${u.name || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.status}"`,
      `"${u.isVerified ? 'Yes' : 'No'}"`,
      u.loginCount,
      `"${new Date(u.lastLoginAt).toLocaleString('en-IN')}"`,
      `"${new Date(u.createdAt).toLocaleString('en-IN')}"`,
      `"${u.lastIp || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gujaratpost_website_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Website users exported to CSV successfully!');
  };

  // Format Helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getDeviceIcon = (ua?: string | null) => {
    if (!ua) return <Globe className="w-3.5 h-3.5 text-muted-foreground" />;
    const lower = ua.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <Smartphone className="w-3.5 h-3.5 text-blue-500" />;
    }
    return <Laptop className="w-3.5 h-3.5 text-emerald-500" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-sm font-semibold border transition-all animate-in fade-in slide-in-from-bottom-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-500/40'
              : 'bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-200 border-red-500/40'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#B3121B]/10 rounded-lg text-[#B3121B]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                Website Login Users
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Real-time records of readers and public visitors who verified & logged into Gujarat Post via Email OTP.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-foreground bg-secondary/80 hover:bg-secondary rounded-lg transition-colors border border-border"
            title="Refresh Users List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-foreground bg-secondary/80 hover:bg-secondary rounded-lg transition-colors border border-border disabled:opacity-50"
            title="Export as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#B3121B] hover:bg-[#900e15] rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border border-border/70 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Website Users
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.totalUsers}</p>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Verified email accounts
          </span>
        </div>

        <div className="bg-card border border-border/70 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Logged In Today
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.loginsToday}</p>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Active today on website
          </span>
        </div>

        <div className="bg-card border border-border/70 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active Users
            </span>
            <div className="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.activeUsers}</p>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Can access site services
          </span>
        </div>

        <div className="bg-card border border-border/70 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Login Sessions
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.totalLogins}</p>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Cumulative logins by readers
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by email, name, or IP address..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#B3121B]"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            {(['ALL', 'ACTIVE', 'BLOCKED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 font-bold rounded-md transition-all ${
                  statusFilter === st
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Blocked'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <RefreshCw className="w-8 h-8 animate-spin text-[#B3121B] mb-2" />
            <p className="text-sm font-semibold">Loading website users...</p>
          </div>
        ) : error ? (
          <div className="py-16 px-4 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={loadUsers}
              className="mt-3 px-4 py-1.5 text-xs font-bold text-white bg-[#B3121B] rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">No website users found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No users match your search criteria. Try resetting the filters.'
                : 'Readers who log in on the website using OTP will automatically appear here with their login activity.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-muted/50 border-b border-border text-[11px] font-black text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">User / Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Logins</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4">First Joined</th>
                  <th className="py-3 px-4">Device & IP</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((u) => {
                  const initial = (u.email?.[0] || 'U').toUpperCase();
                  const isBlocked = u.status === 'BLOCKED';

                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      {/* User / Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B3121B] to-red-800 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-foreground truncate max-w-[220px] sm:max-w-[280px]">
                                {u.email}
                              </span>
                              {u.isVerified && (
                                <span title="Verified Reader Account">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            {u.name && u.name !== u.email.split('@')[0] && (
                              <p className="text-[11px] text-muted-foreground truncate">{u.name}</p>
                            )}
                            {u.phone && (
                              <p className="text-[11px] text-muted-foreground truncate">{u.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            isBlocked
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          <span className="text-[9px]">●</span>
                          {u.status}
                        </span>
                      </td>

                      {/* Logins Count */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-bold text-foreground bg-secondary/60 px-2 py-0.5 rounded text-xs">
                          <Activity className="w-3 h-3 text-[#B3121B]" />
                          {u.loginCount} {u.loginCount === 1 ? 'time' : 'times'}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground text-xs">
                        <div className="font-semibold text-foreground">{formatDate(u.lastLoginAt)}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(u.lastLoginAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* First Joined */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground text-xs">
                        {formatDate(u.createdAt)}
                      </td>

                      {/* Device & IP */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                          {getDeviceIcon(u.userAgent)}
                          <span>{u.lastIp || '127.0.0.1'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Copy Email */}
                          <button
                            onClick={() => handleCopyEmail(u.email, u.id)}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy Email"
                          >
                            {copiedId === u.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Block / Unblock */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={statusTogglingId === u.id}
                            className={`p-1.5 rounded-md transition-colors ${
                              isBlocked
                                ? 'hover:bg-emerald-500/10 text-emerald-600 hover:text-emerald-700'
                                : 'hover:bg-amber-500/10 text-amber-600 hover:text-amber-700'
                            }`}
                            title={isBlocked ? 'Unblock user' : 'Block user'}
                          >
                            {isBlocked ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-600 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="py-3 px-4 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded border border-border bg-background disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-bold text-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded border border-border bg-background disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-[#B3121B]/10 text-[#B3121B]">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-foreground text-sm sm:text-base">
                  Add Website User
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-4 space-y-3.5">
              {newModalError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{newModalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="reader@example.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-[#B3121B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Reader Name (Optional)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-[#B3121B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-[#B3121B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Admin Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notes about this reader..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-[#B3121B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#B3121B] hover:bg-[#900e15] text-white shadow-sm disabled:opacity-50"
                >
                  {isSubmittingNew ? 'Saving...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-red-500/10 text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-foreground text-sm">Delete Website User?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-foreground bg-muted/40 p-2.5 rounded-lg border border-border mb-4 break-all">
              Are you sure you want to delete <span className="font-bold text-[#B3121B]">{deletingUser.email}</span> from the website users database?
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

