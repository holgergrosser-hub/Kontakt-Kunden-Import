/** Tests ohne Nebenwirkungen auf Produktivdaten (Zaehler-Kreis TEST wird benutzt). Im Editor ausfuehren, Logger lesen. */
function test_alle() {
  const r = [test_luhn(), test_pruefeNummer(), test_status(), test_bedingung(), test_nummernkreis()];
  Logger.log(r.every(Boolean) ? 'ALLE TESTS OK' : 'FEHLER, siehe oben');
  return r.every(Boolean);
}
function erwarte_(name, ist, soll) {
  const ok = JSON.stringify(ist) === JSON.stringify(soll);
  Logger.log((ok ? 'OK   ' : 'FEHL ') + name + (ok ? '' : ' -> ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll)));
  return ok;
}
function test_luhn() {
  return erwarte_('luhn 7992739871', Lib.luhn('7992739871'), '3') && erwarte_('luhn 202600001', Lib.luhn('202600001'), Lib.luhn('2026' + '00001'));
}
function test_pruefeNummer() {
  const p = Lib.luhn('202600123');
  const nr = 'OC-2026-00123-' + p;
  const a = pruefeZertifikatsnummer(nr);
  const b = pruefeZertifikatsnummer(nr + '/EN');
  const falsch = pruefeZertifikatsnummer('OC-2026-00123-' + ((Number(p) + 1) % 10));
  return erwarte_('kern', a && a.kern, nr) && erwarte_('ausfertigung', b && b.ausfertigung, 'EN') && erwarte_('pruefziffer falsch', falsch, null);
}
function test_status() {
  const heute = new Date(2026, 8, 18);
  const s1 = berechneStatus_({ status: 'gueltig', gueltig_bis: new Date(2027, 8, 18), gueltigkeit_jahre: 1 }, heute);
  const s2 = berechneStatus_({ status: 'gueltig', gueltig_bis: new Date(2026, 8, 1), gueltigkeit_jahre: 1 }, heute);
  const s3 = berechneStatus_({ status: 'gueltig', gueltig_bis: new Date(2028, 0, 1), naechstes_audit: new Date(2026, 7, 1), gueltigkeit_jahre: 3 }, heute);
  const s4 = berechneStatus_({ status: 'gueltig', gueltig_bis: new Date(2026, 8, 30), gueltigkeit_jahre: 1 }, heute);
  const s5 = berechneStatus_({ status: 'ausgesetzt', gueltig_bis: new Date(2027, 0, 1) }, heute);
  return erwarte_('gueltig/aktuell', s1, { status: 'gueltig', anzeige: 'Aktuell' }) && erwarte_('abgelaufen', s2, { status: 'abgelaufen', anzeige: 'Abgelaufen' })
    && erwarte_('ueberwachung', s3, { status: 'ueberwachung_faellig', anzeige: 'Überwachung ausstehend' }) && erwarte_('kritisch', s4, { status: 'gueltig', anzeige: 'Kritisch' })
    && erwarte_('ausgesetzt bleibt', s5, { status: 'ausgesetzt', anzeige: 'Ausgesetzt' });
}
function test_bedingung() {
  const z = { status: 'gueltig', abweichungen_haupt: 0, typ: 'E1', frist: new Date(2026, 0, 5) };
  return erwarte_('gleich', bedingungErfuellt_('status=gueltig', z), true) && erwarte_('ungleich', bedingungErfuellt_('status<>gueltig', z), false)
    && erwarte_('und', bedingungErfuellt_('status=gueltig;abweichungen_haupt=0;typ=E1', z), true) && erwarte_('groesser', bedingungErfuellt_('abweichungen_haupt>0', z), false)
    && erwarte_('leer', bedingungErfuellt_('', z), true);
}
function test_nummernkreis() {
  const a = Lib.nextNumber('TEST', 2026), b = Lib.nextNumber('TEST', 2026);
  return erwarte_('fortlaufend', b, a + 1);
}
