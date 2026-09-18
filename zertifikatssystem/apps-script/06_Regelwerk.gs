/**
 * Regelwerk-Engine (Runde 2, Kap. 5.2). Phase 0: Ausloesertyp datum_offset,
 * Aktionstypen aufgabe / mail / status. Alles andere wird im Probelauf gemeldet.
 *
 * Bedingung: "feld=wert;feld<>wert;feld>0;feld=\"\"" (UND-verknuepft) gegen die Zeile des Ausloeser-Blatts.
 * Probelauf: Regel mit probelauf_bis >= heute oder Mandant testmodus=ja oder dryRun=true sendet nichts,
 * schreibt aber Erinnerungen_Log mit status=probelauf.
 */
function regelwerkLauf() { return regelwerkLauf_(false); }
function probelauf() { return regelwerkLauf_(true); }

function regelwerkLauf_(dryRun) {
  const t0 = Date.now();
  const heute = Lib.today();
  const regeln = Lib.rows('Regelwerk').filter(r => String(r.aktiv).toLowerCase() === 'ja' && r.ausloeser_typ === 'datum_offset');
  const mandanten = {}; Lib.rows('Mandanten').forEach(m => { mandanten[m.mandant_id] = m; });
  const logRows = Lib.rows('Erinnerungen_Log');
  const schonGesendet = {};
  logRows.forEach(l => { schonGesendet[l.bezug + '|' + l.regel_nr + '|' + l.typ] = true; });
  const ergebnis = { geprueft: 0, aktionen: [], fehler: [] };
  const tabellenCache = {};
  regeln.forEach(regel => {
    const [blatt, feld] = String(regel.ausloeser_feld).split('.');
    if (!SCHEMA[blatt] || !feld) { ergebnis.fehler.push(regel.regel_nr + ': Ausloeserfeld unbekannt ' + regel.ausloeser_feld); return; }
    if (!tabellenCache[blatt]) tabellenCache[blatt] = Lib.rows(blatt);
    const offsets = [Number(regel.offset_tage || 0)].concat(String(regel.erinnerung_tage || '').split(',').map(s => s.trim()).filter(Boolean).map(Number).map(n => (Number(regel.offset_tage || 0) < 0 ? -Math.abs(n) : n)));
    tabellenCache[blatt].forEach(zeile => {
      ergebnis.geprueft++;
      if (regel.mandant !== '*' && zeile.mandant_id && String(zeile.mandant_id) !== String(regel.mandant)) return;
      if (!bedingungErfuellt_(regel.bedingung, zeile)) return;
      const basis = Lib.toDate(zeile[feld]);
      if (!basis) return;
      offsets.forEach((off, idx) => {
        const faellig = Lib.addDays(basis, off);
        if (faellig > heute) return;
        const bezug = zeile[SCHEMA[blatt][0]];
        const typ = idx === 0 ? 'haupt' : 'erinnerung' + idx;
        const key = bezug + '|' + regel.regel_nr + '|' + typ;
        if (schonGesendet[key]) return;
        const m = mandanten[zeile.mandant_id] || {};
        const probelauf = dryRun || String(m.testmodus).toLowerCase() === 'ja' || (Lib.toDate(regel.probelauf_bis) && Lib.toDate(regel.probelauf_bis) >= heute);
        const aktion = fuehreAktionAus_(regel, zeile, bezug, typ, probelauf);
        ergebnis.aktionen.push(aktion);
        schonGesendet[key] = true;
      });
      // Eskalation
      const esk = Number(regel.eskalation_tage || 0);
      if (esk && regel.eskalation_aktion) {
        const eskDatum = Lib.addDays(basis, Number(regel.offset_tage || 0) + (Number(regel.offset_tage || 0) < 0 ? esk : esk));
        const bezug = zeile[SCHEMA[blatt][0]];
        const key = bezug + '|' + regel.regel_nr + '|eskalation';
        if (eskDatum <= heute && !schonGesendet[key]) {
          const m = mandanten[zeile.mandant_id] || {};
          const probelauf = dryRun || String(m.testmodus).toLowerCase() === 'ja';
          ergebnis.aktionen.push(legeAufgabeAn_(regel, zeile, bezug, String(regel.eskalation_aktion).replace(/^aufgabe:/, ''), 'Eskalation', probelauf));
          schonGesendet[key] = true;
        }
      }
    });
  });
  Lib.log(dryRun ? 'probelauf' : 'regelwerkLauf', ergebnis.geprueft, ergebnis.aktionen.filter(a => a.ausgefuehrt).length, ergebnis.fehler.length, Date.now() - t0,
    ergebnis.aktionen.length + ' Aktionen' + (dryRun ? ' (Probelauf)' : ''));
  Logger.log(JSON.stringify(ergebnis, null, 1).slice(0, 5000));
  return ergebnis;
}

