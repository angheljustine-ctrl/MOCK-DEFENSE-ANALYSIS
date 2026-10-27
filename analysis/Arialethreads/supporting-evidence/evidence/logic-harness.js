const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('F:\\Arialethreads.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
if (!script) throw new Error('Inline application script not found');

function makeElement() {
  const element = {
    value: '',
    selectedIndex: 0,
    style: {},
    rows: [],
    classList: { add() {}, remove() {} },
    appendChild(child) { this.children ||= []; this.children.push(child); },
    insertRow() { const row = makeElement(); this.rows.push(row); return row; },
  };
  Object.defineProperty(element, 'innerHTML', {
    get() { return this._innerHTML || ''; },
    set(value) { this._innerHTML = String(value); if (value === '') this.rows = []; },
  });
  return element;
}

function createApp(initialStorage = {}) {
  const elements = new Map();
  const storage = new Map(Object.entries(initialStorage));
  const alerts = [];
  const context = {
    console,
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); },
    },
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, makeElement());
        return elements.get(id);
      },
      querySelectorAll() { return []; },
      createElement() { return makeElement(); },
      addEventListener() {},
    },
    alert(message) { alerts.push(String(message)); },
    confirm() { return true; },
    setTimeout() { return 1; },
    clearTimeout() {},
    window: { scrollTo() {} },
  };
  vm.createContext(context);
  vm.runInContext(script, context, { filename: 'Arialethreads.html' });
  return { context, elements, storage, alerts };
}

function setFields(app, values) {
  for (const [id, value] of Object.entries(values)) {
    app.context.document.getElementById(id).value = value;
  }
}

