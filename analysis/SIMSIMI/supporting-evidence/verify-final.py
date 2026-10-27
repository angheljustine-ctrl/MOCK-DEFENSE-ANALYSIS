from pathlib import Path
import hashlib,json,re,csv
from collections import Counter
from pypdf import PdfReader
out=Path(__file__).parent
root=Path(r'C:\Users\justi\Downloads\Web-20261002T152358Z-1-001\Web\SIMSIMI')
inventory=json.loads((out/'evidence/source-inventory.json').read_text(encoding='utf-8'))
assert len(inventory)==129
for item in inventory:
    assert hashlib.sha256((root/item['path']).read_bytes()).hexdigest()==item['sha256'],item['path']
assert len([p for p in root.rglob('*') if p.is_file()])==len(inventory)
source=(out/'report-source.md').read_text(encoding='utf-8')
refs=re.findall(r'([a-z][a-z-]*\.js):(\d+)(?:-(\d+))?',source)
for name,start,end in refs:
    n=len((root/'js'/name).read_text(encoding='utf-8-sig').splitlines())
    assert 1<=int(start)<=int(end or start)<=n,(name,start,end,n)
runtime=json.loads((out/'evidence/runtime-checks.json').read_text(encoding='utf-8-sig'))
counts=Counter(x['status'] for x in runtime['results'])
assert counts=={'Passed':2,'Failed':14},counts
assert len(set(x['id'] for x in runtime['results']))==16
pdf=PdfReader(out.parent/'SIMSIMI-MOCK-DEFENSE-REPORT.pdf')
assert len(pdf.pages)==15
text='\n'.join(p.extract_text() for p in pdf.pages)
for section in ['Paper-to-system','Domain capability baseline','Diagram 1','Diagram 2','Diagram 3','F12','Validation review','Important JavaScript','Vibe-coding','Q15','Recommended system improvements','Five strongest panel questions']:
    assert section in text,section
assert len(re.findall(r'^### F\d\d -',source,re.M))==13
assert len(re.findall(r'^### [1-5]\.',source,re.M))==5
for i in range(1,16):assert (out/f'evidence/final-page-{i:02}.png').exists()
for name in ['overall','access','enrollment']:
    for suffix in ['.svg','.mmd']: assert (out/'flowcharts'/f'{name}{suffix}').exists()
with (out/'qa-test-cases.csv').open('w',encoding='utf-8-sig',newline='') as f:
    columns=['Test ID','Module','Category','Preconditions','Steps','Test Data','Expected Result','Actual Result','Status','Evidence','Severity','Source Reference','Notes']
    writer=csv.DictWriter(f,fieldnames=columns);writer.writeheader()
    for r in runtime['results']:
        row=next(line for line in source.splitlines() if line.startswith('| '+r['id']+' '))
        parts=[x.strip() for x in row.split('|')[1:-1]]
        label=parts[0].split(' ',1)[1]
        module,category=label.split(' / ',1)
        writer.writerow({'Test ID':r['id'],'Module':module,'Category':category,'Preconditions':'Disposable synthetic fixtures; VM except Q15; Q04 additionally Edge','Steps':parts[1],'Test Data':parts[1],'Expected Result':parts[2],'Actual Result':r['detail'],'Status':r['status'],'Evidence':'runtime-checks.json; browser-checks.json for Q04/Q15','Severity':'See linked finding in report','Source Reference':r['source'],'Notes':'Function harness does not prove full browser E2E; Q06/Q12 use explicitly proposed acceptance rules.'})
summary={'pages':len(pdf.pages),'findings':13,'qa_counts':dict(counts),'flowcharts':3,'panel_questions':5,'source_files_unchanged':len(inventory),'source_references_range_checked':len(refs),'visual_pages_reviewed':15}
(out/'evidence/final-verification.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print('FINAL_ARTIFACT_VERIFIED',json.dumps(summary))


