# test_db.py
import sqlite3

conn = sqlite3.connect("ispindel.db")
cur = conn.cursor()

# Insert dummy batch, this will send out an active batch that is logging
cur.execute("INSERT OR IGNORE INTO batches (batch_id, start_date, end_date, liter, is_logging) VALUES (?, ?, ?, ?, 1)",
            ("001", "2025-03-20", "2025-03-22", 20.0))

# Insert dummy reading
cur.execute("INSERT INTO readings (batch_id, angle, temperature, battery, gravity, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            ("001", 40.1, 32.3, 4.1, 7.7, "2025-03-20 12:00:00"))

conn.commit()

# Query back
cur.execute("SELECT * FROM readings WHERE batch_id = '001'")
rows = cur.fetchall()
print(rows)

conn.close()