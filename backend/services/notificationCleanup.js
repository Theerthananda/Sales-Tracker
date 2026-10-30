const { cleanupExpiredNotifications, cleanupOldNotifications } = require('../controllers/notificationController');

class NotificationCleanupService {
  constructor() {
    this.cleanupInterval = null;
    this.isRunning = false;
  }

  // Start the cleanup service
  start() {
    if (this.isRunning) {
      console.log('⚠️ Notification cleanup service is already running');
      return;
    }

    console.log('🚀 Starting notification cleanup service...');
    this.isRunning = true;

    // Run cleanup immediately
    this.runCleanup();

    // Schedule cleanup every 6 hours
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, 6 * 60 * 60 * 1000); // 6 hours

    console.log('✅ Notification cleanup service started (runs every 6 hours)');
  }

  // Stop the cleanup service
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Notification cleanup service is not running');
      return;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.isRunning = false;
    console.log('🛑 Notification cleanup service stopped');
  }

  // Run the cleanup process
  async runCleanup() {
    try {
      console.log('🧹 Starting notification cleanup...');
      
      const expiredCount = await cleanupExpiredNotifications();
      const oldCount = await cleanupOldNotifications();
      
      const totalCleaned = expiredCount + oldCount;
      
      if (totalCleaned > 0) {
        console.log(`✅ Cleanup completed: ${totalCleaned} notifications removed`);
      } else {
        console.log('✅ Cleanup completed: No notifications to remove');
      }
    } catch (error) {
      console.error('❌ Error during notification cleanup:', error.message);
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextCleanup: this.cleanupInterval ? new Date(Date.now() + 6 * 60 * 60 * 1000) : null
    };
  }
}

// Create singleton instance
const notificationCleanupService = new NotificationCleanupService();

module.exports = notificationCleanupService;
