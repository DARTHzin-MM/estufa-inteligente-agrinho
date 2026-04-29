#include <Arduino.h>
#include "network/wifi_manager.h"
#include "api/api_client.h"
#include "sensors/sensors.h"

void setup() {
  Serial.begin(115200);

  initWiFi();
  initSensors();
}

void loop() {
  SensorData data = readSensors();

  Serial.print("Temp: ");
  Serial.println(data.temperatura);

  Serial.print("Umidade: ");
  Serial.println(data.umidade);

  sendDataToAPI(data);

  SystemStatus status = getStatusFromAPI();

  Serial.print("Irrigacao: ");
  Serial.println(status.irrigacao ? "True" : "False");

  Serial.print("Ventilacao: ");
  Serial.println(status.ventilacao ? "True" : "False");

  delay(5000);
}