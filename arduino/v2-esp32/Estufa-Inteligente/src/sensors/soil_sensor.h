#pragma once

class SoilSensor {
private:
    int pin;
    int dryValue;
    int wetValue;

public:
    SoilSensor(int pin, int dry, int wet);
    float readPercentage();
};