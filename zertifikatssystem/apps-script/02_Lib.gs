/**
 * OcLib: Header-basierter Sheet-Zugriff, Nummern mit LockService, Historie, Log, Datum.
 * Regel P6: Code ist Mechanik, Fachlogik steht in den Blaettern.
 */
const Lib = (() => {
  const cache = {};

  function mandantendatei_() {
    return SpreadsheetApp.openById(cfg_('MANDANT_SHEET_ID'));
  }

  /** Blatt holen; fehlt es, wird es mit Schema-Kopfzeile angelegt. */
  function sheet(name, ss) {
    ss = ss || mandantendatei_();
    let sh = ss.getSheetByName(name);
    if (!sh) {
      if (!SCHEMA[name]) throw new Error('Unbekanntes Blatt: ' + name);
      sh = ss.insertSheet(name);
      sh.getRange(1, 1, 1, SCHEMA[name].length).setValues([SCHEMA[name]]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    return sh;
  }

  /** Kopfzeile -> {name: spaltenindex (1-basiert)} */
  function headerMap(sh) {
    const key = sh.getParent().getId() + '/' + sh.getName();
    if (cache[key]) return cache[key];
    const lastCol = Math.max(1, sh.getLastColumn());
    const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    const map = {};
    headers.forEach((h, i) => { const n = String(h || '').trim(); if (n && map[n] === undefined) map[n] = i + 1; });
    cache[key] = map;
    return map;
  }

  /** Fehlende Schema-Spalten hinten anfuegen (idempotent). */
  function ensureColumns(name, ss) {
    const sh = sheet(name, ss);
    const map = headerMap(sh);
    const missing = (SCHEMA[name] || []).filter(c => map[c] === undefined);
    if (missing.length) {
      const start = sh.getLastColumn() + 1;
      sh.getRange(1, start, 1, missing.length).setValues([missing]).setFontWeight('bold');
      delete cache[sh.getParent().getId() + '/' + sh.getName()];
    }
    return sh;
  }

  /** Alle Zeilen als Objekte {feld: wert, _row: zeilennummer}. */
  function rows(name, ss) {
    const sh = sheet(name, ss);
    const map = headerMap(sh);
    const lastRow = sh.getLastRow();
    if (lastRow < 2) return [];
    const values = sh.getRange(2, 1, lastRow - 1, sh.getLastColumn()).getValues();
    const names = Object.keys(map);
    return values.map((v, i) => {
      const o = { _row: i + 2 };
      names.forEach(n => { o[n] = v[map[n] - 1]; });
      return o;
    });
  }

  /** Objekt als neue Zeile anhaengen; unbekannte Felder werden ignoriert. */
  function append(name, obj, ss) {
    const sh = ensureColumns(name, ss);
    const map = headerMap(sh);
    const row = new Array(sh.getLastColumn()).fill('');
    Object.keys(obj).forEach(k => { if (map[k]) row[map[k] - 1] = obj[k]; });
    sh.appendRow(row);
    return sh.getLastRow();
  }

  /** Felder einer Zeile setzen und Historie schreiben. */
  function update(name, rowNumber, obj, quelle, regelNr, ss) {
    const sh = sheet(name, ss);
    const map = headerMap(sh);
    const keyField = SCHEMA[name] ? SCHEMA[name][0] : '';
    const keyVal = map[keyField] ? sh.getRange(rowNumber, map[keyField]).getValue() : rowNumber;
    Object.keys(obj).forEach(k => {
      if (!map[k]) return;
      const cell = sh.getRange(rowNumber, map[k]);
      const alt = cell.getValue();
      if (String(alt) === String(obj[k])) return;
      cell.setValue(obj[k]);
      historie(name, keyVal, k, alt, obj[k], quelle || 'system', regelNr || '');
    });
  }

  function find(name, field, value, ss) {
    return rows(name, ss).find(r => String(r[field]) === String(value)) || null;
  }

  function historie(objekt, schluessel, feld, alt, neu, quelle, regelNr) {
    try {
      const sh = sheet('Historie');
      sh.appendRow([sh.getLastRow(), new Date(), Session.getActiveUser().getEmail() || 'trigger', objekt, schluessel, feld,
        alt instanceof Date ? fmt(alt) : String(alt == null ? '' : alt), neu instanceof Date ? fmt(neu) : String(neu == null ? '' : neu), quelle || '', regelNr || '']);
    } catch (e) { Logger.log('Historie-Fehler: ' + e.message); }
  }

  function log(trigger, verarbeitet, gesendet, fehler, dauerMs, hinweis) {
    try {
      const sh = sheet('Log');
      sh.appendRow([sh.getLastRow(), new Date(), trigger, verarbeitet || 0, gesendet || 0, fehler || 0, dauerMs || 0, hinweis || '']);
    } catch (e) { Logger.log('Log-Fehler: ' + e.message); }
  }

  /**
   * Fortlaufende Nummer je Kreis und Jahr, threadsicher.
   * Blatt Zaehler: kreis | jahr | letzter_wert
   */
  function nextNumber(kreis, jahr) {
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      const sh = sheet('Zaehler');
      const map = headerMap(sh);
      const data = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues() : [];
      let rowIdx = -1;
      data.forEach((r, i) => { if (String(r[map.kreis - 1]) === kreis && String(r[map.jahr - 1]) === String(jahr || '')) rowIdx = i; });
      let next;
      if (rowIdx < 0) {
        next = 1;
        sh.appendRow([kreis, jahr || '', next]);
      } else {
        next = Number(data[rowIdx][map.letzter_wert - 1] || 0) + 1;
        sh.getRange(rowIdx + 2, map.letzter_wert).setValue(next);
      }
      SpreadsheetApp.flush();
      return next;
    } finally {
      lock.releaseLock();
    }
  }

  /** Luhn-Pruefziffer (mod 10) ueber eine Ziffernfolge. */
  function luhn(digits) {
    const d = String(digits).replace(/\D/g, '');
    let sum = 0, dbl = true;
    for (let i = d.length - 1; i >= 0; i--) {
      let n = Number(d[i]);
      if (dbl) { n *= 2; if (n > 9) n -= 9; }
      sum += n; dbl = !dbl;
    }
    return String((10 - (sum % 10)) % 10);
  }

  function pad(n, len) { return String(n).padStart(len, '0'); }

  function fmt(d) { return d instanceof Date ? Utilities.formatDate(d, 'Europe/Berlin', 'yyyy-MM-dd') : String(d || ''); }

  function fmtDe(d) { return d instanceof Date ? Utilities.formatDate(d, 'Europe/Berlin', 'dd.MM.yyyy') : String(d || ''); }

  /** Datum aus Zelle oder Text (dd.MM.yyyy, d.M.yyyy, yyyy-MM-dd) */
  function toDate(v) {
    if (v instanceof Date && !isNaN(v)) return v;
    const s = String(v || '').trim();
    let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return null;
  }

  function addDays(d, days) { const r = new Date(d); r.setDate(r.getDate() + days); return r; }
  function addYears(d, years) { const r = new Date(d); r.setFullYear(r.getFullYear() + years); return r; }
  function daysBetween(a, b) { return Math.round((toDate(b) - toDate(a)) / 86400000); }
  function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }

  function normalizeName(s) {
    return String(s || '').toLowerCase().replace(/ /g, ' ').replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
  }

  function token() {
    const bytes = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    return bytes;
  }
  function hash(s) {
    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
      .map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
  }

  return { mandantendatei: mandantendatei_, sheet, headerMap, ensureColumns, rows, append, update, find, historie, log, nextNumber,
    luhn, pad, fmt, fmtDe, toDate, addDays, addYears, daysBetween, today, normalizeName, token, hash };
})();
