from pydantic import BaseModel
from typing import Optional


# Dados que chegam do ESP32 via POST /dados
class SensorData(BaseModel):
    temperatura: float
    umidade_ar: float
    luminosidade: int
    umidade_solo_1: int
    umidade_solo_2: int
    nivel_agua: bool = True
    nivel_nutriente: bool = True


# Estado dos atuadores retornado ao ESP32 via GET /status
class SystemStatus(BaseModel):
    cooler: bool
    water_pump: bool
    nutr_pump: bool


# Controle manual vindo do dashboard
class ManualControl(BaseModel):
    modo_manual: bool = True
    cooler: Optional[bool] = None
    water_pump: Optional[bool] = None
    nutr_pump: Optional[bool] = None


# Regras automáticas configuráveis por perfil de planta
class RegrasConfig(BaseModel):
    temp_max: float = 30.0
    solo_min: float = 30.0
    planta_id: Optional[str] = None