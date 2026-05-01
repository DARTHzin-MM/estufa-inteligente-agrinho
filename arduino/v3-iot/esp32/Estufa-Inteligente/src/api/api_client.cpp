#include "api_client.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ─────────────────────────────────────────────────
// 🌐 CONFIGURAÇÃO DA API
// ─────────────────────────────────────────────────

const char* serverURL = "http://192.168.0.122:8000";

// ─────────────────────────────────────────────────
// 📤 ENVIO DE DADOS DOS SENSORES
// ─────────────────────────────────────────────────

void sendDataToAPI(SensorData data) {

    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[API] WiFi desconectado — POST cancelado");
        return;
    }

    // Monta JSON
    StaticJsonDocument<256> doc;
    doc["temperatura"]    = data.temperatura;
    doc["umidade_ar"]     = data.umidade_ar;
    doc["luminosidade"]   = data.luminosidade;
    doc["umidade_solo_1"] = data.umidade_solo_1;
    doc["umidade_solo_2"] = data.umidade_solo_2;

    String json;
    serializeJson(doc, json);

    // Retry simples (2 tentativas)
    for (int tentativa = 1; tentativa <= 2; tentativa++) {

        HTTPClient http;
        http.begin(String(serverURL) + "/dados");
        http.addHeader("Content-Type", "application/json");

        int httpCode = http.POST(json);

        if (httpCode > 0) {
            Serial.printf("[API] POST /dados → %d\n", httpCode);
            http.end();
            return;
        }

        Serial.printf("[API] Falha POST tentativa %d → %d\n", tentativa, httpCode);

        http.end();
        delay(500);
    }

    Serial.println("[API] POST falhou após 2 tentativas");
}

// ─────────────────────────────────────────────────
// 📥 LEITURA DO STATUS DOS ATUADORES
// ─────────────────────────────────────────────────

SystemStatus getStatusFromAPI() {

    SystemStatus status = { false, false, false }; // estado seguro

    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[API] WiFi desconectado — GET cancelado");
        return status;
    }

    HTTPClient http;
    http.begin(String(serverURL) + "/status");

    int httpCode = http.GET();

    if (httpCode > 0) {

        String resposta = http.getString();

        StaticJsonDocument<200> doc;
        DeserializationError erro = deserializeJson(doc, resposta);

        if (!erro) {
            status.cooler     = doc["cooler"]     | false;
            status.water_pump = doc["water_pump"] | false;
            status.nutr_pump  = doc["nutr_pump"]  | false;

            Serial.printf(
                "[API] GET /status → %d | cooler=%d pump=%d nutr=%d\n",
                httpCode,
                status.cooler,
                status.water_pump,
                status.nutr_pump
            );

        } else {
            Serial.printf("[API] Erro JSON → %s\n", erro.c_str());
        }

    } else {
        Serial.printf("[API] GET falhou → %d\n", httpCode);
    }

    http.end();
    return status;
}