from fastapi import FastAPI
from routers import dados

# Comando para rodar servidor: uvicorn main:app --host 0.0.0.0 --reload
app = FastAPI()

app.include_router(dados.router)

@app.get("/")
def home():
    return {"mensagem": "Servidor rodando"}