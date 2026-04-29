#include <Arduino.h>
#include "network/wifi_manager.h"

void setup() {
  Serial.begin(115200);

  initWiFi();
}

void loop() {
  // vazio por enquanto
}