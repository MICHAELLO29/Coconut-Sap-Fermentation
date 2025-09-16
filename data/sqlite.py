import sqlite3

conn = sqlite3.connect("ispindel.db")
cur = conn.cursor()

#Creating the table for the tuba batches
cur.execute("""
CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT UNIQUE,
    start_date TEXT,
    end_date TEXT,
    liter REAL,
    is_logging INTEGER DEFAULT 0
)
""")

cur.execute("""
CREATE TABLE readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT NOT NULL,
    gravity REAL,
    temperature REAL,
    battery REAL,
    angle REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    brix REAL GENERATED ALWAYS AS (((182.4601 * gravity - 775.6821) * gravity + 1262.7794) * gravity - 669.5622) STORED
) 
""")

conn.commit()
conn.close()
print("Database and tables created successfully.")