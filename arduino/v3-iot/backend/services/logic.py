def calculate_status(data) -> dict:
    """
    Calcula o estado automático dos atuadores com base nos sensores.

    Regras:
        cooler:
            liga se temperatura > TEMP_MAX
        water_pump:
            liga se média do solo < SOLO_MIN
        nutr_pump:
            desligado (reservado)

    Proteções:
        - Evita erro com dados inválidos
        - Usa valores padrão seguros

    Args:
        data: objeto SensorData

    Returns:
        dict com estado dos atuadores
    """

    # 🔧 CONFIGURAÇÕES (futuro: vir do banco/dashboard)
    TEMP_MAX = 30
    SOLO_MIN = 30

    # 🛡️ Proteção contra dados inválidos
    try:
        temperatura = float(data.temperatura)
        solo_1 = float(data.umidade_solo_1)
        solo_2 = float(data.umidade_solo_2)
    except (TypeError, ValueError):
        print("[LOGIC] Dados inválidos — fallback seguro ativado")
        return {
            "cooler": False,
            "water_pump": False,
            "nutr_pump": False,
        }

    # 📊 Média do solo
    solo_medio = (solo_1 + solo_2) / 2

    # 🤖 Regras
    cooler_on = temperatura > TEMP_MAX
    water_on  = solo_medio < SOLO_MIN

    return {
        "cooler": cooler_on,
        "water_pump": water_on,
        "nutr_pump": False,  # reservado
    }