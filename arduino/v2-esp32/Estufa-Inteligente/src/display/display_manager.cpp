#include "display_manager.h"
#include <Arduino.h>
#include <U8g2lib.h>
#include <Wire.h>
#include "config/pins.h"  // usa pinos centralizados

// Instância do display OLED (I2C hardware)
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0);

void DisplayManager::begin() {
    // Inicializa comunicação I2C com pinos definidos
    Wire.begin(SDA_PIN, SCL_PIN);
    delay(100); // tempo para estabilizar

    // Testa se o display responde no endereço 0x3C
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

void DisplayManager::showData(float soil, int light, float temp, float hum, bool water, bool nutrient, bool cooler) {
    // Se não inicializou, não tenta desenhar (evita travamento)
    if (!initialized) return;

    u8g2.clearBuffer(); // limpa tela

    u8g2.setFont(u8g2_font_ncenB08_tr);

    // 📊 Dados dos sensores
    u8g2.setCursor(0,10);
    u8g2.printf("Solo: %.0f%%", soil);

    u8g2.setCursor(0,20);
    u8g2.printf("Luz: %d", light);

    u8g2.setCursor(0,30);
    u8g2.printf("Temp: %.1fC", temp);

    u8g2.setCursor(0,40);
    u8g2.printf("Umid: %.1f%%", hum);

    // ⚙️ Estados dos atuadores
    u8g2.setCursor(0,50);
    u8g2.printf("Agua:%s", water ? "ON" : "OFF");

    u8g2.setCursor(64,50);
    u8g2.printf("Nut:%s", nutrient ? "ON" : "OFF");

    // 🔥 NOVO: estado do cooler
    u8g2.setCursor(0,60);
    u8g2.printf("Cool:%s", cooler ? "ON" : "OFF");

    u8g2.sendBuffer(); // envia para tela
}