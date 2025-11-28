import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2, MapPin, Clock, Filter, Map, Lock, Unlock } from 'lucide-react';
import { useData } from '../context/DataContext';
import MapModal from './MapModal';

export default function AlertsPage() {
  const { alerts, deleteAlert, decryptAlert, edscaEnabled } = useData();
  const [filter, setFilter] = useState('all');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const handleViewOnMap = (alert) => {
    setSelectedAlert(alert);
    setIsMapModalOpen(true);
  };

  const handleDecrypt = (alertId) => {
    decryptAlert(alertId);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.severity === filter);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold neon-text mb-1">Alert Management</h1>
            <p className="text-sm text-slate-500">Monitor and manage all vehicle alerts</p>
          </div>
          {edscaEnabled && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass">
              <Lock className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">EDSCA Encryption Active</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Alerts', value: alerts.length, color: 'emerald' },
          { label: 'Critical', value: alerts.filter(a => a.severity === 'critical').length, color: 'red' },
          { label: 'High', value: alerts.filter(a => a.severity === 'high').length, color: 'orange' },
          { label: 'Medium/Low', value: alerts.filter(a => a.severity === 'medium' || a.severity === 'low').length, color: 'blue' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass rounded-xl p-4"
          >
            <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-xl p-4 flex items-center gap-4"
      >
        <Filter className="w-5 h-5 text-slate-400" />
        <div className="flex gap-2">
          {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
            <button
              key={severity}
              onClick={() => setFilter(severity)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === severity
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Alerts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-6"
      >
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No alerts found</p>
            </div>
          ) : (
            filteredAlerts.map((alert, idx) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <AlertTriangle className={`w-5 h-5 ${getSeverityColor(alert.severity).split(' ')[0]}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="font-semibold text-slate-200">{alert.type}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      {edscaEnabled && alert.encrypted && !alert.decrypted && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Encrypted
                        </span>
                      )}
                      {alert.decrypted && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Unlock className="w-3 h-3" />
                          Decrypted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{alert.location}</span>
                      </div>
                      <span>•</span>
                      <span>{alert.vehicle}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {alert.blockchainTxId && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-emerald-400">{alert.blockchainTxId}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleViewOnMap(alert)}
                    className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title="View on Map"
                  >
                    <Map className="w-4 h-4" />
                  </button>
                  {edscaEnabled && alert.encrypted && !alert.decrypted && (
                    <button
                      onClick={() => handleDecrypt(alert.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                      title="Decrypt Alert"
                    >
                      <Unlock className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete Alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Map Modal */}
      <MapModal
        alert={selectedAlert}
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
      />
    </div>
  );
}
