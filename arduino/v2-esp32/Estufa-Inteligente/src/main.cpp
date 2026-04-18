#include <Arduino.h>

#include "config/pins.h"
#include "config/system_config.h"

#include "sensors/soil_sensor.h"
#include "sensors/light_sensor.h"

// =====================
// OBJETOS
// =====================
SoilSensor soil1(SOIL_SENSOR_1_PIN, SOIL_DRY, SOIL_WET);
SoilSensor soil2(SOIL_SENSOR_2_PIN, SOIL_DRY, SOIL_WET);

LightSensor ldr(LDR_SENSOR_PIN);

// =====================
// SETUP
// =====================
void setup() {
    Serial.begin(115200);

    pinMode(SOIL_SENSOR_1_PIN, INPUT);
    pinMode(SOIL_SENSOR_2_PIN, INPUT);
    pinMode(LDR_SENSOR_PIN, INPUT);

    Serial.println("Sistema iniciado (V2 - Sensores)");
}

// =====================
// LOOP
// =====================
void loop() {
    float soilValue1 = soil1.readPercentage();
    float soilValue2 = soil2.readPercentage();
    int lightValue = ldr.readRaw();

    Serial.println("----- LEITURAS -----");

    if (soilValue1 >= 0)
        Serial.printf("Solo 1: %.2f %%\n", soilValue1);
    else
        Serial.println("Erro Solo 1");

    if (soilValue2 >= 0)
        Serial.printf("Solo 2: %.2f %%\n", soilValue2);
    else
        Serial.println("Erro Solo 2");

    if (lightValue >= 0)
        Serial.printf("Luz: %d\n", lightValue);
    else
        Serial.println("Erro LDR");

    Serial.println("---------------------\n");

    delay(2000); // depois vamos trocar por millis
}