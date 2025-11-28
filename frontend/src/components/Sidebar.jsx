import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Car,
  AlertTriangle,
  Activity,
  Settings,
  Moon,
  Sun,
  MapPin
} from 'lucide-react';

const NavItem = ({ icon: Icon, label, isActive, onClick, badge }) => (
  <motion.button
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
      isActive
        ? 'bg-emerald-500 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20'
        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    {badge && (
      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
        {badge}
      </span>
    )}
  </motion.button>
);

export default function Sidebar({ activeSection, onSectionChange, isDarkMode, onThemeToggle, alertCount = 0 }) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'map', icon: MapPin, label: 'Map' },
    { id: 'vehicles', icon: Car, label: 'Vehicles' },
    { id: 'alerts', icon: AlertTriangle, label: 'Alerts', badge: alertCount },
    { id: 'blockchain', icon: Activity, label: 'Blockchain' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className={`w-72 h-screen backdrop-blur-xl border-r flex flex-col ${
        isDarkMode 
          ? 'bg-slate-900/50 border-white/10' 
          : 'bg-white/80 border-gray-200'
      }`}
    >
      {/* Logo */}
      <div className={`p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <Car className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>V2V System</h1>
            <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-600'}`}>Communication Hub</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            badge={item.badge}
            isActive={activeSection === item.id}
            onClick={() => onSectionChange(item.id)}
          />
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <button
          onClick={onThemeToggle}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isDarkMode 
              ? 'text-slate-400 hover:text-slate-100 hover:bg-white/5' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100'
          }`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-sm font-medium">
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>

      {/* Footer */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
        <p className={`text-xs text-center ${isDarkMode ? 'text-slate-600' : 'text-slate-500'}`}>V2V Dashboard v1.0.0</p>
      </div>
    </motion.aside>
  );
}
