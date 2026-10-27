DOUGHNUT DISTURB - OVERALL MANAGEMENT SYSTEM
=============================================

Frontend-only HTML/CSS/JavaScript management system.

FILES
-----
index.html
dashboard.html
employees.html
attendance.html
payroll.html
products.html
admins.html
create-account.html
about.html
settings.html

css/style.css
css/responsive.css

js/app.js
js/auth.js
js/dashboard.js
js/employees.js
js/attendance.js
js/payroll.js
js/products.js
js/admins.js
js/about.js
js/settings.js

img/logo.png
img/bg (2).png

SETUP
-----
1. Put your existing logo at img/logo.png
2. Put your existing theme wallpaper at img/bg (2).png
3. Open index.html in a browser.
4. Demo login:
   Username: admin
   Password: admin123

AUTHENTICATION WARNING
----------------------
Authentication is DEMO ONLY. Session and records use localStorage.
Do not use the hard-coded frontend password in production.
Replace session checks and CRUD functions with secure backend/API calls.

DATA
----
Employees, attendance, payroll, products, administrators, notifications,
activities, profile and theme preference persist in localStorage.

THEME
-----
Warm mode is the default.
Dark mode is available in Settings and persists after refresh.

BACKEND ROADMAP
---------------
Recommended future endpoints:
POST /api/auth/login
POST /api/auth/logout
GET/POST/PUT/DELETE /api/employees
GET/POST/PUT/DELETE /api/attendance
GET/POST/PUT/DELETE /api/payroll
GET/POST/PUT/DELETE /api/products
GET/POST/PUT/DELETE /api/admins
GET/PUT /api/profile
POST /api/auth/change-password

Use server-side sessions/JWT, hashed passwords, role-based authorization,
CSRF protection where applicable, server-side validation, and a real database.


FUNCTIONAL IMPROVEMENTS APPLIED
--------------------------------
- Added Admin vs Crew/Employee role-based access control in the frontend.
- Admin accounts have create/read/update/delete access; Crew/Employee accounts are view-only.
- Added Employee ID linking for Crew accounts and account status validation.
- Add Account, Add/Edit Employee and Add/Edit Payroll use a right-side slide-in drawer while preserving the existing visual system.
- Added realtime synchronization between pages/tabs using localStorage storage events and same-tab custom data events.
- Dashboard statistics recalculate from stored data instead of hardcoded dynamic values.
- Notifications now support unread/read state, individual delete, Clear All, realtime badge/count updates and persistent deletion.
- Added duplicate prevention for usernames/emails, Employee IDs, and payroll employee/period combinations.
- Added payroll fields for overtime minutes/pay, bonus, late/absence/other deductions, gross pay, total deductions and net pay.
- Added confirmation before deletions and synchronized removal of an employee's related attendance/payroll records.
- Crew accounts are limited to their linked employee's employee/attendance/payroll views where applicable.

SECURITY NOTE
-------------
This project is still a frontend-only localStorage application. Frontend role checks can enforce the requested behavior in the UI, but they are NOT a security boundary because a browser user can inspect/modify localStorage or JavaScript. For production, move authentication, authorization, validation and CRUD operations to a server/API with a real database, hashed passwords, server-side RBAC, secure sessions/JWT, CSRF protection and audit logging.


CURRENT SYSTEM FLOW
-------------------
Dashboard -> Employees -> Attendance -> Payroll -> Products -> Admin Management -> Create Account -> System Information -> Settings
The order follows the main business workflow while preserving the existing visual theme.

REAL-TIME HEADER
----------------
The inner system now displays a live Philippine local time and date beside Notifications. The clock updates every second.
