import hashlib,json,re
from collections import Counter
from pathlib import Path
from pypdf import PdfReader
base=Path(__file__).parent
root=Path(r'C:\Users\justi\Downloads\BSIT 3A GROUP-7 -20261002T143500Z-1-001\BSIT 3A GROUP-7')
manifest=json.loads((base/'evidence/source-manifest.json').read_text(encoding='utf-8-sig'))
assert {str(p.relative_to(root)) for p in root.rglob('*') if p.is_file()}=={m['Path'] for m in manifest}
for m in manifest: assert hashlib.sha256((root/m['Path']).read_bytes()).hexdigest().upper()==m['SHA256']
results=json.loads((base/'evidence/runtime-results.json').read_text())['results']
assert len(results)==15 and len({r['id'] for r in results})==15
counts=Counter(r['status'] for r in results)
report=base.parent/'ait-merchandise-request-MOCK-DEFENSE-REPORT.pdf'
reader=PdfReader(report)
text='\n'.join(p.extract_text() for p in reader.pages)
assert len(reader.pages)==15
assert f"{counts['Passed']} Passed, {counts['Failed']} Failed, 0 Blocked" in text
for word in ['Paper-to-system traceability','Domain capability baseline','Validation coverage inventory','Vibe-coding indicators','Five strongest panel questions','Recommended system improvements']:
    assert word in text,word
assert all(f'F{i}.' in text for i in range(1,10))
assert len(list((base/'flowcharts').glob('*.mmd')))==3
assert len(list((base/'flowcharts').glob('*.svg')))==3
assert len(list((base/'evidence/final-pages').glob('page-*.png')))==len(reader.pages)
assert len([a for p in reader.pages for a in p.get('/Annots',[]) if a.get_object().get('/Subtype')=='/Link'])>=4
print('VERIFIED: source unchanged; 15 pages; 9 findings; 3 diagrams; '+str(dict(counts)))
