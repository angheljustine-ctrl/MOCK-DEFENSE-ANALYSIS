from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader
import pypdfium2 as pdfium

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'SIMSIMI-LIVE-DEMO-TESTS-AND-IMPROVEMENTS.pdf'
QA = ROOT / 'supporting-evidence' / 'live-demo-qa'
QA.mkdir(exist_ok=True)
pdfmetrics.registerFont(TTFont('Guide', r'C:\Windows\Fonts\arial.ttf'))
pdfmetrics.registerFont(TTFont('GuideBold', r'C:\Windows\Fonts\arialbd.ttf'))
pdfmetrics.registerFontFamily('Guide', normal='Guide', bold='GuideBold', italic='Guide', boldItalic='GuideBold')
navy = colors.HexColor('#17324D')
teal = colors.HexColor('#087F8C')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyGuide', fontName='Guide', fontSize=10.3, leading=14.3, textColor=navy, spaceAfter=7))
styles.add(ParagraphStyle(name='TitleGuide', fontName='GuideBold', fontSize=19, leading=23, textColor=navy, spaceAfter=13))
styles.add(ParagraphStyle(name='SmallGuide', parent=styles['BodyGuide'], fontSize=8.7, leading=12))
styles.add(ParagraphStyle(name='StepGuide', parent=styles['BodyGuide'], leftIndent=18, firstLineIndent=-18, spaceAfter=5))
styles.add(ParagraphStyle(name='LabelGuide', fontName='GuideBold', fontSize=10.3, leading=14, textColor=teal, spaceBefore=7, spaceAfter=5))
story = []

def p(text, style='BodyGuide'):
    story.append(Paragraph(text, styles[style]))

def label(text):
    p(text, 'LabelGuide')

def steps(items):
    for i, item in enumerate(items, 1):
        p(f'{i}. {item}', 'StepGuide')

def test(n, title, evidence):
    if n > 1:
        story.append(PageBreak())
    p(f'TEST {n} / 8', 'LabelGuide')
    p(title, 'TitleGuide')
    p(f'<b>Evidence:</b> {evidence}', 'SmallGuide')

p('EDUCORE SIMS | Live-demo guide', 'TitleGuide')
p('Ganito mo sila ipapatry sa presentation: ipagawa ang normal na transaction, tapos tingnan kung tama ang record, computation, at access. Sa bawat test, may eksaktong gagawin, palatandaan ng butas, at improvement.')
p('<b>Gumamit ng test student, test subject, at test product.</b> Kapag nagpapalit ng Admin, Teacher, at Student, mag-logout/login sa parehong browser at parehong site - doon naka-save ang data ng submitted system nila.')
p('<b>Evidence note:</b> Wrong-record Edit at HTML rendering ang nakita mismo sa browser. Ang ibang cases ay napatunayan sa isolated tests ng kanilang code; ang steps dito ang pang-recheck sa actual presentation version.', 'SmallGuide')
test(1, 'Search ng student, pero ibang student ang nae-edit', 'Nakita mismo sa browser.')
p('Ito ang pinakamadaling unahin; hindi kailangang mag-save o mag-delete.')
label('Sabihin mo')
p('"Mag-search kayo ng isang student, tapos i-edit ninyo ang lumabas. Tingnan natin kung siya talaga ang bubukas."')
label('Gagawin nila')
steps([
'Login bilang <b>Admin &gt; Students</b>.',
'Bago mag-search, tandaan ang pangalan at student number ng <b>unang student sa table</b>.',
'Sa <b>Search student...</b>, hanapin ang ibang student - hindi iyong unang row.',
'Gumamit ng pangalan o student number na magpapakita ng <b>isang result lang</b>.',
'Pindutin ang <b>Edit</b> ng result.',
'Ikumpara ang pangalan at student number sa form laban sa pinindot na row.',
'<b>Cancel</b> pagkatapos makita ang resulta.',
])
p('<b>Palatandaan ng butas:</b> ibang student ang nasa Edit form. Sa submitted version, puwedeng bumukas ang unang student sa original list.')
p('<b>Bakit mahalaga:</b> kapag itinuloy ang Save, maling student ang mababago. May kaparehong risk sa Delete.')
p('<b>Improvement:</b> gamitin ang permanent student ID para matukoy ang record. Sa implementation nila, napagpapalit ang position sa filtered results at position sa original list.')

