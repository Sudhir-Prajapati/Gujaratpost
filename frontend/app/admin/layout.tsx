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
} from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import gpLogo from '../../public/gplogo.jpg';

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

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.authenticated) {
          setUserRole(json.data.user.role);
          setUserEmail(json.data.user.email);
          setUserName(json.data.user.authorName);
        }
      })
      .catch(() => {});
  }, []);

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Articles', href: '/admin/articles', icon: FileText },
    { label: 'Categories', href: '/admin/categories', icon: Layers },
    { label: 'Gallery', href: '/admin/gallery', icon: ImageIcon },
    { label: 'Videos', href: '/admin/videos', icon: Video },
    { label: 'Users', href: '/admin/users', icon: Users },
  ];

  const ROLE_PERMISSIONS: Record<string, string[]> = {
    SUPER_ADMIN: ["/admin"],
    EDITOR: ["/admin/articles", "/admin/categories", "/admin/gallery", "/admin/videos"],
    REPORTER: ["/admin/articles"],
  };

  const filteredMenuItems = menuItems.filter((item) => {
    if (!userRole) return false;
    if (userRole === 'SUPER_ADMIN') return true;

    // Show Dashboard for EDITOR
    if (item.href === '/admin') {
      return userRole === 'EDITOR';
    }

    const permittedPaths = ROLE_PERMISSIONS[userRole] || [];
    return permittedPaths.some(
      (path) => item.href === path || item.href.startsWith(path + '/')
    );
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <a href="/admin" className="flex items-center gap-2">
            <div className="relative h-10 w-40 overflow-hidden rounded bg-white">
              <Image
                src={gpLogo}
                alt="Gujarat Post"
                fill
                priority
                unoptimized
                className="object-contain"
              />
            </div>
          </a>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1.5 p-4">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Footer Logout Button */}
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 disabled:opacity-50"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* ── Main Layout Body ── */}
      <div className="flex flex-1 flex-col lg:pl-64">
        
        {/* Navbar Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          
          {/* Left: Hamburger menu toggle for mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="hidden lg:block text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {userRole ? (
              <span>
                Welcome back, <span className="font-bold text-zinc-800 dark:text-zinc-200">{userName || 'User'}</span> ({userRole === 'SUPER_ADMIN' ? 'Super Admin' : userRole === 'REPORTER' ? 'Reporter' : 'Editor'})
              </span>
            ) : (
              'Welcome back to Gujarat Post CMS'
            )}
          </div>

          {/* Right: Actions (Theme Toggle & Account profile dropdown) */}
          <div className="flex items-center gap-4">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-250 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  <User className="h-4 w-4" />
                </div>
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </button>

              {profileMenuOpen && (
                <>
                  <div
                    onClick={() => setProfileMenuOpen(false)}
                    className="fixed inset-0 z-30"
                  />
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-zinc-200 bg-white p-2 shadow-lg ring-1 ring-black/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 z-40">
                    <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                      <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {userRole === 'SUPER_ADMIN' ? 'Super Admin' : userRole === 'REPORTER' ? 'Reporter' : 'Editor'}
                      </div>
                      <div className="text-sm font-bold text-zinc-700 dark:text-zinc-200 mt-0.5 truncate">
                        {userName || 'User Profile'}
                      </div>
                      <div className="text-xs text-zinc-500 truncate mt-0.5">
                        {userEmail}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
