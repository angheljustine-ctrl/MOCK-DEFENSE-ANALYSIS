import { chromium } from 'file:///C:/Users/justi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';

const systemPath = 'C:/Users/justi/Downloads/System-20260928T235957Z-1-001/System/index.html';
const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
});
const context = await browser.newContext();
const page = await context.newPage();
const result = { checkedAt: new Date().toISOString(), source: systemPath, checks: [], pageErrors: [] };

page.on('pageerror', error => result.pageErrors.push(String(error)));
page.on('dialog', async dialog => {
  result.lastDialog = dialog.message();
  await dialog.accept();
});

async function freshLoad() {
  await page.goto(pathToFileURL(systemPath).href);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(500);
}

async function login(username, password) {
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.locator('#login-form button[type="submit"]').click();
  await page.waitForTimeout(300);
  return page.locator('.dashboard-container').evaluate(el => getComputedStyle(el).display !== 'none');
}

await freshLoad();
result.checks.push({ id: 'RT-01', name: 'Default administrator login', passed: await login('admin', 'admin123') });

const firstCard = page.locator('.pos-card').first();
await page.locator('#nav-pos').click();
const sku = await firstCard.getAttribute('data-sku');
const stockBefore = await page.evaluate(s => products.find(p => p.sku === s)?.stock, sku);
await firstCard.click();
await page.locator('#pos-charge-btn').click();
await page.locator('#pos-amount-paid').fill('1000');
await page.locator('#pos-process-payment-btn').click();
await page.waitForTimeout(200);
const checkoutState = await page.evaluate(s => ({
  stock: products.find(p => p.sku === s)?.stock,
  salesCount: sales.length,
  storedSalesCount: JSON.parse(localStorage.getItem('khelmoora_sales') || '[]').length
}), sku);
result.checks.push({
  id: 'RT-02',
  name: 'Checkout records sale and decrements stock',
  passed: checkoutState.stock === stockBefore - 1 && checkoutState.salesCount === 1 && checkoutState.storedSalesCount === 1,
  evidence: { sku, stockBefore, ...checkoutState }
});

await page.locator('#receipt-modal-close-btn').click();
await page.locator('#nav-sales').click();
await page.locator('.sh-delete-btn').click();
await page.locator('#confirm-modal-yes').click();
await page.waitForTimeout(100);
const afterDelete = await page.evaluate(s => ({
  stock: products.find(p => p.sku === s)?.stock,
  salesCount: sales.length
}), sku);
result.checks.push({
  id: 'RT-03',
  name: 'Deleting a sale reverses its stock movement',
  passed: afterDelete.stock === stockBefore && afterDelete.salesCount === 0,
  actual: afterDelete.stock === stockBefore ? 'Passed' : 'Failed: sale was removed but stock stayed reduced',
  evidence: { sku, stockBefore, ...afterDelete }
});

await page.locator('#nav-products').click();
await page.locator('#product-add-btn').click();
await page.locator('#pf-name').fill('Negative Boundary Product');
await page.locator('#pf-sku').fill('NEG-001');
await page.locator('#pf-price').fill('-1');
await page.locator('#pf-stock').fill('-5');
await page.locator('#pf-save-btn').click();
const negativeProduct = await page.evaluate(() => products.find(p => p.sku === 'NEG-001'));
result.checks.push({
  id: 'RT-04',
  name: 'Product form rejects negative price and stock',
  passed: !negativeProduct,
  actual: negativeProduct ? 'Failed: negative values were saved' : 'Passed: negative values were rejected',
  evidence: negativeProduct
});

await page.locator('#product-add-btn').click();
await page.locator('#pf-name').fill('<img src=x onerror="window.__storedXss=1">');
await page.locator('#pf-sku').fill('XSS-001');
await page.locator('#pf-price').fill('1');
await page.locator('#pf-stock').fill('1');
await page.locator('#pf-save-btn').click();
await page.waitForTimeout(200);
const xssExecuted = await page.evaluate(() => window.__storedXss === 1);
result.checks.push({
  id: 'RT-05',
  name: 'Product name is safely rendered as text',
  passed: !xssExecuted,
  actual: xssExecuted ? 'Failed: injected event handler executed' : 'Passed: no execution observed'
});

await freshLoad();
result.checks.push({ id: 'RT-06', name: 'Default staff login', passed: await login('staff', 'staff123') });
const staffVisibility = await page.evaluate(() => Object.fromEntries(
  [...document.querySelectorAll('.sidebar nav li[data-page]')].map(el => [el.dataset.page, getComputedStyle(el).display !== 'none'])
));
result.checks.push({
  id: 'RT-07',
  name: 'Staff navigation is limited in normal UI',
  passed: staffVisibility.dashboard && staffVisibility.pos && staffVisibility.sales && !staffVisibility.settings,
  evidence: staffVisibility
});

const directUiBypass = await page.evaluate(() => {
  document.querySelectorAll('.main-content .page').forEach(el => el.classList.remove('active'));
  const settings = document.querySelector('#page-settings');
  settings.classList.add('active');
  return getComputedStyle(settings).display !== 'none' && !!document.querySelector('#users-table-body');
});
result.checks.push({
  id: 'RT-08',
  name: 'Staff cannot expose the Settings DOM directly',
  passed: !directUiBypass,
  actual: directUiBypass ? 'Failed: hidden Settings content was exposed client-side' : 'Passed'
});

const escalation = await page.evaluate(() => {
  const saved = JSON.parse(localStorage.getItem('khelmoora_accounts'));
  saved.staff.role = 'Administrator';
  saved.staff.allowedPages = ['dashboard', 'pos', 'products', 'inventory', 'sales', 'reports', 'settings'];
  localStorage.setItem('khelmoora_accounts', JSON.stringify(saved));
  return saved.staff;
});
await page.reload();
await page.waitForTimeout(500);
const escalatedLogin = await page.locator('.dashboard-container').evaluate(el => getComputedStyle(el).display !== 'none')
  || await login('staff', 'staff123');
const allVisibleAfterTamper = await page.evaluate(() =>
  [...document.querySelectorAll('.sidebar nav li[data-page]')].every(el => getComputedStyle(el).display !== 'none')
);
result.checks.push({
  id: 'RT-09',
  name: 'Client storage tampering cannot elevate Staff to Administrator',
  passed: !(escalatedLogin && allVisibleAfterTamper),
  actual: escalatedLogin && allVisibleAfterTamper ? 'Failed: role escalation succeeded after localStorage edit' : 'Passed',
  evidence: escalation
});

result.summary = {
  passed: result.checks.filter(check => check.passed).length,
  failed: result.checks.filter(check => !check.passed).length,
  pageErrorCount: result.pageErrors.length
};

console.log(JSON.stringify(result, null, 2));
await browser.close();
