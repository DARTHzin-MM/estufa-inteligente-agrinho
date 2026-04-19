#pragma once

class Controller {
private:
    float minSoil;
    float maxSoil;
    float criticalSoil;
    int lightThreshold;

public:
    Controller(float minS, float maxS, float critS, int lightT);

    bool shouldWater(float soil);
    bool shouldNutrient(float soil, int light);
};