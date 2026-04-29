#include "sensors.h"
#include <DHT.h>

// 🔹 CONFIGURAÇÃO DO SENSOR
#define DHTPIN 4        
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

void initSensors() {
    dht.begin();
}

SensorData readSensors() {
    SensorData data;

    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    // 🔴 Tratamento de erro
    if (isnan(temp) || isnan(hum)) {
        Serial.println("Erro ao ler DHT!");
        
        data.temperatura = 0;
        data.umidade = 0;
    } else {
        data.temperatura = temp;
        data.umidade = hum;
    }

    return data;
}