/**
 * ============================================================
 * Neukunde anlegen · Google Backend (CRM, Kalender, Drive)
 * ============================================================
 *
 * Bereitstellung:
 *   1. script.google.com → bestehendes Projekt „Kontakt Kunden Import“ öffnen
 *   2. Diesen Code komplett einfügen (alten Code ersetzen)
 *   3. Dienste (+) → „Calendar API“ hinzufügen
 *   4. Bereitstellen → Bereitstellungen verwalten → Stift → Version „Neue Version“
 *      (Ausführen als: ICH, Zugriff: Jeder) – die URL bleibt dabei gleich
 *
 * Aktionen (POST, JSON im Body):
 *   check  – Dubletten im CRM, vorhandener Drive-Ordner, Angebots-PDFs im Postfach
 *   create – legt die angehakten Schritte an: crm / calendar / drive
 * Alte Aufrufe ohne „action“ (Formularfelder) legen wie bisher nur die CRM-Zeile an.
 */

const SHEET_ID = '1FWbeX3YeK9Uidyn9obKJ7z-J-zXX1h5PsXcfk_YHAyU';
const SHEET_GID = 0;
const TOKEN = 'kontakt-kunden-import-2026';

const KONTAKTE_SHEET_ID = '1Mm0a2BtoMDeb9hVn_3r3-N3_pqOeS-mFv5W9jtq7hWo';
const KALENDER_ID = 'jnm2gcr7r6uuv14ffmgo8419ns@group.calendar.google.com'; // QM-Office Termine
const KUNDEN_ORDNER_ID = '1rDUmUtMzGQYJhQYZ1z_vAnVpigM1ohrE'; // QM-Guru Holger
const VERTRAEGE_ORDNER = '_Verträge';
const BESCHEID_SAMMELORDNER = '_Zuwendungsbescheide ohne Kundenordner';

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
const COL_QM = 109;            // DE
const COL_EMPLOYEE_QM = 110;   // DF
const COL_IS_CUSTOMER = 123;   // DS
const COL_FUNDING_DATE = 130;  // DZ

function doPost(e) {
  try {
    const data = readRequest(e);
    if ((data.token || '') !== TOKEN) {
      return jsonResponse({ status: 'error', message: 'Zugriff verweigert.' });
    }

    if (data.action === 'check') {
      return jsonResponse(checkCustomer(data));
    }
    if (data.action === 'create') {
      return jsonResponse(createCustomer(data));
    }

    // Alter Aufruf der bisherigen Seite: nur CRM-Zeile
    const row = writeCrmRow(data);
    return jsonResponse({ status: 'success', rowIndex: row, customerName: clean(data.customerName) });
  } catch (error) {
    console.error('Fehler in doPost:', error);
    return jsonResponse({ status: 'error', message: error.message });
  }
}

function doGet() {
  return jsonResponse({ status: 'ok', message: 'Neukunde-Backend ist aktiv. Bitte POST verwenden.' });
}

function readRequest(e) {
  const body = e && e.postData && e.postData.contents;
  if (body && body.charAt(0) === '{') {
    return JSON.parse(body);
  }
  return (e && e.parameter) || {};
}

/* ───────────────────────── check ───────────────────────── */

function checkCustomer(data) {
  const customerName = clean(data.customerName);
  if (!customerName) {
    throw new Error('Kundenname fehlt.');
  }
  const folder = findCustomerFolder(customerName);
  return {
    status: 'success',
    duplicates: findCrmDuplicates(customerName, clean(data.emailWork)),
    folder: folder ? { name: folder.getName(), url: folder.getUrl() } : null,
    offers: data.searchOffers ? findOfferAttachments(customerName, clean(data.emailWork), clean(data.website)) : [],
  };
}

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\b(gmbh|mbh|ug|ag|kg|ohg|gbr|e\.?\s?k\.?|co\.?|haftungsbeschränkt|kft\.?)\b/g, ' ')
    .replace(/[^a-z0-9äöüß]+/g, ' ')
    .trim();
}

