#include "display_manager.h"
#include <Arduino.h>
#include <U8g2lib.h>
#include <Wire.h>
#include "config/pins.h"  // 🔥 agora usa os pinos centralizados

U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0);

void DisplayManager::begin() {
    Wire.begin(SDA_PIN, SCL_PIN);
    delay(100);

    Wire.beginTransmission(0x3C);
    if (Wire.endTransmission() == 0) {
        u8g2.begin();
        initialized = true;
        Serial.println("Display detectado (0x3C)");
    } else {
        Serial.println("Display NÃO encontrado");
        initialized = false;
    }
}

void DisplayManager::showData(float soil, int light, float temp, float hum, bool water, bool nutrient) {
    if (!initialized) return;

    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_ncenB08_tr);

    u8g2.setCursor(0,10);
    u8g2.printf("Solo: %.0f%%", soil);

    u8g2.setCursor(0,20);
    u8g2.printf("Luz: %d", light);

    u8g2.setCursor(0,30);
    u8g2.printf("Temp: %.1fC", temp);

    u8g2.setCursor(0,40);
    u8g2.printf("Umid: %.1f%%", hum);

    u8g2.setCursor(0,50);
    u8g2.printf("Agua: %s", water ? "ON" : "OFF");

    u8g2.setCursor(0,60);
    u8g2.printf("Nutr: %s", nutrient ? "ON" : "OFF");

    u8g2.sendBuffer();
}