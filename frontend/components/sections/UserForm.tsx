'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save, Globe, Lock, Mail, User, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface UserFormProps {
  userId?: string; // If present, we are in Edit mode
}

interface AuthorProfile {
  name: string;
  nameGu: string;
  nameHi: string;
  image: string;
  designation: string;
  designationGu: string;
  designationHi: string;
  bio: string;
  bioGu: string;
  bioHi: string;
  twitter: string;
  facebook: string;
  instagram: string;
  linkedin: string;
}

const DEFAULT_PROFILE: AuthorProfile = {
  name: '',
  nameGu: '',
  nameHi: '',
  image: '',
  designation: '',
  designationGu: '',
  designationHi: '',
  bio: '',
  bioGu: '',
  bioHi: '',
  twitter: '',
  facebook: '',
  instagram: '',
  linkedin: '',
};

export default function UserForm({ userId }: UserFormProps) {
  const router = useRouter();
  const isEditMode = !!userId;

  // Loaders & Errors
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);

  // Tabs: 'account' | 'profile'
  const [activeFormTab, setActiveFormTab] = useState<'account' | 'profile'>('account');

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'SUPER_ADMIN' | 'EDITOR' | 'REPORTER' | 'SEO' | 'ADVERTISEMENT' | 'PHOTOGRAPHER'>('REPORTER');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING_VERIFICATION'>('ACTIVE');
  
  // Author Profile Toggle
  const [enableProfile, setEnableProfile] = useState(false);
  const [profile, setProfile] = useState<AuthorProfile>({ ...DEFAULT_PROFILE });

  // Writing capable roles that require/allow profile management
  const writingRoles = ['SUPER_ADMIN', 'EDITOR', 'REPORTER', 'PHOTOGRAPHER'];
  const showProfileOption = writingRoles.includes(role);

  // Auto-enable or disable profile toggle when role changes
  useEffect(() => {
    if (showProfileOption) {
      setEnableProfile(true);
    } else {
      setEnableProfile(false);
    }
  }, [role, showProfileOption]);

  // Load initial data in Edit mode
  useEffect(() => {
    if (!isEditMode) return;

    async function loadUser() {
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        const json = await res.json();
        
        if (!res.ok) {
          throw new Error(json.message || 'Failed to fetch user data');
        }

        const data = json.data;
        setEmail(data.email || '');
        setRole(data.role || 'REPORTER');
        setStatus(data.status || 'ACTIVE');

        if (data.author) {
          setEnableProfile(true);
          setProfile({
            name: data.author.name || '',
            nameGu: data.author.nameGu || '',
            nameHi: data.author.nameHi || '',
            image: data.author.image || '',
            designation: data.author.designation || '',
            designationGu: data.author.designationGu || '',
            designationHi: data.author.designationHi || '',
            bio: data.author.bio || '',
            bioGu: data.author.bioGu || '',
            bioHi: data.author.bioHi || '',
            twitter: data.author.twitter || '',
            facebook: data.author.facebook || '',
            instagram: data.author.instagram || '',
            linkedin: data.author.linkedin || '',
          });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    }

    loadUser();
  }, [userId, isEditMode]);

  const handleProfileFieldChange = (field: keyof AuthorProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate fields before submitting
    if (enableProfile) {
      if (!profile.name) {
        setError('Public Name is required when public profile is enabled.');
        setLoading(false);
        setActiveFormTab('profile');
        return;
      }
      if (!profile.designation) {
        setError('Designation is required when public profile is enabled.');
        setLoading(false);
        setActiveFormTab('profile');
        return;
      }
    }

    try {
      const payload: any = {
        email,
        role,
        status,
        authorProfile: enableProfile ? {
          ...profile,
          nameGu: profile.name,
          nameHi: profile.name,
          designationGu: profile.designation,
          designationHi: profile.designation,
          bioGu: profile.bio,
          bioHi: profile.bio,
        } : null,
      };

      // Only send password if provided (it is optional in edit mode)
      if (password) {
        payload.password = password;
      } else if (!isEditMode) {
        setError('Password is required for new accounts.');
        setLoading(false);
        return;
      }

      const url = isEditMode ? `/api/admin/users/${userId}` : '/api/admin/users';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Operation failed');
      }

      router.push('/admin/users');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
        <span className="mt-2 text-sm">Loading user account details...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto">
      {/* Form Top Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/users')}
            className="rounded-lg p-2 hover:bg-zinc-100 text-zinc-500 dark:hover:bg-zinc-800 dark:text-zinc-400"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {isEditMode ? 'Modify CMS User' : 'Register New User'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isEditMode ? 'Update credentials, roles, and connected writer profiles.' : 'Setup new accounts and attach public writer bios.'}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{isEditMode ? 'Save Changes' : 'Create User'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Tabs Selection Bar */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveFormTab('account')}
          className={`border-b-2 px-6 py-3.5 text-sm font-bold transition-all ${
            activeFormTab === 'account'
              ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Account settings</span>
          </div>
        </button>

        {showProfileOption && (
          <button
            type="button"
            onClick={() => setActiveFormTab('profile')}
            className={`border-b-2 px-6 py-3.5 text-sm font-bold transition-all ${
              activeFormTab === 'profile'
                ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Public Profile</span>
            </div>
          </button>
        )}
      </div>

      {/* ── ACCOUNT TAB CONTENT ── */}
      {activeFormTab === 'account' && (
        <div className="grid gap-6 md:grid-cols-2 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <Mail className="h-4 w-4 text-zinc-400" />
              <span>Access Details</span>
            </h2>
            
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="editor@gujaratpost.com"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:border-zinc-850 dark:bg-zinc-950/40 dark:text-white dark:focus:ring-white"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                {isEditMode ? 'Change Password (Optional)' : 'Password'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!isEditMode}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditMode ? '•••••••• (leave blank to keep unchanged)' : '••••••••'}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-10 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:border-zinc-850 dark:bg-zinc-950/40 dark:text-white dark:focus:ring-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Must be at least 8 characters and include 1 uppercase letter and 1 number.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-zinc-400" />
              <span>Roles & Operations</span>
            </h2>

            {/* Role select */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Security Role</label>
              <select
                value={role}
                onChange={(e: any) => setRole(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 focus:outline-none dark:border-zinc-850 dark:bg-zinc-950/40 dark:text-white"
              >
                <option value="REPORTER">Reporter (Writer)</option>
                <option value="EDITOR">Editor (Publisher & Reviewer)</option>
                <option value="SUPER_ADMIN">Super Admin (System-Wide Control)</option>
                <option value="SEO">SEO Specialist</option>
                <option value="PHOTOGRAPHER">Photographer</option>
                <option value="ADVERTISEMENT">Advertisement Manager</option>
              </select>
            </div>

            {/* Account Status select */}
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Account Status</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 focus:outline-none dark:border-zinc-850 dark:bg-zinc-950/40 dark:text-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="SUSPENDED">Suspended / Deactivated</option>
                <option value="DELETED">Deleted Status</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── PUBLIC WRITER PROFILE TAB CONTENT ── */}
      {activeFormTab === 'profile' && showProfileOption && (
        <div className="space-y-6">
          
          {/* Enable toggle checkbox */}
          <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Public Writer Profile</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Synchronize this login account with a public-facing author biography.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableProfile}
                onChange={(e) => setEnableProfile(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-250 rounded-full peer peer-focus:ring-2 peer-focus:ring-zinc-400 dark:peer-focus:ring-zinc-700 dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-650 peer-checked:bg-zinc-900 dark:peer-checked:bg-white"></div>
            </label>
          </div>

          {enableProfile && (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Profile Bio Form - Left 2 Columns */}
              <div className="md:col-span-2 space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 border-b border-zinc-150 pb-3 dark:border-zinc-800">Profile Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      required={enableProfile}
                      value={profile.name}
                      onChange={(e) => handleProfileFieldChange('name', e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 focus:outline-none dark:border-zinc-850 dark:bg-zinc-950/40 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Designation</label>
                    <input
                      type="text"
                      required={enableProfile}
                      value={profile.designation}
                      onChange={(e) => handleProfileFieldChange('designation', e.target.value)}
                      placeholder="Senior Editor, Ahmedabad Bureau"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 focus:outline-none dark:border-zinc-850 dark:bg-zinc-950/40 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Short Biography</label>
                    <textarea
                      rows={5}
                      value={profile.bio}
                      onChange={(e) => handleProfileFieldChange('bio', e.target.value)}
                      placeholder="Write a short writer profile description..."
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 focus:outline-none dark:border-zinc-850 dark:bg-zinc-950/40 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Photo & Social Handles - Right 1 Column */}
              <div className="space-y-6">
                
                {/* Photo Upload / Image link Card */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                  <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-200">Profile Picture</h3>
                  
                  {/* Image preview */}
                  <div className="flex justify-center">
                    <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 flex items-center justify-center">
                      {profile.image ? (
                        <img
                          src={profile.image}
                          alt="preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&q=80';
                          }}
                        />
                      ) : (
                        <span className="text-zinc-400 text-xs">No image</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Image URL</label>
                    <input
                      type="text"
                      value={profile.image}
                      onChange={(e) => handleProfileFieldChange('image', e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 focus:outline-none dark:border-zinc-850 dark:bg-zinc-950/40 dark:text-white"
                    />
                  </div>
                </div>

                {/* Social media Handles Card */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                  <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-200">Social Connections</h3>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Twitter Handle</label>
                    <input
                      type="text"
                      value={profile.twitter}
                      onChange={(e) => handleProfileFieldChange('twitter', e.target.value)}
                      placeholder="@username"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 focus:outline-none dark:border-zinc-850 dark:bg-zinc-950/40 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Facebook Profile</label>
                    <input
                      type="text"
                      value={profile.facebook}
                      onChange={(e) => handleProfileFieldChange('facebook', e.target.value)}
                      placeholder="facebook.com/username"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 focus:outline-none dark:border-zinc-850 dark:bg-zinc-950/40 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Instagram Handle</label>
                    <input
                      type="text"
                      value={profile.instagram}
                      onChange={(e) => handleProfileFieldChange('instagram', e.target.value)}
                      placeholder="@username"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 focus:outline-none dark:border-zinc-850 dark:bg-zinc-950/40 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">LinkedIn Profile</label>
                    <input
                      type="text"
                      value={profile.linkedin}
                      onChange={(e) => handleProfileFieldChange('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/username"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-900 focus:outline-none dark:border-zinc-850 dark:bg-zinc-950/40 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
