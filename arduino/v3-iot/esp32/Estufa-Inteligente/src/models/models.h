#ifndef MODELS_H
#define MODELS_H

struct SensorData {
    float temperatura;
    float umidade;
};

struct SystemStatus {
    bool irrigacao;
    bool ventilacao;
};

#endif