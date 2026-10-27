import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const esc = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const text = (x, y, lines, cls = '') => `<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${lines.map((s,i)=>`<tspan x="${x}" dy="${i?18:0}">${esc(s)}</tspan>`).join('')}</text>`;
const rect = (x,y,w,h,lines,kind='process') => kind === 'decision'
  ? `<polygon points="${x+w/2},${y} ${x+w},${y+h/2} ${x+w/2},${y+h} ${x},${y+h/2}" class="decision"/>${text(x+w/2,y+h/2-(lines.length-1)*9+5,lines)}`
  : kind === 'io'
    ? `<polygon points="${x+18},${y} ${x+w},${y} ${x+w-18},${y+h} ${x},${y+h}" class="io"/>${text(x+w/2,y+h/2-(lines.length-1)*9+5,lines)}`
    : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${kind==='term'?24:8}" class="${kind}"/>${text(x+w/2,y+h/2-(lines.length-1)*9+5,lines)}`;
const db = (x,y,w,h,lines) => `<path d="M${x},${y+12} a${w/2},12 0 0 0 ${w},0 v${h-24} a${w/2},12 0 0 1 -${w},0 z" class="db"/><ellipse cx="${x+w/2}" cy="${y+12}" rx="${w/2}" ry="12" class="db"/>${text(x+w/2,y+h/2-(lines.length-1)*9+5,lines)}`;
const arrow = (x1,y1,x2,y2,label='',dashed=false) => `<path d="M${x1},${y1} L${x2},${y2}" class="arrow${dashed?' dashed':''}"/>${label?text((x1+x2)/2,(y1+y2)/2-6,[label],'edge'):''}`;
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 700" role="img"><defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#47657d"/></marker></defs><style>text{font:600 14px 'Segoe UI',Arial,sans-serif;fill:#16324a}.edge{font-size:12px;fill:#526b7d}.process,.term,.io,.decision,.db{stroke:#1c668f;stroke-width:2;fill:#eef8fc}.term{fill:#dff4e8;stroke:#26845a}.io{fill:#fff5d9;stroke:#b47712}.decision{fill:#fff0e8;stroke:#bd5c25}.db{fill:#e9e8ff;stroke:#6256a3}.risk{fill:#ffe7e7;stroke:#b92929}.arrow{fill:none;stroke:#47657d;stroke-width:2;marker-end:url(#a)}.dashed{stroke-dasharray:7 5;stroke:#b92929}</style><rect width="1100" height="700" fill="#fff"/>${body}</svg>`;

const overall = [
  rect(30,300,130,54,['Start'],'term'), rect(210,285,175,84,['Enter username','and password'],'io'), rect(435,285,190,84,['Auth.login checks','browser data']), rect(675,275,190,100,['Credentials and','status valid?'],'decision'),
  rect(910,100,150,60,['Show login error'],'io'), db(910,285,160,90,['Save session in','localStorage']), rect(690,465,160,90,['Normalized role'],'decision'),
  rect(20,610,150,55,['Admin modules']), rect(210,610,150,55,['Manager modules']), rect(400,610,150,55,['Finance modules']), rect(590,610,150,55,['Employee portal']), db(835,590,210,80,['All business records','in localStorage']),
  arrow(160,327,210,327), arrow(385,327,435,327), arrow(625,327,675,327), arrow(770,275,985,160,'No'), arrow(985,160,985,285), arrow(865,325,910,325,'Yes'), arrow(990,375,770,465),
  arrow(690,510,95,610,'Admin'), arrow(730,555,285,610,'Manager'), arrow(790,555,475,610,'Finance'), arrow(850,510,665,610,'Employee'), arrow(170,638,835,630), arrow(360,638,835,630), arrow(550,638,835,630), arrow(740,638,835,630)
].join('');

const payroll = [
  rect(35,65,155,55,['Start payroll'],'term'), rect(245,45,210,95,['Select employee, cutoff,','dates, allowance, bonus'],'io'), rect(520,55,190,75,['Build cutoff dates']), db(780,40,255,105,['Read employee, attendance,','leave, and holidays']),
  rect(440,235,220,90,['Compute hours, premiums,','deductions, and net pay']), rect(725,230,220,100,['Same employee, cutoff,','and range already saved?'],'decision'),
  rect(820,420,210,70,['Show Already Recorded','and stop save'],'io'), db(420,415,220,95,['Save payroll and','salary slip']), rect(145,425,210,75,['Show net pay','and record'],'io'), rect(30,435,90,55,['End'],'term'),
  rect(110,205,230,75,['Manila result is one day','earlier (confirmed)'],'io'),
  arrow(190,92,245,92), arrow(455,92,520,92), arrow(710,92,780,92), arrow(905,145,550,235), arrow(660,280,725,280), arrow(835,330,925,420,'Yes'), arrow(725,280,640,460,'No'), arrow(420,462,355,462), arrow(145,462,120,462), arrow(610,130,225,205,'Timezone defect',true), arrow(925,490,350,92,'Retry',true)
].join('');

const access = [
  rect(430,30,180,55,['Open protected page'],'term'), db(405,130,230,90,['Read avenor_session','from localStorage']), rect(430,270,180,90,['Session exists?'],'decision'),
  rect(90,280,200,65,['Redirect to login'],'io'), rect(400,420,240,70,['Normalize session role']), rect(430,540,180,90,['Role allowed?'],'decision'), rect(750,555,220,65,['Render privileged page'],'io'), rect(790,655,160,35,['Privileged access'],'term'),
  rect(35,75,250,75,['Edit local session role','to Admin'],'io'), rect(760,105,275,85,['Restore crafted backup','with injected session'],'io'), rect(95,560,210,65,['Redirect to dashboard'],'io'),
  arrow(520,85,520,130), arrow(520,220,520,270), arrow(430,315,290,315,'No'), arrow(520,360,520,420,'Yes'), arrow(520,490,520,540), arrow(610,585,750,585,'Yes'), arrow(860,620,870,655), arrow(430,585,305,592,'No'), arrow(285,112,405,165,'Confirmed bypass',true), arrow(760,147,635,175,'Accepted by validator',true)
].join('');

for (const [name, body] of [['01-overall-system',overall],['02-payroll-flow',payroll],['03-access-bypass',access]]) fs.writeFileSync(path.join(dir, `${name}.svg`), svg(body));
console.log('FLOWCHART SVG GENERATION PASSED');
