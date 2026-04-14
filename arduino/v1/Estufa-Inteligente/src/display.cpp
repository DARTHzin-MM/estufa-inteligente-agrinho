#include <Arduino.h>
#include <Wire.h>
#include <U8g2lib.h>

#include "display.h"
#include "sensores.h"
#include "irrigacao.h"

U8G2_SSD1306_128X64_NONAME_F_SW_I2C u8g2(U8G2_R0, A5, A4);

void iniciarDisplay() {
    u8g2.begin();
}

// Função segura para float
void printFloat(float valor) {
    if (isnan(valor)) {
        u8g2.print("--");
    } else {
        u8g2.print(valor);
    }
}

// Barra
void desenharBarra(int valor) {
    if (valor < 0) return;

    int largura = map(valor, 0, 100, 0, 100);
    u8g2.drawFrame(10, 40, 100, 10);
    u8g2.drawBox(10, 40, largura, 10);
}

void atualizarDisplay() {
    
    static unsigned long ultimo = 0;

    if (millis() - ultimo < 500) return; // atualiza a cada 0.5s

    ultimo = millis();
    
    u8g2.clearBuffer();

    u8g2.setFont(u8g2_font_6x10_tr);

    // ===== TÍTULO =====
    u8g2.drawStr(20, 10, "SMARTGREEN V1");

    // ===== TEMPERATURA =====
    u8g2.setCursor(0, 25);
    u8g2.print("Temp:");
    printFloat(temp);
    u8g2.print("C");

    // ===== UMIDADE AR =====
    u8g2.setCursor(70, 25);
    u8g2.print("Ar:");
    printFloat(umidadeAr);
    u8g2.print("%");

    // ===== SOLO =====
    u8g2.setCursor(0, 35);
    u8g2.print("Solo:");

    if (umidadeSolo == -1) {
        u8g2.print("ND"); // não detectado
    } else {
        desenharBarra(umidadeSolo);

        u8g2.setCursor(110, 50);
        u8g2.print(umidadeSolo);
        u8g2.print("%");
    }

    // ===== STATUS =====
    u8g2.setCursor(0, 62);

    if (!irrigacaoDetectada) {
        u8g2.print("IRRIG: ND");
    } else if (bombaLigada) {
        u8g2.print("IRRIGANDO...");
    } else if (umidadeSolo < 40) {
        u8g2.print("SOLO SECO");
    } else if (umidadeSolo > 70) {
        u8g2.print("SOLO MOLHADO");
    } else {
        u8g2.print("UMIDADE IDEAL");
    }

    u8g2.sendBuffer();
}