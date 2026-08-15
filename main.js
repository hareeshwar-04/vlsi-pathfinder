import { questions, electives } from './questions.js';

// ===== STATE =====
const state = {
  rollNumber: null,
  currentQuestion: 0,
  answers: Array(15).fill(null),
  submitted: false,
  adminAuth: false,
  direction: 'right'
};

const STORAGE_KEY = 'vlsi_submissions';
const ADMIN_PASSWORD = 'admin@vlsi2026';
const DISPLAY_LABELS = ['A', 'B', 'C'];

// ===== DOM REFERENCES =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== OPTION SHUFFLING =====
// Generate shuffled option orders per question (consistent per session)
let shuffledOrders = [];
function generateShuffledOrders() {
  shuffledOrders = questions.map(() => {
    const indices = [0, 1, 2];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  });
}

// Color mapping by track key
const trackColor = { lp: 'cyan', md: 'emerald', dm: 'purple' };

// ===== ROUTER =====
function navigate(page) {
  $$('.page').forEach(p => p.classList.remove('active'));
  const target = $(`#page-${page}`);
  if (target) { target.classList.add('active'); target.scrollTop = 0; }
  window.scrollTo(0, 0);

  const navRight = $('#nav-right');
  if (page === 'quiz' || page === 'results') {
    navRight.innerHTML = `<div class="nav-roll">Roll # ${state.rollNumber}</div>`;
  } else {
    navRight.innerHTML = '';
  }
}

function handleRoute() {
  const hash = window.location.hash || '#/';
  if (hash.startsWith('#/admin')) {
    navigate('admin');
    if (!state.adminAuth) showAdminModal();
    else { hideAdminModal(); renderAdminDashboard(); }
  } else if (hash.startsWith('#/quiz')) {
    if (!state.rollNumber) { window.location.hash = '#/'; return; }
    navigate('quiz');
    renderQuestion();
  } else if (hash.startsWith('#/results')) {
    if (!state.rollNumber) { window.location.hash = '#/'; return; }
    navigate('results');
    renderResults();
  } else {
    navigate('landing');
  }
}

window.addEventListener('hashchange', handleRoute);

// ===== STORAGE =====
function getSubmissions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveSubmission(data) {
  const subs = getSubmissions();
  const roll = data.rollNumber;
  let record = subs[roll];

  if (!record) {
    subs[roll] = {
      rollNumber: roll,
      latest: data,
      history: [data]
    };
  } else {
    if (!record.history) {
      const prev = record.latest || record;
      subs[roll] = {
        rollNumber: roll,
        latest: data,
        history: [prev, data]
      };
    } else {
      record.latest = data;
      record.history.push(data);
      subs[roll] = record;
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));

  // Async sync to Cloudflare Pages Functions API
  try {
    fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});
  } catch (e) {}
}

async function syncCloudSubmissions() {
  try {
    const res = await fetch('/api/submissions');
    if (!res.ok) return;
    const cloudSubs = await res.json();
    if (cloudSubs && typeof cloudSubs === 'object' && Object.keys(cloudSubs).length > 0) {
      const localSubs = getSubmissions();
      let updated = false;
      Object.entries(cloudSubs).forEach(([roll, cloudItem]) => {
        if (!localSubs[roll]) {
          localSubs[roll] = cloudItem;
          updated = true;
        } else {
          const localHist = localSubs[roll].history || [localSubs[roll].latest || localSubs[roll]];
          const cloudHist = cloudItem.history || [cloudItem.latest || cloudItem];
          if (cloudHist.length > localHist.length) {
            localSubs[roll] = cloudItem;
            updated = true;
          }
        }
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localSubs));
        renderAdminDashboard();
      }
    }
  } catch (e) {}
}

function getLatestSubmission(roll) {
  const subs = getSubmissions();
  const record = subs[roll];
  if (!record) return null;
  return record.latest || record;
}

function getSubmissionHistory(roll) {
  const subs = getSubmissions();
  const record = subs[roll];
  if (!record) return [];
  if (record.history) return record.history;
  return [record.latest || record];
}

