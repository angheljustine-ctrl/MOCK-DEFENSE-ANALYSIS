from pathlib import Path
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader

base=Path(__file__).parent.parent
target=base/'AIT-LIVE-DEMO-PANEL-GUIDE.pdf'
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleGuide',fontName='Helvetica-Bold',fontSize=21,leading=25,textColor=colors.HexColor('#123f59'),spaceAfter=12))
styles.add(ParagraphStyle(name='SectionGuide',fontName='Helvetica-Bold',fontSize=14,leading=18,textColor=colors.HexColor('#146285'),spaceBefore=12,spaceAfter=7))
styles.add(ParagraphStyle(name='BodyGuide',fontName='Helvetica',fontSize=10.5,leading=14.5,spaceAfter=7))
styles.add(ParagraphStyle(name='StepGuide',parent=styles['BodyGuide'],leftIndent=16,firstLineIndent=-16,spaceAfter=4))
styles.add(ParagraphStyle(name='QuestionGuide',parent=styles['BodyGuide'],fontName='Helvetica-Bold',textColor=colors.HexColor('#124b67'),backColor=colors.HexColor('#edf6fb'),borderPadding=8,spaceBefore=5,spaceAfter=12))
styles.add(ParagraphStyle(name='CellGuide',parent=styles['BodyGuide'],fontSize=9,leading=12,spaceAfter=0))
story=[]
def p(text,style='BodyGuide'): story.append(Paragraph(text,styles[style]))
def heading(text): p(text,'SectionGuide')
def steps(items):
    for i,item in enumerate(items,1): p(f'{i}. {item}','StepGuide')
def label(name,text): p(f'<b>{name}:</b> {text}')
def question(text): p('&quot;'+text+'&quot;','QuestionGuide')
def table(rows,widths):
    cells=[[Paragraph(escape(c),styles['CellGuide']) for c in row] for row in rows]
    tab=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT')
    tab.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dcecf4')),('GRID',(0,0),(-1,-1),.5,colors.HexColor('#cedbe3')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f5f8fb')])]))
    story.append(tab)
def page(): story.append(PageBreak())

p('AIT Merchandise System<br/>Live-demo guide para sa panel','TitleGuide')
p('Exact na ipapagawa, makikitang result, tanong, at improvement. Batay ito sa submitted prototype at naunang local review. Review date: 02 October 2026.')
p('<b>Bago magsimula:</b> Sabihin, &quot;Gamit tayo ng dummy account at dummy requests para walang totoong records na maapektuhan.&quot; Unahin ang demos 1-3; madaling makita kahit walang coding knowledge.')
heading('1. Refresh status pero binabago ang status')
steps([
'Mag-register at mag-login gamit ang dummy account.',
'Mag-submit ng isang valid merchandise request.',
'Isulat o kopyahin ang Request ID.',
'Mag-logout.',
'Sa <b>Track Request</b>, ilagay ang kinopyang ID.',
'Pindutin ang <b>Track request</b>. Dapat <b>Submitted</b> muna.',
'Pindutin ang <b>Refresh status</b>. Tingnan kung naging <b>Processing</b>.',
'Pindutin ulit hanggang maging <b>Ready for Pickup</b>.',
'I-reload ang page at i-track ulit ang ID para makita kung naka-save ang pagbabago.'
])
label('Ang butas','Requester o logged-out visitor mismo ang nakakapagpausad ng fulfillment status. Walang staff na nag-confirm na na-process o naihanda ang item.')
question('Wala namang staff na naghanda ng merchandise. Bakit naging Ready for Pickup dahil lang pinindot ko ang Refresh?')
label('Dapat improvement','Refresh ay babasa lang ng latest status. Kung simulation lang, dapat <b>Simulate next status - demo only</b> ang button. Sa actual service, authorized staff lang ang magpapalit ng status.')
label('Evidence','Logged-out advance to Processing was confirmed sa earlier local test. Further stages and the final disabled button follow the code. Source: main.js lines 72-79 and 797-804.')
page()

