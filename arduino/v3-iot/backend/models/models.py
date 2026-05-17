from pydantic import BaseModel
from typing import Optional


# Dados que chegam do ESP32 via POST /dados
class SensorData(BaseModel):
    temperatura: float
    umidade_ar: float
    luminosidade: int
    umidade_solo_1: int
    umidade_solo_2: int


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


# NOVO — regras automáticas configuráveis por perfil de planta
# temp_max: acima deste valor o cooler é acionado
# solo_min: abaixo deste valor a bomba de água é acionada
# planta_id: identificador textual da planta selecionada (ex: "tomate")
class RegrasConfig(BaseModel):
    temp_max: float = 30.0
    solo_min: float = 30.0
    planta_id: Optional[str] = None