test(2, 'Announcement na pang-teacher o Draft, nakikita ng student', 'Napatunayan sa isolated tests ng student-list logic; recheck sa live demo.')
p('Gawin itong <b>dalawang magkahiwalay na test</b> para malinaw kung audience rule o publishing rule ang pumalya.')
label('Test A - Teachers only')
steps([
'Admin &gt; <b>Announcements &gt; + Add Announcement</b>.',
'Ilagay: <b>Audience: Teachers</b>; <b>Title: PANEL TEST - TEACHERS ONLY</b>; <b>Status: Published</b>; <b>Announcement Content:</b> Para lamang sa teachers ang announcement na ito.',
'Pindutin ang <b>Save Announcement</b>.',
'Logout, login bilang Student.',
'Buksan ang <b>Announcements</b> at hanapin ang title.',
])
p('<b>Dapat:</b> hindi makita ng student.')
p('<b>Palatandaan ng butas:</b> lumabas sa student announcements ang Teachers-only notice.')
label('Test B - Draft')
steps([
'Bumalik sa Admin at gumawa ng announcement: <b>Audience: Students</b>; <b>Title: PANEL TEST - DRAFT</b>; <b>Status: Draft</b>; <b>Content:</b> Hindi pa ito dapat published.',
'Save.',
'Login bilang Student &gt; <b>Announcements</b>.',
])
p('<b>Dapat:</b> hindi pa makita ang Draft.')
p('<b>Palatandaan ng butas:</b> nababasa na ng student kahit hindi pa published. Sa tested student-list logic, hindi nasasala nang tama ang audience at status.')
p('<b>Improvement:</b> iisang visibility rule sa dashboard, announcements list, at detail view: tama ang audience <b>at</b> Published ang status.')
label('Follow-up mo')
p('"Kung may confidential teacher announcement, anong part ng system ang talagang pumipigil na mabasa ito ng student?"')

test(3, 'Inactive na student, nakakapasok pa rin', 'Napatunayan sa isolated tests ng login logic; recheck sa live demo.')
label('Sabihin mo')
p('"I-deactivate natin itong test account. Pagkatapos, subukan natin kung makakapag-login pa."')
label('Gagawin nila')
steps([
'Admin &gt; <b>Students</b>.',
'Gumamit ng test student na alam ang username at password.',
'Para hindi maapektuhan ng Test 1, <b>alisin muna ang search filter</b>, saka piliin ang tamang row.',
'Edit &gt; <b>Status: Inactive</b> &gt; <b>Save Student</b>.',
'Logout.',
'Sa login, piliin ang Student role at gamitin ang account na iyon.',
])
p('<b>Dapat, kung ang Inactive ay disabled account:</b> hindi makapasok; may malinaw na mensahe.')
p('<b>Palatandaan ng butas:</b> pumapasok pa rin sa student dashboard. Sa tested login logic, credentials ang chine-check pero hindi account status.')
p('<b>Improvement:</b> i-check ang account status sa login at sa access checks. Dapat pati dati nang naka-login na disabled account ay may malinaw na handling.')
label('Follow-up mo')
p('"Ano ang ibig sabihin ng Inactive sa system ninyo? Kung nakakapasok pa rin, anong restriction ang naipapatupad nito?"')
p('Kung ang kanilang documented meaning ay iba, doon ibase ang acceptance rule.')

