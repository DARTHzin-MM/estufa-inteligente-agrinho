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

// =====================
// CONTROLE DE TEMPO (ÁGUA)
// =====================
unsigned long waterStartTime = 0;
unsigned long waterCooldownTime = 0;

unsigned long waterDuration = 5000; // duração dinâmica
const unsigned long WATER_COOLDOWN = 10000;

bool waterRunning = false;

// =====================
// HISTERESIS (ÁGUA)
// =====================
bool irrigationNeeded = false;

// =====================
// CONTROLE DE TEMPO (NUTRIENTE)
// =====================
unsigned long nutrientStartTime = 0;
unsigned long nutrientCooldownTime = 0;

const unsigned long NUTRIENT_DURATION = 3000;
const unsigned long NUTRIENT_COOLDOWN = 20000;

bool nutrientRunning = false;

void setup() {
    Serial.begin(115200);

    waterPump.begin();
    nutrientPump.begin();
    cooler.begin();

    dht.begin();
    display.begin();

    Serial.println("Sistema iniciado - V2 Etapa 5");
}

void loop() {

    // =====================
    // LEITURA DOS SENSORES
    // =====================
    float soil = soil1.readPercentage();
    int light = ldr.readRaw();
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    // =====================
    // TEMPO GLOBAL (FIXO)
    // =====================
    unsigned long now = millis(); // 🔥 usado no sistema inteiro

    // =====================
    // AJUSTE INTELIGENTE (ÁGUA)
    // =====================
    if (temp >= 30) {
        waterDuration = 7000;
    }
    else if (temp <= 20) {
        waterDuration = 3000;
    }
    else {
        waterDuration = 5000;
    }

    Serial.println("----- SISTEMA -----");

    if (soil >= 0 && light >= 0) {

        Serial.printf("Solo: %.2f %%\n", soil);
        Serial.printf("Luz: %d\n", light);
        Serial.printf("Temp: %.2f C\n", temp);
        Serial.printf("Umid: %.2f %%\n", hum);

        // =====================
        // HISTERESIS DA IRRIGAÇÃO
        // =====================
        if (soil >= 0) { // 🔥 evita erro com leitura inválida
            if (soil < SOIL_MIN) {
                irrigationNeeded = true;
            }
            else if (soil > SOIL_MAX) {
                irrigationNeeded = false;
            }
        }

        // =====================
        // CONTROLE ÁGUA COM TEMPO
        // =====================
        if (irrigationNeeded && !waterRunning && (now - waterCooldownTime >= WATER_COOLDOWN)) {
            waterPump.turnOn();
            waterState = true;
            waterRunning = true;
            waterStartTime = now;

            Serial.println("Bomba de ÁGUA LIGADA (tempo controlado)");
        }

        if (waterRunning && (now - waterStartTime >= waterDuration)) {
            waterPump.turnOff();
            waterState = false;
            waterRunning = false;
            waterCooldownTime = now;

            Serial.println("Bomba de ÁGUA DESLIGADA (fim do ciclo)");
        }

        // =====================
        // CONTROLE NUTRIENTE COM TEMPO
        // =====================
        bool nutrient = controller.shouldNutrient(soil, light);

        if (nutrient && !nutrientRunning && (now - nutrientCooldownTime >= NUTRIENT_COOLDOWN)) {
            nutrientPump.turnOn();
            nutrientState = true;
            nutrientRunning = true;
            nutrientStartTime = now;

            Serial.println("Bomba de NUTRIENTE LIGADA (tempo controlado)");
        }

        if (nutrientRunning && (now - nutrientStartTime >= NUTRIENT_DURATION)) {
            nutrientPump.turnOff();
            nutrientState = false;
            nutrientRunning = false;
            nutrientCooldownTime = now;

            Serial.println("Bomba de NUTRIENTE DESLIGADA (fim do ciclo)");
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
    Serial.printf("Estado Cooler: %s\n", coolerState ? "ON" : "OFF");

    Serial.println("-------------------\n");

    // =====================
    // DISPLAY
    // =====================
    display.showData(soil, light, temp, hum, waterState, nutrientState, coolerState);

    delay(2000);
}