from pathlib import Path
import re, html, json, csv, hashlib
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Preformatted, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.graphics.shapes import Drawing, Rect, Ellipse, Polygon, Line, String, Path as GPath
from reportlab.graphics import renderSVG
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

BASE=Path(__file__).parent
OUT=BASE.parent/'nightbaby-pos-ims-MOCK-DEFENSE-REPORT.pdf'
CHARTS=BASE/'flowcharts'; CHARTS.mkdir(exist_ok=True)
FONT=Path('C:/Windows/Fonts')
for name,filename in [('Body','arial.ttf'),('Bold','arialbd.ttf'),('Mono','consola.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(FONT/filename)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Body',boldItalic='Bold')
INK=colors.HexColor('#17283A'); TEAL=colors.HexColor('#007D83'); GRAY=colors.HexColor('#EEF3F5')
styles={
 'body':ParagraphStyle('body',fontName='Body',fontSize=9.1,leading=12.25,textColor=INK,spaceAfter=7),
 'h1':ParagraphStyle('h1',fontName='Bold',fontSize=32,leading=37,textColor=INK,spaceAfter=12),
 'h2':ParagraphStyle('h2',fontName='Bold',fontSize=17,leading=21,textColor=TEAL,spaceAfter=13),
 'h3':ParagraphStyle('h3',fontName='Bold',fontSize=10.8,leading=14,textColor=INK,spaceBefore=7,spaceAfter=6),
 'cell':ParagraphStyle('cell',fontName='Body',fontSize=8.2,leading=10.5,textColor=INK),
 'headcell':ParagraphStyle('headcell',fontName='Bold',fontSize=8.4,leading=11,textColor=colors.white),
 'code':ParagraphStyle('code',fontName='Mono',fontSize=7.15,leading=8.6,textColor=INK,backColor=GRAY,borderPadding=6,spaceAfter=6),
}
def fmt(s):
    s=html.escape(s)
    s=re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',s)
    s=re.sub(r'(https://[^\s]+)',r'<link href="\1" color="#007D83">\1</link>',s)
    return s
def para(s,key='body'): return Paragraph(fmt(s),styles[key])

def chart(name,nodes,edges,mermaid):
    d=Drawing(510,495)
    specs={n[0]:n for n in nodes}
    def arrow(points,label=None):
        for (x1,y1),(x2,y2) in zip(points,points[1:]): d.add(Line(x1,y1,x2,y2,strokeColor=INK,strokeWidth=1.15))
        (x1,y1),(x2,y2)=points[-2:]; dx=x2-x1;dy=y2-y1; length=(dx*dx+dy*dy)**.5
        if length:
            ux,uy=dx/length,dy/length
            d.add(Polygon([x2,y2,x2-7*ux+3*uy,y2-7*uy-3*ux,x2-7*ux-3*uy,y2-7*uy+3*ux],fillColor=INK,strokeColor=INK))
        if label:
            x,y=points[len(points)//2]; d.add(String(x+6,y+6,label,fontName='Bold',fontSize=8,fillColor=TEAL))
    for points,label in edges: arrow(points,label)
    for ident,shape,x,y,w,h,label in nodes:
        opts={'strokeColor':TEAL,'fillColor':colors.HexColor('#F2FAFA'),'strokeWidth':1.1}
        if shape=='term':d.add(Rect(x-w/2,y-h/2,w,h,rx=h/2,ry=h/2,**opts))
        elif shape=='decision': d.add(Polygon([x,y+h/2,x+w/2,y,x,y-h/2,x-w/2,y],**opts))
        elif shape=='io': d.add(Polygon([x-w/2+10,y+h/2,x+w/2,y+h/2,x+w/2-10,y-h/2,x-w/2,y-h/2],**opts))
        elif shape=='db':
            d.add(Rect(x-w/2,y-h/2+6,w,h-12,**opts));d.add(Ellipse(x,y+h/2-6,w/2,6,**opts));
            p=GPath(strokeColor=TEAL,fillColor=None,strokeWidth=1.1);p.moveTo(x-w/2,y-h/2+6);p.curveTo(x-w/2,y-h/2-2,x+w/2,y-h/2-2,x+w/2,y-h/2+6);d.add(p)
        else:d.add(Rect(x-w/2,y-h/2,w,h,**opts))
        labels=label.split('\n')
        for j,line in enumerate(labels):d.add(String(x,y+(len(labels)-1)*5-j*10-3,line,textAnchor='middle',fontName='Body',fontSize=8.4,fillColor=INK))
    (CHARTS/(name+'.svg')).write_text(renderSVG.drawToString(d),encoding='utf-8')
    (CHARTS/(name+'.mmd')).write_text(mermaid,encoding='utf-8')
    return d

charts={}
charts['overall']=chart('overall',[
 ('a','term',180,471,125,28,'Start'),('b','io',180,418,178,34,'Enter username/password'),('c','decision',180,347,170,58,'Valid, enabled\nand not locked?'),('d','decision',180,265,164,58,'Role allows\nrequested page?'),('e','process',180,191,178,35,'Perform module action'),('f','db',180,124,178,40,'Browser localStorage'),('g','io',180,62,178,32,'Refresh UI / show result'),('h','term',180,16,125,26,'Continue / logout'),('i','io',408,347,156,35,'Show login error'),('j','io',408,265,156,35,'Redirect allowed page')],
 [([(180,457),(180,435)],None),([(180,401),(180,376)],None),([(180,318),(180,294)],'Yes'),([(265,347),(330,347)],'No'),([(408,365),(408,418),(269,418)],None),([(180,236),(180,209)],'Yes'),([(262,265),(330,265)],'No'),([(408,247),(408,191),(269,191)],None),([(180,173),(180,144)],None),([(180,104),(180,78)],None),([(180,46),(180,29)],None)],
 'flowchart TD\n A([Start]) --> B[/Enter credentials/]\n B --> C{Valid, enabled and unlocked?}\n C -- No --> I[/Login error/]\n I --> B\n C -- Yes --> D{Role allows page?}\n D -- No --> J[/Redirect allowed page/]\n J --> E[Module action]\n D -- Yes --> E\n E --> F[(Browser localStorage)]\n F --> G[/Refresh UI and result/]\n G --> H([Continue or logout])\n')
charts['sale']=chart('sale',[
 ('a','term',165,471,126,28,'Cart ready'),('b','io',165,420,178,34,'Enter payment'),('c','decision',165,347,180,58,'Required fields and\npayment sufficient?'),('d','db',165,271,178,38,'Save transaction first'),('e','decision',165,195,170,56,'Transaction write\nsucceeded?'),('f','process',165,126,195,35,'Deduct stock; save products'),('g','io',165,62,195,36,'Clear cart / receipt / success'),('h','term',165,15,126,26,'End'),('i','io',401,347,165,34,'Reject / enter again'),('j','io',401,195,165,34,'Stop on quota error'),('k','process',407,126,171,40,'No final live-stock check\nProduct failure ignored')],
 [([(165,457),(165,437)],None),([(165,403),(165,376)],None),([(255,347),(318,347)],'No'),([(401,365),(401,420),(254,420)],None),([(165,318),(165,290)],'Yes'),([(165,252),(165,223)],None),([(250,195),(318,195)],'No'),([(401,178),(401,15),(228,15)],None),([(165,167),(165,144)],'Yes'),([(263,126),(321,126)],None),([(165,108),(165,80)],None),([(165,44),(165,28)],None)],
 'flowchart TD\n A([Cart ready]) --> B[/Enter payment/]\n B --> C{Fields and payment valid?}\n C -- No --> I[/Reject/]\n I --> B\n C -- Yes --> D[(Save transaction)]\n D --> E{Write succeeded?}\n E -- No --> J[/Stop on quota error/]\n J --> H([End])\n E -- Yes --> F[Deduct stock and save products]\n F --> K[No final live-stock check; product failure ignored]\n F --> G[/Clear cart, show receipt and success/]\n G --> H\n')
charts['session']=chart('session',[
 ('a','term',166,471,148,28,'Protected page requested'),('b','db',166,412,180,40,'Read nb_session JSON'),('c','decision',166,337,175,56,'Session exists\nand not expired?'),('d','process',166,260,195,38,'Refresh expiry by 8 hours'),('e','decision',166,184,175,56,'Stored role allows\nthis page?'),('f','io',166,113,178,34,'Allow page'),('g','term',166,49,125,28,'Continue'),('h','io',404,337,168,35,'Logout / redirect login'),('i','io',404,184,168,35,'Redirect allowed page'),('j','process',405,260,173,40,'No current-user/token\nvalidation here')],
 [([(166,457),(166,432)],None),([(166,392),(166,365)],None),([(253,337),(320,337)],'No'),([(166,309),(166,279)],'Yes'),([(264,260),(318,260)],None),([(166,241),(166,212)],None),([(253,184),(320,184)],'No'),([(166,156),(166,130)],'Yes'),([(166,96),(166,63)],None)],
 'flowchart TD\n A([Protected page]) --> B[(Read nb_session)]\n B --> C{Session exists and not expired?}\n C -- No --> H[/Logout or redirect login/]\n C -- Yes --> D[Refresh expiry eight hours]\n D --> J[No current user or token validation]\n D --> E{Stored role allows page?}\n E -- No --> I[/Redirect allowed page/]\n E -- Yes --> F[/Allow page/]\n F --> G([Continue])\n')

text=(BASE/'report-source.md').read_text(encoding='utf-8')
story=[]
for pageindex,section in enumerate(text.split('<!-- PAGE -->')):
    if pageindex:story.append(PageBreak())
    rows=section.strip().splitlines();i=0
    while i<len(rows):
        line=rows[i].strip()
        if not line:i+=1;continue
        if line.startswith('```'):
            code=[];i+=1
            while i<len(rows) and not rows[i].startswith('```'):code.append(rows[i].rstrip());i+=1
            # Preserve exact excerpt text; only remove common leading indentation.
            import textwrap
            story.append(Preformatted(textwrap.dedent('\n'.join(code)),styles['code']));i+=1;continue
        if line.startswith('|'):
            table=[]
            while i<len(rows) and rows[i].strip().startswith('|'):
                table.append([c.strip() for c in rows[i].strip().strip('|').split('|')]);i+=1
            data=[[para(c,'headcell' if j==0 else 'cell') for c in row] for j,row in enumerate(table)]
            widths=[137,225,145] if pageindex not in [1,10] else [160,190,157]
            t=Table(data,colWidths=widths,hAlign='LEFT',repeatRows=1)
            t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),TEAL),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,GRAY]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LINEBELOW',(0,0),(-1,0),0.4,TEAL)]))
            story.extend([t,Spacer(1,9)]);continue
        if line.startswith('!['):
            name=re.search(r'flowcharts/(\w+)\.svg',line).group(1)
            drawing=charts[name]; drawing.scale(0.92,0.92); drawing.width*=0.92; drawing.height*=0.92
            story.extend([drawing,Spacer(1,9)]);i+=1;continue
        if line.startswith('# '):story.append(para(line[2:],'h1'))
        elif line.startswith('## '):story.append(para(line[3:],'h2'))
        elif line.startswith('### '):story.append(para(line[4:],'h3'))
        elif line.startswith('- '):story.append(para('• '+line[2:]))
        else:story.append(para(line))
        i+=1

