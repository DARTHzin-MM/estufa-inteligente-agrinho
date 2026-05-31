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

    // XKC-Y26 NPN — INPUT_PULLUP garante HIGH quando sem líquido
    // Quando o sensor detecta líquido, puxa a saída para LOW
    pinMode(WATER_LEVEL_PIN, INPUT_PULLUP);
    pinMode(NUTR_LEVEL_PIN,  INPUT_PULLUP);

    Serial.println("[Sensors] Sensores inicializados (incluindo nível de reservatório)");
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

    // ── Solo e LDR (analógico, normalizado 0–100) ──
    int solo1 = analogRead(SOIL_PIN_1);
    int solo2 = analogRead(SOIL_PIN_2);
    int luz   = analogRead(LDR_PIN);

    // Solo: invertido — seco = ADC alto, molhado = ADC baixo
    data.umidade_solo_1 = constrain(map(solo1, 4095, 0, 0, 100), 0, 100);
    data.umidade_solo_2 = constrain(map(solo2, 4095, 0, 0, 100), 0, 100);
    data.luminosidade   = constrain(map(luz,   0, 4095, 0, 100), 0, 100);

    // ── Nível de reservatório (XKC-Y26 NPN) ──
    // LOW  = sensor ativo = líquido presente = reservatório tem água
    // HIGH = sem líquido  = reservatório VAZIO (INPUT_PULLUP mantém HIGH)
    // ⚠️ Se o comportamento estiver invertido, troque == LOW por == HIGH
    data.nivel_agua      = (digitalRead(WATER_LEVEL_PIN) == HIGH);
    data.nivel_nutriente = (digitalRead(NUTR_LEVEL_PIN)  == HIGH);

    if (!data.nivel_agua) {
        Serial.println("[Sensors] ⚠️ Reservatório de ÁGUA vazio!");
    }
    if (!data.nivel_nutriente) {
        Serial.println("[Sensors] ⚠️ Reservatório de NUTRIENTE vazio!");
    }

    return data;
}