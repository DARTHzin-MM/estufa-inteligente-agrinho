def calculate_status(data, regras: dict = None) -> dict:
    """
    Calcula o estado automático dos atuadores com base nos sensores.

    MUDANÇA em relação à versão anterior:
        Antes os limiares TEMP_MAX e SOLO_MIN eram fixos neste arquivo.
        Agora eles chegam via parâmetro `regras`, vindos do banco de dados.
        Isso permite que o dashboard altere as regras por perfil de planta
        sem precisar alterar o código do backend.

    Regras:
        cooler     → liga se temperatura > temp_max
        water_pump → liga se média do solo < solo_min
        nutr_pump  → desligado (reservado para futuro)

    Args:
        data:   objeto SensorData com as leituras do ESP32
        regras: dict com temp_max e solo_min vindos do banco.
                Se None, usa valores padrão seguros.

    Returns:
        dict com estado dos três atuadores
    """

    # Extrai os limiares do dict de regras, ou usa padrão se não vier
    if regras:
        TEMP_MAX = float(regras.get("temp_max", 30.0))
        SOLO_MIN = float(regras.get("solo_min", 30.0))
    else:
        TEMP_MAX = 30.0
        SOLO_MIN = 30.0

    # Proteção contra dados inválidos do ESP32
    try:
        temperatura = float(data.temperatura)
        solo_1      = float(data.umidade_solo_1)
        solo_2      = float(data.umidade_solo_2)
    except (TypeError, ValueError):
        print("[LOGIC] Dados inválidos — fallback seguro ativado")
        return {"cooler": False, "water_pump": False, "nutr_pump": False}

    solo_medio = (solo_1 + solo_2) / 2

    cooler_on = temperatura > TEMP_MAX
    water_on  = solo_medio < SOLO_MIN

    return {
        "cooler":     cooler_on,
        "water_pump": water_on,
        "nutr_pump":  False,
    }