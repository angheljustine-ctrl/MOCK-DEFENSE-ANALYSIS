const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = 'E:/DEFENSE nightbaby/1. pos_ims/ISO_nightbaby_pos_ims';
const src = f => fs.readFileSync(path.join(root, 'js', f), 'utf8');
const lines = (f,a,b) => src(f).split(/\r?\n/).slice(a-1,b).join('\n');
const results = [];
function context() {
  const data = new Map([['nb_users','[]']]);
  const store = {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k),clear:()=>data.clear()};
  const c = {console:{error(){}},localStorage:store,sessionStorage:{...store},document:{addEventListener(){}},window:{crypto:null,location:{pathname:'/pos.html',href:''}},TextEncoder,btoa:s=>Buffer.from(s,'binary').toString('base64'),setTimeout(){},clearTimeout(){},Date,Math,JSON};
  vm.createContext(c); vm.runInContext(src('global.js'),c);
  c.notifications=[]; c.showNotification=(msg,type)=>c.notifications.push({msg,type});
  return c;
}
function run(c,code){return vm.runInContext(code,c);}
function sale(c,{stock=5,qty=1,price=100,payment=100,discount=0,expiration=''}={}){
  c.localStorage.setItem('nb_products',JSON.stringify([{id:'P1',name:'Synthetic',category:'perfume',stock,price,expiration}]));
  Object.assign(c,{cart:[{id:'P1',name:'Synthetic',category:'perfume',stock:5,price,quantity:qty}],discount:0,currentTxType:'Purchase',receiptId:'SYNTHETIC-TX',modalPaymentMethod:{value:'Cash'},modalPaymentAmount:{value:String(payment)},modalAccountHolderName:{value:''},modalReferenceNumber:{value:''},getFinalTotal:()=>price*qty-discount,getCartTotal:()=>price*qty,getCartDiscount:()=>discount,getCartItemCount:()=>qty,updateStats(){},renderProducts(){},resetTxType(){},updateReceiptId(){},updateCartUI(){},closeModal(){},showReceiptModal(){}});
  run(c,lines('pos.js',442,544));
}
function refund(c){
  c.localStorage.setItem('nb_products',JSON.stringify([{id:'P1',name:'Synthetic',stock:0,price:100}]));
  const tx={id:'REF',items:[{id:'P1',name:'Synthetic',price:100,quantity:1}],subtotal:80,discount:20,tax:0,total:80,status:'Completed'};
  c.localStorage.setItem('nb_transactions',JSON.stringify([tx]));
  Object.assign(c,{refundCurrentTx:tx,refundCurrentItemIndex:0,refundQty:{value:'1'},refundReason:{value:'Defective Item'},updateStats(){},renderProducts(){},closeRefundModal(){}});
  run(c,lines('pos.js',672,742)); run(c,'confirmRefund()');
}
async function check(id,name,expected,action){
  try {const actual=await action(); results.push({id,name,expected,...actual});}
  catch(e){throw new Error(id+': diagnostic harness error: '+e.stack);}
}
(async()=>{
  await check('T01','Cash sale happy path','1 sale, stock 4',()=>{const c=context();sale(c);run(c,'confirmSale()');const stock=c.getProducts()[0].stock, n=c.getTransactions().length;assert.equal(stock,4);assert.equal(n,1);return {status:'Passed',actual:`sales=${n}, stock=${stock}`,kind:'Isolated function runtime'};});
  await check('T02','Short payment rejected','No sale, stock unchanged',()=>{const c=context();sale(c,{payment:99});run(c,'confirmSale()');assert.equal(c.getTransactions().length,0);assert.equal(c.getProducts()[0].stock,5);return {status:'Passed',actual:'sales=0, stock=5; short-payment notification',kind:'Isolated function runtime'};});
  await check('T03','Stale cart stock','Reject qty 5 against live stock 1',()=>{const c=context();sale(c,{stock:1,qty:5,payment:500});run(c,'confirmSale()');assert.equal(c.getTransactions().length,1);assert.equal(c.getProducts()[0].stock,0);return {status:'Failed',actual:'5-unit sale accepted against 1 live unit; stock clamped to 0',kind:'Isolated function runtime'};});
  await check('T04','Product write fails after sale','Rollback sale or reject without success',()=>{const c=context();sale(c);const original=c.localStorage.setItem;c.localStorage.setItem=(k,v)=>{if(k==='nb_products'){const e=new Error('simulated quota');e.name='QuotaExceededError';throw e;}return original(k,v)};run(c,'confirmSale()');assert.equal(c.getTransactions().length,1);assert.equal(c.getProducts()[0].stock,5);assert(c.notifications.some(x=>x.msg.startsWith('Sale completed!')));return {status:'Failed',actual:'sale persisted, stock still 5, success notification emitted',kind:'Isolated function runtime / injected storage failure'};});
  await check('T05','Discounted full refund','Refund 80 actually paid',()=>{const c=context();refund(c);const tx=c.getTransactions()[0];assert.equal(tx.refundedAmount,100);assert.equal(tx.total,0);return {status:'Failed',actual:'paid=80, refund=100, remaining total=0',kind:'Isolated function runtime'};});
  await check('T06','Refund then Inventory stock-in','Return stock once, final stock 1',()=>{const c=context();refund(c);run(c,lines('inventory.js',890,921));assert.equal(c.getPendingRefundedItems().length,1);c.currentAdjustId='P1';c.currentAdjustPendingKey=c.refundItemKey(c.getPendingRefundedItems()[0]);c.getProductByIdSafe=c.getProductById;c.document.getElementById=id=>({value:id==='adjustStockType'?'+':'1'});run(c,'(function(){'+lines('inventory.js',1089,1134)+'})()');assert.equal(c.getProducts()[0].stock,2);return {status:'Failed',actual:'POS restored to 1; pending Inventory +1 raised stock to 2',kind:'Isolated cross-module runtime'};});
  await check('T07','Forged role and session','Reject unissued session / privileged role',()=>{const c=context();c.localStorage.setItem('nb_session',JSON.stringify({username:'synthetic',role:'super_admin',expiresAt:Date.now()+60000}));run(c,src('access_control.js'));c.enforceAccessControl=c.window.enforceAccessControl;c.window.location.pathname='/system_management.html';assert.equal(c.isSessionValid(),true);assert.equal(c.enforceAccessControl(),true);return {status:'Failed',actual:'unissued session without token or user record accepted for system_management.html',kind:'Isolated function runtime'};});
  await check('T08','Disabled active session','Reject disabled account session',()=>{const c=context();c.localStorage.setItem('nb_users',JSON.stringify([{username:'synthetic',role:'cashier',enabled:false}]));c.localStorage.setItem('nb_session',JSON.stringify({username:'synthetic',role:'cashier',expiresAt:Date.now()+60000}));assert.equal(c.isSessionValid(),true);return {status:'Failed',actual:'disabled stored account still has valid active session',kind:'Isolated function runtime'};});
  await check('T09','Crypto unavailable','Fail closed; never reversible password storage',async()=>{const c=context();const h=await c.hashPassword('SyntheticOnly!','synthetic-salt');assert(h.startsWith('FAKE__'));assert.equal(Buffer.from(h.split('__').at(-1),'base64').toString(),'SyntheticOnly!');return {status:'Failed',actual:'FAKE__ fallback contains Base64-recoverable synthetic password',kind:'Isolated function runtime'};});
  await check('T10','Backup operational keys','Include remittances and refund-processing markers',()=>{const c=context();assert(!c.NB_DATA_KEYS.includes('nb_remittances'));assert(!c.NB_DATA_KEYS.includes('nb_refund_stock_done'));return {status:'Failed',actual:'NB_DATA_KEYS omits nb_remittances and nb_refund_stock_done',kind:'Executed source/config check; no restore performed'};});
  await check('T11','Per-product discount','Honor configured product discount or remove field',()=>{const c=context();c.cart=[{name:'Synthetic',category:'perfume',price:100,quantity:1,discount:20}];run(c,lines('pos.js',333,360));assert.equal(c.getCartDiscount(),0);return {status:'Failed',actual:'product discount=20 but POS calculated discount=0 without nb_discounts rule',kind:'Isolated function runtime'};});
  await check('T12','Staff password policy','Reject one-character password',async()=>{const c=context();Object.assign(c,{users:[],formError:{},usernameInput:{value:'synthetic'},accountHolderNameInput:{value:'Synthetic Staff'},roleInput:{value:'cashier'},passwordInput:{value:'a'},editingUsername:{value:''},securityQuestionInput:null,securityAnswerInput:null,isStaffManagement:true,isSuperUser:()=>false,renderUsers(){},closeModal(){}});c.localStorage.setItem('nb_session',JSON.stringify({username:'synthetic-admin',role:'admin',expiresAt:Date.now()+60000}));run(c,lines('account_management.js',243,330));await c.saveUser({preventDefault(){}});assert.equal(c.getUsers().length,1);return {status:'Failed',actual:'Staff Management saved account with password length 1',kind:'Isolated function runtime'};});
  await check('T13','Expired perfume checkout','Block expired sale if sellability policy requires it',()=>{const c=context();sale(c,{expiration:'2000-01-01'});run(c,'confirmSale()');assert.equal(c.getTransactions().length,1);return {status:'Failed',actual:'expired perfume accepted; policy expectation is recommended, not explicit paper prohibition',kind:'Isolated function runtime'};});
  results.push({id:'T14',name:'Stored HTML in product name',expected:'Product name rendered as literal text',status:'Not Run',actual:'Code-evidenced unescaped POS HTML sink; browser execution not tested',kind:'Static review only'});
  results.push({id:'T15',name:'Scanner, thermal print and two-display operation',expected:'Physical barcode, print and focus flow work together',status:'Blocked',actual:'Physical peripherals and business acceptance data unavailable',kind:'No hardware runtime'});
  fs.writeFileSync(path.join(__dirname,'evidence','check-results.json'),JSON.stringify({scope:'Synthetic in-memory VM only; original source unchanged',results},null,2));
  console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});

