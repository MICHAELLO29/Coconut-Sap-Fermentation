# test_db.py
import sqlite3

conn = sqlite3.connect("ispindel.db")
cur = conn.cursor()

# Insert dummy batch
cur.execute("INSERT OR IGNORE INTO batches (batch_id, start_date, end_date) VALUES (?, ?, ?)",
            ("001", "2025-03-20", "2025-03-22"))

# Insert dummy reading
cur.execute("INSERT INTO readings (batch_id, angle, temperature, battery, gravity) VALUES (?, ?, ?, ?, ?)",
            ("001", 40.1, 32.3, 4.1, 7.7))

conn.commit()

# Query back
cur.execute("SELECT * FROM readings WHERE batch_id = '001'")
rows = cur.fetchall()
print(rows)

conn.close()