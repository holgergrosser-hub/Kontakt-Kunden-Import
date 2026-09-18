# Abgleich mit dem Anforderungskatalog „ZMS" v1.3 (18.09.2026)

Ergänzung zu [Anforderungskatalog](anforderungskatalog.md) und [Runde 2](runde-2-automatisierung-ux-billomat.md). Verglichen wurde der parallel erstellte Katalog „Zertifizierungsmanagementsystem (ZMS) v1.3" mit den hier vorliegenden Dokumenten. Ergebnis: 21 Punkte übernommen, 6 bewusst nicht übernommen, 4 Abweichungen zur Entscheidung.

---

## 1. Was der ZMS-Katalog besser macht und was daraus übernommen wird

| Nr. | Erkenntnis aus ZMS v1.3 | Übernahme als Anforderung | Prio |
|---|---|---|---|
| L01 | **Mehrere Ansprechpartner je Kunde mit Rollen** (QMB, Geschäftsführung, Buchhaltung) und Kennzeichen „Rechnungserhalt". Bisher hier nur ein Ansprechpartner. | M1.9 Blatt `Ansprechpartner` (`K-00123-01`): Name, Rolle, E-Mail, Telefon, Sprache, Kennzeichen Rechnung/Zertifikat/Audit-Kontakt. Mails gehen an die Rolle, nicht an eine Person. | M |
| L02 | **Kundenstatus als eigener Lebenszyklus** (Interessent → Angebot → Vertrag → Erstzertifizierung → aktiv → auslaufend → Rezertifizierung / inaktiv). Bisher hier nur Zertifikatsstatus. | M1.10 Kundenstatus wird täglich aus Angebots-, Auftrags- und Zertifikatsstatus abgeleitet (eine Regel, nie manuell); dient Tagesliste, Vertrieb und Kennzahlen. | M |
| L03 | **Drei-Ebenen-Modell**: Backoffice, Kunde, **Kunden der Kunden** (Einkäufer, Behörden, Ausschreibungen). Ebene 3 fehlte hier als eigene Zielgruppe. | Kapitel „Ebene 3" wird in Stufe 3 des Katalogs aufgenommen; die Verifizierungsseite ist Marketingkanal und Vertrauensanker. | – |
| L04 | **Watch-Funktion**: Dritte abonnieren Statusänderungen eines Zertifikats (Double-Opt-in), werden bei Ablauf, Entzug, Rezertifizierung benachrichtigt. | M6.12 Abonnement je Zertifikatsnummer mit Double-Opt-in, Abmeldelink, DSGVO-Hinweis; Statuswechsel löst Mail an Abonnenten aus (Regelwerk, Aktion `mail`). | S |
| L05 | **Bulk-Verifikation**: CSV mit vielen Nummern → Ergebnisliste. Für Konzerne mit vielen Lieferanten. | M6.13 CSV-Upload auf der Verifizierungsseite (max. 500 Nummern), Ergebnis als Tabelle und Download; nur Kernnummern, keine Details. | C |
| L06 | **Entzug in Echtzeit** an Register und Abonnenten. | Bereits durch Statuslauf abgedeckt; Ergänzung: Entzug/Aussetzung löst sofort (nicht erst 05:30) Register-Snapshot und Abonnenten-Mail aus. | M |
| L07 | **Auditorenverwaltung als Detailkonzept**: Kompetenzmatrix mit IAF/EA-Branchencodes und Stufe (Lead/Team/in Ausbildung), Region, Sprachen, Konflikte 24 Monate, Selbsterklärung mit Ablauf 12 Monate, Kapazität je Kalenderwoche, Einsätze geplant/tatsächlich. | M3.13 Blätter `Kompetenzen` (Auditor × Norm × Branchencode × Stufe × gültig bis), `Konflikte` (Auditor × Kunde × Zeitraum × Art), `Einsaetze` (Audit × Auditor × Tage geplant/ist × Status). Selbsterklärung mit Ablauf; abgelaufen = nicht zuordbar. | M |
| L08 | **Vorschlags-Kaskade**: bei Absage automatisch nächster Auditor der Liste, 48-h-Erinnerung, Beauftragungs-PDF, Bestätigung per Klick. | Regel R05a: Auditor-Anfrage mit Frist 48 h, bei Absage oder Schweigen automatisch nächster Vorschlag; erst nach zwei Fehlversuchen Aufgabe an Backoffice. Beauftragung als PDF mit Honorar und Tagen. | M |
| L09 | **Auditor-Bewertung**: Kundenfeedback nach jedem Audit (1 bis 5 Sterne), Pünktlichkeit Bericht, Abweichungen je Audit als Kennzahl; Witness-Audit und Requalifikation als Fälligkeiten. | M3.14 Feedback-Link in der Zertifikatsmail (eine Frage plus Freitext), Auditor-Kennzahlen im Monatsreport; Witness/Requalifikation als Datumsfelder mit Erinnerung. | S |
| L10 | **Abweichungen (NC) als eigene Datensätze** mit Major/Minor/OFI, Sofortmaßnahme, Ursachenanalyse, Korrekturmaßnahme, Wirksamkeitsprüfung, Status; Major offen = hartes Gate vor Ausschuss. | M3.15 Blatt `Abweichungen` (`AB-2026-0001`) ersetzt die Spalten in `Audits`; Stufen Haupt/Neben/Hinweis; Gate: Hauptabweichung offen blockiert R13. Prüf-Link (R15) arbeitet je Abweichung. | M |
| L11 | **Berichtsvorlagen je Audittyp** mit Pflichtinhalt-Checkliste; „positive Feststellungen" verpflichtend; automatische Vollständigkeitsprüfung vor Freigabe. | M3.16 Fünf Docs-Vorlagen (Stufe 1, Stufe 2, ÜA, Rezert, Sonder/Transfer); Pflichtfelder in `Checklisten`; Auditor-App verhindert „Abschließen" bei fehlenden Pflichtfeldern; Claude prüft Verständlichkeit und Abweichungslogik als Vorprüfung, Ergebnis als Hinweis an den Auditor. | M |
| L12 | **Audittyp „Transfer"** (Übernahme eines Zertifikats von einer anderen Stelle). | Audittyp `TR` in `Audits` und `Checklisten`; Erstzertifizierungsdatum aus dem Fremdzertifikat übernehmbar mit Nachweis. | S |
| L13 | **Ausschuss: zwei Verfahren** (Umlauf per Link als Standard; Sitzung bei Ablehnung, Sanktion, Beschwerde), Option „vertagt", Beschlussfähigkeit prüft auch Fachkompetenz für den Normbereich, Ablehnung mit Rechtsmittelbelehrung. | M4.10 Verfahren `umlauf`/`sitzung` je Vorgang; Votum „vertagt" mit Rückfrage; Quorum prüft Kompetenz je Norm (`ZFA_Mitglieder.normen`); Ablehnungsmail enthält Einspruchsfrist und Weg; Blatt `ZFA_Sitzungen`. | M |
| L14 | **Beschwerden-Prüfer unabhängig**: System sperrt Zuweisung an Verfahrensbeteiligte. | Ergänzt M12.1: Prüfer darf weder Auditor, Projektleiter noch votierendes Mitglied des betroffenen Vorgangs sein; Bestätigung binnen 2 Werktagen automatisch. | S |
| L15 | **Health-Check**: letzter erfolgreicher Lauf je Trigger wird protokolliert; Ausfall erzeugt Alarm. | M11.10 Blatt `Log` erhält Zeile „Heartbeat" je Trigger; ein unabhängiger Prüf-Trigger (08:00) meldet fehlende Läufe per Mail. | M |
| L16 | **Dry-Run-Modus global**: alle Mails an Testadresse. | Ergänzt P7/M10.8: Schalter `Mandanten.testmodus` leitet alle ausgehenden Mails an eine Testadresse um und markiert Betreff mit `[TEST]`. | M |
| L17 | **Follow-up ohne Download**: 7 Tage nach Versand ohne Abruf des Zertifikats erneute Mail. | Regel R20a: Portal-Abruf wird protokolliert; kein Abruf nach 7 Tagen → Erinnerung, nach 21 Tagen Anruf-Aufgabe (Adresse falsch?). | S |
| L18 | **Getrenntes öffentliches Registerblatt** mit minimalen Feldern als einzige Quelle der Verifizierung (Sicherheitsprinzip). | Ergänzt M6.1/6.1: Blatt `Register_oeffentlich` wird vom Statuslauf befüllt; Web-App und Snapshot lesen nur dieses Blatt, nie `Zertifikate`. | M |
| L19 | **Drive-Ordnerstruktur** `/K-0001/S01/Z-…/` automatisch. | Ergänzt M5.6: Struktur `Kunden/{K-Nr}/{Standort}/{Zert-Nr}/` und `Kunden/{K-Nr}/Unterlagen/{Jahr}`; Ordner-IDs im Sheet. | M |
| L20 | **Preisbausteine** Audittage × Tagessatz + Registrierungsgebühr + Reisekosten als Alternative zu Paketpreisen. | Ergänzt M2.2: `Preise` kennt zwei Modi je Mandant: `paket` (bestehend) und `kalkulation` (Audittage nach MD-5-Tabelle × Tagessatz + Gebühren); Angebot zeigt die Bausteine. | S |
| L21 | **Kennzahlen der Automation**: Automatisierungsquote ≥ 90 %, Durchlaufzeit Bericht → Zertifikat ≤ 10 Werktage, Anfrage → Angebot ≤ 1 Werktag, Verifizierungsaufrufe je Monat als Marketing-Kennzahl, „rote" Einträge < 5 je Woche. | Ergänzt M10.4: diese fünf Kennzahlen im Monatsreport; Quelle ist `Historie` (Aktionen mit/ohne Nutzer) und `Log`. | S |

