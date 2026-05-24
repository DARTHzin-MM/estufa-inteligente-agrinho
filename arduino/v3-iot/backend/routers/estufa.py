import csv
import io
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from models.models import SensorData, ManualControl, RegrasConfig
from database.database import (
    insert_dados, insert_status_obj,
    get_last_status, get_last_data, get_historico,
    get_config, set_manual_control,
    get_regras, set_regras,
)
from services.logic import calculate_status

router = APIRouter()

# ─────────────────────────────────────────────────────────
# 🌱 PERFIS DE PLANTAS
# ─────────────────────────────────────────────────────────
PLANTAS = [
    {
        "id": "tomate", "nome": "Tomate", "emoji": "🍅", "categoria": "Legume",
        "descricao": "O mais cultivado em estufas no Brasil. Exige calor moderado e boa ventilação.",
        "temp":       {"min": 18, "ideal": [22, 28], "max": 32},
        "umidade_ar": {"min": 55, "ideal": [65, 75], "max": 85},
        "solo":       {"min": 55, "ideal": [65, 75], "max": 85},
        "temp_max": 30, "solo_min": 60,
    },
    {
        "id": "alface", "nome": "Alface", "emoji": "🥬", "categoria": "Verdura",
        "descricao": "Planta de clima ameno, muito sensível ao calor excessivo. Ideal para estufas climatizadas.",
        "temp":       {"min": 12, "ideal": [15, 22], "max": 26},
        "umidade_ar": {"min": 55, "ideal": [60, 75], "max": 85},
        "solo":       {"min": 55, "ideal": [60, 75], "max": 85},
        "temp_max": 24, "solo_min": 55,
    },
    {
        "id": "pimentao", "nome": "Pimentão", "emoji": "🫑", "categoria": "Legume",
        "descricao": "Exige alta temperatura e luminosidade. Um dos legumes de maior valor agregado em estufa.",
        "temp":       {"min": 18, "ideal": [22, 30], "max": 35},
        "umidade_ar": {"min": 55, "ideal": [60, 75], "max": 85},
        "solo":       {"min": 55, "ideal": [60, 75], "max": 80},
        "temp_max": 32, "solo_min": 55,
    },
    {
        "id": "pepino", "nome": "Pepino", "emoji": "🥒", "categoria": "Legume",
        "descricao": "Cresce rapidamente em estufa. Precisa de alta umidade do ar e solo sempre úmido.",
        "temp":       {"min": 18, "ideal": [22, 28], "max": 35},
        "umidade_ar": {"min": 65, "ideal": [70, 85], "max": 90},
        "solo":       {"min": 65, "ideal": [70, 80], "max": 90},
        "temp_max": 30, "solo_min": 65,
    },
    {
        "id": "morango", "nome": "Morango", "emoji": "🍓", "categoria": "Fruta",
        "descricao": "Alta rentabilidade em estufa. Prefere noites frias e dias amenos.",
        "temp":       {"min": 10, "ideal": [15, 22], "max": 28},
        "umidade_ar": {"min": 55, "ideal": [60, 75], "max": 85},
        "solo":       {"min": 60, "ideal": [65, 75], "max": 85},
        "temp_max": 26, "solo_min": 60,
    },
    {
        "id": "manjericao", "nome": "Manjericão", "emoji": "🌿", "categoria": "Erva",
        "descricao": "Erva aromática de rápido crescimento. Muito sensível ao frio e ao excesso de água.",
        "temp":       {"min": 18, "ideal": [20, 28], "max": 35},
        "umidade_ar": {"min": 45, "ideal": [50, 70], "max": 80},
        "solo":       {"min": 40, "ideal": [50, 65], "max": 75},
        "temp_max": 32, "solo_min": 45,
    },
    {
        "id": "rucula", "nome": "Rúcula", "emoji": "🥗", "categoria": "Verdura",
        "descricao": "Ciclo curto (30–45 dias). Tolera baixas temperaturas melhor que a alface.",
        "temp":       {"min": 10, "ideal": [12, 22], "max": 28},
        "umidade_ar": {"min": 50, "ideal": [55, 70], "max": 80},
        "solo":       {"min": 50, "ideal": [55, 70], "max": 80},
        "temp_max": 25, "solo_min": 50,
    },
    {
        "id": "espinafre", "nome": "Espinafre", "emoji": "🌱", "categoria": "Verdura",
        "descricao": "Prefere clima frio. Alto valor nutricional. Não tolera calor prolongado.",
        "temp":       {"min": 8,  "ideal": [10, 20], "max": 24},
        "umidade_ar": {"min": 55, "ideal": [60, 75], "max": 85},
        "solo":       {"min": 55, "ideal": [60, 75], "max": 85},
        "temp_max": 22, "solo_min": 55,
    },
    {
        "id": "couve", "nome": "Couve", "emoji": "🥬", "categoria": "Verdura",
        "descricao": "Resistente e produtiva. Adapta-se bem a variações de temperatura.",
        "temp":       {"min": 12, "ideal": [15, 24], "max": 30},
        "umidade_ar": {"min": 55, "ideal": [60, 75], "max": 85},
        "solo":       {"min": 55, "ideal": [60, 75], "max": 85},
        "temp_max": 28, "solo_min": 55,
    },
    {
        "id": "brocolis", "nome": "Brócolis", "emoji": "🥦", "categoria": "Verdura",
        "descricao": "Exige clima ameno e não tolera geadas. Ótimo para estufa no inverno.",
        "temp":       {"min": 12, "ideal": [15, 22], "max": 28},
        "umidade_ar": {"min": 55, "ideal": [60, 80], "max": 85},
        "solo":       {"min": 55, "ideal": [60, 75], "max": 85},
        "temp_max": 26, "solo_min": 55,
    },
    {
        "id": "berinjela", "nome": "Berinjela", "emoji": "🍆", "categoria": "Legume",
        "descricao": "Cultura tropical, exige muito calor. Produção alta em estufa aquecida.",
        "temp":       {"min": 20, "ideal": [24, 32], "max": 38},
        "umidade_ar": {"min": 50, "ideal": [55, 70], "max": 80},
        "solo":       {"min": 55, "ideal": [60, 75], "max": 85},
        "temp_max": 35, "solo_min": 55,
    },
    {
        "id": "abobrinha", "nome": "Abobrinha", "emoji": "🥒", "categoria": "Legume",
        "descricao": "Alta produtividade e ciclo curto. Precisa de boa ventilação para evitar fungos.",
        "temp":       {"min": 18, "ideal": [20, 28], "max": 35},
        "umidade_ar": {"min": 50, "ideal": [55, 70], "max": 80},
        "solo":       {"min": 55, "ideal": [60, 75], "max": 85},
        "temp_max": 30, "solo_min": 55,
    },
    {
        "id": "cenoura", "nome": "Cenoura", "emoji": "🥕", "categoria": "Raiz",
        "descricao": "Precisa de solo profundo e solto. Temperatura amena favorece o desenvolvimento.",
        "temp":       {"min": 12, "ideal": [15, 22], "max": 28},
        "umidade_ar": {"min": 50, "ideal": [55, 70], "max": 80},
        "solo":       {"min": 60, "ideal": [65, 80], "max": 90},
        "temp_max": 26, "solo_min": 60,
    },
    {
        "id": "beterraba", "nome": "Beterraba", "emoji": "🫜", "categoria": "Raiz",
        "descricao": "Tolera variações de temperatura. Solo sempre úmido é fundamental.",
        "temp":       {"min": 12, "ideal": [15, 24], "max": 30},
        "umidade_ar": {"min": 50, "ideal": [55, 70], "max": 80},
        "solo":       {"min": 60, "ideal": [65, 75], "max": 85},
        "temp_max": 28, "solo_min": 60,
    },
    {
        "id": "cebola", "nome": "Cebola", "emoji": "🧅", "categoria": "Bulbo",
        "descricao": "Produção expressiva no Brasil. Suporta solo mais seco que a maioria das hortaliças.",
        "temp":       {"min": 12, "ideal": [15, 25], "max": 32},
        "umidade_ar": {"min": 45, "ideal": [50, 65], "max": 75},
        "solo":       {"min": 45, "ideal": [50, 65], "max": 75},
        "temp_max": 30, "solo_min": 45,
    },
    {
        "id": "alho", "nome": "Alho", "emoji": "🧄", "categoria": "Bulbo",
        "descricao": "Exige período de frio para formação do bulbo. Solo bem drenado é essencial.",
        "temp":       {"min": 8,  "ideal": [12, 22], "max": 28},
        "umidade_ar": {"min": 45, "ideal": [50, 65], "max": 75},
        "solo":       {"min": 45, "ideal": [50, 65], "max": 75},
        "temp_max": 26, "solo_min": 45,
    },
    {
        "id": "coentro", "nome": "Coentro", "emoji": "🌿", "categoria": "Erva",
        "descricao": "Erva de ciclo curto muito usada na culinária brasileira. Sensível ao excesso de calor.",
        "temp":       {"min": 15, "ideal": [18, 26], "max": 32},
        "umidade_ar": {"min": 50, "ideal": [55, 70], "max": 80},
        "solo":       {"min": 50, "ideal": [55, 70], "max": 80},
        "temp_max": 28, "solo_min": 50,
    },
    {
        "id": "salsinha", "nome": "Salsinha", "emoji": "🌿", "categoria": "Erva",
        "descricao": "Tolera semi-sombra. Ciclo longo e produção contínua em estufa.",
        "temp":       {"min": 12, "ideal": [15, 25], "max": 30},
        "umidade_ar": {"min": 55, "ideal": [60, 75], "max": 85},
        "solo":       {"min": 55, "ideal": [60, 70], "max": 80},
        "temp_max": 28, "solo_min": 55,
    },
    {
        "id": "feijao", "nome": "Feijão", "emoji": "🫘", "categoria": "Grão",
        "descricao": "Leguminosa mais consumida no Brasil. Estufa permite produção o ano todo.",
        "temp":       {"min": 15, "ideal": [18, 28], "max": 34},
        "umidade_ar": {"min": 50, "ideal": [55, 70], "max": 80},
        "solo":       {"min": 50, "ideal": [55, 70], "max": 80},
        "temp_max": 30, "solo_min": 50,
    },
    {
        "id": "batata", "nome": "Batata", "emoji": "🥔", "categoria": "Tubérculo",
        "descricao": "Exige solo úmido e bem aerado. Temperatura amena favorece a tuberização.",
        "temp":       {"min": 12, "ideal": [15, 22], "max": 28},
        "umidade_ar": {"min": 55, "ideal": [60, 80], "max": 85},
        "solo":       {"min": 65, "ideal": [70, 85], "max": 90},
        "temp_max": 26, "solo_min": 65,
    },
]


