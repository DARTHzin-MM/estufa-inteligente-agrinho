from pydantic import BaseModel

class Dados(BaseModel):
    temperatura: float
    umidade: float

class Status(BaseModel):
    irrigacao: bool
    ventilacao: bool