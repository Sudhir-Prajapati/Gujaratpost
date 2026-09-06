'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Edit2, 
  Loader2, 
  X, 
  FolderOpen, 
  Eye, 
  EyeOff,
  FolderPlus,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Layers,
  Home,
  GripVertical,
  Check,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import { getBackendApiUrl, authFetch, clearApiCache } from '@/lib/api';

interface CategoryData {
  id: string;
  name: string;
  nameGu: string;
  nameHi: string;
  slug: string;
  icon: string | null;
  color: string | null;
  displayOrder: number;
  headerOrder?: number;
  homeOrder?: number;
  isActive: boolean;
  showInHome?: boolean;
  showInHeader?: boolean;
  headerType?: string;
  createdAt: string;
}

const GUJARATI_TRANSLIT_MAP: Record<string, string> = {
  'વરસાદ': 'varsad',
  'હવામાન': 'hawaman',
  'રાજકારણ': 'rajkaran',
  'વિદેશ': 'videsh',
  'દેશ': 'national',
  'ગુજરાત': 'gujarat',
  'ટ્રેન્ડિંગ': 'trending',
  'તાજા સમાચાર': 'latest-news',
  'ઇન્સ્ટાગ્રામ': 'instagram',
  'વેબસ્ટોરી': 'webstory',
  'ક્રાઇમ': 'crime',
  'હેલ્થ': 'health',
  'મનોરંજન': 'entertainment',
  'ટેકનોલોજી': 'technology',
  'ફેક્ટ ચેક': 'fact-check',
  'ફોટો ગેલેરી': 'photos',
  'વેપાર': 'business',
  'રમત-જગત': 'sports',
  'શિક્ષણ': 'education',
  'લાઇફસ્ટાઇલ': 'lifestyle',
  'ચૂંટણી': 'election',
  'લાઇવ સેન્ટર': 'live-center',
  'શોર્ટ વીડિયો': 'shorts',
  'અ': 'a', 'આ': 'aa', 'ઇ': 'i', 'ઈ': 'ee', 'ઉ': 'u', 'ઊ': 'oo', 'એ': 'e', 'ઐ': 'ai', 'ઓ': 'o', 'ઔ': 'au',
  'ક': 'k', 'ખ': 'kh', 'ગ': 'g', 'ઘ': 'gh', 'ચ': 'ch', 'છ': 'chh', 'જ': 'j', 'ઝ': 'z',
  'ટ': 't', 'ઠ': 'th', 'ડ': 'd', 'ઢ': 'dh', 'ણ': 'n', 'ત': 't', 'થ': 'th', 'દ': 'd',
  'ધ': 'dh', 'ન': 'n', 'પ': 'p', 'ફ': 'f', 'બ': 'b', 'ભ': 'bh', 'મ': 'm', 'ય': 'y',
  'ર': 'r', 'લ': 'l', 'વ': 'v', 'શ': 'sh', 'ષ': 'sh', 'સ': 's', 'હ': 'h', 'ળ': 'l',
  'ા': 'a', 'િ': 'i', 'ી': 'ee', 'ુ': 'u', 'ૂ': 'oo', 'ે': 'e', 'ૈ': 'ai', 'ો': 'o', 'ૌ': 'au',
  'ં': 'n', 'ઃ': 'h', '્': ''
};

