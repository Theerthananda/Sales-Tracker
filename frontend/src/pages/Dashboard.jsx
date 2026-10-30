import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesAPI, adminAPI, visitReportsAPI } from '../api';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import { MapPin, CheckCircle, Clock, Briefcase, Camera, DollarSign, FileText, Plus, Star, StarHalf, RefreshCw, Bell, AlertCircle, FilePlus2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../contexts/NotificationContext';
import VisitReportForm from '../components/VisitReportForm';

function Dashboard() {
  const [assignments, setAssignments] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [userStats, setUserStats] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [recentVisits, setRecentVisits] = useState([]);
  const [showAdhocVisitModal, setShowAdhocVisitModal] = useState(false);
  const navigate = useNavigate();
  const { showInfo, requestNotificationPermission, notifications } = useNotifications();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (parsedUser.role === 'admin') {
      navigate('/admin/dashboard');
      return;
    }

    fetchAssignments(parsedUser.id);
    fetchUserRating(parsedUser.id);
    getCurrentLocation();
    fetchRecentVisits();

    // Request notification permission and show welcome message
    requestNotificationPermission();
    showInfo(`Welcome back, ${parsedUser.name}! Check your assignments below.`, 6000);

    // Set up periodic rating refresh every 30 seconds
    const ratingInterval = setInterval(() => {
      fetchUserRating(parsedUser.id);
    }, 30000);

    // Cleanup interval on unmount
    return () => {
      if (ratingInterval) {
        clearInterval(ratingInterval);
      }
    };
  }, [navigate]);

  const fetchUserRating = async (userId, showLoading = false) => {
    try {
      if (showLoading) setRatingLoading(true);
      
      console.log('Fetching rating for user ID:', userId);
      
      // Use the proper salesperson API endpoint
      const response = await salesAPI.getMyRating();
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        const userData = response.data.data;
        console.log('User data:', userData);
        
        setUserRating(userData.rating || 0);
        setUserStats(userData.performanceStats || null);
        console.log('Set rating to:', userData.rating || 0);
        console.log('Set stats to:', userData.performanceStats);
      } else {
        console.log('API returned error:', response.data.message);
        setUserRating(0);
        setUserStats(null);
      }
    } catch (err) {
      console.error('Failed to fetch user rating:', err);
      // Fallback: try admin API if salesperson API fails (for backward compatibility)
      try {
        console.log('Trying fallback admin API...');
        const response = await adminAPI.getSalespersonsWithRatings();
        if (response.data.success) {
          const currentUser = response.data.data.find(sp => sp._id === userId);
          if (currentUser) {
            setUserRating(currentUser.rating || 0);
            setUserStats(currentUser.performanceStats || null);
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback API also failed:', fallbackErr);
        setUserRating(0);
        setUserStats(null);
      }
    } finally {
      if (showLoading) setRatingLoading(false);
    }
  };

  const fetchAssignments = async (userId) => {
    try {
      const response = await salesAPI.getAssignments(userId);
      setAssignments(response.data);
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentVisits = async () => {
    try {
      const response = await visitReportsAPI.getMyReports({ limit: 5 });
      if (response.data.success) {
        setRecentVisits(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch visit reports:', err);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          salesAPI.updateLocation({ lat: latitude, lng: longitude })
            .catch(err => console.error('Failed to update location:', err));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const renderStars = (rating, size = 'w-4 h-4') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className={`${size} fill-green-400 text-green-400`} />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className={`${size} fill-green-400 text-green-400`} />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className={`${size} text-gray-300`} />);
    }

    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const allPlaces = assignments.flatMap(a => a.places);
  const center = currentLocation || (allPlaces.length > 0 ? [allPlaces[0].lat, allPlaces[0].lng] : [20.5937, 78.9629]);

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">My Assignments</h1>
              <p className="text-slate-600">Welcome back, {user?.name}!</p>
            </div>
            
            {/* Prominent Rating Display */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-full p-3">
                    <Star className="w-8 h-8 text-white fill-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Your Performance Rating</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {userRating > 0 ? renderStars(userRating, 'w-5 h-5') : (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-5 h-5 text-gray-300" />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-lg font-bold text-slate-800">
                        {userRating > 0 ? `${userRating}/5` : 'Not Rated Yet'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {userRating === 0 && (
                        <span className="text-blue-600 font-medium">Complete visits to get your first rating!</span>
                      )}
                      {userRating > 0 && userRating < 2 && (
                        <span className="text-orange-600 font-medium">Keep improving your performance.</span>
                      )}
                      {userRating >= 2 && userRating < 3.5 && (
                        <span className="text-blue-600 font-medium">Good work. Keep it up.</span>
                      )}
                      {userRating >= 3.5 && userRating < 4.5 && (
                        <span className="text-green-600 font-medium">Excellent performance.</span>
                      )}
                      {userRating >= 4.5 && (
                        <span className="text-green-700 font-bold">Outstanding. You're a top performer.</span>
                      )}
                    </p>
                    {userStats && (userStats.totalVisits > 0 || userStats.totalExpenses > 0) && (
                      <div className="mt-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          {userStats.approvedVisits || 0}/{userStats.totalVisits || 0} visits approved
                          {userStats.totalExpenses > 0 && (
                            <span className="ml-2">
                              {userStats.approvedExpenses || 0}/{userStats.totalExpenses || 0} expenses approved
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => fetchUserRating(user?.id, true)}
                  disabled={ratingLoading}
                  className="p-3 text-green-600 hover:bg-green-100 rounded-xl transition-colors disabled:opacity-50"
                  title="Refresh Rating"
                >
                  <RefreshCw className={`w-5 h-5 ${ratingLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total Assignments</p>
                <p className="text-3xl font-bold text-slate-800">{assignments.length}</p>
              </div>
              <Briefcase className="w-12 h-12 text-green-400" />
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
                <p className="text-sm font-medium text-slate-600 mb-1">Total Locations</p>
                <p className="text-3xl font-bold text-slate-800">{allPlaces.length}</p>
              </div>
              <MapPin className="w-12 h-12 text-blue-400" />
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
                <p className="text-sm font-medium text-slate-600 mb-1">Visited</p>
                <p className="text-3xl font-bold text-green-600">{allPlaces.filter(p => p.visited).length}</p>
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
                <p className="text-sm font-medium text-slate-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{allPlaces.filter(p => !p.visited).length}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-400" />
            </div>
          </motion.div>
        </div>

        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card mb-8 p-0 overflow-hidden relative z-0"
        >
          <div className="h-96 relative z-0">
            <MapComponent places={allPlaces} currentLocation={currentLocation} center={center} zoom={6} />
          </div>
        </motion.div>

        {/* Recent Visit Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="card mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-800">Recent Visit Reports</h3>
            <button
              onClick={fetchRecentVisits}
              className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
          {recentVisits.length === 0 ? (
            <p className="text-slate-500 text-sm">No visit reports submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {recentVisits.map(report => (
                <div
                  key={report._id}
                  className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-semibold text-slate-800 text-sm sm:text-base">{report.millCompanyName}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(report.visitDate || report.createdAt).toLocaleDateString()}
                    </p>
                    {report.locationName && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{report.locationName}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {report.isSuspicious && (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">Suspicious</span>
                      )}
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          report.adminApproval?.status === 'Approved'
                            ? 'bg-green-100 text-green-700'
                            : report.adminApproval?.status === 'Rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {report.adminApproval?.status || 'Pending'}
                      </span>
                    </div>
                    {report.adminApproval?.status && (
                      <div className="text-xs text-slate-500 sm:text-right">
                        <p className="font-medium">
                          {report.adminApproval.status === 'Approved' ? 'Approved' : 'Rejected'} by {report.adminApproval.approver || 'Admin'}
                        </p>
                        {report.adminApproval.remark && (
                          <p className="italic text-slate-500 max-w-xs">
                            “{report.adminApproval.remark}”
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-gradient-to-b from-green-400 to-blue-400 rounded-full"></span>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <button
              onClick={() => setShowAdhocVisitModal(true)}
              className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg p-3 transition-all duration-300 hover:shadow-md hover:scale-105 text-left border border-purple-200"
            >
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-2 group-hover:scale-110 transition-transform">
                  <FilePlus2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Visit Report</h4>
                  <p className="text-[10px] text-slate-600 mt-0.5">Create visit</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/expenses/create')}
              className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg p-3 transition-all duration-300 hover:shadow-md hover:scale-105 text-left border border-green-200"
            >
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-2 group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">New Expense</h4>
                  <p className="text-[10px] text-slate-600 mt-0.5">Submit bill</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/expenses/view')}
              className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg p-3 transition-all duration-300 hover:shadow-md hover:scale-105 text-left border border-blue-200"
            >
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">My Expenses</h4>
                  <p className="text-[10px] text-slate-600 mt-0.5">View status</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-lg p-3 transition-all duration-300 hover:shadow-md hover:scale-105 text-left border border-orange-200"
            >
              <div className="flex flex-col items-center text-center gap-1.5">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-2 group-hover:scale-110 transition-transform">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Alerts</h4>
                  <p className="text-[10px] text-slate-600 mt-0.5">Notifications</p>
                </div>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Assignments List */}
        <div className="space-y-6">
          {assignments.map((assignment, idx) => (
            <motion.div
              key={assignment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              className="card"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-green-400" />
                Assignment for {new Date(assignment.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <div className="space-y-4">
                {assignment.places.map((place) => (
                  <div
                    key={place._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 mb-1">{place.name}</h4>
                      <p className="text-sm text-slate-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      {place.visited ? (
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold ${
                          place.verified 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {place.verified ? (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              Verified
                            </>
                          ) : (
                            <>
                              ⚠️ Suspicious
                            </>
                          )}
                        </span>
                      ) : (
                        <button
                          onClick={() => navigate(`/visit/${assignment._id}/${place._id}`)}
                          className="btn-gradient flex items-center gap-2"
                        >
                          <Camera className="w-5 h-5" />
                          Visit Location
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Ad-hoc Visit Report Modal */}
        <AnimatePresence>
          {showAdhocVisitModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 relative"
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <button
                  onClick={() => setShowAdhocVisitModal(false)}
                  className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 text-slate-500"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                        Salesperson Created
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Create Visit Report</h2>
                    <p className="text-slate-600 text-sm mt-1">
                      Use this form when you visit a potential customer that is not part of your assigned locations.
                    </p>
                  </div>
                </div>

                {currentLocation ? (
                  <VisitReportForm
                    assignmentId={null}
                    placeId={null}
                    currentLocation={currentLocation}
                    startLocation={currentLocation}
                    mode="adhoc"
                    onSuccess={() => {
                      setShowAdhocVisitModal(false);
                      fetchRecentVisits();
                    }}
                  />
                ) : (
                  <p className="text-sm text-slate-500">
                    Getting your current location... please enable GPS/location permission and refresh if it takes too long.
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default Dashboard;
