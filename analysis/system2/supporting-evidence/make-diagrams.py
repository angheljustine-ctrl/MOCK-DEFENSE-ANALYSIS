from pathlib import Path
from html import escape
P=Path(__file__).parent/'flowcharts'
def render(name,title,nodes,edges,width,height,mmd):
    parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}"><defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#486174"/></marker></defs><rect width="100%" height="100%" fill="white"/>']
    for a,b,label,points in edges:
        pts=' '.join(f'{x},{y}' for x,y in points)
        parts.append(f'<polyline points="{pts}" fill="none" stroke="#486174" stroke-width="2" marker-end="url(#arr)"/>')
        if label:
            if len(points)==2:
                x=(points[0][0]+points[1][0])/2;y=(points[0][1]+points[1][1])/2
            else:
                x,y=points[len(points)//2]
            shift=10 if len(points)==2 and points[0][0]==points[1][0] else 0
            parts.append(f'<text x="{x+shift}" y="{y-7}" text-anchor="middle" font-family="Arial" font-size="12" fill="#8a3922">{escape(label)}</text>')
    for key,kind,x,y,w,h,lines in nodes:
        fill='#eef6fa' if kind!='decision' else '#fff2d8';stroke='#256786'
        if kind=='decision':
            parts.append(f'<polygon points="{x+w/2},{y} {x+w},{y+h/2} {x+w/2},{y+h} {x},{y+h/2}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
        elif kind=='io':
            parts.append(f'<polygon points="{x+15},{y} {x+w},{y} {x+w-15},{y+h} {x},{y+h}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
        elif kind=='db':
            parts.append(f'<path d="M{x},{y+10} A{w/2},10 0 0 1 {x+w},{y+10} V{y+h-10} A{w/2},10 0 0 1 {x},{y+h-10} Z" fill="{fill}" stroke="{stroke}" stroke-width="2"/><ellipse cx="{x+w/2}" cy="{y+10}" rx="{w/2}" ry="10" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
        else:
            parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2 if kind=="end" else 2}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
        for i,line in enumerate(lines):
            parts.append(f'<text x="{x+w/2}" y="{y+h/2-(len(lines)-1)*8+i*16+5+(5 if kind=="db" else 0)}" text-anchor="middle" font-family="Arial" font-size="14" fill="#17334b">{escape(line)}</text>')
    parts.append('</svg>');(P/(name+'.svg')).write_text(''.join(parts),encoding='utf-8');(P/(name+'.mmd')).write_text(mmd,encoding='utf-8')
render('overall','Overall',[
 ('a','end',20,20,140,42,['Start']),('b','io',200,20,200,42,['Login credentials']),('c','decision',435,8,175,68,['Match +','Approved?']),('d','io',650,20,180,42,['Error / retry']),
 ('e','process',435,110,175,48,['Save session role']),('f','process',170,210,230,58,['Employee: time, leave,','own payslip UI']),('g','process',465,210,270,58,['Admin / HR: records,','leave review, payroll']),('h','db',325,325,280,70,['Browser localStorage','for this browser profile']),('i','end',650,340,150,42,['Logout'])],
 [('a','b','',[(160,41),(200,41)]),('b','c','',[(400,41),(435,41)]),('c','d','No',[(610,41),(650,41)]),('d','b','Retry',[(740,20),(740,0),(300,0),(300,20)]),('c','e','Yes',[(522,76),(522,110)]),('e','f','Employee',[(475,158),(475,183),(285,183),(285,210)]),('e','g','Admin / HR',[(565,158),(565,183),(600,183),(600,210)]),('f','h','Save / read',[(285,268),(285,307),(400,307),(400,325)]),('g','h','Save / read',[(600,268),(600,307),(535,307),(535,325)]),('h','i','',[(605,360),(650,360)])],850,420,
 '''flowchart TD
 A([Start]) --> B[/Login credentials/]
 B --> C{Match and Approved?}
 C -- No --> D[/Error/]
 D -- Retry --> B
 C -- Yes --> E[Save session role]
 E -- Employee --> F[Clock / leave / own payslip UI]
 E -- Admin or HR --> G[Records / review / payroll]
 F --> H[(Browser localStorage)]
 G --> H
 H --> I[Remove session on logout]
 I --> J([End])
 ''')
render('recovery','Recovery',[
 ('a','end',20,25,115,42,['Start']),('b','io',165,20,160,52,['Enter account','email']),('c','decision',360,10,160,72,['Email','exists?']),('d','io',575,25,210,42,['Show account-not-found']),
 ('e','io',340,115,200,55,['Show code in same page','and email-sent message']),('f','io',70,215,200,55,['Enter shown code','+ new password']),('g','decision',340,203,200,80,['Code matches +','length >= 6?']),('h','io',615,215,180,55,['Show validation','error / retry']),('i','db',330,327,225,65,['Replace password','in localStorage']),('j','end',650,340,120,42,['End'])],
 [('a','b','',[(135,46),(165,46)]),('b','c','',[(325,46),(360,46)]),('c','d','No',[(520,46),(575,46)]),('c','e','Yes',[(440,82),(440,115)]),('e','f','',[(340,143),(170,143),(170,215)]),('f','g','',[(270,243),(340,243)]),('g','h','No',[(540,243),(615,243)]),('h','f','Retry',[(705,270),(705,302),(170,302),(170,270)]),('g','i','Yes',[(440,283),(440,327)]),('i','j','',[(555,360),(650,360)])],850,420,
 '''flowchart TD
 A([Start]) --> B[/Enter account email/]
 B --> C{Email exists?}
 C -- No --> D[/Account not found/]
 C -- Yes --> E[/Display code in same page/]
 E --> F[/Enter code and new password/]
 F --> G{Code matches and length at least 6?}
 G -- No --> H[/Error/]
 H -- Retry --> F
 G -- Yes --> I[(Replace stored password)]
 I --> J([End])
 ''')
render('payroll','Payroll',[
 ('a','end',205,10,190,42,['Admin / HR starts']),('b','io',195,82,210,52,['Select month + Run']),('c','decision',205,166,190,82,['Month value','nonempty?']),('d','end',470,185,180,45,['No action']),('e','process',160,285,280,50,['Keep payroll from other months']),('f','db',5,388,230,65,['Read active employees,','attendance, approved leave']),('g','process',340,392,300,62,['calc(): weekdays + absences,','gross, deductions, net']),('h','db',185,505,230,65,['Replace selected month','with new payroll records']),('i','io',170,610,260,52,['Show all rows as Paid','and expose payslips']),('j','end',205,705,190,42,['End'])],
 [('a','b','',[(300,52),(300,82)]),('b','c','',[(300,134),(300,166)]),('c','d','No',[(395,207),(470,207)]),('c','e','Yes',[(300,248),(300,285)]),('e','f','',[(230,335),(230,360),(120,360),(120,388)]),('f','g','Each employee',[(235,423),(340,423)]),('g','h','',[(490,454),(490,482),(300,482),(300,505)]),('h','i','',[(300,570),(300,610)]),('i','j','',[(300,662),(300,705)])],680,770,
 '''flowchart TD
 A([Admin or HR starts]) --> B[/Select month and Run/]
 B --> C{Month nonempty?}
 C -- No --> D([No action])
 C -- Yes --> E[Keep records from other months]
 E --> F[(Read active employees / attendance / approved leave)]
 F --> G[calc each employee]
 G --> H[(Replace selected month records)]
 H --> I[/Show Paid and expose payslips/]
 I --> J([End])
 ''')
print('Three SVG and Mermaid flowcharts written')
