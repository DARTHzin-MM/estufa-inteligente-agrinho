# 🌿 SmartGreen — Estufa Inteligente

> **Concurso Agrinho 2026 — Categoria Robótica**
> Tema: *Agro forte, futuro sustentável: equilíbrio entre produção e meio ambiente*
> Subcategoria 2 — Ensino Médio | Instituição Educacional C E C M DR GENEROSO MARQUES

---

## Sobre o projeto

O SmartGreen é um sistema de automação agrícola desenvolvido para monitorar e controlar o ambiente de uma estufa de forma inteligente e sustentável. O projeto nasceu da observação de um problema real: produtores que cultivam em estufas frequentemente desperdiçam água por irrigar sem controle e perdem produção por não detectar variações de temperatura e umidade a tempo.

A resposta do SmartGreen é automatizar essas decisões: irrigar **apenas quando o solo está seco**, acionar o resfriamento **somente quando a temperatura excede o limite** e adaptar os parâmetros automaticamente **conforme a espécie cultivada** — tudo monitorado remotamente pelo navegador.

O sistema foi desenvolvido em três versões progressivas ao longo do projeto, partindo de um protótipo local com Arduino até chegar a uma solução IoT completa com ESP32, backend em Python e dashboard web.

---

## Relevância para o tema do concurso

O SmartGreen contribui diretamente para o equilíbrio entre produção e meio ambiente:

| Impacto | Como o sistema resolve |
|---------|----------------------|
| **Redução do desperdício de água** | Irrigação acionada apenas quando a umidade do solo cai abaixo do limiar configurado para a planta cultivada |
| **Eficiência energética** | Cooler e bombas ligam somente quando necessário — não ficam operando continuamente |
| **Adaptação por cultura** | Perfis de 20 plantas brasileiras ajustam automaticamente os limiares de irrigação e resfriamento |
| **Tomada de decisão baseada em dados** | Histórico completo permite ao produtor identificar padrões e otimizar o manejo ao longo do tempo |
| **Tecnologia acessível** | Sistema construído com componentes de baixo custo e software 100% aberto, replicável por pequenos produtores |

---

## Evolução do projeto — três versões progressivas

| Versão | Plataforma | Foco principal | Novidade introduzida |
|--------|-----------|----------------|----------------------|
| [V1](arduino/v1/README.md) | Arduino Uno | Protótipo local de irrigação | Leitura de sensores, relé, display OLED |
| [V2](arduino/v2-esp32/README.md) | ESP32 | Lógica embarcada robusta | 2 sensores de solo, LDR, cooler, nutriente, histerese |
| [V3](arduino/v3-iot/README.md) | ESP32 + Backend + Dashboard | Sistema IoT completo | WiFi, API REST, SQLite, dashboard web, perfis de plantas |

---

## Arquitetura — V3 (versão final)

```
┌──────────────┐       POST /dados        ┌───────────────────┐
│    ESP32     │ ───────────────────────► │  Backend FastAPI  │
│  (sensores)  │                          │  (Python + SQLite)│
│  (relés)     │ ◄─────────────────────── │                   │
└──────────────┘       GET /status        └────────┬──────────┘
                                                   │ GET /dados
                                                   │ GET /status
                                                   │ GET /historico
                                                   ▼
                                          ┌──────────────────┐
                                          │  Dashboard Web   │
                                          │  (HTML/CSS/JS)   │
                                          │  + Perfis Plantas│
                                          └──────────────────┘
```

**Fluxo de operação:**
1. ESP32 lê os 5 sensores a cada 5 segundos
2. Envia os dados para `POST /dados` no backend
3. Backend calcula o estado dos atuadores com base nos limiares da planta selecionada
4. ESP32 consulta `GET /status` e aciona os relés correspondentes
5. Dashboard exibe dados em tempo real, histórico e permite controle manual
6. Operador seleciona o perfil da planta cultivada — limiares se atualizam instantaneamente

---

## Estrutura do repositório

```
SmartGreen/
├── arduino/
│   ├── v1/                     # Protótipo inicial (Arduino + OLED)
│   ├── v2-esp32/               # Versão expandida com ESP32
│   └── v3-iot/
│       ├── esp32/              # Firmware do nó IoT (C++ / PlatformIO)
│       ├── backend/            # API REST (Python / FastAPI / SQLite)
│       └── frontend/           # Dashboard web (HTML + CSS + JS)
├── docs/                       # Esquemas elétricos e imagens
├── hardware/                   # Lista de componentes e ligações
└── README.md                   # Este arquivo
```

---

## Hardware — V3 (versão final)

### Microcontrolador e comunicação

| Componente | Qtd | Função no projeto |
|------------|:---:|-------------------|
| ESP32 Dev Board (38 pinos) | 1 | Microcontrolador principal — WiFi, leitura de sensores, controle dos relés |
| Cabo Micro USB | 1 | Upload do firmware e alimentação durante desenvolvimento |
| Fonte 5V / adaptador de tomada | 1 | Alimentação em campo |

### Sensores

