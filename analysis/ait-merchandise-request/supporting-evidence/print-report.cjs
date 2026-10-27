const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL}=require('node:url');
const { chromium } = require('C:/Users/justi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const filename='ait-merchandise-request-MOCK-DEFENSE-REPORT';
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  try {
    const page=await browser.newPage();
    await page.goto(pathToFileURL(path.join(root,'.'+filename+'.print.html')).href);
    await page.pdf({path:path.join(root,filename+'.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font-family:Arial;font-size:8px;color:#64748b;width:100%;padding:0 45px;display:flex;justify-content:space-between"><span>AIT | Mock-defense review | 02 October 2026</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>'});
    console.log('PDF CREATED',fs.statSync(path.join(root,filename+'.pdf')).size);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
