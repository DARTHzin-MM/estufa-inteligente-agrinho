#include "controller.h"

Controller::Controller(float minS, float maxS, float critS, int lightT) {
    minSoil = minS;
    maxSoil = maxS;
    criticalSoil = critS;
    lightThreshold = lightT;
}

bool Controller::shouldWater(float soil) {
    if (soil < minSoil) return true;
    if (soil > maxSoil) return false;
    return false;
}

bool Controller::shouldNutrient(float soil, int light) {
    if (soil < criticalSoil && light > lightThreshold) {
        return true;
    }
    return false;
}

bool Controller::shouldCool(float temperature) {
    static bool coolerOn = false;

    if (temperature >= 30) {
        coolerOn = true;
    } 
    else if (temperature <= 27) {
        coolerOn = false;
    }

    return coolerOn;
}