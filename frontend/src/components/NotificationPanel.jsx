import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, XCircle, AlertTriangle, Info, Trash2, Check, RefreshCw } from 'lucide-react';
import { useNotifications, NOTIFICATION_TYPES } from '../contexts/NotificationContext';
import { notificationAPI } from '../api';

const NotificationPanel = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    removeNotification, 
    clearAllNotifications,
    addNotification,
    backendLoaded,
    setBackendLoaded
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Function to manually refresh notifications
  const refreshNotifications = async () => {
    try {
      setLoading(true);
      
      const response = await notificationAPI.getNotifications({ 
        limit: 20, 
        unreadOnly: false 
      });
      
      if (response?.data?.success && response.data.data?.notifications) {
        const backendNotifications = response.data.data.notifications;
        
        // Clear existing notifications and add fresh ones
        clearAllNotifications();
        
        backendNotifications.forEach(notification => {
          if (notification && notification.title && notification.message) {
            addNotification(
              notification.title,
              notification.message,
              notification.type || 'info',
              {
                id: notification._id,
                category: notification.category,
                priority: notification.priority,
                timestamp: notification.createdAt,
                isRead: notification.isRead,
                backendId: notification._id
              }
            );
          }
        });
        
        console.log(`🔄 Refreshed ${backendNotifications.length} notifications`);
      }
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh notifications when panel is opened
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen]);

  // Load notifications from backend when component mounts
  useEffect(() => {
    const loadBackendNotifications = async () => {
      if (backendLoaded) return; // Prevent duplicate loading
      
      try {
        setLoading(true);
        
        const response = await notificationAPI.getNotifications({ 
          limit: 20, 
          unreadOnly: false 
        });
        
        if (response?.data?.success && response.data.data?.notifications) {
          const backendNotifications = response.data.data.notifications;
          
          // Validate and add notifications to frontend state
          let successCount = 0;
          let errorCount = 0;
          
          backendNotifications.forEach(notification => {
            if (notification && notification.title && notification.message) {
              const result = addNotification(
                notification.title,
                notification.message,
                notification.type || 'info',
                {
                  id: notification._id,
                  category: notification.category,
                  priority: notification.priority,
                  timestamp: notification.createdAt,
                  isRead: notification.isRead,
                  backendId: notification._id
                }
              );
              
              if (result) {
                successCount++;
              } else {
                errorCount++;
              }
            } else {
              errorCount++;
            }
          });
          
          console.log(`Loaded ${successCount} notifications${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
          
          // Mark as loaded to prevent future duplicate loads
          setBackendLoaded(true);
        } else {
          console.warn('Invalid response format from notification API');
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
        
        // Show user-friendly error
        if (error.response?.status === 401) {
          console.warn('Authentication required for notifications');
        } else if (error.response?.status >= 500) {
          console.error('Server error loading notifications');
        } else {
          console.error('Network error loading notifications');
        }
      } finally {
        setLoading(false);
      }
    };

    // Add delay to prevent race conditions
    const timeoutId = setTimeout(loadBackendNotifications, 100);
    
    return () => clearTimeout(timeoutId);
  }, []); // Remove addNotification dependency to prevent re-runs

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case NOTIFICATION_TYPES.ERROR:
        return <XCircle className="w-5 h-5 text-red-600" />;
      case NOTIFICATION_TYPES.WARNING:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return time.toLocaleDateString();
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead && notification.data?.backendId) {
      try {
        // Mark as read in backend
        await notificationAPI.markAsRead(notification.data.backendId);
        // Mark as read in frontend
        markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
        // Still mark as read in frontend even if backend fails
        markAsRead(notification.id);
      }
    }
  };

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
        >
          <Bell className="w-6 h-6 text-white" />
          
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </motion.button>

        {/* Notification Panel */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={() => setIsOpen(false)}
              />

              {/* Panel */}
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-96 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800">Notifications</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={refreshNotifications}
                      disabled={loading}
                      className="p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                      title="Refresh notifications"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-slate-600 hover:text-red-600 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No notifications</p>
                      <p className="text-sm">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                            !notification.isRead ? 'bg-blue-50/50' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`text-sm font-medium ${
                                  !notification.isRead ? 'text-slate-900' : 'text-slate-700'
                                }`}>
                                  {notification.title}
                                </h4>
                                
                                <div className="flex items-center gap-1">
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeNotification(notification.id);
                                    }}
                                    className="p-1 rounded hover:bg-slate-200 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              
                              <p className="text-sm text-slate-600 mt-1">
                                {notification.message}
                              </p>
                              
                              <p className="text-xs text-slate-500 mt-2">
                                {formatTime(notification.timestamp)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default NotificationPanel;
