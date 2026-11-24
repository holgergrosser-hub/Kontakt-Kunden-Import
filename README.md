# Neukunde anlegen (Kontakt Kunden Import)

Eine Seite für den Neukunden: Zuwendungsbescheid (PDF) anhängen, Mail-Absender oder Impressum einfügen, prüfen, anlegen.

## Features

- **Erkennen**: Claude liest Firma, Anschrift, Vorlagefrist und Vorgang aus dem Bescheid und den Ansprechpartner aus dem Text
- **Drei Schritte, einzeln abwählbar**: Kunde im CRM · Kalendertermin · Drive-Ablage
- **Vorschau vor dem Anlegen**: Dubletten im CRM, vorhandener Kundenordner, gefundene Angebots-PDFs aus dem Postfach
- **Kalender**: „[Firma] - wegen Fördergelder abrechnen“ in „QM-Office Termine“, einen Monat vor der Vorlagefrist, Bescheid als Anhang
- **Drive**: Kundenordner unter „QM-Guru Holger“ mit `_Verträge` (Bescheid + Angebote), ohne Freigabe „jeder mit Link“
- Ersetzt die frühere Kalender-App `netlify-calendar-creator`

## Setup

### Lokal entwickeln

1. Abhaengigkeiten installieren:

```bash
npm install
```

2. `.env` oder `.env.local` anlegen und die Werte aus `.env.example` eintragen.

3. Entwicklungsserver starten:

```bash
npm run dev
```

Wichtig: Der KI-Import ruft lokal denselben Pfad `/api/parse-contact` auf wie spaeter in Netlify. Im Entwicklungsserver wird dieser Pfad direkt von Vite bereitgestellt; ohne diese API-Antwort lief der KI-Import lokal vorher auf einen 404.

### 1. GitHub → Netlify verbinden

1. Repo auf GitHub erstellen und Code pushen
2. In [Netlify](https://app.netlify.com) → "Add new site" → "Import from Git" → GitHub Repo auswählen
3. Build-Settings werden automatisch aus `netlify.toml` geladen

### 2. Anthropic API Key setzen

In Netlify unter **Site settings → Environment variables**:

```
ANTHROPIC_API_KEY = sk-ant-...
```

### 3. Google Apps Script bereitstellen

1. Den Code aus `apps-script/Code.gs` in das Apps-Script-Projekt kopieren
2. Dienste → „Calendar API“ hinzufügen, Funktion `testNurLesen` einmal ausführen (Berechtigungen)
3. Web-App bereitstellen (bestehende Bereitstellung → neue Version, URL bleibt gleich)
3. Als Umgebungsvariablen setzen:

```env
VITE_GAS_URL=https://script.google.com/macros/s/.../exec
VITE_GAS_TOKEN=ein-sicheres-token
```

### 4. Fertig

Die Seite wird automatisch bei jedem Push gebaut und deployed.

## Tech Stack

- Vite + React
- Netlify Functions (Claude API Proxy)
- Google Apps Script (Google-Sheet-Export)

## Tabellenzuordnung

CRM Super Master (einzelne Zellen, Formelspalten bleiben unberührt):

- Spalte A: Kundenname
- Spalte C: Webseite
- Spalte D: Telefon
- Spalte I: Mail gesch.
- Spalte J: Mail privat
- Spalte L: Projektleiter
- Spalte P: Ja
- Spalte Q: Nein
- Spalte BS: Straße
- Spalte BW: Ort
- Spalte CA: PLZ
- Spalte DE: Ja · Spalte DF: wie Spalte L · Spalte DS: WAHR (nur wenn die Zelle leer ist)
- Spalte DZ: Termin „Fördergelder abrechnen“ (Vorlagefrist minus 1 Monat)

Blatt „Kontakte“ (nach Spaltenüberschrift): Nachname, Organisation, Anrede, Vorname, Funktion, Telefonnummer, Handynummer, E-Mailadresse, QM = WAHR, PZ/DS = FALSCH, Status = Aktuell.

## Prüfung

Die Backend-Logik ist gegen nachgebaute Tabellen, Drive, Gmail und Kalender geprüft (CRM-Dublette, zweiter Lauf legt nichts doppelt an, nur ein Schritt, alter Formularaufruf).
