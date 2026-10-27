document.addEventListener("DOMContentLoaded",()=>{
    const {STORAGE,seed,icon,get,money,escapeHTML,canWrite,session}=DD;
    const currentPeriod=()=>{const d=new Date(),y=d.getFullYear(),m=d.getMonth(),day=d.getDate();return day<=15?{start:`${y}-${String(m+1).padStart(2,"0")}-01`,end:`${y}-${String(m+1).padStart(2,"0")}-15`}:{start:`${y}-${String(m+1).padStart(2,"0")}-16`,end:new Date(y,m+1,0).toISOString().slice(0,10)}};
    const net=p=>Number(p.netPay ?? ((+p.basic||0)+(Number(p.overtimePay ?? p.overtime)||0)+(+p.allowance||0)+(+p.bonus||0)-Number(p.deductionsTotal ?? p.deductions ?? 0)));
    function render(){
        const allEmployees=get(STORAGE.employees,seed.employees), allAttendance=get(STORAGE.attendance,seed.attendance), payroll=get(STORAGE.payroll,seed.payroll), admins=get(STORAGE.admins,seed.admins);
        const mine=!canWrite()?session()?.employeeId:null;
        const employees=mine?allEmployees.filter(e=>e.id===mine):allEmployees;
        const attendance=mine?allAttendance.filter(a=>a.employee===mine):allAttendance;
        const activeEmployees=employees.filter(e=>e.status==="Active");
        const todayRecords=attendance.filter(a=>a.date===DD.today());
        const present=todayRecords.filter(a=>a.status==="Present").length;
        const absent=todayRecords.filter(a=>a.status==="Absent").length;
        const late=todayRecords.filter(a=>a.status==="Late").length;
        const leave=todayRecords.filter(a=>a.status==="On Leave").length;
        const seen=new Set(todayRecords.map(a=>a.employee));
        const notYetIn=activeEmployees.filter(e=>!seen.has(e.id)).length;
        const visiblePayroll=mine?payroll.filter(p=>p.employee===mine):payroll;
        const cp=currentPeriod();
        const currentPayroll=visiblePayroll.filter(p=>{
            const start=p.startDate || ""; const end=p.endDate || "";
            return start&&end&&start<=cp.end&&end>=cp.start;
        });
        const payrollSet=currentPayroll.length?currentPayroll:visiblePayroll;
        const totalPayroll=payrollSet.reduce((s,p)=>s+net(p),0);
        const paid=payrollSet.filter(p=>p.status==="Paid").reduce((s,p)=>s+net(p),0);
        const pending=Math.max(0,totalPayroll-paid);
        document.getElementById("todayDate").textContent=new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
        const stats=[
            ["Total Employees",employees.length,"users","All employee records"],
            ["Present Today",present,"clock","Checked in on time"],
            ["Absent Today",absent,"users","Requires attention"],
            ["Late Today",late,"clock","Late attendance"],
            ["On Leave",leave,"calendar","Approved leave today"],
            ["Total Payroll",money(totalPayroll),"wallet","Current pay period"],
            ["Pending Payroll",money(pending),"wallet","Awaiting payment"]
        ];
        document.getElementById("dashboardStats").innerHTML=stats.map(s=>`<article class="stat-card"><div class="stat-top"><span class="stat-label">${s[0]}</span><span class="stat-icon">${icon(s[2])}</span></div><div class="stat-value">${escapeHTML(s[1])}</div><div class="stat-note">${s[3]}</div></article>`).join("");
        const chartData=[["Present",present],["Absent",absent],["Late",late],["On Leave",leave]],max=Math.max(...chartData.map(x=>x[1]),1);
        document.getElementById("attendanceChart").innerHTML=chartData.map(x=>`<div class="bar-group"><span class="bar-value">${x[1]}</span><div class="bar" style="height:${Math.max(6,x[1]/max*130)}px"></div><span class="bar-label">${x[0]}</span></div>`).join("");
        document.getElementById("attendanceLegend").innerHTML=`<span><i class="legend-dot green"></i>Present</span><span><i class="legend-dot red"></i>Absent</span><span><i class="legend-dot"></i>Late</span><span><i class="legend-dot muted"></i>Leave</span>`;
        const pct=totalPayroll?Math.round(paid/totalPayroll*100):0,donut=document.getElementById("payrollDonut");donut.style.setProperty("--paid",pct+"%");document.getElementById("payrollPaidPct").textContent=pct+"%";
        document.getElementById("payrollLegend").innerHTML=`<div class="donut-item"><span>Paid</span><strong>${money(paid)}</strong></div><div class="donut-item"><span>Pending</span><strong>${money(pending)}</strong></div><div class="donut-item"><span>Total</span><strong>${money(totalPayroll)}</strong></div>`;
        document.getElementById("employeeOverview").innerHTML=`<div class="mini-metric"><span>Active Employees</span><strong>${activeEmployees.length}</strong></div><div class="mini-metric"><span>Inactive</span><strong>${employees.length-activeEmployees.length}</strong></div><div class="mini-metric"><span>Not Yet In</span><strong>${notYetIn}</strong></div><div class="mini-metric"><span>Late Today</span><strong>${late}</strong></div>`;
        const qa=document.getElementById("quickActions");
        qa.innerHTML=canWrite()?`<a class="mini-metric" href="employees.html"><span>${icon("users")} Add Employee</span><strong>→</strong></a><a class="mini-metric" href="attendance.html"><span>${icon("clock")} Record Attendance</span><strong>→</strong></a><a class="mini-metric" href="leave.html"><span>${icon("calendar")} Manage Leave</span><strong>→</strong></a><a class="mini-metric" href="payroll.html"><span>${icon("wallet")} Process Payroll</span><strong>→</strong></a><a class="mini-metric" href="reports.html"><span>${icon("report")} View Reports</span><strong>→</strong></a>`:`<div class="mini-metric"><span>Current Status</span><strong>View only</strong></div><a class="mini-metric" href="attendance.html"><span>My Attendance</span><strong>→</strong></a><a class="mini-metric" href="leave.html"><span>My Leave</span><strong>→</strong></a><a class="mini-metric" href="payroll.html"><span>My Payroll</span><strong>→</strong></a>`;
        const activities=get(STORAGE.activities,seed.activities);
        document.getElementById("recentActivities").innerHTML=activities.slice(0,6).map(a=>`<div class="activity-item"><div class="activity-icon">${icon(a.icon||"info")}</div><div><strong>${escapeHTML(a.text)}</strong><span>${escapeHTML(a.time)}</span></div></div>`).join("")||`<div class="empty-state"><strong>No recent activities</strong><span>System activity will appear here.</span></div>`;
    }
    window.addEventListener("dd:sync",render);window.addEventListener("storage",render);render();
});
