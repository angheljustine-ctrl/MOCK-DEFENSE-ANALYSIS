from pathlib import Path
from io import BytesIO
import json, hashlib
from pypdf import PdfReader,PdfWriter
from reportlab.pdfgen import canvas

base=Path(__file__).resolve().parent
pdf=base.parent/'synapse-MOCK-DEFENSE-REPORT.pdf'
reader=PdfReader(pdf); writer=PdfWriter()
assert len(reader.pages)==15, f'Unexpected pages: {len(reader.pages)}'
for i,page in enumerate(reader.pages):
    if i:
        stream=BytesIO(); c=canvas.Canvas(stream,pagesize=(float(page.mediabox.width),float(page.mediabox.height)))
        c.setFont('Helvetica',8);c.setFillColorRGB(.35,.40,.46)
        c.drawString(35,23,'SYNAPSETEN | Mock-defense review | 02 Oct 2026')
        c.drawRightString(float(page.mediabox.width)-35,23,f'{i+1} / {len(reader.pages)}')
        c.save();page.merge_page(PdfReader(stream).pages[0])
    writer.add_page(page)
writer.add_metadata({'/Title':'SynapseTen Clothing POS & Inventory - Mock Defense Report','/Author':'Codex','/Subject':'Standard combined source and paper review; isolated logic QA'})
with pdf.open('wb') as f:writer.write(f)

final=PdfReader(pdf); alltext='\n'.join(p.extract_text() for p in final.pages)
for phrase in ['Paper-to-system traceability','Domain capability baseline','Actual overall','Actual checkout','Actual return','Recommended system improvements','Validation, process correctness','Vibe-coding indicators','QA evidence','Five strongest panel questions']:
    assert phrase in alltext,phrase
for m in json.loads((base/'evidence/source-manifest.json').read_text()):
    assert hashlib.sha256((Path('E:/synapse')/m['file']).read_bytes()).hexdigest()==m['sha256'],m['file']
assert len(final.pages)==15
print('FINAL VERIFIED: 15 pages; mandatory sections present; all 13 source hashes unchanged')