---

## 2. Was bewusst nicht übernommen wird (mit Grund)

| Nr. | ZMS-Vorschlag | Grund für Nichtübernahme | Stattdessen |
|---|---|---|---|
| N01 | QR-Erzeugung über die Google Chart API | Die Chart-API für QR ist abgeschaltet (seit 2019); Aufrufe schlagen fehl. | JS-Bibliothek im Apps-Script-Projekt (qrcodegen) bzw. clientseitig (qrcode.js), siehe Katalog 6.1. |
| N02 | Protokollierung per `onEdit`-Trigger | `onEdit` feuert nicht bei Änderungen durch Skripte und nicht bei Massenänderungen; Lücken im Prüfpfad. | Jede Schreibfunktion des Backends schreibt selbst in `Historie` (P2). `onEdit` nur zusätzlich für Handänderungen im Sheet. |
| N03 | Rechnungen aus Docs-Vorlage mit eigenem Nummernkreis als Standard | Ab 01.01.2028 E-Rechnungspflicht (XRechnung/ZUGFeRD) für alle B2B-Rechnungen; Docs-PDF erfüllt das nicht; Mahnwesen und Bankabgleich müssten selbst gebaut werden. | Billomat per API (Runde 2, Kap. 4); Docs-Rechnung nur als Fallback für Mandanten ohne Billomat bis 2027. |
| N04 | Qualitätsprüfung jedes Auditberichts durch das Backoffice mit Score | 1.000 Berichte × 10 Minuten = 167 Stunden im Jahr, das ist ein Drittel des gesamten Backoffice-Budgets. | Automatische Vollständigkeitsprüfung + Claude-Vorprüfung für alle Berichte; manuelle Stichprobe 5 % (Regelwerk) und alle Berichte neuer Auditoren in den ersten zehn Audits. |
| N05 | Eingehende Antworten über Gmail-Labels und Trigger verarbeiten | Label-Trigger sind fragil (Filter, Weiterleitungen, Umbenennungen) und schwer zu testen. | Antwortadresse mit Vorgangskennung (`antwort+ZE-2026-0031@…`) und zeitgesteuerter Abruf des Postfachs; Claude klassifiziert (R31). Gmail-Label nur als Kennzeichen, nicht als Auslöser. |
| N06 | Sprach- und Normcode fest in der Zertifikatsnummer (`Z-CB1-9001-2026-00417-DE`) | Sprache ist eine Ausfertigung, kein anderes Zertifikat; mit Sprachcode in der Kernnummer entstehen mehrere Verifizierungs-URLs für dasselbe Zertifikat. Beide Kataloge wollen „eine ID, alle Sprachen gleich gültig". | Kernnummer ohne Sprache, Sprache als Anhang `/EN` (Katalog 6.3). Normcode in der Nummer bleibt Entscheidung E1. |

