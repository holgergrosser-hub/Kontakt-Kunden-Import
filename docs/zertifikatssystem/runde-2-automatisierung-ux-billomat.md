# Runde 2: Automatisierungskette, UX je Rolle, Billomat-Anbindung, Erweiterbarkeit

Stand: 18.09.2026 · Ergänzung zum [Anforderungskatalog](anforderungskatalog.md) · Status: Entwurf zur Freigabe

**Inhalt**

0. Verbesserter Auftrag
1. Leitprinzipien: transparent, einfach, erweiterbar
2. Die Automatisierungskette Kunde → Auditor → Kunde → Backoffice (Übergabepunkte, Ereignisse, Eskalation)
3. UX je Rolle (Kunde, Auditor, Ausschuss, Backoffice, Öffentlichkeit)
4. Billomat-Anbindung im Detail
5. Erweiterbarkeit ohne Komplexität (Regelwerk-Blatt, Feature-Schalter, Simulation)
6. Manuelle Eingriffe: vorher / nachher
7. Delta zum Anforderungskatalog (neue und geänderte Anforderungen)
8. Nächste Schritte

---

## 0. Verbesserter Auftrag

Ursprünglich: „Dreh noch eine Runde zur Optimierung Automatisierung Kunde – Auditor – Kunde – Backoffice, Anbindung an Billomat, UX für alle, flexibel erweiterbar, aber immer transparent und einfach."

So ausgeführt:

> Optimiere den Anforderungskatalog in vier Punkten. **(1) Automatisierungskette:** Beschreibe jeden Übergabepunkt zwischen Kunde, Auditor und Backoffice als Ereignis mit Auslöser, automatischer Aktion, Frist, Erinnerung und Eskalation, so dass das Backoffice nur bei Ausnahmen eingreift. **(2) Billomat:** Lege fest, welche Objekte (Kunde, Angebot, Auftrag, Rechnung, Zahlung, Mahnung) wie mit Billomat synchronisiert werden, mit Endpunkten, Reihenfolge, Idempotenz und Fehlerbehandlung. **(3) UX:** Definiere für jede Rolle den einen Bildschirm, den sie braucht, mit festen Gestaltungsregeln, damit Kunde, Auditor, Ausschuss und Backoffice ohne Schulung arbeiten. **(4) Erweiterbarkeit:** Zeige, wie neue Normen, Mandanten, Sprachen, Ereignisse und Preise ohne Codeänderung hinzukommen, und wie jede Automatik jederzeit sichtbar, abschaltbar und simulierbar bleibt.

---

## 1. Leitprinzipien: transparent, einfach, erweiterbar

Diese sieben Regeln gelten für jede Funktion. Eine Anforderung, die gegen eine Regel verstößt, wird nicht gebaut, sondern vereinfacht.

