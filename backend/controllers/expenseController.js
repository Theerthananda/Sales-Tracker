const Expense = require('../models/Expense');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { updateSalespersonRating } = require('../utils/ratingUpdater');
const { createSystemNotification } = require('./notificationController');
const Salesperson = require('../models/Salesperson');
const { sendExpenseStatusEmail, sendExpenseSubmissionEmail } = require('../services/emailService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/expenses/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'expense-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'));
    }
  }
});

// Create new expense
const createExpense = async (req, res) => {
  try {
    const { date, amount, category, description } = req.body;
    const salespersonId = req.user.id;

    // Validate required fields
    if (!date || !amount || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Handle bill photo if uploaded
    let billPhoto = null;
    let billPhotoUrls = [];
    const files = req.files || [];
    if (files.length) {
      billPhotoUrls = files.map(file => `/uploads/expenses/${file.filename}`);
      billPhoto = billPhotoUrls[0] || null;
    }

    const expense = new Expense({
      salesperson: salespersonId,
      date: new Date(date),
      amount: parseFloat(amount),
      category,
      description,
      billPhoto,
      billPhotoUrls
    });

    await expense.save();
    await expense.populate('salesperson', 'name email');

    // Create notification for admin about new expense submission
    const adminUsers = await Salesperson.find({ role: 'admin' });
    for (const admin of adminUsers) {
      await createSystemNotification(
        admin._id,
        'New Expense Submitted',
        `${expense.salesperson.name} has submitted an expense of ₹${amount} for ${category}. Requires approval.`,
        'info',
        {
          expenseId: expense._id,
          salespersonId,
          salespersonName: expense.salesperson.name,
          amount: parseFloat(amount),
          category,
          category: 'expense'
        }
      );
    }

    // Send email notification to admins
    for (const admin of adminUsers) {
      try {
        await sendExpenseSubmissionEmail(admin.email, {
          salespersonName: expense.salesperson.name,
          amount: parseFloat(amount),
          category,
          date: expense.date,
          description
        });
      } catch (emailError) {
        console.error('Failed to send expense submission email:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Expense submitted successfully',
      data: expense
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit expense',
      error: error.message
    });
  }
};

// Get expenses for a salesperson
const getSalespersonExpenses = async (req, res) => {
  try {
    const salespersonId = req.user.id;
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = { salesperson: salespersonId };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const expenses = await Expense.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('salesperson', 'name email');

    const total = await Expense.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message
    });
  }
};

// Get all expenses for admin
const getAllExpenses = async (req, res) => {
  try {
    const { status, salespersonId, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (salespersonId) {
      // Convert string to ObjectId properly
      try {
        filter.salesperson = new mongoose.Types.ObjectId(salespersonId);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid salesperson ID format'
        });
      }
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const expenses = await Expense.find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('salesperson', 'name email')
      .populate('reviewedBy', 'name email');

    const total = await Expense.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('Error fetching all expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message
    });
  }
};

