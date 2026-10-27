import fs from "node:fs";
import path from "node:path";

const out = path.join(import.meta.dirname, "flowcharts");

const esc = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const wrap = (text, width = 29) => {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > width) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
};

function node(n) {
  const lines = wrap(n.text, n.w > 250 ? 38 : 29);
  const startY = n.y + n.h / 2 - (lines.length - 1) * 8;
  const label = lines.map((line, i) => `<text x="${n.x + n.w / 2}" y="${startY + i * 16}" text-anchor="middle">${esc(line)}</text>`).join("");
  if (n.kind === "decision") {
    const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
    return `<polygon points="${cx},${n.y} ${n.x + n.w},${cy} ${cx},${n.y + n.h} ${n.x},${cy}" class="decision"/>${label}`;
  }
  if (n.kind === "io") {
    return `<polygon points="${n.x + 18},${n.y} ${n.x + n.w},${n.y} ${n.x + n.w - 18},${n.y + n.h} ${n.x},${n.y + n.h}" class="io"/>${label}`;
  }
  if (n.kind === "db") {
    return `<path d="M${n.x},${n.y + 12} C${n.x},${n.y - 4} ${n.x + n.w},${n.y - 4} ${n.x + n.w},${n.y + 12} V${n.y + n.h - 12} C${n.x + n.w},${n.y + n.h + 4} ${n.x},${n.y + n.h + 4} ${n.x},${n.y + n.h - 12} Z M${n.x},${n.y + 12} C${n.x},${n.y + 28} ${n.x + n.w},${n.y + 28} ${n.x + n.w},${n.y + 12}" class="db"/>${label}`;
  }
  return `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${n.kind === "term" ? 24 : 6}" class="${n.kind}"/>${label}`;
}

const edge = (x1, y1, x2, y2, label = "") => `<path d="M${x1},${y1} L${x2},${y2}" class="edge" marker-end="url(#arrow)"/>${label ? `<text x="${(x1 + x2) / 2 + 5}" y="${(y1 + y2) / 2 - 5}" class="edge-label">${esc(label)}</text>` : ""}`;

