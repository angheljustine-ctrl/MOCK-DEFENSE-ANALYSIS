from pathlib import Path
from html import escape
root=Path(__file__).resolve().parent/'flowcharts';root.mkdir(exist_ok=True)
def diagram(name,w,h,nodes,edges,mmd):
    svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#456178"/></marker></defs><rect width="100%" height="100%" fill="white"/>']
    for points,label,lx,ly in edges:
        svg.append(f'<polyline points="{points}" fill="none" stroke="#456178" stroke-width="2" marker-end="url(#arrow)"/>')
        if label:svg.append(f'<text x="{lx}" y="{ly}" font-family="Arial" font-size="15" fill="#33465a">{escape(label)}</text>')
    for kind,x,y,nw,nh,label in nodes:
        style='fill="#edf6fb" stroke="#125e8a" stroke-width="2"'
        if kind=='decision':svg.append(f'<polygon points="{x+nw/2},{y} {x+nw},{y+nh/2} {x+nw/2},{y+nh} {x},{y+nh/2}" {style}/>')
        elif kind=='io':svg.append(f'<polygon points="{x+15},{y} {x+nw},{y} {x+nw-15},{y+nh} {x},{y+nh}" {style}/>')
        elif kind=='db':
            svg.append(f'<path d="M{x},{y+10} A{nw/2},10 0 0 1 {x+nw},{y+10} L{x+nw},{y+nh-10} A{nw/2},10 0 0 1 {x},{y+nh-10} Z" {style}/><ellipse cx="{x+nw/2}" cy="{y+10}" rx="{nw/2}" ry="10" {style}/>')
        else:svg.append(f'<rect x="{x}" y="{y}" width="{nw}" height="{nh}" rx="{nh/2 if kind=="end" else 3}" {style}/>')
        lines=label.split('|');start=y+nh/2-((len(lines)-1)*18)/2+5
        svg.append(f'<text x="{x+nw/2}" y="{start}" text-anchor="middle" font-family="Arial" font-size="16" fill="#172033">')
        for i,line in enumerate(lines):svg.append(f'<tspan x="{x+nw/2}" dy="{0 if i==0 else 18}">{escape(line)}</tspan>')
        svg.append('</text>')
    svg.append('</svg>');(root/f'{name}.svg').write_text(''.join(svg),encoding='utf-8');(root/f'{name}.mmd').write_text(mmd,encoding='utf-8')
diagram('overall',800,290,[
('end',15,25,100,42,'Open app'),('decision',155,10,150,72,'Session valid?'),('io',165,125,130,50,'Login / retry'),('process',350,24,170,46,'Role-filtered menu'),('io',590,20,180,54,'Select module'),('process',590,110,180,54,'Validate / process'),('db',350,206,190,60,'Browser localStorage'),('io',45,214,220,46,'Update screen / report')],
[('115,46 155,46','',0,0),('305,46 350,46','Yes',315,35),('230,82 230,125','No',238,108),('230,175 125,175 125,85 155,60','Retry',65,160),('520,46 590,46','',0,0),('680,74 680,110','',0,0),('680,164 680,236 540,236','Valid',693,196),('590,136 552,136 552,46 590,46','Error',550,109),('350,236 265,236','',0,0)],
'''flowchart LR
 A([Open app]) --> B{Session valid?}
 B -- No --> C[/Login or retry/]
 C -- Retry --> B
 B -- Yes --> D[Role-filtered menu]
 D --> E[/Select module/]
 E --> F[Validate and process]
 F -- Error --> E
 F -- Valid --> G[(Browser localStorage)]
 G --> H[/Update screen or report/]
''')
diagram('authentication',800,400,[
('end',20,22,100,42,'Start login'),('io',165,16,190,54,'Enter credentials'),('decision',420,8,160,72,'Fields valid?'),('io',635,20,145,50,'Show error'),('process',410,126,180,54,'Match stored account|hash + active status'),('decision',420,226,160,72,'Match found?'),('process',115,235,235,55,'Create session + local proof'),('db',125,327,225,55,'Browser session store'),('io',620,235,160,54,'Reject login'),('end',470,334,195,44,'Open dashboard')],
[('120,43 165,43','',0,0),('355,43 420,43','',0,0),('580,43 635,43','No',592,32),('707,70 707,94 260,94 260,70','Retry',600,87),('500,80 500,126','Yes',511,115),('500,180 500,226','',0,0),('420,262 350,262','Yes',370,250),('580,262 620,262','No',586,250),('230,290 230,327','',0,0),('350,355 470,355','Valid proof',362,342)],
'''flowchart TD
 A([Start login]) --> B[/Enter credentials/]
 B --> C{Fields valid?}
 C -- No --> D[/Show error/]
 D -- Retry --> B
 C -- Yes --> E[Match stored account hash and active status]
 E --> F{Match found?}
 F -- No --> G[/Reject login/]
 F -- Yes --> H[Create session and local proof]
 H --> I[(Browser session store)]
 I -- Valid proof --> J([Open dashboard])
''')
diagram('payroll',800,630,[
('end',40,20,150,42,'Start payroll'),('decision',250,6,165,72,'Manager role?'),('io',560,18,190,52,'Deny UI action'),('io',235,116,210,60,'Select employee|and date range'),('process',235,215,210,64,'Read salary + attendance|calculate fixed half salary'),('decision',235,328,210,90,'Valid fields?|Ordered dates?|Unique period?'),('io',550,341,220,64,'Show error / retry'),('db',225,465,230,64,'Save payroll snapshot'),('io',45,565,260,48,'View / print payslip'),('process',475,557,285,64,'Mark Paid or edit Paid|same snapshot can change')],
[('190,41 250,41','',0,0),('415,41 560,41','No',469,30),('332,78 332,116','Yes',344,101),('332,176 332,215','',0,0),('332,279 332,328','',0,0),('445,373 550,373','Invalid',470,361),('660,341 660,145 445,145','Retry',673,235),('332,418 332,465','Valid',345,444),('285,529 285,548 175,548 175,565','',0,0),('395,529 395,588 475,588','',0,0),('610,557 610,495 455,495','Save edit',619,530)],
'''flowchart TD
 A([Start payroll]) --> B{Manager role?}
 B -- No --> C[/Deny UI action/]
 B -- Yes --> D[/Select employee and date range/]
 D --> E[Read salary and attendance; calculate fixed half salary]
 E --> F{Required fields, dates ordered, no exact duplicate?}
 F -- Invalid --> G[/Show error/]
 G -- Retry --> D
 F -- Valid --> H[(Save payroll snapshot)]
 H --> I[/View or print payslip/]
 H --> J[Mark Paid or edit Paid]
 J -- Save edit --> H
''')
print('Created three Mermaid and three SVG flowcharts')
