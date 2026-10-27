import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";

const root = import.meta.dirname;
const source = path.join(root, "report-source.md");
const pdf = path.join(root, "..", "EMPLOYEE-MANAGEMENT-AND-PAYROLL-SYSTEM-MOCK-DEFENSE-REPORT.pdf");
const mode = process.argv[2];
const fail = (message) => { console.error(message); process.exit(1); };
const requireText = (text, value) => { if (!text.includes(value)) fail(`Missing required section: ${value}`); };

if (mode === "source") {
  const text = fs.readFileSync(source, "utf8");
  ["One-page panel brief", "System explained simply", "Three essential flowcharts", "Top findings", "Recommended system improvements", "Validation review and process correctness", "Important JavaScript", "Vibe-coding evidence", "QA summary", "Five strongest panel questions", "Coverage, assumptions, and limitations"].forEach((heading) => requireText(text, heading));
  const findings = new Set([...text.matchAll(/^### F-(\d{2}):/gm)].map((match) => match[1]));
  const questions = new Set([...text.matchAll(/^### Q([1-5]):/gm)].map((match) => match[1]));
  const charts = [...text.matchAll(/<img class="half-diagram" src="flowcharts\/[^"]+\.svg"/g)].length;
  const refs = [...text.matchAll(/js\/[A-Za-z]+\.js:\d+/g)].length;
  const qaLines = fs.readFileSync(path.join(root, "qa-test-cases.csv"), "utf8").trim().split(/\r?\n/).length - 1;
  if (findings.size < 8 || findings.size > 12) fail(`Finding count out of range: ${findings.size}`);
  if (questions.size !== 5) fail(`Question count is ${questions.size}, expected 5`);
  if (charts !== 3) fail(`Flowchart count is ${charts}, expected 3`);
  if (qaLines < 10 || qaLines > 15) fail(`QA count out of range: ${qaLines}`);
  if (refs < 20) fail(`Too few exact JavaScript references: ${refs}`);
  console.log("SOURCE REPORT VERIFIED");
} else if (mode === "pdf") {
  if (!fs.existsSync(pdf) || fs.statSync(pdf).size < 100000) fail("Final PDF is missing or unexpectedly small");
  const poppler = path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "native", "poppler", "Library", "bin");
  const info = spawnSync(path.join(poppler, "pdfinfo.exe"), [pdf], {encoding:"utf8"});
  if (info.status !== 0) fail(info.stderr || "pdfinfo failed");
  const pageMatch = info.stdout.match(/^Pages:\s+(\d+)/m);
  const pages = pageMatch ? Number(pageMatch[1]) : 0;
  if (pages < 10 || pages > 15) fail(`PDF page count out of range: ${pages}`);
  const python = path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe");
  const extract = spawnSync(python, ["-c", "from pypdf import PdfReader; import sys; print('\\n'.join((p.extract_text() or '') for p in PdfReader(sys.argv[1]).pages))", pdf], {encoding:"utf8", maxBuffer:10 * 1024 * 1024});
  if (extract.status !== 0) fail(extract.stderr || "PDF text extraction failed");
  const text = extract.stdout;
  ["One-page panel brief", "Overall actual system flow", "Payroll generation flow", "Authentication and authorization risk", "Vibe-coding evidence", "Five strongest panel questions"].forEach((value) => requireText(text, value));
  console.log("FINAL PDF VERIFIED");
} else fail("Usage: node verify-report.mjs source|pdf");
