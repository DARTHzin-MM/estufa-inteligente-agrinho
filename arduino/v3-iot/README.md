# V3 — IoT Completo (ESP32 + Backend + Dashboard)

## Objetivo

Transformar a estufa em uma solução IoT com monitoramento remoto, histórico de dados e controle manual/automático pelo navegador. Esta é a versão final do projeto, apresentada no Concurso Agrinho 2026.

O principal avanço desta versão é a separação de responsabilidades entre o hardware e a lógica de negócio: o ESP32 passa a ser apenas um coletor/atuador, enquanto toda a inteligência de decisão migra para o backend Python — tornando o sistema muito mais fácil de evoluir e configurar sem recompilar o firmware.

---

## O que esta versão adicionou em relação à V2

| Funcionalidade | Detalhe |
|---|---|
| Troca DHT11 → DHT22 | Precisão de ±0,5°C e ±2% de umidade (antes ±2°C, ±5%) |
| Remoção do display OLED | Dados visualizados no dashboard web |
| Conexão WiFi via WiFiManager | Troca de rede sem recompilar — portal captivo automático |
| Backend FastAPI + SQLite | Recebe, processa, persiste e serve os dados |
| Dashboard web completo | Gráfico em tempo real, histórico, alertas, modo manual, tema claro/escuro |
| Perfis de 20 plantas brasileiras | Limiares de irrigação e resfriamento atualizados automaticamente |
| Regras automáticas configuráveis | Limiares vêm do banco de dados, não do firmware |
| **Sensores de nível XKC-Y26** | **Protegem as bombas quando o reservatório esvazia** |
| **Aba Nutrição no dashboard** | **Guia completo com 6 fórmulas de solução nutritiva** |
| **Exportação CSV** | **Histórico baixável em um clique pela aba Histórico** |
| **Gráfico com 4 datasets** | **Temperatura, umidade do ar, solo 1 e solo 2 simultâneos** |
| Indicador de dado atrasado | Badge vermelho se passar 15s sem atualização |
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
| Sensor DHT22 | 1 | Temperatura e umidade do ar (±0,5°C, ±2%) |
| Sensor capacitivo de umidade do solo v2.0 | 2 | Umidade do solo — pontos 1 e 2 da estufa |
| LDR (fotoresistor) | 1 | Luminosidade ambiente |
| Resistor 10kΩ | 1 | Divisor de tensão para o LDR |
| **Sensor de nível XKC-Y26 NPN** | **2** | **Nível dos reservatórios de água e nutrientes** |
| **Resistor 10kΩ + 20kΩ** | **2 pares** | **Divisor de tensão obrigatório — converte 5V para 3,3V** |

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

### Infraestrutura

| Item | Qtd | Observação |
|------|:---:|------------|
| Notebook / computador | 1 | Roda o backend FastAPI na rede local |
| Roteador WiFi | 1 | ESP32 e servidor devem estar na mesma rede |

---

## Mapeamento de pinos (ESP32)

| Pino ESP32 | Componente | Observação |
|:----------:|-----------|-----------|
| GPIO 4 | DHT22 | Digital |
| GPIO 34 (ADC1_CH6) | Sensor de solo 1 | Somente entrada |
| GPIO 33 (ADC1_CH5) | Sensor de solo 2 | Somente entrada |
| GPIO 35 (ADC1_CH7) | LDR | Somente entrada |
| GPIO 22 | XKC-Y26 — reservatório água | INPUT_PULLUP + divisor 10k/20kΩ |
| GPIO 23 | XKC-Y26 — reservatório nutriente | INPUT_PULLUP + divisor 10k/20kΩ |
| GPIO 18 | Relé — cooler | Ativo em LOW |
| GPIO 19 | Relé — bomba de água | Ativo em LOW |
| GPIO 21 | Relé — bomba de nutriente | Ativo em LOW |

---

## Atenção — sensor de nível XKC-Y26

O XKC-Y26 opera em 5–24V e sua saída HIGH equivale à tensão de alimentação. Conectar diretamente no ESP32 (3,3V) queima o pino.

