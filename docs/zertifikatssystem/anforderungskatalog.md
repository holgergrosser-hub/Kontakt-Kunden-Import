# Anforderungskatalog: Zertifikatsverwaltungssystem für OnlineCert / QM-Dienstleistungen

Stand: 18.09.2026 · Verfasser: Claude (Fable) im Auftrag von Holger Grosser · Status: Entwurf zur Freigabe

**Inhalt**

0. Auftrag, verbesserte Aufgabenstellung und Leitplanken
1. Ausgangslage: vorhandene Bausteine
2. Zielbild und Kennzahlen
3. Stufe 1: Was brauchen wir (Bedarfsanalyse, Module M1 bis M12)
4. Stufe 2: Was bieten andere (virtualbadge, Credential-Plattformen, Zertifizierungsstellen-Software, Normen)
5. Stufe 3: Bewertung (gut für die Verwaltung, top für den Kunden, MoSCoW, Risiken)
6. Lösungsarchitektur (Datenmodell, Nummernschema, Seite 2, Trigger, Sicherheit)
7. Roadmap, Phasen und Aufwand
8. Offene Entscheidungen
9. Vorschläge zur Optimierung der bestehenden Projekte
10. Quellen

---

## 0. Auftrag, verbesserte Aufgabenstellung und Leitplanken

### 0.1 Ursprünglicher Auftrag (Kurzfassung)

Das System von virtualbadge nachbauen. Kundenverwaltung und Zertifikatsvorlagen existieren bereits. Fehlend: Zertifikatsnummern-Erzeugung, Abruf, Gültigkeitsprüfung, abgelaufene Zertifikate, Erinnerungen, Sprachvarianten (eine ID plus Sprachcode), Standorte (ID plus Standort-Anhang), Logo-Verwaltung, Erstzertifizierungsdatum, zweite Zertifikatsseite mit Verifizierung, Auditor und Auditdaten, Zertifizierungsausschuss, Angebote und Rechnungen. Umsetzung mit Google Apps Script, Sheets, Docs-Templates, GitHub/Netlify und Claude. Ziel: 1000 Kunden, ein Mitarbeiter mit 2 Stunden Backoffice pro Tag.

### 0.2 Verbesserte Aufgabenstellung (so wurde der Auftrag ausgeführt)

> Erstelle einen dreistufigen Anforderungskatalog für ein mandantenfähiges Zertifikatsverwaltungssystem einer (nicht akkreditierten) Zertifizierungsstelle für Managementsysteme (ISO 9001, 14001, 45001, optional 27001).
>
> **Stufe 1 – Bedarf:** Prozesse, Rollen, Datenobjekte und Funktionen entlang des gesamten Zertifikatslebenszyklus (Anfrage → Angebot → Auftrag → Audit → Zertifizierungsentscheidung durch Ausschuss → Zertifikat → Überwachung → Rezertifizierung → Ablauf/Aussetzung/Entzug), inklusive Nummernschema mit Sprach- und Standortanhang, Zertifikatsseite 2 (Verifizierung, Auditor, Auditdaten), Logo- und QR-Verwaltung, Angebote und Rechnungen.
>
> **Stufe 2 – Markt:** Was bieten virtualbadge.io und vergleichbare Credential-Plattformen, was bietet Software für Zertifizierungsstellen, welche Normvorgaben (ISO/IEC 17021-1, IAF) gelten für Zertifikatsinhalte und Verifizierung.
>
> **Stufe 3 – Bewertung:** Was ist gut für die Verwaltung (Backoffice-Automatisierung, Tagesroutine 2 h), was ist top für den Kunden (Verifizierung, Portal, Logo-Paket, Erinnerungen). Priorisierung nach MoSCoW, Roadmap in Phasen, Aufwand.
>
> **Rahmen:** Wiederverwendung der vorhandenen Bausteine (Kontakt-Kunden-Import, Zertifizierung-Angebot, QR-Logo-Generator, virtualbadge-Dashboard, Billomat-Anbindung). Technik: Apps Script + Google Sheets als Datenbank + Google Docs als Vorlagen + GitHub/Netlify für Frontends + Claude für Texterkennung und Assistenz. Ergebnis als Markdown im Repository.

### 0.3 Interpretationen unklarer Punkte

| Auftragstext | Gewählte Interpretation |
|---|---|
| „Anrufen" (in der Liste Zertnummer, Anrufen, Prüfung) | Doppelt abgedeckt: **Abruf** eines Zertifikats über Nummer/QR (öffentlich und per API) und **Anruf-Aufgaben** für das Backoffice (Telefonliste bei Kunden ohne Reaktion auf Erinnerungen). |
| „Multiple Kunden erweiterbar" | Beides: 1000+ Endkunden **und** mehrere Mandanten/Aussteller (z. B. OnlineCert, QM-Guru, künftige Partner-Zertifizierer) mit eigenem Logo, Nummernkreis und Absender. |
| „Zertifikate als Vorlage habe ich" | Vorhandene Docs-Vorlagen werden übernommen und um Platzhalter für Seite 2 ergänzt. |
| „Verwaltung der Kunden habe ich" | Das CRM-Sheet aus Kontakt-Kunden-Import (Spalten A bis DZ) bleibt Kundenstamm. Das Zertifikatssystem referenziert Kunden per Kundennummer statt Daten zu duplizieren. |
| „Erst Zertifizierung muss enthalten sein" | Das Zertifikat trägt das Datum der Erstzertifizierung zusätzlich zu Ausstellungs- und Ablaufdatum, wie bei akkreditierten Zertifizierern üblich. |
| „Zweite Seite ... Auditor ... und darum vom Audit" | Seite 2 = Anhang mit Verifizierungsblock (QR, URL, Nummer), Auditor, Auditart, Auditdatum, Auditmethode, Standorten, Entscheidungsdatum, nächstem Überwachungstermin. |

---

## 1. Ausgangslage: vorhandene Bausteine und was daraus gelernt wurde

Analysiert wurden sieben Repositories des Kontos `holgergrosser-hub` sowie die vorhandenen QM-Skills.

| Baustein (Repo) | Was es kann | Wiederverwendbar für | Lücke |
|---|---|---|---|
| **Kontakt-Kunden-Import** (dieses Repo) | Vite/React-Formular, Claude-Texterkennung von Signaturen/Visitenkarten, Apps-Script-Web-App schreibt eine Zeile ins CRM-Sheet (130+ Spalten), Projektleiter-Zuordnung | Kundenstamm, Muster Frontend → Netlify Function → Apps Script (Token) | Keine Kundennummer im Sheet erkennbar, keine Dublettenprüfung, Token im Code |
| **Zertifizierung-angebot** | Paketwahl (800/1400/2500 €), Angebotsnummer `ZA-JJJJMMTT-FIRMA`, Docs-Vorlage → PDF → Mail, Sheet als Datenbank, Erinnerungen nach 7/14/30 Tagen per Zeittrigger, Dry-Run-Tests | Angebotsmodul, Vorlagen-Platzhalter `##Feld##`, Erinnerungslogik, Testfunktionen | Angebotsnummer nicht fortlaufend (Firmen-Kürzel statt Zähler), kein Übergang Angebot → Auftrag → Rechnung |
| **QM-logofuer-zertifikat** | Browser-Generator: Logo je Norm × Sprache (9001/14001/45001 × DE/EN/ES/FR), QR-Code auf Validierungs-URL, „Gültig bis", Kunden-Kopfzeile, ZIP-Download | Logo-Verwaltung, QR-Erzeugung (QRious, clientseitig), Sprachtabelle | Rein manuell, kein Bezug zu Zertifikatsdaten, Logos nur als feste Dateien im Repo |
| **virtualbage** | Netlify-Function-Proxy auf `api.virtualbadge.io/v2` (Recipients, Certificates), Tabelle mit Ausstellungs-/Ablaufdatum, E-Mail-Status, ID-Nummer, dynamischen Feldern, CSV-Export | Zeigt das virtualbadge-Datenmodell (recipient, certificate, issue_date, expiration_date, identification_number, dynamic_fields, metadata, email_status) → Vorlage für unser Datenmodell; Migrationspfad für Altbestand | Nur lesend; Abhängigkeit von virtualbadge |
| **billomat** | Netlify Functions: Rechnungen lesen, Zahlung buchen (Admin-Token), Monats-/Jahresauswertung, Mock-Modus | Rechnungsmodul: Billomat bleibt Rechnungssystem (GoBD, E-Rechnung), unser System steuert es per API | Keine Rechnungserzeugung, keine Verknüpfung Kunde ↔ Zertifikat |
| **onlinecert-vote** | Abstimmungs-App (Vite) mit Apps-Script-Backend, Cookie-Sperre gegen Doppelabstimmung | Muster für Ausschuss-Abstimmung (Link → Votum → Sheet) | Kein Login, keine Nachvollziehbarkeit |
| **onlinecert-system** | leer | – | – |
| **Skills** (qm-audit-iso9001, qm-auditplan-auditprogramm, dnv-angebotsanfrage, offene-forderungen-telefonmappe, ki-hinweis) | Auditberichte, Auditpläne, Angebotsanfrage, Telefonmappe für offene Forderungen | Auditbericht liefert die Daten für Seite 2 und die Ausschussvorlage; Telefonmappe ist die Vorlage für Anruf-Aufgaben | – |

**Gelernte Muster, die übernommen werden:**

1. Frontend (Vite/React auf Netlify) spricht nie direkt mit Apps Script, wenn ein Geheimnis im Spiel ist. Netlify Function hält Token; Apps Script prüft Token. Konvention: `netlify.toml` mit `npm install && npm run build`, `minify: 'esbuild'`.
2. Google Sheet ist die Datenbank, Docs-Vorlage mit `##Platzhalter##` erzeugt PDF in einen Drive-Ordner, Mail per `MailApp`/`GmailApp` mit Anhang.
3. Erinnerungen laufen über zeitgesteuerte Trigger, die den Sheet-Stand scannen und Sendezeitpunkte in „Gesendet"-Spalten protokollieren (idempotent, Limit pro Lauf, Dry-Run).
4. Jede Apps-Script-Datei enthält `test_*`-Funktionen und einen `CONFIG`-Block am Anfang.
5. Jedes Dokument bekommt den KI-Hinweis in der Fußzeile (Skill ki-hinweis), außer Zertifikate.

**Gelernte Schwächen, die das neue System vermeidet:**

- Konfiguration (Sheet-IDs, Tokens) hart im Code → gehört in `PropertiesService`.
- Keine fortlaufenden, lückenlosen Nummern mit `LockService` → Pflicht für Zertifikats- und Rechnungsnummern.
- Spaltenzugriff über feste Indizes (A, C, BS ...) → Header-basierter Zugriff, damit Spalten eingefügt werden können.
- Jedes Projekt ein eigenes Sheet ohne gemeinsamen Schlüssel → eine Kundennummer als Fremdschlüssel in allen Modulen.

---

## 2. Zielbild und Kennzahlen

### 2.1 Zielbild in einem Satz

