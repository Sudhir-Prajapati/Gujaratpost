'use client';

import { useState, useEffect, useMemo } from 'react';
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
  FolderOpen,
  Image as ImageIcon,
  Video,
  Clock,
  Plus,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  Sparkles,
  Radio,
  Newspaper,
  Film,
  ExternalLink,
  Edit3,
  Layers,
  Zap,
} from 'lucide-react';
import { getBackendApiUrl, authFetch } from '@/lib/api';

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
  const [userName, setUserName] = useState<string>('Editor');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [dbArticles, setDbArticles] = useState<any[]>([]);


  // Compute live Most Read Articles dynamically from database
  const mostReadArticles = useMemo(() => {
    const pool = dbArticles.length > 0 ? dbArticles : [
      ...(data?.trendingArticles || []),
      ...(data?.recentlyPublished || []),
      ...(data?.recentDrafts || []),
    ];
    const uniqueMap = new Map<string, any>();
    pool.forEach((art) => {
      if (art && art.id && !uniqueMap.has(art.id)) {
        uniqueMap.set(art.id, art);
      }
    });
    return Array.from(uniqueMap.values())
      .sort((a, b) => (b.views || 0) - (a.views || 0));
  }, [dbArticles, data]);

  // Compute Recently Published sorted newest-first by publication / creation date
  const sortedRecentlyPublished = useMemo(() => {
    if (!data?.recentlyPublished) return [];
    return [...data.recentlyPublished].sort((a, b) => {
      const timeA = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.publishedAt || b.createdAt || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return (b.articleNumber || 0) - (a.articleNumber || 0);
    });
  }, [data?.recentlyPublished]);

  // Dynamic right-side item limit (minimum 7 articles; expands if left column grows)
  const leftSideCount = (data?.recentDrafts?.length || 0) + (data?.recentlyPublished?.length || 0);
  const rightSideLimit = Math.max(7, leftSideCount);

  // Fetch logged in user and stats
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [meRes, statsRes, articlesRes] = await Promise.all([
          authFetch(getBackendApiUrl('/api/auth/me')),
          authFetch(getBackendApiUrl('/api/admin/stats')),
          authFetch(getBackendApiUrl('/api/admin/articles?limit=50')),
        ]);

        if (meRes.status === 401 || statsRes.status === 401) {
          router.push('/login');
          return;
        }

        const meJson = await meRes.json();
        const statsJson = await statsRes.json();

        if (articlesRes && articlesRes.ok) {
          const articlesJson = await articlesRes.json();
          const rawArts = articlesJson.data?.articles || articlesJson.data || [];
          if (Array.isArray(rawArts)) {
            setDbArticles(rawArts);
          }
        }

        if (meRes.ok && meJson.data?.user) {
          setUserRole(meJson.data.user.role);
          setUserName(meJson.data.user.name || meJson.data.user.email?.split('@')[0] || 'Admin');
        }

        if (statsRes.ok && statsJson.data) {
          setData(statsJson.data);
        } else {
          setData({
            articles: { total: 0, published: 0, draft: 0, pendingReview: 0 },
            views: 0,
            authors: 0,
            categories: 0,
            galleryImages: 0,
            videos: 0,
            activeSessions: 1,
            recentLogs: [],
            recentDrafts: [],
            pendingReporterArticles: [],
            recentlyPublished: [],
            trendingArticles: [],
          });
        }
      } catch (err: any) {
        setData({
          articles: { total: 0, published: 0, draft: 0, pendingReview: 0 },
          views: 0,
          authors: 0,
          categories: 0,
          galleryImages: 0,
          videos: 0,
          activeSessions: 1,
          recentLogs: [],
          recentDrafts: [],
          pendingReporterArticles: [],
          recentlyPublished: [],
          trendingArticles: [],
        });
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [router]);

  // Quick Action: Approve & Publish Reporter draft
  const handleApprovePublish = async (id: string, currentArticleData: any) => {
    if (!confirm('Are you sure you want to approve and publish this article?')) return;
    setActionLoadingId(id);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/articles/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentArticleData,
          status: 'PUBLISHED',
          isPublished: true,
          publishedAt: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to publish article.');

      alert('Article published successfully!');
      setData((prev) => {
        if (!prev) return null;
        const updatedPending = prev.pendingReporterArticles.filter((a) => a.id !== id);
        const updatedPublished = [json.data, ...prev.recentlyPublished].slice(0, 5);
        return {
          ...prev,
          articles: {
            ...prev.articles,
            published: prev.articles.published + 1,
            draft: Math.max(0, prev.articles.draft - 1),
            pendingReview: Math.max(0, prev.articles.pendingReview - 1),
          },
          pendingReporterArticles: updatedPending,
          recentlyPublished: updatedPublished,
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
      alert('Draft returned to Reporter for corrections.');
      setData((prev) => {
        if (!prev) return null;
        const updatedPending = prev.pendingReporterArticles.filter((a) => a.id !== id);
        return {
          ...prev,
          articles: {
            ...prev.articles,
            pendingReview: Math.max(0, prev.articles.pendingReview - 1),
          },
          pendingReporterArticles: updatedPending,
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
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-36 w-full rounded-3xl bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900" />
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

  const statCards = [
    {
      label: 'Total Articles',
      value: data ? formatNumber(data.articles.total) : '0',
      description: `${data?.articles.published || 0} published â€¢ ${data?.articles.draft || 0} drafts`,
      icon: FileText,
      gradient: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30',
      badgeColor: 'bg-blue-600 text-white',
      href: '/admin/articles',
    },
    {
      label: 'Pending Review',
      value: data ? formatNumber(data.articles.pendingReview) : '0',
      description: 'Submitted reporter drafts needing review',
      icon: FileCheck2,
      gradient: 'from-rose-600 to-red-600',
      bgLight: 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30',
      badgeColor: 'bg-rose-600 text-white',
      highlight: (data?.articles.pendingReview || 0) > 0,
      href: '/admin/articles?status=DRAFT',
    },
    {
      label: 'Total Views',
      value: data ? formatNumber(data.views) : '0',
      description: 'Cumulative news articles view counts',
      icon: Eye,
      gradient: 'from-emerald-600 to-teal-600',
      bgLight: 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30',
      badgeColor: 'bg-emerald-600 text-white',
      href: '/admin/articles',
    },
    {
      label: 'Categories',
      value: data ? formatNumber(data.categories) : '0',
      description: 'Active news categories & sections',
      icon: FolderOpen,
      gradient: 'from-purple-600 to-violet-600',
      bgLight: 'bg-purple-50/70 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30',
      badgeColor: 'bg-purple-600 text-white',
      href: '/admin/categories',
    },
    {
      label: 'Gallery Media',
      value: data ? formatNumber(data.galleryImages) : '0',
      description: 'Uploaded high-res media files',
      icon: ImageIcon,
      gradient: 'from-amber-600 to-orange-600',
      bgLight: 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30',
      badgeColor: 'bg-amber-600 text-white',
      href: '/admin/gallery',
    },
    {
      label: 'Videos Embeds',
      value: data ? formatNumber(data.videos) : '0',
      description: 'YouTube videos and shorts clips',
      icon: Video,
      gradient: 'from-red-600 to-pink-600',
      bgLight: 'bg-red-50/70 dark:bg-red-950/20 border-red-100 dark:border-red-900/30',
      badgeColor: 'bg-red-600 text-white',
      href: '/admin/videos',
    },
  ];



  const quickShortcuts = [
    { label: 'Write Article', href: '/admin/articles/create', icon: Plus, bg: 'bg-red-600 text-white hover:bg-red-700' },
    { label: 'Hero Layout', href: '/admin/hero', icon: Layers, bg: 'bg-zinc-900 text-white dark:bg-zinc-800 hover:bg-black' },
    { label: 'Categories', href: '/admin/categories', icon: FolderOpen, bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 hover:bg-blue-100' },
    { label: 'Advertisements', href: '/admin/advertisements', icon: Zap, bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 hover:bg-amber-100' },
    { label: 'Gallery Media', href: '/admin/gallery', icon: ImageIcon, bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 hover:bg-purple-100' },
    { label: 'Videos Stream', href: '/admin/videos', icon: Video, bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100' },
    { label: 'YouTube Shorts', href: '/admin/shorts', icon: Film, bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100' },
    { label: 'E-Paper Releases', href: '/admin/epaper', icon: Newspaper, bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 hover:bg-indigo-100' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Executive Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950 p-6 sm:p-8 text-white shadow-xl dark:border dark:border-zinc-800/80">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-red-600/10 blur-3xl" />
        <div className="absolute left-1/2 bottom-0 h-48 w-48 rounded-full bg-blue-600/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>LIVE EDITORIAL SYSTEM</span>
              <span className="text-zinc-400">â€¢</span>
              <span className="text-red-400 font-semibold">{userRole || 'ADMIN'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-300">{userName}</span>
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Gujarat Post News Management Portal. Monitor live audience reach, publish breaking stories, inspect reporter submissions, and manage custom homepage hero slots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push('/admin/articles/create')}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-red-600/30 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Write New Article
            </button>
            <button
              onClick={() => router.push('/admin/hero')}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-md border border-white/15 hover:bg-white/20 transition-all"
            >
              <Layers className="h-4 w-4" />
              Manage Hero
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-800/80 px-4 py-3 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              Live Portal
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={() => card.href && router.push(card.href)}
              className={`group relative overflow-hidden rounded-3xl border ${card.bgLight} p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer select-none hover:-translate-y-1`}
            >
              {card.highlight && (
                <span className="absolute top-3 right-3 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {card.label}
                </span>
                <div className={`rounded-2xl p-3 shadow-md ${card.badgeColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                    {card.value}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>{card.description}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* â”€â”€â”€ PENDING REVIEW QUEUE â”€â”€â”€ */}
      {data && data.pendingReporterArticles.length > 0 && (
        <div className="rounded-3xl border border-rose-300/80 bg-gradient-to-r from-rose-50/80 via-rose-50/30 to-amber-50/50 p-6 shadow-md dark:border-rose-900/40 dark:from-rose-950/20 dark:to-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <FileCheck2 className="h-5 w-5" />
              Reporter Submissions Pending Review ({data.pendingReporterArticles.length})
            </h3>
            <span className="text-xs font-bold text-rose-600 bg-rose-100 px-3 py-1 rounded-full dark:bg-rose-950/60">
              Needs Editor Approval
            </span>
          </div>

          <div className="divide-y divide-rose-200/50 overflow-x-auto dark:divide-zinc-800">
            <table className="w-full text-left text-sm min-w-[650px]">
              <thead>
                <tr className="text-[11px] font-black text-zinc-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Article Headline</th>
                  <th className="pb-3 px-4">Reporter</th>
                  <th className="pb-3 px-4">Category</th>
                  <th className="pb-3 px-4">Submitted At</th>
                  <th className="pb-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 dark:divide-zinc-850">
                {data.pendingReporterArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-white/60 dark:hover:bg-zinc-850/50 transition-colors">
                    <td className="py-4 pr-4">
                      <p className="font-extrabold text-zinc-900 dark:text-white line-clamp-1">{art.title}</p>
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{art.excerpt || 'No excerpt provided.'}</p>
                    </td>
                    <td className="py-4 px-4 text-zinc-700 dark:text-zinc-300 font-bold whitespace-nowrap">
                      {art.author?.name || 'Staff Reporter'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-block rounded-xl bg-zinc-900 px-2.5 py-1 text-[11px] font-bold text-white dark:bg-zinc-800">
                        {art.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs font-semibold text-zinc-500 whitespace-nowrap">
                      {new Date(art.updatedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/articles/${art.id}/edit`)}
                          className="rounded-xl border border-zinc-300 px-3 py-1.5 text-xs font-extrabold text-zinc-700 hover:bg-white dark:border-zinc-700 dark:text-zinc-200"
                        >
                          Edit Details
                        </button>
                        <button
                          onClick={() => handleApprovePublish(art.id, art)}
                          disabled={actionLoadingId === art.id}
                          className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-emerald-700 shadow-sm flex items-center gap-1"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" /> Approve
                        </button>
                        <button
                          onClick={() => handleRejectDraft(art.id)}
                          disabled={actionLoadingId === art.id}
                          className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-rose-700 shadow-sm flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5 stroke-[3]" /> Return
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

      {/* Main Grid Split: Left Lists vs Right Column */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Article Feeds & Tables */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Action Shortcuts Grid */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Operations & Shortcuts
              </h3>
              <span className="text-xs font-bold text-zinc-400">Direct Navigation</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickShortcuts.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => router.push(s.href)}
                    className={`group flex flex-col items-center justify-center p-4 rounded-2xl ${s.bg} transition-all duration-200 shadow-sm hover:shadow-md text-center space-y-2`}
                  >
                    <Icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black tracking-tight">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Drafts */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-zinc-500" />
                <h3 className="text-lg font-black tracking-tight">Recent Drafts</h3>
              </div>
              <button
                onClick={() => router.push('/admin/articles?status=DRAFT')}
                className="text-xs font-extrabold text-red-600 hover:underline flex items-center gap-1"
              >
                View all drafts <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {data?.recentDrafts && data.recentDrafts.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.recentDrafts.slice(0, 5).map((art) => (
                  <div key={art.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50 px-2 rounded-xl transition-colors">
                    <div className="min-w-0 flex-1">
                      <p
                        onClick={() => router.push(`/admin/articles/${art.id}/edit`)}
                        className="font-extrabold text-zinc-900 hover:text-red-600 cursor-pointer dark:text-zinc-100 line-clamp-1"
                      >
                        {art.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 mt-1 uppercase tracking-wide">
                        <span>By {art.author?.name || 'Staff'}</span>
                        <span>â€¢</span>
                        <span className="text-zinc-600 dark:text-zinc-300">{art.category?.name || 'General'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/admin/articles/${art.id}/edit`)}
                      className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 flex items-center gap-1 shrink-0"
                    >
                      <span>Edit</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center border-2 border-dashed border-zinc-100 rounded-2xl dark:border-zinc-800">
                <FileText className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-400">No active drafts found.</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Most Read Articles */}
        <div className="space-y-6">
          
          {/* Most Read Articles Panel */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 select-none">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-600 shrink-0" />
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-full shadow-2xs">
                  <Eye className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                  <span>Most Read Articles</span>
                </h3>
              </div>

              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-md">
                Sorted by Views
              </span>
            </div>

            {mostReadArticles && mostReadArticles.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {mostReadArticles.slice(0, 7).map((art) => (
                  <div key={art.id} className="py-3 flex items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50 px-1 rounded-xl transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1">{art.title}</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 mt-0.5">
                        <span className="text-zinc-500 font-semibold">{formatNumber(art.views)} views</span>
                      </div>
                    </div>
                    <a
                      href={`/news/${art.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 shrink-0 flex items-center gap-1 select-none"
                    >
                      <Eye className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Show</span>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 py-6 text-center font-bold">No articles found.</p>
            )}
          </div>

        </div>
      </div>

      {/* Full-Width Section: Recently Published (Spans across left and right) */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-black tracking-tight">Recently Published</h3>
          </div>
          <button
            onClick={() => router.push('/admin/articles?status=PUBLISHED')}
            className="text-xs font-extrabold text-emerald-600 hover:underline flex items-center gap-1"
          >
            View all published <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {sortedRecentlyPublished && sortedRecentlyPublished.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {sortedRecentlyPublished.slice(0, 5).map((art) => (
              <div key={art.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50 px-2 rounded-xl transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                    {art.title}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-zinc-400 mt-1 uppercase tracking-wide">
                    <span className="flex items-center gap-1 text-emerald-600 font-extrabold">
                      <Eye className="h-3.5 w-3.5" /> {formatNumber(art.views)} views
                    </span>
                    <span>â€¢</span>
                    <span>Published: {new Date(art.publishedAt || art.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <a
                  href={`/news/${art.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 shrink-0"
                  title="View live article"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-zinc-100 rounded-2xl dark:border-zinc-800">
            <Newspaper className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-zinc-400">No published articles found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