test(4, 'Prelim lang ang may grade, pero may Final Grade at Passed na', 'Napatunayan sa isolated grading-logic tests; recheck sa live demo.')
label('Sabihin mo')
p('"Prelim pa lang ang available. Tingnan natin kung paano ninyo ipinapakita ang incomplete grades."')
label('Gagawin nila')
steps([
'Login bilang Teacher &gt; <b>My Grades</b>.',
'Piliin ang class na may enrolled test student.',
'Sa test student, ilagay: <b>Prelim: 90</b>; <b>Midterm: blank</b>; <b>Pre-Final: blank</b>; <b>Final: blank</b>.',
'Pindutin ang <b>Save</b> sa row.',
'Tingnan ang <b>Final Grade</b> at status.',
])
p('<b>Resulta sa tested logic:</b> nagiging <b>90.00 at Passed</b> kahit Prelim lang ang may laman.')
p('<b>Bakit problema:</b> mukhang tapos at pasado na ang buong subject, kahit kulang pa ang grading periods.')
p('<b>Improvement:</b> puwedeng magpakita ng running average, pero lagyan ng <b>Provisional/Pending</b>. Ang official final grade at Passed/Failed ay dapat sumusunod sa approved grading policy.')
label('Follow-up mo')
p('"Running average ba ito o official final grade? Kailan ninyo masasabi na kumpleto at puwede nang i-release?"')
p('Huwag agad ipilit ang particular weights; sila ang dapat magpakita ng grading policy na sinusuportahan nila.')

test(5, 'Cancelled order, pero hindi bumabalik ang stock', 'Napatunayan sa isolated cancellation-logic tests; recheck sa live demo.')
label('Sabihin mo')
p('"Bibili tayo ng dalawang item, tapos ika-cancel habang Pending. Tingnan natin kung babalik ang stock."')
label('Gagawin nila')
steps([
'Admin &gt; <b>School Store</b>.',
'Gumawa ng test product: <b>Name: PANEL TEST ITEM</b>; <b>Price: 100</b>; <b>Stock: 10</b>. Kumpletuhin ang ibang required fields para available ito.',
'Save at ipakita na stock ay <b>10</b>.',
'Logout &gt; Student &gt; <b>School Store</b>.',
'Idagdag sa cart ang <b>2 pieces</b> ng product.',
'<b>Proceed to Checkout</b>, saka tapusin ang checkout.',
'Admin &gt; School Store: dapat naging <b>8</b> ang stock.',
'Student &gt; <b>My Orders &gt; View Order</b>.',
'Habang <b>Pending</b>, pindutin ang <b>Cancel Order</b> at kumpirmahin.',
'Admin &gt; School Store: tingnan ulit ang stock.',
])
p('<b>Dapat:</b> bumalik sa <b>10</b>, kung cancellation bago fulfillment ang pinapayagan nilang process.')
p('<b>Palatandaan ng butas:</b> Cancelled na ang order pero stock ay <b>8 pa rin</b>. Iyan ang nangyari sa tested cancellation logic.')
p('<b>Improvement:</b> ang cancellation ay dapat mag-release ng reserved stock <b>isang beses lang</b>. Dapat malinaw din kung anong statuses ang puwedeng i-cancel.')
label('Follow-up mo')
p('"Kung sampung students ang nag-order tapos nag-cancel, paano magiging accurate ang available stock?"')

test(6, 'Pinalitan lang ang subject name, nawawala ang grade sa student view', 'Napatunayan sa isolated record-matching tests; recheck sa live demo.')
p('Ito ay para makita kung matibay ang relationship ng academic records.')
label('Gagawin nila')
steps([
'Gumawa ng test subject na <b>PANEL PROGRAMMING</b>, kasama ang required teacher assignment.',
'Gumawa ng class para rito at i-enroll ang test student.',
'Teacher &gt; My Grades: lagyan ng <b>85</b> ang apat na grading periods at Save.',
'Student &gt; <b>My Grades</b>: ipakita muna na visible ang subject at grade.',
'Admin &gt; <b>Subjects</b>: Edit ang subject.',
'Palitan <b>subject name lang</b>: mula <b>PANEL PROGRAMMING</b>, gawin <b>PANEL PROGRAMMING UPDATED</b>.',
'Save.',
'Student &gt; My Grades: tingnan ulit.',
])
p('<b>Dapat:</b> nandoon pa rin ang grade. Pangalan lang ang nagbago.')
p('<b>Palatandaan ng butas:</b> nawawala ang subject/grade sa student view. Sa tested path, hindi na nito maitugma ang enrollment na may lumang subject name.')
p('<b>Improvement:</b> permanent subject ID at class/enrollment ID ang gamitin sa relationships. Ang pangalan ay display information na puwedeng baguhin.')
label('Follow-up mo')
p('"Kapag nag-correct ng typo sa subject name, bakit maaapektuhan ang historical grade?"')