def footer(canvas,doc):
    w,h=A4;canvas.setStrokeColor(TEAL);canvas.setLineWidth(2);canvas.line(44,h-30,w-44,h-30)
    canvas.setFont('Body',7.2);canvas.setFillColor(INK);canvas.drawString(44,25,'NIGHTBABY | Mock Defense | Evidence-aware review | 01 Oct 2026')
    canvas.drawRightString(w-44,25,str(doc.page));canvas.setTitle('Nightbaby POS/IMS - Mock Defense Report');canvas.setAuthor('Mock Defense Analysis')
doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=44,leftMargin=44,topMargin=47,bottomMargin=42)
doc.build(story,onFirstPage=footer,onLaterPages=footer)
results=json.loads((BASE/'evidence/check-results.json').read_text())['results']
columns=['Test ID','Module','Category','Preconditions','Steps','Test Data','Expected Result','Actual Result','Status','Evidence','Severity','Source Reference','Notes']
with (BASE/'qa-test-cases.csv').open('w',newline='',encoding='utf-8') as f:
    writer=csv.DictWriter(f,fieldnames=columns);writer.writeheader()
    for r in results:writer.writerow({'Test ID':r['id'],'Module':r['name'],'Category':r['kind'],'Preconditions':'Synthetic VM; no business data','Steps':r['name'],'Test Data':'Synthetic only','Expected Result':r['expected'],'Actual Result':r['actual'],'Status':r['status'],'Evidence':'evidence/check-results.json','Severity':'See report findings','Source Reference':'See report sections 7-8,12','Notes':'Diagnostic assertions verify observation, not a passing app'})
print(OUT)
