# Runde 3: Ist-Analyse der vorhandenen Sheets, Vorlage und Zertifikate

Stand: 18.09.2026 · Quellen: CRM „Super Master", Sheet „Rechnungen QM" mit Billomat-Skript, Zertifikatsverwaltung_2025, Docs-Vorlage „ISO 9001 Zertifikat - VORLAGE", Drive-Ordner Zertifikat, Beispielzertifikat TekkMinds AG (virtualbadge), Repo QM-logofuer-zertifikat (ZIP identisch mit dem geklonten Stand). Nur Leserechte.

---

## 1. Was die Quellen zeigen

### 1.1 CRM „Super Master" (Tabelle super Master, ~130 Spalten)

| Befund | Bedeutung für das System |
|---|---|
| Spalte A `Organisationsname`, Spalte B **`Organisations Nr.`** | Es gibt bereits eine Kundennummer im CRM. Sie wird zur K-Nr. des Zertifikatssystems (E25). |
| `zuständig`, `Prüfzwerge Projektleiter`, `laufender Kunde?`, `Vor Ort Kunde?`, `Nicht mehr Kunde` | Projektleiter und Kundenstatus existieren; Kundenart (Beratung/Zertifizierung/beides) fehlt noch. |
| `Zertifiizierer`, `Auditor`, `naechstes Zert. Audit`, `Zertifizierungstermin abgestimmt`, `Erstzertifizierung`, `Info Überwachungsaudit raus` | Zertifizierungsfelder liegen heute im CRM verstreut; künftig führt das Register diese Daten, das CRM behält nur K-Nr. und Kundenart. |
| Rechnungs- und Lieferadresse getrennt (`Rechnungsadresse`, `Rechnung Ort`, `Rechnung PLZ`, `Rechnung Land`) | Rechnungsadresse ist vorhanden; kein eigenes Blatt nötig. |
| Jahresspalten `2015` bis `2024` mit `bz` und `Datum` | Umsatz- und Zahlungshistorie je Jahr wird im CRM gepflegt; Billomat-Export ergänzt sie, ersetzt sie nicht. |
| Spaltenzugriff im bestehenden Skript über feste Indizes (A, C, BS, BW, CA, DZ) | Wie im Katalog gefordert: Umstellung auf Header-Namen, sonst bricht jede eingefügte Spalte den Import. |

### 1.2 Sheet „Rechnungen QM" mit Billomat-Menü

| Befund | Bedeutung |
|---|---|
| Spalten: `Nr. Rechnung` (QM-…), `Datum`, `Organisationsname` (Dropdown aus Super Master A), `Adresse`/`Ort`/`PLZ`/`Rechnung an Mail` (Lookup aus Super Master BS/BW/CA/I), `Leistung`, `Stunden`, `Euro Pro Stunde`, `km`, `Preis je km`, `RZ`, `RZ je Stnde`, `Sonstige Kosten Einmalig`, `Beschreibung`, `Beschreibung Kopfzeile`, `Summe`, `Mwst`, `Summe gesamt`, `Document URL`, `Email Status`, `Send Email`, `offen`, `Storno`, `Rechnung bezahlt`, `Mail 1..3` + `Datum1..3`, `Zertifikat erhalten`, `Veröffentlicht`, `Info Überwachungsaudit raus`, `Info Fördergeldantrag stellen`, `Land`, `USt` | **Die Rechnungsstellung ist fertig und läuft aus den Kundendaten.** Eine Zeile je Rechnung, Kunde per Dropdown, Adresse per Lookup, Haken in Spalte AF, Menü „Billomat → Rechnung erstellen". Mahnungen als Mail 1 bis 3 mit Datum. Prozessflags (Zertifikat erhalten, Veröffentlicht, Überwachungsaudit-Info) hängen an der Rechnungszeile. |
| Skript: Kunde in Billomat per Namenssuche finden oder anlegen, USt-IdNr aus dem Impressum der Kundendomain vorschlagen (Spalte BE), Billomat-Client-ID in Spalte BF, Rechnung + Positionen anlegen (Entwurf), Rechnungsnummer in die letzte Spalte schreiben | Anlage des Billomat-Kunden aus CRM-Daten passt zum Grundsatz „einmal erfassen". Die Rechnung bleibt in Billomat ein Entwurf (kein `complete`, kein Versand per API); Abschluss und Versand passieren in Billomat. |
| API-Schlüssel und Billomat-Konto stehen im Klartext im Skript und wurden im Chat mitgeteilt | **Schlüssel sofort in Billomat erneuern** (Einstellungen > Mitarbeiter > API) und in `PropertiesService` legen; nie in Sheets, Chats oder Repos. |
| Rechnungsnummer wird aus „letzte Zeile + 1" gebildet | Bei gleichzeitiger Nutzung Dublettengefahr; künftig `LockService` (M5.1-Muster). |

