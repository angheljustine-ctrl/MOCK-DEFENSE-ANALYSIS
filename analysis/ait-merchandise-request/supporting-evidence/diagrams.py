from pathlib import Path
from html import escape

out=Path(__file__).parent/'flowcharts'
def diagram(name,nodes,edges,mmd,w=850,h=400):
    chunks=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs><marker id="a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#35556b"/></marker></defs><rect width="100%" height="100%" fill="white"/>']
    for points,label,lx,ly in edges:
        chunks.append(f'<polyline points="{points}" fill="none" stroke="#35556b" stroke-width="2" marker-end="url(#a)"/>')
        if label: chunks.append(f'<text x="{lx}" y="{ly}" font-family="Arial" font-size="14" fill="#35556b">{escape(label)}</text>')
    for shape,x,y,ww,hh,label in nodes:
        fill='#edf6fb' if shape!='decision' else '#fff4cf'
        attrs=f'fill="{fill}" stroke="#176387" stroke-width="2"'
        if shape=='decision': chunks.append(f'<polygon points="{x+ww/2},{y} {x+ww},{y+hh/2} {x+ww/2},{y+hh} {x},{y+hh/2}" {attrs}/>')
        elif shape=='io': chunks.append(f'<polygon points="{x+13},{y} {x+ww},{y} {x+ww-13},{y+hh} {x},{y+hh}" {attrs}/>')
        elif shape=='db':
            chunks.append(f'<path d="M{x},{y+10} A{ww/2},10 0 0 1 {x+ww},{y+10} V{y+hh-10} A{ww/2},10 0 0 1 {x},{y+hh-10} Z" {attrs}/><ellipse cx="{x+ww/2}" cy="{y+10}" rx="{ww/2}" ry="10" {attrs}/>')
        else: chunks.append(f'<rect x="{x}" y="{y}" width="{ww}" height="{hh}" rx="{hh/2 if shape=="end" else 0}" {attrs}/>')
        lines=label.split('|')
        for i,line in enumerate(lines): chunks.append(f'<text x="{x+ww/2}" y="{y+hh/2-(len(lines)-1)*8+i*17+5}" text-anchor="middle" font-family="Arial" font-size="15" fill="#183e55">{escape(line)}</text>')
    chunks.append('</svg>')
    (out/(name+'.svg')).write_text(''.join(chunks),encoding='utf-8')
    (out/(name+'.mmd')).write_text(mmd,encoding='utf-8')

diagram('01-overall',[
('end',20,25,100,42,'Start'),('io',160,20,210,52,'Browse / search / FAQ'),('decision',415,10,160,72,'Account|action?'),('io',655,20,175,52,'Public tracking'),
('decision',415,145,160,72,'Logged in?'),('process',170,155,185,52,'Register / log in'),('process',645,155,185,52,'My Account /|request form'),
('process',645,290,185,52,'Submit request|see diagram 2'),('db',400,282,180,65,'localStorage'),('end',170,295,185,42,'Local demo only')],
[('120,46 160,46','',0,0),('370,46 415,46','',0,0),('575,46 655,46','No',600,37),('495,82 495,145','Yes',510,118),('415,181 355,181','No',377,169),('262,155 262,128 495,128 495,145','Retry',275,119),('575,181 645,181','Yes',592,169),('738,207 738,290','Request',750,254),('645,316 580,316','Save',594,306),('400,316 355,316','',0,0)],
'''flowchart TD
A([Start]) --> B[/Browse, search or FAQ/]
B --> C{Account action?}
C -- No --> D[/Public tracking: diagram 3/]
C -- Yes --> E{Logged in?}
E -- No --> F[Register or log in]
F -- Retry --> E
E -- Yes --> G[My Account or request form]
G -- Request --> H[Subprocess: submit request, diagram 2]
H -- Save --> I[(Browser localStorage)]
I --> J([Local demo only])
''')

diagram('02-request',[
('end',20,25,110,42,'Start'),('io',170,20,175,52,'Item / size / qty'),('decision',410,10,160,72,'Session +|HTML valid?'),('io',650,20,180,52,'Prompt / error'),
('process',410,150,160,55,'Capture account|and form data'),('process',650,150,180,55,'Generate ID'),('end',650,284,180,45,'Counter exception:|no recovery'),
('db',175,150,165,65,'Save requests'),('decision',175,285,165,75,'Saved?'),('io',400,290,200,60,'Confirm / history'),('io',20,290,120,60,'Save error')],
[('130,46 170,46','',0,0),('345,46 410,46','',0,0),('570,46 650,46','No',598,37),('740,20 740,0 257,0 257,20','Retry',530,14),('490,82 490,150','Yes',503,119),('570,178 650,178','',0,0),('740,205 740,284','Throws',750,250),('650,195 600,195 600,240 257,240 257,215','OK',605,231),('257,215 257,285','',0,0),('340,323 400,323','Yes',353,310),('175,323 140,323','No',143,310)],
'''flowchart TD
A([Start]) --> B[/Item, size, quantity and notes/]
B --> C{Session and HTML valid?}
C -- No --> D[/Prompt or validation error/]
D -- Retry --> B
C -- Yes --> E[Capture account identity and form data]
E --> F[Generate counter-based ID]
F -- Counter write throws --> G([No recovery in callback])
F -- OK --> H[(Save request array to localStorage)]
H --> I{Saved?}
I -- No --> J[/Show save error/]
I -- Yes --> K[/Confirm ID and refresh history/]
''')

diagram('03-tracking',[
('end',20,25,100,42,'Start'),('io',160,20,180,52,'Enter request ID'),('decision',410,10,155,72,'ID found?'),('io',650,20,180,52,'Not found / retry'),
('io',400,130,175,55,'Display status'),('decision',650,120,180,75,'Refresh|clicked?'),('end',670,270,140,42,'End'),
('process',150,130,185,55,'Advance one stage'),('db',150,270,185,60,'Attempt local save'),('decision',410,263,160,75,'Saved?'),('io',400,380,205,50,'Display advanced status')],
[('120,46 160,46','',0,0),('340,46 410,46','',0,0),('565,46 650,46','No',597,36),('740,20 740,0 250,0 250,20','Retry',545,14),('488,82 488,130','Yes',503,110),('575,157 650,157','',0,0),('740,195 740,270','No',750,231),('650,180 620,180 620,215 245,215 245,185','Yes: no auth check',345,208),('242,185 242,270','',0,0),('335,300 410,300','',0,0),('490,338 490,380','Yes',507,363),('570,300 620,300 620,405 605,405','No: still returns object',627,347)],
'''flowchart TD
A([Start]) --> B[/Enter request ID, no login required/]
B --> C{ID found?}
C -- No --> D[/Not found or retry/]
D -- Retry --> B
C -- Yes --> E[/Display status/]
E --> F{Refresh clicked?}
F -- No --> G([End])
F -- Yes, no auth check --> H[Advance one stage]
H --> I[(Attempt local save)]
I --> J{Saved?}
J -- Yes --> K[/Display advanced status/]
J -- No, still returns object --> K
''',h=450)
assert len(list(out.glob('*.svg')))==3 and len(list(out.glob('*.mmd')))==3
print('3 DIAGRAMS CREATED')
