'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Gift,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Upload,
  Eye,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Calendar,
  User,
  Cake,
  Flame,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { getBackendApiUrl, authFetch } from '@/lib/api';
import TributeCard from '@/components/tributes/TributeCard';
import type { TributeItem } from '@/lib/api';

const BIRTHDAY_TEMPLATES = [
  {
    id: 'golden',
    label: 'Royal Golden (શાહી ગોલ્ડન)',
    desc: 'Luxurious burgundy & glittering gold festive Gujarati celebration',
    previewColor: 'bg-amber-950 border-amber-400',
  },
  {
    id: 'festive',
    label: 'Festive Marigold (ઉત્સવ ગુજરાતી)',
    desc: 'Saffron & orange traditional Gujarati marigold toran style',
    previewColor: 'bg-orange-600 border-yellow-300',
  },
  {
    id: 'celebration',
    label: 'Party Balloons (બર્થડે ઉત્સવ)',
    desc: 'Modern celebratory theme with colorful party balloons & confetti',
    previewColor: 'bg-purple-900 border-pink-400',
  },
  {
    id: 'royal',
    label: 'Imperial Indigo (રોયલ એલિગન્ટ)',
    desc: 'Deep midnight navy & rose-gold VIP greeting card',
    previewColor: 'bg-indigo-950 border-amber-300',
  },
];

const SHRADHANJALI_TEMPLATES = [
  {
    id: 'shanti',
    label: 'Divya Om Shanti (દિવ્ય ઓમ શાંતિ)',
    desc: 'Pure marble white & gold with illuminated deepam and lotus',
    previewColor: 'bg-stone-100 border-amber-400 text-stone-900',
  },
  {
    id: 'smruti',
    label: 'Pavitra Smruti (પવિત્ર સ્મૃતિ / હાર-માળા)',
    desc: 'Traditional floral garland framing portrait with incense glow',
    previewColor: 'bg-stone-200 border-stone-400 text-stone-900',
  },
  {
    id: 'pranam',
    label: 'Bhavpurna Pranam (ભાવપૂર્ણ બેસણું)',
    desc: 'Sandalwood tone with respectful folded hands motif and prayer',
    previewColor: 'bg-neutral-200 border-stone-500 text-stone-900',
  },
  {
    id: 'eternal',
    label: 'Moksh Dham (મોક્ષ ધામ / શાંતિ)',
    desc: 'Dawn light rays and heavenly serene tribute aura',
    previewColor: 'bg-stone-100 border-stone-300 text-stone-900',
  },
];

const QUICK_BIRTHDAY_MESSAGES = [
  'જન્મદિવસની હાર્દિક શુભકામનાઓ! ભગવાન આપને દીર્ઘાયુષ્ય, ઉત્તમ સ્વાસ્થ્ય અને અવિરત ખુશીઓ બક્ષે.',
  'Happy Birthday! પ્રભુ આપના જીવનમાં સદાય સુખ-શાંતિ, સમૃદ્ધિ અને અપાર સફળતાની વર્ષા કરે.',
  'આપના જન્મદિવસે હૃદયપૂર્વકના અભિનંદન! સદાય હસતા રહો અને પ્રગતિના પંથે આગળ વધો.',
];

const QUICK_SHRADHANJALI_MESSAGES = [
  'પરમકૃપાળુ પરમાત્મા દિવંગત પુણ્યાત્માને પોતાના શ્રીચરણોમાં પરમ શાંતિ અર્પે એવી ભાવભરી પ્રાર્થના. ૐ શાંતિ.',
  'આપની પવિત્ર સ્મૃતિ સદાય અમારા હૃદયમાં જીવંત રહેશે. પ્રભુ આપના આત્માને મોક્ષ પ્રદાન કરે. શોકમગ્ન પરિવાર.',
  'દિવંગત આત્માને પ્રભુ ચિર શાંતિ બક્ષે અને પરિવારજનોને આ વજ્રાઘાત સહન કરવાની શક્તિ આપે એવી પ્રાર્થના.',
];

