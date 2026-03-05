# Button Debugging Guide

## Quick Test Steps

1. **Upload the updated code** to ESP32
2. **Open Serial Monitor** (115200 baud)
3. **Look for initialization message:**
   ```
   ========================================
   BUTTON INITIALIZATION
   ========================================
   Button Pin: GPIO 0
   Initial State: HIGH (RELEASED)
   ...
   ========================================
   ```

4. **Press the button** and watch Serial Monitor

## Expected Serial Monitor Output

### When Button is Pressed Once:
```
Button PRESSED at [timestamp]
Button press detected - waiting for potential double press...
Button RELEASED
=== SINGLE PRESS CONFIRMED - Triggering SOS ===
SOS Triggered
✓ Button event sent to web app: SINGLE PRESS (SOS)
STATUS -> Battery: 87% GSM: OFF LED: ON BLE: ON
```

### When Button is Pressed Twice Quickly:
```
Button PRESSED at [timestamp]
Button press detected - waiting for potential double press...
Button RELEASED
Button PRESSED at [timestamp]
=== DOUBLE PRESS DETECTED - Cancelling SOS ===
SOS Cancelled
✓ Button event sent to web app: DOUBLE PRESS (CANCEL)
STATUS -> Battery: 87% GSM: OFF LED: OFF BLE: ON
```

## Troubleshooting

### Button Not Detected

**Check Serial Monitor for:**
- `[DEBUG] Button state: HIGH (not pressed)` or `LOW (pressed)`
- If state doesn't change when pressing, check wiring

**Solutions:**
1. Verify button is connected to GPIO 0 (or your configured pin)
2. Check button connects to GND when pressed
3. Try using BOOT button (GPIO 0) directly
4. Test with multimeter - button should show continuity when pressed

### Button Pressed But No SOS

**Check Serial Monitor for:**
- `Button PRESSED` message appears
- `Button event sent to web app` message
- `[DEBUG] BLE Connected: YES`
- `[DEBUG] Data Char available: YES`

**If button is detected but SOS doesn't trigger:**
1. Check web app is connected (BLE Connected: YES)
2. Check browser console for button event messages
3. Verify Data characteristic notifications are enabled
4. Try reconnecting from web app

### Web App Not Receiving Button Events

**Check Browser Console (F12):**
- Look for "Button event received" messages
- Check for any errors

**Solutions:**
1. Verify BLE connection is active
2. Check Data characteristic supports notifications
3. Try disconnecting and reconnecting
4. Check browser console for errors

## Manual Button Test

Add this to `loop()` to test button directly:

```cpp
// Test button - remove after debugging
static int lastTestState = HIGH;
int currentTestState = digitalRead(BUTTON_PIN);
if (currentTestState != lastTestState) {
  Serial.print("BUTTON STATE CHANGED: ");
  Serial.println(currentTestState == HIGH ? "RELEASED" : "PRESSED");
  lastTestState = currentTestState;
}
```

## Common Issues

### Issue: Button always shows pressed
- **Cause**: Button might be stuck or wiring issue
- **Fix**: Check button physically, verify wiring

### Issue: Button works but web app doesn't respond
- **Cause**: BLE notification not working
- **Fix**: Check Data characteristic has NOTIFY property, verify connection

### Issue: Double press not detected
- **Cause**: Pressing too slowly
- **Fix**: Press button twice within 500ms (adjust DOUBLE_PRESS_WINDOW_MS if needed)

### Issue: Single press triggers immediately (no delay)
- **Cause**: This is correct behavior - waits 500ms for potential double press
- **Fix**: This is by design - single press waits 500ms before triggering

## Testing Checklist

- [ ] Button initialization message appears
- [ ] Button state changes when pressed (Serial Monitor)
- [ ] "Button PRESSED" message appears
- [ ] "Button event sent" message appears
- [ ] Web app shows SOS alert (single press)
- [ ] Web app cancels SOS (double press)
- [ ] Browser console shows button events
- [ ] Activity log shows button press messages

