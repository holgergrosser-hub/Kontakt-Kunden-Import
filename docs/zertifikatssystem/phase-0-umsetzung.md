# Phase 0: Fundament (Apps-Script-Grundgerüst)

Stand: 18.09.2026 · Code unter `zertifikatssystem/apps-script/` · Version 0.1.0

Phase 0 liefert das lauffähige Backend-Gerüst aus Katalog Kapitel 7: Datenmodell, Nummernvergabe mit Prüfziffer, Regelwerk R01 bis R33 mit Probelauf, Statuslauf mit öffentlichem Register, Verifizierungs-Endpunkt, Tagesliste und die drei Importläufe (nur lesend, Probelauf zuerst). Es schreibt in eine **eigene Mandantendatei** und liest CRM, Zertifikatsverwaltung_2025 und „Rechnungen QM" nur.

## 1. Dateien

| Datei | Inhalt |
|---|---|
| `appsscript.json` | Manifest (Europe/Berlin, V8, Berechtigungen) |
| `00_Config.gs` | Skript-Eigenschaften lesen (keine Geheimnisse im Code), Prüffunktion |
| `01_Schema.gs` | Alle Blätter und Spalten der Mandantendatei (Katalog 6.2 + Runde 3), Statuswerte |
| `02_Lib.gs` | Header-basierter Zugriff, `LockService`-Zähler, Luhn-Prüfziffer, Historie, Log, Datum, Token, Hash |
| `03_Nummern.gs` | Nummernkreise: `OC-2026-00001-7`, `K-00001`, `AN-/AU-/AD-/ZE-/AB-2026-0001`; Prüfung einer Nummer |
| `04_Setup.gs` | `setupMandantendatei()` legt Blätter und Stammdaten an (Mandanten OC/QMG, Normen 9001/14001/45001/77200, Regelwerk R01–R33, Texte); `setupTrigger()` |
| `05_Status.gs` | `statuslauf()` (ein Status je Zertifikat, Anzeige, Register_oeffentlich), `verifiziere_()`, `doGet` für `?verify=` und `?register=1` |
| `06_Regelwerk.gs` | Regel-Engine für `datum_offset`-Regeln, Aktionen `aufgabe`, `mail`, `status`, Erinnerungen, Eskalation, Probelauf, `tagesliste()` |
| `07_Import.gs` | `import_zertifikatsverwaltung()`, `import_rechnungenQM()`, `import_billomatKunden()` mit Probelauf und Datenqualitätsbericht |
| `08_Tests.gs` | `test_alle()` |

## 2. Einrichtung (30 Minuten)

1. **Leere Google-Tabelle** anlegen: „OnlineCert Mandantendatei". ID aus der URL notieren.
2. **Apps-Script-Projekt** anlegen (script.google.com) und die Dateien hochladen: entweder per `clasp` (`npm i -g @google/clasp`, `clasp login`, `.clasp.json` aus `.clasp.json.example` mit der Script-ID, `clasp push`) oder Dateien einzeln kopieren. Manifest anzeigen lassen (Projekteinstellungen) und `appsscript.json` übernehmen.
3. **Skript-Eigenschaften** setzen (Projekteinstellungen > Skript-Eigenschaften):

| Schlüssel | Wert |
|---|---|
| `MANDANT_SHEET_ID` | ID der neuen Mandantendatei |
| `CRM_SHEET_ID` | ID des CRM „Super Master" |
| `ZV2025_SHEET_ID` | ID von Zertifikatsverwaltung_2025 |
| `RECHNUNGEN_SHEET_ID` | ID von „Rechnungen CRM" |
| `BILLOMAT_ID` | Billomat-Konto (Subdomain) |
| `BILLOMAT_KEY` | **neuer** API-Schlüssel (den bisherigen bitte erneuern, er war im Chat) |
| `TESTMODUS_MAIL` | eigene Adresse; solange gesetzt, gehen alle Mails dorthin mit `[TEST]` |
| `BACKOFFICE_MAIL` | Empfänger der Tagesliste |

