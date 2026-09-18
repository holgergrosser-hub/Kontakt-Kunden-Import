/**
 * Importlaeufe (Runde 2 Kap. 4.8, Runde 3 F04/F08). Immer zuerst mit dryRun=true.
 * Grundsatz "einmal erfassen": Kunden entstehen nur im CRM. Der Import ordnet zu, legt keine CRM-Kunden an.
 *
 *   import_zertifikatsverwaltung(true)  Zertifikatsverwaltung_2025 -> Kunden(Referenz), Zertifikate, Ausfertigungen, Auditoren
 *   import_rechnungenQM(true)           Sheet "Rechnungen QM" -> Rechnungen (Historie) + Zahlungsampel je Kunde
 *   import_billomatKunden(true)         Billomat-Kunden -> billomat_client_id an der Kundenreferenz
 */

/** CRM-Zeilen: Organisationsname -> {nr, zeile, ...}. Blatt wird ueber die Kopfzeile gefunden. */
function ladeCrm_() {
  const ss = SpreadsheetApp.openById(cfg_('CRM_SHEET_ID'));
  const sh = ss.getSheets().find(s => s.getLastRow() > 0 && s.getRange(1, 1, 1, Math.min(5, s.getLastColumn())).getValues()[0].indexOf('Organisationsname') >= 0);
  if (!sh) throw new Error('CRM: kein Blatt mit Kopfzeile "Organisationsname" gefunden');
  const map = Lib.headerMap(sh);
  const need = ['Organisationsname', 'Organisations Nr.'];
  need.forEach(n => { if (!map[n]) throw new Error('CRM: Spalte fehlt: ' + n); });
  const values = sh.getRange(2, 1, Math.max(1, sh.getLastRow() - 1), sh.getLastColumn()).getValues();
  const byName = {};
  const get = (row, name) => map[name] ? row[map[name] - 1] : '';
  values.forEach((row, i) => {
    const name = String(get(row, 'Organisationsname') || '').trim();
    if (!name) return;
    byName[Lib.normalizeName(name)] = { zeile: i + 2, firma: name, nr: String(get(row, 'Organisations Nr.') || '').trim(),
      email: String(get(row, 'primäre E-Mail') || '').trim(), plz: String(get(row, 'Rechnung PLZ') || get(row, 'PLZ') || '').trim(),
      ort: String(get(row, 'Rechnung Ort') || get(row, 'Ort') || '').trim(), projektleiter: String(get(row, 'zuständig') || '').trim() };
  });
  return { sheet: sh, map, byName, anzahl: values.length };
}

/** Blatt in einer Datei ueber Kopfzeilen-Signatur finden (unabhaengig vom Blattnamen). */
function findeBlatt_(ss, signatur) {
  return ss.getSheets().find(s => {
    if (s.getLastRow() < 1) return false;
    const h = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(x => String(x).trim());
    return signatur.every(sig => h.indexOf(sig) >= 0);
  });
}

function blattAlsObjekte_(sh) {
  const map = Lib.headerMap(sh);
  if (sh.getLastRow() < 2) return [];
  const values = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
  return values.map((v, i) => { const o = { _row: i + 2 }; Object.keys(map).forEach(n => { o[n] = v[map[n] - 1]; }); return o; });
}

const NORM_MAP = { 'ISO 9001:2015': '9001', 'ISO 14001:2015': '14001', 'ISO 45001:2018': '45001', 'DIN 77200': '77200' };
const MANDANT_MAP = { 'QM-Guru': 'QMG', 'OnlineCert': 'OC' };