const results = [];
function check(id, name, run) {
  try {
    const detail = run();
    results.push({ id, name, passed: true, detail });
  } catch (error) {
    results.push({ id, name, passed: false, detail: error.message });
  }
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

check('RT-01', 'Seeded admin login works', () => {
  const app = createApp();
  setFields(app, { username: 'admin', password: 'Admin123' });
  app.context.login();
  assert(app.context.currentUser?.role === 'Admin', 'Admin login did not succeed');
  return 'Logged in as seeded Admin account.';
});

check('RT-02', 'Invalid login is rejected', () => {
  const app = createApp();
  setFields(app, { username: 'admin', password: 'wrong' });
  app.context.login();
  assert(app.context.currentUser === null, 'Invalid login unexpectedly succeeded');
  return app.context.document.getElementById('error').innerHTML;
});

check('RT-03', 'Staff role cannot access inventory', () => {
  const app = createApp();
  app.context.currentUser = app.context.users.find((user) => user.role === 'Staff');
  assert(app.context.canAccess('dashboard') && !app.context.canAccess('inventory'), 'Role matrix mismatch');
  return 'Dashboard allowed; inventory denied.';
});

check('RT-04', 'Blank numeric product fields become zero', () => {
  const app = createApp();
  app.context.currentUser = app.context.users[0];
  app.context.products = [];
  setFields(app, { sku: 'BLANK-1', productName: 'Blank Numeric Test', color: '', price: '', stock: '', minimum: '' });
  app.context.saveProduct();
  const saved = app.context.products[0];
  assert(saved && saved.price === 0 && saved.stock === 0 && saved.minimum === 0, 'Blank numeric fields were not accepted as zeros');
  return JSON.stringify(saved);
});

check('RT-05', 'Duplicate SKU is accepted', () => {
  const app = createApp();
  app.context.currentUser = app.context.users[0];
  app.context.products = [];
  const add = (name) => {
    setFields(app, { sku: 'DUP-1', productName: name, color: 'Black', price: '100', stock: '2', minimum: '1' });
    app.context.saveProduct();
  };
  add('First');
  add('Second');
  assert(app.context.products.filter((p) => p.sku === 'DUP-1').length === 2, 'Duplicate SKU was not created');
  return 'Two products saved with SKU DUP-1.';
});

check('RT-06', 'Normal sale deducts stock and creates a sale', () => {
  const app = createApp();
  app.context.currentUser = app.context.users.find((user) => user.role === 'Cashier');
  app.context.products = [{ sku: 'P1', name: 'Item', category: 'Basic T-Shirt', size: 'M', color: 'Black', price: 50, stock: 5, minimum: 1 }];
  app.context.sales = [];
  app.context.cart = [{ index: 0, quantity: 2 }];
  app.context.completeSale();
  assert(app.context.products[0].stock === 3 && app.context.sales.length === 1, 'Sale did not update stock and history');
  return `Stock=${app.context.products[0].stock}; total=${app.context.sales[0].total}.`;
});

check('RT-07', 'Deleting a cart product can sell a different item', () => {
  const app = createApp();
  app.context.currentUser = app.context.users.find((user) => user.role === 'Manager');
  app.context.products = [
    { sku: 'A', name: 'Intended A', category: 'Basic T-Shirt', size: 'M', color: 'Black', price: 10, stock: 5, minimum: 1 },
    { sku: 'B', name: 'Unintended B', category: 'Basic T-Shirt', size: 'M', color: 'White', price: 100, stock: 7, minimum: 1 },
  ];
  app.context.sales = [];
  app.context.cart = [{ index: 0, quantity: 1 }];
  app.context.deleteProduct(0);
  app.context.completeSale();
  assert(app.context.sales[0]?.total === 100 && app.context.products[0].sku === 'B' && app.context.products[0].stock === 6, 'Index drift was not reproduced');
  return 'Cart intended SKU A; completed sale charged SKU B at 100 and reduced B stock.';
});

check('RT-08', 'Completed sale omits product lines and Top Products stays zero', () => {
  const app = createApp();
  app.context.currentUser = app.context.users.find((user) => user.role === 'Cashier');
  app.context.products = [{ sku: 'P1', name: 'Sold Item', category: 'Basic T-Shirt', size: 'M', color: 'Black', price: 50, stock: 5, minimum: 1 }];
  app.context.sales = [];
  app.context.cart = [{ index: 0, quantity: 2 }];
  app.context.completeSale();
  app.context.updateDashboard();
  const row = app.context.document.getElementById('topProducts').rows[0]?.innerHTML || '';
  assert(!('productLines' in app.context.sales[0]) && row.includes('<td>0</td>'), 'Missing-line-item mismatch was not reproduced');
  return `Sale keys: ${Object.keys(app.context.sales[0]).join(', ')}; dashboard row: ${row}`;
});

check('RT-09', 'Empty inventory is automatically reseeded', () => {
  const app = createApp();
  app.context.products = [];
  app.context.seedProducts();
  assert(app.context.products.length === 5, 'Demo inventory did not reappear');
  return 'Five demo products reappeared after seedProducts ran on an empty inventory.';
});

check('RT-10', 'Modified local storage can introduce an Admin account', () => {
  const tamperedUsers = JSON.stringify([{ name: 'Injected Admin', username: 'intruder', password: 'p', role: 'Admin' }]);
  const app = createApp({ arialeThreadsUsers: tamperedUsers });
  setFields(app, { username: 'intruder', password: 'p' });
  app.context.login();
  assert(app.context.currentUser?.role === 'Admin', 'Tampered Admin account did not authenticate');
  return 'A user record supplied through localStorage authenticated as Admin.';
});

check('RT-11', 'Product edit reports the wrong success action', () => {
  const app = createApp();
  app.context.currentUser = app.context.users[0];
  app.context.products = [{ sku: 'P1', name: 'Before', category: 'Basic T-Shirt', size: 'M', color: 'Black', price: 50, stock: 5, minimum: 1 }];
  app.context.editIndex = 0;
  setFields(app, { sku: 'P1', productName: 'After', color: 'Black', price: '50', stock: '5', minimum: '1' });
  app.context.saveProduct();
  const message = app.context.document.getElementById('toast').innerHTML;
  assert(message === 'Product added.', `Unexpected toast: ${message}`);
  return message;
});

check('RT-12', 'One-character password is accepted', () => {
  const app = createApp();
  app.context.currentUser = app.context.users[0];
  setFields(app, { userFullName: 'Weak User', userUsername: 'weak', userPassword: 'x', userRole: 'Cashier' });
  app.context.saveUser();
  assert(app.context.users.some((user) => user.username === 'weak' && user.password === 'x'), 'Weak password was not accepted');
  return 'Created Cashier account with password "x".';
});

check('RT-13', 'User-controlled HTML is inserted into a table row', () => {
  const app = createApp();
  app.context.products = [{ sku: 'X', name: '<img src=x onerror=alert(1)>', category: 'Basic T-Shirt', size: 'M', color: 'Black', price: 1, stock: 1, minimum: 0 }];
  app.context.displayProducts();
  const row = app.context.document.getElementById('productTable').rows[0]?.innerHTML || '';
  assert(row.includes('<img src=x onerror=alert(1)>'), 'Raw HTML was not inserted');
  return row;
});

console.log(JSON.stringify({ source: 'F:\\Arialethreads.html', checks: results }, null, 2));
if (results.some((result) => !result.passed)) process.exitCode = 1;
