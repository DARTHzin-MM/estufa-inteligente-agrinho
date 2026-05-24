#ifndef MODELS_H
#define MODELS_H

// ─────────────────────────────────────────────────
// 📦 MODELOS DE DADOS — SmartGreen ESP32
// Structs compartilhadas entre sensores, API e atuadores
// ─────────────────────────────────────────────────

struct SensorData {
    // Clima
    float temperatura;
    float umidade_ar;
    int   luminosidade;

    // Solo
    int umidade_solo_1;
    int umidade_solo_2;

    // Nível de reservatório (XKC-Y26)
    // true  = tem líquido (sensor ativo)
    // false = reservatório vazio (bloquear bomba)
    bool nivel_agua;
    bool nivel_nutriente;
};

struct SystemStatus {
    bool cooler;
    bool water_pump;
    bool nutr_pump;
};

#endif