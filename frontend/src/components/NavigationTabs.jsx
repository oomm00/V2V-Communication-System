import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Car, 
  Activity,
  Settings,
  Shield
} from 'lucide-react';

const TabItem = ({ icon: Icon, label, isActive, onClick, badge, color = "blue" }) => {
  const colorClasses = {
    blue: {
      active: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25',
      inactive: 'text-gray-400 hover:text-white hover:bg-gray-800/50'
    },
    red: {
      active: 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25',
      inactive: 'text-gray-400 hover:text-white hover:bg-gray-800/50'
    },
    green: {
      active: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25',
      inactive: 'text-gray-400 hover:text-white hover:bg-gray-800/50'
    },
    purple: {
      active: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-500/25',
      inactive: 'text-gray-400 hover:text-white hover:bg-gray-800/50'
    }
  };

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 ${
        isActive 
          ? colorClasses[color].active
          : colorClasses[color].inactive
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      
      {badge && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center"
        >
          {badge}
        </motion.span>
      )}
      
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white/10 rounded-xl border border-white/20"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </motion.button>
  );
};

const NavigationTabs = ({ activeSection, onSectionChange, alertCount }) => {
  const tabs = [
    { 
      id: 'dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      color: 'blue' 
    },
    { 
      id: 'alerts', 
      icon: AlertTriangle, 
      label: 'Alerts', 
      badge: alertCount > 0 ? alertCount : null,
      color: 'red' 
    },
    { 
      id: 'vehicles', 
      icon: Car, 
      label: 'Vehicles', 
      color: 'green' 
    },
    { 
      id: 'blockchain', 
      icon: Shield, 
      label: 'Blockchain', 
      color: 'purple' 
    }
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="px-6 py-4"
    >
      <div className="flex items-center space-x-2 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-2 border border-gray-700/50">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            badge={tab.badge}
            color={tab.color}
            isActive={activeSection === tab.id}
            onClick={() => onSectionChange(tab.id)}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default NavigationTabs;