function bedingungErfuellt_(bed, zeile) {
  const s = String(bed || '').trim();
  if (!s) return true;
  return s.split(';').every(teil => {
    const m = teil.trim().match(/^(\w+)\s*(<>|>=|<=|=|>|<)\s*(.*)$/);
    if (!m) return true;
    const val = zeile[m[1]];
    const soll = m[3].replace(/^"|"$/g, '').trim();
    const ist = val instanceof Date ? Lib.fmt(val) : String(val == null ? '' : val).trim();
    switch (m[2]) {
      case '=': return ist === soll;
      case '<>': return ist !== soll;
      case '>': return Number(ist) > Number(soll);
      case '<': return Number(ist) < Number(soll);
      case '>=': return Number(ist) >= Number(soll);
      case '<=': return Number(ist) <= Number(soll);
    }
    return true;
  });
}

function fuehreAktionAus_(regel, zeile, bezug, typ, probelauf) {
  const a = { regel_nr: regel.regel_nr, bezug, typ, aktion_typ: regel.aktion_typ, kunden_nr: zeile.kunden_nr || '', probelauf, ausgefuehrt: false };
  switch (regel.aktion_typ) {
    case 'aufgabe':
      return legeAufgabeAn_(regel, zeile, bezug, String(regel.aktion_parameter || ''), regel.name, probelauf);
    case 'mail': {
      const param = parseParam_(regel.aktion_parameter);
      const empfaenger = param.empfaenger || 'kunde';
      a.empfaenger = empfaenger;
      const sh = Lib.sheet('Erinnerungen_Log');
      if (probelauf) {
        sh.appendRow([sh.getLastRow(), bezug, typ, regel.regel_nr, empfaenger + ' (' + (param.vorlage || '?') + ')', new Date(), 'probelauf', '']);
        return a;
      }
      const res = sendeMailAusVorlage_(regel, zeile, param, typ);
      sh.appendRow([sh.getLastRow(), bezug, typ, regel.regel_nr, res.an || empfaenger, new Date(), res.ok ? 'gesendet' : 'fehler', res.fehler || '']);
      a.ausgefuehrt = res.ok;
      return a;
    }
    case 'status': {
      const neu = String(regel.aktion_parameter || '').split(';')[0].trim();
      if (!probelauf && neu && SCHEMA.Zertifikate.indexOf('status') >= 0 && String(regel.ausloeser_feld).startsWith('Zertifikate.') && STATUS[neu.toUpperCase()]) {
        Lib.update('Zertifikate', zeile._row, { status: neu, status_seit: Lib.today() }, 'regelwerk', regel.regel_nr);
        a.ausgefuehrt = true;
      }
      a.neuer_status = neu;
      return a;
    }
    default:
      a.hinweis = 'Aktionstyp in Phase 0 nicht ausfuehrbar: ' + regel.aktion_typ;
      return a;
  }
}

function legeAufgabeAn_(regel, zeile, bezug, text, gruppe, probelauf) {
  const a = { regel_nr: regel.regel_nr, bezug, aktion_typ: 'aufgabe', text, probelauf, ausgefuehrt: false };
  const offen = Lib.rows('Aufgaben').some(t => String(t.bezug) === String(bezug) && String(t.regel_nr) === String(regel.regel_nr) && !t.erledigt_am);
  if (offen) { a.hinweis = 'Aufgabe bereits offen'; return a; }
  if (!probelauf) {
    Lib.append('Aufgaben', { aufgabe_id: 'T-' + Lib.pad(Lib.nextNumber('AUFGABE', ''), 6), typ: text.split(':').pop(), gruppe: gruppe || regel.name, bezug,
      kunden_nr: zeile.kunden_nr || '', faellig: Lib.today(), prioritaet: 'normal', text: regel.name + ': ' + text, aktion_link: '', regel_nr: regel.regel_nr, erstellt_am: new Date() });
    a.ausgefuehrt = true;
  }
  return a;
}

