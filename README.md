# RIF × Self-Relevance × Valence — News-Policy Memory Experiment

웹 기반 jsPsych 7.x 실험. 정책 뉴스 자극을 이용한 인출유도 망각(RIF) 효과가
자기관련성(High = 대학생 / Low = 소상공인) 및 정서가(Positive / Negative)에 따라
어떻게 달라지는지를 검증한다.

실행 링크: <https://haba6030.github.io/RIF_Experiment/>

## 프로토콜 (총 약 30–32분)

| # | Phase | Duration | Detail |
|---|---|---|---|
| 1 | Welcome / consent | ~1 min | Cover story: "뉴스 이해도 및 정책 인지 연구" |
| 2 | Study | 10 × 42 s = 7 min | News body 40 s + 2 s ISI (fixation `+`) |
| 3 | Distractor #1 | 3 min | Visuospatial 2-back (3×3 grid, 500 ms / 1500 ms cycle) |
| 4 | Retrieval practice | 32 × ~12 s = 6 min | 16 cloze items × 2 rounds |
| 5 | Distractor #2 | 3 min | Same 2-back |
| 6 | Free recall | 10 × 75 s = 12.5 min | Cue = 제목 + 첫 문장 |
| 7 | Survey | ~2 min | Self-relevance · valence · demographics |

## 설계 변수

- **Between-subjects**: `VALENCE_CONDITION ∈ {P, N}` (참가자 ID 마지막 자리 짝/홀로 결정적 배정)
  - `P` → RP+ targets = `{A1, A2, B1, B2}` (positives)
  - `N` → RP+ targets = `{A3, A4, B3, B4}` (negatives)
- **Within-subjects**:
  - Self-relevance: High set (A, 청년 정책) · Low set (B, 소상공인 정책) · Identity-irrelevant control (C, 연예)
  - RIF role: `RP+` · `RP-` · `NRP` (identity-irrelevant valenced controls `C1` 긍정, `C2` 부정)

`recall` 데이터의 `rif_role` 칼럼이 분석 시 핵심 contrast.

## 디렉터리

```
experiment/
├── index.html                  # jsPsych 7.3.4 + plugins (unpkg CDN)
├── css/style.css               # Korean typography, news / cloze / recall cards
├── js/
│   ├── stimuli.js              # 10 news + 32 cloze slots + role tagger
│   ├── plugins/spatial_2back.js
│   └── experiment.js           # main timeline + dual-channel save
├── google-apps-script.js       # Web App endpoint (6-sheet schema)
├── server.js                   # Local Node fallback (localhost only)
├── package.json
└── README.md
```

## 진행자 체크리스트

1. 참가자 1 → <https://haba6030.github.io/RIF_Experiment/?pid=P01>, 참가자 2 → `?pid=P02`, … 식으로 접속. 조건은 ID 마지막 자리 짝/홀로 자동 배정 (짝수 = P, 홀수 = N).
2. Welcome 화면을 함께 읽어 주의 깊게 확인. 모니터에 다른 알림창이 뜨지 않도록 OS 알림을 꺼둘 것.
3. 총 소요 시간 ≈ 30–32 분 (10 × 42 s study + 3 min distractor + 32 × 12 s RP + 3 min distractor + 10 × 75 s recall + survey).
4. 종료 화면("실험이 종료되었습니다")이 뜨면 저장 완료. Google 저장이 실패해도 참가자 Downloads 폴더의 JSON 파일이 백업이다 — 진행자가 이메일로 회수.
5. Google Sheet에서 `Metadata` 탭에 해당 pid의 row가 잡혔는지 확인 후 다음 참가자 진행.
