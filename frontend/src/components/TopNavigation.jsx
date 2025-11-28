import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  Activity,
  Settings,
  Sun,
  Moon,
  Bell,
  Shield
} from 'lucide-react';

const TopNavigation = ({ 
  socketConnected, 
  isDarkMode, 
  onThemeToggle, 
  alertCount,
  onSettingsClick 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b border-purple-500/30 backdrop-blur-xl"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left - Logo and Title */}
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="relative"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
            </motion.div>
            
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                V2V System
              </h1>
              <p className="text-sm text-gray-400">Vehicle Communication Network</p>
            </div>
          </div>

          {/* Center - Connection Status */}
          <div className="flex items-center space-x-6">
            <motion.div
              animate={{ 
                scale: socketConnected ? [1, 1.1, 1] : 1,
                opacity: socketConnected ? [1, 0.7, 1] : 0.6
              }}
              transition={{ 
                duration: 2, 
                repeat: socketConnected ? Infinity : 0,
                ease: "easeInOut"
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${
                socketConnected 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              {socketConnected ? (
                <Wifi className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {socketConnected ? 'Connected' : 'Disconnected'}
              </span>
              <div className={`w-2 h-2 rounded-full ${
                socketConnected ? 'bg-green-400' : 'bg-red-400'
              } animate-pulse`}></div>
            </motion.div>

            {/* Alert Indicator */}
            {alertCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                className="relative"
              >
                <div className="flex items-center space-x-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-400">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-medium">{alertCount}</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
              </motion.div>
            )}
          </div>

          {/* Right - Time and Controls */}
          <div className="flex items-center space-x-4">
            {/* Real-time Clock */}
            <div className="text-right">
              <div className="flex items-center space-x-2 text-gray-300">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-mono">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {currentTime.toLocaleDateString()}
              </p>
            </div>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onThemeToggle}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 transition-all duration-200"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-blue-400" />
              )}
            </motion.button>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSettingsClick}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 transition-all duration-200"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Animated border line */}
      <motion.div
        className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"
        animate={{
          opacity: [0.3, 1, 0.3],
          scaleX: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.nav>
  );
};

export default TopNavigation;