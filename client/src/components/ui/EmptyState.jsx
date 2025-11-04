import { motion } from 'framer-motion';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionLabel,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`text-center py-12 ${className}`}
    >
      {Icon && (
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
            <Icon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
          </div>
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && actionLabel && (
        <button onClick={action} className="btn btn-primary">
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}