export default function AdminTributesPage() {
  const [tributes, setTributes] = useState<TributeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'BIRTHDAY' | 'SHRADHANJALI'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Custom Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<TributeItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    type: 'BIRTHDAY' | 'SHRADHANJALI';
    name: string;
    photo: string;
    date: string;
    info: string;
    templateId: string;
    isActive: boolean;
    order: number;
  }>({
    type: 'BIRTHDAY',
    name: '',
    photo: '',
    date: '',
    info: '',
    templateId: 'golden',
    isActive: true,
    order: 0,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchTributes = async () => {
    setLoading(true);
    try {
      const res = await authFetch(getBackendApiUrl('/api/admin/tributes'));
      const json = await res.json();
      if (json.success && json.data?.tributes) {
        setTributes(json.data.tributes);
      }
    } catch (err: any) {
      console.error('Failed to load tributes:', err);
      setErrorMessage('Failed to load items. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTributes();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    const today = new Date().toLocaleDateString('gu-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    setFormData({
      type: 'BIRTHDAY',
      name: '',
      photo: '',
      date: today,
      info: QUICK_BIRTHDAY_MESSAGES[0],
      templateId: 'golden',
      isActive: true,
      order: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (item: TributeItem) => {
    setEditingId(item.id);
    setFormData({
      type: item.type,
      name: item.name,
      photo: item.photo || '',
      date: item.date || '',
      info: item.info || '',
      templateId: item.templateId || (item.type === 'BIRTHDAY' ? 'golden' : 'shanti'),
      isActive: item.isActive,
      order: item.order || 0,
    });
    setShowModal(true);
  };

  const handleTypeChange = (newType: 'BIRTHDAY' | 'SHRADHANJALI') => {
    const defaultTemplate = newType === 'BIRTHDAY' ? 'golden' : 'shanti';
    const defaultMsg =
      newType === 'BIRTHDAY' ? QUICK_BIRTHDAY_MESSAGES[0] : QUICK_SHRADHANJALI_MESSAGES[0];
    setFormData((prev) => ({
      ...prev,
      type: newType,
      templateId: defaultTemplate,
      info: prev.info.trim() === '' ? defaultMsg : prev.info,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMessage('');
    try {
      const data = new FormData();
      data.append('file', file);

      const res = await authFetch(getBackendApiUrl('/api/admin/upload'), {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (json.success && (json.data?.url || json.url)) {
        const uploadedUrl = json.data?.url || json.url;
        setFormData((prev) => ({ ...prev, photo: uploadedUrl }));
        setSuccessMessage('Photo uploaded successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(json.message || 'Upload failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('Please enter the person name (નામ લખવું જરૂરી છે)');
      return;
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const url = editingId
        ? getBackendApiUrl(`/api/admin/tributes/${editingId}`)
        : getBackendApiUrl('/api/admin/tributes');

      const method = editingId ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMessage(
          editingId ? 'Card updated successfully!' : 'Card created and published successfully!'
        );
        setShowModal(false);
        fetchTributes();
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        throw new Error(json.message || 'Failed to save');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving tribute');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/tributes/${id}/toggle`), {
        method: 'PUT',
      });
      const json = await res.json();
      if (json.success) {
        setTributes((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isActive: json.data.isActive } : item))
        );
      }
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await authFetch(getBackendApiUrl(`/api/admin/tributes/${deleteTarget.id}`), {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setTributes((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setSuccessMessage(`"${deleteTarget.name}" નું કાર્ડ સફળતાપૂર્વક ડિલીટ કર્યું.`);
        setTimeout(() => setSuccessMessage(''), 4000);
        setDeleteTarget(null);
      } else {
        throw new Error(json.message || 'Delete failed');
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
      setErrorMessage(err.message || 'Failed to delete card.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered List
  const filteredTributes = tributes.filter((item) => {
    const matchesFilter =
      filterType === 'ALL' ||
      (filterType === 'BIRTHDAY' && item.type === 'BIRTHDAY') ||
      (filterType === 'SHRADHANJALI' && item.type === 'SHRADHANJALI');

    const matchesSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.info && item.info.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const totalBirthdays = tributes.filter((t) => t.type === 'BIRTHDAY').length;
  const totalShradhanjalis = tributes.filter((t) => t.type === 'SHRADHANJALI').length;
  const activeCount = tributes.filter((t) => t.isActive).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                Birthday & Shradhanjali (જન્મદિવસ અને શ્રદ્ધાંજલિ)
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Manage ready-made celebratory birthday greetings & heartfelt tributes shown in the homepage carousel
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTributes}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#B3121B] hover:bg-red-700 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Card (નવો સંદેશ ઉમેરો)</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-sm animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs font-bold text-red-800 dark:text-red-300 shadow-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-auto text-xs text-red-600">✕</button>
        </div>
      )}

      {/* ── Stat Badges ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Active in Slider</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{activeCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
            ✓
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              🎂 Birthdays (જન્મદિવસ)
            </p>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">{totalBirthdays}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <Cake className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
              🕊️ Shradhanjali (શ્રદ્ધાંજલિ)
            </p>
            <p className="text-2xl font-black text-stone-900 dark:text-stone-200 mt-1">{totalShradhanjalis}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-stone-500/20 text-stone-700 dark:text-stone-300 flex items-center justify-center">
            <Flame className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              filterType === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            All Cards ({tributes.length})
          </button>
          <button
            onClick={() => setFilterType('BIRTHDAY')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              filterType === 'BIRTHDAY'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-zinc-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            <Cake className="h-3.5 w-3.5" />
            <span>Birthdays ({totalBirthdays})</span>
          </button>
          <button
            onClick={() => setFilterType('SHRADHANJALI')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              filterType === 'SHRADHANJALI'
                ? 'bg-stone-700 text-white shadow-md'
                : 'text-zinc-500 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Shradhanjali ({totalShradhanjalis})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20"
          />
        </div>
      </div>

      {/* ── Cards Grid ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-red-600" />
          <p className="text-xs font-bold">Loading Birthday & Shradhanjali cards...</p>
        </div>
      ) : filteredTributes.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white/40 dark:bg-zinc-900/40 p-8">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
            <Gift className="h-7 w-7" />
          </div>
          <h3 className="text-base font-black text-zinc-800 dark:text-zinc-200">
            No items found (કોઈ કાર્ડ મળ્યું નથી)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            Click &quot;Add New Card&quot; to create your first Birthday greeting or Shradhanjali tribute card for the homepage carousel!
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#B3121B] px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create First Card</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTributes.map((item) => {
            const isBday = item.type === 'BIRTHDAY';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-white dark:bg-zinc-900 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                  item.isActive
                    ? 'border-zinc-200 dark:border-zinc-800'
                    : 'border-zinc-200/50 dark:border-zinc-800/50 opacity-70 bg-zinc-50/50 dark:bg-zinc-950/50'
                }`}
              >
                {/* Live Card Preview Banner */}
                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40">
                  <div className="scale-95 origin-top transition-transform hover:scale-100">
                    <TributeCard tribute={item} minHeight={170} />
                  </div>
                </div>

                {/* Card Meta & Actions */}
                <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          isBday
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                            : 'bg-stone-500/10 text-stone-700 dark:text-stone-300 border-stone-500/30'
                        }`}
                      >
                        {isBday ? '🎂 BIRTHDAY (જન્મદિવસ)' : '🕊️ SHRADHANJALI (શ્રદ્ધાંજલિ)'}
                      </span>

                      <span className="text-[10px] font-semibold text-zinc-400">
                        Template: {item.templateId}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-zinc-900 dark:text-white mt-2 truncate">
                      {item.name}
                    </h3>

                    {item.date && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>{item.date}</span>
                      </p>
                    )}

                    {item.info && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 line-clamp-2 italic">
                        &quot;{item.info}&quot;
                      </p>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    {/* Active Switch */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={() => handleToggleActive(item.id)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500 relative" />
                      <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        {item.isActive ? 'Active (સક્રિય)' : 'Hidden (બંધ)'}
                      </span>
                    </label>

                    {/* Edit & Delete Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                        title="Delete Card"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── CREATE / EDIT MODAL ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                  <Gift className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black text-zinc-900 dark:text-white">
                  {editingId
                    ? 'Edit Card (કાર્ડ એડિટ કરો)'
                    : 'Create Ready Card (નવું કાર્ડ બનાવો)'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Two Columns (Form + Real-time Live Preview) */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Inputs (7 cols) */}
              <form id="tributeForm" onSubmit={handleSave} className="lg:col-span-7 space-y-5">
                {/* 1. Type Selector */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                    Card Type (પ્રકાર પસંદ કરો) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('BIRTHDAY')}
                      className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                        formData.type === 'BIRTHDAY'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 shadow-sm ring-2 ring-amber-500/20'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <Cake className="h-5 w-5 text-amber-500" />
                      <div className="text-left">
                        <div className="text-xs font-black">Birthday (જન્મદિવસ)</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                          Celebration Wishes
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTypeChange('SHRADHANJALI')}
                      className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                        formData.type === 'SHRADHANJALI'
                          ? 'border-stone-500 bg-stone-100 dark:bg-stone-900/60 text-stone-900 dark:text-stone-100 shadow-sm ring-2 ring-stone-500/20'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <Flame className="h-5 w-5 text-stone-600 dark:text-stone-400" />
                      <div className="text-left">
                        <div className="text-xs font-black">Shradhanjali (શ્રદ્ધાંજલિ)</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                          Tribute & Besnu
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Person Name */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Person Name (વ્યક્તિનું નામ) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={
                        formData.type === 'BIRTHDAY'
                          ? 'e.g. શ્રી રાજેશભાઈ પટેલ / ચિ. દર્શિત'
                          : 'e.g. સ્વ. કાંતિલાલ મગનલાલ શાહ'
                      }
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm font-semibold focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      required
                    />
                  </div>
                </div>

                {/* 3. Photo Upload / URL */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Photo (ફોટો અપલોડ કરો અથવા URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.photo}
                      onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                      placeholder="https://... or click Upload"
                      className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-zinc-500" />
                      )}
                      <span>Upload</span>
                    </button>
                  </div>
                </div>

                {/* 4. Date */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Date / Occasion Date (તારીખ)
                  </label>
                  <div className="relative">
                    <Calendar className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      placeholder="e.g. 15 ઓગસ્ટ 2026 / 15-08-2026"
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                </div>

                {/* 5. Info / Message */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Message / Info (શુભેચ્છા / શ્રદ્ધાંજલિ સંદેશ)
                    </label>
                    <span className="text-[10px] text-zinc-400">Quick-fill below</span>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.info}
                    onChange={(e) => setFormData({ ...formData, info: e.target.value })}
                    placeholder="Enter tribute message, wishes, family names, details..."
                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  {/* Quick-fill Message Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(formData.type === 'BIRTHDAY'
                      ? QUICK_BIRTHDAY_MESSAGES
                      : QUICK_SHRADHANJALI_MESSAGES
                    ).map((msg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData({ ...formData, info: msg })}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition cursor-pointer truncate max-w-full text-left"
                      >
                        ⚡ Template #{i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Ready Template Selection */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                    Ready Template (ડિઝાઈન ટેમ્પલેટ પસંદ કરો)
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(formData.type === 'BIRTHDAY' ? BIRTHDAY_TEMPLATES : SHRADHANJALI_TEMPLATES).map(
                      (tmpl) => {
                        const isSelected = formData.templateId === tmpl.id;
                        return (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, templateId: tmpl.id })}
                            className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                              isSelected
                                ? 'border-[#B3121B] bg-red-50/60 dark:bg-red-950/20 shadow ring-2 ring-red-500/20'
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-3 w-3 rounded-full border ${tmpl.previewColor}`}
                              />
                              <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                                {tmpl.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1 font-medium">
                              {tmpl.desc}
                            </p>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* 7. Active Status Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                      Publish to Homepage Carousel
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      When enabled, this card rotates automatically in the homepage ad slider
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>
              </form>

              {/* Right Column: Real-Time Live Preview (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-start border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 pt-6 lg:pt-0 lg:pl-6">
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-red-600" />
                      <span>Real-Time Live Preview</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Live
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                    This is the exact design that will display in the homepage ad carousel sequence!
                  </p>

                  {/* Card Container Preview */}
                  <div className="w-full rounded-2xl p-3 bg-zinc-100/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 shadow-inner">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center mb-1.5">
                      {formData.type === 'BIRTHDAY'
                        ? '🎂 જન્મદિવસની હાર્દિક શુભકામના'
                        : '🕊️ ભાવપૂર્ણ શ્રદ્ધાંજલિ / સ્મૃતિ'}
                    </p>

                    <TributeCard
                      tribute={{
                        id: 'preview',
                        type: formData.type,
                        name: formData.name.trim() || (formData.type === 'BIRTHDAY' ? 'શ્રી રાજેશભાઈ પટેલ' : 'સ્વ. કાંતિલાલ શાહ'),
                        photo: formData.photo,
                        date: formData.date || 'આજની તારીખ',
                        info: formData.info,
                        templateId: formData.templateId,
                        isActive: true,
                        order: 0,
                      }}
                      minHeight={190}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="tributeForm"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#B3121B] hover:bg-red-700 text-xs font-black text-white shadow-md hover:shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>{editingId ? 'Update Card' : 'Save & Publish Card'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── CUSTOM DELETE CONFIRMATION MODAL ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-red-500/30 p-6 shadow-2xl overflow-hidden text-center">
            {/* Top Close Button */}
            <button
              type="button"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Glowing Danger Icon */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 ring-8 ring-red-500/5 shadow-inner">
              <Trash2 className="h-7 w-7 animate-pulse" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">
              Delete Card? (કાર્ડ ડિલીટ કરવું છે?)
            </h3>

            {/* Target Item Chip */}
            <div className="mt-3.5 mx-auto p-3 rounded-2xl bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center gap-3 text-left">
              <div className="h-10 w-10 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 font-bold text-base">
                {deleteTarget.type === 'BIRTHDAY' ? '🎂' : '🕊️'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-red-700 dark:text-red-400">
                  {deleteTarget.type === 'BIRTHDAY' ? 'Birthday Card (જન્મદિવસ)' : 'Shradhanjali Card (શ્રદ્ધાંજલિ)'}
                </p>
                <p className="text-sm font-black text-zinc-900 dark:text-white truncate">
                  {deleteTarget.name}
                </p>
              </div>
            </div>

            {/* Message Body */}
            <p className="mt-4 text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to delete this tribute card? This will permanently remove it from the system and homepage ad carousel.
            </p>
            <p className="mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              આ કાર્ડ કાયમ માટે હટાવી દેવામાં આવશે અને હોમપેજ સ્લાઇડરમાં દેખાશે નહીં.
            </p>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
              >
                Cancel (રદ રાખો)
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-black text-white shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Yes, Delete (હા, ડિલીટ કરો)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

