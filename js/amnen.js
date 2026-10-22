/* Ämnen – läs och skriv inlägg och svar, stödreaktioner, rapportera och blockera */

let me;
let activeTopic = null;   // null = alla ämnen
const openReplies = new Set();

const REACTIONS = [
  { type: 'hear', label: 'Jag hör dig', icon: 'hand' },
  { type: 'not_alone', label: 'Du är inte ensam', icon: 'heart' }
];

function initPage() {
  me = currentUser();
  const params = new URLSearchParams(location.search);
  activeTopic = Number(params.get('amne')) || null;
  const focusPost = Number(params.get('inlagg')) || null;
  if (focusPost) openReplies.add(focusPost);

  $('#post-alias').textContent = me.alias;
  $('#post-topic').innerHTML = db.topics.map(t => '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>').join('');
  if (activeTopic) $('#post-topic').value = activeTopic;

  $('#post-form').addEventListener('submit', e => {
    e.preventDefault();
    const body = $('#post-body').value;
    if (!checkBeforePublish(body, $('#post-notice'))) return;
    insertRow('posts', { user_id: me.id, topic_id: Number($('#post-topic').value), body: body.trim(), created_at: nowIso(), removed_at: null });
    $('#post-body').value = '';
    activeTopic = Number($('#post-topic').value);
    toast('Ditt inlägg är publicerat.');
    render();
  });

  render();
  if (focusPost) {
    const el = $('#post-' + focusPost);
    if (el) el.scrollIntoView({ block: 'center' });
  }
}

function render() {
  renderFilter();
  renderPosts();
}

function renderFilter() {
  const all = '<li><button type="button" class="chip" data-topic="" aria-pressed="' + (activeTopic === null) + '">Alla</button></li>';
  $('#topic-filter').innerHTML = all + db.topics.map(t =>
    '<li><button type="button" class="chip" data-topic="' + t.id + '" aria-pressed="' + (activeTopic === t.id) + '">' +
    escapeHtml(t.name) + '</button></li>').join('');
  $$('#topic-filter .chip').forEach(b => b.addEventListener('click', () => {
    activeTopic = Number(b.dataset.topic) || null;
    if (activeTopic) $('#post-topic').value = activeTopic;
    render();
    $('#topic-filter [data-topic="' + (activeTopic || '') + '"]').focus();
  }));
}

function renderPosts() {
  const posts = db.posts
    .filter(p => !p.removed_at && (activeTopic === null || p.topic_id === activeTopic))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  let blockedCount = 0;

  const html = posts.map(p => {
    if (isBlocked(me.id, p.user_id)) { blockedCount++; return ''; }
    if (isPostHidden(p.id) && p.user_id !== me.id) {
      return '<article class="card post"><p class="hidden-post" style="margin:0">Det här inlägget är dolt medan en moderator tittar på det.</p></article>';
    }
    return postHtml(p);
  }).join('');

  $('#post-list').innerHTML = (html || '<div class="card"><p class="muted" style="margin:0">Inga inlägg här än. Bli den första som skriver!</p></div>') +
    (blockedCount ? '<p class="muted small">' + blockedCount + ' inlägg från personer du blockerat visas inte.</p>' : '');
  bindPostButtons();
}

function roleBadge(userId) {
  const role = getUser(userId).role;
  return role === 'member' ? '' : '<span class="badge badge-safe">' + roleLabel(role) + '</span>';
}

