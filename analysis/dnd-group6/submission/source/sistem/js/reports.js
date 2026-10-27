document.addEventListener("DOMContentLoaded", () => {
    const { STORAGE, get, money, escapeHTML, icon } = DD;

    let reportType = "summary";
    let startDate = "";
    let endDate = "";

    const pageActions = document.getElementById("pageActions");
    const pageContent = document.getElementById("pageContent");

    function records() {
        return {
            employees: get(STORAGE.employees, []),
            attendance: get(STORAGE.attendance, []),
            leave: get(STORAGE.leave, []),
            payroll: get(STORAGE.payroll, [])
        };
    }

    function inRange(date) {
        if (!date) return !startDate && !endDate;
        if (startDate && date < startDate) return false;
        if (endDate && date > endDate) return false;
        return true;
    }

    function employeeName(id, employees) {
        const e = employees.find(x => x.id === id);
        return e ? `${e.firstName || ""} ${e.lastName || ""}`.trim() : id || "—";
    }

    function periodMatches(p) {
        if (!startDate && !endDate) return true;
        const start = p.startDate || "";
        const end = p.endDate || start;
        if (!start && !end) return false;
        if (startDate && end < startDate) return false;
        if (endDate && start > endDate) return false;
        return true;
    }

    function filteredData() {
        const all = records();
        return {
            ...all,
            attendance: all.attendance.filter(a => inRange(a.date)),
            leave: all.leave.filter(l => {
                const s = l.startDate || l.from || l.date || "";
                const e = l.endDate || l.to || s;
                if (!startDate && !endDate) return true;
                if (startDate && e < startDate) return false;
                if (endDate && s > endDate) return false;
                return true;
            }),
            payroll: all.payroll.filter(periodMatches)
        };
    }

    function buildSummary(data) {
        const active = data.employees.filter(e => e.status === "Active").length;
        const present = data.attendance.filter(a => a.status === "Present").length;
        const late = data.attendance.filter(a => a.status === "Late").length;
        const absent = data.attendance.filter(a => a.status === "Absent").length;
        const onLeave = data.attendance.filter(a => a.status === "On Leave").length;
        const approvedLeave = data.leave.filter(l => l.status === "Approved").length;
        const pendingLeave = data.leave.filter(l => l.status === "Pending").length;
        const payrollTotal = data.payroll.reduce((s,p) => s + Number(p.netPay || 0), 0);
        const paidTotal = data.payroll.filter(p => p.status === "Paid").reduce((s,p) => s + Number(p.netPay || 0), 0);
        const pendingTotal = data.payroll.filter(p => p.status !== "Paid").reduce((s,p) => s + Number(p.netPay || 0), 0);

        const cards = [
            ["Total Employees", data.employees.length, "users"],
            ["Active Employees", active, "users"],
            ["Present Records", present, "clock"],
            ["Late Records", late, "clock"],
            ["Absent Records", absent, "users"],
            ["On Leave Records", onLeave, "calendar"],
            ["Approved Leave", approvedLeave, "calendar"],
            ["Pending Leave", pendingLeave, "calendar"],
            ["Total Payroll", money(payrollTotal), "wallet"],
            ["Paid Payroll", money(paidTotal), "wallet"],
            ["Pending Payroll", money(pendingTotal), "wallet"]
        ];

        return `<div class="stat-grid">${cards.map(c => `
            <article class="stat-card">
                <div class="stat-top"><span class="stat-label">${c[0]}</span><span class="stat-icon">${icon(c[2])}</span></div>
                <div class="stat-value">${escapeHTML(c[1])}</div>
                <div class="stat-note">Based on current report filter</div>
            </article>`).join("")}</div>`;
    }

    function employeeTable(data) {
        return table(
            ["Employee ID","Employee","Position","Department","Monthly Salary","Status","Date Hired"],
            data.employees.map(e => [e.id, `${e.firstName || ""} ${e.lastName || ""}`.trim(), e.position || "—", e.department || "—", money(e.salary), e.status || "—", e.dateHired || "—"]),
            "No employee records found."
        );
    }

    function attendanceTable(data) {
        return table(
            ["Date","Employee","Status","Time In","Time Out","Late","Overtime"],
            data.attendance.map(a => [a.date || "—", employeeName(a.employee, data.employees), a.status || "—", a.timeIn || "—", a.timeOut || "—", `${Number(a.late || 0)} min`, `${Number(a.overtime || 0)} min`]),
            "No attendance records found for this period."
        );
    }

    function leaveTable(data) {
        return table(
            ["Employee","Leave Type","From","To","Reason","Status"],
            data.leave.map(l => [employeeName(l.employee, data.employees), l.type || l.leaveType || "—", l.startDate || l.from || "—", l.endDate || l.to || "—", l.reason || "—", l.status || "Pending"]),
            "No leave records found for this period."
        );
    }

    function payrollTable(data) {
        return table(
            ["Employee","Pay Period","Days Worked","Basic Pay","Overtime","Allowance","Deductions","Net Pay","Status"],
            data.payroll.map(p => [employeeName(p.employee, data.employees), p.period || `${p.startDate || "—"} – ${p.endDate || "—"}`, Number(p.days || 0), money(p.basic), money(p.overtimePay), money(p.allowance), money(p.deductionsTotal), money(p.netPay), p.status || "Pending"]),
            "No payroll records found for this period."
        );
    }

    function table(headers, rows, emptyText) {
        return `<section class="panel table-panel"><div class="table-scroll"><table class="data-table">
            <thead><tr>${headers.map(h => `<th>${escapeHTML(h)}</th>`).join("")}</tr></thead>
            <tbody>${rows.length ? rows.map(row => `<tr>${row.map(v => `<td>${escapeHTML(v)}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}"><div class="empty-state"><strong>${escapeHTML(emptyText)}</strong><span>Try changing the report type or date range.</span></div></td></tr>`}</tbody>
        </table></div></section>`;
    }

    function selectedReport(data) {
        if (reportType === "employees") return employeeTable(data);
        if (reportType === "attendance") return attendanceTable(data);
        if (reportType === "leave") return leaveTable(data);
        if (reportType === "payroll") return payrollTable(data);
        return `${buildSummary(data)}<div style="height:16px"></div>${attendanceTable(data)}<div style="height:16px"></div>${leaveTable(data)}<div style="height:16px"></div>${payrollTable(data)}`;
    }

    function reportTitle() {
        return ({summary:"Management Summary",employees:"Employee Report",attendance:"Attendance Report",leave:"Leave Report",payroll:"Payroll Report"})[reportType] || "Reports";
    }

    function render() {
        const data = filteredData();
        pageActions.innerHTML = `<button class="primary-button" id="printReport">${icon("report")} Print Report</button>`;
        pageContent.innerHTML = `
            <section class="panel" style="margin-bottom:16px">
                <div class="table-toolbar">
                    <div class="toolbar-left" style="flex-wrap:wrap">
                        <select id="reportType" class="filter-select">
                            <option value="summary">Management Summary</option>
                            <option value="employees">Employee Report</option>
                            <option value="attendance">Attendance Report</option>
                            <option value="leave">Leave Report</option>
                            <option value="payroll">Payroll Report</option>
                        </select>
                        <div class="field" style="min-width:160px"><label>From</label><div class="input-wrap"><input id="reportStart" type="date" value="${escapeHTML(startDate)}"></div></div>
                        <div class="field" style="min-width:160px"><label>To</label><div class="input-wrap"><input id="reportEnd" type="date" value="${escapeHTML(endDate)}"></div></div>
                        <button class="secondary-button" id="clearReportFilter" type="button">Clear Dates</button>
                    </div>
                </div>
            </section>
            <div class="panel" style="margin-bottom:16px;padding:18px 20px">
                <span class="eyebrow">${escapeHTML(reportTitle())}</span>
                <h2 style="margin:5px 0 4px">${escapeHTML(reportTitle())}</h2>
                <p style="margin:0;color:var(--muted)">${startDate || endDate ? `Period: ${escapeHTML(startDate || "Beginning")} to ${escapeHTML(endDate || "Present")}` : "All available records"}</p>
            </div>
            <div id="reportBody">${selectedReport(data)}</div>`;

        document.getElementById("reportType").value = reportType;
        document.getElementById("reportType").addEventListener("change", e => { reportType = e.target.value; render(); });
        document.getElementById("reportStart").addEventListener("change", e => { startDate = e.target.value; if (endDate && startDate > endDate) endDate = startDate; render(); });
        document.getElementById("reportEnd").addEventListener("change", e => { endDate = e.target.value; if (startDate && endDate < startDate) startDate = endDate; render(); });
        document.getElementById("clearReportFilter").addEventListener("click", () => { startDate = ""; endDate = ""; render(); });
        document.getElementById("printReport").addEventListener("click", printReport);
    }

    function printReport() {
        const data = filteredData();
        const generated = new Date().toLocaleString("en-PH", {dateStyle:"medium",timeStyle:"short"});
        const body = selectedReport(data);
        const popup = window.open("", "_blank", "width=1200,height=800");
        if (!popup) { DD.toast("Please allow pop-ups to print the report.", "error", "Print Blocked"); return; }
        popup.document.write(`<!DOCTYPE html><html><head><title>${escapeHTML(reportTitle())}</title><style>
            *{box-sizing:border-box} body{font-family:Arial,sans-serif;color:#222;margin:28px;font-size:12px} .head{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #222;padding-bottom:12px;margin-bottom:18px}.brand{display:flex;align-items:center;gap:12px}.brand img{width:55px;height:55px;object-fit:contain}.brand h1{font-size:20px;margin:0}.brand p,.meta p{margin:3px 0;color:#555}.meta{text-align:right}.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.stat-card{border:1px solid #bbb;padding:10px}.stat-label,.stat-note,.stat-icon{display:none}.stat-value{font-size:17px;font-weight:bold}.panel{margin-top:16px}.table-scroll{overflow:visible}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #999;padding:7px;text-align:left;vertical-align:top}th{background:#eee;font-size:11px}.empty-state span{display:none}.empty-state{padding:12px}.print-footer{margin-top:28px;border-top:1px solid #aaa;padding-top:10px;color:#666}@media print{body{margin:12mm}.no-print{display:none}@page{size:A4 landscape;margin:10mm}}
        </style></head><body><div class="head"><div class="brand"><img src="img/logo.png"><div><h1>DOUGHNUT DISTURB</h1><p>Management System</p><strong>${escapeHTML(reportTitle())}</strong></div></div><div class="meta"><p>${startDate || endDate ? `Period: ${escapeHTML(startDate || "Beginning")} to ${escapeHTML(endDate || "Present")}` : "All available records"}</p><p>Generated: ${escapeHTML(generated)}</p></div></div>${body}<div class="print-footer">Generated from Doughnut Disturb Management System.</div><script>window.onload=()=>{window.print()}<\/script></body></html>`);
        popup.document.close();
    }

    window.addEventListener("dd:sync", render);
    window.addEventListener("storage", render);
    render();
});
