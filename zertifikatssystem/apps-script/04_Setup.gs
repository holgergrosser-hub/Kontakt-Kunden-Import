/**
 * Einrichtung der Mandantendatei: Blaetter, Kopfzeilen, Stammdaten, Regelwerk, Trigger.
 * Idempotent: mehrfach ausfuehrbar, ueberschreibt keine vorhandenen Daten.
 */
function setupMandantendatei() {
  const ss = Lib.mandantendatei();
  Object.keys(SCHEMA).forEach(name => Lib.ensureColumns(name, ss));
  seedMandanten_();
  seedNormen_();
  seedRegelwerk_();
  seedTexte_();
  const first = ss.getSheets()[0];
  if (!SCHEMA[first.getName()] && first.getLastRow() <= 1 && ss.getSheets().length > 1) ss.deleteSheet(first);
  Lib.log('setupMandantendatei', Object.keys(SCHEMA).length, 0, 0, 0, 'Version ' + OC_VERSION);
  Logger.log('Mandantendatei eingerichtet: %s Blaetter', Object.keys(SCHEMA).length);
}

function seedIfEmpty_(name, rowsToAdd) {
  if (Lib.rows(name).length) return 0;
  rowsToAdd.forEach(r => Lib.append(name, r));
  return rowsToAdd.length;
}

function seedMandanten_() {
  return seedIfEmpty_('Mandanten', [
    { mandant_id: 'OC', name: 'OnlineCert', domain_verify: 'verify.onlinecert.de', absender_name: 'OnlineCert', praefix_nummern: 'OC', quorum: '2 von 3',
      gueltigkeit_jahre_standard: 1, zahlung_vor_zertifikat: 'neukunden', testmodus: 'ja', preismodus: 'paket', stichprobe_berichte_prozent: 5,
      hinweis_akkreditierung: 'nicht akkreditiert', aktiv: 'ja' },
    { mandant_id: 'QMG', name: 'QM-Guru / QM-Dienstleistungen Holger Grosser', domain_verify: 'verify.qm-guru.de', absender_name: 'QM-Dienstleistungen Holger Grosser',
      praefix_nummern: 'QMG', quorum: '2 von 3', gueltigkeit_jahre_standard: 1, zahlung_vor_zertifikat: 'neukunden', testmodus: 'ja', preismodus: 'paket',
      stichprobe_berichte_prozent: 5, hinweis_akkreditierung: 'nicht akkreditiert', aktiv: 'ja' }
  ]);
}

function seedNormen_() {
  return seedIfEmpty_('Normen', [
    { norm_code: '9001', bezeichnung_de: 'ISO 9001:2015', bezeichnung_en: 'ISO 9001:2015', bezeichnung_es: 'ISO 9001:2015', bezeichnung_fr: 'ISO 9001:2015', ausgabe: '2015',
      systemname_de: 'Qualitätsmanagementsystem', systemname_en: 'Quality Management System', systemname_es: 'Sistema de Gestión de la Calidad', systemname_fr: 'Système de management de la qualité', logo_key: '9001', aktiv: 'ja' },
    { norm_code: '14001', bezeichnung_de: 'ISO 14001:2015', bezeichnung_en: 'ISO 14001:2015', bezeichnung_es: 'ISO 14001:2015', bezeichnung_fr: 'ISO 14001:2015', ausgabe: '2015',
      systemname_de: 'Umweltmanagementsystem', systemname_en: 'Environmental Management System', systemname_es: 'Sistema de Gestión Ambiental', systemname_fr: 'Système de management environnemental', logo_key: '14001', aktiv: 'ja' },
    { norm_code: '45001', bezeichnung_de: 'ISO 45001:2018', bezeichnung_en: 'ISO 45001:2018', bezeichnung_es: 'ISO 45001:2018', bezeichnung_fr: 'ISO 45001:2018', ausgabe: '2018',
      systemname_de: 'Managementsystem für Sicherheit und Gesundheit bei der Arbeit', systemname_en: 'Occupational Health and Safety Management System', systemname_es: 'Sistema de Gestión de SST', systemname_fr: 'Système de management de la SST', logo_key: '45001', aktiv: 'ja' },
    { norm_code: '77200', bezeichnung_de: 'DIN 77200', bezeichnung_en: 'DIN 77200', bezeichnung_es: 'DIN 77200', bezeichnung_fr: 'DIN 77200', ausgabe: '2017',
      systemname_de: 'Sicherheitsdienstleistungen', systemname_en: 'Security services', systemname_es: 'Servicios de seguridad', systemname_fr: 'Services de sécurité', logo_key: '77200', aktiv: 'ja' }
  ]);
}

