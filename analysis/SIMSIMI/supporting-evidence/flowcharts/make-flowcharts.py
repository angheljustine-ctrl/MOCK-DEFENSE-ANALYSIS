from pathlib import Path
from html import escape
out=Path(__file__).parent
def diagram(name,w,h,nodes,edges,mmd):
    svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs><marker id="a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="#31546b"/></marker></defs><rect width="100%" height="100%" fill="white"/>']
    for pts,label,lx,ly in edges:
        svg.append(f'<polyline points="{pts}" fill="none" stroke="#31546b" stroke-width="2" marker-end="url(#a)"/>')
        if label: svg.append(f'<text x="{lx}" y="{ly}" font-family="Arial" font-size="15" fill="#943e0d">{escape(label)}</text>')
    for shape,x,y,ww,hh,label in nodes:
        base='fill="#eef7fb" stroke="#125e8a" stroke-width="2"'
        if shape=='diamond':svg.append(f'<polygon points="{x+ww/2},{y} {x+ww},{y+hh/2} {x+ww/2},{y+hh} {x},{y+hh/2}" {base}/>')
        elif shape=='io':svg.append(f'<polygon points="{x+14},{y} {x+ww},{y} {x+ww-14},{y+hh} {x},{y+hh}" {base}/>')
        elif shape=='db':
            svg.append(f'<path d="M{x},{y+10} A{ww/2},10 0 0 1 {x+ww},{y+10} L{x+ww},{y+hh-10} A{ww/2},10 0 0 1 {x},{y+hh-10} Z" {base}/><ellipse cx="{x+ww/2}" cy="{y+10}" rx="{ww/2}" ry="10" {base}/>')
        else:svg.append(f'<rect x="{x}" y="{y}" width="{ww}" height="{hh}" rx="{hh/2 if shape=="end" else 3}" {base}/>')
        lines=label.split('|')
        for i,s in enumerate(lines):svg.append(f'<text x="{x+ww/2}" y="{y+hh/2-(len(lines)-1)*9+i*18+5}" text-anchor="middle" font-family="Arial" font-size="16" fill="#172033">{escape(s)}</text>')
    svg.append('</svg>')
    (out/(name+'.svg')).write_text(''.join(svg),encoding='utf-8')
    (out/(name+'.mmd')).write_text(mmd,encoding='utf-8')
