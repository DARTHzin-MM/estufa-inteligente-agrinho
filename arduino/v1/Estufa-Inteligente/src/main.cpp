#include <Arduino.h>
#include "sensores.h"
#include "irrigacao.h"
#include "display.h"

void setup() {
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