/** Regelwerk R01-R33 (Runde 2, Kap. 2.3). Alle Regeln starten im Probelauf (14 Tage). */
function seedRegelwerk_() {
  const bis = Lib.fmt(Lib.addDays(Lib.today(), 14));
  const R = (nr, name, typ, feld, offset, bed, akt, param, erinn, esk, eskAkt) => ({
    regel_nr: nr, mandant: '*', name, ausloeser_typ: typ, ausloeser_feld: feld, offset_tage: offset, bedingung: bed, aktion_typ: akt, aktion_parameter: param,
    erinnerung_tage: erinn, eskalation_tage: esk, eskalation_aktion: eskAkt, aktiv: 'ja', probelauf_bis: bis, geaendert_von: 'setup', geaendert_am: Lib.fmt(new Date()) });
  return seedIfEmpty_('Regelwerk', [
    R('R01', 'Anfrage → Angebot', 'klick', 'Anfrage', 0, '', 'dokument', 'angebot; billomat_kunde', '7,14', 30, 'aufgabe:anrufen'),
    R('R02', 'Annahme → Auftrag', 'klick', 'Angebote.angenommen_am', 0, '', 'dokument', 'auftrag; vereinbarung; rechnungsplan; portal', '10,18', 21, 'aufgabe:unterlagen_anfordern'),
    R('R03', 'Sonderwunsch im Angebot', 'statuswechsel', 'Angebote.freitext', 0, 'freitext<>""', 'aufgabe', 'angebot_pruefen', '', 0, ''),
    R('R04', 'Datei im Drive-Kundenordner', 'klick', 'Drive.neue_datei', 0, '', 'status', 'checkliste_abhaken', '', 0, ''),
    R('R05', 'Checkliste vollständig', 'statuswechsel', 'Auftraege.status', 0, 'status=unterlagen_vollstaendig', 'aufgabe', 'auditor_vorschlag; stufe1', '5', 10, 'aufgabe:auditor_mahnen'),
    R('R06', 'Stufe 1 bereit', 'statuswechsel', 'Audits.ergebnis', 0, 'typ=E1;ergebnis=bereit', 'status', 'terminphase', '', 0, ''),
    R('R07', 'Stufe 1 nicht bereit', 'statuswechsel', 'Audits.ergebnis', 0, 'typ=E1;ergebnis=nicht_bereit', 'mail', 'vorlage=lueckenliste;empfaenger=kunde', '7', 14, 'aufgabe:anrufen'),
    R('R08', 'Auditor vereinbart Termin', 'statuswechsel', 'Audits.status', 0, 'status=termin_offen', 'aufgabe', 'auditor:termin_vereinbaren', '7', 14, 'aufgabe:termin_nachfassen'),
    R('R09', 'Termin eingetragen', 'statuswechsel', 'Audits.plan_datum', 0, 'plan_datum<>""', 'dokument', 'kalender; videolink; auditplan; mail=termin_bestaetigen', '-7', 0, ''),
    R('R10', 'Termin ändern', 'klick', 'Audits.termin_aendern', 0, '', 'aufgabe', 'auditor:neuen_termin', '7', 14, 'aufgabe:pruefen'),
    R('R11', 'Audittermin erreicht', 'datum_offset', 'Audits.plan_datum', 0, 'status=terminiert', 'status', 'audit_laeuft', '3', 5, 'aufgabe:bericht_fehlt'),
    R('R12', 'Audit abschließen', 'klick', 'Audits.abschliessen', 0, '', 'dokument', 'bericht', '', 0, ''),
    R('R13', 'Bericht frei ohne Hauptabweichung', 'statuswechsel', 'Audits.status', 0, 'status=bericht_frei;abweichungen_haupt=0', 'dokument', 'entscheidung_anlegen; mail=bericht_an_kunde', '', 0, ''),
    R('R14', 'Bericht frei mit Abweichungen', 'statuswechsel', 'Audits.status', 0, 'status=bericht_frei;abweichungen_haupt>0', 'mail', 'vorlage=abweichungen;empfaenger=kunde', '15,25', 30, 'aufgabe:pruefen'),
    R('R15', 'Nachweis hochgeladen', 'klick', 'Abweichungen.nachweis_datei_id', 0, '', 'mail', 'vorlage=nachweis_pruefen;empfaenger=auditor', '3', 5, 'aufgabe:pruefen'),
    R('R16', 'Hauptabweichungen geschlossen', 'statuswechsel', 'Abweichungen.status', 0, 'stufe=haupt;status=geschlossen', 'status', 'weiter=R13', '', 0, ''),
    R('R17', 'Ausschussvorgang', 'statuswechsel', 'Entscheidungen.status', 0, 'status=offen', 'mail', 'vorlage=votum;empfaenger=ausschuss', '3', 7, 'aufgabe:ausschuss_mahnen'),
    R('R18', 'Quorum positiv', 'statuswechsel', 'Entscheidungen.ergebnis', 0, 'ergebnis=erteilt', 'dokument', 'zertifikat; ausfertigungen; register; logo_paket; mail=zertifikat', '', 0, ''),
    R('R19', 'Quorum negativ', 'statuswechsel', 'Entscheidungen.ergebnis', 0, 'ergebnis=abgelehnt', 'aufgabe', 'kunde_informieren', '', 0, ''),
    R('R20', 'Zertifikat versendet', 'statuswechsel', 'Zertifikate.status', 0, 'status=gueltig', 'status', 'portal; erinnerungskette; rechnungsplan', '7', 21, 'aufgabe:anrufen'),
    R('R21', 'Rechnungstermin', 'datum_offset', 'Rechnungen.faellig_am', 0, 'status=geplant', 'aufgabe', 'rechnung_vorbereiten', '', 0, ''),
    R('R22', 'Rechnung bezahlt', 'statuswechsel', 'Rechnungen.bezahlt_am', 0, 'bezahlt_am<>""', 'status', 'zertifikat_freigeben', '', 0, ''),
    R('R23', 'Rechnung 60 Tage überfällig', 'datum_offset', 'Rechnungen.faellig_am', 60, 'status=gestellt;bezahlt_am=""', 'aufgabe', 'aussetzungsvorlage', '', 0, ''),
    R('R24', 'Audit fällig in 120 Tagen', 'datum_offset', 'Zertifikate.naechstes_audit', -120, 'status=gueltig', 'mail', 'vorlage=audit_planen;empfaenger=kunde; aufgabe=auditor:termin_vereinbaren', '90,60', 60, 'aufgabe:anrufen'),
    R('R25', 'Audit durchgeführt', 'statuswechsel', 'Audits.status', 0, 'typ=UA;status=bericht_frei;abweichungen_haupt=0', 'dokument', 'neuausstellung', '', 0, ''),
    R('R26', 'Audit-Frist überschritten', 'datum_offset', 'Zertifikate.naechstes_audit', 1, 'status=gueltig', 'status', 'ueberwachung_faellig; mail=karenz', '30,7', 90, 'aufgabe:aussetzungsvorlage'),
    R('R27', 'Ablauf in 180 Tagen', 'datum_offset', 'Zertifikate.gueltig_bis', -180, 'status=gueltig', 'mail', 'vorlage=verlaengerung_angebot;empfaenger=kunde', '120,90', 90, 'aufgabe:anrufen'),
    R('R28', 'Neuausstellung positiv', 'statuswechsel', 'Entscheidungen.ergebnis', 0, 'typ=rezert;ergebnis=erteilt', 'dokument', 'neue_nummer; ersetzt_von', '', 0, ''),
    R('R29', 'Gültig-bis erreicht', 'datum_offset', 'Zertifikate.gueltig_bis', 1, 'status<>ersetzt', 'status', 'abgelaufen; mail=logo_entfernen', '14', 0, ''),
    R('R30', 'Mail-Bounce', 'klick', 'Mail.bounce', 0, '', 'aufgabe', 'kontaktdaten_pruefen', '', 0, ''),
    R('R31', 'Antwort auf Systemmail', 'klick', 'Mail.antwort', 0, '', 'aufgabe', 'klassifizieren', '', 0, ''),
    R('R32', 'Standort/Name geändert', 'klick', 'Portal.aenderung', 0, '', 'aufgabe', 'pruefen; angebot_erweiterung', '', 0, ''),
    R('R33', 'Trigger-Fehler', 'statuswechsel', 'Log.fehler', 0, 'fehler>0', 'aufgabe', 'fehler_pruefen', '', 0, '')
  ]);
}

