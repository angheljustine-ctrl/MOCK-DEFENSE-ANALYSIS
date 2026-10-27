from pathlib import Path
import hashlib,json,zipfile,xml.etree.ElementTree as ET
from pypdf import PdfReader
root=Path(r'D:\MOCK DEFENSE ANALYSIS\tmp\hirazora-intake-20261003')
out=Path(r'D:\MOCK DEFENSE ANALYSIS\analysis\hirazora\supporting-evidence\evidence')
out.mkdir(parents=True,exist_ok=True)
manifest=[]
for p in sorted(root.rglob('*')):
    if p.is_file():
        manifest.append({'path':str(p.relative_to(root)), 'size':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
        if p.suffix.lower()=='.pdf':
            doc=PdfReader(p)
            text='\n'.join(f'\n=== PAGE {i+1} ===\n'+page.extract_text() for i,page in enumerate(doc.pages))
            (out/'paper-pdf.txt').write_text(text,encoding='utf-8')
            print(f'PDF pages: {len(doc.pages)}\n{text}')
        if p.suffix.lower()=='.docx':
            with zipfile.ZipFile(p) as z:
                tree=ET.fromstring(z.read('word/document.xml'))
                ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
                text='\n'.join(''.join(t.itertext()) for t in tree.findall('.//w:p',ns))
            (out/'paper-docx.txt').write_text(text,encoding='utf-8')
            print(f'DOCX:\n{text}')
(out/'source-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
z=Path(r'C:\Users\justi\Downloads\SYSTEM -20261003T004229Z-1-001.zip')
(out/'zip-sha256.txt').write_text(hashlib.sha256(z.read_bytes()).hexdigest())
