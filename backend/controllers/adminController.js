const Assignment = require('../models/Assignment');
const PhotoUpload = require('../models/PhotoUpload');
const Salesperson = require('../models/Salesperson');
const Expense = require('../models/Expense');
const LoginActivity = require('../models/LoginActivity');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isValidObjectId, isValidEmail, isValidPhone } = require('../utils/validation');
const { updateSalespersonRating, updateAllSalespersonRatings } = require('../utils/ratingUpdater');
const { createSystemNotification } = require('./notificationController');
const { geocodeAddress } = require('../utils/geocoding');
const { sendAssignmentEmail } = require('../services/emailService');

const getOverview = async (req, res) => {
  try {
    const totalSalespersons = await Salesperson.countDocuments({ role: 'salesperson' });
    const totalAssignments = await Assignment.countDocuments();

    const allAssignments = await Assignment.find();
    let totalVisits = 0;
    let totalPlaces = 0;
    allAssignments.forEach(assignment => {
      totalPlaces += assignment.places.length;
      totalVisits += assignment.places.filter(p => p.visited).length;
    });

    const suspiciousUploads = await PhotoUpload.countDocuments({ isSuspicious: true });

    res.json({
      totalSalespersons,
      totalAssignments,
      totalVisits,
      totalPlaces,
      suspiciousUploads
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getSalespersonTracking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid salesperson ID format' });
    }

    const salesperson = await Salesperson.findById(id);
    if (!salesperson) {
      return res.status(404).json({ message: 'Salesperson not found' });
    }

    const assignments = await Assignment.find({ salespersonId: id }).sort({ date: -1 });
    const photos = await PhotoUpload.find({ salespersonId: id }).sort({ timestamp: -1 });
    const loginActivities = await LoginActivity.find({ salesperson: id }).sort({ timestamp: -1 });

    res.json({
      salesperson,
      assignments,
      photos,
      loginActivities
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const assignLocation = async (req, res) => {
  try {
    const { salespersonId, date, places } = req.body;

    if (!isValidObjectId(salespersonId)) {
      return res.status(400).json({ message: 'Invalid salesperson ID format' });
    }

    if (!date || !places || !Array.isArray(places)) {
      return res.status(400).json({ message: 'Invalid assignment data' });
    }

    // Get salesperson details for notification
    const salesperson = await Salesperson.findById(salespersonId);
    if (!salesperson) {
      return res.status(404).json({ message: 'Salesperson not found' });
    }

    const assignment = new Assignment({
      salespersonId,
      date,
      places
    });

    await assignment.save();

    // Create notification for salesperson
    await createSystemNotification(
      salespersonId,
      'New Assignment Created',
      `You have been assigned ${places.length} location(s) for ${new Date(date).toLocaleDateString()}. Please check your dashboard for details.`,
      'info',
      {
        assignmentId: assignment._id,
        locationCount: places.length,
        assignmentDate: date,
        category: 'assignment'
      }
    );

    // Send email notification
    try {
      await sendAssignmentEmail(salesperson.email, salesperson.name, {
        assignmentId: assignment._id,
        date: date,
        locationCount: places.length,
        places: places
      });
    } catch (emailError) {
      console.error('Failed to send assignment email:', emailError);
      // Don't fail the assignment creation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Location assigned successfully',
      assignment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getLiveLocations = async (req, res) => {
  try {
    const salespersons = await Salesperson.find({ role: 'salesperson' })
      .select('name email currentLocation lastActive');

    res.json(salespersons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllSalespersons = async (req, res) => {
  try {
    const salespersons = await Salesperson.find({ role: 'salesperson' })
      .select('name email phone address isActive rating performanceStats currentLocation lastActive dateJoined')
      .sort({ name: 1 });

    const loginStats = await LoginActivity.aggregate([
      { $match: { type: 'login' } },
      {
        $group: {
          _id: '$salesperson',
          lastLoginAt: { $max: '$timestamp' }
        }
      }
    ]);

    const lastLoginMap = new Map(
      loginStats.map(stat => [stat._id.toString(), stat.lastLoginAt])
    );

    const enrichedSalespersons = salespersons.map(sp => {
      const spObj = sp.toObject();
      spObj.lastLoginAt = lastLoginMap.get(sp._id.toString()) || null;
      return spObj;
    });

    res.json({
      success: true,
      data: enrichedSalespersons
    });
  } catch (error) {
    console.error('Error fetching salespersons:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const geocodeAddressEndpoint = async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an address'
      });
    }

    console.log(`\n🔍 Geocoding request for: "${address}"\n`);

    const result = await geocodeAddress(address);

    if (result) {
      res.json({
        success: true,
        data: {
          address: result.display_name,
          lat: result.lat,
          lng: result.lng,
          display_name: result.display_name
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No location found for this address'
      });
    }
  } catch (error) {
    console.error('Geocoding endpoint error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch location'
    });
  }
};

// Create new salesperson
const createSalesperson = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Check if email already exists
    const existingSalesperson = await Salesperson.findOne({ email });
    if (existingSalesperson) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new salesperson
    const newSalesperson = new Salesperson({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role: 'salesperson'
    });

    await newSalesperson.save();

    // Return salesperson without password
    const salespersonResponse = newSalesperson.toObject();
    delete salespersonResponse.password;

    res.status(201).json({
      success: true,
      message: 'Salesperson created successfully',
      data: salespersonResponse
    });
  } catch (error) {
    console.error('Error creating salesperson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create salesperson',
      error: error.message
    });
  }
};

// Update salesperson
const updateSalesperson = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, isActive } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salesperson ID format'
      });
    }

    // Validation
    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Check if salesperson exists
    const salesperson = await Salesperson.findById(id);
    if (!salesperson) {
      return res.status(404).json({
        success: false,
        message: 'Salesperson not found'
      });
    }

    // Check if email already exists (if changing email)
    if (email && email !== salesperson.email) {
      const existingSalesperson = await Salesperson.findOne({ email });
      if (existingSalesperson) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update fields
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedSalesperson = await Salesperson.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Salesperson updated successfully',
      data: updatedSalesperson
    });
  } catch (error) {
    console.error('Error updating salesperson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update salesperson',
      error: error.message
    });
  }
};

