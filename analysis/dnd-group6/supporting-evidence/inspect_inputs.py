from pathlib import Path
import zipfile, xml.etree.ElementTree as ET, hashlib, json
root=Path(__file__).resolve().parents[1]
src=root/'submission/source/sistem'
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
docx=next((root/'submission/BSIT 3B GROUP 6').glob('*.docx'))
with zipfile.ZipFile(docx) as z:
    tree=ET.fromstring(z.read('word/document.xml'))
    paras=[]
    for i,p in enumerate(tree.findall('.//w:p',ns),1):
        text=''.join(t.text or '' for t in p.findall('.//w:t',ns))
        if text.strip(): paras.append(f'P{i:04d} {text}')
    (root/'supporting-evidence/evidence/paper-text.txt').write_text('\n'.join(paras),encoding='utf-8')
    media=[n for n in z.namelist() if n.startswith('word/media/')]
    out=root/'supporting-evidence/evidence/paper-media';out.mkdir(exist_ok=True)
    for n in media:
        try: (out/Path(n).name).write_bytes(z.read(n))
        except zipfile.BadZipFile as err: print('Paper media integrity limitation:',err)
manifest=[]
for p in sorted(src.rglob('*')):
    if p.is_file(): manifest.append({'path':p.relative_to(src).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(root/'supporting-evidence/evidence/source-inventory.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
for p in sorted(src.glob('js/*.js')):
    out=root/'supporting-evidence/evidence'/f'{p.stem}-numbered.txt'
    out.write_text('\n'.join(f'{i:4}: {line}' for i,line in enumerate(p.read_text(encoding='utf-8-sig').splitlines(),1)),encoding='utf-8')
print(f'{len(manifest)} source files; {len(paras)} non-empty paper paragraphs; {len(media)} embedded images')
