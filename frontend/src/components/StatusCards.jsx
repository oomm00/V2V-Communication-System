import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiAlertTriangle, 
  FiTruck, 
  FiActivity, 
  FiWifi,
  FiWifiOff,
  FiDatabase 
} from 'react-icons/fi';

const StatusCard = ({ title, value, icon: Icon, color, subtitle, isConnected }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
          {subtitle && (
            <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color === 'text-green-400' ? 'bg-green-400/10' : 
                                        color === 'text-yellow-400' ? 'bg-yellow-400/10' :
                                        color === 'text-red-400' ? 'bg-red-400/10' :
                                        'bg-blue-400/10'}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
};

const StatusCards = ({ stats, blockchainStatus, socketConnected }) => {
  const getBlockchainColor = () => {
    if (!blockchainStatus) return 'text-gray-400';
    if (blockchainStatus.connected) return 'text-green-400';
    return 'text-yellow-400';
  };

  const getBlockchainValue = () => {
    if (!blockchainStatus) return 'Loading...';
    if (blockchainStatus.connected) {
      return `Block #${blockchainStatus.blockNumber || 'N/A'}`;
    }
    return 'Database Only';
  };

  const getBlockchainSubtitle = () => {
    if (!blockchainStatus) return '';
    if (blockchainStatus.connected) {
      return `${blockchainStatus.vehicles || 0} vehicles`;
    }
    return 'Blockchain unavailable';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatusCard
        title="Total Alerts"
        value={stats.totalAlerts || 0}
        icon={FiAlertTriangle}
        color="text-red-400"
        subtitle="All time"
      />
      
      <StatusCard
        title="Active Vehicles"
        value={stats.activeVehicles || 0}
        icon={FiTruck}
        color="text-blue-400"
        subtitle="Currently online"
      />
      
      <StatusCard
        title="Messages/sec"
        value={stats.messagesPerSecond || 0}
        icon={FiActivity}
        color="text-green-400"
        subtitle="Real-time rate"
      />
      
      <StatusCard
        title="Network Status"
        value={socketConnected ? "Connected" : getBlockchainValue()}
        icon={socketConnected ? FiWifi : blockchainStatus?.connected ? FiWifi : FiDatabase}
        color={socketConnected ? "text-green-400" : getBlockchainColor()}
        subtitle={socketConnected ? "Real-time updates" : getBlockchainSubtitle()}
      />
    </div>
  );
};

export default StatusCards;