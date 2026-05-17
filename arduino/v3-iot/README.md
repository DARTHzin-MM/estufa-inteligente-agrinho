# V3 — IoT Completo (ESP32 + Backend + Dashboard)

## Objetivo

Transformar a estufa em uma solução IoT com monitoramento remoto, histórico de dados e controle manual/automático pelo navegador. Esta é a versão final do projeto, apresentada no Concurso Agrinho 2026.

---

## O que esta versão adicionou

- Troca do DHT11 pelo DHT22 (mais preciso: ±0.5°C, ±2% umidade)
- Remoção do display OLED — dados agora vão para o dashboard web
- Conexão WiFi com reconexão automática via WiFiManager (sem precisar recompilar para trocar a rede)
- Backend em Python (FastAPI) que recebe, processa e persiste os dados em banco SQLite
- Dashboard web completo com: sensores em tempo real, gráficos, histórico por período, alertas, modo manual e tema claro/escuro
- **Perfis de 20 plantas brasileiras:** ao selecionar uma planta, os limiares de irrigação e resfriamento são atualizados automaticamente no backend — sem alterar o código
- Regras automáticas configuráveis pelo dashboard (não mais hardcoded)
- Indicador de dado atrasado no dashboard (fica vermelho se passar 15s sem atualização)
- Notificações visuais (toast) quando a API fica offline

---

## Hardware utilizado

> **Instrução:** preencha a coluna *Qtd* após montar o circuito.

### Microcontrolador

| Componente | Qtd | Função |
|------------|:---:|--------|
| ESP32 Dev Board (38 pinos) | | Microcontrolador principal — WiFi + sensores + relés |
| Cabo USB para upload e alimentação | | Upload do firmware |
| Fonte 5V DC (adaptador) | | Alimentação em campo |

### Sensores

| Componente | Qtd | Função |
|------------|:---:|--------|
| Sensor DHT22 | | Temperatura e umidade do ar |
| Sensor capacitivo de umidade do solo v2.0 | | Solo — ponto 1 |
| Sensor capacitivo de umidade do solo v2.0 | | Solo — ponto 2 |
| LDR (fotoresistor) | | Luminosidade |
| Resistor 10kΩ | | Divisor de tensão para o LDR |

### Atuadores

| Componente | Qtd | Função |
|------------|:---:|--------|
| Módulo relé 3 canais (5V, ativo em LOW) | | Liga/desliga os 3 atuadores |
| Mini bomba de água submersível 5V | | Irrigação das plantas |
| Mini bomba 5V (nutriente) | | Distribuição de solução nutritiva |
| Cooler / ventilador | | Resfriamento da estufa |

### Estrutura e conexões

| Componente | Qtd | Função |
|------------|:---:|--------|
| Protoboard 830 pontos | | Montagem do circuito |
| Jumpers macho-macho | | Conexões gerais |
| Jumpers macho-fêmea | | Sensores e módulos |
| Mangueira de silicone (metro) | | Condução da água |

### Infraestrutura (servidor local)

| Item | Qtd | Observação |
|------|:---:|------------|
| Notebook / computador | | Roda o backend FastAPI |
| Roteador WiFi | | ESP32 e servidor na mesma rede |

---

## Mapeamento de pinos (ESP32)

| Pino ESP32 | Componente |
|:----------:|-----------|
| GPIO 4 | DHT22 |
| GPIO 34 (ADC, somente leitura) | Sensor de solo 1 |
| GPIO 33 (ADC, somente leitura) | Sensor de solo 2 |
| GPIO 35 (ADC, somente leitura) | LDR |
| GPIO 18 | Relé — cooler |
| GPIO 19 | Relé — bomba de água |
| GPIO 21 | Relé — bomba de nutriente |

> **Atenção:** GPIOs 34, 35 e 33 no ESP32 são somente entrada (input only) — não têm resistor pull-up interno. Ideal para sensores analógicos.

---

## Fluxo de operação

```
1. ESP32 conecta ao WiFi (WiFiManager — portal de configuração se não houver rede salva)
2. A cada 5 segundos:
   a. Lê os 5 sensores
   b. Envia dados via POST /dados para o backend
   c. Backend calcula estado dos atuadores com base nos limiares salvos
   d. ESP32 consulta GET /status
   e. Aplica o estado nos relés
3. Dashboard consome GET /dados e GET /status a cada 5s
4. Operador pode:
   - Ver dados em tempo real e histórico
   - Selecionar perfil de planta (atualiza limiares automaticamente)
   - Alternar para modo manual e controlar atuadores diretamente
```

---

## Como executar

### 1. Backend

```bash
cd arduino/v3-iot/backend
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
pip install fastapi uvicorn sqlalchemy pydantic
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

O banco de dados (`estufa.db`) é criado automaticamente na primeira execução.

### 2. Dashboard

Abra `arduino/v3-iot/frontend/index.html` com o Live Server (VS Code) ou qualquer servidor HTTP local. Clique no ícone ☀️ da topbar para alternar o tema. O IP da API pode ser ajustado diretamente no dashboard.

### 3. ESP32

```bash
cd arduino/v3-iot/esp32/Estufa-Inteligente
pio run --target upload
pio device monitor --baud 115200
```

Na primeira inicialização sem rede salva, o ESP32 cria um ponto de acesso chamado `Estufa-ESP32`. Conecte nele com qualquer dispositivo e configure a rede pelo portal.

---

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/dados` | ESP32 envia leituras dos sensores |
| `GET`  | `/dados` | Dashboard lê últimas leituras |
| `GET`  | `/status` | ESP32 e dashboard consultam estado dos atuadores |
| `GET`  | `/historico?periodo=dia\|semana\|mes` | Histórico para os gráficos |
| `GET`  | `/controle` | Lê configuração de modo manual |
| `POST` | `/controle` | Dashboard alterna modo e controla atuadores |
| `GET`  | `/plantas` | Lista os 20 perfis de plantas disponíveis |
| `GET`  | `/config/regras` | Lê limiares automáticos ativos |
| `POST` | `/config/regras` | Atualiza limiares ao aplicar perfil de planta |

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

## Limitações atuais

- Endereço IP do backend fixo no firmware (pode ser configurado antes do upload)
- Regras automáticas por intervalo de tempo ainda não implementadas (previsto como evolução)
- Sem autenticação no dashboard (qualquer pessoa na rede pode acessar)
- CORS aberto (`allow_origins=["*"]`) — adequado para ambiente local, não para produção

---

## Evoluções previstas

- Controle de irrigação por agenda horária
- Notificações por e-mail ou Telegram quando limiar é ultrapassado
- Autenticação no dashboard
- Versionamento da API (`/api/v1/...`)

---

[← V2](../../v2-esp32/README.md) | [Voltar ao README principal](../../../README.md)