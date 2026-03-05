import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { bleService, CommandCode, ButtonEventType } from '@/services/bleService';

export interface DeviceStatus {
  bluetooth: boolean;
  gsm: boolean;
  ledOn: boolean;
  battery: number;
  lastSync: Date | null;
}

export interface ButtonActivity {
  timestamp: Date;
  type: 'single' | 'double' | 'triple' | 'sos' | 'police';
  message: string;
}

export interface SOSAlert {
  active: boolean;
  timestamp: Date | null;
  countdown: number;
  cancelled: boolean;
  sent: boolean;
  cancelWindowActive?: boolean;  // 10s cancel window after double press
  cancelWindowRemaining?: number;
  policeWindowActive?: boolean;  // 30s cancel window after SOS
  policeWindowRemaining?: number;
}

export interface DeviceContextType {
  deviceStatus: DeviceStatus;
  buttonActivities: ButtonActivity[];
  sosAlert: SOSAlert;
  policeAlert: boolean;
  policeAlertTimestamp: Date | null;
  connectedDevice: string | null;
  emergencyContact: string;
  
  updateDeviceStatus: (status: Partial<DeviceStatus>) => void;
  addButtonActivity: (activity: Omit<ButtonActivity, 'timestamp'>) => void;
  triggerSOS: () => void;
  cancelSOS: () => void;
  triggerPoliceAlert: () => void;
  connectDevice: (deviceName: string) => void;
  disconnectDevice: () => void;
  updateEmergencyContact: (contact: string) => void;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    bluetooth: false,
    gsm: true,
    ledOn: false,
    battery: 87,
    lastSync: null,
  });

  const [buttonActivities, setButtonActivities] = useState<ButtonActivity[]>([
    { timestamp: new Date(), type: 'single', message: 'System initialized' }
  ]);

  const [sosAlert, setSOSAlert] = useState<SOSAlert>({
    active: false,
    timestamp: null,
    countdown: 10,
    cancelled: false,
    sent: false,
  });

  const [policeAlert, setPoliceAlert] = useState(false);
  const [policeAlertTimestamp, setPoliceAlertTimestamp] = useState<Date | null>(null);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [emergencyContact, setEmergencyContact] = useState('+1234567890');
  
  // Refs for interval management
  const sosIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const policeAlertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateDeviceStatus = useCallback((status: Partial<DeviceStatus>) => {
    setDeviceStatus(prev => ({ ...prev, ...status, lastSync: new Date() }));
  }, []);

  const addButtonActivity = useCallback((activity: Omit<ButtonActivity, 'timestamp'>) => {
    const newActivity: ButtonActivity = {
      ...activity,
      timestamp: new Date(),
    };
    setButtonActivities(prev => [newActivity, ...prev].slice(0, 50));
  }, []);

  const sendSOSAlert = useCallback(async () => {
    setSOSAlert(prev => ({ ...prev, sent: true, active: false }));
    
    // Send SOS command to ESP32 via BLE
    if (bleService.isConnected()) {
      try {
        await bleService.triggerSOS();
        
        // Send SMS via ESP32's GSM module
        const message = `🚨 EMERGENCY ALERT 🚨\n\nThis is an automated SOS message from SHEild-X emergency system.\n\nUser requires immediate assistance!\n\nTime: ${new Date().toLocaleString()}\n\nPlease respond immediately or contact emergency services.\n\n- SHEild-X Emergency Response System`;
        await bleService.sendSMS(emergencyContact, message);
        
        addButtonActivity({ 
          type: 'sos', 
          message: `🚨 SOS ALERT SENT to ${emergencyContact} via ESP32 GSM! Emergency services notified.` 
        });
      } catch (error: any) {
        addButtonActivity({ 
          type: 'sos', 
          message: `⚠️ SOS Alert triggered but failed to send via device: ${error.message}` 
        });
      }
    } else {
      addButtonActivity({ 
        type: 'sos', 
        message: `⚠️ SOS Alert triggered but no device connected` 
      });
    }
    
    updateDeviceStatus({ ledOn: true });
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setSOSAlert(prev => ({ ...prev, sent: false }));
      updateDeviceStatus({ ledOn: false });
    }, 5000);
  }, [addButtonActivity, emergencyContact, updateDeviceStatus]);

  const triggerSOS = useCallback(async () => {
    // Clear any existing SOS interval
    if (sosIntervalRef.current) {
      clearInterval(sosIntervalRef.current);
    }

    setSOSAlert({
      active: true,
      timestamp: new Date(),
      countdown: 10,
      cancelled: false,
      sent: false,
    });
    addButtonActivity({ type: 'sos', message: 'SOS Alert Triggered - 10s cancellation window' });
    
    // Turn on LED on ESP32
    if (bleService.isConnected()) {
      try {
        await bleService.setLEDState(true);
        updateDeviceStatus({ ledOn: true });
      } catch (error: any) {
        addButtonActivity({ type: 'sos', message: `Failed to control LED: ${error.message}` });
      }
    } else {
      updateDeviceStatus({ ledOn: true });
    }

    // Start countdown timer
    sosIntervalRef.current = setInterval(() => {
      setSOSAlert(prev => {
        if (prev.cancelled || !prev.active) {
          if (sosIntervalRef.current) {
            clearInterval(sosIntervalRef.current);
            sosIntervalRef.current = null;
          }
          return prev;
        }

        const newCountdown = prev.countdown - 1;
        
        if (newCountdown <= 0) {
          if (sosIntervalRef.current) {
            clearInterval(sosIntervalRef.current);
            sosIntervalRef.current = null;
          }
          // Send alert immediately
          setTimeout(() => sendSOSAlert(), 0);
          return { ...prev, countdown: 0 };
        }

        return { ...prev, countdown: newCountdown };
      });
    }, 1000);
  }, [addButtonActivity, updateDeviceStatus, sendSOSAlert]);

  const cancelSOS = useCallback(async () => {
    if (sosIntervalRef.current) {
      clearInterval(sosIntervalRef.current);
      sosIntervalRef.current = null;
    }
    
    // Send cancel command to ESP32
    if (bleService.isConnected()) {
      try {
        await bleService.cancelSOS();
        await bleService.setLEDState(false);
      } catch (error: any) {
        addButtonActivity({ type: 'triple', message: `Failed to cancel on device: ${error.message}` });
      }
    }
    
    setSOSAlert(prev => ({ ...prev, active: false, cancelled: true }));
    addButtonActivity({ type: 'triple', message: 'SOS Cancelled by user' });
    updateDeviceStatus({ ledOn: false });
  }, [addButtonActivity, updateDeviceStatus]);

  const triggerPoliceAlert = useCallback(async () => {
    const timestamp = new Date();
    setPoliceAlert(true);
    setPoliceAlertTimestamp(timestamp);
    
    // Send police alert command to ESP32
    if (bleService.isConnected()) {
      try {
        await bleService.triggerPoliceAlert();
        
        // Send SMS via ESP32's GSM module
        const message = `🚨 POLICE ALERT 🚨\n\nEmergency services alert from SHEild-X system.\n\nTime: ${timestamp.toLocaleString()}\n\nPlease dispatch emergency services immediately.\n\n- SHEild-X Emergency Response System`;
        await bleService.sendSMS(emergencyContact, message);
        
        addButtonActivity({ type: 'police', message: 'Police Alert Sent via ESP32 GSM! Emergency services notified.' });
      } catch (error: any) {
        addButtonActivity({ type: 'police', message: `Police alert failed: ${error.message}` });
      }
    } else {
      addButtonActivity({ type: 'police', message: 'Police Alert triggered but no device connected' });
    }
    
    // Auto-dismiss after 8 seconds
    if (policeAlertTimeoutRef.current) {
      clearTimeout(policeAlertTimeoutRef.current);
    }
    policeAlertTimeoutRef.current = setTimeout(() => {
      setPoliceAlert(false);
      setPoliceAlertTimestamp(null);
      addButtonActivity({ type: 'police', message: 'Police alert dismissed' });
    }, 8000);
  }, [addButtonActivity, emergencyContact]);

  const connectDevice = useCallback((deviceName: string) => {
    setConnectedDevice(deviceName);
    updateDeviceStatus({ bluetooth: true });
    addButtonActivity({ type: 'single', message: `Connected to ${deviceName}` });
  }, [addButtonActivity, updateDeviceStatus]);

  const disconnectDevice = useCallback(() => {
    setConnectedDevice(null);
    updateDeviceStatus({ bluetooth: false });
    addButtonActivity({ type: 'single', message: 'Device disconnected' });
  }, [addButtonActivity, updateDeviceStatus]);

  const updateEmergencyContact = useCallback(async (contact: string) => {
    setEmergencyContact(contact);
    
    // Send emergency contact to ESP32
    if (bleService.isConnected()) {
      try {
        await bleService.setEmergencyContact(contact);
        addButtonActivity({ type: 'single', message: `Emergency contact updated to ${contact} on ESP32` });
      } catch (error: any) {
        addButtonActivity({ type: 'single', message: `Failed to update contact on device: ${error.message}` });
      }
    } else {
      addButtonActivity({ type: 'single', message: `Emergency contact updated to ${contact} (device not connected)` });
    }
  }, [addButtonActivity]);

  // Handle cancel window countdowns
  useEffect(() => {
    if (!connectedDevice) return;

    const interval = setInterval(() => {
      setSOSAlert(prev => {
        const updates: Partial<SOSAlert> = {};
        
        // First cancel window countdown (10s)
        if (prev.cancelWindowActive && prev.cancelWindowRemaining !== undefined) {
          const remaining = Math.max(0, prev.cancelWindowRemaining - 1);
          updates.cancelWindowRemaining = remaining;
          if (remaining === 0) {
            updates.cancelWindowActive = false;
          }
        }
        
        // Second cancel window countdown (30s)
        if (prev.policeWindowActive && prev.policeWindowRemaining !== undefined) {
          const remaining = Math.max(0, prev.policeWindowRemaining - 1);
          updates.policeWindowRemaining = remaining;
          if (remaining === 0) {
            updates.policeWindowActive = false;
          }
        }
        
        return { ...prev, ...updates };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [connectedDevice]);

  // Set up BLE status callback and button events
  useEffect(() => {
    if (connectedDevice && bleService.isConnected()) {
      // Set callback for real-time status updates from ESP32
      bleService.setStatusCallback((status) => {
        updateDeviceStatus({
          battery: status.battery,
          gsm: status.gsm,
          ledOn: status.ledOn,
          bluetooth: status.bluetooth,
        });
      });

      // Set callback for button events from ESP32
      bleService.setButtonEventCallback((eventType) => {
        switch (eventType) {
          case ButtonEventType.DOUBLE_PRESS:
            // Double press - Start 10s cancel window
            addButtonActivity({ type: 'double', message: '🔘🔘 Double press detected - 10s cancel window started' });
            setSOSAlert(prev => ({
              ...prev,
              cancelWindowActive: true,
              cancelWindowRemaining: 10,
              timestamp: new Date(),
            }));
            break;
            
          case ButtonEventType.TRIPLE_PRESS_CANCEL:
            // Triple press in first window - Cancel SOS
            addButtonActivity({ type: 'triple', message: '🔘🔘🔘 Triple press - SOS cancelled in cancel window' });
            setSOSAlert(prev => ({
              ...prev,
              cancelWindowActive: false,
              cancelled: true,
              active: false,
            }));
            updateDeviceStatus({ ledOn: false });
            break;
            
          case ButtonEventType.SINGLE_PRESS:
            // 10s window expired - SOS triggered
            addButtonActivity({ type: 'sos', message: '⏰ 10s window expired - SOS triggered!' });
            triggerSOS();
            // Start 30s police alert window
            setSOSAlert(prev => ({
              ...prev,
              cancelWindowActive: false,
              policeWindowActive: true,
              policeWindowRemaining: 30,
            }));
            break;
            
          case ButtonEventType.TRIPLE_PRESS_POLICE_CANCEL:
            // Triple press in second window - Cancel police alert
            addButtonActivity({ type: 'triple', message: '🔘🔘🔘 Triple press - Police alert cancelled' });
            setSOSAlert(prev => ({
              ...prev,
              policeWindowActive: false,
            }));
            break;
            
          case ButtonEventType.POLICE_ALERT:
            // 30s window expired - Police alert triggered
            addButtonActivity({ type: 'police', message: '⏰ 30s window expired - Police alert triggered!' });
            triggerPoliceAlert();
            setSOSAlert(prev => ({
              ...prev,
              policeWindowActive: false,
            }));
            break;
        }
      });

      // Request initial status
      bleService.getStatus().catch((error) => {
        addButtonActivity({ type: 'single', message: `Failed to get device status: ${error.message}` });
      });

      // Periodic status updates from ESP32
      statusUpdateIntervalRef.current = setInterval(async () => {
        if (bleService.isConnected()) {
          try {
            await bleService.getStatus();
            await bleService.getBattery();
          } catch (error: any) {
            addButtonActivity({ type: 'single', message: `Status update failed: ${error.message}` });
          }
        }
      }, 10000); // Update every 10 seconds
    } else {
      // Fallback: simulate battery drain if not connected
      if (connectedDevice) {
        statusUpdateIntervalRef.current = setInterval(() => {
          setDeviceStatus(prev => {
            const newBattery = Math.max(20, prev.battery - 0.01);
            return {
              ...prev,
              battery: Math.round(newBattery * 100) / 100,
              lastSync: new Date(),
            };
          });
        }, 30000);
      }
    }

    return () => {
      if (statusUpdateIntervalRef.current) {
        clearInterval(statusUpdateIntervalRef.current);
      }
      // Clear callbacks on disconnect
      if (bleService.isConnected()) {
        bleService.setStatusCallback(() => {});
        bleService.setButtonEventCallback(() => {});
      }
    };
  }, [connectedDevice, updateDeviceStatus, addButtonActivity, triggerSOS, cancelSOS]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sosIntervalRef.current) {
        clearInterval(sosIntervalRef.current);
      }
      if (statusUpdateIntervalRef.current) {
        clearInterval(statusUpdateIntervalRef.current);
      }
      if (policeAlertTimeoutRef.current) {
        clearTimeout(policeAlertTimeoutRef.current);
      }
    };
  }, []);

  return (
    <DeviceContext.Provider
      value={{
        deviceStatus,
        buttonActivities,
        sosAlert,
        policeAlert,
        policeAlertTimestamp,
        connectedDevice,
        emergencyContact,
        updateDeviceStatus,
        addButtonActivity,
        triggerSOS,
        cancelSOS,
        triggerPoliceAlert,
        connectDevice,
        disconnectDevice,
        updateEmergencyContact,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within DeviceProvider');
  }
  return context;
};
