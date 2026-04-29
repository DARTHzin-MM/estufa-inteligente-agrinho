#ifndef MODELS_H
#define MODELS_H

struct SensorData {
    float temperatura;
    float umidade_ar;
    int luminosidade;
    int umidade_solo_1;
    int umidade_solo_2;
};

struct SystemStatus {
    bool cooler;
    bool water_pump;
    bool nutr_pump;
};

#endif