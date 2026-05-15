/**
 * Google Apps Script endpoint for the RIF news experiment.
 *
 * SETUP (5 minutes):
 *   1. Google Drive에서 새 Google Sheets 생성
 *   2. Extensions → Apps Script
 *   3. 이 파일 내용을 모두 복사해 붙여넣고 저장
 *   4. Deploy → New deployment
 *      - Type: Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   5. 배포 후 표시되는 Web app URL을 복사해서
 *      experiment/js/experiment.js 의 GOOGLE_SCRIPT_URL 상수에 붙여넣기
 *
 * 생성되는 시트:
 *   - Metadata           : 참가자별 1행 (id, condition, duration, ua, screen)
 *   - Study              : 학습 phase trial-level
 *   - Distractor         : 2-back 응답
 *   - RetrievalPractice  : 빈칸 채우기 응답
 *   - FreeRecall         : 자유 회상 응답 (텍스트)
 *   - Survey             : 사후 설문
 */

const SHEETS = {
  META:     'Metadata',
  STUDY:    'Study',
  DIST:     'Distractor',
  RP:       'RetrievalPractice',
  RECALL:   'FreeRecall',
  SURVEY:   'Survey'
};

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, name: 'RIF-News endpoint' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    save(payload);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function save(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ts = new Date();
  const pid = p.participant_id;
  const cond = p.condition;

  // ---- Metadata ----
  const meta = getOrCreate(ss, SHEETS.META, [
    'timestamp','participant_id','condition','total_duration_ms',
    'user_agent','screen_w','screen_h'
  ]);
  meta.appendRow([ts, pid, cond, p.total_duration_ms,
                  p.user_agent, p.screen_w, p.screen_h]);

  if (!Array.isArray(p.all_trials)) return;

  const study  = getOrCreate(ss, SHEETS.STUDY,
    ['timestamp','participant_id','condition','order_idx','item_id','set','valence','rt','trial_index']);
  const dist   = getOrCreate(ss, SHEETS.DIST,
    ['timestamp','participant_id','condition','task','pos','isTarget','response','rt']);
  const rp     = getOrCreate(ss, SHEETS.RP,
    ['timestamp','participant_id','condition','round','item_id','q_index','target_answer','response_text','match','rt']);
  const recall = getOrCreate(ss, SHEETS.RECALL,
    ['timestamp','participant_id','condition','order_idx','item_id','set','valence','rif_role','recall_text','rt']);
  const survey = getOrCreate(ss, SHEETS.SURVEY,
    ['timestamp','participant_id','condition','task','response_json','rt']);
  const rating = getOrCreate(ss, 'ArticleRating',
    ['timestamp','participant_id','condition','order_idx','item_id','set','valence_assigned','rif_role','rating_valence','rating_relevance','rt']);

  p.all_trials.forEach(t => {
    switch (t.task) {
      case 'study':
        study.appendRow([ts, pid, cond, t.order_idx, t.item_id, t.set, t.valence, t.rt, t.trial_index]);
        break;

      case 'distractor1':
      case 'distractor2':
      case 'distractor1_isi':
      case 'distractor2_isi':
        dist.appendRow([ts, pid, cond, t.task, t.pos, t.isTarget, t.response, t.rt]);
        break;

      case 'retrieval_practice':
        rp.appendRow([ts, pid, cond, t.round, t.item_id, t.q_index,
                      t.target_answer, t.response_text || '', t.match || 0, t.rt]);
        break;

      case 'free_recall':
        recall.appendRow([ts, pid, cond, t.order_idx, t.item_id, t.set, t.valence,
                          t.rif_role, t.recall_text || '', t.rt]);
        break;

      case 'survey_article_rating':
        rating.appendRow([ts, pid, cond, t.order_idx, t.item_id, t.set,
                          t.valence_assigned, t.rif_role,
                          t.rating_valence, t.rating_relevance, t.rt]);
        break;

      case 'survey_self_relevance':
      case 'survey_valence':
      case 'survey_demographics':
        survey.appendRow([ts, pid, cond, t.task, JSON.stringify(t.response || {}), t.rt]);
        break;
    }
  });
}

function getOrCreate(ss, name, header) {
  let s = ss.getSheetByName(name);
  if (!s) {
    s = ss.insertSheet(name);
    s.appendRow(header);
  }
  return s;
}
