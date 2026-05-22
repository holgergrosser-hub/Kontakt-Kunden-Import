/**
 * ============================================================
 * Kontakt Kunden Import · Google Sheets Backend
 * ============================================================
 *
 * Bereitstellung:
 *   1. script.google.com → Neues Projekt → diesen Code einfügen
 *   2. Bereitstellen → Neue Bereitstellung → Web-App
 *   3. Ausführen als: ICH
 *   4. Zugriff: Jeder mit Link
 *   5. URL als VITE_GAS_URL in Netlify oder .env.local eintragen
 */

const SHEET_ID = '1FWbeX3YeK9Uidyn9obKJ7z-J-zXX1h5PsXcfk_YHAyU';
const SHEET_GID = 0;
const TOKEN = 'kontakt-kunden-import-2026';

const COL_CUSTOMER_NAME = 1;   // A
const COL_WEBSITE = 3;         // C
const COL_PHONE = 4;           // D
const COL_EMAIL_WORK = 9;      // I
const COL_EMAIL_PERSONAL = 10; // J
const COL_PROJECT_LEAD = 12;   // L
const COL_RUNNING_CUSTOMER = 16; // P
const COL_ON_SITE = 17;        // Q
const COL_STREET = 71;         // BS
const COL_CITY = 75;           // BW
const COL_POSTAL_CODE = 79;    // CA
const COL_FUNDING_DATE = 130;  // DZ

function doPost(e) {
  try {
    const params = (e && e.parameter) || {};
    if ((params.token || '') !== TOKEN) {
      return jsonResponse({ status: 'error', message: 'Zugriff verweigert.' });
    }

    const customerName = String(params.customerName || '').trim();
    const projectLeader = String(params.projectLeader || '').trim();
    if (!customerName) {
      return jsonResponse({ status: 'error', message: 'Kundenname fehlt.' });
    }
    if (!projectLeader) {
      return jsonResponse({ status: 'error', message: 'Projektleiter fehlt.' });
    }

    const sheet = getTargetSheet();
    const rowIndex = sheet.getLastRow() + 1;
    const values = new Array(COL_FUNDING_DATE).fill('');

    values[COL_CUSTOMER_NAME - 1] = customerName;
    values[COL_WEBSITE - 1] = String(params.website || '').trim();
    values[COL_PHONE - 1] = String(params.phone || '').trim();
    values[COL_EMAIL_WORK - 1] = String(params.emailWork || '').trim();
    values[COL_EMAIL_PERSONAL - 1] = String(params.emailPersonal || '').trim();
    values[COL_PROJECT_LEAD - 1] = projectLeader;
    values[COL_RUNNING_CUSTOMER - 1] = 'Ja';
    values[COL_ON_SITE - 1] = 'Nein';
    values[COL_STREET - 1] = String(params.street || '').trim();
    values[COL_CITY - 1] = String(params.city || '').trim();
    values[COL_POSTAL_CODE - 1] = String(params.postalCode || '').trim();
    values[COL_FUNDING_DATE - 1] = parseFundingDate(params.fundingDate);

    sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);

    return jsonResponse({
      status: 'success',
      rowIndex: rowIndex,
      customerName: customerName,
    });
  } catch (error) {
    console.error('Fehler in doPost:', error);
    return jsonResponse({
      status: 'error',
      message: 'Fehler beim Schreiben in Google Sheets: ' + error.message,
    });
  }
}

function getTargetSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === SHEET_GID) {
      return sheets[i];
    }
  }
  return sheets[0];
}

function offsetMonths(date, monthOffset) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + monthOffset);
  return result;
}

function parseFundingDate(rawValue) {
  const value = String(rawValue || '').trim();
  if (value) {
    const date = new Date(value + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return offsetMonths(new Date(), 5);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function testRun() {
  const fake = {
    parameter: {
      token: TOKEN,
      customerName: 'Muster GmbH',
      website: 'https://muster.de',
      phone: '+49 123 456789',
      emailWork: 'kontakt@muster.de',
      emailPersonal: '',
      projectLeader: 'Holger Grosser',
      street: 'Musterstr. 1',
      city: 'Musterstadt',
      postalCode: '12345',
      fundingDate: '2026-10-22',
    },
  };
  const result = doPost(fake);
  console.log(result.getContent());
}
