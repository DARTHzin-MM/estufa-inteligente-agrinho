#include "sensors.h"
#include <Arduino.h>
#include <DHT.h>
#include "config/pins.h"

#define DHTTYPE DHT22
DHT dht(DHT_PIN, DHTTYPE);

// ─────────────────────────────────────────────────
// 🔌 INICIALIZAÇÃO
// ─────────────────────────────────────────────────

void initSensors() {
    dht.begin();

    pinMode(SOIL_PIN_1, INPUT);
    pinMode(SOIL_PIN_2, INPUT);
    pinMode(LDR_PIN,    INPUT);

    Serial.println("[Sensors] Sensores inicializados");
}

// ─────────────────────────────────────────────────
// 📖 LEITURA DOS SENSORES
// ─────────────────────────────────────────────────

SensorData readSensors() {
    SensorData data;

    // ── DHT22 ──
    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();

    if (isnan(temp) || isnan(hum)) {
        Serial.println("[Sensors] Erro no DHT22 — usando fallback");
        data.temperatura = 0;
        data.umidade_ar  = 0;
    } else {
        data.temperatura = temp;
        data.umidade_ar  = hum;
    }

    // ── Leitura analógica ──
    int solo1 = analogRead(SOIL_PIN_1);
    int solo2 = analogRead(SOIL_PIN_2);
    int luz   = analogRead(LDR_PIN);

    // ── Normalização (0–100) ──

    // Solo (invertido: seco → 0 | molhado → 100)
    data.umidade_solo_1 = constrain(map(solo1, 4095, 0, 0, 100), 0, 100);
    data.umidade_solo_2 = constrain(map(solo2, 4095, 0, 0, 100), 0, 100);

    // LDR (pode precisar inverter dependendo do circuito)
    data.luminosidade = constrain(map(luz, 0, 4095, 0, 100), 0, 100);

    return data;
}