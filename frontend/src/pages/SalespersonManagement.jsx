import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';
import Navbar from '../components/Navbar';
import { ArrowLeft, Plus, Edit, Trash2, Star, StarHalf, User, Mail, Phone, MapPin, Calendar, Activity, RefreshCw, RotateCcw, Trash } from 'lucide-react';
import { motion } from 'framer-motion';

function SalespersonManagement() {
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSalesperson, setSelectedSalesperson] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchSalespersons();
  }, []);

  const fetchSalespersons = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSalespersonsWithRatings();
      
      if (response.data.success) {
        setSalespersons(response.data.data);
      } else {
        // Fallback to regular getAllSalespersons if getSalespersonsWithRatings fails
        const fallbackResponse = await adminAPI.getAllSalespersons();
        if (fallbackResponse.data.success) {
          setSalespersons(fallbackResponse.data.data);
        } else if (Array.isArray(fallbackResponse.data)) {
          // Handle old API format
          setSalespersons(fallbackResponse.data);
        }
      }
    } catch (err) {
      console.error('Error fetching salespersons:', err);
      setError(err.response?.data?.message || 'Failed to fetch salespersons');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSalesperson = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const response = await adminAPI.createSalesperson(formData);
      
      if (response.data.success) {
        setShowAddModal(false);
        setFormData({ name: '', email: '', password: '', phone: '', address: '' });
        fetchSalespersons();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create salesperson');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSalesperson = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const updateData = { ...formData };
      delete updateData.password; // Don't update password in edit mode
      
      const response = await adminAPI.updateSalesperson(selectedSalesperson._id, updateData);
      
      if (response.data.success) {
        setShowEditModal(false);
        setSelectedSalesperson(null);
        setFormData({ name: '', email: '', password: '', phone: '', address: '' });
        fetchSalespersons();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update salesperson');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSalesperson = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this salesperson?')) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await adminAPI.deleteSalesperson(id);
      
      if (response.data.success) {
        fetchSalespersons();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate salesperson');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRating = async (id) => {
    try {
      setActionLoading(true);
      const response = await adminAPI.updateSalespersonRating(id);
      
      if (response.data.success) {
        fetchSalespersons();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update rating');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAllRatings = async () => {
    try {
      setActionLoading(true);
      const response = await adminAPI.updateAllRatings();
      
      if (response.data.success) {
        fetchSalespersons(); // Refresh the list
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update all ratings');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSalesperson = async (id, name) => {
    if (!window.confirm(`Are you sure you want to reactivate ${name}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await adminAPI.reactivateSalesperson(id);
      
      if (response.data.success) {
        fetchSalespersons();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reactivate salesperson');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async (id, name) => {
    if (!window.confirm(`PERMANENT DELETE WARNING\n\nAre you absolutely sure you want to permanently delete ${name} from the database?\n\nThis action CANNOT be undone and will remove all their data permanently!`)) {
      return;
    }

    // Double confirmation for permanent delete
    if (!window.confirm(`This is your final warning!\n\nPermanently delete ${name}?\n\nType "DELETE" in the next prompt to confirm.`)) {
      return;
    }

    const confirmation = window.prompt(`To permanently delete ${name}, type "DELETE" (in capital letters):`);
    if (confirmation !== 'DELETE') {
      alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      return;
    }

    try {
      setActionLoading(true);
      const response = await adminAPI.permanentDeleteSalesperson(id);
      
      if (response.data.success) {
        fetchSalespersons();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to permanently delete salesperson');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (salesperson) => {
    setSelectedSalesperson(salesperson);
    setFormData({
      name: salesperson.name,
      email: salesperson.email,
      phone: salesperson.phone || '',
      address: salesperson.address || '',
      password: ''
    });
    setShowEditModal(true);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Salesperson Management</h1>
              <p className="text-slate-600">Manage your field team, update their details, and track performance</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSalespersons}
              disabled={loading}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleUpdateAllRatings}
              disabled={actionLoading}
              className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
              Update All Ratings
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-gradient flex items-center gap-2 px-6 py-3"
            >
              <Plus className="w-5 h-5" />
              Add Salesperson
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Salespersons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salespersons.map((salesperson, index) => (
            <motion.div
              key={salesperson._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`card p-6 ${!salesperson.isActive ? 'opacity-60 bg-gray-50' : ''}`}
            >
              {/* Header with Avatar and Actions */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{salesperson.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      {renderStars(salesperson.rating)}
                      <span className="text-sm text-gray-600 ml-1">({salesperson.rating})</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUpdateRating(salesperson._id)}
                    disabled={actionLoading}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Update Rating"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(salesperson)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {salesperson.isActive ? (
                    <button
                      onClick={() => handleDeleteSalesperson(salesperson._id)}
                      disabled={actionLoading}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Deactivate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivateSalesperson(salesperson._id, salesperson.name)}
                      disabled={actionLoading}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Reactivate"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handlePermanentDelete(salesperson._id, salesperson.name)}
                    disabled={actionLoading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Permanent Delete"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{salesperson.email}</span>
                </div>
                {salesperson.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{salesperson.phone}</span>
                  </div>
                )}
                {salesperson.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{salesperson.address}</span>
                  </div>
                )}
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {salesperson.performanceStats?.totalVisits || 0}
                  </div>
                  <div className="text-xs text-blue-600">Total Visits</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {salesperson.performanceStats?.approvedVisits || 0}
                  </div>
                  <div className="text-xs text-green-600">Approved</div>
                </div>
              </div>

              {/* Status and Join Date */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    salesperson.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {salesperson.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(salesperson.dateJoined).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {salespersons.length === 0 && !loading && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Salespersons Found</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first salesperson</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-gradient flex items-center gap-2 px-6 py-3 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Add Salesperson
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-4">Add New Salesperson</h2>
            
            <form onSubmit={handleAddSalesperson} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 btn-gradient disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-slate-800 mb-4">Edit Salesperson</h2>
            
            <form onSubmit={handleUpdateSalesperson} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 btn-gradient disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default SalespersonManagement;