function findCrmDuplicates(customerName, email) {
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const names = sheet.getRange(2, COL_CUSTOMER_NAME, lastRow - 1, 1).getValues();
  const mails = sheet.getRange(2, COL_EMAIL_WORK, lastRow - 1, 1).getValues();
  const wanted = normalizeName(customerName);
  const wantedMail = String(email || '').toLowerCase();
  const hits = [];
  for (let i = 0; i < names.length; i++) {
    const name = String(names[i][0] || '');
    if (!name) continue;
    const sameName = wanted && normalizeName(name) === wanted;
    const sameMail = wantedMail && String(mails[i][0] || '').toLowerCase() === wantedMail;
    if (sameName || sameMail) {
      hits.push({ row: i + 2, name: name, reason: sameName ? 'gleicher Name' : 'gleiche E-Mail' });
    }
  }
  return hits;
}

function findCustomerFolder(customerName) {
  const parent = DriveApp.getFolderById(KUNDEN_ORDNER_ID);
  const wanted = normalizeName(customerName);
  const folders = parent.getFolders();
  while (folders.hasNext()) {
    const folder = folders.next();
    if (normalizeName(folder.getName()) === wanted) return folder;
  }
  return null;
}

function mailDomain(email, website) {
  const fromMail = String(email || '').split('@')[1] || '';
  const fromWeb = String(website || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
  const domain = (fromMail || fromWeb).toLowerCase().trim();
  // Sammel-Postfächer sagen nichts über den Kunden aus
  if (/^(gmail|googlemail|gmx|web|t-online|outlook|hotmail|yahoo|icloud|aol|freenet)\./.test(domain)) return '';
  return domain;
}

/**
 * Sucht PDF-Anhänge mit „Angebot“ im Dateinamen in Mails von/an den Kunden.
 * Nur Lesen – abgelegt wird erst, was in der Vorschau angehakt bleibt.
 */
function findOfferAttachments(customerName, email, website) {
  const domain = mailDomain(email, website);
  const who = domain
    ? '(from:' + domain + ' OR to:' + domain + ' OR cc:' + domain + ')'
    : (email ? '(from:' + email + ' OR to:' + email + ')' : '"' + customerName.replace(/"/g, '') + '"');
  const query = who + ' has:attachment filename:pdf filename:angebot newer_than:18m';
  const threads = GmailApp.search(query, 0, 15);
  const offers = [];
  const seen = {};
  threads.forEach(function (thread) {
    thread.getMessages().forEach(function (message) {
      message.getAttachments({ includeInlineImages: false }).forEach(function (att, index) {
        const name = att.getName();
        if (!/\.pdf$/i.test(name) || !/angebot/i.test(name)) return;
        const key = name + '|' + att.getSize();
        if (seen[key]) return;
        seen[key] = true;
        offers.push({
          messageId: message.getId(),
          index: index,
          name: name,
          date: Utilities.formatDate(message.getDate(), 'Europe/Berlin', 'dd.MM.yyyy'),
          subject: message.getSubject(),
        });
      });
    });
  });
  return offers.slice(0, 12);
}

/* ───────────────────────── create ───────────────────────── */

function createCustomer(data) {
  const steps = data.steps || {};
  const customerName = clean(data.customerName);
  if (!customerName) {
    throw new Error('Kundenname fehlt.');
  }
  const result = { status: 'success', customerName: customerName, crm: null, contact: null, drive: null, calendar: null };

  // Datei einmal anlegen; Kalender und Drive nutzen dieselbe Datei.
  let bescheidFile = null;
  let customerFolder = null;

  if (steps.drive) {
    result.drive = runStep(function () {
      customerFolder = findCustomerFolder(customerName);
      const created = !customerFolder;
      if (created) {
        customerFolder = DriveApp.getFolderById(KUNDEN_ORDNER_ID).createFolder(customerName);
      }
      const contracts = getOrCreateSubfolder(customerFolder, VERTRAEGE_ORDNER);
      const files = [];
      if (data.pdfBase64) {
        bescheidFile = savePdf(contracts, data.pdfBase64, bescheidFileName(customerName));
        files.push(bescheidFile.getName());
      }
      (data.offers || []).forEach(function (offer) {
        const att = GmailApp.getMessageById(offer.messageId).getAttachments({ includeInlineImages: false })[offer.index];
        if (!att || att.getName() !== offer.name) return;
        if (!contracts.getFilesByName(att.getName()).hasNext()) {
          contracts.createFile(att.copyBlob());
        }
        files.push(att.getName());
      });
      return { folderUrl: customerFolder.getUrl(), folderCreated: created, files: files };
    });
  }

  if (steps.calendar) {
    result.calendar = runStep(function () {
      if (!data.calendarDate) throw new Error('Datum für den Kalendertermin fehlt.');
      if (!bescheidFile && data.pdfBase64) {
        const existing = customerFolder || findCustomerFolder(customerName);
        const target = existing
          ? getOrCreateSubfolder(existing, VERTRAEGE_ORDNER)
          : getOrCreateSubfolder(DriveApp.getFolderById(KUNDEN_ORDNER_ID), BESCHEID_SAMMELORDNER);
        bescheidFile = savePdf(target, data.pdfBase64, bescheidFileName(customerName));
      }
      return createCalendarEvent(customerName, data.calendarDate, bescheidFile, data.deadline, data.vorgang);
    });
  }

  if (steps.crm) {
    result.crm = runStep(function () {
      const duplicates = findCrmDuplicates(customerName, clean(data.emailWork));
      if (duplicates.length && !data.allowDuplicate) {
        throw new Error('Gibt es schon im CRM (Zeile ' + duplicates[0].row + ': ' + duplicates[0].name + '). Nicht angelegt.');
      }
      return { rowIndex: writeCrmRow(data) };
    });
    if (clean(data.lastName)) {
      result.contact = runStep(function () { return writeContactRow(data, customerName); });
    }
  }

  return result;
}

function runStep(fn) {
  try {
    const out = fn() || {};
    out.ok = true;
    return out;
  } catch (error) {
    console.error(error);
    return { ok: false, message: error.message };
  }
}

function bescheidFileName(customerName) {
  return 'Zuwendungsbescheid ' + customerName.replace(/[\\/:*?"<>|]/g, ' ').trim() + '.pdf';
}

function getOrCreateSubfolder(parent, name) {
  const found = parent.getFoldersByName(name);
  return found.hasNext() ? found.next() : parent.createFolder(name);
}

function savePdf(folder, base64, fileName) {
  const existing = folder.getFilesByName(fileName);
  if (existing.hasNext()) return existing.next();
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), MimeType.PDF, fileName);
  // Bewusst keine Freigabe „jeder mit Link“: die Datei erbt die Rechte des Ordners.
  return folder.createFile(blob);
}

/* ───────────────────────── Kalender ───────────────────────── */

function createCalendarEvent(customerName, dateStr, file, deadline, vorgang) {
  const title = customerName + ' - wegen Fördergelder abrechnen';
  const day = String(dateStr).slice(0, 10);

  const existing = Calendar.Events.list(KALENDER_ID, {
    timeMin: day + 'T00:00:00+01:00',
    timeMax: day + 'T23:59:59+01:00',
    q: customerName,
    singleEvents: true,
  });
  const same = (existing.items || []).filter(function (item) { return item.summary === title; })[0];
  if (same) {
    return { eventLink: same.htmlLink, existed: true };
  }

  const parts = day.split('-');
  // Vortag rein rechnerisch in UTC – unabhängig von der Zeitzone des Skripts.
  const reminder = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) - 1));
  const lines = ['send email when ' + Utilities.formatDate(reminder, 'UTC', 'dd.MM.yyyy')];
  if (deadline) lines.push('Vorlagefrist BAFA: ' + formatGermanDate(deadline));
  if (vorgang) lines.push('Vorgang: ' + vorgang);

  const eventResource = {
    summary: title,
    description: lines.join('\n'),
    start: { dateTime: day + 'T10:00:00', timeZone: 'Europe/Berlin' },
    end: { dateTime: day + 'T11:00:00', timeZone: 'Europe/Berlin' },
  };
  if (file) {
    eventResource.attachments = [{
      fileId: file.getId(),
      fileUrl: 'https://drive.google.com/file/d/' + file.getId() + '/view',
      title: file.getName(),
      mimeType: 'application/pdf',
    }];
  }
  const event = Calendar.Events.insert(eventResource, KALENDER_ID, { supportsAttachments: true });
  return { eventLink: event.htmlLink, existed: false };
}