p('Validation at contact delivery','TitleGuide')
heading('2. Uniform pero N/A ang size')
steps(['Mag-login.','Sa Request Form, piliin ang <b>School Uniform</b>.','Piliin ang <b>N/A</b> sa Size.','Quantity: <b>1</b>.','Pindutin ang <b>Submit request</b>.','Tingnan kung may successful confirmation at Request ID.'])
label('Ang butas','Kumpleto ang fields, pero hindi meaningful ang request. Paano ihahanda ang uniform kung walang garment size?')
question('Valid ba itong uniform request kahit N/A ang size? Ano ang ibibigay ng staff?')
label('Dapat improvement','School Uniform / PE Uniform: XS hanggang XXL. ID &amp; Laces: N/A kung walang size requirement. Size choices dapat nakadepende sa item.')
p('<b>Isa pang ipatry:</b> gumawa ng request na quantity ay <b>1000000</b>. Tinatanggap ito sa reviewed prototype. Itanong: &quot;May agreed maximum ba per request? Kung wala, paano ninyo hahawakan ang ganitong quantity?&quot; Hindi automatic na mali ang walang maximum; kailangan ng reasonable campus policy.')
label('Evidence','Uniform/N/A/1000000 was accepted through the ordinary UI sa earlier test. Source: index.html lines 211-224; main.js lines 663-678.')
heading('3. Contact: Message sent pero saan napunta?')
steps(['Pumunta sa <b>Contact</b>.','Ilagay ang dummy name, email, at message.','I-submit. Makikita ang <b>Message sent...</b>','Sabihin: <b>Pakita ngayon kung saan ito natanggap ng campus store team.</b>'])
p('<b>Technical confirmation:</b> bago mag-submit, pindutin ang <b>F12</b> -> <b>Network</b> -> <b>Fetch/XHR</b>. I-clear ang list, saka i-submit ang form. Tingnan kung may request na nagpapadala ng message. Sa tested submission, walang delivery request at walang message-storage operation.')
question('Bakit Message sent ang confirmation kung walang recipient o inbox na tumanggap?')
label('Dapat improvement','Kung prototype lang: <b>Demo only: hindi ipinadala ang message.</b> Kung actual feature, working intake at success confirmation pagkatapos talagang matanggap.')
label('Evidence','Confirmed client-only success text. Source: main.js lines 817-824. Walang store o external recipient na kinontak sa testing.')
page()

p('Unsafe display ng user name','TitleGuide')
heading('4. Pangalan na nagiging HTML')
p('Simpleng demo ito ng unsafe display. Hindi kailangang gumamit ng harmful script.')
steps(['Gumawa ng bagong dummy account.','Sa <b>Full Name</b>, ilagay nang eksakto: <font name="Courier">&lt;b&gt;TEST&lt;/b&gt;</font>','Gumamit ng bagong dummy Student/Staff ID at username.','Kumpletuhin ang registration at mag-login.','Tingnan ang <b>Hi, ...</b> greeting sa header.'])
label('Ang titingnan','Kung naging formatted na <b>TEST</b> at nawala ang literal na &lt;b&gt; tags, ini-interpret ang pangalan bilang HTML, hindi bilang ordinaryong text.')
label('Ang butas','Hindi dapat nagiging page markup ang personal-data field. Unsafe HTML rendering can also allow browser script execution, depende sa input.')
question('Bakit puwedeng maging HTML ang Full Name? Paano kung mas dangerous na markup ang inilagay?')
label('Dapat improvement','Ipakita ang pangalan bilang plain text. Hindi sapat na required ang field; kailangan ding safe ang pag-display.')
label('Evidence status','Ang simple <font name="Courier">&lt;b&gt;TEST&lt;/b&gt;</font> demonstration dito ay code-evidenced. Sa earlier local testing, ibang harmless name input ang ginamit at na-confirm ang execution ng in-memory script marker. Hindi kailangang ulitin ang script test sa presentation.')
label('Source','main.js line 224 uses innerHTML for the greeting. Registration captures the name at lines 353 and 381, then stores it at line 151.')
p('<b>Importanteng interpretation:</b> ang bold-name result ay nagpapakita ng HTML injection. Huwag itong ipresenta bilang proof na may data nang ninakaw o ibang device na na-compromise. Walang credential theft o remote spread na sinubukan sa review.')
page()

