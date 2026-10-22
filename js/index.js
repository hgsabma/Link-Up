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
}

function renderUpcoming() {
  $('#upcoming').innerHTML = upcomingActivities().slice(0, 3).map(a => activityCardHtml(a, me)).join('');
  if (me) bindActivityButtons($('#upcoming'), me, renderUpcoming);
}

function renderReading() {
  const a = nextReading();
  const box = $('#weekly-reading');
  if (!a) { box.innerHTML = '<h2 id="reading-title">Veckans lässtund</h2><p class="muted">Ingen lässtund planerad just nu.</p>'; return; }
  const book = getBook(a.book_id);
  box.innerHTML = '<h2 id="reading-title">Veckans lässtund</h2>' +
    '<div class="row" style="align-items:flex-start;flex-wrap:nowrap">' +
      '<div class="book-cover" aria-hidden="true">' + escapeHtml(book.title) + '</div>' +
      '<div><h3>' + escapeHtml(book.title) + '</h3><p class="muted" style="margin:0">av ' + escapeHtml(book.author) + '</p>' +
      '<ul class="meta-list" style="margin:1rem 0"><li>' + icon('clock') + formatDate(a.starts_at) + '</li><li>' + icon('pin') + escapeHtml(a.location) + '</li>' +
      '<li>' + icon('user') + 'Läses av ' + escapeHtml(getAlias(a.created_by)) + '</li></ul>' +
      '<a class="btn btn-primary" href="lasstund.html">Till lässtunden</a></div>' +
    '</div>';
}

function chooseMood(value) {
  $$('#mood-buttons .mood-btn').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.mood) === value)));
  if (me) insertRow('mood_checks', { user_id: me.id, mood: value, created_at: nowIso() });

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
