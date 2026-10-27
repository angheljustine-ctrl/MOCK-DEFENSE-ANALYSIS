document.addEventListener("DOMContentLoaded",()=>{
  const D=window.DD;if(!D)return;
  const page=document.body.dataset.page;
  const cfg={
    employees:{live:D.STORAGE.employees,trash:D.STORAGE.deletedEmployees,label:"Employee",manage:()=>D.canWrite()},
    attendance:{live:D.STORAGE.attendance,trash:D.STORAGE.deletedAttendance,label:"Attendance",manage:()=>D.canWrite()||D.role()==="shift supervisor"},
    leave:{live:D.STORAGE.leave,trash:D.STORAGE.deletedLeave,label:"Leave",manage:()=>D.canWrite()},
    payroll:{live:D.STORAGE.payroll,trash:D.STORAGE.deletedPayroll,label:"Payroll",manage:()=>D.canWrite()},
    admins:{live:D.STORAGE.admins,trash:D.STORAGE.deletedAdmins,label:"Account",manage:()=>D.canWrite()}
  }[page];
  if(!cfg||!cfg.manage())return;
  let selectMode=false, selected=new Set(), busy=false;
  const esc=x=>D.escapeHTML(String(x??""));
  const isProtected=r=>page==="admins"&&(String(r?.id||"")==="ADM-001"||String(r?.username||"").toLowerCase()==="admin");
  const title=r=> page==="employees"?`${r.firstName||""} ${r.lastName||""}`.trim():page==="attendance"?`${r.date||""} · ${r.employee||""}`:page==="leave"?`${r.type||"Leave"} · ${r.employee||""}`:page==="payroll"?`${r.id||"Payroll"} · ${r.period||""}`:`${r.name||r.username||r.id||"Account"}`;
  function softDelete(ids){
    let live=D.get(cfg.live,[]), trash=D.get(cfg.trash,[]); const now=new Date().toISOString();
    const doomed=live.filter(r=>ids.includes(String(r.id))&&!isProtected(r));
    if(page==="admins"&&ids.some(id=>live.some(r=>String(r.id)===String(id)&&isProtected(r))))D.toast("The primary Admin / Taga Pamahala account cannot be deleted.","error","Protected Account");
    if(!doomed.length)return;
    doomed.forEach(r=>trash.unshift({...r,deletedAt:now}));
    live=live.filter(r=>!ids.includes(String(r.id))); D.set(cfg.trash,trash); D.set(cfg.live,live);
    selected.clear(); selectMode=false; D.addActivity(`${doomed.length} ${cfg.label.toLowerCase()} record(s) moved to Recently Deleted`,"trash"); D.toast(`${doomed.length} record(s) moved to Recently Deleted.`); setTimeout(enhance,20);
  }
  function confirmDelete(ids){const live=D.get(cfg.live,[]);ids=ids.filter(id=>!live.some(r=>String(r.id)===String(id)&&isProtected(r)));if(!ids.length){D.toast("The primary Admin / Taga Pamahala account cannot be deleted.","error","Protected Account");return;}D.drawer(`<button class="modal-close" data-drawer-close type="button">×</button><span class="eyebrow">BACKUP DELETE</span><h2 class="modal-title">Move ${ids.length>1?ids.length+" records":"record"} to Recently Deleted?</h2><p class="modal-subtitle">The selected ${cfg.label.toLowerCase()} record${ids.length>1?"s":""} can still be restored later.</p><div class="form-actions"><button class="secondary-button" data-drawer-close type="button">Cancel</button><button class="danger-button" id="tmConfirmDelete" type="button">Delete</button></div>`);document.getElementById("tmConfirmDelete").onclick=()=>{D.closeDrawer();softDelete(ids)}}
  function openTrash(){
    let trashSelectMode=false, trashSelected=new Set();
    function renderTrash(){
      const trash=D.get(cfg.trash,[]);
      const valid=new Set(trash.map(r=>String(r.id))); trashSelected=new Set([...trashSelected].filter(id=>valid.has(id)));
      D.drawer(`<button class="modal-close" data-drawer-close type="button">×</button><span class="eyebrow">BACKUP DELETE</span><h2 class="modal-title">Recently Deleted — ${cfg.label}</h2><p class="modal-subtitle">Restore records or permanently delete them.</p>${trash.length?`<div class="form-actions" style="margin-top:14px;justify-content:flex-start"><button class="secondary-button" id="tmTrashSelect" type="button">${trashSelectMode?"Cancel Select":"Select"}</button>${trashSelectMode&&trashSelected.size?`<button class="secondary-button" id="tmRestoreSelected" type="button">Restore Selected (${trashSelected.size})</button><button class="danger-button" id="tmDeleteSelected" type="button">Delete Selected Permanently (${trashSelected.size})</button>`:""}</div>`:""}<div class="table-scroll" style="margin-top:16px"><table class="data-table"><thead><tr>${trashSelectMode?'<th style="width:38px"><input type="checkbox" id="tmTrashSelectAll" aria-label="Select all recently deleted records"></th>':""}<th>${cfg.label}</th><th>Deleted</th><th>Action</th></tr></thead><tbody>${trash.length?trash.map(r=>`<tr>${trashSelectMode?`<td>${isProtected(r)?"":`<input type="checkbox" class="tm-trash-row-select" data-id="${esc(r.id)}" ${trashSelected.has(String(r.id))?"checked":""}>`}</td>`:""}<td><strong>${esc(title(r))}</strong><br><span style="font-size:10px;color:var(--muted)">${esc(r.id)}</span></td><td>${esc(r.deletedAt?new Date(r.deletedAt).toLocaleString():"—")}</td><td><div class="action-row"><button class="action-btn tm-restore" data-id="${esc(r.id)}" title="Restore">${D.icon("refresh")}</button>${isProtected(r)?"":`<button class="action-btn delete tm-permanent" data-id="${esc(r.id)}" title="Delete permanently">${D.icon("trash")}</button>`}</div></td></tr>`).join(""):`<tr><td colspan="${trashSelectMode?4:3}"><div class="empty-state"><strong>No recently deleted records</strong><span>Deleted records will appear here.</span></div></td></tr>`}</tbody></table></div>`);
      const restoreIds=ids=>{let t=D.get(cfg.trash,[]),live=D.get(cfg.live,[]),setIds=new Set(ids.map(String)),restored=0;t.forEach(r=>{if(!setIds.has(String(r.id)))return;const {deletedAt,...clean}=r;if(!live.some(x=>String(x.id)===String(clean.id))){live.unshift(clean);restored++}});D.set(cfg.live,live);D.set(cfg.trash,t.filter(x=>!setIds.has(String(x.id))));trashSelected.clear();D.toast(`${restored||ids.length} record(s) restored.`);renderTrash();setTimeout(enhance,20)};
      document.getElementById("tmTrashSelect")?.addEventListener("click",()=>{trashSelectMode=!trashSelectMode;if(!trashSelectMode)trashSelected.clear();renderTrash()});
      document.querySelectorAll(".tm-trash-row-select").forEach(c=>c.addEventListener("change",()=>{const id=String(c.dataset.id);c.checked?trashSelected.add(id):trashSelected.delete(id);renderTrash()}));
      const all=document.getElementById("tmTrashSelectAll");if(all){const ids=trash.filter(r=>!isProtected(r)).map(r=>String(r.id));all.checked=ids.length>0&&ids.every(id=>trashSelected.has(id));all.indeterminate=ids.some(id=>trashSelected.has(id))&&!all.checked;all.addEventListener("change",()=>{all.checked?ids.forEach(id=>trashSelected.add(id)):ids.forEach(id=>trashSelected.delete(id));renderTrash()})}
      document.getElementById("tmRestoreSelected")?.addEventListener("click",()=>{const ids=[...trashSelected];if(ids.length&&confirm(`Restore ${ids.length} selected record(s)?`))restoreIds(ids)});
      document.getElementById("tmDeleteSelected")?.addEventListener("click",()=>{const ids=[...trashSelected].filter(id=>!D.get(cfg.trash,[]).some(r=>String(r.id)===String(id)&&isProtected(r)));if(ids.length&&confirm(`Permanently delete ${ids.length} selected record(s)? This cannot be undone.`)){const setIds=new Set(ids);D.set(cfg.trash,D.get(cfg.trash,[]).filter(x=>!setIds.has(String(x.id))));trashSelected.clear();renderTrash()}});
      document.querySelectorAll(".tm-restore").forEach(b=>b.onclick=()=>restoreIds([b.dataset.id]));
      document.querySelectorAll(".tm-permanent").forEach(b=>b.onclick=()=>{const rec=D.get(cfg.trash,[]).find(r=>String(r.id)===String(b.dataset.id));if(isProtected(rec)){D.toast("The primary Admin / Taga Pamahala account cannot be permanently deleted.","error","Protected Account");return;}if(!confirm("Permanently delete this record? This cannot be undone."))return;D.set(cfg.trash,D.get(cfg.trash,[]).filter(x=>String(x.id)!==b.dataset.id));trashSelected.delete(String(b.dataset.id));renderTrash()});
    }
    renderTrash();
  }
  function enhance(){if(busy)return;busy=true;try{
    const actions=document.getElementById("pageActions"); if(actions){
      if(!actions.querySelector("#tmRecentlyDeleted")){const b=document.createElement("button");b.className="secondary-button";b.id="tmRecentlyDeleted";b.innerHTML=`${D.icon("trash")} Recently Deleted`;b.onclick=openTrash;actions.prepend(b)}
      if(!actions.querySelector("#tmSelect")){const b=document.createElement("button");b.className="secondary-button";b.id="tmSelect";b.textContent="Select";b.onclick=()=>{selectMode=!selectMode;if(!selectMode)selected.clear();enhance()};actions.prepend(b)}
      let bulk=actions.querySelector("#tmBulkDelete"); if(selectMode&&selected.size){if(!bulk){bulk=document.createElement("button");bulk.className="danger-button";bulk.id="tmBulkDelete";actions.insertBefore(bulk,actions.firstChild)}bulk.textContent=`Delete Selected (${selected.size})`;bulk.onclick=()=>confirmDelete([...selected])}else bulk?.remove();
      const sb=actions.querySelector("#tmSelect");if(sb)sb.textContent=selectMode?"Cancel Select":"Select";
    }
    const table=document.querySelector("#pageContent .data-table"); if(!table)return;
    let head=table.querySelector("thead tr"); if(head){let th=head.querySelector(".tm-select-head");if(selectMode&&!th){th=document.createElement("th");th.className="tm-select-head";th.style.width="38px";th.innerHTML='<input type="checkbox" id="tmSelectAll" aria-label="Select all">';head.prepend(th)}else if(!selectMode)th?.remove()}
    table.querySelectorAll("tbody tr").forEach(tr=>{const del=tr.querySelector("button.delete[data-id]");let td=tr.querySelector(".tm-select-cell");if(selectMode&&del){if(!td){td=document.createElement("td");td.className="tm-select-cell";tr.prepend(td)}const id=String(del.dataset.id);const rowRecord=D.get(cfg.live,[]).find(r=>String(r.id)===id);if(isProtected(rowRecord)){td?.remove();return;}let cb=td.querySelector(".tm-row-select");if(!cb){cb=document.createElement("input");cb.type="checkbox";cb.className="tm-row-select";td.appendChild(cb)}cb.dataset.id=id;cb.checked=selected.has(id)}else td?.remove()});
    table.querySelectorAll(".tm-row-select").forEach(c=>c.onchange=()=>{const id=String(c.dataset.id);c.checked?selected.add(id):selected.delete(id);enhance()});
    const all=table.querySelector("#tmSelectAll");if(all){const boxes=[...table.querySelectorAll(".tm-row-select")];all.checked=boxes.length>0&&boxes.every(x=>selected.has(x.dataset.id));all.indeterminate=boxes.some(x=>selected.has(x.dataset.id))&&!all.checked;all.onchange=()=>{boxes.forEach(x=>all.checked?selected.add(x.dataset.id):selected.delete(x.dataset.id));enhance()}}
  }finally{busy=false}}
  document.addEventListener("click",e=>{const b=e.target.closest("#pageContent button.delete[data-id]");if(!b||b.classList.contains("tm-permanent"))return;e.preventDefault();e.stopImmediatePropagation();confirmDelete([b.dataset.id])},true);
  new MutationObserver(()=>setTimeout(enhance,0)).observe(document.getElementById("app")||document.body,{childList:true,subtree:true});
  setTimeout(enhance,0);
});
