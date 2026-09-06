'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Newspaper,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  X,
  MapPin,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Search,
  CalendarDays,
  Clock,
  Eye,
  FileText,
  Building,
  Check,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Download,
  FileCode,
} from 'lucide-react';
import { getBackendApiUrl, authFetch } from '@/lib/api';
import { formatEpaperPdfUrl, formatEpaperDownloadUrl } from '@/lib/media';
import {
  EPaperEdition,
  CityItem,
  fetchAdminEPapers,
  fetchEPaperCities,
  createEPaperEdition,
  updateEPaperEdition,
  deleteEPaperEdition,
  createEPaperCity,
  deleteEPaperCity,
  getTodayDateStr,
  getDateOffsetStr,
  clearLegacyLocalStorage,
} from '@/lib/epaper';
import { NewspaperTemplateBuilder } from '@/components/epaper/NewspaperTemplateBuilder';

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function isPdfUrl(url?: string): boolean {
  if (!url || url.startsWith('blob:')) return false;
  const clean = url.toLowerCase().split('?')[0];
  return clean.endsWith('.pdf') || url.startsWith('data:application/pdf');
}

function isImageUrl(url?: string): boolean {
  if (!url || url.startsWith('blob:')) return false;
  if (url.startsWith('data:image/')) return true;
  const clean = url.toLowerCase().split('?')[0];
  return /\.(jpg|jpeg|png|webp|gif|jfif|svg|avif)$/i.test(clean);
}