export const slugifyText = (text: string): string => {
  if (!text) return '';
  const trimmed = text.trim();
  if (GUJARATI_TRANSLIT_MAP[trimmed]) {
    return GUJARATI_TRANSLIT_MAP[trimmed];
  }
  let result = '';
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (GUJARATI_TRANSLIT_MAP[char] !== undefined) {
      result += GUJARATI_TRANSLIT_MAP[char];
    } else {
      result += char;
    }
  }
  return result
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderTab, setOrderTab] = useState<'all' | 'home' | 'header'>('all');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'home' | 'header' | 'hidden'>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);

  // Form states
  const [saving, setSaving] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [name, setName] = useState('');
  const [nameGu, setNameGu] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#000000');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [showInHome, setShowInHome] = useState(true);
  const [showInHeader, setShowInHeader] = useState(true);
  const [headerType, setHeaderType] = useState('GLOBAL');
  const [formLang, setFormLang] = useState<'en' | 'gu' | 'hi'>('en');

  // Temporary list state for Reorder Modal
  const [orderList, setOrderList] = useState<CategoryData[]>([]);

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      try {
        const res = await authFetch(getBackendApiUrl('/api/admin/categories'));
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch categories');
        const sorted = (json.data || []).sort((a: CategoryData, b: CategoryData) => (b.displayOrder ?? 0) - (a.displayOrder ?? 0));
        setCategories(sorted);
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
    const minOrder = categories.length > 0 ? Math.min(...categories.map(c => c.displayOrder ?? 0)) : 10;
    const endOrder = minOrder > 5 ? minOrder - 5 : Math.min(minOrder - 1, 0);
    setDisplayOrder(endOrder);
    setIsActive(true);
    setShowInHome(true);
    setShowInHeader(true);
    setHeaderType('GLOBAL');
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
    setDisplayOrder(cat.displayOrder ?? 0);
    setIsActive(cat.isActive ?? true);
    setShowInHome(cat.showInHome !== undefined ? cat.showInHome : true);
    setShowInHeader(cat.showInHeader !== undefined ? cat.showInHeader : true);
    setHeaderType(cat.headerType || 'GLOBAL');
    setFormLang('en');
    setModalOpen(true);
  };

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id?: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (id) setDragOverItemId(id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the element itself, not a child
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItemId(null);
    }
  };

  const handleDropSubset = (targetItem: CategoryData, filterFn: (c: CategoryData) => boolean) => {
    if (!draggedItemId || draggedItemId === targetItem.id) return;

    // Use the correct order field based on the active tab
    const getOrd = (c: CategoryData) => {
      if (orderTab === 'header') return c.headerOrder ?? c.displayOrder ?? 0;
      if (orderTab === 'home') return c.homeOrder ?? c.displayOrder ?? 0;
      return c.displayOrder ?? 0;
    };
    const orderProp = orderTab === 'header' ? 'headerOrder' : orderTab === 'home' ? 'homeOrder' : 'displayOrder';

    const subset = orderList.filter(filterFn).sort((a, b) => getOrd(b) - getOrd(a));
    const sourceIndex = subset.findIndex(c => c.id === draggedItemId);
    const targetIndex = subset.findIndex(c => c.id === targetItem.id);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newSubset = [...subset];
    const [movedItem] = newSubset.splice(sourceIndex, 1);
    newSubset.splice(targetIndex, 0, movedItem);

    // Re-assign order values: highest order = first item
    const maxOrder = Math.max(...subset.map(s => getOrd(s)), 100);
    const updatedOrderList = [...orderList];
    newSubset.forEach((item, index) => {
      const idx = updatedOrderList.findIndex(c => c.id === item.id);
      if (idx !== -1) {
        updatedOrderList[idx] = { ...updatedOrderList[idx], [orderProp]: maxOrder - (index * 5) };
      }
    });

    setOrderList(updatedOrderList);
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  // Open Order Manager Modal with specific tab
  const openOrderManager = (tab: 'all' | 'home' | 'header' = 'all') => {
    const getOrd = (c: CategoryData) => {
      if (tab === 'header') return c.headerOrder ?? c.displayOrder ?? 0;
      if (tab === 'home') return c.homeOrder ?? c.displayOrder ?? 0;
      return c.displayOrder ?? 0;
    };
    const sorted = [...categories].sort((a, b) => getOrd(b) - getOrd(a));
    setOrderList(sorted);
    setOrderTab(tab);
    setOrderModalOpen(true);
  };

  // Move item in order manager modal within full list
  const moveOrderItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderList.length) return;
    const nextList = [...orderList];
    const temp = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = temp;

    const count = nextList.length;
    const orderProp = orderTab === 'header' ? 'headerOrder' : orderTab === 'home' ? 'homeOrder' : 'displayOrder';
    const updated = nextList.map((item, idx) => ({ ...item, [orderProp]: count - idx }));
    setOrderList(updated);
  };

  // Move item within a specific subset (e.g. Row 1, Row 2, or Home Page)
  const moveSubsetItem = (
    itemToMove: CategoryData,
    direction: 'up' | 'down',
    filterFn: (c: CategoryData) => boolean
  ) => {
    const getOrd = (c: CategoryData) => {
      if (orderTab === 'header') return c.headerOrder ?? c.displayOrder ?? 0;
      if (orderTab === 'home') return c.homeOrder ?? c.displayOrder ?? 0;
      return c.displayOrder ?? 0;
    };
    const orderProp = orderTab === 'header' ? 'headerOrder' : orderTab === 'home' ? 'homeOrder' : 'displayOrder';

    const subset = orderList.filter(filterFn).sort((a, b) => getOrd(b) - getOrd(a));
    const idxInSubset = subset.findIndex((c) => c.id === itemToMove.id);
    if (idxInSubset === -1) return;

    const targetIdxInSubset = direction === 'up' ? idxInSubset - 1 : idxInSubset + 1;
    if (targetIdxInSubset < 0 || targetIdxInSubset >= subset.length) return;

    const targetItem = subset[targetIdxInSubset];
    const orderCurrent = getOrd(itemToMove);
    const orderTarget = getOrd(targetItem);

    let newOrderCurrent = orderTarget;
    let newOrderTarget = orderCurrent;

    if (newOrderCurrent === newOrderTarget) {
      if (direction === 'up') newOrderCurrent = orderTarget + 1;
      else newOrderCurrent = Math.max(0, orderTarget - 1);
    }

    setOrderList((prev) =>
      prev.map((c) => {
        if (c.id === itemToMove.id) return { ...c, [orderProp]: newOrderCurrent };
        if (c.id === targetItem.id) return { ...c, [orderProp]: newOrderTarget };
        return c;
      })
    );
  };

  // Direct order input change in order manager modal
  const handleOrderInputChange = (id: string, newOrder: number) => {
    const validOrder = Math.max(0, newOrder || 0);
    const getOrd = (c: CategoryData) => {
      if (orderTab === 'header') return c.headerOrder ?? c.displayOrder ?? 0;
      if (orderTab === 'home') return c.homeOrder ?? c.displayOrder ?? 0;
      return c.displayOrder ?? 0;
    };
    const orderProp = orderTab === 'header' ? 'headerOrder' : orderTab === 'home' ? 'homeOrder' : 'displayOrder';

    setOrderList((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, [orderProp]: validOrder } : c))
        .sort((a, b) => getOrd(b) - getOrd(a))
    );
  };

  // Save Batch Order from Modal
  const handleSaveAllOrders = async () => {
    setSavingOrder(true);
    try {
      const getOrd = (c: CategoryData) => {
        if (orderTab === 'header') return c.headerOrder ?? c.displayOrder ?? 0;
        if (orderTab === 'home') return c.homeOrder ?? c.displayOrder ?? 0;
        return c.displayOrder ?? 0;
      };
      const orderProp = orderTab === 'header' ? 'headerOrder' : orderTab === 'home' ? 'homeOrder' : 'displayOrder';

      const itemsPayload = orderList.map((item, idx) => ({
        id: item.id,
        displayOrder: Math.max(0, item.displayOrder ?? (orderList.length - idx)),
        headerOrder: typeof item.headerOrder === 'number' ? item.headerOrder : (item.displayOrder ?? (orderList.length - idx)),
        homeOrder: typeof item.homeOrder === 'number' ? item.homeOrder : (item.displayOrder ?? (orderList.length - idx)),
      }));

      const res = await authFetch(getBackendApiUrl('/api/admin/categories/reorder'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsPayload, target: orderTab }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update section orders');

      const sorted = (json.data || []).sort((a: CategoryData, b: CategoryData) => (b.displayOrder ?? 0) - (a.displayOrder ?? 0));
      setCategories(sorted);
      clearApiCache();
      setOrderModalOpen(false);
    } catch (err: any) {
      alert('Error saving section orders: ' + err.message);
    } finally {
      setSavingOrder(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveName = name.trim() || nameGu.trim() || nameHi.trim();
    const effectiveSlug = slug.trim() || slugifyText(effectiveName);

    if (!effectiveName || !effectiveSlug) {
      return alert('Category Name and Slug are required (નામ અને સ્લગ લખવા જરૂરી છે).');
    }

    setSaving(true);

    const payload = {
      name: effectiveName,
      nameGu: nameGu.trim() || effectiveName,
      nameHi: nameHi.trim() || effectiveName,
      slug: effectiveSlug,
      icon,
      color,
      displayOrder: Math.max(0, Number(displayOrder) || 0),
      isActive,
      showInHome,
      showInHeader,
      headerType,
    };

    try {
      const url = selectedCategory ? `/api/admin/categories/${selectedCategory.id}` : '/api/admin/categories';
      const method = selectedCategory ? 'PUT' : 'POST';

      const res = await authFetch(getBackendApiUrl(url), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Failed to save category');

      if (selectedCategory) {
        setCategories(prev => prev.map(c => c.id === selectedCategory.id ? json.data : c).sort((a, b) => (b.displayOrder ?? 0) - (a.displayOrder ?? 0)));
      } else {
        setCategories(prev => [...prev, json.data].sort((a, b) => (b.displayOrder ?? 0) - (a.displayOrder ?? 0)));
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
      const res = await authFetch(getBackendApiUrl(`/api/admin/categories/${cat.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cat,
          isActive: !cat.isActive
        }),
      });
      if (!res.ok) throw new Error('Failed to update category');
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Toggle Show in Home directly
  const handleToggleShowInHome = async (cat: CategoryData) => {
    const nextVal = !(cat.showInHome !== undefined ? cat.showInHome : true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/categories/${cat.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cat,
          showInHome: nextVal
        }),
      });
      if (!res.ok) throw new Error('Failed to update category');
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, showInHome: nextVal } : c));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Toggle Show in Header directly
  const handleToggleShowInHeader = async (cat: CategoryData) => {
    const nextVal = !(cat.showInHeader !== undefined ? cat.showInHeader : true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/categories/${cat.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cat,
          showInHeader: nextVal
        }),
      });
      if (!res.ok) throw new Error('Failed to update category');
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, showInHeader: nextVal } : c));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Switch Header Placement Type (GLOBAL → OTHER → GUJARAT) directly
  const handleSwitchHeaderType = async (cat: CategoryData) => {
    // Cycle: GLOBAL → OTHER → GUJARAT → GLOBAL
    let nextType: string;
    if (!cat.headerType || cat.headerType === 'GLOBAL') nextType = 'OTHER';
    else if (cat.headerType === 'OTHER') nextType = 'GUJARAT';
    else nextType = 'GLOBAL';

    const nextShowInHome = nextType === 'GUJARAT' ? false : cat.showInHome;
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/categories/${cat.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cat,
          headerType: nextType,
          showInHeader: true,
          showInHome: nextShowInHome,
        }),
      });
      if (!res.ok) throw new Error('Failed to update category header placement');
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, headerType: nextType, showInHeader: true, showInHome: nextShowInHome } : c));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Change Category Order (Move Up / Move Down)
  const handleMoveOrder = async (cat: CategoryData, direction: 'up' | 'down') => {
    const index = categories.findIndex((c) => c.id === cat.id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const otherCat = categories[targetIndex];
    const newOrderCurrent = otherCat.displayOrder ?? targetIndex;
    const newOrderOther = cat.displayOrder ?? index;

    try {
      await authFetch(getBackendApiUrl(`/api/admin/categories/${cat.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cat, displayOrder: newOrderCurrent }),
      });
      await authFetch(getBackendApiUrl(`/api/admin/categories/${otherCat.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...otherCat, displayOrder: newOrderOther }),
      });

      setCategories((prev) => {
        const nextList = [...prev];
        nextList[index] = { ...cat, displayOrder: newOrderCurrent };
        nextList[targetIndex] = { ...otherCat, displayOrder: newOrderOther };
        return nextList.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      });
    } catch (err: any) {
      alert('Failed to reorder categories: ' + err.message);
    }
  };

  // Custom Delete Category Modal State
  const [deleteTarget, setDeleteTarget] = useState<CategoryData | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const confirmDeleteCategory = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/categories/${deleteTarget.id}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete category');
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
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
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Categories Management</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Create categories, change position order for Home Page & Header navigation, and manage visibility.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-black transition-all hover:scale-105 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap w-full sm:w-auto"
            title="Visualize Live Section Map across Home Page & Header Nav"
          >
            <Eye className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>Visualize Live Sections Map</span>
          </button>
          <button
            onClick={() => openOrderManager('all')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-750 transition-all shadow-xs cursor-pointer whitespace-nowrap w-full sm:w-auto"
            title="Reorder Home Page and Header Sections"
          >
            <ArrowUpDown className="h-4 w-4 text-red-600 shrink-0" />
            <span>Order Home Sections</span>
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-all hover:bg-red-700 shadow-sm whitespace-nowrap w-full sm:w-auto"
          >
            <FolderPlus className="h-4 w-4 shrink-0" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Cards - Clickable to open section-specific reordering */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => openOrderManager('all')}
          className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between cursor-pointer hover:border-zinc-400 hover:ring-2 hover:ring-zinc-400/20 hover:scale-[1.02] transition-all group"
          title="Click to view & reorder all categories"
        >
          <div>
            <p className="text-xs font-bold text-zinc-500 group-hover:underline">Total Categories</p>
            <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">{categories.length}</h3>
            <span className="text-[10px] font-bold text-zinc-400 mt-1 inline-block">Manage All ➔</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform">
            <FolderOpen className="h-5 w-5" />
          </div>
        </div>

        <div
          onClick={() => openOrderManager('home')}
          className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-950/60 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/20 hover:scale-[1.02] transition-all group"
          title="Click to reorder Home Page section sequence"
        >
          <div>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:underline">Home Page Sections</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {categories.filter(c => (c.showInHome !== undefined ? c.showInHome : true) && c.isActive).length}
            </h3>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 inline-block">⚡ Reorder Home Sections ➔</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 group-hover:scale-110 transition-transform">
            <Home className="h-5 w-5" />
          </div>
        </div>

        <div
          onClick={() => openOrderManager('header')}
          className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-blue-200 dark:border-blue-950/60 shadow-xs flex items-center justify-between cursor-pointer hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 hover:scale-[1.02] transition-all group"
          title="Click to reorder Header Navigation Bars (2 Rows)"
        >
          <div>
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 group-hover:underline">Header Nav Links</p>
            <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {categories.filter(c => (c.showInHeader !== undefined ? c.showInHeader : true) && c.isActive).length}
            </h3>
            <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 mt-1 inline-block">⚡ Reorder 2 Nav Rows ➔</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 group-hover:scale-110 transition-transform">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div
          onClick={() => openOrderManager('all')}
          className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-950/60 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-500 hover:ring-2 hover:ring-amber-500/20 hover:scale-[1.02] transition-all group"
          title="Click to view offline or hidden categories"
        >
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:underline">Hidden / Offline</p>
            <h3 className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {categories.filter(c => !c.isActive || ((c.showInHome === false) && (c.showInHeader === false))).length}
            </h3>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 inline-block">View Hidden ➔</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 group-hover:scale-110 transition-transform">
            <EyeOff className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
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

      {/* Category List Table */}
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
            <table className="w-full text-left text-sm min-w-[850px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-bold text-zinc-450 uppercase tracking-wider dark:border-zinc-800 dark:bg-zinc-950/40">
                  <th className="px-5 py-4 text-center">Order Position</th>
                  <th className="px-5 py-4">Category Name</th>
                  <th className="px-5 py-4">Slug</th>
                  <th className="px-5 py-4">Translations</th>
                  <th className="px-5 py-4 text-center">Header Nav</th>
                  <th className="px-5 py-4 text-center">Home Page</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                {filteredCategories.map((cat, idx) => {
                  const inHeader = cat.showInHeader !== undefined ? cat.showInHeader : true;
                  const inHome = cat.showInHome !== undefined ? cat.showInHome : true;

                  return (
                    <tr key={cat.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-950/20 transition-colors">
                      {/* Order Position & Move Controls */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono font-black text-xs bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-900/40">
                            #{cat.displayOrder ?? idx + 1}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => handleMoveOrder(cat, 'up')}
                              disabled={idx === 0}
                              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded disabled:opacity-30 transition-colors cursor-pointer"
                              title="Move Up in order"
                            >
                              <ArrowUp className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
                            </button>
                            <button
                              onClick={() => handleMoveOrder(cat, 'down')}
                              disabled={idx === filteredCategories.length - 1}
                              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded disabled:opacity-30 transition-colors cursor-pointer"
                              title="Move Down in order"
                            >
                              <ArrowDown className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Name & Badge */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span 
                            className="h-3.5 w-3.5 rounded-full ring-2 ring-white shadow-xs shrink-0" 
                            style={{ backgroundColor: cat.color || '#10b981' }}
                          />
                          <span className="font-extrabold text-zinc-900 dark:text-white">{cat.name}</span>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="px-5 py-4 font-mono text-xs text-zinc-500 select-all">
                        {cat.slug}
                      </td>

                      {/* Regional Translations */}
                      <td className="px-5 py-4 text-xs space-y-0.5 text-zinc-550 dark:text-zinc-400 font-semibold">
                        <div>GU: {cat.nameGu || cat.name}</div>
                        <div>HI: {cat.nameHi || cat.name}</div>
                      </td>

                      {/* Header Visibility & Placement Row Toggle */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handleToggleShowInHeader(cat)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                              inHeader 
                                ? (cat.headerType === 'GUJARAT'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 ring-1 ring-amber-500/20'
                                    : cat.headerType === 'OTHER'
                                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 ring-1 ring-purple-500/20'
                                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 ring-1 ring-blue-500/20')
                                : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                            }`}
                            title={inHeader ? 'Visible in Header Nav (Click to hide)' : 'Hidden from Header Nav (Click to show)'}
                          >
                            <Layers className="h-3 w-3" />
                            <span>
                              {inHeader
                                ? (cat.headerType === 'GUJARAT'
                                    ? 'Row 2: Cities Bar'
                                    : cat.headerType === 'OTHER'
                                      ? '↓ Other Dropdown'
                                      : 'Row 1: Primary Bar')
                                : 'Hidden'}
                            </span>
                          </button>
                          {inHeader && (
                            <button
                              type="button"
                              onClick={() => handleSwitchHeaderType(cat)}
                              className="text-[10px] font-bold text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 underline transition cursor-pointer"
                              title="Cycle: Row 1 (Primary) → Other Dropdown → Row 2 (Cities)"
                            >
                              {cat.headerType === 'GLOBAL' || !cat.headerType
                                ? 'Move to → Other Dropdown'
                                : cat.headerType === 'OTHER'
                                  ? 'Move to → Row 2 (Cities)'
                                  : 'Move to → Row 1 (Primary)'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Home Visibility Toggle */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleToggleShowInHome(cat)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                            inHome 
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 ring-1 ring-purple-500/20' 
                              : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                          }`}
                          title={inHome ? 'Visible on Home Page (Click to hide)' : 'Hidden from Home Page (Click to show)'}
                        >
                          <Home className="h-3 w-3" />
                          <span>{inHome ? 'Visible' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                            cat.isActive 
                              ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300 ring-1 ring-green-500/20' 
                              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                          title={cat.isActive ? 'Active Category' : 'Inactive Category'}
                        >
                          {cat.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          <span>{cat.isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(cat)}
                            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                            title="Edit Category & Visibility Options"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(cat)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── DEDICATED REORDER SECTIONS MODAL ─── */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-4 animate-in fade-in-0 duration-200">
          <div className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 border-zinc-150 dark:border-zinc-850 shrink-0">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5 text-red-600" />
                  Order Categories & Section Layout
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Change section positions. Higher position numbers appear first on website sections and navigation bars.
                </p>
              </div>
              <button 
                onClick={() => setOrderModalOpen(false)}
                className="rounded-xl p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
              <button
                type="button"
                onClick={() => setOrderTab('home')}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  orderTab === 'home'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home Page Sections ({orderList.filter(c => (c.showInHome !== false) && c.isActive).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderTab('header')}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  orderTab === 'header'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Header Navbar (2 Rows) ({orderList.filter(c => (c.showInHeader !== false) && c.isActive).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderTab('all')}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  orderTab === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>All Categories ({orderList.length})</span>
              </button>
            </div>

            {/* List of sections by orderTab mode */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* TAB 1: HOME PAGE SECTIONS ONLY */}
              {orderTab === 'home' && (
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <Home className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Home Page Section Sequence: Order top-to-bottom as sections appear on the Home Page.</span>
                  </div>

                  {orderList
                    .filter(c => (c.showInHome !== false) && c.isActive)
                    .sort((a, b) => (b.homeOrder ?? b.displayOrder ?? 0) - (a.homeOrder ?? a.displayOrder ?? 0))
                    .map((item, idx) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDropSubset(item, c => (c.showInHome !== false) && c.isActive)}
                        onDragEnd={() => { setDraggedItemId(null); setDragOverItemId(null); }}
                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                          draggedItemId === item.id
                            ? 'opacity-40 border-dashed border-emerald-500 bg-emerald-50/20'
                            : dragOverItemId === item.id
                              ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/30 scale-[1.01]'
                              : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 hover:border-emerald-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <GripVertical className="h-4 w-4 text-zinc-400 shrink-0 cursor-grab hover:text-zinc-600 dark:hover:text-zinc-200" />
                          <span className="h-7 px-2.5 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs font-mono">
                            #{idx + 1}
                          </span>
                          <span
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.color || '#10b981' }}
                          />
                          <div className="min-w-0">
                            <div className="font-extrabold text-sm text-zinc-900 dark:text-white truncate">
                              {item.nameGu || item.name} <span className="font-semibold text-zinc-400 text-xs">({item.name})</span>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400">/{item.slug}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            value={item.homeOrder ?? item.displayOrder ?? idx + 1}
                            onChange={(e) => handleOrderInputChange(item.id, Number(e.target.value))}
                            className="w-14 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-center text-xs font-mono font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveSubsetItem(item, 'up', c => (c.showInHome !== false) && c.isActive)}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
                              title="Move UP on Home Page"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSubsetItem(item, 'down', c => (c.showInHome !== false) && c.isActive)}
                              disabled={idx === orderList.filter(c => (c.showInHome !== false) && c.isActive).length - 1}
                              className="p-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
                              title="Move DOWN on Home Page"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* TAB 2: HEADER NAVBAR SEPARATED INTO ROW 1 AND ROW 2 */}
              {orderTab === 'header' && (
                <div className="space-y-6">
                  {/* SECTION A: ROW 1 (PRIMARY NAVBAR) */}
                  <div className="space-y-2.5 p-4 rounded-2xl bg-zinc-900 text-white border border-zinc-800">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <h4 className="font-black text-xs uppercase tracking-wider text-red-400">
                          Row 1: Primary Header Navigation Bar
                        </h4>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-bold">
                        ({orderList.filter(c => (c.showInHeader !== false) && c.isActive && (!c.headerType || c.headerType === 'GLOBAL')).length} items)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {orderList
                        .filter(c => (c.showInHeader !== false) && c.isActive && (!c.headerType || c.headerType === 'GLOBAL'))
                        .sort((a, b) => (b.headerOrder ?? b.displayOrder ?? 0) - (a.headerOrder ?? a.displayOrder ?? 0))
                        .map((item, idx, row1Arr) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragOver={(e) => handleDragOver(e, item.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={() => handleDropSubset(item, c => (c.showInHeader !== false) && c.isActive && (!c.headerType || c.headerType === 'GLOBAL'))}
                            onDragEnd={() => { setDraggedItemId(null); setDragOverItemId(null); }}
                            className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                              draggedItemId === item.id
                                ? 'opacity-40 border-dashed border-red-500 bg-zinc-800/90 text-zinc-100'
                                : dragOverItemId === item.id
                                  ? 'border-red-400 bg-zinc-700 text-zinc-100 scale-[1.01]'
                                  : 'bg-zinc-800/90 border-zinc-700 text-zinc-100 hover:border-red-500/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <GripVertical className="h-4 w-4 text-zinc-500 shrink-0 cursor-grab hover:text-white" />
                              <span className="h-6 px-2 rounded bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                                #{idx + 1}
                              </span>
                              <span
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: item.color || '#10b981' }}
                              />
                              <div className="min-w-0">
                                <span className="font-extrabold text-xs text-white">
                                  {item.nameGu || item.name}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono ml-2">#{item.headerOrder ?? item.displayOrder ?? 0}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                value={item.headerOrder ?? item.displayOrder ?? idx + 1}
                                onChange={(e) => handleOrderInputChange(item.id, Number(e.target.value))}
                                className="w-12 rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-center text-xs font-mono font-bold text-white"
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveSubsetItem(item, 'up', c => (c.showInHeader !== false) && c.isActive && (!c.headerType || c.headerType === 'GLOBAL'))}
                                  disabled={idx === 0}
                                  className="p-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-30 cursor-pointer"
                                  title="Move UP in Primary Row 1"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSubsetItem(item, 'down', c => (c.showInHeader !== false) && c.isActive && (!c.headerType || c.headerType === 'GLOBAL'))}
                                  disabled={idx === row1Arr.length - 1}
                                  className="p-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white disabled:opacity-30 cursor-pointer"
                                  title="Move DOWN in Primary Row 1"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* SECTION B: OTHER DROPDOWN ("અન્ય" Menu) */}
                  <div className="space-y-2.5 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-900 dark:text-purple-200">
                    <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-black text-[10px]">
                          ↓ DROPDOWN
                        </span>
                        <h4 className="font-black text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300">
                          "અન્ય" (Other) Dropdown Menu
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        ({orderList.filter(c => (c.showInHeader !== false) && c.isActive && c.headerType === 'OTHER').length} items)
                      </span>
                    </div>
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold pb-1">
                      These categories appear inside the "અન્ય" (More) dropdown in the top header navigation bar.
                    </p>

                    <div className="space-y-2">
                      {orderList
                        .filter(c => (c.showInHeader !== false) && c.isActive && c.headerType === 'OTHER')
                        .sort((a, b) => (b.headerOrder ?? b.displayOrder ?? 0) - (a.headerOrder ?? a.displayOrder ?? 0))
                        .map((item, idx, otherArr) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragOver={(e) => handleDragOver(e, item.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={() => handleDropSubset(item, c => (c.showInHeader !== false) && c.isActive && c.headerType === 'OTHER')}
                            onDragEnd={() => { setDraggedItemId(null); setDragOverItemId(null); }}
                            className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                              draggedItemId === item.id
                                ? 'opacity-40 border-dashed border-purple-500 bg-white/90 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                                : dragOverItemId === item.id
                                  ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/30 text-zinc-900 dark:text-zinc-100 scale-[1.01]'
                                  : 'bg-white/90 dark:bg-zinc-800 border-purple-300 dark:border-purple-900/40 text-zinc-900 dark:text-zinc-100 hover:border-purple-500'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <GripVertical className="h-4 w-4 text-zinc-400 shrink-0 cursor-grab hover:text-purple-700" />
                              <span className="h-6 px-2 rounded bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                                #{idx + 1}
                              </span>
                              <span
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: item.color || '#a855f7' }}
                              />
                              <div className="min-w-0">
                                <span className="font-extrabold text-xs">
                                  {item.nameGu || item.name}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono ml-2">#{item.headerOrder ?? item.displayOrder ?? 0}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                value={item.headerOrder ?? item.displayOrder ?? idx + 1}
                                onChange={(e) => handleOrderInputChange(item.id, Number(e.target.value))}
                                className="w-12 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1.5 py-0.5 text-center text-xs font-mono font-bold"
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveSubsetItem(item, 'up', c => (c.showInHeader !== false) && c.isActive && c.headerType === 'OTHER')}
                                  disabled={idx === 0}
                                  className="p-1 rounded bg-purple-100 dark:bg-zinc-700 hover:bg-purple-200 dark:hover:bg-zinc-600 text-purple-900 dark:text-white disabled:opacity-30 cursor-pointer"
                                  title="Move UP in Other Dropdown"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSubsetItem(item, 'down', c => (c.showInHeader !== false) && c.isActive && c.headerType === 'OTHER')}
                                  disabled={idx === otherArr.length - 1}
                                  className="p-1 rounded bg-purple-100 dark:bg-zinc-700 hover:bg-purple-200 dark:hover:bg-zinc-600 text-purple-900 dark:text-white disabled:opacity-30 cursor-pointer"
                                  title="Move DOWN in Other Dropdown"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      {orderList.filter(c => (c.showInHeader !== false) && c.isActive && c.headerType === 'OTHER').length === 0 && (
                        <div className="text-center py-4 text-purple-500 dark:text-purple-400 text-xs font-semibold">
                          No categories in the Other dropdown yet. Go to the main table and set a category&apos;s Header Nav to "↓ Other Dropdown".
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION C: ROW 2 (GUJARAT CITIES SUB-HEADER) */}
                  <div className="space-y-2.5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                    <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-black text-[10px]">
                          📍 GUJARAT LOGO
                        </span>
                        <h4 className="font-black text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
                          Row 2: Gujarat Cities Sub-Header Bar
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        ({orderList.filter(c => (c.showInHeader !== false) && c.isActive && c.headerType === 'GUJARAT').length} items)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {orderList
                        .filter(c => (c.showInHeader !== false) && c.isActive && c.headerType === 'GUJARAT')
                        .sort((a, b) => (b.headerOrder ?? b.displayOrder ?? 0) - (a.headerOrder ?? a.displayOrder ?? 0))
                        .map((item, idx, row2Arr) => (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onDragOver={(e) => handleDragOver(e, item.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={() => handleDropSubset(item, c => (c.showInHeader !== false) && c.isActive && c.headerType === 'GUJARAT')}
                            onDragEnd={() => { setDraggedItemId(null); setDragOverItemId(null); }}
                            className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                              draggedItemId === item.id
                                ? 'opacity-40 border-dashed border-amber-500 bg-white/90 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                                : dragOverItemId === item.id
                                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20 text-zinc-900 dark:text-zinc-100 scale-[1.01]'
                                  : 'bg-white/90 dark:bg-zinc-800 border-amber-300 dark:border-amber-900/40 text-zinc-900 dark:text-zinc-100 hover:border-amber-500'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <GripVertical className="h-4 w-4 text-zinc-400 shrink-0 cursor-grab hover:text-amber-700" />
                              <span className="h-6 px-2 rounded bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                                #{idx + 1}
                              </span>
                              <span
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: item.color || '#f59e0b' }}
                              />
                              <div className="min-w-0">
                                <span className="font-extrabold text-xs">
                                  {item.nameGu || item.name}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono ml-2">#{item.headerOrder ?? item.displayOrder ?? 0}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="number"
                                value={item.headerOrder ?? item.displayOrder ?? idx + 1}
                                onChange={(e) => handleOrderInputChange(item.id, Number(e.target.value))}
                                className="w-12 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1.5 py-0.5 text-center text-xs font-mono font-bold"
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveSubsetItem(item, 'up', c => (c.showInHeader !== false) && c.isActive && c.headerType === 'GUJARAT')}
                                  disabled={idx === 0}
                                  className="p-1 rounded bg-amber-100 dark:bg-zinc-700 hover:bg-amber-200 dark:hover:bg-zinc-600 text-amber-900 dark:text-white disabled:opacity-30 cursor-pointer"
                                  title="Move LEFT/UP in Sub-Header Row 2"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSubsetItem(item, 'down', c => (c.showInHeader !== false) && c.isActive && c.headerType === 'GUJARAT')}
                                  disabled={idx === row2Arr.length - 1}
                                  className="p-1 rounded bg-amber-100 dark:bg-zinc-700 hover:bg-amber-200 dark:hover:bg-zinc-600 text-amber-900 dark:text-white disabled:opacity-30 cursor-pointer"
                                  title="Move RIGHT/DOWN in Sub-Header Row 2"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ALL CATEGORIES */}
              {orderTab === 'all' && (
                <div className="space-y-2">
                  {orderList.map((item, idx) => {
                    const inHome = item.showInHome !== undefined ? item.showInHome : true;
                    const inHeader = item.showInHeader !== undefined ? item.showInHeader : true;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 hover:border-red-500/40 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <GripVertical className="h-4 w-4 text-zinc-400 shrink-0 cursor-grab" />
                          <span className="h-7 w-7 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs font-mono">
                            #{idx + 1}
                          </span>
                          <span
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.color || '#10b981' }}
                          />
                          <div className="min-w-0">
                            <div className="font-extrabold text-sm text-zinc-900 dark:text-white truncate">
                              {item.name} <span className="font-semibold text-zinc-500">({item.nameGu || item.name})</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                              {inHome && <span className="text-emerald-600 dark:text-emerald-400 font-bold">• Home Section</span>}
                              {inHeader && (
                                <span className={`font-bold ${
                                  item.headerType === 'GUJARAT'
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : item.headerType === 'OTHER'
                                      ? 'text-purple-600 dark:text-purple-400'
                                      : 'text-blue-600 dark:text-blue-400'
                                }`}>
                                  • {item.headerType === 'GUJARAT'
                                      ? 'Header Row 2 (Cities)'
                                      : item.headerType === 'OTHER'
                                        ? 'Other Dropdown (અન્ય)'
                                        : 'Header Row 1 (Primary)'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            value={item.displayOrder ?? idx + 1}
                            onChange={(e) => handleOrderInputChange(item.id, Number(e.target.value))}
                            className="w-14 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-center text-xs font-mono font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveOrderItem(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
                              title="Move section UP"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveOrderItem(idx, 'down')}
                              disabled={idx === orderList.length - 1}
                              className="p-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 cursor-pointer"
                              title="Move section DOWN"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850 shrink-0">
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAllOrders}
                disabled={savingOrder}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 shadow-sm transition-colors cursor-pointer"
              >
                {savingOrder ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>{savingOrder ? 'Saving Positions...' : 'Save Section Positions'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD/EDIT CATEGORY MODAL ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-4 animate-in fade-in-0 duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-150 dark:border-zinc-850 shrink-0">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-red-600" />
                {selectedCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0 mt-4">
              <div className="space-y-4 overflow-y-auto flex-1 pr-2 pb-4">
                {/* Language switcher tabs */}
                <div className="flex border-b border-zinc-150 dark:border-zinc-800 mb-2 sticky top-0 bg-white dark:bg-zinc-900 z-10 pt-1">
                  {(['en', 'gu', 'hi'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setFormLang(lang)}
                      className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                        formLang === lang 
                          ? 'border-red-600 text-red-600 font-black' 
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
                      placeholder="e.g. Weather"
                      value={name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setName(val);
                        if (!selectedCategory) {
                          setSlug(slugifyText(val));
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
                      placeholder="e.g. વરસાદ / હવામાન"
                      value={nameGu}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNameGu(val);
                        if (!selectedCategory) {
                          setSlug(slugifyText(val));
                        }
                      }}
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
                      placeholder="e.g. मौसम / बारिश"
                      value={nameHi}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNameHi(val);
                        if (!selectedCategory) {
                          setSlug(slugifyText(val));
                        }
                      }}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Slug (URL suffix) <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const activeName = nameGu || name || nameHi;
                        if (activeName) setSlug(slugifyText(activeName));
                      }}
                      className="text-[10px] font-extrabold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Auto-generate URL slug from category name"
                    >
                      <Sparkles className="h-3 w-3" /> Auto-generate Slug
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="varsad"
                    value={slug}
                    onChange={(e) => setSlug(slugifyText(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white font-mono"
                    required
                  />
                </div>

                {/* Display Order */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Display Order Index
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-white font-mono"
                      title="Higher number = visible first, lower number = visible last"
                    />
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                      Defaulted to the <strong className="text-zinc-900 dark:text-white">END of the category list</strong> (lowest position). Higher numbers appear first, lower numbers appear last.
                    </p>
                  </div>
                </div>

                {/* Visibility and Active Toggles */}
                <div className="space-y-2.5 border-t border-zinc-150 dark:border-zinc-800 pt-3">
                  
                  <div className="mb-4 space-y-2">
                    <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                      Header Navigation Bar Row Assignment
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setHeaderType('GLOBAL')}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          headerType === 'GLOBAL'
                            ? 'bg-red-50/80 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/20'
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="headerType" 
                          value="GLOBAL" 
                          checked={headerType === 'GLOBAL'} 
                          onChange={() => setHeaderType('GLOBAL')} 
                          className="mt-0.5 accent-red-600 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-black text-zinc-900 dark:text-white block">
                            First Row: Primary Header Bar
                          </span>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                            Top global navigation (Home, Videos, Gujarat, National, World, Politics, etc.)
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => setHeaderType('GUJARAT')}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          headerType === 'GUJARAT'
                            ? 'bg-red-50/80 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/20'
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="headerType" 
                          value="GUJARAT" 
                          checked={headerType === 'GUJARAT'} 
                          onChange={() => setHeaderType('GUJARAT')} 
                          className="mt-0.5 accent-red-600 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-black text-zinc-900 dark:text-white block">
                            Second Row: Gujarat Cities Bar
                          </span>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">
                            Sub-header regional bar below logo (Ahmedabad, Surat, Vadodara, Rajkot, etc.)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checkbox 1: Show in Navigation Header */}
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="showInHeaderCheck"
                        checked={showInHeader}
                        onChange={(e) => setShowInHeader(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300 accent-blue-600 cursor-pointer"
                      />
                      <label htmlFor="showInHeaderCheck" className="text-sm font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-blue-600" />
                        Show in Navigation Header
                      </label>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pl-7 leading-relaxed">
                      Shows this category link in the site header navigation.
                      {showInHeader ? (
                        <span className="inline-flex items-center gap-1 font-bold ml-1 px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          📍 Where: {headerType === 'GUJARAT' ? 'Row 2 (Gujarat Cities Sub-Header)' : 'Row 1 (Primary Header Bar)'}
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-medium ml-1">(Hidden from site header)</span>
                      )}
                    </p>
                  </div>

                  {/* Checkbox 2: Show as Section on Home Page */}
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="showInHomeCheck"
                        checked={showInHome}
                        onChange={(e) => setShowInHome(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300 accent-purple-600 cursor-pointer"
                      />
                      <label htmlFor="showInHomeCheck" className="text-sm font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer flex items-center gap-1.5">
                        <Home className="h-4 w-4 text-purple-600" />
                        Show as Section on Home Page
                      </label>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pl-7 leading-relaxed">
                      Renders a dedicated news section block for this category on the Home Page.
                      {showInHome ? (
                        <span className="inline-flex items-center gap-1 font-bold ml-1 px-2 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                          📍 Where: Home Page Section Block (Position #{displayOrder})
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-medium ml-1">(Hidden from Home Page section blocks)</span>
                      )}
                    </p>
                  </div>

                  {/* Checkbox 3: Active Category */}
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isActiveCheck"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300 accent-emerald-600 cursor-pointer"
                      />
                      <label htmlFor="isActiveCheck" className="text-sm font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer flex items-center gap-1.5">
                        <Eye className="h-4 w-4 text-emerald-600" />
                        Active Category
                      </label>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pl-7 leading-relaxed">
                      Enables this category across the entire platform.
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 font-bold ml-1 px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          ✓ Status: Active on site
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold ml-1">(Disabled / Hidden from site)</span>
                      )}
                    </p>
                  </div>

                  {/* Realtime Display Summary Box */}
                  <div className="p-3.5 rounded-xl border border-dashed border-red-300 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-xs space-y-1.5">
                    <div className="font-black text-red-700 dark:text-red-400 flex items-center gap-1.5">
                      <span>📍 Category Display Destination Summary:</span>
                    </div>
                    <ul className="text-[11px] text-zinc-700 dark:text-zinc-300 space-y-1 font-medium pl-1">
                      <li className="flex items-center gap-1.5">
                        <span className="text-blue-600">• Header Nav:</span>
                        {showInHeader && isActive ? (
                          <span className="font-bold text-blue-700 dark:text-blue-300">
                            {headerType === 'GUJARAT' ? 'Visible in Row 2 (Gujarat Cities Sub-Header Bar)' : 'Visible in Row 1 (Primary Top Header Bar)'}
                          </span>
                        ) : (
                          <span className="text-zinc-400">Not shown in header</span>
                        )}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-purple-600">• Home Page:</span>
                        {showInHome && isActive ? (
                          <span className="font-bold text-purple-700 dark:text-purple-300">
                            Visible as Home Page Section Block (Order Position #{displayOrder})
                          </span>
                        ) : (
                          <span className="text-zinc-400">Not shown on Home Page</span>
                        )}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850 shrink-0 bg-white dark:bg-zinc-900 mt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:opacity-50 shadow-md shadow-red-600/20 cursor-pointer"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{selectedCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Page Live Category Sections Map Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-6xl max-h-[90vh] rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-50/80 dark:bg-zinc-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/20">
                  <Eye className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    Live Page Sections & Category Layout Map
                  </h2>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Visual map of all active categories in sequential order as they appear on the homepage and header navigation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Filter Pills Bar */}
            <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-2 overflow-x-auto text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl font-black transition-all ${
                    previewFilter === 'all'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  All Categories ({categories.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('home')}
                  className={`px-3.5 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                    previewFilter === 'home'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  <Home className="h-3.5 w-3.5" /> Home Page Sections ({categories.filter(c => (c.showInHome !== false) && c.isActive).length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('header')}
                  className={`px-3.5 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                    previewFilter === 'header'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-blue-700 dark:text-blue-400 hover:bg-blue-500/10'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" /> Header Navigation ({categories.filter(c => (c.showInHeader !== false) && c.isActive).length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('hidden')}
                  className={`px-3.5 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                    previewFilter === 'hidden'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  <EyeOff className="h-3.5 w-3.5" /> Hidden ({categories.filter(c => !c.isActive || ((c.showInHome === false) && (c.showInHeader === false))).length})
                </button>
              </div>

              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition shadow-xs shrink-0"
              >
                <span>Live Website</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Scrollable Map Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-zinc-50/60 dark:bg-zinc-950/60">
              {/* SECTION A: HEADER NAVIGATION BARS MAP */}
              {(previewFilter === 'all' || previewFilter === 'header') && (
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Layers className="h-4 w-4" /> 1. Header Navigation Bar Menu Items Flow (2 Rows)
                    </h3>
                    <span className="text-[11px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                      Appears in site header (First Row & Second Row)
                    </span>
                  </div>

                  {/* Row 1: Primary Global Header Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider">
                        Row 1: Primary Header Navigation Bar
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold">
                        ({categories.filter((c) => (c.showInHeader !== false) && c.isActive && c.headerType !== 'GUJARAT').length} items)
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-zinc-900 dark:bg-zinc-950 text-white border border-zinc-800">
                      <span className="px-3 py-1 rounded-lg bg-red-600 text-white font-extrabold text-xs shadow-xs">
                        🏠 હોમ (Home)
                      </span>
                      {categories
                        .filter((c) => (c.showInHeader !== undefined ? c.showInHeader : true) && c.isActive && c.headerType !== 'GUJARAT')
                        .sort((a, b) => (b.displayOrder ?? 0) - (a.displayOrder ?? 0))
                        .map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-100 font-bold text-xs"
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color || '#10b981' }} />
                            <span>{c.nameGu || c.name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">#{c.displayOrder ?? 0}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Row 2: Gujarat Cities Sub-Header Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        Row 2: Gujarat Cities Sub-Header Bar
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold">
                        ({categories.filter((c) => (c.showInHeader !== false) && c.isActive && c.headerType === 'GUJARAT').length} items)
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-black text-xs">
                        📍 Gujarat Map Icon
                      </span>
                      {categories
                        .filter((c) => (c.showInHeader !== undefined ? c.showInHeader : true) && c.isActive && c.headerType === 'GUJARAT')
                        .sort((a, b) => (b.displayOrder ?? 0) - (a.displayOrder ?? 0))
                        .map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-amber-400/40 bg-white/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-xs"
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color || '#f59e0b' }} />
                            <span>{c.nameGu || c.name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono">#{c.displayOrder ?? 0}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: HOME PAGE SECTIONS SEQUENCE MAP */}
              {(previewFilter === 'all' || previewFilter === 'home' || previewFilter === 'hidden') && (
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <Home className="h-4 w-4" /> 2. Home Page Section Layout Sequence (Order Positions)
                    </h3>
                    <span className="text-[11px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                      Sorted Top-to-Bottom by Order Position
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories
                      .filter((c) => {
                        if (previewFilter === 'home') return (c.showInHome !== false) && c.isActive;
                        if (previewFilter === 'hidden') return !c.isActive || ((c.showInHome === false) && (c.showInHeader === false));
                        return true;
                      })
                      .sort((a, b) => (b.displayOrder ?? 0) - (a.displayOrder ?? 0))
                      .map((cat, idx) => {
                        const inHome = (cat.showInHome !== undefined ? cat.showInHome : true) && cat.isActive;
                        const inHeader = (cat.showInHeader !== undefined ? cat.showInHeader : true) && cat.isActive;

                        return (
                          <div
                            key={cat.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                              inHome
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/40 shadow-xs'
                                : 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: cat.color || '#10b981' }}
                                  />
                                  <span className="font-mono font-black text-xs text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900/40">
                                    #{cat.displayOrder ?? idx + 1}
                                  </span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black ${inHome ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                                  {inHome ? '🟢 HOME LIVE' : '⚠️ HIDDEN FROM HOME'}
                                </span>
                              </div>

                              <div className="mt-2.5">
                                <h4 className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                                  {cat.nameGu || cat.name}
                                </h4>
                                <p className="text-[11px] font-bold text-zinc-400 mt-0.5">
                                  English: {cat.name} • Slug: <span className="font-mono text-zinc-500">/{cat.slug}</span>
                                </p>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inHeader ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                                  {inHeader ? '✓ Nav Bar Active' : '✕ Nav Bar Hidden'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cat.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'}`}>
                                  {cat.isActive ? 'Active' : 'Disabled'}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between">
                              <span className="text-[10px] text-zinc-400 font-bold">
                                {idx === 0 ? '🏆 Top Hero Section' : `Position #${idx + 1} Section`}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPreviewModal(false);
                                  openEdit(cat);
                                }}
                                className="px-3 py-1 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-black hover:scale-105 transition shadow-xs cursor-pointer"
                              >
                                Edit Category
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500">
                Click <strong>"Order Home Sections"</strong> to re-arrange position sequence.
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-black hover:bg-zinc-300 dark:hover:bg-zinc-700 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CUSTOM DELETE CONFIRMATION MODAL ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-md p-4 animate-in fade-in-0 duration-200">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 shadow-inner">
              <Trash2 className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">
                Delete Category?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                Are you sure you want to delete <strong className="text-zinc-900 dark:text-zinc-100 font-extrabold">&quot;{deleteTarget.nameGu || deleteTarget.name}&quot;</strong>? All articles in this category will become uncategorized.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="w-1/2 rounded-xl border border-zinc-200 dark:border-zinc-800 py-2.5 text-sm font-extrabold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                disabled={deleting}
                className="w-1/2 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-black text-white hover:bg-red-700 transition disabled:opacity-50 shadow-md shadow-red-600/20 cursor-pointer"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Delete Category</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