// ===== LANDING PAGE =====
function initLanding() {
  const container = $('#elective-cards');
  container.innerHTML = Object.entries(electives).map(([key, el]) => `
    <div class="elective-card ${el.cssClass}">
      <div class="icon-wrap">${el.icon}</div>
      <h3>${el.name}</h3>
      <div class="code">${el.code}</div>
      <p>${el.description}</p>
    </div>
  `).join('');

  const input = $('#roll-input');
  const errorEl = $('#roll-error');
  const validEl = $('#roll-valid');
  const startBtn = $('#start-btn');
  const retakeWarn = $('#retake-warning');

  input.addEventListener('input', () => {
    const val = input.value.trim();

    // Hidden Admin Trigger Keyword
    if (val.toLowerCase() === 'gothveinns') {
      input.value = '';
      input.classList.remove('error', 'valid');
      errorEl.classList.remove('show');
      validEl.classList.remove('show');
      retakeWarn.classList.remove('show');
      startBtn.disabled = true;
      window.location.hash = '#/admin';
      return;
    }

    const num = parseInt(val, 10);
    errorEl.classList.remove('show');
    validEl.classList.remove('show');
    retakeWarn.classList.remove('show');
    input.classList.remove('error', 'valid');
    startBtn.disabled = true;

    if (val === '') return;
    if (isNaN(num) || num < 7701 || num > 7762 || val !== String(num)) {
      input.classList.add('error');
      errorEl.classList.add('show');
      return;
    }
    input.classList.add('valid');
    validEl.classList.add('show');
    startBtn.disabled = false;

    const latest = getLatestSubmission(num);
    const history = getSubmissionHistory(num);
    if (latest) {
      retakeWarn.textContent = `⚠️ You have previously submitted ${history.length} assessment attempt(s). Completing this test will save a new attempt copy to your history.`;
      retakeWarn.classList.add('show');
    }
  });

  startBtn.addEventListener('click', () => {
    const num = parseInt(input.value.trim(), 10);
    if (num < 7701 || num > 7762) return;
    state.rollNumber = num;
    state.currentQuestion = 0;
    state.answers = Array(15).fill(null);
    state.submitted = false;
    state._confettiShown = false;

    // Generate fresh shuffled orders for this session
    generateShuffledOrders();

    const latest = getLatestSubmission(num);
    if (latest && latest.answers) {
      for (let i = 0; i < 15; i++) {
        state.answers[i] = latest.answers[`Q${i + 1}`] || null;
      }
    }

    window.location.hash = '#/quiz';
  });
}

