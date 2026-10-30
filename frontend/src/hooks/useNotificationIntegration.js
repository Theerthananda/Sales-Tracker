import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { notificationAPI } from '../api';

// Hook to integrate backend notifications with frontend notification system
export const useNotificationIntegration = () => {
  const { addNotification, requestNotificationPermission, clearAllNotifications } = useNotifications();
  const loadedNotificationIds = useRef(new Set());
  const pollingInterval = useRef(null);

  // Load notifications from backend
  const loadNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications({ 
        limit: 20, 
        unreadOnly: false 
      });
      
      if (response.data.success) {
        const { notifications } = response.data.data;
        
        // Add only new notifications to frontend state
        notifications.forEach(notification => {
          if (!loadedNotificationIds.current.has(notification._id)) {
            loadedNotificationIds.current.add(notification._id);
            
            addNotification(
              notification.title,
              notification.message,
              notification.type,
              {
                id: notification._id,
                category: notification.category,
                priority: notification.priority,
                timestamp: notification.createdAt,
                isRead: notification.isRead
              }
            );
          }
        });
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // Initial load and setup polling
  useEffect(() => {
    // Clear existing notifications and reload
    clearAllNotifications();
    loadedNotificationIds.current.clear();
    
    // Load notifications immediately
    loadNotifications();

    // Set up polling every 10 seconds for new notifications
    pollingInterval.current = setInterval(() => {
      loadNotifications();
    }, 10000);

    // Cleanup on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [addNotification, clearAllNotifications]);

  // Request browser notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  return null;
};

// Utility functions for common notification scenarios
export const notificationHelpers = {
  // Assignment notifications
  assignmentCreated: (notifications, salespersonName, locationCount) => {
    notifications.showSuccess(
      `New assignment created for ${salespersonName} with ${locationCount} location(s)`
    );
  },

  assignmentCompleted: (notifications, locationName) => {
    notifications.showSuccess(`Visit completed at ${locationName}`);
  },

  // Expense notifications
  expenseSubmitted: (notifications, amount) => {
    notifications.showInfo(`Expense of ₹${amount} submitted for approval`);
  },

  expenseApproved: (notifications, amount) => {
    notifications.showSuccess(`Expense of ₹${amount} has been approved`);
  },

  expenseRejected: (notifications, amount, reason) => {
    notifications.showError(
      `Expense of ₹${amount} rejected${reason ? `: ${reason}` : ''}`
    );
  },

  // Visit notifications
  visitReportSubmitted: (notifications, locationName) => {
    notifications.showSuccess(`Visit report submitted for ${locationName}`);
  },

  // System notifications
  locationVerificationFailed: (notifications, distance) => {
    notifications.showWarning(
      `Location verification failed. You are ${distance}m away from the target location.`
    );
  },

  photoUploadSuccess: (notifications) => {
    notifications.showSuccess('Photo uploaded successfully');
  },

  photoUploadFailed: (notifications, error) => {
    notifications.showError(`Photo upload failed: ${error}`);
  },

  // Rating notifications
  ratingUpdated: (notifications, newRating) => {
    notifications.showInfo(`Your rating has been updated to ${newRating}/5`);
  },

  // Error notifications
  networkError: (notifications) => {
    notifications.showError('Network error. Please check your connection.');
  },

  serverError: (notifications) => {
    notifications.showError('Server error. Please try again later.');
  },

  // Loading notifications
  uploadingPhoto: (notifications) => {
    return notifications.showLoading('Uploading photo...');
  },

  submittingReport: (notifications) => {
    return notifications.showLoading('Submitting report...');
  },

  loadingData: (notifications) => {
    return notifications.showLoading('Loading data...');
  }
};

export default useNotificationIntegration;
