import { motion } from 'framer-motion';
import { Activity, Box, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function BlockchainPage() {
  const { blockchainLogs, stats } = useData();

  const getStatusColor = (status) => {
    return status === 'confirmed' ? 'text-emerald-400' : 'text-yellow-400';
  };

  const getStatusIcon = (status) => {
    return status === 'confirmed' ? CheckCircle : Clock;
  };

  const getTimeSince = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold neon-text mb-1">Blockchain Status</h1>
        <p className="text-sm text-slate-500">Monitor blockchain synchronization and transactions</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Box, label: 'Latest Block', value: `#${stats.latestBlock}`, color: 'emerald' },
          { icon: Activity, label: 'Total Transactions', value: blockchainLogs.length, color: 'blue' },
          { icon: CheckCircle, label: 'Confirmed', value: blockchainLogs.filter(log => log.status === 'confirmed').length, color: 'green' },
          { icon: Clock, label: 'Pending', value: blockchainLogs.filter(log => log.status === 'pending').length, color: 'yellow' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400 w-fit mb-3`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Transaction Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-200">Transaction Logs</h2>
          <span className="text-sm text-slate-400">{blockchainLogs.length} total</span>
        </div>
        
        <div className="space-y-3">
          {blockchainLogs.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No blockchain transactions yet</p>
              <p className="text-sm text-slate-500 mt-1">Transactions will appear when alerts are created</p>
            </div>
          ) : (
            blockchainLogs.map((log, idx) => {
              const StatusIcon = getStatusIcon(log.status);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-2 h-2 rounded-full ${
                      log.status === 'confirmed' ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-mono text-sm font-semibold text-slate-200">{log.txId}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                          log.status === 'confirmed'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                            : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Alert ID: {log.alertId}</span>
                        {log.blockNumber && (
                          <>
                            <span>•</span>
                            <span>Block #{log.blockNumber}</span>
                          </>
                        )}
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{getTimeSince(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <StatusIcon className={`w-5 h-5 ${getStatusColor(log.status)}`} />
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Info Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Blockchain Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Network</span>
              <span className="text-sm font-semibold text-emerald-400">V2V Private Chain</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Consensus</span>
              <span className="text-sm font-semibold text-slate-300">Proof of Authority</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Block Time</span>
              <span className="text-sm font-semibold text-slate-300">~3 seconds</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Gas Price</span>
              <span className="text-sm font-semibold text-slate-300">0 Gwei</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Chain ID</span>
              <span className="text-sm font-semibold text-slate-300">1337</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Status</span>
              <span className="text-sm font-semibold text-emerald-400">Synced</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
