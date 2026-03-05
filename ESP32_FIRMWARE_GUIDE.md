# ESP32 Firmware Guide for SHEild-X

This guide explains how to set up your ESP32 device to work with the SHEild-X web application.

## Hardware Requirements

- ESP32 development board (ESP32-DevKit recommended)
- GSM module (SIM800L, SIM900, or similar)
- LED for status indication
- Battery monitoring circuit (optional but recommended)
- Button for physical SOS trigger (optional)

## BLE Service Setup

The ESP32 must advertise a BLE service with the following UUIDs:

### Service UUID
```
0000ff00-0000-1000-8000-00805f9b34fb
```

### Characteristics

1. **Command Characteristic** (Write)
   - UUID: `0000ff01-0000-1000-8000-00805f9b34fb`
   - Used to receive commands from the web app

2. **Status Characteristic** (Notify)
   - UUID: `0000ff02-0000-1000-8000-00805f9b34fb`
   - Used to send status updates to the web app

3. **Data Characteristic** (Read/Write)
   - UUID: `0000ff03-0000-1000-8000-00805f9b34fb`
   - Used for data exchange (SMS messages, contact numbers, etc.)

## Command Protocol

Commands are sent as single-byte values to the Command Characteristic:

| Command Code | Value | Description |
|-------------|-------|-------------|
| GET_STATUS | 0x01 | Request device status |
| TRIGGER_SOS | 0x02 | Trigger SOS alert |
| CANCEL_SOS | 0x03 | Cancel SOS alert |
| TRIGGER_POLICE_ALERT | 0x04 | Trigger police alert |
| SET_EMERGENCY_CONTACT | 0x05 | Set emergency contact number |
| SET_LED_STATE | 0x06 | Control LED (on/off) |
| GET_BATTERY | 0x07 | Get battery level |
| SEND_SMS | 0x08 | Send SMS via GSM |

### Command Details

#### GET_STATUS (0x01)
- **Request**: Single byte `0x01`
- **Response**: Sent via Status Characteristic notification
  - Byte 0: Battery level (0-100)
  - Byte 1: GSM status (0 = inactive, 1 = active)
  - Byte 2: LED state (0 = off, 1 = on)
  - Byte 3: Bluetooth status (0 = disconnected, 1 = connected)

#### TRIGGER_SOS (0x02)
- **Request**: Single byte `0x02`
- **Action**: 
  - Turn on LED
  - Start 10-second countdown
  - Send SMS after countdown (if not cancelled)

#### CANCEL_SOS (0x03)
- **Request**: Single byte `0x03`
- **Action**: 
  - Turn off LED
  - Cancel any pending SOS alert

#### TRIGGER_POLICE_ALERT (0x04)
- **Request**: Single byte `0x04`
- **Action**: 
  - Send SMS immediately to emergency contact
  - Flash LED

#### SET_EMERGENCY_CONTACT (0x05)
- **Request**: `0x05` followed by contact string (UTF-8 encoded)
- **Example**: `[0x05, '+', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']`

#### SET_LED_STATE (0x06)
- **Request**: `0x06` followed by state byte
  - `0x00` = LED off
  - `0x01` = LED on

#### GET_BATTERY (0x07)
- **Request**: Single byte `0x07`
- **Response**: Sent via Status Characteristic (battery level in Byte 0)

#### SEND_SMS (0x08)
- **Request**: `0x08` followed by:
  - 1 byte: Phone number length
  - N bytes: Phone number (UTF-8)
  - Remaining bytes: Message text (UTF-8)
- **Example**: 
  ```
  [0x08, 0x0A, '+', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'H', 'e', 'l', 'p', '!']
  ```

## Status Notifications

The ESP32 should send status updates via the Status Characteristic whenever:
- Status changes (battery, GSM, LED, etc.)
- After receiving GET_STATUS command
- Periodically (every 10 seconds recommended)

