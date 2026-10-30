const express = require('express');
const router = express.Router();
const {
  getAllVisitReports,
  getVisitReportsBySalesperson,
  getVisitReportById,
  exportVisitReportsToCSV,
  getVisitReportStats,
  getMyVisitReports,
  updateVisitReportStatus
} = require('../controllers/visitReportController');
const { authMiddleware, adminMiddleware, limiter } = require('../middleware/authMiddleware');

// Admin routes
router.get('/all', authMiddleware, adminMiddleware, limiter, getAllVisitReports);
router.get('/export/csv', authMiddleware, adminMiddleware, limiter, exportVisitReportsToCSV);
router.get('/stats', authMiddleware, adminMiddleware, limiter, getVisitReportStats);
router.get('/salesperson/:salespersonId', authMiddleware, adminMiddleware, limiter, getVisitReportsBySalesperson);
router.get('/', authMiddleware, limiter, getMyVisitReports);
router.get('/:reportId', authMiddleware, limiter, getVisitReportById);
router.patch('/:reportId/status', authMiddleware, adminMiddleware, limiter, updateVisitReportStatus);

module.exports = router;
