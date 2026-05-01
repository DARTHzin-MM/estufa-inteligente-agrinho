#include <Arduino.h>
#include "network/wifi_manager.h"
#include "sensors/sensors.h"
#include "api/api_client.h"
#include "actuators/actuators.h"

const unsigned long LOOP_INTERVAL = 5000;
unsigned long lastRun = 0;

// ─────────────────────────────────────────────────
// 🚀 SETUP
// ─────────────────────────────────────────────────

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n=============================");
    Serial.println("  SmartGreen — Estufa v2.0  ");
    Serial.println("=============================");

    initWiFi();
    initSensors();
    initActuators();

    Serial.println("[Setup] Sistema pronto!\n");
}

// ─────────────────────────────────────────────────
// 🔄 LOOP PRINCIPAL (NÃO BLOQUEANTE)
// ─────────────────────────────────────────────────

void loop() {

    // Executa apenas no intervalo definido
    if (millis() - lastRun < LOOP_INTERVAL) {
        return;
    }

    lastRun = millis();

    // ── 1. Leitura dos sensores ──
    SensorData data = readSensors();

    Serial.println("─── SENSORES ───────────────");
    Serial.printf("  Temperatura : %.1f °C\n", data.temperatura);
    Serial.printf("  Umidade Ar  : %.1f %%\n", data.umidade_ar);
    Serial.printf("  Luminosidade: %d %%\n",   data.luminosidade);
    Serial.printf("  Solo 1      : %d %%\n",   data.umidade_solo_1);
    Serial.printf("  Solo 2      : %d %%\n",   data.umidade_solo_2);

    // ── 2. Envia dados ──
    sendDataToAPI(data);

    // ── 3. Recebe status ──
    SystemStatus status = getStatusFromAPI();

    // ── 4. Aplica nos relés ──
    applyStatus(status);

    Serial.println("─── ATUADORES ──────────────");
    Serial.printf("  Cooler      : %s\n", status.cooler     ? "ON" : "OFF");
    Serial.printf("  Bomba Água  : %s\n", status.water_pump ? "ON" : "OFF");
    Serial.printf("  Bomba Nutr. : %s\n", status.nutr_pump  ? "ON" : "OFF");
    Serial.println();
}