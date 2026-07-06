import { useState, useEffect } from 'react';
import { authAPI } from './api';
import LiveUpdatesTab from './components/LiveUpdatesTab';
import EpaperTab from './components/EpaperTab';
import SettingsTab from './components/SettingsTab';
import ArticlesTab from './components/ArticlesTab';
import CategoriesTab from './components/CategoriesTab';
import UsersTab from './components/UsersTab';

function AdminDashboard({ onClose, onPreviewArticle }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Active Tab State: 'live-updates' | 'epaper' | 'settings' | 'articles' | 'locations' | 'categories-tab' | 'users'
  const [activeTab, setActiveTab] = useState(localStorage.getItem('adminActiveTab') || 'live-updates');

  // Validate Token / Load Profile on Mount or token change
  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setUser(null);
    }
    // Clean up temporary admin active tab redirect state
    localStorage.removeItem('adminActiveTab');
  }, [token]);

  const fetchProfile = async () => {
    try {
      const data = await authAPI.getProfile();
      if (data.success) {
        const fetchedUser = data.data;
        setUser(fetchedUser);
        // Set role-appropriate default tab on first load
        const savedTab = localStorage.getItem('adminActiveTab');
        if (!savedTab) {
          if (fetchedUser.role === 'super_admin') {
            setActiveTab('live-updates');
          } else if (fetchedUser.role === 'editor') {
            setActiveTab('settings');
          } else {
            setActiveTab('articles');
          }
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      handleLogout();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const data = await authAPI.login({ email, password });
      if (data.success) {
        const userToken = data.data.token;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(data.data);
      } else {
        setLoginError(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      setLoginError('Server connection failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // Ignore failure on logout
    }
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const getRoleDisplayName = (r) => {
    if (!r) return 'User';
    return r.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // ==========================================
  // RENDERING LOGIN SCREEN
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <h2 className="text-[32px] font-extrabold text-white tracking-tight uppercase font-['Outfit']">
            Gujarat <span className="text-red-500 text-[14px] font-normal normal-case block mt-1">Admin Panel Control</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Sign in to manage live tickers, bulletins, and ePapers.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-800 py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-700 text-left">
            <form className="space-y-6" onSubmit={handleLogin}>
              {loginError && (
                <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg text-xs font-bold text-red-200">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="admin@gujaratpost.com"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">
                  Account Password
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 cursor-pointer"
                  >
                    {showLoginPassword ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-[#d32f2f] hover:bg-[#b71c1c] disabled:bg-[#d32f2f]/50 text-white font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer shadow-md shadow-red-900/25 flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  ) : 'Sign In To Dashboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
      
      {/* ========== SIDEBAR NAVIGATION ========== */}
      <aside style={{
        width:'260px',background:'#1f2937',color:'#fff',
        display:'flex',flexDirection:'column',justifyContent:'between',
        position:'fixed',top:0,bottom:0,left:0,zIndex:50,boxShadow:'2px 0 8px rgba(0,0,0,0.1)'
      }}>
        {/* Sidebar Header */}
        <div style={{padding:'20px 16px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'linear-gradient(135deg,#ef4444,#dc2626)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:850,fontSize:'16px'}}>GP</div>
          <div style={{textAlign:'left'}}>
            <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:'14.5px',letterSpacing:'0.3px',lineHeight:'1'}}>GUJARAT POST</div>
            <div style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',fontWeight:700,marginTop:'3px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Management Console</div>
          </div>
        </div>

        {/* Sidebar Navigation Options */}
        <nav style={{flex:1,padding:'16px 12px',overflowY:'auto'}}>
          
          {/* Live tickers section — Super Admin & Editor */}
          {(user.role === 'super_admin' || user.role === 'editor') && (
            <>
              <div style={{color:'rgba(255,255,255,0.3)',fontSize:'10px',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',padding:'0 12px 6px'}}>Tickers & ePapers</div>
              
              {/* Live Tickers */}
              <button
                onClick={() => setActiveTab('live-updates')}
                style={{
                  width:'100%',display:'flex',alignItems:'center',gap:'12px',padding:'11px 14px',
                  borderRadius:'10px',marginBottom:'4px',border:'none',cursor:'pointer',textAlign:'left',
                  fontWeight:600,fontSize:'13.5px',transition:'all 0.18s',
                  background: activeTab === 'live-updates' ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'transparent',
                  color: activeTab === 'live-updates' ? '#fff' : 'rgba(255,255,255,0.6)',
                  boxShadow: activeTab === 'live-updates' ? '0 4px 14px rgba(239,68,68,0.35)' : 'none'
                }}
              >
                <span style={{width:'18px',height:'18px',borderRadius:'50%',background:'currentColor',display:'inline-block',flexShrink:0}} />
                Live Updates Bulletin
              </button>

              {/* ePaper Issues */}
              <button
                onClick={() => setActiveTab('epaper')}
                style={{
                  width:'100%',display:'flex',alignItems:'center',gap:'12px',padding:'11px 14px',
                  borderRadius:'10px',marginBottom:'4px',border:'none',cursor:'pointer',textAlign:'left',
                  fontWeight:600,fontSize:'13.5px',transition:'all 0.18s',
                  background: activeTab === 'epaper' ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'transparent',
                  color: activeTab === 'epaper' ? '#fff' : 'rgba(255,255,255,0.6)',
                  boxShadow: activeTab === 'epaper' ? '0 4px 14px rgba(239,68,68,0.35)' : 'none'
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
                </svg>
                ePaper Issues
              </button>

              {/* Manage Homepage */}
              <button
                onClick={() => setActiveTab('settings')}
                style={{
                  width:'100%',display:'flex',alignItems:'center',gap:'12px',padding:'11px 14px',
                  borderRadius:'10px',marginBottom:'4px',border:'none',cursor:'pointer',textAlign:'left',
                  fontWeight:600,fontSize:'13.5px',transition:'all 0.18s',
                  background: activeTab === 'settings' ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'transparent',
                  color: activeTab === 'settings' ? '#fff' : 'rgba(255,255,255,0.6)',
                  boxShadow: activeTab === 'settings' ? '0 4px 14px rgba(239,68,68,0.35)' : 'none'
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Manage Homepage
              </button>
            </>
          )}

          {/* Articles Manager — all roles */}
          <button
            onClick={() => setActiveTab('articles')}
            style={{
              width:'100%',display:'flex',alignItems:'center',gap:'12px',padding:'11px 14px',
              borderRadius:'10px',marginBottom:'4px',border:'none',cursor:'pointer',textAlign:'left',
              fontWeight:600,fontSize:'13.5px',transition:'all 0.18s',
              background: activeTab === 'articles' ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'transparent',
              color: activeTab === 'articles' ? '#fff' : 'rgba(255,255,255,0.6)',
              boxShadow: activeTab === 'articles' ? '0 4px 14px rgba(239,68,68,0.35)' : 'none'
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            Articles Manager
          </button>

          {/* States & Cities — Super Admin & Editor */}
          {(user.role === 'super_admin' || user.role === 'editor') && (
            <>
              <div style={{color:'rgba(255,255,255,0.3)',fontSize:'10px',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',padding:'12px 12px 4px',marginTop:'4px'}}>Content Setup</div>

              <button
                onClick={() => setActiveTab('locations')}
                style={{
                  width:'100%',display:'flex',alignItems:'center',gap:'12px',padding:'11px 14px',
                  borderRadius:'10px',marginBottom:'4px',border:'none',cursor:'pointer',textAlign:'left',
                  fontWeight:600,fontSize:'13.5px',transition:'all 0.18s',
                  background: activeTab === 'locations' ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'transparent',
                  color: activeTab === 'locations' ? '#fff' : 'rgba(255,255,255,0.6)',
                  boxShadow: activeTab === 'locations' ? '0 4px 14px rgba(239,68,68,0.35)' : 'none'
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                States & Cities
              </button>

              <button
                onClick={() => setActiveTab('categories-tab')}
                style={{
                  width:'100%',display:'flex',alignItems:'center',gap:'12px',padding:'11px 14px',
                  borderRadius:'10px',marginBottom:'4px',border:'none',cursor:'pointer',textAlign:'left',
                  fontWeight:600,fontSize:'13.5px',transition:'all 0.18s',
                  background: activeTab === 'categories-tab' ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'transparent',
                  color: activeTab === 'categories-tab' ? '#fff' : 'rgba(255,255,255,0.6)',
                  boxShadow: activeTab === 'categories-tab' ? '0 4px 14px rgba(239,68,68,0.35)' : 'none'
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
                Topic Categories
              </button>
            </>
          )}

          {user.role === 'super_admin' && (
            <>
              <div style={{color:'rgba(255,255,255,0.3)',fontSize:'10px',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',padding:'12px 12px 4px',marginTop:'4px'}}>Administration</div>
              <button
                onClick={() => setActiveTab('users')}
                style={{
                  width:'100%',display:'flex',alignItems:'center',gap:'12px',padding:'11px 14px',
                  borderRadius:'10px',marginBottom:'4px',border:'none',cursor:'pointer',textAlign:'left',
                  fontWeight:600,fontSize:'13.5px',transition:'all 0.18s',
                  background: activeTab === 'users' ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'transparent',
                  color: activeTab === 'users' ? '#fff' : 'rgba(255,255,255,0.6)',
                  boxShadow: activeTab === 'users' ? '0 4px 14px rgba(239,68,68,0.35)' : 'none'
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{flexShrink:0}}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Users & Roles
              </button>
            </>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div style={{padding:'16px 12px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
          <button
            onClick={onClose}
            style={{
              width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',
              borderRadius:'10px',marginBottom:'8px',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',
              fontWeight:600,fontSize:'13px',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.65)',transition:'all 0.18s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12h20M12 2l-10 10 10 10"/>
            </svg>
            View Site
          </button>
          <button
            onClick={handleLogout}
            style={{
              width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',
              borderRadius:'10px',border:'none',cursor:'pointer',
              fontWeight:600,fontSize:'13px',background:'rgba(239,68,68,0.15)',color:'#f87171',transition:'all 0.18s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ========== MAIN CONTENT AREA ========== */}
      <div style={{marginLeft:'260px',flex:1,display:'flex',flexDirection:'column',minHeight:'100vh'}}>
        {/* Top header bar */}
        <header style={{
          background:'#fff',borderBottom:'1px solid #e5e7eb',padding:'0 32px',
          height:'64px',display:'flex',alignItems:'center',justifyContent:'space-between',
          position:'sticky',top:0,zIndex:40,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <div>
            <h1 style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:'17px',color:'#111827',margin:0}}>
              {activeTab === 'live-updates' && 'Live Updates Bulletin'}
              {activeTab === 'epaper' && 'ePaper Issues'}
              {activeTab === 'settings' && 'Manage Homepage'}
              {activeTab === 'articles' && 'Articles Manager'}
              {activeTab === 'locations' && 'States & Cities'}
              {activeTab === 'categories-tab' && 'Topic Categories'}
              {activeTab === 'users' && 'Users & Roles'}
            </h1>
            <p style={{fontSize:'12px',color:'#6b7280',margin:0,marginTop:'1px'}}>Gujarat Post Admin — {getRoleDisplayName(user.role)}</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg,#ef4444,#b91c1c)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'14px',color:'#fff'}}>
              {getRoleDisplayName(user.role).charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{flex:1,padding:'28px 32px',overflowY:'auto'}}>
          {activeTab === 'live-updates' && <LiveUpdatesTab />}
          {activeTab === 'epaper' && <EpaperTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'articles' && <ArticlesTab user={user} onPreviewArticle={onPreviewArticle} />}
          {activeTab === 'locations' && <CategoriesTab isLocation={true} />}
          {activeTab === 'categories-tab' && <CategoriesTab isLocation={false} />}
          {activeTab === 'users' && user.role === 'super_admin' && <UsersTab currentUser={user} />}
        </main>
      </div>

    </div>
  );
}

export default AdminDashboard;
