import sqlite3

conn = sqlite3.connect("ispindel.db")
cur = conn.cursor()

#Creating the table for the tuba batches
cur.execute("""
CREATE TABLE IF NOT EXISTS batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT UNIQUE,
    start_date TEXT,
    end_date TEXT
)
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id TEXT,
            angle REAL,
            temperature REAL,
            battery REAL,
            gravity REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (batch_id) REFERENCES batches(batch_id)
) 
""")

conn.commit()
conn.close()
print("Database and tables created successfully.")