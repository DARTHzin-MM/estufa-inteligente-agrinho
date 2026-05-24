def calculate_status(data, regras: dict = None) -> dict:
    """
    Calcula o estado automático dos atuadores com base nos sensores.

    Regras:
        cooler     → liga se temperatura > temp_max
        water_pump → liga se média do solo < solo_min E reservatório tem água
        nutr_pump  → bloqueado se reservatório de nutriente vazio

    Proteção de reservatório vazio:
        Se nivel_agua = False, a bomba de água é bloqueada mesmo que o solo
        esteja seco. Isso evita que a bomba opere a seco e queime o motor.
        O dashboard exibirá alerta "Reservatório vazio".

    Args:
        data:   objeto SensorData com as leituras do ESP32
        regras: dict com temp_max e solo_min vindos do banco.
                Se None, usa valores padrão seguros.

    Returns:
        dict com estado dos três atuadores e nível dos reservatórios
    """

    # Extrai limiares do dict de regras ou usa padrão
    if regras:
        TEMP_MAX = float(regras.get("temp_max", 30.0))
        SOLO_MIN = float(regras.get("solo_min", 30.0))
    else:
        TEMP_MAX = 30.0
        SOLO_MIN = 30.0

    # Proteção contra dados inválidos
    try:
        temperatura     = float(data.temperatura)
        solo_1          = float(data.umidade_solo_1)
        solo_2          = float(data.umidade_solo_2)
        nivel_agua      = bool(getattr(data, 'nivel_agua', True))
        nivel_nutriente = bool(getattr(data, 'nivel_nutriente', True))
    except (TypeError, ValueError):
        print("[LOGIC] Dados inválidos — fallback seguro ativado")
        return {
            "cooler": False, "water_pump": False, "nutr_pump": False,
            "nivel_agua": True, "nivel_nutriente": True,
        }

    solo_medio = (solo_1 + solo_2) / 2

    # Lógica principal
    cooler_on = temperatura > TEMP_MAX

    # ⚠️ Bloqueia a bomba de água se o reservatório estiver vazio
    water_on = (solo_medio < SOLO_MIN) and nivel_agua

    # nutr_pump: reservado para expansão futura
    # Mantido False por enquanto para não acionar sem controle de tempo
    nutr_on = False

    if not nivel_agua:
        print(f"[LOGIC] ⚠️ Bomba de água BLOQUEADA — reservatório vazio (solo={solo_medio:.1f}%)")

    return {
        "cooler":          cooler_on,
        "water_pump":      water_on,
        "nutr_pump":       nutr_on,
        "nivel_agua":      nivel_agua,
        "nivel_nutriente": nivel_nutriente,
    }