4. `setup_pruefeEinstellungen()` ausführen, Logger prüfen (nur „gesetzt/FEHLT", keine Werte).
5. `setupMandantendatei()` ausführen. Ergebnis: 35 Blätter mit Kopfzeilen, Mandanten, Normen, Regelwerk (alle Regeln aktiv, aber 14 Tage Probelauf), Texte.
6. `test_alle()` ausführen. Erwartung: „ALLE TESTS OK".

## 3. Importe (immer erst Probelauf)

| Schritt | Aufruf | Ergebnis |
|---|---|---|
| 1 | `import_zertifikatsverwaltung(true)` | Bericht im Logger: Kunden gelesen/zugeordnet (CRM `Organisations Nr.`)/ohne CRM, Zertifikate, Auditoren, Problemliste (Adresse, PLZ, Platzhalter, Dubletten). Nichts wird geschrieben. |
| 2 | Problemliste abarbeiten: fehlende Kunden im CRM erfassen, `Organisations Nr.` füllen, Adressen korrigieren | im CRM bzw. in Zertifikatsverwaltung_2025 |
| 3 | `import_zertifikatsverwaltung(false)` | Kunden (Referenz), Zertifikate mit `alt_id`, Ausfertigungen je Sprache, Auditoren; Kunden ohne CRM-Treffer als Aufgabe „im CRM erfassen" |
| 4 | `import_rechnungenQM(true)` → `(false)` | Rechnungshistorie und Zahlungsampel je Kunde |
| 5 | `import_billomatKunden(true)` → `(false)` | Billomat-Kunden-ID an der Kundenreferenz; ohne Treffer in der Logger-Liste |
| 6 | `statuslauf()` | Status und Anzeige je Zertifikat, Register_oeffentlich gefüllt |
| 7 | `probelauf()` | Zeigt, was das Regelwerk heute tun würde (Erinnerungen_Log mit `probelauf`), nichts wird gesendet |

Alle Importe sind idempotent: bereits vorhandene `alt_id`, Rechnungsnummern und Billomat-IDs werden übersprungen.

## 4. Betrieb einschalten

1. `setupTrigger()`: Statuslauf 5 Uhr, Regelwerk 6 Uhr, Tagesliste 7 Uhr.
2. Web-App bereitstellen (Ausführen als: ich; Zugriff: jeder) für `?verify={nummer}`; die URL in die Verifizierungsseite eintragen (Phase 1).
3. Nach 14 Tagen Probelauf: `probelauf_bis` im Regelwerk leer lassen oder verlängern, `Mandanten.testmodus` auf `nein`, `TESTMODUS_MAIL` entfernen. Erst dann gehen Mails an Kunden.

## 5. Was Phase 0 bewusst nicht enthält

Zertifikats-PDF aus der Docs-Vorlage (Phase 1), Ausschuss-Voten (Phase 2), Auditor-App und Portal (Phasen 2 und 5), Mailvorlagen-Inhalte (Blatt `Mailvorlagen` ist leer; Regeln mit Aktion `mail` melden „Mailvorlage fehlt" statt zu senden), Rechnungszeilen in „Rechnungen QM" anlegen (M8.3, Phase 4).

## 6. Bekannte Annahmen, die beim ersten Lauf bestätigt werden müssen

- CRM: Spaltenüberschriften `Organisationsname`, `Organisations Nr.`, `primäre E-Mail`, `zuständig`, `Rechnung PLZ`, `Rechnung Ort` in Zeile 1 des Blatts „super Master".
- Zertifikatsverwaltung_2025: Kopfzeilen wie in Runde 3 Kapitel 1.3 gelesen (`Kunde_ID`, `Firmenname`, `Zertifikat_ID`, `Zertifikatstyp`, `DE_Status` …, `AuditorNr`).
- „Rechnungen QM": `Nr. Rechnung`, `Organisationsname`, `Rechnung bezahlt`, `Storno`, `Mail 1`, `Mail2`, `Mail3`, `Summe gesamt`.
- Billomat-Listen: `clients.client` ist bei genau einem Treffer ein Objekt (wird normalisiert), `@total` liefert die Gesamtzahl.
