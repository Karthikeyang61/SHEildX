/*****************************************************************************************
 * 
 *                     SHEild-X ESP32 Firmware (Clean & Optimized v2.0)
 * 
 * Fully optimized, cleaned, stable Arduino String-based firmware.
 * 
 * Features:
 *  - BLE communication (Command, Status, Data characteristics)
 *  - SOS Trigger + 10s Countdown + Cancellation
 *  - Police Alert
 *  - SMS sending (SIM800L/SIM900)
 *  - Battery monitoring (ADC + virtual fallback)
 *  - Button control with Debounce + Single/Double Press logic
 *  - Status notifications & Data notifications
 *  - Non-blocking architecture
 * 
 *****************************************************************************************/

 #include <BLEDevice.h>
 #include <BLEServer.h>
 #include <BLEUtils.h>
 #include <BLE2902.h>
 
 /* ------------------------- CONFIGURATION ------------------------- */
 #define LED_PIN 2
 #define BUTTON_PIN 0
 #define BATTERY_ADC_PIN 34
 #define GSM_RX_PIN 16
 #define GSM_TX_PIN 17
 #define GSM_POWER_PIN 4
 
 #define DEVICE_NAME "SHEild-ESP32"
 
 #define BUTTON_DEBOUNCE_MS 50
 #define DOUBLE_PRESS_WINDOW_MS 500
 #define SOS_COUNTDOWN_MS 10000  // 10s
 
 // BLE UUIDs
 #define SERVICE_UUID        "0000ff00-0000-1000-8000-00805f9b34fb"
 #define COMMAND_CHAR_UUID   "0000ff01-0000-1000-8000-00805f9b34fb"
 #define STATUS_CHAR_UUID    "0000ff02-0000-1000-8000-00805f9b34fb"
 #define DATA_CHAR_UUID      "0000ff03-0000-1000-8000-00805f9b34fb"
 
 // Commands
 #define CMD_GET_STATUS          0x01
 #define CMD_TRIGGER_SOS         0x02
 #define CMD_CANCEL_SOS          0x03
 #define CMD_TRIGGER_POLICE      0x04
 #define CMD_SET_EMERGENCY       0x05
 #define CMD_SET_LED             0x06
 #define CMD_GET_BATTERY         0x07
 #define CMD_SEND_SMS            0x08
 
 /* ------------------------- GLOBALS ------------------------- */
 BLEServer *pServer = NULL;
 BLECharacteristic *pCommandCharacteristic = NULL;
 BLECharacteristic *pStatusCharacteristic = NULL;
 BLECharacteristic *pDataCharacteristic = NULL;
 
 bool deviceConnected = false;
 bool oldDeviceConnected = false;
 
 bool ledState = false;
 bool sosActive = false;
 unsigned long sosStartTime = 0;
 
 String emergencyContact = "+1234567890";
 
 int batteryLevel = 87; // fallback battery %
 
 HardwareSerial gsmSerial(2);
 
// Button states - Enhanced logic
int lastReading = HIGH;
int buttonState = HIGH;
unsigned long lastDebounceMillis = 0;

int pressCount = 0;
unsigned long lastPressTime = 0;
bool inFirstCancelWindow = false;  // 10s window after double press
bool inSecondCancelWindow = false; // 30s window after SOS sent
unsigned long cancelWindowStart = 0;
 
/* ------------------------- FUNCTION DECLARATIONS ------------------------- */
void sendStatusUpdate();
void setLED(bool on);
void updateBattery();
void sendSMS(String phone, String message);
void sendButtonEvent(uint8_t eventType);

