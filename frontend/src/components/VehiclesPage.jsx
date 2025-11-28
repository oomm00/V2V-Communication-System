import { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Plus, AlertTriangle, MapPin, Send, Activity } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function VehiclesPage() {
  const { vehicles, addAlert } = useData();
  const [alertForm, setAlertForm] = useState({
    type: 'Road Block',
    severity: 'medium',
    location: '',
    vehicle: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (alertForm.location && alertForm.vehicle) {
      addAlert(alertForm);
      setAlertForm({ type: 'Road Block', severity: 'medium', location: '', vehicle: '' });
    }
  };

  const getTimeSince = (lastSeen) => {
    const seconds = Math.floor((new Date() - new Date(lastSeen)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold neon-text mb-1">Vehicle Network</h1>
        <p className="text-sm text-slate-500">Manage connected vehicles and post alerts</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Vehicles', value: vehicles.length, color: 'emerald', icon: Car },
          { label: 'Active', value: vehicles.filter(v => v.status === 'active').length, color: 'green', icon: Activity },
          { label: 'Idle', value: vehicles.filter(v => v.status === 'idle').length, color: 'yellow', icon: Car },
          { label: 'Avg Speed', value: `${Math.floor(vehicles.reduce((sum, v) => sum + v.speed, 0) / vehicles.length)} km/h`, color: 'blue', icon: Activity }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
            </div>
            <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Post Alert Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1 glass rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-slate-200">Post Alert</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Alert Type</label>
              <select
                value={alertForm.type}
                onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option>Road Block</option>
                <option>Accident</option>
                <option>Ice Patch</option>
                <option>Heavy Traffic</option>
                <option>Construction</option>
                <option>Hazard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Severity</label>
              <select
                value={alertForm.severity}
                onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Location</label>
              <input
                type="text"
                value={alertForm.location}
                onChange={(e) => setAlertForm({ ...alertForm, location: e.target.value })}
                placeholder="e.g., Highway 101"
                className="w-full px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Vehicle ID</label>
              <select
                value={alertForm.vehicle}
                onChange={(e) => setAlertForm({ ...alertForm, vehicle: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select Vehicle</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.id}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Post Alert
            </button>
          </form>
        </motion.div>

        {/* Vehicle List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-slate-200">Active Vehicles</h2>
            </div>
            <span className="text-sm text-slate-400">{vehicles.length} connected</span>
          </div>

          <div className="space-y-3">
            {vehicles.map((vehicle, idx) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${vehicle.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <div>
                    <p className="font-semibold text-slate-200">{vehicle.id}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3 h-3" />
                      <span>{vehicle.location}</span>
                      <span>•</span>
                      <span className="font-mono">{vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-300">{vehicle.speed} km/h</p>
                  <p className="text-xs text-slate-500">{getTimeSince(vehicle.lastSeen)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
