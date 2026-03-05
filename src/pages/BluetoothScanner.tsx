import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import { RadarScanner } from '@/components/RadarScanner';
import { DeviceCard } from '@/components/DeviceCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Scan, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { bleService } from '@/services/bleService';

interface BLEDevice {
  name: string;
  id: string;
  rssi?: number;
}

const BluetoothScanner = () => {
  const navigate = useNavigate();
  const { connectDevice, connectedDevice, disconnectDevice, addButtonActivity } = useDevice();
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [bleAvailable, setBleAvailable] = useState(false);

  useEffect(() => {
    setBleAvailable(bleService.isAvailable());
    if (!bleService.isAvailable()) {
      toast.error('Web Bluetooth is not supported. Please use Chrome, Edge, or Opera browser.');
    }
  }, []);

  const startScan = async () => {
    if (!bleAvailable) {
      toast.error('Bluetooth is not available in this browser.');
      return;
    }

    setScanning(true);
    setDevices([]);
    toast.info('Requesting Bluetooth device...');
    addButtonActivity({ type: 'single', message: 'Bluetooth scan initiated' });

    try {
      // Request device - browser will show device picker
      const device = await bleService.requestDevice({
        filters: [
          { namePrefix: 'SHEild' },
          { namePrefix: 'ESP32' },
        ],
      });

      if (device) {
        const deviceInfo: BLEDevice = {
          name: device.name || 'Unknown Device',
          id: device.id,
        };

        setDevices([deviceInfo]);
        addButtonActivity({ type: 'single', message: `Found device: ${deviceInfo.name}` });
        toast.success('Device found! Click connect to pair.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to scan for devices');
      addButtonActivity({ type: 'single', message: `Scan failed: ${error.message}` });
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (deviceId: string, deviceName: string) => {
    if (connectedDevice && connectedDevice !== deviceName) {
      toast.warning('Disconnecting from current device first...');
      await handleDisconnect();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setConnecting(deviceName);
    const loadingToast = toast.loading(`Connecting to ${deviceName}...`);
    addButtonActivity({ type: 'single', message: `Connecting to ${deviceName}...` });

    try {
      // Connect to the device
      await bleService.connect();
      
      // Update context
      connectDevice(deviceName);
      setConnecting(null);
      toast.dismiss(loadingToast);
      toast.success(`Successfully connected to ${deviceName}`);
      addButtonActivity({ type: 'single', message: `Successfully connected to ${deviceName}` });
      
      // Navigate to dashboard after a short delay
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to connect to device');
      addButtonActivity({ type: 'single', message: `Connection failed: ${error.message}` });
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      await bleService.disconnect();
      disconnectDevice();
      toast.info('Device disconnected');
      addButtonActivity({ type: 'single', message: 'Device disconnected from scanner' });
    } catch (error: any) {
      toast.error('Failed to disconnect properly');
      disconnectDevice();
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">Bluetooth Scanner</h1>
          <p className="text-muted-foreground">
            Scan for nearby SHEild-X devices
          </p>
        </motion.div>

        {/* Connected Device Banner */}
        {connectedDevice && (
          <motion.div
            className="glass-card p-4 rounded-xl mb-8 border-2 border-success/50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Currently Connected</p>
                <p className="text-lg font-semibold text-success">{connectedDevice}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="border-destructive text-destructive"
                >
                  Disconnect
                </Button>
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gradient-cyber"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Radar Scanner */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          {scanning && <RadarScanner />}
        </motion.div>

        {/* Browser Support Warning */}
        {!bleAvailable && (
          <motion.div
            className="glass-card p-4 rounded-xl mb-8 border-2 border-warning/50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning" />
              <div>
                <p className="font-semibold text-warning">Web Bluetooth Not Supported</p>
                <p className="text-sm text-muted-foreground">
                  Please use Chrome, Edge, or Opera browser to connect to ESP32 devices.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Scan Button */}
        <div className="text-center mb-8">
          <Button
            onClick={startScan}
            disabled={scanning || !bleAvailable}
            size="lg"
            className="bg-gradient-cyber hover:opacity-90 glow-purple"
          >
            <Scan className="w-5 h-5 mr-2" />
            {scanning ? 'Selecting Device...' : 'Scan for ESP32 Devices'}
          </Button>
          {!bleAvailable && (
            <p className="text-sm text-muted-foreground mt-2">
              Web Bluetooth requires HTTPS or localhost
            </p>
          )}
        </div>

        {/* Devices List */}
        <div className="space-y-4">
          <AnimatePresence>
            {devices.map((device, index) => (
              <DeviceCard
                key={device.id}
                name={device.name}
                rssi={device.rssi}
                onConnect={() => handleConnect(device.id, device.name)}
                index={index}
                connected={connectedDevice === device.name}
                connecting={connecting === device.name}
              />
            ))}
          </AnimatePresence>
        </div>

        {!scanning && devices.length === 0 && bleAvailable && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-muted-foreground mb-2">No devices found.</p>
            <p className="text-sm text-muted-foreground">
              Click "Scan for ESP32 Devices" to search. Make sure your ESP32 is powered on and advertising.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BluetoothScanner;