---

## 3. Abweichungen, die eine Entscheidung brauchen

| Nr. | Punkt | Katalog hier | ZMS v1.3 | Empfehlung |
|---|---|---|---|---|
| E20 | **Ist die Kundenverwaltung vorhanden?** Der Auftragstext („Mir fehlt die Verwaltung der Kunden habe ich") ist doppeldeutig. | Vorhanden: CRM-Sheet aus Kontakt-Kunden-Import ist Kundenstamm, Zertifikatssystem referenziert per K-Nr. | Fehlt: Kundenverwaltung ist Kern der Anforderung. | Beides ist abgedeckt: M1 spezifiziert die Kundenverwaltung vollständig. Wenn das CRM-Sheet weiter genutzt wird, bleibt es Stammquelle und bekommt die K-Nr.; wenn nicht, wird `Kunden` in der Mandantendatei zum Stamm und das CRM-Sheet einmalig importiert. Bitte festlegen. |
| E21 | **Zertifikatsnummer** | `OC-2026-00123-7` + Ausfertigung `/EN`, `/S02` | `Z-CB1-9001-2026-00417-DE` | Siehe N06 und E1: Sprache nie in der Kernnummer; Normcode optional. |
| E22 | **Rechnungssystem** | Billomat per API | Docs-Vorlage + eigener Nummernkreis | Billomat (E-Rechnung 2028, Mahnwesen, Bankabgleich); siehe N03 und E4. |
| E23 | **Berichtsfreigabe** | Auditor gibt frei, System prüft Pflichtfelder, Claude prüft vor | Backoffice prüft jeden Bericht mit Score | Stichprobe 5 % + Neu-Auditoren; siehe N04. |

---

## 4. Wo beide Kataloge übereinstimmen (Bestätigung)

- Ein Status je Objekt, Statuswechsel mit Zeitstempel und Folgeaktion (Status-Maschine).
- Nummern nur per Skript mit `LockService`, nie manuell, nie gelöscht, Storno als Status mit Grund.
- Zertifikatsnummer erst nach positiver Ausschussentscheidung.
- Zwei Zertifikatsseiten: Seite 2 mit Verifizierung, Auditor, Audittyp, Auditdatum, Entscheidungsdatum.
- Erinnerungskaskade 180/120/90/60/30 in Kundensprache, tägliche Ablaufprüfung.
- Verifizierung ohne Login, unter eigener Domain, Status auch für abgelaufene/entzogene sichtbar.
- Kundenportal per Token-Link, kein Passwort.
- Auditor-Vorschlag mit Kompetenz und Konfliktprüfung; Bestätigung ist der einzige manuelle Schritt. Termine vereinbart der Auditor selbst mit dem Kunden und trägt sie ein (Festlegung 18.09.2026); Kapazitätsplanung je Kalenderwoche aus dem ZMS-Katalog entfällt dadurch als Pflicht und bleibt Option.
- Tages-Trigger 06:00 mit Tagesreport, Backup, Fehler-Wiederholung 3×, Dry-Run.
- Append-only-Protokoll, DAkkS-tauglicher Prüfpfad, GitHub als Änderungshistorie.
- Ziel ≥ 90 % Automatisierung, Backoffice nur Ausnahmen und Freigaben.

---

## 5. Geänderte Datenmodell-Übersicht (Zusammenführung)

Neue oder umbenannte Blätter gegenüber Katalog 6.2:

| Blatt | Schlüssel | Herkunft |
|---|---|---|
| `Ansprechpartner` | `K-00123-01` | L01 |
| `Kompetenzen` | Auditor × Norm × Branchencode | L07 |
| `Konflikte` | `KF-0001` | L07 |
| `Einsaetze` | `Audit × Auditor` | L07 |
| `Abweichungen` | `AB-2026-0001` | L10 (ersetzt Spalten in `Audits`) |
| `ZFA_Mitglieder` | Mitglied | L13 (aus `Mandanten.ausschuss_mitglieder` herausgelöst: Name, Rolle, Normen, Selbsterklärung gültig bis) |
| `ZFA_Sitzungen` | `SI-2026-01` | L13 |
| `Beschwerden` | `BE-2026-0001` | L14 |
| `Register_oeffentlich` | `zert_nr` | L18 (minimale Felder, einzige Quelle der Verifizierung) |
| `Abonnenten` | E-Mail × zert_nr | L04 |
| `Bewertungen` | `Audit` | L09 |

Blätter mit Änderungen: `Kunden` (+ `status_kunde`, Drive-Ordner-ID), `Audits` (+ Typ `TR`, Abweichungen ausgelagert), `Entscheidungen` (+ `verfahren`, Votum `vertagt`), `Mandanten` (+ `testmodus`, `preismodus`, `stichprobe_berichte_prozent`), `Log` (+ Heartbeat).

---

## 6. Auswirkung auf die Roadmap

Die Roadmap aus Katalog Kapitel 7 bleibt in Reihenfolge und Dauer. Verschiebungen:

- Phase 2 (Ausschuss & Audit) wächst um `Abweichungen`, `Kompetenzen`, `Konflikte`, Vorschlags-Kaskade und die fünf Berichtsvorlagen: +2 Tage.
- Phase 3 (Erinnerungen & Tagesliste) bekommt Health-Check und Testmodus: +0,5 Tage.
- Phase 5 (Portal & Kundenerlebnis) bekommt Abonnement und Feedback: +1 Tag; Bulk-Verifikation nach Phase 6.
- Gesamt: rund 34 bis 40 Umsetzungstage statt 30 bis 36.