**Status Packet Format** (4 bytes):
```
[ Battery (0-100), GSM (0/1), LED (0/1), Bluetooth (0/1) ]
```

## Example Arduino/ESP-IDF Code Structure

```cpp
// BLE Service UUIDs
#define SERVICE_UUID        "0000ff00-0000-1000-8000-00805f9b34fb"
#define COMMAND_CHAR_UUID   "0000ff01-0000-1000-8000-00805f9b34fb"
#define STATUS_CHAR_UUID    "0000ff02-0000-1000-8000-00805f9b34fb"
#define DATA_CHAR_UUID      "0000ff03-0000-1000-8000-00805f9b34fb"

// Command codes
#define CMD_GET_STATUS          0x01
#define CMD_TRIGGER_SOS         0x02
#define CMD_CANCEL_SOS          0x03
#define CMD_TRIGGER_POLICE      0x04
#define CMD_SET_EMERGENCY       0x05
#define CMD_SET_LED             0x06
#define CMD_GET_BATTERY         0x07
#define CMD_SEND_SMS            0x08

// Handle command characteristic write
void onCommandWrite(BLECharacteristic *pCharacteristic) {
  uint8_t* data = pCharacteristic->getData();
  uint8_t command = data[0];
  
  switch(command) {
    case CMD_TRIGGER_SOS:
      triggerSOS();
      break;
    case CMD_CANCEL_SOS:
      cancelSOS();
      break;
    case CMD_TRIGGER_POLICE:
      triggerPoliceAlert();
      break;
    case CMD_SEND_SMS:
      handleSendSMS(data, pCharacteristic->getLength());
      break;
    // ... handle other commands
  }
}

// Send status update
void sendStatusUpdate() {
  uint8_t status[4] = {
    getBatteryLevel(),  // 0-100
    gsmModule.isActive() ? 1 : 0,
    ledState ? 1 : 0,
    bleConnected ? 1 : 0
  };
  statusCharacteristic->setValue(status, 4);
  statusCharacteristic->notify();
}
```

## GSM Module Integration

### SMS Sending Example (SIM800L)

```cpp
void sendSMS(String phoneNumber, String message) {
  Serial2.println("AT+CMGF=1");  // Set SMS mode to text
  delay(100);
  Serial2.print("AT+CMGS=\"");
  Serial2.print(phoneNumber);
  Serial2.println("\"");
  delay(100);
  Serial2.print(message);
  Serial2.write(26);  // Ctrl+Z to send
  delay(1000);
}
```

## Testing

1. **Flash firmware** to your ESP32
2. **Power on** the device
3. **Open the web app** in Chrome/Edge/Opera
4. **Go to Bluetooth Scanner** page
5. **Click "Scan for ESP32 Devices"**
6. **Select your device** from the browser's device picker
7. **Click Connect**
8. **Test commands** from the Dashboard

## Troubleshooting

### Device not found
- Ensure ESP32 is powered on
- Check that BLE is advertising
- Verify device name contains "SHEild" or "ESP32"
- Try resetting the ESP32

### Connection fails
- Check that the service UUID matches exactly
- Verify all three characteristics are present
- Ensure BLE is not connected to another device
- Check ESP32 serial monitor for errors

### Commands not working
- Verify command codes match exactly
- Check characteristic permissions (write for commands, notify for status)
- Monitor ESP32 serial output for received commands
- Ensure GSM module is properly initialized

### SMS not sending
- Verify SIM card is inserted and has credit
- Check GSM module is powered and connected
- Verify phone number format is correct
- Check GSM module AT commands are working

## Security Notes

- The current implementation uses a custom service UUID for simplicity
- For production, consider implementing authentication
- Encrypt sensitive data (phone numbers, messages) before transmission
- Validate all inputs on the ESP32 side

## Additional Resources

- [ESP32 BLE Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/bluetooth/esp_gatt.html)
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [SIM800L AT Commands](https://www.simcom.com/product/SIM800L.html)

