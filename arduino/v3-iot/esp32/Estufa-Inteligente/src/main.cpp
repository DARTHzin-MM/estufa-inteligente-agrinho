#include <Arduino.h>
#include "network/wifi_manager.h"
#include "sensors/sensors.h"
#include "api/api_client.h"

void setup() {
  Serial.begin(115200);

  initWiFi();
  initSensors();
}

void loop() {
  SensorData data = readSensors();

  Serial.println("---- SENSORES ----");
  Serial.print("Temp: "); Serial.println(data.temperatura);
  Serial.print("Umidade: "); Serial.println(data.umidade_ar);
  Serial.print("Luz: "); Serial.println(data.luminosidade);
  Serial.print("Solo 1: "); Serial.println(data.umidade_solo_1);
  Serial.print("Solo 2: "); Serial.println(data.umidade_solo_2);

  sendDataToAPI(data);

  SystemStatus status = getStatusFromAPI();

  Serial.println("---- STATUS ----");
  Serial.print("Cooler: "); Serial.println(status.cooler);
  Serial.print("Water Pump: "); Serial.println(status.water_pump);
  Serial.print("Nutr Pump: "); Serial.println(status.nutr_pump);

  delay(5000);
}