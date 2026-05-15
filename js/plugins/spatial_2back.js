/**
 * Spatial 2-back distractor task.
 * Builds a jsPsych timeline block that fills a target duration with a 3x3 grid
 * task. Press SPACE if the current cell position matches the one two steps back.
 *
 * Cycle = STIM_DURATION (500ms) + ISI (1500ms) = 2000ms per trial.
 *
 * Adapted from the standalone code/spatial_2back.html in this project.
 */

function buildSpatial2BackTimeline(opts) {
  const STIM_DURATION   = opts.stimDuration ?? 500;
  const ISI             = opts.isi          ?? 1500;
  const DURATION_MS     = opts.durationMs   ?? 180000;  // 3 minutes default
  const TARGET_RATE     = opts.targetRate   ?? 0.30;
  const N               = 2;
  const TRIAL_COUNT     = Math.floor(DURATION_MS / (STIM_DURATION + ISI));
  const KEY             = ' ';
  const BLOCK_TAG       = opts.tag          ?? 'distractor';

  // ---- Sequence generation ----
  const sequence = [];
  for (let i = 0; i < TRIAL_COUNT; i++) {
    if (i >= N && Math.random() < TARGET_RATE) {
      sequence.push({ pos: sequence[i - N].pos, isTarget: true });
    } else {
      let p;
      do {
        p = Math.floor(Math.random() * 9);
      } while (i >= N && p === sequence[i - N].pos);
      sequence.push({ pos: p, isTarget: false });
    }
  }

  function gridHTML(activePos) {
    let html = '<div class="twoback-grid">';
    for (let i = 0; i < 9; i++) {
      html += `<div class="twoback-cell${i === activePos ? ' active' : ''}"></div>`;
    }
    html += '</div>';
    return html;
  }

  // ---- Instructions ----
  const instructions = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
      <div style="max-width:720px; margin:0 auto; text-align:left; line-height:1.7;">
        <h2 style="text-align:center;">분산 과제: 2-back</h2>
        <p>3 × 3 격자에서 한 칸이 짧게 파란색으로 켜집니다.</p>
        <p><b>지금 켜진 위치</b>가 <b>두 단계 전(2-back)</b>에 켜졌던 위치와 <b>같으면
        스페이스바</b>를 누르세요.</p>
        <p>다르면 아무것도 누르지 않으면 됩니다.</p>
        <p>총 <b>${Math.round(DURATION_MS/60000*10)/10}분</b> 동안 진행됩니다.
        준비되면 시작 버튼을 누르세요.</p>
      </div>`,
    choices: ['시작하기'],
    button_html: '<button class="jspsych-btn" style="font-size:18px; padding:12px 40px;">%choice%</button>'
  };

  // ---- One trial ----
  const stim = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
      return gridHTML(jsPsych.timelineVariable('pos'));
    },
    choices: [KEY],
    trial_duration: STIM_DURATION,
    response_ends_trial: false,
    data: {
      task: BLOCK_TAG,
      pos:       jsPsych.timelineVariable('pos'),
      isTarget:  jsPsych.timelineVariable('isTarget')
    },
    on_finish: function(d) {
      d.responded_during_stim = d.response !== null;
    }
  };

  const isi = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: gridHTML(-1),
    choices: [KEY],
    trial_duration: ISI,
    response_ends_trial: false,
    data: { task: BLOCK_TAG + '_isi' },
    on_finish: function(d) {
      // Mark "correct" using the matched stim trial: lookup is done post-hoc.
      d.responded_during_isi = d.response !== null;
    }
  };

  const procedure = {
    timeline: [stim, isi],
    timeline_variables: sequence
  };

  return {
    timeline: [instructions, procedure],
    trial_count: TRIAL_COUNT
  };
}

window.buildSpatial2BackTimeline = buildSpatial2BackTimeline;
