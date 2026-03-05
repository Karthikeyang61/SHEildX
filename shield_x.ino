#include <SoftwareSerial.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

#define BUTTON_PIN 4
#define LED_PIN 2
#define SIM800_RX 16
#define SIM800_TX 27

SoftwareSerial sim800(SIM800_RX, SIM800_TX);

unsigned long lastPressTime = 0;
int pressCount = 0;
bool sosTriggered = false;
bool policeAlertTriggered = false;

BLECharacteristic *pCharacteristic;

void sendSOS() {
  Serial.println("Sending SOS via GSM...");
  sim800.println("AT+CMGF=1");
  delay(1000);
  sim800.println("AT+CMGS=\"+919363043166\"");
  delay(1000);
  sim800.print("SOS Alert! I am in danger.");
  delay(500);
  sim800.write(26);
  Serial.println("SOS Sent via GSM!");
}

void sendLocationOverBLE() {
  String location = "Lat:12.9716, Lon:77.5946";
  pCharacteristic->setValue(location.c_str());
  pCharacteristic->notify();
  Serial.println("Location sent via BLE.");
}

class SOSCommandCallback : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) override {
    String command = pCharacteristic->getValue().c_str();

    Serial.print("BLE Command Received: ");
    Serial.println(command);

    if (command == "SOS") {
      Serial.println("BLE SOS Triggered!");
      sendSOS();
    } else if (command == "CANCEL") {
      Serial.println("BLE SOS Cancelled.");
    } else if (command == "LOCATION") {
      sendLocationOverBLE();
    }
  }
};

void setup() {
  Serial.begin(115200);
  sim800.begin(9600);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  BLEDevice::init("SHEildX");
  BLEServer *pServer = BLEDevice::createServer();
  BLEService *pService = pServer->createService(BLEUUID((uint16_t)0x180F));

  pCharacteristic = pService->createCharacteristic(
    BLEUUID((uint16_t)0x2A19),
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_WRITE |
    BLECharacteristic::PROPERTY_NOTIFY
  );

  pCharacteristic->setCallbacks(new SOSCommandCallback());
  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->start();

  Serial.println("SHEild X Ready with BLE + GSM");
}

void loop() {
  static bool inFirstWindow = false;
  static bool inSecondWindow = false;

  if (digitalRead(BUTTON_PIN) == LOW) {
    delay(50);
    if (digitalRead(BUTTON_PIN) == LOW) {
      pressCount++;
      Serial.print("Button Pressed (Count: ");
      Serial.print(pressCount);
      Serial.println(")");
      lastPressTime = millis();
      while (digitalRead(BUTTON_PIN) == LOW);
    }
  }

  if (!inFirstWindow && pressCount == 2) {
    Serial.println("Double press detected. Starting 10s cancel window.");
    inFirstWindow = true;
    unsigned long start = millis();
    pressCount = 0;

    while (millis() - start < 10000) {
      if (digitalRead(BUTTON_PIN) == LOW) {
        delay(50);
        if (digitalRead(BUTTON_PIN) == LOW) {
          pressCount++;
          Serial.print("Cancel Window Button Press (Count: ");
          Serial.print(pressCount);
          Serial.println(")");
          while (digitalRead(BUTTON_PIN) == LOW);
        }
      }

      if (pressCount >= 3) {
        Serial.println("Triple press detected in first window. SOS Cancelled.");
        digitalWrite(LED_PIN, HIGH);
        delay(2000);
        digitalWrite(LED_PIN, LOW);
        inFirstWindow = false;
        pressCount = 0;
        return;
      }
    }

    Serial.println("SOS Triggered! Sending alert...");
    digitalWrite(LED_PIN, HIGH);
    delay(2000);
    digitalWrite(LED_PIN, LOW);

    sendSOS();
    sosTriggered = true;
    inFirstWindow = false;
    inSecondWindow = true;
    pressCount = 0;
  }

  if (inSecondWindow) {
    Serial.println("Second cancel window started (30s).");
    unsigned long secondStart = millis();
    pressCount = 0;

    while (millis() - secondStart < 30000) {
      if (digitalRead(BUTTON_PIN) == LOW) {
        delay(50);
        if (digitalRead(BUTTON_PIN) == LOW) {
          pressCount++;
          Serial.print("Cancel Window Button Press (Count: ");
          Serial.print(pressCount);
          Serial.println(")");
          while (digitalRead(BUTTON_PIN) == LOW);
        }
      }

      if (pressCount >= 3) {
        Serial.println("Triple press detected in second window. Police Alert Cancelled.");
        digitalWrite(LED_PIN, HIGH);
        delay(2000);
        digitalWrite(LED_PIN, LOW);
        inSecondWindow = false;
        pressCount = 0;
        return;
      }
    }

    Serial.println("Police Alert Sent!");
    digitalWrite(LED_PIN, HIGH);
    delay(2000);
    digitalWrite(LED_PIN, LOW);
    inSecondWindow = false;
    policeAlertTriggered = true;
    pressCount = 0;
  }
}
