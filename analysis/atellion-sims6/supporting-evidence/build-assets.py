from pathlib import Path
import json,html,csv
root=Path(__file__).parent
charts=root/'flowcharts';charts.mkdir(exist_ok=True)
def diagram(name,nodes,edges,w=900,h=640):
    parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#34566d"/></marker></defs><rect width="100%" height="100%" fill="#f6f9fc"/>']
    mmd=['flowchart TD'];lookup={}
    for ident,label,shape,x,y in nodes:
        lookup[ident]=(x,y);text=html.escape(label);color='#fff1d6' if shape=='decision' else '#e4f2f9'
        if shape=='decision':s=f'<polygon points="{x},{y-36} {x+105},{y} {x},{y+36} {x-105},{y}"';syntax='{'+label+'}'
        elif shape=='io':s=f'<polygon points="{x-93},{y-27} {x+105},{y-27} {x+93},{y+27} {x-105},{y+27}"';syntax='[/'+label+'/]'
        elif shape=='store':s=f'<path d="M{x-100},{y-20} C{x-100},{y-40} {x+100},{y-40} {x+100},{y-20} L{x+100},{y+20} C{x+100},{y+40} {x-100},{y+40} {x-100},{y+20} Z M{x-100},{y-20} C{x-100},{y} {x+100},{y} {x+100},{y-20}"';syntax='[('+label+')]'
        else:s=f'<rect x="{x-100}" y="{y-27}" width="200" height="54" rx="{27 if shape=="end" else 3}"';syntax='(['+label+'])' if shape=='end' else '['+label+']'
        parts.append(s+f' fill="{color}" stroke="#125e8a" stroke-width="2"/>')
        lines=label.split('|')
        for i,line in enumerate(lines):parts.append(f'<text x="{x}" y="{y+(i-(len(lines)-1)/2)*17+5}" text-anchor="middle" font-family="Arial" font-size="15" fill="#17364b">{html.escape(line)}</text>')
        mmd.append(f' {ident}{syntax.replace("|"," ")}')
    # Edges are routed after shapes but never pass through node interiors.
    for a,b,label,route in edges:
        points=route
        dashed=' stroke-dasharray="6 4"' if name=='auth' and a=='J' else ''
        parts.append(f'<polyline points="{points}" fill="none" stroke="#34566d" stroke-width="2"{dashed} marker-end="url(#arrow)"/>')
        pts=[tuple(map(float,p.split(','))) for p in points.split(' ')]
        import math
        lengths=[math.dist(p,q) for p,q in zip(pts,pts[1:])];remaining=sum(lengths)/2
        for i,length in enumerate(lengths):
            if remaining<=length:
                fraction=remaining/length;mx=pts[i][0]+fraction*(pts[i+1][0]-pts[i][0]);my=pts[i][1]+fraction*(pts[i+1][1]-pts[i][1]);break
            remaining-=length
        horizontal=pts[i][1]==pts[i+1][1]
        anchor='middle' if horizontal else 'start'
        if label:parts.append(f'<text x="{mx if horizontal else mx+8}" y="{max(15,my-8)}" text-anchor="{anchor}" font-family="Arial" font-size="13" fill="#5b400e">{html.escape(label)}</text>')
        mmd.append(f' {a} -. {label} .-> {b}' if dashed else f' {a} -- {label} --> {b}' if label else f' {a} --> {b}')
    parts.append('</svg>');(charts/(name+'.svg')).write_text(''.join(parts),encoding='utf8');(charts/(name+'.mmd')).write_text('\n'.join(mmd),encoding='utf8')
diagram('overall',[
 ('A','Open SIMS','end',450,45),('B','Seed flag exists?','decision',450,130),('C','Write demo records','store',160,130),('D','Session object exists?','decision',450,230),('E','Enter credentials','io',160,230),('F','Local match?','decision',160,335),('G','Show login error','io',160,440),('H','Role page handler','process',450,335),('I','Read / write records','store',450,440),('J','Show result','io',450,540),('K','End / next action','end',450,615)],
 [('A','B','', '450,72 450,94'),('B','C','No','345,130 260,130'),('C','D','','160,158 160,181 450,181 450,194'),('B','D','Yes','450,166 450,194'),('D','E','No','345,230 260,230'),('D','H','Yes','450,266 450,308'),('E','F','','160,257 160,299'),('F','G','No','160,371 160,413'),('G','E','Retry','60,440 30,440 30,230 55,230'),('F','H','Yes','265,335 350,335'),('H','I','','450,362 450,406'),('I','J','','450,474 450,513'),('J','K','','450,567 450,588')],h=660)
diagram('order',[
 ('A','Enter quantity','io',130,60),('B','Fresh stock available?','decision',380,60),('C','Show no-stock error','io',670,60),('D','Save reduced stock','store',380,165),('E','Save order succeeds?','decision',380,275),('F','Stock stays reduced|no new order','end',670,275),('G','Pending reservation','process',130,275),('H','Admin action?','decision',130,385),('I','Approve then claim','process',400,385),('J','Cancel / reject|restore stock','process',130,495),('K','Completed','end',670,385),('L','Cancelled / Rejected','end',400,495)],
 [('A','B','','230,60 275,60'),('B','C','No','485,60 570,60'),('B','D','Yes','380,96 380,131'),('D','E','','380,199 380,239'),('E','F','No','485,275 570,275'),('E','G','Yes','275,275 230,275'),('G','H','','130,302 130,349'),('H','I','Approve','235,385 300,385'),('I','K','Claim','500,385 570,385'),('H','J','Reverse','130,421 130,468'),('J','L','','230,495 300,495')],h=545)
diagram('auth',[
 ('A','Enter username/password','io',140,65),('B','Compare local users','process',400,65),('C','Matches?','decision',665,65),('D','Show login error','io',665,175),('E','Store matched object','store',400,175),('F','Read session object','process',400,285),('G','Object exists?','decision',400,395),('H','Login screen','io',665,395),('I','Role-selected page','end',130,395),('J','Synthetic forged object','io',130,285)],
 [('A','B','','240,65 300,65'),('B','C','','500,65 560,65'),('C','D','No','665,101 665,148'),('C','E','Yes','615,83 615,120 400,120 400,141'),('E','F','','400,209 400,258'),('F','G','','400,312 400,359'),('G','H','No','505,395 565,395'),('G','I','Yes','295,395 230,395'),('J','F','Accepted','230,285 300,285'),('D','A','Retry','765,175 820,175 820,10 140,10 140,38')],h=455)
results=json.loads((root/'qa-results.json').read_text())
with (root/'qa-test-cases.csv').open('w',encoding='utf-8',newline='') as f:
    fields=['Test ID','Module','Category','Preconditions','Steps','Test Data','Expected Result','Actual Result','Status','Evidence','Severity','Source Reference','Notes'];writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
    for r in results:writer.writerow({'Test ID':r['id'],'Module':r['name'],'Category':'risk-based','Preconditions':'isolated synthetic VM','Steps':r['name'],'Test Data':'checks.cjs fixture','Expected Result':str(r['expected']),'Actual Result':str(r['actual']),'Status':r['status'],'Evidence':'original-function harness' if r['status']!='Not Run' else 'no browser/policy acceptance','Severity':'See report','Source Reference':'See findings/QA','Notes':'Not a full-browser test'})
print('ASSETS READY')
