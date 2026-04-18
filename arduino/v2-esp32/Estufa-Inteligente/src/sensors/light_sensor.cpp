#include "light_sensor.h"
#include <Arduino.h>

LightSensor::LightSensor(int pin) {
    this->pin = pin;
}

int LightSensor::readRaw() {
    int value = analogRead(pin);

    if (value < 0 || value > 4095) {
        return -1;
    }

    return value;
}