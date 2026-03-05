import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '@/context/DeviceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Phone, Bluetooth, Info } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const navigate = useNavigate();
  const { emergencyContact, updateEmergencyContact, disconnectDevice, deviceStatus, connectedDevice } = useDevice();
  const [contact, setContact] = useState(emergencyContact);

  const handleSaveContact = () => {
    updateEmergencyContact(contact);
    toast.success('Emergency contact updated');
  };

  const handleDisconnect = () => {
    disconnectDevice();
    toast.info('Device disconnected');
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
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
          className="mb-12"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">Settings</h1>
          <p className="text-muted-foreground">
            Configure your SHEild-X device
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Emergency Contact */}
          <motion.div
            className="glass-card p-6 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Emergency Contact</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact">Phone Number</Label>
                <Input
                  id="contact"
                  type="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+1234567890"
                  className="mt-2"
                />
              </div>
              
              <Button onClick={handleSaveContact} className="w-full bg-gradient-cyber">
                Save Contact
              </Button>
            </div>
          </motion.div>

          {/* Device Connection */}
          <motion.div
            className="glass-card p-6 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Bluetooth className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Bluetooth Connection</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-background/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className="font-semibold">
                  {connectedDevice ? `Connected to ${connectedDevice}` : 'Not connected'}
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate('/bluetooth')}
                  variant="outline"
                  className="flex-1"
                >
                  Scan Devices
                </Button>
                
                {connectedDevice && (
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    className="flex-1 border-destructive text-destructive"
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Device Info */}
          <motion.div
            className="glass-card p-6 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Device Information</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-muted-foreground">Battery</span>
                <span className="font-semibold">{deviceStatus.battery}%</span>
              </div>
              <div className="flex justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-muted-foreground">GSM Module</span>
                <span className="font-semibold text-success">
                  {deviceStatus.gsm ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-muted-foreground">Firmware</span>
                <span className="font-semibold">v2.1.0</span>
              </div>
              <div className="flex justify-between p-3 bg-background/50 rounded-lg">
                <span className="text-muted-foreground">Hardware</span>
                <span className="font-semibold">ESP32-DevKit</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
