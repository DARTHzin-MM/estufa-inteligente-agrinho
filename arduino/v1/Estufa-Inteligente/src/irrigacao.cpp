#include <Arduino.h>
#include "irrigacao.h"
#include "sensores.h"

#define RELAY 7

bool bombaLigada = false;

unsigned long tempoAnterior = 0;
bool irrigando = false;

void iniciarIrrigacao() {
    pinMode(RELAY, OUTPUT);
    digitalWrite(RELAY, HIGH);
}

void controlarIrrigacao() {
    unsigned long agora = millis();

    // Histerese + tempo
    if (!irrigando && umidadeSolo < 40 && agora - tempoAnterior > 10000) {
        digitalWrite(RELAY, LOW);
        irrigando = true;
        tempoAnterior = agora;
    }

    if (irrigando && umidadeSolo > 60 && agora - tempoAnterior > 5000) {
        digitalWrite(RELAY, HIGH);
        irrigando = false;
        tempoAnterior = agora;
    }

    bombaLigada = irrigando;
}