function formatGermanDate(isoDate) {
  const p = String(isoDate).slice(0, 10).split('-');
  return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : String(isoDate);
}

/* ───────────────────────── CRM ───────────────────────── */

function writeCrmRow(params) {
  const customerName = clean(params.customerName);
  const projectLeader = clean(params.projectLeader);
  if (!customerName) throw new Error('Kundenname fehlt.');
  if (!projectLeader) throw new Error('Projektleiter fehlt.');

  const sheet = getTargetSheet();
  const rowIndex = lastRowOfColumn(sheet, COL_CUSTOMER_NAME) + 1;

  // Einzelne Zellen statt ganzer Zeile: Formelspalten des Blatts bleiben unberührt.
  const cells = {};
  cells[COL_CUSTOMER_NAME] = customerName;
  cells[COL_WEBSITE] = clean(params.website);
  cells[COL_PHONE] = clean(params.phone);
  cells[COL_EMAIL_WORK] = clean(params.emailWork);
  cells[COL_EMAIL_PERSONAL] = clean(params.emailPersonal);
  cells[COL_PROJECT_LEAD] = projectLeader;
  cells[COL_RUNNING_CUSTOMER] = 'Ja';
  cells[COL_ON_SITE] = 'Nein';
  cells[COL_STREET] = clean(params.street);
  cells[COL_CITY] = clean(params.city);
  cells[COL_POSTAL_CODE] = clean(params.postalCode);
  cells[COL_FUNDING_DATE] = parseFundingDate(params.fundingDate);
  Object.keys(cells).forEach(function (col) {
    if (cells[col] !== '') sheet.getRange(rowIndex, Number(col)).setValue(cells[col]);
  });

  // QM-Kennzeichen wie in den bisherigen Zeilen – nur, wenn keine Formel sie schon füllt.
  SpreadsheetApp.flush();
  fillIfEmpty(sheet, rowIndex, COL_QM, 'Ja');
  fillIfEmpty(sheet, rowIndex, COL_EMPLOYEE_QM, projectLeader);
  fillIfEmpty(sheet, rowIndex, COL_IS_CUSTOMER, true);

  return rowIndex;
}

