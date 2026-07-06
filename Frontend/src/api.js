import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

// Request interceptor to add authorization headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  getProfile: () => api.get('/api/auth/profile').then(res => res.data),
  login: (credentials) => api.post('/api/auth/login', credentials).then(res => res.data),
  logout: () => api.post('/api/auth/logout').then(res => res.data),
};

export const categoriesAPI = {
  getAll: () => api.get('/api/categories').then(res => res.data),
  create: (data) => api.post('/api/categories', data).then(res => res.data),
  update: (id, data) => api.put(`/api/categories/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/api/categories/${id}`).then(res => res.data),
};

export const articlesAPI = {
  getAll: (paramsString = '') => {
    const query = paramsString ? `?${paramsString}` : '';
    return api.get(`/api/articles${query}`).then(res => res.data);
  },
  getByIdOrSlug: (idOrSlug) => api.get(`/api/articles/${idOrSlug}`).then(res => res.data),
  create: (data) => api.post('/api/articles', data).then(res => res.data),
  update: (id, data) => api.put(`/api/articles/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/api/articles/${id}`).then(res => res.data),
  approve: (id) => api.put(`/api/articles/${id}/approve`).then(res => res.data),
  reject: (id, reason) => api.put(`/api/articles/${id}/reject`, reason).then(res => res.data),
  unpublish: (id) => api.put(`/api/articles/${id}/unpublish`).then(res => res.data),
  publish: (id) => api.put(`/api/articles/${id}/publish`).then(res => res.data),
};

export const liveUpdatesAPI = {
  getAll: () => api.get('/api/live-updates').then(res => res.data),
  create: (data) => api.post('/api/live-updates', data).then(res => res.data),
  update: (id, data) => api.put(`/api/live-updates/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/api/live-updates/${id}`).then(res => res.data),
};

export const epaperAPI = {
  getAll: () => api.get('/api/epaper').then(res => res.data),
  getLatest: () => api.get('/api/epaper/latest').then(res => res.data),
  create: (formData) => api.post('/api/epaper', formData).then(res => res.data),
  delete: (id) => api.delete(`/api/epaper/${id}`).then(res => res.data),
};

export const marketsAPI = {
  getSettings: () => api.get('/api/markets/settings').then(res => res.data),
  updateSettings: (data) => api.put('/api/markets/settings', data).then(res => res.data),
  getLiveRates: () => api.get('/api/markets/live-rates').then(res => res.data),
};

export const usersAPI = {
  getAll: (paramsString = '') => {
    const query = paramsString ? `?${paramsString}` : '';
    return api.get(`/api/users${query}`).then(res => res.data);
  },
  create: (data) => api.post('/api/users', data).then(res => res.data),
  update: (id, data) => api.put(`/api/users/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/api/users/${id}`).then(res => res.data),
};

export const uploadAPI = {
  image: (formData) => api.post('/api/upload/image', formData).then(res => res.data),
};
