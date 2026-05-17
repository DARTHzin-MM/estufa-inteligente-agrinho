# 🌿 SmartGreen — Estufa Inteligente

> **Concurso Agrinho 2026 — Categoria AgroRobótica**
> Tema: *Agro forte, futuro sustentável: equilíbrio entre produção e meio ambiente*

---

## Sobre o projeto

O SmartGreen é um sistema de automação agrícola desenvolvido para monitorar e controlar o ambiente de uma estufa de forma inteligente. O projeto nasceu da necessidade de otimizar o uso de recursos como água e energia no cultivo protegido, respondendo diretamente ao tema do concurso: produzir mais com impacto ambiental menor.

O sistema coleta dados de temperatura, umidade do ar, luminosidade e umidade do solo em tempo real, e aciona automaticamente irrigação, resfriamento e nutrição com base nos parâmetros ideais de cada cultura. Na versão final (V3), todas as informações são enviadas para um backend e visualizadas em um dashboard web, permitindo monitoramento e controle remoto.

---

## Problema que resolve

Produtores que cultivam em estufas enfrentam dois desafios constantes: desperdício de água por irrigação sem controle e perda de produção por variações de temperatura e umidade não detectadas a tempo. O SmartGreen automatiza essas decisões, irrigando só quando necessário e alertando quando as condições fogem da faixa ideal da planta cultivada.

---

## Evolução do projeto

O desenvolvimento foi dividido em três versões progressivas, cada uma introduzindo novos conceitos de engenharia e aumentando a complexidade do sistema.

| Versão | Plataforma | Foco principal |
|--------|-----------|----------------|
| [V1](arduino/v1/README.md) | Arduino Uno | Protótipo local de irrigação automática |
| [V2](arduino/v2-esp32/README.md) | ESP32 | Expansão de sensores, lógica embarcada robusta |
| [V3](arduino/v3-iot/README.md) | ESP32 + Backend + Dashboard | Sistema IoT completo com telemetria remota |

---

## Estrutura do repositório

```
SmartGreen/
├── arduino/
│   ├── v1/                     # Protótipo inicial (Arduino + OLED)
│   ├── v2-esp32/               # Versão expandida com ESP32
│   └── v3-iot/
│       ├── esp32/              # Firmware do nó IoT
│       ├── backend/            # API REST em Python (FastAPI)
│       └── frontend/           # Dashboard web (HTML + CSS + JS)
├── docs/                       # Documentação e imagens
├── hardware/                   # Esquemas de ligação e lista de componentes
└── README.md                   # Este arquivo
```

---

## Hardware — V3 (versão final)

> **Instrução:** a coluna *Qtd* está em branco. Preencha após montar o circuito.

### Microcontrolador e comunicação

| Componente | Qtd | Função no projeto |
|------------|:---:|-------------------|
| ESP32 Dev Board (38 pinos) | | Microcontrolador principal — WiFi, leitura de sensores, controle dos relés |
| Cabo USB-C / Micro USB | | Upload do firmware e alimentação durante desenvolvimento |
| Fonte 5V / adaptador de tomada | | Alimentação em campo |

### Sensores

| Componente | Qtd | Função no projeto |
|------------|:---:|-------------------|
| Sensor DHT22 | | Temperatura e umidade do ar (mais preciso que o DHT11 das versões anteriores) |
| Sensor capacitivo de umidade do solo (v2.0) | | Umidade do solo — ponto 1 da estufa |
| Sensor capacitivo de umidade do solo (v2.0) | | Umidade do solo — ponto 2 da estufa |
| LDR (fotoresistor) + resistor 10kΩ | | Luminosidade ambiente |

### Atuadores

| Componente | Qtd | Função no projeto |
|------------|:---:|-------------------|
| Módulo relé de 3 canais (5V, ativo em LOW) | | Controla bomba de água, bomba de nutrientes e cooler |
| Mini bomba de água submersível 5V | | Irrigação das plantas |
| Mini bomba peristáltica ou de água 5V | | Distribuição de solução nutritiva |
| Cooler / ventilador 12V | | Resfriamento da estufa quando temperatura ultrapassa o limite |

### Estrutura e conexões

