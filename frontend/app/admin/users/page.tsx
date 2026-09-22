'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  Loader2,
  UserCheck,
  UserX,
  ExternalLink,
  Shield,
  Activity,
  X,
  CheckCircle2,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'EDITOR' | 'REPORTER' | 'SEO' | 'ADVERTISEMENT' | 'PHOTOGRAPHER';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING_VERIFICATION';
  createdAt: string;
  sessionCount: number;
  author?: {
    id: string;
    name: string;
    designation: string;
  };
}

export default function UserList() {
  const router = useRouter();

  // Search & Filter state
  const [query, setQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Table state
  const [users, setUsers] = useState<UserData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // UI indicators
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom Modals & Feedback state
  const [statusModalTarget, setStatusModalTarget] = useState<UserData | null>(null);
  const [deleteModalTarget, setDeleteModalTarget] = useState<UserData | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch Users
  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const url = new URL('/api/admin/users', window.location.origin);
        url.searchParams.set('page', String(page));
        url.searchParams.set('limit', '10');
        if (query.trim()) url.searchParams.set('query', query);
        if (selectedRole) url.searchParams.set('role', selectedRole);
        if (selectedStatus) url.searchParams.set('status', selectedStatus);

        const res = await fetch(url);
        const json = await res.json();

        const userList = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.data?.users)
          ? json.data.users
          : [];

        setUsers(userList);
        setTotalUsers(json.pagination?.total || userList.length);
        setTotalPages(json.pagination?.totalPages || Math.max(1, Math.ceil(userList.length / 10)));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [page, query, selectedRole, selectedStatus]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Open Status Modal (Suspend / Activate)
  const handleOpenStatusModal = (user: UserData) => {
    if (user.role === 'SUPER_ADMIN') {
      showToast('error', 'Super Admin accounts are protected and cannot be suspended.');
      return;
    }
    setStatusModalTarget(user);
  };

  // Confirm Toggle User Status (Suspend / Activate)
  const confirmToggleStatus = async () => {
    if (!statusModalTarget) return;
    const user = statusModalTarget;
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const actionWord = nextStatus === 'ACTIVE' ? 'activated' : 'suspended';

    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update user status.');

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      );
      showToast('success', `Account ${user.email} has been ${actionWord} successfully.`);
      setStatusModalTarget(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update user status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Open De-provision (Delete) Modal
  const handleOpenDeleteModal = (user: UserData) => {
    if (user.role === 'SUPER_ADMIN') {
      showToast('error', 'Super Admin accounts are protected and cannot be deleted.');
      return;
    }
    setDeleteModalTarget(user);
  };

  // Confirm De-provision (Delete)
  const confirmDelete = async () => {
    if (!deleteModalTarget) return;
    const user = deleteModalTarget;

    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete user.');

      // Refresh list or update local state status to DELETED
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: 'DELETED', sessionCount: 0, author: undefined } : u))
      );
      showToast('success', `Account ${user.email} has been de-provisioned successfully.`);
      setDeleteModalTarget(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadge = (role: UserData['role']) => {
    const styles = {
      SUPER_ADMIN: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
      EDITOR: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
      REPORTER: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
      SEO: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30',
      PHOTOGRAPHER: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30',
      ADVERTISEMENT: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30',
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${styles[role]}`}>
        <Shield className="h-3 w-3 shrink-0" />
        {role.replace('_', ' ')}
      </span>
    );
  };

  const getStatusBadge = (status: UserData['status']) => {
    const styles = {
      ACTIVE: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30',
      SUSPENDED: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
      DELETED: 'bg-zinc-150 text-zinc-650 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-750',
      PENDING_VERIFICATION: 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800',
    };
    return (
      <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">CMS User Accounts</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage administrative credentials, system roles, and public profiles.
          </p>
        </div>
        
        {/* Create Link */}
        <a
          href="/admin/users/create"
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-850 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Register User</span>
        </a>
      </div>

      {/* Toolbar Filter & Search */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search email..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-4 pr-10 text-sm text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="EDITOR">Editor</option>
              <option value="REPORTER">Reporter</option>
              <option value="SEO">SEO Specialist</option>
              <option value="PHOTOGRAPHER">Photographer</option>
              <option value="ADVERTISEMENT">Advertisement</option>
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400">
              <Filter className="h-4 w-4" />
            </span>
          </div>

          {/* Status Dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-4 pr-10 text-sm text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="DELETED">Deleted</option>
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-zinc-400">
              <Filter className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
            <span className="mt-2 text-sm">Querying system directory...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-red-500 bg-red-50/10">
            <AlertCircle className="h-10 w-10 mb-2" />
            <span className="font-bold">Failed to load accounts</span>
            <span className="text-sm mt-1">{error}</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <AlertCircle className="h-10 w-10 mb-2 text-zinc-300" />
            <span className="text-sm">No user accounts found.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50 font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Security Role</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Linked Bio</th>
                  <th className="px-6 py-4">Sessions</th>
                  <th className="px-6 py-4">Joined At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {(Array.isArray(users) ? users : []).map((user) => (
                  <tr key={user.id} className="group hover:bg-zinc-50/40 dark:hover:bg-zinc-950/10 transition-colors">
                    {/* User Info */}
                    <td className="px-6 py-4 font-medium">
                      <div className="flex flex-col">
                        <span className="text-zinc-900 dark:text-white font-bold leading-tight">
                          {user.email}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          ID: {user.id}
                        </span>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>

                    {/* Linked Writer Profile */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.author ? (
                        <div className="flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350">
                          <span className="font-semibold text-xs bg-zinc-100 dark:bg-zinc-800 py-1 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            {user.author.name}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            ({user.author.designation})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">None</span>
                      )}
                    </td>

                    {/* Active Sessions Count */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350">
                        <Activity className={`h-4 w-4 ${user.sessionCount > 0 ? 'text-green-500 animate-pulse' : 'text-zinc-350'}`} />
                        <span className="font-bold text-xs">{user.sessionCount} Active</span>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2.5">
                        {/* Edit Button */}
                        <a
                          href={`/admin/users/${user.id}/edit`}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                          title="Edit User & Profile"
                        >
                          <Edit2 className="h-4 w-4" />
                        </a>

                        {/* Super Admin Protected Badge or Standard Action Buttons */}
                        {user.role === 'SUPER_ADMIN' ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 select-none cursor-default"
                            title="Super Admin account is permanently protected against suspension and deletion."
                          >
                            <Shield className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            <span>Protected</span>
                          </span>
                        ) : (
                          <>
                            {/* Toggle Status Button */}
                            {user.status !== 'DELETED' && (
                              <button
                                onClick={() => handleOpenStatusModal(user)}
                                disabled={updatingId === user.id}
                                className={`rounded-lg p-1.5 transition-colors ${
                                  user.status === 'ACTIVE'
                                    ? 'text-amber-650 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/20'
                                    : 'text-green-650 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950/20'
                                }`}
                                title={user.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                              >
                                {updatingId === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : user.status === 'ACTIVE' ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </button>
                            )}

                            {/* Delete Button */}
                            {user.status !== 'DELETED' && (
                              <button
                                onClick={() => handleOpenDeleteModal(user)}
                                disabled={deletingId === user.id}
                                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/20 disabled:opacity-50"
                                title="De-provision User"
                              >
                                {deletingId === user.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-150 px-6 py-4 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/10">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Showing <span className="font-bold text-zinc-800 dark:text-zinc-200">{users.length}</span> of{' '}
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{totalUsers}</span> users
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 transition-all hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-850 dark:hover:bg-zinc-900"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 transition-all hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-850 dark:hover:bg-zinc-900"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── TOAST NOTIFICATION ─── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 max-w-md ${
            toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-300 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-red-50/95 border-red-300 text-red-900 dark:bg-red-950/90 dark:border-red-800 dark:text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
          )}
          <p className="text-xs font-semibold leading-relaxed flex-1">{toast.message}</p>
          <button
            onClick={() => setToast(null)}
            className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ─── CUSTOM SUSPEND / ACTIVATE CONFIRMATION MODAL ─── */}
      {statusModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => !updatingId && setStatusModalTarget(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            {/* Close X Button */}
            <button
              type="button"
              disabled={!!updatingId}
              onClick={() => setStatusModalTarget(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon Banner */}
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner shrink-0 ${
                  statusModalTarget.status === 'ACTIVE'
                    ? 'bg-amber-100 text-amber-650 dark:bg-amber-950/60 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-650 dark:bg-emerald-950/60 dark:text-emerald-400'
                }`}
              >
                {statusModalTarget.status === 'ACTIVE' ? (
                  <UserX className="h-6 w-6" />
                ) : (
                  <UserCheck className="h-6 w-6" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                  {statusModalTarget.status === 'ACTIVE'
                    ? 'Suspend User Account?'
                    : 'Activate User Account?'}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Are you sure you want to{' '}
                  <strong
                    className={
                      statusModalTarget.status === 'ACTIVE'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }
                  >
                    {statusModalTarget.status === 'ACTIVE' ? 'suspend' : 'activate'}
                  </strong>{' '}
                  the account for:
                </p>
                <div className="mt-2.5 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50 p-2.5 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-zinc-400 shrink-0" />
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white truncate">
                    {statusModalTarget.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Explanatory Note */}
            <div className="mt-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 p-3 border border-zinc-200/70 dark:border-zinc-800/70 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {statusModalTarget.status === 'ACTIVE' ? (
                <span>
                  ⚠️ <strong>Effect:</strong> This user will be immediately logged out of all active sessions and will not be able to log in to the admin portal until reactivated.
                </span>
              ) : (
                <span>
                  ℹ️ <strong>Effect:</strong> This user will regain full login access with their assigned role ({statusModalTarget.role}) and resume managing content.
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={!!updatingId}
                onClick={() => setStatusModalTarget(null)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition disabled:opacity-50 cursor-pointer"
              >
                Cancel (રદ કરો)
              </button>
              <button
                type="button"
                disabled={!!updatingId}
                onClick={confirmToggleStatus}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-white shadow-md transition disabled:opacity-50 cursor-pointer ${
                  statusModalTarget.status === 'ACTIVE'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                {updatingId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : statusModalTarget.status === 'ACTIVE' ? (
                  <UserX className="h-4 w-4" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                <span>
                  {updatingId
                    ? 'Processing...'
                    : statusModalTarget.status === 'ACTIVE'
                    ? 'Suspend Account'
                    : 'Activate Account'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CUSTOM DE-PROVISION / DELETE CONFIRMATION MODAL ─── */}
      {deleteModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => !deletingId && setDeleteModalTarget(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 sm:p-7 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            {/* Close X Button */}
            <button
              type="button"
              disabled={!!deletingId}
              onClick={() => setDeleteModalTarget(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon Banner */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/60 text-[#B3121B] shadow-inner shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                  De-provision User Account?
                </h3>
                <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Are you sure you want to de-provision this user account:
                </p>
                <div className="mt-2.5 rounded-xl border border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20 p-2.5 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  <span className="text-xs font-mono font-bold text-red-900 dark:text-red-200 truncate">
                    {deleteModalTarget.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Callout */}
            <div className="mt-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 p-3 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Warning:</strong> This will revoke all active login sessions, detach author associations, and permanently mark the account as <strong>Deleted</strong>.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={!!deletingId}
                onClick={() => setDeleteModalTarget(null)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition disabled:opacity-50 cursor-pointer"
              >
                Cancel (રદ કરો)
              </button>
              <button
                type="button"
                disabled={!!deletingId}
                onClick={confirmDelete}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B3121B] hover:bg-red-700 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-red-600/20 transition disabled:opacity-50 cursor-pointer"
              >
                {deletingId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>{deletingId ? 'De-provisioning...' : 'De-provision User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
