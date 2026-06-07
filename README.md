# 🌿 SmartGreen — Estufa Inteligente

> **Concurso Agrinho 2026 — Categoria Robótica**
> Tema: *Agro forte, futuro sustentável: equilíbrio entre produção e meio ambiente*
> Subcategoria 2 — Ensino Médio | C E C M DR GENEROSO MARQUES — Rede Estadual do Paraná

---

## Sobre o projeto

O SmartGreen é um sistema de automação agrícola desenvolvido para monitorar e controlar o ambiente de uma estufa de forma inteligente e sustentável. O projeto nasceu da observação de um problema real: produtores que cultivam em estufas frequentemente desperdiçam água por irrigar sem controle e perdem produção por não detectar variações de temperatura e umidade a tempo.

A resposta do SmartGreen é automatizar essas decisões: irrigar **apenas quando o solo está seco**, acionar o resfriamento **somente quando a temperatura excede o limite**, bloquear as bombas **quando o reservatório esvazia** e adaptar todos os parâmetros automaticamente **conforme a espécie cultivada** — tudo monitorado remotamente pelo navegador.

O sistema foi desenvolvido em três versões progressivas ao longo do projeto, partindo de um protótipo local com Arduino até chegar a uma solução IoT completa com ESP32, backend em Python e dashboard web.

---

## Relevância para o tema do concurso

O SmartGreen contribui diretamente para o equilíbrio entre produção e meio ambiente:

| Impacto | Como o sistema resolve |
|---------|----------------------|
| **Redução do desperdício de água** | Irrigação acionada apenas quando a umidade do solo cai abaixo do limiar configurado para a planta cultivada |
| **Eficiência energética** | Cooler e bombas ligam somente quando necessário — não ficam operando continuamente |
| **Adaptação por cultura** | Perfis de 20 plantas brasileiras ajustam automaticamente os limiares de irrigação e resfriamento |
| **Proteção dos equipamentos** | Sensores de nível XKC-Y26 bloqueiam automaticamente as bombas quando o reservatório esvazia, prevenindo queima do motor |
| **Tomada de decisão baseada em dados** | Histórico completo exportável em CSV permite ao produtor identificar padrões e otimizar o manejo |
| **Tecnologia acessível** | Construído com componentes de baixo custo e software 100% aberto, replicável por pequenos produtores |

---

## Evolução do projeto — três versões progressivas

| Versão | Plataforma | Foco principal | Novidade introduzida |
|--------|-----------|----------------|----------------------|
| [V1](arduino/v1/README.md) | Arduino Uno | Protótipo local de irrigação | Leitura de sensores, relé, display OLED |
| [V2](arduino/v2-esp32/README.md) | ESP32 | Lógica embarcada robusta | 2 sensores de solo, LDR, cooler, nutriente, histerese |
| [V3](arduino/v3-iot/README.md) | ESP32 + Backend + Dashboard | Sistema IoT completo | WiFi, API REST, SQLite, dashboard web, perfis de plantas, sensores de nível, guia de nutrição |

---

## Arquitetura — V3 (versão final)

```
┌──────────────┐       POST /dados        ┌───────────────────┐
│    ESP32     │ ───────────────────────► │  Backend FastAPI  │
│  (sensores)  │   {dados + nível res.}   │  (Python + SQLite)│
│  (relés)     │ ◄─────────────────────── │                   │
└──────────────┘       GET /status        └────────┬──────────┘
                                                   │ GET /dados
                                                   │ GET /status
                                                   │ GET /historico
                                                   │ GET /historico/export (CSV)
                                                   ▼
                                          ┌──────────────────────────┐
                                          │     Dashboard Web        │
                                          │  Home · Histórico        │
                                          │  Plantas · Nutrição      │
                                          │  Controle                │
                                          └──────────────────────────┘
```

**Fluxo de operação:**
1. ESP32 lê os 5 sensores + 2 sensores de nível a cada 5 segundos
2. Envia os dados para `POST /dados` no backend
3. Backend calcula o estado dos atuadores — bloqueia bomba se reservatório vazio
4. ESP32 consulta `GET /status` e aciona os relés correspondentes
5. Dashboard exibe dados em tempo real, histórico e alertas
6. Operador seleciona o perfil da planta cultivada — limiares se atualizam instantaneamente

---

## Estrutura do repositório

```
SmartGreen/
├── arduino/
│   ├── v1/                     # Protótipo inicial (Arduino + OLED)
│   ├── v2-esp32/               # Versão expandida com ESP32
│   └── v3-iot/
│       ├── esp32/              # Firmware (C++ / PlatformIO)
│       ├── backend/            # API REST (Python / FastAPI / SQLite)
│       └── frontend/           # Dashboard web (HTML + CSS + JS)
├── docs/                       # Esquemas elétricos e imagens
├── hardware/                   # Lista de componentes
└── README.md                   # Este arquivo
```

---

## Hardware — V3 (versão final)

### Microcontrolador

