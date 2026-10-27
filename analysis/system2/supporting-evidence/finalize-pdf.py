from pathlib import Path
from io import BytesIO
from collections import Counter
import json,csv,hashlib
from pypdf import PdfReader,PdfWriter
from reportlab.pdfgen import canvas
base=Path(__file__).parent
pdf=base.parent/'system2-MOCK-DEFENSE-REPORT.pdf'
reader=PdfReader(pdf);writer=PdfWriter();n=len(reader.pages)
for i,page in enumerate(reader.pages):
    w,h=float(page.mediabox.width),float(page.mediabox.height)
    b=BytesIO();c=canvas.Canvas(b,pagesize=(w,h));c.setFillColorRGB(.34,.39,.45);c.setFont('Helvetica',8)
    c.drawString(36,22,'REVCAST | Mock-defense analysis | 02 Oct 2026')
    c.drawRightString(w-36,22,f'{i+1} / {n}');c.save();b.seek(0)
    page.merge_page(PdfReader(b).pages[0]);writer.add_page(page)
writer.add_metadata({'/Title':'RevCast Employee Management & Payroll - Mock Defense Report','/Subject':'Standard combined paper and system analysis; Taglish','/Author':'Mock-defense review'})
buffer=BytesIO();writer.write(buffer);pdf.write_bytes(buffer.getvalue())
rows=json.loads((base/'evidence/qa-results.json').read_text())['results']
counts=Counter(r['status'] for r in rows)
assert len(rows)==15 and counts=={'Passed':5,'Failed':10},counts
inv=json.loads((base/'evidence/inventory.json').read_text());root=Path('E:/MOCK DEFENSE/WEBDEV/system2')
for item in inv:
    assert hashlib.sha256((root/item['path']).read_bytes()).hexdigest()==item['sha256'],item['path']
assert len(list(root.rglob('*')))-sum(p.is_dir() for p in root.rglob('*'))==len(inv)
final=PdfReader(pdf);text='\n'.join(p.extract_text() for p in final.pages)
for heading in ['Panel brief','Paper-to-system traceability','Domain capability baseline','Validation and process correctness','Important JavaScript','Vibe-coding indicators','Five strongest panel questions','QA results','Recommended system improvements']:
    assert heading in text,heading
assert n==15,n
(base/'evidence/pdf-extract.txt').write_text(text,encoding='utf-8')
with (base/'qa-test-cases.csv').open('w',encoding='utf-8-sig',newline='') as f:
    cols=['Test ID','Module','Category','Preconditions','Steps','Test Data','Expected Result','Actual Result','Status','Evidence','Severity','Source Reference','Notes']
    w=csv.DictWriter(f,fieldnames=cols);w.writeheader()
    for r in rows:w.writerow({'Test ID':r['id'],'Module':r['title'],'Category':'Risk-based acceptance','Preconditions':'Fresh isolated Edge context; demo seed; fixed Manila clock','Steps':'See embedded QA summary and run-checks.cjs','Test Data':'Synthetic browser records only','Expected Result':r['expected'],'Actual Result':json.dumps(r['actual'],ensure_ascii=False),'Status':r['status'],'Evidence':'evidence/qa-results.json','Severity':'See corresponding report finding','Source Reference':'js/script.js; mapped in report','Notes':'No submitted source modifications; no live user profile'})
(base/'evidence/final-check.json').write_text(json.dumps({'pdfPages':n,'qaCounts':dict(counts),'sourceFiles':len(inv),'sourceUnchanged':True,'requiredHeadingsPresent':True,'pdfBytes':pdf.stat().st_size},indent=2))
print(f'FINAL CHECK: {n} pages; {len(rows)} QA; {counts["Passed"]} passed/{counts["Failed"]} failed; {len(inv)} source files unchanged')
