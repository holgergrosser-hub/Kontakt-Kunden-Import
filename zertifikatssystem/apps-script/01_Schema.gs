/**
 * Datenmodell der Mandantendatei (Katalog 6.2, Runde 3).
 * Jedes Blatt: Name -> Spaltenueberschriften. Zugriff im Code immer ueber Header-Namen.
 */
const SCHEMA = {
  Mandanten: ['mandant_id', 'name', 'domain_verify', 'absender_mail', 'absender_name', 'logo_ids', 'farben', 'praefix_nummern',
    'quorum', 'gueltigkeit_jahre_standard', 'zahlung_vor_zertifikat', 'testmodus', 'preismodus', 'stichprobe_berichte_prozent',
    'hinweis_akkreditierung', 'impressum_url', 'datenschutz_url', 'aktiv'],
  Kunden: ['kunden_nr', 'crm_zeile', 'firma', 'rechtsform', 'strasse', 'plz', 'ort', 'land', 'sprache', 'email', 'telefon',
    'projektleiter', 'kundenart', 'status_kunde', 'billomat_client_id', 'drive_ordner_id', 'portal_token_hash', 'portal_token_ablauf',
    'opt_out_register', 'einwilligung_certsearch', 'alt_kunde_id', 'zahlungsampel', 'geaendert_am'],
  Ansprechpartner: ['ap_id', 'kunden_nr', 'name', 'rolle', 'email', 'telefon', 'sprache', 'kontakt_rechnung', 'kontakt_zertifikat', 'kontakt_audit', 'aktiv'],
  Standorte: ['standort_id', 'kunden_nr', 'bezeichnung', 'strasse', 'plz', 'ort', 'land', 'taetigkeit', 'mitarbeiter', 'hauptstandort', 'aktiv_ab', 'aktiv_bis'],
  Normen: ['norm_code', 'bezeichnung_de', 'bezeichnung_en', 'bezeichnung_es', 'bezeichnung_fr', 'ausgabe', 'systemname_de', 'systemname_en', 'systemname_es', 'systemname_fr', 'logo_key', 'aktiv'],
  Angebote: ['angebot_nr', 'kunden_nr', 'mandant_id', 'paket', 'normen', 'standorte_anzahl', 'gueltigkeit_jahre', 'preis_erst', 'preis_ua', 'preis_rezert',
    'pdf_id', 'gesendet_am', 'erinnerung_1', 'erinnerung_2', 'erinnerung_3', 'status', 'angenommen_am', 'annahme_token_hash', 'billomat_offer_id', 'freitext'],
  Auftraege: ['auftrag_nr', 'angebot_nr', 'kunden_nr', 'mandant_id', 'normen', 'standorte', 'gueltigkeit_jahre', 'vertragsdatum', 'zyklus_start', 'zyklus_ende',
    'vereinbarung_pdf_id', 'rechnungsplan_json', 'status'],
  Audits: ['audit_nr', 'auftrag_nr', 'kunden_nr', 'zert_nr', 'typ', 'plan_datum', 'ist_datum', 'uhrzeit', 'methode', 'dauer_tage', 'auditor_id', 'co_auditor_id',
    'termin_bestaetigt_am', 'bericht_pdf_id', 'ergebnis', 'abweichungen_haupt', 'abweichungen_neben', 'status', 'kalender_event_id'],
  Auditoren: ['auditor_id', 'name', 'email', 'google_konto', 'normen', 'sprachen', 'region', 'vertragsart', 'selbsterklaerung_gueltig_bis', 'sperrliste_kunden', 'aktiv', 'alt_auditor_id'],
  Kompetenzen: ['kompetenz_id', 'auditor_id', 'norm_code', 'branchencode', 'stufe', 'gueltig_bis', 'status'],
  Konflikte: ['konflikt_id', 'auditor_id', 'kunden_nr', 'von', 'bis', 'art', 'bemerkung'],
  Einsaetze: ['einsatz_id', 'audit_nr', 'auditor_id', 'tage_geplant', 'tage_ist', 'status', 'angefragt_am', 'bestaetigt_am'],
  Abweichungen: ['abweichung_nr', 'audit_nr', 'kunden_nr', 'stufe', 'normkapitel', 'feststellung', 'korrektur', 'ursache', 'massnahme', 'frist', 'nachweis_datei_id',
    'wirksamkeit_geprueft_am', 'geprueft_von', 'status'],
  Checklisten: ['check_id', 'norm_code', 'audittyp', 'kapitel', 'frage_de', 'frage_en', 'pflicht', 'aktiv'],
  Bewertungen: ['bewertung_id', 'audit_nr', 'auditor_id', 'kunden_feedback', 'freitext', 'bericht_puenktlich', 'abweichungen_anzahl', 'erfasst_am'],
  Entscheidungen: ['entscheidung_nr', 'audit_nr', 'kunden_nr', 'zert_nr', 'typ', 'verfahren', 'vorlage_text', 'links_json', 'voten_json', 'ergebnis', 'entschieden_am', 'quorum_erreicht', 'erinnert_am'],
  ZFA_Mitglieder: ['mitglied_id', 'mandant_id', 'name', 'email', 'rolle', 'normen', 'selbsterklaerung_gueltig_bis', 'aktiv'],
  ZFA_Sitzungen: ['sitzung_id', 'mandant_id', 'termin', 'tagesordnung', 'protokoll_doc_id', 'anwesende'],
  Beschwerden: ['beschwerde_id', 'kunden_nr', 'bezug', 'eingang', 'bestaetigt_am', 'pruefer', 'frist', 'ergebnis', 'status'],
  Zertifikate: ['zert_nr', 'mandant_id', 'kunden_nr', 'auftrag_nr', 'entscheidung_nr', 'norm_code', 'scope_de', 'scope_en', 'standorte', 'gueltigkeit_jahre',
    'erstzertifizierung', 'ausgestellt_am', 'gueltig_bis', 'naechstes_audit', 'ua1_faellig', 'ua2_faellig', 'rezert_faellig', 'status', 'anzeige', 'status_seit',
    'status_grund_intern', 'version', 'ersetzt_durch', 'ersetzt_von', 'verify_token', 'pdf_hash_sha256', 'alt_id', 'alt_uuid', 'sprachen', 'auditor_id', 'audit_datum', 'audit_typ'],
  Ausfertigungen: ['ausfertigung_id', 'zert_nr', 'sprache', 'standort_id', 'vorlage_key', 'pdf_id', 'erzeugt_am', 'versendet_am', 'hash', 'alt_link'],
  Logos: ['logo_key', 'mandant_id', 'norm_code', 'sprache', 'variante', 'drive_id', 'version', 'gueltig_ab', 'breite_px'],
  Vorlagen: ['vorlage_key', 'mandant_id', 'typ', 'sprache', 'doc_id', 'version', 'platzhalter_liste', 'aktiv'],
  Mailvorlagen: ['mail_key', 'mandant_id', 'ereignis', 'sprache', 'betreff', 'html', 'anhaenge_regel', 'aktiv'],
  Texte: ['key', 'de', 'en', 'es', 'fr', 'it', 'ru', 'pt'],
  Regelwerk: ['regel_nr', 'mandant', 'name', 'ausloeser_typ', 'ausloeser_feld', 'offset_tage', 'bedingung', 'aktion_typ', 'aktion_parameter',
    'erinnerung_tage', 'eskalation_tage', 'eskalation_aktion', 'aktiv', 'probelauf_bis', 'geaendert_von', 'geaendert_am'],
  Preise: ['preis_id', 'mandant_id', 'modus', 'paket', 'norm_code', 'leistung', 'zyklusjahr', 'betrag_netto', 'artikel_nr', 'gueltig_ab', 'gueltig_bis'],
  Rechnungen: ['rechnung_ref', 'auftrag_nr', 'kunden_nr', 'zert_nr', 'zyklusjahr', 'faellig_am', 'leistung', 'betrag', 'status', 'vorbereitet_am',
    'rechnungen_qm_zeile', 'rechnungs_nr', 'gestellt_am', 'bezahlt_am', 'storno', 'mahnstufe', 'billomat_invoice_id'],
  Aufgaben: ['aufgabe_id', 'typ', 'gruppe', 'bezug', 'kunden_nr', 'faellig', 'prioritaet', 'text', 'aktion_link', 'regel_nr', 'erstellt_am', 'erledigt_am', 'erledigt_von'],
  Erinnerungen_Log: ['lfd', 'bezug', 'typ', 'regel_nr', 'empfaenger', 'gesendet_am', 'status', 'fehler'],
  Abonnenten: ['abo_id', 'zert_nr', 'email', 'bestaetigt_am', 'token_hash', 'aktiv'],
  Register_oeffentlich: ['zert_nr', 'alt_id', 'alt_uuid', 'aussteller', 'firma', 'ort', 'land', 'norm', 'scope_kurz', 'erstzertifizierung', 'ausgestellt_am', 'gueltig_bis', 'status', 'status_seit', 'sprachen', 'aktualisiert_am'],
  Historie: ['lfd', 'zeit', 'nutzer', 'objekt', 'schluessel', 'feld', 'alt', 'neu', 'quelle', 'regel_nr'],
  Log: ['lfd', 'zeit', 'trigger', 'verarbeitet', 'gesendet', 'fehler', 'dauer_ms', 'hinweis'],
  Zaehler: ['kreis', 'jahr', 'letzter_wert']
};

/** Anzeigeformen des Status (abgeleitet, Katalog 3.2 + Runde 3 F09). */
const STATUS = {
  ENTWURF: 'entwurf', IM_AUSSCHUSS: 'im_ausschuss', GUELTIG: 'gueltig', UEBERWACHUNG_FAELLIG: 'ueberwachung_faellig',
  AUSGESETZT: 'ausgesetzt', ENTZOGEN: 'entzogen', ABGELAUFEN: 'abgelaufen', ERSETZT: 'ersetzt', MIGRIERT: 'migriert'
};
const OEFFENTLICH_SICHTBAR = [STATUS.GUELTIG, STATUS.UEBERWACHUNG_FAELLIG, STATUS.AUSGESETZT, STATUS.ENTZOGEN, STATUS.ABGELAUFEN, STATUS.ERSETZT, STATUS.MIGRIERT];
