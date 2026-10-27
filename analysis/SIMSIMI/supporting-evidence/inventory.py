from pathlib import Path
import zipfile, xml.etree.ElementTree as ET, hashlib, json
root=Path(r'C:\Users\justi\Downloads\Web-20261002T152358Z-1-001\Web\SIMSIMI')
out=Path(__file__).parent
items=[]
for p in sorted(root.rglob('*')):
    if p.is_file():
        items.append({'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(out/'evidence/source-inventory.json').write_text(json.dumps(items,indent=2),encoding='utf-8')
doc=Path(r'C:\Users\justi\Downloads\Web-20261002T152358Z-1-001\Web\EDUCORE_SYSTEM_DOCU.docx')
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile(doc) as z:
    body=ET.fromstring(z.read('word/document.xml'))
    rows=[]
    for i,p in enumerate(body.findall('.//w:body/w:p',ns),1):
        s=''.join(t.text or '' for t in p.findall('.//w:t',ns))
        if s: rows.append(f'P{i}: {s}')
    for i,t in enumerate(body.findall('.//w:tbl',ns),1):
        rows.append(f'TABLE {i}')
        for r in t.findall('w:tr',ns):
            rows.append(' | '.join(''.join(x.text or '' for x in c.findall('.//w:t',ns)) for c in r.findall('w:tc',ns)))
    (out/'evidence/paper-extract.txt').write_text('\n'.join(rows),encoding='utf-8')
    media=[x for x in z.namelist() if x.startswith('word/media/')]
    for x in media:
        (out/'evidence'/Path(x).name).write_bytes(z.read(x))
print(json.dumps({'files':len(items),'js':sum(i['path'].endswith('.js') for i in items),'html':sum(i['path'].endswith('.html') for i in items),'media':media}))
