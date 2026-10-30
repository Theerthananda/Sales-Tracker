import axios from 'axios';

// Use environment variable or default to production URL for better device compatibility
// Use environment variable
export const API_URL = import.meta.env.VITE_API_URL;
const BASE_URL = API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Important: Send cookies with requests
  timeout: 30000, // 30 second timeout for mobile networks
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not already on login page to prevent infinite loops
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  register: (userData) => api.post('/auth/register', userData)
};

export const salesAPI = {
  getAssignments: (id) => api.get(`/salesperson/${id}/assignments`),
  uploadPhoto: (formData) => api.post('/salesperson/upload-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateLocation: (location) => api.post('/salesperson/update-location', location),
  getMyRating: () => api.get('/salesperson/my-rating'),
  createAdhocVisitReport: (formData) => api.post('/salesperson/create-visit-report', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getSalespersonTracking: (id) => api.get(`/admin/salesperson/${id}/tracking`),
  assignLocation: (data) => api.post('/admin/assign-location', data),
  getLiveLocations: () => api.get('/admin/live-locations'),
  getAllSalespersons: () => api.get('/admin/salespersons'),
  geocodeAddress: (address) => api.post('/admin/geocode', { address }),
  // Salesperson management
  createSalesperson: (data) => api.post('/admin/salespersons', data),
  updateSalesperson: (id, data) => api.put(`/admin/salespersons/${id}`, data),
  deleteSalesperson: (id) => api.delete(`/admin/salespersons/${id}`),
  permanentDeleteSalesperson: (id) => api.delete(`/admin/salespersons/${id}/permanent`),
  reactivateSalesperson: (id) => api.patch(`/admin/salespersons/${id}/reactivate`),
  updateSalespersonRating: (id) => api.patch(`/admin/salespersons/${id}/rating`),
  getSalespersonsWithRatings: () => api.get('/admin/salespersons-with-ratings'),
  updateAllRatings: () => api.post('/admin/update-all-ratings')
};

export const visitReportsAPI = {
  getAllReports: () => api.get('/visit-reports/all'),
  getReportsBySalesperson: (salespersonId) => api.get(`/visit-reports/salesperson/${salespersonId}`),
  getReportById: (reportId) => api.get(`/visit-reports/${reportId}`),
  getStats: () => api.get('/visit-reports/stats'),
  exportToCSV: () => api.get('/visit-reports/export/csv', { responseType: 'blob' }),
  updateStatus: (reportId, data) => api.patch(`/visit-reports/${reportId}/status`, data),
  getMyReports: (params) => api.get('/visit-reports', { params })
};

export const expenseAPI = {
  createExpense: (formData) => api.post('/expenses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getSalespersonExpenses: (params) => api.get('/expenses/my-expenses', { params }),
  getAllExpenses: (params) => api.get('/expenses/all', { params }),
  updateExpenseStatus: (id, data) => api.patch(`/expenses/${id}/status`, data),
  getExpenseStats: (params) => api.get('/expenses/stats', { params }),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  notifyPendingExpense: (id) => api.post(`/expenses/${id}/notify-pending`),
  exportToExcel: (params) => api.get('/expenses/export', {
    params,
    responseType: 'blob'
  })
};

export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  deleteAllNotifications: () => api.delete('/notifications'),
  createNotification: (data) => api.post('/notifications', data)
};

export default api;
