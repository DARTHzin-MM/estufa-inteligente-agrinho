#include "soil_sensor.h"
#include <Arduino.h>

SoilSensor::SoilSensor(int pin, int dry, int wet) {
    this->pin = pin;
    this->dryValue = dry;
    this->wetValue = wet;
}

float SoilSensor::readPercentage() {
    int raw = analogRead(pin);

    if (raw < 0 || raw > 4095) {
        return -1;
    }

    float percentage = map(raw, dryValue, wetValue, 0, 100);
    percentage = constrain(percentage, 0, 100);

    return percentage;
}