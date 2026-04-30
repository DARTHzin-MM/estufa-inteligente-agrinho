def calculate_status(data):
    # média dos sensores de solo
    solo_medio = (data.umidade_solo_1 + data.umidade_solo_2) / 2

    # regras
    water_pump = solo_medio < 30
    cooler = data.temperatura > 30
    nutr_pump = False

    return {
        "cooler": cooler,
        "water_pump": water_pump,
        "nutr_pump": nutr_pump
    }