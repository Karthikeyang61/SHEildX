# Troubleshooting Guide

Common issues and solutions for SHEild-X ESP32 system.

## Battery Shows 0%

### Problem
Battery level always shows 0% in status updates.

### Solutions

**If you have battery monitoring circuit:**
1. Check ADC pin connection (default: GPIO 34)
2. Verify voltage divider circuit is correct
3. Check ADC pin definition in code matches your hardware
4. Test ADC reading directly:
   ```cpp
   int adcValue = analogRead(34);
   Serial.print("ADC Value: ");
   Serial.println(adcValue);
   ```

**If you DON'T have battery monitoring:**
- This is normal! The code will simulate battery level starting at 87%
- Battery will decrease by 1% every minute (down to 20% minimum)
- To use real battery monitoring, connect a voltage divider to GPIO 34

**Quick Fix:**
The code now initializes battery to 87% if no ADC is connected. You should see:
```
Battery monitoring: Using simulated battery (no ADC connected)
Battery level updated: 87%
```

## GSM Shows OFF

### Problem
GSM status always shows OFF, SMS not working.

### Solutions

1. **Check GSM Module Connection**
   - Verify TX/RX pins are correct (default: GPIO 16/17)
   - Check power supply (GSM modules need stable 5V)
   - Ensure antenna is connected

2. **Check SIM Card**
   - SIM card is inserted correctly
   - SIM card has active plan and credit
   - SIM card is not locked with PIN

3. **Check Serial Monitor**
   - Look for "GSM module initialized successfully" message
   - Check for AT command responses
   - Verify baud rate is 9600

4. **Test GSM Manually**
   Add this test code to `setup()`:
   ```cpp
   // Test GSM
   gsmSerial.begin(9600);
   delay(2000);
   gsmSerial.println("AT");
   delay(1000);
   if (gsmSerial.available()) {
     Serial.println(gsmSerial.readString());
   }
   ```

5. **Common Issues:**
   - **No response**: Check wiring, power supply
   - **ERROR response**: Check SIM card, network signal
   - **Timeout**: Increase delay, check baud rate

**Note**: The system will continue to work without GSM - only SMS features will be unavailable.

## Status Updates Not Working

### Problem
Status updates not being sent or received.

### Check:
1. BLE connection is active (deviceConnected = true)
2. Status characteristic has NOTIFY property
3. Web app is subscribed to notifications
4. Serial Monitor shows "STATUS ->" messages

### Debug:
Add this to see status updates:
```cpp
Serial.println("Sending status update...");
sendStatusUpdate();
```

## Commands Not Working

### Problem
Commands from web app not being received.

### Check:
1. Serial Monitor shows "BLE: received cmd 0x..."
2. Command characteristic has WRITE property
3. Web app is sending commands correctly
4. BLE connection is stable

### Debug Commands:
- `0x01` = GET_STATUS
- `0x02` = TRIGGER_SOS
- `0x03` = CANCEL_SOS
- `0x04` = TRIGGER_POLICE
- `0x05` = SET_EMERGENCY_CONTACT
- `0x06` = SET_LED
- `0x07` = GET_BATTERY
- `0x08` = SEND_SMS

## Button Not Working

### Problem
Physical button doesn't trigger SOS.

### Solutions:
1. Check button is connected to GPIO 0 (or configured pin)
2. Verify button connects to GND when pressed
3. Check Serial Monitor for "SINGLE PRESS DETECTED" message
4. Test button state:
   ```cpp
   Serial.print("Button: ");
   Serial.println(digitalRead(BUTTON_PIN));
   ```

## LED Not Working

### Problem
LED doesn't turn on/off.

### Solutions:
1. Check LED is connected to GPIO 2 (or configured pin)
2. Verify LED polarity (anode to GPIO, cathode to GND via resistor)
3. Test LED directly:
   ```cpp
   digitalWrite(LED_PIN, HIGH); // Should turn on
   delay(1000);
   digitalWrite(LED_PIN, LOW);  // Should turn off
   ```

## BLE Connection Issues

### Problem
Can't connect from web app.

### Solutions:
1. **Device not found:**
   - Check device name contains "SHEild" or "ESP32"
   - Verify BLE is advertising (Serial Monitor shows "advertising")
   - Reset ESP32

2. **Connection fails:**
   - Check service UUID matches exactly
   - Verify all characteristics are created
   - Check Serial Monitor for errors
   - Try disconnecting and reconnecting

3. **Connection drops:**
   - Check power supply is stable
   - Verify no interference
   - Increase BLE connection interval if needed

## Serial Monitor Output Guide

### Normal Operation:
```
Starting SHEild-X ESP32...
Button initialized on GPIO 0
BLE device is now advertising as: SHEild-ESP32
GSM module initialized successfully
Setup complete!
Device connected
BLE: received cmd 0x1
STATUS -> Battery: 87% GSM: ON LED: OFF BLE: ON
```

### Battery Issues:
```
Battery monitoring: Using simulated battery (no ADC connected)
Battery level updated: 87%
```

### GSM Issues:
```
GSM module initialization failed - continuing without GSM
  (SMS features will not work, but other features are available)
```

### Button Events:
```
=== SINGLE PRESS DETECTED - Triggering SOS ===
=== DOUBLE PRESS DETECTED - Cancelling SOS ===
```

## Quick Diagnostic Commands

Add these to your code for debugging:

```cpp
// Check all pins
void diagnosticCheck() {
  Serial.println("=== DIAGNOSTIC CHECK ===");
  Serial.print("Button: ");
  Serial.println(digitalRead(BUTTON_PIN));
  Serial.print("LED: ");
  Serial.println(digitalRead(LED_PIN));
  Serial.print("Battery: ");
  Serial.println(batteryLevel);
  Serial.print("GSM Active: ");
  Serial.println(gsmActive);
  Serial.print("BLE Connected: ");
  Serial.println(deviceConnected);
  Serial.println("======================");
}
```

Call `diagnosticCheck()` in `loop()` to see current state.

## Still Having Issues?

1. **Check Serial Monitor** - Most issues show error messages
2. **Verify Hardware** - Double-check all connections
3. **Test Components** - Test each component individually
4. **Review Code** - Make sure pin definitions match your hardware
5. **Check Power** - Ensure stable power supply

## Common Fixes

### Battery Always 0%:
- Code now initializes to 87% if no ADC
- Check if you see "Using simulated battery" message

### GSM Always OFF:
- Check Serial Monitor for initialization messages
- Verify GSM module is powered and connected
- System works without GSM (just no SMS)

### Status Updates Frequent:
- This is normal - web app requests status every 10 seconds
- Commands 0x1 and 0x7 are GET_STATUS and GET_BATTERY