test(7, 'Parehong subject sa dalawang school year, nahahalo ang grades', 'Napatunayan sa isolated student-grade reader tests; recheck sa live demo.')
p('Mas mahaba ang setup nito; ipagawa kung may oras. Relevant ito sa retake at academic history.')
label('Gagawin nila')
steps([
'Gumawa ng <b>dalawang classes na parehong subject</b>: <b>Class A: school year 2026-2027</b>; <b>Class B: school year 2027-2028</b>.',
'Gumamit ng parehong course, year level, section, at teacher para madaling ma-enroll ang test student sa dalawang class.',
'I-enroll ang <b>parehong test student</b> sa parehong class.',
'Teacher &gt; My Grades: <b>Class A:</b> lahat ng grading periods ay <b>80</b>; Save. <b>Class B:</b> lahat ng grading periods ay <b>95</b>; Save.',
'Ipakita muna sa teacher view na magkaiba talaga ang saved grades.',
'Student &gt; <b>My Grades</b>: ikumpara ang dalawang subject entries.',
])
p('<b>Dapat:</b> malinaw na magkahiwalay ang class/school year at grades: <b>80</b> at <b>95</b>.')
p('<b>Palatandaan ng butas:</b> parehong grade ang lumabas - sa tested data, parehong <b>80</b> - kahit magkaiba ang grades sa teacher records.')
p('<b>Bakit nangyayari:</b> ang student reader ay tumutugma sa student at subject, pero hindi sapat ang pagtukoy sa mismong class/enrollment.')
p('<b>Improvement:</b> ang bawat grade ay dapat nakakabit sa specific enrollment/class at may school year at semester context.')
label('Follow-up mo')
p('"Paano ninyo pinaghihiwalay ang unang take at retake ng parehong subject?"')

test(8, 'Student name na may HTML, nagiging formatting sa table', 'Nakita mismo sa browser gamit ang harmless HTML marker.')
p('Simple at harmless na paraan ito para makita kung pangalan talaga ang tinatrato nilang input.')
label('Gagawin nila')
steps([
'Admin &gt; Students &gt; <b>+ Add Student</b>.',
'Sa <b>First Name</b>, ilagay nang eksakto: <font name="Courier">&lt;b&gt;PANEL TEST&lt;/b&gt;</font>.',
'<b>Last Name: Demo</b>.',
'Kumpletuhin ang ibang required fields gamit ang test values.',
'<b>Save Student</b>.',
'Tingnan ang pangalan sa table.',
])
p('<b>Dapat:</b> tanggihan ang hindi valid na name ayon sa kanilang rule, o ipakita ito bilang ordinaryong text.')
p('<b>Palatandaan ng butas:</b> nagiging bold na <b>PANEL TEST</b>, at nawawala ang literal na <font name="Courier">&lt;b&gt;</font> tags. Ibig sabihin, ini-interpret bilang HTML ang saved name.')
p('<b>Improvement:</b> ligtas na text rendering, gaya ng <font name="Courier">textContent</font>, at consistent validation.')
p('<b>Hangganan ng ebidensiya:</b> pinatutunayan nito ang HTML injection. Hindi natin ito dapat tawaging confirmed credential theft o executable attack.')

story.append(PageBreak())
p('Ano pa ang dapat meron sa system?', 'TitleGuide')
p('Para sa kanilang <b>student information system na may enrollment, grades, attendance, announcements, at school store</b>, ito ang makatuwirang priorities:')
rows = [
('Tamang record relationships', 'Hindi nagkakahalo ang student, subject, class, enrollment, school year, grades, at attendance kahit may search o rename.'),
('Malinaw na enrollment rules', 'Defined ang Active/Inactive classes, current term, duplicate enrollment, at historical/retake enrollment. May malinaw na exception kung pinapayagan.'),
('Grade completion at release rules', 'Magkaiba ang incomplete/running average at official final grade; approved ang computation at correction process.'),
('Attendance na naka-class at date', 'Hindi nadodoble o nahahalo ang attendance ng parehong subject sa magkaibang classes; malinaw ang Present/Absent/Late rules.'),
('Account at role restrictions', 'Disabled accounts ay may enforced restriction; students, teachers, at admins ay may malinaw na allowed actions at records.'),
('Consistent order at inventory handling', 'Checkout, cancellation, fulfillment, at stock changes ay nagtutugma; hindi puwedeng mag-double deduct o double return.'),
('Record history at safe archiving', 'Alam kung sino ang nagbago ng grade o record, kailan, at bakit. Hindi basta nawawala ang history kapag dinelete ang student/subject/class.'),
('Validated backup at restore', 'Tinatanggihan ang invalid backup bago galawin ang existing records; nasusubukang maibalik nang buo ang valid backup.'),
('Totoong save/error feedback', '"Saved successfully" lang kapag talagang na-save; malinaw ang error at hindi basta nawawala ang encoded work.'),
]
tabledata = [[Paragraph('<b>Dapat meron</b>', styles['SmallGuide']), Paragraph('<b>Konkretong ibig sabihin</b>', styles['SmallGuide'])]]
for a, b in rows:
    tabledata.append([Paragraph(f'<b>{escape(a)}</b>', styles['SmallGuide']), Paragraph(escape(b), styles['SmallGuide'])])
