const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const Salesperson = require('../models/Salesperson');

// Get notifications for a user
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.id;

    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          hasMore: page * limit < total
        },
        unreadCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications', 
      error: error.message 
    });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get unread count', 
      error: error.message 
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({ 
      _id: id, 
      recipient: userId 
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read', 
      error: error.message 
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all notifications as read', 
      error: error.message 
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({ 
      _id: id, 
      recipient: userId 
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification', 
      error: error.message 
    });
  }
};

// Delete all notifications
const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Notification.deleteMany({ recipient: userId });

    res.json({
      success: true,
      message: 'All notifications deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete all notifications', 
      error: error.message 
    });
  }
};

// Create notification (Admin only)
const createNotification = async (req, res) => {
  try {
    const { title, message, type, recipients, category, priority, data } = req.body;
    const senderId = req.user.id;

    // Validate recipients
    let recipientIds = [];
    if (recipients === 'all') {
      const allUsers = await Salesperson.find({ isActive: true }, '_id');
      recipientIds = allUsers.map(user => user._id);
    } else if (Array.isArray(recipients)) {
      recipientIds = recipients;
    } else {
      recipientIds = [recipients];
    }

    // Create notifications for all recipients
    const notifications = await Promise.all(
      recipientIds.map(recipientId =>
        Notification.createNotification({
          title,
          message,
          type,
          recipient: recipientId,
          sender: senderId,
          category,
          priority,
          data
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `Notification sent to ${notifications.length} recipient(s)`,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create notification', 
      error: error.message 
    });
  }
};

// Utility function to create system notifications
const createSystemNotification = async (recipientId, title, message, type = 'info', data = {}) => {
  try {
    // Input validation
    if (!recipientId) {
      throw new Error('Recipient ID is required');
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Valid title is required');
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Valid message is required');
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      throw new Error('Invalid recipient ID format');
    }

    // Sanitize inputs
    const sanitizedTitle = title.trim().substring(0, 100); // Limit title length
    const sanitizedMessage = message.trim().substring(0, 500); // Limit message length
    const validTypes = ['info', 'success', 'warning', 'error'];
    const sanitizedType = validTypes.includes(type) ? type : 'info';

    // Check if recipient exists
    const User = require('../models/Salesperson');
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    const notification = new Notification({
      title: sanitizedTitle,
      message: sanitizedMessage,
      type: sanitizedType,
      recipient: recipientId,
      data: data || {},
      category: (data && data.category) || 'system',
      priority: (data && data.priority) || 'medium'
    });

    await notification.save();
    console.log(`✅ System notification created for ${recipient.name} (${recipientId}): ${sanitizedTitle}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating system notification:', error.message);
    
    // Don't throw error to prevent breaking main functionality
    // Log the error but continue execution
    return null;
  }
};

// Cleanup expired notifications
const cleanupExpiredNotifications = async () => {
  try {
    const result = await Notification.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} expired notifications`);
    }
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error cleaning up expired notifications:', error.message);
    return 0;
  }
};

// Cleanup old read notifications (older than 30 days)
const cleanupOldNotifications = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Notification.deleteMany({
      isRead: true,
      readAt: { $lt: thirtyDaysAgo }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} old read notifications`);
    }
    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error cleaning up old notifications:', error.message);
    return 0;
  }
};

// Batch notification creation for better performance
const createBatchNotifications = async (notifications) => {
  try {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      throw new Error('Invalid notifications array');
    }

    // Validate each notification
    const validNotifications = [];
    for (const notif of notifications) {
      if (notif.recipient && notif.title && notif.message) {
        validNotifications.push({
          ...notif,
          title: notif.title.trim().substring(0, 100),
          message: notif.message.trim().substring(0, 500),
          type: ['info', 'success', 'warning', 'error'].includes(notif.type) ? notif.type : 'info',
          category: notif.category || 'system',
          priority: notif.priority || 'medium'
        });
      }
    }

    if (validNotifications.length === 0) {
      throw new Error('No valid notifications to create');
    }

    const result = await Notification.insertMany(validNotifications);
    console.log(`✅ Created ${result.length} batch notifications`);
    return result;
  } catch (error) {
    console.error('❌ Error creating batch notifications:', error.message);
    return [];
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
  createSystemNotification,
  cleanupExpiredNotifications,
  cleanupOldNotifications,
  createBatchNotifications
};