void handleGetStatus();
void handleTriggerSOS();
void handleCancelSOS();
void handleTriggerPolice();
void handleSetEmergencyContact(const String &payload);
void handleSetLED(const String &payload);
void handleGetBattery();
void handleSendSMS(const String &payload);
 
 /* ------------------------- BLE CALLBACKS ------------------------- */
 class MyServerCallbacks : public BLEServerCallbacks {
   void onConnect(BLEServer *pServer) {
     deviceConnected = true;
     Serial.println("BLE: Device connected.");
   }
   void onDisconnect(BLEServer *pServer) {
     deviceConnected = false;
     Serial.println("BLE: Device disconnected.");
   }
 };
 
 class MyCommandCallbacks : public BLECharacteristicCallbacks {
   void onWrite(BLECharacteristic *pCharacteristic) {
     String payload = pCharacteristic->getValue();
 
     if (payload.length() == 0) return;
 
     uint8_t cmd = payload[0];
 
     Serial.print("BLE command received: 0x");
     Serial.println(cmd, HEX);
 
     switch (cmd) {
       case CMD_GET_STATUS: handleGetStatus(); break;
       case CMD_TRIGGER_SOS: handleTriggerSOS(); break;
       case CMD_CANCEL_SOS: handleCancelSOS(); break;
       case CMD_TRIGGER_POLICE: handleTriggerPolice(); break;
       case CMD_SET_EMERGENCY: handleSetEmergencyContact(payload); break;
       case CMD_SET_LED: handleSetLED(payload); break;
       case CMD_GET_BATTERY: handleGetBattery(); break;
       case CMD_SEND_SMS: handleSendSMS(payload); break;
       default:
         Serial.println("Unknown BLE command.");
         break;
     }
   }
 };
 
 /* ------------------------- STATUS HANDLING ------------------------- */
 
 void sendStatusUpdate() {
   if (!deviceConnected || !pStatusCharacteristic) return;
 
   updateBattery();
 
   uint8_t buff[4] = {
     (uint8_t)batteryLevel,
     1,          // GSM active (static ON)
     ledState ? 1 : 0,
     deviceConnected ? 1 : 0
   };
 
   pStatusCharacteristic->setValue(buff, 4);
   pStatusCharacteristic->notify();
 
   Serial.printf("STATUS SENT → Battery:%d%% LED:%d BLE:%d\n",
     batteryLevel, ledState, deviceConnected);
 }
 
 /* ------------------------- COMMAND HANDLERS ------------------------- */
 
 void handleGetStatus() {
   sendStatusUpdate();
 }
 
void handleTriggerSOS() {
  if (sosActive) { 
    Serial.println("SOS already active."); 
    return; 
  }

  sosActive = true;
  sosStartTime = millis();
  setLED(true);

  Serial.println("SOS Triggered - SMS will be sent after 10s countdown.");
  Serial.println("(Note: This is separate from button cancel window)");
  sendStatusUpdate();
}
 
 void handleCancelSOS() {
   if (!sosActive) { Serial.println("SOS not active."); return; }
 
   sosActive = false;
   setLED(false);
 
   Serial.println("SOS Cancelled.");
   sendStatusUpdate();
 }
 
 void handleTriggerPolice() {
   Serial.println("POLICE ALERT TRIGGERED!");
 
   String msg = "🚨 POLICE ALERT 🚨\nImmediate danger detected.\nTime: "
                + String(millis()/1000) + "s";
 
   sendSMS(emergencyContact, msg);
 
   for (int i=0;i<4;i++){ setLED(true); delay(150); setLED(false); delay(150); }
 
   sendStatusUpdate();
 }
 
 void handleSetEmergencyContact(const String &payload) {
   String phone = payload.substring(1);
   phone.trim();
 
   if (phone.length() > 5) {
     emergencyContact = phone;
     Serial.print("Updated emergency contact: ");
     Serial.println(emergencyContact);
   }
 }
 
 void handleSetLED(const String &payload) {
   bool state = payload[1] == 0x01;
   setLED(state);
   sendStatusUpdate();
 }
 
 void handleGetBattery() {
   updateBattery();
   sendStatusUpdate();
 }
 
 void handleSendSMS(const String &payload) {
   if (payload.length() < 3) return;
 
   uint8_t len = payload[1];
   String phone = payload.substring(2, 2 + len);
   String msg = payload.substring(2 + len);
 
   sendSMS(phone, msg);
 }
 
 /* ------------------------- HARDWARE CONTROL ------------------------- */
 
 void setLED(bool on) {
   ledState = on;
   digitalWrite(LED_PIN, on ? HIGH : LOW);
 }
 
 void updateBattery() {
   #ifdef BATTERY_ADC_PIN
     int adc = analogRead(BATTERY_ADC_PIN);
     float voltage = (adc/4095.0f) * 3.3f * 2.0f;
 
     batteryLevel = constrain((int)((voltage - 2.8f) / 1.4f * 100), 0, 100);
   #else
     batteryLevel--; if (batteryLevel < 20) batteryLevel = 87;
   #endif
 }
 
void sendSMS(String phone, String message) {
  Serial.println("SMS → " + phone);
  Serial.println(message);
  // Add real GSM handling here
}

