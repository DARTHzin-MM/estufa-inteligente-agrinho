import sqlite3
from datetime import datetime, timedelta

INTERVALO = 900


def connect() -> sqlite3.Connection:
    return sqlite3.connect("estufa.db", check_same_thread=False)


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

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY,
        modo_manual BOOLEAN DEFAULT 0,
        cooler_manual BOOLEAN DEFAULT 0,
        water_pump_manual BOOLEAN DEFAULT 0,
        nutr_pump_manual BOOLEAN DEFAULT 0
    )
    """)

    # Índice para performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_timestamp ON dados_estufa(timestamp)")

    cursor.execute("INSERT OR IGNORE INTO config (id) VALUES (1)")

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
        if (agora - ultimo).total_seconds() < INTERVALO:
            print("[DB] Dados ignorados — intervalo não atingido")
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


def insert_status_obj(status: dict):
    conn = connect()
    cursor = conn.cursor()

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
            "nutr_pump": bool(row[2]),
        }

        ultimo_tempo = datetime.strptime(row[3], "%Y-%m-%d %H:%M:%S")
        diferenca = (agora - ultimo_tempo).total_seconds()

        if (
            status["cooler"] == ultimo_status["cooler"] and
            status["water_pump"] == ultimo_status["water_pump"] and
            status["nutr_pump"] == ultimo_status["nutr_pump"] and
            diferenca < INTERVALO
        ):
            print("[DB] Status ignorado — sem mudança")
            conn.close()
            return

    cursor.execute("""
        INSERT INTO controle (cooler, water_pump, nutr_pump, timestamp)
        VALUES (?, ?, ?, ?)
    """, (
        int(status["cooler"]),
        int(status["water_pump"]),
        int(status["nutr_pump"]),
        agora.strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()


def get_last_status() -> dict:
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
            "nutr_pump": bool(row[2]),
        }

    return {"cooler": False, "water_pump": False, "nutr_pump": False}


def get_last_data() -> dict:
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
            "umidade_solo_2": row[4],
        }

    return {
        "temperatura": 0,
        "umidade_ar": 0,
        "luminosidade": 0,
        "umidade_solo_1": 0,
        "umidade_solo_2": 0,
    }


def get_historico(periodo: str) -> list:
    periodos = {
        "dia": timedelta(days=1),
        "semana": timedelta(days=7),
        "mes": timedelta(days=30),
    }

    delta = periodos.get(periodo, timedelta(days=1))
    inicio = (datetime.now() - delta).strftime("%Y-%m-%d %H:%M:%S")

    conn = connect()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT temperatura, umidade_ar, luminosidade,
               umidade_solo_1, umidade_solo_2, timestamp
        FROM dados_estufa
        WHERE timestamp >= ?
        ORDER BY timestamp ASC
    """, (inicio,))

    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "temperatura": r[0],
            "umidade_ar": r[1],
            "luminosidade": r[2],
            "umidade_solo_1": r[3],
            "umidade_solo_2": r[4],
            "timestamp": r[5],
        }
        for r in rows
    ]


def get_config() -> dict:
    conn = connect()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT modo_manual, cooler_manual, water_pump_manual, nutr_pump_manual
        FROM config WHERE id = 1
    """)
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "modo_manual": bool(row[0]),
            "cooler": bool(row[1]),
            "water_pump": bool(row[2]),
            "nutr_pump": bool(row[3]),
        }

    return {"modo_manual": False, "cooler": False, "water_pump": False, "nutr_pump": False}


def set_manual_control(data: dict):
    conn = connect()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE config SET
            modo_manual = ?,
            cooler_manual = ?,
            water_pump_manual = ?,
            nutr_pump_manual = ?
        WHERE id = 1
    """, (
        int(data["modo_manual"]),
        int(data["cooler"]),
        int(data["water_pump"]),
        int(data["nutr_pump"]),
    ))

    conn.commit()
    conn.close()