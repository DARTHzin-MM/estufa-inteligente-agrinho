from pydantic import BaseModel

# 📊 Dados que chegam do ESP32
class SensorData(BaseModel):
    temperatura: float
    umidade_ar: float
    luminosidade: int
    umidade_solo_1: int
    umidade_solo_2: int

# ⚙️ Comandos que voltam pro ESP32
class SystemStatus(BaseModel):
    cooler: bool
    water_pump: bool
    nutr_pump: bool