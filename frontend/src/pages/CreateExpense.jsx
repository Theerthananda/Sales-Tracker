import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseAPI } from '../api';
import { ArrowLeft, Upload, DollarSign, Calendar, FileText, X } from 'lucide-react';
import { motion } from 'framer-motion';

function CreateExpense() {
  const [formData, setFormData] = useState({
    date: '',
    amount: '',
    category: 'travel',
    description: ''
  });
  const [billPhotos, setBillPhotos] = useState([]);
  const [currentBillIndex, setCurrentBillIndex] = useState(0);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const categories = [
    { value: 'travel', label: 'Travel' },
    { value: 'food', label: 'Food & Dining' },
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'fuel', label: 'Fuel' },
    { value: 'maintenance', label: 'Vehicle Maintenance' },
    { value: 'communication', label: 'Communication' },
    { value: 'office', label: 'Office Supplies' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) {
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];

    for (const file of newFiles) {
      if (file.size > maxSize) {
        setError('File size must be less than 10MB for all files');
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        setError('Only images and PDF files are allowed');
        return;
      }
    }

    const updatedFiles = [...billPhotos, ...newFiles];
    setBillPhotos(updatedFiles);
    setError('');
    setCurrentBillIndex(updatedFiles.length - newFiles.length);

    const imageFromNew = newFiles.find(file => file.type && file.type.startsWith('image/'));
    const imageToPreview = imageFromNew || updatedFiles[0];

    if (imageToPreview && imageToPreview.type && imageToPreview.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(imageToPreview);
    } else {
      setPreview(null);
    }
  };

  const removeFile = () => {
    if (!billPhotos.length) {
      return;
    }

    const updated = billPhotos.filter((_, index) => index !== currentBillIndex);

    if (!updated.length) {
      setBillPhotos([]);
      setPreview(null);
      setCurrentBillIndex(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const nextIndex = Math.min(currentBillIndex, updated.length - 1);
    setBillPhotos(updated);
    setCurrentBillIndex(nextIndex);

    const file = updated[nextIndex];
    if (file && file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const showNextBill = () => {
    if (!billPhotos.length) {
      return;
    }
    const nextIndex = (currentBillIndex + 1) % billPhotos.length;
    setCurrentBillIndex(nextIndex);
    const file = billPhotos[nextIndex];
    if (file && file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const showPrevBill = () => {
    if (!billPhotos.length) {
      return;
    }
    const prevIndex = (currentBillIndex - 1 + billPhotos.length) % billPhotos.length;
    setCurrentBillIndex(prevIndex);
    const file = billPhotos[prevIndex];
    if (file && file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.date || !formData.amount || !formData.description) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('date', formData.date);
      submitData.append('amount', formData.amount);
      submitData.append('category', formData.category);
      submitData.append('description', formData.description);
      
      if (billPhotos.length) {
        billPhotos.forEach(file => {
          submitData.append('billPhoto', file);
        });
      }

      const response = await expenseAPI.createExpense(submitData);
      
      if (response.data.success) {
        setSuccess('Expense submitted successfully!');
        setFormData({
          date: '',
          amount: '',
          category: 'travel',
          description: ''
        });
        removeFile();
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/expenses/view');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Create New Expense</h1>
          <p className="text-slate-600">Submit your expense details with bill photo</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Expense Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent"
                required
              />
            </div>

            {/* Amount Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Amount (₹) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent"
                required
              />
            </div>

            {/* Category Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe the expense purpose..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Bill Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Upload className="w-4 h-4 inline mr-2" />
                Bill Photo (Optional)
              </label>
              
              {billPhotos.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">Click to upload bill photo</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF or PDF (max. 10MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Bill preview"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full p-6 bg-gray-50 rounded-xl text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">
                        {billPhotos.length > 1
                          ? `${billPhotos.length} files selected`
                          : billPhotos[0]?.name}
                      </p>
                    </div>
                  )}
                 
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {billPhotos.length > 1 && (
                <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                  <button
                    type="button"
                    onClick={showPrevBill}
                    className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span>
                    {currentBillIndex + 1} / {billPhotos.length}
                  </span>
                  <button
                    type="button"
                    onClick={showNextBill}
                    className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}

              {billPhotos.length > 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs text-green-600 hover:text-green-700 font-semibold"
                >
                  Add more files
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient flex items-center justify-center gap-2 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Submit Expense
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default CreateExpense;