function formatTo24Hour(timeStr: string): string {
  if (!timeStr) return '06:00';
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return '06:00';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function formatTo12Hour(time24: string): string {
  if (!time24) return '06:00 AM';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return '06:00 AM';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${mStr} ${period}`;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

export default function AdminEPaperPage() {
  const [editions, setEditions] = useState<EPaperEdition[]>([]);
  const [citiesList, setCitiesList] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState(getTodayDateStr());
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [toast, setToast] = useState<Toast | null>(null);

  // Add/Edit Edition Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEdition, setEditingEdition] = useState<EPaperEdition | null>(null);
  const [saving, setSaving] = useState(false);

  // Creation Mode selector: 'PDF' vs 'TEMPLATE'
  const [editionCreationOption, setEditionCreationOption] = useState<'PDF' | 'TEMPLATE'>('TEMPLATE');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderEdition, setBuilderEdition] = useState<EPaperEdition | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [cityGu, setCityGu] = useState('');
  const [date, setDate] = useState(getTodayDateStr());
  const [publishTime, setPublishTime] = useState('06:00 AM');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [pages, setPages] = useState(24);
  const [fileUrl, setFileUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Input Mode selectors: 'link' vs 'file'
  const [pdfInputMode, setPdfInputMode] = useState<'link' | 'file'>('file');
  const [thumbInputMode, setThumbInputMode] = useState<'link' | 'file'>('file');

  // Add New City Modal state
  const [addCityModalOpen, setAddCityModalOpen] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [addingCity, setAddingCity] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteCityTarget, setDeleteCityTarget] = useState<CityItem | null>(null);
  const [deletingCity, setDeletingCity] = useState(false);

  // File upload refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const readerCanvasRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };



  // Load editions and cities from API
  const loadData = async () => {
    setLoading(true);
    clearLegacyLocalStorage();

    const [fetchedEditions, fetchedCities] = await Promise.all([
      fetchAdminEPapers({
        city: selectedCityFilter,
        date: selectedDateFilter,
        status: selectedStatusFilter,
        search,
      }),
      fetchEPaperCities(),
    ]);

    setEditions(fetchedEditions);
    setCitiesList(fetchedCities);

    if (fetchedCities.length > 0 && !city) {
      setCity(fetchedCities[0].city);
      setCityGu(fetchedCities[0].cityGu || fetchedCities[0].city);
      setTitle(`${fetchedCities[0].city.toUpperCase()} CITY`);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedCityFilter, selectedDateFilter, selectedStatusFilter]);

  // Reader Modal state
  const [activeReaderEdition, setActiveReaderEdition] = useState<EPaperEdition | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const openReader = (ed: EPaperEdition) => {
    setActiveReaderEdition(ed);
    setCurrentPage(1);
    setZoomLevel(100);
  };

  const closeReader = () => {
    setActiveReaderEdition(null);
  };

  const handlePageChange = (newPage: number) => {
    if (!activeReaderEdition) return;
    const totalPages = activeReaderEdition.pages || 24;
    const targetPage = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(targetPage);

    if (readerCanvasRef.current) {
      const container = readerCanvasRef.current;
      const totalScrollHeight = container.scrollHeight - container.clientHeight;
      if (totalScrollHeight > 0 && totalPages > 1) {
        const targetScroll = ((targetPage - 1) / (totalPages - 1)) * totalScrollHeight;
        container.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    }
  };

  // Lock background scrolling when any modal is open
  useEffect(() => {
    if (modalOpen || addCityModalOpen || !!deleteId || !!activeReaderEdition) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen, addCityModalOpen, deleteId, activeReaderEdition]);

  const handleCitySelect = (cityName: string) => {
    const found = citiesList.find((c) => c.city === cityName);
    const englishName = found ? found.city : cityName;
    const gujaratiName = found ? (found.cityGu || found.city) : cityName;

    setCity(englishName);
    setCityGu(gujaratiName);
    setTitle(`${englishName.toUpperCase()} CITY`);
  };

  const resetForm = (prefillCity?: string, prefillDate?: string) => {
    const targetCityName = prefillCity || (selectedCityFilter !== 'ALL' ? selectedCityFilter : citiesList[0]?.city || 'Ahmedabad');
    const found = citiesList.find((c) => c.city === targetCityName);
    const englishName = found ? found.city : targetCityName;

    setCity(englishName);
    setCityGu(found ? (found.cityGu || found.city) : targetCityName);
    setTitle(`${englishName.toUpperCase()} CITY`);
    setDate(prefillDate || (selectedDateFilter !== 'ALL' ? selectedDateFilter : getTodayDateStr()));
    setPublishTime('06:00 AM');
    setStatus('PUBLISHED');
    setPages(24);
    setFileUrl('');
    setThumbnailUrl('');
    setIsActive(true);
    setPdfInputMode('file');
    setThumbInputMode('file');
    setEditingEdition(null);
  };

  const openAdd = (prefillCity?: string, prefillDate?: string) => {
    resetForm(prefillCity, prefillDate);
    setEditionCreationOption('TEMPLATE');
    setModalOpen(true);
  };

  const openEdit = (ed: EPaperEdition) => {
    setEditingEdition(ed);
    setTitle(ed.title || `${ed.city.toUpperCase()} EDITION`);
    setCity(ed.city);
    setCityGu(ed.cityGu || ed.city);
    setDate(ed.date);
    setPublishTime(ed.publishTime || '06:00 AM');
    setStatus(ed.status || 'PUBLISHED');
    setPages(ed.pages || 4);
    setFileUrl(ed.fileUrl || '');
    setThumbnailUrl(ed.thumbnailUrl || '');
    setIsActive(ed.isActive);

    if (ed.editionType === 'TEMPLATE' || ed.templateData) {
      setBuilderEdition(ed);
      setBuilderOpen(true);
      return;
    }

    if (ed.fileUrl && ed.fileUrl.startsWith('http') && !ed.fileUrl.includes('blob:')) {
      setPdfInputMode('link');
    } else {
      setPdfInputMode('file');
    }

    if (ed.thumbnailUrl && ed.thumbnailUrl.startsWith('http') && !ed.thumbnailUrl.includes('blob:')) {
      setThumbInputMode('link');
    } else {
      setThumbInputMode('file');
    }

    setEditionCreationOption('PDF');
    setModalOpen(true);
  };

  const handleCreateNewCity = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputCity = newCityName.trim();
    if (!inputCity) {
      showToast('error', 'Please enter City Name');
      return;
    }

    const targetLower = inputCity.toLowerCase();
    const existingCity = citiesList.find(
      (c) =>
        (c.city || '').trim().toLowerCase() === targetLower ||
        (c.cityGu || '').trim().toLowerCase() === targetLower ||
        (c.cityHi || '').trim().toLowerCase() === targetLower
    );

    // If city already exists in active list, select it and close modal smoothly
    if (existingCity) {
      setCity(existingCity.city);
      setCityGu(existingCity.cityGu || existingCity.city);
      setTitle(`${(existingCity.cityGu || existingCity.city).toUpperCase()} CITY`);
      setNewCityName('');
      setAddCityModalOpen(false);
      showToast('success', `City "${existingCity.cityGu || existingCity.city}" selected!`);
      return;
    }

    setAddingCity(true);
    try {
      const created = await createEPaperCity(inputCity);
      if (created) {
        const updatedCities = await fetchEPaperCities();
        setCitiesList(updatedCities);
        showToast('success', `City "${created.cityGu || created.city}" added successfully!`);

        setCity(created.city);
        setCityGu(created.cityGu || created.city);
        setTitle(`${(created.cityGu || created.city).toUpperCase()} CITY`);
        setNewCityName('');
        setAddCityModalOpen(false);
      } else {
        // Fallback local addition if API responds without data
        const fallbackCity: CityItem = {
          id: inputCity.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          city: inputCity,
          cityGu: inputCity,
        };
        setCitiesList((prev) => [...prev, fallbackCity]);
        setCity(fallbackCity.city);
        setCityGu(fallbackCity.cityGu || fallbackCity.city);
        setTitle(`${fallbackCity.city.toUpperCase()} CITY`);
        setNewCityName('');
        setAddCityModalOpen(false);
        showToast('success', `City "${inputCity}" added!`);
      }
    } catch {
      showToast('error', 'Failed to add city. Please try again.');
    } finally {
      setAddingCity(false);
    }
  };

  const openDeleteCityModal = (c: CityItem) => {
    setDeleteCityTarget(c);
  };

  const confirmDeleteCity = async () => {
    if (!deleteCityTarget) return;
    const c = deleteCityTarget;
    const cityName = c.cityGu || c.city;
    setDeletingCity(true);

    // Optimistic UI update
    setCitiesList((prev) => prev.filter((item) => item.id !== c.id && item.city !== c.city));
    showToast('success', `City "${cityName}" deleted successfully.`);

    await deleteEPaperCity(c.id || c.city);
    const updated = await fetchEPaperCities();
    setCitiesList(updated);
    setDeletingCity(false);
    setDeleteCityTarget(null);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Instant local Data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileUrl(String(event.target.result));
      }
    };
    reader.readAsDataURL(file);

    // 2. Extract PDF page count dynamically from client-side binary stream
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const readerCount = new FileReader();
      readerCount.onload = (evt) => {
        try {
          const text = String(evt.target?.result || '');
          const matches = text.match(/\/Count\s+(\d+)/g);
          if (matches && matches.length > 0) {
            const counts = matches
              .map((m) => parseInt(m.replace(/\/Count\s+/, ''), 10))
              .filter((n) => !isNaN(n) && n > 0 && n < 1000);
            if (counts.length > 0) {
              const detected = Math.max(...counts);
              if (detected > 0) {
                setPages(detected);
                showToast('success', `PDF File "${file.name}" (${detected} Pages) selected!`);
                return;
              }
            }
          }
        } catch {}
      };
      readerCount.readAsBinaryString(file);
    } else {
      showToast('success', `PDF File "${file.name}" selected!`);
    }

    // 3. Upload to server via API & update server page count
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    authFetch(getBackendApiUrl('/api/admin/upload'), {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((json) => {
        const remoteUrl = json?.data?.url || json?.url;
        const pageCount = json?.data?.pageCount || json?.pageCount;
        if (remoteUrl) {
          setFileUrl(remoteUrl);
          if (pageCount && pageCount > 0) {
            setPages(pageCount);
          }
          showToast('success', `PDF File uploaded successfully! (${pageCount || pages} Pages)`);
        }
      })
      .catch((err) => {
        console.warn('Background upload note:', err);
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const handleUploadThumb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Permanent Data URL for instant local display
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setThumbnailUrl(String(event.target.result));
      }
    };
    reader.readAsDataURL(file);

    showToast('success', `Thumbnail Image "${file.name}" selected!`);

    // 2. Upload to Cloudinary server via API
    setUploadingThumb(true);
    const formData = new FormData();
    formData.append('file', file);
    authFetch(getBackendApiUrl('/api/admin/upload'), {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((json) => {
        const remoteUrl = json?.data?.url || json?.url;
        if (remoteUrl) {
          setThumbnailUrl(remoteUrl);
          showToast('success', `Thumbnail uploaded to server!`);
        }
      })
      .catch((err) => {
        console.warn('Background upload note:', err);
      })
      .finally(() => {
        setUploadingThumb(false);
      });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !date) {
      showToast('error', 'City name and date are required.');
      return;
    }

    if (uploading || uploadingThumb) {
      showToast('error', 'Please wait for file upload to finish before saving.');
      return;
    }

    const currentTitle = title.trim() || `${city.toUpperCase()} EDITION`;

    // Check if an edition for this city, date & title already exists
    const existingEdition = editions.find(
      (ed) =>
        ed.id !== editingEdition?.id &&
        ed.date === date &&
        ed.city.toLowerCase() === city.trim().toLowerCase() &&
        (ed.title || '').trim().toLowerCase() === currentTitle.toLowerCase()
    );

    const targetEditionId = editingEdition?.id || existingEdition?.id;

    setSaving(true);

    const payload = {
      title: currentTitle,
      city: city.trim(),
      cityGu: cityGu.trim() || city.trim(),
      date,
      pages,
      fileUrl,
      thumbnailUrl,
      status,
      publishTime,
      isActive,
    };

    if (targetEditionId) {
      const result = await updateEPaperEdition(targetEditionId, payload);
      if (result?.edition) {
        showToast('success', `"${payload.title}" (${date}) edition updated successfully.`);
        loadData();
        setSaving(false);
        setModalOpen(false);
        resetForm();
      } else {
        showToast('error', result?.error || 'Failed to update edition.');
        setSaving(false);
      }
    } else {
      const result = await createEPaperEdition(payload);
      if (result?.edition) {
        showToast('success', `"${payload.title}" edition published successfully.`);
        loadData();
        setSaving(false);
        setModalOpen(false);
        resetForm();
      } else {
        showToast('error', result?.error || 'Failed to create edition.');
        setSaving(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const success = await deleteEPaperEdition(deleteId);
    if (success) {
      showToast('success', 'Edition deleted successfully.');
      loadData();
    } else {
      showToast('error', 'Failed to delete edition.');
    }
    setDeleteId(null);
    setDeleting(false);
  };

  const handleToggleActive = async (ed: EPaperEdition) => {
    const res = await updateEPaperEdition(ed.id, { isActive: !ed.isActive });
    if (res) {
      showToast('success', `Edition status updated.`);
      loadData();
    }
  };

  const handleBuilderSaveDraft = async (templateData: any, pageImages: string[]) => {
    const finalTitle = title.trim() || `${city.toUpperCase()} EDITION`;
    const primaryImage = pageImages[0] || thumbnailUrl || fileUrl || '';
    const payload: Partial<EPaperEdition> = {
      title: finalTitle,
      city: city.trim(),
      cityGu: cityGu.trim() || city.trim(),
      date,
      pages: 4,
      fileUrl: primaryImage,
      thumbnailUrl: primaryImage,
      status: 'DRAFT',
      publishTime,
      isActive: true,
      editionType: 'TEMPLATE',
      templateData,
    };

    const targetId = builderEdition?.id || editingEdition?.id;
    if (targetId) {
      const res = await updateEPaperEdition(targetId, payload);
      if (res?.edition) {
        showToast('success', 'વર્તમાનપત્ર ડ્રાફ્ટ સેવ થઈ ગયું!');
        loadData();
      } else {
        showToast('error', res?.error || 'ડ્રાફ્ટ સેવ કરવામાં ક્ષતિ.');
      }
    } else {
      const res = await createEPaperEdition(payload);
      if (res?.edition) {
        setBuilderEdition(res.edition);
        showToast('success', 'નવું વર્તમાનપત્ર ડ્રાફ્ટ બનાવ્યું!');
        loadData();
      } else {
        showToast('error', res?.error || 'ડ્રાફ્ટ બનાવવામાં ક્ષતિ.');
      }
    }
  };

  const handleBuilderPublish = async (templateData: any, pageImages: string[]) => {
    const finalTitle = title.trim() || `${city.toUpperCase()} EDITION`;
    const primaryImage = pageImages[0] || thumbnailUrl || fileUrl || '';
    const payload: Partial<EPaperEdition> = {
      title: finalTitle,
      city: city.trim(),
      cityGu: cityGu.trim() || city.trim(),
      date,
      pages: 4,
      fileUrl: primaryImage,
      thumbnailUrl: primaryImage,
      status: 'PUBLISHED',
      publishTime,
      isActive: true,
      editionType: 'TEMPLATE',
      templateData,
    };

    const targetId = builderEdition?.id || editingEdition?.id;
    if (targetId) {
      const res = await updateEPaperEdition(targetId, payload);
      if (res?.edition) {
        showToast('success', `"${finalTitle}" અખબાર સફળતાપૂર્વક પબ્લિશ થયું!`);
        setBuilderOpen(false);
        loadData();
      } else {
        showToast('error', res?.error || 'પબ્લિશ કરવામાં ક્ષતિ.');
      }
    } else {
      const res = await createEPaperEdition(payload);
      if (res?.edition) {
        showToast('success', `"${finalTitle}" અખબાર સફળતાપૂર્વક પબ્લિશ થયું!`);
        setBuilderOpen(false);
        loadData();
      } else {
        showToast('error', res?.error || 'પબ્લિશ કરવામાં ક્ષતિ.');
      }
    }
  };

  if (builderOpen) {
    let parsedData = null;
    if (builderEdition?.templateData) {
      try {
        parsedData = typeof builderEdition.templateData === 'string' ? JSON.parse(builderEdition.templateData) : builderEdition.templateData;
      } catch (_) {}
    }
    return (
      <NewspaperTemplateBuilder
        initialData={parsedData}
        city={city}
        cityGu={cityGu}
        date={date}
        onSaveDraft={handleBuilderSaveDraft}
        onPublish={handleBuilderPublish}
        onBackToDashboard={() => {
          setBuilderOpen(false);
          loadData();
        }}
      />
    );
  }

  const todayStr = getTodayDateStr();
  const yesterdayStr = getDateOffsetStr(-1);
  const activeCityInfo = citiesList.find((c) => c.city === selectedCityFilter);

  return (
    <div className="p-3.5 sm:p-6 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-bold transition-all animate-in slide-in-from-right ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="bg-[#B3121B]/10 text-[#B3121B] text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              Multi-Edition Newspaper Manager
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-2 mt-1 flex-wrap">
            <Newspaper className="h-6 sm:h-8 w-6 sm:w-8 text-[#B3121B] shrink-0" />
            <span>E-Paper Management</span>
            <span className="text-sm sm:text-base font-semibold text-zinc-500 dark:text-zinc-400">(ઈ-પેપર મેનેજમેન્ટ)</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
            અમદાવાદ અને તમામ શહેરો માટે વિવિધ આવૃત્તિઓ ઉમેરો અને મેનેજ કરો
          </p>
        </div>

        {/* Top Header Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setAddCityModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-zinc-800 text-white px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm hover:bg-zinc-900 transition shadow-sm cursor-pointer whitespace-nowrap w-full sm:w-auto"
          >
            <Building className="h-4 w-4 text-amber-400 shrink-0" />
            <span>નવું શહેર ઉમેરો (Add City)</span>
          </button>

          <button
            onClick={() => openAdd(selectedCityFilter !== 'ALL' ? selectedCityFilter : undefined, selectedDateFilter !== 'ALL' ? selectedDateFilter : undefined)}
            className="flex items-center justify-center gap-2 bg-[#B3121B] text-white px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm hover:bg-[#8e0e15] transition shadow-md cursor-pointer whitespace-nowrap w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span>
              {selectedCityFilter !== 'ALL'
                ? `Add Paper for ${activeCityInfo?.cityGu || selectedCityFilter}`
                : 'નવી આવૃત્તિ (Add Edition)'}
            </span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Editions', value: editions.length, icon: Newspaper, color: 'text-[#B3121B]', bg: 'bg-[#B3121B]/10' },
          { label: 'Published', value: editions.filter((e) => e.status === 'PUBLISHED').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Drafts', value: editions.filter((e) => e.status === 'DRAFT').length, icon: FileCode, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Cities', value: citiesList.length, icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 shadow-sm">
            <div className={`h-9 sm:h-10 w-9 sm:w-10 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
              <stat.icon className={`h-4 sm:h-5 w-4 sm:w-5 ${stat.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white leading-none">{stat.value}</p>
              <p className="text-xs font-bold text-zinc-500 mt-1 truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Date, Status & City Filter Controls */}
      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3.5 sm:p-5 space-y-4">
        <div className="flex flex-col gap-3.5 sm:gap-4">
          
          {/* Top Filter Row: Date Selector & Status Filter */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 sm:gap-4">
            
            {/* Date Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 shrink-0">
                <CalendarDays className="h-4 w-4 text-[#B3121B]" />
                Select Date:
              </span>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="date"
                  value={selectedDateFilter === 'ALL' ? '' : selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value || 'ALL')}
                  className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B3121B]"
                />
                <button
                  onClick={() => setSelectedDateFilter(todayStr)}
                  className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-2 rounded-xl text-xs font-black transition ${selectedDateFilter === todayStr ? 'bg-[#B3121B] text-white' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-[#B3121B]'}`}
                >
                  Today ({todayStr})
                </button>
                <button
                  onClick={() => setSelectedDateFilter('ALL')}
                  className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-2 rounded-xl text-xs font-black transition ${selectedDateFilter === 'ALL' ? 'bg-[#B3121B] text-white' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-[#B3121B]'}`}
                >
                  All Dates
                </button>
              </div>
            </div>

            {/* Status Filter & Search Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <span className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 shrink-0">Status:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedStatusFilter('ALL')}
                    className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-2 rounded-xl text-xs font-black transition ${selectedStatusFilter === 'ALL' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-white dark:bg-zinc-900 text-zinc-700 border border-zinc-200 dark:border-zinc-800'}`}
                  >
                    All Status
                  </button>
                  <button
                    onClick={() => setSelectedStatusFilter('PUBLISHED')}
                    className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-2 rounded-xl text-xs font-black transition ${selectedStatusFilter === 'PUBLISHED' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 text-emerald-600 border border-emerald-200'}`}
                  >
                    Published
                  </button>
                  <button
                    onClick={() => setSelectedStatusFilter('DRAFT')}
                    className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-2 rounded-xl text-xs font-black transition ${selectedStatusFilter === 'DRAFT' ? 'bg-amber-600 text-white' : 'bg-white dark:bg-zinc-900 text-amber-600 border border-amber-200'}`}
                  >
                    Drafts
                  </button>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search edition title or date..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#B3121B]"
                />
              </div>
            </div>

          </div>
        </div>

        {/* City Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 shrink-0 flex items-center gap-1.5 mr-1">
            <MapPin className="h-4 w-4 text-[#B3121B]" />
            City Filter:
          </span>
          <button
            onClick={() => setSelectedCityFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition ${selectedCityFilter === 'ALL' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}
          >
            All Cities
          </button>

          {citiesList.map((c) => {
            const isSelected = selectedCityFilter === c.city;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCityFilter(c.city)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black shrink-0 transition flex items-center gap-1.5 ${isSelected ? 'bg-[#B3121B] text-white' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-[#B3121B]'}`}
              >
                <span>{c.cityGu || c.city}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editions Grid Layout matching Sandesh / Reference Style */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-[#B3121B] animate-spin" />
        </div>
      ) : editions.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-8 shadow-sm">
          <Newspaper className="h-16 w-16 mx-auto mb-4 opacity-20 text-[#B3121B]" />
          <h3 className="text-xl font-black text-zinc-800 dark:text-zinc-200">
            કોઈ ઈ-પેપર મળ્યું નથી (No Newspaper Edition Found)
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            No edition found for <strong className="text-zinc-800 dark:text-zinc-200">{selectedCityFilter}</strong> on date <strong className="text-zinc-800 dark:text-zinc-200">{selectedDateFilter}</strong>.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button
              onClick={() => openAdd(selectedCityFilter !== 'ALL' ? selectedCityFilter : undefined, selectedDateFilter !== 'ALL' ? selectedDateFilter : undefined)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B3121B] text-white text-xs font-black hover:bg-[#8e0e15] transition shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Newspaper Edition for {selectedCityFilter !== 'ALL' ? selectedCityFilter : 'Selected City'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {editions.map((edition) => (
            <div
              key={edition.id}
              className={`group flex flex-col justify-between overflow-hidden rounded-xl border bg-slate-100 dark:bg-zinc-900 shadow-sm transition-all hover:shadow-xl ${edition.isActive ? 'border-slate-300 dark:border-zinc-800' : 'border-slate-200 opacity-60'}`}
            >
              {/* Vertical Front Page Image Container */}
              <div
                onClick={() => openReader(edition)}
                className="relative aspect-[3/4] w-full overflow-hidden bg-slate-200 dark:bg-zinc-800 cursor-pointer"
              >
                {isImageUrl(edition.thumbnailUrl) ? (
                  <img
                    src={edition.thumbnailUrl}
                    alt={edition.title || edition.city}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : isImageUrl(edition.fileUrl) ? (
                  <img
                    src={edition.fileUrl}
                    alt={edition.title || edition.city}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : edition.fileUrl && edition.fileUrl.includes('res.cloudinary.com') ? (
                  <img
                    src={edition.fileUrl.replace(/\.pdf$/i, '.jpg')}
                    alt={edition.title || edition.city}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : edition.fileUrl && (isPdfUrl(edition.fileUrl) || edition.fileUrl.includes('/uploads/')) ? (
                  <iframe
                    src={formatEpaperPdfUrl(edition.fileUrl, 1)}
                    className="h-full w-full object-cover pointer-events-none"
                    title={edition.title || edition.city}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-between p-6 text-center bg-gradient-to-b from-slate-50 to-slate-200 dark:from-zinc-900 dark:to-zinc-950">
                    <div className="w-full flex justify-between items-center text-[10px] font-black text-slate-400 border-b border-slate-300 dark:border-zinc-800 pb-2">
                      <span>GUJARAT POST</span>
                      <span>{edition.date}</span>
                    </div>
                    <div className="my-auto py-4 space-y-2">
                      <Newspaper className="h-16 w-16 mx-auto text-[#B3121B] opacity-80" />
                      <h3 className="text-base font-black text-slate-900 dark:text-white uppercase leading-tight px-2">
                        {edition.title || `${edition.city} EDITION`}
                      </h3>
                      <span className="inline-block bg-[#B3121B]/10 text-[#B3121B] text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-[#B3121B]/20">
                        {edition.pages || 24} PAGES E-PAPER
                      </span>
                    </div>
                    <div className="w-full pt-2 border-t border-slate-300 dark:border-zinc-800 text-[10px] font-bold text-slate-500 flex items-center justify-between">
                      <span>{edition.cityGu || edition.city}</span>
                      <span>{edition.publishTime || '06:00 AM'}</span>
                    </div>
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                  <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md shadow ${edition.status === 'PUBLISHED' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                    {edition.status || 'PUBLISHED'}
                  </span>
                </div>

                {/* Red Banner at Bottom matching Sandesh style */}
                <div className="absolute inset-x-0 bottom-0 bg-[#B3121B] px-3 py-2 text-white flex items-center justify-between shadow-md">
                  <h4 className="text-xs font-black tracking-wide uppercase truncate">
                    {edition.title || `${edition.city.toUpperCase()} EDITION`}
                  </h4>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-3 bg-card border-t border-border flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-muted-foreground">{edition.date}</span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openReader(edition)}
                    className="p-1.5 rounded-lg bg-muted hover:bg-muted/70 text-foreground font-bold transition cursor-pointer"
                    title="View E-Paper Reader"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openEdit(edition)}
                    className="p-1.5 rounded-lg bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 font-bold transition cursor-pointer"
                    title="Edit Edition"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(edition)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition cursor-pointer ${
                      edition.isActive
                        ? 'bg-emerald-600/15 text-emerald-500 hover:bg-emerald-600/25'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    {edition.isActive ? 'Active' : 'Off'}
                  </button>
                  <button
                    onClick={() => setDeleteId(edition.id)}
                    className="p-1.5 rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600/20 transition cursor-pointer"
                    title="Delete Edition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── ADD NEW CITY MODAL ─── */}
      {addCityModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => !addingCity && setAddCityModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6 cursor-default animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Building className="h-5 w-5 text-amber-500" />
                + નવું શહેર ઉમેરો (Add New City)
              </h2>
              <button
                onClick={() => !addingCity && setAddCityModalOpen(false)}
                disabled={addingCity}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 cursor-pointer disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCity} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  City Name (શહેરનું નામ) *
                </label>
                <input
                  type="text"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="e.g. Bhavnagar / ભાવનગર"
                  required
                  className={`w-full px-4 py-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-950/30 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 ${
                    citiesList.some(
                      (c) =>
                        (c.city || '').trim().toLowerCase() === newCityName.trim().toLowerCase() ||
                        (c.cityGu || '').trim().toLowerCase() === newCityName.trim().toLowerCase() ||
                        (c.cityHi || '').trim().toLowerCase() === newCityName.trim().toLowerCase()
                    ) && newCityName.trim().length > 0
                      ? 'border-red-500 focus:ring-red-500/30'
                      : 'border-zinc-200 dark:border-zinc-800 focus:ring-[#B3121B]/30'
                  }`}
                />

                {citiesList.some(
                  (c) =>
                    (c.city || '').trim().toLowerCase() === newCityName.trim().toLowerCase() ||
                    (c.cityGu || '').trim().toLowerCase() === newCityName.trim().toLowerCase() ||
                    (c.cityHi || '').trim().toLowerCase() === newCityName.trim().toLowerCase()
                ) && newCityName.trim().length > 0 && (
                  <p className="text-[11px] font-black text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
                    આ શહેર પહેલેથી જ યાદીમાં ઉમેરાયેલ છે! (This city already exists in active cities list)
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-wider mb-2">
                  Existing Active Cities:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  {citiesList.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 px-2.5 py-1 rounded-lg border border-zinc-200 text-xs font-bold shadow-sm"
                    >
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span>{c.cityGu || c.city}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteCityModal(c);
                        }}
                        title={`Delete ${c.cityGu || c.city}`}
                        className="ml-1 text-zinc-400 hover:text-red-600 transition p-0.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAddCityModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-black text-zinc-500 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCity}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-black hover:bg-amber-700 disabled:opacity-60 transition cursor-pointer shadow-md"
                >
                  {addingCity && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Add City
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT EDITION MODAL WITH SUB-EDITION TITLE PRESETS ─── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => { setModalOpen(false); resetForm(); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-y-auto max-h-[92vh] cursor-default animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-[#B3121B]" />
                {editingEdition ? 'Edit E-Paper Edition' : '+ નવી આવૃત્તિ ઉમેરો (Add Edition)'}
              </h2>
              <button
                onClick={() => { setModalOpen(false); resetForm(); }}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-500 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="px-6 py-5 space-y-5">

              {/* Dual Creation Mode Options */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-zinc-950/60 dark:to-zinc-900/60 rounded-2xl border border-blue-200/80 dark:border-zinc-800 space-y-2.5">
                <label className="block text-xs font-black text-blue-950 dark:text-blue-200 uppercase tracking-wider">
                  આવૃત્તિ બનાવવાની પદ્ધતિ (Select Edition Mode) *
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditionCreationOption('TEMPLATE')}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      editionCreationOption === 'TEMPLATE'
                        ? 'bg-white dark:bg-zinc-900 border-[#B3121B] shadow-md ring-2 ring-[#B3121B]/20'
                        : 'bg-white/60 dark:bg-zinc-900/50 border-zinc-200 hover:border-[#B3121B]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-zinc-900 dark:text-white">
                      <Newspaper className="h-4 w-4 text-[#B3121B] shrink-0" />
                      <span>ઓપ્શન ૨ — Dynamic Template</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-snug">
                      ૪-પૃષ્ઠ ટેમ્પલેટ બિલ્ડરમાં સમાચાર સંપાદિત કરો.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditionCreationOption('PDF')}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                      editionCreationOption === 'PDF'
                        ? 'bg-white dark:bg-zinc-900 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white/60 dark:bg-zinc-900/50 border-zinc-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black text-zinc-900 dark:text-white">
                      <Upload className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>ઓપ્શન ૧ — PDF Upload</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-snug">
                      તૈયાર PDF ફાઇલ અથવા લિંક અપલોડ કરો.
                    </p>
                  </button>
                </div>

                {editionCreationOption === 'TEMPLATE' && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      setBuilderEdition(editingEdition);
                      setBuilderOpen(true);
                    }}
                    className="w-full mt-2 py-2.5 px-4 bg-[#B3121B] hover:bg-[#8e0e15] text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Newspaper className="h-4 w-4" />
                    <span>૪-પૃષ્ઠ ટેમ્પલેટ બિલ્ડર ખોલો (Open 4-Page Newspaper Builder)</span>
                  </button>
                )}
              </div>

              {/* Status Selector: Draft vs Published */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <label className="block text-xs font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Publication Status *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('PUBLISHED')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${status === 'PUBLISHED' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-zinc-600 border border-zinc-200'}`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    PUBLISHED (પબ્લિશ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('DRAFT')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${status === 'DRAFT' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-zinc-600 border border-zinc-200'}`}
                  >
                    <FileCode className="h-4 w-4" />
                    DRAFT (ડ્રાફ્ટ)
                  </button>
                </div>
              </div>

              {/* City Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider">
                    1. Select City (શહેર પસંદ કરો) *
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 max-h-32 overflow-y-auto pr-1">
                  {citiesList.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleCitySelect(c.city)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-black transition border text-center ${city === c.city ? 'bg-[#B3121B] text-white border-[#B3121B]' : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-[#B3121B]'}`}
                    >
                      <div>{c.cityGu || c.city}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Newspaper Edition Name / Title */}
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-1.5">
                  2. Newspaper Edition Name / Title (આવૃત્તિનું નામ) *
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AHMEDABAD CITY, AHMEDABAD EAST, CITY LIFE, etc."
                  required
                  className={`w-full px-4 py-2.5 rounded-xl border bg-zinc-50 dark:bg-zinc-950/30 text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 ${
                    editions.some(
                      (ed) =>
                        ed.id !== editingEdition?.id &&
                        ed.date === date &&
                        ed.city.toLowerCase() === city.trim().toLowerCase() &&
                        (ed.title || '').trim().toLowerCase() === (title.trim() || `${city.toUpperCase()} EDITION`).toLowerCase()
                    )
                      ? 'border-red-500 focus:ring-red-500/30'
                      : 'border-zinc-200 dark:border-zinc-800 focus:ring-[#B3121B]/30'
                  }`}
                />

                {editions.some(
                  (ed) =>
                    ed.id !== editingEdition?.id &&
                    ed.date === date &&
                    ed.city.toLowerCase() === city.trim().toLowerCase() &&
                    (ed.title || '').trim().toLowerCase() === (title.trim() || `${city.toUpperCase()} EDITION`).toLowerCase()
                ) && (
                  <p className="text-[11px] font-black text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
                    આ તારીખે આ નામનું ઈ-પેપર પહેલેથી જ બનાવાયેલ છે! (Edition with this name already exists for this date)
                  </p>
                )}
              </div>

              {/* Date & Publish Time - Only show Scheduled Time settings when Status is DRAFT */}
              {status === 'DRAFT' ? (
                <div className="p-4 bg-amber-50/70 dark:bg-amber-900/10 rounded-2xl border border-amber-200/80 dark:border-amber-900/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-400">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>Scheduled Publishing Settings (ડ્રાફ્ટ પબ્લિશ તારીખ અને સમય)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const h = now.getHours();
                        const m = String(now.getMinutes()).padStart(2, '0');
                        const period = h >= 12 ? 'PM' : 'AM';
                        const h12 = String(h % 12 || 12).padStart(2, '0');
                        setPublishTime(`${h12}:${m} ${period}`);
                        setStatus('PUBLISHED');
                        showToast('success', 'Set to Current Time & PUBLISHED status!');
                      }}
                      className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-sm"
                    >
                      ⚡ Publish Now (અત્યારે પબ્લિશ કરો)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        Publish Date (તારીખ) *
                      </label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          required
                          className="w-full pl-9 pr-2 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-1">
                        Publish Time (સમય પસંદ કરો) *
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <input
                          type="time"
                          value={formatTo24Hour(publishTime)}
                          onChange={(e) => setPublishTime(formatTo12Hour(e.target.value))}
                          required
                          className="w-full pl-9 pr-2 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-white cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preset Time Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 mr-1">જલ્દી સમય પસંદ કરો:</span>
                    {[
                      '06:00 AM',
                      '07:00 AM',
                      '09:00 AM',
                      '12:00 PM',
                      '01:00 PM',
                      '05:00 PM',
                      '07:00 PM',
                    ].map((presetTime) => (
                      <button
                        key={presetTime}
                        type="button"
                        onClick={() => {
                          setPublishTime(presetTime);
                          showToast('success', `Time set to ${presetTime}`);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${publishTime === presetTime ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-amber-500'}`}
                      >
                        {presetTime}
                      </button>
                    ))}
                  </div>

                  {/* Auto-publish info note */}
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-600/10 dark:bg-blue-500/10 border border-blue-500/20 px-3 py-2.5">
                    <span className="text-blue-500 text-base shrink-0 mt-0.5">ℹ️</span>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black text-blue-700 dark:text-blue-400 leading-tight">
                        Auto-Publish: આ ઈ-પેપર ક્યારે પ્રકાશિત થશે?
                      </p>
                      <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-300 leading-snug">
                        {(() => {
                          const today = getTodayDateStr();
                          if (!date) return 'Set a publish date above.';
                          if (date < today) return `⚡ Date already passed — this draft will auto-publish the next time the e-paper page is visited.`;
                          if (date === today) return `⏰ Today at ${publishTime} (IST) — will auto-publish when the page loads after that time.`;
                          return `📅 On ${date} at ${publishTime} (IST) — will auto-publish on the scheduled day.`;
                        })()}
                      </p>
                      <p className="text-[10px] text-blue-500/80 dark:text-blue-400/70 mt-1">
                        Note: Auto-publish runs when the public e-paper page is opened. Use "⚡ Publish Now" button to publish immediately.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-1.5">
                    Publication Date (તારીખ) *
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 text-xs font-bold text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              )}



              {/* PDF ATTACHMENT */}
              <div className="border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 space-y-3">
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Newspaper PDF Source (પસંદ કરો: લિંક અથવા ફાઇલ અપલોડ) *
                </label>

                <div className="grid grid-cols-2 gap-2 bg-zinc-200/80 dark:bg-zinc-800/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPdfInputMode('link')}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${pdfInputMode === 'link' ? 'bg-[#B3121B] text-white shadow-md' : 'text-zinc-600'}`}
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    Option 1: PDF Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfInputMode('file')}
                    className={`py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${pdfInputMode === 'file' ? 'bg-[#B3121B] text-white shadow-md' : 'text-zinc-600'}`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Option 2: Upload File
                  </button>
                </div>

                {pdfInputMode === 'link' ? (
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://example.com/newspaper.pdf"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white text-xs font-semibold"
                  />
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={handleUploadFile}
                    />
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${fileUrl ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-zinc-300 bg-white'}`}>
                      {fileUrl ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <span>PDF File Selected & Ready!</span>
                          </div>
                          <p className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 truncate max-w-full px-2 bg-white dark:bg-zinc-900 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
                            {fileUrl}
                          </p>
                          <div className="flex justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-white text-xs font-bold hover:bg-zinc-900 cursor-pointer"
                            >
                              {uploading ? 'Uploading...' : 'Change PDF File'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setFileUrl('')}
                              className="px-3.5 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-bold hover:bg-red-200 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="px-4 py-2 rounded-xl bg-[#B3121B] text-white text-xs font-black hover:bg-[#8e0e15] cursor-pointer"
                        >
                          {uploading ? 'Uploading...' : 'Browse PDF File'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); resetForm(); }}
                  className="px-5 py-2.5 rounded-xl border border-zinc-200 text-xs font-black text-zinc-500 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading || uploadingThumb}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#B3121B] text-white text-xs font-black hover:bg-[#8e0e15] disabled:opacity-60 transition cursor-pointer shadow-md"
                >
                  {(saving || uploading || uploadingThumb) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {uploading ? 'Uploading PDF File...' : uploadingThumb ? 'Uploading Thumbnail...' : editingEdition ? 'Save Changes' : status === 'PUBLISHED' ? 'Publish Edition' : 'Save as Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ─── */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl cursor-default animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-zinc-900 dark:text-white">Delete Edition?</h3>
                <p className="text-xs font-semibold text-zinc-500 mt-0.5">This action will permanently delete the edition.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-black text-zinc-500 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 disabled:opacity-60 transition cursor-pointer"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CUSTOM DELETE CITY CONFIRM MODAL ─── */}
      {deleteCityTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => setDeleteCityTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl cursor-default animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-zinc-900 dark:text-white text-sm">
                  Delete City "{deleteCityTarget.cityGu || deleteCityTarget.city}"?
                </h3>
                <p className="text-xs font-semibold text-zinc-500 mt-1">
                  શું તમે આ શહેર ડિલીટ કરવા માંગો છો? (Are you sure you want to remove this city?)
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setDeleteCityTarget(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-black text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel (રદ કરો)
              </button>
              <button
                type="button"
                onClick={confirmDeleteCity}
                disabled={deletingCity}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 disabled:opacity-60 transition cursor-pointer shadow-md"
              >
                {deletingCity && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete City (ડિલીટ કરો)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── INTERACTIVE E-PAPER READER MODAL ─── */}
      {activeReaderEdition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-4">
          <div className="relative flex h-full max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            
            {/* Reader Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center font-black">
                  <Newspaper className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black leading-none">
                    Gujarat Post — {activeReaderEdition.title || activeReaderEdition.cityGu || activeReaderEdition.city}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    {formatDateLabel(activeReaderEdition.date)} • {activeReaderEdition.pages || 24} Pages
                  </p>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-2">

                {activeReaderEdition.fileUrl && !activeReaderEdition.fileUrl.startsWith('blob:') && (
                  <a
                    href={formatEpaperDownloadUrl(activeReaderEdition.fileUrl)}
                    download="GujaratPost_EPaper.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-red-700 transition"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </a>
                )}

                <button
                  onClick={closeReader}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Reader Canvas */}
            <div
              ref={readerCanvasRef}
              onScroll={(e) => {
                const target = e.currentTarget;
                const scrollPosition = target.scrollTop;
                const totalScrollHeight = target.scrollHeight - target.clientHeight;
                const totalPages = activeReaderEdition?.pages || 24;
                if (totalScrollHeight > 0 && totalPages > 1) {
                  const calculatedPage = Math.min(
                    totalPages,
                    Math.max(1, Math.round((scrollPosition / totalScrollHeight) * (totalPages - 1)) + 1)
                  );
                  if (calculatedPage !== currentPage) {
                    setCurrentPage(calculatedPage);
                  }
                }
              }}
              className="relative flex-1 overflow-auto bg-slate-950 p-4 flex items-start justify-center"
            >
              {isPdfUrl(activeReaderEdition.fileUrl) || activeReaderEdition.fileUrl?.includes('/uploads/') ? (
                <iframe
                  key={`${activeReaderEdition.id}-p${currentPage}`}
                  src={formatEpaperPdfUrl(activeReaderEdition.fileUrl, currentPage)}
                  className="bg-white border-0 shadow-2xl rounded-xl transition-all duration-200"
                  style={{
                    width: `${Math.round(850 * (zoomLevel / 100))}px`,
                    height: `${Math.round(1150 * (zoomLevel / 100))}px`,
                    maxWidth: '95vw',
                  }}
                  title={`Gujarat Post E-Paper Page ${currentPage}`}
                />
              ) : (
                  <div className="relative mx-auto w-[680px] max-w-full min-h-[900px] rounded-lg bg-white p-8 text-slate-900 shadow-2xl border border-slate-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b-4 border-slate-950 pb-2">
                        <h2 className="text-3xl font-black tracking-tighter text-red-600">GUJARAT POST</h2>
                        <div className="text-right text-xs font-black uppercase text-slate-700">
                          <span>{activeReaderEdition.title || activeReaderEdition.city}</span>
                          <div className="text-[10px] text-slate-500">{activeReaderEdition.date} | Page {currentPage}</div>
                        </div>
                      </div>

                      <div className="mt-6 space-y-6">
                        <div className="border-b border-slate-300 pb-4">
                          <span className="inline-block bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded mb-2">
                            PAGE {currentPage} • MAIN HEADLINE
                          </span>
                          <h3 className="text-2xl font-black text-slate-950 leading-tight">
                            {activeReaderEdition.title || activeReaderEdition.city} અંક: પાનું {currentPage}
                          </h3>
                        </div>

                        {currentPage === 1 && activeReaderEdition.thumbnailUrl && !activeReaderEdition.thumbnailUrl.startsWith('blob:') && (
                          <div className="my-4 rounded-lg overflow-hidden border border-slate-200 max-h-96">
                            <img src={activeReaderEdition.thumbnailUrl} alt="Edition Cover" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Gujarat Post E-Paper • {activeReaderEdition.city}</span>
                      <span>- Page {currentPage} of {activeReaderEdition.pages || 24} -</span>
                    </div>
                  </div>
                )}
            </div>

            {/* Bottom Nav */}
            <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-3 text-white">
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-xs font-black hover:bg-slate-700 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Page
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Page</span>
                <select
                  value={currentPage}
                  onChange={(e) => handlePageChange(Number(e.target.value))}
                  className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-lg border border-slate-700 focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: activeReaderEdition.pages || 24 }, (_, i) => i + 1).map((pNum) => (
                    <option key={pNum} value={pNum}>
                      {pNum}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-bold text-slate-400">of {activeReaderEdition.pages || 24}</span>
              </div>

              <button
                disabled={currentPage >= (activeReaderEdition.pages || 24)}
                onClick={() => handlePageChange(currentPage + 1)}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700 disabled:opacity-40 transition cursor-pointer"
              >
                Next Page
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
