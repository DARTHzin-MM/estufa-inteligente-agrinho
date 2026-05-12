# Projeto Agrinho — Estufa Inteligente (V1, V2 e V3)

Projeto de automação agrícola com evolução incremental de protótipo local (Arduino) para sistema IoT completo com **ESP32 + API + dashboard web**.

## Visão geral

Este repositório preserva a evolução histórica do projeto em três fases:

- **V1:** automação local simples de irrigação.
- **V2:** expansão de sensores/atuadores e lógica embarcada mais robusta.
- **V3:** arquitetura IoT com telemetria remota, backend e interface web.

## Estrutura do repositório

```text
arduino/
  v1/                 # Protótipo inicial (Arduino + OLED)
  v2-esp32/           # Evolução com ESP32, 2 bombas e cooler
  v3-iot/
    esp32/            # Firmware do nó IoT
    backend/          # API REST (FastAPI)
    frontend/         # Dashboard web (HTML/CSS/JS)
docs/                 # Documentação complementar e imagens
hardware/             # Ligações e componentes
```

## Arquitetura (V3)

Fluxo principal:

1. ESP32 lê sensores (solo, clima, luz).
2. ESP32 envia dados para `POST /dados`.
3. Backend calcula estado automático dos atuadores.
4. Dashboard consome `GET /dados`, `GET /status` e `GET /historico`.
5. Em modo manual, dashboard envia `POST /controle`.

## Como executar (V3)

### 1) Backend (Python/FastAPI)

```bash
cd arduino/v3-iot/backend
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn sqlalchemy pydantic
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2) Frontend (dashboard)

Abra `arduino/v3-iot/frontend/index.html` em servidor local (Live Server ou similar) e ajuste `API_BASE` em `script.js` para o IP/porta corretos da API.

### 3) ESP32 (PlatformIO)

```bash
cd arduino/v3-iot/esp32/Estufa-Inteligente
pio run
pio run --target upload
pio device monitor
```

> Configure SSID/senha e endpoint da API antes do upload.

## Documentação por versão

- [`arduino/v1/README.md`](arduino/v1/README.md)
- [`arduino/v2-esp32/README.md`](arduino/v2-esp32/README.md)
- [`arduino/v3-iot/README.md`](arduino/v3-iot/README.md)

## Recomendação de evolução futura

- Padronizar contratos (`SensorData`, `SystemStatus`) em documento de API.
- Extrair configuração (limiares e tempos) para banco/arquivo `.env`.
- Adotar testes automatizados (firmware simulado + API).
- Versionar endpoints (`/api/v1/...`) e endurecer CORS/autenticação.