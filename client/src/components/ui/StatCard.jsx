import { motion } from 'framer-motion';
import { HiArrowUp, HiArrowDown } from 'react-icons/hi2';

export default function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend,
  trendValue,
  color = 'primary',
  delay = 0,
  className = '',
}) {
  const colorVariants = {
    primary: {
      bg: 'from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10',
      icon: 'bg-primary-500',
      text: 'text-primary-700 dark:text-primary-300',
    },
    blue: {
      bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10',
      icon: 'bg-blue-500',
      text: 'text-blue-700 dark:text-blue-300',
    },
    purple: {
      bg: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10',
      icon: 'bg-purple-500',
      text: 'text-purple-700 dark:text-purple-300',
    },
    amber: {
      bg: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10',
      icon: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-300',
    },
    green: {
      bg: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10',
      icon: 'bg-green-500',
      text: 'text-green-700 dark:text-green-300',
    },
  };
  
  const colorScheme = colorVariants[color] || colorVariants.primary;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`relative overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.bg}`}></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          {Icon && (
            <div className={`${colorScheme.icon} p-3 rounded-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          {trend && trendValue && (
            <div className={`flex items-center ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? (
                <HiArrowUp className="w-4 h-4" />
              ) : (
                <HiArrowDown className="w-4 h-4" />
              )}
              <span className="ml-1 text-sm font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}