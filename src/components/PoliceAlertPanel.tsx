import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useDevice } from '@/context/DeviceContext';
import { Shield, Phone, Clock } from 'lucide-react';

export const PoliceAlertPanel = () => {
  const { policeAlertTimestamp } = useDevice();
  const [timeRemaining, setTimeRemaining] = useState(8);

  useEffect(() => {
    if (!policeAlertTimestamp) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - policeAlertTimestamp.getTime()) / 1000);
      const remaining = Math.max(0, 8 - elapsed);
      setTimeRemaining(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [policeAlertTimestamp]);

  return (
    <motion.div
      className="glass-card p-6 rounded-xl border-2 border-secondary/50 glow-blue"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
    >
      {/* Siren effect */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{
          background: [
            'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, transparent 50%, rgba(59, 130, 246, 0.2) 100%)',
            'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, transparent 50%, rgba(239, 68, 68, 0.2) 100%)',
          ],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Shield className="w-8 h-8 text-secondary" />
          </motion.div>
          <h2 className="text-2xl font-bold text-secondary">POLICE ALERT TRIGGERED</h2>
        </div>

        <div className="space-y-3">
          <p className="text-foreground">Emergency services have been notified</p>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="w-5 h-5" />
            <span>Dispatch contacted: Emergency Services</span>
          </div>

          {timeRemaining > 0 && (
            <div className="bg-background/50 p-3 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-secondary" />
                <span className="text-muted-foreground">Auto-dismiss in:</span>
                <motion.span
                  className="font-bold text-secondary"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {timeRemaining}s
                </motion.span>
              </div>
            </div>
          )}

          <div className="bg-secondary/10 p-4 rounded-lg">
            <p className="text-sm text-center font-semibold">
              🚨 Help is on the way 🚨
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
