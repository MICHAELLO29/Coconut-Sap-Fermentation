from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # Allow React app

def get_db_connection():
    conn = sqlite3.connect("ispindel.db")
    conn.row_factory = sqlite3.Row  # returns dict-like rows
    return conn

# Convert gravity to Brix (for in-memory preview only)
def gravity_to_brix(gravity: float) -> float:
    if gravity is None:
        return None
    return (((182.4601 * gravity - 775.6821) * gravity + 1262.7794) * gravity - 669.5622)

# Get next batch ID
def get_next_batch_id():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT MAX(id) FROM batches")
    row = cur.fetchone()
    conn.close()

    next_id = (row[0] + 1) if row[0] else 1
    return str(next_id).zfill(3)

# iSpindel logging
latest_reading = None  # keep in memory preview of latest reading

@app.route("/ispindel", methods=["POST"])
def ispindel():
    global latest_reading
    data = request.get_json(force=True)

    # Store in-memory preview
    latest_reading = {
        "angle": data.get("angle"),
        "gravity": data.get("gravity"),
        "brix": gravity_to_brix(data.get("gravity")),
        "temperature": data.get("temperature"),
        "timestamp": datetime.now().isoformat(),
        "battery": data.get("battery")
    }

    try:
        # Only insert into DB if logging is active
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT batch_id FROM batches WHERE is_logging = 1 ORDER BY id DESC LIMIT 1")
        active_batch = cur.fetchone()

        if active_batch:
            cur.execute("""
                INSERT INTO readings (batch_id, angle, gravity, temperature, timestamp, battery)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                active_batch[0],
                latest_reading["angle"],
                latest_reading["gravity"],
                latest_reading["temperature"],
                latest_reading["timestamp"],
                latest_reading["battery"]
            ))
            conn.commit()

    except sqlite3.OperationalError as e:
        print("DB error:", e)
        return jsonify({"status": "db_locked"}), 500
    
    finally:
            conn.close()

    return jsonify({"status": "received"})

@app.route("/preview_reading", methods=["GET"])
def preview_reading():
    if latest_reading:
        return jsonify(latest_reading)
    else:
        return jsonify({"message": "No data yet"}), 200

# Readings endpoints
@app.route('/readings/<batch_id>', methods=['GET'])
def get_readings(batch_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM readings WHERE batch_id = ? ORDER BY timestamp", (batch_id,))
    rows = cur.fetchall()
    conn.close()

    return jsonify([dict(row) for row in rows])

# Batch management
@app.route('/create_batch', methods=['POST'])
def create_batch():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM batches WHERE is_logging = 1 LIMIT 1")
    if cur.fetchone():
        conn.close()
        return jsonify({"error": "A batch is already active"}), 400
    conn.close()

    data = request.get_json(force=True)
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    liter = data.get("liter")

    conn = get_db_connection()
    cur = conn.cursor()

    # Determine next batch_id from autoincrement id
    next_batch_id = get_next_batch_id()

    # Insert batch with correct padded batch_id
    cur.execute("""
        INSERT INTO batches (batch_id, start_date, end_date, is_logging, liter)
        VALUES (?, ?, ?, 1, ?)
    """, (next_batch_id, start_date, end_date, liter))
    conn.commit()

    conn.close()

    return jsonify({"status": "batch_created", "batch_id": next_batch_id})

@app.route('/stop_batch/<batch_id>', methods=['POST'])
def stop_batch(batch_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE batches SET is_logging = 0 WHERE batch_id = ?", (batch_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "batch_stopped", "batch_id": batch_id})

@app.route('/check_connection/<batch_id>', methods=['GET'])
def check_connection(batch_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT timestamp, gravity, temperature
        FROM readings
        WHERE batch_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    """, (batch_id,))
    row = cur.fetchone()
    conn.close()

    if row:
        return jsonify({
            "status": "connected",
            "last_reading": dict(row)
        })
    else:
        return jsonify({"status": "not_connected"})
    
@app.route("/next_batch_id", methods=["GET"])
def next_batch_id():
    return jsonify({"next_batch_id": get_next_batch_id()})

@app.route("/latest_readings", methods=["GET"])
def latest_readings():
    conn = get_db_connection()
    cur = conn.cursor()

    # Get latest row from readings
    cur.execute("""
        SELECT angle, gravity, brix, temperature
        FROM readings
        ORDER BY timestamp DESC
        LIMIT 1
    """)
    row = cur.fetchone()

    # Get next batch id from 'id'
    next_batch_id = get_next_batch_id()

    if row:
        angle, gravity, brix, temperature = row
    else:
        # No readings yet → send empty values
        angle = gravity = brix = temperature = None

    return jsonify({
        "batch_id": next_batch_id,
        "angle": angle,
        "sg": gravity,
        "brix": brix,
        "temperature": temperature
    })

@app.route("/active_batch", methods=["GET"])
def active_batch():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM batches WHERE is_logging = 1 ORDER BY id DESC LIMIT 1"
    ) 
    row = cur.fetchone()
    conn.close()

    if row:
        return jsonify({"active": True, "batch_id": row[0]})
    else:
        return jsonify({"active": False})
    
@app.route("/active_batches_list", methods=["GET"])
def active_batches():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT batch_id, start_date, end_date
        FROM batches
        WHERE is_logging = 1
    """)
    rows = cur.fetchall()
    conn.close()

    # Return as JSON list
    return jsonify([{
        "id": row["batch_id"],
        "startDate": row["start_date"],
        "endDate": row["end_date"]
    } for row in rows])


@app.route("/check_active/<batch_id>", methods=["GET"])
def check_active(batch_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT is_logging FROM batches WHERE batch_id = ?", (batch_id,))
    row = cur.fetchone()
    conn.close()

    if row and row[0] == 1:
        return jsonify({"active": True})
    else:
        return jsonify({"active": False})

@app.route('/get_batches_list', methods=['GET'])
def get_batches_list():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT batch_id, start_date, end_date, liter, is_logging
        FROM batches
        ORDER BY id DESC
    """)
    rows = cur.fetchall()

    batches = []
    for row in rows:
        batches.append({
            "id": str(row["batch_id"]).zfill(3),
            "startDate": row["start_date"],
            "endDate": row["end_date"],
            "liter": row["liter"],
            "is_logging": row["is_logging"],
            #  brix, ph, alcohol, etc. is not yet reflected, TBA
        })

    conn.close()
    return jsonify(batches)

@app.route("/get_liter_chart", methods=["GET"])
def get_liter_chart():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT strftime('%Y-%m', start_date) AS month, SUM(liter) AS total_liters
        FROM batches
        WHERE liter IS NOT NULL
        GROUP BY month
        ORDER BY month ASC
    """)
    rows = cur.fetchall()
    conn.close()

   
    return jsonify([{"month": row["month"], "total_liters": row["total_liters"]} for row in rows])
# Start server
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000)