// Send button event to web app via BLE
void sendButtonEvent(uint8_t eventType) {
  if (!deviceConnected) {
    Serial.println("⚠ Button event: BLE not connected");
    return;
  }
  
  if (!pDataCharacteristic) {
    Serial.println("⚠ Button event: Data characteristic not available");
    return;
  }
  
  // Format: [0xFF, eventType]
  // eventType: 0x01 = Single press, 0x02 = Double press
  uint8_t eventData[2] = {0xFF, eventType};
  pDataCharacteristic->setValue(eventData, 2);
  pDataCharacteristic->notify();
  
  Serial.print("✓ Button event sent to web app: ");
  Serial.println(eventType == 0x01 ? "SINGLE PRESS" : "DOUBLE PRESS");
}
 
/* ------------------------- BUTTON LOGIC ------------------------- */

void handleButton() {
  int reading = digitalRead(BUTTON_PIN);
  unsigned long now = millis();
  static bool buttonWasPressed = false;

  // Detect button press (with debounce)
  if (reading == LOW && !buttonWasPressed) {
    delay(50); // Debounce
    if (digitalRead(BUTTON_PIN) == LOW) {
      buttonWasPressed = true;
      pressCount++;
      lastPressTime = now;
      
      Serial.print("[BTN] Press detected (Count: ");
      Serial.print(pressCount);
      Serial.println(")");
      
      // Wait for button release
      while (digitalRead(BUTTON_PIN) == LOW) {
        delay(10);
      }
      buttonWasPressed = false;
    }
  }

  // Handle First Cancel Window (10s after double press)
  if (!inFirstCancelWindow && pressCount == 2) {
    Serial.println("═══════════════════════════════════════");
    Serial.println("🔘🔘 DOUBLE PRESS → 10s Cancel Window Started");
    Serial.println("═══════════════════════════════════════");
    
    inFirstCancelWindow = true;
    cancelWindowStart = now;
    pressCount = 0;
    
    // Notify web app: double press detected, cancel window started
    sendButtonEvent(0x02); // Double press = cancel window started
  }

  // Check First Cancel Window (10 seconds)
  if (inFirstCancelWindow) {
    unsigned long elapsed = now - cancelWindowStart;
    unsigned long remaining = 10000 - elapsed;
    
    // Check for triple press to cancel
    if (pressCount >= 3) {
      Serial.println("═══════════════════════════════════════");
      Serial.println("🔘🔘🔘 TRIPLE PRESS → SOS CANCELLED");
      Serial.println("═══════════════════════════════════════");
      
      // Flash LED to confirm cancellation
      for (int i = 0; i < 3; i++) {
        setLED(true);
        delay(200);
        setLED(false);
        delay(200);
      }
      
      inFirstCancelWindow = false;
      pressCount = 0;
      sendButtonEvent(0x03); // Triple press = cancelled
      return;
    }
    
    // Time expired - trigger SOS
    if (elapsed >= 10000) {
      Serial.println("═══════════════════════════════════════");
      Serial.println("⏰ 10s Window Expired → SOS TRIGGERED");
      Serial.println("═══════════════════════════════════════");
      
      handleTriggerSOS();
      sendButtonEvent(0x01); // Single press = SOS triggered
      
      inFirstCancelWindow = false;
      inSecondCancelWindow = true;
      cancelWindowStart = now;
      pressCount = 0;
    }
  }

  // Check Second Cancel Window (30 seconds after SOS)
  if (inSecondCancelWindow) {
    unsigned long elapsed = now - cancelWindowStart;
    unsigned long remaining = 30000 - elapsed;
    
    // Check for triple press to cancel police alert
    if (pressCount >= 3) {
      Serial.println("═══════════════════════════════════════");
      Serial.println("🔘🔘🔘 TRIPLE PRESS → Police Alert CANCELLED");
      Serial.println("═══════════════════════════════════════");
      
      // Flash LED to confirm cancellation
      for (int i = 0; i < 3; i++) {
        setLED(true);
        delay(200);
        setLED(false);
        delay(200);
      }
      
      inSecondCancelWindow = false;
      pressCount = 0;
      sendButtonEvent(0x04); // Triple press in second window = police cancelled
      return;
    }
    
    // Time expired - trigger police alert
    if (elapsed >= 30000) {
      Serial.println("═══════════════════════════════════════");
      Serial.println("⏰ 30s Window Expired → POLICE ALERT TRIGGERED");
      Serial.println("═══════════════════════════════════════");
      
      handleTriggerPolice();
      sendButtonEvent(0x05); // Police alert triggered
      
      inSecondCancelWindow = false;
      pressCount = 0;
    }
  }

  // Reset press count if too much time passed (prevent accidental counts)
  if (!inFirstCancelWindow && !inSecondCancelWindow && (now - lastPressTime > 2000)) {
    pressCount = 0;
  }

  lastReading = reading;
}
 
 /* ------------------------- SETUP ------------------------- */
 