| Componente | Qtd | Função no projeto |
|------------|:---:|-------------------|
| Protoboard 830 pontos | | Montagem do circuito durante desenvolvimento |
| Jumpers macho-macho | | Conexões gerais no protoboard |
| Jumpers macho-fêmea | | Conexão entre ESP32 e sensores/módulos |
| Resistor 10kΩ | | Divisor de tensão para o LDR |
| Mangueira de silicone (metro) | | Condução da água das bombas até o solo |

### Para o servidor (backend local)

| Item | Qtd | Observação |
|------|:---:|------------|
| Computador / notebook | | Roda o backend FastAPI na rede local |
| Roteador WiFi | | ESP32 e computador precisam estar na mesma rede |

---

## Arquitetura — V3

```
┌─────────────┐       POST /dados        ┌──────────────────┐
│    ESP32     │ ───────────────────────► │  Backend FastAPI  │
│  (sensores)  │                          │  (Python + SQLite)│
│  (relés)    │ ◄─────────────────────── │                  │
└─────────────┘       GET /status         └────────┬─────────┘
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
1. ESP32 lê os sensores a cada 5 segundos
2. Envia os dados para `POST /dados` no backend
3. Backend calcula o estado dos atuadores com base nas regras da planta selecionada
4. ESP32 consulta `GET /status` e aciona os relés correspondentes
5. Dashboard exibe dados em tempo real, histórico e permite controle manual
6. Operador pode selecionar o perfil de uma planta para ajustar os limiares automaticamente

---

## Como executar

### Backend (Python / FastAPI)

```bash
cd arduino/v3-iot/backend
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
.venv\Scripts\activate           # Windows
pip install fastapi uvicorn sqlalchemy pydantic
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Dashboard (Frontend)

Abra `arduino/v3-iot/frontend/index.html` em um servidor local (extensão Live Server do VS Code funciona bem). No canto superior direito do dashboard, ajuste o IP da API para o endereço da máquina que está rodando o backend.

### Firmware ESP32 (PlatformIO)

```bash
cd arduino/v3-iot/esp32/Estufa-Inteligente
pio run --target upload
pio device monitor
```

> Antes de fazer upload, edite `src/network/wifi_manager.h` com o SSID e senha da sua rede.

---

## Funcionalidades principais

- Monitoramento contínuo de temperatura, umidade do ar, luminosidade e dois pontos de umidade do solo
- Irrigação automática com histerese (liga quando seca, desliga quando úmida)
- Resfriamento automático quando temperatura ultrapassa o limite configurado
- Dashboard com gráfico em tempo real, histórico por período e alertas visuais
- Tema claro/escuro no dashboard
- Perfis de 20 plantas brasileiras com parâmetros ideais (tomate, alface, morango, etc.)
- Ao selecionar uma planta, os limiares automáticos são atualizados no backend instantaneamente
- Modo manual para controle direto dos atuadores pelo dashboard
- Indicador de dado atrasado quando a comunicação é interrompida

---

## Relevância para o tema do concurso

O SmartGreen contribui diretamente para o equilíbrio entre produção e meio ambiente ao:

- **Reduzir o desperdício de água:** a irrigação só ocorre quando a umidade do solo está abaixo do limiar configurado, evitando irrigação desnecessária
- **Otimizar energia:** o cooler só liga quando a temperatura excede o limite, não ficando ligado continuamente
- **Adaptar-se a cada cultura:** os perfis de plantas permitem que os recursos sejam usados conforme a necessidade real de cada espécie
- **Dar visibilidade ao produtor:** o histórico permite identificar padrões e tomar decisões mais informadas sobre o manejo

---

## Documentação por versão

- [V1 — Protótipo inicial](arduino/v1/README.md)
- [V2 — Expansão com ESP32](arduino/v2-esp32/README.md)
- [V3 — IoT completo](arduino/v3-iot/README.md)

---

## Equipe

| Nome | Função |
|------|--------|
| | Desenvolvimento de firmware (ESP32) |
| | Desenvolvimento backend (Python) |
| | Desenvolvimento frontend (Dashboard) |
| | Montagem do hardware |
| | Documentação e apresentação |

**Professor orientador:**

---

*Colégio Agrícola — Rede Estadual do Paraná*
*Concurso Agrinho 2026 — AgroRobótica*