| Nr. | Regel | Was das konkret heißt |
|---|---|---|
| P1 | **Ein Status, eine Wahrheit** | Jedes Objekt (Angebot, Audit, Zertifikat, Rechnung) hat genau ein Statusfeld. Portal, Verifizierung, Tagesliste und Mails lesen dasselbe Feld. Keine abgeleiteten Zweitstatus. |
| P2 | **Jede Automatik ist sichtbar** | Jede automatische Aktion schreibt eine Zeile in `Historie` (wer/was/warum/Regel-Nr.) und ist im Kundendatensatz als Zeitleiste lesbar. Jede Mail an Kunden oder Auditoren endet mit einem Satz „Diese Nachricht wurde automatisch ausgelöst durch: Regel R12 (Überwachungsaudit in 90 Tagen fällig)". |
| P3 | **Jede Automatik ist abschaltbar** | Regeln stehen im Blatt `Regelwerk` mit Spalte `aktiv`. Ein Mandant kann jede Regel ausschalten oder die Frist ändern, ohne Code. |
| P4 | **Ein Bildschirm, eine Aufgabe** | Jede Rolle bekommt je Aufgabe genau eine Seite mit genau einem Hauptknopf. Keine Menüs mit zehn Einträgen. Das Portal des Kunden ist eine Seite; die Auditor-App ist je Audit eine Seite; das Votum ist eine Seite. |
| P5 | **Der nächste Schritt steht immer oben** | Jede Seite beginnt mit „Nächster Schritt: … bis …". Wenn nichts zu tun ist, steht da „Nichts zu tun. Nächster Termin: …". |
| P6 | **Konfiguration statt Code** | Normen, Mandanten, Sprachen, Preise, Fristen, Mailtexte, Regeln, Checklisten liegen in Blättern. Code enthält nur Mechanik (Lesen, Rechnen, Erzeugen, Senden). |
| P7 | **Simulation vor Ausführung** | Jeder Tageslauf kann als Probelauf gestartet werden („Was würde heute passieren?"). Das Backoffice sieht die Liste, bevor eine Mail rausgeht. Neue Regeln laufen die ersten 14 Tage nur im Probelauf. |

Was bewusst **nicht** gebaut wird, weil es gegen „einfach" verstößt: ein eigener Zertifikats-Designer (Google Docs reicht), ein Rollen-Rechte-System mit 20 Rechten (vier Rollen genügen), Workflow-Editor mit Drag-and-drop (Regelwerk-Blatt genügt), Chat im Portal (E-Mail mit Antwort-Erkennung genügt), Passwörter (Magic Links genügen).

---

## 2. Die Automatisierungskette Kunde → Auditor → Kunde → Backoffice

### 2.1 Grundidee: Übergabepunkte statt Prozessschritte

Die Arbeit liegt nicht in den Schritten, sondern in den Übergaben: Kunde wartet auf Auditor, Auditor wartet auf Kunde, Backoffice wartet auf beide. Jede Übergabe wird deshalb als **Ereignis mit Frist** modelliert. Das System kennt für jedes Ereignis:

1. **Auslöser** (wer/was löst es aus),
2. **Automatische Aktion** (was das System sofort tut),
3. **Frist** (bis wann die Gegenseite reagieren soll),
4. **Erinnerung** (was passiert, wenn die Frist zur Hälfte / ganz verstrichen ist),
5. **Eskalation** (wann es auf der Tagesliste des Backoffice landet),
6. **Sichtbarkeit** (was Kunde, Auditor, Backoffice währenddessen sehen).

Das Backoffice sieht eine Übergabe nur, wenn die Eskalation greift. Läuft alles fristgerecht, bleibt die Tagesliste leer.

### 2.2 Die Kette im Überblick (Schwimmbahnen)

```
KUNDE            │ Anfrage ──► Angebot annehmen ──► Unterlagen in Drive ──► Termin bestätigen ─► Audit ──► Nachweise zu Abweichungen ──► Zertifikat/Logo abrufen ──► (Jahr 1/2) Termin wählen ──► …
                 │    │              │                     │                    │              │              │                              ▲                          │
SYSTEM           │ Angebot-PDF   Auftrag, Billomat-   Vollständigkeits-    Auditor-Vor-    Auditplan,   CAP-Frist,         Ausschuss-     Zertifikat, PDFs,          Erinnerungen 120/90/60/30,
(Regelwerk)      │ + Mail        Kunde, Vereinbarung, prüfung, Stufe-1-    schlag, Termin- Bericht-     Erinnerung,        vorgang,       Logo-Paket, Verifizierung, Rechnung ÜA, Auditor-
                 │               Checkliste, Portal   Vorlage an Auditor   schlag, Termin- Gerüst       Freigabe-Link      Voten, Quorum  Rechnung, Portal-Update   Vorschlag, Termin-Slots
                 │                                          │                    │              │              │                 │                                        │
AUDITOR          │                                    Stufe 1: Dokumente  Termin mit Kunde Audit durch-  Nachweise prüfen,  (ausge-       Bericht ist Grundlage      Überwachungsaudit
                 │                                    prüfen, Ergebnis    vereinbaren und  führen, Fest-  Abweichung         schlossen)                               durchführen, Bericht
                 │                                    per Klick           eintragen        stellungen,    schließen
                 │                                                                         Bericht senden
AUSSCHUSS        │                                                                                                          Votum per
                 │                                                                                                          Magic Link
BACKOFFICE       │ (nur bei Eskalation) Angebot ohne Antwort 30 T · Unterlagen fehlen 21 T · kein Termin 14 T · Bericht fehlt 5 T nach Audit · CAP überfällig · Votum fehlt 7 T · Zahlung offen Mahnstufe 2
```

### 2.3 Ereigniskatalog (Regelwerk)

Jede Zeile ist eine Regel im Blatt `Regelwerk`. Fristen sind Vorschläge und je Mandant änderbar. „BO" = Backoffice-Tagesliste.

**Phase A: Anfrage bis Auftrag**

| Regel | Auslöser | Automatische Aktion | Frist | Erinnerung | Eskalation an BO |
|---|---|---|---|---|---|
| R01 | Anfrage über Website/Formular/Mail (Claude erkennt Felder) | Kunde anlegen (K-Nr., Dublettenprüfung), Angebot berechnen (Paket × Normen × Standorte), PDF erzeugen, Angebotsmail mit Annahme-Link; Billomat-Kunde anlegen | Annahme in 30 Tagen | Tag 7, 14 (Mail) | Tag 30: Anruf-Aufgabe; Tag 60: Angebot `verfallen` |
| R02 | Kunde klickt „Angebot annehmen" (oder lädt unterschriebenes PDF hoch) | Auftrag AU- anlegen, Zyklus berechnen, Zertifizierungsvereinbarung als PDF, Rechnungsplan anlegen, Billomat-Auftragsbestätigung, Portal-Link, Willkommensmail mit Unterlagen-Checkliste | Unterlagen in 21 Tagen | Tag 10, 18 | Tag 21: Aufgabe „Unterlagen anfordern (Telefon)" |
| R03 | Angebot enthält Sonderwunsch (Freitext) | Claude fasst zusammen, Aufgabe „Angebot prüfen" | – | – | sofort |

**Phase B: Unterlagen und Stufe 1**

| Regel | Auslöser | Automatische Aktion | Frist | Erinnerung | Eskalation an BO |
|---|---|---|---|---|---|
| R04 | Neue Datei im Drive-Kundenordner `Kunden/{K-Nr}/Unterlagen` (Kunde legt sie direkt im freigegebenen Ordner ab oder lädt sie im Portal hoch, was in denselben Ordner schreibt) | Stündlicher Ordner-Scan: Checkliste abhaken (Dokumenttyp per Dateiname/Claude), Fortschritt im Portal, Auditor sieht den Ordner | – | – | – |
| R05 | Checkliste vollständig (alle Pflichtdokumente) | Auditor-Vorschlag (Norm, Sprache, Sperrliste, Auslastung), Stufe-1-Auftrag an Auditor mit Link; Skill qm-auditvorbereitung erzeugt Vorprüfbericht als Entwurf | Stufe 1 in 10 Tagen | Tag 5 an Auditor | Tag 10: Aufgabe „Auditor mahnen / umplanen" |
| R06 | Auditor meldet Stufe-1-Ergebnis „bereit" | Terminphase starten (R07) | – | – | – |
| R07 | Auditor meldet „nicht bereit" mit Lückenliste | Mail an Kunden mit Lückenliste und Upload-Link, Checkliste erweitert | 14 Tage | Tag 7 | Tag 14: Anruf-Aufgabe |

**Phase C: Terminierung**

| Regel | Auslöser | Automatische Aktion | Frist | Erinnerung | Eskalation an BO |
|---|---|---|---|---|---|
| R08 | Stufe 1 bereit | Auditor erhält Aufgabe „Termin mit Kunden vereinbaren" (Kontaktdaten, Wunschzeitraum des Kunden aus dem Angebot, Fälligkeit); Kunde erhält Mail „Ihr Auditor meldet sich zur Terminabstimmung" | Auditor trägt Termin in 14 Tagen ein | Tag 7 an Auditor | Tag 14: Aufgabe „Termin nachfassen" |
| R09 | Auditor trägt vereinbarten Termin in der Auditor-App ein (Datum, Uhrzeit, Methode, Dauer) | Kalendereintrag für beide, Videokonferenz-Link, Auditplan (Skill qm-auditplan) als PDF, Bestätigungsmail an Kunden mit Knopf „Termin passt" / „Termin ändern" | Kunde bestätigt in 5 Tagen, sonst gilt der Termin als bestätigt | 7 Tage vor Audit: Erinnerung + Vorbereitungsliste an Kunde | – |
| R10 | Kunde klickt „Termin ändern" oder Auditor verschiebt | Auditor erhält Aufgabe „neuen Termin vereinbaren", alter Kalendereintrag wird gelöscht, Historie | 14 Tage | Tag 7 | zweite Verschiebung: Aufgabe |

**Phase D: Audit und Bericht**

| Regel | Auslöser | Automatische Aktion | Frist | Erinnerung | Eskalation an BO |
|---|---|---|---|---|---|
| R11 | Audittermin erreicht | Auditor-App öffnet Audit mit Checkliste je Normkapitel, Feststellungsformular, Zeiterfassung | Bericht in 5 Tagen | Tag 3 an Auditor | Tag 5: Aufgabe „Bericht fehlt" |
| R12 | Auditor klickt „Audit abschließen" | Bericht aus Feststellungen erzeugen (Docs-Vorlage; optional Skill qm-audit-iso9001 für Volltext), Auditor prüft und gibt frei | – | – | – |
| R13 | Bericht freigegeben, **keine** Hauptabweichung | Ausschussvorgang ZE- anlegen (R17), Kunde erhält Bericht + Hinweis „Entscheidung läuft" | – | – | – |
| R14 | Bericht freigegeben, **mit** Abweichungen | CAP-Vorgang je Abweichung, Mail an Kunden mit Nachweis-Upload-Link | Haupt: 30 Tage, Neben: 60 Tage | Hälfte, 5 Tage vor Frist | Fristablauf: Aufgabe; nach 90 Tagen Aussetzungsvorlage |
| R15 | Kunde lädt Nachweis hoch | Auditor bekommt Prüf-Link (Klick: akzeptiert / nachbessern) | Auditor 5 Tage | Tag 3 | Tag 5: Aufgabe |
| R16 | Alle Hauptabweichungen geschlossen | R13 | – | – | – |

**Phase E: Entscheidung und Zertifikat**

| Regel | Auslöser | Automatische Aktion | Frist | Erinnerung | Eskalation an BO |
|---|---|---|---|---|---|
| R17 | Ausschussvorgang angelegt | Zusammenfassung (Claude, 10 Zeilen), Magic Links an Mitglieder ohne Interessenkonflikt | Votum in 5 Tagen | Tag 3 | Tag 7: Aufgabe „Ausschuss mahnen"; Vertreterregel |
| R18 | Quorum erreicht, positiv | Zertifikatsnummer, alle Ausfertigungen als PDF, Hash, Register `gueltig`, Logo-Paket, Verifizierung aktiv, **Zahlungsprüfung** (Regel je Mandant), Versandmail | – | – | Zahlung offen: Zertifikat wartet, Kunde bekommt Mail „Zertifikat liegt bereit, Rechnung offen" |
| R19 | Quorum erreicht, negativ oder Rückfrage | Aufgabe „Kunde informieren" mit Textbaustein, Vorgang zurück an Auditor | – | – | sofort |
| R20 | Zertifikat versendet | Portal aktualisiert, Erinnerungskette für ÜA1 gesetzt, Auditor bekommt „erledigt", Rechnungsplan-Termine gesetzt | – | – | – |

**Phase F: Geldfluss**

| Regel | Auslöser | Automatische Aktion | Frist | Erinnerung | Eskalation an BO |
|---|---|---|---|---|---|
| R21 | Rechnungsplan-Termin erreicht (Erst bei Auftrag oder Zertifikat, ÜA1/ÜA2 je Jahrestag, Rezert 3 Monate vor Ablauf) | Rechnung in Billomat: Entwurf → Positionen aus Artikelstamm → abschließen → per Billomat versenden (PDF/E-Rechnung) | Zahlungsziel 14 Tage | Billomat-Mahnwesen Stufe 1/2/3 | Mahnstufe 2: Anruf-Aufgabe |
| R22 | Zahlung in Billomat gebucht (täglicher Abgleich) | Status `bezahlt`, wartende Zertifikate freigeben (R18), Portal zeigt „bezahlt" | – | – | – |
| R23 | Rechnung 60 Tage überfällig | Aussetzungsvorlage an Ausschuss (Regel je Mandant) | – | – | Aufgabe |

**Phase G: Überwachung und Rezertifizierung**

| Regel | Auslöser | Automatische Aktion | Frist | Erinnerung | Eskalation an BO |
|---|---|---|---|---|---|
| R24 | ÜA fällig in 120 Tagen | Auditor-Vorschlag (möglichst derselbe wie zuletzt), Aufgabe „Termin vereinbaren" an Auditor (R08), Mail an Kunden „Überwachungsaudit steht an, Ihr Auditor meldet sich" mit Unterlagen-Kurzliste | Termin eingetragen in 30 Tagen | 90, 60 | 60 Tage: Anruf-Aufgabe |
| R25 | ÜA durchgeführt, Bericht frei | Kein Ausschuss nötig bei ÜA ohne Hauptabweichung (Regel je Mandant), Status bleibt `gueltig`, `ua1_erledigt`, Seite 2 wird neu erzeugt (Version) | – | – | – |
| R26 | ÜA-Frist überschritten | Status `ueberwachung_faellig`, Verifizierung zeigt gelb, Mail mit Karenzfrist | 90 Tage Karenz | 30, 7 | Karenzende: Aussetzungsvorlage |
| R27 | Rezert fällig in 180 Tagen | Wie R24, zusätzlich Angebot für neuen Zyklus (Preise aktuell) mit Annahme-Link | Annahme 60 Tage | 120, 90 | 90 Tage: Anruf-Aufgabe |
| R28 | Rezert positiv entschieden | Neue Zertifikatsnummer, `ersetzt_von`, Erstzertifizierung übernommen, altes Zertifikat `ersetzt` | – | – | – |
| R29 | Gültig-bis erreicht ohne Rezert | Status `abgelaufen`, Verifizierung grau, Mail „Logo entfernen" | 14 Tage | – | Aufgabe nur bei Antwort des Kunden |

**Querschnitt**

| Regel | Auslöser | Automatische Aktion | Eskalation |
|---|---|---|---|
| R30 | Mail-Bounce | Aufgabe „Kontaktdaten prüfen", Portal-Hinweis beim nächsten Login | sofort |
| R31 | Kunde antwortet auf eine Systemmail | Claude klassifiziert (Termin, Rechnung, Standort, Sprache, Beschwerde, Sonstiges) → passende Aufgabe mit Entwurf der Antwort | sofort |
| R32 | Kunde meldet Standort/Namensänderung im Portal | Angebot Erweiterung (R01-Logik), bei Namensänderung Neuausgabe-Vorgang | Aufgabe „prüfen" |
| R33 | Trigger-Fehler | Wiederholung 3×, dann Aufgabe mit Fehlertext | sofort |

### 2.4 Was der Auditor konkret automatisch bekommt

Der Auditor ist der teuerste Engpass. Deshalb liefert das System ihm alles vorbereitet:

- Stufe 1: Ordner mit allen Unterlagen, Vorprüfbericht-Entwurf (Skill), Ein-Klick-Ergebnis „bereit / nicht bereit + Lücken".
- Termin: Der Auditor vereinbart den Termin selbst mit dem Kunden (Telefon oder Mail) und trägt ihn in der Auditor-App ein. Alles Weitere (Kalender, Videolink, Auditplan, Bestätigung, Erinnerungen) erzeugt das System aus diesem einen Eintrag. Keine Slot-Verwaltung, keine Kalenderfreigabe nötig.
- Audit: Checkliste je Norm und Kapitel (Blatt `Checklisten`), letzte Feststellungen des Kunden vorgeblendet, Zeiterfassung, Bericht per Klick.
- Abweichungen: Nachweise kommen mit Prüf-Link, zwei Knöpfe.
- Honorar: Auditor-Gutschrift je abgeschlossenem Audit als Aufgabe für BO (oder Billomat-Eingangsrechnung, Phase 6).
- Keine Verwaltungsarbeit: Nummern, Vorlagen, Versand, Ausschuss laufen ohne ihn.

### 2.5 Was der Kunde konkret automatisch bekommt

- Nach jeder Aktion sofort eine Bestätigung mit dem nächsten Schritt und Datum.
- Eine Seite (Portal), auf der der ganze Zyklus als Zeitleiste steht: erledigt / jetzt / geplant.
- Nie eine Mail ohne Knopf. Nie ein Passwort.
- Zertifikat, Logo, Verifizierung und Rechnung in einer Mail.
- Erinnerungen so früh, dass die Terminabstimmung mit dem Auditor bequem ist (120 Tage), und so klar, dass keine Rückfrage nötig ist.
- Unterlagen liegen im Google-Drive-Kundenordner, den der Kunde ohnehin kennt (Beratungsprojekt); der Kunde legt Dateien dort ab, das Portal zeigt nur den Fortschritt.

---

## 3. UX je Rolle

### 3.1 Gemeinsame Gestaltungsregeln (gelten für alle fünf Oberflächen)

| Regel | Umsetzung |
|---|---|
| Eine Seite je Aufgabe, ein Hauptknopf | Der Hauptknopf ist groß und farbig, alle anderen Aktionen sind Textlinks. |
| „Nächster Schritt" oben | Erste Zeile jeder Seite: Was, bis wann, von wem. |
| Status-Ampel überall gleich | grün gültig / gelb wartet auf jemanden / orange ausgesetzt oder überfällig / rot entzogen oder abgelehnt / grau abgelaufen oder erledigt. Gleiche Farben in Portal, Verifizierung, Tagesliste, Mails. |
| Zeitleiste statt Tabelle | Vorgänge werden als senkrechte Zeitleiste gezeigt: erledigt (Haken), jetzt (Ampel), geplant (Datum). |
| Handy zuerst | Alle Seiten für 360 px Breite gebaut; Auditor arbeitet auch auf dem Tablet, Ausschuss stimmt vom Handy ab. |
| Sprache automatisch | Sprache aus Kundendatensatz bzw. Zertifikatsausfertigung; Umschalter oben rechts. |
| Kein Login, wo ein Link reicht | Kunde, Ausschuss: Magic Link. Auditor, Backoffice: Google-Login. |
| Jede Mail hat einen Knopf und einen Satz „warum" | Knopf = die eine erwartete Aktion; Satz = Regel-Nr. und Grund. |
| Fehler sind Sätze | Kein Fehlercode, sondern: „Die Datei ist größer als 20 MB. Bitte als PDF verkleinern oder in zwei Teilen hochladen." |
| Nichts verschwindet | Erledigte und abgelaufene Einträge bleiben in der Zeitleiste sichtbar (ausgegraut). |

### 3.2 Kunde: das Portal „Mein Zertifikat"

Aufruf per Magic Link aus jeder Mail (`/portal/{token}`), 72 h gültig, jederzeit neu anforderbar über die Verifizierungsseite („Sind Sie der Inhaber? Link anfordern").

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo Mandant]                    Muster GmbH · DE ▾          │
│                                                              │
│ NÄCHSTER SCHRITT                                             │
│ Überwachungsaudit 1: 12.11.2026, 09:00, remote (A. Beispiel) │
│ [ Termin passt ]   Termin ändern                             │
│                                                              │
│ ● ISO 9001:2015 · OC-2026-00123-7 · gültig bis 30.09.2029    │
│   Zertifiziert seit 2023 · Standorte: Fürth, Nürnberg        │
│   [PDF DE] [PDF EN] [Anhang] [Logo-Paket] [Verifizierung]    │
│                                                              │
│ ZEITLEISTE                                                   │
│ ✓ 01.09.2026 Zertifikat ausgestellt                          │
│ ✓ 28.08.2026 Entscheidung Zertifizierungsausschuss           │
│ ✓ 20.08.2026 Audit Stufe 2 (remote, Auditor: A. Beispiel)    │
│ ● 15.11.2026 Termin ÜA1 wählen  ← jetzt                      │
│ ○ 01.09.2027 Überwachungsaudit 1 fällig                      │
│ ○ 01.09.2028 Überwachungsaudit 2 fällig                      │
│ ○ 30.09.2029 Rezertifizierung                                │
│                                                              │
│ UNTERLAGEN          RECHNUNGEN            MEINE DATEN        │
│ 7/7 vollständig ✓   RE-2026-0456 bezahlt  Ansprechpartner    │
│ [Hochladen]         [Rechnungen ansehen]  Standorte [+]      │
│                                           Sprache nachbestellen │
└──────────────────────────────────────────────────────────────┘
```

Aufgaben, die der Kunde ohne Rückfrage selbst erledigt: Termin bestätigen oder Änderung anfragen, Unterlagen und Nachweise im Drive-Ordner ablegen (oder im Portal hochladen), Rechnung ansehen (Link Billomat-Kundenportal oder PDF), Ansprechpartner und Rechnungsadresse ändern, Standort melden (löst Angebot aus), Sprachausfertigung nachbestellen (löst Angebot aus), Logo-Paket erneut laden, Verifizierungslink kopieren, LinkedIn-Text kopieren.

### 3.3 Auditor: die Auditor-App

Google-Login. Zwei Seiten: „Meine Audits" (Liste) und „Audit" (Arbeitsfläche).

```
MEINE AUDITS                                              [Termin eintragen]
● Heute 09:00  Muster GmbH · ISO 9001 · Stufe 2 · remote        [Audit öffnen]
○ 24.09.       Beispiel AG · ISO 14001 · ÜA1 · vor Ort           [Auditplan]
! Bericht fällig bis 20.09.  Test KG · ISO 9001 · Stufe 2        [Bericht abschließen]
? Nachweis prüfen (2)  Muster GmbH · Abweichung N-01, N-02       [Prüfen]
? Stufe 1 (1)  Neu GmbH · Unterlagen vollständig seit 15.09.     [Stufe 1 starten]
! Termin vereinbaren (1)  Neu GmbH · ISO 9001 · Stufe 2 · bis 02.10. [Termin eintragen]
```

„Termin eintragen" ist ein Formular mit vier Feldern (Datum, Uhrzeit, Methode remote/vor Ort, Dauer in Tagen) und einem Knopf. Der Auditor hat den Termin vorher selbst mit dem Kunden abgestimmt; das System übernimmt Kalender, Videolink, Auditplan und Kundenbestätigung. Die Unterlagen des Kunden öffnet der Auditor direkt im Drive-Ordner (Link in jeder Auditzeile).

```
AUDIT · Muster GmbH · ISO 9001:2015 · Stufe 2 · 18.09.2026 · Zeit läuft: 01:42
Nächster Schritt: Kapitel 7 prüfen (4 von 10 Kapiteln erledigt)

[4 Kontext] [5 Führung] [6 Planung] [7 Unterstützung ●] [8 Betrieb] [9 Bewertung] [10 Verbesserung]

7.1.5 Ressourcen zur Überwachung und Messung
  Frage aus Checkliste: Werden Messmittel kalibriert und ist das nachgewiesen?
  Letzte Feststellung 2025: Kalibrierliste unvollständig (Nebenabweichung, geschlossen 03/2025)
  ( ) konform   ( ) Hinweis   ( ) Nebenabweichung   ( ) Hauptabweichung
  Nachweis / Notiz: [_______________________________]  [Foto]  [Datei]

[Speichern]                                             [Audit abschließen → Bericht erzeugen]
```

Nach „Audit abschließen": Bericht-Entwurf (Docs) öffnet sich, Auditor liest, klickt „Freigeben". Alles Weitere (Kunde informieren, CAP-Fristen, Ausschuss) passiert ohne ihn. Die Checkliste je Norm kommt aus dem Blatt `Checklisten` (Norm, Kapitel, Frage, Sprache), erweiterbar ohne Code.

### 3.4 Ausschuss: eine Mail, eine Seite, drei Knöpfe

Mail: „Entscheidung ZE-2026-0031 · Muster GmbH · ISO 9001 · Erstzertifizierung. Auditor empfiehlt Erteilung. 0 Haupt-, 2 Nebenabweichungen (geschlossen). Bitte bis 23.09. abstimmen. [Vorgang öffnen]"

Seite: Zusammenfassung (10 Zeilen, von Claude aus dem Bericht), Link zum vollständigen Bericht, Abweichungsliste mit Status, Unparteilichkeitserklärung als Häkchen („Ich war an Beratung und Audit nicht beteiligt"), drei Knöpfe: **Erteilen** · Mit Auflage (Textfeld) · Ablehnen (Textfeld Pflicht). Danach: „Danke. Stand: 2 von 3 Voten. Sie erhalten die Entscheidung per Mail." Kein Login, Link einmalig gültig.

### 3.5 Backoffice: Tagesliste und Kundenakte

**Tagesliste** (07:00 als Mail, ganztags als Seite): eine Zeile je Eskalation, sortiert nach Fälligkeit, jede Zeile mit einem Aktionsknopf und einem „erledigt". Gruppen: Anrufen · Freigeben · Zuordnen · Prüfen · Fehler. Am Ende: „Automatisch erledigt heute: 14 Mails, 3 Rechnungen, 2 Zertifikate, 0 Fehler" (Transparenz, P2).

**Kundenakte 360°** (`/admin/kunde/K-00123`): Kopf mit Firma, Ampel, Projektleiter; Zeitleiste (dieselbe wie im Portal, plus interne Ereignisse und Regel-Nummern); Reiter Angebote · Aufträge · Audits · Zertifikate · Rechnungen (Billomat-Status live) · Unterlagen · Mails; Knöpfe: „Mail schreiben (Claude-Entwurf)", „Angebot Erweiterung", „Neuausgabe", „Vorgang an Ausschuss".

**Probelauf** (`/admin/probelauf`): zeigt, was der nächste Tageslauf tun würde (Mails, Rechnungen, Statuswechsel) mit Regel-Nr.; Knopf „Jetzt ausführen" oder „Einzelne Zeile überspringen".

### 3.6 Öffentlichkeit: Verifizierungsseite

Eine Seite: Ampel groß, Zertifikatsnummer, Firma, Ort, Norm, Kurz-Scope, gültig bis, zertifiziert seit, Aussteller, Prüfzeitpunkt, „Details" (mit QR-Token: Standorte, Scope-Volltext, Ausfertigungen, Auditart und -datum ohne Auditorname), Sprachumschalter, „Nummer prüfen"-Feld, „Inhaber? Portal-Link anfordern". Kein Cookie-Banner nötig (keine Tracker).

---

## 4. Billomat-Anbindung im Detail

Recherche vom 18.09.2026 aus der offiziellen API-Doku (über Suchergebnisse und Open-Source-Clients, da billomat.com aus der Umgebung nicht direkt abrufbar war). Vor Umsetzung: Tarif und API-Kontingent im eigenen Konto prüfen.

### 4.1 Rollenverteilung: Wer ist wofür führend

| Objekt | Führend | Begründung |
|---|---|---|
| Kunde (Stammdaten) | **Unser System** (CRM-Sheet, K-Nr.) | Billomat-Kunde wird angelegt und bei Änderung nachgezogen; `client_number` = K-Nr. |
| Angebot | **Unser System** (Docs-PDF, AN-Nr., Annahme-Link) | Unser Angebot ist Marketing und Paketlogik; Billomat bekommt es nur als Spiegel für die Umsatzprognose (optional, Should) |
| Auftrag | **Unser System** (AU-Nr.) + Billomat-Auftragsbestätigung | Billomat `confirmations` liefert den Beleg mit Nummer; unser Auftrag hält Zyklus und Rechnungsplan |
| Rechnung | **Billomat** | Nummernkreis, PDF, E-Rechnung (XRechnung/ZUGFeRD), GoBD-Unveränderbarkeit, Versand |
| Zahlung | **Billomat** (Banking-Abgleich) | Zahlungen werden in Billomat gebucht (automatisch per Bankabgleich oder manuell); wir lesen sie |
| Mahnung | **Billomat** (Mahnwesen vollautomatisch) | Stufen, Texte, Gebühren in Billomat; wir lesen Mahnstufe für Eskalation |
| Preise | **Billomat-Artikelstamm** | Artikelnummern je Leistung; unser `Preise`-Blatt verweist nur auf Artikelnummern und enthält die Paketlogik |

Zugriff erfolgt **direkt aus Apps Script** per `UrlFetchApp` (API-Key in `PropertiesService`). Netlify Functions bleiben nur für das bestehende Dashboard und für Frontend-Aufrufe. Weniger Zwischenstationen, weniger Fehlerquellen.

### 4.2 API-Fakten

| Punkt | Wert |
|---|---|
| Basis-URL | `https://{BillomatID}.billomat.net/api/` |
| Auth | Header `X-BillomatApiKey`; `X-AppId`/`X-AppSecret` optional, erhöhen das Kontingent (App unter Einstellungen > Administration > Apps registrieren) |
| Format | JSON mit `Accept: application/json`, Schreibbody gewrappt: `{"client":{...}}` |
| Rate-Limit | 300 Anfragen je 15 Minuten ohne App (Onboarding-Seite nennt für Business 100/15 Min.); 429 mit Wartezeit im Klartext |
| Listen | `{"invoices":{"@total":"257","invoice":[...]}}`; bei genau einem Treffer ist `invoice` ein Objekt, bei null Treffern fehlt der Schlüssel → immer normalisieren |
| Paginierung | `page`, `per_page` (max. 1000) |
| Filter | `client_id`, `status` (kommagetrennt), `from`/`to`, `invoice_number`, `client_number`, `email`, `tags` |
| Rechnungsstatus | DRAFT, OPEN, OVERDUE, PAID, CANCELED |
| Nummernvergabe | erst bei `PUT /invoices/{id}/complete`; Entwürfe sind nummernlos und löschbar |
| Webhooks | vorhanden, aber nur per Oberfläche einzurichten (Einstellungen > Webhooks); Ereignisse u. a. `invoice.status`, `invoice_payment.create`, `reminder.status`, `client.update`; Ziel muss in 10 s mit 2xx antworten |
| E-Rechnung | XRechnung/ZUGFeRD über die Rechnungsvorlage (PDF/A-3b); Leitweg-ID am Kunden; API steuert per `template_id` beim `complete` |
| Mahnwesen | ab Business; Modus manuell/teil-/vollautomatisch; je Kunde per `dunning_run` abschaltbar |
| Banking | ab Business; gleicht Umsätze mit offenen Rechnungen ab und bucht `invoice-payments` |
| Tarif mit API | Business (ca. 29 €/Monat im Jahresabo, 39 € monatlich); Enterprise (ca. 99 €/Monat) mit Sandbox und mehr Kontingent |

### 4.3 Objektzuordnung und Endpunkte

| Unser Objekt | Billomat-Endpunkt | Schlüssel bei uns | Wichtige Felder |
|---|---|---|---|
| Kunde | `POST/PUT /clients`, `GET /clients?client_number=` | `Kunden.billomat_client_id` | `client_number`=K-Nr., `name`, `street`, `zip`, `city`, `country_code`, `email`, `vat_number`, `locale` (Sprache), `net_gross`=NET, `due_days_type`=ABSOLUTE, `due_days`=14, `dunning_run`, Leitweg-ID (Feldname per `GET` an UI-gepflegtem Kunden prüfen) |
| Kundenzusatzfelder | `POST /client-property-values` | – | `client_property_id` für „Zertifikatsnummer", „Mandant", „Projektleiter" |
| Leistung | `GET /articles?article_number=` | `Preise.artikel_nr` | `article_number` (`OC-9001-ERST`, `OC-9001-UA`, `OC-9001-REZERT`, `OC-SPRACHE`, `OC-STANDORT`), `sales_price`, `tax_id` |
| Angebot (Spiegel, optional) | `POST /offers` + `/offer-items` + `/complete` | `Angebote.billomat_offer_id` | `client_id`, `label`=AN-Nr., Status DRAFT→OPEN→WON/LOST |
| Auftragsbestätigung | `POST /confirmations` + `/confirmation-items` + `/complete` + `/email` | `Auftraege.billomat_confirmation_id` | `client_id`, `label`=AU-Nr., `offer_id` |
| Rechnung | `POST /invoices` + `/invoice-items` + `PUT /complete` + `POST /email` | `Rechnungen.billomat_invoice_id` | `client_id`, `confirmation_id`, `date`, `supply_date`, `label`=Zert-Nr./Zyklusjahr, `intro`, `note`, `due_days` |
| Zahlung | `GET /invoice-payments?from=&to=` oder Webhook `invoice_payment.create` | `Rechnungen.bezahlt_am` | `invoice_id`, `amount`, `date`, `type` |
| Mahnung | `GET /reminders?invoice_id=` oder Webhook `reminder.status` | `Rechnungen.mahnstufe` | `reminder_level`, `status`, `due_date` |
| Storno | `PUT /invoices/{id}/cancel` | `Rechnungen.status`=storniert | Stornobeleg entsteht in Billomat |
| Verbindungstest | `GET /users/myself` | – | im Probelauf täglich |

### 4.4 Die vier Abläufe

**A. Kunde anlegen (R01, bei Angebotserstellung)**

1. `GET /clients?client_number=K-00123` → Treffer: ID speichern, fertig.
2. Kein Treffer: `POST /clients` mit den Feldern aus 4.3 → `client.id` in `Kunden.billomat_client_id`.
3. Zusatzfelder setzen (`client-property-values`: Mandant, Projektleiter).
4. Historie: „Billomat-Kunde 4711 angelegt (R01)".

Änderung der Stammdaten im Portal → `PUT /clients/{id}` am selben Tag (Regel `statuswechsel` auf `Kunden.geaendert_am`).

**B. Auftrag bestätigen (R02, bei Annahme)**

1. `POST /confirmations {client_id, label: 'AU-2026-0001', intro: 'Zertifizierung ISO 9001, Zyklus 2026–2029'}` → Entwurf.
2. Je Leistung `POST /confirmation-items {confirmation_id, article_id, quantity, unit_price}` (Erst, ÜA1, ÜA2, Rezert als vier Positionen mit Leistungsdatum im Text, damit der Kunde den Gesamtplan sieht).
3. `PUT /confirmations/{id}/complete` → Nummer.
4. Kein Versand über Billomat; unsere Willkommensmail hängt die Auftragsbestätigung (`GET /confirmations/{id}/pdf`) zusammen mit der Vereinbarung an. Ein Absender, eine Mail.

**C. Rechnung zum Stichtag (R21, täglicher Rechnungslauf)**

Für jede Zeile in `Rechnungen` mit `faellig_am` ≤ heute und `billomat_invoice_id` leer, in dieser Reihenfolge mit Statusspalte `schritt` (1 bis 5), damit ein Abbruch nicht zu Doppelbelegen führt:

1. `schritt=1`: `POST /invoices {client_id, confirmation_id, date: heute, supply_date: Auditdatum oder Zertifikatsdatum, label: 'OC-2026-00123-7 · Überwachungsaudit 1', intro: Textbaustein je Zyklusjahr und Sprache, due_days: 14}` → Entwurfs-ID sofort ins Sheet.
2. `schritt=2`: `POST /invoice-items` je Position aus `Preise` (Artikel-ID, Menge, Preis zum `gueltig_ab` des Auftrags, nicht Tagespreis).
3. `schritt=3`: `PUT /invoices/{id}/complete {complete:{template_id: Vorlage des Mandanten}}` → Rechnungsnummer ins Sheet (`billomat_invoice_number`). Die Vorlage ist als PDF/A-3b mit XRechnung eingestellt.
4. `schritt=4`: `POST /invoices/{id}/email {recipients:{to: Rechnungsmail des Kunden}, subject/body aus Billomat-E-Mail-Vorlage}`; alternativ `GET /invoices/{id}/pdf` und Versand über unsere Mailvorlage, wenn Rechnung und Zertifikat in einer Mail gehen sollen (Regel je Mandant).
5. `schritt=5`: Historie, Portal zeigt „Rechnung RE… offen, fällig …".

Fehler bei Schritt 2 bis 4: nächster Lauf setzt beim gespeicherten Schritt fort. Fehler bei Schritt 1 ohne ID: Lauf sucht per `GET /invoices?client_id=&status=DRAFT&label=` nach verwaistem Entwurf, bevor er neu anlegt.

**D. Zahlungs- und Mahnabgleich (R22/R23, täglich 06:30 und per Webhook)**

1. Webhook (bevorzugt): Billomat sendet `invoice_payment.create` an unsere Web-App `doPost(e)`; wir prüfen `invoice_id` gegen `Rechnungen`, setzen `bezahlt_am`, lösen R22 aus. Antwort in unter 10 s, daher nur Sheet-Schreibzugriff, keine Folgeaktion im selben Aufruf (Folgeaktion im nächsten Lauf).
2. Polling (immer, als Sicherheitsnetz): `GET /invoice-payments?from={letzter Lauf}&to={heute}` und `GET /invoices?status=OVERDUE,PAID&from=` → Abgleich. `GET /reminders?from=` → `mahnstufe`.
3. Mahnstufe 2 → Anruf-Aufgabe (R21-Eskalation); 60 Tage überfällig → R23.
4. Manuelle Zahlung (Scheck, Verrechnung) bucht das Backoffice in Billomat oder über die bestehende Function `billomat-book-payment`; nie im Sheet.

### 4.5 Idempotenz, Limits, Fehler

| Thema | Regel |
|---|---|
| Keine Idempotenz-Schlüssel in der API | Billomat-IDs sofort nach Anlage ins Sheet; `schritt`-Spalte; vor jedem POST per Filter prüfen (Kunde: `client_number`; Rechnung: `client_id` + `status=DRAFT` + `label`) |
| Rate-Limit 300/15 Min. (ggf. 100) | Rechnungslauf verarbeitet max. 40 Rechnungen je Lauf (5 Aufrufe je Rechnung = 200), Rest am nächsten Lauf; bei 429 Wartezeit aus der Fehlermeldung lesen und Lauf beenden, nicht schlafen (6-Minuten-Grenze) |
| Nummernkreis | Nur `complete` vergibt Nummern; Entwürfe, die älter als 7 Tage sind, werden im Probelauf gemeldet und nach Prüfung gelöscht |
| Storno | Nur über `/cancel`; unser Sheet setzt `status=storniert` und schreibt Grund in `Historie` (GoBD: Lücke erklärbar) |
| Preisänderung | Preise mit `gueltig_ab`; Rechnung nimmt Preis des Auftrags, nicht den aktuellen |
| Mandanten mit eigenem Billomat-Konto | `Mandanten.billomat_id` + eigener API-Key je Mandant in `PropertiesService` (`BILLOMAT_KEY_{mandant}`) |
| Ausfall Billomat | Rechnungslauf meldet Fehler in Tagesliste; nichts wird im Sheet als „gestellt" markiert, was Billomat nicht bestätigt hat |
| Test | Enterprise-Sandbox, oder im Business-Tarif ein Testkunde `K-00000` mit Entwürfen, die nie abgeschlossen werden; Probelauf zeigt geplante Aufrufe |

### 4.6 Sichtbarkeit für alle Rollen

- **Kunde:** Portal-Karte „Rechnungen" mit Nummer, Betrag, Status (offen/bezahlt/überfällig) aus dem täglichen Abgleich, Knopf „PDF" (`/pdf` zwischengespeichert in Drive).
- **Backoffice:** Kundenakte zeigt Billomat-Status live (bestehendes Dashboard-Muster), Tagesliste zeigt nur Mahnstufe ≥ 2 und Fehler.
- **Auditor:** sieht keine Rechnungen; bei „Zertifikat wartet auf Zahlung" bekommt er nichts, weil sein Teil erledigt ist.
- **Ausschuss:** sieht keine Rechnungen (Unabhängigkeit).

### 4.7 Was Billomat nicht kann und wie wir es lösen

| Lücke | Lösung |
|---|---|
| Kein Rechnungsplan über 3 Jahre (Recurrings sind starr zyklisch) | Rechnungsplan im Sheet, Billomat bekommt je Stichtag eine Einzelrechnung; `recurrings` nur für echte Abos (z. B. jährliche Registergebühr) |
| Kein Bezug Rechnung ↔ Zertifikat | `label` und Kundenzusatzfeld „Zertifikatsnummer"; Sheet ist die Verknüpfung |
| Webhooks nur per Oberfläche | Einmalige Einrichtung je Mandanten-Konto; Polling bleibt als Sicherheitsnetz |
| Kein Idempotenz-Schlüssel | `schritt`-Spalte und Filterprüfung (4.5) |
| Auditor-Honorare (Eingangsrechnungen) | Phase 6: Belegerfassung in Billomat (Business) oder Gutschrift als Aufgabe |

### 4.8 Quellen Billomat

- https://www.billomat.com/en/api/basics/authentication/ · https://www.billomat.com/en/api/basics/rate-limiting/ · https://www.billomat.com/en/api/basics/read-data/ · https://www.billomat.com/en/api/basics/write-data/ · https://www.billomat.com/en/api/basics/errors/
- https://www.billomat.com/en/api/invoices/ · https://www.billomat.com/en/api/invoices/payments/ · https://www.billomat.com/en/api/clients/ · https://www.billomat.com/en/api/settings/client-properties/ · https://www.billomat.com/en/api/articles/ · https://www.billomat.com/en/api/estimates/ · https://www.billomat.com/en/api/confirmations/ · https://www.billomat.com/en/api/reminders/ · https://www.billomat.com/en/api/recurrings/ · https://www.billomat.com/en/api/settings/templates/ · https://www.billomat.com/en/api/webhooks/
- https://www.billomat.com/onboarding/api-ueberblick/ · https://www.billomat.com/en/pricing/ · https://trusted.de/billomat-kosten
- https://faq.billomat.com/de/wie-erstelle-ich-eine-xrechnung · https://www.billomat.com/e-rechnungen/ · https://www.billomat.com/automatischesmahnwesen/ · https://www.billomat.com/add-ons/billomat-banking/
- https://github.com/TaurusSoft/n8n-billomat · https://github.com/gerold-penz/python-billomat · https://github.com/hausgold/billomat/issues/8

---

## 5. Erweiterbarkeit ohne Komplexität

### 5.1 Was sich ohne Code ändern lässt (und wo)

| Änderung | Wo | Was zu tun ist | Codeänderung |
|---|---|---|---|
| Neue Norm (z. B. ISO 27001) | `Normen`, `Logos`, `Checklisten`, `Preise` | Zeile in `Normen`, Logos hochladen, Checkliste je Kapitel eintragen, Preiszeilen | nein |
| Neuer Mandant (z. B. Partner-Zertifizierer) | `Mandanten`, `Vorlagen`, `Mailvorlagen`, `Logos`, Billomat-Konto | Zeile in `Mandanten` mit Präfix, Absender, Quorum, Ausschuss; Vorlagen kopieren; Netlify-Domain anlegen | nein (Netlify-Konfiguration) |
| Neue Sprache | `Texte`, `Vorlagen`, `Mailvorlagen`, `Logos` | Spalte in `Texte`, Vorlagen-Doc übersetzen, Mailvorlagen, Logos | nein |
| Frist ändern (z. B. ÜA-Erinnerung 150 statt 120 Tage) | `Regelwerk` | Zahl ändern | nein |
| Regel abschalten | `Regelwerk` Spalte `aktiv` | `nein` eintragen | nein |
| Neues Ereignis (z. B. „Geburtstag des Zertifikats: Glückwunsch") | `Regelwerk` + `Mailvorlagen` | Zeile: Auslöser = Feld + Offset, Aktion = Mail, Vorlage = Key | nein, wenn Auslösertyp existiert (Datum-Offset, Statuswechsel, Klick) |
| Neue Aktion (z. B. WhatsApp statt Mail) | Code: `Aktionen.gs` | Neue Aktionsfunktion, im Regelwerk als Aktionstyp wählbar | ja, klein und isoliert |
| Preis, Paket | `Preise` | Zeile ändern, `gueltig_ab` setzen | nein |
| Zertifikatslayout | Vorlagen-Doc | Doc bearbeiten, Platzhalter-Prüfung im Probelauf | nein |
| Checklistenfrage | `Checklisten` | Zeile | nein |
| Ausschussmitglied | `Mandanten` | Liste ändern | nein |

### 5.2 Das Regelwerk-Blatt

Jede Regel ist eine Zeile mit festen Spalten. Der Code kennt nur drei Auslösertypen und fünf Aktionstypen; alles andere ist Daten.

| Spalte | Beispiel R24 |
|---|---|
| regel_nr | R24 |
| mandant | OC (oder `*` für alle) |
| name | ÜA1 planen |
| ausloeser_typ | `datum_offset` (andere: `statuswechsel`, `klick`) |
| ausloeser_feld | Zertifikate.ua1_faellig |
| offset_tage | -120 |
| bedingung | status = gueltig UND ua1_erledigt leer |
| aktion_typ | `mail` (andere: `aufgabe`, `status`, `dokument`, `billomat`) |
| aktion_parameter | vorlage=ua_planen; empfaenger=kunde; knopf=terminwahl |
| erinnerung_tage | 90, 60 |
| eskalation_tage | 60 |
| eskalation_aktion | aufgabe: anrufen |
| aktiv | ja |
| probelauf_bis | 02.10.2026 |
| geaendert_von / am | H. Grosser, 18.09.2026 |

Regeln, die der Code nicht kennt, kann er nicht ausführen; er meldet sie im Probelauf als „unbekannter Aktionstyp". So bleibt die Erweiterung sichtbar und gefahrlos.

### 5.3 Schutz vor schleichender Komplexität

- **Ein Regelwerk je Mandant, gemeinsame Basis:** Zeilen mit `*` gelten für alle, mandantenspezifische Zeilen überschreiben sie. Keine dritte Ebene.
- **Versionierung:** `Regelwerk`, `Preise`, `Vorlagen` haben `gueltig_ab`; alte Zeilen bleiben (Nachvollziehbarkeit für Rechnungen und Zertifikate).
- **Probelauf-Pflicht:** neue oder geänderte Regel läuft 14 Tage nur im Probelauf und erscheint in der Tagesliste unter „würde tun".
- **Höchstens 50 aktive Regeln je Mandant:** Danach wird zusammengelegt, nicht ergänzt.
- **Monatlicher Regel-Report:** Wie oft hat jede Regel gefeuert, wie oft eskaliert. Regeln, die nie feuern, werden gelöscht; Regeln, die immer eskalieren, sind falsch eingestellt.
- **Code bleibt Mechanik:** Wer eine Fachlogik im Code findet (Frist, Preis, Text), verschiebt sie ins Blatt.

---

## 6. Manuelle Eingriffe: vorher / nachher

Gezählt je Zertifikat über einen 3-Jahres-Zyklus (Erst + ÜA1 + ÜA2), Normalfall ohne Ausnahmen.

| Tätigkeit | Heute (virtualbadge + Sheets + Hand) | Nach Runde 1 (Katalog) | Nach Runde 2 (Kette) |
|---|---|---|---|
| Anfrage erfassen, Angebot | 20 Min | 3 Min (Freigabe) | 0 (Freigabe nur bei Sonderwunsch) |
| Auftrag, Vereinbarung, Kunde in Billomat | 20 Min | 5 Min | 0 |
| Unterlagen einsammeln, Vollständigkeit | 30 Min | 10 Min | 0 (Portal-Checkliste) |
| Auditor finden, Termin abstimmen | 30 Min | 10 Min | 2 Min (Vorschlag bestätigen; Termin macht der Auditor) |
| Auditplan, Kalender, Link | 15 Min | 2 Min | 0 |
| Bericht nachfassen, Abweichungen verfolgen | 30 Min | 10 Min | 0 (Auditor-App, Prüf-Links) |
| Ausschuss organisieren, Protokoll | 30 Min | 3 Min | 0 (Magic Links, Quorum) |
| Zertifikat, Sprachen, Logo, Versand | 45 Min | 0 | 0 |
| Rechnung Erst/ÜA1/ÜA2, Zahlungen, Mahnungen | 3 × 15 Min | 3 × 3 Min | 0 (Billomat-Kette) |
| Erinnerungen ÜA1/ÜA2 | 2 × 15 Min | 0 | 0 |
| Termin ÜA1/ÜA2 | 2 × 20 Min | 2 × 5 Min | 2 × 1 Min |
| **Summe je Zyklus** | **ca. 5 h 20 Min** | **ca. 1 h** | **ca. 5 Min + Ausnahmen** |

Bei 1.000 Kunden und Ausnahmequote 15 % (Anrufe, Sonderwünsche, Bounces, Zahlungsverzug) ergibt Runde 2 rund 350 h Ausnahmen pro Jahr plus 80 h Regelbetrieb, also innerhalb der 440 h.

---

## 7. Delta zum Anforderungskatalog

Neue oder geänderte Anforderungen, die in den Katalog übernommen werden:

| Nr. | Anforderung | Prio | Bezug |
|---|---|---|---|
| M0.1 | Sieben Leitprinzipien (Kap. 1) sind Abnahmekriterien für jede Funktion | M | neu |
| M2.8 | Unterlagen-Checkliste je Norm; Ablage im Google-Drive-Kundenordner (für den Kunden freigegeben), Portal-Upload schreibt in denselben Ordner; stündlicher Ordner-Scan ordnet Dokumenttypen zu; Vollständigkeit löst Stufe 1 aus | M | R04/R05 |
| M3.9 | Auditor-App: Meine Audits, Audit-Arbeitsfläche mit Checkliste je Kapitel, Feststellungen, Zeiterfassung, Bericht per Klick, Freigabe | M | R11/R12 |
| M3.10 | Auditor vereinbart den Termin selbst und trägt ihn in der Auditor-App ein; Kalendereinträge, Videolink, Auditplan und Kundenbestätigung entstehen automatisch aus dem Eintrag | M | R08/R09 |
| M3.11 | Nachweisprüfung per Prüf-Link (akzeptiert / nachbessern) | M | R15 |
| M3.12 | Blatt `Checklisten` (Norm, Kapitel, Frage, Sprache) als Datenquelle für Stufe 1, Audit und Unterlagenliste | M | 3.3 |
| M4.9 | Ausschuss-Seite mit Unparteilichkeitshäkchen, drei Knöpfen, Einmal-Link; ÜA ohne Hauptabweichung ohne Ausschuss (Regel je Mandant) | M | 3.4, R25 |
| M7.9 | Regelwerk-Blatt mit Auslösertypen `datum_offset`, `statuswechsel`, `klick` und Aktionstypen `mail`, `aufgabe`, `status`, `dokument`, `billomat`; Probelauf 14 Tage für neue Regeln | M | 5.2 |
| M7.10 | Jede Mail trägt Regel-Nr. und Grund; jede Automatik schreibt Historie | M | P2 |
| M8.8 | Billomat-Kette gemäß Kap. 4: Kunde bei Anfrage, Auftragsbestätigung bei Annahme, Rechnung Entwurf → Positionen → abschließen → versenden zum Stichtag, täglicher Statusabgleich, Mahnwesen in Billomat | M | Kap. 4 |
| M8.9 | Artikelstamm in Billomat (Artikelnummern je Leistung) als einzige Preisquelle für Rechnungen; `Preise`-Blatt verweist auf Artikelnummern | M | Kap. 4 |
| M8.10 | Zertifikat wartet bei offener Zahlung (Regel je Mandant); Mail „liegt bereit, Rechnung offen" | S | R18 |
| M9.6 | Portal „Mein Zertifikat" als eine Seite mit Nächster-Schritt-Karte, Zeitleiste, Selbstbedienung (Termin, Upload, Daten, Standort, Sprache) | M | 3.2 |
| M9.7 | Antwort-Erkennung auf Systemmails (Claude klassifiziert, Aufgabe mit Entwurf) | S | R31 |
| M10.6 | Tagesliste mit Gruppen Anrufen/Freigeben/Zuordnen/Prüfen/Fehler und Abschlusszeile „automatisch erledigt" | M | 3.5 |
| M10.7 | Kundenakte 360° mit Zeitleiste inkl. Regel-Nummern und Billomat-Live-Status | M | 3.5 |
| M10.8 | Probelauf-Seite („Was würde heute passieren?") mit Ausführen/Überspringen | M | P7 |
| M10.9 | Monatlicher Regel-Report (Feuerungen, Eskalationen) | S | 5.3 |
| M11.9 | UX-Regeln aus 3.1 als Abnahmekriterien (Handy zuerst, ein Hauptknopf, Ampel, Fehler als Sätze) | M | 3.1 |

Geändert gegenüber Runde 1: M3.3 (Terminvorschlag an Kunden) entfällt und wird durch M3.10 (Auditor trägt Termin ein) ersetzt, Must. M7.8 (Kalendereinträge) wird Must, weil der Termineintrag des Auditors die Kalender speist. M8.5 (Fallback-Rechnung aus Docs) bleibt Should, wird aber nur für Mandanten ohne Billomat-Konto gebaut.

---

## 8. Nächste Schritte

1. Entscheidungen E1 bis E12 aus dem Katalog plus drei neue: E13 Billomat-Tarif mit API bestätigen (Business), E14 entschieden: Auditoren vereinbaren Termine selbst und tragen sie ein (keine Kalender-Verfügbarkeit nötig; Auditoren brauchen nur ein Google-Konto für die App), E15 ÜA ohne Ausschuss bei „keine Hauptabweichung" zulassen.
2. Phase 0 starten: Monorepo, Blätter `Mandanten`, `Normen`, `Regelwerk`, `Preise`, `Checklisten` anlegen, Nummernvergabe, Probelauf-Grundgerüst.
3. Billomat-Sandbox: Testkonto, Artikelstamm anlegen, Kette Kunde → Rechnung → Zahlung einmal durchspielen.
4. UX-Klickmodelle für Portal, Auditor-App und Ausschuss-Seite als statische Netlify-Seiten (ein Tag), mit einem Auditor und einem Kunden testen, bevor Backend gebaut wird.
