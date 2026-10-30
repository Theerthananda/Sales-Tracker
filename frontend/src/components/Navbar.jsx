import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MapPin, UserPlus, LogOut, Menu, X, User, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Logo from './Logo';
import { authAPI, notificationAPI } from '../api';

function Navbar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Refresh unread count every 10 seconds
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear server-side cookies
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage and redirect
      localStorage.removeItem('user');
      navigate('/login');
      setMobileMenuOpen(false);
    }
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/map', icon: MapPin, label: 'Map View' },
    { to: '/admin/assign', icon: UserPlus, label: 'Assign Location' },
  ];

  const salespersonLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ];

  const links = user.role === 'admin' ? adminLinks : salespersonLinks;

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="gradient-header sticky top-0 z-50 shadow-xl border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Logo size="md" showText={true} />
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3">
              {links.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.to);
                return (
                  <motion.div
                    key={link.to}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={link.to}
                      className={`flex items-center gap-2 px-3 lg:px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 text-sm lg:text-base ${
                        active
                          ? 'bg-white text-green-600 shadow-lg'
                          : 'bg-white/10 hover:bg-white/25 backdrop-blur-sm'
                      }`}
                    >
                      <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                      <span className="hidden lg:inline">{link.label}</span>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Alerts Bell Icon - Desktop */}
              <motion.button
                onClick={() => navigate('/notifications')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/25 backdrop-blur-sm transition-all duration-300"
                title="View Alerts & System Notifications"
              >
                <Bell className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </motion.div>
                )}
              </motion.button>

              {/* User Profile - Desktop */}
              <div className="hidden xl:flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl ml-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold leading-tight">{user.name}</p>
                  <p className="text-xs text-white/70">{user.role === 'admin' ? 'Administrator' : 'Salesperson'}</p>
                </div>
              </div>

              {/* Logout Button - Desktop */}
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 lg:px-5 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-sm lg:text-base"
              >
                <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.95 }}
              className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden gradient-header border-b border-white/20 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-3 py-4 space-y-2">
              {/* User Info - Mobile */}
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl mb-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs text-white/70">{user.role === 'admin' ? 'Administrator' : 'Salesperson'}</p>
                </div>
              </div>

              {/* Navigation Links - Mobile */}
              {links.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      active
                        ? 'bg-white text-green-600 shadow-lg'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              {/* Alerts Bell Icon - Mobile */}
              <button
                onClick={() => {
                  navigate('/notifications');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all duration-300 relative"
              >
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </div>
                <span>Alerts & System Notifications</span>
              </button>

              {/* Logout Button - Mobile */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-xl transition-all duration-300 shadow-lg font-semibold"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
