#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID           "7b1f0001-6a9b-4d5c-a7e1-3d9b8c5f0001"
#define STATE_CHARACTERISTIC   "7b1f0002-6a9b-4d5c-a7e1-3d9b8c5f0001"
#define COMMAND_CHARACTERISTIC "7b1f0003-6a9b-4d5c-a7e1-3d9b8c5f0001"
#define TELEMETRY_CHARACTERISTIC "7b1f0004-6a9b-4d5c-a7e1-3d9b8c5f0001"

#define DEVICE_NAME "WhyWait Companion"
#define BUTTON_PIN 0
#define VIBRATION_PIN 25
#define STATUS_LED_PIN 26
#define LONG_PRESS_MS 1200

BLECharacteristic *telemetryCharacteristic = nullptr;
bool deviceConnected = false;
bool buttonDown = false;
bool longPressSent = false;
unsigned long buttonPressedAt = 0;
String currentState = "idle";

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) {
    deviceConnected = true;
    pulseFeedback(1, 80);
  }

  void onDisconnect(BLEServer *server) {
    deviceConnected = false;
    BLEDevice::startAdvertising();
  }
};

class StateCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) {
    String value = String(characteristic->getValue().c_str());
    currentState = extractJsonString(value, "state");

    if (currentState == "prompted") {
      pulseFeedback(2, 90);
    } else if (currentState == "focusing") {
      digitalWrite(STATUS_LED_PIN, HIGH);
    } else if (currentState == "rescued") {
      pulseFeedback(3, 60);
    } else if (currentState == "completed") {
      pulseFeedback(4, 70);
      digitalWrite(STATUS_LED_PIN, LOW);
    } else {
      digitalWrite(STATUS_LED_PIN, LOW);
    }
  }
};

void setup() {
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(VIBRATION_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(VIBRATION_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);

  BLEDevice::init(DEVICE_NAME);
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  BLEService *service = server->createService(SERVICE_UUID);

  BLECharacteristic *stateCharacteristic = service->createCharacteristic(
    STATE_CHARACTERISTIC,
    BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
  );
  stateCharacteristic->setCallbacks(new StateCallbacks());

  BLECharacteristic *commandCharacteristic = service->createCharacteristic(
    COMMAND_CHARACTERISTIC,
    BLECharacteristic::PROPERTY_WRITE
  );

  telemetryCharacteristic = service->createCharacteristic(
    TELEMETRY_CHARACTERISTIC,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  telemetryCharacteristic->addDescriptor(new BLE2902());

  service->start();
  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  BLEDevice::startAdvertising();
}

void loop() {
  const bool pressed = digitalRead(BUTTON_PIN) == LOW;
  const unsigned long now = millis();

  if (pressed && !buttonDown) {
    buttonDown = true;
    longPressSent = false;
    buttonPressedAt = now;
  }

  if (pressed && buttonDown && !longPressSent && now - buttonPressedAt >= LONG_PRESS_MS) {
    longPressSent = true;
    sendEvent("long-press");
    pulseFeedback(3, 80);
  }

  if (!pressed && buttonDown) {
    buttonDown = false;
    if (!longPressSent) {
      sendEvent("tap");
      pulseFeedback(1, 60);
    }
  }

  delay(10);
}

void sendEvent(const char *eventName) {
  if (!deviceConnected || telemetryCharacteristic == nullptr) return;
  String payload = "{\"type\":\"event\",\"event\":\"";
  payload += eventName;
  payload += "\",\"at\":";
  payload += String(millis());
  payload += "}";
  telemetryCharacteristic->setValue(payload.c_str());
  telemetryCharacteristic->notify();
}

void pulseFeedback(int count, int durationMs) {
  for (int index = 0; index < count; index += 1) {
    digitalWrite(VIBRATION_PIN, HIGH);
    delay(durationMs);
    digitalWrite(VIBRATION_PIN, LOW);
    if (index < count - 1) delay(70);
  }
}

String extractJsonString(const String &json, const String &key) {
  const String token = "\"" + key + "\":\"";
  const int start = json.indexOf(token);
  if (start < 0) return "idle";
  const int valueStart = start + token.length();
  const int end = json.indexOf("\"", valueStart);
  if (end < 0) return "idle";
  return json.substring(valueStart, end);
}