p('Local-storage limitations','TitleGuide')
heading('5. Password ay mababasa sa browser')
p('<b>Fresh demo browser na dummy accounts lang ang laman.</b> Huwag ipakita ang totoong passwords o existing personal records sa projector.')
steps(['Mag-register ng dummy account na may dummy password.','Pindutin ang <b>F12</b>.','Pumunta sa <b>Application</b> tab.','Buksan ang <b>Local Storage</b>, tapos piliin ang address ng system.','Hanapin ang <font name="Courier">ait_users</font>.','Tingnan ang dummy account record at ang <font name="Courier">password</font> field.'])
label('Ang makikita','Nakasulat ang dummy password bilang readable text.')
question('Kung shared computer ito, paano ninyo mapoprotektahan ang account information na naiwan sa browser?')
label('Dapat improvement','Dummy-only prototype muna. Bago real deployment, trusted authentication at protected password storage.')
label('Fair point','Inaamin na sa proposal na prototype authentication ito. Ito ay deployment limitation, hindi kailangang ipresenta na itinago nilang security feature. Plaintext dummy password was confirmed; source: main.js lines 156-158.')
heading('6. Request hindi makikita sa ibang browser')
steps(['Sa normal browser, gumawa ng dummy request.','Kopyahin ang Request ID.','Buksan ang parehong system sa <b>Incognito/InPrivate</b> o ibang browser.','I-track ang ID doon.'])
label('Ang makikita','Hindi mahahanap ang request dahil nasa unang browser lang ang records. Gumamit ng parehong site/address para hindi ibang system ang maikumpara.')
question('Kung sa sariling laptop nagsubmit ang student, paano makikita ng campus store staff ang request sa computer nila?')
label('Dapat improvement','Para sa actual service: shared storage at staff request queue.')
label('Fair point','Disclosed na local-only ang prototype. Ipinapakita nito kung bakit hindi pa actual online request service ang demo. A separate fresh browser context was tested and could not find the first context\'s request. Proposal page 7; main.js lines 38-55.')
page()

p('Ano pa ang dapat meron?','TitleGuide')
p('Ihiwalay ang <b>dapat ayusin ngayon</b> sa <b>kailangan bago actual gamitin</b> para fair ang evaluation. Merchandise request system ang basehan, hindi buong school-management platform.')
heading('Ayusin sa current prototype')
table([
['Dapat ayusin','Bakit'],
['Read-only Refresh at malinaw na simulator label','Hindi dapat mapagkamalang actual fulfillment ang button clicks.'],
['Product-specific size validation','Para meaningful at prepareable ang request.'],
['Defined quantity rules','Para malinaw kung ano ang acceptable request.'],
['Safe display ng names at records','Para hindi maging executable HTML ang user input.'],
['Honest contact confirmation','Para hindi umasa sa message na hindi naman ipinadala.'],
['Consistent save/error handling','Hindi dapat success sa screen pero hindi pala naka-save.'],
['Reliable unique Request IDs','Para hindi maging ambiguous ang tracking.'],
['Magkakatugmang proposal at documentation','Merchandise ang actual source, pero may ibang school-management claims sa documentation.']
],[235,276])
heading('Bago gamitin sa totoong campus operations')
p('<b>Staff dashboard:</b> makita at ma-review ang requests. <b>Trusted staff permissions:</b> hindi sapat ang self-selected Staff account. <b>Shared records:</b> parehong request sa student at staff devices.')
p('<b>Request handling:</b> accept, reject, cancel, at reason kung unavailable. <b>Availability policy:</b> request lang ba o guaranteed stock/reservation? <b>Pickup completion:</b> hiwalay ang Ready for Pickup at Collected.')
p('<b>Status history:</b> sino ang nag-update, kailan, at bakit. <b>Recovery at personal-data handling:</b> backup, retention, at correction process.')
p('<b>Hindi kailangang hingin:</b> grades, attendance, enrollment, online payment, delivery, o mobile app. Excluded ang mga iyon sa focused System Proposal, page 7. Ang staff/backend capabilities ay future work under that proposal, hindi missing prototype requirements.')
question('Paano makakarating ang request mula sa student papunta sa authorized staff, at paano mapapatunayang totoong naihanda at na-release ang merchandise?')

def footer(canvas,doc):
    canvas.saveState(); canvas.setFont('Helvetica',8); canvas.setFillColor(colors.HexColor('#647789'))
    canvas.drawString(42,25,'AIT | Live-demo panel guide | Dummy data only')
    canvas.drawRightString(A4[0]-42,25,str(doc.page)); canvas.restoreState()
doc=SimpleDocTemplate(str(target),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=38,bottomMargin=44,title='AIT Live-demo Panel Guide',author='Mock Defense Analysis')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
r=PdfReader(target)
assert len(r.pages)==5, f'Unexpected pagination: {len(r.pages)}'
text='\n'.join(pg.extract_text() for pg in r.pages)
for phrase in ['1. Refresh status','2. Uniform','3. Contact','4. Pangalan','5. Password','6. Request','Ano pa ang dapat meron?','<b>TEST</b>']:
    assert phrase in text,phrase
print(f'CREATED AND VERIFIED: {target} | {len(r.pages)} pages')