function postHtml(p) {
  const mine = p.user_id === me.id;
  const replies = db.replies.filter(r => r.post_id === p.id && !isBlocked(me.id, r.user_id))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const open = openReplies.has(p.id);
  const reported = hasReported(me.id, p.id);

  return '<article class="card post" id="post-' + p.id + '">' +
    '<div class="post-head">' + avatar(p.user_id) +
      '<div><div class="post-author">' + escapeHtml(getAlias(p.user_id)) + (mine ? ' <span class="badge">Du</span>' : '') + ' ' + roleBadge(p.user_id) + '</div>' +
      '<div class="post-meta">' + timeAgo(p.created_at) + '</div></div>' +
      '<a class="badge badge-accent" style="margin-left:auto" href="amnen.html?amne=' + p.topic_id + '">' + escapeHtml(getTopicName(p.topic_id)) + '</a>' +
    '</div>' +
    (isPostHidden(p.id) ? '<p class="notice notice-warm small">Ditt inlägg är dolt för andra tills en moderator har tittat på det.</p>' : '') +
    '<p class="post-body">' + escapeHtml(p.body) + '</p>' +
    '<div class="post-actions">' +
      (mine ? '' : REACTIONS.map(r => {
        const on = hasReacted(me.id, p.id, r.type);
        return '<button type="button" class="btn btn-sm btn-secondary" data-react="' + r.type + '" data-post="' + p.id + '" aria-pressed="' + on + '">' + icon(r.icon) + r.label + '</button>';
      }).join('')) +
      '<button type="button" class="btn btn-sm btn-ghost" data-toggle-replies="' + p.id + '" aria-expanded="' + open + '">' + icon('chat') +
        (replies.length ? 'Svar (' + replies.length + ')' : 'Svara') + '</button>' +
      (mine ? '' :
        '<button type="button" class="btn btn-sm btn-ghost" data-report="' + p.id + '"' + (reported ? ' disabled' : '') + '>' + icon('flag') + (reported ? 'Rapporterad' : 'Rapportera') + '</button>' +
        '<button type="button" class="btn btn-sm btn-ghost" data-block="' + p.user_id + '">' + icon('block') + 'Blockera</button>') +
    '</div>' +
    (open ?
      '<ul class="replies">' + replies.map(r =>
        '<li><div class="post-head" style="margin-bottom:.25rem">' + avatar(r.user_id, 'sm') +
        '<span class="post-author">' + escapeHtml(r.user_id === me.id ? 'Du' : getAlias(r.user_id)) + '</span>' + roleBadge(r.user_id) +
        '<span class="post-meta">' + timeAgo(r.created_at) + '</span></div>' +
        '<p class="post-body" style="margin:0">' + escapeHtml(r.body) + '</p></li>').join('') + '</ul>' +
      '<form class="reply-form" data-reply-form="' + p.id + '">' +
        '<label for="reply-' + p.id + '">Ditt svar</label>' +
        '<textarea id="reply-' + p.id + '" maxlength="600"></textarea>' +
        '<div class="notice notice-warm" hidden role="alert"></div>' +
        '<button type="submit" class="btn btn-primary btn-sm" style="margin-top:.5rem">' + icon('send') + 'Skicka svar</button>' +
      '</form>' : '') +
  '</article>';
}

function bindPostButtons() {
  // Stödreaktioner – slå på och av, inga siffror visas
  $$('[data-react]').forEach(b => b.addEventListener('click', () => {
    const postId = Number(b.dataset.post), type = b.dataset.react;
    if (hasReacted(me.id, postId, type)) {
      deleteRows('support_reactions', r => r.user_id === me.id && r.post_id === postId && r.type === type);
    } else {
      insertRow('support_reactions', { user_id: me.id, post_id: postId, type: type, created_at: nowIso() }, false);
      toast('Personen får veta att någon bryr sig.');
    }
    renderPosts();
    const again = $('[data-react="' + type + '"][data-post="' + postId + '"]');
    if (again) again.focus();
  }));

  $$('[data-toggle-replies]').forEach(b => b.addEventListener('click', () => {
    const id = Number(b.dataset.toggleReplies);
    if (openReplies.has(id)) openReplies.delete(id); else openReplies.add(id);
    renderPosts();
    const ta = $('#reply-' + id);
    if (ta) ta.focus(); else $('[data-toggle-replies="' + id + '"]').focus();
  }));

  $$('[data-reply-form]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const postId = Number(f.dataset.replyForm);
    const ta = $('textarea', f);
    if (!checkBeforePublish(ta.value, $('.notice', f))) return;
    insertRow('replies', { post_id: postId, user_id: me.id, body: ta.value.trim(), created_at: nowIso() });
    toast('Ditt svar är skickat.');
    renderPosts();
  }));

  $$('[data-report]').forEach(b => b.addEventListener('click', () => openReportDialog('post_id', Number(b.dataset.report), render)));

  $$('[data-block]').forEach(b => b.addEventListener('click', () => {
    const id = Number(b.dataset.block);
    if (!confirm('Blockera ' + getAlias(id) + '? Du ser inte längre personens inlägg, svar eller meddelanden. Du kan ta bort blockeringen på Min sida.')) return;
    if (!isBlocked(me.id, id)) insertRow('blocks', { blocker_id: me.id, blocked_id: id, created_at: nowIso() }, false);
    toast(getAlias(id) + ' är blockerad.');
    renderPosts();
  }));
}
