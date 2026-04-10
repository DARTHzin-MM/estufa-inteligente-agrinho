#include <Arduino.h>
#include <DHT.h>
#include "sensores.h"

#define DHTPIN 2
#define DHTTYPE DHT11
#define SOIL A0

DHT dht(DHTPIN, DHTTYPE);

int umidadeSolo = 0;
float temp = NAN;
float umidadeAr = NAN;

bool sensorDHTok = false;

void iniciarSensores() {
    dht.begin();
}

void lerSensores() {
    // ===== SENSOR SOLO =====
    int valor = analogRead(SOIL);

    // Se não tiver sensor conectado, valor fica estranho (muito baixo ou alto)
    if (valor < 10 || valor > 1010) {
        umidadeSolo = -1; // indica não detectado
    } else {
        umidadeSolo = map(valor, 1023, 0, 0, 100);
    }

    // ===== DHT =====
    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (isnan(t) || isnan(h)) {
        sensorDHTok = false;
        temp = NAN;
        umidadeAr = NAN;
    } else {
        sensorDHTok = true;
        temp = t;
        umidadeAr = h;
    }
}