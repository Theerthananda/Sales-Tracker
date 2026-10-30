import { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import { Users, Activity, UserCheck, X, MapPin, Clock, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function ActiveSalespersons() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'active' or 'inactive'

  useEffect(() => {
    fetchActiveSalespersons();
    const interval = setInterval(fetchActiveSalespersons, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActiveSalespersons = async () => {
    try {
      const response = await adminAPI.getLiveLocations();
      const data = response.data;
      setSalespersons(data);
      
      // Count active users (active in last 5 minutes)
      const activeCount = data.filter(sp => {
        if (!sp.lastActive) return false;
        const diff = Date.now() - new Date(sp.lastActive).getTime();
        const minutes = Math.floor(diff / 60000);
        return minutes < 5;
      }).length;

      setStats({
        total: data.length,
        active: activeCount,
        inactive: data.length - activeCount
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch active salespersons:', error);
      setLoading(false);
    }
  };

  const getFilteredSalespersons = () => {
    if (modalType === 'active') {
      return salespersons.filter(sp => {
        if (!sp.lastActive) return false;
        const diff = Date.now() - new Date(sp.lastActive).getTime();
        const minutes = Math.floor(diff / 60000);
        return minutes < 5;
      });
    } else if (modalType === 'inactive') {
      return salespersons.filter(sp => {
        if (!sp.lastActive) return true;
        const diff = Date.now() - new Date(sp.lastActive).getTime();
        const minutes = Math.floor(diff / 60000);
        return minutes >= 5;
      });
    }
    return salespersons;
  };

  const handleCardClick = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-32">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => handleCardClick('total')}
          className="card bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Total Salespersons</p>
              <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-blue-600 mt-1">Click to view all</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-7 h-7 text-blue-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => handleCardClick('active')}
          className="card bg-gradient-to-br from-green-50 to-white border-2 border-green-100 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Active Now</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600">Click to view</span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <Activity className="w-7 h-7 text-green-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => handleCardClick('inactive')}
          className="card bg-gradient-to-br from-slate-50 to-white border-2 border-slate-100 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-1">Inactive</p>
              <p className="text-3xl font-bold text-slate-800">{stats.inactive}</p>
              <p className="text-xs text-slate-600 mt-1">Click to view</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
              <UserCheck className="w-7 h-7 text-slate-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {modalType === 'active' && <><Activity className="w-6 h-6" /> Active Salespersons</>}
                    {modalType === 'inactive' && <><UserCheck className="w-6 h-6" /> Inactive Salespersons</>}
                    {modalType === 'total' && <><Users className="w-6 h-6" /> All Salespersons</>}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-green-50 mt-1">
                  {getFilteredSalespersons().length} {modalType === 'total' ? 'total' : modalType} salesperson(s)
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getFilteredSalespersons().map((sp) => (
                    <motion.div
                      key={sp._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border-2 border-slate-100 hover:border-green-200 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {sp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 truncate">{sp.name}</h3>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{sp.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>{sp.lastActive ? new Date(sp.lastActive).toLocaleString() : 'Never'}</span>
                            </div>
                            {sp.currentLocation?.lat && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">
                                  {sp.currentLocation.lat.toFixed(4)}, {sp.currentLocation.lng.toFixed(4)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {getFilteredSalespersons().length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Users className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p>No salespersons found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ActiveSalespersons;