// Delete salesperson (soft delete - deactivate)
const deleteSalesperson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salesperson ID format'
      });
    }

    const salesperson = await Salesperson.findById(id);
    if (!salesperson) {
      return res.status(404).json({
        success: false,
        message: 'Salesperson not found'
      });
    }

    // Instead of deleting, deactivate the salesperson
    await Salesperson.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: 'Salesperson deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting salesperson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete salesperson',
      error: error.message
    });
  }
};

// Permanently delete salesperson from database
const permanentDeleteSalesperson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salesperson ID format'
      });
    }

    const salesperson = await Salesperson.findById(id);
    if (!salesperson) {
      return res.status(404).json({
        success: false,
        message: 'Salesperson not found'
      });
    }

    // Permanently delete from database
    await Salesperson.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Salesperson permanently deleted from database'
    });
  } catch (error) {
    console.error('Error permanently deleting salesperson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete salesperson',
      error: error.message
    });
  }
};

// Reactivate salesperson
const reactivateSalesperson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salesperson ID format'
      });
    }

    const salesperson = await Salesperson.findById(id);
    if (!salesperson) {
      return res.status(404).json({
        success: false,
        message: 'Salesperson not found'
      });
    }

    // Reactivate the salesperson
    await Salesperson.findByIdAndUpdate(id, { isActive: true });

    res.json({
      success: true,
      message: 'Salesperson reactivated successfully'
    });
  } catch (error) {
    console.error('Error reactivating salesperson:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate salesperson',
      error: error.message
    });
  }
};

// Update salesperson performance and rating via API
const updateSalespersonRatingAPI = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salesperson ID format'
      });
    }

    const salesperson = await Salesperson.findById(id);
    if (!salesperson) {
      return res.status(404).json({
        success: false,
        message: 'Salesperson not found'
      });
    }

    // Calculate performance stats from assignments
    const assignments = await Assignment.find({ salespersonId: id });
    let totalVisits = 0;
    let approvedVisits = 0;
    let rejectedVisits = 0;

    assignments.forEach(assignment => {
      assignment.places.forEach(place => {
        if (place.visited) {
          totalVisits++;
          if (place.verified) {
            approvedVisits++;
          } else {
            rejectedVisits++;
          }
        }
      });
    });

    // Calculate expense stats
    const expenseStats = await Expense.aggregate([
      { $match: { salesperson: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    let totalExpenses = 0;
    let approvedExpenses = 0;

    expenseStats.forEach(stat => {
      totalExpenses += stat.count;
      if (stat._id === 'approved') {
        approvedExpenses = stat.count;
      }
    });

    // Update performance stats
    salesperson.performanceStats = {
      totalVisits,
      approvedVisits,
      rejectedVisits,
      totalExpenses,
      approvedExpenses
    };

    // Calculate and update rating
    const newRating = salesperson.calculateRating();
    await salesperson.save();

    res.json({
      success: true,
      message: 'Rating updated successfully',
      data: {
        rating: newRating,
        performanceStats: salesperson.performanceStats
      }
    });
  } catch (error) {
    console.error('Error updating salesperson rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rating',
      error: error.message
    });
  }
};

// Get detailed salesperson list with ratings
const getSalespersonsWithRatings = async (req, res) => {
  try {
    const salespersons = await Salesperson.find({ role: 'salesperson' })
      .select('name email phone address isActive rating performanceStats currentLocation lastActive dateJoined')
      .sort({ rating: -1, name: 1 });

    res.json({
      success: true,
      data: salespersons
    });
  } catch (error) {
    console.error('Error fetching salespersons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salespersons',
      error: error.message
    });
  }
};

// Update all salesperson ratings
const updateAllRatings = async (req, res) => {
  try {
    await updateAllSalespersonRatings();

    res.json({
      success: true,
      message: 'All salesperson ratings updated successfully'
    });
  } catch (error) {
    console.error('Error updating all ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ratings',
      error: error.message
    });
  }
};

module.exports = {
  getOverview,
  getSalespersonTracking,
  assignLocation,
  getLiveLocations,
  getAllSalespersons,
  geocodeAddressEndpoint,
  createSalesperson,
  updateSalesperson,
  deleteSalesperson,
  permanentDeleteSalesperson,
  reactivateSalesperson,
  updateSalespersonRating: updateSalespersonRatingAPI,
  getSalespersonsWithRatings,
  updateAllRatings
};
