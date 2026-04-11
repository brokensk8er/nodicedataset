// poll-admin.js
// Shared poll admin UI — ES6 module.
// Used by both index.html and profile.html.
//
// Usage:
//   import { createPollAdmin } from './poll-admin.js';
//   const admin = createPollAdmin({ set, ref, db, pollRef, votesRef, onValue });
//   admin.startListener();   // profile.html (admin-only)
//   admin.renderForm();      // or call individual renders from your own listener

export const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function createPollAdmin({ set, ref, db, pollRef, votesRef, onValue }) {
  const MIN_OPTS = 2;
  const MAX_OPTS = 5;
  const PLACEHOLDERS = [
    'The first option…', 'The second option…', 'A third choice…',
    'Or maybe this…', 'One more possibility…',
  ];

  let optCount     = MIN_OPTS;
  let unsubVotes   = null;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function badge() {
    const live = !!db;
    return `<div class="source-badge ${live ? 'live' : 'fallback'}"><span class="dot"></span>${live ? 'Connected' : 'Firebase not configured'}</div>`;
  }

  // ── Admin form (no active poll) ──────────────────────────────

  function renderForm(preserveValues) {
    const optRowsHtml = LETTERS.slice(0, optCount).map((letter, i) => {
      const isReq = i < MIN_OPTS;
      const removeBtn = isReq
        ? `<div class="poll-btn-remove-placeholder"></div>`
        : `<button class="poll-btn-remove-option" data-index="${i}" title="Remove">✕</button>`;
      const val = preserveValues && preserveValues[i] ? esc(preserveValues[i]) : '';
      return `<div class="poll-option-row" id="padmin-row-${i}">
        <span class="poll-option-letter-tag">${letter}</span>
        <input class="poll-form-input" id="padmin-opt-${i}" type="text"
          placeholder="${PLACEHOLDERS[i]}" maxlength="80" autocomplete="off" value="${val}">
        ${removeBtn}</div>`;
    }).join('');

    const addBtnHtml = optCount < MAX_OPTS
      ? `<button class="poll-btn-add-option" id="padmin-add-btn">
           <span style="font-size:1.1rem;line-height:1;opacity:.55;">＋</span>
           Add another option (${optCount}/${MAX_OPTS})</button>`
      : '';

    document.getElementById('poll-inner').innerHTML = `
      <div class="poll-admin-section">
        <div class="poll-admin-badge">⚔ Showrunner</div>
        <div class="poll-form-group">
          <label class="poll-form-label" for="padmin-q">Question</label>
          <input class="poll-form-input" id="padmin-q" type="text"
            placeholder="What does the crowd choose?" maxlength="120" autocomplete="off"
            value="${preserveValues && preserveValues.question ? esc(preserveValues.question) : ''}">
        </div>
        <div class="poll-options-section-label">
          <span class="poll-form-label" style="margin-bottom:0;">Options</span>
          <span class="poll-options-count-hint">Min 2 · Max 5</span>
        </div>
        <div id="padmin-opts">${optRowsHtml}</div>
        ${addBtnHtml}
        <button class="poll-btn-launch" id="padmin-launch-btn">⚔ Launch Poll</button>
        ${badge()}
      </div>`;
    document.getElementById('poll-footer').innerHTML = '';

    document.getElementById('padmin-launch-btn').onclick = launch;
    document.getElementById('padmin-q').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('padmin-opt-0')?.focus();
    });
    for (let i = 0; i < optCount; i++) {
      document.getElementById(`padmin-opt-${i}`).addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const next = document.getElementById(`padmin-opt-${i + 1}`);
          if (next) next.focus(); else launch();
        }
      });
    }
    document.getElementById('padmin-add-btn')?.addEventListener('click', () => {
      const vals = gatherValues();
      optCount++;
      renderForm(vals);
      setTimeout(() => document.getElementById(`padmin-opt-${optCount - 1}`)?.focus(), 50);
    });
    document.querySelectorAll('.poll-btn-remove-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        const vals = gatherValues();
        vals.splice(idx, 1);
        optCount--;
        renderForm(vals);
      });
    });
  }

  function gatherValues() {
    const vals = [];
    vals.question = document.getElementById('padmin-q')?.value ?? '';
    for (let i = 0; i < optCount; i++) {
      vals.push(document.getElementById(`padmin-opt-${i}`)?.value ?? '');
    }
    return vals;
  }

  // ── Launch poll ──────────────────────────────────────────────

  async function launch() {
    if (!pollRef) return;
    const q = document.getElementById('padmin-q')?.value.trim();
    const options = [];
    for (let i = 0; i < optCount; i++) {
      options.push((document.getElementById(`padmin-opt-${i}`)?.value ?? '').trim());
    }
    let hasError = false;
    if (!q) {
      const el = document.getElementById('padmin-q');
      el.style.borderColor = '#c0392b'; el.focus();
      setTimeout(() => { el.style.borderColor = ''; }, 1200);
      hasError = true;
    }
    options.forEach((val, i) => {
      if (!val) {
        const el = document.getElementById(`padmin-opt-${i}`);
        if (el) {
          el.style.borderColor = '#c0392b';
          if (!hasError) el.focus();
          setTimeout(() => { el.style.borderColor = ''; }, 1200);
        }
        hasError = true;
      }
    });
    if (hasError) return;
    const btn = document.getElementById('padmin-launch-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Launching…'; }
    await set(pollRef, { question: q, options, active: true, revealed: false, ts: Date.now() });
    await set(votesRef, {});
    optCount = MIN_OPTS;
  }

  // ── Pre-reveal (votes hidden from audience) ──────────────────

  function renderPreReveal(poll, votes) {
    const opts = poll.options || [];
    const counts = opts.map((_, i) => Object.values(votes).filter(v => v === String(i)).length);
    const total = counts.reduce((a, b) => a + b, 0);
    const pcts = counts.map(c => total ? Math.round(c / total * 100) : 0);
    const maxC = Math.max(...counts);
    const barsHtml = opts.map((o, i) => `<div class="poll-result-row">
      <div class="poll-result-label-row">
        <span class="poll-result-opt-name">${LETTERS[i]} — ${esc(o)}</span>
        <span><span class="poll-result-pct">${pcts[i]}%</span><span class="poll-result-count">${counts[i]}</span></span>
      </div>
      <div class="bar-track"><div class="bar-fill${counts[i] === maxC && total > 0 ? ' winner' : ''}" style="width:${pcts[i]}%"></div></div>
    </div>`).join('');

    document.getElementById('poll-inner').innerHTML = `
      <div class="poll-admin-section">
        <div class="poll-admin-badge">⚔ Showrunner</div>
        <div class="poll-admin-results-header">
          <div>
            <div class="poll-question-label">Active Poll</div>
          </div>
          <div class="poll-live-indicator"><span class="poll-live-dot"></span>Votes incoming</div>
        </div>
        <p class="poll-question-text">${esc(poll.question)}</p>
        <div class="poll-result-wrap">${barsHtml}</div>
        <p class="total-votes">${total} vote${total !== 1 ? 's' : ''} cast — audience sees nothing yet</p>
        <button class="poll-btn-reveal" id="padmin-reveal-btn">🎲 Reveal Results to Audience</button>
        <button class="poll-btn-danger" id="padmin-close-btn">Close Poll &amp; Clear</button>
        ${badge()}
      </div>`;
    document.getElementById('poll-footer').innerHTML = '';
    document.getElementById('padmin-reveal-btn').onclick = reveal;
    document.getElementById('padmin-close-btn').onclick = clear;
  }

  // ── Post-reveal (results shown to audience) ──────────────────

  function renderPostReveal(poll, votes) {
    const opts = poll.options || [];
    const counts = opts.map((_, i) => Object.values(votes).filter(v => v === String(i)).length);
    const total = counts.reduce((a, b) => a + b, 0);
    const pcts = counts.map(c => total ? Math.round(c / total * 100) : 0);
    const maxC = Math.max(...counts);
    const barsHtml = opts.map((o, i) => `<div class="poll-result-row">
      <div class="poll-result-label-row">
        <span class="poll-result-opt-name">${LETTERS[i]} — ${esc(o)}</span>
        <span><span class="poll-result-pct">${pcts[i]}%</span><span class="poll-result-count">${counts[i]}</span></span>
      </div>
      <div class="bar-track"><div class="bar-fill${counts[i] === maxC && total > 0 ? ' winner' : ''}" style="width:${pcts[i]}%"></div></div>
    </div>`).join('');

    document.getElementById('poll-inner').innerHTML = `
      <div class="poll-admin-section">
        <div class="poll-admin-badge">⚔ Showrunner</div>
        <div class="poll-admin-results-header">
          <div>
            <div class="poll-question-label">Results Revealed</div>
          </div>
          <div class="poll-live-indicator" style="color:var(--gold);">
            <span class="poll-live-dot" style="background:var(--gold);animation:none;"></span>Visible to audience
          </div>
        </div>
        <p class="poll-question-text">${esc(poll.question)}</p>
        <div class="poll-result-wrap">${barsHtml}</div>
        <p class="total-votes">${total} vote${total !== 1 ? 's' : ''} cast</p>
        <button class="poll-btn-new" id="padmin-new-btn">New Poll</button>
        <button class="poll-btn-danger" id="padmin-close2-btn">Close Poll &amp; Clear</button>
        ${badge()}
      </div>`;
    document.getElementById('poll-footer').innerHTML = '';
    document.getElementById('padmin-new-btn').onclick = clear;
    document.getElementById('padmin-close2-btn').onclick = clear;
  }

  // ── Reveal / Clear ───────────────────────────────────────────

  async function reveal() {
    if (!db) return;
    const btn = document.getElementById('padmin-reveal-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Revealing…'; }
    await set(ref(db, 'nodice/poll/revealed'), true);
  }

  async function clear() {
    if (!pollRef || !votesRef) return;
    await set(pollRef, { active: false });
    await set(votesRef, {});
    optCount = MIN_OPTS;
  }

  // ── Self-contained admin listener (used by profile.html) ─────

  function startListener() {
    if (!pollRef) {
      document.getElementById('poll-inner').innerHTML =
        '<div class="poll-waiting">Firebase not configured.</div>';
      return;
    }
    document.getElementById('poll-inner').innerHTML =
      '<div class="poll-waiting"><span style="font-size:1.2rem">⚔</span><br>Connecting…</div>';

    onValue(pollRef, snap => {
      const poll = snap.val();
      if (!poll || !poll.active) {
        if (unsubVotes) { unsubVotes(); unsubVotes = null; }
        renderForm();
      } else {
        if (unsubVotes) unsubVotes();
        unsubVotes = onValue(votesRef, votesSnap => {
          const votes = votesSnap.val() || {};
          if (poll.revealed) renderPostReveal(poll, votes);
          else renderPreReveal(poll, votes);
        });
      }
    });
  }

  return { renderForm, renderPreReveal, renderPostReveal, launch, reveal, clear, startListener, badge };
}
