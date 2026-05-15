/**
 * Main timeline for the RIF × Self-Relevance × Valence experiment.
 *
 * Phases:
 *   1. Welcome / consent  (cover story: 뉴스 이해도 및 정책 인지 연구)
 *   2. Study (~7 min)     : 10 news, 40 s body + 2 s ISI, random order
 *   3. Distractor #1 (3m) : Spatial 2-back
 *   4. Retrieval practice : 4 items × 4 cloze blanks = 16 trials, 2 rounds (Anderson 1994)
 *   5. Distractor #2 (3m) : Spatial 2-back
 *   6. Free recall (~8 m) : 10 items, 75 s per item, title + first sentence cue
 *   7. Post-survey        : self-relevance + valence ratings
 *
 * Between-subjects: VALENCE_CONDITION ∈ {P, N}
 *   ?cond=P  /  ?cond=N  via URL, else random.
 *   ?pid=…  optional participant id override.
 */

// ============================================================================
// 1. CONFIG & PARAMETERS
// ============================================================================

const CONFIG = {
  STUDY_BODY_MS:      40000,
  STUDY_ISI_MS:        2000,
  DISTRACTOR_MS:     180000,    // 3 minutes per distractor block
  RP_ROUNDS:              2,    // Anderson 1994 used 3; piloting at 2 to fit time
  RP_RESPONSE_MS:     12000,    // per cloze
  RECALL_MS:          75000,    // per news item (10 × 75 = 12.5 m, see note)
  POST_MS:                0
};

const urlParams = new URLSearchParams(window.location.search);
const participant_id = urlParams.get('pid') ||
  ('P' + (Math.floor(Math.random() * 9000) + 1000)); // P####

// Deterministic assignment from participant_id (last digit parity).
//   ?cond=P / ?cond=N still overrides if the experimenter needs to force it.
//   Otherwise: last digit of pid → even = P, odd = N.
function condFromPid(pid) {
  const digits = (pid.match(/\d/g) || []).join('');
  const last   = digits ? parseInt(digits.slice(-1), 10) : 0;
  return (last % 2 === 0) ? 'P' : 'N';
}
const condParam = (urlParams.get('cond') || '').toUpperCase();
const VALENCE_CONDITION = (condParam === 'P' || condParam === 'N')
  ? condParam
  : condFromPid(participant_id);

const experiment_start_time = Date.now();

console.log('Participant:', participant_id, 'Condition:', VALENCE_CONDITION);

// Replace with your deployed Apps Script Web app URL.
// Production target: GitHub Pages → Google Apps Script → Google Sheets.
const GOOGLE_SCRIPT_URL = '';

// Local Express fallback (server.js). Only used when running on localhost.
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const LOCAL_SAVE_URL = IS_LOCAL ? '/save-data' : '';

// ============================================================================
// 2. JS PSYCH INIT
// ============================================================================

const jsPsych = initJsPsych({
  display_element: 'jspsych-target',
  on_finish: function() {
    saveData();
    document.getElementById('jspsych-target').innerHTML =
      `<div style="max-width:600px;margin:80px auto;text-align:center;line-height:1.8;">
        <h2>실험이 종료되었습니다.</h2>
        <p>참여해 주셔서 감사합니다.</p>
        <p style="color:#666;font-size:14px;">데이터가 저장되었습니다. 이 창을 닫으셔도 됩니다.</p>
      </div>`;
  }
});

jsPsych.data.addProperties({
  participant_id: participant_id,
  condition: VALENCE_CONDITION
});

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================================
// 3. WELCOME / CONSENT
// ============================================================================

const timeline = [];

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="max-width:720px; margin:0 auto; text-align:left; line-height:1.8;">
      <h1 style="text-align:center;">뉴스 이해도 및 정책 인지 연구</h1>
      <p>안녕하세요. 본 연구는 <b>최근 발표된 정책 뉴스에 대한 이해도와 기억</b>을
         알아보기 위한 실험입니다.</p>
      <p>전체 소요 시간은 약 <b>30분</b>이며, 다음 순서로 진행됩니다.</p>
      <ol>
        <li>뉴스 본문 학습 (약 7분)</li>
        <li>간단한 기억 분산 과제 (약 3분)</li>
        <li>뉴스 세부 사실 확인 과제 (약 6분)</li>
        <li>두 번째 분산 과제 (약 3분)</li>
        <li>뉴스 자유 회상 (약 8분)</li>
        <li>사후 설문 (약 2분)</li>
      </ol>
      <p>모든 응답은 익명 처리되며 학술 연구 목적 외에는 사용되지 않습니다.</p>
      <p>참여에 동의하시면 아래 '시작' 버튼을 눌러주세요.</p>
    </div>`,
  choices: ['시작'],
  button_html: '<button class="jspsych-btn" style="font-size:18px;padding:12px 40px;">%choice%</button>'
});

// ----------------------------------------------------------------------------
// Optional participant ID display
// ----------------------------------------------------------------------------
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="max-width:600px; margin:0 auto; line-height:1.8; text-align:center;">
      <h2>참가자 ID</h2>
      <p>아래 ID가 자동으로 부여되었습니다. 진행자에게 필요 시 알려주세요.</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:2px;color:#1f4e8c;">
        ${participant_id}</p>
      <p style="color:#666;font-size:14px;">조건: ${VALENCE_CONDITION}</p>
      <p>준비가 되면 '다음'을 눌러주세요.</p>
    </div>`,
  choices: ['다음']
});

