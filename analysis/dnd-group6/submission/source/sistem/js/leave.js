document.addEventListener("DOMContentLoaded",()=>{
    const {STORAGE,get,set,escapeHTML,icon,drawer,closeDrawer,toast,addActivity,addNotification,guardWrite,canWrite,session,uid}=DD;
    let employees=[],data=[],query="",status="All";

    const sync=()=>{employees=get(STORAGE.employees,[]);data=get(STORAGE.leave,[]);};
    const employeeName=id=>{const e=employees.find(x=>x.id===id);return e?`${e.firstName} ${e.lastName}`:"Unknown Employee";};
    const dateLabel=s=>s?new Date(`${s}T00:00:00`).toLocaleDateString("en-PH",{month:"short",day:"2-digit",year:"numeric"}):"—";

    function render(){
        sync();
        const mine=!canWrite()?session()?.employeeId:null;
        const filtered=data.filter(l=>(!mine||l.employee===mine)&&(`${employeeName(l.employee)} ${l.type} ${l.reason||""}`).toLowerCase().includes(query.toLowerCase())&&(status==="All"||l.status===status));
        document.getElementById("pageActions").innerHTML=`<button class="primary-button" id="requestLeave">${icon("plus")} Request Leave</button>`;
        const counts={Pending:filtered.filter(x=>x.status==="Pending").length,Approved:filtered.filter(x=>x.status==="Approved").length,Rejected:filtered.filter(x=>x.status==="Rejected").length};
        document.getElementById("pageContent").innerHTML=`
        <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:15px">
          ${[["Pending Requests",counts.Pending],["Approved Leave",counts.Approved],["Rejected Requests",counts.Rejected]].map(([a,b])=>`<article class="stat-card"><div class="stat-top"><span class="stat-label">${a}</span><span class="stat-icon">${icon("calendar")}</span></div><div class="stat-value">${b}</div><div class="stat-note">Based on visible requests</div></article>`).join("")}
        </div>
        <section class="panel table-panel"><div class="table-toolbar"><div class="toolbar-left"><div class="search-box">${icon("search")}<input id="leaveSearch" placeholder="Search leave requests..." value="${escapeHTML(query)}"></div><select id="leaveStatus" class="filter-select"><option>All</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></div></div>
        <div class="table-scroll"><table class="data-table"><thead><tr><th>Employee</th><th>Leave Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody>
        ${filtered.length?filtered.map(l=>`<tr><td><div class="person-cell"><div class="table-avatar">${DD.initials(employeeName(l.employee))}</div><div><strong>${escapeHTML(employeeName(l.employee))}</strong><span>${escapeHTML(l.employee)}</span></div></div></td><td>${escapeHTML(l.type)}</td><td>${dateLabel(l.from)}</td><td>${dateLabel(l.to)}</td><td>${escapeHTML(l.reason||"—")}</td><td><span class="status ${l.status.toLowerCase()}">${escapeHTML(l.status)}</span></td><td><div class="action-row">${canWrite()&&l.status==="Pending"?`<button class="action-btn approve" data-id="${l.id}" title="Approve">${icon("check")}</button><button class="action-btn reject" data-id="${l.id}" title="Reject">${icon("close")}</button>`:""}${(canWrite()||l.status==="Pending")?`<button class="action-btn delete" data-id="${l.id}" title="Delete">${icon("trash")}</button>`:""}</div></td></tr>`).join(""):`<tr><td colspan="7"><div class="empty-state"><strong>No leave requests found</strong><span>Request employee leave to get started.</span></div></td></tr>`}
        </tbody></table></div></section>`;
        document.getElementById("requestLeave").addEventListener("click",openForm);
        document.getElementById("leaveSearch").addEventListener("input",e=>{const caret=e.target.selectionStart;query=e.target.value;render();const next=document.getElementById("leaveSearch");next.focus();if(caret!==null)next.setSelectionRange(caret,caret)});
        const sf=document.getElementById("leaveStatus");sf.value=status;sf.addEventListener("change",e=>{status=e.target.value;render()});
        document.querySelectorAll(".approve").forEach(b=>b.addEventListener("click",()=>setStatus(b.dataset.id,"Approved")));
        document.querySelectorAll(".reject").forEach(b=>b.addEventListener("click",()=>setStatus(b.dataset.id,"Rejected")));
        document.querySelectorAll(".delete").forEach(b=>b.addEventListener("click",()=>remove(b.dataset.id)));
    }

    function openForm(){
        sync();
        const mine=!canWrite()?session()?.employeeId:null;
        const available=employees.filter(e=>e.status==="Active"&&(!mine||e.id===mine));
        if(!available.length){toast("No active employee is available for a leave request.");return;}
        const selected=mine||available[0].id;
        drawer(`<button class="modal-close" data-drawer-close type="button">×</button><span class="eyebrow">LEAVE REQUEST</span><h2 class="modal-title">Request Leave</h2><p class="modal-subtitle">Submit a leave request for approval. Approved leave is reflected in attendance.</p><form id="leaveForm"><div class="form-grid">
        <div class="field"><label>Employee</label><div class="input-wrap"><select name="employee" ${mine?"disabled":""}>${available.map(e=>`<option value="${e.id}" ${e.id===selected?"selected":""}>${escapeHTML(e.firstName+" "+e.lastName)}</option>`).join("")}</select>${mine?`<input type="hidden" name="employee" value="${escapeHTML(selected)}">`:""}</div></div>
        ${selectField("Leave Type","type",["Vacation Leave","Sick Leave","Emergency Leave","Maternity Leave","Paternity Leave","Bereavement Leave","Unpaid Leave"],"Vacation Leave")}
        ${input("From","from",DD.today(),"date")}${input("To","to",DD.today(),"date")}${input("Reason","reason","","text")}
        </div><div id="leaveMessage" class="message"></div><div class="form-actions"><button class="secondary-button" data-drawer-close type="button">Cancel</button><button class="primary-button" type="submit">Submit Request</button></div></form>`);
        document.getElementById("leaveForm").addEventListener("submit",e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target).entries()),msg=document.getElementById("leaveMessage");if(!f.employee||!f.from||!f.to){msg.textContent="Employee and leave dates are required.";msg.className="message error";return}if(f.to<f.from){msg.textContent="Leave end date cannot be before start date.";msg.className="message error";return}if(data.some(x=>x.employee===f.employee&&x.status!=="Rejected"&&f.from<=x.to&&f.to>=x.from)){msg.textContent="This employee already has an overlapping leave request.";msg.className="message error";return}const rec={id:uid("LEV"),employee:f.employee,type:f.type,from:f.from,to:f.to,reason:(f.reason||"").trim(),status:"Pending",requestedAt:new Date().toISOString()};data.unshift(rec);set(STORAGE.leave,data);addActivity(`Leave requested for ${employeeName(f.employee)}`,"calendar");addNotification("Leave request submitted",`${employeeName(f.employee)} · ${f.type} · ${dateLabel(f.from)} to ${dateLabel(f.to)}`);closeDrawer();toast("Leave request submitted.");render()});
    }

    function datesBetween(start,end){const out=[],d=new Date(`${start}T00:00:00`),last=new Date(`${end}T00:00:00`);while(d<=last){out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);d.setDate(d.getDate()+1)}return out;}
    function setStatus(id,newStatus){if(!guardWrite(`${newStatus.toLowerCase()} leave`))return;const rec=data.find(x=>x.id===id);if(!rec)return;data=data.map(x=>x.id===id?{...x,status:newStatus,reviewedAt:new Date().toISOString()}:x);set(STORAGE.leave,data);if(newStatus==="Approved"){let att=get(STORAGE.attendance,[]);for(const date of datesBetween(rec.from,rec.to)){if(!att.some(a=>a.employee===rec.employee&&a.date===date)){att.unshift({id:uid("ATT"),date,employee:rec.employee,timeIn:"",timeOut:"",status:"On Leave",late:0,overtime:0,leaveId:rec.id})}}set(STORAGE.attendance,att)}addActivity(`Leave ${newStatus.toLowerCase()}: ${employeeName(rec.employee)}`,"calendar");addNotification(`Leave ${newStatus}`,`${employeeName(rec.employee)} · ${rec.type}`);toast(`Leave request ${newStatus.toLowerCase()}.`);render();}
    function remove(id){const rec=data.find(x=>x.id===id);if(!rec)return;if(!canWrite()&&rec.employee!==session()?.employeeId)return;if(rec.status==="Approved"&&!canWrite()){toast("Approved leave cannot be deleted by an employee.");return}drawer(`<button class="modal-close" data-drawer-close type="button">×</button><span class="eyebrow">CONFIRM ACTION</span><h2 class="modal-title">Delete leave request?</h2><p class="modal-subtitle">This permanently removes the selected leave request.</p><div class="form-actions"><button class="secondary-button" data-drawer-close type="button">Cancel</button><button class="danger-button" id="confirmLeaveDelete" type="button">Delete Request</button></div>`);document.getElementById("confirmLeaveDelete").addEventListener("click",()=>{data=data.filter(x=>x.id!==id);set(STORAGE.leave,data);if(rec.status==="Approved"){let att=get(STORAGE.attendance,[]).filter(a=>a.leaveId!==id);set(STORAGE.attendance,att)}closeDrawer();toast("Leave request deleted.");render()});}
    function input(l,n,v,t="text"){return `<div class="field"><label>${l}</label><div class="input-wrap"><input name="${n}" type="${t}" value="${escapeHTML(v??"")}" ${n!=="reason"?"required":""}></div></div>`}
    function selectField(l,n,opts,v){return `<div class="field"><label>${l}</label><div class="input-wrap"><select name="${n}">${opts.map(o=>`<option value="${escapeHTML(o)}" ${o===v?"selected":""}>${escapeHTML(o)}</option>`).join("")}</select></div></div>`}
    window.addEventListener("dd:sync",e=>{if([STORAGE.leave,STORAGE.employees,STORAGE.attendance].includes(e.detail?.key))render()});render();
});