Ein Kunde durchläuft Anfrage, Angebot, Auftrag, Audit, Zertifizierungsentscheidung, Zertifikat, Überwachung und Rezertifizierung, ohne dass das Backoffice mehr als drei manuelle Eingriffe pro Zertifikat und Jahr braucht, und jedes Zertifikat ist in Sekunden öffentlich verifizierbar.

### 2.2 Rechnung für „1000 Kunden, 1 Mitarbeiter, 2 Stunden pro Tag"

| Größe | Wert |
|---|---|
| Backoffice-Budget pro Jahr | 2 h × 220 Arbeitstage = 440 h |
| Budget pro Kunde und Jahr | 440 h / 1000 = 26 Minuten |
| Ereignisse pro Kunde und Jahr (Angebot, Audit, Entscheidung, Zertifikat, Rechnung, Erinnerung, Verlängerung) | ca. 7 bis 9 |
| Erlaubte manuelle Minuten je Ereignis | ca. 3 Minuten |

Konsequenz: Jedes Ereignis muss standardmäßig automatisch laufen. Manuelle Arbeit gibt es nur bei (a) Auditor-Zuordnung und Terminbestätigung, (b) Ausschuss-Votum, (c) Ausnahmen aus einer Tagesliste. Alles andere (Nummern, PDFs, Mails, Erinnerungen, Rechnungen, Verifizierung, Statuswechsel) läuft ohne Eingriff.

### 2.3 Messbare Ziele

| Kennzahl | Ziel |
|---|---|
| Zeit von positivem Ausschuss-Votum bis Zertifikat-Mail | < 5 Minuten, automatisch |
| Manuelle Eingriffe pro Zertifikat und Zyklus (3 Jahre) | ≤ 5 |
| Verifizierungsseite: Ladezeit | < 2 s, auch für abgelaufene Zertifikate mit klarer Statusanzeige |
| Erinnerungen vor Ablauf (Überwachung/Rezertifizierung) | 100 % automatisch, 120/90/60/30/7 Tage |
| Rechnungen im Zyklus (Erst, ÜA1, ÜA2, Rezert) | automatisch in Billomat erzeugt, 0 händische Rechnungen |
| Tägliche Backoffice-Liste | eine Mail/ein Dashboard mit allen offenen Punkten, abarbeitbar in 2 h |
| Kundenzufriedenheit | Zertifikat, Logo-Paket und Verifizierungslink in einer Mail, in der Sprache des Kunden |

---

## 3. Stufe 1: Was brauchen wir (Bedarfsanalyse)

### 3.1 Rollen

| Rolle | Aufgaben im System | Zugang |
|---|---|---|
| **Backoffice** (1 Person, 2 h/Tag) | Tagesliste abarbeiten, Ausnahmen, Auditor-Zuordnung, Freigaben | Admin-Frontend (Netlify) + Sheet |
| **Auditor** (intern/extern) | Auditplan, Auditbericht, Feststellungen, Empfehlung | Auditor-Frontend, Upload Bericht |
| **Zertifizierungsausschuss** (2 bis 3 Personen, unabhängig vom Audit) | Entscheidung je Zertifikat: erteilen / mit Auflagen / ablehnen; Aussetzung/Entzug | Magic-Link-Abstimmung |
| **Kunde** | Angebot annehmen, Unterlagen liefern, Audittermin wählen, Zertifikat/Logo abrufen, Standorte melden | Kundenportal (Magic Link), Verifizierungsseite |
| **Öffentlichkeit / Kunde des Kunden** | Zertifikat prüfen | Verifizierungsseite (ohne Login) |
| **Mandant** (Aussteller, z. B. OnlineCert) | Logo, Nummernkreis, Absender, Vorlagen, Preise | Konfigurations-Sheet |
| **Projektleiter** (Beratung) | sieht Status seiner Kunden | CRM-Sheet, Dashboard |

### 3.2 Zertifikatslebenszyklus (Ende zu Ende)

```
Anfrage → Angebot → Auftrag/Vertrag → Auditplanung → Stufe-1 (Doku) → Stufe-2 (Audit)
   → Auditbericht → Ausschuss-Entscheidung → Zertifikat + Logo + Verifizierung → Rechnung
   → Jahr 1: Überwachungsaudit 1 (ÜA1) → Jahr 2: ÜA2 → Jahr 3: Rezertifizierung → neuer Zyklus
Nebenpfade: Erweiterung (Standort/Scope), Sprachvariante, Änderung Firmendaten, Aussetzung,
            Entzug, Ablauf, Wiederaufnahme, Beschwerde/Einspruch
```

Status eines Zertifikats (einziger Wahrheitswert für Verifizierung, Portal und Erinnerungen):

| Status | Bedeutung | Öffentlich sichtbar als |
|---|---|---|
| `entwurf` | Daten erfasst, kein Votum | nicht sichtbar |
| `im_ausschuss` | Entscheidung läuft | nicht sichtbar |
| `gueltig` | erteilt, innerhalb Gültigkeit, Überwachung fristgerecht | „Gültig" (grün) |
| `ueberwachung_faellig` | ÜA-Frist überschritten, Karenz läuft | „Gültig, Überwachung ausstehend" (gelb) |
| `ausgesetzt` | Aussetzung durch Ausschuss | „Ausgesetzt" (orange) |
| `entzogen` | Entzug | „Entzogen" (rot) |
| `abgelaufen` | Gültigkeitsende erreicht | „Abgelaufen" (grau) |
| `ersetzt` | durch Rezertifizierung/Neuausgabe ersetzt | „Ersetzt durch OC-…" |

### 3.3 Funktionale Anforderungen nach Modulen

Kennzeichnung: **M** = Must (Phase 1), **S** = Should (Phase 2), **C** = Could (Phase 3).

#### M1 Kunden und Mandanten

| Nr. | Anforderung | Prio |
|---|---|---|
| M1.1 | Kundennummer als eindeutiger Schlüssel (z. B. `K-00123`) im CRM-Sheet; Vergabe mit `LockService`, nie wiederverwendet | M |
| M1.2 | Kundenstamm: Firma, Rechtsform, Adresse, Ansprechpartner (Name, E-Mail, Telefon, Sprache), Rechnungsadresse, USt-ID, Projektleiter, Herkunft (Lead-Quelle) | M |
| M1.3 | Standorte je Kunde: Standort-ID (`S01`, `S02` …), Adresse, Tätigkeit, Mitarbeiterzahl, Hauptstandort-Kennzeichen | M |
| M1.4 | Dublettenprüfung bei Anlage (Firma + PLZ, E-Mail-Domain) mit Vorschlag zum Zusammenführen | S |
| M1.5 | Mandanten-Konfiguration: Name, Logo(s), Farben, Nummernpräfix, Absender-Mail, Vorlagen-IDs, Verifizierungs-Domain, Preisliste, Ausschussmitglieder | M |
| M1.6 | Import aus virtualbadge (Recipients/Certificates via API) in den Altbestand mit Status `migriert` | S |
| M1.7 | DSGVO: Löschkonzept (Kontakte nach 10 Jahren, Zertifikatsdaten dauerhaft im Register), Auskunftsexport je Kunde | S |
| M1.11 | Erstbefüllung des Kundenstamms aus Billomat (Kundenexport per API) zusammengeführt mit dem CRM-Sheet; Billomat-Kunden-ID und Kundennummer als Schlüssel; Dubletten nach Firma, PLZ und E-Mail-Domain; jede Zuordnung in `Historie` | M |

#### M2 Angebote, Aufträge, Verträge

| Nr. | Anforderung | Prio |
|---|---|---|
| M2.1 | Angebot aus Paket und Kundendaten (bestehender Flow), fortlaufende Angebotsnummer `AN-2026-0001` | M |
| M2.2 | Preisregel: Paket × Normen × Standorte × Zyklusjahr (Erst/ÜA/Rezert), Preistabelle im Mandanten-Sheet, kein Preis im Code | M |
| M2.3 | Annahme des Angebots durch Klick (Magic Link) oder Upload der unterschriebenen PDF → Auftrag `AU-2026-0001`, Vertragsdatum, Zyklusstart | M |
| M2.4 | Erinnerungen an offene Angebote (7/14/30 Tage, vorhanden), danach Anruf-Aufgabe für Backoffice | M |
| M2.5 | Zertifizierungsvereinbarung (Pflichten des Kunden, Zeichennutzung, Aussetzung/Entzug) als Docs-Vorlage, Teil des Auftrags | M |
| M2.9 | Kundendokumente liegen im Google-Drive-Kundenordner (`Kunden/{K-Nr}/Unterlagen/{Jahr}`), der für den Kunden freigegeben ist; Portal-Upload schreibt in denselben Ordner; Auditoren arbeiten direkt im Ordner; keine zweite Dokumentablage | M |
| M2.6 | Angebot für Erweiterung (weiterer Standort, weitere Norm, weitere Sprache) mit einem Klick aus dem Kundendatensatz | S |
| M2.7 | Übergabe des Auftrags an Billomat als Kunde + Auftrag (siehe M8) | M |

#### M3 Audit und Auditor

| Nr. | Anforderung | Prio |
|---|---|---|
| M3.1 | Auditvorgang je Auftrag und Zyklusjahr: Typ (Erst Stufe 1/2, ÜA1, ÜA2, Rezert, Sonder), Plan-Datum, Ist-Datum, Methode (remote/vor Ort), Dauer (Audittage) | M |
| M3.2 | Auditorenstamm: Name, Qualifikation je Norm, Verfügbarkeit, Interessenkonflikte (Kunden, die er/sie beraten hat → darf nicht auditieren) | M |
| M3.3 | Auditor vereinbart den Audittermin selbst mit dem Kunden und trägt ihn in der Auditor-App ein (Datum, Uhrzeit, Methode, Dauer); der Eintrag setzt Plan-Datum, erzeugt Kalendereinträge, Videolink, Auditplan und Bestätigungsmail an den Kunden | M |
| M3.4 | Auditbericht: Upload PDF oder Erzeugung über Skill qm-audit-iso9001; Pflichtfelder: Feststellungen, Abweichungen (Haupt/Neben), Empfehlung des Auditors | M |
| M3.5 | Abweichungen mit Korrekturmaßnahmen-Frist; Zertifikat erst nach Abschluss der Hauptabweichungen | M |
| M3.6 | Auditplan je Standort aus Skill qm-auditplan-auditprogramm | S |

#### M4 Zertifizierungsausschuss

| Nr. | Anforderung | Prio |
|---|---|---|
| M4.1 | Nach Auditbericht entsteht automatisch ein Entscheidungsvorgang `ZE-2026-0001` mit Zusammenfassung (Kunde, Norm, Scope, Standorte, Auditor, Ergebnis, Abweichungen, Empfehlung) und Link zum Bericht | M |
| M4.2 | Ausschussmitglieder erhalten Mail mit persönlichem, ablaufendem Magic Link; Votum: erteilen / erteilen mit Auflagen / ablehnen / Rückfrage, mit Begründung | M |
| M4.3 | Unabhängigkeit: Wer auditiert oder beraten hat, wird für diesen Vorgang automatisch ausgeschlossen (Abgleich mit Auditor und Projektleiter) | M |
| M4.4 | Quorum konfigurierbar je Mandant (z. B. 2 von 3, Einstimmigkeit bei Ablehnung/Entzug); Entscheidung wird mit Zeitstempel, Mitglied, Votum protokolliert (unveränderbares Protokoll-Sheet) | M |
| M4.5 | Positive Entscheidung löst Zertifikatserzeugung aus, negative erzeugt Aufgabe „Kunde informieren" mit Textbaustein | M |
| M4.6 | Auch Aussetzung, Entzug, Wiederaufnahme und Scope-Erweiterung laufen über den Ausschuss | M |
| M4.7 | Erinnerung an Ausschussmitglieder nach 3 und 7 Tagen ohne Votum; Eskalation an Backoffice | M |
| M4.8 | Jahresstatistik des Ausschusses (Anzahl, Dauer bis Entscheidung, Ablehnungen) | C |

