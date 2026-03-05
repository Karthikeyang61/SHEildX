import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import { StatusIndicator } from '@/components/StatusIndicator';
import { LogsPanel } from '@/components/LogsPanel';
import { SOSPanel } from '@/components/SOSPanel';
import { PoliceAlertPanel } from '@/components/PoliceAlertPanel';
import { Button } from '@/components/ui/button';
import { Bluetooth, Radio, Battery, Lightbulb, ArrowLeft, MousePointer2, RefreshCw, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const { 
    deviceStatus, 
    sosAlert, 
    policeAlert, 
    connectedDevice,
    triggerSOS,
    cancelSOS,
    triggerPoliceAlert,
    addButtonActivity,
    updateDeviceStatus,
  } = useDevice();

  const handleSinglePress = () => {
    addButtonActivity({ type: 'single', message: 'Single button press detected' });
  };

  const handleDoublePress = () => {
    addButtonActivity({ type: 'double', message: 'Double press - Starting SOS sequence' });
    setTimeout(() => triggerSOS(), 500);
  };

  const handleTriplePress = () => {
    if (sosAlert.active) {
      cancelSOS();
    } else {
      addButtonActivity({ type: 'triple', message: 'Triple press detected' });
    }
  };

  const handlePoliceAlert = () => {
    triggerPoliceAlert();
  };

  const handleRefreshStatus = () => {
    setRefreshing(true);
    updateDeviceStatus({ lastSync: new Date() });
    toast.success('Device status refreshed');
    addButtonActivity({ type: 'single', message: 'Manual status refresh requested' });
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">Device Dashboard</h1>
          <p className="text-muted-foreground">
            {connectedDevice ? `Connected to ${connectedDevice}` : 'No device connected'}
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6">
        {/* Left Column - Status */}
        <div className="space-y-6">
          {/* Device Status Panel */}
          <motion.div
            className="glass-card p-6 rounded-xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Device Status</h2>
              <Button
                onClick={handleRefreshStatus}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Refresh status"
                disabled={refreshing}
              >
                <motion.div
                  animate={refreshing ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
              </Button>
            </div>
            <div className="space-y-3">
              <StatusIndicator
                status={deviceStatus.bluetooth}
                label="Bluetooth"
                icon={<Bluetooth className="w-5 h-5" />}
                glowColor="blue"
              />
              <StatusIndicator
                status={deviceStatus.gsm}
                label="GSM Module"
                icon={<Radio className="w-5 h-5" />}
                glowColor="teal"
              />
              <StatusIndicator
                status={deviceStatus.ledOn}
                label="LED Status"
                icon={<Lightbulb className="w-5 h-5" />}
                glowColor="purple"
              />
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Battery className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Battery</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <motion.div
                          className="bg-gradient-cyber h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${deviceStatus.battery}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{deviceStatus.battery.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              {deviceStatus.lastSync && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <Clock className="w-3 h-3" />
                  <span>Last sync: {format(deviceStatus.lastSync, 'HH:mm:ss')}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Button Simulator */}
          <motion.div
            className="glass-card p-6 rounded-xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MousePointer2 className="w-5 h-5" />
              Button Simulator
            </h2>
            <div className="space-y-3">
              <Button onClick={handleSinglePress} variant="outline" className="w-full">
                Single Press
              </Button>
              <Button onClick={handleDoublePress} variant="outline" className="w-full border-accent">
                Double Press (Trigger SOS)
              </Button>
              <Button onClick={handleTriplePress} variant="outline" className="w-full border-warning">
                Triple Press (Cancel SOS)
              </Button>
              <Button onClick={handlePoliceAlert} variant="outline" className="w-full border-secondary">
                Simulate Police Alert
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Middle Column - Alerts */}
        <div className="space-y-6">
          {(sosAlert.active || sosAlert.sent || sosAlert.cancelWindowActive || sosAlert.policeWindowActive) && <SOSPanel />}
          {policeAlert && <PoliceAlertPanel />}
          
          {!sosAlert.active && !sosAlert.sent && !sosAlert.cancelWindowActive && !sosAlert.policeWindowActive && !policeAlert && (
            <motion.div
              className="glass-card p-8 rounded-xl text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold mb-2">All Systems Normal</h3>
              <p className="text-muted-foreground">No active alerts</p>
            </motion.div>
          )}
        </div>

        {/* Right Column - Logs */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <LogsPanel />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

