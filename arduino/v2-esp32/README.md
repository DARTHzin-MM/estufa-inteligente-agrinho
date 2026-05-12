# V2 — Expansão com ESP32

## Objetivo
Aumentar capacidade de monitoramento e controle, aproximando o projeto de uma estufa inteligente completa.

## Hardware
- ESP32
- 2 sensores capacitivos de solo V2
- DHT11
- LDR
- Display OLED
- Cooler(es)
- 2 bombas (água + solução nutritiva)

## Evoluções em relação à V1
- Mais sensores e atuadores.
- Introdução de lógica com histerese e temporização.
- Estrutura de código mais separada por módulos (sensores, atuadores, controller, display).

## Limitações
- Ainda sem backend/API para persistência remota.
- Regras de controle parcialmente fixas no firmware.

## Ganho arquitetural
A V2 consolida a transição de protótipo para sistema embarcado mais robusto, preparando terreno para IoT na V3.