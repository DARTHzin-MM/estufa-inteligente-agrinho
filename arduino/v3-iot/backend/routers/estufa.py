from fastapi import APIRouter, Query, HTTPException
from models.models import SensorData, ManualControl
from database.database import (
    insert_dados,
    insert_status_obj,
    get_last_status,
    get_last_data,
    get_historico,
    get_config,
    set_manual_control,
)
from services.logic import calculate_status

router = APIRouter()


# ──────────────────────────────────────────────────
# 📥 RECEBIMENTO DE DADOS DO ESP32
# ──────────────────────────────────────────────────

@router.post("/dados")
def receber_dados(data: SensorData):
    try:
        insert_dados(data)

        status = calculate_status(data)
        insert_status_obj(status)

        return {
            "mensagem": "Dados recebidos",
            "status": status
        }

    except Exception as e:
        print("[API] Erro em /dados:", e)
        raise HTTPException(status_code=500, detail="Erro ao processar dados")


# ──────────────────────────────────────────────────
# 📤 ENVIO DE DADOS PARA O FRONTEND
# ──────────────────────────────────────────────────

@router.get("/dados")
def enviar_dados():
    try:
        return get_last_data()
    except Exception as e:
        print("[API] Erro em /dados GET:", e)
        raise HTTPException(status_code=500, detail="Erro ao buscar dados")


@router.get("/status")
def enviar_status():
    try:
        config = get_config()

        if config["modo_manual"]:
            return {
                "cooler":     config["cooler"],
                "water_pump": config["water_pump"],
                "nutr_pump":  config["nutr_pump"],
            }

        return get_last_status()

    except Exception as e:
        print("[API] Erro em /status:", e)
        raise HTTPException(status_code=500, detail="Erro ao buscar status")


# ──────────────────────────────────────────────────
# 📜 HISTÓRICO
# ──────────────────────────────────────────────────

@router.get("/historico")
def buscar_historico(periodo: str = Query(default="dia")):
    try:
        if periodo not in ("dia", "semana", "mes"):
            periodo = "dia"

        dados = get_historico(periodo)

        return {
            "periodo": periodo,
            "total": len(dados),
            "dados": dados,
        }

    except Exception as e:
        print("[API] Erro em /historico:", e)
        raise HTTPException(status_code=500, detail="Erro ao buscar histórico")


# ──────────────────────────────────────────────────
# 🎛️ CONTROLE MANUAL
# ──────────────────────────────────────────────────

@router.get("/controle")
def get_controle():
    try:
        return get_config()
    except Exception as e:
        print("[API] Erro em /controle GET:", e)
        raise HTTPException(status_code=500, detail="Erro ao buscar configuração")


@router.post("/controle")
def set_controle(data: ManualControl):
    try:
        payload = {
            "modo_manual": data.modo_manual,
            "cooler":      data.cooler,
            "water_pump":  data.water_pump,
            "nutr_pump":   data.nutr_pump,
        }

        set_manual_control(payload)

        modo = "manual" if data.modo_manual else "automático"

        return {
            "mensagem": f"Modo atualizado para: {modo}",
            "config": payload
        }

    except Exception as e:
        print("[API] Erro em /controle POST:", e)
        raise HTTPException(status_code=500, detail="Erro ao atualizar controle")