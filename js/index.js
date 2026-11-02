/* Startsida – mående-check, populära ämnen, kommande aktiviteter och veckans lässtund */

let me;

const MOODS = [
  { value: 1, label: 'Dåligt', mouth: 'M8.5 16.5c1.8-2 5.2-2 7 0' },
  { value: 2, label: 'Sådär', mouth: 'M9 16c1.6-.9 4.4-.9 6 0' },
  { value: 3, label: 'Okej', mouth: 'M9 15.5h6' },
  { value: 4, label: 'Bra', mouth: 'M9 14.5c1.6 1.3 4.4 1.3 6 0' },
  { value: 5, label: 'Toppen', mouth: 'M8 14c1.8 2.6 6.2 2.6 8 0' }
];

function moodFace(mood) {
  return '<svg class="mood-face" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9.5"/><path d="M9 9.5v.5M15 9.5v.5"/><path d="' + mood.mouth + '"/></svg>';
}

function initPage() {
  me = currentUser();

  // Hälsning och knappar beroende på om man är inloggad
  if (me) {
    $('#hello').textContent = 'Hej ' + me.alias + '!';
    const group = getSmallGroup(me.id);
    $('#hero-actions').innerHTML = group
      ? '<a class="btn btn-primary" href="grupper.html">Till ' + escapeHtml(group.name) + '</a><a class="btn btn-ghost" href="amnen.html">Läs i Ämnen</a>'
      : '<a class="btn btn-primary" href="grupper.html">Hitta din grupp</a><a class="btn btn-ghost" href="amnen.html">Läs i Ämnen</a>';
  } else {
    $('#hero-actions').innerHTML = '<a class="btn btn-primary" href="logga-in.html?nytt=1">Skapa konto med BankID</a><a class="btn btn-ghost" href="om-oss.html">Läs mer om oss</a>';
  }

  // Mående-knappar
  $('#mood-buttons').innerHTML = MOODS.map(m =>
    '<button type="button" class="mood-btn" data-mood="' + m.value + '" aria-pressed="false">' + moodFace(m) + m.label + '</button>').join('');
  $$('#mood-buttons .mood-btn').forEach(b => b.addEventListener('click', () => chooseMood(Number(b.dataset.mood))));

  // Populära ämnen = flest synliga inlägg
  $('#popular-topics').innerHTML = db.topics.slice()
    .sort((a, b) => countPostsInTopic(b.id) - countPostsInTopic(a.id)).slice(0, 6)
    .map(t => '<li><a class="chip" href="amnen.html?amne=' + t.id + '">' + escapeHtml(t.name) + '</a></li>').join('');

  renderUpcoming();
  renderReading();
  $('#help-box').innerHTML = helpBoxHtml();
  renderMyWeek();
}

function renderUpcoming() {
  // Två aktiviteter (lässtunden har ett eget kort bredvid)
  $('#upcoming').innerHTML = upcomingActivities().filter(a => !a.book_id).slice(0, 2).map(a => activityCardHtml(a, me)).join('');
  if (me) bindActivityButtons($('#upcoming'), me, renderUpcoming);
}

// Veckans lässtund som ett kort i samma rad som aktiviteterna
function renderReading() {
  const a = nextReading();
  const box = $('#weekly-reading');
  if (!a) { box.innerHTML = '<h3>Veckans lässtund</h3><p class="muted">Ingen lässtund planerad just nu.</p>'; return; }
  const book = getBook(a.book_id);
  box.innerHTML =
    '<div class="row" style="align-items:flex-start;flex-wrap:nowrap">' +
      '<div class="book-cover" style="width:80px;font-size:.75rem" aria-hidden="true">' + escapeHtml(book.title) + '</div>' +
      '<div><span class="badge badge-accent">Veckans lässtund</span><h3 style="margin:.5rem 0 0">' + escapeHtml(book.title) + '</h3>' +
      '<p class="muted small" style="margin:0">av ' + escapeHtml(book.author) + '</p></div>' +
    '</div>' +
    '<ul class="meta-list"><li>' + icon('clock') + formatDate(a.starts_at) + '</li><li>' + icon('pin') + escapeHtml(a.location) + '</li>' +
    '<li>' + icon('user') + 'Läses av ' + escapeHtml(getAlias(a.created_by)) + '</li></ul>' +
    '<a class="btn btn-primary" href="lasstund.html">Till lässtunden</a>';
}

