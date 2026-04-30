#include "actuators.h"
#include <Arduino.h>
#include "config/pins.h"

void initActuators() {
    pinMode(COOLER_PIN, OUTPUT);
    pinMode(WATER_PUMP_PIN, OUTPUT);
    pinMode(NUTR_PUMP_PIN, OUTPUT);

    // 🔒 segurança: começa desligado
    digitalWrite(COOLER_PIN, LOW);
    digitalWrite(WATER_PUMP_PIN, LOW);
    digitalWrite(NUTR_PUMP_PIN, LOW);
}

void applyStatus(SystemStatus status) {
    digitalWrite(COOLER_PIN, status.cooler ? LOW : HIGH);
    digitalWrite(WATER_PUMP_PIN, status.water_pump ? LOW : HIGH);
    digitalWrite(NUTR_PUMP_PIN, status.nutr_pump ? LOW : HIGH);
}