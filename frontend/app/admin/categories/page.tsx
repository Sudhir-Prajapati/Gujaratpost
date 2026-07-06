'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  X, 
  FolderOpen, 
  Check, 
  Eye, 
  EyeOff,
  SlidersHorizontal,
  FolderPlus
} from 'lucide-react';

interface CategoryData {
  id: string;
  name: string;
  nameGu: string;
  nameHi: string;
  slug: string;
  icon: string | null;
  color: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);

  // Form states
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [nameGu, setNameGu] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#000000');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [formLang, setFormLang] = useState<'en' | 'gu' | 'hi'>('en');

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/categories');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch categories');
        setCategories(json.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  // Handle Generate Slug automatically
  const generateSlugFromName = (nameVal: string) => {
    return nameVal
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // remove special chars
      .replace(/[\s_]+/g, '-')  // replace spaces/underscores with hyphens
      .replace(/^-+|-+$/g, ''); // remove leading/trailing hyphens
  };

  // Open modal for Create
  const openCreate = () => {
    setSelectedCategory(null);
    setName('');
    setNameGu('');
    setNameHi('');
    setSlug('');
    setIcon('');
    setColor('#10b981'); // default color emerald
    setDisplayOrder(categories.length);
    setIsActive(true);
    setFormLang('en');
    setModalOpen(true);
  };

  // Open modal for Edit
  const openEdit = (cat: CategoryData) => {
    setSelectedCategory(cat);
    setName(cat.name);
    setNameGu(cat.nameGu || '');
    setNameHi(cat.nameHi || '');
    setSlug(cat.slug);
    setIcon(cat.icon || '');
    setColor(cat.color || '#10b981');
    setDisplayOrder(cat.displayOrder);
    setIsActive(cat.isActive);
    setFormLang('en');
    setModalOpen(true);
  };

  // Submit create or edit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return alert('Name and Slug are required');
    setSaving(true);

    const payload = {
      name,
      nameGu: nameGu || name,
      nameHi: nameHi || name,
      slug,
      icon,
      color,
      displayOrder,
      isActive,
    };

    try {
      const url = selectedCategory ? `/api/admin/categories/${selectedCategory.id}` : '/api/admin/categories';
      const method = selectedCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save category');

      if (selectedCategory) {
        setCategories(prev => prev.map(c => c.id === selectedCategory.id ? json.data : c));
      } else {
        setCategories(prev => [...prev, json.data].sort((a, b) => a.displayOrder - b.displayOrder));
      }
      setModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (cat: CategoryData) => {
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cat,
          isActive: !cat.isActive
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update category');

      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete category
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? All articles in it will become uncategorized.')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category');
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filter local categories by search query
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.slug.toLowerCase().includes(query.toLowerCase()) ||
    (c.nameGu && c.nameGu.includes(query)) ||
    (c.nameHi && c.nameHi.includes(query))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Categories</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Organize portal navigation, manage homepage sections, and order feed items.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shrink-0"
        >
          <FolderPlus className="h-4 w-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search categories by name or slug..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-white"
          />
        </div>
      </div>

      {/* Category List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
          <span className="mt-2 text-sm">Querying categories...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">{error}</div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-2xl border-dashed bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-400">
          <FolderOpen className="h-12 w-12 text-zinc-300 mb-2" />
          <p className="text-sm font-semibold">No categories found</p>
          <p className="text-xs text-zinc-550">Create a category to begin sorting articles.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-450 uppercase tracking-wider dark:border-zinc-800 dark:bg-zinc-950/40">
                  <th className="px-6 py-4">Display Order</th>
                  <th className="px-6 py-4">Category Name</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Regional Translations</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-950/20">
                    <td className="px-6 py-4 font-mono font-bold text-zinc-400">
                      {cat.displayOrder}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span 
                          className="h-3.5 w-3.5 rounded-full ring-2 ring-white shadow-sm shrink-0" 
                          style={{ backgroundColor: cat.color || '#000000' }}
                        />
                        <span className="font-bold text-zinc-900 dark:text-white">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-500 select-all">
                      {cat.slug}
                    </td>
                    <td className="px-6 py-4 text-xs space-y-0.5 text-zinc-550 dark:text-zinc-400 font-semibold">
                      <div>Gujarati: {cat.nameGu || cat.name}</div>
                      <div>Hindi: {cat.nameHi || cat.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                          cat.isActive 
                            ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' 
                            : 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                        title={cat.isActive ? 'Deactivate Category' : 'Activate Category'}
                      >
                        {cat.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        <span>{cat.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-850"
                          title="Rename/Edit Details"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-650 dark:hover:bg-red-950/20"
                          title="Delete Category"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* ─── ADD/EDIT CATEGORY MODAL ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-150 dark:border-zinc-850">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-zinc-500" />
                {selectedCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Language switcher tabs */}
              <div className="flex border-b border-zinc-150 dark:border-zinc-800 mb-2">
                {(['en', 'gu', 'hi'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setFormLang(lang)}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                      formLang === lang 
                        ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white' 
                        : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'gu' ? 'ગુજરાતી' : 'हिन्दी'}
                  </button>
                ))}
              </div>

              {formLang === 'en' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Category Name (EN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Technology"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!selectedCategory) {
                        setSlug(generateSlugFromName(e.target.value));
                      }
                    }}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                    required
                  />
                </div>
              )}

              {formLang === 'gu' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Name (GU)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ટેકનોલોજી"
                    value={nameGu}
                    onChange={(e) => setNameGu(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              )}

              {formLang === 'hi' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Name (HI)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. टेक्नोलॉजी"
                    value={nameHi}
                    onChange={(e) => setNameHi(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Slug (URL suffix) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="technology"
                  value={slug}
                  onChange={(e) => setSlug(generateSlugFromName(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white font-mono"
                  required
                />
              </div>

              {/* Color picker and Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Display Color Badge
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 w-14 rounded-xl border border-zinc-200 p-1 dark:border-zinc-850 cursor-pointer bg-zinc-50"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Display Order Index
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-zinc-300 accent-primary"
                />
                <label htmlFor="isActiveCheck" className="text-sm font-bold text-zinc-650 dark:text-zinc-350 cursor-pointer">
                  Activate this category (show in homepage navigation)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-55 dark:border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-850 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