function svg(title, subtitle, width, height, nodes, edges) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title><desc id="desc">${esc(subtitle)}</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#35566f"/></marker></defs>
<style>text{font:13px 'Segoe UI',Arial,sans-serif;fill:#17324a}.title{font-size:22px;font-weight:700;fill:#0b3654}.subtitle{font-size:12px;fill:#5d6c7b}.process,.term,.io,.db,.decision{stroke:#1b668e;stroke-width:2;fill:#eef7fb}.term{fill:#dff4e8;stroke:#267548}.decision{fill:#fff4d6;stroke:#a56e00}.db{fill:#efe9ff;stroke:#6945a3}.io{fill:#e8f3ff}.edge{fill:none;stroke:#35566f;stroke-width:2}.edge-label{font-size:11px;font-weight:700;fill:#7a4c00}</style>
<rect width="100%" height="100%" fill="#fff"/><text x="24" y="34" class="title">${esc(title)}</text><text x="24" y="54" class="subtitle">${esc(subtitle)}</text>
${edges.join("")}${nodes.map(node).join("")}</svg>`;
}

const charts = [
  {
    file: "01-overall-system-flow.svg", title: "Overall actual system flow", subtitle: "All business data stays inside the current browser profile.", width: 820, height: 790,
    nodes: [
      {x:310,y:70,w:200,h:48,kind:"term",text:"Start"},{x:270,y:145,w:280,h:58,kind:"io",text:"Choose Administrator or Employee"},{x:270,y:232,w:280,h:62,kind:"process",text:"Read users and employees from localStorage"},{x:285,y:330,w:250,h:90,kind:"decision",text:"Credentials match active record?"},{x:30,y:345,w:190,h:58,kind:"io",text:"Show login error"},{x:80,y:465,w:260,h:58,kind:"process",text:"Open admin dashboard and modules"},{x:480,y:465,w:260,h:58,kind:"process",text:"Open employee self-service"},{x:270,y:575,w:280,h:70,kind:"db",text:"Browser localStorage"},{x:250,y:685,w:320,h:58,kind:"io",text:"Render tables, summaries, print, export"},{x:620,y:690,w:150,h:48,kind:"term",text:"End"}
    ],
    edges:[edge(410,118,410,145),edge(410,203,410,232),edge(410,294,410,330),edge(285,375,220,375,"No"),edge(125,403,125,440),edge(125,440,270,174),edge(360,420,210,465,"Admin"),edge(460,420,610,465,"Employee"),edge(210,523,340,575),edge(610,523,480,575),edge(410,645,410,685),edge(570,714,620,714)]
  },
  {
    file: "02-payroll-generation-flow.svg", title: "Payroll generation flow", subtitle: "Actual calculation and overwrite path in js/payroll.js.", width: 920, height: 930,
    nodes: [
      {x:360,y:68,w:200,h:46,kind:"term",text:"Start"},{x:300,y:135,w:320,h:58,kind:"io",text:"Select month, cutoff, employee"},{x:300,y:218,w:320,h:58,kind:"process",text:"Load employees, attendance, leave, holidays"},{x:330,y:305,w:260,h:70,kind:"decision",text:"Date should be skipped?"},{x:45,y:312,w:210,h:55,kind:"process",text:"Skip future, day off, holiday"},{x:330,y:410,w:260,h:70,kind:"decision",text:"Approved leave?"},{x:45,y:418,w:210,h:55,kind:"process",text:"Count paid or unpaid leave"},{x:665,y:418,w:210,h:55,kind:"decision",text:"Attendance exists?"},{x:665,y:520,w:210,h:55,kind:"process",text:"Count work, absence, late, undertime"},{x:300,y:620,w:320,h:62,kind:"process",text:"Compute earnings and deductions"},{x:330,y:715,w:260,h:70,kind:"decision",text:"Existing payroll record?"},{x:45,y:725,w:220,h:55,kind:"db",text:"Append Generated record"},{x:655,y:718,w:220,h:68,kind:"process",text:"Replace record; keep Paid status"},{x:300,y:835,w:320,h:58,kind:"io",text:"Render payroll and reports"}
    ],
    edges:[edge(460,114,460,135),edge(460,193,460,218),edge(460,276,460,305),edge(330,340,255,340,"Yes"),edge(460,375,460,410,"No"),edge(330,445,255,445,"Yes"),edge(590,445,665,445,"No"),edge(770,473,770,520),edge(150,367,150,590),edge(150,473,150,590),edge(770,575,770,590),edge(150,590,460,620),edge(770,590,460,620),edge(460,682,460,715),edge(330,750,265,750,"No"),edge(590,750,655,750,"Yes"),edge(155,780,155,815),edge(155,815,460,835),edge(765,786,765,815),edge(765,815,460,835)]
  },
  {
    file: "03-authorization-risk-flow.svg", title: "Authentication and authorization risk", subtitle: "Confirmed contrast: admin pages load directly; employee pages redirect without a session.", width: 860, height: 800,
    nodes: [
      {x:330,y:65,w:200,h:48,kind:"term",text:"Start"},{x:320,y:145,w:220,h:78,kind:"decision",text:"Entry path"},{x:55,y:275,w:280,h:58,kind:"io",text:"Normal login with credentials"},{x:525,y:275,w:280,h:58,kind:"process",text:"Direct admin page URL"},{x:55,y:375,w:280,h:62,kind:"process",text:"Compare plaintext localStorage values"},{x:525,y:375,w:280,h:70,kind:"decision",text:"Admin page guard present?"},{x:55,y:485,w:280,h:58,kind:"process",text:"Write currentUser and role"},{x:525,y:485,w:280,h:58,kind:"process",text:"No guard: render admin page"},{x:290,y:610,w:280,h:72,kind:"decision",text:"Server authorization check?"},{x:270,y:715,w:320,h:62,kind:"db",text:"None: localStorage is source of truth"}
    ],
    edges:[edge(430,113,430,145),edge(320,184,195,275,"Login"),edge(540,184,665,275,"Direct URL"),edge(195,333,195,375),edge(665,333,665,375),edge(195,437,195,485,"Match"),edge(665,445,665,485,"No"),edge(195,543,350,610),edge(665,543,510,610),edge(430,682,430,715,"None")]
  }
];

fs.mkdirSync(out, {recursive:true});
for (const chart of charts) {
  fs.writeFileSync(path.join(out, chart.file), svg(chart.title, chart.subtitle, chart.width, chart.height, chart.nodes, chart.edges), "utf8");
}
console.log("FLOWCHARTS RENDERED: 3");