# ─────────────────────────────────────────────────────────
# 📥 RECEBIMENTO DE DADOS DO ESP32
# ─────────────────────────────────────────────────────────

@router.post("/dados")
def receber_dados(data: SensorData):
    try:
        insert_dados(data)
        regras = get_regras()
        status = calculate_status(data, regras)
        insert_status_obj(status)
        return {"mensagem": "Dados recebidos", "status": status}
    except Exception as e:
        print("[API] Erro em /dados:", e)
        raise HTTPException(status_code=500, detail="Erro ao processar dados")


# ─────────────────────────────────────────────────────────
# 📤 ENVIO DE DADOS PARA O FRONTEND
# ─────────────────────────────────────────────────────────

@router.get("/dados")
def enviar_dados():
    try:
        return get_last_data()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao buscar dados")


@router.get("/status")
def enviar_status():
    try:
        config = get_config()
        if config["modo_manual"]:
            return {
                "cooler": config["cooler"],
                "water_pump": config["water_pump"],
                "nutr_pump": config["nutr_pump"]
            }
        return get_last_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao buscar status")


# ─────────────────────────────────────────────────────────
# 📜 HISTÓRICO
# ─────────────────────────────────────────────────────────

@router.get("/historico")
def buscar_historico(periodo: str = Query(default="dia")):
    try:
        if periodo not in ("dia", "semana", "mes"):
            periodo = "dia"
        dados = get_historico(periodo)
        return {"periodo": periodo, "total": len(dados), "dados": dados}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao buscar histórico")


