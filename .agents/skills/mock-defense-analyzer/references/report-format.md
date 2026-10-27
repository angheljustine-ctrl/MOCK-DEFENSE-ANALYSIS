# Report and Artifact Format

Write for a panelist who needs a fast overview first and technical evidence on demand. Default to Taglish unless the user requests another language.

## Primary output and location

Create `analysis/<system-name>/` at the analysis-workspace level. If the submitted app is a child folder, this keeps output outside it. If the app itself occupies the workspace root, exclude `analysis/` from source review and build inputs:

- `<system-name>-MOCK-DEFENSE-REPORT.pdf` — the only primary deliverable; it must be understandable without opening another file.
- `supporting-evidence/report-source.md` — canonical editable source used to build the PDF.
- `supporting-evidence/qa-test-cases.csv` — optional machine-sortable QA inventory; reproduce its useful content inside the PDF appendix.
- `supporting-evidence/flowcharts/` — editable `.mmd`, rendered `.svg`, and temporary preview images.
- `supporting-evidence/evidence/` — only useful manifests or captured outputs; do not copy secrets, dependency folders, or unnecessary logs.

Do not ask the user to open the Markdown, CSV, diagrams, and evidence individually. Link or cite only the final PDF unless the user requests raw artifacts.

Use the PDF skill's create/render/verify workflow when available. `scripts/build-report-pdf.mjs` can convert the canonical Markdown and append QA/evidence data. Keep the final filename stable and descriptive.

## Evidence vocabulary

- **Confirmed:** Reproduced or directly observed at runtime.
- **Code-evidenced:** Supported by exact source code but not runtime verified.
- **Suspected:** A plausible risk requiring another check.
- **Not testable:** Blocked by missing access, credentials, dependency, data, or environment.

Never silently upgrade one evidence level to another.

## Severity

- **Critical:** Likely severe compromise, destructive data loss, or complete control/bypass.
- **High:** Major authorization, privacy, integrity, or core-process failure.
- **Medium:** Material functional, validation, resilience, or maintainability problem.
- **Low:** Limited impact, usability issue, or minor hardening opportunity.
- **Info:** Observation with no demonstrated defect.

Severity describes impact and likelihood; confidence describes strength of evidence. Keep them separate.

## User-friendly Standard PDF order

1. **Cover.**
2. **One-page panel brief:** What the system does, readiness verdict, top strengths, top five risks, and QA counts.
3. **System explained simply:** Actors, modules, overall function, technology, and data movement.
4. **Paper-to-system traceability, when papers are supplied:** Highest-value claims, paper page/section, implementation evidence, verdict, and effect. Keep it concise in Light/Standard mode.
5. **Domain capability baseline and gap matrix:** What this type and scope of system reasonably needs, research basis, and what is complete, partial, incorrect, missing, not verifiable, or out of scope. Keep Standard mode to 8-15 high-value capabilities.
6. **Three essential flowcharts:** Overall system, main transaction, and riskiest security/validation flow.
7. **Top findings:** Compact plain-language finding cards; do not repeat a separate 18-row risk table.
8. **Recommended system improvements:** Product/process capabilities to add or change, derived from material gaps and findings rather than repeating the gap matrix.
9. **Validation and process correctness:** One compact matrix.
10. **Important JavaScript/TypeScript:** Responsibility, function, and user-visible effect; avoid duplicating finding prose.
11. **Vibe-coding evidence:** Exact short code excerpts with location, function/responsibility, signal, effect, and confidence.
12. **QA summary:** Counts plus 10-15 distinct high-value tests; no full repetitive test-card dump in Standard mode.
13. **Five panel questions:** Strong-answer guide, follow-up, and red flags.
14. **Coverage, assumptions, limitations, research sources, and compact evidence summary.**

## Plain-language finding block

Lead with a short version a non-developer can use during defense:

- **Problema:** what is wrong.
- **Saan:** affected module/flow.
- **Paano mabubutas:** safe, local reproduction or bypass explanation.
- **Effect:** user, business, data, or security consequence.
- **Ayusin:** smallest effective improvement.
- **Panel question:** one evidence-based question.

Put exact files/lines, confidence, and detailed verification after this plain-language block, not before it.

## Standard-mode size discipline

- Target 10-15 A4 pages. A small overflow is acceptable only for readability or materially distinct evidence; never preserve bulk merely because it already exists.
- Prefer 8-12 distinct findings and 10-15 high-value QA cases. Exceed these only when the extra item represents a materially different risk.
- Prefer exactly 3 readable diagrams in Standard mode. Combine closely related flows instead of creating one diagram per function.
- Keep the five most valuable panel questions in a highlighted quick-reference section.
- Use concise Taglish, define technical terms on first use, and avoid repeating the same issue in the summary, finding, QA case, and recommendation.
- Use color-coded severity, “Expected vs Actual,” and short “What this means” callouts.
- Omit repetitive QA cards, full command logs, full execution-evidence tables, renderer details, and supporting-file instructions from the Standard PDF.
- Keep source references once per finding or vibe-coding indicator instead of repeating them under every summary.
- When papers are supplied, cite the relevant paper page or section once per material claim. Do not reproduce long passages or inflate the PDF with a chapter-by-chapter summary.
- Cite the research source supporting each disputed or non-obvious domain expectation. A short shared citation may support several related capabilities; do not repeat full URLs in every row.

## Finding format

For every material finding include:

- ID and short title.
- Severity, confidence, and evidence status.
- Affected role, module, data, and exact location.
- What the relevant function or flow is supposed to do.
- Evidence and safe reproduction steps.
- Expected versus actual result.
- User/business/security effect.
- Smallest effective improvement and a verification test.
- A related panel question when useful.

## Supporting QA CSV columns

Use UTF-8 and this column order:

`Test ID,Module,Category,Preconditions,Steps,Test Data,Expected Result,Actual Result,Status,Evidence,Severity,Source Reference,Notes`

Statuses are `Passed`, `Failed`, `Blocked`, or `Not Run`.

## Panel questions

Group questions into system understanding, function/flow, JavaScript, database, validation, authorization/security, testing, and design tradeoffs. For each question provide:

- Why the panel should ask it.
- What a strong answer should cover.
- One evidence-based follow-up.
- Red flags in the answer.

End with the five highest-value questions for limited defense time. Include a one- or two-sentence strong-answer guide so the PDF can function as a defense reviewer without another document.
