#pragma once

class DisplayManager {
private:
    bool initialized = false;

public:
    void begin();
    void showData(float soil, int light, float temp, float hum, bool water, bool nutrient);
};