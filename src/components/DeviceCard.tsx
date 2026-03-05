import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Bluetooth, Wifi, CheckCircle2, Loader2 } from 'lucide-react';

interface DeviceCardProps {
  name: string;
  rssi: number;
  onConnect: () => void;
  index: number;
  connected?: boolean;
  connecting?: boolean;
}

export const DeviceCard = ({ name, rssi, onConnect, index, connected = false, connecting = false }: DeviceCardProps) => {
  const signalStrength = Math.abs(rssi) < 50 ? 'Strong' : Math.abs(rssi) < 70 ? 'Medium' : 'Weak';
  
  return (
    <motion.div
      className={`glass-card p-4 rounded-xl transition-all ${
        connected 
          ? 'border-2 border-success/50 glow-green' 
          : connecting 
          ? 'border-2 border-primary/50' 
          : 'hover:glow-blue cursor-pointer'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={!connected && !connecting ? { scale: 1.02 } : {}}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${connected ? 'bg-success/20' : 'bg-primary/20'}`}>
          {connected ? (
            <CheckCircle2 className="w-6 h-6 text-success" />
          ) : (
            <Bluetooth className="w-6 h-6 text-primary" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{name}</h3>
            {connected && (
              <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                Connected
              </span>
            )}
            {connecting && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                Connecting...
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Wifi className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {signalStrength} ({rssi} dBm)
            </span>
          </div>
        </div>

        <Button
          onClick={onConnect}
          disabled={connected || connecting}
          className="bg-gradient-cyber hover:opacity-90"
        >
          {connecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : connected ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Connected
            </>
          ) : (
            'Connect'
          )}
        </Button>
      </div>
    </motion.div>
  );
};
