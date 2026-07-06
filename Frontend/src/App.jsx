import { useState, useEffect, useRef } from 'react';
import AdminDashboard from './AdminDashboard';
import { authAPI, categoriesAPI, articlesAPI, liveUpdatesAPI, epaperAPI, marketsAPI } from './api';

// Default mock data matching the screenshot exactly
const MOCK_FEATURED = [
  {
    id: 'mock-f1',
    title: 'Viraat Ramayan Mandir Devlopment Project.',
    excerpt: 'Ram-Gita Mandir, Temple, Pilgrimage Corridor, Taj-Shrines / Temples. Tourism & Visitor Infrastructure, Museum & Cultural Halls (Planned)...',
    featured_image_path: '/viraat_ramayan_mandir.png',
    category_name: 'Religion',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read_time: '3 min read'
  },
  {
    id: 'mock-f2',
    title: 'INDIA BEATS PAKISTAN BY 64 RUNS!',
    excerpt: 'Team India posts 141/7 and restricts Pakistan to 77 runs. Superb match performance by Deepti Sharma (Player of the Match, 5 wickets).',
    featured_image_path: '/cricket_stadium.png',
    category_name: 'Sports',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read_time: '2 min read'
  },
  {
    id: 'mock-f3',
    title: 'SOUTH GUJARAT RAIN ALERT',
    excerpt: 'Heavy Rain & Thunderstorm Expected in Surat, Navsari, Valsad, Dang, Tapi. Disaster response teams put on high alert.',
    featured_image_path: '/south_gujarat_rain.png',
    category_name: 'Rain Alert',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read_time: '4 min read'
  },
  {
    id: 'mock-f4',
    title: 'NEW INDUSTRIAL POLICY 2026 LAUNCHED',
    excerpt: 'A new era of growth & investment in Gujarat. The government focuses on technology integration, employment, and green energy.',
    featured_image_path: '/industrial_policy.png',
    category_name: 'Big News',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read_time: '3 min read'
  }
];

// State/city news is loaded dynamically from the database via locationCategories + dbArticles

const MOCK_MUST_READ = [
  {
    id: 'mock-mr-1',
    title: 'Lok Sabha Passes Important Bill',
    featured_image_path: '/viraat_ramayan_mandir.png',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category_name: 'India'
  },
  {
    id: 'mock-mr-2',
    title: 'Subhuman Gill Record: Fastest one day match 1000 runs',
    featured_image_path: '/cricket_stadium.png',
    published_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    category_name: 'Sports'
  },
  {
    id: 'mock-mr-3',
    title: 'AI Revolution is Changing India',
    featured_image_path: '/industrial_policy.png',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category_name: 'Technology'
  },
  {
    id: 'mock-mr-4',
    title: 'Yoga is the Key to a Healthy Life',
    featured_image_path: '/viraat_ramayan_mandir.png',
    published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    category_name: 'Health'
  },
  {
    id: 'mock-mr-5',
    title: 'New Film Breaks Box Official Records',
    featured_image_path: '/cricket_stadium.png',
    published_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    category_name: 'Entertainment'
  }
];

const MOCK_FACT_CHECK = [
  {
    id: 'mock-fc-1',
    title: 'FACT CHECK: Did Gujarat Gov announce 3 days holiday for rain?',
    featured_image_path: '/south_gujarat_rain.png',
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    category_name: 'Fact Check',
    author_name: 'FactCheck Team'
  },
  {
    id: 'mock-fc-2',
    title: 'FACT CHECK: Is this viral video of Ahmedabad Metro Phase-2 real?',
    featured_image_path: '/viraat_ramayan_mandir.png',
    published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    category_name: 'Fact Check',
    author_name: 'FactCheck Team'
  },
  {
    id: 'mock-fc-3',
    title: 'FACT CHECK: Has the double FSI incentive policy been suspended?',
    featured_image_path: '/industrial_policy.png',
    published_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    category_name: 'Fact Check',
    author_name: 'FactCheck Team'
  },
  {
    id: 'mock-fc-4',
    title: 'FACT CHECK: Is there a massive fire in Surat textile market?',
    featured_image_path: '/south_gujarat_rain.png',
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    category_name: 'Fact Check',
    author_name: 'FactCheck Team'
  },
  {
    id: 'mock-fc-5',
    title: 'FACT CHECK: Viral claim about gold rate drop in Ahmedabad jewelry markets.',
    featured_image_path: '/cricket_stadium.png',
    published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    category_name: 'Fact Check',
    author_name: 'FactCheck Team'
  }
];

