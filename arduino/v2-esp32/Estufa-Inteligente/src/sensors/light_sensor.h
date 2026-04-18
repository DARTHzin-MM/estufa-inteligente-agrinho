#pragma once

class LightSensor {
private:
    int pin;

public:
    LightSensor(int pin);
    int readRaw();
};