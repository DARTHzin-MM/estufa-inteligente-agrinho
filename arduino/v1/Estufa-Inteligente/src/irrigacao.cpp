#include <Arduino.h>
#include "irrigacao.h"
#include "sensores.h"

#define RELAY 7

bool bombaLigada = false;
bool irrigacaoDetectada = true;

unsigned long tempoAnterior = 0;
bool irrigando = false;

void iniciarIrrigacao() {
    pinMode(RELAY, OUTPUT);
    digitalWrite(RELAY, HIGH);
}

void controlarIrrigacao() {
    unsigned long agora = millis();

    // Se sensor não detectado → não irrigar
    if (umidadeSolo == -1) {
        irrigacaoDetectada = false;
        digitalWrite(RELAY, HIGH);
        irrigando = false;
        bombaLigada = false;
        return;
    }

    irrigacaoDetectada = true;

    if (!irrigando && umidadeSolo < 40 && (agora - tempoAnterior > 10000)) {
        digitalWrite(RELAY, LOW);
        irrigando = true;
        tempoAnterior = agora;
    }

    if (irrigando && umidadeSolo > 60 && (agora - tempoAnterior > 5000)) {
        digitalWrite(RELAY, HIGH);
        irrigando = false;
        tempoAnterior = agora;
    }

    bombaLigada = irrigando;
}