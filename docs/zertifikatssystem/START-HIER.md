# Start hier

Ein Weg, drei Etappen. Nichts davon verändert CRM, Rechnungen oder die alte Zertifikatsverwaltung. Alles landet in einer neuen, eigenen Tabelle.

## Etappe 1: heute, 30 Minuten, nur klicken

1. **Billomat:** Einstellungen → Mitarbeiter → API-Schlüssel erneuern. Den neuen Schlüssel bereithalten (er war im Chat sichtbar).
2. **Google Drive:** Neue leere Tabelle anlegen, Name „OnlineCert Mandantendatei". Aus der Adresszeile die ID kopieren (der lange Teil zwischen `/d/` und `/edit`).
3. **script.google.com:** „Neues Projekt", Name „OnlineCert Backend".
   - Links bei „Dateien" auf **+** → Skript, Name `00_Config`, Inhalt aus `zertifikatssystem/apps-script/00_Config.gs` einfügen. Genauso für `01_Schema` bis `08_Tests` (neun Dateien).
   - Zahnrad „Projekteinstellungen" → Haken bei „Manifestdatei anzeigen" → Datei `appsscript.json` mit dem Inhalt aus dem Repo ersetzen.
4. **Skript-Eigenschaften** (unten in den Projekteinstellungen) eintragen:

| Schlüssel | Woher |
|---|---|
| `MANDANT_SHEET_ID` | ID aus Schritt 2 |
| `CRM_SHEET_ID` | `1FWbeX3YeK9Uidyn9obKJ7z-J-zXX1h5PsXcfk_YHAyU` |
| `ZV2025_SHEET_ID` | `1-eywQwIsvLW5pLLaeluhdNaDUjUEI7Dq7PGrG033YNM` |
| `RECHNUNGEN_SHEET_ID` | `1wykFKD1zc-WNoisghywYRq8Vzovji1APDbtHg4vOlWg` |
| `BILLOMAT_ID` | Ihre Billomat-Subdomain |
| `BILLOMAT_KEY` | neuer Schlüssel aus Schritt 1 |
| `TESTMODUS_MAIL` | Ihre eigene E-Mail-Adresse |
| `BACKOFFICE_MAIL` | Ihre eigene E-Mail-Adresse |

5. Oben Funktion `setupMandantendatei` wählen → **Ausführen** → Berechtigungen bestätigen. Danach `test_alle` ausführen. Im Protokoll (Strg+Enter) muss „ALLE TESTS OK" stehen.

**Ergebnis von Etappe 1:** Die Mandantendatei hat 35 Blätter, das Regelwerk R01 bis R33 steht drin, nichts sendet Mails.

## Etappe 2: morgen, 15 Minuten, nur lesen

1. Funktion `import_zertifikatsverwaltung` ausführen (Standard ist Probelauf, es wird nichts geschrieben).
2. Protokoll kopieren und mir schicken. Darin steht, welche Kunden im CRM gefunden wurden, welche nicht, und welche Adressen oder Postleitzahlen zu korrigieren sind.
3. Wenn die Liste passt: im Editor `import_zertifikatsverwaltung(false)` aufrufen (dazu in `08_Tests.gs` eine Zeile `function import_scharf(){ return import_zertifikatsverwaltung(false); }` anhängen und diese ausführen), danach `statuslauf`.

**Ergebnis von Etappe 2:** Alle 88 Zertifikate und rund 90 Kunden sind im neuen Register, mit Status und öffentlichem Registerblatt.

## Etappe 3: danach, mit mir zusammen

- Phase 1 bauen: Zertifikat-PDF aus Ihrer vorhandenen Docs-Vorlage mit Seite 2 und QR-Code, Verifizierungsseite auf Netlify.
- Dazu brauche ich von Ihnen: die Freigabe der Vorlage zum Ergänzen der Seite 2 (oder Sie kopieren die Vorlage) und die Antwort auf E25 (führende Kundennummer), die sich aus dem Protokoll von Etappe 2 ergibt.

## Wenn etwas hakt

- „Skript-Eigenschaft fehlt": Schlüssel in den Projekteinstellungen prüfen, Schreibweise exakt wie in der Tabelle.
- „CRM: kein Blatt mit Kopfzeile Organisationsname": im CRM muss Zeile 1 des Blatts „super Master" die Spaltennamen enthalten.
- Berechtigungsfenster „Diese App wurde nicht überprüft": „Erweitert" → „Zu OnlineCert Backend wechseln", das ist Ihr eigenes Skript.
- Alles andere: Protokolltext kopieren und mir schicken.

Die ausführliche Fassung steht in [phase-0-umsetzung.md](phase-0-umsetzung.md), der Hintergrund im [Anforderungskatalog](anforderungskatalog.md).
