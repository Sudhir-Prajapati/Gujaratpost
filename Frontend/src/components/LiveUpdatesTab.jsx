import { useState, useEffect, useRef } from 'react';
import { liveUpdatesAPI } from '../api';

function LiveUpdatesTab() {
  const [liveUpdatesList, setLiveUpdatesList] = useState([]);
  const [liveUpdatesLoading, setLiveUpdatesLoading] = useState(false);
  const [luTimeText, setLuTimeText] = useState('');
  const [luTitle, setLuTitle] = useState('');
  const [luIsAlert, setLuIsAlert] = useState(false);
  const [luYoutubeUrl, setLuYoutubeUrl] = useState('');
  const [luEditId, setLuEditId] = useState(null);
  const [luError, setLuError] = useState('');
  const [luSuccess, setLuSuccess] = useState('');

  const luSuccessTimer = useRef(null);

  useEffect(() => {
    fetchLiveUpdates();
  }, []);

  useEffect(() => {
    if (luSuccess) {
      clearTimeout(luSuccessTimer.current);
      luSuccessTimer.current = setTimeout(() => setLuSuccess(''), 5000);
    }
    return () => clearTimeout(luSuccessTimer.current);
  }, [luSuccess]);

  const fetchLiveUpdates = async () => {
    setLiveUpdatesLoading(true);
    setLuError('');
    try {
      const data = await liveUpdatesAPI.getAll();
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
      const payload = {
        time_text: luTimeText,
        title: luTitle,
        is_alert: luYoutubeUrl ? 1 : 0,
        youtube_url: luYoutubeUrl || ''
      };
      
      const data = luEditId 
        ? await liveUpdatesAPI.update(luEditId, payload)
        : await liveUpdatesAPI.create(payload);

      if (data.success) {
        setLuSuccess(luEditId ? 'Live update updated successfully.' : 'Live update created successfully.');
        setLuTimeText('');
        setLuTitle('');
        setLuIsAlert(false);
        setLuYoutubeUrl('');
        setLuEditId(null);
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
      const data = await liveUpdatesAPI.delete(id);
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

  return (
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
  );
}

export default LiveUpdatesTab;
