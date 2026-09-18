/**
 * Nummernkreise (Katalog 6.3). Vergabe erst beim Finalisieren, nie fuer Entwuerfe.
 *   Zertifikat:  {MANDANT}-{JAHR}-{LFD5}-{P}   z. B. OC-2026-00001-7
 *   Kunde:       K-{LFD5}
 *   Angebot/Auftrag/Audit/Entscheidung/Abweichung/Rechnung: AN-/AU-/AD-/ZE-/AB-/RE- {JAHR}-{LFD4}
 */
function neueZertifikatsnummer(mandantId, jahr) {
  jahr = jahr || new Date().getFullYear();
  const lfd = Lib.nextNumber('ZERT-' + mandantId, jahr);
  const core = String(jahr) + Lib.pad(lfd, 5);
  return mandantId + '-' + jahr + '-' + Lib.pad(lfd, 5) + '-' + Lib.luhn(core);
}

/** Prueft Aufbau und Pruefziffer einer Zertifikatsnummer; gibt Kernnummer zurueck oder null. */
function pruefeZertifikatsnummer(nr) {
  const m = String(nr || '').trim().toUpperCase().match(/^([A-Z]{2,4})-(\d{4})-(\d{5})-(\d)(?:\/([A-Z]{2}|S\d{2}(?:-[A-Z]{2})?))?$/);
  if (!m) return null;
  if (Lib.luhn(m[2] + m[3]) !== m[4]) return null;
  return { kern: m[1] + '-' + m[2] + '-' + m[3] + '-' + m[4], mandant: m[1], jahr: Number(m[2]), lfd: Number(m[3]), ausfertigung: m[5] || '' };
}

function neueKundennummer() { return 'K-' + Lib.pad(Lib.nextNumber('KUNDE', ''), 5); }
function neueNummer(praefix) {
  const jahr = new Date().getFullYear();
  return praefix + '-' + jahr + '-' + Lib.pad(Lib.nextNumber(praefix, jahr), 4);
}
function neueAngebotsnummer() { return neueNummer('AN'); }
function neueAuftragsnummer() { return neueNummer('AU'); }
function neueAuditnummer() { return neueNummer('AD'); }
function neueEntscheidungsnummer() { return neueNummer('ZE'); }
function neueAbweichungsnummer() { return neueNummer('AB'); }
