#include <Arduino.h>
#include "network/wifi_manager.h"
#include "api/api_client.h"

void setup() {
  Serial.begin(115200);
  initWiFi();
}

void loop() {
  SensorData data;
  data.temperatura = random(20, 35);
  data.umidade = random(40, 80);

  sendDataToAPI(data);

  SystemStatus status = getStatusFromAPI();

  Serial.print("Irrigacao: ");
  Serial.println(status.irrigacao);

  Serial.print("Ventilacao: ");
  Serial.println(status.ventilacao);

  delay(5000);
}