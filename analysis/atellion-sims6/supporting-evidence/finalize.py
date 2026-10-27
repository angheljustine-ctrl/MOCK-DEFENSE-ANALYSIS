from pathlib import Path
from io import BytesIO
from pypdf import PdfReader,PdfWriter
from reportlab.pdfgen import canvas
import json
root=Path(__file__).parent
pdf=root.parent/'atellion-sims6-MOCK-DEFENSE-REPORT.pdf'
reader=PdfReader(pdf);writer=PdfWriter()
assert len(reader.pages)==14
for i,page in enumerate(reader.pages):
    buf=BytesIO();w=float(page.mediabox.width);h=float(page.mediabox.height)
    c=canvas.Canvas(buf,pagesize=(w,h));c.setFont('Helvetica',8);c.setFillColorRGB(.35,.40,.46)
    c.drawString(34,19,'ATELLION SIMS | Standard mock-defense review')
    c.drawRightString(w-34,19,f'{i+1} / {len(reader.pages)}');c.save();buf.seek(0)
    page.merge_page(PdfReader(buf).pages[0]);writer.add_page(page)
writer.add_metadata({'/Title':'Atellion SIMS - Mock Defense Report','/Subject':'Evidence-aware Standard review, 1 October 2026'})
with pdf.open('wb') as f:writer.write(f)
text='\n'.join(p.extract_text() for p in PdfReader(pdf).pages)
for section in ['Panel brief','Domain capability baseline','Flowchart 1','Flowcharts 2 and 3','F01','F10','Recommended system improvements','Validation coverage','Important JavaScript','Vibe-coding indicators','QA summary','Five strongest panel questions','Coverage, assumptions']:
    assert section in text,section
results=json.loads((root/'qa-results.json').read_text());assert len(results)==14
assert sum(r['status']=='Passed' for r in results)==4
assert sum(r['status']=='Failed' for r in results)==9
assert len(list((root/'flowcharts').glob('*.svg')))==3
(root/'verification.json').write_text(json.dumps({'pages':14,'qa':{'passed':4,'failed':9,'not_run':1},'diagrams':3,'required_sections':'present'},indent=2))
print('PDF CONTENT VERIFIED: 14 pages, 3 diagrams, 14 QA cases')
