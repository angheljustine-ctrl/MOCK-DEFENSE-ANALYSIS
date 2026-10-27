document.addEventListener("DOMContentLoaded", () => {
    const {STORAGE, seed, icon, set, get, addActivity, addNotification, session, createSecureSession, clearSession} = DD;
    const form = document.getElementById("loginForm");
    if (!form) return;

    if (session()) {
        window.location.href = "dashboard.html";
        return;
    }
    // Remove stale, incomplete or manually-created session values before login.
    clearSession();

    document.querySelectorAll("[data-icon]").forEach(el => {
        const n = el.dataset.icon;
        if (n) el.innerHTML = icon(n);
    });

    const user = document.getElementById("loginUsername");
    const pass = document.getElementById("loginPassword");
    const toggle = document.getElementById("passwordToggle");
    const button = document.getElementById("loginButton");
    const msg = document.getElementById("loginMessage");
    const remember = document.getElementById("rememberLogin");
    const uErr = document.getElementById("loginUsernameError");
    const pErr = document.getElementById("loginPasswordError");

    toggle?.addEventListener("click", () => {
        const show = pass.type === "password";
        pass.type = show ? "text" : "password";
        toggle.setAttribute("aria-pressed", String(show));
        toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });

    form.addEventListener("submit", e => {
        e.preventDefault();
        uErr.textContent = "";
        pErr.textContent = "";
        msg.textContent = "";
        msg.className = "message";

        const identity = user.value.trim().toLowerCase();
        const password = pass.value;
        let valid = true;
        if (!identity) { uErr.textContent = "Please enter your username or email."; valid = false; }
        if (!password) { pErr.textContent = "Please enter your password."; valid = false; }
        else if (password.length < 6) { pErr.textContent = "Password must contain at least 6 characters."; valid = false; }
        if (!valid) {
            msg.textContent = "Please complete the required fields.";
            msg.className = "message error";
            return;
        }

        button.disabled = true;
        button.classList.add("is-loading");
        setTimeout(() => {
            const accounts = get(STORAGE.admins, seed.admins);
            const found = accounts.find(a =>
                (String(a.username || "").toLowerCase() === identity || String(a.email || "").toLowerCase() === identity) &&
                String(a.password || "") === hashCredential(password) &&
                a.status !== "Inactive"
            );

            if (!found) {
                button.disabled = false;
                button.classList.remove("is-loading");
                msg.textContent = "Invalid username/email or password. Please check your account credentials and status.";
                msg.className = "message error";
                pass.value = "";
                pass.focus();
                return;
            }

            // Create a validated, expiring session. Protected pages reject altered or incomplete sessions.
            createSecureSession(found, !!remember?.checked);

            set(STORAGE.admins, accounts.map(a => a.id === found.id
                ? {...a, lastLogin: new Date().toISOString()}
                : a
            ));
            addActivity(`Signed in: ${found.name}`, "user");

            msg.textContent = "Login successful. Opening management system...";
            msg.className = "message success";
            setTimeout(() => window.location.href = "dashboard.html", 450);
        }, 350);
    });

    const forgotBtn = document.getElementById("forgotPasswordBtn");
    const forgotModal = document.getElementById("forgotModal");
    forgotBtn?.addEventListener("click", openForgotPassword);

    function openForgotPassword() {
        const REQUEST_KEY = "dd_password_reset_requests";
        const loadRequests = () => get(REQUEST_KEY, []);
        const saveRequests = rows => set(REQUEST_KEY, rows);
        const codeFor = () => String(Math.floor(100000 + Math.random() * 900000));
        let deliveryTimer = null;
        const stopDeliveryWatch = () => { if (deliveryTimer) { clearInterval(deliveryTimer); deliveryTimer = null; } };
        const close = () => {
            stopDeliveryWatch();
            forgotModal.classList.remove("open");
            forgotModal.setAttribute("aria-hidden", "true");
        };
        const shell = body => {
            forgotModal.innerHTML = `<div class="modal-backdrop" data-close></div><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="forgotTitle"><button class="modal-close" id="closeForgot" type="button" aria-label="Close">×</button>${body}</section>`;
            forgotModal.classList.add("open");
            forgotModal.setAttribute("aria-hidden", "false");
            forgotModal.querySelector("[data-close]")?.addEventListener("click", close);
            document.getElementById("closeForgot")?.addEventListener("click", close);
        };
        const requestScreen = () => {
            stopDeliveryWatch();
            shell(`<span class="eyebrow">ACCOUNT RECOVERY</span><h2 class="modal-title" id="forgotTitle">Forgot Password?</h2><p class="modal-subtitle">Request a one-time recovery code from the Branch Manager / Assistant Manager.</p><form id="recoveryRequestForm"><div class="field"><label>Username or Email</label><div class="input-wrap"><input id="recoveryIdentity" autocomplete="username" placeholder="Enter username or email" required></div></div><div id="recoveryMessage" class="message"></div><div class="form-actions"><button class="secondary-button" id="haveRecoveryCode" type="button">Check Sent Code</button><button class="primary-button" type="submit">Request Code</button></div></form>`);
            document.getElementById("haveRecoveryCode")?.addEventListener("click", () => verifyScreen());
            document.getElementById("recoveryRequestForm")?.addEventListener("submit", e => {
                e.preventDefault();
                const identity=document.getElementById("recoveryIdentity").value.trim().toLowerCase();
                const m=document.getElementById("recoveryMessage");
                const accounts=get(STORAGE.admins,seed.admins);
                const account=accounts.find(a=>(String(a.username||"").toLowerCase()===identity||String(a.email||"").toLowerCase()===identity)&&a.status!=="Inactive");
                if(!account){m.textContent="Unable to verify an active account with that username or email.";m.className="message error";return;}
                const adminRoles=["branch manager","assistant manager","admin","super admin","administrator"];
                if(adminRoles.includes(String(account.role||"").toLowerCase())){adminRecoveryScreen(account);return;}
                const now=Date.now(), code=codeFor();
                let rows=loadRequests().filter(r=>r.accountId!==account.id || r.used);
                const request={id:`REQ-${now}`,accountId:account.id,name:account.name,username:account.username,code,createdAt:now,expiresAt:now+(30*60*1000),status:"Pending",used:false};
                rows.push(request);
                saveRequests(rows);
                addNotification("Password recovery requested",`${account.name} requested a password recovery code.`);
                waitingScreen(request.id, account.username);
            });
        };
        const adminRecoveryScreen = account => {
            stopDeliveryWatch();
            const RECOVERY_KEYWORD_HASH = "6da6607ee5f7e6c3620d51d15c8678539d08c3f4976e8c4300a5e119d74d906f";
            shell(`<span class="eyebrow">ADMIN RECOVERY</span><h2 class="modal-title" id="forgotTitle">Administrator Recovery</h2><p class="modal-subtitle">Enter the verification keyword to continue.</p><form id="adminRecoveryForm"><div class="field"><label>Admin Username</label><div class="input-wrap"><input value="${String(account.username||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}" disabled></div></div><div class="field"><label>Verification Keyword</label><div class="input-wrap"><input id="adminRecoveryKeyword" autocomplete="off" placeholder="Enter verification keyword" required></div></div><div id="adminRecoveryMessage" class="message"></div><div class="form-actions"><button class="secondary-button" id="backAdminRecovery" type="button">Back</button><button class="primary-button" type="submit">Verify Keyword</button></div></form>`);
            document.getElementById("backAdminRecovery")?.addEventListener("click",requestScreen);
            document.getElementById("adminRecoveryForm")?.addEventListener("submit",e=>{
                e.preventDefault();
                const entered=document.getElementById("adminRecoveryKeyword").value.trim().toUpperCase();
                const m=document.getElementById("adminRecoveryMessage");
                if(hashCredential(entered)!==RECOVERY_KEYWORD_HASH){m.textContent="Invalid verification keyword.";m.className="message error";return;}
                const accounts=get(STORAGE.admins,seed.admins),current=accounts.find(a=>a.id===account.id);
                if(!current){m.textContent="Administrator account is no longer available.";m.className="message error";return;}
                adminCreatePasswordScreen(current);
            });
        };
        const adminCreatePasswordScreen = account => {
            stopDeliveryWatch();
            shell(`<span class="eyebrow">ADMIN RECOVERY</span><h2 class="modal-title" id="forgotTitle">Create New Password</h2><p class="modal-subtitle">Verification keyword accepted. Create a new password for your administrator account.</p><form id="adminNewPasswordForm"><div class="field"><label>New Password</label><div class="input-wrap"><input id="adminNewPassword" type="password" autocomplete="new-password" required></div></div><div class="field"><label>Confirm New Password</label><div class="input-wrap"><input id="adminConfirmPassword" type="password" autocomplete="new-password" required></div></div><div id="adminNewPasswordMessage" class="message"></div><div class="form-actions"><button class="secondary-button" id="backAdminKeyword" type="button">Back</button><button class="primary-button" type="submit">Save New Password</button></div></form>`);
            document.getElementById("backAdminKeyword")?.addEventListener("click",()=>adminRecoveryScreen(account));
            document.getElementById("adminNewPasswordForm")?.addEventListener("submit",e=>{
                e.preventDefault();
                const np=document.getElementById("adminNewPassword").value;
                const cp=document.getElementById("adminConfirmPassword").value;
                const m=document.getElementById("adminNewPasswordMessage");
                if(np.length<8){m.textContent="Password must contain at least 8 characters.";m.className="message error";return;}
                if(np!==cp){m.textContent="Passwords do not match.";m.className="message error";return;}
                const accounts=get(STORAGE.admins,seed.admins),current=accounts.find(a=>a.id===account.id);
                if(!current){m.textContent="Administrator account is no longer available.";m.className="message error";return;}
                set(STORAGE.admins,accounts.map(a=>a.id===account.id?{...a,password:hashCredential(np)}:a));
                addActivity(`Administrator password recovered: ${current.name}`,"lock");
                m.textContent="New password saved successfully. You can now return to login.";m.className="message success";
                setTimeout(close,1000);
            });
        };
        const waitingScreen = (requestId, username) => {
            stopDeliveryWatch();
            shell(`<span class="eyebrow">ACCOUNT RECOVERY</span><h2 class="modal-title" id="forgotTitle">Waiting for Recovery Code</h2><p class="modal-subtitle">Your request was sent to the administrator. Keep this window open. The recovery code will appear automatically after the administrator sends it.</p><div class="detail-list"><div class="detail-item"><span>Account</span><strong>${String(username||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}</strong></div><div class="detail-item"><span>Status</span><strong id="recoveryWaitStatus">Waiting for admin...</strong></div></div><div id="waitingRecoveryMessage" class="message success">Recovery request sent successfully.</div><div class="form-actions"><button class="secondary-button" id="backToRecoveryRequest" type="button">Back</button></div>`);
            document.getElementById("backToRecoveryRequest")?.addEventListener("click", requestScreen);
            const checkDelivery = () => {
                const req=loadRequests().find(r=>r.id===requestId&&!r.used&&r.expiresAt>Date.now());
                if(!req){
                    stopDeliveryWatch();
                    const status=document.getElementById("recoveryWaitStatus");
                    const msg=document.getElementById("waitingRecoveryMessage");
                    if(status) status.textContent="Expired";
                    if(msg){msg.textContent="This recovery request expired. Please request a new code.";msg.className="message error";}
                    return;
                }
                if(req.status==="Sent"){
                    stopDeliveryWatch();
                    verifyScreen(req.username, req.code, req.id);
                }
            };
            checkDelivery();
            deliveryTimer=setInterval(checkDelivery,500);
        };
        const verifyScreen = (prefillUsername="", prefillCode="", requestId="") => {
            stopDeliveryWatch();
            shell(`<span class="eyebrow">ACCOUNT RECOVERY</span><h2 class="modal-title" id="forgotTitle">Enter Recovery Code</h2><p class="modal-subtitle">The manager-sent recovery code is placed here automatically. Verify it to continue.</p><form id="verifyRecoveryForm"><div class="field"><label>Username</label><div class="input-wrap"><input id="verifyUsername" autocomplete="username" value="${String(prefillUsername||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}" required></div></div><div class="field"><label>Recovery Code</label><div class="input-wrap"><input id="verifyCode" inputmode="numeric" maxlength="6" placeholder="Waiting for admin" value="${String(prefillCode||"").replace(/[^0-9]/g,"")}" required></div></div><div id="verifyMessage" class="message"></div><div class="form-actions"><button class="secondary-button" id="backRequest" type="button">Request Code</button><button class="primary-button" type="submit">Verify Code</button></div></form>`);
            document.getElementById("backRequest")?.addEventListener("click",requestScreen);
            document.getElementById("verifyRecoveryForm")?.addEventListener("submit",e=>{
                e.preventDefault();const username=document.getElementById("verifyUsername").value.trim().toLowerCase(),code=document.getElementById("verifyCode").value.trim(),m=document.getElementById("verifyMessage"),now=Date.now();
                const req=loadRequests().slice().reverse().find(r=>(!requestId||r.id===requestId)&&String(r.username||"").toLowerCase()===username&&r.code===code&&r.status==="Sent"&&!r.used&&r.expiresAt>now);
                if(!req){m.textContent="Invalid, unsent, or expired recovery code.";m.className="message error";return;}
                resetScreen(req.id);
            });
        };
        const resetScreen = requestId => {
            stopDeliveryWatch();
            shell(`<span class="eyebrow">ACCOUNT RECOVERY</span><h2 class="modal-title" id="forgotTitle">Create New Password</h2><p class="modal-subtitle">Recovery code verified. Set a new password for your account.</p><form id="recoveryResetForm"><div class="field"><label>New Password</label><div class="input-wrap"><input id="recoveryNewPassword" type="password" required></div></div><div class="field"><label>Confirm New Password</label><div class="input-wrap"><input id="recoveryConfirmPassword" type="password" required></div></div><div id="resetRecoveryMessage" class="message"></div><div class="form-actions"><button class="primary-button" type="submit">Reset Password</button></div></form>`);
            document.getElementById("recoveryResetForm")?.addEventListener("submit",e=>{
                e.preventDefault();const np=document.getElementById("recoveryNewPassword").value,cp=document.getElementById("recoveryConfirmPassword").value,m=document.getElementById("resetRecoveryMessage");
                if(np.length<8){m.textContent="Password must contain at least 8 characters.";m.className="message error";return;}
                if(np!==cp){m.textContent="Passwords do not match.";m.className="message error";return;}
                let rows=loadRequests();const req=rows.find(r=>r.id===requestId&&r.status==="Sent"&&!r.used&&r.expiresAt>Date.now());
                if(!req){m.textContent="This recovery request has expired or was already used.";m.className="message error";return;}
                const accounts=get(STORAGE.admins,seed.admins);set(STORAGE.admins,accounts.map(a=>a.id===req.accountId?{...a,password:hashCredential(np)}:a));
                rows=rows.map(r=>r.id===requestId?{...r,used:true,status:"Used",usedAt:Date.now()}:r);saveRequests(rows);addActivity(`Password recovered using administrator code: ${req.name}`,"lock");
                m.textContent="Password successfully reset. You can now return to login.";m.className="message success";
                setTimeout(close,900);
            });
        };
        requestScreen();
    }
});
