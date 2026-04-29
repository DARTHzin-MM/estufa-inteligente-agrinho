#include "wifi_manager.h"
#include <WiFi.h>
#include <WiFiManager.h>

void initWiFi() {
    WiFiManager wm;

    // 🔹 Opcional: resetar configs salvas (usar só pra testes)
    // wm.resetSettings();

    bool res;

    res = wm.autoConnect("Estufa-ESP32", "12345678");

    if (!res) {
        Serial.println("Falha ao conectar no WiFi");
        ESP.restart();
    } else {
        Serial.println("Conectado ao WiFi!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
    }
}