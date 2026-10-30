const VisitReport = require('../models/VisitReport');
const Salesperson = require('../models/Salesperson');
const Assignment = require('../models/Assignment');
const { isValidObjectId } = require('../utils/validation');
const { updateSalespersonRating } = require('../utils/ratingUpdater');
const { createSystemNotification } = require('./notificationController');
const { sendVisitStatusEmail } = require('../services/emailService');

// Get all visit reports (Admin only)
const getAllVisitReports = async (req, res) => {
  try {
    const reports = await VisitReport.find()
      .populate('salespersonId', 'name email')
      .populate('assignmentId', 'date')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching visit reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get visit reports by salesperson
const getVisitReportsBySalesperson = async (req, res) => {
  try {
    const { salespersonId } = req.params;

    if (!isValidObjectId(salespersonId)) {
      return res.status(400).json({ message: 'Invalid salesperson ID format' });
    }

    const reports = await VisitReport.find({ salespersonId })
      .populate('assignmentId', 'date')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching visit reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single visit report
const getVisitReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ message: 'Invalid report ID format' });
    }

    const report = await VisitReport.findById(reportId)
      .populate('salespersonId', 'name email')
      .populate('assignmentId', 'date');

    if (!report) {
      return res.status(404).json({ message: 'Visit report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching visit report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Export visit reports to CSV
const exportVisitReportsToCSV = async (req, res) => {
  try {
    const reports = await VisitReport.find()
      .populate('salespersonId', 'name email')
      .populate('assignmentId', 'date')
      .sort({ createdAt: -1 });

    // CSV Headers
    const headers = [
      'Report ID',
      'Salesperson Name',
      'Salesperson Email',
      'Visit Date',
      'Time In',
      'Time Out',
      'Mill/Company Name',
      'Owner/Contact Person',
      'Mobile Number',
      'Address',
      'Type of Visit',
      'Type of Mill',
      'Processing Capacity/Day',
      'Years Established',
      'Machine Installed',
      'Major Grain Type',
      'Number of Sorting Machines',
      'Annual Maintenance Charges',
      'Competitor Name',
      'Competitor Machine Name',
      'Competitor Machine Capacity',
      'Dealer/Supplier Name',
      'Service Quality',
      'Upgrade/Replacement Interest',
      'Requirement Type',
      'Price Range',
      'Model',
      'Physically Visited',
      'Photos Taken',
      'Client Met in Person',
      'Distance from Target (m)',
      'Suspicious',
      'Verified',
      'Submitted At'
    ];

    // Convert data to CSV rows
    const rows = reports.map(report => [
      report._id,
      report.salespersonId?.name || 'N/A',
      report.salespersonId?.email || 'N/A',
      new Date(report.visitDate).toLocaleDateString(),
      report.timeIn,
      report.timeOut,
      report.millCompanyName,
      report.ownerContactPerson,
      report.mobileNumber,
      report.address.replace(/,/g, ';'), // Replace commas to avoid CSV issues
      report.typeOfVisit,
      report.typeOfMill,
      report.processingCapacityPerDay,
      report.yearsEstablished,
      report.anyMachineInstalled ? 'Yes' : 'No',
      report.majorGrainTypeProcessed,
      report.numberOfSortingMachine,
      report.annualMaintenanceCharges,
      report.competitorDetails?.competitorName || '',
      report.competitorDetails?.machineName || '',
      report.competitorDetails?.machineCapacity || '',
      report.competitorDetails?.dealerSupplierName || '',
      report.competitorDetails?.serviceQuality || '',
      report.competitorDetails?.upgradeReplacementInterest || '',
      report.customerRequirement?.requirementType || '',
      report.customerRequirement?.priceRange || '',
      report.customerRequirement?.model || '',
      report.siteVisited?.physicallyVisited ? 'Yes' : 'No',
      report.siteVisited?.photosTaken ? 'Yes' : 'No',
      report.siteVisited?.clientMetInPerson ? 'Yes' : 'No',
      report.distanceFromTarget.toFixed(2),
      report.isSuspicious ? 'Yes' : 'No',
      report.verified ? 'Yes' : 'No',
      new Date(report.createdAt).toLocaleString()
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=visit-reports-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting visit reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get visit report statistics
const getVisitReportStats = async (req, res) => {
  try {
    const totalReports = await VisitReport.countDocuments();
    const verifiedReports = await VisitReport.countDocuments({ verified: true });
    const suspiciousReports = await VisitReport.countDocuments({ isSuspicious: true });

    const firstTimeVisits = await VisitReport.countDocuments({ typeOfVisit: 'First Time' });
    const followUpVisits = await VisitReport.countDocuments({ typeOfVisit: 'Follow Up' });

    const reportsWithCompetitorInfo = await VisitReport.countDocuments({
      'competitorDetails.competitorName': { $ne: '' }
    });

    res.json({
      totalReports,
      verifiedReports,
      suspiciousReports,
      firstTimeVisits,
      followUpVisits,
      reportsWithCompetitorInfo
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyVisitReports = async (req, res) => {
  try {
    const salespersonId = req.user.id;
    const { limit = 5 } = req.query;

    const reports = await VisitReport.find({ salespersonId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .select('millCompanyName visitDate adminApproval locationName verified isSuspicious createdAt');

    res.json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching salesperson visit reports:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateVisitReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, remark } = req.body;

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ message: 'Invalid report ID format' });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }

    const report = await VisitReport.findById(reportId).populate('salespersonId', 'name email');
    if (!report) {
      return res.status(404).json({ message: 'Visit report not found' });
    }

    const admin = await Salesperson.findById(req.user.id).select('name');
    report.adminApproval = {
      status,
      remark: remark || '',
      approver: admin?.name || 'Admin',
      timestamp: new Date()
    };

    report.verified = status === 'Approved';
    await report.save();

    if (report.assignmentId && report.placeId) {
      try {
        const assignment = await Assignment.findById(report.assignmentId);
        if (assignment) {
          const place = assignment.places.id(report.placeId);
          if (place) {
            place.verified = report.verified;
            await assignment.save();
          }
        }
      } catch (assignmentError) {
        console.error('Failed to update assignment place status:', assignmentError);
      }
    }

    try {
      await updateSalespersonRating(report.salespersonId);
    } catch (ratingError) {
      console.error('Failed to update salesperson rating after visit approval:', ratingError);
    }

    try {
      await createSystemNotification(
        report.salespersonId,
        `Visit ${status}`,
        `Your visit report for ${report.millCompanyName} has been ${status.toLowerCase()}${remark ? ` with remark: ${remark}` : ''}.`,
        status === 'Approved' ? 'success' : 'error',
        {
          category: 'visit',
          visitReportId: report._id,
          assignmentId: report.assignmentId,
          status,
          remark
        }
      );
    } catch (notificationError) {
      console.error('Failed to create visit approval notification:', notificationError);
    }

    // Send email notification to salesperson
    try {
      await sendVisitStatusEmail(report.salespersonId.email, report.salespersonId.name, {
        millCompanyName: report.millCompanyName,
        visitDate: report.visitDate,
        status,
        remark
      });
    } catch (emailError) {
      console.error('Failed to send visit status email:', emailError);
      // Don't fail the status update if email fails
    }

    res.json({
      success: true,
      message: `Visit report ${status.toLowerCase()} successfully`,
      data: report
    });
  } catch (error) {
    console.error('Error updating visit report status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllVisitReports,
  getVisitReportsBySalesperson,
  getVisitReportById,
  exportVisitReportsToCSV,
  getVisitReportStats,
  getMyVisitReports,
  updateVisitReportStatus
};
