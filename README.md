# Kontakt Kunden Import

Kontaktdaten per KI-Texterkennung oder manuell erfassen und als neue Zeile in Google Sheets speichern.

## Features

- **KI-Import**: Signatur, Visitenkarte oder beliebigen Text einfügen → Claude erkennt die wichtigsten Felder automatisch
- **Manuelles Formular**: Alle Felder einzeln bearbeitbar
- **Projektleiter-Auswahl**: Direkte Zuordnung zu Eudys, Stephan, Nina oder Holger
- **Google Sheets Export**: Schreibt jede Eingabe als neue Zeile in die Zieltabelle

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

1. In `apps-script/Code.gs` den Code in ein neues Apps-Script-Projekt kopieren
2. Web-App bereitstellen
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

Die Apps-Script-Datei schreibt folgende Felder in die Zieltabelle:

- Spalte A: Kundenname
- Spalte C: Webseite
- Spalte D: Telefon
- Spalte I: Mail gesch.
- Spalte J: Mail privat
- Spalte L: Projektleiter
- Spalte P: Nein
- Spalte Q: Nein
- Spalte BS: Straße
- Spalte BW: Ort
- Spalte CA: PLZ
- Spalte DZ: aktuelles Datum minus 1 Monat
- Spalte DS: WAHR
- Spalte DE: Ja
- Spalte DF: wie Spalte L
