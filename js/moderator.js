/* Moderator – granska rapporterade och oroande inlägg och chattmeddelanden */

let me;

const ACTION_LABEL = { remove: 'Tog bort', warn: 'Varnade', suspend: 'Stängde av', dismiss: 'Inget fel' };

// Tre sorters innehåll kan granskas. field är kolumnen i reports och moderation_actions.
const KINDS = [
  { field: 'post_id', table: 'posts', author: 'user_id', noun: 'inlägg' },
  { field: 'group_message_id', table: 'group_messages', author: 'user_id', noun: 'meddelande' },
  { field: 'direct_message_id', table: 'direct_messages', author: 'sender_id', noun: 'meddelande' }
];

function initPage() {
  me = currentUser();
  render();
}

// Kön räknas fram: inte borttaget, inte granskat, och har rapporter eller oroande ord
function getQueue() {
  const items = [];
  KINDS.forEach(k => db[k.table].forEach(row => {
    if (row.removed_at || isReviewed(k.field, row.id)) return;
    const reports = getReports(k.field, row.id);
    const concern = hasConcern(row.body);
    if (!reports.length && !concern) return;
    items.push({ kind: k, row: row, userId: row[k.author], reports: reports, concern: concern, hidden: reports.length >= 3 });
  }));
  // Oroande först, sedan dolda, sedan flest rapporter, sedan nyast
  return items.sort((a, b) =>
    Number(b.concern) - Number(a.concern) || Number(b.hidden) - Number(a.hidden) ||
    b.reports.length - a.reports.length || b.row.created_at.localeCompare(a.row.created_at));
}

function whereLabel(item) {
  const r = item.row;
  if (item.kind.field === 'post_id') return 'Inlägg i ' + getTopicName(r.topic_id);
  if (item.kind.field === 'group_message_id') return 'Gruppchatt: ' + getGroup(r.group_id).name;
  return 'Enskilt meddelande till ' + getAlias(r.receiver_id);
}

function render() {
  const queue = getQueue();
  const suspended = db.users.filter(u => isSuspended(u.id));

  $('#mod-stats').innerHTML = [
    ['Att granska', queue.length],
    ['Oroande', queue.filter(i => i.concern).length],
    ['Dolda', queue.filter(i => i.hidden).length],
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

  $$('[data-mod]').forEach(b => b.addEventListener('click', () => act(b.dataset.field, Number(b.dataset.id), b.dataset.mod)));
}

function itemHtml(item) {
  const author = getUser(item.userId);
  const warnings = countWarnings(author.id);
  const n = item.reports.length;
  const data = ' data-field="' + item.kind.field + '" data-id="' + item.row.id + '"';

  return '<article class="card mod-item' + (item.concern ? ' concern' : item.hidden ? ' hidden-flag' : '') + '">' +
    '<div class="row">' +
      (item.concern ? '<span class="badge badge-danger">Oroande ord – kontakta personen</span>' : '') +
      (item.hidden ? '<span class="badge badge-warn">Dolt (' + n + ' rapporter)</span>' : '') +
      (n && !item.hidden ? '<span class="badge">' + n + ' rapport' + (n > 1 ? 'er' : '') + '</span>' : '') +
      '<span class="badge badge-accent">' + escapeHtml(whereLabel(item)) + '</span>' +
    '</div>' +
    '<div class="post-head" style="margin-top:1rem">' + avatar(author.id) +
      '<div><div class="post-author">' + escapeHtml(author.alias) + (isSuspended(author.id) ? ' <span class="badge badge-danger">Avstängd</span>' : '') + '</div>' +
      '<div class="post-meta">' + timeAgo(item.row.created_at) + ' · ' + ageGroupLabel(author.id) + ' · ' + warnings + ' tidigare varning' + (warnings === 1 ? '' : 'ar') + '</div></div></div>' +
    '<p class="post-body">' + escapeHtml(item.row.body) + '</p>' +
    (n ? '<p class="muted small">Anledningar: ' + item.reports.map(r => escapeHtml(r.reason)).join(', ') + '</p>' : '') +
    (item.concern ? '<p class="notice notice-warm small">Personen kan behöva stöd. Skicka gärna en volontär och tipsa om 90101, 1177 och 112.</p>' : '') +
    '<div class="post-actions">' +
      '<button type="button" class="btn btn-sm btn-danger" data-mod="remove"' + data + '>Ta bort ' + item.kind.noun + '</button>' +
      '<button type="button" class="btn btn-sm btn-secondary" data-mod="warn"' + data + '>Varna</button>' +
      '<button type="button" class="btn btn-sm btn-danger" data-mod="suspend"' + data + (isSuspended(author.id) ? ' disabled' : '') + '>Stäng av</button>' +
      '<button type="button" class="btn btn-sm btn-success" data-mod="dismiss"' + data + '>Inget fel</button>' +
    '</div>' +
  '</article>';
}

function act(field, id, action) {
  const kind = KINDS.find(k => k.field === field);
  const row = db[kind.table].find(r => r.id === id);
  const userId = row[kind.author];
  const defaults = { remove: 'Bryter mot reglerna', warn: 'Påminnelse om reglerna', suspend: 'Allvarliga eller upprepade regelbrott', dismiss: '' };
  let reason = defaults[action];
  if (action !== 'dismiss') {
    reason = prompt('Anledning (sparas i loggen):', defaults[action]);
    if (reason === null) return;   // avbröt
  }
  if (action === 'suspend' && !confirm('Stäng av ' + getAlias(userId) + '? Personen kan inte logga in eller skapa ett nytt konto.')) return;

  if (action === 'remove') { row.removed_at = nowIso(); saveDb(); }
  const entry = { moderator_id: me.id, user_id: userId, action: action, post_id: null, group_message_id: null, direct_message_id: null, reason: reason, created_at: nowIso() };
  entry[field] = id;
  insertRow('moderation_actions', entry);
  toast({ remove: 'Det är borttaget.', warn: getAlias(userId) + ' har fått en varning.', suspend: getAlias(userId) + ' är avstängd.', dismiss: 'Det syns igen.' }[action]);
  render();
}
