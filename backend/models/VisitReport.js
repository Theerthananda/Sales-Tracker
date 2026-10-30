const mongoose = require('mongoose');

const visitReportSchema = new mongoose.Schema({
  salespersonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salesperson',
    required: true
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: false
  },
  placeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  origin: {
    type: String,
    enum: ['AdminAssignment', 'SalespersonAdhoc'],
    default: 'AdminAssignment'
  },
  
  // Basic Visit Information
  visitDate: {
    type: Date,
    required: true
  },
  timeIn: {
    type: String,
    required: true
  },
  timeOut: {
    type: String,
    required: true
  },
  
  // Company/Contact Details
  millCompanyName: {
    type: String,
    required: true
  },
  ownerContactPerson: {
    type: String,
    required: true
  },
  mobileNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  typeOfVisit: {
    type: String,
    enum: ['First Time', 'Follow Up'],
    required: true
  },
  
  // Mill/Company/Farm Details
  typeOfMill: {
    type: String,
    required: true
  },
  processingCapacityPerDay: {
    type: String,
    required: true
  },
  yearsEstablished: {
    type: Number,
    required: true
  },
  anyMachineInstalled: {
    type: Boolean,
    required: true
  },
  majorGrainTypeProcessed: {
    type: String,
    required: true
  },
  numberOfSortingMachine: {
    type: Number,
    required: true
  },
  annualMaintenanceCharges: {
    type: String,
    required: true
  },
  
  // Competitor Details
  competitorDetails: {
    competitorName: {
      type: String,
      default: ''
    },
    machineName: {
      type: String,
      default: ''
    },
    machineCapacity: {
      type: String,
      default: ''
    },
    dealerSupplierName: {
      type: String,
      default: ''
    },
    serviceQuality: {
      type: String,
      enum: ['Good', 'Bad', 'Excellent', ''],
      default: ''
    },
    upgradeReplacementInterest: {
      type: String,
      enum: ['Yes', 'No', 'Later', ''],
      default: ''
    }
  },
  
  // Customer Requirement
  customerRequirement: {
    requirementType: {
      type: String,
      enum: ['New', 'Replacement', ''],
      default: ''
    },
    priceRange: {
      type: String,
      default: ''
    },
    model: {
      type: String,
      default: ''
    }
  },
  
  // Site Visited Verification
  siteVisited: {
    physicallyVisited: {
      type: Boolean,
      required: true
    },
    photosTaken: {
      type: Boolean,
      required: true
    },
    clientMetInPerson: {
      type: Boolean,
      required: true
    }
  },
  
  // Photo and Location Data
  photoUrl: {
    type: String,
    required: true
  },
  additionalPhotoUrls: {
    type: [String],
    default: []
  },
  startCoordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  locationName: {
    type: String,
    default: ''
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  distanceFromTarget: {
    type: Number,
    required: true
  },
  isSuspicious: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  adminApproval: {
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    remark: {
      type: String,
      default: ''
    },
    approver: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('VisitReport', visitReportSchema);
