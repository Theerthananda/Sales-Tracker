import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2, X } from 'lucide-react';
import { useNotifications, NOTIFICATION_TYPES } from '../contexts/NotificationContext';

const ToastNotification = () => {
  const { toasts, removeToast } = useNotifications();

  const getToastIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle className="w-5 h-5" />;
      case NOTIFICATION_TYPES.ERROR:
        return <XCircle className="w-5 h-5" />;
      case NOTIFICATION_TYPES.WARNING:
        return <AlertTriangle className="w-5 h-5" />;
      case NOTIFICATION_TYPES.LOADING:
        return <Loader2 className="w-5 h-5 animate-spin" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getToastStyles = (type) => {
    const baseStyles = "flex items-center gap-3 p-4 rounded-xl shadow-lg backdrop-blur-sm border";
    
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
      case NOTIFICATION_TYPES.ERROR:
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case NOTIFICATION_TYPES.WARNING:
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case NOTIFICATION_TYPES.LOADING:
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
      default:
        return `${baseStyles} bg-slate-50 border-slate-200 text-slate-800`;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return "text-green-600";
      case NOTIFICATION_TYPES.ERROR:
        return "text-red-600";
      case NOTIFICATION_TYPES.WARNING:
        return "text-yellow-600";
      case NOTIFICATION_TYPES.LOADING:
        return "text-blue-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={getToastStyles(toast.type)}
            style={{ pointerEvents: 'auto' }}
          >
            <div className={`flex-shrink-0 ${getIconColor(toast.type)}`}>
              {getToastIcon(toast.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">
                {toast.message}
              </p>
              {toast.timestamp && (
                <p className="text-xs opacity-70 mt-1">
                  {new Date(toast.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>

            {toast.type !== NOTIFICATION_TYPES.LOADING && (
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastNotification;