function App() {
  const stateNewsRef = useRef(null);
  const mustReadRef = useRef(null);
  const factCheckRef = useRef(null);
  const [dbArticles, setDbArticles] = useState([]);
  const [locationCategories, setLocationCategories] = useState([]);
  const [activeCity, setActiveCity] = useState('');
  const [marketTab, setMarketTab] = useState('MARKETS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedCityHeader, setSelectedCityHeader] = useState('');

  // Dynamic segments state
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [latestEpaper, setLatestEpaper] = useState(null);
  const [liveRates, setLiveRates] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(window.location.pathname === '/admin');
  const [adminUser, setAdminUser] = useState(null);
  const [activeArticle, setActiveArticle] = useState(null);
  const token = localStorage.getItem('token');

  const verifyAdmin = async () => {
    if (token) {
      try {
        const data = await authAPI.getProfile();
        if (data.success) {
          setAdminUser(data.data);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Failed to verify admin user:', err);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const resData = await categoriesAPI.getAll();
      if (resData.success && resData.data) {
        const locs = resData.data.filter(c => c.is_location === 1 || c.is_location === true);
        setLocationCategories(locs);
        if (locs.length > 0) {
          setActiveCity(prev => prev || locs[0].slug);
          setSelectedCityHeader(prev => prev || locs[0].slug);
        } else {
          setActiveCity(prev => prev || 'ahmedabad');
          setSelectedCityHeader(prev => prev || 'ahmedabad');
        }
      }
    } catch (error) {
      console.error('Failed to load categories:', error.message);
    }
  };

  const fetchArticles = async () => {
    try {
      const resData = await articlesAPI.getAll('status=published&limit=100');
      if (resData.success && resData.data) {
        setDbArticles(resData.data);
      }
    } catch (error) {
      console.error('Failed to load articles from API:', error.message);
    }
  };

  const fetchLiveUpdates = async () => {
    try {
      const resData = await liveUpdatesAPI.getAll();
      if (resData.success && resData.data) {
        setLiveUpdates(resData.data);
      }
    } catch (error) {
      console.error('Failed to load live updates:', error.message);
    }
  };

  const fetchLatestEpaper = async () => {
    try {
      const resData = await epaperAPI.getLatest();
      if (resData.success && resData.data) {
        setLatestEpaper(resData.data);
      }
    } catch (error) {
      console.error('Failed to load latest epaper:', error.message);
    }
  };

  const fetchLiveRates = async () => {
    try {
      const resData = await marketsAPI.getLiveRates();
      if (resData.success && resData.data) {
        setLiveRates(resData.data);
      }
    } catch (error) {
      console.error('Failed to load live rates:', error.message);
    }
  };

  // Load articles, live updates, epaper, markets, categories, and verify admin user on mount
  useEffect(() => {
    verifyAdmin();
    fetchCategories();
    fetchArticles();
    fetchLiveUpdates();
    fetchLatestEpaper();
    fetchLiveRates();

    const handlePopState = () => {
      setIsAdminMode(window.location.pathname === '/admin');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Re-fetch articles, live updates, and other homepage content when leaving admin mode
  useEffect(() => {
    if (!isAdminMode) {
      fetchArticles();
      fetchCategories();
      fetchLiveUpdates();
      fetchLatestEpaper();
      fetchLiveRates();
    }
  }, [isAdminMode]);

  // Auto-select first city with articles on initial load
  useEffect(() => {
    if (locationCategories.length > 0 && dbArticles.length > 0) {
      const activeLocs = locationCategories.filter(loc => {
        return dbArticles.some(art => {
          if (art.category_id === loc.id) return true;
          if (art.category_slug && art.category_slug.toLowerCase() === loc.slug.toLowerCase()) return true;
          const matchText = (art.title + ' ' + (art.content || '') + ' ' + (art.category_name || '')).toLowerCase();
          return matchText.includes(loc.slug.toLowerCase()) || matchText.includes(loc.name.toLowerCase());
        });
      });
      if (activeLocs.length > 0) {
        const hasArticlesForCurrent = activeLocs.some(loc => loc.slug === activeCity);
        if (!activeCity || !hasArticlesForCurrent) {
          setActiveCity(activeLocs[0].slug);
          setSelectedCityHeader(activeLocs[0].slug);
        }
      }
    }
  }, [locationCategories, dbArticles]);

  const mockUpdates = [
    { id: 'u1', time_text: '2m ago', title: 'sdfjsfi sdf is fs is', youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
  ];

  const updatesToUse = (liveUpdates.length > 0 ? liveUpdates : mockUpdates)
    .filter(item => !!item.youtube_url);

  const epaperToUse = latestEpaper || {
    title: 'Gujarat News Hub dt. 15.06.2026',
    thumbnail_path: '/viraat_ramayan_mandir.png',
    pdf_path: '#',
    publish_date: '2026-06-15'
  };

  const ratesToUse = liveRates || {
    MARKETS: [
      { name: 'SENSEX', val: '76,721.08', change: '+852.34 (1.07%)', dir: 'up' },
      { name: 'NIFTY', val: '24,619.85', change: '+252.15 (1.04%)', dir: 'up' },
      { name: 'GOLD (24K)', val: '72,450', change: '-220.00 (0.30%)', dir: 'down' }
    ],
    COMMODITY: [
      { name: 'SILVER (1KG)', val: '87,400', change: '+450.00 (0.52%)', dir: 'up' },
      { name: 'CRUDE OIL', val: '6,850', change: '-45.00 (0.65%)', dir: 'down' },
      { name: 'COPPER', val: '785', change: '+4.20 (0.54%)', dir: 'up' }
    ],
    CURRENCY: [
      { name: 'USD / INR', val: '83.45', change: '-0.08 (0.10%)', dir: 'down' },
      { name: 'EUR / INR', val: '89.60', change: '+0.12 (0.13%)', dir: 'up' },
      { name: 'GBP / INR', val: '105.80', change: '+0.35 (0.33%)', dir: 'up' }
    ],
    crypto: [
      { name: 'BTC / USD', val: '65,420', change: '+1.20%', dir: 'up' }
    ],
    whatsapp_followers: '125K +',
    trending_label_en: 'Trending',
    trending_label_gu: 'ટ્રેન્ડિંગ'
  };

  const handleArticleClick = async (articleIdOrSlug) => {
    if (articleIdOrSlug && articleIdOrSlug.toString().startsWith('mock')) {
      let mockArt = null;
      if (articleIdOrSlug.startsWith('mock-f')) {
        mockArt = MOCK_FEATURED.find(a => a.id === articleIdOrSlug);
      } else if (articleIdOrSlug.startsWith('mock-mr')) {
        mockArt = MOCK_MUST_READ.find(a => a.id === articleIdOrSlug);
      } else if (articleIdOrSlug.startsWith('mock-fc')) {
        mockArt = MOCK_FACT_CHECK.find(a => a.id === articleIdOrSlug);
      } else if (articleIdOrSlug.startsWith('mock-b')) {
        const list = getBreakingNews();
        mockArt = list.find(a => a.id === articleIdOrSlug);
      }
      if (mockArt) {
        setActiveArticle({
          ...mockArt,
          content: mockArt.excerpt + "\n\nThis is a demonstration story matching the portal homepage layout. In a production environment, this bulletin contains full-text journalism details published directly by the editorial staff."
        });
      }
      return;
    }

    try {
      const data = await articlesAPI.getByIdOrSlug(articleIdOrSlug);
      if (data.success && data.data) {
        setActiveArticle(data.data);
      } else {
        alert(data.message || 'Failed to load article details.');
      }
    } catch (err) {
      console.error('Error loading article:', err);
    }
  };


  if (isAdminMode) {
    return (
      <AdminDashboard
        onClose={() => {
          setIsAdminMode(false);
          window.history.pushState({}, '', '/');
        }}
        onPreviewArticle={(article) => {
          setActiveArticle(article);
        }}
      />
    );
  }

  // Filter breaking news (is_breaking === 1) or fall back to default trending topics
  const getBreakingNews = () => {
    const apiBreaking = dbArticles.filter(a => a.is_breaking === 1 || a.is_breaking === true);
    if (apiBreaking.length > 0) {
      return apiBreaking;
    }
    return [
      { id: 'mock-b1', title: selectedLanguage === 'Gujarati' ? 'રામ મંદિરમાં ચોરી' : 'Theft in Ram Mandir' },
      { id: 'mock-b2', title: selectedLanguage === 'Gujarati' ? 'ટ્રમ્પ-મોદી મુલાકાત' : 'Trump-Modi Meeting' },
      { id: 'mock-b3', title: selectedLanguage === 'Gujarati' ? 'અમેરિકા-ઈરાન યુદ્ધ' : 'US-Iran War' }
    ];
  };

  // Filter featured articles (curated from liveRates settings or fall back to is_featured / dbArticles)
  const getFeaturedArticles = () => {
    const curatedIds = [
      liveRates?.featured_id_1,
      liveRates?.featured_id_2,
      liveRates?.featured_id_3,
      liveRates?.featured_id_4
    ];

    const curatedArticles = [];
    curatedIds.forEach(id => {
      if (id) {
        const found = dbArticles.find(a => a.id.toString() === id.toString());
        if (found) {
          curatedArticles.push(found);
        }
      }
    });

    // If we have less than 4 curated articles, pad them with other db articles marked as is_featured
    let remainingCount = 4 - curatedArticles.length;
    if (remainingCount > 0) {
      const apiFeatured = dbArticles.filter(a => (a.is_featured === 1 || a.is_featured === true) && !curatedArticles.some(ca => ca.id === a.id));
      curatedArticles.push(...apiFeatured.slice(0, remainingCount));
    }

    // If still less than 4, pad with any other published articles from the database
    remainingCount = 4 - curatedArticles.length;
    if (remainingCount > 0) {
      const otherArticles = dbArticles.filter(a => !curatedArticles.some(ca => ca.id === a.id));
      curatedArticles.push(...otherArticles.slice(0, remainingCount));
    }

    return curatedArticles.slice(0, 4);
  };



  // Filter state/location news based on tab selection
  const getStateNews = () => {
    if (!activeCity) return [];
    const featuredList = getFeaturedArticles();
    const apiCity = dbArticles.filter(a => {
      if (a.category_slug) {
        return a.category_slug.toLowerCase() === activeCity.toLowerCase();
      }
      const matchText = (a.title + ' ' + (a.content || '') + ' ' + (a.category_name || '')).toLowerCase();
      return matchText.includes(activeCity.toLowerCase());
    });

    // Extract featured articles belonging to this active city
    const featuredInCity = apiCity.filter(a => featuredList.some(fa => fa.id === a.id));
    // Extract normal articles (not featured) belonging to this active city
    const normalInCity = apiCity.filter(a => !featuredList.some(fa => fa.id === a.id));

    // Combine them, placing featured ones at the top
    return [...featuredInCity, ...normalInCity].slice(0, 10);
  };

  // Filter "Must Read" articles (general articles, excluding breaking, featured, and fact check)
  const getMustRead = () => {
    const featuredList = getFeaturedArticles();
    const apiNormal = dbArticles.filter(a =>
      !(a.is_fact_check === 1 || a.is_fact_check === true) &&
      !(a.is_breaking === 1 || a.is_breaking === true) &&
      !featuredList.some(fa => fa.id === a.id)
    );
    const merged = [...apiNormal];
    for (let i = 0; i < MOCK_MUST_READ.length; i++) {
      if (merged.length >= 10) break;
      const mockItem = MOCK_MUST_READ[i];
      const isAlreadyMerged = merged.some(a => a.title.toLowerCase() === mockItem.title.toLowerCase());
      const isFeatured = featuredList.some(fa => fa.title.toLowerCase() === mockItem.title.toLowerCase());
      if (!isAlreadyMerged && !isFeatured) {
        merged.push(mockItem);
      }
    }
    return merged.slice(0, 10);
  };

  // Filter all fact-check articles (exclude featured ones)
  const getFactCheckArticles = () => {
    const featuredList = getFeaturedArticles();
    const apiFactCheck = dbArticles.filter(a => a.is_fact_check === 1 || a.is_fact_check === true);
    const filteredFactCheck = apiFactCheck.filter(a => !featuredList.some(fa => fa.id === a.id));
    const merged = [...filteredFactCheck];
    for (let i = 0; i < MOCK_FACT_CHECK.length; i++) {
      if (merged.length >= 10) break;
      const mockItem = MOCK_FACT_CHECK[i];
      const isAlreadyMerged = merged.some(a => a.title.toLowerCase() === mockItem.title.toLowerCase());
      const isFeatured = featuredList.some(fa => fa.title.toLowerCase() === mockItem.title.toLowerCase());
      if (!isAlreadyMerged && !isFeatured) {
        merged.push(mockItem);
      }
    }
    return merged.slice(0, 10);
  };

  // Format dates
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
      return '2 hours ago';
    }
  };

  // Filter location categories that have articles (or fall back to all if none have articles)
  const getActiveLocations = () => {
    const activeLocs = locationCategories.filter(loc => {
      return dbArticles.some(art => {
        if (art.category_id === loc.id) return true;
        if (art.category_slug && art.category_slug.toLowerCase() === loc.slug.toLowerCase()) return true;
        const matchText = (art.title + ' ' + (art.content || '') + ' ' + (art.category_name || '')).toLowerCase();
        return matchText.includes(loc.slug.toLowerCase()) || matchText.includes(loc.name.toLowerCase());
      });
    });
    return activeLocs.length > 0 ? activeLocs : locationCategories;
  };

  const activeLocationsList = getActiveLocations();

  const breakingList = getBreakingNews();
  const featuredList = getFeaturedArticles();
  const stateNewsList = getStateNews();
  const mustReadList = getMustRead();
  const factCheckArticlesList = getFactCheckArticles();

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen flex flex-col">
      {/* ==========================================
         HEADER
         ========================================== */}
      <header className="w-full bg-white border-b border-gray-100">
        <div className="w-full px-6 md:px-10 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-left">
              <div className="font-['Outfit'] text-[32px] font-extrabold text-gray-900 leading-none uppercase tracking-tight">
                {liveRates?.homepage_title || 'Gujarat'}
                <span className="block text-[13px] font-medium normal-case text-gray-500 tracking-normal mt-0.5">
                  {liveRates?.homepage_subtitle || 'news hub'}
                </span>
              </div>
              <div className="text-[10.5px] font-bold text-gray-400 mt-1 tracking-wider uppercase">
                {liveRates?.homepage_tagline || 'Fast • Trusted • First'}
              </div>
            </div>
            {adminUser && ['super_admin', 'editor'].includes(adminUser.role) && (
              <button
                onClick={() => {
                  localStorage.setItem('adminActiveTab', 'settings');
                  setIsAdminMode(true);
                  window.history.pushState({}, '', '/admin');
                }}
                className="p-1.5 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-[#d32f2f] rounded-lg transition-colors cursor-pointer"
                title="Manage Homepage"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 flex-grow">
            {/* City Dropdown Selector */}
            <div className="relative flex items-center bg-gray-100 rounded-lg px-3.5 py-2.5 gap-2 font-medium text-[13.5px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-500">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <select
                value={selectedCityHeader}
                onChange={(e) => {
                  setSelectedCityHeader(e.target.value);
                  setActiveCity(e.target.value);
                }}
                className="border-none bg-transparent font-bold cursor-pointer pr-5 appearance-none text-gray-800 outline-none"
              >
                {activeLocationsList.length > 0 ? (
                  activeLocationsList.map(loc => (
                    <option key={loc.id} value={loc.slug}>{loc.name}</option>
                  ))
                ) : (
                  <option value="ahmedabad">Ahmedabad</option>
                )}
              </select>
              <span className="absolute right-3.5 pointer-events-none text-[10px] text-gray-500">▼</span>
            </div>

            {/* Search Box */}
            <div className="flex items-center bg-gray-100 rounded-lg px-3.5 py-2.5 flex-grow max-w-[360px] gap-2.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search News, People, Topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-none bg-transparent w-full text-[13.5px] text-gray-800 placeholder-gray-400 outline-none"
              />
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 cursor-pointer">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
              </svg>
            </div>

            {/* ePaper Shortcuts */}
            <button
              onClick={() => {
                if (epaperToUse.pdf_path && epaperToUse.pdf_path !== '#') {
                  window.open(epaperToUse.pdf_path, '_blank');
                } else {
                  alert('No ePaper issue available yet.');
                }
              }}
              className="flex items-center gap-2 border border-gray-200 px-4 py-2.5 rounded-lg font-bold text-[13.5px] bg-white hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer text-gray-700"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8M18 18h-8M16 6H10v4h6V6Z" />
              </svg>
              ePaper
            </button>

            {/* Language Selector */}
            <div className="relative flex items-center border border-gray-200 rounded-lg px-3 py-2.5 text-[13.5px] font-bold bg-white gap-2 text-gray-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
              </svg>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="border-none bg-transparent font-bold cursor-pointer pr-4 appearance-none outline-none"
              >
                <option value="English">English</option>
                <option value="Gujarati">ગુજરાતી</option>
              </select>
              <span className="absolute right-2.5 pointer-events-none text-[8px] text-gray-500">▼</span>
            </div>

            {/* Login / Admin Action Button */}
            {adminUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsAdminMode(true);
                    window.history.pushState({}, '', '/admin');
                  }}
                  className="bg-gray-800 hover:bg-gray-900 text-white font-bold px-4 py-2.5 rounded-lg text-[13.5px] flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
                  </svg>
                  Admin Panel
                </button>

                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    setAdminUser(null);
                    window.location.reload();
                  }}
                  className="bg-red-50 hover:bg-red-100 text-[#d32f2f] font-bold px-4 py-2.5 rounded-lg text-[13.5px] border border-red-200 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsAdminMode(true);
                  window.history.pushState({}, '', '/admin');
                }}
                className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold px-4 py-2.5 rounded-lg text-[13.5px] flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ==========================================
         NAVIGATION
         ========================================== */}
      <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm scrollbar-none">
        <div className="w-full px-6 md:px-10 flex items-center overflow-x-auto whitespace-nowrap gap-1">
          <button className="p-3.5 text-gray-700 flex items-center justify-center cursor-pointer hover:text-[#d32f2f] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5 py-2">
            <span className="bg-[#d32f2f] text-white px-4.5 py-1.5 rounded-md font-['Outfit'] font-extrabold text-[14px] inline-block cursor-pointer uppercase transition-all shadow-sm">
              Home
            </span>
            {['Gujarat', 'India', 'Business', 'Sports', 'Entertainment', 'Lifestyle', 'Technology', 'Health', 'Videos'].map((item) => (
              <span key={item} className="px-3.5 py-2 font-['Outfit'] font-bold text-[14px] text-gray-800 inline-block cursor-pointer hover:text-[#d32f2f] transition-all">
                {item}
              </span>
            ))}
            <span className="px-3.5 py-2 font-['Outfit'] font-bold text-[14px] text-gray-800 inline-flex items-center gap-1.5 cursor-pointer hover:text-[#d32f2f] transition-all">
              More
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-500">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>
      </nav>

      {/* ==========================================
         TRENDING TOPICS BAR (Auto-Scrolling Marquee)
         ========================================== */}
      {/* ==========================================
         TRENDING TOPICS BAR (Auto-Scrolling Marquee - End-to-End)
         ========================================== */}
      <section className="w-full bg-[#d32f2f] flex items-center min-h-[50px] py-1.5 relative overflow-hidden">
        <div className="w-full px-6 md:px-10 flex items-center justify-between gap-4">
          
          {/* Left Part: Flame icon and "Trending" text */}
          <div className="flex items-center gap-2 z-10 bg-[#d32f2f] pr-4 select-none flex-shrink-0">
            {/* Flame Icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {/* Trending Text */}
            <span className="text-white font-extrabold text-[13.5px] md:text-[14.5px] tracking-wider uppercase font-['Outfit']">
              {selectedLanguage === 'Gujarati' ? ratesToUse.trending_label_gu : ratesToUse.trending_label_en}
            </span>
          </div>

          {/* Center/Right Area: Auto-Scrolling Marquee */}
          <div className="flex-grow overflow-hidden relative flex items-center h-[38px]">
            {/* Subtle fade overlay to hide hard edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#d32f2f] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#d32f2f] to-transparent z-10 pointer-events-none"></div>

            {/* Scrolling Container */}
            <div className="flex flex-row flex-nowrap items-center gap-6 animate-marquee py-1 w-max">
              {[...breakingList, ...breakingList, ...breakingList, ...breakingList].map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex items-center gap-6 flex-shrink-0">
                  <button
                    onClick={() => handleArticleClick(item.id)}
                    className="flex items-center gap-2 bg-white border border-transparent text-[#d32f2f] font-bold px-4.5 py-1.5 rounded-full text-[12px] md:text-[12.5px] cursor-pointer transition-all whitespace-nowrap shadow-xs hover:scale-102 flex-shrink-0 group"
                  >
                    <span className="transition-colors group-hover:text-red-800">{item.title}</span>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-[#d32f2f] group-hover:text-red-800 transition-colors">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </button>
                  {/* Thin white vertical separator line */}
                  <div className="w-[1.5px] h-5.5 bg-white/40 flex-shrink-0"></div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>


      {/* ==========================================
         MAIN LAYOUT GRID
         ========================================== */}
      <div className="w-full bg-white">
        <main className="w-full px-6 md:px-10 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
          {/* Left Side Content Column */}
          <div className="flex flex-col gap-8 min-w-0">
            {/* Featured Grid (2x2) with exact Text Overlays */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {featuredList.map((article, index) => {
                const showTag = article.is_breaking === 1 || article.is_breaking === true;
                const tagText = article.category_name
                  ? (article.category_slug === 'rain-alert' ? '▲ RAIN ALERT' : article.category_name.toUpperCase())
                  : 'BREAKING NEWS';
                const isUppercaseTitle = article.category_slug === 'rain-alert' || index === 2;

                return (
                  <div
                    className="relative bg-black rounded-xl overflow-hidden aspect-[16/11] flex flex-col group cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                    key={article.id}
                    onClick={() => handleArticleClick(article.id)}
                  >
                    {/* Background Card Image */}
                    <img
                      src={article.featured_image_path}
                      alt={article.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-95 group-hover:scale-102 transition-transform duration-300"
                    />

                    {/* Contextual Edit Overlay Button */}
                    {adminUser && ['super_admin', 'editor', 'reporter'].includes(adminUser.role) && article.id && !article.id.toString().startsWith('mock') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          localStorage.setItem('editArticleId', article.id);
                          localStorage.setItem('adminActiveTab', 'articles');
                          setIsAdminMode(true);
                          window.history.pushState({}, '', '/admin');
                        }}
                        className="absolute top-3.5 right-3.5 bg-gray-900/80 hover:bg-gray-900 text-white p-2 rounded-lg z-20 transition-all shadow-md cursor-pointer border border-gray-700/50 flex items-center gap-1 text-[11px] font-bold"
                        title="Edit this article"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                    )}

                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>

                    {/* Tag Badge */}
                    {showTag && (
                      <span className="absolute top-3.5 left-3.5 text-white text-[11px] font-black uppercase px-2.5 py-1 rounded tracking-wider shadow-sm z-10 bg-[#d32f2f]">
                        {tagText}
                      </span>
                    )}

                    {/* Overlay Text Content Block */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white flex flex-col justify-end z-10 h-1/2">
                      {article.title && (
                        <h3 className={`font-['Outfit'] font-extrabold leading-snug mb-2 text-white drop-shadow-md group-hover:text-red-50 transition-colors ${isUppercaseTitle ? 'text-[19px] uppercase tracking-wide' : 'text-[18px]'
                          }`}>
                          {article.title}
                        </h3>
                      )}

                      {/* Meta Details Footer */}
                      <div className="flex items-center justify-between text-[11px] text-gray-300 border-t border-white/10 pt-2.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>{timeAgo(article.published_at)}</span>
                          {article.read_time && (
                            <>
                              <span>•</span>
                              <span>{article.read_time}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button className="text-gray-300 hover:text-white transition-colors cursor-pointer" title="Bookmark">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
                            </svg>
                          </button>
                          <button className="text-gray-300 hover:text-white transition-colors cursor-pointer" title="Share">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                              <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* State News Tabs & Grid */}
            <section className="flex flex-col gap-6 border border-gray-100 rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-left">
              <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-3 gap-3">
                <div className="flex items-center gap-6">
                  <h2 className="font-['Outfit'] text-[20px] font-extrabold text-gray-900">State News</h2>

                  <div className="flex items-center gap-4 overflow-x-auto scrollbar-none">
                    {activeLocationsList.length > 0 ? (
                      activeLocationsList.map((loc) => (
                        <button
                          className={`text-[14.5px] font-bold cursor-pointer py-1.5 border-b-2 transition-all whitespace-nowrap ${activeCity === loc.slug ? 'text-[#d32f2f] border-[#d32f2f]' : 'text-gray-500 border-transparent hover:text-[#d32f2f]'
                            }`}
                          key={loc.id}
                          onClick={() => {
                            setActiveCity(loc.slug);
                            setSelectedCityHeader(loc.slug);
                          }}
                        >
                          {loc.name}
                        </button>
                      ))
                    ) : (
                      ['Ahmedabad', 'Surat', 'Rajkot', 'Vadodara', 'Bhavnagar'].map((city) => (
                        <button
                          className={`text-[14.5px] font-bold cursor-pointer py-1.5 border-b-2 transition-all whitespace-nowrap ${activeCity.toLowerCase() === city.toLowerCase() ? 'text-[#d32f2f] border-[#d32f2f]' : 'text-gray-500 border-transparent hover:text-[#d32f2f]'
                            }`}
                          key={city}
                          onClick={() => {
                            setActiveCity(city.toLowerCase());
                            setSelectedCityHeader(city.toLowerCase());
                          }}
                        >
                          {city}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {adminUser && ['super_admin', 'editor', 'reporter'].includes(adminUser.role) && (
                    <button
                      onClick={() => {
                        localStorage.setItem('adminActiveTab', 'articles');
                        setIsAdminMode(true);
                        window.history.pushState({}, '', '/admin');
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border border-gray-200"
                    >
                      ⚙ Manage Articles
                    </button>
                  )}
                  {stateNewsList.length > 3 && (
                    <div className="flex items-center gap-1 border-r border-gray-100 pr-3 mr-1">
                      <button
                        onClick={() => {
                          stateNewsRef.current?.scrollBy({ left: -374, behavior: 'smooth' });
                        }}
                        className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors shadow-sm cursor-pointer flex items-center justify-center"
                        title="Scroll Left"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          stateNewsRef.current?.scrollBy({ left: 374, behavior: 'smooth' });
                        }}
                        className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors shadow-sm cursor-pointer flex items-center justify-center"
                        title="Scroll Right"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <a href="#" className="text-sm font-bold text-[#d32f2f] hover:underline flex items-center gap-1">
                    View All
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* State News Card Grid */}
              {stateNewsList.length > 0 ? (
                <div ref={stateNewsRef} className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory">
                  {stateNewsList.map((article) => (
                    <div 
                      className="w-[280px] md:w-[350px] flex-shrink-0 flex flex-col bg-transparent cursor-pointer group snap-start" 
                      key={article.id}
                      onClick={() => handleArticleClick(article.id)}
                    >
                      {/* Highly Rounded Image Wrapper */}
                      <div className="relative aspect-[1.5] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
                        <img
                          src={article.featured_image_path}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />

                        {/* Absolute positioned solid black category badge */}
                        <span className="absolute bottom-3 left-3 bg-black text-white text-[11px] font-bold uppercase px-3 py-1.5 rounded-md tracking-wider leading-none shadow-md z-10">
                          {article.category_name}
                        </span>

                        {/* Admin edit Overlay */}
                        {adminUser && article.id && !article.id.toString().startsWith('mock') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              localStorage.setItem('editArticleId', article.id);
                              localStorage.setItem('adminActiveTab', 'articles');
                              setIsAdminMode(true);
                              window.history.pushState({}, '', '/admin');
                            }}
                            className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-900 text-white p-1.5 rounded-lg z-20 transition-all shadow-md cursor-pointer border border-gray-700/50 flex items-center gap-1 text-[10px] font-bold"
                            title="Edit this article"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                          </button>
                        )}
                      </div>

                      {/* Title & Metadata layout */}
                      <div className="py-2.5 flex flex-col flex-grow">
                        <h4 className="font-['Outfit'] text-[15px] font-bold leading-snug text-gray-900 mb-2.5 line-clamp-2 group-hover:text-[#d32f2f] transition-colors">
                          {article.title}
                        </h4>
                        <div className="mt-auto flex items-center justify-between text-[12px] text-gray-450 font-medium">
                          <span>{timeAgo(article.published_at)}</span>
                          <div className="flex items-center gap-3">
                            <button className="text-gray-400 hover:text-[#d32f2f] transition-colors cursor-pointer" title="Bookmark">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
                              </svg>
                            </button>
                            <button className="text-gray-400 hover:text-[#d32f2f] transition-colors cursor-pointer" title="Share">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  No articles available in this category.
                </div>
              )}
            </section>

            <section className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b-2 border-gray-100 pb-2">
                <h2 className="font-['Outfit'] text-[20px] font-extrabold text-gray-900">Must Read</h2>
                <div className="flex items-center gap-3">
                  {adminUser && ['super_admin', 'editor', 'reporter'].includes(adminUser.role) && (
                    <button
                      onClick={() => {
                        localStorage.setItem('adminActiveTab', 'articles');
                        setIsAdminMode(true);
                        window.history.pushState({}, '', '/admin');
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-750 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border border-gray-200"
                    >
                      ⚙ Manage Articles
                    </button>
                  )}
                  {mustReadList.length > 4 && (
                    <div className="flex items-center gap-1 border-r border-gray-100 pr-3 mr-1">
                      <button
                        onClick={() => {
                          mustReadRef.current?.scrollBy({ left: -256, behavior: 'smooth' });
                        }}
                        className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors shadow-sm cursor-pointer flex items-center justify-center"
                        title="Scroll Left"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          mustReadRef.current?.scrollBy({ left: 256, behavior: 'smooth' });
                        }}
                        className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors shadow-sm cursor-pointer flex items-center justify-center"
                        title="Scroll Right"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <a href="#" className="text-xs font-semibold text-[#d32f2f] hover:underline flex items-center gap-1">
                    View All
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>

              <div ref={mustReadRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory">
                {mustReadList.map((article) => (
                  <div 
                    className="w-[200px] md:w-[240px] flex-shrink-0 border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-white hover:shadow-sm transition-shadow cursor-pointer snap-start" 
                    key={article.id}
                    onClick={() => handleArticleClick(article.id)}
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                      <img src={article.featured_image_path} alt={article.title} className="w-full h-full object-cover" />
                      {adminUser && ['super_admin', 'editor', 'reporter'].includes(adminUser.role) && article.id && !article.id.toString().startsWith('mock') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.setItem('editArticleId', article.id);
                            localStorage.setItem('adminActiveTab', 'articles');
                            setIsAdminMode(true);
                            window.history.pushState({}, '', '/admin');
                          }}
                          className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-900 text-white p-1.5 rounded-lg z-20 transition-all shadow-md cursor-pointer border border-gray-700/50 flex items-center gap-1 text-[10px] font-bold"
                          title="Edit this article"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </button>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-grow">
                      <span className="text-[10px] font-bold text-[#d32f2f] mb-1">{article.category_name}</span>
                      <h4 className="font-['Outfit'] text-[13.5px] font-bold leading-snug text-gray-900 line-clamp-3 hover:text-[#d32f2f] transition-colors">{article.title}</h4>
                      <span className="mt-auto text-[11px] text-gray-400 pt-2">{timeAgo(article.published_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Fact Check Section */}
            <section className="flex flex-col gap-6 border border-gray-100 rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-left">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="font-['Outfit'] text-[20px] font-extrabold text-gray-900">Fact Check</h2>
                <div className="flex items-center gap-3">
                  {factCheckArticlesList.length > 4 && (
                    <div className="flex items-center gap-1 border-r border-gray-100 pr-3 mr-1">
                      <button
                        onClick={() => {
                          factCheckRef.current?.scrollBy({ left: -256, behavior: 'smooth' });
                        }}
                        className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors shadow-sm cursor-pointer flex items-center justify-center"
                        title="Scroll Left"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          factCheckRef.current?.scrollBy({ left: 256, behavior: 'smooth' });
                        }}
                        className="p-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors shadow-sm cursor-pointer flex items-center justify-center"
                        title="Scroll Right"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <a href="#" className="text-sm font-bold text-[#d32f2f] hover:underline flex items-center gap-1">
                    View All
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>

              <div ref={factCheckRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x snap-mandatory">
                {factCheckArticlesList.map((article) => (
                  <div
                    className="w-[200px] md:w-[240px] flex-shrink-0 border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-white hover:shadow-sm transition-shadow cursor-pointer group snap-start relative"
                    key={article.id}
                    onClick={() => handleArticleClick(article.id)}
                  >
                    {/* Article Thumbnail */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                      <img
                        src={article.featured_image_path}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />

                      {/* Verified check badge overlay */}
                      <span className="absolute top-2 left-2 bg-[#2e7d32] text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-wide leading-none shadow-sm z-10 flex items-center gap-1">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        VERIFIED
                      </span>

                      {adminUser && article.id && !article.id.toString().startsWith('mock') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.setItem('editArticleId', article.id);
                            localStorage.setItem('adminActiveTab', 'articles');
                            setIsAdminMode(true);
                            window.history.pushState({}, '', '/admin');
                          }}
                          className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-900 text-white p-1.5 rounded-lg z-20 transition-all shadow-md cursor-pointer border border-gray-700/50 flex items-center gap-1 text-[10px] font-bold"
                          title="Edit this article"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </button>
                      )}
                    </div>

                    {/* Article Content */}
                    <div className="p-3 flex flex-col flex-grow text-left">
                      <span className="text-[10px] font-black text-[#d32f2f] uppercase tracking-wider mb-1">
                        {article.category_name || 'General'}
                      </span>
                      <h4 className="font-['Outfit'] text-[13.5px] font-bold leading-snug text-gray-900 line-clamp-3 group-hover:text-[#d32f2f] transition-colors mb-2">
                        {article.title}
                      </h4>

                      <div className="mt-auto flex flex-col gap-0.5 text-[10px] text-gray-400 font-medium border-t border-gray-100 pt-2">
                        <span>By {article.author_name || 'System'}</span>
                        <span>{timeAgo(article.published_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {factCheckArticlesList.length === 0 && (
                  <div className="py-8 text-center text-gray-500 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200 w-full flex-shrink-0">
                    No fact check articles published yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar Widgets Column */}
          <aside className="flex flex-col gap-6">
            {/* Live Updates Timeline Widget */}
            <div className="bg-white rounded-3xl border border-gray-200/60 p-6 shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-gray-100 mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  {/* Glowing Live Waves Icon */}
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-[#d32f2f] animate-pulse">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-pulse-red rounded-full">
                      <circle cx="12" cy="12" r="2" fill="currentColor"/>
                      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="flex flex-col text-left">
                    <h3 className="font-['Outfit'] text-[20px] font-black text-gray-900 leading-none uppercase tracking-tight">
                      Live Updates
                    </h3>
                    <span className="text-[12.5px] font-semibold text-gray-400 mt-1">Stay updated with the latest happenings</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {adminUser && ['super_admin', 'editor'].includes(adminUser.role) && (
                    <button
                      onClick={() => {
                        localStorage.setItem('adminActiveTab', 'live-updates');
                        setIsAdminMode(true);
                        window.history.pushState({}, '', '/admin');
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer border border-gray-200 shadow-sm"
                      title="Edit Live Updates"
                    >
                      Edit
                    </button>
                  )}
                  <a 
                    href={ratesToUse.youtube_channel_url || 'https://www.youtube.com/@GujaratPost'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 bg-[#e50914] hover:bg-[#c60812] text-white px-4.5 py-2.5 rounded-full font-black text-[11.5px] transition-all cursor-pointer shadow-md hover:scale-102 flex-shrink-0 tracking-wide"
                  >
                    <svg width="15" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    VIEW ALL ON YOUTUBE
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-0.5">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Timeline Container */}
              <div className="relative pl-7 md:pl-8 flex flex-col text-left">
                {/* Timeline Track Line */}
                <div className="absolute left-[8px] top-2 bottom-8 w-[2px] bg-gray-150"></div>

                {updatesToUse.map((item, idx) => {
                  const isLast = idx === updatesToUse.length - 1;
                  const hasLink = !!item.youtube_url;
                  const isAlert = hasLink;

                  return (
                    <div key={item.id || idx} className={`relative ${isLast ? '' : 'pb-5'}`}>
                      {/* Timeline Dot Indicator */}
                      {isAlert ? (
                        <span className="absolute left-[-25px] top-[26px] w-4.5 h-4.5 bg-[#e50914] rounded-full border-2 border-white ring-4 ring-red-100 flex items-center justify-center animate-pulse"></span>
                      ) : (
                        <span className="absolute left-[-25px] top-[26px] w-4.5 h-4.5 bg-slate-400 rounded-full border-2 border-white flex items-center justify-center"></span>
                      )}

                      {hasLink ? (
                        /* YouTube Card Layout */
                        <div 
                          onClick={() => window.open(item.youtube_url, '_blank')}
                          className="bg-[#fffdfd] border border-red-100/60 p-5 rounded-2xl hover:bg-[#fff9f9] hover:border-red-200/80 hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 group"
                        >
                          <div className="flex flex-col text-left">
                            <div className="flex items-center gap-1.5 bg-white border border-[#e50914] rounded-full px-2.5 py-0.5 text-[10.5px] font-black text-[#e50914] w-fit shadow-xs mb-2.5">
                              <span className="w-1.5 h-1.5 bg-[#e50914] rounded-full animate-ping"></span>
                              <span className="w-1.5 h-1.5 bg-[#e50914] rounded-full absolute"></span>
                              LIVE NOW
                            </div>
                            <h4 className="font-['Outfit'] text-[18px] font-black text-gray-900 leading-snug mb-1.5 group-hover:text-[#e50914] transition-colors line-clamp-2">
                              {item.title}
                            </h4>
                            <span className="text-[11.5px] font-semibold text-gray-400">
                              {item.time_text}
                            </span>
                          </div>

                          {/* Big red play button icon */}
                          <div className="w-14 h-14 rounded-full bg-[#e50914] group-hover:bg-[#c60812] flex items-center justify-center shadow-lg shadow-red-200/60 group-hover:scale-108 transition-all flex-shrink-0 animate-pulse">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white ml-0.5">
                              <path d="M8 5v14l11-7z" fill="currentColor"/>
                            </svg>
                          </div>
                        </div>
                      ) : (
                        /* Text Update Layout */
                        <div className="bg-white border border-gray-150/70 p-5 rounded-2xl hover:bg-gray-50/50 hover:border-gray-300 transition-all duration-300">
                          <span className="text-[11.5px] font-semibold text-gray-400 mb-1.5 block">
                            {item.time_text}
                          </span>
                          <p className="text-[14.5px] font-bold text-gray-800 leading-snug">
                            {item.title}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Card Footer Channel Promotion */}
              <a 
                href={ratesToUse.youtube_channel_url || 'https://www.youtube.com/@GujaratPost'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#fffdfd] rounded-2xl p-4.5 mt-5 border border-red-100/40 flex items-center gap-3.5 relative overflow-hidden group cursor-pointer hover:bg-[#fff9f9] hover:border-red-200 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-red-100 flex items-center justify-center text-[#e50914] shadow-xs z-10 flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-swing">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div className="flex flex-col text-left z-10">
                  <span className="text-[12.5px] font-bold text-gray-500">For more updates and live coverage</span>
                  <span className="text-[13px] font-black text-[#e50914] group-hover:underline">watch on our YouTube channel</span>
                </div>

                {/* Concentric waves vector on background */}
                <div className="absolute right-[-15px] top-[-15px] bottom-[-15px] w-24 opacity-8 flex items-center justify-center pointer-events-none">
                  <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#e50914]">
                    <circle cx="12" cy="12" r="1" fill="currentColor"/>
                    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/>
                  </svg>
                </div>
              </a>
            </div>

            {/* Markets Ticker Tabs Widget */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex bg-[#fff5f5] border border-[#fce4e4] rounded-lg p-0.5 mb-4 items-center justify-between">
                <div className="flex-grow flex p-0.5 gap-1">
                  {['MARKETS', 'COMMODITY', 'CURRENCY'].map((tab) => (
                    <button
                      className={`flex-grow text-center py-2 text-[10.5px] font-black cursor-pointer transition-all tracking-wider rounded-md ${marketTab === tab
                          ? 'text-[#d32f2f] bg-white shadow-sm font-black'
                          : 'text-gray-500 hover:text-gray-800'
                        }`}
                      key={tab}
                      onClick={() => setMarketTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                {adminUser && ['super_admin', 'editor'].includes(adminUser.role) && (
                  <button
                    onClick={() => {
                      localStorage.setItem('adminActiveTab', 'settings');
                      setIsAdminMode(true);
                      window.history.pushState({}, '', '/admin');
                    }}
                    className="p-2 text-gray-500 hover:text-[#d32f2f] cursor-pointer"
                    title="Edit Market Rates & Settings"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4 text-left">
                {marketTab === 'MARKETS' && ratesToUse.MARKETS.map((item, idx) => {
                  const isUp = item.dir === 'up';
                  const color = isUp ? '#2e7d32' : '#c62828';
                  const isLast = idx === ratesToUse.MARKETS.length - 1;
                  return (
                    <div key={item.name} className={`flex items-center justify-between gap-2 ${isLast ? '' : 'pb-3 border-b border-dashed border-gray-150'}`}>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[12px] text-gray-800 tracking-wide">{item.name}</span>
                        <span className="font-['Outfit'] font-black text-[15px] text-gray-955 mt-0.5">{item.val}</span>
                      </div>
                      <svg className="w-12 h-6" viewBox="0 0 60 24">
                        {isUp ? (
                          <path d="M0 18 Q 15 5, 30 14 T 60 4" fill="none" stroke={color} strokeWidth="2.5" />
                        ) : (
                          <path d="M0 6 Q 20 18, 40 10 T 60 20" fill="none" stroke={color} strokeWidth="2.5" />
                        )}
                      </svg>
                      <div className="text-right">
                        <span style={{ color }} className="font-extrabold text-[12px] whitespace-nowrap">
                          {item.change} {isUp ? '↑' : '↓'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {marketTab === 'COMMODITY' && ratesToUse.COMMODITY.map((item, idx) => {
                  const isUp = item.dir === 'up';
                  const color = isUp ? '#2e7d32' : '#c62828';
                  const isLast = idx === ratesToUse.COMMODITY.length - 1;
                  return (
                    <div key={item.name} className={`flex items-center justify-between gap-2 ${isLast ? '' : 'pb-3 border-b border-dashed border-gray-150'}`}>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[12px] text-gray-800 tracking-wide">{item.name}</span>
                        <span className="font-['Outfit'] font-black text-[15px] text-gray-950 mt-0.5">{item.val}</span>
                      </div>
                      <svg className="w-12 h-6" viewBox="0 0 60 24">
                        {isUp ? (
                          <path d="M0 18 Q 15 5, 30 14 T 60 4" fill="none" stroke={color} strokeWidth="2.5" />
                        ) : (
                          <path d="M0 6 Q 20 18, 40 10 T 60 20" fill="none" stroke={color} strokeWidth="2.5" />
                        )}
                      </svg>
                      <div className="text-right">
                        <span style={{ color }} className="font-extrabold text-[12px] whitespace-nowrap">
                          {item.change} {isUp ? '↑' : '↓'}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {marketTab === 'CURRENCY' && ratesToUse.CURRENCY.map((item, idx) => {
                  const isUp = item.dir === 'up';
                  const color = isUp ? '#2e7d32' : '#c62828';
                  const isLast = idx === ratesToUse.CURRENCY.length - 1;
                  return (
                    <div key={item.name} className={`flex items-center justify-between gap-2 ${isLast ? '' : 'pb-3 border-b border-dashed border-gray-150'}`}>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[12px] text-gray-800 tracking-wide">{item.name}</span>
                        <span className="font-['Outfit'] font-black text-[15px] text-gray-950 mt-0.5">{item.val}</span>
                      </div>
                      <svg className="w-12 h-6" viewBox="0 0 60 24">
                        {isUp ? (
                          <path d="M0 18 Q 15 5, 30 14 T 60 4" fill="none" stroke={color} strokeWidth="2.5" />
                        ) : (
                          <path d="M0 6 Q 20 18, 40 10 T 60 20" fill="none" stroke={color} strokeWidth="2.5" />
                        )}
                      </svg>
                      <div className="text-right">
                        <span style={{ color }} className="font-extrabold text-[12px] whitespace-nowrap">
                          {item.change} {isUp ? '↑' : '↓'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ePaper Layout Widget */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between border-b-2 border-gray-100 pb-2.5 mb-4">
                <h3 className="font-['Outfit'] text-[17px] font-bold text-gray-955 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                    <path d="M18 14h-8M18 18h-8M16 6H10v4h6V6Z" />
                  </svg>
                  ePaper
                </h3>
                <div className="flex items-center gap-1.5">
                  {adminUser && adminUser.role === 'super_admin' && (
                    <button
                      onClick={() => {
                        localStorage.setItem('adminActiveTab', 'epaper');
                        setIsAdminMode(true);
                        window.history.pushState({}, '', '/admin');
                      }}
                      className="text-xs font-bold text-gray-550 hover:text-[#d32f2f] cursor-pointer"
                      title="Edit ePaper issues"
                    >
                      Edit
                    </button>
                  )}
                  <a href="#" className="text-xs font-bold text-[#d32f2f] hover:underline flex items-center gap-0.5">
                    View All
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                {/* Left Side: Newspaper Thumbnail */}
                <div
                  onClick={() => {
                    if (epaperToUse.pdf_path && epaperToUse.pdf_path !== '#') {
                      window.open(epaperToUse.pdf_path, '_blank');
                    } else {
                      alert('No ePaper issue available yet.');
                    }
                  }}
                  className="w-[105px] flex-shrink-0 bg-gray-50 rounded-lg p-1.5 border border-gray-200 shadow-sm flex justify-center group cursor-pointer"
                >
                  <img
                    src={epaperToUse.thumbnail_path}
                    alt={epaperToUse.title}
                    className="w-full h-auto shadow border border-gray-300 rounded transition-transform group-hover:-translate-y-0.5"
                  />
                </div>

                {/* Right Side: Action Info */}
                <div className="flex-grow flex flex-col gap-2.5 text-left">
                  <div className="text-[13px] font-black text-gray-800 leading-snug">
                    {epaperToUse.title}
                  </div>
                  <button
                    onClick={() => {
                      if (epaperToUse.pdf_path && epaperToUse.pdf_path !== '#') {
                        window.open(epaperToUse.pdf_path, '_blank');
                      } else {
                        alert('No ePaper issue available yet.');
                      }
                    }}
                    className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white w-full py-2 rounded-lg font-bold text-[12.5px] transition-colors cursor-pointer shadow-sm"
                  >
                    Read ePaper
                  </button>
                  <button
                    onClick={() => {
                      if (epaperToUse.pdf_path && epaperToUse.pdf_path !== '#') {
                        const link = document.createElement('a');
                        link.href = epaperToUse.pdf_path;
                        link.download = epaperToUse.title + '.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } else {
                        alert('No ePaper issue available yet.');
                      }
                    }}
                    className="border border-gray-350 bg-white text-gray-700 w-full py-2 rounded-lg font-semibold text-[12px] flex items-center justify-center gap-1.5 hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Download PDF
                  </button>
                </div>
              </div>
            </div>

            {/* WhatsApp Channel follow Widget */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[#25D366]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.498 1.45 5.42 1.451 5.56 0 10.084-4.522 10.088-10.082.002-2.693-1.04-5.225-2.936-7.124-1.895-1.899-4.417-2.946-7.11-2.948-5.568 0-10.093 4.52-10.097 10.081-.001 2.025.528 4.004 1.532 5.729l-.993 3.63 3.738-.98a10.024 10.024 0 0 0 5.358 1.442z" />
                  </svg>
                </div>
                <h4 className="text-[15px] font-extrabold text-gray-900">WhatsApp Channel</h4>
              </div>
              <div className="text-[13px] text-gray-650 font-medium mb-4">Get latest news on our WhatsApp Channel.</div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-3.5 gap-2">
                <button className="bg-[#25D366] hover:bg-green-600 text-white font-bold text-[12.5px] px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm">
                  Follow Channel
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <span className="block font-black text-[13px] text-gray-900 leading-none">{ratesToUse.whatsapp_followers}</span>
                    <span className="text-[9.5px] text-gray-500 font-bold">Followers</span>
                  </div>
                  {/* Overlapping Avatars */}
                  <div className="flex -space-x-2.5 overflow-hidden">
                    <img className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80" alt="Follower 1" />
                    <img className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80" alt="Follower 2" />
                    <img className="inline-block h-6.5 w-6.5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=80" alt="Follower 3" />
                  </div>
                </div>
              </div>
            </div>

          </aside>
        </main>
      </div>

      {/* ==========================================
         HIGHLIGHTS FOOTER BAR
         ========================================== */}
      <footer className="w-full bg-[#fdf5f5] border-t border-[#f8e5e5] py-5">
        <div className="w-full px-6 md:px-10 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">

          <div className="flex items-center gap-3.5 cursor-pointer hover:translate-x-0.5 transition-transform group">
            <div className="text-gray-900 flex-shrink-0 group-hover:text-[#d32f2f] transition-colors duration-200">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <circle cx="12" cy="5" r="2" />
                <path d="M12 7v4M8 15h.01M16 15h.01" strokeWidth="3" strokeLinecap="round" />
                <path d="M2 14h1M21 14h1" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[13px] text-gray-900 group-hover:text-[#d32f2f] transition-colors">AI News Summary</span>
              <span className="text-[11px] text-gray-500 mt-0.5 leading-snug">smart summary of top news.</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 cursor-pointer hover:translate-x-0.5 transition-transform group">
            <div className="text-gray-900 flex-shrink-0 group-hover:text-[#d32f2f] transition-colors duration-200">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v3M8 22h8" />
                <path d="M18 10h2M4 10h2" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[13px] text-gray-900 group-hover:text-[#d32f2f] transition-colors">Voice News</span>
              <span className="text-[11px] text-gray-500 mt-0.5 leading-snug">Listen to news in your language.</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 cursor-pointer hover:translate-x-0.5 transition-transform group">
            <div className="text-gray-900 flex-shrink-0 group-hover:text-[#d32f2f] transition-colors duration-200">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 11 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[13px] text-gray-900 group-hover:text-[#d32f2f] transition-colors">Fact Check</span>
              <span className="text-[11px] text-gray-500 mt-0.5 leading-snug">Check the truth of viral news.</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 cursor-pointer hover:translate-x-0.5 transition-transform group">
            <div className="text-gray-900 flex-shrink-0 group-hover:text-[#d32f2f] transition-colors duration-200">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[13px] text-gray-900 group-hover:text-[#d32f2f] transition-colors">Elections Results</span>
              <span className="text-[11px] text-gray-500 mt-0.5 leading-snug">Live election results.</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 cursor-pointer hover:translate-x-0.5 transition-transform group">
            <div className="text-gray-900 flex-shrink-0 group-hover:text-[#d32f2f] transition-colors duration-200">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="4" width="20" height="13" rx="2" />
                <path d="m9 20 3-3h0l3 3" />
                <polygon points="10 8 15 10.5 10 13" fill="currentColor" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[13px] text-gray-900 group-hover:text-[#d32f2f] transition-colors">Video News</span>
              <span className="text-[11px] text-gray-500 mt-0.5 leading-snug">Watch latest videos.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Reusable Premium Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop element (separated to avoid blurring child text/images) */}
          <div 
            className="absolute inset-0 bg-black/65 backdrop-blur-sm cursor-pointer"
            onClick={() => setActiveArticle(null)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative z-10 bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col border border-gray-150 animate-slideUp">
            
            {/* Header Image */}
            <div className="relative aspect-[16/9] w-full bg-gray-950 flex-shrink-0">
              <img 
                src={activeArticle.featured_image_path || '/viraat_ramayan_mandir.png'} 
                alt={activeArticle.title} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
              
              {/* Close Button */}
              <button 
                onClick={() => setActiveArticle(null)}
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/70 text-white rounded-full p-2.5 transition-all shadow-md cursor-pointer border border-white/20 flex items-center justify-center"
                title="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              
              <div className="absolute bottom-4 left-6 right-6 text-white text-left">
                <span className="bg-[#d32f2f] text-white text-[10.5px] font-black uppercase px-2.5 py-1.5 rounded tracking-wider shadow-md inline-block">
                  {activeArticle.category_name || 'General'}
                </span>
                <h2 className="font-['Outfit'] font-extrabold text-[22px] md:text-[26px] mt-2.5 leading-snug drop-shadow-md">
                  {activeArticle.title}
                </h2>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 flex-grow flex flex-col text-left">
              {/* Metadata Info */}
              <div className="flex items-center gap-3.5 text-xs text-gray-500 font-semibold border-b border-gray-100 pb-4 mb-5">
                <span>By <strong className="text-gray-800">{activeArticle.author_name || 'System'}</strong></span>
                <span>•</span>
                <span>Published {new Date(activeArticle.published_at || activeArticle.created_at).toLocaleDateString('en-GB')}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  activeArticle.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {activeArticle.status}
                </span>
              </div>

              {/* Text Content */}
              <div className="text-gray-750 text-[15px] leading-relaxed font-normal space-y-4 whitespace-pre-wrap select-text">
                {activeArticle.content}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <button className="text-gray-400 hover:text-[#d32f2f] transition-colors p-2 rounded-lg hover:bg-gray-100 cursor-pointer" title="Bookmark">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/>
                  </svg>
                </button>
                <button className="text-gray-400 hover:text-[#d32f2f] transition-colors p-2 rounded-lg hover:bg-gray-100 cursor-pointer" title="Share">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
                  </svg>
                </button>
              </div>
              <button 
                onClick={() => setActiveArticle(null)}
                className="bg-gray-800 hover:bg-gray-950 text-white font-bold text-[13px] px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Close Reader
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
