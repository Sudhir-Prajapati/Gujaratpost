import { useState, useEffect, useRef } from 'react';
import { marketsAPI, articlesAPI } from '../api';

function SettingsTab() {
  const [settings, setSettings] = useState({});
  const [articlesList, setArticlesList] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const settingsSuccessTimer = useRef(null);

  useEffect(() => {
    fetchSettings();
    fetchArticles();
  }, []);

  useEffect(() => {
    if (settingsSuccess) {
      clearTimeout(settingsSuccessTimer.current);
      settingsSuccessTimer.current = setTimeout(() => setSettingsSuccess(''), 5000);
    }
    return () => clearTimeout(settingsSuccessTimer.current);
  }, [settingsSuccess]);

  const fetchSettings = async () => {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const data = await marketsAPI.getSettings();
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

  const fetchArticles = async () => {
    try {
      const data = await articlesAPI.getAll('limit=100&status=published');
      if (data.success) {
        setArticlesList(data.data);
      }
    } catch (err) {
      console.error('Failed to load articles for settings:', err);
    }
  };

  const handleUpdateSettingField = (key, val) => {
    setSettings((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');
    try {
      const data = await marketsAPI.updateSettings(settings);
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

  return (
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
                <label className="block text-xs font-bold text-gray-655 uppercase mb-1">Metals-API Access Key</label>
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
                  {articlesList.map(a => (
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
                  {articlesList.map(a => (
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
                  {articlesList.map(a => (
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
                  {articlesList.map(a => (
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
                <label className="block text-xs font-bold text-gray-655 uppercase mb-1">Trending Label (English)</label>
                <input
                  type="text"
                  value={settings.trending_label_en || ''}
                  onChange={(e) => handleUpdateSettingField('trending_label_en', e.target.value)}
                  placeholder="e.g. Trending"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-655 uppercase mb-1">Trending Label (Gujarati)</label>
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
  );
}

export default SettingsTab;
