import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.dirname(fileURLToPath(import.meta.url));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const wrap = (text, width = 24) => {
  const words = text.split(/\s+/), lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > width && line) { lines.push(line); line = word; }
    else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  return lines;
};
const textSvg = (x, y, label, width = 24) => wrap(label, width).map((line, i, all) =>
  `<text x="${x}" y="${y + (i - (all.length - 1) / 2) * 17}" text-anchor="middle" dominant-baseline="middle">${esc(line)}</text>`
).join('');
const arrow = (x1, y1, x2, y2, label = '') => `<path d="M${x1},${y1} L${x2},${y2}" class="arrow"/>${label ? `<text x="${(x1+x2)/2}" y="${(y1+y2)/2-7}" class="edge">${esc(label)}</text>` : ''}`;
const node = ({x,y,w=190,h=64,label,type='process',risk=false}) => {
  const cls = `node ${risk ? 'risk' : ''}`;
  if (type === 'terminal') return `<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="${h/2}" class="${cls}"/>${textSvg(x,y,label)}`;
  if (type === 'decision') return `<polygon points="${x},${y-h/2} ${x+w/2},${y} ${x},${y+h/2} ${x-w/2},${y}" class="${cls}"/>${textSvg(x,y,label,18)}`;
  if (type === 'store') return `<path d="M${x-w/2},${y-h/2+10} Q${x},${y-h/2-10} ${x+w/2},${y-h/2+10} L${x+w/2},${y+h/2-10} Q${x},${y+h/2+10} ${x-w/2},${y+h/2-10} Z" class="${cls}"/>${textSvg(x,y,label)}`;
  if (type === 'io') return `<polygon points="${x-w/2+20},${y-h/2} ${x+w/2},${y-h/2} ${x+w/2-20},${y+h/2} ${x-w/2},${y+h/2}" class="${cls}"/>${textSvg(x,y,label)}`;
  return `<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="8" class="${cls}"/>${textSvg(x,y,label)}`;
};
const svg = (title, nodes, arrows) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
<defs><marker id="end" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#36566f"/></marker></defs>
<style>text{font:14px 'Segoe UI',Arial,sans-serif;fill:#172033}.title{font-size:26px;font-weight:700;fill:#0b3654}.node{fill:#eef7fb;stroke:#125e8a;stroke-width:2}.risk{fill:#fff0f0;stroke:#b42318}.arrow{fill:none;stroke:#36566f;stroke-width:2;marker-end:url(#end)}.edge{font-size:12px;font-weight:700;fill:#5b6475}.note{font-size:13px;fill:#5b6475}</style>
<rect width="1200" height="760" fill="#ffffff"/><text x="600" y="38" text-anchor="middle" class="title">${esc(title)}</text>
${arrows.join('')} ${nodes.map(node).join('')}</svg>`;

const charts = [
  ['overall-system.svg','Actual Overall System Flow',[
    {x:90,y:100,w:130,label:'Start',type:'terminal'},{x:290,y:100,label:'Open app',type:'io'},{x:520,y:100,w:240,label:'Load defaults + localStorage'},{x:790,y:100,label:'Enter credentials',type:'io'},{x:1030,y:100,label:'Match?',type:'decision'},
    {x:1030,y:230,label:'Show login alert',type:'io'},{x:790,y:330,w:230,label:'Apply role navigation visibility'},{x:520,y:330,label:'Choose module',type:'decision'},
    {x:180,y:500,label:'POS checkout'},{x:430,y:500,label:'Products / inventory'},{x:680,y:500,label:'Sales / reports'},{x:930,y:500,label:'Users / settings'},
    {x:555,y:650,w:260,label:'Browser localStorage',type:'store'},{x:900,y:650,w:220,label:'Render UI / receipt / CSV',type:'io'}
  ],[
    arrow(155,100,195,100),arrow(385,100,400,100),arrow(640,100,695,100),arrow(885,100,935,100),arrow(1030,135,1030,198,'No'),arrow(935,230,865,130),arrow(1030,135,790,297,'Yes'),arrow(675,330,615,330),
    arrow(450,360,200,468,'POS'),arrow(500,365,440,468,'Catalog'),arrow(555,365,670,468,'History'),arrow(590,355,900,468,'Admin'),
    arrow(180,532,475,625),arrow(430,532,520,618),arrow(680,532,600,618),arrow(930,532,635,625),arrow(685,650,790,650)
  ]],
  ['checkout.svg','Actual Checkout and Stock Flow',[
    {x:90,y:90,w:150,label:'Start sale',type:'terminal'},{x:300,y:90,label:'Select product',type:'io'},{x:530,y:90,label:'Stock available?',type:'decision'},{x:790,y:90,label:'Add to cart'},{x:1030,y:90,label:'Press Charge',type:'io'},
    {x:1030,y:230,label:'Cart empty?',type:'decision'},{x:790,y:230,label:'Enter cash amount',type:'io'},{x:530,y:230,label:'Stock still enough?',type:'decision'},{x:300,y:230,label:'Payment enough?',type:'decision'},
    {x:90,y:230,label:'Show error',type:'io'},{x:300,y:410,w:220,label:'Create invoice + sale'},{x:560,y:410,label:'Reduce stock'},{x:820,y:410,w:240,label:'Save products + sales',type:'store'},{x:1060,y:410,label:'Show receipt',type:'io'},{x:1060,y:600,w:160,label:'Complete',type:'terminal'}
  ],[
    arrow(165,90,205,90),arrow(395,90,435,90),arrow(625,90,695,90,'Yes'),arrow(885,90,935,90),arrow(1030,125,1030,198,'No'),arrow(935,230,885,230,'No'),arrow(695,230,625,230),arrow(435,230,395,230,'Yes'),arrow(205,230,185,230,'No'),arrow(90,198,90,120),
    arrow(300,265,300,378,'Yes'),arrow(410,410,465,410),arrow(655,410,700,410),arrow(940,410,965,410),arrow(1060,442,1060,568)
  ]],
  ['auth-risk.svg','Authentication / Authorization Risk Flow',[
    {x:120,y:90,w:150,label:'Open app',type:'terminal'},{x:370,y:90,w:250,label:'Restore browser accounts'},{x:650,y:90,label:'Submit credentials',type:'io'},{x:930,y:90,label:'Hash matches?',type:'decision'},
    {x:930,y:230,label:'Reject login',type:'io'},{x:650,y:300,w:230,label:'Set browser session user'},{x:370,y:300,w:230,label:'Hide disallowed navigation'},{x:120,y:300,label:'Normal UI only?',type:'decision'},
    {x:120,y:470,w:230,label:'Staff uses allowed modules',type:'io'},{x:430,y:470,w:250,label:'Edit localStorage / expose DOM',type:'io',risk:true},{x:720,y:470,w:220,label:'Reload or invoke UI',risk:true},{x:980,y:470,label:'Server check?',type:'decision',risk:true},
    {x:980,y:650,w:280,label:'Privileged UI/actions available',type:'io',risk:true},{x:650,y:650,w:210,label:'Authorization bypass',type:'terminal',risk:true}
  ],[
    arrow(195,90,245,90),arrow(495,90,555,90),arrow(745,90,835,90),arrow(930,125,930,198,'No'),arrow(835,90,765,270,'Yes'),arrow(535,300,485,300),arrow(255,300,215,300),arrow(120,335,120,438,'Yes'),
    arrow(215,300,400,438,'No'),arrow(555,470,610,470),arrow(830,470,885,470),arrow(980,505,980,618,'None'),arrow(840,650,755,650)
  ]]
];

for (const [file, title, nodes, arrows] of charts) fs.writeFileSync(path.join(out, file), svg(title, nodes, arrows), 'utf8');
console.log(`Created ${charts.length} flowcharts in ${out}`);
