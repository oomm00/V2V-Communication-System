import { motion } from 'framer-motion';
import { Activity, TrendingUp, Zap } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function RightPanel({ isConnected, isDarkMode }) {
  const { stats } = useData();
  const metrics = [
    { label: 'Active Vehicles', value: stats.activeVehicles, color: 'emerald' },
    { label: 'Total Alerts', value: stats.totalAlerts, color: 'red' },
    { label: 'Avg Speed', value: '65 km/h', color: 'blue' },
    { label: 'Network Latency', value: '12ms', color: 'purple' }
  ];

  return (
    <motion.aside
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      className={`w-80 h-screen backdrop-blur-xl border-l p-6 space-y-6 overflow-y-auto ${
        isDarkMode 
          ? 'bg-slate-900/50 border-white/10' 
          : 'bg-white/80 border-gray-200'
      }`}
    >
      {/* Connection Status */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300">System Status</h3>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-emerald-400 animate-pulse-glow' : 'bg-red-400'
          }`} />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Connection</span>
            <span className={`text-sm font-semibold ${
              isConnected ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Network Health</span>
            <span className="text-sm font-semibold text-emerald-400">{stats.networkHealth}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Messages/sec</span>
            <span className="text-sm font-semibold text-slate-300">{stats.messagesPerSecond}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-300">Quick Stats</h3>
        </div>
        <div className="space-y-4">
          {metrics.map((metric, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">{metric.label}</span>
                <span className="text-sm font-bold text-slate-200">{metric.value}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ delay: idx * 0.1, duration: 0.8 }}
                  className={`h-full bg-gradient-to-r from-${metric.color}-500 to-${metric.color}-400 rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-slate-300">Performance</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">CPU Usage</span>
            <span className="text-sm font-semibold text-emerald-400">23%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Memory</span>
            <span className="text-sm font-semibold text-yellow-400">67%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Uptime</span>
            <span className="text-sm font-semibold text-slate-300">24h 15m</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-300">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[
            { text: 'Vehicle VEH-001 connected', color: 'emerald' },
            { text: 'Alert: Road block detected', color: 'red' },
            { text: 'Blockchain sync complete', color: 'blue' }
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-1.5 h-1.5 rounded-full bg-${activity.color}-400 animate-pulse`} />
              <span className="text-xs text-slate-400">{activity.text}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.aside>
  );
}
