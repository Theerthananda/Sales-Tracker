const Assignment = require('../models/Assignment');
const PhotoUpload = require('../models/PhotoUpload');
const VisitReport = require('../models/VisitReport');
const Salesperson = require('../models/Salesperson');
const calculateDistance = require('../utils/calculateDistance');
const { calculateDistance: calcDist } = require('../utils/distance');
const { isValidObjectId, sanitizeNumber, sanitizeFloat } = require('../utils/validation');
const { updateSalespersonRating } = require('../utils/ratingUpdater');
const { createSystemNotification } = require('./notificationController');
const { sendVisitCompletionEmail } = require('../services/emailService');
const { reverseGeocode } = require('../utils/geocoding');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

const getAssignments = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    if (req.user.role !== 'admin' && req.user.id.toString() !== id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only view your own assignments.' });
    }

    const assignments = await Assignment.find({ salespersonId: id }).sort({ date: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const uploadPhoto = async (req, res) => {
  try {
    const {
      assignmentId,
      placeId,
      lat,
      lng,
      startLat,
      startLng,
      // Visit Information
      visitDate,
      timeIn,
      timeOut,
      // Company/Contact Details
      millCompanyName,
      ownerContactPerson,
      mobileNumber,
      address,
      typeOfVisit,
      // Mill/Company/Farm Details
      typeOfMill,
      processingCapacityPerDay,
      yearsEstablished,
      anyMachineInstalled,
      majorGrainTypeProcessed,
      numberOfSortingMachine,
      annualMaintenanceCharges,
      // Competitor Details
      competitorName,
      machineName,
      machineCapacity,
      dealerSupplierName,
      serviceQuality,
      upgradeReplacementInterest,
      // Customer Requirement
      requirementType,
      priceRange,
      model,
      // Site Visited
      physicallyVisited,
      photosTaken,
      clientMetInPerson
    } = req.body;

    const salespersonId = req.user.id;
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    if (!isValidObjectId(assignmentId)) {
      return res.status(400).json({ message: 'Invalid assignment ID format' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.salespersonId.toString() !== salespersonId.toString()) {
      return res.status(403).json({ message: 'Access denied. This assignment does not belong to you.' });
    }

    const place = assignment.places.id(placeId);
    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    const distance = calculateDistance(
      parseFloat(lat),
      parseFloat(lng),
      place.lat,
      place.lng
    );

    const isSuspicious = distance > 100;
    const mainPhoto = files[0];
    const photoUrl = `/uploads/${mainPhoto.filename}`;
    const additionalPhotoUrls = files.slice(1).map(file => `/uploads/${file.filename}`);

    const latNum = sanitizeFloat(lat, 0);
    const lngNum = sanitizeFloat(lng, 0);

    let locationName = '';
    try {
      const reverseResult = await reverseGeocode(latNum, lngNum);
      if (reverseResult && reverseResult.display_name) {
        locationName = reverseResult.display_name;
      }
    } catch (geoError) {
      console.error('Error reverse geocoding visit location:', geoError.message || geoError);
    }

    const startLatNum = sanitizeFloat(startLat || lat, 0);
    const startLngNum = sanitizeFloat(startLng || lng, 0);

    // Calculate distance traveled from start location
    const salesperson = await Salesperson.findById(salespersonId);
    let distanceTraveled = 0;
    if (salesperson.currentLocation && salesperson.currentLocation.lat) {
      distanceTraveled = calcDist(
        salesperson.currentLocation.lat,
        salesperson.currentLocation.lng,
        place.lat,
        place.lng
      );
    }

    place.visited = true;
    place.photoUrl = photoUrl;
    place.visitedAt = new Date();
    place.verified = !isSuspicious;
    place.distanceTraveled = distanceTraveled;
    place.startLocation = salesperson.currentLocation;

    // Update assignment total distance
    assignment.totalDistance = (assignment.totalDistance || 0) + distanceTraveled;
    assignment.status = 'in-progress';

    await assignment.save();

    // Update salesperson rating automatically
    try {
      await updateSalespersonRating(salespersonId);
    } catch (ratingError) {
      console.error('Error updating salesperson rating:', ratingError);
      // Don't fail the main operation if rating update fails
    }

    // Create Photo Upload record (legacy)
    const photoUpload = new PhotoUpload({
      salespersonId,
      assignmentId,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      photoUrl,
      distanceFromTarget: distance,
      isSuspicious
    });
    await photoUpload.save();

    // Create comprehensive Visit Report
    const visitReport = new VisitReport({
      salespersonId,
      assignmentId,
      placeId,
      visitDate: new Date(visitDate),
      timeIn,
      timeOut,
      millCompanyName,
      ownerContactPerson,
      mobileNumber,
      address,
      typeOfVisit,
      typeOfMill,
      processingCapacityPerDay,
      yearsEstablished: sanitizeNumber(yearsEstablished, 0),
      anyMachineInstalled: anyMachineInstalled === 'true' || anyMachineInstalled === true,
      majorGrainTypeProcessed,
      numberOfSortingMachine: sanitizeNumber(numberOfSortingMachine, 0),
      annualMaintenanceCharges,
      competitorDetails: {
        competitorName: competitorName || '',
        machineName: machineName || '',
        machineCapacity: machineCapacity || '',
        dealerSupplierName: dealerSupplierName || '',
        serviceQuality: serviceQuality || '',
        upgradeReplacementInterest: upgradeReplacementInterest || ''
      },
      customerRequirement: {
        requirementType: requirementType || '',
        priceRange: priceRange || '',
        model: model || ''
      },
      siteVisited: {
        physicallyVisited: physicallyVisited === 'true' || physicallyVisited === true,
        photosTaken: photosTaken === 'true' || photosTaken === true,
        clientMetInPerson: clientMetInPerson === 'true' || clientMetInPerson === true
      },
      photoUrl,
      additionalPhotoUrls,
      startCoordinates: {
        lat: startLatNum,
        lng: startLngNum
      },
      locationName,
      lat: latNum,
      lng: lngNum,
      distanceFromTarget: distance,
      isSuspicious,
      verified: !isSuspicious
    });

    await visitReport.save();

    // Create notification for admin about visit completion
    const adminUsers = await Salesperson.find({ role: 'admin' });
    for (const admin of adminUsers) {
      await createSystemNotification(
        admin._id,
        'Visit Completed',
        `${salesperson.name} has completed a visit at ${place.name}. ${isSuspicious ? 'Location verification failed - requires review.' : 'Visit verified successfully.'}`,
        isSuspicious ? 'warning' : 'success',
        {
          salespersonId,
          salespersonName: salesperson.name,
          assignmentId,
          placeId,
          placeName: place.name,
          visitReportId: visitReport._id,
          isSuspicious,
          category: 'visit'
        }
      );

      // Send email notification to admin
      try {
        await sendVisitCompletionEmail(admin.email, {
          salespersonName: salesperson.name,
          placeName: place.name,
          isSuspicious,
          visitReportId: visitReport._id
        });
        console.log(`Visit completion email sent to admin ${admin.email}`);
      } catch (emailError) {
        console.error('Failed to send visit completion email:', emailError);
        // Don't fail the visit submission if email fails
      }
    }

    await Salesperson.findByIdAndUpdate(salespersonId, {
      currentLocation: { lat: latNum, lng: lngNum },
      lastActive: new Date()
    });

    res.json({
      message: 'Visit report submitted successfully',
      distance,
      isSuspicious,
      visitReport
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createAdhocVisitReport = async (req, res) => {
  try {
    const {
      lat,
      lng,
      startLat,
      startLng,
      // Visit Information
      visitDate,
      timeIn,
      timeOut,
      // Company/Contact Details
      millCompanyName,
      ownerContactPerson,
      mobileNumber,
      address,
      typeOfVisit,
      // Mill/Company/Farm Details
      typeOfMill,
      processingCapacityPerDay,
      yearsEstablished,
      anyMachineInstalled,
      majorGrainTypeProcessed,
      numberOfSortingMachine,
      annualMaintenanceCharges,
      // Competitor Details
      competitorName,
      machineName,
      machineCapacity,
      dealerSupplierName,
      serviceQuality,
      upgradeReplacementInterest,
      // Customer Requirement
      requirementType,
      priceRange,
      model,
      // Site Visited
      physicallyVisited,
      photosTaken,
      clientMetInPerson
    } = req.body;

    const salespersonId = req.user.id;
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    const mainPhoto = files[0];
    const photoUrl = `/uploads/${mainPhoto.filename}`;
    const additionalPhotoUrls = files.slice(1).map(file => `/uploads/${file.filename}`);

    const latNum = sanitizeFloat(lat, 0);
    const lngNum = sanitizeFloat(lng, 0);

    let locationName = '';
    try {
      const reverseResult = await reverseGeocode(latNum, lngNum);
      if (reverseResult && reverseResult.display_name) {
        locationName = reverseResult.display_name;
      }
    } catch (geoError) {
      console.error('Error reverse geocoding visit location (adhoc):', geoError.message || geoError);
    }

    const startLatNum = sanitizeFloat(startLat || lat, 0);
    const startLngNum = sanitizeFloat(startLng || lng, 0);

    const salesperson = await Salesperson.findById(salespersonId);

    const visitReport = new VisitReport({
      salespersonId,
      assignmentId: null,
      placeId: null,
      origin: 'SalespersonAdhoc',
      visitDate: new Date(visitDate),
      timeIn,
      timeOut,
      millCompanyName,
      ownerContactPerson,
      mobileNumber,
      address,
      typeOfVisit,
      typeOfMill,
      processingCapacityPerDay,
      yearsEstablished: sanitizeNumber(yearsEstablished, 0),
      anyMachineInstalled: anyMachineInstalled === 'true' || anyMachineInstalled === true,
      majorGrainTypeProcessed,
      numberOfSortingMachine: sanitizeNumber(numberOfSortingMachine, 0),
      annualMaintenanceCharges,
      competitorDetails: {
        competitorName: competitorName || '',
        machineName: machineName || '',
        machineCapacity: machineCapacity || '',
        dealerSupplierName: dealerSupplierName || '',
        serviceQuality: serviceQuality || '',
        upgradeReplacementInterest: upgradeReplacementInterest || ''
      },
      customerRequirement: {
        requirementType: requirementType || '',
        priceRange: priceRange || '',
        model: model || ''
      },
      siteVisited: {
        physicallyVisited: physicallyVisited === 'true' || physicallyVisited === true,
        photosTaken: photosTaken === 'true' || photosTaken === true,
        clientMetInPerson: clientMetInPerson === 'true' || clientMetInPerson === true
      },
      photoUrl,
      additionalPhotoUrls,
      startCoordinates: {
        lat: startLatNum,
        lng: startLngNum
      },
      locationName,
      lat: latNum,
      lng: lngNum,
      distanceFromTarget: 0,
      isSuspicious: false,
      verified: false
    });

    await visitReport.save();

    // Notify admins
    const adminUsers = await Salesperson.find({ role: 'admin' });
    for (const admin of adminUsers) {
      await createSystemNotification(
        admin._id,
        'Salesperson Visit Created',
        `${salesperson.name} has created a self-initiated visit report for ${millCompanyName}.`,
        'info',
        {
          salespersonId,
          salespersonName: salesperson.name,
          visitReportId: visitReport._id,
          category: 'visit',
          origin: 'SalespersonAdhoc'
        }
      );
    }

    // Send email notification to admins
    for (const admin of adminUsers) {
      try {
        await sendVisitCompletionEmail(admin.email, {
          salespersonName: salesperson.name,
          placeName: millCompanyName,
          isSuspicious: false,
          visitReportId: visitReport._id
        });
      } catch (emailError) {
        console.error('Failed to send ad-hoc visit email:', emailError);
      }
    }

    res.status(201).json({
      message: 'Salesperson visit report submitted successfully',
      visitReport
    });
  } catch (error) {
    console.error('Salesperson visit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const salespersonId = req.user.id;

    await Salesperson.findByIdAndUpdate(salespersonId, {
      currentLocation: { lat, lng },
      lastActive: new Date()
    });

    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get salesperson's own rating and performance stats
const getMyRating = async (req, res) => {
  try {
    const salespersonId = req.user.id;

    const salesperson = await Salesperson.findById(salespersonId)
      .select('name email rating performanceStats dateJoined isActive');

    if (!salesperson) {
      return res.status(404).json({
        success: false,
        message: 'Salesperson not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: salesperson._id,
        name: salesperson.name,
        email: salesperson.email,
        rating: salesperson.rating || 0,
        performanceStats: salesperson.performanceStats || {
          totalVisits: 0,
          approvedVisits: 0,
          rejectedVisits: 0,
          totalExpenses: 0,
          approvedExpenses: 0
        },
        dateJoined: salesperson.dateJoined,
        isActive: salesperson.isActive
      }
    });
  } catch (error) {
    console.error('Error fetching salesperson rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rating',
      error: error.message
    });
  }
};

module.exports = { getAssignments, uploadPhoto, updateLocation, upload, getMyRating, createAdhocVisitReport };