| Componente | Qtd | Função no projeto |
|------------|:---:|-------------------|
| ESP32 Dev Board (38 pinos) | 1 | Microcontrolador principal — WiFi, sensores, relés |
| Cabo Micro USB | 1 | Upload do firmware |
| Fonte 5V / adaptador | 1 | Alimentação em campo |

### Sensores

| Componente | Qtd | Função no projeto |
|------------|:---:|-------------------|
| Sensor DHT22 | 1 | Temperatura e umidade do ar (±0,5°C, ±2%) |
| Sensor capacitivo de umidade do solo v2.0 | 2 | Umidade do solo — pontos 1 e 2 |
| LDR (fotoresistor) + resistor 10kΩ | 1 | Luminosidade ambiente |
| Sensor de nível XKC-Y26 NPN | 2 | Nível dos reservatórios de água e nutrientes |
| Resistor 10kΩ + 20kΩ | 2 pares | Divisor de tensão obrigatório para o XKC-Y26 |

### Atuadores

| Componente | Qtd | Função no projeto |
|------------|:---:|-------------------|
| Módulo relé 3 canais (5V, ativo em LOW) | 1 | Controla bomba de água, bomba de nutrientes e cooler |
| Mini bomba de água submersível 5V | 1 | Irrigação das plantas |
| Mini bomba de água 5V | 1 | Distribuição de solução nutritiva |
| Cooler / ventilador 12V | 1 | Resfriamento da estufa |

### Estrutura física (construída pela equipe)

| Item | Material | Função |
|------|---------|--------|
| Corpo da estufa | Garrafas PET e pote plástico | Estrutura principal do cultivo |
| Reservatório de água | Pote/recipiente plástico | Armazena a água de irrigação |
| Reservatório de nutrientes | Pote/recipiente plástico | Armazena a solução nutritiva |

### Conexões e infraestrutura

| Componente | Qtd |
|------------|:---:|
| Protoboard 830 pontos | 1 |
| Jumpers macho-macho | 20 |
| Jumpers macho-fêmea | 10 |
| Mangueira de silicone (metro) | 1 |
| Computador / notebook (servidor local) | 1 |
| Roteador WiFi | 1 |

---

## Funcionalidades principais

- Monitoramento contínuo de temperatura, umidade do ar, luminosidade e dois pontos de umidade do solo
- Irrigação automática com histerese — liga quando o solo seca, desliga quando atinge o nível ideal
- Resfriamento automático quando a temperatura ultrapassa o limite configurado
- **Proteção de reservatório vazio** — bomba bloqueada automaticamente quando o XKC-Y26 não detecta líquido
- **Cards de nível** no dashboard com alerta visual e pulsação quando o reservatório está vazio
- Dashboard com gráfico em tempo real com 4 datasets (temperatura, umidade do ar, solo 1 e solo 2)
- Toggles no gráfico para mostrar/ocultar cada dataset individualmente
- Histórico por período (dia/semana/mês) com exportação direta em CSV
- **Aba Nutrição** com guia completo de 6 fórmulas de solução nutritiva e tabela de uso por cultura
- **Perfis de 20 plantas brasileiras** com parâmetros ideais e atualização automática dos limiares
- Modo manual para controle direto dos atuadores pelo dashboard
- Tema claro/escuro com preferência salva no navegador
- Indicador de dado atrasado — badge vermelho se o ESP32 parar de enviar
- Notificações visuais (toast) quando a API fica offline

---

## Como executar

### Pré-requisitos

- Python 3.10+
- PlatformIO (CLI ou extensão do VS Code)
- Navegador moderno (Chrome, Firefox, Edge)

### 1. Backend

```bash
cd arduino/v3-iot/backend
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
.venv\Scripts\activate           # Windows
pip install fastapi uvicorn sqlalchemy pydantic
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Dashboard

Abra `arduino/v3-iot/frontend/index.html` com Live Server (VS Code). Ajuste o IP da API no canto superior direito do dashboard.

### 3. Firmware ESP32

```bash
cd arduino/v3-iot/esp32/Estufa-Inteligente
# Edite src/api/api_client.cpp → ajuste serverURL com o IP do backend
pio run --target upload
pio device monitor --baud 115200
```

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
- [V3 — IoT completo (versão final)](arduino/v3-iot/README.md)
- [Esquema elétrico](docs/esquema-eletrico.png)
- [Lista completa de componentes](hardware/componentes.md)

---

## Equipe

| Nome | Função |
|------|--------|
| Matheus de Paula Martins | Desenvolvimento de firmware (ESP32) e backend |
| Pietro Barbosa dos Santos | Montagem do hardware e esquemas elétricos |
| Ana Luiza Nardoni Bosco | Design e Produção da Apresentação |
| Hillary Kauany da Silva Vitoriano | Construção da Estrutura Física da Estufa |

**Professor orientador:** Emilia
**Instituição:** C E C M DR GENEROSO MARQUES — Rede Estadual do Paraná
**Concurso:** Agrinho 2026 — Categoria Robótica — Subcategoria 2 (Ensino Médio)

---

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE) para mais informações.