### 1.3 Zertifikatsverwaltung_2025 (Drive-Ordner „Zertifikat")

| Blatt | Befund |
|---|---|
| **Kunden** | `Kunde_ID` K-0001 bis K-0092, Firmenname, Adresse, Hauptkontakt, `Kunde_Status` (Aktiv/Archiv), `Erstzertifizierung`, `Anzahl_Zertifikate`, Spalten für IDs von Zertifikaten, Auditberichten, Kundendokumenten. Rund 90 Kunden. Zweite Kundennummer neben `Organisations Nr.` im CRM. |
| **Zertifikate** | `Zertifikat_ID` OC-0001 bis OC-0058, `Kunde_ID`, `Zertifikatstyp` (ISO 9001:2015, ISO 14001:2015, DIN 77200), `Zertifikats_Nummer` (leer; auf dem PDF steht die virtualbadge-UUID), `Erstzertifizierung_Datum`, `Ausstellungsdatum`, `Ablaufdatum`, `Tage_bis_Ablauf`, `Zertifikat_Status`, `Auditor_ID`/`Auditor_Name`, `Audit_Datum_Von/Bis`, `Audit_Typ` (Initial, Überwachungsaudit), `Auditbericht_Link`, `Vorgänger_Zertifikat_ID`, `Basis_Sprache`, je Sprache DE/EN/FR/ES/IT/RU/PT `_Link` und `_Status`, `Verfügbare_Sprachen`, `Anzahl_Sprachen`, `Abrechnungs_Status`, `Gesamtstatus` (Aktuell, Läuft bald ab, Abgelaufen, Archiviert, Eine Sprache, Mehrsprachig), `Letzte_Erinnerung`, `Erinnerung an Auditor`, `Kunde` (Erinnerungsdatum), `Zertifizierer` (QM-Guru, OnlineCert). |
| **Statistik / KPI-Dashboard** | Gültig 46, Warnung 9, Dringend 6, Kritisch 2, Abgelaufen 6 (Blatt Statistik); Dashboard vom 15.06.2026: 88 Zertifikate, 53 aktiv, 35 abgelaufen, Erfüllungsgrad 59 %, Ablauf je Monat für 12 Monate, Top-10 kritisch, Auditoren-Leistung. |
| **Auditoren** | AUD-0001 Holger Grosser (Remote), AUD-0002 Eudys, zwei Testeinträge. |
| **Mitarbeiter, Sprache** | Vorbereitet, leer. |
| **Spaltendoku** | Beschreibung eines Angebots-/Kundensheets (Firmenname, Geltungsbereich, Festpreis, Zertifizierungen, Mitarbeiter, Ansprechpartner, Mail-Status, Dokument-URL, Sprachversionen). |

**Wichtigste Erkenntnis: Das Zyklusmodell ist heute ein Jahresmodell.** Die meisten Zertifikate laufen ein Jahr (Ausstellung bis Ablauf), werden nach einem Überwachungsaudit neu ausgestellt und behalten das Erstzertifizierungsdatum. Einzelne laufen zwei oder drei Jahre (z. B. B7 Oil 2025 bis 2028, HME Tech bis 2027). Der Katalog ging vom Drei-Jahres-Zyklus akkreditierter Stellen aus. Das System muss beides können.

