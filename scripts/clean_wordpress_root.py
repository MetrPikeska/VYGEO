#!/usr/bin/env python3
"""
Script pro vyčištění rootu WordPressu od VYGEO souborů
"""

from ftplib import FTP
import sys

# FTP připojení (z sftp.json)
HOST = "383750.w50.wedos.net"
USERNAME = "w383750_main"
PASSWORD = "A9TG3MS5"

# Soubory a adresáře k smazání
FILES_TO_DELETE = [
    "index.html",
    "visual.css"
]

DIRS_TO_DELETE = [
    "css",
    "js",
    "assets",
    "api",
    "data",
    "tiles",
    "snow_calc",
    "wet-bulb-calculator"
]

def delete_file(ftp, filename):
    """Smaže soubor na FTP"""
    try:
        ftp.delete(filename)
        print(f"✓ Smazán soubor: {filename}")
        return True
    except Exception as e:
        print(f"✗ Chyba při mazání souboru {filename}: {e}")
        return False

def delete_directory(ftp, dirname):
    """Smaže adresář a jeho obsah na FTP"""
    try:
        # Zkusíme smazat soubory v adresáři
        ftp.cwd(dirname)
        files = []
        ftp.retrlines('LIST', files.append)
        
        for file in files:
            filename = file.split()[-1]
            if file.startswith('d'):  # Adresář
                delete_directory(ftp, filename)
            else:  # Soubor
                ftp.delete(filename)
        
        # Vrať se zpět
        ftp.cwd('..')
        
        # Smaž prázdný adresář
        ftp.rmd(dirname)
        print(f"✓ Smazán adresář: {dirname}")
        return True
    except Exception as e:
        print(f"✗ Chyba při mazání adresáře {dirname}: {e}")
        return False

def main():
    print("=" * 60)
    print("Vyčištění rootu WordPressu od VYGEO souborů")
    print("=" * 60)
    print()
    print("⛔ VAROVÁNÍ: Tento script smaže soubory z rootu WordPressu!")
    print()
    
    response = input("Opravdu chcete pokračovat? (ano/ne): ")
    if response.lower() != "ano":
        print("Zrušeno.")
        return
    
    try:
        # Připoj se k FTP
        print("\n🔌 Připojuji se k FTP...")
        ftp = FTP(HOST)
        ftp.login(USERNAME, PASSWORD)
        print("✓ Připojeno.")
        
        # Jdi do rootu
        ftp.cwd('/')
        
        # Smaž soubory
        print("\n📄 Mazání souborů...")
        for filename in FILES_TO_DELETE:
            delete_file(ftp, filename)
        
        # Smaž adresáře
        print("\n📁 Mazání adresářů...")
        for dirname in DIRS_TO_DELETE:
            delete_directory(ftp, dirname)
        
        # Ukonči připojení
        ftp.quit()
        
        print("\n" + "=" * 60)
        print("✓ Hotovo! Root WordPressu byl vyčištěn.")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Chyba: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

