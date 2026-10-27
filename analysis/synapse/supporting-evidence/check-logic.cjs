const fs = require('fs'), vm = require('vm'), assert = require('assert'), crypto = require('crypto');
const root = 'E:/synapse/', out = __dirname + '/evidence/';
const sources = Object.fromEntries(fs.readdirSync(root).map(f => [f, fs.readFileSync(root + f, 'utf8')]));
const manifest = Object.entries(sources).map(([file, text]) => ({file, bytes: fs.statSync(root + file).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(root + file)).digest('hex')}));
fs.writeFileSync(out + 'source-manifest.json', JSON.stringify(manifest,null,2));
for (const [file, src] of Object.entries(sources)) {
  if (file.endsWith('.html')) for (const m of src.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(m[1], {filename:file});
  else if (file.endsWith('.js')) new vm.Script(src,{filename:file});
}
function extract(file,start,end){const s=sources[file]; const a=s.indexOf(start); assert(a>=0); const b=s.indexOf(end,a+start.length); assert(b>a); return s.slice(a,b);}
function env(data,values={}) {
  const alerts=[]; const elements={}; for(const [k,v] of Object.entries(values)) elements[k]={value:String(v),textContent:''};
  const c={window:{},currentUser:{id:'s',username:'staff',role:'Staff'},document:{getElementById:k=>elements[k]||(elements[k]={value:'',textContent:''})},
  getData:k=>JSON.parse(JSON.stringify(data[k]||[])),setData:(k,v)=>{data[k]=JSON.parse(JSON.stringify(v));},genId:()=>String(Math.random()),today:()=> '2026-10-02',now:()=> '2026-10-02T12:00:00Z',
  Swal:{fire:(...a)=>{alerts.push(a);return Promise.resolve({isConfirmed:false});}},audit:()=>{},closeModal:()=>{},renderReturns:()=>{},renderInventory:()=>{},renderUsers:()=>{},renderProducts:()=>{},updateCartUI:()=>{},showReceipt:()=>{},renderProductGrid:()=>{},formatCurrency:String,generateTrx:()=> 'TEST-1'};
  vm.createContext(c); return {c,data,alerts};
}
const results=[];
function check(id,name,expected,action) {const actual=action(); results.push({id,name,expected,actual,status:actual===expected?'Passed':'Failed',method:'Extracted original JavaScript in Node VM; in-memory storage/DOM mocks, not full browser E2E'});}
const returnCode=extract('Returns.html','window.saveReturn = function','window.openExchange');
function runReturn(qty,refund,repeats=1){const e=env({sales:[{id:'sale',transaction:'T',total:100}],saleItems:[{saleId:'sale',variantId:'v',productName:'Tee',qty:1,price:100}],variants:[{id:'v',stock:4}]},{returnSale:'sale',returnItem:'v',returnQty:qty,returnReason:'Damaged',returnRefund:refund}); vm.runInContext(returnCode,e.c);for(let i=0;i<repeats;i++)e.c.window.saveReturn();return e;}
check('Q01','Return sold one, return one','stock=5; returns=1',()=>{const e=runReturn(1,100);return `stock=${e.data.variants[0].stock}; returns=${e.data.returns.length}`;});
check('Q02','Return zero quantity','stock=4; returns=0',()=>{const e=runReturn(0,100);return `stock=${e.data.variants[0].stock}; returns=${(e.data.returns||[]).length}`;});
check('Q03','Return sold one, request five','stock=4; returns=0',()=>{const e=runReturn(5,500);return `stock=${e.data.variants[0].stock}; returns=${(e.data.returns||[]).length}`;});
check('Q04','Same sold item returned twice','stock=5; returns=1',()=>{const e=runReturn(1,100,2);return `stock=${e.data.variants[0].stock}; returns=${e.data.returns.length}`;});
check('Q05','Negative refund','returns=0',()=>{const e=runReturn(1,-100);return `returns=${(e.data.returns||[]).length}`;});
check('Q06','Refund exceeds sale total','returns=0',()=>{const e=runReturn(1,9999);return `returns=${(e.data.returns||[]).length}`;});
const exchangeCode=extract('Returns.html','window.saveExchange = function','        renderReturns();\n    </script>');
function runExchange(qty,toStock){const e=env({sales:[{id:'sale',transaction:'T'}],saleItems:[{saleId:'sale',variantId:'v',productName:'Tee',qty:1}],variants:[{id:'v',stock:4},{id:'w',stock:toStock,productId:'p',size:'L',color:'Blue'}],products:[{id:'p',name:'Hoodie',price:700}]},{exchangeSale:'sale',exchangeFromItem:'v',exchangeToVariant:'w',exchangeQty:qty});vm.runInContext(exchangeCode,e.c);e.c.window.saveExchange();return e;}
check('Q07','Exchange insufficient destination stock','exchanges=0',()=>{const e=runExchange(2,1);return `exchanges=${(e.data.exchanges||[]).length}`;});
check('Q08','Exchange more than originally sold','exchanges=0',()=>{const e=runExchange(5,10);return `exchanges=${(e.data.exchanges||[]).length}`;});
const checkout=extract('POS.html',"document.getElementById('posCheckout').addEventListener('click', function (e) {",'            });\n        }').replace(/^.*function \(e\) \{/, 'function checkout(e) {')+'}';
function runCheckout(stock,qty,payment='Cash',cash=1000,failKey=null){const e=env({variants:[{id:'v',stock}]},{posDiscount:0,posPaymentMethod:payment,posCashReceived:cash,posGcashRef:''});e.c.cart=[{variantId:'v',name:'Tee',qty,price:100,maxStock:10}]; if(failKey){const write=e.c.setData;e.c.setData=(k,v)=>{if(k===failKey)throw Error('simulated quota');write(k,v);};}vm.runInContext(checkout,e.c);try{e.c.checkout({preventDefault(){}});}catch(err){e.error=err.message;}return e;}
check('Q09','Checkout rechecks reduced stock','stock=1; sales=0',()=>{const e=runCheckout(1,2);return `stock=${e.data.variants[0].stock}; sales=${(e.data.sales||[]).length}`;});
check('Q10','Cash underpayment','sales=0',()=>{const e=runCheckout(5,1,'Cash',10);return `sales=${(e.data.sales||[]).length}`;});
check('Q11','GCash missing confirmation/reference','sales=0',()=>{const e=runCheckout(5,1,'GCash',0);return `sales=${(e.data.sales||[]).length}`;});
check('Q12','Checkout storage write failure rolls back sale','stock=5; sales=0',()=>{const e=runCheckout(5,1,'Cash',1000,'variants');assert.equal(e.error,'simulated quota');return `stock=${e.data.variants[0].stock}; sales=${(e.data.sales||[]).length}`;});
check('Q13','Positive cash sale deducts stock and stores details','stock=4; sales=1; items=1; movements=1',()=>{const e=runCheckout(5,1);return `stock=${e.data.variants[0].stock}; sales=${e.data.sales.length}; items=${e.data.saleItems.length}; movements=${e.data.inventoryMovements.length}`;});
check('Q14','Product price negative rejected at handler','products=0',()=>{const e=env({}, {prodName:'Tee',prodSKU:'T',prodBarcode:'1',prodCategory:'Shirt',prodCost:10,prodPrice:-100,prodSizes:'M',prodColors:'Blue',prodStock:5,prodMinStock:3});Object.assign(e.c,{pendingProductImage:null,generateUniqueVariantBarcode:()=> 'V',generateQR:()=>Promise.resolve(null)});vm.runInContext(extract('Products.html','window.saveProduct = function','        /* ============================================================\n           EDIT PRODUCT'),e.c);e.c.window.saveProduct();return `products=${(e.data.products||[]).length}`;});
check('Q15','Editing user preserves unique usernames','unique=true',()=>{const e=env({users:[{id:'1',username:'admin'},{id:'2',username:'staff'}]},{editUsername:'admin',editRole:'Staff',editSecurityQ:'Q',editSecurityA:'A'});vm.runInContext(extract('Users.html','window.updateUser = function','window.changeUserPassword'),e.c);e.c.window.updateUser('2');return `unique=${new Set(e.data.users.map(u=>u.username)).size===e.data.users.length}`;});
fs.writeFileSync(out+'logic-results.json',JSON.stringify({syntax:'All inline scripts and app.js parsed',results},null,2));
console.log(JSON.stringify({syntax:'PASS',passed:results.filter(x=>x.status==='Passed').length,failed:results.filter(x=>x.status==='Failed').length,results},null,2));
