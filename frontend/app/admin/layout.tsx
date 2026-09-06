'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  FileText,
  Layers,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  User,
  Image as ImageIcon,
  Video,
  LayoutTemplate,
  Smartphone,
  BookOpen,
  Megaphone,
  Newspaper,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Heart,
} from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getBackendApiUrl, authFetch } from '@/lib/api';

import Link from 'next/link';

interface RoleMeta {
  title: string;
  titleGu: string;
  badgeBg: string;
  badgeText: string;
  defaultPath: string;
  permittedPaths: string[];
}

export const ROLE_CONFIG: Record<string, RoleMeta> = {
  SUPER_ADMIN: {
    title: 'Super Admin',
    titleGu: 'સુપર એડમિન',
    badgeBg: 'bg-red-500/10 dark:bg-red-500/20 border-red-500/30',
    badgeText: 'text-red-600 dark:text-red-400',
    defaultPath: '/admin',
    permittedPaths: [
      '/admin',
      '/admin/articles',
      '/admin/hero',
      '/admin/ads',
      '/admin/categories',
      '/admin/gallery',
      '/admin/videos',
      '/admin/reels',
      '/admin/web-stories',
      '/admin/epaper',
      '/admin/users',
      '/admin/support',
    ],
  },
  EDITOR: {
    title: 'Editor',
    titleGu: 'સંપાદક',
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30',
    badgeText: 'text-blue-600 dark:text-blue-400',
    defaultPath: '/admin',
    permittedPaths: [
      '/admin',
      '/admin/articles',
      '/admin/hero',
      '/admin/categories',
      '/admin/gallery',
      '/admin/videos',
      '/admin/reels',
      '/admin/web-stories',
      '/admin/epaper',
    ],
  },
  REPORTER: {
    title: 'Reporter',
    titleGu: 'પત્રકાર',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    defaultPath: '/admin/articles',
    permittedPaths: ['/admin/articles'],
  },
  SEO: {
    title: 'SEO Specialist',
    titleGu: 'એસઇઓ નિષ્ણાત',
    badgeBg: 'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30',
    badgeText: 'text-purple-600 dark:text-purple-400',
    defaultPath: '/admin/articles',
    permittedPaths: ['/admin/articles', '/admin/categories'],
  },
  ADVERTISEMENT: {
    title: 'Ad Manager',
    titleGu: 'જાહેરાત મેનેજર',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30',
    badgeText: 'text-amber-600 dark:text-amber-400',
    defaultPath: '/admin/ads',
    permittedPaths: ['/admin/ads'],
  },
  PHOTOGRAPHER: {
    title: 'Photographer',
    titleGu: 'ફોટોગ્રાફર',
    badgeBg: 'bg-cyan-500/10 dark:bg-cyan-500/20 border-cyan-500/30',
    badgeText: 'text-cyan-600 dark:text-cyan-400',
    defaultPath: '/admin/gallery',
    permittedPaths: ['/admin/gallery'],
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    authFetch(getBackendApiUrl('/api/auth/me'))
      .then((res) => {
        if (res.status === 401) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json?.success && json.data?.user) {
          const role = json.data.user.role;
          setUserRole(role);
          setUserEmail(json.data.user.email);
          setUserName(json.data.user.authorName || json.data.user.email?.split('@')[0]);
          setAuthChecked(true);

          // If user landed on /admin root but their role does not have Dashboard access,
          // redirect them automatically to their default feature section
          const config = ROLE_CONFIG[role];
          if (config && pathname === '/admin' && role !== 'SUPER_ADMIN' && role !== 'EDITOR') {
            router.replace(config.defaultPath);
          }
        } else if (json && !json.success) {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router, pathname]);

  const menuItems = [
    { label: 'Dashboard (ડેશબોર્ડ)', href: '/admin', icon: LayoutDashboard },
    { label: 'Articles (સમાચાર)', href: '/admin/articles', icon: FileText },
    { label: 'Hero Section (મુખ્ય સમાચાર)', href: '/admin/hero', icon: LayoutTemplate },
    { label: 'Advertisements (જાહેરાતો)', href: '/admin/ads', icon: Megaphone },
    { label: 'Categories (કેટેગરીઝ)', href: '/admin/categories', icon: Layers },
    { label: 'Gallery (ફોટો ગેલેરી)', href: '/admin/gallery', icon: ImageIcon },
    { label: 'Videos (વીડિયોઝ)', href: '/admin/videos', icon: Video },
    { label: 'Reels (રિલ્સ)', href: '/admin/reels', icon: Smartphone },
    { label: 'Web Stories (વેબ સ્ટોરીઝ)', href: '/admin/web-stories', icon: BookOpen },
    { label: 'E-Paper (ઈ-પેપર)', href: '/admin/epaper', icon: Newspaper },
    { label: 'Users (યુઝર્સ મેનેજમેન્ટ)', href: '/admin/users', icon: Users },
    { label: 'Support QR & Bank (સપોર્ટ વિગતો)', href: '/admin/support', icon: Heart },
  ];

  const currentRoleMeta = userRole ? ROLE_CONFIG[userRole] : null;

  // Filter sidebar navigation strictly based on role (Keep default items visible while loading)
  const filteredMenuItems = menuItems.filter((item) => {
    if (!userRole) return true;
    if (userRole === 'SUPER_ADMIN') return true;

    const permittedPaths = currentRoleMeta?.permittedPaths || [];
    return permittedPaths.some(
      (path) => item.href === path || item.href.startsWith(path + '/')
    );
  });

  // Verify whether the currently active route is authorized for this role
  const isCurrentRoutePermitted = (): boolean => {
    if (!userRole) return true;
    if (userRole === 'SUPER_ADMIN') return true;

    const permittedPaths = currentRoleMeta?.permittedPaths || [];
    return permittedPaths.some(
      (path) => pathname === path || pathname.startsWith(path + '/')
    );
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch(getBackendApiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
      document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ── Sidebar Navigation ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link href={currentRoleMeta?.defaultPath || '/admin'} className="flex items-center gap-2">
            <div className="relative h-10 w-40 overflow-hidden rounded">
              <Image
                src="/assets/gujarat-post-logo-chip.png"
                alt="Gujarat Post"
                fill
                priority
                className="object-contain"
              />
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Role Card in Sidebar */}
        {userRole && currentRoleMeta && (
          <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                Logged in as
              </div>
              <div className="text-xs font-black text-zinc-800 dark:text-zinc-200 truncate">
                {userName || 'Admin'}
              </div>
            </div>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${currentRoleMeta.badgeBg} ${currentRoleMeta.badgeText}`}>
              {currentRoleMeta.titleGu}
            </span>
          </div>
        )}

        {/* Navigation Menu (Scrollable) */}
        <nav className="flex-1 overflow-y-auto min-h-0 space-y-1.5 p-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${isActive
                    ? 'bg-[#B3121B] text-white shadow-md shadow-red-900/20'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                  }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout Button */}
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 disabled:opacity-50 cursor-pointer transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out (લૉગ આઉટ)'}</span>
          </button>
        </div>
      </aside>

      {/* ── Main Layout Body ── */}
      <div className="flex flex-1 flex-col min-w-0 w-full lg:pl-64 overflow-x-hidden">

        {/* Navbar Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">

          {/* Left: Hamburger menu toggle for mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden cursor-pointer"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden lg:flex items-center gap-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {userRole && currentRoleMeta ? (
              <div className="flex items-center gap-2">
                <span>Welcome back, <span className="font-bold text-zinc-800 dark:text-zinc-200">{userName || 'User'}</span></span>
                <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full border ${currentRoleMeta.badgeBg} ${currentRoleMeta.badgeText}`}>
                  <Sparkles className="h-3 w-3" />
                  {currentRoleMeta.title} ({currentRoleMeta.titleGu})
                </span>
              </div>
            ) : (
              'Welcome back to Gujarat Post CMS'
            )}
          </div>

          {/* Right: Actions (Theme Toggle & Account profile dropdown) */}
          <div className="flex items-center gap-4">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs">
                  {userName ? userName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </div>
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </button>

              {profileMenuOpen && (
                <>
                  <div
                    onClick={() => setProfileMenuOpen(false)}
                    className="fixed inset-0 z-30"
                  />
                  <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-zinc-200 bg-white p-2 shadow-xl ring-1 ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 z-40">
                    <div className="px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                      {currentRoleMeta && (
                        <span className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border mb-1.5 ${currentRoleMeta.badgeBg} ${currentRoleMeta.badgeText}`}>
                          {currentRoleMeta.title} ({currentRoleMeta.titleGu})
                        </span>
                      )}
                      <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        {userName || 'User Profile'}
                      </div>
                      <div className="text-xs text-zinc-500 truncate mt-0.5">
                        {userEmail}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{loggingOut ? 'Signing out...' : 'Sign Out (લૉગ આઉટ)'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Content area with Route Protection Guard */}
        <main className="flex-1 p-4 md:p-8 min-w-0 w-full">
          {authChecked && !isCurrentRoutePermitted() ? (
            <div className="mx-auto max-w-xl text-center py-16 px-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 mb-4 border border-red-200 dark:border-red-900/50 shadow-lg">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                Access Denied (અનધિકૃત પ્રવેશ)
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto">
                Your account role <span className="font-bold text-zinc-800 dark:text-zinc-200">({currentRoleMeta?.title || userRole})</span> does not have permission to access this section.
              </p>
              <div className="mt-6 flex justify-center">
                <a
                  href={currentRoleMeta?.defaultPath || '/admin'}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#B3121B] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-red-700 transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Go to My Section ({currentRoleMeta?.titleGu || 'મુખ્ય પેજ'})</span>
                </a>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

    </div>
  );
}