function import_zertifikatsverwaltung(dryRun) {
  dryRun = dryRun !== false;
  const t0 = Date.now();
  const ss = SpreadsheetApp.openById(cfg_('ZV2025_SHEET_ID'));
  const shK = findeBlatt_(ss, ['Kunde_ID', 'Firmenname']);
  const shZ = findeBlatt_(ss, ['Zertifikat_ID', 'Kunde_ID', 'Zertifikatstyp']);
  const shA = findeBlatt_(ss, ['AuditorNr', 'Auditor']);
  if (!shK || !shZ) throw new Error('Zertifikatsverwaltung: Blaetter Kunden/Zertifikate nicht gefunden');
  const crm = ladeCrm_();
  const vorhandeneKunden = {}; Lib.rows('Kunden').forEach(k => { vorhandeneKunden[String(k.alt_kunde_id || '')] = k; vorhandeneKunden[String(k.kunden_nr)] = k; });
  const vorhandeneZert = {}; Lib.rows('Zertifikate').forEach(z => { vorhandeneZert[String(z.alt_id || z.zert_nr)] = z; });
  const bericht = { kunden: { gelesen: 0, zugeordnet: 0, ohne_crm: 0, neu: 0, uebersprungen: 0 }, zertifikate: { gelesen: 0, neu: 0, uebersprungen: 0 }, auditoren: 0, probleme: [], zuordnung: {} };

  // 1) Kunden
  blattAlsObjekte_(shK).forEach(k => {
    const altId = String(k.Kunde_ID || '').trim(); if (!altId) return;
    bericht.kunden.gelesen++;
    if (vorhandeneKunden[altId]) { bericht.kunden.uebersprungen++; bericht.zuordnung[altId] = vorhandeneKunden[altId].kunden_nr; return; }
    const firma = String(k.Firmenname || '').trim();
    const crmTreffer = crm.byName[Lib.normalizeName(firma)];
    let kundenNr;
    if (crmTreffer && crmTreffer.nr) { kundenNr = crmTreffer.nr; bericht.kunden.zugeordnet++; }
    else if (crmTreffer) { kundenNr = dryRun ? '(neu)' : neueKundennummer(); bericht.kunden.neu++; bericht.probleme.push(altId + ' ' + firma + ': im CRM ohne Organisations Nr. -> neue K-Nr.'); }
    else { kundenNr = dryRun ? '(neu, nicht im CRM)' : neueKundennummer(); bericht.kunden.ohne_crm++; bericht.probleme.push(altId + ' ' + firma + ': nicht im CRM gefunden -> Aufgabe "im CRM erfassen"'); }
    const plz = String(k.PLZ || '').replace(/\D/g, '');
    if (!k['Straße'] || !k.Ort) bericht.probleme.push(altId + ' ' + firma + ': Adresse unvollständig');
    if (plz && plz.length === 4) bericht.probleme.push(altId + ' ' + firma + ': PLZ ' + plz + ' vermutlich ohne führende Null');
    if (/straße und hausnummer|^stadt$/i.test(String(k['Straße'] || '') + ' ' + String(k.Ort || ''))) bericht.probleme.push(altId + ' ' + firma + ': Platzhaltertext in Adresse');
    bericht.zuordnung[altId] = kundenNr;
    if (dryRun) return;
    Lib.append('Kunden', { kunden_nr: kundenNr, crm_zeile: crmTreffer ? crmTreffer.zeile : '', firma, strasse: k['Straße'] || '', plz: plz.length === 4 ? '0' + plz : plz, ort: k.Ort || '',
      land: k.Land || 'Deutschland', sprache: 'DE', email: k.Hauptkontakt_Email || (crmTreffer ? crmTreffer.email : ''), projektleiter: crmTreffer ? crmTreffer.projektleiter : '',
      kundenart: 'zertifizierung', status_kunde: k.Kunde_Status || '', alt_kunde_id: altId, geaendert_am: new Date() });
    if (!crmTreffer) Lib.append('Aufgaben', { aufgabe_id: 'T-' + Lib.pad(Lib.nextNumber('AUFGABE', ''), 6), typ: 'im_crm_erfassen', gruppe: 'Zuordnen', bezug: altId, kunden_nr: kundenNr,
      faellig: Lib.today(), prioritaet: 'normal', text: 'Kunde ' + firma + ' im CRM erfassen und K-Nr. abgleichen', regel_nr: 'IMPORT', erstellt_am: new Date() });
    Lib.historie('Kunden', kundenNr, 'import', '', altId + ' <- ' + (crmTreffer ? 'CRM Zeile ' + crmTreffer.zeile : 'kein CRM-Treffer'), 'import_zv2025', '');
  });

  // 2) Zertifikate
  const sprachen = ['DE', 'EN', 'FR', 'ES', 'IT', 'RU', 'PT'];
  blattAlsObjekte_(shZ).forEach(z => {
    const altId = String(z.Zertifikat_ID || '').trim(); if (!altId) return;
    bericht.zertifikate.gelesen++;
    if (vorhandeneZert[altId]) { bericht.zertifikate.uebersprungen++; return; }
    const kundenNr = bericht.zuordnung[String(z.Kunde_ID || '').trim()] || '';
    const erst = Lib.toDate(z.Erstzertifizierung_Datum), aus = Lib.toDate(z.Ausstellungsdatum), bis = Lib.toDate(z.Ablaufdatum);
    if (!aus || !bis) bericht.probleme.push(altId + ': Ausstellungs- oder Ablaufdatum fehlt/unlesbar');
    const jahre = aus && bis ? Math.max(1, Math.round(Lib.daysBetween(aus, bis) / 365)) : 1;
    const normCode = NORM_MAP[String(z.Zertifikatstyp || '').trim()] || String(z.Zertifikatstyp || '').replace(/\D/g, '');
    const vorhandeneSprachen = sprachen.filter(s => String(z[s + '_Status'] || '').trim());
    if (String(z.Zertifikats_Nummer || '').toLowerCase().indexOf('doppelt') >= 0) bericht.probleme.push(altId + ': als Dublette markiert');
    if (dryRun) { bericht.zertifikate.neu++; return; }
    const status = String(z.Zertifikat_Status || '').toLowerCase() === 'archiv' ? STATUS.ERSETZT : STATUS.MIGRIERT;
    Lib.append('Zertifikate', { zert_nr: altId, mandant_id: MANDANT_MAP[String(z.Zertifizierer || '').trim()] || 'OC', kunden_nr: kundenNr, norm_code: normCode,
      gueltigkeit_jahre: jahre, erstzertifizierung: erst || aus || '', ausgestellt_am: aus || '', gueltig_bis: bis || '', naechstes_audit: jahre > 1 && aus ? Lib.addYears(aus, 1) : (bis || ''),
      status, status_grund_intern: 'Import Zertifikatsverwaltung_2025 (' + Lib.fmt(new Date()) + ')', version: 1, ersetzt_von: z['Vorgänger_Zertifikat_ID'] || '',
      verify_token: Lib.token(), alt_id: altId, sprachen: vorhandeneSprachen.join(','), auditor_id: z.Auditor_ID || '', audit_datum: Lib.toDate(z.Audit_Datum_Von) || '',
      audit_typ: String(z.Audit_Typ || '') === 'Initial' ? 'E2' : 'UA' });
    vorhandeneSprachen.forEach(s => Lib.append('Ausfertigungen', { ausfertigung_id: altId + '/' + s, zert_nr: altId, sprache: s, alt_link: z[s + '_Link'] || '', erzeugt_am: aus || '' }));
    bericht.zertifikate.neu++;
  });

  // 3) Auditoren
  if (shA) {
    const vorhandene = {}; Lib.rows('Auditoren').forEach(a => { vorhandene[String(a.alt_auditor_id || a.auditor_id)] = true; });
    blattAlsObjekte_(shA).forEach(a => {
      const id = String(a.AuditorNr || '').trim(); if (!id || vorhandene[id] || /^test/i.test(String(a.Auditor))) return;
      bericht.auditoren++;
      if (!dryRun) Lib.append('Auditoren', { auditor_id: id, name: a.Auditor || '', email: a['E Mail'] || '', normen: '9001,14001,45001,77200', sprachen: 'DE', aktiv: 'ja', alt_auditor_id: id });
    });
  }
  Lib.log(dryRun ? 'import_zv2025 (Probelauf)' : 'import_zv2025', bericht.kunden.gelesen + bericht.zertifikate.gelesen, 0, bericht.probleme.length, Date.now() - t0,
    JSON.stringify({ kunden: bericht.kunden, zertifikate: bericht.zertifikate, auditoren: bericht.auditoren }));
  Logger.log(JSON.stringify(bericht, null, 1).slice(0, 8000));
  return bericht;
}

