from pathlib import Path
from html import escape
p=Path(__file__).parent/'flowcharts';p.mkdir(exist_ok=True)
def diagram(name,title,nodes,edges,mmd):
    out=['<svg xmlns="http://www.w3.org/2000/svg" width="740" height="490" viewBox="0 0 740 490"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#246080"/></marker></defs><rect width="740" height="490" fill="white"/><style>text{font-family:Arial;font-size:14px;fill:#17364b} .n{fill:#edf7fb;stroke:#246080;stroke-width:2} .e{fill:none;stroke:#246080;stroke-width:2;marker-end:url(#arrow)}</style>']
    out.append(f'<text x="370" y="27" text-anchor="middle" style="font-size:20px;font-weight:bold">{escape(title)}</text>')
    for x1,y1,x2,y2,label in edges:
        out.append(f'<path class="e" d="M{x1},{y1} L{x2},{y2}"/>')
        if label:out.append(f'<text x="{(x1+x2)/2+8}" y="{(y1+y2)/2-6}">{escape(label)}</text>')
    for x,y,w,h,shape,label in nodes:
        if shape=='decision':out.append(f'<polygon class="n" points="{x+w/2},{y} {x+w},{y+h/2} {x+w/2},{y+h} {x},{y+h/2}"/>')
        elif shape=='io':out.append(f'<polygon class="n" points="{x+15},{y} {x+w},{y} {x+w-15},{y+h} {x},{y+h}"/>')
        elif shape=='store':
            out.append(f'<path class="n" d="M{x},{y+12} C{x},{y-4} {x+w},{y-4} {x+w},{y+12} L{x+w},{y+h-12} C{x+w},{y+h+4} {x},{y+h+4} {x},{y+h-12} Z"/><ellipse class="n" cx="{x+w/2}" cy="{y+12}" rx="{w/2}" ry="12"/>')
        else:out.append(f'<rect class="n" x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2 if shape=="end" else 2}"/>')
        lines=label.split('|')
        for i,s in enumerate(lines):out.append(f'<text x="{x+w/2}" y="{y+h/2+5+(i-(len(lines)-1)/2)*18}" text-anchor="middle">{escape(s)}</text>')
    out.append('</svg>');(p/(name+'.svg')).write_text(''.join(out),encoding='utf8');(p/(name+'.mmd')).write_text(mmd,encoding='utf8')
diagram('overall','Actual overall flow',[(260,50,220,40,'end','Open index.html'),(260,115,220,55,'store','Parse localStorage'),(260,220,220,70,'decision','Parse succeeds?'),(30,230,180,50,'end','Stop on parse error'),(260,335,220,45,'io','Enter admin password'),(510,335,200,45,'process','Login toggles visibility'),(510,425,200,45,'end','Dashboard / records')],[(370,90,370,115,''),(370,170,370,220,''),(260,255,210,255,'No'),(370,290,370,335,'Yes'),(480,358,510,358,'Match'),(610,380,610,425,'')],'''flowchart TD
A([Open index.html]) --> B[(Parse localStorage)] --> C{Parse succeeds?}
C -- No --> D([Stop on parse error])
C -- Yes --> E[/Enter password/]
E -- Match --> F[Login toggles visibility] --> G([Dashboard / records])
E -- Mismatch --> E
''')
diagram('save','Actual student save and edit flow',[(265,50,210,40,'end','Start Add / Edit'),(265,115,210,45,'io','Enter student fields'),(265,195,210,70,'decision','Form valid?'),(20,205,185,50,'io','Errors; correct fields'),(265,310,210,45,'process','Read images; mutate array'),(525,310,195,55,'store','localStorage write'),(525,415,195,45,'io','Success / refresh'),(20,415,210,45,'end','Unhandled save error')],[(370,90,370,115,''),(370,160,370,195,''),(265,230,205,230,'No'),(110,205,265,137,'Retry'),(370,265,370,310,'Yes'),(475,332,525,332,''),(622,365,622,415,'Saved'),(525,345,230,430,'Write fails')],'''flowchart TD
A([Start Add / Edit]) --> B[/Enter fields/] --> C{Form valid?}
C -- No --> D[/Errors; correct fields/] --> B
C -- Yes --> E[Read images; mutate array] --> F[(localStorage write)]
F -- Saved --> G[/Success and refresh/]
F -- Write fails --> H([Unhandled error])
''')
diagram('restore','Actual backup restore trust boundary',[(260,50,220,40,'end','Choose backup'),(260,115,220,45,'io','Read JSON file'),(260,195,220,70,'decision','Parses as array?'),(20,205,185,50,'io','Reject / catch error'),(260,310,220,70,'decision','Confirm replace?'),(515,320,200,45,'end','Cancel; retain records'),(260,425,220,50,'store','Replace + save first'),(515,425,200,50,'process','Render; may fail')],[(370,90,370,115,''),(370,160,370,195,''),(260,230,205,230,'No'),(370,265,370,310,'Yes'),(480,345,515,345,'No'),(370,380,370,425,'Yes'),(480,450,515,450,'')],'''flowchart TD
A([Choose backup]) --> B[/Read JSON/] --> C{Parses as array?}
C -- No --> D[/Reject or catch error/]
C -- Yes --> E{Confirm replace?}
E -- No --> F([Cancel; retain records])
E -- Yes --> G[(Replace and save first)] --> H[Render; may fail]
''')
