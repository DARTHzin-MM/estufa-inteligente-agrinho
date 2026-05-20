# V3 — IoT Completo (ESP32 + Backend + Dashboard)

## Objetivo

Transformar a estufa em uma solução IoT com monitoramento remoto, histórico de dados e controle manual/automático pelo navegador. Esta é a versão final do projeto, apresentada no Concurso Agrinho 2026.

O principal avanço desta versão é a separação de responsabilidades entre o hardware e a lógica de negócio: o ESP32 passa a ser apenas um coletor/atuador, enquanto toda a inteligência de decisão migra para o backend Python — tornando o sistema muito mais fácil de evoluir e configurar sem recompilar o firmware.

---

## O que esta versão adicionou em relação à V2

| Funcionalidade | Detalhe |
|---------------|---------|
| Troca DHT11 → DHT22 | Precisão de ±0,5°C e ±2% de umidade (antes ±2°C, ±5%) |
| Remoção do display OLED | Dados agora são visualizados no dashboard web |
| Conexão WiFi via WiFiManager | Troca de rede sem recompilar — portal captivo automático |
| Backend FastAPI + SQLite | Recebe, processa, persiste e serve os dados |
| Dashboard web completo | Gráfico em tempo real, histórico, alertas, modo manual, tema claro/escuro |
| Perfis de 20 plantas brasileiras | Limiares de irrigação e resfriamento atualizados automaticamente ao selecionar a planta |
| Regras automáticas configuráveis | Limiares não são mais hardcoded — vêm do banco de dados |
| Indicador de dado atrasado | Badge fica vermelho se passar 15s sem atualização do ESP32 |
| Toasts de notificação | Alerta visual quando a API fica offline |
| Modo manual no dashboard | Controle direto dos 3 atuadores pelo navegador |

---

## Hardware utilizado

### Microcontrolador

| Componente | Qtd | Função |
|------------|:---:|--------|
| ESP32 Dev Board (38 pinos) | 1 | Microcontrolador principal — WiFi + sensores + relés |
| Cabo Micro USB | 1 | Upload do firmware e alimentação durante desenvolvimento |
| Fonte 5V DC (adaptador) | 1 | Alimentação em campo |

### Sensores

| Componente | Qtd | Função |
|------------|:---:|--------|
| Sensor DHT22 | 1 | Temperatura e umidade do ar |
| Sensor capacitivo de umidade do solo v2.0 | 2 | Solo — pontos 1 e 2 da estufa |
| LDR (fotoresistor) | 1 | Luminosidade ambiente |
| Resistor 10kΩ | 1 | Divisor de tensão para o LDR |

### Atuadores

| Componente | Qtd | Função |
|------------|:---:|--------|
| Módulo relé 3 canais (5V, ativo em LOW) | 1 | Liga/desliga os 3 atuadores |
| Mini bomba de água submersível 5V | 1 | Irrigação das plantas |
| Mini bomba 5V | 1 | Distribuição de solução nutritiva |
| Cooler / ventilador 12V | 1 | Resfriamento da estufa |

### Estrutura e conexões

| Componente | Qtd | Função |
|------------|:---:|--------|
| Protoboard 830 pontos | 1 | Montagem do circuito |
| Jumpers macho-macho | 20 | Conexões gerais |
| Jumpers macho-fêmea | 10 | Sensores e módulos |
| Mangueira de silicone (metro) | 1 | Condução da água |

### Infraestrutura (servidor local)

| Item | Qtd | Observação |
|------|:---:|------------|
| Notebook / computador | 1 | Roda o backend FastAPI na rede local |
| Roteador WiFi | 1 | ESP32 e servidor devem estar na mesma rede |

---

## Mapeamento de pinos (ESP32)

| Pino ESP32 | Componente | Observação |
|:----------:|-----------|-----------|
| GPIO 4 | DHT22 | Digital |
| GPIO 34 (ADC1_CH6) | Sensor de solo 1 | Somente entrada — sem pull-up interno |
| GPIO 33 (ADC1_CH5) | Sensor de solo 2 | Somente entrada — sem pull-up interno |
| GPIO 35 (ADC1_CH7) | LDR | Somente entrada — sem pull-up interno |
| GPIO 18 | Relé — cooler | Ativo em LOW |
| GPIO 19 | Relé — bomba de água | Ativo em LOW |
| GPIO 21 | Relé — bomba de nutriente | Ativo em LOW |