// Update expense status (approve/reject)
const updateExpenseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or rejected'
      });
    }

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Expense has already been reviewed'
      });
    }

    expense.status = status;
    expense.adminNotes = adminNotes || '';
    expense.reviewedAt = new Date();
    expense.reviewedBy = adminId;

    await expense.save();
    await expense.populate('salesperson', 'name email');
    await expense.populate('reviewedBy', 'name email');

    // Update salesperson rating automatically
    try {
      await updateSalespersonRating(expense.salesperson._id);
    } catch (ratingError) {
      console.error('Error updating salesperson rating:', ratingError);
      // Don't fail the main operation if rating update fails
    }

    // Create notification for salesperson about expense status update
    await createSystemNotification(
      expense.salesperson._id,
      `Expense ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      `Your expense of ₹${expense.amount} for ${expense.category} has been ${status}.${adminNotes ? ` Admin notes: ${adminNotes}` : ''}`,
      status === 'approved' ? 'success' : 'error',
      {
        expenseId: expense._id,
        amount: expense.amount,
        category: expense.category,
        status,
        adminNotes,
        category: 'expense'
      }
    );

    // Send email notification to salesperson
    try {
      await sendExpenseStatusEmail(expense.salesperson.email, expense.salesperson.name, {
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        status,
        adminNotes
      });
      console.log(`Expense status email sent to ${expense.salesperson.email}`);
    } catch (emailError) {
      console.error('Failed to send expense status email:', emailError);
      // Don't fail the status update if email fails
    }

    res.status(200).json({
      success: true,
      message: `Expense ${status} successfully`,
      data: expense
    });
  } catch (error) {
    console.error('Error updating expense status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense status',
      error: error.message
    });
  }
};

// Get expense statistics
const getExpenseStats = async (req, res) => {
  try {
    const { salespersonId, startDate, endDate } = req.query;

    // Build match stage
    const matchStage = {};

    if (salespersonId) {
      try {
        matchStage.salesperson = new mongoose.Types.ObjectId(salespersonId);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid salesperson ID format'
        });
      }
    }

    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const stats = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const result = {
      pending: { count: 0, totalAmount: 0 },
      approved: { count: 0, totalAmount: 0 },
      rejected: { count: 0, totalAmount: 0 },
      overall: { count: 0, totalAmount: 0 }
    };

    stats.forEach(stat => {
      result[stat._id] = {
        count: stat.count,
        totalAmount: stat.totalAmount
      };
      result.overall.count += stat.count;
      result.overall.totalAmount += stat.totalAmount;
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense statistics',
      error: error.message
    });
  }
};

// Delete expense (only pending expenses can be deleted by salesperson)
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const salespersonId = req.user.id;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if the expense belongs to the salesperson
    if (expense.salesperson.toString() !== salespersonId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense'
      });
    }

    // Check if expense is still pending
    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete expense that has been reviewed'
      });
    }

    // Delete associated bill photo if exists
    const billPhotoPaths = new Set();
    if (expense.billPhoto) {
      billPhotoPaths.add(expense.billPhoto);
    }
    if (Array.isArray(expense.billPhotoUrls)) {
      expense.billPhotoUrls.forEach(url => {
        if (url) billPhotoPaths.add(url);
      });
    }
    billPhotoPaths.forEach(url => {
      const photoPath = path.join(__dirname, '..', url);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    });

    await Expense.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expense',
      error: error.message
    });
  }
};

const notifyPendingExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const salespersonId = req.user.id;

    const expense = await Expense.findById(id).populate('salesperson', 'name email');
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    if (expense.salesperson._id.toString() !== salespersonId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to notify for this expense'
      });
    }

    if (expense.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending expenses can trigger notifications'
      });
    }

    const submittedTime = expense.submittedAt || expense.createdAt;
    const ageMs = Date.now() - new Date(submittedTime).getTime();
    const minDelayMs = 2 * 60 * 1000;

    if (ageMs < minDelayMs) {
      return res.status(400).json({
        success: false,
        message: 'You can notify admin only after 2 minutes from submission'
      });
    }

    const adminUsers = await Salesperson.find({ role: 'admin' });
    if (!adminUsers.length) {
      return res.status(200).json({
        success: true,
        message: 'No admin users found to notify'
      });
    }

    await Promise.all(
      adminUsers.map((admin) =>
        createSystemNotification(
          admin._id,
          'Pending Expense Reminder',
          `${expense.salesperson.name} has a pending expense of ${expense.amount} for ${expense.category}`,
          'warning',
          {
            expenseId: expense._id,
            salespersonId: expense.salesperson._id,
            salespersonName: expense.salesperson.name,
            amount: expense.amount,
            category: expense.category,
            status: expense.status,
            category: 'expense'
          }
        )
      )
    );

    res.status(200).json({
      success: true,
      message: 'Admins have been notified about this pending expense'
    });
  } catch (error) {
    console.error('Error notifying admins about pending expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to notify admin about pending expense',
      error: error.message
    });
  }
};

// Export expenses to Excel
const exportToExcel = async (req, res) => {
  try {
    const { status, salespersonId, startDate, endDate } = req.query;

    // Build filter
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (salespersonId) {
      try {
        filter.salesperson = new mongoose.Types.ObjectId(salespersonId);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid salesperson ID format'
        });
      }
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .sort({ submittedAt: -1 })
      .populate('salesperson', 'name email')
      .populate('reviewedBy', 'name email');

    // Prepare data for Excel
    const excelData = expenses.map(expense => ({
      'Expense ID': expense._id.toString(),
      'Salesperson Name': expense.salesperson?.name || 'N/A',
      'Salesperson Email': expense.salesperson?.email || 'N/A',
      'Expense Date': new Date(expense.date).toLocaleDateString('en-US'),
      'Category': expense.category.charAt(0).toUpperCase() + expense.category.slice(1),
      'Amount': expense.amount,
      'Description': expense.description,
      'Status': expense.status.charAt(0).toUpperCase() + expense.status.slice(1),
      'Submitted At': new Date(expense.submittedAt).toLocaleString('en-US'),
      'Reviewed At': expense.reviewedAt ? new Date(expense.reviewedAt).toLocaleString('en-US') : 'N/A',
      'Reviewed By': expense.reviewedBy?.name || 'N/A',
      'Admin Notes': expense.adminNotes || 'N/A',
      'Bill Photo': expense.billPhoto ? 'Yes' : 'No'
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 25 }, // Expense ID
      { wch: 20 }, // Salesperson Name
      { wch: 30 }, // Salesperson Email
      { wch: 15 }, // Expense Date
      { wch: 15 }, // Category
      { wch: 10 }, // Amount
      { wch: 30 }, // Description
      { wch: 10 }, // Status
      { wch: 20 }, // Submitted At
      { wch: 20 }, // Reviewed At
      { wch: 20 }, // Reviewed By
      { wch: 30 }, // Admin Notes
      { wch: 10 }  // Bill Photo
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Expense Reports');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `expense-reports-${timestamp}.xlsx`;

    // Write to buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers and send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);

  } catch (error) {
    console.error('Error exporting expenses to Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export expenses to Excel',
      error: error.message
    });
  }
};

module.exports = {
  createExpense,
  getSalespersonExpenses,
  getAllExpenses,
  updateExpenseStatus,
  getExpenseStats,
  deleteExpense,
  notifyPendingExpense,
  exportToExcel,
  upload
};
