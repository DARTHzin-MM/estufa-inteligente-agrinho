#include <Arduino.h>
#include <U8glib.h>
#include "display.h"
#include "sensores.h"
#include "irrigacao.h"

U8GLIB_SSD1306_128X64 u8g(U8G_I2C_OPT_NONE);

void desenharBarra(int valor) {
    int largura = map(valor, 0, 100, 0, 100);
    u8g.drawFrame(0, 35, 100, 10);
    u8g.drawBox(0, 35, largura, 10);
}

void draw() {
    u8g.setFont(u8g_font_6x10);

    u8g.setPrintPos(0, 10);
    u8g.print("Temp:");
    u8g.print(temp);

    u8g.setPrintPos(70, 10);
    u8g.print("Ar:");
    u8g.print(umidadeAr);

    u8g.setPrintPos(0, 30);
    u8g.print("Solo:");

    desenharBarra(umidadeSolo);

    u8g.setPrintPos(105, 45);
    u8g.print(umidadeSolo);
    u8g.print("%");

    u8g.setPrintPos(0, 60);
    if (bombaLigada) {
        u8g.print("IRRIGANDO");
    } else {
        u8g.print("PARADO");
    }
}

void iniciarDisplay() {}

void atualizarDisplay() {
    u8g.firstPage();
    do {
        draw();
    } while (u8g.nextPage());
}