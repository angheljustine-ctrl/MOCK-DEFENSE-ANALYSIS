from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[1]
source=Path(r'D:/MOCK DEFENSE ANALYSIS/.agents/skills/mock-defense-analyzer/scripts/build-report-pdf.mjs')
text=source.read_text(encoding='utf-8')
text=text.replace('font-size:9.7pt; line-height:1.42','font-size:9.4pt; line-height:1.35')
text=text.replace('font-size:16pt; margin:8mm 0 3mm','font-size:14pt; margin:5mm 0 2.5mm')
text=text.replace('p { margin:0 0 3mm; }','p { margin:0 0 2.6mm; }')
text=text.replace('padding:4mm; border-radius:4px','padding:3mm; border-radius:4px')
text=text.replace("const base =", "body=body.replaceAll('<strong>High |','<strong style=\"color:#b34e10\">High |').replaceAll('<strong>Medium |','<strong style=\"color:#916300\">Medium |').replaceAll('<strong>Failed','<strong style=\"color:#a61b1b\">Failed').replaceAll('<strong>Passed','<strong style=\"color:#1d7a46\">Passed');\nconst base =")
profile=(root/'supporting-evidence/evidence/pdf-browser-profile').as_posix()
text=text.replace("'--headless', '--disable-gpu', '--disable-javascript', '--no-pdf-header-footer',",f"'--headless', '--disable-gpu', '--disable-javascript', '--no-pdf-header-footer', '--user-data-dir={profile}',")
# Edge may return its launcher before the PDF worker finishes on Windows.
text=text.replace("if (run.status !== 0 || !fs.existsSync(output)","for(let tries=0;tries<40&&!fs.existsSync(output);tries++) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,250);\nif (run.status !== 0 || !fs.existsSync(output)")
builder=root/'supporting-evidence/render-report.mjs';builder.write_text(text,encoding='utf-8')
node=r'C:/Users/justi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
out=root/'Doughnut-Disturb-MOCK-DEFENSE-REPORT-revised.pdf'
subprocess.run([node,str(builder),'--input',str(root/'supporting-evidence/report-source.md'),'--output',str(out),'--node-modules',r'C:/Users/justi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules','--browser',r'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'],check=True)
from pypdf import PdfReader,PdfWriter
from reportlab.pdfgen import canvas
from io import BytesIO
reader=PdfReader(out);pages=len(reader.pages);print(f'REVISED PDF: {pages} pages')
writer=PdfWriter()
for i,page in enumerate(reader.pages,1):
    buffer=BytesIO();c=canvas.Canvas(buffer,pagesize=(float(page.mediabox.width),float(page.mediabox.height)))
    c.setFont('Helvetica',7);c.setFillColorRGB(.35,.4,.46)
    if i>1:c.drawString(36,19,'Doughnut Disturb | Mock defense review | 03 October 2026')
    c.drawRightString(float(page.mediabox.width)-36,19,f'{i} / {pages}');c.save();buffer.seek(0)
    page.merge_page(PdfReader(buffer).pages[0]);writer.add_page(page)
writer.add_metadata({'/Title':'Doughnut Disturb Co. System and Paper Review','/Subject':'Standard combined mock-defense analysis','/Author':'Mock Defense Analysis'})
with (root/'Doughnut-Disturb-MOCK-DEFENSE-REPORT.pdf').open('wb') as f:writer.write(f)
out.unlink()
