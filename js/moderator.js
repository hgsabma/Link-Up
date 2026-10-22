/* Moderator – granska rapporterade och oroande inlägg */

let me;

const ACTION_LABEL = { remove: 'Tog bort inlägg', warn: 'Varnade', suspend: 'Stängde av', dismiss: 'Inget fel' };

function initPage() {
  me = currentUser();
  render();
}

// Kön räknas fram: inlägg som inte är borttagna, inte granskade och som har rapporter eller oroande ord
function getQueue() {
  return db.posts
    .filter(p => !p.removed_at && !isPostReviewed(p.id) && (countReports(p.id) > 0 || hasConcern(p.body)))
    .sort((a, b) =>
      Number(hasConcern(b.body)) - Number(hasConcern(a.body)) ||
      Number(isPostHidden(b.id)) - Number(isPostHidden(a.id)) ||
      countReports(b.id) - countReports(a.id) ||
      b.created_at.localeCompare(a.created_at));
}

function render() {
  const queue = getQueue();
  const suspended = db.users.filter(u => isSuspended(u.id));

  $('#mod-stats').innerHTML = [
    ['Att granska', queue.length],
    ['Oroande', queue.filter(p => hasConcern(p.body)).length],
    ['Dolda', queue.filter(p => isPostHidden(p.id)).length],
    ['Avstängda', suspended.length]
  ].map(s => '<div class="card"><div class="muted small">' + s[0] + '</div><div style="font-size:2rem;font-weight:800">' + s[1] + '</div></div>').join('');

  $('#mod-queue').innerHTML = queue.length ? queue.map(itemHtml).join('') :
    '<div class="card"><p class="muted" style="margin:0">Inget att granska just nu. Bra jobbat!</p></div>';

  $('#suspended-list').innerHTML = suspended.length ? suspended.map(u =>
    '<li><span>' + avatar(u.id, 'sm') + ' ' + escapeHtml(u.alias) + '</span><span class="badge badge-danger">Avstängd</span></li>').join('') :
    '<li class="muted">Ingen är avstängd.</li>';

  $('#mod-log').innerHTML = db.moderation_actions.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8).map(a =>
    '<li><span><strong>' + escapeHtml(getAlias(a.moderator_id)) + '</strong> ' + ACTION_LABEL[a.action].toLowerCase() + ' ' +
    escapeHtml(getAlias(a.user_id)) + (a.reason ? ' – <span class="muted">' + escapeHtml(a.reason) + '</span>' : '') + '</span>' +
    '<span class="muted small">' + timeAgo(a.created_at) + '</span></li>').join('') || '<li class="muted">Inga åtgärder än.</li>';

  $$('[data-mod]').forEach(b => b.addEventListener('click', () => act(Number(b.dataset.post), b.dataset.mod)));
}

function itemHtml(p) {
  const concern = hasConcern(p.body), hidden = isPostHidden(p.id);
  const reports = db.reports.filter(r => r.post_id === p.id);
  const author = getUser(p.user_id);
  const warnings = countWarnings(author.id);

  return '<article class="card mod-item' + (concern ? ' concern' : hidden ? ' hidden-flag' : '') + '">' +
    '<div class="row">' +
      (concern ? '<span class="badge badge-danger">Oroande ord – kontakta personen</span>' : '') +
      (hidden ? '<span class="badge badge-warn">Dolt (' + reports.length + ' rapporter)</span>' : '') +
      (reports.length && !hidden ? '<span class="badge">' + reports.length + ' rapport' + (reports.length > 1 ? 'er' : '') + '</span>' : '') +
      '<span class="badge badge-accent">' + escapeHtml(getTopicName(p.topic_id)) + '</span>' +
    '</div>' +
    '<div class="post-head" style="margin-top:1rem">' + avatar(author.id) +
      '<div><div class="post-author">' + escapeHtml(author.alias) + (isSuspended(author.id) ? ' <span class="badge badge-danger">Avstängd</span>' : '') + '</div>' +
      '<div class="post-meta">' + timeAgo(p.created_at) + ' · ' + warnings + ' tidigare varning' + (warnings === 1 ? '' : 'ar') + '</div></div></div>' +
    '<p class="post-body">' + escapeHtml(p.body) + '</p>' +
    (reports.length ? '<p class="muted small">Anledningar: ' + reports.map(r => escapeHtml(r.reason)).join(', ') + '</p>' : '') +
    (concern ? '<p class="notice notice-warm small">Personen kan behöva stöd. Skicka gärna en volontär och tipsa om 90101, 1177 och 112.</p>' : '') +
    '<div class="post-actions">' +
      '<button type="button" class="btn btn-sm btn-danger" data-mod="remove" data-post="' + p.id + '">Ta bort inlägg</button>' +
      '<button type="button" class="btn btn-sm btn-secondary" data-mod="warn" data-post="' + p.id + '">Varna</button>' +
      '<button type="button" class="btn btn-sm btn-danger" data-mod="suspend" data-post="' + p.id + '"' + (isSuspended(author.id) ? ' disabled' : '') + '>Stäng av</button>' +
      '<button type="button" class="btn btn-sm btn-success" data-mod="dismiss" data-post="' + p.id + '">Inget fel</button>' +
    '</div>' +
  '</article>';
}

function act(postId, action) {
  const post = getPost(postId);
  const defaults = { remove: 'Bryter mot reglerna', warn: 'Påminnelse om reglerna', suspend: 'Allvarliga eller upprepade regelbrott', dismiss: '' };
  let reason = defaults[action];
  if (action !== 'dismiss') {
    reason = prompt('Anledning (sparas i loggen):', defaults[action]);
    if (reason === null) return;   // avbröt
  }
  if (action === 'suspend' && !confirm('Stäng av ' + getAlias(post.user_id) + '? Personen kan inte logga in eller skapa ett nytt konto.')) return;

  if (action === 'remove') { post.removed_at = nowIso(); saveDb(); }
  insertRow('moderation_actions', {
    moderator_id: me.id, user_id: post.user_id, action: action, post_id: postId, reason: reason, created_at: nowIso()
  });
  toast({ remove: 'Inlägget är borttaget.', warn: getAlias(post.user_id) + ' har fått en varning.', suspend: getAlias(post.user_id) + ' är avstängd.', dismiss: 'Inlägget syns igen.' }[action]);
  render();
}
