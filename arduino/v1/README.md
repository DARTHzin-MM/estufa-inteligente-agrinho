# V1 — Protótipo Inicial (Arduino Uno)

## Objetivo

Primeira automação local de irrigação para validar o conceito da estufa inteligente. O objetivo desta etapa foi confirmar que conseguíamos ler sensores corretamente, acionar uma bomba com base nos dados e exibir as informações em um display — tudo de forma integrada, sem internet.

---

## O que esta versão fez

- Lê a umidade do solo e decide quando irrigar (liga bomba quando < 40%, desliga quando > 60%)
- Lê temperatura e umidade do ar com o sensor DHT11
- Exibe todos os valores no display OLED em tempo real
- Mostra no display o status da irrigação: `IRRIGANDO`, `SOLO SECO`, `SOLO MOLHADO` ou `UMIDADE IDEAL`
- Toda a lógica roda localmente no Arduino, sem internet

---

## Hardware utilizado

| Componente | Qtd | Função nesta versão |
|------------|:---:|---------------------|
| Arduino Uno | 1 | Microcontrolador principal |
| Sensor DHT11 | 1 | Temperatura e umidade do ar |
| Sensor de umidade do solo resistivo | 1 | Decide quando irrigar |
| Display OLED 0.96" I2C (SSD1306 128x64) | 1 | Exibe todos os dados localmente |
| Módulo relé 1 canal (5V) | 1 | Liga/desliga a bomba d'água |
| Mini bomba de água 5V | 1 | Irrigação |
| Fonte / carregador 5V | 1 | Alimentação do Arduino |
| Protoboard | 1 | Montagem do circuito |
| Jumpers | 20 | Conexões |
| Mangueira de silicone | 1m | Leva a água da bomba ao solo |

---

## Mapeamento de pinos

| Pino Arduino | Componente |
|:------------:|-----------|
| D2 | DHT11 (dados) |
| A0 | Sensor de solo (analógico) |
| D7 | Relé (bomba de água) |
| A4 (SDA) | Display OLED |
| A5 (SCL) | Display OLED |

---

## Lógica de irrigação

```
Se umidade_solo == -1 (sensor não detectado):
    → Desliga bomba, exibe "IRRIG: ND"

Se umidade_solo < 40% e passaram 10s desde a última ação:
    → Liga bomba

Se irrigando e umidade_solo > 60% e passaram 5s:
    → Desliga bomba
```

A espera de 5–10 segundos evita que o sistema ligue e desligue rapidamente em leituras instáveis do sensor (debounce por tempo).

---

## Dependências (platformio.ini)

```ini
lib_deps =
  olikraus/U8g2
  beegee-tokyo/DHT sensor library for ESPx
```

---

## Limitações desta versão

- Sem histórico de dados
- Sem acesso remoto — tudo local
- Um único sensor de solo
- Sensor DHT11 com precisão limitada (±2°C, ±5% umidade)
- Sensor de solo **resistivo** — susceptível à oxidação dos eletrodos com o tempo
- Código funcional, mas não modular — toda a lógica em arquivos separados por função sem orientação a objetos

---

## O que aprendemos aqui

A V1 confirmou que a integração entre sensores, relé e display funciona. Identificamos dois problemas importantes:

1. **Sensor resistivo de solo**: muito sensível a variações e oxidação dos eletrodos — motivou a troca para sensores **capacitivos** na V2.
2. **Falta de modularidade**: dificultou a adição de novos sensores e atuadores — motivou a refatoração em classes na V2.

---

[← Voltar ao README principal](../../README.md) | [V2 →](../v2-esp32/README.md)