// ===== QUIZ ENGINE =====
function renderQuestion() {
  const q = questions[state.currentQuestion];
  const selected = state.answers[state.currentQuestion];
  const animClass = state.direction === 'right' ? 'slide-right' : 'slide-left';
  const order = shuffledOrders[state.currentQuestion] || [0, 1, 2];
  const shuffledOpts = order.map(i => q.options[i]);

  const pct = Math.round(((state.currentQuestion) / 15) * 100);
  $('#progress-fill').style.width = `${pct}%`;
  $('#progress-label').textContent = `Question ${state.currentQuestion + 1} of 15`;
  $('#progress-percent').textContent = `${pct}%`;

  $('#question-container').innerHTML = `
    <div class="question-card ${animClass}">
      <div class="question-card-inner">
        <div class="question-header-badge">
          <span class="badge-dot"></span>
          <span>SCENARIO ${String(q.id).padStart(2, '0')} OF 15</span>
        </div>
        <h2 class="question-title">${q.title}</h2>
        <div class="question-scenario">
          <p>${q.scenario}</p>
        </div>
        <div class="options-header">Select the approach that aligns best with your engineering intuition:</div>
        <div class="options-grid">
          ${shuffledOpts.map((opt, idx) => {
            const label = DISPLAY_LABELS[idx];
            const isSelected = selected === opt.key;
            const selClass = isSelected ? 'selected-' + trackColor[opt.key] : '';
            return `
            <div class="option-card ${selClass}"
                 data-key="${opt.key}" onclick="window.__selectOption('${opt.key}')">
              <div class="option-key-badge">${label}</div>
              <div class="option-content">
                <div class="option-text">${opt.text}</div>
              </div>
              <div class="option-check">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  $('#prev-btn').disabled = state.currentQuestion === 0;
  const isLast = state.currentQuestion === 14;
  const nextBtn = $('#next-btn');
  nextBtn.disabled = !selected;
  nextBtn.innerHTML = isLast
    ? `View Results <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`
    : `Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
}

window.__selectOption = (key) => {
  state.answers[state.currentQuestion] = key;
  // Update option cards in-place (no full re-render)
  document.querySelectorAll('#question-container .option-card').forEach(card => {
    const k = card.dataset.key;
    card.classList.remove('selected-cyan', 'selected-emerald', 'selected-purple');
    if (k === key) card.classList.add('selected-' + trackColor[k]);
  });
  $('#next-btn').disabled = false;
};

function initQuiz() {
  $('#prev-btn').addEventListener('click', () => {
    if (state.currentQuestion > 0) {
      state.direction = 'left';
      state.currentQuestion--;
      renderQuestion();
    }
  });
  $('#next-btn').addEventListener('click', () => {
    if (!state.answers[state.currentQuestion]) return;
    if (state.currentQuestion < 14) {
      state.direction = 'right';
      state.currentQuestion++;
      renderQuestion();
    } else {
      autoSaveSubmission();
      window.location.hash = '#/results';
    }
  });
}

// ===== RESULTS =====
function calcScores() {
  const scores = { lp: 0, md: 0, dm: 0 };
  state.answers.forEach(a => { if (a) scores[a]++; });
  const ranked = Object.entries(scores)
    .map(([key, score]) => ({
      key, score,
      name: electives[key].name,
      code: electives[key].code,
      percent: Math.round((score / 15) * 100)
    }))
    .sort((a, b) => b.score - a.score);
  ranked.forEach((r, i) => r.rank = i + 1);
  return { scores, ranked };
}

function autoSaveSubmission() {
  const { scores, ranked } = calcScores();
  const answersObj = {};
  state.answers.forEach((a, i) => { answersObj[`Q${i + 1}`] = a; });

  saveSubmission({
    rollNumber: state.rollNumber,
    timestamp: new Date().toISOString(),
    answers: answersObj,
    scores: { lp: scores.lp, md: scores.md, dm: scores.dm },
    ranked: ranked.map(r => ({ rank: r.rank, track: r.name, code: r.code, key: r.key, score: r.score, percent: r.percent })),
    submitted: true
  });

  state.submitted = true;
}

function renderResults() {
  const { scores, ranked } = calcScores();

  // Rankings
  const badgeLabels = ['🥇', '🥈', '🥉'];
  $('#rankings-container').innerHTML = ranked.map((r, i) => `
    <div class="rank-card rank-${i + 1} scale-in" style="animation-delay:${i * 0.1}s">
      <div class="rank-badge">${badgeLabels[i]}</div>
      <div class="rank-info">
        <h3>${r.name}</h3>
        <div class="rank-code">${r.code}</div>
      </div>
      <div class="rank-score">
        <div class="percent ${trackColor[r.key]}">${r.percent}%</div>
        <div class="fraction">${r.score} / 15</div>
      </div>
    </div>
  `).join('');

  // Charts
  $('#results-charts').innerHTML = `
    <div class="card chart-card"><h3>Match Distribution</h3><canvas id="radar-chart"></canvas></div>
    <div class="card chart-card"><h3>Score Breakdown</h3><canvas id="donut-chart"></canvas></div>
  `;

  const chartColors = [
    { bg: 'rgba(34,211,238,0.2)', border: '#22d3ee' },
    { bg: 'rgba(52,211,153,0.2)', border: '#34d399' },
    { bg: 'rgba(192,132,252,0.2)', border: '#c084fc' }
  ];

  const labels = ['Low Power Circuits', 'Memory Design', 'Device Modelling'];
  const dataVals = [scores.lp, scores.md, scores.dm];

  new Chart($('#radar-chart'), {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'Score', data: dataVals,
        backgroundColor: 'rgba(34,211,238,0.1)', borderColor: '#22d3ee',
        pointBackgroundColor: chartColors.map(c => c.border),
        pointBorderColor: chartColors.map(c => c.border),
        pointRadius: 6, borderWidth: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      scales: { r: { beginAtZero: true, max: 15, ticks: { stepSize: 3, color: '#64748b', backdropColor: 'transparent' }, grid: { color: 'rgba(255,255,255,0.06)' }, pointLabels: { color: '#94a3b8', font: { size: 11 } } } },
      plugins: { legend: { display: false } }
    }
  });

  new Chart($('#donut-chart'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: dataVals, backgroundColor: chartColors.map(c => c.border), borderColor: 'transparent', borderWidth: 0, hoverOffset: 8 }]
    },
    options: {
      responsive: true, maintainAspectRatio: true, cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { size: 12 } } } }
    }
  });

  // Summary
  const top = ranked[0];
  const topElective = electives[top.key];
  const topC = trackColor[top.key];
  $('#result-summary').innerHTML = `
    <h3>Why ${top.name} Suits You</h3>
    <p style="color:var(--text-secondary);margin-bottom:16px;line-height:1.7;">${topElective.description}</p>
    <h4 style="font-size:0.9rem;color:var(--text-muted);margin-bottom:10px;">Key Syllabus Topics You'll Master:</h4>
    <div class="summary-pills">
      ${topElective.syllabus.map(s => `<span class="summary-pill" style="background:rgba(var(--${topC}-rgb),0.1);color:var(--${topC});border:1px solid rgba(var(--${topC}-rgb),0.2);">${s}</span>`).join('')}
    </div>
  `;

  // Show saved confirmation
  const subs = getSubmissions();
  const existing = subs[state.rollNumber];
  $('#submitted-time').textContent = existing?.timestamp ? `Recorded on ${new Date(existing.timestamp).toLocaleString()}` : 'Recorded';

  // Render question review
  renderQuestionReview();

  if (!state._confettiShown) {
    state._confettiShown = true;
    showConfetti();
    showToast('Response recorded automatically!', 'success');
  }
}

function renderQuestionReview() {
  const trackNames = {
    lp: 'Low Power Circuits (22EV354)',
    md: 'Memory Design (22EV355)',
    dm: 'Device Modelling (22EV356)'
  };

  const reviewHTML = questions.map((q, i) => {
    const chosen = state.answers[i];
    const chosenC = trackColor[chosen] || 'cyan';
    const chosenName = trackNames[chosen] || '—';

    return `
      <div class="card" style="padding:22px;margin-bottom:16px;border-radius:var(--radius-lg);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
          <div>
            <span class="mono" style="font-size:0.75rem;color:var(--lc-orange);font-weight:600;display:block;margin-bottom:4px;">QUESTION ${String(q.id).padStart(2, '0')} OF 15</span>
            <h4 class="font-display" style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin:0;">${q.title}</h4>
          </div>
          <span class="mono" style="font-size:0.76rem;padding:5px 12px;border-radius:6px;background:rgba(var(--${chosenC}-rgb),0.12);color:var(--${chosenC});border:1px solid rgba(var(--${chosenC}-rgb),0.3);font-weight:600;">
            Selected: ${chosenName.split(' (')[0]}
          </span>
        </div>

        <div style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;margin-bottom:16px;padding:12px 14px;background:#202020;border-radius:var(--radius);border-left:3px solid var(--border-hover);">
          ${q.scenario}
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;">
          ${q.options.map((opt, idx) => {
            const isChosen = opt.key === chosen;
            const c = trackColor[opt.key];
            return `
              <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:var(--radius);border:1px solid ${isChosen ? `var(--${c})` : 'var(--border)'};background:${isChosen ? `rgba(var(--${c}-rgb),0.08)` : '#222222'};">
                <span class="mono" style="font-weight:700;font-size:0.8rem;padding:2px 8px;border-radius:4px;background:var(--${c});color:#1a1a1a;flex-shrink:0;">
                  ${trackNames[opt.key]}
                </span>
                <div style="flex:1;font-size:0.88rem;color:${isChosen ? '#ffffff' : 'var(--text-secondary)'};line-height:1.5;">
                  ${opt.text}
                </div>
                ${isChosen ? `<span class="mono" style="font-size:0.75rem;font-weight:700;color:var(--${c});white-space:nowrap;">✓ Your Choice</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  $('#review-section').innerHTML = `
    <div style="margin-bottom:20px;">
      <h3 class="font-display" style="font-size:1.35rem;font-weight:700;margin-bottom:6px;color:var(--text-primary);">📋 Question & Answer Review</h3>
      <p style="color:var(--text-secondary);font-size:0.88rem;">Review all 15 scenarios, your selected answers, and which elective each approach mapped to.</p>
    </div>
    ${reviewHTML}
  `;
}

function initResults() {
  // No submit button needed — auto-saved on quiz completion
}

// ===== ADMIN =====
function showAdminModal() {
  $('#admin-overlay').style.display = 'flex';
  $('#admin-content').classList.remove('active');
  $('#admin-error').classList.remove('show');
  $('#admin-password').value = '';
}
function hideAdminModal() {
  $('#admin-overlay').style.display = 'none';
  $('#admin-content').classList.add('active');
}

function initAdmin() {
  $('#admin-login-btn').addEventListener('click', tryAdminLogin);
  $('#admin-password').addEventListener('keydown', e => { if (e.key === 'Enter') tryAdminLogin(); });
  $('#admin-back-btn').addEventListener('click', () => { window.location.hash = '#/'; });
  $('#admin-logout-btn').addEventListener('click', () => { state.adminAuth = false; window.location.hash = '#/'; });
  $('#export-csv-btn').addEventListener('click', exportCSV);
  $('#reset-db-btn')?.addEventListener('click', () => {
    if (confirm('⚠️ Are you sure you want to reset the database? This will permanently delete all student quiz submissions.')) {
      localStorage.removeItem(STORAGE_KEY);
      fetch('/api/submissions', { method: 'DELETE' }).catch(() => {});
      renderAdminDashboard();
      showToast('Database reset successfully. All submissions cleared.', 'success');
    }
  });
  $('#search-input').addEventListener('input', renderAdminTable);
  $('#course-filter').addEventListener('change', renderAdminTable);
  $('#sort-filter').addEventListener('change', renderAdminTable);
  $('#close-report-btn')?.addEventListener('click', () => { $('#report-modal-overlay').style.display = 'none'; });
  $('#report-modal-overlay')?.addEventListener('click', e => { if (e.target === $('#report-modal-overlay')) $('#report-modal-overlay').style.display = 'none'; });
}

function tryAdminLogin() {
  const pw = $('#admin-password').value;
  if (pw === ADMIN_PASSWORD) {
    state.adminAuth = true;
    hideAdminModal();
    renderAdminDashboard();
  } else {
    $('#admin-error').classList.add('show');
    $('#admin-password').classList.add('error');
    setTimeout(() => { $('#admin-password').classList.remove('error'); }, 1500);
  }
}

function renderAdminDashboard() {
  syncCloudSubmissions();
  const subs = getSubmissions();
  const rawList = Object.values(subs);
  const studentRecords = rawList.map(item => {
    if (item.latest && item.history) return item;
    return {
      rollNumber: item.rollNumber || item.latest?.rollNumber,
      latest: item.latest || item,
      history: item.history || [item.latest || item]
    };
  }).filter(item => item.latest && item.latest.submitted);

  const totalStudents = studentRecords.length;
  let totalAttempts = 0;
  const prefCount = { lp: 0, md: 0, dm: 0 };

  studentRecords.forEach(s => {
    totalAttempts += (s.history ? s.history.length : 1);
    if (s.latest.ranked?.[0]) prefCount[s.latest.ranked[0].key]++;
  });

  const mostPopularKey = Object.entries(prefCount).sort((a, b) => b[1] - a[1])[0];
  const mostPopular = mostPopularKey ? electives[mostPopularKey[0]]?.name || 'N/A' : 'N/A';

  $('#stats-grid').innerHTML = `
    <div class="card stat-card cyan"><div class="stat-value">${totalStudents}</div><div class="stat-label">Students Completed (${totalAttempts} Total Copies)</div></div>
    <div class="card stat-card emerald"><div class="stat-value">${mostPopular.split(' ').slice(0, 2).join(' ')}</div><div class="stat-label">Top 1st Choice Elective</div></div>
    <div class="card stat-card purple"><div class="stat-value">${Math.round((totalStudents / 62) * 100)}%</div><div class="stat-label">Batch Participation Rate</div></div>
  `;

  $('#admin-chart-section').innerHTML = `<div class="card"><h3 style="margin-bottom:16px;" class="font-display">Elective Distribution (1st Preference)</h3><canvas id="admin-pie" style="max-height:300px;"></canvas></div>`;

  if (totalStudents > 0) {
    new Chart($('#admin-pie'), {
      type: 'bar',
      data: {
        labels: ['Low Power Circuits', 'Memory Design', 'Device Modelling'],
        datasets: [{
          label: '1st Preference Count',
          data: [prefCount.lp, prefCount.md, prefCount.dm],
          backgroundColor: ['rgba(0,184,163,0.7)', 'rgba(255,161,22,0.7)', 'rgba(56,189,248,0.7)'],
          borderColor: ['#00b8a3', '#ffa116', '#38bdf8'],
          borderWidth: 2, borderRadius: 8, barPercentage: 0.5
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        scales: { y: { beginAtZero: true, ticks: { color: '#909090', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.06)' } }, x: { ticks: { color: '#eff1f6', font: { size: 11 } }, grid: { display: false } } },
        plugins: { legend: { display: false } }
      }
    });
  }

  renderAdminTable();
}

function renderAdminTable() {
  const subs = getSubmissions();
  const rawList = Object.values(subs);
  const studentRecords = rawList.map(item => {
    if (item.latest && item.history) return item;
    return {
      rollNumber: item.rollNumber || item.latest?.rollNumber,
      latest: item.latest || item,
      history: item.history || [item.latest || item]
    };
  }).filter(item => item.latest && item.latest.submitted);

  const search = ($('#search-input')?.value || '').trim();
  const courseFilter = $('#course-filter')?.value || 'all';
  const sortFilter = $('#sort-filter')?.value || 'roll-asc';

  let filtered = studentRecords;

  if (search) {
    filtered = filtered.filter(e => String(e.rollNumber).includes(search));
  }

  if (courseFilter !== 'all') {
    filtered = filtered.filter(e => e.latest.ranked?.[0]?.key === courseFilter);
  }

  filtered.sort((a, b) => {
    if (sortFilter === 'roll-asc') return a.rollNumber - b.rollNumber;
    if (sortFilter === 'roll-desc') return b.rollNumber - a.rollNumber;
    if (sortFilter === 'time-desc') return new Date(b.latest.timestamp || 0) - new Date(a.latest.timestamp || 0);
    if (sortFilter === 'time-asc') return new Date(a.latest.timestamp || 0) - new Date(b.latest.timestamp || 0);
    if (sortFilter === 'score-desc') return (b.latest.ranked?.[0]?.percent || 0) - (a.latest.ranked?.[0]?.percent || 0);
    return 0;
  });

  $('#table-count').textContent = `${filtered.length} of ${studentRecords.length} students showing`;

  if (filtered.length === 0) {
    $('#table-wrapper').innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="10" y1="2" x2="10" y2="22"/></svg>
        <p>No student submissions match your search or course filter.</p>
      </div>
    `;
    return;
  }

  const trackAbbr = { lp: 'LP', md: 'MD', dm: 'DM' };

  let tableHTML = `<table class="data-table"><thead><tr>
    <th>Roll #</th><th>Attempts</th><th>Latest Submitted</th><th>1st Preference</th><th>2nd Preference</th><th>3rd Preference</th><th>Track Score Breakdown</th><th>Actions</th>
  </tr></thead><tbody>`;

  filtered.forEach((item, idx) => {
    const entry = item.latest;
    const history = item.history || [entry];
    const r = entry.ranked || [];
    const ts = entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';
    const s = entry.scores || {};
    const lpPct = Math.round(((s.lp || 0) / 15) * 100);
    const mdPct = Math.round(((s.md || 0) / 15) * 100);
    const dmPct = Math.round(((s.dm || 0) / 15) * 100);

    tableHTML += `<tr>
      <td class="mono" style="font-weight:700;color:var(--lc-orange);">${item.rollNumber}</td>
      <td>
        <span class="mono" style="font-size:0.75rem;padding:3px 8px;border-radius:4px;background:#333;color:${history.length > 1 ? 'var(--lc-orange)' : 'var(--text-secondary)'};font-weight:600;">
          ${history.length} ${history.length === 1 ? 'attempt' : 'attempts'}
        </span>
      </td>
      <td style="color:var(--text-secondary);font-size:0.82rem;">${ts}</td>
      <td style="color:var(--${trackColor[r[0]?.key] || 'cyan'});font-weight:700;">${r[0]?.track || '—'} (${r[0]?.percent || 0}%)</td>
      <td style="color:var(--text-secondary);">${r[1]?.track || '—'}</td>
      <td style="color:var(--text-muted);">${r[2]?.track || '—'}</td>
      <td class="mono">
        <div style="display:flex;gap:5px;align-items:center;">
          <span style="font-size:0.74rem;padding:3px 7px;border-radius:4px;background:rgba(0,184,163,0.12);color:var(--cyan);border:1px solid rgba(0,184,163,0.25);font-weight:600;" title="Low Power Circuits">
            LP: ${s.lp || 0}/15 (${lpPct}%)
          </span>
          <span style="font-size:0.74rem;padding:3px 7px;border-radius:4px;background:rgba(255,161,22,0.12);color:var(--emerald);border:1px solid rgba(255,161,22,0.25);font-weight:600;" title="Memory Design">
            MD: ${s.md || 0}/15 (${mdPct}%)
          </span>
          <span style="font-size:0.74rem;padding:3px 7px;border-radius:4px;background:rgba(56,189,248,0.12);color:var(--purple);border:1px solid rgba(56,189,248,0.25);font-weight:600;" title="Device Modelling">
            DM: ${s.dm || 0}/15 (${dmPct}%)
          </span>
        </div>
      </td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="expand-btn" style="border-color:var(--lc-orange);color:var(--lc-orange);font-weight:600;" onclick="window.__openFullReport(${item.rollNumber}, ${history.length - 1})">Full Report</button>
          <button class="expand-btn" onclick="window.__toggleRow(${idx})">Q1–Q15</button>
          ${history.length > 1 ? `<button class="expand-btn" style="border-color:var(--text-secondary);color:var(--text-secondary);" onclick="window.__toggleHistory(${idx})">History (${history.length})</button>` : ''}
        </div>
      </td>
    </tr>`;

    // Answers Row
    tableHTML += `<tr class="answers-row" id="answers-row-${idx}"><td colspan="8"><div class="answers-detail">`;
    for (let i = 1; i <= 15; i++) {
      const ans = entry.answers?.[`Q${i}`] || '—';
      const c = trackColor[ans] || '';
      const label = trackAbbr[ans] || ans;
      tableHTML += `<div class="answer-chip" style="${c ? `border-color:var(--${c});color:var(--${c});` : ''}">Q${i}: ${label}</div>`;
    }
    tableHTML += `</div></td></tr>`;

    // History Log Row
    if (history.length > 1) {
      tableHTML += `<tr class="answers-row" id="history-row-${idx}"><td colspan="8"><div style="padding:12px;background:#202020;border-radius:8px;">
        <h5 style="margin-bottom:8px;font-size:0.82rem;color:var(--lc-orange);" class="mono">Attempt History Log for Roll #${item.rollNumber}</h5>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${history.map((att, aIdx) => {
            const attScores = att.scores || {};
            return `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 12px;background:#282828;border-radius:6px;font-size:0.8rem;gap:12px;flex-wrap:wrap;">
                <span><strong>Attempt #${aIdx + 1}:</strong> ${new Date(att.timestamp).toLocaleString('en-IN')}</span>
                <div style="display:flex;gap:8px;align-items:center;" class="mono">
                  <span style="color:var(--cyan);">LP: ${attScores.lp || 0}/15 (${Math.round(((attScores.lp||0)/15)*100)}%)</span>
                  <span style="color:var(--emerald);">MD: ${attScores.md || 0}/15 (${Math.round(((attScores.md||0)/15)*100)}%)</span>
                  <span style="color:var(--purple);">DM: ${attScores.dm || 0}/15 (${Math.round(((attScores.dm||0)/15)*100)}%)</span>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <span style="color:var(--${trackColor[att.ranked?.[0]?.key]});font-weight:700;">Top: ${att.ranked?.[0]?.track || 'N/A'}</span>
                  <button class="expand-btn" style="padding:2px 8px;font-size:0.72rem;border-color:var(--lc-orange);color:var(--lc-orange);" onclick="window.__openFullReport(${item.rollNumber}, ${aIdx})">View Report</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div></td></tr>`;
    }
  });

  tableHTML += '</tbody></table>';
  $('#table-wrapper').innerHTML = tableHTML;
}

window.__toggleRow = (idx) => {
  const row = $(`#answers-row-${idx}`);
  if (row) row.classList.toggle('show');
};

window.__toggleHistory = (idx) => {
  const row = $(`#history-row-${idx}`);
  if (row) row.classList.toggle('show');
};

window.__openFullReport = (rollNumber, attemptIdx) => {
  const history = getSubmissionHistory(rollNumber);
  const targetSubmission = (attemptIdx !== undefined && history[attemptIdx]) ? history[attemptIdx] : getLatestSubmission(rollNumber);

  if (!targetSubmission) {
    showToast('Submission data not found', 'error');
    return;
  }

  const trackNames = {
    lp: 'Low Power Circuits (22EV354)',
    md: 'Memory Design (22EV355)',
    dm: 'Device Modelling (22EV356)'
  };

  const r = targetSubmission.ranked || [];
  const s = targetSubmission.scores || {};
  const top = r[0] || {};
  const topColor = trackColor[top.key] || 'cyan';

  let reportHTML = `
    <div style="margin-bottom:24px;border-bottom:1px solid var(--border);padding-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <span class="mono" style="color:var(--lc-orange);font-weight:700;font-size:0.85rem;">OFFICIAL STUDENT ASSESSMENT REPORT</span>
          <h2 class="font-display" style="margin:4px 0 0 0;font-size:1.6rem;color:#ffffff;">Roll Number #${rollNumber}</h2>
        </div>
        <div style="text-align:right;">
          <span class="mono" style="font-size:0.8rem;color:var(--text-secondary);display:block;">${targetSubmission.timestamp ? new Date(targetSubmission.timestamp).toLocaleString('en-IN') : 'N/A'}</span>
          <span class="mono" style="font-size:0.75rem;padding:2px 8px;border-radius:4px;background:#282828;color:var(--lc-orange);display:inline-block;margin-top:4px;">Attempt #${(attemptIdx !== undefined ? attemptIdx + 1 : history.length)} of ${history.length}</span>
        </div>
      </div>
    </div>

    <!-- Top Recommendation -->
    <div style="padding:20px;background:rgba(var(--${topColor}-rgb),0.08);border:1px solid var(--${topColor});border-radius:var(--radius-lg);margin-bottom:24px;">
      <div class="mono" style="font-size:0.75rem;color:var(--${topColor});font-weight:700;margin-bottom:4px;">TOP RECOMMENDED ELECTIVE MATCH</div>
      <h3 class="font-display" style="font-size:1.3rem;margin:0 0 6px 0;color:#ffffff;">${top.track} — ${top.code || ''} (${top.percent || 0}% Match Score)</h3>
      <p style="color:var(--text-secondary);font-size:0.88rem;margin:0;">Matched based on 15 real-world engineering scenarios answered during assessment.</p>
    </div>

    <!-- Score Breakdown -->
    <h4 class="font-display" style="margin-bottom:12px;font-size:1.05rem;">🎯 Complete Track Score Breakdown</h4>
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:28px;">
      <div style="padding:14px;background:#202020;border-radius:8px;border-left:3px solid var(--cyan);">
        <div style="font-size:0.78rem;color:var(--text-secondary);">Low Power Circuits (22EV354)</div>
        <div class="mono" style="font-size:1.3rem;font-weight:700;color:var(--cyan);margin-top:2px;">${s.lp || 0} / 15 <span style="font-size:0.85rem;font-weight:400;color:var(--text-muted);">(${Math.round(((s.lp||0)/15)*100)}%)</span></div>
      </div>
      <div style="padding:14px;background:#202020;border-radius:8px;border-left:3px solid var(--emerald);">
        <div style="font-size:0.78rem;color:var(--text-secondary);">Memory Design (22EV355)</div>
        <div class="mono" style="font-size:1.3rem;font-weight:700;color:var(--emerald);margin-top:2px;">${s.md || 0} / 15 <span style="font-size:0.85rem;font-weight:400;color:var(--text-muted);">(${Math.round(((s.md||0)/15)*100)}%)</span></div>
      </div>
      <div style="padding:14px;background:#202020;border-radius:8px;border-left:3px solid var(--purple);">
        <div style="font-size:0.78rem;color:var(--text-secondary);">Device Modelling (22EV356)</div>
        <div class="mono" style="font-size:1.3rem;font-weight:700;color:var(--purple);margin-top:2px;">${s.dm || 0} / 15 <span style="font-size:0.85rem;font-weight:400;color:var(--text-muted);">(${Math.round(((s.dm||0)/15)*100)}%)</span></div>
      </div>
    </div>

    <!-- Questions & Answers -->
    <h4 class="font-display" style="margin-bottom:14px;font-size:1.05rem;">📋 Full 15-Question Response Log</h4>
    <div style="display:flex;flex-direction:column;gap:14px;">
      ${questions.map((q, i) => {
        const chosen = targetSubmission.answers?.[`Q${i + 1}`];
        const chosenC = trackColor[chosen] || 'cyan';
        return `
          <div style="padding:16px;background:#202020;border-radius:8px;border:1px solid var(--border);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px;">
              <span class="mono" style="font-size:0.75rem;color:var(--lc-orange);font-weight:700;">Q${q.id}. ${q.title}</span>
              <span class="mono" style="font-size:0.72rem;padding:2px 8px;border-radius:4px;background:rgba(var(--${chosenC}-rgb),0.12);color:var(--${chosenC});">
                Selected: ${trackNames[chosen] || '—'}
              </span>
            </div>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;line-height:1.5;">${q.scenario}</div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${q.options.map(opt => {
                const isChosen = opt.key === chosen;
                const c = trackColor[opt.key];
                return `
                  <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:6px;border:1px solid ${isChosen ? `var(--${c})` : 'var(--border)'};background:${isChosen ? `rgba(var(--${c}-rgb),0.08)` : '#262626'};font-size:0.82rem;">
                    <span class="mono" style="font-size:0.72rem;padding:1px 6px;border-radius:3px;background:var(--${c});color:#1a1a1a;font-weight:700;flex-shrink:0;">${trackNames[opt.key].split(' (')[0]}</span>
                    <div style="flex:1;color:${isChosen ? '#ffffff' : 'var(--text-secondary)'};">${opt.text}</div>
                    ${isChosen ? `<span class="mono" style="font-size:0.72rem;color:var(--${c});font-weight:700;white-space:nowrap;">✓ Selected</span>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  $('#report-modal-content').innerHTML = reportHTML;
  $('#report-modal-overlay').style.display = 'flex';
};

// ===== CSV EXPORT =====
function exportCSV() {
  const subs = getSubmissions();
  const rawList = Object.values(subs);
  const allAttempts = [];

  rawList.forEach(item => {
    const list = item.history || (item.latest ? [item.latest] : [item]);
    list.forEach((attempt, aIdx) => {
      if (attempt && attempt.submitted) {
        allAttempts.push({
          ...attempt,
          attemptNum: aIdx + 1
        });
      }
    });
  });

  allAttempts.sort((a, b) => a.rollNumber - b.rollNumber);
  if (allAttempts.length === 0) { showToast('No submissions to export', 'error'); return; }

  let headers = ['Roll Number', 'Attempt #', 'Timestamp', '1st Preference', '2nd Preference', '3rd Preference', 'Low Power Score', 'Memory Score', 'Device Score'];
  for (let i = 1; i <= 15; i++) headers.push(`Q${i}`);

  const trackLabel = { lp: 'Low Power', md: 'Memory', dm: 'Device' };
  const rows = allAttempts.map(e => {
    const r = e.ranked || [];
    const s = e.scores || {};
    const row = [e.rollNumber, e.attemptNum || 1, e.timestamp || '', r[0]?.track || '', r[1]?.track || '', r[2]?.track || '', s.lp || 0, s.md || 0, s.dm || 0];
    for (let i = 1; i <= 15; i++) row.push(trackLabel[e.answers?.[`Q${i}`]] || '');
    return row.map(v => `"${v}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `vlsi_all_attempts_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast('Exported all student attempt copies to CSV', 'success');
}

// ===== CONFETTI =====
function showConfetti() {
  const container = $('#confetti-container');
  container.innerHTML = '';
  const colors = ['#22d3ee', '#34d399', '#c084fc', '#fbbf24', '#f87171', '#818cf8'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 2 + 's';
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    piece.style.width = (6 + Math.random() * 8) + 'px';
    piece.style.height = (6 + Math.random() * 8) + 'px';
    container.appendChild(piece);
  }
  setTimeout(() => { container.innerHTML = ''; }, 5000);
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 3500);
}

// ===== INIT =====
function init() {
  generateShuffledOrders();
  initLanding();
  initQuiz();
  initResults();
  initAdmin();
  handleRoute();
}

document.addEventListener('DOMContentLoaded', init);
