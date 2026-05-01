from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.estufa import router
from database.database import create_tables

# Para rodar:
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload

app = FastAPI(
    title="SmartGreen API",
    description="API de monitoramento e controle da estufa inteligente SmartGreen",
    version="2.0.0",
)


# ────────────────────────────────────────────────
# 🌐 CORS (permite conexão com frontend)
# ────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠ Em produção: colocar domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ────────────────────────────────────────────────
# 🚀 EVENTO DE INICIALIZAÇÃO
# ────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    """
    Executado quando a API inicia.
    Cria tabelas do banco automaticamente.
    """
    print("[SmartGreen] Inicializando banco de dados...")
    create_tables()
    print("[SmartGreen] Banco pronto ✅")


# ────────────────────────────────────────────────
# 📡 HEALTH CHECK
# ────────────────────────────────────────────────
@app.get("/")
def healthcheck():
    """
    Rota simples para verificar se a API está online.
    """
    return {
        "status": "online",
        "service": "SmartGreen API",
        "version": "2.0.0"
    }


# ────────────────────────────────────────────────
# 🔌 ROTAS PRINCIPAIS
# ────────────────────────────────────────────────
app.include_router(router)