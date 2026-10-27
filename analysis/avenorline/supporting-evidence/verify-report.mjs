import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const fail = message => { throw new Error(message); };

async function verifyReport() {
  const pdf = path.join(root, 'avenorline-MOCK-DEFENSE-REPORT.pdf');
  if (!fs.existsSync(pdf) || fs.statSync(pdf).size < 100000) fail('final PDF is missing or unexpectedly small');
  const pdfjsPath = 'C:/Users/justi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdfjs-dist/legacy/build/pdf.mjs';
  const pdfjs = await import(pathToFileURL(pdfjsPath));
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(pdf)), disableWorker: true }).promise;
  if (doc.numPages < 10 || doc.numPages > 20) fail(`unexpected page count: ${doc.numPages}`);
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += '\n' + content.items.map(item => item.str).join(' ');
  }
  const required = [
    'One-page Panel Brief', 'System Explained Simply', 'Three Essential Flowcharts', 'Top Findings',
    'Recommended System Improvements', 'Validation and Process Correctness', 'Important JavaScript',
    'Vibe-Coding Evidence', 'QA Summary', 'Five Strongest Panel Questions',
    'Coverage, Assumptions, and Limitations', 'F-10', 'V-05'
  ];
  for (const phrase of required) if (!text.includes(phrase)) fail(`PDF text missing: ${phrase}`);
  console.log(`REPORT VERIFICATION PASSED (${doc.numPages} pages, ${fs.statSync(pdf).size} bytes)`);
}

function verifySupport() {
  const flowDir = path.join(import.meta.dirname, 'flowcharts');
  const mmd = fs.readdirSync(flowDir).filter(name => /^0\d-.*\.mmd$/.test(name));
  const svg = fs.readdirSync(flowDir).filter(name => /^0\d-.*\.svg$/.test(name));
  if (mmd.length !== 3 || svg.length !== 3) fail(`expected 3 Mermaid and 3 SVG files; got ${mmd.length}/${svg.length}`);
  for (const file of mmd) {
    const source = fs.readFileSync(path.join(flowDir, file), 'utf8');
    if (!source.includes('flowchart') || !source.includes('{') || !source.includes('([') || !source.includes('[(')) fail(`missing flowchart semantics in ${file}`);
  }
  for (const file of svg) {
    const source = fs.readFileSync(path.join(flowDir, file), 'utf8');
    if (!source.startsWith('<svg') || !source.includes('<polygon') || !source.includes('marker-end')) fail(`invalid rendered flowchart ${file}`);
  }
  const csv = fs.readFileSync(path.join(import.meta.dirname, 'qa-test-cases.csv'), 'utf8').trim().split(/\r?\n/);
  if (csv.length !== 15) fail(`expected CSV header plus 14 QA cases; got ${csv.length}`);
  const report = fs.readFileSync(path.join(import.meta.dirname, 'report-source.md'), 'utf8');
  for (const file of svg) if (!report.includes(`flowcharts/${file}`)) fail(`report does not embed ${file}`);
  const runtime = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'evidence', 'runtime-results.json'), 'utf8'));
  if (runtime.status !== 'Passed') fail('runtime evidence is not marked Passed');
  console.log('SUPPORT VERIFICATION PASSED');
}

function verifySource() {
  const manifest = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'evidence', 'source-manifest.json'), 'utf8'));
  const actualNames = fs.readdirSync(manifest.sourceRoot).filter(name => fs.statSync(path.join(manifest.sourceRoot, name)).isFile()).sort();
  const expectedNames = Object.keys(manifest.files).sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) fail('submitted file set changed');
  for (const name of expectedNames) {
    const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(manifest.sourceRoot, name))).digest('hex').toUpperCase();
    if (digest !== manifest.files[name]) fail(`submitted source changed: ${name}`);
  }
  console.log(`SOURCE INTEGRITY PASSED (${expectedNames.length} files)`);
}

const mode = process.argv[2];
if (mode === 'report') await verifyReport();
else if (mode === 'support') verifySupport();
else if (mode === 'source') verifySource();
else fail('usage: node verify-report.mjs report|support|source');
