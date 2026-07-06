import { useState, useEffect, useRef } from 'react';
import { categoriesAPI } from '../api';

function CategoriesTab({ isLocation }) {
  const [categoriesList, setCategoriesList] = useState([]);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catEditId, setCatEditId] = useState(null);
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');

  const catSuccessTimer = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Reset form when switching between locations and general categories
    setCatEditId(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatError('');
    setCatSuccess('');
    fetchCategories();
  }, [isLocation]);

  useEffect(() => {
    if (catSuccess) {
      clearTimeout(catSuccessTimer.current);
      catSuccessTimer.current = setTimeout(() => setCatSuccess(''), 5000);
    }
    return () => clearTimeout(catSuccessTimer.current);
  }, [catSuccess]);

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

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    setCatSuccess('');

    if (!catName) {
      setCatError('Category/Location name is required.');
      return;
    }

    try {
      const payload = {
        name: catName,
        slug: catSlug || undefined,
        description: catDesc || undefined,
        is_location: isLocation ? 1 : 0
      };

      const data = catEditId
        ? await categoriesAPI.update(catEditId, payload)
        : await categoriesAPI.create(payload);

      if (data.success) {
        setCatSuccess(catEditId ? 'Location/Category updated successfully.' : 'Location/Category created successfully.');
        setCatName('');
        setCatSlug('');
        setCatDesc('');
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
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category/location?')) return;
    setCatError('');
    setCatSuccess('');
    try {
      const data = await categoriesAPI.delete(id);
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

  const filteredList = categoriesList.filter(item => {
    const isLoc = item.is_location === 1 || item.is_location === true;
    return isLocation ? isLoc : !isLoc;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start text-left animate-fadeIn">
      {/* Form Column */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900 mb-4 pb-2 border-b border-gray-100">
          {catEditId 
            ? (isLocation ? 'Edit State / City (Location)' : 'Edit Topic Category')
            : (isLocation ? 'Add State / City (Location)' : 'Add Topic Category')
          }
        </h3>
        
        <form onSubmit={handleSaveCategory} className="space-y-4">
          {catError && <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">{catError}</div>}
          {catSuccess && <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200">{catSuccess}</div>}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              {isLocation ? 'State / City Name' : 'Category Name'}
            </label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder={isLocation ? "e.g. Ahmedabad, Surat, Rajkot" : "e.g. Sports, Business, Entertainment"}
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug (Optional)</label>
            <input
              type="text"
              value={catSlug}
              onChange={(e) => setCatSlug(e.target.value)}
              placeholder={isLocation ? "e.g. ahmedabad, surat (auto-generated if empty)" : "e.g. sports, business (auto-generated if empty)"}
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-550 uppercase mb-1">Description (Optional)</label>
            <textarea
              rows="2"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder={isLocation ? "Brief description of the city news coverage..." : "Brief description of the category..."}
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[13.5px] text-gray-800 focus:outline-none focus:border-red-500"
            ></textarea>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              className="flex-grow bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer shadow-sm"
            >
              {catEditId 
                ? 'Save Changes' 
                : (isLocation ? 'Create Location' : 'Create Category')
              }
            </button>
            {catEditId && (
              <button
                type="button"
                onClick={() => {
                  setCatEditId(null);
                  setCatName('');
                  setCatSlug('');
                  setCatDesc('');
                }}
                className="bg-gray-150 hover:bg-gray-200 text-gray-770 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer"
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
          {isLocation ? 'States & Cities (Locations)' : 'Topic Categories (General)'}
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
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-gray-800 whitespace-nowrap">{item.name}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-650">{item.slug}</td>
                  <td className="py-3.5 px-4 font-medium text-gray-500 max-w-[220px] truncate">
                    {item.description || <span className="text-gray-300">-</span>}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center justify-center min-w-[28px] h-[22px] px-2 rounded-full text-[11px] font-bold ${
                      item.article_count > 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-404'
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
                      className="text-red-655 hover:text-red-900 font-bold cursor-pointer"
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
  );
}

export default CategoriesTab;
