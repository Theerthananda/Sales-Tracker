import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Building2, User, Phone, MapPin, 
  Factory, Package, TrendingUp, Users, DollarSign,
  Camera, CheckCircle, ArrowRight, ArrowLeft, Upload, X
} from 'lucide-react';
import { salesAPI } from '../api';

function VisitReportForm({ assignmentId, placeId, currentLocation, startLocation, onSuccess, mode = 'assignment' }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const fileInputRef = useRef(null);
  
  const [validationErrors, setValidationErrors] = useState({});
  
  const [formData, setFormData] = useState({
    // Visit Information
    visitDate: new Date().toISOString().split('T')[0],
    timeIn: '',
    timeOut: '',
    
    // Company/Contact Details
    millCompanyName: '',
    ownerContactPerson: '',
    mobileNumber: '',
    address: '',
    typeOfVisit: 'First Time',
    
    // Mill/Company/Farm Details
    typeOfMill: '',
    processingCapacityPerDay: '',
    yearsEstablished: '',
    anyMachineInstalled: false,
    majorGrainTypeProcessed: '',
    numberOfSortingMachine: 0,
    annualMaintenanceCharges: '',
    
    // Competitor Details
    competitorName: '',
    machineName: '',
    machineCapacity: '',
    dealerSupplierName: '',
    serviceQuality: '',
    upgradeReplacementInterest: '',
    
    // Customer Requirement
    requirementType: '',
    priceRange: '',
    model: '',
    
    // Site Visited
    physicallyVisited: false,
    photosTaken: false,
    clientMetInPerson: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Debug logging for checkboxes and radio buttons
    if (type === 'checkbox' || type === 'radio') {
      console.log(`${type} changed:`, { name, value, checked });
    }
    
    // Special debugging for anyMachineInstalled
    if (name === 'anyMachineInstalled') {
      console.log('anyMachineInstalled checkbox clicked:', { 
        currentValue: formData.anyMachineInstalled, 
        newValue: checked,
        event: e
      });
    }
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      
      // Log the updated form data for anyMachineInstalled
      if (name === 'anyMachineInstalled') {
        console.log('Updated formData.anyMachineInstalled:', newFormData.anyMachineInstalled);
      }
      
      return newFormData;
    });
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePhotoChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) {
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    for (const file of newFiles) {
      if (file.size > maxSize) {
        setValidationErrors(prev => ({
          ...prev,
          photo: 'Each photo must be less than 10MB'
        }));
        return;
      }
      if (file.type && !allowedTypes.includes(file.type)) {
        setValidationErrors(prev => ({
          ...prev,
          photo: 'Only image files (JPEG, PNG, GIF, WEBP) are allowed'
        }));
        return;
      }
    }

    const updatedPhotos = [...photos, ...newFiles];
    setPhotos(updatedPhotos);
    setCurrentPhotoIndex(updatedPhotos.length - newFiles.length);

    const imageFromNew = newFiles.find(file => file.type && file.type.startsWith('image/'));
    const imageToPreview = imageFromNew || updatedPhotos[0];

    if (imageToPreview && imageToPreview.type && imageToPreview.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(imageToPreview);
    } else {
      setPhotoPreview(null);
    }
  };

  const showNextPhoto = () => {
    if (!photos.length) {
      return;
    }
    const nextIndex = (currentPhotoIndex + 1) % photos.length;
    setCurrentPhotoIndex(nextIndex);
    const file = photos[nextIndex];
    if (file && file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const showPrevPhoto = () => {
    if (!photos.length) {
      return;
    }
    const prevIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
    setCurrentPhotoIndex(prevIndex);
    const file = photos[prevIndex];
    if (file && file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const removeCurrentPhoto = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!photos.length) {
      return;
    }

    const updated = photos.filter((_, index) => index !== currentPhotoIndex);

    if (!updated.length) {
      setPhotos([]);
      setPhotoPreview(null);
      setCurrentPhotoIndex(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const nextIndex = Math.min(currentPhotoIndex, updated.length - 1);
    setPhotos(updated);
    setCurrentPhotoIndex(nextIndex);

    const file = updated[nextIndex];
    if (file && file.type && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation before submission
    if (!validateCurrentStep()) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      if (mode === 'assignment') {
        formDataToSend.append('assignmentId', assignmentId);
        formDataToSend.append('placeId', placeId);
      }
      formDataToSend.append('lat', currentLocation.lat);
      formDataToSend.append('lng', currentLocation.lng);
      if (startLocation) {
        formDataToSend.append('startLat', startLocation.lat);
        formDataToSend.append('startLng', startLocation.lng);
      }
      photos.forEach(file => {
        formDataToSend.append('photo', file);
      });
      
      // Add all visit report data
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      const response = mode === 'assignment'
        ? await salesAPI.uploadPhoto(formDataToSend)
        : await salesAPI.createAdhocVisitReport(formDataToSend);

      if (response.status === 200 || response.status === 201) {
        onSuccess();
      } else {
        alert(response.data?.message || 'Failed to submit visit report');
      }
    } catch (error) {
      console.error('Error submitting visit report:', error);
      alert('Failed to submit visit report');
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentStep = () => {
    const errors = {};
    
    switch(step) {
      case 1:
        if (!formData.visitDate) errors.visitDate = 'Visit date is required';
        if (!formData.timeIn) errors.timeIn = 'Time in is required';
        if (!formData.timeOut) errors.timeOut = 'Time out is required';
        if (formData.timeIn && formData.timeOut && formData.timeIn >= formData.timeOut) {
          errors.timeOut = 'Time out must be after time in';
        }
        break;
      case 2:
        if (!formData.millCompanyName.trim()) errors.millCompanyName = 'Company name is required';
        if (!formData.ownerContactPerson.trim()) errors.ownerContactPerson = 'Contact person is required';
        if (!formData.mobileNumber) {
          errors.mobileNumber = 'Mobile number is required';
        } else if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
          errors.mobileNumber = 'Mobile number must be 10 digits';
        }
        if (!formData.address.trim()) errors.address = 'Address is required';
        break;
      case 3:
        if (!formData.typeOfMill.trim()) errors.typeOfMill = 'Type of mill is required';
        if (!formData.processingCapacityPerDay.trim()) errors.processingCapacityPerDay = 'Processing capacity is required';
        if (!formData.yearsEstablished) errors.yearsEstablished = 'Years established is required';
        if (!formData.majorGrainTypeProcessed.trim()) errors.majorGrainTypeProcessed = 'Major grain type is required';
        if (formData.numberOfSortingMachine === '' || formData.numberOfSortingMachine === null || formData.numberOfSortingMachine === undefined) {
          errors.numberOfSortingMachine = 'Number of sorting machines is required';
        }
        if (!formData.annualMaintenanceCharges.trim()) errors.annualMaintenanceCharges = 'Annual maintenance charges is required';
        break;
      case 5:
        if (!photos.length) errors.photo = 'At least one photo is required';
        if (!formData.physicallyVisited) errors.physicallyVisited = 'Please confirm you physically visited the site';
        if (!formData.photosTaken) errors.photosTaken = 'Please confirm photos were taken';
        if (!formData.clientMetInPerson) errors.clientMetInPerson = 'Please confirm you met the client in person';
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };
  
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const isStepValid = () => {
    switch(step) {
      case 1:
        // Validate time in is before time out
        const timeInValid = formData.visitDate && formData.timeIn && formData.timeOut;
        if (timeInValid && formData.timeIn >= formData.timeOut) {
          return false; // Time in should be before time out
        }
        return timeInValid;
      case 2:
        // Validate mobile number format (10 digits)
        const mobileValid = /^[0-9]{10}$/.test(formData.mobileNumber);
        return formData.millCompanyName.trim() && 
               formData.ownerContactPerson.trim() && 
               mobileValid && 
               formData.address.trim();
      case 3:
        return formData.typeOfMill.trim() && 
               formData.processingCapacityPerDay.trim() && 
               formData.yearsEstablished && 
               formData.majorGrainTypeProcessed.trim() &&
               formData.numberOfSortingMachine >= 0 &&
               formData.annualMaintenanceCharges.trim();
      case 4:
        return true; // Optional fields
      case 5:
        return photos.length > 0 && 
               formData.physicallyVisited && 
               formData.photosTaken && 
               formData.clientMetInPerson;
      default:
        return false;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-700">Step {step} of 5</span>
          <span className="text-sm text-slate-500">{Math.round((step / 5) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <motion.div 
            className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Visit Information */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-8 h-8 text-green-500" />
              <h2 className="text-2xl font-bold text-slate-800">Visit Information</h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Date of Visit *
              </label>
              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleInputChange}
                required
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-100 transition-all outline-none ${
                  validationErrors.visitDate 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-slate-200 focus:border-green-400'
                }`}
              />
              {validationErrors.visitDate && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.visitDate}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Time In *
                </label>
                <input
                  type="time"
                  name="timeIn"
                  value={formData.timeIn}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-100 transition-all outline-none ${
                    validationErrors.timeIn 
                      ? 'border-red-300 focus:border-red-400' 
                      : 'border-slate-200 focus:border-green-400'
                  }`}
                />
                {validationErrors.timeIn && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.timeIn}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Time Out *
                </label>
                <input
                  type="time"
                  name="timeOut"
                  value={formData.timeOut}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-100 transition-all outline-none ${
                    validationErrors.timeOut 
                      ? 'border-red-300 focus:border-red-400' 
                      : 'border-slate-200 focus:border-green-400'
                  }`}
                />
                {validationErrors.timeOut && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.timeOut}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Company/Contact Details */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-8 h-8 text-green-500" />
              <h2 className="text-2xl font-bold text-slate-800">Company/Contact Details</h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Mill/Company Name *
              </label>
              <input
                type="text"
                name="millCompanyName"
                value={formData.millCompanyName}
                onChange={handleInputChange}
                required
                placeholder="Enter company name"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-100 transition-all outline-none ${
                  validationErrors.millCompanyName 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-slate-200 focus:border-green-400'
                }`}
              />
              {validationErrors.millCompanyName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.millCompanyName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Owner/Contact Person *
              </label>
              <input
                type="text"
                name="ownerContactPerson"
                value={formData.ownerContactPerson}
                onChange={handleInputChange}
                required
                placeholder="Enter contact person name"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-100 transition-all outline-none ${
                  validationErrors.ownerContactPerson 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-slate-200 focus:border-green-400'
                }`}
              />
              {validationErrors.ownerContactPerson && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.ownerContactPerson}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Mobile Number *
              </label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                required
                pattern="[0-9]{10}"
                maxLength="10"
                placeholder="Enter 10-digit mobile number"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-100 transition-all outline-none ${
                  validationErrors.mobileNumber 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-slate-200 focus:border-green-400'
                }`}
              />
              {validationErrors.mobileNumber && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.mobileNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows="3"
                placeholder="Enter complete address"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-100 transition-all outline-none resize-none ${
                  validationErrors.address 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-slate-200 focus:border-green-400'
                }`}
              />
              {validationErrors.address && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Type of Visit *
              </label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg transition-colors ${
                  formData.typeOfVisit === 'First Time' ? 'bg-green-50 border border-green-200' : 'hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="typeOfVisit"
                    value="First Time"
                    checked={formData.typeOfVisit === 'First Time'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 bg-white border-gray-300 focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-slate-700 select-none font-medium">
                    First Time
                    {formData.typeOfVisit === 'First Time' && <span className="ml-2 text-green-600">●</span>}
                  </span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg transition-colors ${
                  formData.typeOfVisit === 'Follow Up' ? 'bg-green-50 border border-green-200' : 'hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    name="typeOfVisit"
                    value="Follow Up"
                    checked={formData.typeOfVisit === 'Follow Up'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 bg-white border-gray-300 focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-slate-700 select-none font-medium">
                    Follow Up
                    {formData.typeOfVisit === 'Follow Up' && <span className="ml-2 text-green-600">●</span>}
                  </span>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Mill/Company/Farm Details */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Factory className="w-8 h-8 text-green-500" />
              <h2 className="text-2xl font-bold text-slate-800">Mill/Company/Farm Details</h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Type of Mill *
              </label>
              <input
                type="text"
                name="typeOfMill"
                value={formData.typeOfMill}
                onChange={handleInputChange}
                required
                placeholder="e.g., Rice Mill, Flour Mill"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-100 transition-all outline-none ${
                  validationErrors.typeOfMill 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-slate-200 focus:border-green-400'
                }`}
              />
              {validationErrors.typeOfMill && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.typeOfMill}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Processing Capacity per Day *
              </label>
              <input
                type="text"
                name="processingCapacityPerDay"
                value={formData.processingCapacityPerDay}
                onChange={handleInputChange}
                required
                placeholder="e.g., 100 tons"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-100 transition-all outline-none ${
                  validationErrors.processingCapacityPerDay 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-slate-200 focus:border-green-400'
                }`}
              />
              {validationErrors.processingCapacityPerDay && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.processingCapacityPerDay}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Years Established *
              </label>
              <input
                type="number"
                name="yearsEstablished"
                value={formData.yearsEstablished}
                onChange={handleInputChange}
                required
                placeholder="e.g., 2010"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-100 transition-all outline-none ${
                  validationErrors.yearsEstablished 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-slate-200 focus:border-green-400'
                }`}
              />
              {validationErrors.yearsEstablished && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.yearsEstablished}</p>
              )}
            </div>

            <div>
              <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                formData.anyMachineInstalled ? 'bg-green-50 border border-green-200' : 'bg-slate-50 hover:bg-slate-100'
              }`}>
                <input
                  type="checkbox"
                  id="anyMachineInstalled"
                  name="anyMachineInstalled"
                  checked={formData.anyMachineInstalled}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer"
                />
                <label 
                  htmlFor="anyMachineInstalled" 
                  className="text-sm font-semibold text-slate-700 select-none cursor-pointer flex-1"
                >
                  Any Machine Installed
                  {formData.anyMachineInstalled && <span className="ml-2 text-green-600">✓</span>}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Major Grain Type Processed *
              </label>
              <input
                type="text"
                name="majorGrainTypeProcessed"
                value={formData.majorGrainTypeProcessed}
                onChange={handleInputChange}
                required
                placeholder="e.g., Rice, Wheat, Corn"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-100 transition-all outline-none ${
                  validationErrors.majorGrainTypeProcessed 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-slate-200 focus:border-green-400'
                }`}
              />
              {validationErrors.majorGrainTypeProcessed && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.majorGrainTypeProcessed}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Number of Sorting Machines *
              </label>
              <input
                type="number"
                name="numberOfSortingMachine"
                value={formData.numberOfSortingMachine}
                onChange={handleInputChange}
                required
                min="0"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-100 transition-all outline-none ${
                  validationErrors.numberOfSortingMachine 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-slate-200 focus:border-green-400'
                }`}
              />
              {validationErrors.numberOfSortingMachine && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.numberOfSortingMachine}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Annual Maintenance Charges *
              </label>
              <input
                type="text"
                name="annualMaintenanceCharges"
                value={formData.annualMaintenanceCharges}
                onChange={handleInputChange}
                required
                placeholder="e.g., ₹50,000"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-green-100 transition-all outline-none ${
                  validationErrors.annualMaintenanceCharges 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-slate-200 focus:border-green-400'
                }`}
              />
              {validationErrors.annualMaintenanceCharges && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.annualMaintenanceCharges}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 4: Competitor & Customer Details */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Competitor Details */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-green-500" />
                <h2 className="text-2xl font-bold text-slate-800">Competitor Details</h2>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  name="competitorName"
                  value={formData.competitorName}
                  onChange={handleInputChange}
                  placeholder="Competitor Name"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                />

                <input
                  type="text"
                  name="machineName"
                  value={formData.machineName}
                  onChange={handleInputChange}
                  placeholder="Machine Name"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                />

                <input
                  type="text"
                  name="machineCapacity"
                  value={formData.machineCapacity}
                  onChange={handleInputChange}
                  placeholder="Machine Capacity"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                />

                <input
                  type="text"
                  name="dealerSupplierName"
                  value={formData.dealerSupplierName}
                  onChange={handleInputChange}
                  placeholder="Dealer/Supplier Name"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Service Quality
                  </label>
                  <select
                    name="serviceQuality"
                    value={formData.serviceQuality}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                  >
                    <option value="">Select Quality</option>
                    <option value="Good">Good</option>
                    <option value="Bad">Bad</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Upgrade/Replacement Interest
                  </label>
                  <select
                    name="upgradeReplacementInterest"
                    value={formData.upgradeReplacementInterest}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                  >
                    <option value="">Select Interest</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Later">Later</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customer Requirement */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-8 h-8 text-green-500" />
                <h2 className="text-2xl font-bold text-slate-800">Customer Requirement</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Requirement Type
                  </label>
                  <select
                    name="requirementType"
                    value={formData.requirementType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                  >
                    <option value="">Select Type</option>
                    <option value="New">New</option>
                    <option value="Replacement">Replacement</option>
                  </select>
                </div>

                <input
                  type="text"
                  name="priceRange"
                  value={formData.priceRange}
                  onChange={handleInputChange}
                  placeholder="Price Range (e.g., ₹5L - ₹10L)"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                />

                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="Model"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Photo Upload & Site Verification */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Camera className="w-8 h-8 text-green-500" />
              <h2 className="text-2xl font-bold text-slate-800">Photo Upload & Verification</h2>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Upload Photo *
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handlePhotoChange}
                  required
                  className="hidden"
                  id="photo-upload"
                  ref={fileInputRef}
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  {photoPreview ? (
                    <div className="relative space-y-4">
                      <img src={photoPreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                      <button
                        type="button"
                        onClick={removeCurrentPhoto}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-sm text-green-600 font-semibold">
                        {photos.length > 1 ? `${photos.length} photos selected` : 'Photo selected! Click to change'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-16 h-16 mx-auto text-slate-400" />
                      <div>
                        <p className="text-lg font-semibold text-slate-700">Click to upload photo</p>
                        <p className="text-sm text-slate-500">Take a photo or select from gallery</p>
                      </div>
                    </div>
                  )}
                </label>
                {photos.length > 1 && (
                  <div className="flex items-center justify-between mt-4 text-xs text-slate-600">
                    <button
                      type="button"
                      onClick={showPrevPhoto}
                      className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      Previous
                    </button>
                    <span>
                      {currentPhotoIndex + 1} / {photos.length}
                    </span>
                    <button
                      type="button"
                      onClick={showNextPhoto}
                      className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      Next
                    </button>
                  </div>
                )}

                {photos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 text-xs text-green-600 hover:text-green-700 font-semibold"
                  >
                    Add more photos
                  </button>
                )}
              </div>
              {validationErrors.photo && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.photo}</p>
              )}
            </div>

            {/* Site Visited Verification */}
            <div className="bg-slate-50 rounded-xl p-6 space-y-6">
              <h3 className="font-semibold text-slate-800 mb-4">Site Visit Verification *</h3>
              
              <div className="space-y-4">
                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors ${
                  formData.physicallyVisited ? 'bg-green-50 border border-green-200' : 'hover:bg-white'
                }`}>
                  <input
                    type="checkbox"
                    name="physicallyVisited"
                    checked={formData.physicallyVisited}
                    onChange={handleInputChange}
                    required
                    className="w-5 h-5 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-slate-700 select-none font-medium">
                    Physically Visited the Site
                    {formData.physicallyVisited && <span className="ml-2 text-green-600">✓</span>}
                  </span>
                </label>
                {validationErrors.physicallyVisited && (
                  <p className="text-red-500 text-sm ml-8">{validationErrors.physicallyVisited}</p>
                )}

                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors ${
                  formData.photosTaken ? 'bg-green-50 border border-green-200' : 'hover:bg-white'
                }`}>
                  <input
                    type="checkbox"
                    name="photosTaken"
                    checked={formData.photosTaken}
                    onChange={handleInputChange}
                    required
                    className="w-5 h-5 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-slate-700 select-none font-medium">
                    Photos Taken
                    {formData.photosTaken && <span className="ml-2 text-green-600">✓</span>}
                  </span>
                </label>
                {validationErrors.photosTaken && (
                  <p className="text-red-500 text-sm ml-8">{validationErrors.photosTaken}</p>
                )}

                <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors ${
                  formData.clientMetInPerson ? 'bg-green-50 border border-green-200' : 'hover:bg-white'
                }`}>
                  <input
                    type="checkbox"
                    name="clientMetInPerson"
                    checked={formData.clientMetInPerson}
                    onChange={handleInputChange}
                    required
                    className="w-5 h-5 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-slate-700 select-none font-medium">
                    Client Met in Person
                    {formData.clientMetInPerson && <span className="ml-2 text-green-600">✓</span>}
                  </span>
                </label>
                {validationErrors.clientMetInPerson && (
                  <p className="text-red-500 text-sm ml-8">{validationErrors.clientMetInPerson}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-slate-200">
        {step > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-slate-600 hover:text-slate-800 font-semibold transition-colors text-sm sm:text-base order-2 sm:order-1"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Previous</span>
          </button>
        )}

        {step < 5 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={!isStepValid()}
            className="ml-auto flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base order-1 sm:order-2"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading || !isStepValid()}
            className="ml-auto flex items-center justify-center gap-2 px-6 py-2 sm:px-8 sm:py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base order-1 sm:order-2"
          >
            {loading ? (
              <>
                <div className="spinner border-white border-t-transparent w-4 h-4 sm:w-5 sm:h-5" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Submit Report</span>
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}

export default VisitReportForm;
