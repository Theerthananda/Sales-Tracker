const express = require('express');
const { getAssignments, uploadPhoto, updateLocation, upload, getMyRating, createAdhocVisitReport } = require('../controllers/salesController');
const { authMiddleware, limiter } = require('../middleware/authMiddleware');

const router = express.Router();
//sales routes
router.get('/:id/assignments', authMiddleware, limiter, getAssignments);
router.post('/upload-photo', authMiddleware, limiter, upload.array('photo', 5), uploadPhoto);
router.post('/update-location', authMiddleware, limiter, updateLocation);
router.get('/my-rating', authMiddleware, limiter, getMyRating);
router.post('/create-visit-report', authMiddleware, limiter, upload.array('photo', 5), createAdhocVisitReport);

module.exports = router;
