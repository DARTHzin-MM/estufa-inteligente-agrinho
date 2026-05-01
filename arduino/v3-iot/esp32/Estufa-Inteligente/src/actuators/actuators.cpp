#include "actuators.h"
#include <Arduino.h>
#include "config/pins.h"

// ─────────────────────────────────────────────────
// 🔧 HELPER — RELÉ ATIVO EM LOW
// ─────────────────────────────────────────────────

int relayWrite(bool ligado) {
    return ligado ? LOW : HIGH;
}

// ─────────────────────────────────────────────────
// 🔌 INICIALIZAÇÃO
// ─────────────────────────────────────────────────

void initActuators() {
    pinMode(COOLER_PIN,     OUTPUT);
    pinMode(WATER_PUMP_PIN, OUTPUT);
    pinMode(NUTR_PUMP_PIN,  OUTPUT);

    // Estado inicial seguro: tudo desligado
    digitalWrite(COOLER_PIN,     relayWrite(false));
    digitalWrite(WATER_PUMP_PIN, relayWrite(false));
    digitalWrite(NUTR_PUMP_PIN,  relayWrite(false));

    Serial.println("[Actuators] Atuadores inicializados (todos OFF)");
}

// ─────────────────────────────────────────────────
// ⚡ APLICAÇÃO DO STATUS
// ─────────────────────────────────────────────────

void applyStatus(SystemStatus status) {

    digitalWrite(COOLER_PIN,     relayWrite(status.cooler));
    digitalWrite(WATER_PUMP_PIN, relayWrite(status.water_pump));
    digitalWrite(NUTR_PUMP_PIN,  relayWrite(status.nutr_pump));

}