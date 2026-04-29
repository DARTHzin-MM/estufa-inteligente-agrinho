from fastapi import APIRouter
from models.models import SensorData
from database.database import insert_dados, get_last_status

router = APIRouter()

# 📤 recebe dados do ESP32
@router.post("/dados")
def receber_dados(data: SensorData):
    insert_dados(data)

    return {
        "mensagem": "Dados recebidos"
    }

# 📥 envia comandos pro ESP32
@router.get("/status")
def enviar_status():
    return get_last_status()