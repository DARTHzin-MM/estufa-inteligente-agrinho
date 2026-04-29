#ifndef API_CLIENT_H
#define API_CLIENT_H

#include "models/models.h"

void sendDataToAPI(SensorData data);
SystemStatus getStatusFromAPI();

#endif