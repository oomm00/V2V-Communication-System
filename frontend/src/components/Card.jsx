import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function Card({ icon: Icon, title, value, subtitle, trend, delay = 0 }) {
  const isPositive = trend > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass glass-hover rounded-2xl p-6 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-slate-100">{value}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </motion.div>
  );
}
