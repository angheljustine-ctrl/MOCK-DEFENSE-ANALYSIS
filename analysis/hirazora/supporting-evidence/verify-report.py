from pathlib import Path
from pypdf import PdfReader
import hashlib,json,re,csv
from collections import Counter
base=Path(__file__).parent.parent
ev=Path(__file__).parent/'evidence'
root=Path(r'D:\MOCK DEFENSE ANALYSIS\tmp\hirazora-intake-20261003')
manifest=json.loads((ev/'source-manifest.json').read_text())
assert len(manifest)==47
for item in manifest:
 p=root/item['path'];assert hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256'],str(p)
zip_path=Path(r'C:\Users\justi\Downloads\SYSTEM -20261003T004229Z-1-001.zip')
assert hashlib.sha256(zip_path.read_bytes()).hexdigest()==(ev/'zip-sha256.txt').read_text()
source=(Path(__file__).parent/'report-source.md').read_text(encoding='utf-8')
pdf=PdfReader(base/'HIRAZORA-MOCK-DEFENSE-REPORT.pdf')
assert len(pdf.pages)==15
texts=[p.extract_text() for p in pdf.pages]
text='\n'.join(texts)
for expected in ['Domain capability baseline','Important JavaScript','Vibe-coding indicators','Validation and process','Five strongest panel questions','System, actors','Overall system flow']:
 assert expected in text,expected
for n in range(1,11):assert re.search(rf'\bF{n}\s*-',text)
for n in range(1,16):assert f'QA{n:02}' in text
assert '-->' not in texts[0]
assert all(len(t)>300 for t in texts)
jsroot=root/'SYSTEM '/'hirazora'/'js'
assert all('<?php' not in p.read_text(encoding='utf-8') for p in (jsroot.parent).glob('*.php'))
snippets=re.findall(r'```js\n(.*?)\n```',source,re.S)
assert len(snippets)==4
for snippet in snippets:
 normalized='\n'.join(line for line in snippet.splitlines() if line.strip())
 assert any(normalized in '\n'.join(line for line in p.read_text(encoding='utf-8').splitlines() if line.strip()) for p in jsroot.glob('*.js')),normalized
refs=re.findall(r'js/([\w-]+\.js):(\d+)(?:-(\d+))?',source)
for file,a,b in refs:
 lines=(jsroot/file).read_text(encoding='utf-8').splitlines();assert 1<=int(a)<=len(lines) and int(b or a)<=len(lines)
checks=json.loads((ev/'function-checks.json').read_text())
assert len(checks['tests'])==14
counts=Counter(t['status'] for t in checks['tests'])
assert counts=={'Passed':4,'Failed':10}
assert checks['javascriptSyntax']=={'files':12,'passed':12}
charts=Path(__file__).parent/'flowcharts'
for name in ['overall','checkout','authorization']:
 assert (charts/(name+'.svg')).is_file() and (charts/(name+'.mmd')).is_file()
 assert '<svg' in (charts/(name+'.svg')).read_text()
for n in range(1,16):assert (ev/f'final-page-{n:02}.png').is_file()
columns=['Test ID','Module','Category','Preconditions','Steps','Test Data','Expected Result','Actual Result','Status','Evidence','Severity','Source Reference','Notes']
refs_by_id={'QA01':'js/auth.js:962-981','QA02':'js/auth.js:743-953','QA03':'js/auth.js:988-1057','QA04':'js/pos.js:3614-4173','QA05':'js/pos.js:4093-4094','QA06':'js/pos.js:4009-4113','QA07':'js/pos.js:3636-4113','QA08':'js/backup.js:3777-4151','QA09':'js/backup.js:4000-4023','QA10':'js/sales.js:5034-5036,5241-5259','QA11':'js/inventory.js:2409-2732','QA12':'js/reports.js:1570-1682,1833-1958','QA13':'js/sales.js:6228-6364','QA14':'js/backup.js:827-853'}
with (Path(__file__).parent/'qa-test-cases.csv').open('w',newline='',encoding='utf-8-sig') as f:
 writer=csv.DictWriter(f,fieldnames=columns);writer.writeheader()
 for test in checks['tests']:
  writer.writerow({'Test ID':test['id'],'Module':test['name'],'Category':'Isolated actual-function check','Preconditions':'Synthetic in-memory storage/DOM; no real browser records','Steps':'Execute case in check-functions.mjs using actual source functions','Test Data':test['actual']['result'],'Expected Result':test['expected'],'Actual Result':test['actual']['result'],'Status':test['status'],'Evidence':'evidence/function-checks.json','Severity':'See associated finding','Source Reference':refs_by_id[test['id']],'Notes':'Function-level confirmation; E2E behavior not established. QA12 cash-period expectation is an explicitly unresolved policy.'})
 writer.writerow({'Test ID':'QA15','Module':'POS scanner/UI','Category':'Hardware/browser','Preconditions':'Disposable browser profile and scanner/camera/printer','Steps':'Scan item; verify match, camera denial/retry and printed receipt','Test Data':'Synthetic known barcode','Expected Result':'Correct item and clear peripheral errors','Actual Result':'Not executed','Status':'Not Run','Severity':'Info','Source Reference':'js/pos.js:2629-3326','Notes':'No hardware or live app UI testing.'})
summary={'pdfPages':len(pdf.pages),'sourceFilesUnchanged':len(manifest),'zipUnchanged':True,'executedFunctionTests':len(checks['tests']),'qaCounts':{**counts,'Not Run':1,'Blocked':0},'javascriptSyntaxFiles':12,'flowcharts':3,'findings':10,'exactCodeExcerpts':4,'sourceLineReferencesChecked':len(refs),'pdfSha256':hashlib.sha256((base/'HIRAZORA-MOCK-DEFENSE-REPORT.pdf').read_bytes()).hexdigest()}
(ev/'final-verification.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2))
print('REPORT VERIFICATION PASSED')
