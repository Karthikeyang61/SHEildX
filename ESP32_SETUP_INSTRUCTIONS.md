# ESP32 Setup Instructions

Complete guide to set up your ESP32 device for SHEild-X.

## Hardware Connections

### Required Components
- ESP32 Development Board (ESP32-DevKit recommended)
- GSM Module (SIM800L or SIM900)
- LED (for status indication)
- Resistors (for LED if needed)
- SIM Card (with active plan for SMS)

### Connection Diagram

```
ESP32          GSM Module (SIM800L)
------         --------------------
GPIO 17  ---->  TX (GSM RX)
GPIO 16  <----  RX (GSM TX)
GND      <----  GND
5V       <----  VCC (or use external 5V supply for GSM)

ESP32          LED
------         ---
GPIO 2   ---->  Anode (+)
GND      <----  Cathode (-) via 220Ω resistor

ESP32          Battery Monitoring (Optional)
------         -----------------------------
GPIO 34  <----  Battery voltage (via voltage divider)
```

### Pin Configuration

You can change these in the code if needed:

```cpp
#define LED_PIN 2              // GPIO 2 for LED
#define GSM_RX_PIN 16          // GSM RX connected to ESP32 GPIO 16
#define GSM_TX_PIN 17          // GSM TX connected to ESP32 GPIO 17
#define BATTERY_ADC_PIN 34     // Battery monitoring (optional)
```

## Software Setup

### 1. Install Arduino IDE

1. Download Arduino IDE from [arduino.cc](https://www.arduino.cc/en/software)
2. Install the IDE

### 2. Install ESP32 Board Support

1. Open Arduino IDE
2. Go to **File > Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools > Board > Boards Manager**
5. Search for "ESP32" and install "esp32 by Espressif Systems"
6. Select your ESP32 board: **Tools > Board > ESP32 Arduino > ESP32 Dev Module**

### 3. Install Required Libraries

The BLE libraries are included with the ESP32 board package, so no additional libraries are needed!

### 4. Configure the Code

1. Open `ESP32_Arduino_Code.ino` in Arduino IDE
2. Review and adjust these settings if needed:
   - `DEVICE_NAME`: Change if you want a different device name
   - Pin numbers if your connections are different
   - Emergency contact default number

### 5. Upload the Code

1. Connect ESP32 to your computer via USB
2. Select the correct port: **Tools > Port > [Your ESP32 Port]**
3. Click **Upload** button (or press Ctrl+U)
4. Wait for "Done uploading" message

### 6. Verify Installation

1. Open Serial Monitor: **Tools > Serial Monitor**
2. Set baud rate to **115200**
3. You should see:
   ```
   Starting SHEild-X ESP32...
   BLE device is now advertising as: SHEild-ESP32
   Waiting for connection...
   Initializing GSM module...
   Setup complete!
   ```

## GSM Module Setup

### SIM800L Configuration

1. **Insert SIM Card**: Make sure SIM card is inserted and has active plan
2. **Power Supply**: GSM modules need stable 5V power (may need external supply)
3. **Antenna**: Connect GSM antenna for better signal
4. **AT Commands**: The code automatically initializes the GSM module

### Testing GSM Module

You can test GSM module manually via Serial Monitor:

1. Open Serial Monitor
2. Type AT commands:
   - `AT` - Should return "OK"
   - `AT+CPIN?` - Check SIM card status
   - `AT+CREG?` - Check network registration
   - `AT+CMGF=1` - Set SMS text mode
   - `AT+CMGS="+1234567890"` - Send test SMS (replace with your number)

## Testing the Connection

### 1. Web App Connection

1. Open the SHEild-X web app in Chrome/Edge/Opera
2. Navigate to **Bluetooth Scanner** page
3. Click **"Scan for ESP32 Devices"**
4. You should see "SHEild-ESP32" in the device picker
5. Select it and click **Connect**

### 2. Test Commands

Once connected, test from the Dashboard:

- **Single Press**: Should log activity
- **Double Press (SOS)**: Should trigger SOS countdown, LED should turn on
- **Triple Press**: Should cancel SOS, LED should turn off
- **Police Alert**: Should send SMS immediately

### 3. Monitor Serial Output

Keep Serial Monitor open to see:
- BLE connection status
- Received commands
- GSM module responses
- Status updates

## Troubleshooting

### ESP32 Not Found in Bluetooth Scanner

**Problem**: Device doesn't appear in browser device picker

**Solutions**:
- Check Serial Monitor - device should be advertising
- Make sure device name contains "SHEild" or "ESP32"
- Try resetting ESP32
- Check if Bluetooth is enabled on your computer
- Make sure no other device is connected to ESP32

### Connection Fails

**Problem**: Connection fails when clicking Connect

**Solutions**:
- Check Serial Monitor for error messages
- Verify BLE service UUID matches exactly: `0000ff00-0000-1000-8000-00805f9b34fb`
- Make sure all three characteristics are created
- Try disconnecting and reconnecting
- Restart ESP32

### Commands Not Working

**Problem**: Buttons in web app don't trigger actions

**Solutions**:
- Check Serial Monitor - you should see "Received command: 0x..."
- Verify command codes match the web app
- Check characteristic permissions (Command should be Write)
- Ensure device is actually connected (check status indicator)

### SMS Not Sending

**Problem**: SMS messages not being sent

**Solutions**:
- Check SIM card is inserted and has credit
- Verify GSM module is powered (check LED on SIM800L)
- Check antenna is connected
- Monitor Serial Monitor for GSM responses
- Test GSM module manually with AT commands
- Verify phone number format (include country code, e.g., +1234567890)
- Check network signal strength

### GSM Module Not Responding

**Problem**: GSM initialization fails

**Solutions**:
- Check power supply (GSM needs stable 5V, may need external supply)
- Verify wiring (TX/RX may need to be swapped)
- Check baud rate (default is 9600)
- Try power cycling GSM module
- Test with AT commands manually

### LED Not Working

**Problem**: LED doesn't turn on/off

**Solutions**:
- Check LED is connected to correct GPIO pin (default: GPIO 2)
- Verify LED polarity (anode to GPIO, cathode to GND via resistor)
- Check if GPIO pin is correct in code
- Test LED directly with 3.3V

### Battery Level Not Updating

**Problem**: Battery shows incorrect or static value

**Solutions**:
- If using battery monitoring: check voltage divider circuit
- Verify ADC pin is correct (default: GPIO 34)
- Adjust battery calculation formula in `updateBatteryLevel()`
- If not using battery monitoring: this is normal - it simulates drain

## Advanced Configuration

### Change Device Name

Edit in code:
```cpp
#define DEVICE_NAME "SHEild-ESP32"
```

### Change Pin Assignments

Edit pin definitions:
```cpp
#define LED_PIN 2
#define GSM_RX_PIN 16
#define GSM_TX_PIN 17
```

### Adjust SOS Countdown

Change countdown time:
```cpp
const unsigned long SOS_COUNTDOWN_MS = 10000; // 10 seconds
```

### Customize SMS Messages

Edit message strings in:
- `handleTriggerPolice()` - Police alert message
- `handleSendSMS()` - SOS alert message (in main loop)

## Next Steps

1. **Test all features** from the web app
2. **Customize messages** for your use case
3. **Add physical button** for hardware SOS trigger
4. **Implement GPS** for location in SMS messages
5. **Add battery monitoring circuit** for accurate battery readings

## Support

If you encounter issues:
1. Check Serial Monitor output
2. Verify all connections
3. Test components individually (BLE, GSM, LED)
4. Review the ESP32_FIRMWARE_GUIDE.md for protocol details