function import_rechnungenQM(dryRun) {
  dryRun = dryRun !== false;
  const t0 = Date.now();
  const ss = SpreadsheetApp.openById(cfg_('RECHNUNGEN_SHEET_ID'));
  const sh = findeBlatt_(ss, ['Nr. Rechnung', 'Organisationsname', 'Rechnung bezahlt']);
  if (!sh) throw new Error('Rechnungen QM: Blatt nicht gefunden');
  const kundenByName = {}; Lib.rows('Kunden').forEach(k => { kundenByName[Lib.normalizeName(k.firma)] = k; });
  const vorhanden = {}; Lib.rows('Rechnungen').forEach(r => { vorhanden[String(r.rechnungs_nr)] = true; });
  const bericht = { gelesen: 0, neu: 0, ohne_kunde: 0, ampel: {} };
  const proKunde = {};
  blattAlsObjekte_(sh).forEach(r => {
    const nr = String(r['Nr. Rechnung'] || '').trim(); if (!nr) return;
    bericht.gelesen++;
    const k = kundenByName[Lib.normalizeName(r.Organisationsname)];
    if (!k) { bericht.ohne_kunde++; return; }
    const mahn = ['Mail 1', 'Mail2', 'Mail3'].filter(c => String(r[c] || '').trim()).length;
    const bezahlt = r['Rechnung bezahlt'] === true || /ja|true|bezahlt/i.test(String(r['Rechnung bezahlt'] || '')) || Lib.toDate(r['Rechnung bezahlt']);
    const storno = r.Storno === true || /ja|true/i.test(String(r.Storno || ''));
    const p = proKunde[k.kunden_nr] = proKunde[k.kunden_nr] || { offen: 0, mahn: 0, gesamt: 0 };
    p.gesamt++; if (!bezahlt && !storno) p.offen++; p.mahn = Math.max(p.mahn, mahn);
    if (vorhanden[nr]) return;
    bericht.neu++;
    if (dryRun) return;
    Lib.append('Rechnungen', { rechnung_ref: 'QM:' + nr, kunden_nr: k.kunden_nr, leistung: r.Leistung || '', betrag: r['Summe gesamt'] || r.Summe || '',
      status: storno ? 'storniert' : bezahlt ? 'bezahlt' : 'gestellt', rechnungen_qm_zeile: r._row, rechnungs_nr: nr, gestellt_am: Lib.toDate(r.Datum) || '',
      bezahlt_am: Lib.toDate(r['Rechnung bezahlt']) || (bezahlt ? 'ja' : ''), storno: storno ? 'ja' : '', mahnstufe: mahn });
  });
  Object.keys(proKunde).forEach(nr => {
    const p = proKunde[nr];
    const ampel = p.mahn >= 2 ? 'rot' : (p.offen > 0 || p.mahn === 1) ? 'gelb' : 'gruen';
    bericht.ampel[ampel] = (bericht.ampel[ampel] || 0) + 1;
    if (!dryRun) { const k = Lib.find('Kunden', 'kunden_nr', nr); if (k) Lib.update('Kunden', k._row, { zahlungsampel: ampel }, 'import_rechnungenQM'); }
  });
  Lib.log(dryRun ? 'import_rechnungenQM (Probelauf)' : 'import_rechnungenQM', bericht.gelesen, 0, 0, Date.now() - t0, JSON.stringify(bericht));
  Logger.log(JSON.stringify(bericht, null, 1));
  return bericht;
}

