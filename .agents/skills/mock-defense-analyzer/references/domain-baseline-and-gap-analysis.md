# Domain Capability Baseline and Gap Analysis

Use this reference to answer two different questions:

1. **What should a system of this declared type and scope reasonably be able to do?**
2. **Which of those capabilities are actually complete, partial, incorrect, missing, unverified, or outside the submitted scope?**

The baseline is a researched comparison aid, not a universal feature wishlist. Judge the submitted project against its stated users, deployment setting, jurisdiction, academic scope, and claimed level of completeness.

## Establish the baseline

1. Identify the system family, users, operating setting, main transaction, and explicit exclusions from the title, paper, UI, documentation, and code.
2. Write a narrow research question, such as: “What minimum capabilities are needed for a single-branch cash-based inventory and POS system to preserve stock and sales integrity?”
3. Research current, credible sources. Prefer, in order:
   - applicable government rules, regulations, or official public guidance;
   - recognized professional or industry standards;
   - authoritative domain organizations and technical standards bodies;
   - official platform or integration documentation for a claimed dependency;
   - reputable product documentation only as secondary evidence of common practice.
4. Extract capabilities supported by those sources. Record the source, publication or update date when available, jurisdiction or context, and the specific expectation it supports.
5. Reconcile the research with the submitted scope. A common enterprise feature is not automatically required in a student prototype.

If current web research is unavailable, do not silently rely on memory. Label the baseline **Provisional—external research not verified** and avoid compliance claims.

## Classify capability importance

- **Core:** Without it, the claimed primary workflow is incomplete, internally inconsistent, unsafe, or unable to preserve essential data/business integrity.
- **Important:** Expected for dependable real operation or explicitly valuable to the stated users, but the primary prototype can still demonstrate its central transaction without it.
- **Optional/Advanced:** Useful maturity, scale, convenience, or enterprise capability. Treat it as required only when the paper, UI, or presentation claims it.

For every classification, state its basis: **explicit requirement**, **necessary core-process dependency**, **applicable external rule/standard**, or **recommended practice**. Never use “industry standard” without a cited source.

## Compare against the submission

Use these implementation verdicts consistently:

- **Complete:** The end-to-end behavior exists and matches the scoped expectation.
- **Partial:** Part of the flow exists, but an essential step, rule, role, state change, or recovery path is absent.
- **Incorrect:** The capability exists but produces or permits materially wrong behavior.
- **Missing:** No credible implementation exists for a Core or explicitly claimed capability.
- **Not verifiable:** The paper claims it or the code suggests it, but available evidence cannot confirm behavior.
- **Not applicable / Out of scope:** The capability does not reasonably apply to the declared scope. Do not present this as a defect.

Use runtime evidence when safely available. Otherwise use exact paper sections, screens, routes, schemas, functions, and file/line references. A researched domain expectation is not proof of implemented behavior.

## Compact matrix

Use this structure in the report:

| Capability | Importance | Basis/source | Expected behavior | Actual evidence | Verdict | Effect/priority |
|---|---|---|---|---|---|---|

Light mode should normally show 5-8 high-value capabilities; Standard mode 8-15; Deep mode may include the complete applicable baseline. Prefer distinct capabilities that affect the central transaction, data integrity, authorization, reconciliation, recovery, or a major paper claim.

For every material gap, explain in plain Taglish:

- what the system should do;
- what it currently does or what evidence is absent;
- why the difference matters to users, operations, data, or security;
- whether it is a defect, incomplete scope, or future enhancement;
- one safe demonstration or verification step;
- one tailored panel question.

## Fair-critique guardrails

- Do not grade a single-user prototype as if it were a nationwide enterprise platform.
- Do not convert Optional/Advanced capabilities into defects unless the project claims them.
- Do not infer jurisdiction-specific legal compliance without verifying the applicable location and current official source.
- Do not call a feature “missing” merely because it is absent from the UI; check routes, APIs, data model, and paper claims.
- Separate **functional gap** (needed for the claimed workflow), **quality/control gap** (workflow exists but is weak), and **enhancement** (useful but not required).
- When requirements conflict with domain research, report the conflict instead of silently choosing one.

## Inventory and POS example

For a single-branch inventory and cash POS, research commonly leads to capabilities such as product/SKU management, stock receiving, finalized sales, atomic stock deduction, returns/refunds with stock reversal, authorized voids, inventory adjustments with reasons, negative-stock controls, roles, transaction history, reconciliation, and reporting. Backup/recovery and low-stock alerts are commonly Important; multi-branch synchronization is Optional unless claimed.

Example critique:

> **Returns/refunds — Incorrect.** A Return button deletes the sale but does not restore quantity or retain a reversal record. The expected process is to create an authorized return linked to the original sale, reverse the affected stock and totals, and preserve an audit trail. Safe demonstration: record the quantity and sales total, sell five units, return two, then verify stock, net sales, and the return history. If they do not reconcile, the panel can ask: “Paano ninyo mapapatunayang hindi mababago o mawawala ang sales history kapag may return?”

This example does not become the checklist for another domain. A clinic system should instead be researched around its claimed patient, appointment, clinical-record, privacy, and continuity workflows; a payroll system around employee records, time inputs, pay calculations, deductions, approvals, payslips, and applicable rules.

## Optional Jev quality gate

If an authenticated Jev CLI and the `using-jev` skill are available, use Jev only for narrow judgments after sources have been collected—for example, classifying candidate capabilities as Core/Important/Optional against explicit criteria, ranking gaps for panel value, or checking whether a written claim is supported by supplied evidence. Sanitize private source content before any external call.

Jev is not a search engine, source, or substitute for code/runtime verification. Never cite its probability as domain evidence. If it is unavailable or unauthenticated, continue with the same method without it and state no limitation solely because Jev was skipped.