**Datenqualität, die der Import abfangen muss:** fehlende Adressen (K-0059, K-0060, K-0066 bis K-0071), Platzhaltertexte („Straße und Hausnummer", „Stadt" bei K-0058), verlorene führende Nullen bei PLZ (5134, 8393, 9526 statt 05134, 08393, 09526), uneinheitliche Datumsformate (20.2.2025 neben 20.02.2025), Dublette OC-0020 („doppelt"), Kunden mit „Anzahl_Zertifikate 0".

### 1.4 „Zertifikate Teil 2" und „Kunden QC" (Prototyp Juni 2025)

Ein früherer Eigenbau: Zertifikatsnummern `QC-2025-0001` und `ISO-2025/06-7537`, Verifizierungs-URL über eine Apps-Script-Web-App (`…/exec?verify=QC-2025-0001`), PDF-URL, Doc-URL, Logo-URL, Spalten `Abrechnungsstatus`, `Auditor`, `Auditbericht`, `Bezahlung Auditor`, `Rechnungsnummer`, Mailvorlage mit `{{ZERTIFIKAT_ID}}`, `{{VERIFY_URL}}`, `{{COMPANY_*}}`. Die Grundidee des Katalogs (Register + Web-App-Verifizierung + Docs-PDF) wurde also schon einmal angefangen. Muster und Platzhalterstil werden übernommen, der Prototyp selbst nicht.

### 1.5 Docs-Vorlage „ISO 9001 Zertifikat - VORLAGE"

Platzhalter im Stil `{{FELD}}`: `{{LOGO}}`, `{{NORM}}`, `{{ZERTIFIKAT_NR}}`, `{{FIRMENNAME}}`, `{{ADRESSE}}`, `{{PLZ}} {{ORT}}`, `{{GELTUNGSBEREICH}}`, `{{ERSTE_ZERTIFIZIERUNG}}`, `{{GUELTIG_AB}}`, `{{GUELTIG_BIS}}`. Eine Seite, keine Seite 2, kein QR, kein Auditdatum, keine Unterschrift als Platzhalter. Der Katalog verwendete `##feld##`; ab jetzt gilt der vorhandene Stil `{{FELD}}`.

### 1.6 Beispielzertifikat TekkMinds AG (virtualbadge, 08.09.2026)

**Seite 1 (eigenes Layout):** Logo Grosser QM-Dienstleistungen, „ZERTIFIKAT", Aussteller, Firma, Adresse, Geltungsbereich, „ein Qualitätsmanagementsystem eingeführt hat und anwendet", „Durch ein Audit am 08/09/2026 wurde der Nachweis erbracht, dass die Forderungen der ISO 9001:2015 erfüllt sind", gültig vom 08/09/2026 bis 08/09/2027, Zertifikat-Nr. = virtualbadge-UUID, Unterschrift, Ort/Datum, Fußzeile, QR-Code unten rechts, senkrechter Schriftzug „ZERTIFIKAT ISO 9001 2015" am Rand. Das Auditdatum steht bereits auf Seite 1.

**Seite 2 (virtualbadge „Details"):** Aussteller, Empfänger, Zertifikatsname, Ausstellungs- und Ablaufdatum, Identifikationsnummer, Validierungs-URL, QR „Jetzt validieren". Keine Auditor-, Audit- oder Entscheidungsangaben. Genau diese Seite wird durch die eigene Seite 2 ersetzt.

Nummer und QR verweisen auf `virtualbadge.io/certificate-validator?credential={UUID}`. Alte Zertifikate müssen nach der Migration über diese UUID weiter auffindbar bleiben (Alias im Register, Weiterleitung sobald virtualbadge abgeschaltet wird).

### 1.7 Drive-Ordner „Zertifikat"

Enthält Zertifikatsverwaltung_2025, zwei Vorlagen-Docs gleichen Namens, Ordner ISO_Zertifikate_PDFs (leer sichtbar), QC_Certificates, Audit_teestwer, die Prototyp-Sheets. Ordnerstruktur je Kunde (`Kunden/{K-Nr}/…`) existiert noch nicht.

---

## 2. Folgen für den Katalog

| Nr. | Änderung | Betrifft |
|---|---|---|
| F01 | **Rechnungen bleiben im Sheet „Rechnungen QM".** Das Zertifikatssystem stellt keine Rechnungen. Es legt zum Stichtag eine **vorbereitete Rechnungszeile** an (Organisationsname, Leistung aus Preisblatt, Festpreis, Beschreibung Kopfzeile mit Zertifikatsnummer, Rechnung an Mail) und setzt sie auf „bereit". Backoffice setzt den Haken und nutzt das vorhandene Billomat-Menü. Das System liest `offen`, `Rechnung bezahlt`, `Storno`, `Mail 1..3` zurück und leitet daraus Zahlungsstatus, Mahnstufe und die Regel „Zertifikat erst nach Zahlung" ab. | M8 (neu gefasst), R21 bis R23, Runde 2 Kap. 4 wird zur Option für später |
| F02 | **Zyklusmodell je Zertifikat:** `gueltigkeit_jahre` (1, 2 oder 3) mit Regel je Mandant. Jahresmodell: jährliches Überwachungsaudit, Neuausstellung mit gleicher Erstzertifizierung, neue Ausgabe-Nummer. Drei-Jahres-Modell: ÜA1, ÜA2, Rezertifizierung wie im Katalog. Erinnerungen laufen immer gegen `gueltig_bis` und `naechstes_audit`. | M3.1, M5.9, M7.2, R24 bis R29 |
| F03 | **Platzhalterstil `{{FELD}}`** statt `##feld##`; vorhandene Vorlage wird um Seite 2 ergänzt (Verifizierung, Auditor, Auditart, Auditdatum, Entscheidung, Standorte). Das Auditdatum bleibt zusätzlich auf Seite 1 wie heute. | 6.4 |
| F04 | **Kundennummer:** `Organisations Nr.` im CRM wird die K-Nr. Die K-0001-Nummern der Zertifikatsverwaltung werden im Import auf die CRM-Nummer gemappt (Zuordnungstabelle, Historie). Sind beide leer, vergibt der Import eine neue Nummer mit `LockService`. | M1.1, M1.11, M1.13, E25 |
| F05 | **Sprachen:** sieben Sprachspalten existieren (DE, EN, FR, ES, IT, RU, PT); Logos nur für DE/EN/ES/FR. `Texte` und `Vorlagen` werden für sieben Sprachen angelegt, Logos bei Bedarf ergänzt. | M5.5, M6.4 |
| F06 | **Normen:** ISO 9001:2015, ISO 14001:2015, DIN 77200 (Sicherheitsdienstleistungen) sind in Betrieb; ISO 45001 hat Logos. `Normen`-Blatt startet mit diesen vier. | M5.3, `Normen` |
| F07 | **Mandanten:** „QM-Guru" und „OnlineCert" sind als Zertifizierer in Gebrauch. Beide werden als Mandanten angelegt, Nummernkreise getrennt. | M1.5 |
| F08 | **Migration:** 88 Zertifikate (53 aktiv, 35 abgelaufen) und rund 90 Kunden aus Zertifikatsverwaltung_2025 plus virtualbadge-Bestand. Alias-Feld `alt_id` (OC-0001, virtualbadge-UUID) im Register; Verifizierung findet auch alte IDs. Datenqualitätsprüfung (Adresse, PLZ mit führender Null, Datumsformat, Dubletten) mit Aufgabenliste. | M1.6, M1.12, Runde 2 4.8 |
| F09 | **Statusmodell** übernimmt die bewährten Anzeigeformen (Aktuell, Läuft bald ab, Abgelaufen, Archiviert, Eine Sprache, Mehrsprachig) als abgeleitete Anzeige; der eine Statuswert bleibt wie in 3.2 des Katalogs. | 3.2 |
| F10 | **Sicherheit:** Billomat-API-Schlüssel erneuern und in `PropertiesService`; Rechnungsnummer mit `LockService`; Web-App-Verifizierung des Prototyps abschalten, sobald die neue läuft. | M11.1 |
| F11 | **Auditoren:** AUD-0001 und AUD-0002 werden die ersten Nutzer der Auditor-App; Feld `google_konto` ergänzen. | M3.2 |
| F12 | **KPI-Dashboard** aus der Zertifikatsverwaltung wird als Vorbild für M10.4 übernommen (Ablauf je Monat, Top-10 kritisch, Erfüllungsgrad). | M10.4 |

---

## 3. Neu gefasstes Modul M8: Rechnungen aus Kundendaten

| Nr. | Anforderung | Prio |
|---|---|---|
| M8.1 | Rechnungen entstehen ausschließlich im Sheet „Rechnungen QM" aus den CRM-Kundendaten, wie heute. Das Zertifikatssystem erzeugt keine Rechnungen und ruft Billomat nicht selbst auf. | M |
| M8.2 | Rechnungsplan je Auftrag (Erst, jährlich oder ÜA1/ÜA2/Rezert je Zyklusmodell) im Blatt `Rechnungen` der Mandantendatei mit `faellig_am`, `leistung`, `festpreis`, `status` (geplant, bereit, gestellt, bezahlt, storniert). | M |
| M8.3 | Rechnungslauf 06:30: für jede fällige Zeile eine **vorbereitete Zeile** in „Rechnungen QM" anlegen (Organisationsname, Adresse per Lookup, Rechnung an Mail, Leistung, Festpreis in `Rechung Fest /Stunden`, Beschreibung Kopfzeile mit Zertifikatsnummer und Zeitraum, `Land`, `USt`), Kennzeichen „bereit"; Rückverweis `rechnung_ref` in beide Richtungen. Kein Haken in Spalte AF, damit nichts ungeprüft nach Billomat geht. | M |
| M8.4 | Tagesliste: Gruppe „Freigeben" zeigt vorbereitete Rechnungszeilen mit Link auf die Zeile; Freigabe und Billomat-Übergabe bleiben der bestehende Menüpunkt. | M |
| M8.5 | Rückfluss: täglich `Nr. Rechnung`, `offen`, `Rechnung bezahlt`, `Storno`, `Mail 1..3`, `Datum1..3` aus „Rechnungen QM" lesen und in `Rechnungen` spiegeln; daraus Zahlungsstatus, Mahnstufe und Zahlungsampel je Kunde. | M |
| M8.6 | Regel „Zertifikat erst nach Zahlung" je Mandant und Kunde liest `Rechnung bezahlt`; Ausnahme über Zahlungsampel (E5). | S |
| M8.7 | Die Prozessflags `Zertifikat erhalten`, `Veröffentlicht`, `Info Überwachungsaudit raus` in „Rechnungen QM" werden vom System gesetzt, sobald Versand, Registereintrag und Erinnerung erfolgt sind, damit die gewohnte Sicht weiter stimmt. | S |
| M8.8 | Bestehendes Billomat-Skript: Schlüssel in `PropertiesService`, Rechnungsnummer mit `LockService`, Kundensuche zusätzlich über `client_number` = K-Nr. (heute nur Name). Sonst unverändert. | M |
| M8.9 | Vollautomatik (Rechnung abschließen und versenden per API, Runde 2 Kap. 4) bleibt als spätere Option dokumentiert und wird erst gebaut, wenn das Backoffice die Freigabe nicht mehr sehen will. | C |

---

## 4. Ergänzte Entscheidungen

| Nr. | Frage | Empfehlung |
|---|---|---|
| E24 | Öffentliche Zertifikatsnummer: interne ID `OC-0059` weiterführen oder Katalog-Schema `OC-2026-00059-7`? | Katalog-Schema für neue Zertifikate; `OC-0001`-IDs und virtualbadge-UUIDs als `alt_id` behalten und verifizierbar lassen. |
| E25 | Welche Kundennummer ist führend: `Organisations Nr.` (CRM) oder `Kunde_ID` (Zertifikatsverwaltung)? | CRM. Zuordnungstabelle im Import, danach nur noch eine Nummer. Bitte prüfen, ob `Organisations Nr.` im CRM durchgehend gefüllt ist. |
| E26 | Standard-Gültigkeit für neue Zertifikate: 1 Jahr (wie heute) oder 3 Jahre mit Überwachung? | 1 Jahr als Voreinstellung je Mandant, 3 Jahre als Option je Auftrag; beides im Regelwerk abgebildet. |
| E27 | Sieben Sprachen von Anfang an oder DE/EN zuerst? | Vorlagen für alle sieben anlegen (Übersetzung einmalig), Logos für IT/RU/PT nachziehen, wenn erste Anfrage kommt. |
