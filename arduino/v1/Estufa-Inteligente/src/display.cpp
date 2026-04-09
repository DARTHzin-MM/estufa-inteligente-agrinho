#include <Arduino.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>

#include "display.h"
#include "sensores.h"
#include "irrigacao.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

void iniciarDisplay() {
    if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println("Erro no OLED");
        while(true);
    }

    display.clearDisplay();
}

// Barra de solo
void desenharBarra(int valor) {
    int largura = map(valor, 0, 100, 0, 100);
    display.drawRect(0, 40, 100, 10, WHITE);
    display.fillRect(0, 40, largura, 10, WHITE);
}

void atualizarDisplay() {
    display.clearDisplay();

    display.setTextSize(1);
    display.setTextColor(WHITE);

    display.setCursor(15, 0);
    display.print("SMARTGREEN V1");

    display.setCursor(0, 15);
    display.print("Temp:");
    display.print(temp);
    display.print("C");

    display.setCursor(70, 15);
    display.print("Ar:");
    display.print(umidadeAr);
    display.print("%");

    display.setCursor(0, 30);
    display.print("Solo:");

    desenharBarra(umidadeSolo);

    display.setCursor(105, 42);
    display.print(umidadeSolo);
    display.print("%");

    display.setCursor(0, 55);

    if (bombaLigada) {
        display.print("IRRIGANDO...");
    } else if (umidadeSolo < 40) {
        display.print("SOLO SECO");
    } else if (umidadeSolo > 70) {
        display.print("SOLO MOLHADO");
    } else {
        display.print("UMIDADE IDEAL");
    }

    display.display();
}