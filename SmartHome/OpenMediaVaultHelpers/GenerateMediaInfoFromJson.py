#!/usr/bin/env python3
"""Splitte ein JSON-Array in einzelne JSON-Dateien.

Dieses Skript liest eine Eingabe-JSON-Datei (Array von Objekten) und schreibt
pro Element eine separate Datei in das Verzeichnis `output`.

Benutzung: python GenerateMediaInfoFromJson.py input.json
"""

import sys
import os
import json
import logging
import re


def sanitize(name):
    """Ersetze Umlaute, Leerzeichen und entferne unerlaubte Zeichen.

    Spezielle Regeln:
    - ä -> ae, ö -> oe, ü -> ue, ß -> ss
    - Großbuchstaben werden ähnlich behandelt (Ä->Ae, Ö->Oe, Ü->Ue)
    - Leerzeichen -> Unterstrich
    - Erlaube nur A-Z a-z 0-9 _ - in der finalen Zeichenfolge
    """
    # Transliteration deutscher Umlaute und ß
    trans = {
        'Ä': 'Ae', 'ä': 'ae',
        'Ö': 'Oe', 'ö': 'oe',
        'Ü': 'Ue', 'ü': 'ue',
        'ß': 'ss'
    }
    for k, v in trans.items():
        name = name.replace(k, v)

    # Leerzeichen durch Unterstriche ersetzen
    name = name.replace(' ', '_')

    # Alle sonstigen nicht erlaubten Zeichen entfernen
    return re.sub(r'[^A-Za-z0-9_-]', '', name)


def make_filename(seasonEpisode, episodeName):
    """Erzeuge Dateinamen im Format SxxExx_<episodeName>.json.

    Erwartet `seasonEpisode` (oder `Episode`) als "season.episode", z.B. "1.3".
    """
    season, episode = seasonEpisode.split('.')
    season = int(season)
    episode = int(episode)
    epname = sanitize(episodeName)
    return f"S{season:02d}E{episode:02d}_{epname}.json"


def main():
    # Logging konfigurieren
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
    logger = logging.getLogger(__name__)

    # Kommandozeilen-Argument prüfen
    if len(sys.argv) < 2:
        logger.error("Usage: %s <input.json>", sys.argv[0])
        sys.exit(2)

    input_file = sys.argv[1]
    output_dir = "output"

    logger.info("Start processing")
    logger.info("Input file: %s", input_file)
    logger.info("Output directory: %s", output_dir)

    # Eingabedatei laden
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception:
        logger.exception("Failed to read input file: %s", input_file)
        sys.exit(1)

    total = len(data)
    logger.info("Total entries: %d", total)

    # Zielverzeichnis anlegen
    os.makedirs(output_dir, exist_ok=True)

    # Jedes Objekt einzeln verarbeiten; Fehler pro Eintrag protokollieren,
    # die Verarbeitung aber fortsetzen.
    for idx, obj in enumerate(data, start=1):
        try:
            # Support `Episode` (new prompt) and fallback to legacy `seasonEpisode`
            se = obj.get('Episode', obj.get('seasonEpisode'))
            name = obj['episodeName']
            filename = make_filename(se, name)
            outpath = os.path.join(output_dir, filename)

            # Objekt in separater Datei speichern (UTF-8)
            with open(outpath, 'w', encoding='utf-8') as out:
                json.dump(obj, out, ensure_ascii=False, indent=2)

            # Pro-File-Log (mit Winkelklammern wie im Prompt gewünscht)
            logger.info("[%d/%d] created <%s>", idx, total, filename)
        except Exception:
            logger.exception("Error processing entry %d", idx)

    logger.info("Completed processing %d entries", total)


if __name__ == '__main__':
    main()
