const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { 
  notificationRateLimit, 
  preventNotificationSpam, 
  validateNotificationData 
} = require('../middleware/notificationMiddleware');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authMiddleware);

// Get notifications for current user
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Delete all notifications
router.delete('/', deleteAllNotifications);

// Admin only routes with validation and rate limiting
router.post('/create', 
  authMiddleware, 
  adminMiddleware, 
  notificationRateLimit,
  validateNotificationData,
  preventNotificationSpam,
  createNotification
);

module.exports = router;
