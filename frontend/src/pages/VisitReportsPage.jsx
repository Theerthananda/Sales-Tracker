import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { visitReportsAPI, API_URL } from '../api';
import { 
  FileText, Download, Eye, Filter, Calendar, 
  Building2, User, TrendingUp, CheckCircle, AlertTriangle,
  MapPin, MessageCircle
} from 'lucide-react';
import { motion } from 'framer-motion';



function VisitReportsPage() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [salespersonFilter, setSalespersonFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState(null);
  const [approvalRemark, setApprovalRemark] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
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

    fetchReports();
    fetchStats();
  }, [navigate]);

  const fetchReports = async () => {
    try {
      const response = await visitReportsAPI.getAllReports();
      setReports(response.data);
      setSelectedReport(prev => prev ? response.data.find(r => r._id === prev._id) || null : null);
    } catch (error) {
      console.error('Error fetching reports:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await visitReportsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedReport) return;
    try {
      setActionLoading(true);
      await visitReportsAPI.updateStatus(selectedReport._id, { status, remark: approvalRemark });
      await fetchReports();
      setApprovalRemark('');
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating visit status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await visitReportsAPI.exportToCSV();
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visit-reports-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download CSV. Please try again.');
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterType === 'verified' && !report.verified) return false;
    if (filterType === 'suspicious' && !report.isSuspicious) return false;
    if (filterType === 'firstTime' && report.typeOfVisit !== 'First Time') return false;
    if (filterType === 'followUp' && report.typeOfVisit !== 'Follow Up') return false;

    if (salespersonFilter && report.salespersonId?.name !== salespersonFilter) {
      return false;
    }

    if (locationFilter && report.address !== locationFilter) {
      return false;
    }

    return true;
  });

  const salespersonOptions = Array.from(
    new Set(
      reports
        .map(report => report.salespersonId?.name)
        .filter(Boolean)
    )
  );

  const locationOptions = Array.from(
    new Set(
      reports
        .map(report => report.address)
        .filter(Boolean)
    )
  );

  const selectedReportPhotos = selectedReport
    ? [
        selectedReport.photoUrl,
        ...(selectedReport.additionalPhotoUrls || [])
      ].filter(Boolean)
    : [];

  const showNextPhoto = () => {
    if (!selectedReportPhotos.length) return;
    setCurrentPhotoIndex((prev) => (prev + 1) % selectedReportPhotos.length);
  };

  const showPrevPhoto = () => {
    if (!selectedReportPhotos.length) return;
    setCurrentPhotoIndex((prev) => (prev - 1 + selectedReportPhotos.length) % selectedReportPhotos.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <FileText className="w-10 h-10 text-green-400" />
            Visit Reports
          </h1>
          <p className="text-slate-600">Comprehensive sales visit reports and analytics</p>
        </motion.div>

        {/* Statistics Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">Total Reports</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.totalReports}</p>
                </div>
                <FileText className="w-12 h-12 text-blue-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">Verified</p>
                  <p className="text-3xl font-bold text-green-600">{stats.verifiedReports}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">Suspicious</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.suspiciousReports}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-orange-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">First Time Visits</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.firstTimeVisits}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">Follow Up Visits</p>
                  <p className="text-3xl font-bold text-indigo-600">{stats.followUpVisits}</p>
                </div>
                <Calendar className="w-12 h-12 text-indigo-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">With Competitor Info</p>
                  <p className="text-3xl font-bold text-pink-600">{stats.reportsWithCompetitorInfo}</p>
                </div>
                <Building2 className="w-12 h-12 text-pink-400" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters and Download */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Filter className="w-5 h-5 text-slate-600" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all outline-none"
              >
                <option value="all">All Reports</option>
                <option value="verified">Verified Only</option>
                <option value="suspicious">Suspicious Only</option>
                <option value="firstTime">First Time Visits</option>
                <option value="followUp">Follow Up Visits</option>
              </select>
              <span className="text-sm text-slate-600">
                Showing {filteredReports.length} of {reports.length} reports
              </span>
            </div>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              <Download className="w-5 h-5" />
              Download Excel/CSV
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Salesperson</label>
              <select
                value={salespersonFilter}
                onChange={(e) => setSalespersonFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all outline-none"
              >
                <option value="">All Salespersons</option>
                {salespersonOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all outline-none"
              >
                <option value="">All Locations</option>
                {locationOptions.map(address => (
                  <option key={address} value={address}>{address}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Reports Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Salesperson</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Company</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-800">
                      {new Date(report.visitDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-800">
                          {report.salespersonId?.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-800">{report.millCompanyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        report.origin === 'SalespersonAdhoc'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {report.origin === 'SalespersonAdhoc' ? 'Salesperson Created' : 'Admin Assigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-left">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-600 line-clamp-2 max-w-[180px]">
                          {report.locationName || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        report.typeOfVisit === 'First Time' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {report.typeOfVisit}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {report.verified && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </span>
                          )}
                          {report.isSuspicious && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Suspicious
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {report.adminApproval?.status || 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => { setSelectedReport(report); setCurrentPhotoIndex(0); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No reports found</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Visit Report Details</h2>
              <button
                onClick={() => { setSelectedReport(null); setCurrentPhotoIndex(0); }}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Visit Information */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  Visit Information
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
                  <div>
                    <p className="text-sm text-slate-600">Date</p>
                    <p className="font-semibold text-slate-800">
                      {new Date(selectedReport.visitDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Time In - Time Out</p>
                    <p className="font-semibold text-slate-800">
                      {selectedReport.timeIn} - {selectedReport.timeOut}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Type of Visit</p>
                    <p className="font-semibold text-slate-800">{selectedReport.typeOfVisit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Salesperson</p>
                    <p className="font-semibold text-slate-800">
                      {selectedReport.salespersonId?.name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div>
                <div className="flex items-center justify-between mb-3 gap-3">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-green-500" />
                    Company/Contact Details
                  </h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedReport.origin === 'SalespersonAdhoc'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedReport.origin === 'SalespersonAdhoc' ? 'Salesperson Created' : 'Admin Assigned'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
                  <div>
                    <p className="text-sm text-slate-600">Company Name</p>
                    <p className="font-semibold text-slate-800">{selectedReport.millCompanyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Contact Person</p>
                    <p className="font-semibold text-slate-800">{selectedReport.ownerContactPerson}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Mobile Number</p>
                    <p className="font-semibold text-slate-800">{selectedReport.mobileNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600">Address</p>
                    <p className="font-semibold text-slate-800">{selectedReport.address}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" /> Reverse Geocoded Location
                    </p>
                    <p className="font-semibold text-slate-800 text-sm">
                      {selectedReport.locationName || 'Not available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mill Details */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-500" />
                  Mill/Farm Details
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
                  <div>
                    <p className="text-sm text-slate-600">Type of Mill</p>
                    <p className="font-semibold text-slate-800">{selectedReport.typeOfMill}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Processing Capacity/Day</p>
                    <p className="font-semibold text-slate-800">{selectedReport.processingCapacityPerDay}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Years Established</p>
                    <p className="font-semibold text-slate-800">{selectedReport.yearsEstablished}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Machine Installed</p>
                    <p className="font-semibold text-slate-800">
                      {selectedReport.anyMachineInstalled ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Major Grain Type</p>
                    <p className="font-semibold text-slate-800">{selectedReport.majorGrainTypeProcessed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Sorting Machines</p>
                    <p className="font-semibold text-slate-800">{selectedReport.numberOfSortingMachine}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-600">Annual Maintenance Charges</p>
                    <p className="font-semibold text-slate-800">{selectedReport.annualMaintenanceCharges}</p>
                  </div>
                </div>
              </div>

              {/* Competitor Details */}
              {selectedReport.competitorDetails?.competitorName && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Competitor Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
                    <div>
                      <p className="text-sm text-slate-600">Competitor Name</p>
                      <p className="font-semibold text-slate-800">
                        {selectedReport.competitorDetails.competitorName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Machine Name</p>
                      <p className="font-semibold text-slate-800">
                        {selectedReport.competitorDetails.machineName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Machine Capacity</p>
                      <p className="font-semibold text-slate-800">
                        {selectedReport.competitorDetails.machineCapacity}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Dealer/Supplier</p>
                      <p className="font-semibold text-slate-800">
                        {selectedReport.competitorDetails.dealerSupplierName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Service Quality</p>
                      <p className="font-semibold text-slate-800">
                        {selectedReport.competitorDetails.serviceQuality}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Upgrade Interest</p>
                      <p className="font-semibold text-slate-800">
                        {selectedReport.competitorDetails.upgradeReplacementInterest}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Requirement */}
              {selectedReport.customerRequirement?.requirementType && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-500" />
                    Customer Requirement
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4">
                    <div>
                      <p className="text-sm text-slate-600">Requirement Type</p>
                      <p className="font-semibold text-slate-800">
                        {selectedReport.customerRequirement.requirementType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Price Range</p>
                      <p className="font-semibold text-slate-800">
                        {selectedReport.customerRequirement.priceRange}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600">Model</p>
                      <p className="font-semibold text-slate-800">
                        {selectedReport.customerRequirement.model}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Site Verification */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Site Verification
                </h3>
                <div className="flex gap-4 bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedReport.siteVisited?.physicallyVisited}
                      readOnly
                      className="w-5 h-5"
                    />
                    <span className="text-sm text-slate-700">Physically Visited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedReport.siteVisited?.photosTaken}
                      readOnly
                      className="w-5 h-5"
                    />
                    <span className="text-sm text-slate-700">Photos Taken</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedReport.siteVisited?.clientMetInPerson}
                      readOnly
                      className="w-5 h-5"
                    />
                    <span className="text-sm text-slate-700">Client Met in Person</span>
                  </div>
                </div>
              </div>

              {/* Admin Approval Status */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-bold text-slate-800">Admin Review</h3>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                    {selectedReport.adminApproval?.status || 'Pending'}
                  </span>
                  {selectedReport.adminApproval?.approver && (
                    <span className="text-xs text-slate-500">
                      by {selectedReport.adminApproval.approver} · {selectedReport.adminApproval.timestamp ? new Date(selectedReport.adminApproval.timestamp).toLocaleString() : ''}
                    </span>
                  )}
                </div>
                {selectedReport.adminApproval?.remark && (
                  <p className="text-sm text-slate-600 bg-white rounded-lg p-3 border border-slate-100">
                    Remark: {selectedReport.adminApproval.remark}
                  </p>
                )}

                <textarea
                  value={approvalRemark}
                  onChange={(e) => setApprovalRemark(e.target.value)}
                  placeholder="Add remark (optional)"
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                  rows={3}
                />

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate('Approved')}
                    disabled={actionLoading}
                    className="flex-1 min-w-[140px] px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate('Rejected')}
                    disabled={actionLoading}
                    className="flex-1 min-w-[140px] px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Photos Slider */}
              {selectedReportPhotos.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3">Visit Photos</h3>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="w-full">
                      <img
                        src={`${API_URL}${selectedReportPhotos[currentPhotoIndex]}`}
                        alt={`Visit photo ${currentPhotoIndex + 1}`}
                        className="w-full max-h-80 object-cover rounded-xl shadow-lg cursor-zoom-in"
                        onClick={() => setZoomPhotoUrl(`${API_URL}${selectedReportPhotos[currentPhotoIndex]}`)}
                      />
                    </div>
                    {selectedReportPhotos.length > 1 && (
                      <div className="flex items-center justify-between mt-3 text-xs sm:text-sm text-slate-600">
                        <button
                          type="button"
                          onClick={showPrevPhoto}
                          className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100"
                        >
                          Previous
                        </button>
                        <span>
                          {currentPhotoIndex + 1} / {selectedReportPhotos.length}
                        </span>
                        <button
                          type="button"
                          onClick={showNextPhoto}
                          className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-100"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {zoomPhotoUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Visit Photo</h3>
              <button
                onClick={() => setZoomPhotoUrl(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-center">
              <img
                src={zoomPhotoUrl}
                alt="Visit"
                className="w-full max-h-[85vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisitReportsPage;