É obrigatório um divisor de tensão entre o sinal do sensor e o GPIO:

```
Saída sensor (5V) ──┬── 10kΩ ──── GPIO ESP32
                    └── 20kΩ ──── GND
```

Instale o sensor colado na parede externa do reservatório, na altura mínima de segurança. O sensor detecta o líquido por capacitância através do plástico — sem contato com o líquido. Ajuste o trimpot até o LED indicar detecção correta.

Lógica de leitura (NPN com INPUT_PULLUP):
- LOW = sensor ativo = líquido presente = reservatório tem água
- HIGH = sem líquido = reservatório vazio → bomba bloqueada automaticamente

---

## Fluxo de operação

```
1. ESP32 conecta ao WiFi
   └─ Se não houver rede salva → cria AP "Estufa-ESP32"

2. A cada 5 segundos:
   ├─ Lê 5 sensores + 2 sensores de nível
   ├─ POST /dados → backend calcula estado dos atuadores
   │   └─ Se reservatório vazio: bomba bloqueada automaticamente
   ├─ GET /status → ESP32 aplica nos relés
   └─ Dashboard atualiza cards, gráfico e alertas

3. Operador pode:
   ├─ Ver nível dos reservatórios em tempo real
   ├─ Selecionar perfil de planta (limiares automáticos)
   ├─ Exportar histórico CSV pela aba Histórico
   ├─ Consultar guia de solução nutritiva na aba Nutrição
   └─ Acionar atuadores manualmente via modo manual
```

---

## Como executar

### 1. Backend

```bash
cd arduino/v3-iot/backend
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
.venv\Scripts\activate      # Windows
pip install fastapi uvicorn sqlalchemy pydantic
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Banco de dados criado automaticamente. Documentação da API disponível em `http://localhost:8000/docs`.

### 2. Dashboard

Abra `arduino/v3-iot/frontend/index.html` com Live Server (VS Code) ou qualquer servidor HTTP local. Ajuste o IP da API no canto superior direito do dashboard.

### 3. ESP32

```bash
cd arduino/v3-iot/esp32/Estufa-Inteligente
# Edite src/api/api_client.cpp — ajuste serverURL com o IP do backend
pio run --target upload
pio device monitor --baud 115200
```

---

## Endpoints da API

| Método | Rota | Chamado por | Descrição |
|--------|------|------------|-----------|
| `GET`  | `/` | — | Health check |
| `POST` | `/dados` | ESP32 | Recebe leituras + nível dos reservatórios |
| `GET`  | `/dados` | Dashboard | Retorna última leitura |
| `GET`  | `/status` | ESP32 + Dashboard | Estado dos atuadores |
| `GET`  | `/historico?periodo=` | Dashboard | Dados históricos |
| `GET`  | `/historico/export?periodo=` | Dashboard | Download CSV |
| `GET`  | `/controle` | Dashboard | Lê modo manual |
| `POST` | `/controle` | Dashboard | Define modo e aciona atuadores |
| `GET`  | `/plantas` | Dashboard | Lista 20 perfis de plantas |
| `GET`  | `/config/regras` | Dashboard | Lê limiares automáticos |
| `POST` | `/config/regras` | Dashboard | Atualiza limiares por perfil |

---

## Limitações conhecidas e evoluções previstas

| Limitação atual | Evolução prevista |
|---|---|
| IP do backend fixo no firmware | Configurável pelo portal WiFiManager |
| CORS aberto (`allow_origins=["*"]`) | Restringir ao IP do frontend em produção |
| `@app.on_event("startup")` deprecado | Migrar para `lifespan` context manager |
| Sem autenticação no dashboard | Login com token JWT |
| Bomba de nutrientes sem controle de tempo | Acionar com duração e cooldown configuráveis |
| Sem notificações externas | Alertas por Telegram ou e-mail |

---

[← V2](../../v2-esp32/README.md) | [Voltar ao README principal](../../../README.md)