> **Atenção:** GPIOs 33, 34 e 35 no ESP32 são somente entrada (input-only) e não têm resistor pull-up interno. São ideais para sensores analógicos, mas não devem ser usados como saída.

---

## Fluxo de operação

```
1. ESP32 conecta ao WiFi
   └─ Se não houver rede salva → cria ponto de acesso "Estufa-ESP32"
      └─ Operador configura a rede pelo portal captivo (qualquer dispositivo)

2. A cada 5 segundos:
   ├─ a. Lê os 5 sensores (DHT22 + 2x solo + LDR)
   ├─ b. Envia dados via POST /dados para o backend
   │     └─ Backend calcula estado dos atuadores com base nos limiares do banco
   ├─ c. ESP32 consulta GET /status
   └─ d. Aplica o estado recebido nos relés

3. Dashboard (navegador) a cada 5s:
   ├─ Consome GET /dados → atualiza cards e gráfico em tempo real
   └─ Consome GET /status → atualiza badges dos atuadores

4. Operador pode:
   ├─ Visualizar dados em tempo real e histórico (dia/semana/mês)
   ├─ Selecionar perfil de planta → limiares atualizados via POST /config/regras
   └─ Ativar modo manual → controlar cada atuador diretamente pelo dashboard
```

---

## Como executar

### 1. Backend

```bash
cd arduino/v3-iot/backend

# Cria e ativa o ambiente virtual
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
.venv\Scripts\activate           # Windows

# Instala as dependências
pip install fastapi uvicorn sqlalchemy pydantic

# Inicia o servidor (acessível para o ESP32 e o dashboard)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

O banco de dados `estufa.db` é criado automaticamente na primeira execução.
Documentação interativa da API disponível em: `http://localhost:8000/docs`

### 2. Dashboard

Abra `arduino/v3-iot/frontend/index.html` com o Live Server (VS Code) ou qualquer servidor HTTP local. O IP da API pode ser ajustado diretamente no canto superior direito do dashboard.

### 3. ESP32

```bash
cd arduino/v3-iot/esp32/Estufa-Inteligente

# Antes do upload: ajuste o IP do servidor em src/api/api_client.cpp
# const char* serverURL = "http://SEU_IP_AQUI:8000";

pio run --target upload
pio device monitor --baud 115200
```

---

## Endpoints da API

| Método | Rota | Chamado por | Descrição |
|--------|------|------------|-----------|
| `GET`  | `/` | — | Health check |
| `POST` | `/dados` | ESP32 | Recebe leituras dos sensores |
| `GET`  | `/dados` | Dashboard | Retorna última leitura |
| `GET`  | `/status` | ESP32 + Dashboard | Estado atual dos atuadores |
| `GET`  | `/historico?periodo=` | Dashboard | Dados históricos (dia/semana/mês) |
| `GET`  | `/controle` | Dashboard | Lê modo manual e estado |
| `POST` | `/controle` | Dashboard | Define modo e aciona atuadores |
| `GET`  | `/plantas` | Dashboard | Lista 20 perfis de plantas |
| `GET`  | `/config/regras` | Dashboard | Lê limiares automáticos |
| `POST` | `/config/regras` | Dashboard | Atualiza limiares por perfil de planta |

---

## Dependências do firmware (platformio.ini)

```ini
lib_deps =
    olikraus/U8g2
    adafruit/DHT sensor library
    adafruit/Adafruit Unified Sensor
    bblanchon/ArduinoJson
    tzapu/WiFiManager
```

---

## Limitações conhecidas e evoluções previstas

| Limitação atual | Evolução prevista |
|----------------|-----------------|
| IP do backend fixo no firmware | Configurável pelo portal WiFiManager |
| Sem autenticação no dashboard | Login com sessão ou token JWT |
| CORS aberto (`allow_origins=["*"]`) | Restringir ao IP do frontend em produção |
| Sem agendamento de irrigação por horário | Controle por agenda (cron) |
| Sem notificações externas | Alertas por e-mail ou Telegram |
| `@app.on_event("startup")` deprecado | Migrar para `lifespan` context manager (FastAPI moderno) |

---

[← V2](../../v2-esp32/README.md) | [Voltar ao README principal](../../../README.md)