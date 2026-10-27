from pathlib import Path
from xml.sax.saxutils import escape
out=Path(__file__).parent/'flowcharts';out.mkdir(exist_ok=True)
class Diagram:
 def __init__(self,title,height):
  self.title=title;self.height=height;self.nodes={};self.edges=[]
 def node(self,id,x,y,kind,lines,w=230,h=54):
  if kind=='store':h=80
  if kind=='decision' and lines==['Exists / active / valid role?']:lines=['Account valid?']
  if kind=='decision' and lines==['Module / page allowed?']:lines=['Module allowed?']
  if kind=='decision' and lines==['Active / role valid?']:lines=['Valid login?']
  self.nodes[id]=(x,y,w,h,kind,lines)
 def edge(self,a,b,label='',points=None,dash=False):self.edges.append((a,b,label,points,dash))
 def save(self,name):
  svg=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 {self.height}" role="img" aria-label="{escape(self.title)}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10Z" fill="#45637a"/></marker></defs><rect width="820" height="{self.height}" fill="#fff"/>']
  for a,b,label,pts,dash in self.edges:
   ax,ay,aw,ah,*_=self.nodes[a];bx,by,bw,bh,*_=self.nodes[b]
   pts=pts or [(ax,ay+ah/2),(bx,by-bh/2)]
   svg.append(f'<polyline points="{" ".join(f"{x},{y}" for x,y in pts)}" fill="none" stroke="#45637a" stroke-width="2" marker-end="url(#arrow)"'+(' stroke-dasharray="6 4"' if dash else '')+'/>')
   if label:
    if len(pts)==2:x,y=(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2
    else:x,y=pts[len(pts)//2]
    svg.append(f'<text x="{x+8}" y="{y-8}" font-family="Arial" font-size="14" fill="#314d61">{escape(label)}</text>')
  mmd=['flowchart TD']
  for id,(x,y,w,h,k,ls) in self.nodes.items():
   fill='#fff1df' if k=='decision' else '#edf5fa';left=x-w/2;top=y-h/2
   attr=f'fill="{fill}" stroke="#185d88" stroke-width="1.8"'
   if k=='decision':svg.append(f'<polygon points="{x},{top} {x+w/2},{y} {x},{y+h/2} {left},{y}" {attr}/>')
   elif k=='io':svg.append(f'<polygon points="{left+15},{top} {x+w/2},{top} {x+w/2-15},{y+h/2} {left},{y+h/2}" {attr}/>')
   elif k=='store':
    svg.append(f'<path d="M{left} {top+10} A{w/2} 10 0 0 1 {left+w} {top+10} L{left+w} {top+h-10} A{w/2} 10 0 0 1 {left} {top+h-10} Z" {attr}/>')
    svg.append(f'<ellipse cx="{x}" cy="{top+10}" rx="{w/2}" ry="10" {attr}/>')
   else:svg.append(f'<rect x="{left}" y="{top}" width="{w}" height="{h}" rx="{h/2 if k=="terminal" else 3}" {attr}/>')
   for i,line in enumerate(ls):svg.append(f'<text x="{x}" y="{y-(len(ls)-1)*9+i*18+5}" text-anchor="middle" font-family="Arial" font-size="16" fill="#173c55">{escape(line)}</text>')
   text='<br/>'.join(ls);forms={'terminal':f'(["{text}"])','decision':f'{{"{text}"}}','io':f'[/"{text}"/]','store':f'[("{text}")]','process':f'["{text}"]'};mmd.append(f'    {id}{forms[k]}')
  for a,b,label,_,dash in self.edges:mmd.append(f'    {a} {"-.->" if dash else "-->"}'+(f'|"{label}"|' if label else '')+f' {b}')
  svg.append('</svg>');(out/(name+'.svg')).write_text(''.join(svg),encoding='utf-8');(out/(name+'.mmd')).write_text('\n'.join(mmd),encoding='utf-8')
d=Diagram('Overall browser-local workflow',770)
for args in [('A',290,35,'terminal',['Start']),('B',290,110,'decision',['Accounts exist?']),('C',640,110,'process',['Create Primary Admin','in user.php']),('D',290,200,'io',['Enter login credentials']),('E',290,275,'process',['Verify password hash']),('F',290,355,'decision',['Active / role valid?']),('G',640,355,'io',['Show login error']),('H',290,440,'process',['Open permitted module']),('I',290,525,'store',['Browser-local records']),('J',290,605,'io',['Tables / receipts / reports']),('K',290,690,'terminal',['Logout / end'])]:d.node(*args)
d.edge('A','B');d.edge('B','C','No',[(405,110),(525,110)]);d.edge('C','D','Setup then login',[(640,137),(640,200),(405,200)]);d.edge('B','D','Yes');d.edge('D','E');d.edge('E','F');d.edge('F','G','No',[(405,355),(525,355)]);d.edge('G','D','Retry',[(640,328),(755,328),(755,200),(405,200)]);d.edge('F','H','Yes');d.edge('H','I');d.edge('I','J');d.edge('J','H','Continue',[(175,605),(90,605),(90,440),(175,440)]);d.edge('J','K');d.save('overall')
d=Diagram('Actual checkout and failure paths',800)
for args in [('A',290,35,'terminal',['Start checkout']),('B',290,110,'io',['Cart and cash amount']),('C',290,185,'process',['Reload products','validate / clamp cart']),('D',290,265,'decision',['Stock / payment OK?']),('E',650,265,'io',['Show error / stop']),('F',290,350,'decision',['Confirm sale?']),('G',650,350,'terminal',['Cancel - no deduction']),('H',290,435,'process',['Deduct stock in memory','build sale + movements']),('I',290,525,'store',['Save products, movements,','then sale - separate writes']),('J',290,615,'decision',['All writes succeed?']),('K',650,615,'terminal',['Uncaught exception','partial state may remain']),('L',290,700,'io',['Clear cart / show success']),('M',290,765,'terminal',['End'])]:d.node(*args)
d.edge('A','B');d.edge('B','C');d.edge('C','D');d.edge('D','E','No',[(405,265),(535,265)]);d.edge('D','F','Yes');d.edge('F','G','No',[(405,350),(535,350)]);d.edge('F','H','Yes');d.edge('H','I');d.edge('I','J');d.edge('J','K','No',[(405,615),(535,615)]);d.edge('J','L','Yes');d.edge('L','M');d.save('checkout')
d=Diagram('Actual local-session authorization',720)
for args in [('A',290,35,'terminal',['Protected page opens']),('B',290,110,'io',['Read session user ID']),('C',290,190,'store',['Read hirazoraUsers','from localStorage']),('D',290,270,'process',['Match ID; refresh role']),('E',290,350,'decision',['Exists / active / valid role?']),('F',650,350,'io',['Clear session','redirect to login']),('G',290,445,'decision',['Module / page allowed?']),('H',650,445,'io',['Deny access','redirect to dashboard']),('I',290,535,'process',['Apply UI permissions']),('J',290,620,'terminal',['Page available']),('T',650,110,'io',['Local user can edit','session and stored account'])]:d.node(*args)
d.edge('A','B');d.edge('B','C');d.edge('C','D');d.edge('D','E');d.edge('E','F','No',[(405,350),(535,350)]);d.edge('E','G','Yes');d.edge('G','H','No',[(405,445),(535,445)]);d.edge('G','I','Yes');d.edge('I','J');d.edge('T','B','Edit',[(535,110),(405,110)],True);d.edge('T','C','Edit',[(650,137),(650,190),(405,190)],True);d.save('authorization')
