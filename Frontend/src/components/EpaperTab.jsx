import { useState, useEffect, useRef } from 'react';
import { epaperAPI } from '../api';

function EpaperTab() {
  const [epapersList, setEpapersList] = useState([]);
  const [epapersLoading, setEpapersLoading] = useState(false);
  const [epTitle, setEpTitle] = useState('');
  const [epPublishDate, setEpPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [epPdfFile, setEpPdfFile] = useState(null);
  const [epThumbFile, setEpThumbFile] = useState(null);
  const [epError, setEpError] = useState('');
  const [epSuccess, setEpSuccess] = useState('');

  const epSuccessTimer = useRef(null);

  useEffect(() => {
    fetchEpapers();
  }, []);

  useEffect(() => {
    if (epSuccess) {
      clearTimeout(epSuccessTimer.current);
      epSuccessTimer.current = setTimeout(() => setEpSuccess(''), 5000);
    }
    return () => clearTimeout(epSuccessTimer.current);
  }, [epSuccess]);

  const fetchEpapers = async () => {
    setEpapersLoading(true);
    setEpError('');
    try {
      const data = await epaperAPI.getAll();
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
      const data = await epaperAPI.create(formData);
      if (data.success) {
        setEpSuccess('ePaper issue published successfully!');
        setEpTitle('');
        setEpPdfFile(null);
        setEpThumbFile(null);
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
      const data = await epaperAPI.delete(id);
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

  return (
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
  );
}

export default EpaperTab;
