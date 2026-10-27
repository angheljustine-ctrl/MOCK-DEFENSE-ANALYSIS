import fs from 'node:fs';
import path from 'node:path';
const root='D:/MOCK DEFENSE ANALYSIS/tmp/hirazora-intake-20261003/SYSTEM /hirazora';
for(const spec of process.argv.slice(2)){
 const [file,range]=spec.split(':');const lines=fs.readFileSync(path.join(root,file),'utf8').split(/\r?\n/);
 console.log('\nFILE '+file);
 if(range){const [a,b]=range.split('-').map(Number);lines.forEach((line,i)=>{if(i+1>=a&&i+1<=b&&line.trim())console.log(`${i+1} ${line}`)});}
 else {lines.forEach((line,i)=>{if(/^(?:async )?function |^\s+function [A-Za-z]|password|sessionStorage|localStorage\.setItem|JSON\.parse|fetch\(|<\?php/.test(line))console.log(`${i+1} ${line.trim()}`)})}
}