function chooseMood(value) {
  $$('#mood-buttons .mood-btn').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.mood) === value)));
  if (me) insertRow('mood_checks', { user_id: me.id, mood: value, created_at: nowIso(), activity_id: null });

  const result = $('#mood-result');
  const saved = me ? '<p class="muted small">Sparat på <a href="min-sida.html">Min sida</a>. Bara du ser det.</p>' : '<p class="muted small"><a href="logga-in.html">Logga in</a> för att spara ditt mående.</p>';

  if (value <= 2) {
    // Dåligt eller Sådär: lugna grupper, en volontär eller stödlinjer
    const calm = db.groups.filter(g => g.interest_id === 12 || /lugn/i.test(g.name)).slice(0, 2);
    result.innerHTML = '<div class="notice notice-warm">' +
      '<p><strong>Tack för att du berättar.</strong> Det är okej att inte må bra. Här är några saker som kan hjälpa:</p>' +
      '<ul>' + calm.map(g => '<li><a href="grupper.html">' + escapeHtml(g.name) + '</a> – en lugn grupp</li>').join('') +
      '<li><a href="samtal.html?flik=volontar">Prata med en volontär</a></li>' +
      '<li>Ring <a href="tel:90101">Självmordslinjen 90101</a>, <a href="tel:1177">1177</a> eller <a href="tel:112">112</a> vid akut fara</li></ul></div>' + saved;
  } else if (value === 3) {
    result.innerHTML = '<div class="notice"><p>Okej är helt okej. Kanske en <a href="aktiviteter.html?filter=ute">promenad</a> eller en <a href="lasstund.html">lässtund</a> kan ge lite energi?</p></div>' + saved;
  } else {
    result.innerHTML = '<div class="notice notice-success"><p>Vad kul att höra! Vill du sprida lite av det? Skriv något peppigt i <a href="amnen.html?amne=7">Att må bättre</a> eller häng med på en <a href="aktiviteter.html">aktivitet</a>.</p></div>' + saved;
  }
}

function weekTile(ic, label, title, sub, href, linkText) {
  return '<div class="week-tile"><span class="label">' + icon(ic) + label + '</span><strong>' + title + '</strong>' +
    '<span class="muted small">' + sub + '</span><a href="' + href + '">' + linkText + ' ' + icon('arrow') + '</a></div>';
}

// Din vecka: det viktigaste för dig just nu, så att du vet vart du ska
function renderMyWeek() {
  const box = $('#my-week');
  if (!me) return;
  const group = getSmallGroup(me.id);
  const next = upcomingActivities().find(a => isParticipant(a.id, me.id));
  const unread = countUnread(me.id);
  const reminders = getReminders(me.id);
  const toRate = activitiesToRate(me.id);

  box.innerHTML = '<h2 id="week-title">Din vecka</h2>' +
    (reminders.length ? '<div class="notice"><p style="margin-bottom:.25rem"><strong>Påminnelse</strong></p><ul class="reminder-list">' +
      reminders.map(r => '<li>' + icon('clock') + '<span><strong>' + whenText(r.starts_at) + ':</strong> <a href="' + r.href + '">' + escapeHtml(r.title) + '</a>' +
        (r.groupId && !isAttending(r.groupId, me.id) ? ' – har du sagt att du kommer?' : '') + '</span></li>').join('') + '</ul></div>' : '') +
    toRate.map(a => '<div class="notice notice-success"><p><strong>Hur var ' + escapeHtml(a.title) + '?</strong> Ditt svar hamnar i din mående-kurva. Bara du ser det.</p>' +
      '<div class="mood-buttons" role="group" aria-label="Hur var ' + escapeHtml(a.title) + '?">' +
      MOODS.map(m => '<button type="button" class="mood-btn" data-rate="' + a.id + '" data-mood="' + m.value + '">' + moodFace(m) + m.label + '</button>').join('') +
      '</div></div>').join('') +
    '<div class="week-grid">' +
      weekTile('users', 'Din grupp', group ? escapeHtml(group.name) : 'Ingen grupp än',
        group ? whenText(nextMeeting(group.id)) : 'Vi har ett förslag till dig', 'grupper.html', group ? 'Till gruppen' : 'Se förslaget') +
      weekTile('calendar', 'Nästa aktivitet', next ? escapeHtml(next.title) : 'Inget inbokat',
        next ? whenText(next.starts_at) : 'Promenader, plugg och spel', 'aktiviteter.html', next ? 'Se aktiviteter' : 'Hitta något') +
      weekTile('chat', 'Meddelanden', unread ? unread + (unread > 1 ? ' olästa' : ' oläst') : 'Inga nya',
        'Från din grupp och volontärer', 'samtal.html', 'Öppna samtal') +
    '</div>';
  box.hidden = false;

  // "Hur var det?" sparas som en mående-check kopplad till aktiviteten
  $$('[data-rate]', box).forEach(b => b.addEventListener('click', () => {
    insertRow('mood_checks', { user_id: me.id, mood: Number(b.dataset.mood), created_at: nowIso(), activity_id: Number(b.dataset.rate) });
    toast('Tack! Det syns i din mående-kurva på Min sida.');
    renderMyWeek();
  }));
}
