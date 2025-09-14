from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = sqlite3.connect("ispindel.db")
    conn.row_factory = sqlite3.Row  # returns dict-like rows
    return conn

@app.route('/ispindel', methods=['POST'])
def ispindel():
    data = request.get_json(force=True)

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO readings (batch_id, angle, temperature, battery, gravity)
        VALUES (?, ?, ?, ?, ?)
    """, (
        data.get("batch_id", "001"),   # default if not sent
        data["angle"],
        data["temperature"],
        data["battery"],
        data["gravity"]
    ))

    conn.commit()
    conn.close()

    return jsonify({"status": "saved"}), 200

@app.route('/readings/<batch_id>', methods=['GET'])
def get_readings(batch_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM readings WHERE batch_id = ? ORDER BY timestamp", (batch_id,))
    rows = cur.fetchall()
    conn.close()

    return jsonify([dict(row) for row in rows])

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)