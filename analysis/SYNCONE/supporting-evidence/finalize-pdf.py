from pathlib import Path
from io import BytesIO
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
base=Path(__file__).parent
pdf=base.parent/'SYNCONE-MOCK-DEFENSE-REPORT.pdf'
reader=PdfReader(pdf);writer=PdfWriter()
for i,page in enumerate(reader.pages):
    if i:
        b=BytesIO();c=canvas.Canvas(b,pagesize=(float(page.mediabox.width),float(page.mediabox.height)))
        c.setFont('Helvetica',8);c.setFillColorRGB(.35,.4,.46)
        c.drawString(34,22,'SYNCONE | Evidence-aware mock defense | 01 Oct 2026')
        c.drawRightString(float(page.mediabox.width)-34,22,f'{i+1} / {len(reader.pages)}')
        c.save();b.seek(0);page.merge_page(PdfReader(b).pages[0])
    writer.add_page(page)
buf=BytesIO();writer.write(buf);pdf.write_bytes(buf.getvalue())
assert 10<=len(reader.pages)<=15
print('Final PDF:',len(reader.pages),'pages')
