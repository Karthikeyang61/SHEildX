/**
 * Web Bluetooth Service for ESP32 Communication
 * 
 * BLE Service UUID: 0000ff00-0000-1000-8000-00805f9b34fb (Custom)
 * Characteristic UUIDs:
 * - Command: 0000ff01-0000-1000-8000-00805f9b34fb (Write)
 * - Status: 0000ff02-0000-1000-8000-00805f9b34fb (Notify)
 * - Data: 0000ff03-0000-1000-8000-00805f9b34fb (Read/Write)
 */

// BLE Service and Characteristic UUIDs
export const SHEILD_SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
export const COMMAND_CHAR_UUID = '0000ff01-0000-1000-8000-00805f9b34fb';
export const STATUS_CHAR_UUID = '0000ff02-0000-1000-8000-00805f9b34fb';
export const DATA_CHAR_UUID = '0000ff03-0000-1000-8000-00805f9b34fb';

// Command codes for ESP32
export enum CommandCode {
  GET_STATUS = 0x01,
  TRIGGER_SOS = 0x02,
  CANCEL_SOS = 0x03,
  TRIGGER_POLICE_ALERT = 0x04,
  SET_EMERGENCY_CONTACT = 0x05,
  SET_LED_STATE = 0x06,
  GET_BATTERY = 0x07,
  SEND_SMS = 0x08,
}

// Button event types
export enum ButtonEventType {
  SINGLE_PRESS = 0x01,        // SOS triggered (after 10s window)
  DOUBLE_PRESS = 0x02,        // Double press - cancel window started
  TRIPLE_PRESS_CANCEL = 0x03, // Triple press - SOS cancelled in first window
  TRIPLE_PRESS_POLICE_CANCEL = 0x04, // Triple press - Police cancelled in second window
  POLICE_ALERT = 0x05,        // Police alert triggered (after 30s window)
}

export interface BLEDeviceInfo {
  device: BluetoothDevice;
  name: string;
  id: string;
  rssi?: number;
}

export interface DeviceStatus {
  battery: number;
  gsm: boolean;
  ledOn: boolean;
  bluetooth: boolean;
}