table = Table(tabledata, colWidths=[150, 361], repeatRows=1, hAlign='LEFT')
table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E3EEF3')),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F5F8FA')]),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('LEFTPADDING', (0,0), (-1,-1), 8), ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LINEBELOW', (0,0), (-1,0), 0.8, teal),
]))
story.append(table)
story.append(Spacer(1, 10))
p('<b>Kung actual school deployment ang claim nila,</b> kailangan ding may shared, trusted storage at authorization. Sa submitted version, browser Local Storage ang data at session; kailangan nilang maipaliwanag kung paano magkakaroon ng consistent records at protected access sa magkakaibang computers. Server-side authorization ang kailangang magpatupad ng access rules sa deployed system.', 'SmallGuide')
p('Source: <link href="https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html" color="#087F8C">OWASP Authorization guidance</link>.', 'SmallGuide')
p('Kung <b>local academic prototype</b> lang ang declared scope, patas na kilalanin ang limitasyong iyon. Hindi automatic requirement ang mobile app, online payment, SMS, o cloud hosting.', 'SmallGuide')
p('<b>Kung maikli lang ang presentation time, unahin mo ang Tests 1-5.</b> Madaling makita ang resulta, at sakop na nito ang record accuracy, announcement access, account status, grading, at inventory. Sa bawat isa, ipasabi sa kanila: <b>"Ano ang expected result, ano ang actual result, at anong rule ang kailangang ayusin?"</b>', 'SmallGuide')

def chrome(c, doc):
    c.saveState()
    w,h=A4
    c.setStrokeColor(teal)
    c.setLineWidth(1.2)
    c.line(42,h-31,w-42,h-31)
    c.setFont('Guide', 8)
    c.setFillColor(navy)
    c.drawString(42,h-23,'EDUCORE SIMS | Mock defense: actual demo tests')
    c.drawString(42,24,'Taglish guide | Submitted version review | 03 October 2026')
    c.drawRightString(w-42,24,f'{doc.page}')
    c.restoreState()

doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=42, leftMargin=42,
                        topMargin=45, bottomMargin=42, title='EDUCORE SIMS - Live Demo Tests and Improvements',
                        author='Mock Defense Analysis')
doc.build(story, onFirstPage=chrome, onLaterPages=chrome)
reader=PdfReader(OUT)
alltext=' '.join(' '.join(page.extract_text() for page in reader.pages).split())
for i in range(1,9):
    assert f'TEST {i} / 8' in alltext, i
for a,b in rows:
    assert a in alltext, a
for needle in ['Provisional/Pending', 'PANEL PROGRAMMING UPDATED', 'Teachers-only', 'isolated tests', 'credential theft', 'Tests 1-5']:
    assert needle in alltext, needle
assert len(reader.pages)==9, len(reader.pages)
pdf=pdfium.PdfDocument(str(OUT))
for i in range(len(pdf)):
    page=pdf[i]
    bitmap=page.render(scale=1.4)
    bitmap.to_pil().save(QA/f'page-{i+1:02}.png')
    page.close()
pdf.close()
print(f'CREATED {OUT}\nPAGES {len(reader.pages)}\nCONTENT CHECKS PASSED')
