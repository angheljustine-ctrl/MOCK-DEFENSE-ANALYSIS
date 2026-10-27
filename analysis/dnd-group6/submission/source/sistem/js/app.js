/* =========================================================
   Shared application shell, storage, theme, modal and toast.
   Frontend demo only. Replace storage/auth calls with API calls
   when a real backend is introduced.
========================================================= */

(() => {
    "use strict";

    const STORAGE = {
        session: "dd_admin_session",
        accounts: "dd_admins",
        theme: "dd_theme",
        admins: "dd_admins",
        employees: "dd_employees",
        attendance: "dd_attendance",
        leave: "dd_leave",
        payroll: "dd_payroll",
        activities: "dd_activities",
        notifications: "dd_notifications",
        profile: "dd_profile",
        sessionProof: "dd_session_proof",
        deletedEmployees: "dd_deleted_employees",
        deletedAttendance: "dd_deleted_attendance",
        deletedLeave: "dd_deleted_leave",
        deletedPayroll: "dd_deleted_payroll",
        deletedAdmins: "dd_deleted_admins"
    };

    // Local credential hashing helper. Plain-text credentials are never persisted.
function hashCredential(value){
    function rrot(n,x){return (x>>>n)|(x<<(32-n));}
    const bytes=new TextEncoder().encode(String(value??""));
    const bitLen=bytes.length*8;
    const withOne=bytes.length+1;
    const paddedLen=((withOne+8+63)>>6)<<6;
    const data=new Uint8Array(paddedLen); data.set(bytes); data[bytes.length]=0x80;
    const view=new DataView(data.buffer); view.setUint32(paddedLen-4,bitLen>>>0,false); view.setUint32(paddedLen-8,Math.floor(bitLen/0x100000000),false);
    const K=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];
    let h=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],w=new Uint32Array(64);
    for(let off=0;off<data.length;off+=64){for(let i=0;i<16;i++)w[i]=view.getUint32(off+i*4,false);for(let i=16;i<64;i++){let a=w[i-15],b=w[i-2],s0=rrot(7,a)^rrot(18,a)^(a>>>3),s1=rrot(17,b)^rrot(19,b)^(b>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;}let [a,b,c,d,e,f,g,hh]=h;for(let i=0;i<64;i++){let S1=rrot(6,e)^rrot(11,e)^rrot(25,e),ch=(e&f)^(~e&g),t1=(hh+S1+ch+K[i]+w[i])>>>0,S0=rrot(2,a)^rrot(13,a)^rrot(22,a),maj=(a&b)^(a&c)^(b&c),t2=(S0+maj)>>>0;hh=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}h=[(h[0]+a)>>>0,(h[1]+b)>>>0,(h[2]+c)>>>0,(h[3]+d)>>>0,(h[4]+e)>>>0,(h[5]+f)>>>0,(h[6]+g)>>>0,(h[7]+hh)>>>0];}
    return h.map(x=>x.toString(16).padStart(8,"0")).join("");
}
function isCredentialHash(value){return /^[a-f0-9]{64}$/i.test(String(value||""));}

const seed = {
        admins: [
            {id:"ADM-001",name:"Branch Manager",username:"admin",email:"admin@doughnutdisturb.local",role:"Branch Manager",status:"Active",lastLogin:"Today, 09:14 AM",password:"240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"},
            {id:"ADM-002",name:"Maria Santos",username:"maria",email:"maria@doughnutdisturb.local",role:"Assistant Manager",status:"Active",lastLogin:"Yesterday, 04:32 PM",password:"240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"},
            {id:"ADM-003",name:"John Reyes",username:"john",email:"john@doughnutdisturb.local",role:"Employee",employeeId:"EMP-003",status:"Active",lastLogin:"Sep 04, 2026",password:"240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"}
        ],
        employees: [],
        attendance: [],
        payroll: [],
        leave: [],
        activities: [
            {text:"Attendance recorded for Angela Cruz",time:"Today, 08:02 AM",icon:"clock"},
            {text:"Payroll processed for EMP-001",time:"Today, 07:45 AM",icon:"wallet"},
            {text:"Admin account created: John Reyes",time:"Sep 04, 2026",icon:"shield"}
        ],
        notifications: [
            {title:"Payroll pending",body:"1 payroll record is waiting for payment.",time:"Today"},
            {title:"Attendance recorded",body:"Today's attendance records are updated.",time:"Today"}
        ],
        profile: {name:"Branch Manager",username:"admin",email:"admin@doughnutdisturb.local",role:"Branch Manager"},
    };

    const iconPaths = {
        grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
        users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        wallet:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M16 12h5"/><path d="M3 9h18"/>',
        package:'<path d="m16.5 9.4 4.5-2.2"/><path d="M21 16V8l-9-5-9 5v8l9 5z"/><path d="M3.3 8 12 13l8.7-5"/><path d="M12 13v8"/>',
        shield:'<path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/>',
        user:'<circle cx="12" cy="7" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
        settings:'<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.4h.2A1.7 1.7 0 0 0 7.76 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-1.7.06.06A1.7 1.7 0 0 0 11 6.76 1.7 1.7 0 0 0 12.03 5.2V5h2.4v.2A1.7 1.7 0 0 0 15.46 6.76a1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 18.7 10a1.7 1.7 0 0 0 1.56 1.03h.2v2.4h-.2A1.7 1.7 0 0 0 19.4 15Z"/>',
        info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
        search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
        bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
        menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
        logout:'<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/>',
        calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        check:'<path d="m5 12 4 4L19 6"/>',
        close:'<path d="M6 6l12 12M18 6 6 18"/>',
        plus:'<path d="M12 5v14M5 12h14"/>',
        edit:'<path d="m4 20 4-.9L19 8a2 2 0 0 0-3-3L5 16l-1 4Z"/>',
        trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',
        eye:'<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
        lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
        refresh:'<path d="M20 11a8 8 0 0 0-14.8-4L3 10"/><path d="M3 5v5h5"/><path d="M4 13a8 8 0 0 0 14.8 4L21 14"/><path d="M21 19v-5h-5"/>',
        arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
        report:'<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/><path d="M4 4h16"/>'
    };

    function icon(name) {
        return `<svg aria-hidden="true" viewBox="0 0 24 24">${iconPaths[name] || iconPaths.info}</svg>`;
    }

    function get(key, fallback=[]) {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        try { return JSON.parse(raw); } catch { return fallback; }
    }
    function set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(new CustomEvent("dd:data", {detail:{key, value}}));
    }
    function sessionHash(value="") {
        // Lightweight integrity checksum for the frontend demo session.
        // This is intentionally not presented as a replacement for server-side authentication.
        let h1 = 0x811c9dc5, h2 = 0x9e3779b9;
        const text = String(value);
        for (let i = 0; i < text.length; i++) {
            const c = text.charCodeAt(i);
            h1 ^= c; h1 = Math.imul(h1, 0x01000193);
            h2 ^= (c + i); h2 = Math.imul(h2, 0x85ebca6b);
        }
        return (h1 >>> 0).toString(16).padStart(8,"0") + (h2 >>> 0).toString(16).padStart(8,"0");
    }
    function browserBinding() {
        return sessionHash([navigator.userAgent, navigator.language, screen.width, screen.height].join("|"));
    }
    function randomToken() {
        const bytes = new Uint32Array(4);
        if (window.crypto?.getRandomValues) window.crypto.getRandomValues(bytes);
        else for (let i=0;i<bytes.length;i++) bytes[i] = Math.floor(Math.random()*0xffffffff);
        return Array.from(bytes,n=>n.toString(16).padStart(8,"0")).join("");
    }
    function clearSession() {
        [localStorage, sessionStorage].forEach(store => {
            store.removeItem(STORAGE.session);
            store.removeItem(STORAGE.sessionProof);
        });
    }
    function sessionSignature(data, account, token) {
        return sessionHash([
            data.accountId, data.adminId, data.employeeId || "", data.role,
            data.loginAt, data.expiresAt, data.rememberMe ? "1" : "0",
            browserBinding(), token, account.id, account.username, account.status, account.password || ""
        ].join("|"));
    }
    function createSecureSession(account, rememberMe=false) {
        clearSession();
        const now = Date.now();
        const data = {
            accountId: account.id, adminId: account.id, employeeId: account.employeeId || null,
            role: account.role || "Admin", loginAt: new Date(now).toISOString(),
            expiresAt: new Date(now + (rememberMe ? 7*24*60*60*1000 : 8*60*60*1000)).toISOString(),
            rememberMe: !!rememberMe
        };
        const token = randomToken();
        const proof = {token, signature: sessionSignature(data, account, token)};
        const store = rememberMe ? localStorage : sessionStorage;
        store.setItem(STORAGE.session, JSON.stringify(data));
        store.setItem(STORAGE.sessionProof, JSON.stringify(proof));
        return data;
    }
    function session() {
        const store = localStorage.getItem(STORAGE.session) ? localStorage : sessionStorage;
        const raw = store.getItem(STORAGE.session);
        const proofRaw = store.getItem(STORAGE.sessionProof);
        if (!raw || !proofRaw) return null;
        try {
            const data = JSON.parse(raw), proof = JSON.parse(proofRaw);
            if (!data?.accountId || !data?.loginAt || !data?.expiresAt || !proof?.token || !proof?.signature) return null;
            if (Date.now() >= Date.parse(data.expiresAt)) { clearSession(); return null; }
            const accounts = get(STORAGE.admins, seed.admins);
            const account = accounts.find(a => a.id === (data.accountId || data.adminId));
            if (!account || account.status === "Inactive") { clearSession(); return null; }
            if ((account.role || "Admin") !== data.role || (account.employeeId || null) !== (data.employeeId || null)) { clearSession(); return null; }
            if (sessionSignature(data, account, proof.token) !== proof.signature) { clearSession(); return null; }
            return data;
        } catch { clearSession(); return null; }
    }
    function role() {
        const s=session();
        return (s?.role || "Admin").toLowerCase();
    }
    function isAdmin() { return ["branch manager","assistant manager","admin","super admin","administrator"].includes(role()); }
    function canWrite() { return isAdmin(); }
    function canViewPage(page) {
        if(isAdmin()) return true;
        return ["dashboard","attendance","leave","payroll","employees","about"].includes(page);
    }
    function guardWrite(action="perform this action") {
        if(canWrite()) return true;
        toast(`Shift Supervisor / Employee accounts are view-only. You cannot ${action}.`,"error","Access Restricted");
        return false;
    }
    function money(value) { return new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP",maximumFractionDigits:2}).format(Number(value)||0); }
    function today() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
    function uid(prefix) { return `${prefix}-${Date.now().toString(36).toUpperCase()}`; }
    function initials(name="Admin") { return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase(); }
    function escapeHTML(value="") {
        return String(value).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
    }
    function seedData() {
        Object.entries(seed).forEach(([key,value]) => {
            const storageKey = STORAGE[key];
            if (storageKey && localStorage.getItem(storageKey) === null) set(storageKey,value);
        });

        // Keep the primary Branch Manager / Taga Pamahala account recoverable.
        // If it was deleted before account protection was added, restore the exact
        // deleted record first so its existing credentials/settings are preserved.
        let admins = get(STORAGE.admins, seed.admins);
        const hasPrimary = admins.some(a => String(a?.id||"") === "ADM-001" || String(a?.username||"").toLowerCase() === "admin");
        if (!hasPrimary) {
            let deletedAdmins = get(STORAGE.deletedAdmins, []);
            const deletedPrimary = deletedAdmins.find(a => String(a?.id||"") === "ADM-001" || String(a?.username||"").toLowerCase() === "admin");
            const source = deletedPrimary || seed.admins.find(a => a.id === "ADM-001");
            if (source) {
                const {deletedAt, ...restoredPrimary} = source;
                admins.unshift({...restoredPrimary, id:"ADM-001", role:"Branch Manager", status:"Active"});
                set(STORAGE.admins, admins);
                if (deletedPrimary) {
                    deletedAdmins = deletedAdmins.filter(a => !(String(a?.id||"") === "ADM-001" || String(a?.username||"").toLowerCase() === "admin"));
                    set(STORAGE.deletedAdmins, deletedAdmins);
                }
            }
        }


        // One-time migration: convert any legacy plain-text account passwords to SHA-256 hashes.
        const credentialRows = get(STORAGE.admins, seed.admins);
        if (credentialRows.some(a => a.password && !isCredentialHash(a.password))) {
            set(STORAGE.admins, credentialRows.map(a => ({...a, password:a.password && !isCredentialHash(a.password) ? hashCredential(a.password) : a.password})));
        }

        // One-time login recovery for systems where the protected Branch Manager
        // had already been deleted before protection was installed. This runs once
        // in the browser, then normal password/profile changes continue to work.
        const branchRecoveryKey = "dd_branch_manager_login_recovery_v1";
        if (localStorage.getItem(branchRecoveryKey) !== "done") {
            admins = get(STORAGE.admins, seed.admins);
            let primaryIndex = admins.findIndex(a => String(a?.id||"") === "ADM-001");
            if (primaryIndex < 0) primaryIndex = admins.findIndex(a => String(a?.role||"").toLowerCase() === "branch manager");
            const primarySeed = seed.admins.find(a => a.id === "ADM-001");
            if (primaryIndex >= 0) {
                admins[primaryIndex] = {...admins[primaryIndex], id:"ADM-001", name:admins[primaryIndex].name||"Branch Manager", username:"admin", email:admins[primaryIndex].email||primarySeed.email, role:"Branch Manager", status:"Active", password:"240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"};
            } else {
                admins.unshift({...primarySeed});
            }
            set(STORAGE.admins, admins);
            localStorage.setItem(branchRecoveryKey, "done");
        }
    }

    function applyTheme() {
        const theme = localStorage.getItem(STORAGE.theme) || "warm";
        document.documentElement.dataset.theme = theme === "dark" ? "dark" : "warm";
    }

    function requireAuth() {
        const signed = session();
        if (!signed) { window.location.href = "index.html"; return false; }
        const accounts = get(STORAGE.admins, seed.admins);
        const account = accounts.find(a => a.id === (signed.accountId || signed.adminId));
        if (!account || account.status === "Inactive") {
            clearSession();
            window.location.href = "index.html";
            return false;
        }
        return true;
    }

    function buildShell() {
        const root = document.getElementById("appShell");
        if (!root) return;

        const page = document.body.dataset.page || "dashboard";
        const signed=session();
        const accounts=get(STORAGE.admins,seed.admins);
        const account=accounts.find(a=>a.id===(signed?.accountId||signed?.adminId));
        const profile = account || get(STORAGE.profile, seed.profile);
        const nav = [
            ["dashboard","Dashboard","grid","dashboard.html"],
            ["employees","Employees","users","employees.html"],
            ["attendance","Attendance","clock","attendance.html"],
            ["leave","Leave","calendar","leave.html"],
            ["payroll","Payroll System","wallet","payroll.html"],
            ["reports","Reports","report","reports.html"],
            ["admins","Account Management","shield","admins.html"],
            ["create-account","Create Account","plus","create-account.html"],
            ["about","System Information","info","about.html"],
            ["settings","Settings","settings","settings.html"]
        ];

        root.innerHTML = `
            <aside class="app-sidebar" id="appSidebar">
                <div class="sidebar-brand">
                    <img src="img/logo.png" alt="Doughnut Disturb">
                    <div><strong>DOUGHNUT DISTURB</strong><small>MANAGEMENT SYSTEM</small></div>
                </div>
                <nav class="sidebar-nav" aria-label="Main navigation">
                    <div class="nav-label">MAIN MENU</div>
                    ${nav.filter(([key])=>canViewPage(key)).map(([key,label,ico,url])=>`
                        <a class="nav-item ${page===key?'active':''}" href="${url}">
                            ${icon(ico)}<span>${label}</span>
                        </a>`).join("")}
                </nav>
                <div class="sidebar-footer">
                    <button class="nav-item logout-nav" id="logoutBtn" type="button">${icon("logout")}<span>Logout</span></button>
                </div>
            </aside>
            <header class="app-header">
                <button class="header-menu" id="menuBtn" type="button" aria-label="Open navigation">${icon("menu")}</button>
                <div class="header-title"><strong>${pageTitle(page)}</strong><span>Centralized business management system</span></div>
                <div class="header-tools">
                    <div class="header-clock" aria-label="Current time">
                        <span class="header-clock-time" id="liveClock">--:--:--</span>
                        <span class="header-clock-date" id="liveClockDate">Loading date...</span>
                    </div>
                    <button class="header-icon" id="notificationBtn" type="button" aria-label="Notifications">${icon("bell")}<span class="notification-dot"></span></button>
                    <button class="profile-button" id="profileBtn" type="button">
                        <span class="avatar">${escapeHTML(initials(profile.name))}</span>
                        <span class="profile-copy"><strong>${escapeHTML(profile.name)}</strong><span>${escapeHTML(profile.role)}</span></span>
                    </button>
                </div>
                <div class="dropdown" id="notificationDropdown">
                    <div class="notification-list">
                        <div class="notification-head"><strong>Notifications</strong><button type="button" class="text-button" id="clearNotifications">Clear All</button></div>
                        <div id="notificationList">${get(STORAGE.notifications,seed.notifications).map((n,i)=>`<div class="notification-item ${n.read?"read":""}" data-notification-index="${i}"><button class="notification-delete" type="button" data-notification-delete="${i}" aria-label="Delete notification">×</button><strong>${escapeHTML(n.title)}</strong><span>${escapeHTML(n.body)} · ${escapeHTML(formatNotificationTime(n))}</span><button class="notification-read" type="button" data-notification-read="${i}">${n.read?"Read":"Mark read"}</button></div>`).join("") || '<div class="notification-item"><span>No notifications</span></div>'}</div>
                    </div>
                </div>
                <div class="dropdown" id="profileDropdown">
                    <a class="dropdown-item" href="settings.html">${icon("user")}<span><strong>Profile Settings</strong><small>Manage your account</small></span></a>
                    <button class="dropdown-item" id="dropdownLogout" type="button">${icon("logout")}<span><strong>Logout</strong><small>End current session</small></span></button>
                </div>
            </header>
        `;

        document.getElementById("logoutBtn").addEventListener("click", showLogoutModal);
        document.getElementById("dropdownLogout").addEventListener("click", showLogoutModal);
        document.getElementById("menuBtn").addEventListener("click",()=>document.getElementById("appSidebar").classList.toggle("open"));
        document.getElementById("notificationBtn").addEventListener("click",()=>{
            document.getElementById("notificationDropdown").classList.toggle("open");
            document.getElementById("profileDropdown").classList.remove("open");
        });
        function renderNotifications(){
            const list=get(STORAGE.notifications,seed.notifications);
            const target=document.getElementById("notificationList");
            if(!target)return;
            target.innerHTML=list.map((n,i)=>`<div class="notification-item ${n.read?"read":""}" data-notification-index="${i}"><button class="notification-delete" type="button" data-notification-delete="${i}" aria-label="Delete notification">×</button><strong>${escapeHTML(n.title)}</strong><span>${escapeHTML(n.body)} · ${escapeHTML(formatNotificationTime(n))}</span><button class="notification-read" type="button" data-notification-read="${i}">${n.read?"Read":"Mark read"}</button></div>`).join("") || '<div class="notification-item"><span>No notifications</span></div>';
            const unread=list.filter(n=>!n.read).length;
            const dot=document.querySelector(".notification-dot"); if(dot) dot.style.display=unread?"block":"none";
            target.querySelectorAll("[data-notification-delete]").forEach(b=>b.addEventListener("click",e=>{const a=get(STORAGE.notifications,[]);a.splice(+b.dataset.notificationDelete,1);set(STORAGE.notifications,a);addActivity("Notification deleted","bell");renderNotifications();}));
            target.querySelectorAll("[data-notification-read]").forEach(b=>b.addEventListener("click",e=>{const a=get(STORAGE.notifications,[]);const i=+b.dataset.notificationRead;if(a[i])a[i].read=true;set(STORAGE.notifications,a);renderNotifications();}));
        }
        document.getElementById("clearNotifications").addEventListener("click",()=>{set(STORAGE.notifications,[]);renderNotifications();toast("All notifications cleared.");});
        renderNotifications();
        window.addEventListener("dd:sync",e=>{if(e.detail?.key===STORAGE.notifications)renderNotifications();});
        document.getElementById("profileBtn").addEventListener("click",()=>{
            document.getElementById("profileDropdown").classList.toggle("open");
            document.getElementById("notificationDropdown").classList.remove("open");
        });
        document.addEventListener("click", e=>{
            if (!e.target.closest("#notificationBtn") && !e.target.closest("#notificationDropdown")) document.getElementById("notificationDropdown")?.classList.remove("open");
            if (!e.target.closest("#profileBtn") && !e.target.closest("#profileDropdown")) document.getElementById("profileDropdown")?.classList.remove("open");
        });
    }

    function formatNotificationTime(n) {
        if (n?.createdAt) {
            const d = new Date(n.createdAt), diff = Math.max(0, Date.now() - d.getTime());
            if (!Number.isNaN(d.getTime())) {
                if (diff < 60000) return "Just now";
                if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
                if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
                return d.toLocaleString("en-PH", {month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"});
            }
        }
        return n?.time || "Just now";
    }

    function startLiveClock() {
        const tick = () => {
            const now = new Date();
            const clock = document.getElementById("liveClock"), date = document.getElementById("liveClockDate");
            if (clock) clock.textContent = now.toLocaleTimeString("en-PH", {hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:true});
            if (date) date.textContent = now.toLocaleDateString("en-PH", {weekday:"short", month:"short", day:"numeric", year:"numeric"});
        };
        tick();
        window.clearInterval(window.__ddClockTimer);
        window.__ddClockTimer = window.setInterval(tick, 1000);
    }

    function pageTitle(page) {
        return ({
            dashboard:"Dashboard", payroll:"Payroll System", reports:"Reports", employees:"Employees", attendance:"Attendance", leave:"Leave",
            admins:"Account Management", "create-account":"Create New Account",
            about:"System Information", settings:"Settings"
        })[page] || "Management System";
    }

    function drawer(content) {
        const root = document.getElementById("modalRoot");
        if (!root) return;
        root.innerHTML = `<div class="drawer-layer open" id="activeDrawer"><div class="drawer-backdrop" data-close-drawer></div><aside class="side-drawer" role="dialog" aria-modal="true">${content}</aside></div>`;
        const d=document.getElementById("activeDrawer");
        d.addEventListener("click",e=>{
            if(e.target.matches("[data-close-drawer]") || e.target.closest("[data-drawer-close]")) closeDrawer();
        });
        document.addEventListener("keydown", drawerEscClose);
        return d;
    }
    function drawerEscClose(e){if(e.key==="Escape") closeDrawer();}
    function closeDrawer(){
        const d=document.getElementById("activeDrawer");
        if(d){
            d.classList.remove("open");
            document.removeEventListener("keydown", drawerEscClose);
            setTimeout(()=>d.remove(),180);
        }
    }

    function modal(content) {
        const root = document.getElementById("modalRoot");
        if (!root) return;
        root.innerHTML = `<div class="modal open" id="activeModal"><div class="modal-backdrop" data-close-modal></div><section class="modal-card" role="dialog" aria-modal="true">${content}</section></div>`;
        const m = document.getElementById("activeModal");
        m.addEventListener("click",e=>{
            if(e.target.matches("[data-close-modal]") || e.target.closest("[data-modal-close]")) closeModal();
        });
        document.addEventListener("keydown", escClose);
        return m;
    }
    function escClose(e) { if(e.key==="Escape") closeModal(); }
    function closeModal() {
        const m=document.getElementById("activeModal");
        if(m){
            m.classList.remove("open");
            document.removeEventListener("keydown", escClose);
            setTimeout(()=>m.remove(),180);
        }
    }

    function showLogoutModal() {
        modal(`<button class="modal-close" data-modal-close type="button">×</button>
            <span class="eyebrow">SECURE SESSION</span><h2 class="modal-title">Are you sure you want to log out?</h2>
            <p class="modal-subtitle">Your current demo session will be cleared and you will return to the login page.</p>
            <div class="form-actions"><button class="secondary-button" data-modal-close type="button">Cancel</button><button class="danger-button" id="confirmLogout" type="button">Logout</button></div>`);
        document.getElementById("confirmLogout").addEventListener("click",()=>{
            clearSession();
            window.location.href="index.html";
        });
    }

    function toast(message,type="success",title=type==="success"?"Success":"Notice") {
        let root=document.getElementById("toastRoot");
        if(!root){ root=document.createElement("div"); root.id="toastRoot"; document.body.appendChild(root); }
        if(!root.classList.contains("toast-stack")) root.className="toast-stack";
        const el=document.createElement("div");
        el.className=`toast ${type}`;
        el.innerHTML=`${icon(type==="success"?"shield":"info")}<div><strong>${escapeHTML(title)}</strong><span>${escapeHTML(message)}</span></div>`;
        root.appendChild(el);
        setTimeout(()=>{el.style.opacity="0";el.style.transform="translateX(12px)";setTimeout(()=>el.remove(),180)},3200);
    }

    function addActivity(text,iconName="info") {
        const items=get(STORAGE.activities,[]);
        const now=new Date();
        items.unshift({text,time:now.toLocaleString("en-PH",{month:"short",day:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}),createdAt:now.toISOString(),icon:iconName});
        set(STORAGE.activities,items.slice(0,20));
    }
    function addNotification(title,body) {
        const items=get(STORAGE.notifications,[]);
        items.unshift({title,body,time:"Just now",createdAt:new Date().toISOString(),read:false});
        set(STORAGE.notifications,items.slice(0,15));
    }

    // Payday notification only: every 15th and last day of the month.
    function checkPaydayNotification() {
        const now = new Date();
        const day = now.getDate();
        const year = now.getFullYear();
        const month = now.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();

        if (day !== 15 && day !== lastDay) return;

        const monthName = now.toLocaleDateString("en-PH", { month: "long" });
        const period = day === 15
            ? `${monthName} 1-15, ${year}`
            : `${monthName} 16-${lastDay}, ${year}`;
        const paydayKey = `payday-${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        const items = get(STORAGE.notifications, []);

        // Prevent duplicate payday notifications on refresh.
        if (items.some(n => n.paydayKey === paydayKey)) return;

        items.unshift({
            title: "Pay Day Today",
            body: `Payroll day for ${period}. Review pending payroll records and process employee payments.`,
            time: "Just now",
            createdAt: now.toISOString(),
            read: false,
            paydayKey
        });

        set(STORAGE.notifications, items.slice(0,15));
    }

    // Expose the credential helper for the existing authentication/account scripts.
    // The helper was previously scoped only inside this IIFE, which caused login to fail with a ReferenceError.
    window.hashCredential = hashCredential;
    window.DD = {STORAGE,seed,icon,get,set,money,today,uid,initials,escapeHTML,seedData,applyTheme,requireAuth,buildShell,pageTitle,formatNotificationTime,startLiveClock,modal,closeModal,drawer,closeDrawer,toast,addActivity,addNotification,session,createSecureSession,clearSession,role,isAdmin,canWrite,canViewPage,guardWrite};
    seedData();
    checkPaydayNotification();
    localStorage.removeItem("dd_recovery_requests");
    localStorage.removeItem("dd_recovery_keys");
    applyTheme();
    window.addEventListener("storage", e => { if(e.key && e.key.startsWith("dd_")) window.dispatchEvent(new CustomEvent("dd:sync",{detail:{key:e.key}})); });
    window.addEventListener("dd:data", e => window.dispatchEvent(new CustomEvent("dd:sync",{detail:e.detail||{}})));

    if (document.body.dataset.page) {
        if (!requireAuth()) return;
        if (!canViewPage(document.body.dataset.page)) { window.location.href="dashboard.html"; return; }
        buildShell();
        startLiveClock();
    }
})();
