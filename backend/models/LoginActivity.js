const mongoose = require('mongoose');

const loginActivitySchema = new mongoose.Schema({
  salesperson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salesperson',
    required: true
  },
  type: {
    type: String,
    enum: ['login', 'logout'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  locationName: {
    type: String
  },
  location: {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    }
  }
}, {
  timestamps: false
});

module.exports = mongoose.model('LoginActivity', loginActivitySchema);
