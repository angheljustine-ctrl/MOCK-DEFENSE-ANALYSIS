import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(String.raw`C:\Users\justi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\package.json`);
const {chromium}=require('playwright');
const out=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const file=path.join(out,'.SIMSIMI-MOCK-DEFENSE-REPORT.print.html');
const styled=path.join(out,'.SIMSIMI-MOCK-DEFENSE-REPORT.styled.html');
const css='body{font-size:9.2pt;line-height:1.28}h2{font-size:15pt;margin:5mm 0 2.5mm}h3{font-size:11.5pt;margin:3.2mm 0 1.6mm}p{margin-bottom:2.3mm}table{font-size:8.1pt;margin:2mm 0 3mm;line-height:1.23}th,td{padding:1.25mm 1.7mm}pre{padding:2.5mm;font-size:8pt;margin:2mm 0}img.half-diagram{max-height:88mm;margin:1mm auto 2mm}img{margin:2mm auto 3mm}ul,ol{margin-bottom:2mm}li{margin-bottom:.8mm}';
const {marked}=await import(pathToFileURL(String.raw`C:\Users\justi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\marked\lib\marked.esm.js`).href);
const body=marked.parse(fs.readFileSync(path.join(out,'supporting-evidence','report-source.md'),'utf8')).replace(/<h1[^>]*>[\s\S]*?<\/h1>/i,'');
fs.writeFileSync(styled,fs.readFileSync(file,'utf8').replace(/<main>[\s\S]*?<\/main>/,'<main>'+body+'</main>').replace('</style>',css+'</style>'));
const browser=await chromium.launch({executablePath:String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,headless:true});
try{
 const page=await browser.newPage({javaScriptEnabled:false});
 await page.goto(pathToFileURL(styled).href,{waitUntil:'load'});
 await page.pdf({path:path.join(out,'SIMSIMI-MOCK-DEFENSE-REPORT.pdf'),preferCSSPageSize:true,printBackground:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font:8px Arial; width:100%;text-align:center;color:#5b6475">EDUCORE SIMS | Mock defense review | <span class="pageNumber"></span> / <span class="totalPages"></span></div>'});
 console.log('PDF_RENDERED');
}finally{await browser.close()}
