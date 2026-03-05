import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from '@/context/DeviceContext';
import { Terminal } from 'lucide-react';
import { format } from 'date-fns';

export const LogsPanel = () => {
  const { buttonActivities } = useDevice();

  const getLogColor = (type: string) => {
    switch (type) {
      case 'sos': return 'text-destructive';
      case 'police': return 'text-secondary';
      case 'triple': return 'text-warning';
      case 'double': return 'text-accent';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <Terminal className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">System Logs</h2>
      </div>

      <div className="space-y-2 h-64 overflow-y-auto font-mono text-sm scrollbar-thin">
        <AnimatePresence>
          {buttonActivities.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={`p-2 rounded ${getLogColor(activity.type)}`}
            >
              <span className="text-muted-foreground mr-2">
                [{format(activity.timestamp, 'HH:mm:ss')}]
              </span>
              {activity.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
