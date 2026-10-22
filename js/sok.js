/* Sök – letar i ämnen, inlägg, grupper och aktiviteter */

function initPage() {
  const q = (new URLSearchParams(location.search).get('q') || '').trim();
  $('#q').value = q;
  if (!q) { $('#results').innerHTML = '<p class="muted">Skriv ett sökord, till exempel "promenad" eller "sömn".</p>'; return; }
  $('#search-title').textContent = 'Sökresultat för "' + q + '"';

  const me = currentUser();
  const t = q.toLowerCase();
  const has = text => text.toLowerCase().includes(t);

  const topics = db.topics.filter(x => has(x.name));
  const groups = db.groups.filter(g => has(g.name + ' ' + g.description + ' ' + getInterestName(g.interest_id)));
  const activities = upcomingActivities().filter(a => has(a.title + ' ' + a.description + ' ' + a.location));
  // Inlägg visas bara för inloggade och aldrig om de är dolda eller borttagna
  const posts = me ? db.posts.filter(p => isPostVisible(p.id) && !isBlocked(me.id, p.user_id) && has(p.body)) : [];

  const section = (title, items) => items.length
    ? '<section class="card"><h2 class="h3">' + title + ' (' + items.length + ')</h2><ul class="simple-list">' + items.join('') + '</ul></section>' : '';

  const html =
    section('Ämnen', topics.map(x => '<li><a href="amnen.html?amne=' + x.id + '">' + escapeHtml(x.name) + '</a></li>')) +
    section('Grupper', groups.map(g => '<li><a href="grupper.html">' + escapeHtml(g.name) + '</a><span class="muted small">' + escapeHtml(getInterestName(g.interest_id)) + '</span></li>')) +
    section('Aktiviteter', activities.map(a => '<li><a href="aktiviteter.html">' + escapeHtml(a.title) + '</a><span class="muted small">' + formatDate(a.starts_at) + '</span></li>')) +
    section('Inlägg', posts.map(p => '<li><a href="amnen.html?inlagg=' + p.id + '">' + escapeHtml(p.body.slice(0, 80)) + (p.body.length > 80 ? '…' : '') + '</a><span class="muted small">' + escapeHtml(getTopicName(p.topic_id)) + '</span></li>'));

  $('#results').innerHTML = html || '<p class="muted">Inga träffar. Testa ett annat ord eller fråga <a href="linky.html">Linky</a>.</p>';
  if (!me) $('#results').insertAdjacentHTML('beforeend', '<p class="muted small"><a href="logga-in.html">Logga in</a> för att även söka bland inlägg.</p>');
}
