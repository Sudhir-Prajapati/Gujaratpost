import { useState, useEffect, useRef } from 'react';

function AdminDashboard({ onClose, onPreviewArticle }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab State: 'live-updates' | 'epaper' | 'settings' | 'articles'
  const [activeTab, setActiveTab] = useState(localStorage.getItem('adminActiveTab') || 'live-updates');

  // Live Updates States
  const [liveUpdatesList, setLiveUpdatesList] = useState([]);
  const [liveUpdatesLoading, setLiveUpdatesLoading] = useState(false);
  const [luTimeText, setLuTimeText] = useState('');
  const [luTitle, setLuTitle] = useState('');
  const [luIsAlert, setLuIsAlert] = useState(false);
  const [luYoutubeUrl, setLuYoutubeUrl] = useState('');
  const [luEditId, setLuEditId] = useState(null); // id of item being edited
  const [luError, setLuError] = useState('');
  const [luSuccess, setLuSuccess] = useState('');

  // ePaper States
  const [epapersList, setEpapersList] = useState([]);
  const [epapersLoading, setEpapersLoading] = useState(false);
  const [epTitle, setEpTitle] = useState('');
  const [epPublishDate, setEpPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [epPdfFile, setEpPdfFile] = useState(null);
  const [epThumbFile, setEpThumbFile] = useState(null);
  const [epError, setEpError] = useState('');
  const [epSuccess, setEpSuccess] = useState('');

  // Settings / Markets States
  const [settings, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Articles States
  const [articlesList, setArticlesList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [artTitle, setArtTitle] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artExcerpt, setArtExcerpt] = useState('');
  const [artCategory, setArtCategory] = useState('');
  const [artStatus, setArtStatus] = useState('draft');
  const [artIsBreaking, setArtIsBreaking] = useState(false);
  const [artIsFeatured, setArtIsFeatured] = useState(false);
  const [artIsFactCheck, setArtIsFactCheck] = useState(false);
  const [artFeaturedImageId, setArtFeaturedImageId] = useState(null);
  const [artImagePreview, setArtImagePreview] = useState('');
  const [artEditId, setArtEditId] = useState(null);
  const [artAuthorName, setArtAuthorName] = useState('');
  const [artScheduledPublishAt, setArtScheduledPublishAt] = useState('');
  const [artError, setArtError] = useState('');
  const [artSuccess, setArtSuccess] = useState('');
  const [artSubmitAttempted, setArtSubmitAttempted] = useState(false);
  const [artPreviewItem, setArtPreviewItem] = useState(null);
  const [artSubTab, setArtSubTab] = useState('library');
  const [artRejectionReason, setArtRejectionReason] = useState('');
  const [viewRejectArticle, setViewRejectArticle] = useState(null);

  // Articles List Filters & Search
  const [artSearch, setArtSearch] = useState('');
  const [artFilterCategory, setArtFilterCategory] = useState('');
  const [artFilterStatus, setArtFilterStatus] = useState('');

  // Categories/Locations Management states
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIsLocation, setCatIsLocation] = useState(false);
  const [catEditId, setCatEditId] = useState(null);
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');

  // User Management states
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usrEmail, setUsrEmail] = useState('');
  const [usrPassword, setUsrPassword] = useState('');
  const [usrRole, setUsrRole] = useState('editor');
  const [usrIsBlocked, setUsrIsBlocked] = useState(false);
  const [usrEditId, setUsrEditId] = useState(null);
  const [usrError, setUsrError] = useState('');
  const [usrSuccess, setUsrSuccess] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showUsrPassword, setShowUsrPassword] = useState(false);

  // Timer refs for auto-dismissing success messages
  const luSuccessTimer = useRef(null);
  const epSuccessTimer = useRef(null);
  const settingsSuccessTimer = useRef(null);
  const artSuccessTimer = useRef(null);
  const catSuccessTimer = useRef(null);
  const usrSuccessTimer = useRef(null);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (luSuccess) {
      clearTimeout(luSuccessTimer.current);
      luSuccessTimer.current = setTimeout(() => setLuSuccess(''), 5000);
    }
    return () => clearTimeout(luSuccessTimer.current);
  }, [luSuccess]);

  useEffect(() => {
    if (epSuccess) {
      clearTimeout(epSuccessTimer.current);
      epSuccessTimer.current = setTimeout(() => setEpSuccess(''), 5000);
    }
    return () => clearTimeout(epSuccessTimer.current);
  }, [epSuccess]);

  useEffect(() => {
    if (settingsSuccess) {
      clearTimeout(settingsSuccessTimer.current);
      settingsSuccessTimer.current = setTimeout(() => setSettingsSuccess(''), 5000);
    }
    return () => clearTimeout(settingsSuccessTimer.current);
  }, [settingsSuccess]);

  useEffect(() => {
    if (artSuccess) {
      clearTimeout(artSuccessTimer.current);
      artSuccessTimer.current = setTimeout(() => setArtSuccess(''), 5000);
    }
    return () => clearTimeout(artSuccessTimer.current);
  }, [artSuccess]);

  useEffect(() => {
    if (catSuccess) {
      clearTimeout(catSuccessTimer.current);
      catSuccessTimer.current = setTimeout(() => setCatSuccess(''), 5000);
    }
    return () => clearTimeout(catSuccessTimer.current);
  }, [catSuccess]);

  useEffect(() => {
    if (usrSuccess) {
      clearTimeout(usrSuccessTimer.current);
      usrSuccessTimer.current = setTimeout(() => setUsrSuccess(''), 5000);
    }
    return () => clearTimeout(usrSuccessTimer.current);
  }, [usrSuccess]);

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

  // Load initial tab data
  useEffect(() => {
    if (user) {
      if (activeTab === 'live-updates') {
        fetchLiveUpdates();
      } else if (activeTab === 'epaper') {
        fetchEpapers();
      } else if (activeTab === 'settings') {
        fetchSettings();
        fetchArticles();
      } else if (activeTab === 'articles') {
        fetchCategories();
        fetchArticles();
      } else if (activeTab === 'locations' || activeTab === 'categories-tab') {
        fetchCategories();
      } else if (activeTab === 'users' && user.role === 'super_admin') {
        fetchUsers();
      }
    }
  }, [user, activeTab, artFilterCategory, artFilterStatus]);

  // On mount/update check for article edit redirection from homepage
  useEffect(() => {
    if (user && activeTab === 'articles') {
      const editId = localStorage.getItem('editArticleId');
      if (editId) {
        localStorage.removeItem('editArticleId');
        // Fetch article details and load
        fetch(`/api/articles/${editId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            handleEditArticleClick(data.data);
          }
        })
        .catch(err => console.error('Failed to load article from edit redirect:', err));
      }
    }
  }, [user, activeTab]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
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
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      // Ignore failure on logout
    }
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  // ==========================================
  // LIVE UPDATES FUNCTIONS
  // ==========================================
  const fetchLiveUpdates = async () => {
    setLiveUpdatesLoading(true);
    setLuError('');
    try {
      const res = await fetch('/api/live-updates');
      const data = await res.json();
      if (data.success) {
        setLiveUpdatesList(data.data);
      } else {
        setLuError(data.message || 'Failed to load live updates.');
      }
    } catch (err) {
      setLuError('Failed to connect to API.');
    } finally {
      setLiveUpdatesLoading(false);
    }
  };

  const handleSaveLiveUpdate = async (e) => {
    e.preventDefault();
    setLuError('');
    setLuSuccess('');
    
    if (!luTimeText || !luTitle || !luYoutubeUrl) {
      setLuError('Please provide time, headline title, and a YouTube video URL.');
      return;
    }

    try {
      const url = luEditId ? `/api/live-updates/${luEditId}` : '/api/live-updates';
      const method = luEditId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          time_text: luTimeText,
          title: luTitle,
          is_alert: luYoutubeUrl ? 1 : 0,
          youtube_url: luYoutubeUrl || ''
        })
      });

      const data = await res.json();
      if (data.success) {
        setLuSuccess(luEditId ? 'Live update updated successfully.' : 'Live update created successfully.');
        // Reset form
        setLuTimeText('');
        setLuTitle('');
        setLuIsAlert(false);
        setLuYoutubeUrl('');
        setLuEditId(null);
        // Reload list
        fetchLiveUpdates();
      } else {
        setLuError(data.message || 'Failed to save live update.');
      }
    } catch (err) {
      setLuError('Connection error occurred.');
    }
  };

  const handleEditLiveUpdateClick = (item) => {
    setLuEditId(item.id);
    setLuTimeText(item.time_text);
    setLuTitle(item.title);
    setLuIsAlert(item.is_alert === 1 || item.is_alert === true);
    setLuYoutubeUrl(item.youtube_url || '');
    setLuError('');
    setLuSuccess('');
  };

  const handleDeleteLiveUpdate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this update?')) return;
    setLuError('');
    setLuSuccess('');
    try {
      const res = await fetch(`/api/live-updates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setLuSuccess('Live update deleted.');
        fetchLiveUpdates();
      } else {
        setLuError(data.message || 'Failed to delete update.');
      }
    } catch (err) {
      setLuError('Connection error occurred.');
    }
  };

  // ==========================================
  // EPAPER FUNCTIONS
  // ==========================================
  const fetchEpapers = async () => {
    setEpapersLoading(true);
    setEpError('');
    try {
      const res = await fetch('/api/epaper');
      const data = await res.json();
      if (data.success) {
        setEpapersList(data.data);
      } else {
        setEpError(data.message || 'Failed to load ePapers.');
      }
    } catch (err) {
      setEpError('Failed to connect to API.');
    } finally {
      setEpapersLoading(false);
    }
  };

  const handlePublishEpaper = async (e) => {
    e.preventDefault();
    setEpError('');
    setEpSuccess('');

    if (!epTitle || !epPublishDate) {
      setEpError('Please provide a title and select a publication date.');
      return;
    }
    if (!epPdfFile || !epThumbFile) {
      setEpError('Please select both the PDF document and Cover Thumbnail image.');
      return;
    }

    const formData = new FormData();
    formData.append('title', epTitle);
    formData.append('publish_date', epPublishDate);
    formData.append('pdf', epPdfFile);
    formData.append('thumbnail', epThumbFile);

    try {
      const res = await fetch('/api/epaper', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setEpSuccess('ePaper issue published successfully!');
        // Reset form
        setEpTitle('');
        setEpPdfFile(null);
        setEpThumbFile(null);
        // Reset file inputs in DOM
        document.getElementById('ep-pdf-input').value = '';
        document.getElementById('ep-thumb-input').value = '';
        fetchEpapers();
      } else {
        setEpError(data.message || 'Failed to upload ePaper.');
      }
    } catch (err) {
      setEpError('Failed to upload files. Connection problem.');
    }
  };

  const handleDeleteEpaper = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ePaper issue? This will remove files from the server.')) return;
    setEpError('');
    setEpSuccess('');
    try {
      const res = await fetch(`/api/epaper/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setEpSuccess('ePaper issue deleted.');
        fetchEpapers();
      } else {
        setEpError(data.message || 'Failed to delete issue.');
      }
    } catch (err) {
      setEpError('Connection error occurred.');
    }
  };

  // ==========================================
  // SETTINGS & MARKETS FUNCTIONS
  // ==========================================
  const fetchSettings = async () => {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const res = await fetch('/api/markets/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      } else {
        setSettingsError(data.message || 'Failed to load settings.');
      }
    } catch (err) {
      setSettingsError('Failed to connect to API.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdateSettingField = (key, val) => {
    setSettings(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');
    try {
      const res = await fetch('/api/markets/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSuccess('Settings and Market configurations updated successfully.');
        setSettings(data.data);
      } else {
        setSettingsError(data.message || 'Failed to save settings.');
      }
    } catch (err) {
      setSettingsError('Connection error occurred.');
    }
  };

  // ==========================================
  // ARTICLES FUNCTIONS
  // ==========================================
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategoriesList(data.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchArticles = async () => {
    setArticlesLoading(true);
    setArtError('');
    try {
      let url = '/api/articles?limit=100';
      if (artFilterCategory) url += `&category=${artFilterCategory}`;
      if (artFilterStatus) url += `&status=${artFilterStatus}`;
      if (artSearch) url += `&search=${encodeURIComponent(artSearch)}`;
      // Note: Backend automatically filters reporters to their own articles based on JWT token

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setArticlesList(data.data);
      } else {
        setArtError(data.message || 'Failed to load articles.');
      }
    } catch (err) {
      setArtError('Failed to connect to API.');
    } finally {
      setArticlesLoading(false);
    }
  };

  const handleArticleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setArtImagePreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('image', file);

    setArtError('');
    setArtSuccess('');
    try {
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setArtFeaturedImageId(data.data.id);
        setArtSuccess('Image uploaded successfully. Ready to save article.');
      } else {
        setArtError(data.message || 'Failed to upload image.');
      }
    } catch (err) {
      setArtError('Failed to upload image due to connection error.');
    }
  };

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    setArtError('');
    setArtSuccess('');
    setArtSubmitAttempted(true);

    const missingFields = [];
    if (!artTitle || !artTitle.trim()) missingFields.push('Article Headline / Title');
    if (!artExcerpt || !artExcerpt.trim()) missingFields.push('Short Excerpt / Summary');
    if (!artContent || !artContent.trim()) missingFields.push('Main Article Body Content');
    if (!artCategory) missingFields.push('News Category / Location');
    if (!artFeaturedImageId) missingFields.push('Featured Cover Image');

    if (missingFields.length > 0) {
      setArtError(`The following fields are mandatory: ${missingFields.join(', ')}`);
      // Scroll to the top of the compose panel to show the error
      const composeForm = document.getElementById('article-form');
      if (composeForm) {
        composeForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    try {
      const url = artEditId ? `/api/articles/${artEditId}` : '/api/articles';
      const method = artEditId ? 'PUT' : 'POST';

      let targetStatus = artStatus;
      if (user.role === 'reporter' && artStatus === 'rejected') {
        targetStatus = 'pending';
      }

      const payload = {
        title: artTitle.trim(),
        content: artContent.trim(),
        excerpt: artExcerpt.trim(),
        category_id: Number(artCategory),
        status: targetStatus,
        featured_image_id: artFeaturedImageId,
        is_breaking: artIsBreaking ? 1 : 0,
        is_featured: artIsFeatured ? 1 : 0,
        is_fact_check: artIsFactCheck ? 1 : 0,
        scheduled_publish_at: artScheduledPublishAt || null
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        if (payload.status === 'published') {
          setArtSuccess(artEditId ? 'Article updated and published successfully! It is now live on the homepage.' : 'Article published successfully! It is now live on the homepage.');
        } else {
          setArtSuccess(artEditId ? 'Article updated successfully.' : 'Article created successfully.');
        }
        resetArticleForm();
        fetchArticles();
        fetchCategories();
        setArtSubTab('library');
      } else {
        setArtError(data.message || 'Failed to save article.');
      }
    } catch (err) {
      setArtError('Connection error occurred.');
    }
  };

  const timeAgo = (dateStr) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      if (diffMins < 60) return `${diffMins} minutes ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs} hours ago`;
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays} days ago`;
    } catch (e) {
      return '';
    }
  };

  const resetArticleForm = () => {
    setArtTitle('');
    setArtContent('');
    setArtExcerpt('');
    setArtCategory('');
    setArtStatus('draft');
    setArtIsBreaking(false);
    setArtIsFeatured(false);
    setArtIsFactCheck(false);
    setArtFeaturedImageId(null);
    setArtImagePreview('');
    setArtEditId(null);
    setArtAuthorName('');
    setArtScheduledPublishAt('');
    setArtRejectionReason('');
    setArtSubmitAttempted(false);
    const fileInput = document.getElementById('art-image-input');
    if (fileInput) fileInput.value = '';
  };

  const handleEditArticleClick = (item) => {
    setArtEditId(item.id);
    setArtTitle(item.title);
    setArtContent(item.content);
    setArtExcerpt(item.excerpt || '');
    setArtCategory(item.category_id || '');
    setArtStatus(item.status);
    setArtIsBreaking(item.is_breaking === 1 || item.is_breaking === true);
    setArtIsFeatured(item.is_featured === 1 || item.is_featured === true);
    setArtIsFactCheck(item.is_fact_check === 1 || item.is_fact_check === true);
    setArtFeaturedImageId(item.featured_image_id || null);
    setArtImagePreview(item.featured_image_path || '');
    setArtAuthorName(item.author_name || 'System');
    setArtScheduledPublishAt(
      item.scheduled_publish_at 
        ? new Date(new Date(item.scheduled_publish_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) 
        : ''
    );
    setArtRejectionReason(item.rejection_reason || '');
    setArtError('');
    setArtSuccess('');
    setArtSubmitAttempted(false);
    setArtSubTab('editor');
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    setArtError('');
    setArtSuccess('');
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setArtSuccess('Article deleted.');
        fetchArticles();
        fetchCategories();
      } else {
        setArtError(data.message || 'Failed to delete article.');
      }
    } catch (err) {
      setArtError('Connection error occurred.');
    }
  };

  const handleViewArticle = async (id) => {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setArtPreviewItem(data.data);
        if (onPreviewArticle) {
          onPreviewArticle(data.data);
        }
      } else {
        setArtError(data.message || 'Failed to load article details.');
      }
    } catch (err) {
      setArtError('Failed to fetch article details. Connection error.');
    }
  };

  const [quickPublishArticle, setQuickPublishArticle] = useState(null);
  const [quickPublishIsBreaking, setQuickPublishIsBreaking] = useState(false);
  const [quickPublishIsFeatured, setQuickPublishIsFeatured] = useState(false);
  const [quickPublishIsFactCheck, setQuickPublishIsFactCheck] = useState(false);
  const [quickPublishScheduledPublishAt, setQuickPublishScheduledPublishAt] = useState('');

  // Reject Modal States
  const [rejectModalArticleId, setRejectModalArticleId] = useState(null);
  const [rejectModalReason, setRejectModalReason] = useState('');

  const handleOpenQuickPublishModal = (item) => {
    setQuickPublishArticle(item);
    setQuickPublishIsBreaking(item.is_breaking === 1 || item.is_breaking === true);
    setQuickPublishIsFeatured(item.is_featured === 1 || item.is_featured === true);
    setQuickPublishIsFactCheck(item.is_fact_check === 1 || item.is_fact_check === true);
    setQuickPublishScheduledPublishAt(
      item.scheduled_publish_at 
        ? new Date(new Date(item.scheduled_publish_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        : ''
    );
  };

  const handleSaveQuickPublishSettings = async (e) => {
    e.preventDefault();
    if (!quickPublishArticle) return;

    setArtError('');
    setArtSuccess('');

    let targetStatus = 'published';
    if (quickPublishScheduledPublishAt) {
      const scheduledDate = new Date(quickPublishScheduledPublishAt);
      if (scheduledDate > new Date()) {
        targetStatus = 'approved';
      }
    }

    try {
      const payload = {
        status: targetStatus,
        is_breaking: quickPublishIsBreaking ? 1 : 0,
        is_featured: quickPublishIsFeatured ? 1 : 0,
        is_fact_check: quickPublishIsFactCheck ? 1 : 0,
        scheduled_publish_at: quickPublishScheduledPublishAt || null
      };

      const res = await fetch(`/api/articles/${quickPublishArticle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        if (targetStatus === 'approved') {
          setArtSuccess('Article placements saved and scheduled for future publishing!');
        } else {
          setArtSuccess('Article placements saved and published successfully! It is now live.');
        }
        setQuickPublishArticle(null);
        fetchArticles();
        fetchCategories();
      } else {
        setArtError(data.message || 'Failed to update publishing settings.');
      }
    } catch (err) {
      setArtError('Connection error occurred.');
    }
  };

  const handleQuickApprove = async (id) => {
    setArtError('');
    setArtSuccess('');
    try {
      const res = await fetch(`/api/articles/${id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setArtSuccess('Article approved! Editor can now set publish time and publish it.');
        fetchArticles();
        fetchCategories();
      } else {
        setArtError(data.message || 'Failed to approve article.');
      }
    } catch (err) {
      setArtError('Connection error occurred.');
    }
  };

  const handleQuickReject = (id) => {
    setRejectModalArticleId(id);
    setRejectModalReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalArticleId) return;
    setArtError('');
    setArtSuccess('');
    try {
      const res = await fetch(`/api/articles/${rejectModalArticleId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ rejection_reason: rejectModalReason.trim() || 'Revisions required by editor.' })
      });
      const data = await res.json();
      if (data.success) {
        setArtSuccess('Article sent back to reporter for revisions.');
        setRejectModalArticleId(null);
        setRejectModalReason('');
        fetchArticles();
        fetchCategories();
      } else {
        setArtError(data.message || 'Failed to reject article.');
      }
    } catch (err) {
      setArtError('Connection error occurred.');
    }
  };

  const handleQuickUnpublish = async (id) => {
    setArtError('');
    setArtSuccess('');
    try {
      const res = await fetch(`/api/articles/${id}/unpublish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setArtSuccess('Article unpublished successfully and reverted to draft.');
        fetchArticles();
        fetchCategories();
      } else {
        setArtError(data.message || 'Failed to unpublish article.');
      }
    } catch (err) {
      setArtError('Connection error occurred.');
    }
  };

  const handleQuickPublish = async (id) => {
    setArtError('');
    setArtSuccess('');
    try {
      const res = await fetch(`/api/articles/${id}/publish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setArtSuccess('Article published successfully! It is now live.');
        fetchArticles();
        fetchCategories();
      } else {
        setArtError(data.message || 'Failed to publish article.');
      }
    } catch (err) {
      setArtError('Connection error occurred.');
    }
  };

  // ==========================================
  // CATEGORIES / LOCATIONS FUNCTIONS
  // ==========================================
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    setCatSuccess('');

    if (!catName) {
      setCatError('Category name is required.');
      return;
    }

    try {
      const url = catEditId ? `/api/categories/${catEditId}` : '/api/categories';
      const method = catEditId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: catName,
          slug: catSlug || undefined,
          description: catDesc || undefined,
          is_location: catIsLocation ? 1 : 0
        })
      });

      const data = await res.json();
      if (data.success) {
        setCatSuccess(catEditId ? 'Location/Category updated successfully.' : 'Location/Category created successfully.');
        setCatName('');
        setCatSlug('');
        setCatDesc('');
        setCatIsLocation(activeTab === 'locations');
        setCatEditId(null);
        fetchCategories();
      } else {
        setCatError(data.message || 'Failed to save location/category.');
      }
    } catch (err) {
      setCatError('Connection error occurred.');
    }
  };

  const handleEditCategoryClick = (item) => {
    setCatEditId(item.id);
    setCatName(item.name);
    setCatSlug(item.slug);
    setCatDesc(item.description || '');
    const isLoc = item.is_location === 1 || item.is_location === true;
    setCatIsLocation(isLoc);
    setActiveTab(isLoc ? 'locations' : 'categories-tab');
    setCatError('');
    setCatSuccess('');
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category/location?')) return;
    setCatError('');
    setCatSuccess('');
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setCatSuccess('Location/Category deleted.');
        fetchCategories();
      } else {
        setCatError(data.message || 'Failed to delete category.');
      }
    } catch (err) {
      setCatError('Connection error occurred.');
    }
  };

  // ==========================================
  // USER & ROLE MANAGEMENT FUNCTIONS
  // ==========================================
  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsrError('');
    try {
      const res = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(data.data);
      } else {
        setUsrError(data.message || 'Failed to load users.');
      }
    } catch (err) {
      setUsrError('Failed to connect to API.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUsrError('');
    setUsrSuccess('');

    if (!usrEmail) {
      setUsrError('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usrEmail)) {
      setUsrError('Please enter a valid email address.');
      return;
    }

    if (!usrEditId && !usrPassword) {
      setUsrError('Password is required for new users.');
      return;
    }

    if (usrPassword) {
      const hasUpper = /[A-Z]/.test(usrPassword);
      const hasLower = /[a-z]/.test(usrPassword);
      const hasDigit = /[0-9]/.test(usrPassword);
      const hasSpecial = /[^A-Za-z0-9]/.test(usrPassword);
      
      if (usrPassword.length < 8 || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        setUsrError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one unique character.');
        return;
      }
    }

    try {
      const url = usrEditId ? `/api/users/${usrEditId}` : '/api/users';
      const method = usrEditId ? 'PUT' : 'POST';

      const payload = {
        username: usrEmail,
        email: usrEmail,
        role: usrRole,
        is_blocked: usrIsBlocked ? 1 : 0
      };

      if (usrPassword) {
        payload.password = usrPassword;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setUsrSuccess(usrEditId ? 'User updated successfully.' : 'User created successfully.');
        setUsrEmail('');
        setUsrPassword('');
        setUsrRole('editor');
        setUsrIsBlocked(false);
        setUsrEditId(null);
        fetchUsers();
      } else {
        setUsrError(data.message || 'Failed to save user.');
      }
    } catch (err) {
      setUsrError('Connection error occurred.');
    }
  };

  const handleEditUserClick = (item) => {
    setUsrEditId(item.id);
    setUsrEmail(item.email);
    setUsrPassword('');
    setUsrRole(item.role === 'user' ? 'editor' : (item.role || 'editor'));
    setUsrIsBlocked(item.is_blocked === 1 || item.is_blocked === true);
    setUsrError('');
    setUsrSuccess('');
  };

  const handleDeleteUser = async (id) => {
    if (id === user.id) {
      alert('You cannot delete your own logged in account.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setUsrError('');
    setUsrSuccess('');
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUsrSuccess('User deleted successfully.');
        fetchUsers();
      } else {
        setUsrError(data.message || 'Failed to delete user.');
      }
    } catch (err) {
      setUsrError('Connection error occurred.');
    }
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
          <div className="bg-gray-800 py-8 px-6 shadow-2xl rounded-xl border border-gray-700 sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              {loginError && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm text-left">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-300 text-left">Email Address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gujaratpost.com"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 text-left">Password</label>
                <div className="mt-1 relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-4 pr-10 py-3 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer"
                  >
                    {showLoginPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loginLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  ) : 'Login as Administrator'}
                </button>
              </div>
            </form>


          </div>

          <div className="text-center mt-6">
            <button onClick={onClose} className="text-sm font-bold text-gray-500 hover:text-gray-350 cursor-pointer transition-colors">
              ← Return to Main Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDERING DASHBOARD SCREEN
  // ==========================================
  const getRoleDisplayName = (roleName) => {
    if (!roleName) return '';
    switch (roleName) {
      case 'super_admin': return 'Super Admin';
      case 'editor': return 'Editor';
      case 'reporter': return 'Reporter';
      case 'seo': return 'SEO';
      case 'advertisement': return 'Ad Manager';
      case 'photographer': return 'Photographer';
      default: return roleName.charAt(0).toUpperCase() + roleName.slice(1);
    }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',fontFamily:"'Inter','Outfit',sans-serif",background:'#f1f5f9'}}>

      {/* ========== VERTICAL LEFT SIDEBAR ========== */}
      <aside style={{
        width:'260px',minWidth:'260px',background:'linear-gradient(180deg,#1a1f2e 0%,#111827 100%)',
        display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,bottom:0,zIndex:50,
        boxShadow:'4px 0 24px rgba(0,0,0,0.18)'
      }}>
        {/* Brand Logo */}
        <div style={{padding:'28px 24px 20px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:'20px',color:'#fff',letterSpacing:'-0.5px',lineHeight:1.1}}>
            Gujarat
            <span style={{display:'block',color:'#ef4444',fontSize:'10px',fontWeight:600,letterSpacing:'2px',textTransform:'uppercase',marginTop:'2px'}}>Control Center</span>
          </div>
          <div style={{marginTop:'16px',display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg,#ef4444,#b91c1c)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'14px',color:'#fff',flexShrink:0}}>
              {getRoleDisplayName(user.role).charAt(0)}
            </div>
            <div>
              <div style={{color:'#fff',fontWeight:600,fontSize:'13px',lineHeight:1.2}}>{getRoleDisplayName(user.role)}</div>
              <div style={{color:'rgba(255,255,255,0.4)',fontSize:'11px',marginTop:'2px'}}>Admin Portal</div>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav" style={{flex:1,padding:'16px 12px'}}>
          <div style={{color:'rgba(255,255,255,0.3)',fontSize:'10px',fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',padding:'8px 12px',marginBottom:'4px'}}>Main Menu</div>

          {(user.role === 'super_admin' || user.role === 'editor') && (
            <>
              {/* Live Updates */}
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
                <span style={{width:'18px',height:'18px',borderRadius:'50%',background:'currentColor',display:'inline-block',flexShrink:0,animation: activeTab === 'live-updates' ? 'none' : undefined}}>
                  <span style={{display:'block',width:'18px',height:'18px',borderRadius:'50%',background:'currentColor',animation:'ping 1.2s ease-in-out infinite'}}></span>
                </span>
                Live Updates
              </button>

              {/* ePaper */}
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
            onClick={() => {
              setActiveTab('articles');
              setArtSubTab('library');
              resetArticleForm();
            }}
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
                onClick={() => {
                  setActiveTab('locations');
                  setCatIsLocation(true);
                  setCatEditId(null);
                  setCatName('');
                  setCatSlug('');
                  setCatDesc('');
                  setCatError('');
                  setCatSuccess('');
                }}
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
                onClick={() => {
                  setActiveTab('categories-tab');
                  setCatIsLocation(false);
                  setCatEditId(null);
                  setCatName('');
                  setCatSlug('');
                  setCatDesc('');
                  setCatError('');
                  setCatSuccess('');
                }}
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

        {/* Tab Content 1: Live Updates */}
        {activeTab === 'live-updates' && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start text-left">
            {/* Form Column */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900 mb-4 pb-2 border-b border-gray-100">
                {luEditId ? 'Edit Live Update' : 'Add Live Update'}
              </h3>
              
              <form onSubmit={handleSaveLiveUpdate} className="space-y-4">
                {luError && <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">{luError}</div>}
                {luSuccess && <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200">{luSuccess}</div>}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Time Text</label>
                  <input
                    type="text"
                    required
                    value={luTimeText}
                    onChange={(e) => setLuTimeText(e.target.value)}
                    placeholder="e.g. 10:45 AM or Just Now"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Headline Bulletin</label>
                  <textarea
                    required
                    rows="3"
                    value={luTitle}
                    onChange={(e) => setLuTitle(e.target.value)}
                    placeholder="E.g. South Gujarat Rain Alert issued by meteorological department..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">YouTube Link</label>
                  <input
                    type="url"
                    required
                    value={luYoutubeUrl}
                    onChange={(e) => setLuYoutubeUrl(e.target.value)}
                    placeholder="e.g. https://www.youtube.com/watch?v=..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>



                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="flex-grow bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer shadow-sm"
                  >
                    {luEditId ? 'Save Changes' : 'Add Bulletin'}
                  </button>
                  {luEditId && (
                    <button
                      type="button"
                      onClick={() => {
                        setLuEditId(null);
                        setLuTimeText('');
                        setLuTitle('');
                        setLuIsAlert(false);
                        setLuYoutubeUrl('');
                      }}
                      className="bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
              <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Current Live Bulletin Feed
              </h3>

              {liveUpdatesLoading ? (
                <div className="py-12 flex justify-center items-center">
                  <svg className="animate-spin h-8 w-8 text-[#d32f2f]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>
              ) : liveUpdatesList.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm font-medium">No live updates bulletins found. Create one on the left.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13.5px]">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[11px] tracking-wider text-left bg-gray-50">
                        <th className="py-3 px-4">Time</th>
                        <th className="py-3 px-4">Headline Bulletin</th>
                        <th className="py-3 px-4 text-center">Format</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {liveUpdatesList.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-800 whitespace-nowrap">{item.time_text}</td>
                          <td className="py-3.5 px-4 font-medium text-gray-700 max-w-[320px] truncate">
                             <div>{item.title}</div>
                             {item.youtube_url && (
                               <div className="text-[11px] text-red-500 font-semibold truncate">
                                 🔗 {item.youtube_url}
                               </div>
                             )}
                           </td>
                          <td className="py-3.5 px-4 text-center">
                            {item.youtube_url ? (
                              <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold bg-red-100 text-red-700 rounded-md">Video Link</span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold bg-gray-100 text-gray-500 rounded-md">Text Only</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleEditLiveUpdateClick(item)}
                              className="text-indigo-600 hover:text-indigo-900 font-bold cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLiveUpdate(item.id)}
                              className="text-red-600 hover:text-red-900 font-bold cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content 2: ePaper */}
        {activeTab === 'epaper' && (
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start text-left">
            {/* Publisher Form */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Publish New ePaper Issue
              </h3>

              <form onSubmit={handlePublishEpaper} className="space-y-4">
                {epError && <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">{epError}</div>}
                {epSuccess && <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200">{epSuccess}</div>}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Issue Title</label>
                  <input
                    type="text"
                    required
                    value={epTitle}
                    onChange={(e) => setEpTitle(e.target.value)}
                    placeholder="e.g. Gujarat News Hub dt. 16.06.2026"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Publication Date</label>
                  <input
                    type="date"
                    required
                    value={epPublishDate}
                    onChange={(e) => setEpPublishDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PDF Document (Issue PDF)</label>
                  <input
                    id="ep-pdf-input"
                    type="file"
                    required
                    accept="application/pdf"
                    onChange={(e) => setEpPdfFile(e.target.files[0])}
                    className="w-full text-sm text-gray-550 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-[13px] file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cover Thumbnail Image (JPG/PNG)</label>
                  <input
                    id="ep-thumb-input"
                    type="file"
                    required
                    accept="image/*"
                    onChange={(e) => setEpThumbFile(e.target.files[0])}
                    className="w-full text-sm text-gray-550 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-[13px] file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                    </svg>
                    Publish ePaper Issue
                  </button>
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
              <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Published ePaper Archives
              </h3>

              {epapersLoading ? (
                <div className="py-12 flex justify-center items-center">
                  <svg className="animate-spin h-8 w-8 text-[#d32f2f]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>
              ) : epapersList.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm font-medium">No published ePaper issues found. Publish one using the left form.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {epapersList.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-xl p-4 flex gap-4 bg-white shadow-sm hover:shadow-md transition-shadow relative">
                      <div className="w-[80px] h-auto flex-shrink-0 bg-gray-50 rounded border border-gray-250 p-1 flex items-center justify-center">
                        <img src={item.thumbnail_path} alt="cover thumbnail" className="w-full max-h-[110px] object-contain shadow-sm rounded" />
                      </div>
                      <div className="flex-grow flex flex-col justify-between text-left">
                        <div>
                          <h4 className="font-bold text-[13.5px] text-gray-950 leading-snug line-clamp-2">{item.title}</h4>
                          <span className="text-[11px] font-bold text-gray-500 mt-1 block">
                            Date: {item.publish_date ? new Date(item.publish_date).toLocaleDateString('en-GB') : ''}
                          </span>
                        </div>
                        <div className="flex gap-2.5 mt-3">
                          <a 
                            href={item.pdf_path} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                          >
                            PDF
                          </a>
                          <button
                            onClick={() => handleDeleteEpaper(item.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-650 text-[11px] font-bold px-3 py-1.5 rounded transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content 3: Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-left">
            <h3 className="font-['Outfit'] font-bold text-[19px] text-gray-900 mb-6 pb-2.5 border-b border-gray-100 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-600">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Manage Homepage Information & General Settings
            </h3>

            {settingsLoading ? (
              <div className="py-12 flex justify-center items-center">
                <svg className="animate-spin h-8 w-8 text-[#d32f2f]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-6">
                {settingsError && <div className="p-3.5 bg-red-50 text-red-700 text-sm font-semibold rounded-lg border border-red-200">{settingsError}</div>}
                {settingsSuccess && <div className="p-3.5 bg-green-50 text-green-700 text-sm font-semibold rounded-lg border border-green-200">{settingsSuccess}</div>}



                {/* Section 1: API Keys */}
                <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl">
                  <h4 className="font-extrabold text-[15px] text-gray-900 mb-4 tracking-wide uppercase border-b border-gray-200 pb-2">
                    Third-Party Rates API Keys
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-650 uppercase mb-1">CoinGecko Demo API Key</label>
                      <input
                        type="text"
                        value={settings.coingecko_api_key || ''}
                        onChange={(e) => handleUpdateSettingField('coingecko_api_key', e.target.value)}
                        placeholder="E.g. CG-NeqobDSamn..."
                        className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-650 uppercase mb-1">ExchangeRate-API Activation Key</label>
                      <input
                        type="text"
                        value={settings.exchangerate_api_key || ''}
                        onChange={(e) => handleUpdateSettingField('exchangerate_api_key', e.target.value)}
                        placeholder="E.g. 1920eabe2037fe6d..."
                        className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-650 uppercase mb-1">Metals-API Access Key</label>
                      <input
                        type="text"
                        value={settings.metals_api_key || ''}
                        onChange={(e) => handleUpdateSettingField('metals_api_key', e.target.value)}
                        placeholder="E.g. YOUR_ACCESS_KEY"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>
                  <span className="block text-[11.5px] text-gray-500 mt-3 font-semibold">
                    * If you configure a valid API key, the system will automatically query the service on the proxy backend. Otherwise, it defaults to manual override prices.
                  </span>
                </div>

                {/* Section 2: Overrides */}
                <div className="border border-gray-200 p-5 rounded-xl bg-white">
                  <h4 className="font-extrabold text-[15px] text-gray-900 mb-4 tracking-wide uppercase border-b border-gray-200 pb-2">
                    Markets manual override index prices
                  </h4>

                  <div className="space-y-4">
                    {/* Index row 1: Sensex */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Index / Value</label>
                        <div className="font-bold text-[14px] py-2.5 text-gray-800">SENSEX</div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Index Price</label>
                        <input
                          type="text"
                          value={settings.sensex_val || ''}
                          onChange={(e) => handleUpdateSettingField('sensex_val', e.target.value)}
                          placeholder="e.g. 76,721.08"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Change Rate Text</label>
                        <input
                          type="text"
                          value={settings.sensex_change || ''}
                          onChange={(e) => handleUpdateSettingField('sensex_change', e.target.value)}
                          placeholder="e.g. +852.34 (1.07%)"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Trend Direction</label>
                        <select
                          value={settings.sensex_dir || 'up'}
                          onChange={(e) => handleUpdateSettingField('sensex_dir', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] font-semibold text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer"
                        >
                          <option value="up">UP (Green Trend ↑)</option>
                          <option value="down">DOWN (Red Trend ↓)</option>
                        </select>
                      </div>
                    </div>

                    {/* Index row 2: Nifty */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-t border-gray-100 pt-4">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Index / Value</label>
                        <div className="font-bold text-[14px] py-2.5 text-gray-800">NIFTY</div>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={settings.nifty_val || ''}
                          onChange={(e) => handleUpdateSettingField('nifty_val', e.target.value)}
                          placeholder="e.g. 24,619.85"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={settings.nifty_change || ''}
                          onChange={(e) => handleUpdateSettingField('nifty_change', e.target.value)}
                          placeholder="e.g. +252.15 (1.04%)"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <select
                          value={settings.nifty_dir || 'up'}
                          onChange={(e) => handleUpdateSettingField('nifty_dir', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] font-semibold text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer"
                        >
                          <option value="up">UP (Green Trend ↑)</option>
                          <option value="down">DOWN (Red Trend ↓)</option>
                        </select>
                      </div>
                    </div>

                    {/* Commodity Index rows fallback values */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-t border-gray-100 pt-4">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Index / Value</label>
                        <div className="font-bold text-[14px] py-2.5 text-gray-800">Gold / Silver Manual Price</div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Gold 10g Price (INR)</label>
                        <input
                          type="text"
                          value={settings.gold_val || ''}
                          onChange={(e) => handleUpdateSettingField('gold_val', e.target.value)}
                          placeholder="e.g. 72,450"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Silver 1kg Price (INR)</label>
                        <input
                          type="text"
                          value={settings.silver_val || ''}
                          onChange={(e) => handleUpdateSettingField('silver_val', e.target.value)}
                          placeholder="e.g. 87,400"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Crude Oil (INR)</label>
                        <input
                          type="text"
                          value={settings.crude_val || ''}
                          onChange={(e) => handleUpdateSettingField('crude_val', e.target.value)}
                          placeholder="e.g. 6,850"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Section: Main 4 Featured Grid Curation */}
                <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl">
                  <h4 className="font-extrabold text-[15px] text-gray-900 mb-1.5 tracking-wide uppercase border-b border-gray-200 pb-2 flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-650">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Curation: Main 4 Featured Grid Stories
                  </h4>
                  <p className="text-xs text-gray-500 mb-4 font-semibold">
                    Select exactly which published articles appear in the 4 main slots on the portal homepage.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-650 uppercase mb-1">Slot 1 (Top-Left Main Hero)</label>
                      <select
                        value={settings.featured_id_1 || ''}
                        onChange={(e) => handleUpdateSettingField('featured_id_1', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-[13px] font-bold text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value="">-- Fallback to default --</option>
                        {articlesList.filter(a => a.status === 'published').map(a => (
                          <option key={a.id} value={a.id}>{a.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-655 uppercase mb-1">Slot 2 (Top-Right Sub Hero)</label>
                      <select
                        value={settings.featured_id_2 || ''}
                        onChange={(e) => handleUpdateSettingField('featured_id_2', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-[13px] font-bold text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value="">-- Fallback to default --</option>
                        {articlesList.filter(a => a.status === 'published').map(a => (
                          <option key={a.id} value={a.id}>{a.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-655 uppercase mb-1">Slot 3 (Bottom-Left Sub Hero)</label>
                      <select
                        value={settings.featured_id_3 || ''}
                        onChange={(e) => handleUpdateSettingField('featured_id_3', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-[13px] font-bold text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value="">-- Fallback to default --</option>
                        {articlesList.filter(a => a.status === 'published').map(a => (
                          <option key={a.id} value={a.id}>{a.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-655 uppercase mb-1">Slot 4 (Bottom-Right Sub Hero)</label>
                      <select
                        value={settings.featured_id_4 || ''}
                        onChange={(e) => handleUpdateSettingField('featured_id_4', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-[13px] font-bold text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value="">-- Fallback to default --</option>
                        {articlesList.filter(a => a.status === 'published').map(a => (
                          <option key={a.id} value={a.id}>{a.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section: Trending Topics Labels */}
                <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl">
                  <h4 className="font-extrabold text-[15px] text-gray-900 mb-3 tracking-wide uppercase border-b border-gray-200 pb-2">
                    Trending Topics Label Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-650 uppercase mb-1">Trending Label (English)</label>
                      <input
                        type="text"
                        value={settings.trending_label_en || ''}
                        onChange={(e) => handleUpdateSettingField('trending_label_en', e.target.value)}
                        placeholder="e.g. Trending"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-650 uppercase mb-1">Trending Label (Gujarati)</label>
                      <input
                        type="text"
                        value={settings.trending_label_gu || ''}
                        onChange={(e) => handleUpdateSettingField('trending_label_gu', e.target.value)}
                        placeholder="e.g. ટ્રેન્ડિંગ"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: WhatsApp & YouTube Links & Follow Statistics */}
                <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <h4 className="font-extrabold text-[15px] text-gray-900 mb-3 tracking-wide uppercase border-b border-gray-200 pb-2">
                      WhatsApp channel followers
                    </h4>
                    <div>
                      <label className="block text-xs font-bold text-gray-650 uppercase mb-1">Followers Count Display String</label>
                      <input
                        type="text"
                        value={settings.whatsapp_followers || ''}
                        onChange={(e) => handleUpdateSettingField('whatsapp_followers', e.target.value)}
                        placeholder="e.g. 125K + or 200K +"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-[15px] text-gray-900 mb-3 tracking-wide uppercase border-b border-gray-200 pb-2">
                      YouTube Channel Link
                    </h4>
                    <div>
                      <label className="block text-xs font-bold text-gray-650 uppercase mb-1">YouTube Channel URL</label>
                      <input
                        type="url"
                        value={settings.youtube_channel_url || ''}
                        onChange={(e) => handleUpdateSettingField('youtube_channel_url', e.target.value)}
                        placeholder="e.g. https://www.youtube.com/@GujaratPost"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-end">
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-6 rounded-lg text-sm transition-all cursor-pointer shadow-md shadow-green-900/10 flex items-center justify-center gap-2 self-start md:self-end w-full md:w-auto"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <path d="M17 21v-8H7v8M7 3v5h8"/>
                      </svg>
                      Save All Settings
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab Content 4: Articles */}
        {activeTab === 'articles' && (
          <div className="space-y-6 w-full text-left animate-fadeIn">
            {/* Articles Sub-Tabs Bar */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6 flex-wrap gap-4 bg-white p-4.5 rounded-xl border border-gray-150 shadow-sm">
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setArtSubTab('library')}
                  className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                    artSubTab === 'library'
                      ? 'bg-red-50 text-[#d32f2f] border border-red-200 shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-650 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  📁 Articles Directory
                  <span className="bg-gray-150 text-gray-700 text-[11px] px-2.5 py-0.5 rounded-full font-extrabold ml-1.5">
                    {articlesList.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setArtSubTab('editor');
                    if (!artEditId) {
                      resetArticleForm();
                    }
                  }}
                  className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer flex items-center gap-1.5 ${
                    artSubTab === 'editor'
                      ? 'bg-red-50 text-[#d32f2f] border border-red-200 shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-650 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {artEditId ? '📝 Edit Article Details' : '✍️ Write New Article'}
                </button>
              </div>
              
              {artSubTab === 'library' && (
                <button
                  type="button"
                  onClick={() => {
                    resetArticleForm();
                    setArtSubTab('editor');
                  }}
                  className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span className="text-base font-extrabold">+</span> Write New Article
                </button>
              )}
            </div>

            {/* Sub-Tab 1: Library View */}
            {artSubTab === 'library' && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col min-w-0">
                <div className="flex flex-wrap items-center justify-between border-b border-gray-150 pb-4 mb-4 gap-4">
                  <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900">
                    Manage Articles Library
                  </h3>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search title..."
                      value={artSearch}
                      onChange={(e) => setArtSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchArticles()}
                      className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-red-500 placeholder-gray-400"
                    />
                    <button 
                      type="button"
                      onClick={fetchArticles}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Search
                    </button>

                    <select
                      value={artFilterCategory}
                      onChange={(e) => setArtFilterCategory(e.target.value)}
                      className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-750 focus:outline-none cursor-pointer"
                    >
                      <option value="">All Categories</option>
                      {categoriesList.map(cat => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>

                    <select
                      value={artFilterStatus}
                      onChange={(e) => setArtFilterStatus(e.target.value)}
                      className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-755 focus:outline-none cursor-pointer"
                    >
                      <option value="">All Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="pending">Pending Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                {articlesLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <svg className="animate-spin h-8 w-8 text-[#d32f2f]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  </div>
                ) : articlesList.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm font-semibold bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    No articles found matching filters. Write an article using the button above.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13.5px]">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-550 font-bold uppercase text-[10.5px] tracking-wider text-left bg-gray-50">
                          <th className="py-3 px-4">Title & Excerpt</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Author</th>
                          <th className="py-3 px-4">Placements</th>
                          <th className="py-3 px-4">Status & Schedule</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        {articlesList.map((item) => {
                          const isScheduledFuture = item.status === 'approved' && item.scheduled_publish_at && new Date(item.scheduled_publish_at) > new Date();
                          
                          let statusBadge = '';
                          if (item.status === 'draft') {
                            statusBadge = <span className="inline-block bg-gray-100 text-gray-600 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">Draft</span>;
                          } else if (item.status === 'pending') {
                            statusBadge = <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-amber-200">Pending Review</span>;
                          } else if (item.status === 'approved') {
                            statusBadge = <span className="inline-block bg-green-100 text-green-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-green-200">Approved</span>;
                          } else if (item.status === 'rejected') {
                            statusBadge = (
                              <span 
                                onClick={() => setViewRejectArticle(item)}
                                className="inline-block bg-red-100 text-red-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-red-200 cursor-pointer hover:bg-red-200 transition-colors"
                                title="Click to view rejection reason"
                              >
                                Rejected
                              </span>
                            );
                          } else if (item.status === 'published') {
                            statusBadge = <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-blue-200">Published</span>;
                          }

                          return (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 max-w-[280px]">
                                <div className="font-bold text-gray-900 truncate" title={item.title}>
                                  {item.title}
                                </div>
                                <div className="text-[11.5px] text-gray-400 truncate mt-0.5" title={item.excerpt}>
                                  {item.excerpt || <span className="italic text-gray-350">No excerpt summary</span>}
                                </div>
                              </td>
                              <td className="py-3 px-4 font-semibold text-gray-600 whitespace-nowrap">
                                {item.category_name ? (
                                  <span className="inline-flex items-center gap-1">
                                    {item.is_location === 1 ? '📍' : '📁'} {item.category_name}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-semibold text-gray-550 whitespace-nowrap">
                                {item.author_name || 'System'}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-1">
                                  {item.is_breaking === 1 && <span className="bg-red-50 text-red-700 text-[8.5px] px-1.5 py-0.5 rounded font-black border border-red-100 uppercase">Breaking</span>}
                                  {item.is_featured === 1 && <span className="bg-amber-50 text-amber-700 text-[8.5px] px-1.5 py-0.5 rounded font-black border border-amber-100 uppercase">Featured</span>}
                                  {item.is_fact_check === 1 && <span className="bg-indigo-50 text-indigo-700 text-[8.5px] px-1.5 py-0.5 rounded font-black border border-indigo-100 uppercase">Factcheck</span>}
                                  {!item.is_breaking && !item.is_featured && !item.is_fact_check && <span className="text-gray-300">-</span>}
                                </div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1 items-start">
                                  <div>{statusBadge}</div>
                                  {isScheduledFuture ? (
                                    <span className="inline-flex items-center gap-1 text-[9.5px] text-blue-700 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                      ⏰ Scheduled: {new Date(item.scheduled_publish_at).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    item.published_at ? (
                                      <span className="text-[10px] text-gray-400 font-medium">
                                        🚀 Live since: {timeAgo(item.published_at)}
                                      </span>
                                    ) : (
                                      item.status === 'rejected' && item.rejection_reason && (
                                        <span className="text-[10px] text-red-500 font-bold whitespace-normal max-w-[155px]" title={item.rejection_reason}>
                                          💬 Reason: {item.rejection_reason}
                                        </span>
                                      )
                                    )
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right space-x-2.5 whitespace-nowrap font-bold">
                                {/* Editor/Admin actions */}
                                {(user.role === 'super_admin' || user.role === 'editor') && (
                                  <>
                                    {/* Approve button for pending articles */}
                                    {item.status === 'pending' && (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickApprove(item.id)}
                                        className="cursor-pointer text-xs text-green-600 hover:text-green-900 font-bold"
                                      >
                                        Approve
                                      </button>
                                    )}
                                    {/* Reject for pending/approved */}
                                    {(item.status === 'pending' || item.status === 'approved') && (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickReject(item.id)}
                                        className="cursor-pointer text-xs text-orange-600 hover:text-orange-900 font-bold"
                                      >
                                        Reject
                                      </button>
                                    )}
                                    {/* Publish / Unpublish */}
                                    {item.status !== 'rejected' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (item.status === 'published') {
                                            handleQuickUnpublish(item.id);
                                          } else {
                                            handleQuickPublish(item.id);
                                          }
                                        }}
                                        className={`cursor-pointer text-xs ${item.status === 'published' ? 'text-orange-655 hover:text-orange-900' : 'text-blue-600 hover:text-blue-900'}`}
                                      >
                                        {item.status === 'published' ? 'Unpublish' : (isScheduledFuture ? 'Publish Now' : 'Publish')}
                                      </button>
                                    )}
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleViewArticle(item.id)}
                                  className="text-teal-650 hover:text-teal-900 text-xs cursor-pointer"
                                >
                                  View
                                </button>
                                {/* Reporters can only edit drafts or rejected articles */}
                                {(user.role === 'super_admin' || user.role === 'editor' || ['draft', 'rejected'].includes(item.status)) && (
                                  <button
                                    type="button"
                                    onClick={() => handleEditArticleClick(item)}
                                    className="text-indigo-650 hover:text-indigo-900 text-xs cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                )}
                                {/* Reporters can only delete drafts/rejected; Editors can delete any */}
                                {(user.role === 'super_admin' || user.role === 'editor' || ['draft', 'rejected'].includes(item.status)) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteArticle(item.id)}
                                    className="text-red-650 hover:text-red-900 text-xs cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 2: Editor View */}
            {artSubTab === 'editor' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
                {/* Writing Main Panel (8/12 cols) */}
                <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900 pb-2 border-b border-gray-100 flex items-center justify-between">
                    <span>{artEditId ? 'Edit Article Content' : 'Compose News Article'}</span>
                    {artEditId && (
                      <button 
                        type="button"
                        onClick={resetArticleForm} 
                        className="text-xs font-bold text-red-650 hover:underline cursor-pointer"
                      >
                        Clear Form
                      </button>
                    )}
                  </h3>

                  <form id="article-form" onSubmit={handleSaveArticle} className="space-y-4">
                    {artEditId && artAuthorName && (
                      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs font-semibold text-gray-600 flex items-center justify-between shadow-sm">
                        <span>Written By: <strong className="text-gray-900">{artAuthorName}</strong></span>
                      </div>
                    )}
                    {artStatus === 'rejected' && artRejectionReason && (
                      <div className="p-4 bg-red-50 text-red-900 text-xs font-semibold rounded-lg border border-red-200 space-y-1">
                        <div className="font-bold text-[13px] text-red-800 flex items-center gap-1.5 animate-pulse">
                          ❌ Revisions Required / Article Rejected
                        </div>
                        <p className="font-medium whitespace-pre-wrap leading-relaxed mt-1 bg-white p-3 rounded-md border border-red-100 text-red-750">
                          {artRejectionReason}
                        </p>
                        <p className="text-[10px] text-red-650 font-bold mt-1">
                          💡 Please correct the mistakes, select "Submit for Review" in the Publishing dropdown on the right side, and update to submit for review again.
                        </p>
                      </div>
                    )}
                    {artError && <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">{artError}</div>}
                    {artSuccess && <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200">{artSuccess}</div>}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-550 uppercase mb-1">
                          Article Headline / Title <span className="text-red-500 font-bold text-sm">*</span>
                        </label>
                        <input
                          type="text"
                          value={artTitle}
                          onChange={(e) => setArtTitle(e.target.value)}
                          placeholder="e.g. Heavy Rainfall Alert in Surat"
                          className={`w-full bg-white border rounded-lg px-3.5 py-2.5 text-[15px] text-gray-800 font-semibold focus:outline-none focus:border-red-500 transition-colors ${
                            artSubmitAttempted && !artTitle.trim() ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                          }`}
                        />
                        {artSubmitAttempted && !artTitle.trim() && (
                          <span className="block text-[11px] text-red-600 mt-1 font-bold">Headline / Title is required.</span>
                        )}
                        <span className="block text-[11px] text-gray-400 mt-1">Provide a brief, catchy, and descriptive title.</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-555 uppercase mb-1">
                          Short Excerpt / Summary <span className="text-red-500 font-bold text-sm">*</span>
                        </label>
                        <textarea
                          rows="2"
                          value={artExcerpt}
                          onChange={(e) => setArtExcerpt(e.target.value)}
                          placeholder="Short summary for card previews..."
                          className={`w-full bg-white border rounded-lg px-3.5 py-2.5 text-[13.5px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors ${
                            artSubmitAttempted && !artExcerpt.trim() ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                          }`}
                        ></textarea>
                        {artSubmitAttempted && !artExcerpt.trim() && (
                          <span className="block text-[11px] text-red-600 mt-1 font-bold">Short Excerpt / Summary is required.</span>
                        )}
                        <span className="block text-[11px] text-gray-400 mt-1">A 1-2 sentence introduction text shown in post listings.</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-555 uppercase mb-1">
                          Main Article Body Content <span className="text-red-500 font-bold text-sm">*</span>
                        </label>
                        <textarea
                          rows="14"
                          value={artContent}
                          onChange={(e) => setArtContent(e.target.value)}
                          placeholder="Write detailed article news content here..."
                          className={`w-full bg-white border rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 leading-relaxed font-sans transition-colors ${
                            artSubmitAttempted && !artContent.trim() ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                          }`}
                        ></textarea>
                        {artSubmitAttempted && !artContent.trim() && (
                          <span className="block text-[11px] text-red-600 mt-1 font-bold">Main Article Body Content is required.</span>
                        )}
                        <span className="block text-[11px] text-gray-400 mt-1">Write the detailed content. Markdown or plain paragraph text.</span>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Sidebar Configuration Panel (4/12 cols) */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Category & Cover Media */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h4 className="font-extrabold text-[12px] text-gray-755 tracking-wider uppercase border-b border-gray-150 pb-1.5 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-red-50 text-[#d32f2f] flex items-center justify-center font-bold text-[10px]">1</span>
                      Media & Category
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-550 uppercase mb-1">
                          News Category / Location <span className="text-red-500 font-bold text-sm">*</span>
                        </label>
                        <select
                          value={artCategory}
                          onChange={(e) => setArtCategory(e.target.value)}
                          className={`w-full bg-white border rounded-lg px-3 py-2.5 text-[13.5px] font-bold text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer transition-colors ${
                            artSubmitAttempted && !artCategory ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">-- Select Category / Location --</option>
                          {categoriesList.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.is_location === 1 ? '📍 ' : '📁 '} {cat.name}
                            </option>
                          ))}
                        </select>
                        {artSubmitAttempted && !artCategory && (
                          <span className="block text-[11px] text-red-600 mt-1 font-bold">Category / Location selection is required.</span>
                        )}
                        <span className="block text-[11px] text-gray-405 mt-1">
                          Location categories (📍) populate the State News section.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-555 uppercase mb-1">
                          Featured Cover Image <span className="text-red-500 font-bold text-sm">*</span>
                        </label>
                        <div className={`border rounded-lg p-4 bg-white hover:border-[#d32f2f] transition-colors flex flex-col items-center justify-center cursor-pointer text-center relative ${
                          artSubmitAttempted && !artFeaturedImageId ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                        }`}>
                          <svg className="w-8 h-8 text-gray-404 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <input
                            id="art-image-input"
                            type="file"
                            accept="image/*"
                            onChange={handleArticleImageChange}
                            className="w-full text-xs text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-gray-150 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                          />
                        </div>
                        {artSubmitAttempted && !artFeaturedImageId && (
                          <span className="block text-[11px] text-red-600 mt-1 font-bold">Featured Cover Image is required (wait for upload confirmation).</span>
                        )}
                        {artImagePreview && (
                          <div className="mt-3 relative rounded-lg overflow-hidden border border-gray-200 aspect-[16/9] bg-gray-50 shadow-inner">
                            <img src={artImagePreview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="block text-[11px] text-gray-400 mt-1">
                          Wide cover image (16:9 recommended).
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Placements — Editor/Admin full control; Reporters get simplified submit panel */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h4 className="font-extrabold text-[12px] text-gray-750 tracking-wider uppercase border-b border-gray-150 pb-1.5 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-red-50 text-[#d32f2f] flex items-center justify-center font-bold text-[10px]">2</span>
                      {(user.role === 'super_admin' || user.role === 'editor') ? 'Publish Settings' : 'Submit Article'}
                    </h4>

                    {/* ======== REPORTER VIEW: Simple submit panel ======== */}
                    {user.role === 'reporter' && (
                      <div className="space-y-3">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-semibold">
                          📋 <strong>Reporter Workflow:</strong> Save as draft while writing, then submit for editor review when ready. The editor will approve, set placement, and publish.
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-550 uppercase mb-1">Article Status</label>
                          <select
                            value={artStatus}
                            onChange={(e) => setArtStatus(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-[13.5px] font-bold text-gray-755 focus:outline-none focus:border-red-500 cursor-pointer"
                          >
                            {artStatus === 'rejected' && (
                              <option value="rejected" disabled>❌ Rejected (Requires revision)</option>
                            )}
                            <option value="draft">📁 Save as Draft (Keep editing)</option>
                            <option value="pending">📨 Submit for Review (Send to editor)</option>
                          </select>
                          <span className="block text-[11px] text-gray-400 mt-1">
                            Submit when your article is ready. The editor will review and publish it.
                          </span>
                        </div>
                        {artEditId && (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-[11px] text-gray-500">
                            ℹ️ Display placements and publish scheduling are set by the editor after approval.
                          </div>
                        )}
                      </div>
                    )}

                    {/* ======== EDITOR / SUPER ADMIN VIEW: Full publish controls ======== */}
                    {(user.role === 'super_admin' || user.role === 'editor') && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-550 uppercase mb-1">Publishing Status</label>
                          <select
                            value={artStatus}
                            onChange={(e) => setArtStatus(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-[13.5px] font-bold text-gray-755 focus:outline-none focus:border-red-500 cursor-pointer"
                          >
                            <option value="draft">📁 Draft (Hidden / Saved only)</option>
                            <option value="pending">⏳ Pending Review (Awaiting approval)</option>
                            <option value="approved">✔️ Approved (Ready to publish)</option>
                            <option value="rejected">❌ Rejected (Send back for revisions)</option>
                            <option value="published">🚀 Published (Live on Homepage)</option>
                          </select>
                          <span className="block text-[11px] text-gray-400 mt-1">
                            Reporters submit for review. Editors can approve &amp; publish.
                          </span>
                        </div>

                        <div className="border-t border-gray-150 pt-3 space-y-2">
                          <span className="block text-xs font-bold text-gray-550 uppercase mb-1">Display Placements</span>
                          
                          <div className="flex items-start gap-2.5 p-2 rounded hover:bg-gray-100 transition-colors">
                            <input
                              type="checkbox"
                              id="art-is-breaking"
                              checked={artIsBreaking}
                              onChange={(e) => setArtIsBreaking(e.target.checked)}
                              className="h-4.5 w-4.5 rounded border-gray-300 text-red-650 focus:ring-red-500 mt-0.5 cursor-pointer"
                            />
                            <div>
                              <label htmlFor="art-is-breaking" className="text-xs font-bold text-gray-700 cursor-pointer block">
                                Show in Trending Topics bar
                              </label>
                              <span className="block text-[10px] text-gray-400">
                                Adds headline to sliding red horizontal bar.
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5 p-2 rounded hover:bg-gray-100 transition-colors">
                            <input
                              type="checkbox"
                              id="art-is-featured"
                              checked={artIsFeatured}
                              onChange={(e) => setArtIsFeatured(e.target.checked)}
                              className="h-4.5 w-4.5 rounded border-gray-300 text-red-650 focus:ring-red-500 mt-0.5 cursor-pointer"
                            />
                            <div>
                              <label htmlFor="art-is-featured" className="text-xs font-bold text-gray-700 cursor-pointer block">
                                Featured (Featured grid)
                              </label>
                              <span className="block text-[10px] text-gray-400">
                                Pins article to homepage main top slots.
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5 p-2 rounded hover:bg-gray-100 transition-colors">
                            <input
                              type="checkbox"
                              id="art-is-fact-check"
                              checked={artIsFactCheck}
                              onChange={(e) => setArtIsFactCheck(e.target.checked)}
                              className="h-4.5 w-4.5 rounded border-gray-300 text-red-650 focus:ring-red-500 mt-0.5 cursor-pointer"
                            />
                            <div>
                              <label htmlFor="art-is-fact-check" className="text-xs font-bold text-gray-700 cursor-pointer block">
                                Fact Check / Must Read List
                              </label>
                              <span className="block text-[10px] text-gray-400">
                                Displays inside "Must Read" sidebar panel.
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-150 pt-3">
                          <label className="block text-xs font-bold text-gray-550 uppercase mb-1">
                            Scheduled Publish Time
                          </label>
                          <input
                            type="datetime-local"
                            value={artScheduledPublishAt}
                            onChange={(e) => setArtScheduledPublishAt(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer"
                          />
                          <span className="block text-[10px] text-gray-400 mt-1">
                            Leave empty to publish instantly.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2.5">
                    <button
                      type="submit"
                      form="article-form"
                      className="flex-grow bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                    >
                      {user.role === 'reporter'
                        ? (
                          artStatus === 'rejected' ? '📨 Update & Resubmit' :
                          artStatus === 'pending' ? '📨 Submit for Review' : 
                          '💾 Save Draft'
                        )
                        : (
                          artStatus === 'published' ? (artEditId ? '🚀 Update & Publish' : '🚀 Publish Article') :
                          artStatus === 'approved' ? (artEditId ? '✔️ Update & Approve' : '✔️ Save as Approved') :
                          artStatus === 'pending' ? (artEditId ? '⏳ Update & Submit' : '⏳ Submit for Review') :
                          artStatus === 'rejected' ? (artEditId ? '❌ Update & Reject' : '❌ Save as Rejected') :
                          (artEditId ? '💾 Update Draft' : '💾 Save Draft')
                        )
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetArticleForm();
                        setArtSubTab('library');
                      }}
                      className="bg-gray-150 hover:bg-gray-200 text-gray-750 font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Tab Content 5: Locations Manager */}
        {activeTab === 'locations' && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start text-left">
            {/* Form Column */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900 mb-4 pb-2 border-b border-gray-100">
                {catEditId ? 'Edit State / City (Location)' : 'Add State / City (Location)'}
              </h3>
              
              <form onSubmit={handleSaveCategory} className="space-y-4">
                {catError && <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">{catError}</div>}
                {catSuccess && <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200">{catSuccess}</div>}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State / City Name</label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Ahmedabad, Surat, Rajkot, Jamnagar"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug (Optional)</label>
                  <input
                    type="text"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="e.g. ahmedabad, jamnagar (auto-generated if empty)"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-550 uppercase mb-1">Description (Optional)</label>
                  <textarea
                    rows="2"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Brief description of the city news coverage..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] text-gray-800 focus:outline-none focus:border-red-500"
                  ></textarea>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="flex-grow bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer shadow-sm"
                  >
                    {catEditId ? 'Save Changes' : 'Create Location'}
                  </button>
                  {catEditId && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatEditId(null);
                        setCatName('');
                        setCatSlug('');
                        setCatDesc('');
                        setCatIsLocation(true);
                      }}
                      className="bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col min-w-0">
              <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900 mb-4 pb-2 border-b border-gray-100">
                States & Cities (Locations)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-[13.5px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-550 font-bold uppercase text-[11px] tracking-wider text-left bg-gray-50">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Slug</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-center">Articles</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {categoriesList.filter(item => item.is_location === 1 || item.is_location === true).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-800 whitespace-nowrap">{item.name}</td>
                        <td className="py-3.5 px-4 font-semibold text-gray-600">{item.slug}</td>
                        <td className="py-3.5 px-4 font-medium text-gray-500 max-w-[220px] truncate">{item.description || <span className="text-gray-300">-</span>}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center justify-center min-w-[28px] h-[22px] px-2 rounded-full text-[11px] font-bold ${
                            item.article_count > 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {item.article_count ?? 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2.5 whitespace-nowrap font-bold">
                          <button
                            onClick={() => handleEditCategoryClick(item)}
                            className="text-indigo-650 hover:text-indigo-900 font-bold cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(item.id)}
                            className="text-red-650 hover:text-red-900 font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Topic Categories Manager */}
        {activeTab === 'categories-tab' && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start text-left">
            {/* Form Column */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900 mb-4 pb-2 border-b border-gray-100">
                {catEditId ? 'Edit Topic Category' : 'Add Topic Category'}
              </h3>
              
              <form onSubmit={handleSaveCategory} className="space-y-4">
                {catError && <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">{catError}</div>}
                {catSuccess && <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200">{catSuccess}</div>}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Sports, Business, Entertainment"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-550 uppercase mb-1">Slug (Optional)</label>
                  <input
                    type="text"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="e.g. sports, business (auto-generated if empty)"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-550 uppercase mb-1">Description (Optional)</label>
                  <textarea
                    rows="2"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Brief description of the category..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] text-gray-800 focus:outline-none focus:border-red-500"
                  ></textarea>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="flex-grow bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer shadow-sm"
                  >
                    {catEditId ? 'Save Changes' : 'Create Category'}
                  </button>
                  {catEditId && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatEditId(null);
                        setCatName('');
                        setCatSlug('');
                        setCatDesc('');
                        setCatIsLocation(false);
                      }}
                      className="bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col min-w-0">
              <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Topic Categories (General)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-[13.5px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-550 font-bold uppercase text-[11px] tracking-wider text-left bg-gray-50">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Slug</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-center">Articles</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {categoriesList.filter(item => !(item.is_location === 1 || item.is_location === true)).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-800 whitespace-nowrap">{item.name}</td>
                        <td className="py-3.5 px-4 font-semibold text-gray-600">{item.slug}</td>
                        <td className="py-3.5 px-4 font-medium text-gray-500 max-w-[220px] truncate">{item.description || <span className="text-gray-300">-</span>}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center justify-center min-w-[28px] h-[22px] px-2 rounded-full text-[11px] font-bold ${
                            item.article_count > 0
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {item.article_count ?? 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2.5 whitespace-nowrap font-bold">
                          <button
                            onClick={() => handleEditCategoryClick(item)}
                            className="text-indigo-650 hover:text-indigo-900 font-bold cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(item.id)}
                            className="text-red-650 hover:text-red-900 font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 6: Users & Roles Manager (Super Admin Only) */}
        {activeTab === 'users' && user.role === 'super_admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start text-left">
            {/* Form Column */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900 mb-4 pb-2 border-b border-gray-100">
                {usrEditId ? 'Edit Role User' : 'Add Role User'}
              </h3>
              
              <form onSubmit={handleSaveUser} className="space-y-4">
                {usrError && <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">{usrError}</div>}
                {usrSuccess && <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200">{usrSuccess}</div>}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={usrEmail}
                    onChange={(e) => setUsrEmail(e.target.value)}
                    placeholder="e.g. jane@gujaratpost.com"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-555 uppercase mb-1">
                    Password {usrEditId && <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showUsrPassword ? "text" : "password"}
                      required={!usrEditId}
                      value={usrPassword}
                      onChange={(e) => setUsrPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-gray-300 rounded-lg pl-3.5 pr-10 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUsrPassword(!showUsrPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showUsrPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-555 uppercase mb-1">Assign System Role</label>
                  <select
                    value={usrRole}
                    onChange={(e) => setUsrRole(e.target.value)}
                    disabled={usrEditId === user.id}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-[13.5px] font-bold text-gray-750 focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="editor">Editor (Normal Admin)</option>
                    <option value="reporter">Reporter</option>
                    <option value="seo">SEO Manager</option>
                    <option value="advertisement">Advertisement</option>
                    <option value="photographer">Photographer</option>
                  </select>
                  {usrEditId === user.id && (
                    <span className="text-[11px] text-gray-400 mt-1 block">You cannot demote or change your own logged-in role.</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 py-2">
                  <input
                    type="checkbox"
                    id="usr-is-blocked"
                    checked={usrIsBlocked}
                    disabled={usrEditId === user.id}
                    onChange={(e) => setUsrIsBlocked(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-gray-300 text-red-650 focus:ring-red-500"
                  />
                  <label htmlFor="usr-is-blocked" className="text-sm font-bold text-gray-700 cursor-pointer">
                    Deactivate / Block User Account?
                  </label>
                </div>
                {usrEditId === user.id && (
                  <span className="text-[11px] text-gray-400 block -mt-1">You cannot block your own active super admin account.</span>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="flex-grow bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer shadow-sm"
                  >
                    {usrEditId ? 'Save Changes' : 'Create User'}
                  </button>
                  {usrEditId && (
                    <button
                      type="button"
                      onClick={() => {
                        setUsrEditId(null);
                        setUsrEmail('');
                        setUsrPassword('');
                        setUsrRole('editor');
                        setUsrIsBlocked(false);
                      }}
                      className="bg-gray-150 hover:bg-gray-200 text-gray-750 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col min-w-0">
              <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900 mb-4 pb-2 border-b border-gray-100">
                Current Role Accounts List
              </h3>

              {usersLoading ? (
                <div className="py-12 flex justify-center items-center">
                  <svg className="animate-spin h-8 w-8 text-[#d32f2f]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13.5px]">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-555 font-bold uppercase text-[11px] tracking-wider text-left bg-gray-50">
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {usersList.filter(item => item.role !== 'user').map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 text-[10px] rounded font-extrabold uppercase ${
                              item.role === 'super_admin' ? 'bg-purple-100 text-purple-750' :
                              item.role === 'editor' ? 'bg-blue-100 text-blue-750' :
                              item.role === 'reporter' ? 'bg-amber-100 text-amber-800' :
                              item.role === 'seo' ? 'bg-teal-100 text-teal-800' :
                              item.role === 'advertisement' ? 'bg-pink-100 text-pink-700' :
                              item.role === 'photographer' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-gray-100 text-gray-650'
                            }`}>
                              {getRoleDisplayName(item.role)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-gray-600">{item.email}</td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {item.is_blocked ? (
                              <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold bg-red-100 text-red-700 rounded-md uppercase">Blocked</span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold bg-green-100 text-green-700 rounded-md uppercase">Active</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2.5 whitespace-nowrap font-bold">
                            <button
                              onClick={() => handleEditUserClick(item)}
                              className="text-indigo-650 hover:text-indigo-900 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(item.id)}
                              disabled={item.id === user.id}
                              className={`font-bold cursor-pointer ${
                                item.id === user.id 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-red-650 hover:text-red-900'
                              }`}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        </main>
      </div>
      
      {/* Reusable Premium Article Reader Modal */}
      {artPreviewItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop element (separated to avoid blurring child text/images) */}
          <div 
            className="absolute inset-0 bg-black/65 backdrop-blur-sm cursor-pointer"
            onClick={() => setArtPreviewItem(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative z-10 bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-gray-150 animate-slideUp">
            
            {/* Header Image */}
            <div className="relative aspect-[16/9] w-full bg-gray-950 flex-shrink-0">
              <img 
                src={artPreviewItem.featured_image_path || '/viraat_ramayan_mandir.png'} 
                alt={artPreviewItem.title} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
              
              {/* Close Button */}
              <button 
                onClick={() => setArtPreviewItem(null)}
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/70 text-white rounded-full p-2.5 transition-all shadow-md cursor-pointer border border-white/20 flex items-center justify-center"
                title="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              
              <div className="absolute bottom-4 left-6 right-6 text-white text-left">
                <span className="bg-[#d32f2f] text-white text-[10.5px] font-black uppercase px-2.5 py-1.5 rounded tracking-wider shadow-md inline-block">
                  {artPreviewItem.category_name || 'General'}
                </span>
                <h2 className="font-['Outfit'] font-extrabold text-[22px] md:text-[26px] mt-2.5 leading-snug drop-shadow-md">
                  {artPreviewItem.title}
                </h2>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 flex-grow flex flex-col text-left">
              {/* Metadata Info */}
              <div className="flex items-center gap-3.5 text-xs text-gray-550 font-semibold border-b border-gray-100 pb-4 mb-5">
                <span>By <strong className="text-gray-800">{artPreviewItem.author_name || 'System'}</strong></span>
                <span>•</span>
                <span>Created {new Date(artPreviewItem.created_at).toLocaleDateString('en-GB')}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  artPreviewItem.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-150 text-gray-600'
                }`}>
                  {artPreviewItem.status}
                </span>
              </div>

              {/* Text Excerpt/Summary */}
              {artPreviewItem.excerpt && (
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl mb-5 text-gray-700 italic text-[14px] leading-relaxed border-l-4 border-l-[#d32f2f]">
                  <strong>Summary: </strong> {artPreviewItem.excerpt}
                </div>
              )}

              {/* Text Content */}
              <div className="text-gray-750 text-[15px] leading-relaxed font-normal space-y-4 whitespace-pre-wrap select-text">
                {artPreviewItem.content}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-gray-400">Gujarat Post Admin Preview</span>
              <button 
                onClick={() => setArtPreviewItem(null)}
                className="bg-gray-800 hover:bg-gray-950 text-white font-bold text-[13px] px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Close Reader
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Premium Publish Settings Modal */}
      {quickPublishArticle && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn text-left">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/65 backdrop-blur-sm cursor-pointer"
            onClick={() => setQuickPublishArticle(null)}
          ></div>
          
          {/* Modal Content */}
          <form 
            onSubmit={handleSaveQuickPublishSettings}
            className="relative z-10 bg-white rounded-2xl max-w-md w-full shadow-2xl flex flex-col border border-gray-150 animate-slideUp overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#d32f2f] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-2 py-0.5 rounded">Publish Settings</span>
                <h3 className="font-['Outfit'] font-extrabold text-[17px] mt-1 line-clamp-1">
                  {quickPublishArticle.title}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setQuickPublishArticle(null)}
                className="text-white hover:text-gray-200 transition-colors p-1.5 rounded-full hover:bg-white/10"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Display Placements */}
              <div className="space-y-2.5">
                <span className="block text-xs font-bold text-gray-550 uppercase tracking-wider">Display Placements</span>
                
                <div className="flex items-start gap-2.5 p-2 rounded hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="quick-art-is-breaking"
                    checked={quickPublishIsBreaking}
                    onChange={(e) => setQuickPublishIsBreaking(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-gray-300 text-red-655 focus:ring-red-500 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="quick-art-is-breaking" className="text-xs font-bold text-gray-700 cursor-pointer block">
                      Show in Trending Topics bar
                    </label>
                    <span className="block text-[10px] text-gray-400">
                      Adds headline to sliding red horizontal bar.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="quick-art-is-featured"
                    checked={quickPublishIsFeatured}
                    onChange={(e) => setQuickPublishIsFeatured(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-gray-300 text-red-655 focus:ring-red-500 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="quick-art-is-featured" className="text-xs font-bold text-gray-700 cursor-pointer block">
                      Featured (Featured grid)
                    </label>
                    <span className="block text-[10px] text-gray-400">
                      Pins article to homepage main top slots.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="quick-art-is-fact-check"
                    checked={quickPublishIsFactCheck}
                    onChange={(e) => setQuickPublishIsFactCheck(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-gray-300 text-red-655 focus:ring-red-500 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="quick-art-is-fact-check" className="text-xs font-bold text-gray-700 cursor-pointer block">
                      Fact Check / Must Read List
                    </label>
                    <span className="block text-[10px] text-gray-400">
                      Displays inside "Must Read" sidebar panel.
                    </span>
                  </div>
                </div>
              </div>

              {/* Scheduled Publish Time */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-xs font-bold text-gray-550 uppercase tracking-wider mb-2">
                  Scheduled Publish Time
                </label>
                <input
                  type="datetime-local"
                  value={quickPublishScheduledPublishAt}
                  onChange={(e) => setQuickPublishScheduledPublishAt(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer"
                />
                <span className="block text-[10px] text-gray-400 mt-1">
                  Leave empty to publish instantly.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setQuickPublishArticle(null)}
                className="bg-gray-150 hover:bg-gray-200 text-gray-750 font-bold text-[13px] px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold text-[13px] px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                {quickPublishScheduledPublishAt && new Date(quickPublishScheduledPublishAt) > new Date() ? '⏰ Schedule' : '🚀 Publish Now'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reject Article Modal */}
      {rejectModalArticleId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn text-left">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/65 backdrop-blur-sm cursor-pointer"
            onClick={() => {
              setRejectModalArticleId(null);
              setRejectModalReason('');
            }}
          ></div>
          
          {/* Modal Content */}
          <div className="relative z-10 bg-white rounded-2xl max-w-md w-full shadow-2xl flex flex-col border border-gray-150 animate-slideUp overflow-hidden">
            {/* Header */}
            <div className="bg-orange-600 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-2 py-0.5 rounded">Reject Article</span>
                <h3 className="font-['Outfit'] font-extrabold text-[17px] mt-1">Send Back for Revisions</h3>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setRejectModalArticleId(null);
                  setRejectModalReason('');
                }}
                className="text-white hover:text-gray-200 transition-colors p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-550 uppercase tracking-wider mb-2">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  value={rejectModalReason}
                  onChange={(e) => setRejectModalReason(e.target.value)}
                  placeholder="Enter feedback for the reporter..."
                  rows={3}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-orange-500 resize-none placeholder-gray-400"
                />
                <span className="block text-[10px] text-gray-400 mt-1">
                  This message will be visible to the reporter.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => {
                  setRejectModalArticleId(null);
                  setRejectModalReason('');
                }}
                className="bg-gray-150 hover:bg-gray-200 text-gray-750 font-bold text-[13px] px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirmReject}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-[13px] px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                ✋ Reject Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Rejection Feedback Modal */}
      {viewRejectArticle && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn text-left">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/65 backdrop-blur-sm cursor-pointer"
            onClick={() => setViewRejectArticle(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative z-10 bg-white rounded-2xl max-w-md w-full shadow-2xl flex flex-col border border-gray-150 animate-slideUp overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-2 py-0.5 rounded">Rejection Feedback</span>
                <h3 className="font-['Outfit'] font-extrabold text-[17px] mt-1 line-clamp-1">
                  {viewRejectArticle.title}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setViewRejectArticle(null)}
                className="text-white hover:text-gray-200 transition-colors p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <span className="block text-xs font-bold text-gray-550 uppercase tracking-wider mb-2">Rejection Reason / Feedback:</span>
                <div className="bg-red-50 border border-red-150 rounded-xl p-4 text-sm text-red-900 font-semibold whitespace-pre-wrap leading-relaxed">
                  {viewRejectArticle.rejection_reason || 'Revisions required by editor.'}
                </div>
              </div>
              
              {user.role === 'reporter' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed font-semibold">
                  💡 <strong>How to resubmit:</strong>
                  <ol className="list-decimal pl-4 mt-1.5 space-y-1 font-bold">
                    <li>Click the <strong>Edit</strong> button next to this article in the library list.</li>
                    <li>Correct the mistakes mentioned in the feedback above.</li>
                    <li>In the "Submit Article" dropdown, select <strong>Submit for Review</strong>.</li>
                    <li>Click the button to update and submit for review a second time.</li>
                  </ol>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 leading-relaxed font-semibold">
                  ℹ️ <strong>Editor Notes:</strong> The reporter has been notified of this rejection comment. Once the reporter updates and resubmits the article, its status will change back to "Pending Review" and it will appear in your review queue.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button 
                type="button"
                onClick={() => setViewRejectArticle(null)}
                className="bg-gray-150 hover:bg-gray-200 text-gray-755 font-bold text-[13px] px-6 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
