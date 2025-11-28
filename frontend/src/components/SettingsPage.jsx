import { motion } from 'framer-motion';
import { Moon, Sun, Bell, Shield, Wifi, Database } from 'lucide-react';

export default function SettingsPage({ isDarkMode, onThemeToggle }) {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold neon-text mb-1">System Settings</h1>
        <p className="text-sm text-slate-500">Configure your V2V dashboard preferences</p>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Appearance</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-slate-400" />}
              <div>
                <p className="font-medium text-slate-200">Theme</p>
                <p className="text-sm text-slate-500">Switch between light and dark mode</p>
              </div>
            </div>
            <button
              onClick={onThemeToggle}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isDarkMode ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <motion.div
                animate={{ x: isDarkMode ? 28 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full"
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Notifications</h2>
        <div className="space-y-4">
          {[
            { icon: Bell, label: 'Alert Notifications', desc: 'Get notified of new vehicle alerts' },
            { icon: Shield, label: 'Security Alerts', desc: 'Receive security-related notifications' },
            { icon: Wifi, label: 'Connection Status', desc: 'Network connectivity notifications' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-200">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </div>
              <button className="relative w-14 h-7 rounded-full bg-emerald-500">
                <motion.div
                  initial={{ x: 28 }}
                  className="absolute top-1 w-5 h-5 bg-white rounded-full"
                />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* System */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-slate-200 mb-4">System</h2>
        <div className="space-y-3">
          {[
            { icon: Database, label: 'Clear Cache', value: '2.4 MB' },
            { icon: Shield, label: 'Security Level', value: 'High' },
            { icon: Wifi, label: 'API Endpoint', value: 'localhost:5000' }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-slate-400" />
                <p className="font-medium text-slate-200">{item.label}</p>
              </div>
              <p className="text-sm text-slate-400">{item.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