// ============================================================================
// 4. STUDY PHASE
// ============================================================================

const studyOrder = shuffle(NEWS_ITEMS);  // randomize order of 10 items

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="max-width:720px; margin:0 auto; text-align:left; line-height:1.8;">
      <h2 style="text-align:center;">1. 뉴스 학습</h2>
      <p>이제부터 총 <b>${studyOrder.length}편의 뉴스</b>가 한 편씩 화면에 제시됩니다.</p>
      <p>각 뉴스는 <b>${CONFIG.STUDY_BODY_MS/1000}초</b>씩 표시되며, 시간이 지나면
         자동으로 다음 뉴스로 넘어갑니다.</p>
      <p>뉴스 사이에는 짧은 검은 화면(고정점)이 잠시 제시됩니다.</p>
      <p>이후 뉴스 내용에 대한 질문이 있을 수 있으니, 본문을 <b>주의 깊게</b> 읽어 주세요.</p>
      <p>준비되면 '시작'을 눌러주세요.</p>
    </div>`,
  choices: ['시작'],
  button_html: '<button class="jspsych-btn" style="font-size:18px;padding:12px 40px;">%choice%</button>'
});

studyOrder.forEach((item, idx) => {
  // Body
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    choices: 'NO_KEYS',
    trial_duration: CONFIG.STUDY_BODY_MS,
    stimulus: `
      <div class="news-card">
        <div class="news-counter">${idx+1} / ${studyOrder.length}</div>
        <h2 class="news-title">${item.title}</h2>
        <p class="news-body">${item.body}</p>
        <div class="news-timer" id="study-timer-${idx}"></div>
      </div>`,
    data: {
      task: 'study',
      item_id: item.id,
      set: item.set,
      valence: item.valence,
      order_idx: idx
    },
    on_load: function() {
      let remaining = CONFIG.STUDY_BODY_MS / 1000;
      const el = document.getElementById(`study-timer-${idx}`);
      if (el) el.textContent = `남은 시간: ${remaining}초`;
      const t = setInterval(() => {
        remaining -= 1;
        if (el) el.textContent = `남은 시간: ${Math.max(0, remaining)}초`;
        if (remaining <= 0) clearInterval(t);
      }, 1000);
    }
  });

  // ISI (fixation)
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    choices: 'NO_KEYS',
    trial_duration: CONFIG.STUDY_ISI_MS,
    stimulus: `<div class="fixation">+</div>`,
    data: { task: 'study_isi', after_item: item.id }
  });
});

// ============================================================================
// 5. DISTRACTOR #1 — Spatial 2-back
// ============================================================================

const dist1 = buildSpatial2BackTimeline({
  durationMs: CONFIG.DISTRACTOR_MS,
  tag: 'distractor1'
});
timeline.push(...dist1.timeline);

// ============================================================================
// 6. RETRIEVAL PRACTICE
// ============================================================================

const practicedIds = PRACTICE_IDS[VALENCE_CONDITION]; // e.g. ['A1','A2','B1','B2']

// Build a flat list of 16 cloze trials
const rpTrials = [];
practicedIds.forEach(id => {
  RP_QUESTIONS[id].forEach((row, qi) => {
    rpTrials.push({ item_id: id, q_index: qi, question: row.q, answer: row.a });
  });
});

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="max-width:720px; margin:0 auto; text-align:left; line-height:1.8;">
      <h2 style="text-align:center;">2. 세부 사실 확인 (빈칸 채우기)</h2>
      <p>방금 읽은 뉴스 중 <b>일부 항목</b>의 세부 사실을 묻는 빈칸 채우기 문항이 제시됩니다.</p>
      <p>각 문항은 최대 <b>${CONFIG.RP_RESPONSE_MS/1000}초</b> 동안 표시되며, 빈칸에 들어갈
         내용을 입력 후 <b>Enter</b> 또는 '제출' 버튼을 누르면 다음으로 넘어갑니다.</p>
      <p>총 ${rpTrials.length * CONFIG.RP_ROUNDS}문항이 출제됩니다 (같은 문항을
         ${CONFIG.RP_ROUNDS}회 반복).</p>
      <p>준비되면 '시작'을 눌러주세요.</p>
    </div>`,
  choices: ['시작'],
  button_html: '<button class="jspsych-btn" style="font-size:18px;padding:12px 40px;">%choice%</button>'
});

