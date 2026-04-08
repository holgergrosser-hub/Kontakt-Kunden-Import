# Kontakt Import

Kontakte per KI-Texterkennung (Claude) erfassen und an Google Kontakte senden.

## Features

- **KI-Import**: Signatur, Visitenkarte oder beliebigen Text einfügen → Claude erkennt alle Felder automatisch
- **Manuelles Formular**: Alle Felder einzeln bearbeitbar
- **Google Kontakte**: Direkter Export via Google Apps Script

## Setup

### 1. GitHub → Netlify verbinden

1. Repo auf GitHub erstellen und Code pushen
2. In [Netlify](https://app.netlify.com) → "Add new site" → "Import from Git" → GitHub Repo auswählen
3. Build-Settings werden automatisch aus `netlify.toml` geladen

### 2. Anthropic API Key setzen

In Netlify unter **Site settings → Environment variables**:

```
ANTHROPIC_API_KEY = sk-ant-...
```

### 3. Fertig

Die Seite wird automatisch bei jedem Push gebaut und deployed.

## Tech Stack

- Vite + React
- Netlify Functions (Claude API Proxy)
- Google Apps Script (Kontakt-Export)