diagram('overall',900,405,[
 ('end',20,20,110,44,'Start'),('rect',170,20,175,44,'Initialize local data'),('io',385,20,170,44,'Role + credentials'),('diamond',605,8,180,68,'Match?'),('io',607,105,178,48,'Show login error'),('db',600,190,190,60,'Save currentUser'),('rect',360,195,175,50,'Role dashboard'),('rect',125,195,190,50,'Select / use module'),('db',125,295,190,60,'Local record stores'),('io',360,300,180,50,'Update UI / notice'),('diamond',585,289,145,70,'Logout?'),('rect',763,295,116,60,'Remove|session'),('end',763,365,116,32,'End')],
 [('130,42 170,42','',0,0),('345,42 385,42','',0,0),('555,42 605,42','',0,0),('695,76 695,105','No',704,96),('607,129 570,129 570,70 470,70 470,64','Retry',507,122),('785,42 827,42 827,220 790,220','Yes',799,35),('600,220 535,220','',0,0),('360,220 315,220','',0,0),('220,245 220,295','',0,0),('315,325 360,325','',0,0),('540,325 585,325','',0,0),('657,289 657,270 220,270 220,245','No: continue',459,264),('730,325 763,325','Yes',736,315),('821,355 821,365','',0,0)],
'''flowchart LR
A([Start]) --> B[Initialize local data] --> C[/Role + credentials/] --> D{Match?}
D -- No --> E[/Show login error/] --> C
D -- Yes --> F[(Save currentUser)] --> G[Role dashboard] --> H[Select / use module]
H --> I[(Local record stores)] --> J[/Update UI / notice/] --> K{Logout?}
K -- No: continue --> H
K -- Yes --> L[Remove session] --> M([End])
''')
diagram('access',900,350,[('end',20,25,145,45,'Open role page'),('db',207,18,190,60,'Read currentUser'),('diamond',435,8,185,80,'Null or wrong|role?'),('rect',686,25,180,50,'Redirect to login'),('rect',435,134,185,50,'Continue page code'),('rect',665,134,205,50,'UI filters local data'),('end',665,233,205,50,'Rendered role page'),('io',30,233,340,55,'Altered role value passes comparison')],
 [('165,48 207,48','',0,0),('397,48 435,48','',0,0),('620,48 686,48','Yes',638,36),('527,88 527,134','No',537,115),('620,158 665,158','',0,0),('767,184 767,233','',0,0),('200,233 200,105 304,105 304,78','Local bypass path',28,158)],
'''flowchart LR
A([Open role page]) --> B[(Read currentUser)] --> C{Null or wrong role?}
C -- Yes --> D[Redirect to login]
C -- No --> E[Continue page code] --> F[UI filters local data] --> G([Rendered role page])
H[/Altered role value passes comparison/] -- Local bypass path --> B
''')
diagram('enrollment',900,600,[('end',25,20,160,45,'Admin enrollment'),('io',245,20,190,45,'Select student'),('rect',495,20,340,55,'Filter class course / year / section'),('io',495,112,340,50,'Select unchecked classes'),('diamond',495,205,190,80,'Student and|selection exist?'),('io',30,222,280,50,'Show required-selection error'),('diamond',495,329,190,80,'Class found and|not duplicate?'),('rect',745,338,130,60,'Skip item'),('rect',75,341,345,65,'Append enrollment snapshots|studentId + classId + names'),('db',75,466,345,65,'Save educore_enrollments'),('io',495,475,340,55,'Refresh panels + success notice'),('end',495,555,340,32,'Done')],
 [('185,42 245,42','',0,0),('435,42 495,42','',0,0),('665,75 665,112','',0,0),('665,162 665,185 590,185 590,205','',0,0),('495,245 310,245','No',400,235),('170,222 170,100 340,100 340,65','Retry',179,127),('590,285 590,329','Yes',600,309),('685,368 745,368','No',708,358),('810,398 810,432 705,432 705,368 685,368','Next item',768,454),('495,368 420,368','Yes',449,356),('247,406 247,466','After selected items',263,445),('420,499 495,499','',0,0),('665,530 665,555','',0,0)],
'''flowchart TD
A([Admin enrollment]) --> B[/Select student/] --> C[Filter course / year / section] --> D[/Select unchecked classes/] --> E{Student and selection exist?}
E -- No --> F[/Show required-selection error/] --> B
E -- Yes --> G{Class found and not duplicate?}
G -- No --> H[Skip item]
H -- Next item --> G
G -- Yes --> I[Append enrollment snapshots: studentId + classId + names]
I -- After selected items --> J[(Save educore_enrollments)] --> K[/Refresh panels + success notice/] --> L([Done])
''')
diagram('enrollment',900,600,[
 ('end',25,15,160,42,'Admin enrollment'),('io',245,15,190,42,'Select student'),('rect',495,15,350,50,'Filter course / year / section'),('io',495,105,350,46,'Select unchecked classes'),('diamond',495,192,190,76,'Student and|selection exist?'),('io',30,207,280,48,'Show selection error'),('diamond',495,320,190,76,'More selected|items?'),('diamond',190,320,190,76,'Class found and|not duplicate?'),('rect',180,464,200,55,'Append IDs + names'),('rect',30,325,110,66,'Skip|item'),('db',495,458,350,58,'Save enrollments'),('io',495,540,350,46,'Refresh + success notice')],
 [('185,36 245,36','',0,0),('435,36 495,36','',0,0),('670,65 670,105','',0,0),('670,151 670,173 590,173 590,192','',0,0),('495,230 310,230','No',404,220),('170,207 170,90 340,90 340,57','Retry',179,115),('590,268 590,320','Yes',600,301),('495,358 380,358','Yes',425,347),('590,396 590,458','No: exhausted',604,425),('285,396 285,464','Yes',295,431),('190,358 140,358','No',154,348),('85,391 85,420 445,420 445,358 495,358','Next item',365,414),('380,491 445,491 445,358 495,358','Next item',390,477),('670,516 670,540','',0,0)],
'''flowchart TD
A([Admin enrollment]) --> B[/Select student/] --> C[Filter course / year / section] --> D[/Select unchecked classes/] --> E{Student and selection exist?}
E -- No --> F[/Show selection error/] --> B
E -- Yes --> G{More selected items?}
G -- Yes --> H{Class found and not duplicate?}
H -- No --> I[Skip item]
H -- Yes --> J[Append IDs + names]
I -- Next item --> G
J -- Next item --> G
G -- No: exhausted --> K[(Save enrollments)] --> L[/Refresh + success notice/]
''')
print('THREE_FLOWCHARTS_CREATED')
