# Button Testing Guide

Complete guide to test the physical button functionality on ESP32.

## Hardware Setup

### Button Connection

Connect a push button to ESP32:

```
ESP32          Push Button
------         -----------
GPIO 0   <----  One terminal
GND      <----  Other terminal (via button)

Note: ESP32 has internal pull-up resistor, so button connects to GND when pressed.
```

**Default Button Pin**: GPIO 0 (BOOT button on most ESP32 boards)

You can change the button pin in the code:
```cpp
#define BUTTON_PIN 0  // Change this to your desired GPIO pin
```

### Using the BOOT Button

Most ESP32 development boards have a BOOT button on GPIO 0. You can use this button directly without any additional wiring!

## How It Works

### Single Press (Trigger SOS)
1. Press button once
2. ESP32 detects single press after 500ms (double press window expires)
3. Triggers SOS alert
4. LED turns on
5. 10-second countdown starts
6. Notification sent to web app
7. SMS sent after countdown (if not cancelled)

### Double Press (Cancel SOS)
1. Press button twice within 500ms
2. ESP32 detects double press immediately
3. Cancels SOS alert
4. LED turns off
5. Notification sent to web app

## Testing Steps

### 1. Upload Code
1. Open `ESP32_Arduino_Code.ino` in Arduino IDE
2. Upload to ESP32
3. Open Serial Monitor (115200 baud)

### 2. Connect from Web App
1. Open web app in Chrome/Edge/Opera
2. Go to **Bluetooth Scanner**
3. Click **"Scan for ESP32 Devices"**
4. Select your ESP32 device
5. Click **Connect**
6. Navigate to **Dashboard**

### 3. Test Single Press

**Expected Behavior:**
- Press button once
- Serial Monitor shows: `=== SINGLE PRESS DETECTED - Triggering SOS ===`
- LED on ESP32 turns ON
- Web app Dashboard shows SOS alert panel
- 10-second countdown starts
- Activity log shows: `🔘 Physical button pressed - Triggering SOS`

**Verify:**
- ✅ LED is ON
- ✅ SOS panel appears in web app
- ✅ Countdown timer is running
- ✅ Activity log shows button press

### 4. Test Double Press (Cancel)

**Expected Behavior:**
- While SOS is active, press button twice quickly (within 500ms)
- Serial Monitor shows: `=== DOUBLE PRESS DETECTED - Cancelling SOS ===`
- LED on ESP32 turns OFF
- SOS alert disappears from web app
- Activity log shows: `🔘🔘 Physical button double pressed - Cancelling SOS`

**Verify:**
- ✅ LED is OFF
- ✅ SOS panel disappears
- ✅ Countdown stops
- ✅ Activity log shows cancellation

### 5. Test Complete SOS Flow

1. Press button once → SOS starts
2. Wait 10 seconds → SMS should be sent (if GSM is configured)
3. LED turns off automatically after SMS sent

OR

1. Press button once → SOS starts
2. Press button twice quickly → SOS cancelled
3. LED turns off immediately

## Serial Monitor Output

When testing, you should see:

```
=== SINGLE PRESS DETECTED - Triggering SOS ===
SOS Triggered
Button event sent: SINGLE PRESS
Status sent - Battery: 100%, GSM: ON, LED: ON, BLE: ON

=== DOUBLE PRESS DETECTED - Cancelling SOS ===
SOS Cancelled
Button event sent: DOUBLE PRESS
Status sent - Battery: 100%, GSM: ON, LED: OFF, BLE: ON
```

## Troubleshooting

### Button Not Responding

**Problem**: Pressing button doesn't trigger anything

**Solutions**:
- Check button is connected to correct GPIO pin (default: GPIO 0)
- Verify button connects to GND when pressed
- Check Serial Monitor for button state changes
- Try using BOOT button if available
- Test button with simple LED blink code first

### Single Press Not Detected

**Problem**: Button press doesn't trigger SOS

**Solutions**:
- Wait at least 500ms after pressing (double press window)
- Check Serial Monitor for "SINGLE PRESS DETECTED" message
- Verify BLE connection is active
- Check if web app is connected

### Double Press Not Working

**Problem**: Double press doesn't cancel SOS

**Solutions**:
- Press button twice quickly (within 500ms)
- Make sure first press was registered (check Serial Monitor)
- Try faster double press
- Adjust `DOUBLE_PRESS_WINDOW_MS` if needed (default: 500ms)

### Web App Not Receiving Button Events

**Problem**: Button works on ESP32 but web app doesn't show alert

**Solutions**:
- Verify BLE connection is active
- Check browser console for errors
- Ensure Data characteristic supports notifications
- Try reconnecting to device
- Check activity log in web app

### LED Not Turning On/Off

**Problem**: Button triggers but LED doesn't change

**Solutions**:
- Check LED is connected to GPIO 2 (or configured pin)
- Verify LED wiring (anode to GPIO, cathode to GND via resistor)
- Check LED pin definition in code
- Test LED directly with `setLED(true)` in code

## Adjusting Button Settings

### Change Button Pin

Edit in code:
```cpp
#define BUTTON_PIN 0  // Change to your GPIO pin
```

### Adjust Debounce Time

Edit in code:
```cpp
#define BUTTON_DEBOUNCE_MS 50  // Increase if button is bouncy
```

### Adjust Double Press Window

Edit in code:
```cpp
#define DOUBLE_PRESS_WINDOW_MS 500  // Time window for double press (milliseconds)
```

## Advanced: Custom Button Actions

You can modify button behavior in `handleButtonPress()` function:

```cpp
// Example: Add triple press
if (pressCount == 3) {
  // Handle triple press
  handleTriggerPolice();
}
```

## Testing Checklist

- [ ] Button connected correctly
- [ ] Code uploaded to ESP32
- [ ] Serial Monitor open and showing output
- [ ] Web app connected to ESP32
- [ ] Single press triggers SOS
- [ ] LED turns on with single press
- [ ] Web app shows SOS alert
- [ ] Double press cancels SOS
- [ ] LED turns off with double press
- [ ] Activity log shows button events
- [ ] SMS sent after countdown (if GSM configured)

## Quick Test Commands

### Test Button State
Add this to `loop()` to see button state:
```cpp
Serial.print("Button state: ");
Serial.println(digitalRead(BUTTON_PIN));
```

### Test Button Press Detection
The code already includes Serial output for button events. Just watch Serial Monitor!

## Next Steps

1. **Test all scenarios** (single, double, SOS countdown, cancellation)
2. **Verify SMS sending** works after countdown
3. **Test with physical device** in real-world conditions
4. **Adjust timing** if needed for your use case
5. **Add more button features** (triple press, long press, etc.)