#### M5 Zertifikate, Nummern, Sprachen, Standorte

| Nr. | Anforderung | Prio |
|---|---|---|
| M5.1 | Zertifikatsnummer nach Schema in Kapitel 6.3, lückenlos, mit `LockService`, nie wiederverwendet | M |
| M5.2 | Eine Zertifikats-ID je Kunde × Norm × Zyklus; Sprachvarianten und Standort-Ausfertigungen sind **Ausfertigungen derselben ID** mit Anhang (`-EN`, `-S02`), teilen Status und Gültigkeit | M |
| M5.3 | Pflichtinhalte Seite 1: Aussteller (Mandant), Kunde mit Adresse, Geltungsbereich, Norm mit Ausgabe, Zertifikatsnummer, Erstzertifizierung, Ausstellungsdatum, Gültig bis, Standorte (oder Verweis auf Anhang), Unterschrift, Logo(s), QR-Code | M |
| M5.4 | Seite 2 (Anhang): Verifizierungsblock (QR, URL, Nummer, Hinweis „Status online prüfen"), Auditor (Name, Leitender Auditor), Auditart, Auditdatum, Auditmethode, Auditdauer, Entscheidungsdatum, nächstes Überwachungsaudit fällig bis, Standortliste mit Standort-IDs, Sprache/Ausfertigung, Hinweis auf Zeichennutzungsregeln | M |
| M5.5 | Vorlagen je Mandant × Sprache (DE, EN, ES, FR) als Google Docs mit Platzhaltern; eine Datenzeile erzeugt alle bestellten Ausfertigungen | M |
| M5.6 | PDF-Erzeugung in Drive-Ordner `Zertifikate/{Jahr}/{Kundennummer}/`, Dateiname = Zertifikatsnummer + Anhang; SHA-256 des PDFs wird im Register gespeichert (Manipulationsnachweis) | M |
| M5.7 | Versand: eine Mail je Kunde mit allen PDFs, Verifizierungslink, Logo-Paket und Zeichennutzungsregeln, in der Sprache des Kunden | M |
| M5.8 | Neuausgabe bei Änderung (Firmenname, Adresse, Scope) mit Versionszähler (`-V2`), alte Version wird `ersetzt` | M |
| M5.9 | Erstzertifizierungsdatum wird bei Rezertifizierung aus dem Vorgängerzertifikat übernommen | M |
| M5.10 | Digitale Signatur des PDFs (PAdES) über externen Dienst oder Signatur-Hash auf der Verifizierungsseite | C |
| M5.11 | Batch: 50 Zertifikate in einem Lauf (Trigger-Limit 6 Minuten beachten, Warteschlange im Sheet) | S |

#### M6 Verifizierung, QR-Code, Logo-Verwaltung

| Nr. | Anforderung | Prio |
|---|---|---|
| M6.1 | Öffentliche Verifizierungsseite `https://verify.{mandant-domain}/v/{Zertifikatsnummer}` ohne Login; zeigt Status, Kunde, Norm, Scope, Standorte, Erstzertifizierung, Gültig bis, Aussteller, Ausfertigungen, Datum der letzten Statusprüfung | M |
| M6.2 | Suchfeld: Prüfung per Nummer oder Firmenname; Treffer nur bei Status ≠ `entwurf`/`im_ausschuss` | M |
| M6.3 | QR-Code zeigt auf die Verifizierungs-URL; Größe, Position, Fehlerkorrektur-Level, optional Logo im QR konfigurierbar je Mandant | M |
| M6.4 | Logo-Verwaltung: Sheet `Logos` mit Mandant × Norm × Sprache × Variante (Zertifikatslogo, Web-Badge, QR-Logo), Drive-Datei-ID, Version, gültig ab; Upload über Admin-Frontend | M |
| M6.5 | Logo-Paket für Kunden: PNG/SVG/PDF des Zertifikatslogos mit QR und „Gültig bis", automatisch erzeugt aus dem Generator (vorhanden) und im Portal abrufbar | M |
| M6.6 | Einbettbares Web-Badge (`<img>`/`<iframe>`-Snippet), das Status live aus der Verifizierung zieht: abgelaufen → Badge zeigt „abgelaufen" | S |
| M6.7 | Verifizierungs-API `GET /api/verify/{nummer}` (JSON) für Kunden, Portale, IAF-ähnliche Register | S |
| M6.8 | Verifizierungsseite mehrsprachig (Sprachwahl DE/EN/ES/FR), Sprache aus Anhang vorbelegt | M |
| M6.9 | Öffentliches Register (Liste aller gültigen Zertifikate je Mandant, filterbar nach Norm und Ort), Opt-out je Kunde | S |
| M6.10 | Missbrauchsschutz: Rate-Limit auf Verifizierung, keine Aufzählung aller Nummern über die URL, Nummer mit Prüfziffer | S |

#### M7 Gültigkeit, Ablauf, Erinnerungen, Anruf-Aufgaben

| Nr. | Anforderung | Prio |
|---|---|---|
| M7.1 | Täglicher Trigger berechnet Status aller Zertifikate aus Datumsfeldern und Ausschussentscheidungen (Kapitel 3.2) | M |
| M7.2 | Erinnerungskette Überwachungsaudit: 120/90/60/30 Tage vor Fälligkeit an Kunden (Sprache des Kunden), 14 Tage an Backoffice; Rezertifizierung: 180/120/90/60/30 Tage | M |
| M7.3 | Ablauf-Mails: 7 Tage vor und am Tag des Ablaufs; danach Mail „Zertifikat abgelaufen, Logo entfernen" mit Frist | M |
| M7.4 | Jede Erinnerung wird in einer Log-Zeile protokolliert (Typ, Datum, Empfänger, Status), keine Doppelsendung | M |
| M7.5 | Anruf-Aufgaben: Kunde ohne Reaktion nach zweiter Erinnerung landet in der Tagesliste mit Telefonnummer, Historie und Gesprächsleitfaden (Muster: Skill offene-forderungen-telefonmappe) | M |
| M7.6 | Karenzregel konfigurierbar (z. B. ÜA bis 90 Tage nach Fälligkeit, danach Aussetzung automatisch als Ausschussvorlage) | M |
| M7.7 | Bounce-Erkennung: unzustellbare Mails erzeugen Aufgabe „Kontaktdaten prüfen" | S |
| M7.8 | Kalendereinträge (Google Calendar) für Audits und Fälligkeiten je Auditor und Kunde, gespeist aus dem Termineintrag des Auditors | M |

#### M8 Angebote und Rechnungen (Billomat)

| Nr. | Anforderung | Prio |
|---|---|---|
| M8.1 | Billomat bleibt führendes Rechnungssystem (GoBD, fortlaufende Rechnungsnummer, E-Rechnung XRechnung/ZUGFeRD, Mahnwesen); unser System legt Kunden, Angebote und Rechnungen per Billomat-API an | M |
| M8.2 | Rechnungsplan je Auftrag: Erstzertifizierung (bei Auftrag oder Zertifikat), ÜA1 (Jahr 1), ÜA2 (Jahr 2), Rezertifizierung (Jahr 3) → automatische Rechnung zum Stichtag, Positionen aus Preistabelle | M |
| M8.3 | Zahlungsstatus aus Billomat lesen (vorhanden); Regel „Zertifikat wird erst nach Zahlungseingang versendet" je Mandant ein-/ausschaltbar | M |
| M8.4 | Offene Posten in der Tagesliste; nach Billomat-Mahnstufe 2 Anruf-Aufgabe | M |
| M8.5 | Fallback ohne Billomat: Rechnung aus Docs-Vorlage mit eigenem Nummernkreis `RE-2026-0001` (LockService), nur für Mandanten ohne Billomat | S |
| M8.6 | Angebot in Billomat spiegeln (Billomat-Angebot ↔ `AN-`-Nummer), damit Umsatzprognose im vorhandenen Dashboard stimmt | S |
| M8.7 | Umsatz- und Bestandsauswertung: Zertifikate je Norm, Umsatz je Zyklusjahr, Prognose kommende 12 Monate aus Rechnungsplan | S |
| M8.11 | Rechnungshistorie je Kunde aus Billomat lesen (Erstimport und täglicher Abgleich): Kundenakte zeigt alle Rechnungen; Zahlungsverhalten (durchschnittliche Zahlungsdauer, Mahnungen) steuert die Regel „Zertifikat erst nach Zahlung" (E5) automatisch | M |

#### M9 Kommunikation und Kundenportal

| Nr. | Anforderung | Prio |
|---|---|---|
| M9.1 | Alle Mails als Vorlagen je Mandant × Sprache × Ereignis im Sheet `Mailvorlagen` (Betreff, HTML, Platzhalter), nicht im Code | M |
| M9.2 | Kundenportal per Magic Link (kein Passwort): Zertifikate, PDFs aller Ausfertigungen, Logo-Paket, Verifizierungslink, nächste Termine, Rechnungen (Link Billomat), Standort melden, Ansprechpartner ändern, Sprache wählen | S |
| M9.3 | LinkedIn-/Website-Teilen: vorbereiteter Text + Badge-Bild + Verifizierungslink | S |
| M9.4 | Claude-Assistent im Backoffice: Mail-Antworten vorformulieren, Kundenanfragen klassifizieren („Standort melden", „Rechnung", „Logo") und in Aufgaben verwandeln | S |
| M9.5 | Zeichennutzungsregeln (Logo/Zertifikat) als Dokument, Bestätigung durch Kunden protokolliert | M |

#### M10 Backoffice-Cockpit, Berichte, Register

| Nr. | Anforderung | Prio |
|---|---|---|
| M10.1 | Tagesliste (Mail 07:00 + Dashboard): neue Anfragen, Angebote ohne Antwort, Audits ohne Termin/Auditor, Ausschuss offen, Zertifikate freizugeben, Ablauf in 30 Tagen ohne Reaktion, offene Posten, Bounces, Fehlerlog | M |
| M10.2 | Jede Zeile der Tagesliste hat einen Ein-Klick-Link zur Aktion (Auditor zuweisen, Mail senden, Aufgabe erledigt) | M |
| M10.3 | Zertifikatsregister als Sheet-Ansicht und Export (CSV/PDF) je Mandant | M |
| M10.4 | Kennzahlen: Bestand gültig/ausgesetzt/abgelaufen, Durchlaufzeit Audit → Zertifikat, Erinnerungsquote, Zahlungsdauer | S |
| M10.5 | Fehlerlog: jeder Trigger schreibt Ergebnis (verarbeitet, gesendet, Fehler) in `Log`; Fehler erzeugen Mail an Backoffice | M |

#### M11 Sicherheit, Betrieb, Datenschutz

| Nr. | Anforderung | Prio |
|---|---|---|
| M11.1 | Geheimnisse (Tokens, IDs) in `PropertiesService` und Netlify-Env, nicht im Repo | M |
| M11.2 | Zugriff Admin-Frontend über Google-Login (Apps Script `Session.getActiveUser()`) oder Netlify Identity; Kundenportal und Ausschuss über ablaufende Magic Links (72 h) mit Einmal-Token | M |
| M11.3 | Audit-Trail: Änderungen an Status, Nummer, Gültigkeit, Kunde werden in `Historie` mit Nutzer und Zeit geloggt (Append-only) | M |
| M11.4 | Backup: tägliche Kopie der Datenbank-Sheets (Drive-Versionen + wöchentlicher CSV-Export nach GitHub-Branch `backup`) | M |
| M11.5 | Quoten: E-Mail-Tagesquote (Workspace 1500/Tag) im Trigger prüfen, Warteschlange mit Fortsetzung am Folgetag | M |
| M11.6 | Skalierung: ab 20.000 Zeilen Auslagerung von Log/Historie in Jahres-Sheets; Register-Sheet bleibt < 10.000 Zeilen | S |
| M11.7 | Datenschutz: Verifizierungsseite zeigt nur Firmendaten, keine Personen außer Auditor-Name (berufliche Rolle); Impressum/Datenschutz je Mandant | M |
| M11.8 | Tests: `test_*`-Funktionen je Modul, Dry-Run für alle Trigger, Testmandant mit Testkunden | M |

### 3.4 Nicht-funktionale Anforderungen

| Bereich | Anforderung |
|---|---|
| Verfügbarkeit | Verifizierungsseite unabhängig von Apps-Script-Ausfällen: statischer JSON-Snapshot des Registers auf Netlify (stündlich), Live-Abfrage als Fallback |
| Performance | Verifizierung < 2 s; Zertifikat-PDF-Erzeugung < 30 s je Ausfertigung |
| Wartbarkeit | Ein Repo `onlinecert-system` (Monorepo): `apps-script/` (Backend), `web/verify/`, `web/admin/`, `web/portal/`, `docs/`; Deployment über GitHub → Netlify, Apps Script über `clasp` |
| Erweiterbarkeit | Neue Norm = neue Zeile in `Normen` + Logos; neuer Mandant = neue Zeile in `Mandanten` + Vorlagen; keine Codeänderung |
| Sprachen | DE als Pflicht, EN/ES/FR für Zertifikate, Verifizierung und Mails; Sprachtexte in Sheet `Texte` |
| Nachvollziehbarkeit | Jedes Zertifikat verweist auf Auftrag, Audit, Entscheidung, Rechnung (Kette lückenlos) |

---

## 4. Stufe 2: Was bieten andere (Marktanalyse)

Recherchiert am 18.09.2026 über Suchergebnisse und Hilfeseiten der Anbieter. Viele Herstellerseiten waren aus der Umgebung nicht direkt abrufbar; Preise und Details vor Vertragsabschluss prüfen. Quellen in Kapitel 10.

### 4.1 virtualbadge.io (das Vorbild)

| Bereich | Befund |
|---|---|
| Designer/Vorlagen | Designer im Adminbereich, eigene Vorlagen, dynamische Textfelder (Issue Date, Expiration Date, Certificate ID Number automatisch) |
| Verifizierung | Eigene Validierungsseite je Credential (URL + QR im PDF); zeigt Empfänger, Aussteller, Kurs, Ausstellungs-/Ablaufdatum; gültig = grüner Hinweis, abgelaufen = Hinweis, Daten bleiben sichtbar |
| Eigene Domain / eigene Validierungsseite | Nur Enterprise |
| Ablauf/Erinnerung | Ablaufdatum je Credential, auch per CSV; **kein Erinnerungs-Workflow belegt** |
| Widerruf/Neuausgabe | Widerruf per Klick, Neuausstellung; Wallet-Pass aktualisiert sich |
| Massenversand | CSV/Excel-Upload, Credits werden beim Upload verbraucht |
| Empfänger | Personen mit E-Mail; Portal, LinkedIn-Teilen, Apple/Google Wallet |
| Standards | Open Badges 2.0, W3C Verifiable Credential (Angabe), OB 3.0 nur angekündigt |
| API | REST-API ab Growth, Zapier, Zoom |
| Rollen | Owner, Administrator, Editor, Designer, Trainer; keine Mandanten |
| Preise (2026) | Growth kreditbasiert: 1.000 Credentials ca. 948 $/Jahr, 2.000 ca. 1.548 $/Jahr; Enterprise auf Anfrage; ungenutzte Credits verfallen |
| Hosting | Deutschland, EU-Server, DSGVO-Aussagen |

**Warum virtualbadge für eine Zertifizierungsstelle nicht reicht:** Empfänger ist eine Person, nicht ein Unternehmen mit Standorten und Geltungsbereich. Kein Status „ausgesetzt", kein öffentliches Register, keine Erinnerungskette, kein 3-Jahres-Zyklus, kein Ausschuss, keine Rechnung. Genau diese Lücken füllt das eigene System; das Nummern-, QR- und Validierungsprinzip wird übernommen.

### 4.2 Credential-Plattformen im Vergleich

| Funktion | virtualbadge | Certifier | Sertifier | Accredible | Credly | CertifyMe |
|---|---|---|---|---|---|---|
| Ablauf + Erinnerungen | Ablauf ja, Erinnerung nicht belegt | Erinnerungsmails, Auto-Widerruf | bis 3 Erinnerungen, Übersicht | Auto-Expire, Erinnerung Mail + SMS | Mail 60 Tage vorher | Ablauf/Widerruf |
| Öffentliches Register | nein | Link/QR + API | Verifikations-API | Directory | Verify-Seite je Organisation | Showcase Directory (Enterprise) |
| Mehrsprachig | nicht belegt | nicht belegt | Vorlagen + Verifizierungsseite sprachbewusst | 36 Sprachen | Mail-Locale | nicht belegt |
| Mandanten | nein | Workspaces | Enterprise-Portal | Departments | Organisationen | Multi-Brand |
| Audit-Trail | nicht belegt | Activity Logs | Versionsnachweis | Audit-Feature mit Wiederherstellung | – | – |
| Signatur/Blockchain | W3C VC | OB 3.0 | signierte PDFs | Blockchain-Anker | Verified Issuer | Blockchain + RSA, OB 3.0 |
| Eigene Domain | Enterprise | Add-on ca. 99 $/Monat | Enterprise | ja | – | ab 50 $ |
| Rechnung/Zahlung | nein | nein | nein | nein | nein | nein |
| Preis (2026) | 1.000 Cred. ca. 948 $/Jahr | ab 67 $/Monat | ab 75 $/Monat | Business 20–40 T$/Jahr | ab 3.000 $/Jahr | ab 15 $/Monat |

**Übernahmewert:** Erinnerungsketten (Sertifier, Certifier), Audit-Trail (Accredible), Mandanten (Certifier Workspaces), sprachbewusste Verifizierungsseite (Sertifier), Status bleibt nach Ablauf sichtbar (Credly). Keine Plattform bietet Rechnungsanbindung, Zyklus oder Ausschuss.

### 4.3 Software für Zertifizierungsstellen (ISO/IEC 17021-1)

| Produkt | Zielgruppe | Kernmodule (belegt) | Besonderheit | Preis |
|---|---|---|---|---|
| **Intact Platform** (ehem. ECERT) | große und mittlere Zertifizierer, Akkreditierer | CRM, Angebot/Vertrag, Auditplanung mit Kompetenz- und Unparteilichkeitsprüfung, Bericht per Klick, Technical Review + Decision, Zertifikat, Export IAF CertSearch, Rechnung, Multi-Site-Sampling | Vollsystem, „Ecert Basic" als Einstieg | auf Anfrage |
| **Zertic** (NL) | kleine bis große Zertifizierer | Kundenportal, Quote, Auditplanung, Bericht, Modul „Certification Decision", Zertifikat mit QR und Echtzeit-Status (auch Entzug), Surveillance-Timelines, Invoicing (Zertic GO) | QR zeigt Live-Status | ca. 103–127 € je Nutzer und Monat |
| **ViaSyst** (CH) | kleine/mittlere Zertifizierer, 70+ Länder | Antrag, Auditplanung, Bericht, Entscheidung, Zertifikat, Excel-Export im IAF-CertSearch-Format | mehrsprachig | auf Anfrage |
| **CertRoute** (nComms) | ISO-Zertifizierer („CRM/ERP für CBs") | Enquiry, Quote, Auditor-Matching (Norm, IAF-Code, Verfügbarkeit), regelbasierter Entscheidungs-Workflow, Register mit Status issued/extended/suspended/recertified/withdrawn, unbegrenzte Zyklen | Status-Register | ab 395 $ je Nutzer und Monat |
| **AuditOne TIC OS** | Zertifizierer, KI-gestützt | Antrag/Vertragsprüfung, **Audittage nach IAF MD 5 automatisch**, Kompetenz nach MD 7, Stage-1/2- und Decision-Workflow, Zertifikat mit QR + Verifikationslink, öffentliche Echtzeit-Verifikation, MD-1-Sampling | MD-5-Rechner | auf Anfrage |
| **kameon AUDIT Certification** (DE) | Zertifizierungsstellen, Umweltgutachter | Mandanten, Auditplanung mehrere Auditoren/Standorte/Normen, revisionssicherer Bericht, Freigaben, Auditprogramm | DE/EN, Hosting Frankfurt, Normen vorgeladen | Paketpreise nach Demo |
| **Audit Compass** (DE) | Zertifizierer | automatische Terminierung (Verfügbarkeit, Reisezeit, Kompetenz), Bericht automatisch, Zertifikat automatisch, ERP-Anbindung | Terminautomatik | auf Anfrage |

**Übernahmewert:** Statusmodell (issued/extended/suspended/recertified/withdrawn/expired), Auditor-Matching mit Unparteilichkeitsprüfung, Entscheidung als eigener Vorgang getrennt vom Audit, Zertifikat mit QR und Live-Status, Zyklus-Fälligkeiten als Datenfelder, IAF-CertSearch-kompatibles Feldformat. Kein Anbieter belegt „Zertifizierungsausschuss" als Modul; das läuft als Workflow-Rolle. Ein MD-5-Audittage-Rechner ist nur bei AuditOne belegt und für ein nicht akkreditiertes Verfahren optional.

### 4.4 Normative Vorgaben, die das System abbilden muss

**ISO/IEC 17021-1:2015, Kapitel 8.2.2 – Pflichtinhalte des Zertifikats:** (a) Name und geografischer Standort des Kunden und aller Standorte bei Multi-Site; (b) Datum der Erteilung, Erweiterung oder Erneuerung; (c) Ablaufdatum bzw. Rezertifizierungstermin passend zum Zyklus; (d) eindeutiger Identifikationscode; (e) Norm mit Ausgabe; (f) Geltungsbereich je Standort; (g) Name, Adresse und Zertifizierungszeichen der Stelle. Kapitel 8.2.3: Ausgabe erst mit der Entscheidung. Kapitel 9.5: Entscheidung durch Personen, die nicht am Audit beteiligt waren. Kapitel 9.6: Überwachungsaudit mindestens jährlich, erstes spätestens 12 Monate nach Entscheidung; Rezertifizierung vor Ablauf; Aussetzung in der Regel maximal 6 Monate, dann Entzug. Kapitel 9.7/9.8: Beschwerden und Einsprüche mit unabhängiger Bearbeitung. Kapitel 8.1.3: Auskunft über Status (gültig, ausgesetzt, entzogen) auf Anfrage.

Auch als nicht akkreditierte Stelle lohnt es sich, diese Struktur einzuhalten: Sie ist der Grund, warum Auftraggeber der Kunden ein Zertifikat akzeptieren, und sie hält den Weg zu einer späteren Akkreditierung offen.

**IAF CertSearch (IAF MD 28):** Felder je Zertifikat: zertifizierte Einheit (Name, Land, Hauptadresse), Zertifikatsnummer, Norm, IAF-Branchencode, Erstausgabedatum, Ablaufdatum, Geltungsbereich, Status (active, suspended, withdrawn, expired, cancelled, hidden, pending), Akkreditierungsstatus, Standorte. Keine Personendaten. Für Deutschland: DAkkS verlangt keinen Upload; Upload nur mit schriftlicher Kundeneinwilligung (Drittlandübermittlung). Konsequenz: Register-Felder IAF-kompatibel benennen, Einwilligungsfeld je Kunde vorsehen, Upload als optionale Funktion.

**Open Badges 3.0 / W3C Verifiable Credentials 2.0:** Maschinenlesbares Credential mit `issuer`, `validFrom`, `validUntil`, `credentialSubject`, `credentialStatus` (Widerruf/Aussetzung) und Signatur. Für Firmenzertifikate optional; ein JSON-Endpunkt je Zertifikat (`/api/verify/{nummer}`) mit diesen Feldnamen macht die spätere Umsetzung einfach.

**Rechnungen (Deutschland):** Pflichtangaben nach § 14 UStG, fortlaufende einmalige Nummer (Lücken erlaubt, wenn erklärbar), E-Rechnungspflicht für alle B2B-Rechnungen ab 01.01.2028 (ab 2027 nur über 800.000 € Vorjahresumsatz), Empfangspflicht seit 2025. Konsequenz: Bis 2027 reicht PDF; Billomat oder ein vergleichbares Tool liefert XRechnung/ZUGFeRD ab 2028. Billomat-API nur im Business-Tarif; Alternativen mit API: sevdesk (ca. 34,90 €/Monat), easybill (ca. 29 €/Monat), Lexware Office XL (ca. 32,90 €/Monat).

**Apps-Script-Grenzen (Workspace-Konto):** 1.500 Mail-Empfänger/Tag, 6 Minuten je Ausführung, 6 Stunden Trigger-Laufzeit/Tag, 1.500 erzeugte Dokumente/Tag, 100.000 UrlFetch/Tag, 20 Zeittrigger je Skript, 30 gleichzeitige Ausführungen. Für 1.000 Kunden ist das Zehnfache Reserve; Engpass ist nur die 6-Minuten-Grenze, gelöst durch Warteschlange und Fortsetzungs-Trigger. Google-Chart-QR-API ist abgeschaltet; QR über JS-Bibliothek.

### 4.5 Ergänzungen zum Bedarf aus der Marktanalyse

| Nr. | Anforderung (neu) | Prio |
|---|---|---|
| M1.8 | Einwilligungsfeld je Kunde für Veröffentlichung im Register und für IAF-CertSearch-Upload; Felder des Registers IAF-kompatibel benannt | S |
| M3.7 | Unparteilichkeitsprüfung bei Auditor-Zuordnung: Sperrliste (beraten, verwandt, ehemals beschäftigt) mit Begründung, Ergebnis wird in `Historie` protokolliert | M |
| M3.8 | Audittage-Richtwert nach IAF MD 5 aus Mitarbeiterzahl und Norm (Tabelle im Sheet), als Vorschlag für Angebot und Auditplan | C |
| M5.12 | Zertifikat trägt Hinweis „nicht akkreditiert" oder Akkreditierungssymbol je Mandant (Feld in `Mandanten`) | M |
| M6.11 | JSON-Endpunkt je Zertifikat mit OB-3.0/VC-2.0-Feldnamen (`validFrom`, `validUntil`, `credentialStatus`) | C |
| M12.1 | Beschwerden und Einsprüche: Eingang, Bezug (Zertifikat/Audit), unabhängiger Bearbeiter, Ergebnis, Frist; Jahresauswertung | S |
| M12.2 | Statusauskunft auf Anfrage (Kapitel 8.1.3) automatisiert über Verifizierungsseite und Mail-Vorlage | M |

---

## 5. Stufe 3: Bewertung

### 5.1 Was ist gut für die Verwaltung (Backoffice, 2 Stunden pro Tag)

Der Tagesablauf des Backoffice besteht aus genau einer Liste. Alles, was nicht auf der Liste steht, ist erledigt oder läuft automatisch.

| Zeit | Tätigkeit | Werkzeug | Warum es in 2 h passt |
|---|---|---|---|
| 0:00–0:20 | Tagesliste durchgehen: neue Anfragen (Claude hat Daten erkannt und Angebot vorbereitet), Angebote freigeben | Dashboard, Ein-Klick-Freigabe | Angebot ist fertig, nur Freigabe |
| 0:20–0:50 | Audits: Auditor zuordnen (Vorschlag mit Kompetenz- und Sperrlistenprüfung); Termine vereinbart der Auditor selbst | Dashboard | System schlägt vor, Backoffice bestätigt |
| 0:50–1:10 | Berichte, die hochgeladen wurden, an Ausschuss weiterleiten (automatisch, nur Kontrolle); Voten überfällig → Erinnerung auslösen | Dashboard | Ausschuss läuft über Magic Links |
| 1:10–1:40 | Anruf-Aufgaben: Kunden ohne Reaktion (Erinnerung 2 verstrichen), offene Posten ab Mahnstufe 2, Bounces | Telefonliste mit Gesprächsleitfaden und Historie | Liste ist priorisiert, ca. 5 bis 10 Anrufe/Tag bei 1.000 Kunden |
| 1:40–2:00 | Ausnahmen: Fehlerlog, Scope-Änderungen, Sonderwünsche (zusätzliche Sprache, Standort) mit Ein-Klick-Angebot | Dashboard, Claude-Mailentwürfe | Standardfälle brauchen keinen Text |

**Bewertung der Verwaltungsfunktionen (Nutzen für das Backoffice):**

| Funktion | Nutzen | Aufwand | Bewertung |
|---|---|---|---|
| Automatische Zertifikatserzeugung nach Votum (M4.5, M5.5–M5.7) | spart ca. 30 Min je Zertifikat | mittel | **sehr hoch** |
| Erinnerungsketten mit Log (M7.2–M7.4) | ersetzt manuelle Wiedervorlage für 1.000 Kunden | gering (Muster vorhanden) | **sehr hoch** |
| Tagesliste mit Ein-Klick-Aktionen (M10.1–M10.2) | macht 2 h/Tag überhaupt erst möglich | mittel | **sehr hoch** |
| Rechnungsplan + Billomat (M8.1–M8.3) | 3.000 Rechnungen in 3 Jahren ohne Handarbeit | mittel | **sehr hoch** |
| Ausschuss per Magic Link mit Quorum (M4.1–M4.7) | Entscheidung in Tagen statt Wochen, normkonform | mittel | **hoch** |
| Statuslauf täglich (M7.1) | kein manuelles Nachhalten von Ablaufdaten | gering | **hoch** |
| Auditor-Vorschlag mit Sperrliste (M3.2, M3.7) | Unparteilichkeit ohne Nachdenken | gering | **hoch** |
| Claude-Klassifikation eingehender Mails (M9.4) | Kundenmails werden zu Aufgaben | mittel | **mittel** (Phase 5) |
| Beschwerden-Modul (M12) | selten, aber normrelevant | gering | **mittel** |
| PAdES-Signatur (M5.10) | Fälschungsschutz | hoch | **niedrig** (Hash reicht) |

### 5.2 Was ist top für den Kunden

| Kundenerlebnis | Umsetzung | Warum es wirkt |
|---|---|---|
| **Eine Mail, alles drin:** Zertifikat in allen bestellten Sprachen, Anhang mit Auditdaten, Logo-Paket (PNG/SVG mit QR und „Gültig bis"), Verifizierungslink, Textbaustein für Website und LinkedIn | M5.7, M6.5, M9.3 | Kunde kann sofort werben, ohne nachzufragen |
| **Verifizierung in 2 Sekunden:** QR scannen → Statusseite mit Ampel, Firma, Norm, Scope, Standorten, Gültig bis, Erstzertifizierung; in der Sprache des Zertifikats | M6.1, M6.8 | Auftraggeber des Kunden prüfen ohne Anruf; das ist der Kern des virtualbadge-Prinzips |
| **Live-Badge für die Website:** eingebettetes Siegel zeigt aktuellen Status; wird bei Ablauf automatisch „abgelaufen" | M6.6 | Kunde muss nichts austauschen; Stelle behält Kontrolle über Zeichennutzung |
| **Erinnerungen mit Handlungslink:** „Ihr Überwachungsaudit ist in 90 Tagen fällig – Ihr Auditor meldet sich zur Terminabstimmung", danach Bestätigungsmail mit „Termin passt" | M7.2, M3.3 | Kein Zertifikat läuft aus Versehen ab |
| **Kundenportal ohne Passwort:** Magic Link aus jeder Mail → Zertifikate, Rechnungen, nächste Termine, Standort melden, Sprache nachbestellen | M9.2 | Selbstbedienung statt Rückfragen |
| **Ein Klick zur Erweiterung:** weiterer Standort, weitere Norm, weitere Sprache als vorbereitetes Angebot | M2.6 | Zusatzumsatz ohne Vertrieb |
| **Transparenter Ablauf:** Seite 2 zeigt Auditor, Auditart, Datum, Methode, Entscheidung, nächste Fälligkeit | M5.4 | Kunde versteht den Zyklus; Auftraggeber sehen Substanz hinter dem Zertifikat |
| **Sofortangebot:** Paketwahl, Daten eingeben, Angebot als PDF in Minuten (vorhanden) | M2.1 | „In einer Woche zertifiziert" bleibt das Versprechen |
| **Erstzertifizierung sichtbar:** „Zertifiziert seit 2023" auf Urkunde und Verifizierungsseite | M5.3, M5.9 | Langjährige Kunden zeigen Kontinuität |

### 5.3 Priorisierung (MoSCoW) und Reihenfolge

| Muss (Phase 0–3) | Sollte (Phase 4–5) | Könnte (Phase 6+) | Nicht jetzt |
|---|---|---|---|
| Kundennummer, Mandanten, Standorte (M1.1–M1.3, M1.5) | Dubletten, Migration virtualbadge, DSGVO-Export (M1.4, M1.6, M1.7) | MD-5-Rechner (M3.8) | Blockchain-Anker |
| Register, Nummern, Ausfertigungen, Seite 1+2, PDF, Hash, Versand (M5.1–M5.9, M5.12) | Batch 50 (M5.11) | PAdES (M5.10) | Apple/Google Wallet |
| Verifizierungsseite, QR, Logo-Blatt, Logo-Paket, Sprachen DE/EN (M6.1–M6.5, M6.8) | Web-Badge, API, Register, Missbrauchsschutz (M6.6, M6.7, M6.9, M6.10) | OB-3.0-JSON (M6.11) | eigene Zertifikats-Designer-Oberfläche (Docs reicht) |
| Statuslauf, Erinnerungen, Log, Anruf-Aufgaben, Karenz, Kalender (M7.1–M7.6, M7.8) | Bounce (M7.7) | | |
| Ausschuss komplett (M4.1–M4.7) | Ausschuss-Statistik (M4.8) | | |
| Audits, Auditoren, Termineintrag, Bericht, Abweichungen, Sperrliste (M3.1–M3.5, M3.7) | Auditplan (M3.6) | | |
| Angebot fortlaufend, Annahme, Vereinbarung, Preisregel, Billomat-Kunde (M2.1–M2.5, M2.7) | Erweiterungsangebot, Billomat-Angebot, Auswertung (M2.6, M8.6, M8.7) | | |
| Rechnungsplan, Zahlungsstatus, offene Posten (M8.1–M8.4) | Fallback-Rechnung (M8.5) | | |
| Mailvorlagen, Zeichennutzung (M9.1, M9.5) | Portal, LinkedIn, Claude-Assistent (M9.2–M9.4) | | |
| Tagesliste, Register-Export, Fehlerlog (M10.1–M10.3, M10.5) | Kennzahlen (M10.4) | | |
| Sicherheit, Audit-Trail, Backup, Quoten, Tests, Datenschutz (M11.1–M11.5, M11.7, M11.8) | Skalierung (M11.6) | | |
| Statusauskunft (M12.2) | Beschwerden (M12.1, M1.8) | | |

### 5.4 Risiken und Gegenmaßnahmen

| Risiko | Wirkung | Gegenmaßnahme |
|---|---|---|
| Apps-Script-Ausfall oder Quotenüberschreitung | Verifizierung nicht erreichbar | statischer Register-Snapshot auf Netlify, Warteschlange mit Fortsetzung |
| Doppelte Nummern durch gleichzeitige Aufrufe | Registerfehler, Reputationsschaden | LockService + Zähler, Nummer erst beim Finalisieren |
| Ausschuss reagiert nicht | Zertifikat verzögert sich | Erinnerung 3/7 Tage, Eskalation, Vertreterregel im Quorum |
| Kunden wechseln E-Mail-Adresse | Erinnerungen laufen ins Leere | Bounce-Aufgabe, Portal mit Selbstpflege, Telefonliste |
| E-Rechnungspflicht 2028 | Rechnungen unzulässig | Billomat/sevdesk per API liefert XRechnung; Fallback-Rechnung nur bis 2027 |
| Veröffentlichung von Einzelunternehmern | DSGVO-Beschwerde | Einwilligung im Vertrag, Opt-out, Suche nur per Nummer |
| Vorlagen werden im Doc kaputt bearbeitet | fehlerhafte Zertifikate | Vorlagen versioniert im `Vorlagen`-Blatt, Testlauf mit Testkunde vor Freigabe, Platzhalter-Prüfung im Skript |

---

## 6. Lösungsarchitektur (Apps Script + Sheets + Docs + GitHub/Netlify + Claude)

### 6.1 Systembild

```
                 ┌──────────────────────────── GitHub (Monorepo onlinecert-system) ───────────────────────────┐
                 │  web/verify (Netlify, öffentlich)   web/admin (Netlify, Login)   web/portal (Magic Link)    │
                 │  netlify/functions (Token-Proxy: Apps Script, Billomat, Claude)                              │
                 └──────────────┬───────────────────────────────┬──────────────────────────────┬──────────────┘
                                │ JSON (GET/POST, Token)        │                              │
                 ┌──────────────▼───────────────────────────────▼──────────────────────────────▼──────────────┐
                 │  Google Apps Script "OnlineCert Backend" (clasp-Deployment aus apps-script/)                │
                 │  doGet: verify, portal, dashboard · doPost: create, decide, upload · Trigger: täglich 06:00 │
                 │  Module: Kunden · Angebote · Audits · Ausschuss · Zertifikate · Erinnerungen · Rechnungen   │
                 └───────┬───────────────┬────────────────┬──────────────────┬──────────────────┬─────────────┘
                         │               │                │                  │                  │
                 Google Sheets     Google Docs        Google Drive        Gmail/MailApp     Billomat API
                 (Datenbank,       (Vorlagen je       (PDF-Archiv,        (Mails je         (Kunden, Angebote,
                  1 Datei je       Mandant×Sprache)    Logos, Berichte)    Sprache)          Rechnungen, Status)
                  Mandant)                                                                    Claude API (Netlify Fn:
                                                                                             Texterkennung, Mail-Entwurf)
```

Entscheidungen:

- **Eine Sheet-Datei je Mandant** (Register, Kunden-Link, Audits, Entscheidungen, Logs). Der bestehende CRM-Bestand bleibt in seiner Datei; das Zertifikatssystem speichert nur die Kundennummer und liest Stammdaten bei Bedarf.
- **Verifizierung zweistufig:** Netlify liefert stündlich einen statischen JSON-Snapshot (`/data/register.json`, nur öffentliche Felder) für Geschwindigkeit und Ausfallsicherheit; bei Treffer wird zusätzlich der Live-Status per `doGet` geholt (CacheService 1 h). Fällt Apps Script aus, zeigt die Seite den Snapshot mit Zeitstempel.
- **QR-Codes** werden clientseitig (Netlify, Bibliothek qrcode.js, wie im Logo-Generator) und serverseitig (Apps Script mit eingebetteter QR-Bibliothek `qrcodegen`, als PNG ins Doc) erzeugt. Die Google-Chart-QR-API existiert nicht mehr und wird nicht genutzt.
- **Nummern** ausschließlich serverseitig mit `LockService` + Zähler in `PropertiesService`, Vergabe erst beim Finalisieren (nie für Entwürfe).
- **Claude** nur über Netlify Functions (API-Key serverseitig), für Texterkennung (Anfragen, Visitenkarten), Mail-Entwürfe, Klassifikation eingehender Kundenmails und Zusammenfassung des Auditberichts für den Ausschuss.

### 6.2 Datenmodell (Tabellenblätter je Mandanten-Datei)

Zugriff immer über Spaltenüberschriften (Header-Map), nie über feste Indizes. Schlüsselspalten fett.

| Blatt | Schlüssel | Wichtige Spalten |
|---|---|---|
| `Mandanten` (nur in der Zentraldatei) | **mandant_id** (`OC`) | name, domain_verify, absender_mail, absender_name, logo_ids, farben, praefix_nummern, quorum, ausschuss_mitglieder, billomat_id, zahlung_vor_zertifikat (ja/nein), impressum_url, datenschutz_url |
| `Kunden` (Referenz auf CRM) | **kunden_nr** (`K-00123`) | crm_zeilen_id, firma, rechtsform, ort, land, sprache, ansprechpartner, email, telefon, projektleiter, billomat_client_id, drive_ordner_id (Kundenordner in Google Drive, für den Kunden freigegeben), portal_token, portal_token_ablauf, opt_out_register |
| `Standorte` | **standort_id** (`K-00123-S01`) | kunden_nr, bezeichnung, strasse, plz, ort, land, taetigkeit, mitarbeiter, hauptstandort (ja/nein), aktiv_ab, aktiv_bis |
| `Normen` | **norm_code** (`9001`) | bezeichnung_de/en/es/fr, ausgabe (`2015`), systemname_de/en/es/fr, logo_key |
| `Angebote` | **angebot_nr** (`AN-2026-0001`) | kunden_nr, paket, normen, standorte_anzahl, preis_erst, preis_ua, preis_rezert, pdf_id, gesendet, erinnerung_1/2/3, status (offen/angenommen/abgelehnt/verfallen), angenommen_am, billomat_offer_id |
| `Auftraege` | **auftrag_nr** (`AU-2026-0001`) | angebot_nr, kunden_nr, normen, standorte, vertragsdatum, zyklus_start, zyklus_ende, vereinbarung_pdf_id, rechnungsplan (JSON: Erst/ÜA1/ÜA2/Rezert mit Datum und Betrag), status |
| `Audits` | **audit_nr** (`AD-2026-0001`) | auftrag_nr, kunden_nr, typ (E1/E2/UA1/UA2/RZ/SO), plan_datum, ist_datum, methode, dauer_tage, auditor_id, co_auditor_id, bericht_pdf_id, ergebnis (empfohlen/mit_auflagen/nicht_empfohlen), abweichungen_haupt, abweichungen_neben, cap_frist, cap_geschlossen_am, status |
| `Auditoren` | **auditor_id** | name, email, normen (Liste), sprachen, google_konto, sperrliste_kunden (beraten), aktiv |
| `Entscheidungen` | **entscheidung_nr** (`ZE-2026-0001`) | audit_nr, kunden_nr, typ (Erteilung/Rezert/Erweiterung/Aussetzung/Entzug/Wiederaufnahme), vorlage_text, link_token_je_mitglied (JSON), voten (JSON: mitglied, votum, begruendung, zeit), ergebnis, entschieden_am, quorum_erreicht |
| `Zertifikate` (**Register**) | **zert_nr** (`OC-2026-00123-7`) | kunden_nr, auftrag_nr, entscheidung_nr, norm_code, scope_de/en/es/fr, standorte (Liste standort_id), erstzertifizierung, ausgestellt_am, gueltig_bis, ua1_faellig, ua2_faellig, rezert_faellig, status, status_seit, status_grund_intern, version, ersetzt_durch, ersetzt_von, verify_token (UUID), pdf_hash_sha256 |
| `Ausfertigungen` | **ausfertigung_id** (`OC-2026-00123-7/EN`, `/S02`, `/S02-EN`) | zert_nr, sprache, standort_id (leer = Gesamtzertifikat), vorlage_id, pdf_id, erzeugt_am, versendet_am, hash |
| `Logos` | **logo_key** (`OC-9001-DE-zert`) | mandant_id, norm_code, sprache, variante (zert/web/qr), drive_id, version, gueltig_ab, breite_px |
| `Vorlagen` | **vorlage_key** (`OC-zert-DE`) | mandant_id, typ (zertifikat/anhang/angebot/vereinbarung/rechnung), sprache, doc_id, version, platzhalter_liste |
| `Mailvorlagen` | **mail_key** (`zert_versand-DE`) | mandant_id, ereignis, sprache, betreff, html, anhaenge_regel |
| `Texte` | **key** | de, en, es, fr (Verifizierungsseite, Portal, Statusnamen) |
| `Erinnerungen_Log` | lfd | zert_nr / angebot_nr / rechnung_nr, typ (UA1-90 …), empfaenger, gesendet_am, status, fehler |
| `Rechnungen` | **rechnung_ref** | auftrag_nr, kunden_nr, zyklusjahr, faellig_am, betrag, billomat_invoice_id, billomat_status, bezahlt_am, mahnstufe |
| `Aufgaben` (Tagesliste) | **aufgabe_id** | typ, bezug, kunden_nr, faellig, prioritaet, text, aktion_link, erledigt_am, erledigt_von |
| `Historie` (Append-only) | lfd | zeit, nutzer, objekt, schluessel, feld, alt, neu, quelle |
| `Log` | lfd | zeit, trigger, verarbeitet, gesendet, fehler, dauer_ms |

### 6.3 Nummernschema (Empfehlung)

**Grundsatz:** Eine Kernnummer = ein Zertifikat (Kunde × Norm × Zyklus). Sprache und Standort sind Ausfertigungen derselben Nummer und werden nur als Anhang angezeigt. Verifizierung, Status und Gültigkeit hängen immer an der Kernnummer.

```
Kernnummer:   {MANDANT}-{JAHR}-{LFD5}-{P}          Beispiel: OC-2026-00123-7
Ausfertigung: {Kernnummer}/{SPRACHE}               Beispiel: OC-2026-00123-7/EN
              {Kernnummer}/S{NN}                   Beispiel: OC-2026-00123-7/S02      (Standort 2)
              {Kernnummer}/S{NN}-{SPRACHE}         Beispiel: OC-2026-00123-7/S02-EN
Neuausgabe:   {Kernnummer} + Spalte version (V2)   Anzeige:  OC-2026-00123-7 (V2)
Rezertifizierung: neue Kernnummer im neuen Jahr, Feld ersetzt_von zeigt auf den Vorgänger,
                  erstzertifizierung wird übernommen.
```

- `MANDANT`: 2 bis 4 Großbuchstaben ohne 0/O/1/I-Verwechslung (`OC`, `QMG`).
- `JAHR`: Ausstellungsjahr. `LFD5`: fortlaufend je Mandant und Jahr, mit `LockService`.
- `P`: Prüfziffer nach Luhn (mod 10) über die Ziffern von Jahr und laufender Nummer; fängt Tippfehler auf der Verifizierungsseite ab, bevor das Backend gefragt wird.
- Normcode bewusst **nicht** in der Nummer: Kombi-Zertifikate (9001 + 14001) bleiben möglich, die Norm steht als Feld im Register. Wer den Normcode auf dem Zertifikat sehen will, bekommt ihn als Zeile „Norm: ISO 9001:2015", nicht in der Nummer. Alternative, falls gewünscht: `OC-9001-2026-00123-7` (ein Zertifikat je Norm).
- **Verifizierungs-URL:** `https://verify.onlinecert.de/v/OC-2026-00123-7`. Öffentliche Felder sind ohne Token sichtbar. Details (Scope-Volltext, Standortliste) nur mit `?t={verify_token}`, der im QR-Code steckt. Damit lässt sich das Register nicht durch Hochzählen auslesen.
- Weitere Nummernkreise: `K-` Kunden, `AN-` Angebote, `AU-` Aufträge, `AD-` Audits, `ZE-` Entscheidungen, `RE-` Rechnungen (nur Fallback ohne Billomat). Alle Kreise sind in der Verfahrensdokumentation beschrieben; Lücken durch Storno werden in `Historie` begründet.

### 6.4 Zertifikatsvorlage: Platzhalter Seite 1 und Seite 2

Vorlagen liegen als Google Docs je Mandant × Sprache. Platzhalter im Format `##feld##`, wie im Angebotssystem. Seite 2 ist im selben Doc (Seitenumbruch) oder ein eigenes Anhang-Doc; empfohlen: selbes Doc, damit ein PDF entsteht.

**Seite 1 (Urkunde)**

| Platzhalter | Quelle |
|---|---|
| `##aussteller_name##`, `##aussteller_logo##` | Mandanten |
| `##firma##`, `##strasse##`, `##plz_ort##`, `##land##` | Kunden / Hauptstandort |
| `##scope##` | Zertifikate.scope_{sprache} |
| `##norm##` (z. B. ISO 9001:2015), `##systemname##` (QM-System) | Normen (sprachabhängig) |
| `##zert_nr##`, `##ausfertigung##` (z. B. „/EN" oder leer) | Zertifikate, Ausfertigungen |
| `##erstzertifizierung##`, `##ausgestellt_am##`, `##gueltig_bis##` | Zertifikate |
| `##standorte_kurz##` („Hauptstandort Fürth und 2 weitere Standorte, siehe Anhang") | Standorte |
| `##norm_logo##`, `##qr_code##` | Logos, QR-Erzeugung |
| `##unterschrift_name##`, `##unterschrift_rolle##`, `##unterschrift_bild##` | Mandanten |
| `##hinweis_status##` („Gültigkeit online prüfen: …") | Texte |

**Seite 2 (Anhang: Verifizierung und Audit)**

| Block | Platzhalter |
|---|---|
| Verifizierung | `##qr_code_gross##`, `##verify_url##`, `##zert_nr##`, `##pdf_hash_kurz##` (erste 12 Zeichen SHA-256), `##hinweis_verifizierung##` |
| Audit | `##audit_typ##` (Erstzertifizierungsaudit Stufe 1+2 / Überwachungsaudit 1 / … ), `##audit_datum##`, `##audit_methode##` (Remote per Videokonferenz / vor Ort), `##audit_dauer##`, `##auditor##` (Leitender Auditor), `##co_auditor##` |
| Entscheidung | `##entscheidung_datum##`, `##entscheidung_gremium##` („Zertifizierungsausschuss OnlineCert") |
| Zyklus | `##zyklus_start##`, `##ua1_faellig##`, `##ua2_faellig##`, `##rezert_faellig##`, `##gueltig_bis##` |
| Standorte | `##standorte_tabelle##` (Standort-ID, Bezeichnung, Adresse, Tätigkeit) |
| Ausfertigungen | `##ausfertigungen_liste##` (welche Sprach-/Standortausfertigungen existieren) |
| Regeln | `##zeichennutzung_kurz##`, `##link_regeln##` |
| Fußzeile | Aussteller, Impressum-URL, Datenschutz-URL, Version, Erzeugungszeitpunkt |

### 6.5 Trigger und Tagesablauf des Systems

| Zeit | Trigger | Aufgabe |
|---|---|---|
| 05:30 | `statusLauf()` | Status aller Zertifikate neu berechnen (Ablauf, Karenz, Fälligkeiten), Historie schreiben |
| 06:00 | `erinnerungsLauf()` | Erinnerungen ÜA/Rezert/Ablauf/Angebote/Ausschuss senden, Log schreiben, Limit 200 Mails je Lauf, Fortsetzung bei Zeitüberschreitung |
| 06:30 | `rechnungsLauf()` | Rechnungsplan prüfen, fällige Rechnungen in Billomat anlegen und versenden, Zahlungsstatus lesen, Mahnstufen übernehmen |
| 06:45 | `registerSnapshot()` | öffentliches Register als JSON in GitHub-Branch/Netlify-Deploy schreiben (oder Drive-Datei, die Netlify Function liest) |
| 07:00 | `tagesliste()` | Aufgaben aggregieren, Tagesmail an Backoffice |
| stündlich | `warteschlange()` | Zertifikats-PDFs erzeugen (max. 40 je Lauf), Mails versenden, Fehler wiederholen (3 Versuche) |
| ereignisgesteuert | `doPost` | Anfrage, Angebot annehmen, Bericht hochladen, Votum abgeben, Aufgabe erledigen |
| sonntags | `backup()` | CSV-Export aller Blätter nach Drive-Ordner `Backup/{Datum}` und GitHub |

Quotenprüfung: 1000 Kunden erzeugen pro Tag im Schnitt weniger als 50 Mails und weniger als 20 PDFs; Reserve gegenüber 1500 Mails und 1500 Docs pro Tag ist zehnfach. Harte Grenze bleibt 6 Minuten je Lauf, daher Checkpoints in `PropertiesService` und Fortsetzungs-Trigger.

### 6.6 Sicherheit und Datenschutz

- Alle Geheimnisse in `PropertiesService` (Apps Script) und Netlify-Env. Repo enthält nur `.env.example`.
- Magic Links: Token = 32 Byte Zufall, Base64url, Ablauf 72 h, Einmalverwendung für Voten, Mehrfachverwendung für Portal bis Ablauf; Token-Hash im Sheet, nie Klartext.
- Verifizierungsseite liefert nur Firmendaten, Norm, Scope-Kurzform, Ort/Land, Status, Daten, Aussteller, Auditor-Name als Berufsrolle. Keine Ansprechpartner. Veröffentlichung wird in der Zertifizierungsvereinbarung geregelt; Opt-out für Einzelunternehmer möglich (dann nur Prüfung per Nummer, keine Listung).
- Append-only `Historie` und `Log`; Zertifikatszeilen werden nie gelöscht, nur Status geändert.
- Verifizierungsaufrufe werden nur aggregiert gezählt (Zähler je Zertifikat), keine IP-Speicherung.

---

## 7. Roadmap, Phasen und Aufwand

| Phase | Inhalt | Ergebnis | Aufwand (Umsetzung mit Claude) |
|---|---|---|---|
| **0 Fundament** (Woche 1–2) | Monorepo, clasp, Mandanten-/Kunden-/Normen-Blätter, Kundennummer im CRM, Header-Map-Bibliothek, Nummern mit LockService, Logs, Tests | Leeres, lauffähiges Backend mit Testmandant | 3–4 Tage |
| **1 Zertifikat & Verifizierung** (Woche 3–5) | Register, Ausfertigungen, Docs-Vorlagen DE/EN mit Seite 2, PDF-Erzeugung, QR, Hash, Versandmail, Verifizierungsseite auf Netlify, Statuslauf, Logo-Blatt, Migration virtualbadge-Bestand | Erste echte Zertifikate mit QR und Verifizierung | 6–8 Tage |
| **2 Ausschuss & Audit** (Woche 6–7) | Audits-Blatt, Auditorenstamm, Berichtsupload, Entscheidungsvorgang, Magic-Link-Votum, Quorum, Protokoll, automatische Zertifikatserzeugung nach Votum | Entscheidung und Ausgabe ohne Backoffice-Eingriff | 4–5 Tage |
| **3 Erinnerungen & Tagesliste** (Woche 8) | Erinnerungsketten, Karenz, Anruf-Aufgaben, Bounce-Aufgaben, Tagesmail, Admin-Dashboard | Backoffice arbeitet nur noch die Liste ab | 3–4 Tage |
| **4 Angebot → Auftrag → Rechnung** (Woche 9–10) | Angebotsnummern fortlaufend, Annahme per Link, Vereinbarung, Rechnungsplan, Billomat-Anbindung (Kunde, Rechnung, Status), Zahlungsregel | Kompletter Geldfluss automatisch | 5–6 Tage |
| **5 Portal & Kundenerlebnis** (Woche 11–12) | Kundenportal (Magic Link), Logo-Paket-Download, Web-Badge, Sprachen ES/FR, LinkedIn-Teilen, Verifizierungs-API, öffentliches Register | „Top für den Kunden" | 5–6 Tage |
| **6 Betrieb** (laufend) | Backup, Kennzahlen, Verfahrensdokumentation (GoBD, Zertifizierungsprozess), Testmandant, Schulung Backoffice | Stabiler Betrieb 2 h/Tag | 2–3 Tage + laufend |

Gesamt: rund 30 bis 36 Umsetzungstage über 12 Wochen. Phase 1 liefert bereits den Ersatz für virtualbadge.

---

## 8. Offene Entscheidungen (bitte festlegen)

| Nr. | Frage | Empfehlung |
|---|---|---|
| E1 | Normcode in der Zertifikatsnummer (`OC-9001-2026-…`) oder nicht (`OC-2026-…`)? | Ohne Normcode (Kombi-Zertifikate möglich, Norm als Feld) |
| E2 | Ein Zertifikat je Norm oder ein Kombi-Zertifikat bei 9001+14001? | Je Norm eigenes Zertifikat, Ausfertigungen teilen Audit und Entscheidung |
| E3 | Rezertifizierung: neue Nummer oder gleiche Nummer mit neuem Zyklus? | Neue Nummer, Feld `ersetzt_von`, Erstzertifizierung wird übernommen |
| E4 | Billomat bleibt Rechnungssystem (API nur im Business-Tarif) oder Wechsel zu sevdesk/easybill? | Billomat behalten, Anbindung existiert; Wechsel erst, wenn E-Rechnung 2028 es erzwingt |
| E5 | Zertifikat erst nach Zahlungseingang? | Ja für Neukunden, nein für Bestandskunden mit guter Zahlungshistorie; die Historie kommt aus dem Billomat-Rechnungsexport (M8.11), Regel je Kunde automatisch |
| E6 | Verifizierungs-Domain: `verify.onlinecert.de` oder Pfad auf qm-guru.de? | Eigene Subdomain je Mandant, Netlify-Site |
| E7 | Auditor-Name auf Seite 2 öffentlich in der Verifizierung? | Auf dem PDF ja, auf der Verifizierungsseite nur „Leitender Auditor: Ja, geprüft" ohne Namen (Datenschutz) |
| E8 | Digitale Signatur (PAdES) in Phase 1? | Nein, SHA-256-Hash auf Verifizierungsseite reicht; PAdES als Phase-6-Option |
| E9 | Zeitstempel/Karenz für Überwachungsaudits? | 90 Tage Karenz, danach Aussetzungsvorlage an Ausschuss |
| E10 | Ausschuss-Größe und Quorum? | 3 Mitglieder, 2 Ja-Stimmen für Erteilung, Einstimmigkeit für Entzug |
| E11 | Sprachen der ersten Version? | DE + EN, ES/FR in Phase 5 (Logos vorhanden) |
| E13 | Billomat-Tarif mit API (Business) bestätigen? | **Entschieden (18.09.2026): API ist vorhanden, Kunden- und Rechnungsdaten sind exportierbar.** Schreibzugriff (Rechnung anlegen) mit demselben Schlüssel im Testlauf prüfen; die bestehende Function `billomat-book-payment` zeigt, dass Schreiben funktioniert. |
| E14 | Terminfindung: Kunde wählt aus Slots oder Auditor vereinbart selbst? | **Entschieden (18.09.2026): Auditor vereinbart selbst und trägt ein.** |
| E15 | ÜA ohne Hauptabweichung ohne Ausschuss? | Ja, als Regel je Mandant |
| E16 | Kundendokumente: eigene Ablage oder Google Drive? | **Entschieden (18.09.2026): Google-Drive-Kundenordner, für den Kunden freigegeben.** |
| E12 | Migration des virtualbadge-Bestands: alle oder nur gültige? | Alle, mit Status `migriert` und ursprünglicher ID als Zusatzfeld, damit alte QR-Links per Weiterleitung funktionieren |

---

## 9. Vorschläge zur Optimierung der bestehenden Projekte

1. **Kontakt-Kunden-Import:** Kundennummer (`K-`) beim Anlegen vergeben und ins CRM schreiben; Token aus `Code.gs` in `PropertiesService`; Spaltenzugriff über Header-Namen; Dublettenprüfung vor dem Schreiben. Danach ist das CRM als Kundenstamm für das Zertifikatssystem nutzbar.
2. **Zertifizierung-angebot:** Angebotsnummer auf `AN-JJJJ-NNNN` mit `LockService` umstellen (heute Datum + Firmenkürzel, nicht fortlaufend); Preise ins Sheet statt in `PACKAGE_CATALOG`; Statusspalte (offen/angenommen/verfallen) ergänzen; Annahme-Link in die Angebotsmail; die Erinnerungsfunktion wird 1:1 als Bibliothek ins neue System übernommen.
3. **QM-logofuer-zertifikat:** Generator als Netlify Function bereitstellen, die aus einer Zertifikatsnummer das Logo-Paket erzeugt (Daten aus dem Register statt Handeingabe); Logos aus dem Repo in Drive-Ordner + `Logos`-Blatt verlagern; die Sprachtabelle (DE/EN/ES/FR) wird zum `Texte`-Blatt.
4. **virtualbage:** Um einen Export-Modus erweitern, der alle Recipients als CSV im Zielformat des Registers liefert (Migration), danach stilllegen.
5. **billomat:** Functions um `create-client`, `create-invoice`, `get-invoice-status` erweitern; Admin-Token-Muster beibehalten; Mock-Modus für Tests weiter nutzen.
6. **Skills:** Skill `qm-audit-iso9001` liefert künftig zusätzlich eine maschinenlesbare Zusammenfassung (JSON: Abweichungen, Empfehlung, Auditdaten) für den Ausschussvorgang; neue Skill „zertifikat-ausstellen" für Sonderfälle im Backoffice.
7. **Allgemein:** Ein zentrales Konfigurations-Sheet je Mandant statt `CONFIG`-Blöcke in jedem Skript; einheitliche Bibliothek `OcLib` (Header-Map, Nummern, Log, Mail, PDF) als Apps-Script-Library, die alle Projekte einbinden.

---

## 10. Quellen

**virtualbadge und Credential-Plattformen**
- https://help.virtualbadge.io/article/certificate-validation
- https://help.virtualbadge.io/article/dynamic-text
- https://help.virtualbadge.io/article/issue-expiry-dates-behaviour
- https://help.virtualbadge.io/article/private-label-validation
- https://help.virtualbadge.io/article/user-roles
- https://help.virtualbadge.io/article/api
- https://www.virtualbadge.io/features/validation-pages
- https://www.virtualbadge.io/features/certificate-management
- https://www.virtualbadge.io/de/funktionen/zertifikatszugriff
- https://www.virtualbadge.io/de/preise
- https://certifier.io/blog/virtualbadge-alternatives
- https://certifier.io/pricing
- https://support.certifier.io/en/articles/10835883-how-to-manage-issue-and-expiration-dates-for-credentials
- https://help.sertifier.com/what-are-expiry-reminders
- https://help.sertifier.com/verification-page
- https://sertifier.com/blog/multilingual-digital-credentials/
- https://www.accredible.com/solutions/more-features
- https://help.accredible.com/hc/en-us/articles/115003654829-Blockchain-Verification
- https://www.credly.com/docs/issued_badges
- https://www.certifyme.online/
- https://www.imsglobal.org/spec/ob/v3p0
- https://www.w3.org/TR/vc-data-model-2.0/
- https://www.w3.org/TR/vc-bitstring-status-list/

**Software für Zertifizierungsstellen**
- https://intact-systems.com/solutions/certification-bodies/management-system-certification/
- https://www.ecert-basic.com/
- https://zertic.com/ und https://www.zertic.com/pricing/ und https://www.zertic.com/certificationdecision/
- https://viasyst.com/
- https://certroute.com/ und https://www.capterra.com/p/10035445/CertRoute/
- https://docs.auditone.io/iso-os und https://www.auditone.io/tic-os
- https://www.kameon.io/de/audit/audit-certification
- https://audit-compass.ai/en/solutions/certification-bodies
- https://www.procert.ch/en/service/procert-portal-78.html

**Normen, IAF, DAkkS**
- https://www.iasonline.org/wp-content/uploads/2021/02/17021-1-2015-Section-8-1.pdf
- https://www.iasonline.org/wp-content/uploads/2021/02/17021-1-2015-Section-9.pdf
- https://european-accreditation.org/sp_accordion_faqs/question-37-15-certification-documents-8-2-of-iso-17021-1/
- https://iaf.nu/iaf_system/uploads/documents/IAF_MD5_Issue_4_Version_3_14062023.pdf
- https://iaf.nu/iaf_system/uploads/documents/IAF_MD1_Issue_3_18102023.pdf
- https://iaf.nu/iaf_system/uploads/documents/IAF_MD_28_Issue1_26102023.pdf
- https://support.iafcertsearch.org/certification-bodies/field-name-glossary/certification-fields-glossary
- https://support.iafcertsearch.org/certification-bodies/field-name-glossary/iaf-certsearch-dataset/certification-status
- https://iaf.news/2025/09/30/iaf-certsearch-api-real-time-verification/
- https://www.dakks.de/de/aktuelle-meldung/amtliche-mitteilung-keine-nutzungspflicht-der-datenbank-iaf-certsearch.html
- https://www.dakks.de/de/akkreditierungssymbol.html
- https://www.certqua.de/ausgesetzte-entzogene-zertifikate
- https://www.diqz.de/zertifizierungsstelle/ausgesetzte-und-entzogene-zertifikate/

**Rechnung, E-Rechnung, Mahnwesen, Datenschutz**
- https://www.gesetze-im-internet.de/ustg_1980/__14.html
- https://www.gesetze-im-internet.de/ustdv_1980/__34a.html
- https://www.bundesfinanzministerium.de/Content/DE/FAQ/e-rechnung.html
- https://www.datev.de/web/de/berufsgruppenuebergreifend/themen-im-fokus/e-rechnung-mit-datev/gesetzliche-regelungen
- https://www.haufe.de/finance/buchfuehrung-kontierung/fortlaufende-nummerierung-von-rechnungen-ausnahmen_186_387400.html
- https://www.gesetze-im-internet.de/bgb/__286.html
- https://www.billomat.com/automatischesmahnwesen/
- https://buchhaltungssoftware-test.de/buchhaltungssoftware-api.html
- https://dsgvo-gesetz.de/erwaegungsgruende/nr-14/
- https://www.datenschutz-praxis.de/grundlagen/daten-juristischer-personen-geschuetzt-oder-nicht/

**Google Apps Script**
- https://developers.google.com/apps-script/guides/services/quotas
- https://developers.google.com/apps-script/reference/lock/lock-service
- https://developers.google.com/apps-script/guides/support/best-practices
- https://workspaceupdates.googleblog.com/2026/04/faster-performance-and-doubled-cell-limits-in-Google-Sheets.html
- https://github.com/nayuki/QR-Code-generator
- https://github.com/zboris12/zgapdfsigner
- https://en.wikipedia.org/wiki/Google_Chart_API
