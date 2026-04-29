from fastapi import FastAPI
from routers.estufa import router
from database.database import create_tables

# codigo pra rodar server: uvicorn main:app --host 0.0.0.0 --reload
app = FastAPI()

# 🔹 cria banco ao iniciar
create_tables()

# 🔹 rotas
app.include_router(router)