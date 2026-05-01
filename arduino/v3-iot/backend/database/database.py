import sqlite3
from datetime import datetime

INTERVALO = 900


def connect():
    return sqlite3.connect("estufa.db")


def create_tables():
    conn = connect()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dados_estufa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temperatura REAL,
        umidade_ar REAL,
        luminosidade INTEGER,
        umidade_solo_1 INTEGER,
        umidade_solo_2 INTEGER,
        timestamp TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS controle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cooler BOOLEAN,
        water_pump BOOLEAN,
        nutr_pump BOOLEAN,
        timestamp TEXT
    )
    """)

    conn.commit()
    conn.close()


def insert_dados(data):
    conn = connect()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT timestamp FROM dados_estufa 
    ORDER BY id DESC LIMIT 1
    """)
    row = cursor.fetchone()

    agora = datetime.now()

    if row:
        ultimo = datetime.strptime(row[0], "%Y-%m-%d %H:%M:%S")
        diferenca = (agora - ultimo).total_seconds()

        if diferenca < INTERVALO:
            print("Ignorado (menos de 15min)")
            conn.close()
            return

    cursor.execute("""
    INSERT INTO dados_estufa 
    (temperatura, umidade_ar, luminosidade, umidade_solo_1, umidade_solo_2, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data.temperatura,
        data.umidade_ar,
        data.luminosidade,
        data.umidade_solo_1,
        data.umidade_solo_2,
        agora.strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()

    print("Dados salvos!")


def insert_status_obj(status):
    conn = connect()
    cursor = conn.cursor()

    # 🔹 pega último status
    cursor.execute("""
    SELECT cooler, water_pump, nutr_pump, timestamp
    FROM controle 
    ORDER BY id DESC LIMIT 1
    """)

    row = cursor.fetchone()
    agora = datetime.now()

    if row:
        ultimo_status = {
            "cooler": bool(row[0]),
            "water_pump": bool(row[1]),
            "nutr_pump": bool(row[2])
        }

        ultimo_tempo = datetime.strptime(row[3], "%Y-%m-%d %H:%M:%S")
        diferenca = (agora - ultimo_tempo).total_seconds()

        # 🔥 REGRA 1: se não mudou E tempo < intervalo → NÃO salva
        if status == ultimo_status and diferenca < INTERVALO:
            print("Status ignorado (sem mudança e tempo curto)")
            conn.close()
            return

    # 🔹 salva
    cursor.execute("""
    INSERT INTO controle (cooler, water_pump, nutr_pump, timestamp)
    VALUES (?, ?, ?, ?)
    """, (
        status["cooler"],
        status["water_pump"],
        status["nutr_pump"],
        agora.strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()

    print("Status salvo!")
    

def get_last_status():
    conn = connect()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT cooler, water_pump, nutr_pump 
    FROM controle 
    ORDER BY id DESC LIMIT 1
    """)

    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "cooler": bool(row[0]),
            "water_pump": bool(row[1]),
            "nutr_pump": bool(row[2])
        }

    return {
        "cooler": False,
        "water_pump": False,
        "nutr_pump": False
    }

def get_last_data():
    conn = connect()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT temperatura, umidade_ar, luminosidade,
           umidade_solo_1, umidade_solo_2
    FROM dados_estufa
    ORDER BY id DESC LIMIT 1
    """)

    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "temperatura": row[0],
            "umidade_ar": row[1],
            "luminosidade": row[2],
            "umidade_solo_1": row[3],
            "umidade_solo_2": row[4]
        }

    return {
        "temperatura": 0,
        "umidade_ar": 0,
        "luminosidade": 0,
        "umidade_solo_1": 0,
        "umidade_solo_2": 0
    }