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
    http.setTimeout(3000);

    StaticJsonDocument<200> doc;
    doc["temperatura"] = data.temperatura;
    doc["umidade"] = data.umidade;

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
    SystemStatus status = {false, false};

    if (WiFi.status() != WL_CONNECTED) return status;

    HTTPClient http;
    http.begin(String(serverURL) + "/status");
    http.setTimeout(3000);

    int httpResponseCode = http.GET();

    if (httpResponseCode > 0) {
        String resposta = http.getString();

        StaticJsonDocument<200> doc;
        DeserializationError error = deserializeJson(doc, resposta);

        if (!error) {
            status.irrigacao = doc["irrigacao"];
            status.ventilacao = doc["ventilacao"];
        }
    } else {
        Serial.print("Erro GET: ");
        Serial.println(httpResponseCode);
    }

    http.end();

    return status;
}