import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications } from '../slices/notificationSlice.js';
import { motion, AnimatePresence } from 'framer-motion';
import { HiXMark, HiInformationCircle, HiCheckCircle, HiExclamationTriangle, HiXCircle } from 'react-icons/hi2';

const iconMap = {
  info: HiInformationCircle,
  success: HiCheckCircle,
  warning: HiExclamationTriangle,
  error: HiXCircle,
};

const colorMap = {
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
};

export default function NotificationBanner() {
  const dispatch = useDispatch();
  const { items: notifications } = useSelector((state) => state.notifications);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, user]);

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <AnimatePresence>
        {notifications.slice(0, 3).map((notification) => {
          const Icon = iconMap[notification.type] || HiInformationCircle;
          return (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`max-w-4xl mx-auto mb-2 p-4 rounded-lg border ${colorMap[notification.type]} flex items-start gap-3`}
            >
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{notification.title}</h4>
                <p className="text-sm">{notification.message}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

