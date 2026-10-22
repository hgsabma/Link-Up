/* Min sida – alias, mående-kurva, intressen, grupper, aktiviteter, blockeringar och inställningar */

let me;
const MOOD_LABELS = ['', 'Dåligt', 'Sådär', 'Okej', 'Bra', 'Toppen'];

function initPage() {
  me = currentUser();

  $('#profile').innerHTML = avatar(me.id, 'lg') +
    '<div><h1 id="profile-title" style="font-size:2rem;margin:0">' + escapeHtml(me.alias) + '</h1>' +
    '<p class="muted" style="margin:0">' + roleLabel(me.role) + ' sedan ' + new Date(me.created_at).getDate() + ' ' + MONTHS[new Date(me.created_at).getMonth()] + ' ' + new Date(me.created_at).getFullYear() +
    ' · Andra ser bara ditt alias</p></div>';

  // Inställningar – sparas i localStorage via app.js
  $('#set-theme').addEventListener('change', toggleTheme);
  $('#set-text').addEventListener('change', toggleTextSize);
  updateSettingButtons();
  $('#logout2-btn').addEventListener('click', logout);
  $('#reset-btn').addEventListener('click', () => {
    if (!confirm('Återställ all exempeldata? Allt du skrivit i prototypen försvinner.')) return;
    const bankid = me.bankid_hash;
    resetDb();
    const again = getUserByBankId(bankid);
    if (again) { login(again.id); location.reload(); } else logout();
  });

  renderMoodChart();
  renderInterests();
  renderGroups();
  renderActivities();
  renderBlocked();
}

// Mående-kurva för de senaste sju dagarna (senaste värdet per dag)
function renderMoodChart() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const checks = getMoodChecks(me.id).filter(m => dateKey(m.created_at) === key);
    days.push({ label: i === 0 ? 'Idag' : WEEKDAYS[d.getDay()].slice(0, 3), mood: checks.length ? checks[checks.length - 1].mood : null });
  }
  const W = 560, H = 220, left = 64, right = 16, top = 16, bottom = 36;
  const x = i => left + i * (W - left - right) / 6;
  const y = m => top + (5 - m) * (H - top - bottom) / 4;
  const points = days.map((d, i) => d.mood ? [x(i), y(d.mood)] : null).filter(Boolean);

  let svg = '<svg class="mood-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="chart-desc"><desc id="chart-desc">' +
    days.map(d => d.label + ': ' + (d.mood ? MOOD_LABELS[d.mood] : 'ingen check')).join(', ') + '</desc>';
  for (let m = 1; m <= 5; m++) {
    svg += '<line class="axis" x1="' + left + '" x2="' + (W - right) + '" y1="' + y(m) + '" y2="' + y(m) + '"/>' +
      '<text x="' + (left - 10) + '" y="' + (y(m) + 4) + '" text-anchor="end">' + MOOD_LABELS[m] + '</text>';
  }
  days.forEach((d, i) => { svg += '<text x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="middle">' + d.label + '</text>'; });
  if (points.length > 1) {
    const line = points.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
    svg += '<path class="area" d="' + line + ' L' + points[points.length - 1][0] + ' ' + y(1) + ' L' + points[0][0] + ' ' + y(1) + ' Z"/>' +
      '<path class="line" d="' + line + '"/>';
  }
  points.forEach(p => { svg += '<circle class="dot" cx="' + p[0] + '" cy="' + p[1] + '" r="6"/>'; });
  svg += '</svg>';
  $('#mood-chart').innerHTML = points.length ? svg : '<p class="muted">Du har inte gjort någon mående-check den här veckan.</p>';
}

function renderInterests() {
  const mine = getUserInterestIds(me.id);
  $('#interest-list').innerHTML = db.interests.map(i =>
    '<button type="button" class="chip" data-interest="' + i.id + '" aria-pressed="' + mine.includes(i.id) + '">' + escapeHtml(i.name) + '</button>').join('');
  $$('#interest-list .chip').forEach(b => b.addEventListener('click', () => {
    const id = Number(b.dataset.interest);
    if (getUserInterestIds(me.id).includes(id)) {
      if (getUserInterestIds(me.id).length <= 3) return toast('Du behöver ha minst tre intressen.');
      deleteRows('user_interests', ui => ui.user_id === me.id && ui.interest_id === id);
    } else {
      insertRow('user_interests', { user_id: me.id, interest_id: id }, false);
    }
    renderInterests();
    $('[data-interest="' + id + '"]').focus();
  }));
}

function renderGroups() {
  const groups = getUserGroups(me.id);
  $('#my-groups').innerHTML = groups.length ? groups.map(g =>
    '<li><a href="grupper.html?grupp=' + g.id + '">' + escapeHtml(g.name) + '</a><span class="muted small">Nästa träff ' + formatDate(nextMeeting(g.id)) + '</span></li>').join('') :
    '<li><span class="muted">Inga grupper än.</span><a href="grupper.html">Hitta en grupp</a></li>';
}

function renderActivities() {
  const acts = upcomingActivities().filter(a => isParticipant(a.id, me.id));
  $('#my-activities').innerHTML = acts.length ? acts.map(a =>
    '<li><a href="aktiviteter.html">' + escapeHtml(a.title) + '</a><span class="muted small">' + formatDate(a.starts_at) + '</span></li>').join('') :
    '<li><span class="muted">Du är inte anmäld till något än.</span><a href="aktiviteter.html">Se aktiviteter</a></li>';
}

function renderBlocked() {
  const blocked = db.blocks.filter(b => b.blocker_id === me.id);
  $('#blocked-list').innerHTML = blocked.length ? blocked.map(b =>
    '<li><span class="row">' + avatar(b.blocked_id, 'sm') + escapeHtml(getAlias(b.blocked_id)) + '</span>' +
    '<button type="button" class="btn btn-sm btn-ghost" data-unblock="' + b.blocked_id + '">Ta bort blockering</button></li>').join('') :
    '<li class="muted">Du har inte blockerat någon.</li>';
  $$('[data-unblock]').forEach(btn => btn.addEventListener('click', () => {
    const id = Number(btn.dataset.unblock);
    deleteRows('blocks', b => b.blocker_id === me.id && b.blocked_id === id);
    toast(getAlias(id) + ' är inte längre blockerad.');
    renderBlocked();
  }));
}
