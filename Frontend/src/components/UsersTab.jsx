import { useState, useEffect, useRef } from 'react';
import { usersAPI } from '../api';

function UsersTab({ currentUser }) {
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usrEmail, setUsrEmail] = useState('');
  const [usrPassword, setUsrPassword] = useState('');
  const [usrRole, setUsrRole] = useState('editor');
  const [usrIsBlocked, setUsrIsBlocked] = useState(false);
  const [usrEditId, setUsrEditId] = useState(null);
  const [usrError, setUsrError] = useState('');
  const [usrSuccess, setUsrSuccess] = useState('');
  const [showUsrPassword, setShowUsrPassword] = useState(false);

  const usrSuccessTimer = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (usrSuccess) {
      clearTimeout(usrSuccessTimer.current);
      usrSuccessTimer.current = setTimeout(() => setUsrSuccess(''), 5000);
    }
    return () => clearTimeout(usrSuccessTimer.current);
  }, [usrSuccess]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsrError('');
    try {
      const data = await usersAPI.getAll();
      if (data.success) {
        setUsersList(data.data);
      } else {
        setUsrError(data.message || 'Failed to load users.');
      }
    } catch (err) {
      setUsrError('Failed to connect to API.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUsrError('');
    setUsrSuccess('');

    if (!usrEmail) {
      setUsrError('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usrEmail)) {
      setUsrError('Please enter a valid email address.');
      return;
    }

    if (!usrEditId && !usrPassword) {
      setUsrError('Password is required for new users.');
      return;
    }

    if (usrPassword) {
      const hasUpper = /[A-Z]/.test(usrPassword);
      const hasLower = /[a-z]/.test(usrPassword);
      const hasDigit = /[0-9]/.test(usrPassword);
      const hasSpecial = /[^A-Za-z0-9]/.test(usrPassword);
      
      if (usrPassword.length < 8 || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        setUsrError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one unique character.');
        return;
      }
    }

    try {
      const payload = {
        username: usrEmail,
        email: usrEmail,
        role: usrRole,
        is_blocked: usrIsBlocked ? 1 : 0
      };

      if (usrPassword) {
        payload.password = usrPassword;
      }

      const data = usrEditId
        ? await usersAPI.update(usrEditId, payload)
        : await usersAPI.create(payload);

      if (data.success) {
        setUsrSuccess(usrEditId ? 'User updated successfully.' : 'User created successfully.');
        setUsrEmail('');
        setUsrPassword('');
        setUsrRole('editor');
        setUsrIsBlocked(false);
        setUsrEditId(null);
        fetchUsers();
      } else {
        setUsrError(data.message || 'Failed to save user.');
      }
    } catch (err) {
      setUsrError('Connection error occurred.');
    }
  };

  const handleEditUserClick = (item) => {
    setUsrEditId(item.id);
    setUsrEmail(item.email);
    setUsrPassword('');
    setUsrRole(item.role === 'user' ? 'editor' : (item.role || 'editor'));
    setUsrIsBlocked(item.is_blocked === 1 || item.is_blocked === true);
    setUsrError('');
    setUsrSuccess('');
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser.id) {
      alert('You cannot delete your own logged in account.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setUsrError('');
    setUsrSuccess('');
    try {
      const data = await usersAPI.delete(id);
      if (data.success) {
        setUsrSuccess('User deleted successfully.');
        fetchUsers();
      } else {
        setUsrError(data.message || 'Failed to delete user.');
      }
    } catch (err) {
      setUsrError('Connection error occurred.');
    }
  };

  const getRoleDisplayName = (r) => {
    if (!r) return 'User';
    return r.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start text-left animate-fadeIn">
      {/* Form Column */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-['Outfit'] font-bold text-[18px] text-gray-900 mb-4 pb-2 border-b border-gray-100">
          {usrEditId ? 'Edit Role User' : 'Add Role User'}
        </h3>
        
        <form onSubmit={handleSaveUser} className="space-y-4">
          {usrError && <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200">{usrError}</div>}
          {usrSuccess && <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200">{usrSuccess}</div>}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Address</label>
            <input
              type="email"
              required
              value={usrEmail}
              onChange={(e) => setUsrEmail(e.target.value)}
              placeholder="e.g. jane@gujaratpost.com"
              className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-555 uppercase mb-1">
              Password {usrEditId && <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <input
                type={showUsrPassword ? "text" : "password"}
                required={!usrEditId}
                value={usrPassword}
                onChange={(e) => setUsrPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-gray-300 rounded-lg pl-3.5 pr-10 py-2.5 text-[14px] text-gray-800 focus:outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={() => setShowUsrPassword(!showUsrPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showUsrPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-555 uppercase mb-1">Assign System Role</label>
            <select
              value={usrRole}
              onChange={(e) => setUsrRole(e.target.value)}
              disabled={usrEditId === currentUser.id}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-[13.5px] font-bold text-gray-750 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="super_admin">Super Admin</option>
              <option value="editor">Editor (Normal Admin)</option>
              <option value="reporter">Reporter</option>
              <option value="seo">SEO Manager</option>
              <option value="advertisement">Advertisement</option>
              <option value="photographer">Photographer</option>
            </select>
            {usrEditId === currentUser.id && (
              <span className="text-[11px] text-gray-400 mt-1 block">You cannot demote or change your own logged-in role.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 py-2">
            <input
              type="checkbox"
              id="usr-is-blocked"
              checked={usrIsBlocked}
              disabled={usrEditId === currentUser.id}
              onChange={(e) => setUsrIsBlocked(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-gray-300 text-red-650 focus:ring-red-500"
            />
            <label htmlFor="usr-is-blocked" className="text-sm font-bold text-gray-700 cursor-pointer">
              Deactivate / Block User Account?
            </label>
          </div>
          {usrEditId === currentUser.id && (
            <span className="text-[11px] text-gray-400 block -mt-1">You cannot block your own active super admin account.</span>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              className="flex-grow bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer shadow-sm"
            >
              {usrEditId ? 'Save Changes' : 'Create User'}
            </button>
            {usrEditId && (
              <button
                type="button"
                onClick={() => {
                  setUsrEditId(null);
                  setUsrEmail('');
                  setUsrPassword('');
                  setUsrRole('editor');
                  setUsrIsBlocked(false);
                }}
                className="bg-gray-150 hover:bg-gray-200 text-gray-750 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors cursor-pointer"
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
          Current Role Accounts List
        </h3>

        {usersLoading ? (
          <div className="py-12 flex justify-center items-center">
            <svg className="animate-spin h-8 w-8 text-[#d32f2f]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-gray-200 text-gray-555 font-bold uppercase text-[11px] tracking-wider text-left bg-gray-50">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {usersList.filter(item => item.role !== 'user').map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 text-[10px] rounded font-extrabold uppercase ${
                        item.role === 'super_admin' ? 'bg-purple-100 text-purple-750' :
                        item.role === 'editor' ? 'bg-blue-100 text-blue-750' :
                        item.role === 'reporter' ? 'bg-amber-100 text-amber-800' :
                        item.role === 'seo' ? 'bg-teal-100 text-teal-800' :
                        item.role === 'advertisement' ? 'bg-pink-100 text-pink-700' :
                        item.role === 'photographer' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-gray-100 text-gray-650'
                      }`}>
                        {getRoleDisplayName(item.role)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-600">{item.email}</td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {item.is_blocked ? (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold bg-red-100 text-red-700 rounded-md uppercase">Blocked</span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-extrabold bg-green-100 text-green-700 rounded-md uppercase">Active</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2.5 whitespace-nowrap font-bold">
                      <button
                        onClick={() => handleEditUserClick(item)}
                        className="text-indigo-650 hover:text-indigo-900 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(item.id)}
                        disabled={item.id === currentUser.id}
                        className={`font-bold cursor-pointer ${
                          item.id === currentUser.id 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-red-655 hover:text-red-900'
                        }`}
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

export default UsersTab;
