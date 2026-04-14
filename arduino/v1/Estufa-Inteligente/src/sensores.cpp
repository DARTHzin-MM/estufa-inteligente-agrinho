#include <Arduino.h>
#include <DHTesp.h>
#include "sensores.h"

#define DHTPIN 2
#define SOIL A0

DHTesp dht;

// Variáveis globais
int umidadeSolo = 0;
float temp = NAN;
float umidadeAr = NAN;

void iniciarSensores() {
    dht.setup(DHTPIN, DHTesp::DHT11);
}

void lerSensores() {

    // ===== SENSOR DE SOLO =====
    int valor = analogRead(SOIL);

    // Evita valores bugados (sensor desconectado)
    if (valor < 5 || valor > 1018) {
        umidadeSolo = -1; // não detectado
    } else {
        umidadeSolo = map(valor, 1023, 0, 0, 100);
    }

    // ===== DHT11 =====
    TempAndHumidity data = dht.getTempAndHumidity();

    // Tratamento simples (como você pediu)
    if (isnan(data.temperature) || isnan(data.humidity)) {
        temp = NAN;
        umidadeAr = NAN;
        Serial.println(temp);
        Serial.println(umidadeAr);
        return;
    }

    temp = data.temperature;
    umidadeAr = data.humidity;
    Serial.println(temp);
    Serial.println(umidadeAr);
}