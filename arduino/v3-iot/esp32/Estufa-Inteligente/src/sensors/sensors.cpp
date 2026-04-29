#include "sensors.h"
#include <Arduino.h>
#include <DHT.h>
#include "config/pins.h"

// 🔹 DHT22
#define DHTTYPE DHT22
DHT dht(DHT_PIN, DHTTYPE);

void initSensors() {
    dht.begin();

    pinMode(SOIL_PIN_1, INPUT);
    pinMode(SOIL_PIN_2, INPUT);
    pinMode(LDR_PIN, INPUT);
}

SensorData readSensors() {
    SensorData data;

    // 🔹 DHT22
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    if (isnan(temp) || isnan(hum)) {
        Serial.println("Erro DHT!");
        data.temperatura = 0;
        data.umidade_ar = 0;
    } else {
        data.temperatura = temp;
        data.umidade_ar = hum;
    }

    // 🔹 Solo
    int solo1 = analogRead(SOIL_PIN_1);
    int solo2 = analogRead(SOIL_PIN_2);

    // 🔹 Luz
    int luz = analogRead(LDR_PIN);

    // 🔧 Normalização simples (0–100)
    data.umidade_solo_1 = map(solo1, 0, 4095, 0, 100);
    data.umidade_solo_2 = map(solo2, 0, 4095, 0, 100);
    data.luminosidade = map(luz, 0, 4095, 0, 100);

    return data;
}