# System Improvements and Vibe-Coding Evidence

Keep these as two separate report sections with different purposes.

## Recommended system improvements

This section answers: **What should the product or operational process add, remove, or change?** It is not a patch plan and must not be written as replacement code.

For every recommendation include:

- **Current condition:** the user/business problem now.
- **Add or change:** the capability, control, workflow, role, recovery mechanism, or UX behavior the system needs.
- **Intended process:** how users and the system should behave after the improvement.
- **Benefit:** the practical security, integrity, usability, or operational result.
- **Priority:** Critical, High, Medium, or Later.
- **Success indicator:** an observable outcome showing the improvement works.

Good subjects include first-time setup, complete feature lifecycle, roles and permissions, approval/status workflows, transaction/reversal processes, protected sharing, audit trails, reconciliation, backup/recovery, duplicate prevention, clear errors, accessibility, and operational monitoring.

Do not fill this section with class names, replacement functions, code diffs, or dependency upgrade commands. Technical remediation may be summarized in findings, but the improvement roadmap must stay understandable to a panelist and system owner.

## Vibe-coding evidence

This section answers: **Which exact code shows incomplete integration, copy/paste residue, happy-path-only logic, or unverified assumptions?** It provides evidence of implementation risk, never proof of who or what authored the code.

Use only the strongest 4-6 distinct indicators in Standard mode. Every indicator must contain:

1. **Location:** exact file and line range.
2. **Function/responsibility:** named function when available; otherwise route config, schema, component, setup routine, or other code role.
3. **Evidence code:** a minimal exact excerpt, usually 3-12 lines. Do not dump whole files.
4. **What it does:** plain-language function explanation.
5. **Why it is a signal:** the concrete inconsistency or missing verification.
6. **System effect:** what a user, operator, or data flow experiences.
7. **Confidence:** Low, Medium, or High.

Strong signals include a route referencing an undeclared page, setup requiring a missing model, frontend fields absent from the backend schema, impossible type checks, default/demo behavior mixed into production logic, and business validation that covers only the happy path.

Do not add speculative stylistic complaints when a stronger functional mismatch exists. Do not provide replacement code in this section; the purpose is evidence and explanation.
