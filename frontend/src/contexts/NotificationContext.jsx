import React, { createContext, useContext, useReducer, useCallback, useState, useEffect } from 'react';

const NotificationContext = createContext();

let notificationAudioContext = null;

function playNotificationSound() {
  // Sound disabled: keep this function as a no-op so visual notifications still work
  return;
}

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
};

// Action types
const ACTIONS = {
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  MARK_AS_READ: 'MARK_AS_READ',
  CLEAR_ALL: 'CLEAR_ALL',
  SET_BACKEND_LOADED: 'SET_BACKEND_LOADED'
};

// Initial state
const initialState = {
  toasts: [],
  notifications: [],
  unreadCount: 0,
  backendLoaded: false
};

// Reducer
function notificationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, action.payload]
      };

    case ACTIONS.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload)
      };

    case ACTIONS.ADD_NOTIFICATION:
      const newNotification = {
        ...action.payload,
        isRead: false,
        timestamp: new Date().toISOString()
      };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };

    case ACTIONS.REMOVE_NOTIFICATION:
      const removedNotification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: removedNotification && !removedNotification.isRead 
          ? state.unreadCount - 1 
          : state.unreadCount
      };

    case ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, isRead: true }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };

    case ACTIONS.CLEAR_ALL:
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };

    case ACTIONS.SET_BACKEND_LOADED:
      return {
        ...state,
        backendLoaded: action.payload
      };

    default:
      return state;
  }
}

// Provider component
export function NotificationProvider({ children }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const unlockAudio = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      if (!notificationAudioContext) {
        notificationAudioContext = new AudioContext();
      }

      if (notificationAudioContext.state === 'suspended') {
        notificationAudioContext.resume().catch(() => {});
      }

      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Generate unique ID
  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  // Toast functions
  const addToast = useCallback((message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
    const id = generateId();
    const toast = {
      id,
      message,
      type,
      duration,
      timestamp: new Date().toISOString()
    };

    dispatch({ type: ACTIONS.ADD_TOAST, payload: toast });

    if (type !== NOTIFICATION_TYPES.LOADING) {
      playNotificationSound();
    }

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        dispatch({ type: ACTIONS.REMOVE_TOAST, payload: id });
      }, duration);
    }

    return id;
  }, [generateId]);

  const removeToast = useCallback((id) => {
    dispatch({ type: ACTIONS.REMOVE_TOAST, payload: id });
  }, []);

  // Add notification with validation
  const addNotification = useCallback((title, message, type = NOTIFICATION_TYPES.INFO, data = {}) => {
    try {
      // Input validation
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        console.warn('Invalid notification title provided');
        return null;
      }
      
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        console.warn('Invalid notification message provided');
        return null;
      }

      // Sanitize inputs
      const sanitizedTitle = title.trim().substring(0, 100);
      const sanitizedMessage = message.trim().substring(0, 500);
      const validTypes = Object.values(NOTIFICATION_TYPES);
      const sanitizedType = validTypes.includes(type) ? type : NOTIFICATION_TYPES.INFO;

      const id = generateId();
      const notification = {
        id,
        title: sanitizedTitle,
        message: sanitizedMessage,
        type: sanitizedType,
        timestamp: new Date(),
        isRead: false,
        data: data || {}
      };

      dispatch({ type: ACTIONS.ADD_NOTIFICATION, payload: notification });
      playNotificationSound();
      setError(null); // Clear any previous errors
      return id;
    } catch (error) {
      console.error('Error adding notification:', error);
      setError('Failed to add notification');
      return null;
    }
  }, [generateId]);

  const removeNotification = useCallback((id) => {
    dispatch({ type: ACTIONS.REMOVE_NOTIFICATION, payload: id });
  }, []);

  const markAsRead = useCallback((id) => {
    dispatch({ type: ACTIONS.MARK_AS_READ, payload: id });
  }, []);

  const clearAllNotifications = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ALL });
  }, []);

  const setBackendLoaded = useCallback((loaded) => {
    dispatch({ type: ACTIONS.SET_BACKEND_LOADED, payload: loaded });
  }, []);

  // Browser notification
  const showBrowserNotification = useCallback((title, message, type) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/Logo_img_rxgrwt.png',
        badge: '/Logo_img_rxgrwt.png',
        tag: 'swansorter-notification',
        requireInteraction: type === NOTIFICATION_TYPES.ERROR,
        silent: type === NOTIFICATION_TYPES.INFO
      });

      playNotificationSound();

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, duration) => 
    addToast(message, NOTIFICATION_TYPES.SUCCESS, duration), [addToast]);

  const showError = useCallback((message, duration) => 
    addToast(message, NOTIFICATION_TYPES.ERROR, duration), [addToast]);

  const showWarning = useCallback((message, duration) => 
    addToast(message, NOTIFICATION_TYPES.WARNING, duration), [addToast]);

  const showInfo = useCallback((message, duration) => 
    addToast(message, NOTIFICATION_TYPES.INFO, duration), [addToast]);

  const showLoading = useCallback((message) => 
    addToast(message, NOTIFICATION_TYPES.LOADING, 0), [addToast]);

  const value = {
    // State
    toasts: state.toasts,
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    backendLoaded: state.backendLoaded,

    // Toast methods
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,

    // Notification methods
    addNotification,
    removeNotification,
    markAsRead,
    clearAllNotifications,
    setBackendLoaded,

    // Browser notification
    requestNotificationPermission,
    showBrowserNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use notifications
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
