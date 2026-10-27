#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

function die(message) {
  console.error(`build-report-pdf: ${message}`);
  process.exit(1);
}

function argsToObject(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) die(`unexpected argument: ${key}`);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) die(`missing value for ${key}`);
    result[key.slice(2)] = value;
    i += 1;
  }
  return result;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted && char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === ',') { row.push(field); field = ''; }
    else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
    } else field += char;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function qaAppendix(csvPath) {
  if (!csvPath) return '';
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  if (rows.length < 2) return '';
  const header = rows[0];
  const index = Object.fromEntries(header.map((name, i) => [name, i]));
  const value = (row, name) => escapeHtml(row[index[name]] ?? '');
  const cards = rows.slice(1).map((row) => {
    const status = row[index.Status] || 'Not Run';
    const severity = row[index.Severity] || 'Info';
    return `<article class="qa-card">
      <div class="qa-head"><h3>${value(row, 'Test ID')} - ${value(row, 'Module')}</h3>
        <span class="badge ${status.toLowerCase().replaceAll(' ', '-')}">${escapeHtml(status)}</span>
        <span class="badge sev-${severity.toLowerCase()}">${escapeHtml(severity)}</span></div>
      <p><strong>Category:</strong> ${value(row, 'Category')}</p>
      <p><strong>Test:</strong> ${value(row, 'Steps')} <strong>Data:</strong> ${value(row, 'Test Data')}</p>
      <p><strong>Expected:</strong> ${value(row, 'Expected Result')}</p>
      <p><strong>Actual:</strong> ${value(row, 'Actual Result')}</p>
      <p class="evidence"><strong>Evidence:</strong> ${value(row, 'Evidence')} | <strong>Source:</strong> ${value(row, 'Source Reference')}</p>
    </article>`;
  }).join('\n');
  return `<section class="appendix page-break"><h1>QA Test Case Appendix</h1><p class="section-lead">Complete evidence-aware test inventory. Passed means observed; Blocked and Not Run are not treated as success.</p>${cards}</section>`;
}

function evidenceAppendix(jsonPath) {
  if (!jsonPath) return '';
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const rows = (data.checks || []).map((check) => `<tr><td>${escapeHtml(check.id)}</td><td>${escapeHtml(check.name)}</td><td>${escapeHtml(check.status)}</td><td>${escapeHtml(check.result)}</td><td>${escapeHtml(check.detail)}</td></tr>`).join('\n');
  return `<section class="appendix page-break"><h1>Execution Evidence Summary</h1><table><thead><tr><th>ID</th><th>Check</th><th>Evidence type</th><th>Result</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table></section>`;
}

async function loadMarked(nodeModulesArg) {
  const candidates = [
    nodeModulesArg,
    process.env.CODEX_NODE_MODULES,
    path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules'),
  ].filter(Boolean);
  for (const root of candidates) {
    const esm = path.join(root, 'marked', 'lib', 'marked.esm.js');
    if (fs.existsSync(esm)) return (await import(pathToFileURL(esm).href)).marked;
  }
  try {
    const require = createRequire(import.meta.url);
    return require('marked').marked;
  } catch {
    die('marked was not found; pass --node-modules using the bundled workspace dependency path');
  }
}

function findBrowser(explicit) {
  const candidates = [
    explicit,
    process.env.BROWSER_EXECUTABLE,
    process.platform === 'win32' ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' : null,
    process.platform === 'win32' ? 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe' : null,
    process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : null,
  ].filter(Boolean);
  for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;
  const names = process.platform === 'win32' ? ['msedge.exe', 'chrome.exe'] : ['google-chrome', 'chromium', 'chromium-browser'];
  for (const name of names) {
    const probe = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', [name], { encoding: 'utf8' });
    const found = probe.status === 0 ? probe.stdout.trim().split(/\r?\n/)[0] : '';
    if (found && fs.existsSync(found)) return found;
  }
  die('Edge or Chrome was not found; pass --browser with an executable path');
}

