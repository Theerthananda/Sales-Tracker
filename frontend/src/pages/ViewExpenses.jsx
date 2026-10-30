import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseAPI, API_URL } from '../api';
import { ArrowLeft, Plus, Calendar, DollarSign, Eye, Trash2, Filter, FileText, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

function ViewExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    count: 0
  });
  const [notifyLoadingId, setNotifyLoadingId] = useState(null);
  const [notifiedExpenses, setNotifiedExpenses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpenses();
  }, [filters, pagination.current]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        ...filters
      };
      
      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'all') {
          delete params[key];
        }
      });

      const response = await expenseAPI.getSalespersonExpenses(params);
      
      if (response.data.success) {
        setExpenses(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const response = await expenseAPI.deleteExpense(id);
      if (response.data.success) {
        fetchExpenses(); // Refresh the list
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete expense');
    }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const canNotifyAdmin = (expense) => {
    if (expense.status !== 'pending') return false;
    const submittedAt = expense.submittedAt || expense.createdAt;
    if (!submittedAt) return false;
    const ageMs = Date.now() - new Date(submittedAt).getTime();
    return ageMs >= 2 * 60 * 1000; // 2 minutes
  };

  const handleNotifyAdmin = async (expense) => {
    try {
      setNotifyLoadingId(expense._id);
      setError('');
      await expenseAPI.notifyPendingExpense(expense._id);
      setNotifiedExpenses((prev) =>
        prev.includes(expense._id) ? prev : [...prev, expense._id]
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to notify admin about pending expense');
    } finally {
      setNotifyLoadingId(null);
    }
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              
              <h1 className="text-4xl font-bold text-slate-800 mb-2">My Expenses</h1>
              <p className="text-slate-600">View and manage your submitted expenses</p>
            </div>
            
            <button
              onClick={() => navigate('/expenses/create')}
              className="btn-gradient flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Expense
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-slate-800">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ status: 'all', startDate: '', endDate: '' });
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Expenses List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No expenses found</h3>
              <p className="text-gray-500 mb-6">Start by submitting your first expense</p>
              <button
                onClick={() => navigate('/expenses/create')}
                className="btn-gradient inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Expense
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense, index) => (
                <motion.div
                  key={expense._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(expense.status)}`}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          Submitted: {formatDate(expense.submittedAt)}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-semibold text-slate-800 mb-2 capitalize">
                        {expense.category}
                      </h4>
                      
                      <p className="text-gray-600 mb-3">
                        {expense.description}
                      </p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Expense Date: {formatDate(expense.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          Amount: {formatAmount(expense.amount)}
                        </div>
                        {expense.billPhoto && (
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            Bill Photo Attached
                          </div>
                        )}
                      </div>
                      
                      {expense.adminNotes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <strong>Admin Notes:</strong> {expense.adminNotes}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {expense.billPhoto && (
                        <button
                          onClick={() => window.open(`${API_URL}${expense.billPhoto}`, '_blank')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Bill Photo"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                      
                      {expense.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleDelete(expense._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          {canNotifyAdmin(expense) && !notifiedExpenses.includes(expense._id) && (
                            <button
                              onClick={() => handleNotifyAdmin(expense)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Notify admin that this expense is still pending"
                              disabled={notifyLoadingId === expense._id}
                            >
                              <Bell className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {pagination.total > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {((pagination.current - 1) * 10) + 1} to {Math.min(pagination.current * 10, pagination.count)} of {pagination.count} expenses
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                  disabled={pagination.current === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-gray-600">
                  Page {pagination.current} of {pagination.total}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                  disabled={pagination.current === pagination.total}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default ViewExpenses;