class BLEService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private service: BluetoothRemoteGATTService | null = null;
  private commandChar: BluetoothRemoteGATTCharacteristic | null = null;
  private statusChar: BluetoothRemoteGATTCharacteristic | null = null;
  private dataChar: BluetoothRemoteGATTCharacteristic | null = null;
  private statusCallback: ((status: DeviceStatus) => void) | null = null;
  private buttonEventCallback: ((eventType: ButtonEventType) => void) | null = null;

  /**
   * Check if Web Bluetooth is available
   */
  isAvailable(): boolean {
    return 'bluetooth' in navigator;
  }

  /**
   * Request Bluetooth device with filters
   */
  async requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice> {
    if (!this.isAvailable()) {
      throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.');
    }

    const requestOptions: RequestDeviceOptions = {
      filters: [
        { namePrefix: 'SHEild' },
        { namePrefix: 'ESP32' },
        { services: [SHEILD_SERVICE_UUID] },
      ],
      optionalServices: [SHEILD_SERVICE_UUID],
      ...options,
    };

    try {
      this.device = await navigator.bluetooth.requestDevice(requestOptions);
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));
      return this.device;
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        throw new Error('No Bluetooth device found. Make sure your ESP32 is powered on and advertising.');
      } else if (error.name === 'SecurityError') {
        throw new Error('Bluetooth permission denied. Please allow Bluetooth access.');
      } else if (error.name === 'NetworkError') {
        throw new Error('Bluetooth connection failed. Please try again.');
      }
      throw error;
    }
  }

  /**
   * Connect to the Bluetooth device
   */
  async connect(): Promise<void> {
    if (!this.device) {
      throw new Error('No device selected. Please scan and select a device first.');
    }

    if (!this.device.gatt) {
      throw new Error('GATT server not available.');
    }

    try {
      this.server = await this.device.gatt.connect();
      this.service = await this.server.getPrimaryService(SHEILD_SERVICE_UUID);
      
      // Get characteristics
      this.commandChar = await this.service.getCharacteristic(COMMAND_CHAR_UUID);
      this.statusChar = await this.service.getCharacteristic(STATUS_CHAR_UUID);
      this.dataChar = await this.service.getCharacteristic(DATA_CHAR_UUID);

      // Subscribe to status notifications
      await this.statusChar.startNotifications();
      this.statusChar.addEventListener('characteristicvaluechanged', this.onStatusChanged.bind(this));

      // Subscribe to data notifications (for button events)
      try {
        await this.dataChar.startNotifications();
        this.dataChar.addEventListener('characteristicvaluechanged', this.onDataChanged.bind(this));
      } catch (error) {
        console.warn('Data characteristic notifications not available, button events may not work');
      }
    } catch (error: any) {
      throw new Error(`Failed to connect: ${error.message}`);
    }
  }

  /**
   * Disconnect from the device
   */
  async disconnect(): Promise<void> {
      if (this.statusChar) {
        try {
          await this.statusChar.stopNotifications();
        } catch (e) {
          // Ignore errors during disconnect
        }
      }

      if (this.dataChar) {
        try {
          await this.dataChar.stopNotifications();
        } catch (e) {
          // Ignore errors during disconnect
        }
      }

    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }

    this.device = null;
    this.server = null;
    this.service = null;
    this.commandChar = null;
    this.statusChar = null;
    this.dataChar = null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.device?.gatt?.connected ?? false;
  }

  /**
   * Get device name
   */
  getDeviceName(): string | null {
    return this.device?.name ?? null;
  }

  /**
   * Send command to ESP32
   */
  async sendCommand(command: CommandCode, data?: Uint8Array): Promise<void> {
    if (!this.commandChar) {
      throw new Error('Not connected to device.');
    }

    const commandData = new Uint8Array(data ? [command, ...data] : [command]);
    await this.commandChar.writeValue(commandData);
  }

  /**
   * Read data from device
   */
  async readData(): Promise<DataView> {
    if (!this.dataChar) {
      throw new Error('Not connected to device.');
    }

    return await this.dataChar.readValue();
  }

  /**
   * Write data to device
   */
  async writeData(data: Uint8Array): Promise<void> {
    if (!this.dataChar) {
      throw new Error('Not connected to device.');
    }

    await this.dataChar.writeValue(data);
  }

  /**
   * Set callback for status updates
   */
  setStatusCallback(callback: (status: DeviceStatus) => void): void {
    this.statusCallback = callback;
  }

  /**
   * Set callback for button events
   */
  setButtonEventCallback(callback: (eventType: ButtonEventType) => void): void {
    this.buttonEventCallback = callback;
  }

  /**
   * Get device status
   */
  async getStatus(): Promise<DeviceStatus> {
    await this.sendCommand(CommandCode.GET_STATUS);
    // Status will be received via notification
    // Return a default status for now
    return {
      battery: 0,
      gsm: false,
      ledOn: false,
      bluetooth: true,
    };
  }

  /**
   * Trigger SOS alert
   */
  async triggerSOS(): Promise<void> {
    await this.sendCommand(CommandCode.TRIGGER_SOS);
  }

  /**
   * Cancel SOS alert
   */
  async cancelSOS(): Promise<void> {
    await this.sendCommand(CommandCode.CANCEL_SOS);
  }

  /**
   * Trigger police alert
   */
  async triggerPoliceAlert(): Promise<void> {
    await this.sendCommand(CommandCode.TRIGGER_POLICE_ALERT);
  }

  /**
   * Set emergency contact number
   */
  async setEmergencyContact(contact: string): Promise<void> {
    const encoder = new TextEncoder();
    const contactBytes = encoder.encode(contact);
    await this.sendCommand(CommandCode.SET_EMERGENCY_CONTACT, contactBytes);
  }

  /**
   * Set LED state
   */
  async setLEDState(on: boolean): Promise<void> {
    await this.sendCommand(CommandCode.SET_LED_STATE, new Uint8Array([on ? 1 : 0]));
  }

  /**
   * Get battery level
   */
  async getBattery(): Promise<number> {
    await this.sendCommand(CommandCode.GET_BATTERY);
    // Battery will be received via notification
    return 0;
  }

  /**
   * Send SMS via GSM
   */
  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    const encoder = new TextEncoder();
    const phoneBytes = encoder.encode(phoneNumber);
    const messageBytes = encoder.encode(message);
    const data = new Uint8Array([phoneBytes.length, ...phoneBytes, ...messageBytes]);
    await this.sendCommand(CommandCode.SEND_SMS, data);
  }

  /**
   * Handle status notifications
   */
  private onStatusChanged(event: Event): void {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    
    if (!value || !this.statusCallback) return;

    // Parse status data (format: [battery, gsm, led, bluetooth])
    const battery = value.getUint8(0);
    const gsm = value.getUint8(1) === 1;
    const ledOn = value.getUint8(2) === 1;
    const bluetooth = value.getUint8(3) === 1;

    this.statusCallback({
      battery,
      gsm,
      ledOn,
      bluetooth,
    });
  }

  /**
   * Handle data notifications (button events)
   */
  private onDataChanged(event: Event): void {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    
    if (!value) {
      console.warn('Button event: No value received');
      return;
    }

    if (!this.buttonEventCallback) {
      console.warn('Button event: No callback registered');
      return;
    }

    // Button event format: [0xFF, eventType]
    // eventType: 
    //   0x01 = SOS triggered (after 10s window)
    //   0x02 = Double press - cancel window started
    //   0x03 = Triple press - SOS cancelled in first window
    //   0x04 = Triple press - Police cancelled in second window
    //   0x05 = Police alert triggered (after 30s window)
    console.log('Button event received:', {
      byteLength: value.byteLength,
      byte0: value.byteLength > 0 ? value.getUint8(0) : 'N/A',
      byte1: value.byteLength > 1 ? value.getUint8(1) : 'N/A'
    });

    if (value.byteLength >= 2 && value.getUint8(0) === 0xFF) {
      const eventType = value.getUint8(1) as ButtonEventType;
      const eventNames = {
        0x01: 'SOS TRIGGERED',
        0x02: 'DOUBLE PRESS (Cancel Window Started)',
        0x03: 'TRIPLE PRESS (SOS Cancelled)',
        0x04: 'TRIPLE PRESS (Police Cancelled)',
        0x05: 'POLICE ALERT TRIGGERED'
      };
      console.log('Button event type:', eventNames[eventType] || 'UNKNOWN');
      
      if (this.buttonEventCallback) {
        this.buttonEventCallback(eventType);
      }
    } else {
      console.warn('Invalid button event format:', {
        byteLength: value.byteLength,
        firstByte: value.byteLength > 0 ? value.getUint8(0) : 'N/A'
      });
    }
  }

  /**
   * Handle disconnection
   */
  private onDisconnected(): void {
    // Clean up
    this.device = null;
    this.server = null;
    this.service = null;
    this.commandChar = null;
    this.statusChar = null;
    this.dataChar = null;
  }
}

// Export singleton instance
export const bleService = new BLEService();

