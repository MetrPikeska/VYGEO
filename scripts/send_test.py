import requests
import time

url = "https://petrmikeska.cz/vygeo/update.php"

for c in [0, 5, 10, 3, 8]:
    payload = {"timestamp": time.strftime("%Y-%m-%d %H:%M:%S"), "count": c}
    r = requests.post(url, json=payload, timeout=5)
    print(c, r.status_code, r.text)
    time.sleep(2)