for (let r = 0; r < CONFIG.RP_ROUNDS; r++) {
  const order = shuffle(rpTrials);
  order.forEach((row, idx) => {
    timeline.push({
      type: jsPsychSurveyText,
      preamble: `
        <div class="rp-card">
          <div class="rp-counter">Round ${r+1} · ${idx+1} / ${order.length}</div>
          <p class="rp-question">${row.question.replace('____',
              '<span class="rp-blank">_____</span>')}</p>
        </div>`,
      questions: [{ prompt: '빈칸에 들어갈 말:', name: 'response', required: false, columns: 30 }],
      button_label: '제출',
      trial_duration: CONFIG.RP_RESPONSE_MS,
      data: {
        task: 'retrieval_practice',
        item_id: row.item_id,
        q_index: row.q_index,
        round: r + 1,
        target_answer: row.answer,
        condition: VALENCE_CONDITION
      },
      on_finish: function(d) {
        const resp = (d.response && d.response.response) || '';
        d.response_text = resp.trim();
        d.match = (resp.trim().replace(/\s/g,'') ===
                   row.answer.replace(/\s/g,'')) ? 1 : 0;
      }
    });
  });
}

// ============================================================================
// 7. DISTRACTOR #2 — Spatial 2-back
// ============================================================================

const dist2 = buildSpatial2BackTimeline({
  durationMs: CONFIG.DISTRACTOR_MS,
  tag: 'distractor2'
});
timeline.push(...dist2.timeline);

// ============================================================================
// 8. FREE RECALL (final memory test)
// ============================================================================

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="max-width:720px; margin:0 auto; text-align:left; line-height:1.8;">
      <h2 style="text-align:center;">3. 뉴스 내용 자유 회상</h2>
      <p>이제 학습했던 뉴스들을 다시 한 번씩 떠올려 적어 주시겠습니다.</p>
      <p>각 뉴스의 <b>제목과 첫 문장</b>이 단서로 제시됩니다. 본문에서 기억나는
         모든 사실(기관, 수치, 시기, 명칭 등)을 가능한 한 자세히 적어 주세요.</p>
      <p>각 뉴스에 대해 최대 <b>${CONFIG.RECALL_MS/1000}초</b>가 주어지며, 시간이
         지나면 자동으로 다음으로 넘어갑니다.</p>
      <p>준비되면 '시작'을 눌러주세요.</p>
    </div>`,
  choices: ['시작'],
  button_html: '<button class="jspsych-btn" style="font-size:18px;padding:12px 40px;">%choice%</button>'
});

const recallOrder = shuffle(NEWS_ITEMS); // independent shuffle for test

recallOrder.forEach((item, idx) => {
  // first-sentence cue: split on '. ' or '습니다.' patterns
  const m = item.body.match(/^[^.]+?(?:\.|다\.|합니다\.|있다\.|했다\.|밝혔다\.|밝혔습니다\.)/);
  const cueSentence = (m ? m[0] : item.body.slice(0, 120)).trim();

  timeline.push({
    type: jsPsychSurveyText,
    preamble: `
      <div class="recall-card">
        <div class="rp-counter">${idx+1} / ${recallOrder.length}</div>
        <h3 class="news-title">${item.title}</h3>
        <p class="cue-sentence">${cueSentence}</p>
        <p class="recall-instructions">위 뉴스에서 기억나는 사실을 모두 적어 주세요.</p>
      </div>`,
    questions: [
      { prompt: '자유 회상 응답:', name: 'recall', required: false, rows: 10, columns: 70 }
    ],
    button_label: '제출 / 다음',
    trial_duration: CONFIG.RECALL_MS,
    data: {
      task: 'free_recall',
      item_id: item.id,
      set: item.set,
      valence: item.valence,
      rif_role: rifRoleFor(item.id, VALENCE_CONDITION),
      condition: VALENCE_CONDITION,
      order_idx: idx
    },
    on_finish: function(d) {
      d.recall_text = (d.response && d.response.recall) || '';
    }
  });
});

// ============================================================================
// 9. POST-SURVEY
// ============================================================================

const likert7 = ['1\n전혀\n아니다', '2', '3', '4\n보통', '5', '6', '7\n매우\n그렇다'];

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="max-width:720px; margin:0 auto; line-height:1.8;">
      <h2 style="text-align:center;">4. 사후 설문</h2>
      <p>마지막으로 짧은 설문에 응답해 주세요.</p>
    </div>`,
  choices: ['시작']
});

