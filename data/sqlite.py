import sqlite3

conn = sqlite3.connect("ispindel.db")
cur = conn.cursor()

def execute(query):
    try:
        cur.execute(query)
    except sqlite3.OperationalError as e:
        print(f"Error creating table: {e}")

# Batches table
execute("""
    CREATE TABLE IF NOT EXISTS batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT UNIQUE,
        start_date TEXT,
        end_date TEXT,
        liter REAL,
        is_logging INTEGER DEFAULT 0
    )
    """)

execute("""
    CREATE TABLE IF NOT EXISTS readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT NOT NULL,
        gravity REAL,
        temperature REAL,
        battery REAL,
        angle REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        brix REAL GENERATED ALWAYS AS (((182.4601 * gravity - 775.6821) * gravity + 1262.7794) * gravity - 669.5622) STORED
        FOREIGN KEY (batch_id) REFERENCES batches(batch_id)
        ) 
    """)

execute("""
    CREATE TABLE IF NOT EXISTS predicted_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT,
        predicted_brix REAL,
        prediction_time TEXT,
        predicted_for_time TEXT,
        based_on_timestamp TEXT,
        FOREIGN KEY (batch_id) REFERENCES batches(batch_id)
    )
    """)

conn.commit()
conn.close()
print("Database and tables created successfully.")