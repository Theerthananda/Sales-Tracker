const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  salesperson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salesperson',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['travel', 'food', 'accommodation', 'fuel', 'maintenance', 'communication', 'office', 'other']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  billPhoto: {
    type: String, // URL to the uploaded bill photo
    required: false
  },
  billPhotoUrls: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salesperson'
  }
}, {
  timestamps: true
});

// Index for better query performance
expenseSchema.index({ salesperson: 1, date: -1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