function seedTexte_() {
  return seedIfEmpty_('Texte', [
    { key: 'status.gueltig', de: 'Gültig', en: 'Valid', es: 'Válido', fr: 'Valide', it: 'Valido', ru: 'Действителен', pt: 'Válido' },
    { key: 'status.ueberwachung_faellig', de: 'Gültig, Überwachung ausstehend', en: 'Valid, surveillance pending', es: 'Válido, seguimiento pendiente', fr: 'Valide, surveillance en attente', it: 'Valido, sorveglianza in sospeso', ru: 'Действителен, ожидается надзор', pt: 'Válido, supervisão pendente' },
    { key: 'status.ausgesetzt', de: 'Ausgesetzt', en: 'Suspended', es: 'Suspendido', fr: 'Suspendu', it: 'Sospeso', ru: 'Приостановлен', pt: 'Suspenso' },
    { key: 'status.entzogen', de: 'Entzogen', en: 'Withdrawn', es: 'Retirado', fr: 'Retiré', it: 'Ritirato', ru: 'Отозван', pt: 'Retirado' },
    { key: 'status.abgelaufen', de: 'Abgelaufen', en: 'Expired', es: 'Caducado', fr: 'Expiré', it: 'Scaduto', ru: 'Истёк', pt: 'Expirado' },
    { key: 'status.ersetzt', de: 'Ersetzt', en: 'Superseded', es: 'Sustituido', fr: 'Remplacé', it: 'Sostituito', ru: 'Заменён', pt: 'Substituído' },
    { key: 'anzeige.aktuell', de: 'Aktuell', en: 'Current' }, { key: 'anzeige.bald', de: 'Läuft bald ab', en: 'Expires soon' },
    { key: 'anzeige.dringend', de: 'Dringend', en: 'Urgent' }, { key: 'anzeige.kritisch', de: 'Kritisch', en: 'Critical' }
  ]);
}

/** Zeitgesteuerte Trigger anlegen (idempotent). Phase 0: Statuslauf, Regelwerk (Probelauf), Tagesliste. */
function setupTrigger() {
  const wanted = { statuslauf: 5, regelwerkLauf: 6, tagesliste: 7 };
  const existing = ScriptApp.getProjectTriggers().map(t => t.getHandlerFunction());
  Object.keys(wanted).forEach(fn => {
    if (existing.indexOf(fn) >= 0) return;
    ScriptApp.newTrigger(fn).timeBased().everyDays(1).atHour(wanted[fn]).inTimezone('Europe/Berlin').create();
    Logger.log('Trigger angelegt: %s (%s Uhr)', fn, wanted[fn]);
  });
}
