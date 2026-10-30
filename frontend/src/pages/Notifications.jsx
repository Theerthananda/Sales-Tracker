import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../api';
import Navbar from '../components/Navbar';
import { Bell, Trash2, CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchNotifications();
  }, [navigate]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications({ limit: 50 });
      
      if (response.data.success) {
        setNotifications(response.data.data.notifications || []);
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      if (selectedNotification?._id === notificationId) {
        setSelectedNotification(null);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      try {
        await notificationAPI.deleteAllNotifications();
        setNotifications([]);
        setSelectedNotification(null);
      } catch (error) {
        console.error('Failed to delete all notifications:', error);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-green-500 bg-green-50';
      case 'error':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'warning':
        return 'border-l-4 border-yellow-500 bg-yellow-50';
      case 'info':
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatDetailLabel = (key) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/Id/g, 'ID')
      .trim()
      .replace(/(^|\s)\w/g, (match) => match.toUpperCase());
  };

  const formatDetailValue = (key, value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number' && key.toLowerCase().includes('amount')) {
      return `₹${value}`;
    }
    return String(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-10 h-10 text-blue-500" />
              <div>
                <h1 className="text-4xl font-bold text-slate-800">Notifications</h1>
                <p className="text-slate-600">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Mark All as Read
                  </button>
                )}
                <button
                  onClick={handleDeleteAll}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin">
                  <Bell className="w-8 h-8 text-blue-500" />
                </div>
                <p className="mt-4 text-slate-600">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white rounded-lg"
              >
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">No notifications yet</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif, index) => (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setSelectedNotification(notif);
                      if (!notif.isRead) {
                        handleMarkAsRead(notif._id);
                      }
                    }}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${getNotificationColor(
                      notif.type
                    )} ${!notif.isRead ? 'shadow-md' : 'opacity-75'} hover:shadow-lg`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getNotificationIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-slate-800 truncate">
                              {notif.title}
                            </h3>
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-500">
                            {formatDate(notif.createdAt)}
                          </span>
                          <span className="text-xs px-2 py-1 bg-slate-200 rounded text-slate-700">
                            {notif.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Notification Details */}
          <div className="lg:col-span-1">
            {selectedNotification ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg p-6 shadow-lg sticky top-24"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(selectedNotification.type)}
                    <span className="text-sm font-semibold text-slate-600 uppercase">
                      {selectedNotification.type}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-3">
                  {selectedNotification.title}
                </h2>

                <p className="text-slate-600 mb-4 leading-relaxed">
                  {selectedNotification.message}
                </p>

                <div className="space-y-3 mb-6 p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Category</p>
                    <p className="text-slate-800 capitalize">{selectedNotification.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Priority</p>
                    <p className="text-slate-800 capitalize">{selectedNotification.priority}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Date</p>
                    <p className="text-slate-800">{formatDate(selectedNotification.createdAt)}</p>
                  </div>
                  {selectedNotification.readAt && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Read At</p>
                      <p className="text-slate-800">{formatDate(selectedNotification.readAt)}</p>
                    </div>
                  )}
                </div>

                {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                  <div className="mb-6 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Details</p>
                    <div className="space-y-2 text-xs">
                      {Object.entries(selectedNotification.data).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-start justify-between gap-4 border-b border-slate-100 pb-1 last:border-b-0"
                        >
                          <span className="text-slate-500 font-semibold whitespace-nowrap">
                            {formatDetailLabel(key)}
                          </span>
                          <span className="text-slate-800 text-right break-all">
                            {formatDetailValue(key, value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {!selectedNotification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(selectedNotification._id)}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteNotification(selectedNotification._id)}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-lg p-6 shadow-lg text-center sticky top-24">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-slate-600">Select a notification to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
