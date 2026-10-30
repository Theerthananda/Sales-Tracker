const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  radius: {
    type: Number,
    default: 100
  },
  visited: {
    type: Boolean,
    default: false
  },
  photoUrl: {
    type: String,
    default: null
  },
  visitedAt: {
    type: Date,
    default: null
  },
  verified: {
    type: Boolean,
    default: false
  },
  distanceTraveled: {
    type: Number,
    default: 0
  },
  travelTime: {
    type: Number,
    default: 0
  },
  startLocation: {
    lat: Number,
    lng: Number
  }
});

const assignmentSchema = new mongoose.Schema({
  salespersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salesperson',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  places: [placeSchema],
  totalDistance: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', assignmentSchema);
