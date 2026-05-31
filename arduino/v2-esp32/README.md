# V2 — Expansão com ESP32

## Objetivo

Aumentar a capacidade de monitoramento e controle, aproximando o projeto de uma estufa inteligente completa. A troca do Arduino pelo ESP32 foi a mudança central: mais pinos analógicos, mais velocidade e WiFi disponível para a V3.

---

## O que esta versão adicionou

- Dois sensores capacitivos de solo (mais duráveis e precisos que o resistivo da V1)
- Sensor de luminosidade (LDR) para monitorar a luz disponível para as plantas
- Cooler controlado automaticamente por temperatura (liga acima de 30°C, desliga abaixo de 27°C)
- Bomba de solução nutritiva, além da bomba de água
- Duração da irrigação ajustada dinamicamente pela temperatura (estufa quente → irriga mais tempo)
- Histerese no controle de irrigação (evita liga/desliga rápido)
- Código modular separado em pastas: `sensors/`, `actuators/`, `display/`, `core/`
- Display OLED atualizado mostrando todos os atuadores

---

## Hardware utilizado

> **Instrução:** preencha a coluna *Qtd* após montar o circuito.

| Componente | Qtd | Função nesta versão |
|------------|:---:|---------------------|
| ESP32 Dev Board (30 pinos) | 1 | Microcontrolador principal |
| Sensor DHT11 | 1 | Temperatura e umidade do ar |
| Sensor capacitivo de umidade do solo v2.0 | 1 | Solo — ponto 1 |
| Sensor capacitivo de umidade do solo v2.0 | 1 | Solo — ponto 2 |
| LDR (fotoresistor) | 1 | Luminosidade |
| Resistor 10kΩ | 6 | Divisor de tensão |
| Display OLED 0.96" I2C (SSD1306 128x64) | 1 | Exibe dados localmente |
| Módulo relé 1 canal (5V, ativo em LOW) | 3 | Controla as 3 saídas |
| Mini bomba de água 5V (peristáltica ou submersível) | 1 | Irrigação |
| Mini bomba de água 5V (peristáltica ou submersível) | 1 | Solução nutritiva |
| Cooler / ventilador 5V ou 12V | 2 | Resfriamento da estufa |
| MB102 Módulo de fonte de alimentação | 1 | Alimentação |
| Protoboard | 1 | Montagem |
| Jumpers macho-macho | 9 | Conexões |
| Jumpers macho-fêmea | 18 | Sensores e módulos |
| Jumpers fêmea-fêmea | 12 | Sensores e módulos |
| Mangueiras de silicone | 3m | Água e nutriente |

---

## Mapeamento de pinos (ESP32)

| Pino ESP32 | Componente |
|:----------:|-----------|
| GPIO 34 (ADC) | Sensor de solo 1 |
| GPIO 35 (ADC) | Sensor de solo 2 |
| GPIO 32 (ADC) | LDR |
| GPIO 4 | DHT11 |
| GPIO 21 (SDA) | Display OLED |
| GPIO 22 (SCL) | Display OLED |
| GPIO 26 | Relé — bomba de água |
| GPIO 27 | Relé — bomba de nutriente |
| GPIO 25 | Relé — cooler |

---

## Lógica de controle

### Irrigação (com histerese e tempo dinâmico)

```
Duração da irrigação:
  Temperatura >= 30°C → 7 segundos
  Temperatura <= 20°C → 3 segundos
  Caso contrário     → 5 segundos

Histerese:
  Solo < 35% → irrigationNeeded = true
  Solo > 45% → irrigationNeeded = false

Ciclo:
  Se precisa irrigar e passou o cooldown (10s) → liga bomba por 'duração'
```

### Cooler (histerese simples)

```
Temperatura >= 30°C → liga cooler
Temperatura <= 27°C → desliga cooler
```

### Nutriente

```
Solo < 30% E luz > 2000 → liga bomba de nutriente por 3s
Cooldown de 20s entre acionamentos
```

---

## Dependências (platformio.ini)

```ini
lib_deps =
    olikraus/U8g2
    adafruit/DHT sensor library
```

---

## Limitações desta versão

- Sem backend ou API — dados não são persistidos
- Regras de controle fixas no firmware (limiares hardcoded)
- WiFi disponível no ESP32 mas não utilizado ainda

---

## O que aprendemos aqui

A separação em módulos (`Controller`, `SoilSensor`, `Irrigation`, `DisplayManager`) facilitou muito testar cada parte separadamente. A histerese e o controle por tempo resolveram o problema do liga/desliga rápido que tinha na V1.

---

[← V1](../v1/README.md) | [Voltar ao README principal](../../README.md) | [V3 →](../v3-iot/README.md)