| Componente | Qtd | Função no projeto |
|------------|:---:|-------------------|
| Sensor DHT22 | 1 | Temperatura e umidade do ar (±0,5°C, ±2%) |
| Sensor capacitivo de umidade do solo v2.0 | 2 | Umidade do solo — pontos 1 e 2 da estufa |
| LDR (fotoresistor) + resistor 10kΩ | 1 | Luminosidade ambiente |

### Atuadores

| Componente | Qtd | Função no projeto |
|------------|:---:|-------------------|
| Módulo relé 3 canais (5V, ativo em LOW) | 1 | Controla bomba de água, bomba de nutrientes e cooler |
| Mini bomba de água submersível 5V | 1 | Irrigação das plantas |
| Mini bomba de água 5V | 1 | Distribuição de solução nutritiva |
| Cooler / ventilador 12V | 1 | Resfriamento da estufa quando temperatura ultrapassa o limite |

### Estrutura e conexões

| Componente | Qtd | Função no projeto |
|------------|:---:|-------------------|
| Protoboard 830 pontos | 1 | Montagem do circuito durante desenvolvimento |
| Jumpers macho-macho | 20 | Conexões gerais no protoboard |
| Jumpers macho-fêmea | 10 | Conexão entre ESP32 e sensores/módulos |
| Resistor 10kΩ | 1 | Divisor de tensão para o LDR |
| Mangueira de silicone (metro) | 1 | Condução da água das bombas até o solo |

### Infraestrutura (servidor local)

| Item | Qtd | Observação |
|------|:---:|------------|
| Computador / notebook | 1 | Roda o backend FastAPI na rede local |
| Roteador WiFi | 1 | ESP32 e computador precisam estar na mesma rede |

---

## Funcionalidades principais

- Monitoramento contínuo de temperatura, umidade do ar, luminosidade e dois pontos de umidade do solo
- Irrigação automática com histerese — liga quando o solo seca, desliga quando atinge o nível ideal
- Resfriamento automático quando a temperatura ultrapassa o limite configurado
- Dashboard com gráfico em tempo real, histórico por período (dia/semana/mês) e alertas visuais
- Tema claro/escuro no dashboard
- **Perfis de 20 plantas brasileiras** com parâmetros ideais (tomate, alface, morango, brócolis etc.)
- Ao selecionar uma planta, os limiares automáticos são atualizados no backend instantaneamente
- Modo manual para controle direto dos atuadores pelo dashboard
- Indicador de dado atrasado — alerta quando a comunicação com o ESP32 é interrompida
- Notificações visuais (toast) quando a API fica offline

---

## Como executar

### Pré-requisitos

- Python 3.10+
- PlatformIO (CLI ou extensão do VS Code)
- Navegador moderno (Chrome, Firefox, Edge)

### 1. Backend (Python / FastAPI)

```bash
cd arduino/v3-iot/backend
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
.venv\Scripts\activate           # Windows
pip install fastapi uvicorn sqlalchemy pydantic
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

O banco de dados `estufa.db` é criado automaticamente na primeira execução.
Acesse a documentação interativa da API em: `http://localhost:8000/docs`

### 2. Dashboard (Frontend)

Abra `arduino/v3-iot/frontend/index.html` com a extensão Live Server do VS Code ou qualquer servidor HTTP local. No canto superior direito, ajuste o IP da API para o endereço da máquina que roda o backend.

### 3. Firmware ESP32 (PlatformIO)

```bash
cd arduino/v3-iot/esp32/Estufa-Inteligente

# Edite o IP do backend antes de subir
# Arquivo: src/api/api_client.cpp → const char* serverURL

pio run --target upload
pio device monitor --baud 115200
```

Na primeira inicialização sem rede salva, o ESP32 cria um ponto de acesso chamado `Estufa-ESP32`. Conecte nele com qualquer dispositivo e configure a rede pelo portal captivo.

---

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET`  | `/` | Health check — verifica se a API está online |
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

## Tecnologias utilizadas

| Camada | Tecnologia |
|--------|-----------|
| Firmware | C++ / Arduino framework / PlatformIO |
| Microcontrolador | ESP32 (Espressif) |
| Comunicação | HTTP REST (WiFi) |
| Backend | Python 3 / FastAPI / SQLite / Pydantic |
| Frontend | HTML5 / CSS3 / JavaScript / Chart.js |
| Protocolo | JSON sobre HTTP |

---

## Documentação por versão

- [V1 — Protótipo inicial (Arduino Uno)](arduino/v1/README.md)
- [V2 — Expansão com ESP32](arduino/v2-esp32/README.md)
- [V3 — IoT completo](arduino/v3-iot/README.md)
- [Esquema elétrico](docs/esquema-eletrico.png)
- [Lista completa de componentes](hardware/componentes.md)

---

## Equipe

| Nome | Função |
|------|--------|
| Matheus de Paula Martins | Desenvolvimento de firmware (ESP32) e backend |
| Pietro Barbosa dos Santos | Montagem do hardware e esquemas elétricos |
| [Nome do integrante 3] | Roteiro e Estrutura da Apresentação |
| [Nome do integrante 4] | Construção da Estrutura Física da Estufa |

**Professor orientador:** Emilia
**Instituição:** C E C M DR GENEROSO MARQUES
**Concurso:** Agrinho 2026 — Categoria Robótica — Subcategoria 2 (Ensino Médio)

---

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE) para mais informações.