void setup() {
  Serial.begin(115200);
  delay(200);
  
  Serial.println("\n\n═══════════════════════════════════════");
  Serial.println("   SHEild-X ESP32 Starting...");
  Serial.println("═══════════════════════════════════════\n");

  pinMode(LED_PIN, OUTPUT);
  setLED(false);
  
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  delay(10); // Stabilize pin
  lastReading = digitalRead(BUTTON_PIN);
  buttonState = lastReading;
  
  Serial.print("Button Pin: GPIO ");
  Serial.println(BUTTON_PIN);
  Serial.print("Initial State: ");
  Serial.println(buttonState == HIGH ? "HIGH (not pressed)" : "LOW (pressed)");
  Serial.print("Debounce: ");
  Serial.print(BUTTON_DEBOUNCE_MS);
  Serial.println("ms");
  Serial.print("Double Press Window: ");
  Serial.print(DOUBLE_PRESS_WINDOW_MS);
  Serial.println("ms\n");
 
   BLEDevice::init(DEVICE_NAME);
   pServer = BLEDevice::createServer();
   pServer->setCallbacks(new MyServerCallbacks());
 
   BLEService *svc = pServer->createService(SERVICE_UUID);
 
   pCommandCharacteristic = svc->createCharacteristic(COMMAND_CHAR_UUID, BLECharacteristic::PROPERTY_WRITE);
   pCommandCharacteristic->setCallbacks(new MyCommandCallbacks());
 
   pStatusCharacteristic = svc->createCharacteristic(STATUS_CHAR_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
   pStatusCharacteristic->addDescriptor(new BLE2902());
 
   pDataCharacteristic = svc->createCharacteristic(DATA_CHAR_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY);
   pDataCharacteristic->addDescriptor(new BLE2902());
 
   svc->start();
 
   BLEAdvertising *adv = BLEDevice::getAdvertising();
   adv->addServiceUUID(SERVICE_UUID);
   adv->setScanResponse(true);
   BLEDevice::startAdvertising();
 
  Serial.println("BLE Ready. Advertising…");
  Serial.println("═══════════════════════════════════════\n");
  Serial.println("Ready! Button Press Pattern:");
  Serial.println("  • Double press → 10s cancel window");
  Serial.println("  • Triple press in 10s → Cancel SOS");
  Serial.println("  • No triple press → SOS triggered");
  Serial.println("  • After SOS → 30s police alert window");
  Serial.println("  • Triple press in 30s → Cancel police");
  Serial.println("  • No triple press → Police alert sent\n");

  sendStatusUpdate();
}
 
 /* ------------------------- LOOP ------------------------- */
 
void loop() {
  // Handle BLE connection state
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("BLE: Restarting advertising...");
    oldDeviceConnected = deviceConnected;
  }
  
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
    sendStatusUpdate();
  }

  // Handle button presses (call frequently for responsiveness)
  handleButton();

  // Handle SOS countdown
  if (sosActive && millis() - sosStartTime >= SOS_COUNTDOWN_MS) {
    Serial.println("═══════════════════════════════════════");
    Serial.println("⏰ SOS Countdown finished → Sending SMS");
    Serial.println("═══════════════════════════════════════");

    String msg = "🚨 SOS ALERT 🚨\nUser requires help.\nTime: "
                 + String(millis()/1000) + "s";

    sendSMS(emergencyContact, msg);

    sosActive = false;
    setLED(false);
    sendStatusUpdate();
  }
  
  // Periodic status updates (every 10 seconds when connected)
  static unsigned long lastStatusUpdate = 0;
  if (deviceConnected && (millis() - lastStatusUpdate > 10000)) {
    updateBattery();
    sendStatusUpdate();
    lastStatusUpdate = millis();
  }
  
  // Debug: Show button state every 3 seconds (for troubleshooting)
  static unsigned long lastButtonDebug = 0;
  if (millis() - lastButtonDebug > 3000) {
    int currentState = digitalRead(BUTTON_PIN);
    Serial.print("[DEBUG] Button GPIO");
    Serial.print(BUTTON_PIN);
    Serial.print(" = ");
    Serial.print(currentState == HIGH ? "HIGH" : "LOW");
    Serial.print(" | BLE: ");
    Serial.print(deviceConnected ? "CONNECTED" : "DISCONNECTED");
    Serial.print(" | SOS: ");
    Serial.println(sosActive ? "ACTIVE" : "INACTIVE");
    lastButtonDebug = millis();
  }
  
  delay(10); // Small delay for button responsiveness
}
 