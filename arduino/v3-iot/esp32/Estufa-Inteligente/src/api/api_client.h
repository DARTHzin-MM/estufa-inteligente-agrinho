#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>

struct SensorData {
    float temperatura;
    float umidade;
};

struct SystemStatus {
    bool irrigacao;
    bool ventilacao;
};

void sendDataToAPI(SensorData data);
SystemStatus getStatusFromAPI();

#endif