#include <Arduino.h>

#include "config/pins.h"
#include "config/system_config.h"

#include "sensors/soil_sensor.h"
#include "sensors/light_sensor.h"
#include "sensors/climate_sensor.h"

#include "display/display_manager.h"

#include "actuators/irrigation.h"
#include "core/controller.h"

// =====================
// SENSORES
// =====================
SoilSensor soil1(SOIL_SENSOR_1_PIN, SOIL_DRY, SOIL_WET);
LightSensor ldr(LDR_SENSOR_PIN);
ClimateSensor dht(DHT_PIN);

// =====================
// DISPLAY
// =====================
DisplayManager display;

// =====================
// ATUADORES
// =====================
Irrigation waterPump(RELAY_WATER_PIN);
Irrigation nutrientPump(RELAY_NUTRIENT_PIN);
Irrigation cooler(RELAY_COOLER_PIN);

// =====================
// CONTROLLER
// =====================
Controller controller(SOIL_MIN, SOIL_MAX, SOIL_CRITICAL, LIGHT_THRESHOLD);

// =====================
// ESTADOS
// =====================
bool waterState = false;
bool nutrientState = false;
bool coolerState = false;

void setup() {
    Serial.begin(115200);

    waterPump.begin();
    nutrientPump.begin();
    cooler.begin();   // 🔥 inicializa cooler

    dht.begin();
    display.begin();

    Serial.println("Sistema iniciado - V2 Etapa 4");
}

void loop() {
    // =====================
    // LEITURA DOS SENSORES
    // =====================
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

        // =====================
        // CONTROLE ÁGUA
        // =====================
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

        // =====================
        // CONTROLE NUTRIENTE
        // =====================
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

    // =====================
    // CONTROLE COOLER
    // =====================
    bool cool = controller.shouldCool(temp);

    if (cool && !coolerState) {
        cooler.turnOn();
        coolerState = true;
        Serial.println("COOLER LIGADO");
    }

    if (!cool && coolerState) {
        cooler.turnOff();
        coolerState = false;
        Serial.println("COOLER DESLIGADO");
    }

    // =====================
    // STATUS SERIAL
    // =====================
    Serial.printf("Estado Agua: %s\n", waterState ? "ON" : "OFF");
    Serial.printf("Estado Nutriente: %s\n", nutrientState ? "ON" : "OFF");
    Serial.printf("Estado Cooler: %s\n", coolerState ? "ON" : "OFF"); // 🔥 NOVO

    Serial.println("-------------------\n");

    // =====================
    // DISPLAY
    // =====================
    display.showData(soil, light, temp, hum, waterState, nutrientState, coolerState);

    delay(2000);
}