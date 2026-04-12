#include <Arduino.h>
#include <DHT.h>
#include "sensores.h"

#define DHTPIN 2
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

float temp = 25;
float umidadeAr = 60;

bool sensorDHTok = false;

unsigned long ultimoDHT = 0;

void iniciarSensores() {
    dht.begin();
}

void lerSensores() {
    if (millis() - ultimoDHT < 3000) return;

    ultimoDHT = millis();

    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (!isnan(t) && !isnan(h)) {
        temp = t;
        umidadeAr = h;
        sensorDHTok = true;
    } else {
        sensorDHTok = false;
    }
}