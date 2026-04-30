#include <Arduino.h>
#include "network/wifi_manager.h"
#include "sensors/sensors.h"
#include "api/api_client.h"
#include "actuators/actuators.h"

void setup() {
  Serial.begin(115200);

  initWiFi();
  initSensors();
  initActuators();
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

  applyStatus(status);

  Serial.println("---- ATUADORES ----");
  Serial.print("Cooler: "); Serial.println(status.cooler ? "True" : "False");
  Serial.print("Water Pump: "); Serial.println(status.water_pump ? "True" : "False");
  Serial.print("Nutr Pump: "); Serial.println(status.nutr_pump ? "True" : "False");

  delay(5000);
}