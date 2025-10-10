from fastapi import FastAPI
import sqlite3
import json

app = FastAPI()

@app.get("/get_sheep")
def get_sheep():
    conn = sqlite3.connect("sheep.db")
    cur = conn.cursor()
    cur.execute("SELECT count, timestamp FROM sheep_counts ORDER BY id DESC LIMIT 1")
    row = cur.fetchone()
    conn.close()
    if row:
        return {"count": row[0], "timestamp": row[1]}
    else:
        return {"count": 0, "timestamp": None}
