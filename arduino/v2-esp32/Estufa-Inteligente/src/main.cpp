#include <Arduino.h>

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("=== TESTE ESP32 ===");
    Serial.println("Sistema iniciado com sucesso!");
}

void loop() {
    Serial.println("Rodando...");
    delay(2000);
}