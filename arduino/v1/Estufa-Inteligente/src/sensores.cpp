#include <Arduino.h>
#include <DHT.h>
#include "sensores.h"

#define DHTPIN 2
#define DHTTYPE DHT11
#define SOIL A0

DHT dht(DHTPIN, DHTTYPE);

int umidadeSolo = 0;
float temp = 0;
float umidadeAr = 0;

void iniciarSensores() {
    dht.begin();
}

void lerSensores() {
    int valor = analogRead(SOIL);
    umidadeSolo = map(valor, 1023, 0, 0, 100);

    temp = dht.readTemperature();
    umidadeAr = dht.readHumidity();
}