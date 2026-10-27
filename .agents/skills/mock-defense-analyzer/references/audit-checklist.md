# Audit Checklist

Use the sections relevant to the requested scope. For a full review, cover every section and state what was not applicable or not testable.

## 1. System and process map

- Purpose, intended users, actors, roles, modules, and primary data entities.
- Entry points, routes/screens, APIs, controllers/services, storage, and external integrations.
- Intended process versus implemented process, including missing, reordered, duplicated, or skippable steps.
- State transitions and whether invalid transitions can be forced through direct requests.
- Failure behavior: retry, rollback, partial writes, duplicate submission, and recovery.

## 2. Domain capability baseline and gap critique

- Declared system type, users, operating setting, central transaction, scope boundaries, and claimed maturity.
- Current authoritative or credible sources supporting the applicable domain expectations.
- Core, Important, and Optional/Advanced capability classification with an explicit basis.
- Complete, Partial, Incorrect, Missing, Not verifiable, and Not applicable implementation verdicts.
- Functional gaps, quality/control gaps, and enhancements kept separate.
- Real-world effect, safe verification, priority, and tailored panel question for each material gap.
- Applicable jurisdiction and date checked before making regulatory or compliance claims.

## 3. JavaScript and TypeScript

For each important `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, or `.tsx` area, identify:

- Framework/library and why it is used.
- Event handlers, routing, state management, DOM/UI behavior, API calls, storage, authentication, and validation.
- Important function purpose, inputs, outputs, call sites, side effects, and user-visible effect.
- Async behavior: awaited work, races, stale state, duplicate requests, swallowed errors, and loading/error states.
- Security-sensitive behavior: unsafe HTML, dynamic code execution, client-held secrets, token storage, redirects, and trust in client values.
- Dead, duplicated, unreachable, placeholder, or inconsistent code.

## 4. Validation coverage matrix

Inventory each input and mutation path across these layers:

| Field/action | UI constraint | Client validation | Server validation | Database constraint | Authorization | Error feedback | Coverage |
|---|---|---|---|---|---|---|---|

Check where applicable:

- Required/optional rules, type, format, normalization, whitespace, length, range, dates/time zones, and enumerated values.
- Cross-field and business rules, uniqueness, foreign keys, record ownership, duplicate submissions, and concurrency.
- Files: type, extension, MIME, size, filename/path, content, storage location, and download authorization.
- Authentication, session expiry, logout invalidation, password handling, reset flows, and account enumeration.
- Role and object-level authorization on every server-side read/write path; never count hidden buttons as authorization.
- Query/body/path/header tampering and direct API calls that bypass client validation.
- Encoding and injection risks: XSS, SQL/NoSQL injection, command/path injection, unsafe deserialization, CSRF, and open redirects.
- Error messages, logging, sensitive-data exposure, retry behavior, and rate/abuse controls.

## 5. QA design and execution

Prioritize critical journeys and risky boundaries. Include:

- Happy path and realistic alternate flows.
- Missing, malformed, minimum, maximum, just-below, and just-above boundary values.
- Duplicate, replayed, rapid, concurrent, interrupted, offline, timeout, and partial-failure behavior.
- Anonymous user, wrong role, wrong owner, expired session, and direct endpoint access.
- Create/read/update/delete consistency, search/filter/sort/pagination, and reporting/export accuracy.
- Database integrity, transactions, cascading behavior, audit trail, and recovery after failure.
- Browser/device/accessibility checks when they materially affect the system.

Do not mark a test Passed without observable evidence. Use Blocked when prerequisites are unavailable and Not Run when execution was outside scope.

## 6. Loopholes and process weaknesses

Look for bypassable approvals, editable trusted values, predictable identifiers, missing ownership checks, client-only rules, unprotected endpoints, insecure defaults, duplicate transactions, inconsistent state, hidden-but-callable features, exposed secrets, excessive permissions, and weak recovery logic.

For each issue record the precondition, safe reproduction, expected versus actual behavior, impact, affected roles/data, evidence, severity, confidence, and smallest effective remediation.

## 7. Vibe-coding indicators

Treat these as maintainability or correctness signals, never authorship proof:

- Inconsistent naming, architecture, error shapes, or coding style without a clear boundary.
- Copy-pasted logic, unused imports/functions/routes, dead features, placeholder text, and mismatched comments.
- Happy-path-only implementation, UI-only validation, broad exception swallowing, fake success states, and missing loading/error handling.
- Libraries added for trivial tasks, overlapping dependencies, copied examples left unchanged, or configuration that does not match the deployed flow.
- Frontend features with no backend support, backend endpoints with no consumer, schema/UI mismatch, and tests that assert implementation trivia instead of behavior.

Explain the function of the affected code, the observable effect, why it is a signal, how to verify it, and how to improve it. Assign Low/Medium/High confidence.

## 8. Additional quality checks

- Role-permission matrix and trust boundaries.
- Sensitive-data lifecycle, retention, privacy, logs, exports, and backups.
- Dependency and secret exposure checks using already available tools; do not install scanners into the submitted project by default.
- Accessibility, usability, performance, resilience, observability, and maintainability when relevant.
- Traceability from requirement to feature, code, validation, test, and finding.
