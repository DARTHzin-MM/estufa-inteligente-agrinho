from fastapi import APIRouter
from models.models import Dados, Status

router = APIRouter()

@router.get("/dados", response_model=Dados)
def get_dados():
    return Dados(temperatura=25.0, umidade=70.0)

@router.post("/dados")
def post_dados(dados: Dados):
    return {
        "mensagem": f"Temp: {dados.temperatura} | Umidade: {dados.umidade}"
    }

@router.get("/status", response_model=Status)
def get_status():
    return Status(irrigacao=False, ventilacao=True)