@router.get("/historico/export")
def exportar_historico_csv(periodo: str = Query(default="mes")):
    """
    Exporta o histórico de sensores como arquivo CSV para download.
    Acessar: GET /historico/export?periodo=dia|semana|mes
    """
    try:
        if periodo not in ("dia", "semana", "mes"):
            periodo = "mes"

        dados = get_historico(periodo)

        if not dados:
            raise HTTPException(status_code=404, detail="Nenhum dado para este período")

        output = io.StringIO()
        campos = ["timestamp", "temperatura", "umidade_ar", "luminosidade",
                  "umidade_solo_1", "umidade_solo_2", "nivel_agua", "nivel_nutriente"]

        writer = csv.DictWriter(output, fieldnames=campos, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(dados)
        output.seek(0)

        nome_arquivo = f"smartgreen_{periodo}.csv"
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={nome_arquivo}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        print("[API] Erro em /historico/export:", e)
        raise HTTPException(status_code=500, detail="Erro ao exportar dados")


# ─────────────────────────────────────────────────────────
# 🎛️ CONTROLE MANUAL
# ─────────────────────────────────────────────────────────

@router.get("/controle")
def get_controle():
    try:
        return get_config()
    except Exception as e:
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
        return {"mensagem": f"Modo atualizado para: {modo}", "config": payload}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao atualizar controle")


# ─────────────────────────────────────────────────────────
# 🌱 PLANTAS
# ─────────────────────────────────────────────────────────

@router.get("/plantas")
def listar_plantas():
    try:
        regras_atuais = get_regras()
        planta_ativa = regras_atuais.get("planta_id")
        return {"plantas": PLANTAS, "planta_ativa": planta_ativa}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao buscar plantas")


# ─────────────────────────────────────────────────────────
# ⚙️ REGRAS AUTOMÁTICAS
# ─────────────────────────────────────────────────────────

@router.get("/config/regras")
def buscar_regras():
    try:
        return get_regras()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao buscar regras")


@router.post("/config/regras")
def atualizar_regras(data: RegrasConfig):
    try:
        payload = {
            "temp_max":  data.temp_max,
            "solo_min":  data.solo_min,
            "planta_id": data.planta_id,
        }
        set_regras(payload)
        return {
            "mensagem":  "Regras atualizadas com sucesso",
            "planta_id": data.planta_id,
            "temp_max":  data.temp_max,
            "solo_min":  data.solo_min,
        }
    except Exception as e:
        print("[API] Erro em /config/regras:", e)
        raise HTTPException(status_code=500, detail="Erro ao atualizar regras")