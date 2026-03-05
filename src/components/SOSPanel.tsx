import { motion, AnimatePresence } from 'framer-motion';
import { useDevice } from '@/context/DeviceContext';
import { AlertTriangle, Phone, CheckCircle2, Shield } from 'lucide-react';
import { Button } from './ui/button';

export const SOSPanel = () => {
  const { sosAlert, emergencyContact, cancelSOS } = useDevice();

  // Show panel if SOS is active, sent, or if cancel windows are active
  if (!sosAlert.active && !sosAlert.sent && !sosAlert.cancelWindowActive && !sosAlert.policeWindowActive) {
    return null;
  }

  // Show cancel window panel
  if (sosAlert.cancelWindowActive) {
    return (
      <motion.div
        className="glass-card p-6 rounded-xl border-2 border-warning/50 glow-yellow"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-8 h-8 text-warning" />
          <h2 className="text-2xl font-bold text-warning">CANCEL WINDOW ACTIVE</h2>
        </div>
        <div className="space-y-4">
          <p className="text-foreground">Press button 3x within {sosAlert.cancelWindowRemaining}s to cancel SOS</p>
          <div className="bg-background/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Time remaining:</p>
            <motion.div
              className="text-4xl font-bold text-center text-warning"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {sosAlert.cancelWindowRemaining}s
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show police alert window panel
  if (sosAlert.policeWindowActive) {
    return (
      <motion.div
        className="glass-card p-6 rounded-xl border-2 border-secondary/50 glow-blue"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-secondary" />
          <h2 className="text-2xl font-bold text-secondary">POLICE ALERT WINDOW</h2>
        </div>
        <div className="space-y-4">
          <p className="text-foreground">Press button 3x within {sosAlert.policeWindowRemaining}s to cancel Police Alert</p>
          <div className="bg-background/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Time remaining:</p>
            <motion.div
              className="text-4xl font-bold text-center text-secondary"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {sosAlert.policeWindowRemaining}s
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {sosAlert.sent ? (
        <motion.div
          key="sent"
          className="glass-card p-6 rounded-xl border-2 border-success/50 glow-green"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            >
              <CheckCircle2 className="w-8 h-8 text-success" />
            </motion.div>
            <h2 className="text-2xl font-bold text-success">SOS ALERT SENT</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <Phone className="w-5 h-5" />
              <span>Alert sent to: {emergencyContact}</span>
            </div>

            <div className="bg-success/10 p-4 rounded-lg">
              <p className="text-sm text-center font-semibold text-success">
                🚨 Emergency services have been notified! 🚨
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="active"
          className="glass-card p-6 rounded-xl border-2 border-destructive/50 glow-red"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Pulsing background */}
          <motion.div
            className="absolute inset-0 bg-destructive/10 rounded-xl"
            animate={{
              opacity: [0.1, 0.3, 0.1],
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
                  rotate: [0, -10, 10, -10, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </motion.div>
              <h2 className="text-2xl font-bold text-destructive">SOS ACTIVATED</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-foreground">
                <Phone className="w-5 h-5" />
                <span>Sending alert to: {emergencyContact}</span>
              </div>

              <div className="bg-background/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Cancellation window:</p>
                <motion.div
                  className="text-4xl font-bold text-center gradient-text"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                >
                  {sosAlert.countdown}s
                </motion.div>
              </div>

              <Button
                onClick={cancelSOS}
                variant="outline"
                className="w-full border-warning hover:bg-warning/20"
              >
                Press 3x to Cancel SOS
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
