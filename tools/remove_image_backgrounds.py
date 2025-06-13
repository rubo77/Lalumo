#!/usr/bin/env python3
"""
Dieses Skript entfernt Hintergründe von Bildern, indem die Farbe in der oberen 
linken Ecke als Referenz genommen wird. Alle Farben, die innerhalb eines 
gewissen Schwellenwerts dieser Farbe ähneln, werden transparent gesetzt.

Originale werden in einem 'originals'-Verzeichnis gesichert.
"""

import os
import sys
import shutil
from PIL import Image

# Konfiguration
COLOR_THRESHOLD = 30  # Farbähnlichkeits-Schwellenwert (0-255), höher = mehr Toleranz
ORIGINALS_DIR = "images/originals"
PUBLIC_DIR = "../public"  # Basis-Verzeichnis für öffentliche Dateien, relativ zum tools-Verzeichnis

# Liste der zu bearbeitenden Bilder, relativ zum PUBLIC_DIR
ANIMAL_IMAGES = [
    # Positive Bilder
    '/images/1_5_pitches_good_bird_notes.png',
    '/images/1_5_pitches_good_bird.png',
    '/images/1_5_pitches_good_cat.png',
    '/images/1_5_pitches_good_deer.png',
    '/images/1_5_pitches_good_dog.png',
    '/images/1_5_pitches_good_hedgehog.png',
    '/images/1_5_pitches_good_pig.png',
    '/images/1_5_pitches_good_ladybug.png',
    '/images/1_5_pitches_good_sheep.png',
    # Negative Bilder
    '/images/1_5_pitches_bad_bug.png',
    '/images/1_5_pitches_bad_crab.png',
    '/images/1_5_pitches_bad_cat.png',
    '/images/1_5_pitches_bad_crow.png',
    '/images/1_5_pitches_bad_rabbit.png',
    '/images/1_5_pitches_bad_snake.png',
]

def color_distance(c1, c2):
    """Berechnet den Farbabstand zwischen zwei RGB-Farben."""
    return sum(abs(a - b) for a, b in zip(c1, c2))

def backup_original(img_path):
    """Sichert das Originalbild, falls es noch nicht existiert."""
    # Absolute Pfade für Original- und Zieldateien
    orig_abs_path = os.path.join(os.getcwd(), PUBLIC_DIR + img_path)
    backup_dir = os.path.join(os.getcwd(), PUBLIC_DIR, ORIGINALS_DIR)
    backup_file = os.path.join(backup_dir, os.path.basename(img_path))
    
    # Erstelle das Backup-Verzeichnis, falls es nicht existiert
    os.makedirs(os.path.dirname(backup_file), exist_ok=True)
    
    # Kopiere das Original, wenn es noch nicht gesichert wurde
    if not os.path.exists(backup_file):
        print(f"Sichere Original nach {backup_file}...")
        shutil.copy2(orig_abs_path, backup_file)
        return True
    return False

def make_background_transparent(img_path, threshold=COLOR_THRESHOLD):
    """Macht den Hintergrund transparent auf Basis der Farbe oben links."""
    abs_path = os.path.join(os.getcwd(), PUBLIC_DIR + img_path)
    
    try:
        # Öffne das Bild
        img = Image.open(abs_path)
        
        # Konvertiere zu RGBA, falls nicht bereits
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Hole die Farbe vom Pixel oben links (0,0)
        reference_color = img.getpixel((0, 0))[:3]  # RGB ohne Alpha
        
        # Erstelle neue Pixeldaten
        data = img.getdata()
        new_data = []
        
        for item in data:
            # Vergleiche Farbähnlichkeit (ohne Alpha-Kanal)
            if color_distance(item[:3], reference_color) < threshold:
                # Wenn ähnlich, mache transparent
                new_data.append((item[0], item[1], item[2], 0))
            else:
                # Behalte das Original-Pixel
                new_data.append(item)
        
        # Aktualisiere das Bild mit neuen Daten
        img.putdata(new_data)
        
        # Speichere das Ergebnis zurück
        img.save(abs_path)
        return True
        
    except Exception as e:
        print(f"Fehler bei Bild {img_path}: {e}")
        return False

def check_directory():
    """Überprüft, ob das Skript im richtigen Verzeichnis ausgeführt wird."""
    # Das Skript sollte im tools-Verzeichnis ausgeführt werden
    # Prüfe, ob der aktuelle Ordnername 'tools' ist und ob der übergeordnete Ordner existiert
    current_dir = os.path.basename(os.getcwd())
    parent_public_path = os.path.join(os.getcwd(), PUBLIC_DIR)
    
    if current_dir != "tools":
        print(f"FEHLER: Dieses Skript muss aus dem 'tools'-Verzeichnis ausgeführt werden!")
        print(f"Aktuelles Verzeichnis: {os.getcwd()}")
        print("Bitte wechseln Sie in das tools-Verzeichnis und versuchen Sie es erneut.")
        return False
        
    if not os.path.exists(parent_public_path):
        print(f"FEHLER: {parent_public_path} existiert nicht!")
        print("Stellen Sie sicher, dass Sie sich im richtigen tools-Verzeichnis befinden.")
        print("Das Skript erwartet, dass sich '../public' relativ zum tools-Verzeichnis befindet.")
        return False
        
    # Überprüfe, ob mindestens ein Bild aus der Liste im PUBLIC_DIR existiert
    test_image_path = os.path.join(os.getcwd(), PUBLIC_DIR + ANIMAL_IMAGES[0])
    if not os.path.exists(test_image_path):
        print(f"FEHLER: Testbild {test_image_path} nicht gefunden!")
        print("Überprüfen Sie, ob die Bildpfade in ANIMAL_IMAGES korrekt sind.")
        return False
        
    print("Verzeichnisstruktur und Bildpfade ok.")
    return True

def process_all_images():
    """Verarbeitet alle definierten Bilder."""
    print("Starte Bildverarbeitung...")
    
    # Überprüfe, ob das Skript im richtigen Verzeichnis ausgeführt wird
    if not check_directory():
        print("Abbruch aufgrund von Verzeichnisfehlern.")
        return
    
    # Erstelle das Originals-Verzeichnis, falls es nicht existiert
    originals_dir = os.path.join(os.getcwd(), PUBLIC_DIR, ORIGINALS_DIR)
    os.makedirs(originals_dir, exist_ok=True)
    
    success_count = 0
    for img_path in ANIMAL_IMAGES:
        abs_path = os.path.join(os.getcwd(), PUBLIC_DIR + img_path)
        
        # Überprüfe, ob die Datei existiert
        if not os.path.exists(abs_path):
            print(f"Datei nicht gefunden: {abs_path}")
            continue
        
        print(f"Verarbeite {img_path}...")
        
        # Sichere das Original
        backup_original(img_path)
        
        # Mache Hintergrund transparent
        if make_background_transparent(img_path):
            success_count += 1
    
    print(f"\nVerarbeitung abgeschlossen: {success_count} von {len(ANIMAL_IMAGES)} Bilder erfolgreich verarbeitet.")

if __name__ == "__main__":
    # Parameter für Schwellenwert aus Kommandozeile
    if len(sys.argv) > 1:
        try:
            COLOR_THRESHOLD = int(sys.argv[1])
            print(f"Verwende Schwellenwert: {COLOR_THRESHOLD}")
        except ValueError:
            print(f"Ungültiger Schwellenwert, verwende Standard: {COLOR_THRESHOLD}")
    
    process_all_images()
