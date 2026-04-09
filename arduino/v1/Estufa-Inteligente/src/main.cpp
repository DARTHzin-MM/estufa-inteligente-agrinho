#include <Arduino.h>
#include "sensores.h"
#include "irrigacao.h"
#include "display.h"

void setup() {
    Serial.begin(9600);

    iniciarSensores();
    iniciarIrrigacao();
    iniciarDisplay();
}

void loop() {
    lerSensores();
    controlarIrrigacao();
    atualizarDisplay();

    delay(2000);
}