import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI, expenseAPI, API_URL } from '../api';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import { User, Mail, Clock, Briefcase, Camera, MapPin, ArrowLeft, Calendar, CheckCircle, XCircle, AlertCircle, Navigation, DollarSign, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';



function SalespersonTracking() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expenseStats, setExpenseStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [user, setUser] = useState(null);
  const [activityTypeFilter, setActivityTypeFilter] = useState('all');
  const [activityRangeFilter, setActivityRangeFilter] = useState('all');
  const [selectedBillPhoto, setSelectedBillPhoto] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (parsedUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    fetchData();

    // Set up auto-refresh for expense data every 30 seconds
    const interval = setInterval(() => {
      fetchExpenseData();
    }, 30000);
    
    setRefreshInterval(interval);

    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [id, navigate]);

  const fetchData = async () => {
    try {
      const [trackingResponse, expensesResponse, statsResponse] = await Promise.all([
        adminAPI.getSalespersonTracking(id),
        expenseAPI.getAllExpenses({ salespersonId: id, limit: 10 }),
        expenseAPI.getExpenseStats({ salespersonId: id })
      ]);

      setData(trackingResponse.data);
      
      if (expensesResponse.data.success) {
        setExpenses(expensesResponse.data.data);
      }
      
      if (statsResponse.data.success) {
        setExpenseStats(statsResponse.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseData = async () => {
    try {
      console.log('Fetching expense data for salesperson ID:', id);
      
      const [expensesResponse, statsResponse] = await Promise.all([
        expenseAPI.getAllExpenses({ salespersonId: id, limit: 10 }),
        expenseAPI.getExpenseStats({ salespersonId: id })
      ]);
      
      console.log('Expenses response:', expensesResponse.data);
      console.log('Stats response:', statsResponse.data);
      
      if (expensesResponse.data.success) {
        setExpenses(expensesResponse.data.data);
        console.log('Set expenses:', expensesResponse.data.data);
      } else {
        console.error('Expenses API returned error:', expensesResponse.data.message);
      }
      
      if (statsResponse.data.success) {
        setExpenseStats(statsResponse.data.data);
        console.log('Set expense stats:', statsResponse.data.data);
      } else {
        console.error('Stats API returned error:', statsResponse.data.message);
      }
    } catch (err) {
      console.error('Failed to fetch expense data:', err);
      console.error('Error details:', err.response?.data);
    }
  };

  const handleRefreshExpenses = () => {
    fetchExpenseData();
  };

  const handleDownloadExpenseExcel = async () => {
    try {
      setExpenseLoading(true);
      const response = await expenseAPI.exportToExcel({ salespersonId: id });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${data?.salesperson?.name || 'salesperson'}-expenses.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download expense Excel:', err);
    } finally {
      setExpenseLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getFilteredLoginActivities = () => {
    if (!data || !Array.isArray(data.loginActivities)) {
      return [];
    }

    const now = new Date();

    return data.loginActivities.filter((activity) => {
      if (activityTypeFilter !== 'all' && activity.type !== activityTypeFilter) {
        return false;
      }

      if (activityRangeFilter === 'all') {
        return true;
      }

      if (!activity.timestamp) {
        return false;
      }

      const ts = new Date(activity.timestamp);

      if (activityRangeFilter === 'today') {
        return ts.toDateString() === now.toDateString();
      }

      const diffMs = now - ts;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (activityRangeFilter === '7d') {
        return diffDays <= 7;
      }

      if (activityRangeFilter === '30d') {
        return diffDays <= 30;
      }

      return true;
    });
  };

  const handleDownloadLoginCSV = () => {
    const activities = getFilteredLoginActivities();

    if (!activities.length) {
      return;
    }

    const rows = [
      ['Type', 'Timestamp', 'IP Address', 'User Agent'],
      ...activities.map((activity) => [
        activity.type || '',
        activity.timestamp ? new Date(activity.timestamp).toISOString() : '',
        activity.ipAddress || '',
        activity.userAgent || ''
      ])
    ];

    const csvContent = rows
      .map((row) =>
        row
          .map((field) => {
            if (field === null || field === undefined) return '';
            const value = String(field);
            if (value.includes('"') || value.includes(',') || value.includes('\n')) {
              return '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
          })
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${data.salesperson.name || 'salesperson'}-login-activity.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">No data found</p>
      </div>
    );
  }

  const filteredLoginActivities = getFilteredLoginActivities();

  const selectedBillPhotoUrl = selectedBillPhoto ? `${API_URL}${selectedBillPhoto}` : null;

  const allPlaces = data.assignments.flatMap(a => a.places);

  // Calculate statistics
  const totalTasks = allPlaces.length;
  const completedTasks = allPlaces.filter(p => p.visited && p.verified).length;
  const pendingTasks = allPlaces.filter(p => !p.visited).length;
  const suspiciousTasks = allPlaces.filter(p => p.visited && !p.verified).length;
  
  // Calculate total distance traveled (in km)
  const totalDistance = data.assignments.reduce((sum, assignment) => {
    return sum + (assignment.totalDistance || 0);
  }, 0) / 1000;
  
  // Calculate travel cost (assuming ₹10 per km)
  const costPerKm = 10;
  const totalTravelCost = totalDistance * costPerKm;

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <User className="w-10 h-10 text-green-400" />
            {data.salesperson.name}
          </h1>
          <p className="text-slate-600">Detailed tracking and activity history</p>
        </motion.div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-slate-600">Email</p>
                <p className="text-sm font-semibold text-slate-800">{data.salesperson.email}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-400" />
              <div>
                <p className="text-sm font-medium text-slate-600">Last Active</p>
                <p className="text-sm font-semibold text-slate-800">
                  {data.salesperson.lastActive ? new Date(data.salesperson.lastActive).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Login & Logout Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-7 h-7 text-green-400" />
              Login & Logout Activity
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={activityTypeFilter}
                onChange={(e) => setActivityTypeFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1 text-sm text-slate-700 bg-white"
              >
                <option value="all">All Types</option>
                <option value="login">Logins</option>
                <option value="logout">Logouts</option>
              </select>
              <select
                value={activityRangeFilter}
                onChange={(e) => setActivityRangeFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1 text-sm text-slate-700 bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <button
                onClick={handleDownloadLoginCSV}
                disabled={!filteredLoginActivities.length}
                className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download CSV
              </button>
            </div>
          </div>
          {Array.isArray(data.loginActivities) && data.loginActivities.length > 0 ? (
            filteredLoginActivities.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {filteredLoginActivities.map((activity) => (
                  <div
                    key={activity._id || activity.timestamp}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                          activity.type === 'login' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      >
                        {activity.type === 'login' ? 'IN' : 'OUT'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 capitalize">
                          {activity.type === 'login' ? 'Login' : 'Logout'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown time'}
                        </p>
                        {activity.locationName && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span className="line-clamp-1">{activity.locationName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500 max-w-xs">
                      {activity.ipAddress && (
                        <p className="mb-1">IP: {activity.ipAddress}</p>
                      )}
                      {activity.userAgent && (
                        <p className="truncate">Device: {activity.userAgent}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No activity for selected filters.</p>
            )
          ) : (
            <p className="text-sm text-slate-500">No login activity recorded yet.</p>
          )}
        </motion.div>

        {/* Task Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100">
            <div className="text-center">
              <Briefcase className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{totalTasks}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Total Tasks</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card bg-gradient-to-br from-green-50 to-white border-2 border-green-100">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Completed</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card bg-gradient-to-br from-red-50 to-white border-2 border-red-100">
            <div className="text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{pendingTasks}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Pending</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-100">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{suspiciousTasks}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Suspicious</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100">
            <div className="text-center">
              <Navigation className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{totalDistance.toFixed(1)}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">KM Traveled</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-100">
            <div className="text-center">
              <DollarSign className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-600">₹{totalTravelCost.toFixed(0)}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">Travel Cost</p>
            </div>
          </motion.div>
        </div>

        {/* Map */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card mb-8 p-0 overflow-hidden relative z-0">
          <div className="h-96 relative z-0">
            <MapComponent 
              places={allPlaces} 
              currentLocation={data.salesperson.currentLocation} 
              center={data.salesperson.currentLocation || [20.5937, 78.9629]} 
              zoom={6} 
            />
          </div>
        </motion.div>

        {/* Recent Photos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Camera className="w-7 h-7 text-green-400" />
            Recent Photos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.photos.map((photo) => (
              <div key={photo._id} className="bg-gray-50 rounded-xl overflow-hidden">
                <img 
                  src={`${API_URL}${photo.photoUrl}`} 
                  alt="Upload" 
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 space-y-2">
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(photo.timestamp).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {photo.lat.toFixed(4)}, {photo.lng.toFixed(4)}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    Distance: {photo.distanceFromTarget.toFixed(2)}m
                  </p>
                  {photo.isSuspicious && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-semibold">
                      ⚠️ Suspicious
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Expense Reports Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.65 }} 
          className="card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
              Expense Reports
            </h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={handleRefreshExpenses}
                disabled={expenseLoading}
                className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                title="Refresh expense data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleDownloadExpenseExcel}
                disabled={expenseLoading || expenses.length === 0}
                className="btn-gradient flex items-center justify-center gap-2 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {expenseLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download Excel</span>
                    <span className="sm:hidden">Excel</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Expense Stats */}
          {expenseStats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">Total Expenses</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-800">{expenseStats.overall?.count || 0}</p>
                    <p className="text-xs sm:text-sm text-blue-600">{formatAmount(expenseStats.overall?.totalAmount || 0)}</p>
                  </div>
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mt-2 sm:mt-0" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 sm:p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-yellow-600 mb-1">Pending</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-800">{expenseStats.pending?.count || 0}</p>
                    <p className="text-xs sm:text-sm text-yellow-600">{formatAmount(expenseStats.pending?.totalAmount || 0)}</p>
                  </div>
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mt-2 sm:mt-0" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 sm:p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-green-600 mb-1">Approved</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-800">{expenseStats.approved?.count || 0}</p>
                    <p className="text-xs sm:text-sm text-green-600">{formatAmount(expenseStats.approved?.totalAmount || 0)}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mt-2 sm:mt-0" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 sm:p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-red-600 mb-1">Rejected</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-800">{expenseStats.rejected?.count || 0}</p>
                    <p className="text-xs sm:text-sm text-red-600">{formatAmount(expenseStats.rejected?.totalAmount || 0)}</p>
                  </div>
                  <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 mt-2 sm:mt-0" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">Total Expenses</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-800">0</p>
                    <p className="text-xs sm:text-sm text-blue-600">₹0.00</p>
                  </div>
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mt-2 sm:mt-0" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 sm:p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-yellow-600 mb-1">Pending</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-800">0</p>
                    <p className="text-xs sm:text-sm text-yellow-600">₹0.00</p>
                  </div>
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mt-2 sm:mt-0" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 sm:p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-green-600 mb-1">Approved</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-800">0</p>
                    <p className="text-xs sm:text-sm text-green-600">₹0.00</p>
                  </div>
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mt-2 sm:mt-0" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-red-100 p-3 sm:p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-red-600 mb-1">Rejected</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-800">0</p>
                    <p className="text-xs sm:text-sm text-red-600">₹0.00</p>
                  </div>
                  <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 mt-2 sm:mt-0" />
                </div>
              </div>
            </div>
          )}

          {/* Recent Expenses */}
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">Recent Expenses</h4>
            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm sm:text-base">No expenses submitted yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense, index) => (
                  <div key={expense._id} className="bg-gray-50 rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                            {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-500">
                            {new Date(expense.date).toLocaleDateString('en-US')}
                          </span>
                        </div>
                        <h5 className="font-semibold text-slate-800 capitalize mb-1 text-sm sm:text-base">{expense.category}</h5>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{expense.description}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                          <span className="font-semibold text-slate-800">{formatAmount(expense.amount)}</span>
                          <span className="hidden sm:inline">Submitted: {new Date(expense.submittedAt).toLocaleDateString('en-US')}</span>
                          <span className="sm:hidden">Submitted: {new Date(expense.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          {expense.billPhoto && (
                            <span className="text-blue-600 flex items-center gap-1">
                              <span className="hidden sm:inline">📎 Bill Attached</span>
                              <span className="sm:hidden">📎</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {expense.billPhoto && (
                        <button
                          onClick={() => setSelectedBillPhoto(expense.billPhoto)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors self-start sm:self-center"
                          title="View Bill Photo"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {expense.adminNotes && (
                      <div className="mt-3 p-3 bg-white rounded-lg border-l-4 border-blue-400">
                        <p className="text-xs sm:text-sm text-gray-600">
                          <strong>Admin Notes:</strong> {expense.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                
                {expenses.length >= 10 && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => navigate('/admin/expense-reports', { state: { salespersonId: id } })}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
                    >
                      View All Expenses →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Assignment History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-green-400" />
            Assignment History
          </h3>
          <div className="space-y-8">
            {data.assignments.map((assignment) => (
              <div key={assignment._id}>
                <h4 className="text-lg font-bold text-green-600 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {new Date(assignment.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                <div className="overflow-x-auto">
                  <div className="space-y-4">
                    {assignment.places.map((place) => (
                      <div key={place._id} className="bg-gradient-to-r from-slate-50 to-white p-4 rounded-xl border-2 border-slate-100 hover:border-green-200 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <h5 className="font-bold text-slate-800 text-lg mb-2">{place.name}</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-slate-600">
                                <MapPin className="w-4 h-4" />
                                <span>{place.lat.toFixed(4)}, {place.lng.toFixed(4)}</span>
                              </div>
                              {place.visitedAt && (
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Clock className="w-4 h-4" />
                                  <span>{new Date(place.visitedAt).toLocaleString()}</span>
                                </div>
                              )}
                              {place.distanceTraveled > 0 && (
                                <div className="flex items-center gap-2 text-purple-600">
                                  <Navigation className="w-4 h-4" />
                                  <span className="font-semibold">{(place.distanceTraveled / 1000).toFixed(2)} km</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {place.visited ? (
                              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${
                                place.verified 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {place.verified ? 'Verified' : 'Suspicious'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-red-100 text-red-700 whitespace-nowrap">
                                ❌ Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {selectedBillPhotoUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">Bill Photo</h3>
                <button
                  onClick={() => setSelectedBillPhoto(null)}
                  className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="p-4 bg-slate-50 flex items-center justify-center">
                <img
                  src={selectedBillPhotoUrl}
                  alt="Bill"
                  className="w-full max-h-[80vh] object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SalespersonTracking;
