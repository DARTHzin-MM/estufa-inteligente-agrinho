from fastapi import FastAPI
from routers.estufa import router
from database.database import create_tables
from fastapi.middleware.cors import CORSMiddleware

# codigo pra rodar server: uvicorn main:app --host 0.0.0.0 --reload
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 cria banco ao iniciar
create_tables()

# 🔹 rotas
app.include_router(router)