const args = argsToObject(process.argv.slice(2));
if (!args.input || !args.output) die('usage: --input report.md --output report.pdf [--qa-csv file] [--evidence-json file] [--node-modules dir] [--browser exe]');

const input = path.resolve(args.input);
const output = path.resolve(args.output);
if (!fs.existsSync(input)) die(`input does not exist: ${input}`);
if (path.extname(output).toLowerCase() !== '.pdf') die('output must end in .pdf');
for (const optional of ['qa-csv', 'evidence-json']) {
  if (args[optional] && !fs.existsSync(path.resolve(args[optional]))) die(`${optional} does not exist: ${args[optional]}`);
}

const markdown = fs.readFileSync(input, 'utf8');
const title = (markdown.match(/^#\s+(.+)$/m) || [null, path.basename(input, path.extname(input))])[1].trim();
const reviewDate = (markdown.match(/\*\*Review date:\*\*\s*([^\n]+)/i) || [null, ''])[1].trim();
const marked = await loadMarked(args['node-modules']);
let body = marked.parse(markdown, { gfm: true, breaks: false });
body = body.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '');

const base = `${pathToFileURL(path.dirname(input)).href.replace(/\/$/, '')}/`;
const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${base}"><title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 13mm 12mm 15mm; }
  :root { --ink:#172033; --muted:#5b6475; --blue:#125e8a; --pale:#eef7fb; --line:#d7dde7; --critical:#a61b1b; --high:#c24f12; --medium:#9a6b00; --ok:#1d7a46; }
  * { box-sizing:border-box; }
  body { margin:0; color:var(--ink); font-family:"Segoe UI",Arial,sans-serif; font-size:9.7pt; line-height:1.42; }
  .cover { height:255mm; display:flex; flex-direction:column; justify-content:center; padding:24mm 18mm; background:linear-gradient(145deg,#0b2942 0%,#125e8a 62%,#1f7fa8 100%); color:white; page-break-after:always; page-break-inside:avoid; }
  .cover .kicker { font-size:11pt; font-weight:700; letter-spacing:1.8px; text-transform:uppercase; color:#bde8f8; }
  .cover h1 { font-size:32pt; line-height:1.12; margin:10mm 0 7mm; color:white; border:0; page-break-before:avoid !important; break-before:avoid !important; }
  .cover .subtitle { font-size:15pt; max-width:145mm; color:#e3f5fc; }
  .cover .meta { margin-top:25mm; padding-top:7mm; border-top:1px solid rgba(255,255,255,.38); font-size:10.5pt; }
  main { max-width:100%; }
  h1 { color:#0b3654; font-size:22pt; line-height:1.15; margin:0 0 7mm; padding-bottom:3mm; border-bottom:2px solid #2e89b5; page-break-before:always; }
  main > h2:first-child, main > p:first-child { page-break-before:avoid; }
  h2 { color:#125e8a; font-size:16pt; margin:8mm 0 3mm; page-break-after:avoid; }
  h3 { color:#263a53; font-size:12.5pt; margin:5mm 0 2mm; page-break-after:avoid; }
  h4 { font-size:10.5pt; margin:4mm 0 1.5mm; }
  p { margin:0 0 3mm; }
  ul,ol { margin:1mm 0 3mm 6mm; padding-left:5mm; }
  li { margin-bottom:1.2mm; }
  strong { color:#142d46; }
  code { font-family:Consolas,monospace; font-size:8.8pt; background:#eef1f5; padding:.2mm 1mm; border-radius:2px; overflow-wrap:anywhere; }
  pre { white-space:pre-wrap; background:#172033; color:#eef7fb; padding:4mm; border-radius:4px; font-size:8.4pt; page-break-inside:avoid; }
  pre code { background:transparent; color:#f8fafc; padding:0; border-radius:0; font-size:inherit; overflow-wrap:normal; }
  blockquote { margin:4mm 0; padding:3mm 4mm; background:#fff8df; border-left:4px solid #d59a13; color:#4b3c16; }
  table { width:100%; border-collapse:collapse; margin:3mm 0 5mm; font-size:8.1pt; page-break-inside:auto; }
  thead { display:table-header-group; }
  tr { page-break-inside:avoid; }
  th { background:#125e8a; color:white; text-align:left; font-weight:700; }
  th,td { border:1px solid var(--line); padding:1.8mm 2mm; vertical-align:top; overflow-wrap:break-word; word-break:normal; }
  tbody tr:nth-child(even) { background:#f6f8fb; }
  img { display:block; max-width:100%; max-height:178mm; object-fit:contain; margin:4mm auto 6mm; page-break-inside:avoid; }
  img.half-diagram { max-height:92mm; margin:2mm auto 3mm; }
  hr { border:0; border-top:1px solid var(--line); margin:7mm 0; }
  a { color:#125e8a; text-decoration:none; }
  .page-break { page-break-before:always; }
  .section-lead { color:var(--muted); font-size:10.5pt; }
  .qa-card { border:1px solid var(--line); border-left:4px solid #2e89b5; border-radius:3px; padding:3mm 3.5mm; margin:0 0 3mm; page-break-inside:avoid; }
  .qa-card p { margin:1mm 0; font-size:8.5pt; }
  .qa-card .evidence { color:var(--muted); font-size:7.8pt; }
  .qa-head { display:flex; align-items:center; gap:2mm; margin-bottom:1mm; }
  .qa-head h3 { flex:1; margin:0; font-size:10.5pt; }
  .badge { display:inline-block; padding:.5mm 1.8mm; border-radius:10px; font-size:7.3pt; font-weight:700; color:white; background:#64748b; }
  .badge.passed { background:var(--ok); }.badge.failed,.badge.sev-critical { background:var(--critical); }.badge.blocked,.badge.not-run { background:#64748b; }
  .badge.sev-high { background:var(--high); }.badge.sev-medium { background:var(--medium); }.badge.sev-low,.badge.sev-info { background:#39769a; }
  .appendix h1 { page-break-before:always; }
</style></head><body>
<section class="cover"><div class="kicker">Consolidated Mock-Defense Report</div><h1>${escapeHtml(title)}</h1><p class="subtitle">System flow, JavaScript, validation, QA, loopholes, vibe-coding indicators, panel questions, and improvements in one reviewer-friendly document.</p><div class="meta">${reviewDate ? `Review date: ${escapeHtml(reviewDate)}<br>` : ''}Evidence-aware analysis - Confirmed, code-evidenced, suspected, and blocked results remain distinct.</div></section>
<main>${body}${qaAppendix(args['qa-csv'] ? path.resolve(args['qa-csv']) : '')}${evidenceAppendix(args['evidence-json'] ? path.resolve(args['evidence-json']) : '')}</main>
</body></html>`;

fs.mkdirSync(path.dirname(output), { recursive: true });
const tempHtml = path.join(path.dirname(output), `.${path.basename(output, '.pdf')}.print.html`);
fs.writeFileSync(tempHtml, html, 'utf8');
const browser = findBrowser(args.browser);
const run = spawnSync(browser, [
  '--headless', '--disable-gpu', '--disable-javascript', '--no-pdf-header-footer', '--user-data-dir=D:/MOCK DEFENSE ANALYSIS/tmp/hirazora-pdf-profile-'+Date.now(),
  `--print-to-pdf=${output}`, pathToFileURL(tempHtml).href,
], { encoding: 'utf8', timeout: 120000 });
if (run.status !== 0 || !fs.existsSync(output) || fs.statSync(output).size === 0) {
  die(`browser PDF generation failed\n${run.stderr || run.stdout || ''}`);
}
fs.rmSync(tempHtml, { force: true });
console.log(`PDF CREATED: ${output} (${fs.statSync(output).size} bytes)`);


