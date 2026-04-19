#include "irrigation.h"
#include <Arduino.h>

Irrigation::Irrigation(int pin, bool activeLow) {
    this->pin = pin;
    this->activeLow = activeLow;
}

void Irrigation::begin() {
    pinMode(pin, OUTPUT);
    turnOff();
}

void Irrigation::turnOn() {
    digitalWrite(pin, activeLow ? LOW : HIGH);
}

void Irrigation::turnOff() {
    digitalWrite(pin, activeLow ? HIGH : LOW);
}