timeline.push({
  type: jsPsychSurveyLikert,
  preamble: '<h3 style="text-align:center;">자기관련성</h3>',
  questions: [
    {
      prompt: '대학생 관련 정책 뉴스(예: 등록금, 월세 지원, 학식 등)는 평소 본인과 얼마나 관련이 있다고 느끼십니까?',
      labels: likert7, required: true
    },
    {
      prompt: '소상공인 관련 정책 뉴스(예: 카드 수수료, 간이과세 등)는 평소 본인과 얼마나 관련이 있다고 느끼십니까?',
      labels: likert7, required: true
    }
  ],
  randomize_question_order: false,
  data: { task: 'survey_self_relevance' }
});

timeline.push({
  type: jsPsychSurveyLikert,
  preamble: '<h3 style="text-align:center;">정서가 평정</h3>',
  questions: [
    {
      prompt: '학습 단계에서 제시된 청년 정책 뉴스 중 <b>긍정적</b>(지원 강화 등) 내용은 얼마나 긍정적으로 느껴졌습니까?',
      labels: likert7, required: true
    },
    {
      prompt: '학습 단계에서 제시된 청년 정책 뉴스 중 <b>부정적</b>(지원 축소 등) 내용은 얼마나 부정적으로 느껴졌습니까?',
      labels: likert7, required: true
    },
    {
      prompt: '소상공인 정책 뉴스 중 <b>긍정적</b> 내용은 얼마나 긍정적으로 느껴졌습니까?',
      labels: likert7, required: true
    },
    {
      prompt: '소상공인 정책 뉴스 중 <b>부정적</b> 내용은 얼마나 부정적으로 느껴졌습니까?',
      labels: likert7, required: true
    }
  ],
  randomize_question_order: false,
  data: { task: 'survey_valence' }
});

timeline.push({
  type: jsPsychSurveyText,
  preamble: '<h3 style="text-align:center;">마지막으로</h3>',
  questions: [
    { prompt: '연령(만 나이):', name: 'age', columns: 10 },
    { prompt: '성별 (남/여/기타/응답거부):', name: 'gender', columns: 10 },
    { prompt: '소속/학년:', name: 'affiliation', columns: 25 },
    { prompt: '본 실험의 목적이 무엇이라고 생각하셨습니까? (자유 응답)',
      name: 'guess_purpose', rows: 3, columns: 60 }
  ],
  data: { task: 'survey_demographics' }
});

// ============================================================================
// 10. DATA SAVE
// ============================================================================

function saveData() {
  const allTrials = jsPsych.data.get().values();

  const payload = {
    dataType: 'complete',
    participant_id: participant_id,
    condition: VALENCE_CONDITION,
    timestamp: new Date().toISOString(),
    total_duration_ms: Date.now() - experiment_start_time,
    user_agent: navigator.userAgent,
    screen_w: window.screen.width,
    screen_h: window.screen.height,
    all_trials: allTrials
  };

  // 1) Local server fallback (only when running via Node server.js)
  if (LOCAL_SAVE_URL) {
    fetch(LOCAL_SAVE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participant_id,
        condition: VALENCE_CONDITION,
        data: payload
      })
    }).then(r => r.json())
      .then(j => console.log('Local save:', j))
      .catch(e => console.warn('Local save failed:', e));
  }

  // 2) Google Apps Script (production)
  if (GOOGLE_SCRIPT_URL) {
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(() => console.log('GAS save dispatched.'))
      .catch(e => console.warn('GAS save failed:', e));
  }

  // 3) Local download (always)
  const blob = new Blob([JSON.stringify(payload, null, 2)],
                       { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `RIF_${participant_id}_${VALENCE_CONDITION}_${Date.now()}.json`;
  a.click();
}

// ============================================================================
// 11. RUN
// ============================================================================

jsPsych.run(timeline);
