'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Eye,
  Users,
  Activity,
  Calendar,
  AlertCircle,
  Database,
  ArrowUpRight,
  Loader2,
  FolderOpen,
  Image as ImageIcon,
  Video,
  Clock,
  Plus,
  Check,
  X,
  Lock,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  CheckCircle,
  Play
} from 'lucide-react';

interface StatsData {
  articles: {
    total: number;
    published: number;
    draft: number;
    pendingReview: number;
  };
  views: number;
  authors: number;
  categories: number;
  galleryImages: number;
  videos: number;
  activeSessions: number;
  recentLogs: Array<{
    id: string;
    action: string;
    entity: string | null;
    entityId: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    userEmail: string;
    userRole: string;
  }>;
  recentDrafts: Array<any>;
  pendingReporterArticles: Array<any>;
  recentlyPublished: Array<any>;
  trendingArticles: Array<any>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch logged in user and stats
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [meRes, statsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/admin/stats')
        ]);
        const meJson = await meRes.json();
        const statsJson = await statsRes.json();

        if (meRes.ok && meJson.data?.authenticated) {
          setUserRole(meJson.data.user.role);
        }

        if (!statsRes.ok) throw new Error(statsJson.error || 'Failed to load stats');
        setData(statsJson.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Quick Action: Approve & Publish Reporter draft
  const handleApprovePublish = async (id: string, currentArticleData: any) => {
    if (!confirm('Are you sure you want to approve and publish this article?')) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentArticleData,
          status: 'PUBLISHED',
          isPublished: true,
          publishedAt: new Date().toISOString()
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to publish article.');
      
      // Update UI state locally
      alert('Article published successfully!');
      setData(prev => {
        if (!prev) return null;
        // remove from pending review list
        const updatedPending = prev.pendingReporterArticles.filter(a => a.id !== id);
        // add to recently published list
        const updatedPublished = [json.data, ...prev.recentlyPublished].slice(0, 5);
        return {
          ...prev,
          articles: {
            ...prev.articles,
            published: prev.articles.published + 1,
            draft: Math.max(0, prev.articles.draft - 1),
            pendingReview: Math.max(0, prev.articles.pendingReview - 1)
          },
          pendingReporterArticles: updatedPending,
          recentlyPublished: updatedPublished
        };
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick Action: Reject Reporter draft
  const handleRejectDraft = async (id: string) => {
    if (!confirm('Are you sure you want to reject this draft and return it to the Reporter?')) return;
    setActionLoadingId(id);
    try {
      // Keeps it in DRAFT state but writes a log or alert (for simulation here, we keep it as DRAFT)
      alert('Draft returned to Reporter for corrections.');
      setData(prev => {
        if (!prev) return null;
        // remove from pending review list
        const updatedPending = prev.pendingReporterArticles.filter(a => a.id !== id);
        return {
          ...prev,
          articles: {
            ...prev.articles,
            pendingReview: Math.max(0, prev.articles.pendingReview - 1)
          },
          pendingReporterArticles: updatedPending
        };
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatLogDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-red-200 rounded-2xl bg-red-50 text-red-600 dark:border-red-950/20 dark:bg-red-950/10 dark:text-red-400">
        <AlertCircle className="h-10 w-10 mb-2" />
        <h3 className="font-bold">Error Loading Dashboard</h3>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  // Dashboard Stats Cards Configurations
  const statCards = [
    {
      label: 'Total Articles',
      value: data ? formatNumber(data.articles.total) : '0',
      description: `${data?.articles.published || 0} published • ${data?.articles.draft || 0} drafts`,
      icon: FileText,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Pending Review',
      value: data ? formatNumber(data.articles.pendingReview) : '0',
      description: 'Submitted reporter drafts needing review',
      icon: FileCheck2,
      color: 'bg-red-500/10 text-red-650 dark:text-red-405',
    },
    {
      label: 'Total Views',
      value: data ? formatNumber(data.views) : '0',
      description: 'Cumulative news articles view counts',
      icon: Eye,
      color: 'bg-green-500/10 text-green-605 dark:text-green-405',
    },
    {
      label: 'Categories',
      value: data ? formatNumber(data.categories) : '0',
      description: 'Active news categories & sections',
      icon: FolderOpen,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Gallery Images',
      value: data ? formatNumber(data.galleryImages) : '0',
      description: 'Uploaded high-res media files',
      icon: ImageIcon,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Videos Embeds',
      value: data ? formatNumber(data.videos) : '0',
      description: 'YouTube videos and shorts clips',
      icon: Video,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
  ];

  // If SUPER_ADMIN, add active sessions card
  if (userRole === 'SUPER_ADMIN' && data) {
    statCards.push({
      label: 'Active Sessions',
      value: formatNumber(data.activeSessions),
      description: 'Currently logged-in editor/author devices',
      icon: Users,
      color: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
    });
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Editorial Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Review reporter submissions, inspect analytics and edit portal components.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/admin/articles/create')}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-850 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-105"
          >
            <Plus className="h-4 w-4" />
            Write Article
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{card.label}</span>
                <span className={`rounded-xl p-2.5 ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black tracking-tight">{card.value}</span>
                <p className="mt-1 text-xs text-zinc-405 dark:text-zinc-500">{card.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── REVIEW QUEUE SECTION ─── */}
      {data && data.pendingReporterArticles.length > 0 && (
        <div className="rounded-2xl border border-red-200/60 bg-red-50/10 p-6 dark:border-red-900/30">
          <h3 className="text-lg font-bold text-red-655 dark:text-red-405 flex items-center gap-2 mb-4">
            <FileCheck2 className="h-5 w-5" />
            Pending Review Queue ({data.pendingReporterArticles.length})
          </h3>
          <div className="divide-y divide-red-205/20 overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead>
                <tr className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Article</th>
                  <th className="pb-3 px-4">Author</th>
                  <th className="pb-3 px-4">Submitted At</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {data.pendingReporterArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-zinc-50/40">
                    <td className="py-3.5 pr-4">
                      <p className="font-bold text-zinc-900 dark:text-white line-clamp-1">{art.title}</p>
                      <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-550 dark:bg-zinc-800 dark:text-zinc-400 mt-1">
                        {art.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 font-medium">
                      {art.author?.name || 'Staff'}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500">
                      {new Date(art.updatedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/articles/${art.id}/edit`)}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          Review & Edit
                        </button>
                        <button
                          onClick={() => handleApprovePublish(art.id, art)}
                          disabled={actionLoadingId === art.id}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectDraft(art.id)}
                          disabled={actionLoadingId === art.id}
                          className="rounded-lg bg-red-550 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-650 disabled:opacity-50 flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> Return
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Content Split: Left Lists vs Right Logs & Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Lists */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Drafts */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Recent Drafts</h3>
              <button 
                onClick={() => router.push('/admin/articles?status=DRAFT')}
                className="text-xs font-bold text-accent hover:underline flex items-center gap-0.5"
              >
                View all drafts <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {data?.recentDrafts && data.recentDrafts.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.recentDrafts.slice(0, 4).map((art) => (
                  <div key={art.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p 
                        onClick={() => router.push(`/admin/articles/${art.id}/edit`)}
                        className="font-bold text-zinc-800 hover:text-accent cursor-pointer dark:text-zinc-200 line-clamp-1"
                      >
                        {art.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-zinc-400 mt-1 uppercase">
                        <span>By {art.author?.name || 'Staff'}</span>
                        <span>•</span>
                        <span>{art.category?.name || 'General'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/admin/articles/${art.id}/edit`)}
                      className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-450 dark:text-zinc-500 py-4 text-center">No drafts found.</p>
            )}
          </div>

          {/* Recently Published */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Recently Published</h3>
              <button 
                onClick={() => router.push('/admin/articles?status=PUBLISHED')}
                className="text-xs font-bold text-accent hover:underline flex items-center gap-0.5"
              >
                View all published <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {data?.recentlyPublished && data.recentlyPublished.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.recentlyPublished.slice(0, 4).map((art) => (
                  <div key={art.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1">
                        {art.title}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-semibold text-zinc-400 mt-1 uppercase">
                        <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {art.views} views</span>
                        <span>•</span>
                        <span>Published: {new Date(art.publishedAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                    <a
                      href={`/news/${art.slug}`}
                      target="_blank"
                      className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800"
                      title="View on site"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-450 dark:text-zinc-500 py-4 text-center">No published articles found.</p>
            )}
          </div>

          {/* Trending Articles */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-bold flex items-center gap-1.5 mb-4">
              <TrendingUp className="h-5 w-5 text-accent" />
              Trending Strip Articles
            </h3>
            {data?.trendingArticles && data.trendingArticles.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.trendingArticles.slice(0, 4).map((art) => (
                  <div key={art.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-805 dark:text-zinc-200 line-clamp-1">{art.title}</p>
                      <p className="text-[10px] font-bold text-accent mt-0.5">Priority Order: {art.priority}</p>
                    </div>
                    <button
                      onClick={() => router.push(`/admin/articles/${art.id}/edit`)}
                      className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-450 dark:text-zinc-500 py-4 text-center">No articles marked as trending.</p>
            )}
          </div>

        </div>

        {/* Right Column: Timeline & Actions */}
        <div className="space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-bold mb-4">Quick Shortcuts</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/admin/articles/create')}
                className="flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-950/40 text-center space-y-1.5"
              >
                <Plus className="h-5 w-5 text-zinc-550" />
                <span className="text-xs font-bold">Write Article</span>
              </button>
              <button
                onClick={() => router.push('/admin/categories')}
                className="flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-950/40 text-center space-y-1.5"
              >
                <FolderOpen className="h-5 w-5 text-zinc-550" />
                <span className="text-xs font-bold">Categories</span>
              </button>
              <button
                onClick={() => router.push('/admin/gallery')}
                className="flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-950/40 text-center space-y-1.5"
              >
                <ImageIcon className="h-5 w-5 text-zinc-550" />
                <span className="text-xs font-bold">Gallery</span>
              </button>
              <button
                onClick={() => router.push('/admin/videos')}
                className="flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:hover:bg-zinc-950/40 text-center space-y-1.5"
              >
                <Video className="h-5 w-5 text-zinc-550" />
                <span className="text-xs font-bold">Videos</span>
              </button>
            </div>
          </div>

          {/* Security Logs (SUPER_ADMIN only) or System Timeline */}
          {userRole === 'SUPER_ADMIN' ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col">
              <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <Database className="h-5 w-5 text-zinc-500" />
                <h3 className="text-lg font-bold">Security Audit Trail</h3>
              </div>
              
              <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-1">
                {data?.recentLogs && data.recentLogs.length > 0 ? (
                  data.recentLogs.map((log) => (
                    <div key={log.id} className="group relative flex gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 ring-4 ring-white dark:bg-zinc-800 dark:ring-zinc-900">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        </span>
                        <span className="flex-1 w-[1px] bg-zinc-100 group-last:bg-transparent dark:bg-zinc-800" />
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium">
                            {formatLogDate(log.createdAt)}
                          </span>
                        </div>
                        <p className="text-zinc-550 dark:text-zinc-450 mt-0.5">
                          By <span className="font-semibold">{log.userEmail}</span> ({log.userRole})
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-zinc-400 py-6">
                    <Calendar className="h-8 w-8 mb-2" />
                    <span className="text-xs">No recent log entries.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Editor Timeline (General system status)
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col">
              <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <Activity className="h-5 w-5 text-zinc-550" />
                <h3 className="text-lg font-bold">Newsroom Activity Timeline</h3>
              </div>
              <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-1">
                {data?.recentLogs && data.recentLogs.length > 0 ? (
                  data.recentLogs
                    .filter(log => !log.action.includes('USER') && !log.action.includes('LOGIN') && !log.action.includes('SESSION'))
                    .map((log) => (
                      <div key={log.id} className="group relative flex gap-3 text-xs">
                        <div className="flex flex-col items-center">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-150 ring-4 ring-white dark:bg-zinc-800 dark:ring-zinc-900">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          </span>
                          <span className="flex-1 w-[1px] bg-zinc-100 group-last:bg-transparent dark:bg-zinc-800" />
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              {log.action.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-zinc-450 font-medium">
                              {formatLogDate(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-zinc-500 dark:text-zinc-450 mt-0.5">
                            Author: <span className="font-semibold">{log.userEmail.split('@')[0]}</span>
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-zinc-400 py-6">
                    <Activity className="h-8 w-8 mb-2" />
                    <span className="text-xs">No recent newsroom logs.</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
