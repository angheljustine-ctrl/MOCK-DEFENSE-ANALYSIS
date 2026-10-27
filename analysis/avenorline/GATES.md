# Gates: Avenorline mock-defense analysis

OWNS: analysis/avenorline/**

Scope: Deliver one evidence-backed, visually verified Standard mock-defense PDF without modifying the submitted system.

- [x] G0: this completion ledger has valid, meaningful checks
  CHECK: node "C:\Users\justi\.codex\skills\unlazy\scripts\gate-lint.mjs" GATES.md
  EXPECT: LINT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f573edb5b57b64deff98ffa4073c30f6d45c7c6e0efd87be80687160d1a08bd1; exit=0; EXPECT=matched; output-sha256=45f2f0b23659d603aebd358a717e9093af5a69c8ff812ab8199510941e171ecc; output-bytes=150; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\MOCK DEFENSE ANALYSIS\analysis\avenorline; path=37e0a0176469/33 entries

- [x] G1: the consolidated PDF contains every mandatory analysis section and a valid page count
  CHECK: node supporting-evidence/verify-report.mjs report
  EXPECT: REPORT VERIFICATION PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=c33b3775837a29ca7dcf307c89811bc71dd5b6e9f5a8d65adaa7bc5065aa498e; exit=0; EXPECT=matched; output-sha256=dc354a6f41cb92505ce0b8f69c2223d197495ecca2d6e0969f84d281fbecef94; output-bytes=52; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\MOCK DEFENSE ANALYSIS\analysis\avenorline; path=37e0a0176469/33 entries

- [x] G2: the QA and three-flowchart supporting artifacts are complete and consistent
  CHECK: node supporting-evidence/verify-report.mjs support
  EXPECT: SUPPORT VERIFICATION PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=de8187b2c1bc520b2c1794eda2beb59f1703521c6bef52509faaf1d296c76a14; exit=0; EXPECT=matched; output-sha256=b6ac637ecfa1c7b3869aaad4c796e47bdfeea00dc17189b208d46da2f772dd3c; output-bytes=28; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\MOCK DEFENSE ANALYSIS\analysis\avenorline; path=37e0a0176469/33 entries

- [x] G3: the submitted source remains byte-for-byte unchanged from the baseline manifest
  CHECK: node supporting-evidence/verify-report.mjs source
  EXPECT: SOURCE INTEGRITY PASSED
  EVIDENCE: automatic-evidence=v1; definition-sha256=4014f09ade07f36081d921e68873ea3bc723f250bab146b51b7a331792a35c9c; exit=0; EXPECT=matched; output-sha256=32725095d82dc37a947ef4f047b4ed152912e146aabeb39c36d5e4dd987926a2; output-bytes=35; shell=C:\WINDOWS\system32\cmd.exe; cwd=D:\MOCK DEFENSE ANALYSIS\analysis\avenorline; path=37e0a0176469/33 entries

- [x] G4: every final PDF page has been rendered and visually inspected with no clipping, overlap, or unreadable content
  EVIDENCE: 14 page PNGs reviewed on 2026-09-28; contact-sheet overview plus full-resolution checks of diagrams, findings, tables, code blocks, questions, and final limitations page found no visual defects.
