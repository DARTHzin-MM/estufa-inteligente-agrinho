#pragma once

class Irrigation {
private:
    int pin;
    bool activeLow;

public:
    Irrigation(int pin, bool activeLow = true);
    void begin();
    void turnOn();
    void turnOff();
};