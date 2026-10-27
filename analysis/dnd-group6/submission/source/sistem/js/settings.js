document.addEventListener("DOMContentLoaded",()=>{
    const {STORAGE,get,set,toast,addActivity,session,escapeHTML}=DD;
    let currentSession=session(); const accounts=()=>get(STORAGE.admins,DD.seed.admins); const currentAccount=()=>accounts().find(a=>a.id===currentSession?.accountId)||accounts().find(a=>a.id===currentSession?.adminId);
    document.getElementById("pageContent").innerHTML=`<div class="settings-layout"><aside class="settings-nav"><button class="settings-tab active" data-tab="appearance">Appearance</button><button class="settings-tab" data-tab="profile">Profile</button><button class="settings-tab" data-tab="password">Change Password</button><button class="settings-tab" data-tab="backup">Backup Data</button></aside><section class="panel" id="settingsPanel"></section></div>`;
    const panel=document.getElementById("settingsPanel"); document.querySelectorAll(".settings-tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".settings-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");render(b.dataset.tab)}));
    function render(tab){const a=currentAccount()||DD.seed.profile;
        if(tab==="appearance") panel.innerHTML=`<span class="eyebrow">PERSONALIZATION</span><h2 class="modal-title">Appearance</h2><p class="modal-subtitle">Choose the visual mode without changing the existing design.</p><div class="setting-row"><div><h3>Dark Mode</h3><p>Switch between the warm presentation and the dark presentation.</p></div><label class="switch"><input id="themeSwitch" type="checkbox" ${localStorage.getItem(STORAGE.theme)==="dark"?"checked":""}><span class="slider"></span></label></div><div class="setting-row"><div><h3>Current Mode</h3><p>${localStorage.getItem(STORAGE.theme)==="dark"?"Dark":"Warm"} theme is saved.</p></div></div>`;
        if(tab==="profile") panel.innerHTML=`<span class="eyebrow">ACCOUNT PROFILE</span><h2 class="modal-title">Profile Settings</h2><p class="modal-subtitle">Update the signed-in account. Changes are saved to the actual account record.</p><form id="profileForm"><div class="form-grid">${field("Full Name","name",a.name)}${field("Username","username",a.username)}${field("Email","email",a.email,"email")}<div class="field"><label>Role</label><div class="input-wrap"><input value="${escapeHTML(a.role||"")}" disabled></div></div></div><div id="profileMessage" class="message"></div><div class="form-actions"><button class="primary-button" type="submit">Save Profile</button></div></form>`;
        if(tab==="password") panel.innerHTML=`<span class="eyebrow">ACCOUNT SECURITY</span><h2 class="modal-title">Change Password</h2><p class="modal-subtitle">Use your current password to change it.</p><form id="passwordForm"><div class="form-grid">${field("Current Password","current","","password")}${field("New Password","new","","password")}${field("Confirm New Password","confirm","","password")}</div><div id="passMessage" class="message"></div><div class="form-actions"><button class="secondary-button" id="settingsForgotPassword" type="button">Forgot Password</button><button class="primary-button" type="submit">Update Password</button></div></form><div id="settingsRecoveryFlow"></div>`;
        if(tab==="backup") panel.innerHTML=`<span class="eyebrow">DATA PROTECTION</span><h2 class="modal-title">Backup and Restore Data</h2><p class="modal-subtitle">Export your system data as a JSON backup file or restore data from a previous backup.</p><div class="setting-row"><div><h3>Backup Data</h3><p>Save employees, attendance, payroll, leave, accounts, settings and other system records to a local JSON file.</p></div></div><div id="backupMessage" class="message"></div><div class="form-actions"><button class="secondary-button" id="restoreBackupBtn" type="button">Import / Restore Backup</button><button class="primary-button" id="exportBackupBtn" type="button">Export Backup</button><input id="backupFileInput" type="file" accept=".json,application/json" hidden></div>`;
        if(tab==="appearance") document.getElementById("themeSwitch").addEventListener("change",e=>{localStorage.setItem(STORAGE.theme,e.target.checked?"dark":"warm");DD.applyTheme();toast(`${e.target.checked?"Dark":"Warm"} mode enabled.`);setTimeout(()=>location.reload(),180)});
        if(tab==="profile") document.getElementById("profileForm").addEventListener("submit",e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target).entries()),m=document.getElementById("profileMessage");if(!o.name||!o.username||!o.email){m.textContent="Name, username and email are required.";m.className="message error";return}if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email)){m.textContent="Please enter a valid email address.";m.className="message error";return}const list=accounts(),duplicate=list.some(x=>x.id!==a.id&&(x.username.toLowerCase()===o.username.toLowerCase()||x.email.toLowerCase()===o.email.toLowerCase()));if(duplicate){m.textContent="Username or email is already used by another account.";m.className="message error";return}set(STORAGE.admins,list.map(x=>x.id===a.id?{...x,name:o.name,username:o.username,email:o.email}:x));toast("Profile successfully updated.");setTimeout(()=>location.reload(),250)});
        if(tab==="password") document.getElementById("passwordForm").addEventListener("submit",e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target).entries()),m=document.getElementById("passMessage");m.textContent="";m.className="message";if(!a.password||hashCredential(o.current)!==a.password){m.textContent="Current password is incorrect.";m.className="message error";return}if(o.new.length<8){m.textContent="New password must contain at least 8 characters.";m.className="message error";return}if(o.new!==o.confirm){m.textContent="New passwords do not match.";m.className="message error";return}set(STORAGE.admins,accounts().map(x=>x.id===a.id?{...x,password:hashCredential(o.new)}:x));addActivity(`Password changed for ${a.name}`,"lock");m.textContent="Password successfully changed.";m.className="message success";e.target.reset()});
        if(tab==="password") document.getElementById("settingsForgotPassword")?.addEventListener("click",()=>{
            const flow=document.getElementById("settingsRecoveryFlow"), RECOVERY_KEYWORD_HASH="6da6607ee5f7e6c3620d51d15c8678539d08c3f4976e8c4300a5e119d74d906f";
            flow.innerHTML=`<div class="setting-row"><div><h3>Forgot Password</h3><p>Verify the recovery keyword to create a new password.</p></div></div><form id="settingsKeywordForm"><div class="form-grid">${field("Verification Keyword","keyword","","password")}</div><div id="keywordMessage" class="message"></div><div class="form-actions"><button class="primary-button" type="submit">Verify Keyword</button></div></form>`;
            document.getElementById("settingsKeywordForm").addEventListener("submit",e=>{
                e.preventDefault();const o=Object.fromEntries(new FormData(e.target).entries()),m=document.getElementById("keywordMessage");
                if(hashCredential(String(o.keyword||"").trim().toUpperCase())!==RECOVERY_KEYWORD_HASH){m.textContent="Invalid recovery keyword.";m.className="message error";return}
                flow.innerHTML=`<div class="setting-row"><div><h3>Create New Password</h3><p>Recovery keyword verified. Create and confirm your new password.</p></div></div><form id="settingsResetPasswordForm"><div class="form-grid">${field("New Password","newPassword","","password")}${field("Confirm New Password","confirmPassword","","password")}</div><div id="resetPassMessage" class="message"></div><div class="form-actions"><button class="primary-button" type="submit">Save New Password</button></div></form>`;
                document.getElementById("settingsResetPasswordForm").addEventListener("submit",ev=>{
                    ev.preventDefault();const r=Object.fromEntries(new FormData(ev.target).entries()),rm=document.getElementById("resetPassMessage");
                    if(r.newPassword.length<8){rm.textContent="New password must contain at least 8 characters.";rm.className="message error";return}
                    if(r.newPassword!==r.confirmPassword){rm.textContent="New passwords do not match.";rm.className="message error";return}
                    set(STORAGE.admins,accounts().map(x=>x.id===a.id?{...x,password:hashCredential(r.newPassword)}:x));addActivity(`Password recovered for ${a.name}`,"lock");rm.textContent="New password successfully saved.";rm.className="message success";ev.target.reset();
                });
            });
        });
        if(tab==="backup"){
            const backupKeys=[STORAGE.admins,STORAGE.employees,STORAGE.attendance,STORAGE.leave,STORAGE.payroll,STORAGE.activities,STORAGE.notifications,STORAGE.profile,STORAGE.theme,STORAGE.deletedEmployees,STORAGE.deletedAttendance,STORAGE.deletedLeave,STORAGE.deletedPayroll,STORAGE.deletedAdmins,"dd_admin_recovery_keys","dd_recovery_requests","dd_company_logo"];
            const message=document.getElementById("backupMessage");
            document.getElementById("exportBackupBtn")?.addEventListener("click",()=>{
                const data={format:"DoughnutHRBackup",version:1,exportedAt:new Date().toISOString(),data:{}};
                backupKeys.forEach(k=>{if(k&&localStorage.getItem(k)!==null){try{data.data[k]=JSON.parse(localStorage.getItem(k))}catch{data.data[k]=localStorage.getItem(k)}}});
                const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
                const url=URL.createObjectURL(blob),link=document.createElement("a"),d=new Date(),pad=n=>String(n).padStart(2,"0");
                link.href=url;link.download=`doughnut_backup_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.json`;
                document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
                addActivity("System data backup exported","download");toast("Backup JSON file exported.","success","Backup Data");
                if(message){message.textContent="Backup successfully exported. Keep the JSON file in a safe folder.";message.className="message success"}
            });
            const input=document.getElementById("backupFileInput");
            document.getElementById("restoreBackupBtn")?.addEventListener("click",()=>input?.click());
            input?.addEventListener("change",async()=>{
                const file=input.files?.[0]; if(!file)return;
                try{
                    const parsed=JSON.parse(await file.text());
                    if(parsed?.format!=="DoughnutHRBackup"||parsed?.version!==1||!parsed.data||typeof parsed.data!=="object")throw new Error("Invalid backup format");
                    if(!confirm("Restore this backup? Current system data included in the backup will be replaced. Your current login session will remain active.")){input.value="";return}
                    backupKeys.forEach(k=>{if(k&&Object.prototype.hasOwnProperty.call(parsed.data,k)){const v=parsed.data[k];localStorage.setItem(k,typeof v==="string"?v:JSON.stringify(v))}});
                    addActivity("System data restored from backup","upload");
                    if(message){message.textContent="Backup restored successfully. Reloading the system...";message.className="message success"}
                    toast("Backup restored successfully.","success","Backup Data");setTimeout(()=>location.reload(),700);
                }catch(err){if(message){message.textContent="Unable to restore: this is not a valid Doughnut HR backup JSON file.";message.className="message error"}toast("Invalid backup file.","error","Backup Data")}
                input.value="";
            });
        }

    }
    function field(l,n,v="",t="text"){return `<div class="field"><label>${l}</label><div class="input-wrap"><input name="${n}" type="${t}" value="${escapeHTML(v)}" required></div></div>`} render("appearance");
});
