import requests
url = "https://petrmikeska.cz/vygeo/update.php"
for c in [0,1,2,3,5,7,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]:
    payload = {"timestamp":"2025-09-26 21:00:00","count": c}
    r = requests.post(url, json=payload, timeout=5)
    print(c, r.status_code, r.text)
