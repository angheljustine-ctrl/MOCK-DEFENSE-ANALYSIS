import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}

const storage = new MemoryStorage();
const noopClassList = { add() {}, remove() {}, toggle() {} };
const context = {
  console,
  localStorage: storage,
  window: { location: { href: '', pathname: '/index.html' } },
  location: { href: '', reload() {} },
  document: {
    body: { classList: noopClassList, appendChild() {} },
    getElementById() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    createElement() { return { click() {}, classList: noopClassList }; }
  },
  confirm() { return false; },
  alert() {},
  setTimeout,
  clearTimeout,
  setInterval() { return 0; },
  clearInterval() {},
  Date,
  Math,
  JSON,
  Map,
  Set,
  Blob,
  URL,
};
context.globalThis = context;
vm.createContext(context);

const sourcePath = 'E:/group 2 - bsit 3a/avenorline/script.js';
const source = fs.readFileSync(sourcePath, 'utf8');
const expose = `\n;globalThis.__avenor = { KEYS, Auth, saveData, getData, requireRole, seedIfEmpty, getCutoffRange, computeCutoffPayroll, compute13thMonth, isValidBackupFile };`;
vm.runInContext(source + expose, context, { filename: sourcePath });

const a = context.__avenor;
const results = {};

const login = a.Auth.login('admin', 'admin123');
assert.equal(login.ok, true);
results.seededDefaultLogin = login.ok;

a.saveData(a.KEYS.SESSION, { userId: 'fabricated', fullName: 'Fabricated', role: 'Admin' });
results.fabricatedAdminSessionAccepted = a.requireRole(['Admin']);
assert.equal(results.fabricatedAdminSessionAccepted, true);

a.saveData(a.KEYS.EMPLOYEES, [{ id: 'CUSTOM', name: 'Should survive an upgrade' }]);
a.saveData(a.KEYS.ATTENDANCE, [{ id: 'ATT-CUSTOM' }]);
a.saveData(a.KEYS.SEED_VERSION, 'older-version');
a.seedIfEmpty();
results.seedVersionMismatchRemovedCustomEmployee = !a.getData(a.KEYS.EMPLOYEES).some(e => e.id === 'CUSTOM');
results.seedVersionMismatchClearedAttendance = a.getData(a.KEYS.ATTENDANCE).length === 0;
assert.equal(results.seedVersionMismatchRemovedCustomEmployee, true);
assert.equal(results.seedVersionMismatchClearedAttendance, true);

const cutoff = a.getCutoffRange('first', new Date(2026, 8, 1));
results.firstCutoffForSeptember2026 = cutoff;

const craftedBackup = { data: {
  [a.KEYS.EMPLOYEES]: [],
  [a.KEYS.USERS]: [],
  [a.KEYS.DEPARTMENTS]: [],
  [a.KEYS.SESSION]: { role: 'Admin', userId: 'injected' },
  unrelated_key: ['also accepted']
} };
results.craftedBackupWithSessionAndUnknownKeyAccepted = a.isValidBackupFile(craftedBackup);
assert.equal(results.craftedBackupWithSessionAndUnknownKeyAccepted, true);

const emp = { id: 'EMP-X', name: 'Year Boundary', salary: 22000, department: 'Finance', position: 'Staff', schedule: '08:00' };
a.saveData(a.KEYS.PAYROLL, [{ empId: emp.id, basicPay: 11000, from: '2025-12-16', to: '2025-12-31', createdAt: '2026-01-02T01:00:00.000Z' }]);
results.thirteenthMonth2025 = a.compute13thMonth(emp, 2025);
results.thirteenthMonth2026 = a.compute13thMonth(emp, 2026);
assert.equal(results.thirteenthMonth2025.recordCount, 0);
assert.equal(results.thirteenthMonth2026.recordCount, 1);

a.saveData(a.KEYS.ATTENDANCE, []);
a.saveData(a.KEYS.LEAVE_REQUESTS, []);
a.saveData(a.KEYS.HOLIDAYS, []);
const payroll = a.computeCutoffPayroll(emp, 'second', { from: '2026-09-16', to: '2026-09-30', workingDays: 22 });
results.secondCutoffGovernmentDeduction = payroll.totalGov;
results.flatMonthlyRateTotal = emp.salary * (0.02 + 0.05 + 0.025);

console.log(JSON.stringify(results, null, 2));
console.log('RUNTIME CHECK PASSED');
