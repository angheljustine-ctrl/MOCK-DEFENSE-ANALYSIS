from pathlib import Path
import hashlib,json,csv,collections,subprocess
from pypdf import PdfReader
root=Path(__file__).resolve().parents[1];ev=root/'supporting-evidence/evidence';src=root/'submission/source/sistem'
manifest=json.loads((ev/'source-inventory.json').read_text(encoding='utf-8'))
assert all(hashlib.sha256((src/e['path']).read_bytes()).hexdigest()==e['sha256'] for e in manifest)
checks=json.loads((ev/'logic-checks.json').read_text(encoding='utf-8'))['results'];counts=dict(collections.Counter(x['status'] for x in checks));assert counts=={'Passed':4,'Failed':9,'Not Run':2}
node=r'C:/Users/justi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
scripts=list(src.glob('js/*.js'))
assert len(scripts)==12
for p in scripts:subprocess.run([node,'--check',str(p)],check=True,capture_output=True)
reader=PdfReader(root/'Doughnut-Disturb-MOCK-DEFENSE-REPORT.pdf');text='\n'.join(p.extract_text() for p in reader.pages)
required=['Panel brief','Paper to system','Domain capability','Overall flow','Main payroll','F01','F10','System improvements','validation coverage','Important JavaScript','Vibe coding','QA inventory','Five strongest panel','Coverage limitations']
assert all(s in text for s in required)
assert len(reader.pages)==15,len(reader.pages)
assert all(len(p.extract_text())>200 for p in reader.pages)
assert all((root/f'supporting-evidence/flowcharts/{n}.{ext}').exists() for n in ['overall','authentication','payroll'] for ext in ['mmd','svg'])
assert len(checks)==15
csvpath=root/'supporting-evidence/qa-test-cases.csv'
fields=['Test ID','Module','Category','Preconditions','Steps','Test Data','Expected Result','Actual Result','Status','Evidence','Severity','Source Reference','Notes']
with csvpath.open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
    for x in checks:writer.writerow({'Test ID':x['id'],'Module':x['name'],'Category':'Risk-based logic / integration','Preconditions':'Isolated VM and synthetic data; see harness','Steps':x['name'],'Test Data':'Synthetic employee/account records','Expected Result':x['expected'],'Actual Result':x['actual'],'Status':x['status'],'Evidence':'logic-checks.json / check_logic.cjs','Severity':'See related finding','Source Reference':'See report finding references','Notes':'Not full-browser end-to-end validation'})
summary={'source_files':len(manifest),'source_hashes_unchanged':True,'js_syntax_passed':len(scripts),'qa_counts':counts,'pdf_pages':len(reader.pages),'required_sections_present':True,'flowcharts':3}
(ev/'final-verification.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2));print('REPORT VERIFICATION PASSED')
