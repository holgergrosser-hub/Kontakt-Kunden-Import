/**
 * Statuslauf (Katalog M7.1, 3.2; Runde 3 F02/F09): ein Statuswert je Zertifikat, abgeleitete Anzeige,
 * Befuellung von Register_oeffentlich. Laeuft taeglich 05:30 und nach jeder Statusaenderung.
 */

/** Reine Funktion: berechnet status + anzeige aus Datumsfeldern. Unveraenderliche Status bleiben. */
function berechneStatus_(z, heute) {
  const fest = [STATUS.ENTWURF, STATUS.IM_AUSSCHUSS, STATUS.AUSGESETZT, STATUS.ENTZOGEN, STATUS.ERSETZT];
  const gueltigBis = Lib.toDate(z.gueltig_bis);
  const naechstes = Lib.toDate(z.naechstes_audit);
  let status = String(z.status || '').trim() || STATUS.GUELTIG;
  if (fest.indexOf(status) < 0) {
    if (gueltigBis && gueltigBis < heute) status = STATUS.ABGELAUFEN;
    else if (naechstes && naechstes < heute && Number(z.gueltigkeit_jahre || 1) > 1) status = STATUS.UEBERWACHUNG_FAELLIG;
    else status = STATUS.GUELTIG;
  }
  let anzeige;
  if (status === STATUS.AUSGESETZT) anzeige = 'Ausgesetzt';
  else if (status === STATUS.ENTZOGEN) anzeige = 'Entzogen';
  else if (status === STATUS.ERSETZT) anzeige = 'Ersetzt';
  else if (status === STATUS.ABGELAUFEN) anzeige = 'Abgelaufen';
  else if (status === STATUS.ENTWURF || status === STATUS.IM_AUSSCHUSS) anzeige = 'In Bearbeitung';
  else {
    const tage = gueltigBis ? Lib.daysBetween(heute, gueltigBis) : 9999;
    anzeige = tage <= 14 ? 'Kritisch' : tage <= 30 ? 'Dringend' : tage <= 90 ? 'Läuft bald ab' : 'Aktuell';
    if (status === STATUS.UEBERWACHUNG_FAELLIG) anzeige = 'Überwachung ausstehend';
  }
  return { status, anzeige };
}

function statuslauf() {
  const t0 = Date.now();
  const heute = Lib.today();
  const zerts = Lib.rows('Zertifikate');
  let geaendert = 0;
  zerts.forEach(z => {
    if (!z.zert_nr) return;
    const neu = berechneStatus_(z, heute);
    const upd = {};
    if (String(z.status) !== neu.status) { upd.status = neu.status; upd.status_seit = heute; }
    if (String(z.anzeige) !== neu.anzeige) upd.anzeige = neu.anzeige;
    if (Object.keys(upd).length) { Lib.update('Zertifikate', z._row, upd, 'statuslauf'); geaendert++; }
  });
  const n = registerSnapshot_();
  Lib.log('statuslauf', zerts.length, 0, 0, Date.now() - t0, geaendert + ' Statuswechsel, Register ' + n + ' Zeilen');
  return { geprueft: zerts.length, geaendert, register: n };
}

/** Register_oeffentlich komplett neu schreiben: nur oeffentliche Felder, nur sichtbare Status (M6.1, L18). */
function registerSnapshot_() {
  const zerts = Lib.rows('Zertifikate');
  const kunden = {}; Lib.rows('Kunden').forEach(k => { kunden[k.kunden_nr] = k; });
  const mandanten = {}; Lib.rows('Mandanten').forEach(m => { mandanten[m.mandant_id] = m; });
  const normen = {}; Lib.rows('Normen').forEach(n => { normen[String(n.norm_code)] = n; });
  const sh = Lib.ensureColumns('Register_oeffentlich');
  const cols = SCHEMA.Register_oeffentlich;
  const out = [];
  zerts.forEach(z => {
    if (OEFFENTLICH_SICHTBAR.indexOf(String(z.status)) < 0 || (kunden[z.kunden_nr] && String(kunden[z.kunden_nr].opt_out_register) === 'ja')) return;
    const k = kunden[z.kunden_nr] || {};
    const m = mandanten[z.mandant_id] || {};
    const n = normen[String(z.norm_code)] || {};
    const scope = String(z.scope_de || '');
    out.push([z.zert_nr, z.alt_id || '', z.alt_uuid || '', m.name || z.mandant_id || '', k.firma || '', k.ort || '', k.land || '',
      n.bezeichnung_de || z.norm_code || '', scope.length > 160 ? scope.slice(0, 157) + '…' : scope,
      Lib.fmt(Lib.toDate(z.erstzertifizierung)), Lib.fmt(Lib.toDate(z.ausgestellt_am)), Lib.fmt(Lib.toDate(z.gueltig_bis)),
      z.status, Lib.fmt(Lib.toDate(z.status_seit)), z.sprachen || '', Lib.fmt(new Date())]);
  });
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
  if (out.length) sh.getRange(2, 1, out.length, cols.length).setValues(out);
  return out.length;
}

/** Oeffentliche Verifizierung: liest NUR Register_oeffentlich. */
function verifiziere_(nr) {
  const geprueft = pruefeZertifikatsnummer(nr);
  const suche = geprueft ? geprueft.kern : String(nr || '').trim();
  const rows = Lib.rows('Register_oeffentlich');
  const r = rows.find(x => String(x.zert_nr) === suche || String(x.alt_id) === suche || String(x.alt_uuid).toLowerCase() === suche.toLowerCase());
  if (!r) return { gefunden: false, nummer: suche, geprueft_am: new Date().toISOString() };
  const o = { gefunden: true, geprueft_am: new Date().toISOString() };
  SCHEMA.Register_oeffentlich.forEach(c => { o[c] = r[c] instanceof Date ? Lib.fmt(r[c]) : r[c]; });
  return o;
}

/** Web-App-Endpunkt: ?verify=OC-2026-00001-7 (JSON). Cache 1 h. */
function doGet(e) {
  const p = (e && e.parameter) || {};
  let body;
  if (p.verify) {
    const cache = CacheService.getScriptCache();
    const key = 'v:' + String(p.verify).trim().toUpperCase();
    body = cache.get(key);
    if (!body) { body = JSON.stringify(verifiziere_(p.verify)); cache.put(key, body, 3600); }
  } else if (p.register === '1') {
    body = JSON.stringify({ stand: new Date().toISOString(), zertifikate: Lib.rows('Register_oeffentlich').map(r => { delete r._row; Object.keys(r).forEach(k => { if (r[k] instanceof Date) r[k] = Lib.fmt(r[k]); }); return r; }) });
  } else {
    body = JSON.stringify({ system: 'OnlineCert Zertifikatssystem', version: OC_VERSION, endpunkte: ['?verify={nummer}', '?register=1'] });
  }
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}
