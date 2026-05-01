#ifndef PINS_H
#define PINS_H

// ─────────────────────────────────────────────────
// 📍 MAPEAMENTO DE PINOS — SmartGreen ESP32
// ─────────────────────────────────────────────────

// ── Sensor de temperatura e umidade do ar ──
#define DHT_PIN         4    // Digital | DHT22

// ── Sensores de umidade do solo (capacitivos ou resistivos) ──
#define SOIL_PIN_1      34   // Analógico (ADC1_CH6) — somente leitura
#define SOIL_PIN_2      33   // Analógico (ADC1_CH5) — somente leitura

// ── Sensor de luminosidade (LDR com divisor de tensão) ──
#define LDR_PIN         35   // Analógico (ADC1_CH7) — somente leitura

// ── Atuadores via módulo relé (lógica ATIVA EM LOW) ──
#define COOLER_PIN      18   // Digital | Cooler / ventilador
#define WATER_PUMP_PIN  19   // Digital | Bomba de água
#define NUTR_PUMP_PIN   21   // Digital | Bomba de nutrientes

#endif