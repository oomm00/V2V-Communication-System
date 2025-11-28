import { motion } from 'framer-motion';
import Card from './Card';
import { useData } from '../context/DataContext';
import {
  Car,
  AlertTriangle,
  Activity,
  Wifi,
  Gauge,
  Shield,
  Clock,
  WifiOff,
  MapPin,
  Lock
} from 'lucide-react';

export default function Dashboard({ isConnected, connectionError }) {
  const { stats, alerts, blockchainLogs, edscaEnabled } = useData();
  const cards = [
    {
      icon: Car,
      title: 'Active Vehicles',
      value: stats.activeVehicles,
      subtitle: 'Currently connected',
      trend: 5.2
    },
    {
      icon: AlertTriangle,
      title: 'Total Alerts',
      value: stats.totalAlerts,
      subtitle: 'All time hazards',
      trend: 12.3
    },
    {
      icon: Activity,
      title: 'Network Health',
      value: `${stats.networkHealth}%`,
      subtitle: 'System performance',
      trend: 2.1
    },
    {
      icon: Wifi,
      title: 'Connection Status',
      value: isConnected ? 'Connected' : 'Disconnected',
      subtitle: connectionError || 'Real-time active',
      trend: isConnected ? 0 : -100
    },
    {
      icon: Gauge,
      title: 'Messages/sec',
      value: stats.messagesPerSecond,
      subtitle: 'Network throughput',
      trend: -1.2
    },
    {
      icon: Shield,
      title: 'Blockchain Logs',
      value: stats.blockchainLogs,
      subtitle: `Block #${stats.latestBlock}`,
      trend: 0
    },
    {
      icon: Lock,
      title: 'EDSCA Status',
      value: edscaEnabled ? 'Active' : 'Disabled',
      subtitle: 'Encryption system',
      trend: edscaEnabled ? 0 : -100
    },
    {
      icon: MapPin,
      title: 'Map Markers',
      value: alerts.length + stats.activeVehicles,
      subtitle: 'Alerts + Vehicles',
      trend: 8.5
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold neon-text mb-1">V2V Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time vehicle communication system</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass">
            {isConnected ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
                <span className="text-sm font-medium text-emerald-400">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <Card
            key={idx}
            icon={card.icon}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            trend={card.trend}
            delay={idx * 0.1}
          />
        ))}
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-200 mb-4">System Performance</h3>
          <div className="space-y-4">
            {[
              { label: 'CPU Usage', value: '23%', color: 'emerald' },
              { label: 'Memory Usage', value: '67%', color: 'yellow' },
              { label: 'Network Latency', value: '12ms', color: 'emerald' }
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm text-slate-400">{item.label}</span>
                <span className={`text-sm font-semibold text-${item.color}-400`}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert, idx) => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-4 h-4 ${
                    alert.severity === 'critical' ? 'text-red-400' :
                    alert.severity === 'high' ? 'text-orange-400' :
                    alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-slate-300">{alert.type}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3 h-3" />
                      <span>{alert.location}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{alert.vehicle}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
