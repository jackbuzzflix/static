import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source = await readFile(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
const application = (changes = {}) => ({submission_id: '21c6c122-661e-4710-85db-5397543696c2', application_year: '2027', name: 'Test Applicant', email: 'test@example.com', school: 'Test School', experience: 'School films', role_1: 'Camera', role_2: 'Sound', role_3: 'Editing', additional_roles: '', consent: 'agreed', consent_version: '2027-text-v1', website: '', ...changes});
function harness() {
  const rows = [], properties = {}, cache = {};
  let releases = 0, locked = true, storageFails = false;
  const sheet = {
    getLastRow: () => rows.length, setFrozenRows() {},
    getRange(start, column, count, width) {
      return {
        getValues: () => Array.from({length: count}, (_, index) => Array.from({length: width}, (_, cell) => rows[start + index - 1]?.[column + cell - 1] ?? '')),
        setValues(values) { if (storageFails) throw new Error('Storage failed'); values.forEach((row, index) => { rows[start + index - 1] = Array.from(row); }); }
      };
    }
  };
  const spreadsheet = {getId: () => 'test-sheet', getSheetByName: () => sheet, insertSheet: () => sheet};
  const context = vm.createContext({
    SpreadsheetApp: {getActiveSpreadsheet: () => spreadsheet, openById: () => spreadsheet, flush() {}},
    PropertiesService: {getScriptProperties: () => ({setProperty: (key, value) => properties[key] = value, getProperty: key => properties[key]})},
    LockService: {getScriptLock: () => ({tryLock: () => locked, releaseLock() { releases++; }})},
    CacheService: {getScriptCache: () => ({get: key => cache[key], put: (key, value) => cache[key] = value})},
    ContentService: {MimeType: {JSON: 'json'}, createTextOutput: text => ({setMimeType: () => JSON.parse(text)})}
  });
  vm.runInContext(source, context);
  return {rows, properties, setup: () => context.setupApplications(), submit: value => context.doPost({postData: {contents: JSON.stringify(value), length: JSON.stringify(value).length}}), get: () => context.doGet(), releases: () => releases, failStorage: () => storageFails = true, denyLock: () => locked = false};
}
test('setup saves the bound sheet ID, initializes headings and accepts a row', () => {
  const h = harness(); h.setup();
  assert.equal(h.properties.SPREADSHEET_ID, 'test-sheet');
  assert.equal(h.get().ready, true);
  const result = h.submit(application());
  assert.equal(result.accepted, true);
  assert.equal(h.rows[1][2], 'Test Applicant');
  assert.equal(h.rows[1][11], 'Received');
  assert.equal(result.confirmationEmailQueued, false);
  assert.equal(h.releases(), 1);
});
test('unchanged retries do not duplicate; changing answers with the same ID is rejected', () => {
  const h = harness(); h.setup();
  assert.equal(h.submit(application()).duplicate, false);
  assert.equal(h.submit(application()).duplicate, true);
  assert.equal(h.rows.length, 2);
  assert.equal(h.submit(application({school: 'Changed School'})).accepted, false);
  assert.equal(h.releases(), 3);
});
test('validation rejects invalid email, duplicate roles, missing consent, spam and oversized answers', () => {
  const h = harness(); h.setup();
  for (const changes of [{email: 'bad'}, {role_2: ' CAMERA '}, {consent: ''}, {website: 'spam'}, {experience: 'x'.repeat(10001)}]) {
    assert.equal(h.submit(application(changes)).accepted, false);
  }
  assert.equal(h.rows.length, 1);
});
test('formula-like answers are stored as text and remain safe on retry', () => {
  const h = harness(); h.setup();
  const data = application({experience: '=SUM(A1:A3)'});
  assert.equal(h.submit(data).accepted, true);
  assert.equal(h.rows[1][5], "'=SUM(A1:A3)");
  assert.equal(h.submit(data).duplicate, true);
});
test('failed storage and unavailable lock do not return success', () => {
  const storage = harness(); storage.setup(); storage.failStorage();
  assert.equal(storage.submit(application()).accepted, false);
  assert.equal(storage.releases(), 1);
  const locked = harness(); locked.setup(); locked.denyLock();
  assert.equal(locked.submit(application()).accepted, false);
  assert.equal(locked.releases(), 0);
});
test('wrong headings block submissions without overwriting existing sheet data', () => {
  const h = harness(); h.setup(); h.rows[0][0] = 'Wrong Heading';
  assert.equal(h.submit(application()).accepted, false);
  assert.equal(h.rows.length, 1);
});
