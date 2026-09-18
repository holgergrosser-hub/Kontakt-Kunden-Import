/**
 * OnlineCert Zertifikatssystem · Phase 0
 * ------------------------------------------------------------
 * Alle Geheimnisse und IDs liegen in den Skript-Eigenschaften
 * (Projekteinstellungen > Skript-Eigenschaften), nie im Code.
 *
 * Pflicht:
 *   MANDANT_SHEET_ID   ID der Mandantendatei (leeres Google Sheet, wird durch setupMandantendatei() befuellt)
 *   CRM_SHEET_ID       ID des CRM "Super Master"
 * Fuer den Import:
 *   ZV2025_SHEET_ID    ID von Zertifikatsverwaltung_2025
 *   RECHNUNGEN_SHEET_ID ID des Sheets "Rechnungen CRM" (Blatt "Rechnungen QM")
 *   BILLOMAT_ID        Billomat-Konto (Subdomain)
 *   BILLOMAT_KEY       Billomat-API-Schluessel (nach Erneuerung!)
 * Optional:
 *   TESTMODUS_MAIL     Wenn gesetzt, gehen alle Mails an diese Adresse (Betreff [TEST])
 *   BACKOFFICE_MAIL    Empfaenger fuer Tagesliste und Alarme
 */
const OC_VERSION = '0.1.0';

function cfg_(key, optional) {
  const v = PropertiesService.getScriptProperties().getProperty(key);
  if (!v && !optional) throw new Error('Skript-Eigenschaft fehlt: ' + key + ' (Projekteinstellungen > Skript-Eigenschaften)');
  return v || '';
}

/** Einmalig ausfuehren: zeigt, welche Eigenschaften gesetzt sind (Werte werden nicht geloggt). */
function setup_pruefeEinstellungen() {
  const keys = ['MANDANT_SHEET_ID', 'CRM_SHEET_ID', 'ZV2025_SHEET_ID', 'RECHNUNGEN_SHEET_ID', 'BILLOMAT_ID', 'BILLOMAT_KEY', 'TESTMODUS_MAIL', 'BACKOFFICE_MAIL'];
  const props = PropertiesService.getScriptProperties();
  keys.forEach(k => Logger.log('%s: %s', k, props.getProperty(k) ? 'gesetzt' : 'FEHLT'));
}