function parseParam_(s) {
  const o = {};
  String(s || '').split(';').forEach(t => { const m = t.trim().match(/^(\w+)\s*=\s*(.*)$/); if (m) o[m[1]] = m[2].trim(); });
  return o;
}

/** Mail aus Mailvorlagen (Blatt) senden; Testmodus-Umleitung; Platzhalter {{feld}} aus der Zeile. */
function sendeMailAusVorlage_(regel, zeile, param, typ) {
  const sprache = String(zeile.sprache || 'DE').toUpperCase();
  const vorlagen = Lib.rows('Mailvorlagen');
  const v = vorlagen.find(x => x.ereignis === param.vorlage && String(x.sprache).toUpperCase() === sprache && String(x.aktiv).toLowerCase() === 'ja')
    || vorlagen.find(x => x.ereignis === param.vorlage && String(x.aktiv).toLowerCase() === 'ja');
  if (!v) return { ok: false, fehler: 'Mailvorlage fehlt: ' + param.vorlage };
  let an = '';
  if (param.empfaenger === 'kunde') { const k = Lib.find('Kunden', 'kunden_nr', zeile.kunden_nr); an = k ? k.email : ''; }
  else if (param.empfaenger === 'auditor') { const au = Lib.find('Auditoren', 'auditor_id', zeile.auditor_id); an = au ? au.email : ''; }
  else if (param.empfaenger === 'backoffice') an = cfg_('BACKOFFICE_MAIL', true);
  const test = cfg_('TESTMODUS_MAIL', true);
  if (test) an = test;
  if (!an) return { ok: false, fehler: 'Kein Empfaenger' };
  const fill = s => String(s || '').replace(/\{\{(\w+)\}\}/g, (m, f) => { const val = zeile[f]; return val instanceof Date ? Lib.fmtDe(val) : (val == null ? '' : String(val)); });
  const betreff = (test ? '[TEST] ' : '') + fill(v.betreff);
  const html = fill(v.html) + '<p style="color:#777;font-size:12px">Diese Nachricht wurde automatisch ausgelöst durch: Regel ' + regel.regel_nr + ' (' + regel.name + ').</p>';
  try {
    MailApp.sendEmail({ to: an, subject: betreff, htmlBody: html, name: 'OnlineCert' });
    return { ok: true, an };
  } catch (e) { return { ok: false, fehler: e.message, an }; }
}

/** Tagesliste 07:00: offene Aufgaben gruppiert + Zusammenfassung des Tages (P2: Automatik sichtbar). */
function tagesliste() {
  const aufgaben = Lib.rows('Aufgaben').filter(a => !a.erledigt_am);
  const gruppen = {};
  aufgaben.forEach(a => { (gruppen[a.gruppe || 'Sonstiges'] = gruppen[a.gruppe || 'Sonstiges'] || []).push(a); });
  const heute = Lib.fmt(Lib.today());
  const logs = Lib.rows('Log').filter(l => Lib.fmt(Lib.toDate(l.zeit)) === heute);
  const gesendet = logs.reduce((s, l) => s + Number(l.gesendet || 0), 0);
  const fehler = logs.reduce((s, l) => s + Number(l.fehler || 0), 0);
  let html = '<h2>Tagesliste ' + Lib.fmtDe(new Date()) + '</h2>';
  if (!aufgaben.length) html += '<p>Nichts zu tun.</p>';
  Object.keys(gruppen).sort().forEach(g => {
    html += '<h3>' + g + ' (' + gruppen[g].length + ')</h3><ul>' + gruppen[g].map(a => '<li><b>' + (a.kunden_nr || '') + '</b> ' + a.text + ' <i>(' + a.regel_nr + ', fällig ' + Lib.fmtDe(Lib.toDate(a.faellig)) + ')</i></li>').join('') + '</ul>';
  });
  html += '<p style="color:#777">Automatisch heute: ' + logs.length + ' Läufe, ' + gesendet + ' Mails, ' + fehler + ' Fehler.</p>';
  const an = cfg_('TESTMODUS_MAIL', true) || cfg_('BACKOFFICE_MAIL', true);
  if (an) MailApp.sendEmail({ to: an, subject: 'Tagesliste OnlineCert · ' + aufgaben.length + ' offen', htmlBody: html, name: 'OnlineCert' });
  Lib.log('tagesliste', aufgaben.length, an ? 1 : 0, 0, 0, an ? 'an ' + an : 'kein Empfaenger konfiguriert');
  return html;
}
