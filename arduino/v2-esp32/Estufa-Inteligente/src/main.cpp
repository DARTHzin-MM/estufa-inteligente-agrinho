#include <Arduino.h>

#include "config/pins.h"
#include "config/system_config.h"

#include "sensors/soil_sensor.h"
#include "sensors/light_sensor.h"
#include "sensors/climate_sensor.h"

#include "display/display_manager.h"

#include "actuators/irrigation.h"
#include "core/controller.h"

// Sensores
SoilSensor soil1(SOIL_SENSOR_1_PIN, SOIL_DRY, SOIL_WET);
LightSensor ldr(LDR_SENSOR_PIN);
ClimateSensor dht(DHT_PIN);

// Display
DisplayManager display;

// Atuadores
Irrigation waterPump(RELAY_WATER_PIN);
Irrigation nutrientPump(RELAY_NUTRIENT_PIN);

// Controller
Controller controller(SOIL_MIN, SOIL_MAX, SOIL_CRITICAL, LIGHT_THRESHOLD);

// Estado
bool waterState = false;
bool nutrientState = false;

void setup() {
    Serial.begin(115200);

    waterPump.begin();
    nutrientPump.begin();
    dht.begin();

    display.begin(); // agora seguro

    Serial.println("Sistema iniciado - V2 Etapa 3");
}

void loop() {
    float soil = soil1.readPercentage();
    int light = ldr.readRaw();
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    Serial.println("----- SISTEMA -----");

    if (soil >= 0 && light >= 0) {
        Serial.printf("Solo: %.2f %%\n", soil);
        Serial.printf("Luz: %d\n", light);
        Serial.printf("Temp: %.2f C\n", temp);
        Serial.printf("Umid: %.2f %%\n", hum);

        bool water = controller.shouldWater(soil);

        if (water && !waterState) {
            waterPump.turnOn();
            waterState = true;
            Serial.println("Bomba de ÁGUA LIGADA");
        }

        if (!water && waterState) {
            waterPump.turnOff();
            waterState = false;
            Serial.println("Bomba de ÁGUA DESLIGADA");
        }

        bool nutrient = controller.shouldNutrient(soil, light);

        if (nutrient && !nutrientState) {
            nutrientPump.turnOn();
            nutrientState = true;
            Serial.println("Bomba de NUTRIENTE LIGADA");
        }

        if (!nutrient && nutrientState) {
            nutrientPump.turnOff();
            nutrientState = false;
            Serial.println("Bomba de NUTRIENTE DESLIGADA");
        }

    } else {
        Serial.println("Erro leitura sensores");
    }

    Serial.printf("Estado Água: %s\n", waterState ? "ON" : "OFF");
    Serial.printf("Estado Nutriente: %s\n", nutrientState ? "ON" : "OFF");

    Serial.println("-------------------\n");

    display.showData(soil, light, temp, hum, waterState, nutrientState);

    delay(2000);
}