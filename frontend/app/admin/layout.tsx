'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Layers,
  Users,
  LogOut,
  Menu,
  Sun,
  Moon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  Gift,
  Film,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { getBackendApiUrl, authFetch } from '@/lib/api';

import Link from 'next/link';
import Image from 'next/image';

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
      '/admin/tributes',
      '/admin/categories',
      '/admin/gallery',
      '/admin/videos',
      '/admin/shorts',
      '/admin/reels',
      '/admin/web-stories',
      '/admin/epaper',
      '/admin/users',
      '/admin/support',
      '/admin/cleanup',
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
      '/admin/tributes',
      '/admin/categories',
      '/admin/gallery',
      '/admin/videos',
      '/admin/shorts',
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
    permittedPaths: ['/admin/ads', '/admin/tributes'],
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

  // Desktop sidebar expanded mode: false = icon-only rail (72px), true = expanded menu (288px)
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  // Mobile drawer open state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('admin_sidebar_expanded');
    if (saved === null) return;
    // Deferred to the next frame (same pattern as AppProvider) so setState is not called synchronously in the effect
    const frame = window.requestAnimationFrame(() => setSidebarExpanded(saved === 'true'));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleSidebarExpanded = () => {
    setSidebarExpanded((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_sidebar_expanded', String(next));
      }
      return next;
    });
  };

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
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Articles', href: '/admin/articles', icon: FileText },
    { label: 'Hero Section', href: '/admin/hero', icon: LayoutTemplate },
    { label: 'Advertisements', href: '/admin/ads', icon: Megaphone },
    { label: 'Birthday & Shradhanjali', href: '/admin/tributes', icon: Gift },
    { label: 'Categories', href: '/admin/categories', icon: Layers },
    { label: 'Gallery', href: '/admin/gallery', icon: ImageIcon },
    { label: 'Videos', href: '/admin/videos', icon: Video },
    { label: 'Shorts', href: '/admin/shorts', icon: Film },
    { label: 'Reels', href: '/admin/reels', icon: Smartphone },
    { label: 'Web Stories', href: '/admin/web-stories', icon: BookOpen },
    { label: 'E-Paper', href: '/admin/epaper', icon: Newspaper },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Support QR & Bank', href: '/admin/support', icon: Heart },
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
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ── Sidebar Navigation (Left Side: Icon Rail when collapsed, Full Menu when expanded) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#343743] bg-[#242630] text-gray-300 transition-all duration-300 ease-in-out overflow-hidden select-none ${
          mobileDrawerOpen ? 'translate-x-0 w-72' : '-translate-x-full'
        } ${
          sidebarExpanded ? 'lg:translate-x-0 lg:w-72' : 'lg:translate-x-0 lg:w-[72px]'
        }`}
      >
        {/* Brand Header & Toggle */}
        <div className={`flex h-16 items-center justify-between border-b border-[#1598c7] bg-[#28B5E8] shrink-0 overflow-hidden ${
          sidebarExpanded ? 'px-3 py-2.5' : 'px-[14px]'
        }`}>
          <Link
            href={currentRoleMeta?.defaultPath || '/admin'}
            className={`flex items-center min-w-0 shrink transition-all duration-300 ease-in-out overflow-hidden ${
              sidebarExpanded ? 'opacity-100' : 'opacity-0 max-w-0 pointer-events-none'
            }`}
          >
            {/* Inline size: globals.css `img { height: auto; max-width: 100% }` is unlayered and beats Tailwind utilities */}
            <Image
              src="/assets/gujarat-post-logo-cms.jpg"
              alt="Gujarat Post"
              width={487}
              height={120}
              unoptimized
              style={{ height: 40, width: 'auto', maxWidth: 'none' }}
              className="object-contain shrink-0 rounded-md"
            />
          </Link>

          <div className="flex shrink-0 items-center gap-3">
            <span
              className={`select-none text-base font-black uppercase tracking-wider text-white transition-all duration-300 ease-in-out overflow-hidden ${
                sidebarExpanded ? 'opacity-100' : 'opacity-0 max-w-0 pointer-events-none'
              }`}
            >
              CMS
            </span>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setMobileDrawerOpen(false);
                  } else {
                    toggleSidebarExpanded();
                  }
                }}
                className="flex h-9 w-12 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white hover:bg-white/25 transition-all duration-300 cursor-pointer"
                title={sidebarExpanded ? 'Collapse menu' : 'Expand menu'}
                aria-label={sidebarExpanded ? 'Collapse menu' : 'Expand menu'}
              >
                <ChevronLeft
                  className={`h-5 w-5 text-white transition-transform duration-300 ease-in-out ${
                    !sidebarExpanded ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* User Role Card in Sidebar */}
        {userRole && currentRoleMeta && (
          <div
            onClick={!sidebarExpanded ? toggleSidebarExpanded : undefined}
            title={`Logged in as ${userName || 'Admin'} (${currentRoleMeta.title})`}
            className={`mt-3 mx-[14px] h-11 rounded-lg border border-gray-700/60 bg-[#1e2029] transition-all duration-300 ease-in-out overflow-hidden shrink-0 flex items-center ${
              !sidebarExpanded ? 'cursor-pointer hover:border-zinc-400' : ''
            }`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#28B5E8]/40 bg-[#28B5E8]/15 text-[#28B5E8] font-black text-xs select-none">
                {(userName || 'A').charAt(0).toUpperCase()}
              </div>
            </div>
            <div
              className={`flex items-center justify-between min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${
                sidebarExpanded
                  ? 'opacity-100 max-w-[200px] ml-1 flex-1 pr-2.5'
                  : 'opacity-0 max-w-0 ml-0 pointer-events-none'
              }`}
            >
              <div className="min-w-0 pr-1.5">
                <div className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider leading-none">
                  Logged in as
                </div>
                <div className="text-[13px] font-black text-white truncate mt-0.5">
                  {userName || 'Admin'}
                </div>
              </div>
              <span className="text-xs font-bold tracking-wide px-3 py-1 rounded-full border border-[#28B5E8] bg-[#28B5E8] text-white whitespace-nowrap shrink-0">
                {currentRoleMeta.title}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Menu (Scrollable) */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 mt-2 px-[14px] py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                title={!sidebarExpanded ? item.label : undefined}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setMobileDrawerOpen(false);
                  }
                }}
                className={`group/nav relative flex items-center justify-between w-full border-b border-gray-700/50 transition-colors duration-200 overflow-hidden ${
                  sidebarExpanded ? 'px-4 py-3.5' : 'h-11'
                } ${
                  isActive
                    ? 'bg-[#1e2029] text-[#28b5e8]'
                    : 'text-gray-300 hover:bg-[#1e2029]/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`flex shrink-0 items-center justify-center ${sidebarExpanded ? 'h-5 w-5' : 'h-11 w-11'}`}>
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#28b5e8]' : ''}`} />
                  </div>
                  <span
                    className={`min-w-0 flex-1 truncate whitespace-nowrap text-base font-semibold transition-all duration-300 ease-in-out ${
                      sidebarExpanded
                        ? 'opacity-100 max-w-full'
                        : 'opacity-0 max-w-0 pointer-events-none'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {sidebarExpanded && (
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#28B5E8]' : 'text-gray-400 opacity-70'}`}
                  />
                )}

                {/* Floating tooltip when sidebar is in collapsed icon-only mode on desktop */}
                {!sidebarExpanded && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden lg:group-hover/nav:flex items-center whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900 z-50">
                    {item.label}
                    <span className="absolute -left-1 border-4 border-transparent border-r-zinc-900 dark:border-r-zinc-100" />
                  </span>
                )}
              </Link>
            );
          })}

          {/* Super Admin Only: Data Cleanup */}
          {userRole === 'SUPER_ADMIN' && (
            <>
              <div className="my-2 border-t border-zinc-200 dark:border-zinc-800 mx-1" />
              <Link
                href="/admin/cleanup"
                title={!sidebarExpanded ? "Data Cleanup" : undefined}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setMobileDrawerOpen(false);
                  }
                }}
                className={`group/nav relative flex items-center justify-between w-full border-b border-gray-700/50 transition-colors duration-200 overflow-hidden ${
                  sidebarExpanded ? 'px-4 py-3.5' : 'h-11'
                } ${
                  pathname === '/admin/cleanup'
                    ? 'bg-[#1e2029] text-[#28b5e8]'
                    : 'text-gray-300 hover:bg-[#1e2029]/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`flex shrink-0 items-center justify-center ${sidebarExpanded ? 'h-5 w-5' : 'h-11 w-11'}`}>
                    <Trash2 className={`h-5 w-5 shrink-0 ${pathname === '/admin/cleanup' ? 'text-[#28b5e8]' : 'text-red-400'}`} />
                  </div>
                  <span
                    className={`min-w-0 flex-1 truncate whitespace-nowrap text-base font-semibold transition-all duration-300 ease-in-out ${
                      sidebarExpanded
                        ? 'opacity-100 max-w-full'
                        : 'opacity-0 max-w-0 pointer-events-none'
                    }`}
                  >
                    Data Cleanup
                  </span>
                </div>
                {sidebarExpanded && (
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 ${pathname === '/admin/cleanup' ? 'text-[#28B5E8]' : 'text-gray-400 opacity-70'}`}
                  />
                )}
                {!sidebarExpanded && (
                  <span className="pointer-events-none absolute left-full ml-3 hidden lg:group-hover/nav:flex items-center whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900 z-50">
                    Data Cleanup
                    <span className="absolute -left-1 border-4 border-transparent border-r-zinc-900 dark:border-r-zinc-100" />
                  </span>
                )}
              </Link>
            </>
          )}
        </nav>

        {/* Footer Logout Button */}
        <div className="border-t border-gray-700/50 px-[14px] py-2.5 shrink-0 overflow-hidden">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title={!sidebarExpanded ? "Sign Out" : undefined}
            className="group/logout relative flex items-center h-11 w-full rounded-lg text-base font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 disabled:opacity-50 cursor-pointer transition-colors duration-200 overflow-hidden"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center">
              <LogOut className="h-5 w-5 shrink-0" />
            </div>
            <span
              className={`whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${
                sidebarExpanded
                  ? 'opacity-100 max-w-[200px] ml-2'
                  : 'opacity-0 max-w-0 ml-0 pointer-events-none'
              }`}
            >
              {loggingOut ? 'Signing out...' : 'Sign Out'}
            </span>
            {!sidebarExpanded && (
              <span className="pointer-events-none absolute left-full ml-3 hidden lg:group-hover/logout:flex items-center whitespace-nowrap rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white shadow-xl dark:bg-zinc-100 dark:text-zinc-900 z-50">
                Sign Out
                <span className="absolute -left-1 border-4 border-transparent border-r-zinc-900 dark:border-r-zinc-100" />
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main Layout Body ── */}
      <div className={`flex flex-1 flex-col min-w-0 w-full transition-all duration-300 ease-in-out overflow-x-hidden ${
        sidebarExpanded ? 'lg:pl-72' : 'lg:pl-[72px]'
      }`}>

        {/* Navbar Header (Top Menu button removed on desktop) */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 sm:px-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">

          <div className="flex items-center gap-3">
            {/* Mobile hamburger menu toggle only (<lg) */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 lg:hidden cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-lg font-medium text-slate-500 dark:text-slate-400">
            {userRole && currentRoleMeta ? (
              <div className="flex items-center gap-2">
                <span>Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-100">{userName || 'User'}</span></span>
                <span className={`inline-flex items-center gap-1.5 text-sm font-bold tracking-wide px-3.5 py-1 rounded-full border bg-[#28B5E8]/10 border-[#28B5E8]/40 text-sky-600 dark:text-sky-400`}>
                  <Sparkles className="h-5 w-5 shrink-0" />
                  {currentRoleMeta.title}
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
              className="rounded-lg p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-6 w-6 text-amber-500" /> : <Moon className="h-6 w-6" />}
            </button>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#28B5E8] text-white font-bold text-base">
                  {userName ? userName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                </div>
                <ChevronDown className="h-5 w-5 text-zinc-500" />
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
                        <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border mb-1.5 bg-sky-50 border-sky-300 text-sky-600 dark:bg-sky-950/40 dark:border-sky-700 dark:text-sky-400">
                          {currentRoleMeta.title}
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