/** Billomat: nur lesend. Kunden per client_number (= K-Nr.) oder normalisiertem Namen zuordnen. */
function billomat_(pfad, params) {
  const base = 'https://' + cfg_('BILLOMAT_ID') + '.billomat.net/api/';
  const q = Object.keys(params || {}).map(k => k + '=' + encodeURIComponent(params[k])).join('&');
  const res = UrlFetchApp.fetch(base + pfad + (q ? '?' + q : ''), { method: 'get', muteHttpExceptions: true, headers: { 'X-BillomatApiKey': cfg_('BILLOMAT_KEY'), 'Accept': 'application/json' } });
  const code = res.getResponseCode();
  if (code === 429) throw new Error('Billomat Rate-Limit: ' + res.getContentText());
  if (code >= 400) throw new Error('Billomat HTTP ' + code + ': ' + res.getContentText().slice(0, 300));
  return JSON.parse(res.getContentText() || '{}');
}
function asArray_(x) { return x == null ? [] : Array.isArray(x) ? x : [x]; }

function import_billomatKunden(dryRun) {
  dryRun = dryRun !== false;
  const t0 = Date.now();
  const kunden = Lib.rows('Kunden');
  const byNr = {}, byName = {};
  kunden.forEach(k => { byNr[String(k.kunden_nr)] = k; byName[Lib.normalizeName(k.firma)] = k; });
  const bericht = { gelesen: 0, per_nummer: 0, per_name: 0, ohne_treffer: [], bereits: 0 };
  let page = 1, total = 0;
  do {
    const res = billomat_('clients', { per_page: 250, page });
    const list = asArray_(res.clients && res.clients.client);
    total = Number((res.clients && res.clients['@total']) || 0);
    list.forEach(c => {
      bericht.gelesen++;
      let k = byNr[String(c.client_number || '').trim()];
      if (k) bericht.per_nummer++;
      else { k = byName[Lib.normalizeName(c.name)]; if (k) bericht.per_name++; }
      if (!k) { if (!/^archiv/i.test(String(c.archived))) bericht.ohne_treffer.push(c.name); return; }
      if (String(k.billomat_client_id) === String(c.id)) { bericht.bereits++; return; }
      if (!dryRun) Lib.update('Kunden', k._row, { billomat_client_id: c.id }, 'import_billomat');
    });
    page++;
  } while ((page - 1) * 250 < total && page < 40);
  Lib.log(dryRun ? 'import_billomat (Probelauf)' : 'import_billomat', bericht.gelesen, 0, bericht.ohne_treffer.length, Date.now() - t0,
    'per Nummer ' + bericht.per_nummer + ', per Name ' + bericht.per_name + ', ohne Treffer ' + bericht.ohne_treffer.length);
  Logger.log(JSON.stringify(bericht, null, 1).slice(0, 8000));
  return bericht;
}
