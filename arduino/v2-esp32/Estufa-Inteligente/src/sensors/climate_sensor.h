#pragma once

class ClimateSensor {
private:
    int pin;

public:
    ClimateSensor(int pin);
    void begin();
    float readTemperature();
    float readHumidity();
};