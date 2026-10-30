import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseAPI, adminAPI, API_URL } from '../api';
import { ArrowLeft, Users, Calendar, DollarSign, CheckCircle, XCircle, Clock, Eye, Filter, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';

function ExpenseReports() {
  const [expenses, setExpenses] = useState([]);
  const [salespersons, setSalespersons] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    salespersonId: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    count: 0
  });
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [currentBillIndex, setCurrentBillIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [zoomBillUrl, setZoomBillUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    setRefreshInterval(interval);

    // Cleanup interval when dependencies change
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [filters, pagination.current]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [expensesRes, salespersonsRes, statsRes] = await Promise.all([
        expenseAPI.getAllExpenses({
          page: pagination.current,
          ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v && v !== 'all'))
        }),
        adminAPI.getAllSalespersons(),
        expenseAPI.getExpenseStats(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v && v !== 'all')))
      ]);

      if (expensesRes.data.success) {
        setExpenses(expensesRes.data.data);
        setPagination(expensesRes.data.pagination);
      }

      if (salespersonsRes.data) {
        // Handle different response formats
        if (salespersonsRes.data.success) {
          setSalespersons(salespersonsRes.data.data || []);
        } else if (Array.isArray(salespersonsRes.data)) {
          setSalespersons(salespersonsRes.data);
        } else {
          setSalespersons([]);
        }
      } else {
        setSalespersons([]);
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusUpdate = async (expenseId, status, adminNotes = '') => {
    try {
      setActionLoading(true);
      const response = await expenseAPI.updateExpenseStatus(expenseId, { status, adminNotes });
      
      if (response.data.success) {
        fetchData(); // Refresh data
        setSelectedExpense(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update expense status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setActionLoading(true);
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v && v !== 'all'));
      
      const response = await expenseAPI.exportToExcel(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'expense-reports.xlsx';
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
      setError(err.response?.data?.message || 'Failed to download Excel file');
    } finally {
      setActionLoading(false);
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

  const selectedExpenseFiles = selectedExpense
    ? (Array.isArray(selectedExpense.billPhotoUrls) && selectedExpense.billPhotoUrls.length
        ? selectedExpense.billPhotoUrls
        : selectedExpense.billPhoto
          ? [selectedExpense.billPhoto]
          : [])
    : [];

  const currentFile = selectedExpenseFiles[currentBillIndex] || null;
  const isCurrentFilePdf = currentFile?.toLowerCase().endsWith('.pdf');
  const currentFileUrl = currentFile
    ? `${API_URL}${currentFile}`
    : null;

  const showNextBill = () => {
    if (!selectedExpenseFiles.length) return;
    setCurrentBillIndex((prev) => (prev + 1) % selectedExpenseFiles.length);
  };

  const showPrevBill = () => {
    if (!selectedExpenseFiles.length) return;
    setCurrentBillIndex((prev) => (prev - 1 + selectedExpenseFiles.length) % selectedExpenseFiles.length);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>
          
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Expense Reports</h1>
          <p className="text-slate-600">Review and manage expense submissions from salespersons</p>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Expenses</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.overall.count}</p>
                  <p className="text-sm text-slate-500">{formatAmount(stats.overall.totalAmount)}</p>
                </div>
                <FileText className="w-12 h-12 text-blue-400" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending.count}</p>
                  <p className="text-sm text-slate-500">{formatAmount(stats.pending.totalAmount)}</p>
                </div>
                <Clock className="w-12 h-12 text-yellow-400" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{stats.approved.count}</p>
                  <p className="text-sm text-slate-500">{formatAmount(stats.approved.totalAmount)}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">{stats.rejected.count}</p>
                  <p className="text-sm text-slate-500">{formatAmount(stats.rejected.totalAmount)}</p>
                </div>
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-slate-800">Filters</h3>
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="ml-auto px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              title="Refresh data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Salesperson</label>
              <select
                value={filters.salespersonId}
                onChange={(e) => handleFilterChange('salespersonId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
              >
                <option value="">All Salespersons</option>
                {Array.isArray(salespersons) && salespersons.map(sp => (
                  <option key={sp._id} value={sp._id}>{sp.name}</option>
                ))}
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
                  setFilters({ status: 'all', salespersonId: '', startDate: '', endDate: '' });
                  setPagination(prev => ({ ...prev, current: 1 }));
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          {/* Download Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleDownloadExcel}
              disabled={actionLoading || expenses.length === 0}
              className="btn-gradient flex items-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Excel...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Excel Report
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Expenses Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No expenses found</h3>
              <p className="text-gray-500">No expenses match the current filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Salesperson</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Submitted</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense, index) => (
                    <motion.tr
                      key={expense._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.02 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold text-slate-800">{expense.salesperson?.name}</p>
                          <p className="text-sm text-slate-600">{expense.salesperson?.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {formatDate(expense.date)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="capitalize text-slate-600">{expense.category}</span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {formatAmount(expense.amount)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(expense.status)}`}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {formatDate(expense.submittedAt)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {expense.billPhoto && (
                            <button
                              onClick={() => { setSelectedExpense(expense); setCurrentBillIndex(0); }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Bill Photo"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          
                          {expense.status === 'pending' && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { setSelectedExpense(expense); setCurrentBillIndex(0); }}
                                className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                                disabled={actionLoading}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => { setSelectedExpense(expense); setCurrentBillIndex(0); }}
                                className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                                disabled={actionLoading}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
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

        {/* Action Modal */}
        {selectedExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-4">Review Expense</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Salesperson:</span>
                  <span className="font-semibold">{selectedExpense.salesperson?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">{formatAmount(selectedExpense.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="capitalize">{selectedExpense.category}</span>
                </div>
                <div>
                  <span className="text-gray-600">Description:</span>
                  <p className="mt-1 text-sm">{selectedExpense.description}</p>
                </div>
              </div>

              {/* Bill Files Slider */}
              {selectedExpenseFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Attached Bills</p>
                  <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center">
                    {currentFileUrl && !isCurrentFilePdf && (
                      <img
                        src={currentFileUrl}
                        alt={`Bill ${currentBillIndex + 1}`}
                        className="w-full max-h-[75vh] object-contain rounded-lg cursor-zoom-in"
                        onClick={() => setZoomBillUrl(currentFileUrl)}
                      />
                    )}
                    {currentFileUrl && isCurrentFilePdf && (
                      <div className="flex flex-col items-center justify-center gap-3 py-4 w-full">
                        <FileText className="w-10 h-10 text-gray-500" />
                        <p className="text-sm text-gray-600">PDF bill attached</p>
                        <iframe
                          src={currentFileUrl}
                          title={`Bill PDF ${currentBillIndex + 1}`}
                          className="w-full h-[75vh] rounded-lg border bg-white"
                        />
                        <p className="text-xs text-gray-500">Scroll inside the frame to view the full PDF.</p>
                      </div>
                    )}

                    {selectedExpenseFiles.length > 1 && (
                      <div className="flex items-center justify-between mt-3 text-xs sm:text-sm text-gray-600">
                        <button
                          type="button"
                          onClick={showPrevBill}
                          className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-100"
                        >
                          Previous
                        </button>
                        <span>
                          {currentBillIndex + 1} / {selectedExpenseFiles.length}
                        </span>
                        <button
                          type="button"
                          onClick={showNextBill}
                          className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-100"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <textarea
                placeholder="Add admin notes (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                rows={3}
                id="adminNotes"
              />

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => {
                    const notes = document.getElementById('adminNotes').value;
                    handleStatusUpdate(selectedExpense._id, 'approved', notes);
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => {
                    const notes = document.getElementById('adminNotes').value;
                    handleStatusUpdate(selectedExpense._id, 'rejected', notes);
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => { setSelectedExpense(null); setCurrentBillIndex(0); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {zoomBillUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">Bill Photo</h3>
                <button
                  onClick={() => setZoomBillUrl(null)}
                  className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="p-4 bg-slate-50 flex items-center justify-center">
                <img
                  src={zoomBillUrl}
                  alt="Bill"
                  className="w-full max-h-[85vh] object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpenseReports;
