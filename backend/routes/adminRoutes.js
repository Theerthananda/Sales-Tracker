const express = require('express');
const {
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
  updateSalespersonRating,
  getSalespersonsWithRatings,
  updateAllRatings
} = require('../controllers/adminController');
const { authMiddleware, adminMiddleware, limiter } = require('../middleware/authMiddleware');

const router = express.Router();
//admin routes
router.get('/overview', authMiddleware, adminMiddleware, limiter, getOverview);
router.get('/salesperson/:id/tracking', authMiddleware, adminMiddleware, limiter, getSalespersonTracking);
router.post('/assign-location', authMiddleware, adminMiddleware, limiter, assignLocation);
router.get('/live-locations', authMiddleware, adminMiddleware, limiter, getLiveLocations);
router.get('/salespersons', authMiddleware, adminMiddleware, limiter, getAllSalespersons);
router.post('/geocode', authMiddleware, adminMiddleware, limiter, geocodeAddressEndpoint);

// Salesperson management routes
router.post('/salespersons', authMiddleware, adminMiddleware, limiter, createSalesperson);
router.put('/salespersons/:id', authMiddleware, adminMiddleware, limiter, updateSalesperson);
router.delete('/salespersons/:id', authMiddleware, adminMiddleware, limiter, deleteSalesperson);
router.delete('/salespersons/:id/permanent', authMiddleware, adminMiddleware, limiter, permanentDeleteSalesperson);
router.patch('/salespersons/:id/reactivate', authMiddleware, adminMiddleware, limiter, reactivateSalesperson);
router.patch('/salespersons/:id/rating', authMiddleware, adminMiddleware, limiter, updateSalespersonRating);
router.get('/salespersons-with-ratings', authMiddleware, adminMiddleware, limiter, getSalespersonsWithRatings);
router.post('/update-all-ratings', authMiddleware, adminMiddleware, limiter, updateAllRatings);

module.exports = router;
