/* Samtal – enskilda samtal med personer i dina grupper och förfrågningar till volontärer */

let me;
let activePerson = null;

// Kort presentation av volontärerna (visas bara här)
const VOLUNTEER_INFO = {
  10: 'Läser högt på lässtunderna och gillar att prata om böcker, musik och allt som känns tungt.',
  11: 'Pluggar till socionom och har själv varit med i en Link Up-grupp. Bra på att lyssna.',
  12: 'Håller i fika och brädspel. Pratar gärna om vänskap, familj och att vara ny.',
  13: 'Skolkurator med lång erfarenhet av samtal med unga. Kan hjälpa dig vidare om du behöver mer stöd.'
};

function initPage() {
  me = currentUser();
  $('#tab-mina').addEventListener('click', () => selectTab('mina'));
  $('#tab-volontar').addEventListener('click', () => selectTab('volontar'));
  // Piltangenter mellan flikarna
  $$('[role="tab"]').forEach(t => t.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const other = t.id === 'tab-mina' ? 'volontar' : 'mina';
      selectTab(other);
      $('#tab-' + other).focus();
    }
  }));
  $('#dm-form').addEventListener('submit', sendDm);

  const params = new URLSearchParams(location.search);
  const person = Number(params.get('person'));
  if (person && getUser(person)) activePerson = person;
  selectTab(params.get('flik') === 'volontar' ? 'volontar' : 'mina');
}

function selectTab(name) {
  ['mina', 'volontar'].forEach(n => {
    const on = n === name;
    $('#tab-' + n).setAttribute('aria-selected', String(on));
    $('#tab-' + n).tabIndex = on ? 0 : -1;
    $('#panel-' + n).hidden = !on;
  });
  if (name === 'mina') renderConversations(); else renderVolunteers();
}

// ---------- Mina samtal ----------

function conversationPeople() {
  const ids = new Set(getGroupmateIds(me.id));
  // Även de man redan har skrivit med (t.ex. volontärer)
  db.direct_messages.forEach(m => {
    if (m.sender_id === me.id) ids.add(m.receiver_id);
    if (m.receiver_id === me.id) ids.add(m.sender_id);
  });
  // Bara personer i samma åldersgrupp, eller volontärer och kurator
  return [...ids].filter(id => getUser(id) && !isBlocked(me.id, id) && !isSuspended(id) && canMessage(me.id, id));
}

function renderConversations() {
  const people = conversationPeople().sort((a, b) => {
    const la = getConversation(me.id, a).pop(), lb = getConversation(me.id, b).pop();
    return (lb ? lb.created_at : '').localeCompare(la ? la.created_at : '');
  });
  $('#conv-list').innerHTML = people.length ? people.map(id => {
    const last = getConversation(me.id, id).pop();
    return '<li><button type="button" class="conv-btn" data-person="' + id + '" aria-current="' + (id === activePerson) + '">' +
      avatar(id) + '<span><strong>' + escapeHtml(getAlias(id)) + '</strong><br><span class="muted small">' +
      (last ? escapeHtml(last.body.slice(0, 32)) + (last.body.length > 32 ? '…' : '') : 'Inga meddelanden än') + '</span></span>' +
      (countUnread(me.id, id) ? '<span class="unread" aria-label="Oläst"></span>' : '') + '</button></li>';
  }).join('') : '<li class="muted">Gå med i en grupp för att kunna skriva enskilt med andra.</li>';

  $$('#conv-list .conv-btn').forEach(b => b.addEventListener('click', () => {
    activePerson = Number(b.dataset.person);
    renderConversations();
    $('#dm-input').focus();
  }));
  renderThread();
}

function renderThread() {
  if (!activePerson) return;
  const user = getUser(activePerson);
  // Markera mottagna meddelanden som lästa
  let changed = false;
  db.direct_messages.forEach(m => { if (m.receiver_id === me.id && m.sender_id === activePerson && !m.read_at) { m.read_at = nowIso(); changed = true; } });
  if (changed) saveDb();

  $('#dm-head').innerHTML = '<div class="row">' + avatar(user.id, 'sm') + '<h3>' + escapeHtml(user.alias) + '</h3>' +
    (user.role !== 'member' ? '<span class="badge badge-safe">' + roleLabel(user.role) + '</span>' : '') +
    (user.role === 'member' ? '<button type="button" class="btn btn-sm btn-ghost" id="dm-block" style="margin-left:auto">' + icon('block') + 'Blockera</button>' : '') + '</div>';
  renderMessages($('#dm-messages'), getConversation(me.id, activePerson), me.id, { field: 'direct_message_id', onChange: renderThread });
  $('#dm-form').hidden = false;
  const blockBtn = $('#dm-block');
  if (blockBtn) blockBtn.addEventListener('click', () => {
    if (!confirm('Blockera ' + user.alias + '? Ni kan inte längre skriva till varandra.')) return;
    insertRow('blocks', { blocker_id: me.id, blocked_id: user.id, created_at: nowIso() }, false);
    toast(user.alias + ' är blockerad.');
    activePerson = null;
    $('#dm-head').innerHTML = '<h3>Välj någon att skriva till</h3>';
    $('#dm-messages').innerHTML = '';
    $('#dm-form').hidden = true;
    renderConversations();
  });
}

function sendDm(e) {
  e.preventDefault();
  const input = $('#dm-input');
  if (!activePerson || !canMessage(me.id, activePerson) || !checkBeforePublish(input.value, $('#dm-notice'))) return;
  insertRow('direct_messages', { sender_id: me.id, receiver_id: activePerson, body: input.value.trim(), created_at: nowIso(), read_at: null, removed_at: null });
  input.value = '';
  renderConversations();
}

// ---------- Volontärer ----------

function renderVolunteers() {
  const list = db.users.filter(u => u.role === 'volunteer' || u.role === 'counselor');
  $('#volunteer-list').innerHTML = list.map(u => {
    const free = isAvailableNow(u.id);
    const next = free ? null : nextAvailable(u.id);
    const requested = db.direct_messages.some(m => m.sender_id === me.id && m.receiver_id === u.id);
    return '<article class="card activity">' +
      '<div class="row">' + avatar(u.id, 'lg') + '<div><h3 style="margin:0">' + escapeHtml(u.alias) + '</h3>' +
        '<span class="badge ' + (u.role === 'counselor' ? 'badge-accent' : 'badge-safe') + '">' + roleLabel(u.role) + '</span></div></div>' +
      '<p class="muted" style="margin:0">' + escapeHtml(VOLUNTEER_INFO[u.id] || '') + '</p>' +
      '<p class="status ' + (free ? 'status-free' : 'status-later') + '" style="margin:0">' +
        (free ? 'Ledig nu' : 'Ledig senare' + (next ? ' – ' + formatDate(next) : '')) + '</p>' +
      (requested
        ? '<a class="btn btn-secondary" href="samtal.html?person=' + u.id + '">' + icon('check') + 'Förfrågan skickad – öppna samtalet</a>'
        : '<button type="button" class="btn btn-primary" data-request="' + u.id + '">Skicka förfrågan</button>') +
    '</article>';
  }).join('');

  $$('[data-request]').forEach(b => b.addEventListener('click', () => sendRequest(Number(b.dataset.request))));
}

function sendRequest(userId) {
  sendVolunteerRequest(me.id, userId, 'Hej! Jag skulle vilja prata en stund.');
  toast(getAlias(userId) + ' har svarat dig under Mina samtal.');
  renderVolunteers();
}
