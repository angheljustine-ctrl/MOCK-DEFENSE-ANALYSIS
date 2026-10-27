const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto'),path=require('path');
const root='E:/Atellion/atellion sims6',out=__dirname;
const files=['index.html','css/style.css',...fs.readdirSync(root+'/js').map(x=>'js/'+x),...fs.readdirSync(root+'/assets').map(x=>'assets/'+x)];
const manifest=()=>files.map(f=>({file:f,bytes:fs.statSync(root+'/'+f).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(root+'/'+f)).digest('hex')}));
if(process.argv.includes('--verify')) {assert.deepStrictEqual(manifest(),JSON.parse(fs.readFileSync(out+'/inventory.json')));console.log('SOURCE UNCHANGED');process.exit(0);}
fs.writeFileSync(out+'/inventory.json',JSON.stringify(manifest(),null,2));
const results=[];
function environment(){
 const nodes=new Map(),lists=new Map();
 const node=s=>{if(!nodes.has(s))nodes.set(s,{value:'',innerHTML:'',textContent:'',hidden:false,dataset:{},listeners:{},classList:{toggle(){}},addEventListener(e,fn){this.listeners[e]=fn},reset(){},querySelector(s){return node(s)},querySelectorAll(s){return lists.get(s)||[]}});return nodes.get(s)};
 const store=()=>({data:new Map(),getItem(k){return this.data.get(k)||null},setItem(k,v){this.data.set(k,v)},removeItem(k){this.data.delete(k)}});
 const c=vm.createContext({console,localStorage:store(),sessionStorage:store(),document:{addEventListener(){},querySelector:node,querySelectorAll:s=>lists.get(s)||[]},setTimeout(){},clearTimeout(){},confirm:()=>true,location:{reload(){}},Date,Blob,URL});
 for(const f of ['storage','auth','admin','teacher','student','app'])vm.runInContext(fs.readFileSync(root+'/js/'+f+'.js','utf8'),c,{filename:f+'.js'});
 const run=s=>vm.runInContext(s,c); const fire=(s,e='click')=>node(s).listeners[e]({preventDefault(){}});
 run(`dbSave(DB_KEYS.USERS,[{username:'demo',password:'pw',role:'Student',refId:'s'}]);dbSave(DB_KEYS.STUDENTS,[{id:'s',fullName:'Demo',section:'A'}]);dbSave(DB_KEYS.TEACHERS,[{id:'t',fullName:'Teacher',subject:'Math',assignedSection:'A'}]);dbSave(DB_KEYS.SECTIONS,[{id:'sec',name:'A',assignedTeacher:'Teacher'}]);setCurrentUser({role:'Teacher',refId:'t'});`);
 return {run,node,lists,fire,c};
}
function check(id,name,expected,fn){const e=environment();try{const actual=fn(e);results.push({id,name,expected,actual,status:actual===expected?'Passed':'Failed'});}catch(err){results.push({id,name,expected,actual:String(err),status:'Failed'});}}
check('Q01','Valid login','Student',e=>e.run(`attemptLogin('demo','pw').role`));
check('Q02','Invalid password rejected',true,e=>e.run(`attemptLogin('demo','wrong')===null`));
check('Q03','Forged session rejected',true,e=>e.run(`setCurrentUser({role:'Admin',username:'forged'});getCurrentUser()===null`));
check('Q04','Non-admin storage write denied',true,e=>e.run(`setCurrentUser({role:'Student',refId:'s'});dbUpdate(DB_KEYS.TEACHERS,'t',{subject:'Changed'});dbFind(DB_KEYS.TEACHERS,'t').subject==='Math'`));
check('Q05','Draft grades withheld',true,e=>{e.run(`setCurrentUser({role:'Student',refId:'s'});dbSave(DB_KEYS.GRADES,[{id:'g',studentId:'s',subject:'PRIVATE_DRAFT',status:'Draft',q1:80,q2:80,q3:80,q4:80,overall:80}]);StudentPages.grades(document.querySelector('#container'));`);return !e.node('#container').innerHTML.includes('PRIVATE_DRAFT')});
check('Q06','Teacher export limited to section',true,e=>{let count;e.c.downloadCSV=(f,h,rows)=>count=rows.length;e.run(`dbSave(DB_KEYS.STUDENTS,[{id:'s',fullName:'Own',section:'A'},{id:'other',fullName:'Other',section:'B'}]);dbSave(DB_KEYS.GRADES,[{studentId:'s',subject:'Math',status:'Submitted'},{studentId:'other',subject:'Math',status:'Submitted'}]);TeacherPages.grades(document.querySelector('#container'));`);e.fire('#export-grades-btn');return count===1});
check('Q07','Grade range rejected',0,e=>{e.run(`TeacherPages.grades(document.querySelector('#container'));`);const b=e.node('save');b.dataset.save='s';e.lists.set('[data-save]',[b]);e.run(`TeacherPages.grades(document.querySelector('#container'));`);for(const q of ['q1','q2','q3','q4'])e.node(`[data-q="${q}"][data-student="s"]`).value='101';e.fire('save');return e.run('dbLoad(DB_KEYS.GRADES).length')});
check('Q08','Grade mean calculation',85,e=>{const b=e.node('save');b.dataset.save='s';e.lists.set('[data-save]',[b]);e.run(`TeacherPages.grades(document.querySelector('#container'));`);['q1','q2','q3','q4'].forEach((q,i)=>e.node(`[data-q="${q}"][data-student="s"]`).value=String([70,80,90,100][i]));e.fire('save');return e.run('dbLoad(DB_KEYS.GRADES)[0].overall')});
check('Q09','Section assignment synchronized',true,e=>{const b=e.node('assign');b.dataset.assign='sec';e.lists.set('[data-assign]',[b]);e.run(`AdminPages.sections(document.querySelector('#container'));`);e.fire('assign');e.node('#asec-teacher').value='Different';e.fire('#assign-teacher-form','submit');return e.run(`dbFind(DB_KEYS.TEACHERS,'t').assignedSection!=='A'`)});
check('Q10','Reject modal rechecks cancelled order',10,e=>{e.run(`dbSave(DB_KEYS.PRODUCTS,[{id:'p',stock:9}]);dbSave(DB_KEYS.ORDERS,[{id:'o',studentId:'s',productId:'p',productName:'Item',qty:1,status:'Pending'}]);`);const b=e.node('reject');b.dataset.reject='o';e.lists.set('[data-reject]',[b]);e.run(`AdminPages.orders(document.querySelector('#container'));`);e.fire('reject');e.run(`dbUpdate(DB_KEYS.PRODUCTS,'p',{stock:10});dbUpdate(DB_KEYS.ORDERS,'o',{status:'Cancelled'});`);e.node('#rj-choice').value='Reason';e.fire('#reject-form','submit');return e.run(`dbFind(DB_KEYS.PRODUCTS,'p').stock`)});
check('Q11','Order write failure rolls stock back',5,e=>{e.run(`setCurrentUser({role:'Student',refId:'s'});dbSave(DB_KEYS.PRODUCTS,[{id:'p',name:'Item',price:20,stock:5}]);`);const b=e.node('buy');b.dataset.buy='p';e.lists.set('[data-buy]',[b]);e.run(`StudentPages.shop(document.querySelector('#container'));`);e.fire('buy');e.node('#buy-qty').value='1';const original=e.c.localStorage.setItem.bind(e.c.localStorage);e.c.localStorage.setItem=(k,v)=>{if(k==='sims_orders')throw Error('synthetic quota failure');original(k,v)};try{e.fire('#buy-form','submit')}catch{}return e.run(`dbFind(DB_KEYS.PRODUCTS,'p').stock`)});
check('Q12','Malformed storage handled safely',true,e=>{e.c.localStorage.setItem('sims_students','bad json');try{e.run(`dbLoad(DB_KEYS.STUDENTS)`);return true}catch{return false}});
check('Q13','Audit retains 16 actions',16,e=>e.run(`for(let i=0;i<16;i++)logActivity('event '+i);dbLoad(DB_KEYS.ACTIVITY).length`));
results.push({id:'Q14',name:'Real browser and school-policy acceptance',expected:'Owner-approved rules and real UI verification',actual:'No paper, policy or real-browser execution supplied',status:'Not Run'});
fs.writeFileSync(out+'/qa-results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
