#include "api_client.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* serverURL = "http://192.168.0.122:8000";

void sendDataToAPI(SensorData data) {
    if (WiFi.status() != WL_CONNECTED) return;

    HTTPClient http;
    http.begin(String(serverURL) + "/dados");
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;

    doc["temperatura"] = data.temperatura;
    doc["umidade_ar"] = data.umidade_ar;
    doc["luminosidade"] = data.luminosidade;
    doc["umidade_solo_1"] = data.umidade_solo_1;
    doc["umidade_solo_2"] = data.umidade_solo_2;

    String json;
    serializeJson(doc, json);

    int httpResponseCode = http.POST(json);

    if (httpResponseCode > 0) {
        Serial.println("POST OK");
        Serial.println(http.getString());
    } else {
        Serial.print("Erro POST: ");
        Serial.println(httpResponseCode);
    }

    http.end();
}

SystemStatus getStatusFromAPI() {
    SystemStatus status = {false, false, false};

    if (WiFi.status() != WL_CONNECTED) return status;

    HTTPClient http;
    http.begin(String(serverURL) + "/status");

    int httpResponseCode = http.GET();

    if (httpResponseCode > 0) {
        String resposta = http.getString();

        StaticJsonDocument<200> doc;
        DeserializationError error = deserializeJson(doc, resposta);

        if (!error) {
            status.cooler = doc["cooler"];
            status.water_pump = doc["water_pump"];
            status.nutr_pump = doc["nutr_pump"];
        }
    }

    http.end();

    return status;
}