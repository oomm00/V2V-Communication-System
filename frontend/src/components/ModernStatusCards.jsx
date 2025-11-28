import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Car, 
  Activity, 
  Wifi,
  WifiOff,
  Database,
  TrendingUp,
  Zap,
  Shield,
  Clock
} from 'lucide-react';

const StatusCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  subtitle, 
  trend,
  isConnected,
  delay = 0,
  gradient,
  pulse = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
        gradient || 'bg-gray-900/50 border-gray-700/50'
      } ${pulse ? 'animate-pulse' : ''}`}
    >
      {/* Background gradient overlay */}
      <div className={`absolute inset-0 opacity-10 ${color === 'green' ? 'bg-green-500' : 
                                                    color === 'blue' ? 'bg-blue-500' :
                                                    color === 'red' ? 'bg-red-500' :
                                                    color === 'yellow' ? 'bg-yellow-500' :
                                                    color === 'purple' ? 'bg-purple-500' :
                                                    'bg-gray-500'}`}></div>
      
      {/* Animated border */}
      <motion.div
        className={`absolute inset-0 rounded-2xl border-2 ${
          color === 'green' ? 'border-green-500/30' : 
          color === 'blue' ? 'border-blue-500/30' :
          color === 'red' ? 'border-red-500/30' :
          color === 'yellow' ? 'border-yellow-500/30' :
          color === 'purple' ? 'border-purple-500/30' :
          'border-gray-500/30'
        }`}
        animate={{
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">
              {title}
            </p>
            <div className="flex items-baseline space-x-2 mt-2">
              <p className={`text-3xl font-bold ${
                color === 'green' ? 'text-green-400' : 
                color === 'blue' ? 'text-blue-400' :
                color === 'red' ? 'text-red-400' :
                color === 'yellow' ? 'text-yellow-400' :
                color === 'purple' ? 'text-purple-400' :
                'text-gray-400'
              }`}>
                {value}
              </p>
              {trend && (
                <span className={`text-sm flex items-center ${
                  trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  <TrendingUp className={`w-4 h-4 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
            )}
          </div>
          
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`p-4 rounded-xl ${
              color === 'green' ? 'bg-green-500/20' : 
              color === 'blue' ? 'bg-blue-500/20' :
              color === 'red' ? 'bg-red-500/20' :
              color === 'yellow' ? 'bg-yellow-500/20' :
              color === 'purple' ? 'bg-purple-500/20' :
              'bg-gray-500/20'
            }`}
          >
            <Icon className={`w-8 h-8 ${
              color === 'green' ? 'text-green-400' : 
              color === 'blue' ? 'text-blue-400' :
              color === 'red' ? 'text-red-400' :
              color === 'yellow' ? 'text-yellow-400' :
              color === 'purple' ? 'text-purple-400' :
              'text-gray-400'
            }`} />
          </motion.div>
        </div>

        {/* Connection indicator for network status */}
        {isConnected !== undefined && (
          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-700/50">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
            <span className="text-xs text-gray-400">
              {isConnected ? 'Real-time updates' : 'Polling mode'}
            </span>
          </div>
        )}
      </div>

      {/* Glow effect */}
      <motion.div
        className={`absolute -inset-1 rounded-2xl opacity-0 ${
          color === 'green' ? 'bg-green-500' : 
          color === 'blue' ? 'bg-blue-500' :
          color === 'red' ? 'bg-red-500' :
          color === 'yellow' ? 'bg-yellow-500' :
          color === 'purple' ? 'bg-purple-500' :
          'bg-gray-500'
        } blur-lg -z-10`}
        whileHover={{ opacity: 0.1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

const ModernStatusCards = ({ stats, blockchainStatus, socketConnected, lastUpdated }) => {
  const getBlockchainColor = () => {
    if (!blockchainStatus) return 'gray';
    if (blockchainStatus.connected) return 'purple';
    return 'yellow';
  };

  const getBlockchainValue = () => {
    if (!blockchainStatus) return 'Loading...';
    if (blockchainStatus.connected) {
      return `Block #${blockchainStatus.blockNumber || 'N/A'}`;
    }
    return 'Database Only';
  };

  const getBlockchainSubtitle = () => {
    if (!blockchainStatus) return 'Checking status...';
    if (blockchainStatus.connected) {
      return `${blockchainStatus.vehicles || 0} vehicles on-chain`;
    }
    return 'Blockchain unavailable';
  };

  return (
    <div className="px-6 mb-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatusCard
          title="Total Alerts"
          value={stats.totalAlerts || 0}
          icon={AlertTriangle}
          color="red"
          subtitle="All time hazards"
          trend={5}
          delay={0.1}
        />
        
        <StatusCard
          title="Active Vehicles"
          value={stats.activeVehicles || 0}
          icon={Car}
          color="blue"
          subtitle="Currently online"
          trend={2}
          delay={0.2}
        />
        
        <StatusCard
          title="Messages/sec"
          value={stats.messagesPerSecond || 0}
          icon={Zap}
          color="green"
          subtitle="Real-time throughput"
          trend={12}
          delay={0.3}
        />
        
        <StatusCard
          title="Network Status"
          value={socketConnected ? "Live" : getBlockchainValue()}
          icon={socketConnected ? Wifi : blockchainStatus?.connected ? Shield : Database}
          color={socketConnected ? "green" : getBlockchainColor()}
          subtitle={socketConnected ? "Real-time connected" : getBlockchainSubtitle()}
          isConnected={socketConnected}
          delay={0.4}
          pulse={!socketConnected}
        />
      </motion.div>

      {/* Last Updated Indicator */}
      {lastUpdated && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex items-center justify-center space-x-2 text-gray-500 text-sm"
        >
          <Clock className="w-4 h-4" />
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full"
          />
        </motion.div>
      )}
    </div>
  );
};

export default ModernStatusCards;