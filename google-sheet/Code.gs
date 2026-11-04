/**
 * Google Apps Script for the portfolio contact sheet.
 *
 * Setup:
 *  1. Open the sheet → Extensions → Apps Script, paste this file.
 *  2. Project Settings → Script properties → add WEBHOOK_TOKEN (any long random string).
 *  3. Deploy → New deployment → Web app; Execute as: Me; Who has access: Anyone.
 *  4. Use the web app URL and the same token as the Amplify secrets
 *     SHEET_WEBHOOK_URL and SHEET_WEBHOOK_TOKEN.
 */
const HEADERS = ["Submitted At", "Name", "Email", "Mobile Number", "Contact ID"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents);
    const token = PropertiesService.getScriptProperties().getProperty("WEBHOOK_TOKEN");
    if (!token || body.token !== token) return json({ ok: false, error: "unauthorized" });

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

    // Skip duplicates if Lambda retries the same contact.
    const ids = sheet.getLastRow() > 1
      ? sheet.getRange(2, 5, sheet.getLastRow() - 1, 1).getValues().flat()
      : [];
    if (ids.includes(body.id)) return json({ ok: true, duplicate: true });

    sheet.appendRow([
      body.createdAt ? new Date(body.createdAt) : new Date(),
      safe(body.name),
      safe(body.email),
      safe(body.mobileNumber), // "+91…" would otherwise be read as a formula
      safe(body.id),
    ]);
    return json({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// Store user input as plain text so it can never run as a sheet formula.
function safe(value) {
  const s = String(value ?? "");
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
