# V3 — IoT Completo (ESP32 + Backend + Dashboard)

## Objetivo
Transformar a estufa em solução IoT com monitoramento remoto, histórico e controle manual/automático.

## Componentes da versão
- `esp32/`: firmware de aquisição e atuação.
- `backend/`: API REST em FastAPI + persistência em banco.
- `frontend/`: dashboard web responsivo.

## Principais mudanças
- Substituição do DHT11 por DHT22.
- Remoção do display OLED.
- Entrada de camada de dados e interface web.

## Fluxo de operação
1. ESP32 coleta leituras.
2. API recebe e persiste dados.
3. Serviço de lógica calcula estado automático.
4. Frontend exibe tempo real e histórico.
5. Operador pode alternar para modo manual.

## Limitações atuais
- Endereço da API fixo no frontend/firmware.
- Regras automáticas ainda estáticas (limiares hardcoded).
- Ausência de autenticação/autorização.