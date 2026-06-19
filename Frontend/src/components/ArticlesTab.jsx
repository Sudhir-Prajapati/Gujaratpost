import { useState, useEffect, useRef } from 'react';
import { categoriesAPI, articlesAPI, uploadAPI } from '../api';

function ArticlesTab({ user, onPreviewArticle }) {
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

  // Quick Publish Modal States
  const [quickPublishArticle, setQuickPublishArticle] = useState(null);
  const [quickPublishIsBreaking, setQuickPublishIsBreaking] = useState(false);
  const [quickPublishIsFeatured, setQuickPublishIsFeatured] = useState(false);
  const [quickPublishIsFactCheck, setQuickPublishIsFactCheck] = useState(false);
  const [quickPublishScheduledPublishAt, setQuickPublishScheduledPublishAt] = useState('');

  // Reject Modal States
  const [rejectModalArticleId, setRejectModalArticleId] = useState(null);
  const [rejectModalReason, setRejectModalReason] = useState('');

  const artSuccessTimer = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [artFilterCategory, artFilterStatus]);

  useEffect(() => {
    if (artSuccess) {
      clearTimeout(artSuccessTimer.current);
      artSuccessTimer.current = setTimeout(() => setArtSuccess(''), 5000);
    }
    return () => clearTimeout(artSuccessTimer.current);
  }, [artSuccess]);

  // On mount/update check for article edit redirection from homepage
  useEffect(() => {
    const editId = localStorage.getItem('editArticleId');
    if (editId) {
      localStorage.removeItem('editArticleId');
      articlesAPI.getByIdOrSlug(editId)
      .then(data => {
        if (data.success && data.data) {
          handleEditArticleClick(data.data);
        }
      })
      .catch(err => console.error('Failed to load article from edit redirect:', err));
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
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
      let params = 'limit=100';
      if (artFilterCategory) params += `&category=${artFilterCategory}`;
      if (artFilterStatus) params += `&status=${artFilterStatus}`;
      if (artSearch) params += `&search=${encodeURIComponent(artSearch)}`;

      const data = await articlesAPI.getAll(params);
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
      const data = await uploadAPI.image(formData);
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
      const composeForm = document.getElementById('article-form');
      if (composeForm) {
        composeForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    try {
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

      const data = artEditId 
        ? await articlesAPI.update(artEditId, payload)
        : await articlesAPI.create(payload);

      if (data.success) {
        if (payload.status === 'published') {
          setArtSuccess(artEditId ? 'Article updated and published successfully! It is now live on the homepage.' : 'Article published successfully! It is now live on the homepage.');
        } else {
          setArtSuccess(artEditId ? 'Article updated successfully.' : 'Article created successfully.');
        }
        resetArticleForm();
        fetchArticles();
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
      const data = await articlesAPI.delete(id);
      if (data.success) {
        setArtSuccess('Article deleted.');
        fetchArticles();
      } else {
        setArtError(data.message || 'Failed to delete article.');
      }
    } catch (err) {
      setArtError('Connection error occurred.');
    }
  };

  const handleViewArticle = async (id) => {
    try {
      const data = await articlesAPI.getByIdOrSlug(id);
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

      const data = await articlesAPI.update(quickPublishArticle.id, payload);
      if (data.success) {
        if (targetStatus === 'approved') {
          setArtSuccess('Article placements saved and scheduled for future publishing!');
        } else {
          setArtSuccess('Article placements saved and published successfully! It is now live.');
        }
        setQuickPublishArticle(null);
        fetchArticles();
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
      const data = await articlesAPI.approve(id);
      if (data.success) {
        setArtSuccess('Article approved! Editor can now set publish time and publish it.');
        fetchArticles();
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
      const data = await articlesAPI.reject(rejectModalArticleId, { rejection_reason: rejectModalReason.trim() || 'Revisions required by editor.' });
      if (data.success) {
        setArtSuccess('Article sent back to reporter for revisions.');
        setRejectModalArticleId(null);
        setRejectModalReason('');
        fetchArticles();
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
      const data = await articlesAPI.unpublish(id);
      if (data.success) {
        setArtSuccess('Article unpublished successfully and reverted to draft.');
        fetchArticles();
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
      const data = await articlesAPI.publish(id);
      if (data.success) {
        setArtSuccess('Article published successfully! It is now live.');
        fetchArticles();
      } else {
        setArtError(data.message || 'Failed to publish article.');
      }
    } catch (err) {
      setArtError('Connection error occurred.');
    }
  };

  return (
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
                          <div className="text-[11.5px] text-gray-405 truncate mt-0.5" title={item.excerpt}>
                            {item.excerpt || <span className="italic text-gray-350">No excerpt summary</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-650 whitespace-nowrap">
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
                                <span className="text-[10px] text-gray-404 font-medium">
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
                              {item.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickApprove(item.id)}
                                  className="cursor-pointer text-xs text-green-600 hover:text-green-900 font-bold"
                                >
                                  Approve
                                </button>
                              )}
                              {(item.status === 'pending' || item.status === 'approved') && (
                                <button
                                  type="button"
                                  onClick={() => handleQuickReject(item.id)}
                                  className="cursor-pointer text-xs text-orange-600 hover:text-orange-900 font-bold"
                                >
                                  Reject
                                </button>
                              )}
                              {item.status !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.status === 'published') {
                                      handleQuickUnpublish(item.id);
                                    } else {
                                      if (user.role === 'super_admin' || user.role === 'editor') {
                                        handleOpenQuickPublishModal(item);
                                      } else {
                                        handleQuickPublish(item.id);
                                      }
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
                          {(user.role === 'super_admin' || user.role === 'editor' || ['draft', 'rejected'].includes(item.status)) && (
                            <button
                              type="button"
                              onClick={() => handleEditArticleClick(item)}
                              className="text-indigo-655 hover:text-indigo-900 text-xs cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                          {(user.role === 'super_admin' || user.role === 'editor' || ['draft', 'rejected'].includes(item.status)) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteArticle(item.id)}
                              className="text-red-655 hover:text-red-900 text-xs cursor-pointer"
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
                  className="text-xs font-bold text-red-655 hover:underline cursor-pointer"
                >
                  Clear Form
                </button>
              )}
            </h3>

            <form id="article-form" onSubmit={handleSaveArticle} className="space-y-4">
              {artEditId && artAuthorName && (
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs font-semibold text-gray-650 flex items-center justify-between shadow-sm">
                  <span>Written By: <strong className="text-gray-905">{artAuthorName}</strong></span>
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
                  <p className="text-[10px] text-red-655 font-bold mt-1">
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
                    className={`w-full bg-white border rounded-lg px-3.5 py-2.5 text-[15px] text-gray-805 font-semibold focus:outline-none focus:border-red-500 transition-colors ${
                      artSubmitAttempted && !artTitle.trim() ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                    }`}
                  />
                  {artSubmitAttempted && !artTitle.trim() && (
                    <span className="block text-[11px] text-red-600 mt-1 font-bold">Headline / Title is required.</span>
                  )}
                  <span className="block text-[11px] text-gray-404 mt-1">Provide a brief, catchy, and descriptive title.</span>
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
                  <span className="block text-[11px] text-gray-404 mt-1">A 1-2 sentence introduction text shown in post listings.</span>
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
                    className={`w-full bg-white border rounded-lg px-3.5 py-2.5 text-[14px] text-gray-850 focus:outline-none focus:border-red-500 leading-relaxed font-sans transition-colors ${
                      artSubmitAttempted && !artContent.trim() ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'
                    }`}
                  ></textarea>
                  {artSubmitAttempted && !artContent.trim() && (
                    <span className="block text-[11px] text-red-600 mt-1 font-bold">Main Article Body Content is required.</span>
                  )}
                  <span className="block text-[11px] text-gray-404 mt-1">Write the detailed content. Markdown or plain paragraph text.</span>
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
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input
                      id="art-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleArticleImageChange}
                      className="w-full text-xs text-gray-550 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-gray-150 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
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
                  <span className="block text-[11px] text-gray-404 mt-1">
                    Wide cover image (16:9 recommended).
                  </span>
                </div>
              </div>
            </div>

            {/* Status & Placements */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="font-extrabold text-[12px] text-gray-750 tracking-wider uppercase border-b border-gray-150 pb-1.5 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-red-50 text-[#d32f2f] flex items-center justify-center font-bold text-[10px]">2</span>
                {(user.role === 'super_admin' || user.role === 'editor') ? 'Publish Settings' : 'Submit Article'}
              </h4>

              {/* REPORTER VIEW */}
              {user.role === 'reporter' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-semibold">
                    📋 <strong>Reporter Workflow:</strong> Save as draft while writing, then submit for editor review when ready.
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
                  </div>
                </div>
              )}

              {/* EDITOR / SUPER ADMIN VIEW */}
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
                  </div>

                  <div className="border-t border-gray-150 pt-3 space-y-2">
                    <span className="block text-xs font-bold text-gray-550 uppercase mb-1">Display Placements</span>
                    
                    <div className="flex items-start gap-2.5 p-2 rounded hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        id="art-is-breaking"
                        checked={artIsBreaking}
                        onChange={(e) => setArtIsBreaking(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-gray-300 text-red-655 focus:ring-red-500 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="art-is-breaking" className="text-xs font-bold text-gray-700 cursor-pointer block">
                          Show in Trending Topics bar
                        </label>
                        <span className="block text-[10px] text-gray-404">
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
                        className="h-4.5 w-4.5 rounded border-gray-300 text-red-655 focus:ring-red-500 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="art-is-featured" className="text-xs font-bold text-gray-700 cursor-pointer block">
                          Featured (Featured grid)
                        </label>
                        <span className="block text-[10px] text-gray-404">
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
                        className="h-4.5 w-4.5 rounded border-gray-300 text-red-655 focus:ring-red-500 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="art-is-fact-check" className="text-xs font-bold text-gray-700 cursor-pointer block">
                          Fact Check / Must Read List
                        </label>
                        <span className="block text-[10px] text-gray-404">
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
                    <span className="block text-[10px] text-gray-404 mt-1">
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
                className="bg-gray-155 hover:bg-gray-200 text-gray-750 font-bold py-3 px-4 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Cancel
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
                    <span className="block text-[10px] text-gray-404">
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
                    <span className="block text-[10px] text-gray-404">
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
                    <span className="block text-[10px] text-gray-404">
                      Displays inside "Must Read" sidebar panel.
                    </span>
                  </div>
                </div>
              </div>

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
                <span className="block text-[10px] text-gray-404 mt-1">
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
            <div className="bg-orange-655 text-white p-5 flex items-center justify-between">
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
                className="text-white hover:text-gray-250 transition-colors p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
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
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-705 focus:outline-none focus:border-orange-500 resize-none placeholder-gray-404"
                />
                <span className="block text-[10px] text-gray-404 mt-1">
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
                className="bg-gray-150 hover:bg-gray-200 text-gray-755 font-bold text-[13px] px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirmReject}
                className="bg-orange-655 hover:bg-orange-700 text-white font-bold text-[13px] px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
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
                <div className="bg-red-50 border border-red-155 rounded-xl p-4 text-sm text-red-900 font-semibold whitespace-pre-wrap leading-relaxed">
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

export default ArticlesTab;
