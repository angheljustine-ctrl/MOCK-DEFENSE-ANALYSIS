# Mock Defense Analysis Workspace

- For requests to inspect, explain, test, audit, or prepare panel questions about a system or capstone paper in this workspace, use the `mock-defense-analyzer` skill in `.agents/skills/mock-defense-analyzer/`, even when the user does not type `$mock-defense-analyzer`.
- Treat the submitted system as read-only unless the user explicitly asks for fixes. Do not add dependencies to, seed, migrate, or destructively test the submitted system without specific authorization.
- Put generated artifacts under the workspace-level `analysis/<system-name>/`. When the submitted app is a subfolder, never place reports inside that app; when the app occupies the workspace root, keep using `analysis/` but exclude it from source review, build inputs, and findings.
- Write reports in clear, respectful Taglish: plain-language explanation first, technical evidence second. Use exact file and line references where available.
- Separate confirmed runtime results, code-evidenced observations, assumptions, and items that could not be tested. Never present vibe-coding indicators as proof of AI authorship.
