#include <Arduino.h>
#include <DHT.h>
#include "sensores.h"

#define DHTPIN 2
#define DHTTYPE DHT11
#define SOIL A0

DHT dht(DHTPIN, DHTTYPE);

// Variáveis globais
int umidadeSolo = 0;
float temp = NAN;
float umidadeAr = NAN;

void iniciarSensores() {
    dht.begin();
}

void lerSensores() {

    // ===== SOLO =====
    int valor = analogRead(SOIL);
    umidadeSolo = map(valor, 1023, 0, 0, 100);

    // ===== DHT  =====
    float temperatura = dht.readTemperature();
    float umidade = dht.readHumidity();

    if (isnan(temperatura) || isnan(umidade)) {
        // mantém como NaN (não trava o sistema)
        temp = NAN;
        umidadeAr = NAN;
        return;
    }

    temp = temperatura;
    umidadeAr = umidade;
}