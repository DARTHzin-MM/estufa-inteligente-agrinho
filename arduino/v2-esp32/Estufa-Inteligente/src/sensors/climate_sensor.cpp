#include "climate_sensor.h"
#include <Arduino.h>
#include <DHT.h>

#define DHTTYPE DHT11

static DHT* dht;

ClimateSensor::ClimateSensor(int pin) {
    this->pin = pin;
    dht = new DHT(pin, DHTTYPE);
}

void ClimateSensor::begin() {
    dht->begin();
}

float ClimateSensor::readTemperature() {
    float t = dht->readTemperature();
    if (isnan(t)) return -1;
    return t;
}

float ClimateSensor::readHumidity() {
    float h = dht->readHumidity();
    if (isnan(h)) return -1;
    return h;
}