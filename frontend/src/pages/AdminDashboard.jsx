import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';
import Navbar from '../components/Navbar';
import ActiveSalespersons from '../components/ActiveSalespersons';
import { Users, Briefcase, CheckCircle, AlertTriangle, Eye, FileText, DollarSign, UserPlus, MapPin, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifications } from '../contexts/NotificationContext';

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { showInfo, requestNotificationPermission, notifications, unreadCount } = useNotifications();

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

    const fetchData = async () => {
      try {
        const [overviewRes, salespersonsRes] = await Promise.all([
          adminAPI.getOverview(),
          adminAPI.getAllSalespersons()
        ]);

        setOverview(overviewRes.data);
        
        // Handle different response formats and filter out inactive users
        if (salespersonsRes.data.success) {
          const activeSalespersons = (salespersonsRes.data.data || []).filter(sp => sp.isActive !== false);
          setSalespersons(activeSalespersons);
        } else if (Array.isArray(salespersonsRes.data)) {
          setSalespersons([]);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Request notification permission and show welcome message
    requestNotificationPermission();
    showInfo(`Welcome back, Admin ${parsedUser.name}! Monitor your team's activities below.`, 6000);
  }, [navigate, requestNotificationPermission, showInfo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">Monitor and manage all salesperson activities</p>
        </motion.div>

        {/* Stats Grid */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Salespersons</p>
                  <p className="text-3xl font-bold text-slate-800">{overview.totalSalespersons}</p>
                </div>
                <Users className="w-12 h-12 text-green-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Assignments</p>
                  <p className="text-3xl font-bold text-slate-800">{overview.totalAssignments}</p>
                </div>
                <Briefcase className="w-12 h-12 text-blue-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Visits</p>
                  <p className="text-3xl font-bold text-green-600">{overview.totalVisits} / {overview.totalPlaces}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Suspicious Uploads</p>
                  <p className="text-3xl font-bold text-red-600">{overview.suspiciousUploads}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
            </motion.div>

            {/* Notifications Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Unread Notifications</p>
                  <p className="text-3xl font-bold text-orange-600">{unreadCount}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {notifications.length} total notifications
                  </p>
                </div>
                <Bell className="w-12 h-12 text-orange-400" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Quick Actions - Redesigned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Quick Actions</h2>
          
          {/* Main Actions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
            {/* Visit Reports Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="group relative overflow-hidden bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-white bg-opacity-20 rounded-lg p-2.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <Eye className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <h3 className="text-lg font-bold mb-1">Visit Reports</h3>
                <p className="text-green-50 mb-3 text-xs leading-tight">
                  Access sales visit reports and download files
                </p>
                
                <button
                  onClick={() => navigate('/admin/visit-reports')}
                  className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center gap-1.5 group-hover:scale-105 transform transition-transform text-xs"
                >
                  View Reports
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>

            {/* Expense Reports Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="group relative overflow-hidden bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-white bg-opacity-20 rounded-lg p-2.5">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <CheckCircle className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <h3 className="text-lg font-bold mb-1">Expense Reports</h3>
                <p className="text-blue-50 mb-3 text-xs leading-tight">
                  Review and approve expense submissions
                </p>
                
                <button
                  onClick={() => navigate('/admin/expense-reports')}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-1.5 group-hover:scale-105 transform transition-transform text-xs"
                >
                  Review Expenses
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>

            {/* Salesperson Management Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="group relative overflow-hidden bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-white bg-opacity-20 rounded-lg p-2.5">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <Users className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <h3 className="text-lg font-bold mb-1">Manage Team</h3>
                <p className="text-purple-50 mb-3 text-xs leading-tight">
                  Manage sales team with ratings and analytics
                </p>
                
                <button
                  onClick={() => navigate('/admin/salesperson-management')}
                  className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-1.5 group-hover:scale-105 transform transition-transform text-xs"
                >
                  Manage Team
                  <Users className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/admin/map')}
              className="bg-white border-2 border-slate-200 rounded-lg p-3 hover:border-slate-300 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="bg-slate-100 rounded-lg p-2 group-hover:bg-slate-200 transition-colors">
                  <MapPin className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Live Map</h4>
                  <p className="text-[10px] text-slate-600 mt-0.5">Track team</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/admin/assign')}
              className="bg-white border-2 border-slate-200 rounded-lg p-3 hover:border-slate-300 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="bg-slate-100 rounded-lg p-2 group-hover:bg-slate-200 transition-colors">
                  <Briefcase className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Assign Tasks</h4>
                  <p className="text-[10px] text-slate-600 mt-0.5">New tasks</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => navigate('/notifications')}
              whileHover={{ scale: 1.05 }}
              className="bg-white border-2 border-slate-200 rounded-lg p-3 hover:border-slate-300 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="bg-slate-100 rounded-lg p-2 group-hover:bg-slate-200 transition-colors">
                  <AlertTriangle className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Alerts</h4>
                  <p className="text-[10px] text-slate-600 mt-0.5">Notifications</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              className="bg-white border-2 border-slate-200 rounded-lg p-3 hover:border-slate-300 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="bg-slate-100 rounded-lg p-2 group-hover:bg-slate-200 transition-colors">
                  <CheckCircle className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Analytics</h4>
                  <p className="text-[10px] text-slate-600 mt-0.5">Reports</p>
                </div>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Active Salespersons Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <ActiveSalespersons />
        </motion.div>

        {/* Salespersons Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users className="w-7 h-7 text-green-400" />
            Salespersons Management
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Last Login</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Last Active</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Location</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salespersons && salespersons.length > 0 ? salespersons.map((sp) => (
                  <tr key={sp._id || sp.id || Math.random()} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-800">{sp.name || 'Unknown'}</td>
                    <td className="py-4 px-4 text-slate-600">{sp.email || 'No email'}</td>
                    <td className="py-4 px-4 text-slate-600">
                      {sp.lastLoginAt ? new Date(sp.lastLoginAt).toLocaleString() : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {sp.lastActive ? new Date(sp.lastActive).toLocaleString() : (
                        <span className="text-red-500">Never</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {sp.currentLocation?.lat ? (
                        <span className="text-green-600 font-medium">
                          {sp.currentLocation.lat.toFixed(4)}, {sp.currentLocation.lng.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-gray-400">Unknown</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => navigate(`/admin/tracking/${sp._id || sp.id}`)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="py-8 px-4 text-center text-gray-500">
                      No salespersons found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default AdminDashboard;
