from fastapi import APIRouter
from models.models import SensorData
from database.database import insert_dados, insert_status_obj, get_last_status, get_last_data
from services.logic import calculate_status

router = APIRouter()

@router.post("/dados")
def receber_dados(data: SensorData):
    insert_dados(data)

    status = calculate_status(data)
    insert_status_obj(status)

    return {
        "mensagem": "Dados recebidos",
        "status": status
    }

@router.get("/status")
def enviar_status():
    return get_last_status()

@router.get("/dados")
def enviar_dados():
    return get_last_data()