function fillIfEmpty(sheet, row, col, value) {
  const cell = sheet.getRange(row, col);
  if (cell.getValue() === '' && !cell.getFormula()) cell.setValue(value);
}

function lastRowOfColumn(sheet, col) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return 0;
  const values = sheet.getRange(1, col, lastRow, 1).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (String(values[i][0]).trim() !== '') return i + 1;
  }
  return 0;
}

/* ───────────────────────── Kontakte ───────────────────────── */

function writeContactRow(data, customerName) {
  const sheet = SpreadsheetApp.openById(KONTAKTE_SHEET_ID).getSheets()[0];
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h).trim(); });
  function col(name) {
    const index = header.indexOf(name);
    if (index < 0) throw new Error('Spalte „' + name + '“ fehlt im Blatt Kontakte.');
    return index + 1;
  }

  const email = clean(data.emailWork);
  const lastRow = lastRowOfColumn(sheet, col('Nachname'));
  if (email && lastRow > 1) {
    const mails = sheet.getRange(2, col('E-Mailadresse'), lastRow - 1, 1).getValues();
    for (let i = 0; i < mails.length; i++) {
      if (String(mails[i][0]).toLowerCase().trim() === email.toLowerCase()) {
        return { rowIndex: i + 2, existed: true };
      }
    }
  }

  const rowIndex = lastRow + 1;
  const cells = {
    'Nachname': clean(data.lastName),
    'Organisation': customerName,
    'Anrede': clean(data.salutation),
    'Vorname': clean(data.firstName),
    'Funktion': clean(data.jobTitle),
    'Telefonnummer': clean(data.phoneWork),
    'Handynummer': clean(data.phoneMobile),
    'E-Mailadresse': email,
    'QM': true,
    'PZ': false,
    'DS': false,
    'Status': 'Aktuell',
  };
  Object.keys(cells).forEach(function (name) {
    if (cells[name] !== '') sheet.getRange(rowIndex, col(name)).setValue(cells[name]);
  });
  return { rowIndex: rowIndex, existed: false };
}

/* ───────────────────────── Helfer ───────────────────────── */

function clean(value) {
  return String(value == null ? '' : value).trim();
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

/**
 * Einmal im Editor ausführen: holt alle Berechtigungen (Tabellen, Drive, Kalender, Gmail)
 * und prüft nur lesend – es wird nichts angelegt.
 */
function testNurLesen() {
  const result = checkCustomer({ customerName: 'Vamento GmbH', emailWork: '', website: 'vamento.de', searchOffers: true });
  console.log(JSON.stringify(result, null, 2));
  console.log('Kalender erreichbar: ' + Calendar.Calendars.get(KALENDER_ID).summary);
  console.log('Kontakte erreichbar: ' + SpreadsheetApp.openById(KONTAKTE_SHEET_ID).getName());
}
