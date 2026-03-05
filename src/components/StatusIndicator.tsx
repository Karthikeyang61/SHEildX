import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: boolean;
  label: string;
  icon?: React.ReactNode;
  glowColor?: 'purple' | 'blue' | 'teal' | 'red' | 'green';
}

export const StatusIndicator = ({ 
  status, 
  label, 
  icon,
  glowColor = 'purple' 
}: StatusIndicatorProps) => {
  const glowClass = {
    purple: 'glow-purple',
    blue: 'glow-blue',
    teal: 'glow-teal',
    red: 'glow-red',
    green: 'shadow-[0_0_20px_rgba(34,197,94,0.4)]',
  }[glowColor];

  return (
    <div className="glass-card p-4 rounded-xl flex items-center gap-3">
      {icon && <div className="text-primary">{icon}</div>}
      
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>

      <motion.div
        className={cn(
          "w-3 h-3 rounded-full",
          status ? "bg-success" : "bg-muted"
        )}
        animate={status ? {
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        {status && (
          <motion.div
            className={cn("w-3 h-3 rounded-full", glowClass)}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        )}
      </motion.div>
    </div>
  );
};
