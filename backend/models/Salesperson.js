const mongoose = require('mongoose');

const salespersonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'salesperson'],
    default: 'salesperson'
  },
  phone: {
    type: String,
    required: false
  },
  address: {
    type: String,
    required: false
  },
  dateJoined: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  currentLocation: {
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  performanceStats: {
    totalVisits: {
      type: Number,
      default: 0
    },
    approvedVisits: {
      type: Number,
      default: 0
    },
    rejectedVisits: {
      type: Number,
      default: 0
    },
    totalExpenses: {
      type: Number,
      default: 0
    },
    approvedExpenses: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Method to calculate rating based on performance
salespersonSchema.methods.calculateRating = function() {
  const stats = this.performanceStats;
  
  if (stats.totalVisits === 0) {
    this.rating = 0;
    return 0;
  }
  
  // Calculate approval rate (0-1)
  const approvalRate = stats.approvedVisits / stats.totalVisits;
  
  // Base rating from approval rate (0-4 stars)
  let rating = approvalRate * 4;
  
  // Bonus star for high activity (>50 visits)
  if (stats.totalVisits > 50) {
    rating += 0.5;
  }
  
  // Bonus for very high approval rate (>90%)
  if (approvalRate > 0.9 && stats.totalVisits > 10) {
    rating += 0.5;
  }
  
  // Cap at 5 stars
  rating = Math.min(5, rating);
  
  this.rating = Math.round(rating * 2) / 2; // Round to nearest 0.5
  return this.rating;
};

module.exports = mongoose.model('Salesperson', salespersonSchema);
