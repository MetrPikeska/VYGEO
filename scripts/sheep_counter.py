#!/usr/bin/env python3
"""
sheep_counter.py
----------------
Počítání ovcí z HLS streamu pomocí YOLOv8.
- Zobrazuje počet ovcí + FPS.
- Odesílá data na hosting max 1× za N sekund.
- Klávesy:
    P - pauza/spuštění detekce
    R - zapnutí/vypnutí nahrávání
    ESC - konec
"""

import cv2
from ultralytics import YOLO
import time, datetime, requests

# === Konfigurace ===
HLS_STREAM_URL = "https://stream.teal.cz/hls/cam273.m3u8"
MODEL_PATH = "yolov8n.pt"
CONFIDENCE_THRESHOLD = 0.3
UPDATE_URL = "https://petrmikeska.cz/vygeo/api/update.php"
#UPDATE_URL = "http://localhost/vygeo/api/update.php"  # test lokálně
SEND_INTERVAL = 2  # odesílání dat na hosting max 1× za 5s

# === Inicializace ===
print("[INFO] Načítám YOLO model...")
model = YOLO(MODEL_PATH)

print("[INFO] Připojuji se ke streamu...")
cap = cv2.VideoCapture(HLS_STREAM_URL)
if not cap.isOpened():
    raise RuntimeError("Nelze otevřít HLS stream.")

last_sent = 0
paused = False
recording = False
writer = None

# pro výpočet FPS
fps = 0
frame_count = 0
fps_time = time.time()

def send_sheep_count(count):
    """Odešle počet ovcí na hosting (update.php)."""
    data = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "count": count
    }
    try:
        r = requests.post(UPDATE_URL, json=data, timeout=5)
        print("[ODESLÁNO]", data, "=>", r.text)
    except Exception as e:
        print("[CHYBA ODESÍLÁNÍ]", e)

while True:
    ret, frame = cap.read()
    if not ret:
        print("[VAROVÁNÍ] Nelze číst snímek ze streamu.")
        break

    if not paused:
        # Detekce ovcí
        results = model(frame, conf=CONFIDENCE_THRESHOLD, verbose=False)

        sheep_count = 0
        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                if model.names[cls].lower() == "sheep":
                    sheep_count += 1
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(frame, "Ovce", (x1, y1 - 5),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        # Odesílat max 1× za SEND_INTERVAL sekund
        now = time.time()
        if now - last_sent > SEND_INTERVAL:
            send_sheep_count(sheep_count)  # sheep_count nastaveno, pro kotnrolu dat random cislo pro overeni napr. 99
            last_sent = now

        # FPS výpočet
        frame_count += 1
        if time.time() - fps_time >= 1.0:
            fps = frame_count
            frame_count = 0
            fps_time = time.time()

        # Overlay text
        cv2.putText(frame, f"Ovce: {sheep_count}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 165, 255), 2)
        cv2.putText(frame, f"FPS: {fps}", (10, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    else:
        cv2.putText(frame, "PAUZA", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

    # Nahrávání
    if recording:
        if writer is None:
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            filename = datetime.datetime.now().strftime("sheep_%Y%m%d_%H%M%S.mp4")
            writer = cv2.VideoWriter(filename, fourcc, 20.0,
                                     (frame.shape[1], frame.shape[0]))
            print("[INFO] Nahrávání spuštěno:", filename)
        writer.write(frame)
    else:
        if writer is not None:
            writer.release()
            writer = None
            print("[INFO] Nahrávání ukončeno.")

    # Zobrazit
    cv2.imshow("Sheep Counter", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == 27:  # ESC = konec
        break
    elif key == ord("p"):  # pauza
        paused = not paused
    elif key == ord("r"):  # nahrávání
        recording = not recording

cap.release()
if writer is not None:
    writer.release()
cv2.destroyAllWindows()
