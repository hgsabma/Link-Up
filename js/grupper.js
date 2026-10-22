/* Grupper – förslag på grupp, din lilla grupp (medlemmar, nästa träff, Jag kommer, gruppchatt) och andra grupper */

let me;
let shownGroupId = null;

function initPage() {
  me = currentUser();
  const params = new URLSearchParams(location.search);
  const wanted = Number(params.get('grupp'));
  shownGroupId = wanted && isMember(wanted, me.id) ? wanted : defaultGroupId();

  // Välkomstruta efter första besöket
  if (params.get('ny') === '1') {
    const w = $('#welcome');
    w.className = 'notice notice-success';
    w.innerHTML = '<p><strong>Välkommen, ' + escapeHtml(me.alias) + '!</strong> Vi har letat fram en grupp som passar dina intressen. Du kan också börja med att bara läsa under <a href="amnen.html">Ämnen</a>.</p>';
    w.hidden = false;
  }

  $('#age-note').textContent = 'Du ser grupper för din åldersgrupp (' + ageGroupLabel(me.id) + '). Unga och vuxna har olika grupper.';
  $('#group-interest').insertAdjacentHTML('beforeend', db.interests.map(i => '<option value="' + i.id + '">' + escapeHtml(i.name) + '</option>').join(''));
  $('#group-search').addEventListener('input', renderOtherGroups);
  $('#group-interest').addEventListener('change', renderOtherGroups);

  renderAll();
}

function defaultGroupId() { return (getSmallGroup(me.id) || getUserGroups(me.id)[0] || {}).id || null; }
function renderAll() { renderMatch(); renderMyGroup(); renderOtherGroups(); }

function meetingText(group) {
  return 'Varje ' + WEEKDAYS[new Date(group.created_at).getDay()] + ' kl ' + formatTime(group.created_at);
}

// Förslag på en liten grupp när du inte har någon än
function renderMatch() {
  const box = $('#match-section');
  const g = getSmallGroup(me.id) ? null : suggestGroup(me.id);
  box.hidden = !g;
  if (!g) return;
  const shared = getUserInterestIds(me.id).includes(g.interest_id);
  box.innerHTML = '<div class="card card-accent">' +
    '<span class="badge badge-accent">' + icon('sparkle') + 'Förslag till dig</span>' +
    '<h2 style="margin:.75rem 0 .25rem">' + escapeHtml(g.name) + '</h2>' +
    '<p class="muted">' + escapeHtml(g.description) + '</p>' +
    '<ul class="meta-list" style="margin-bottom:1rem">' +
      (shared ? '<li>' + icon('heart') + 'Ni gillar båda ' + escapeHtml(getInterestName(g.interest_id).toLowerCase()) + '</li>' : '') +
      '<li>' + icon('clock') + meetingText(g) + '</li>' +
      '<li>' + icon('users') + countMembers(g.id) + ' av ' + g.max_members + ' platser tagna</li>' +
      '<li>' + icon('user') + 'För ' + ageRangeLabel(g) + '</li>' +
    '</ul>' +
    '<div class="row"><button type="button" class="btn btn-primary" data-join="' + g.id + '">Gå med i ' + escapeHtml(g.name) + '</button>' +
    '<a class="btn btn-ghost" href="#other-title">Visa andra grupper</a></div>' +
  '</div>';
  bindJoinButtons(box);
}

function renderMyGroup() {
  const section = $('#my-group-section');
  const group = shownGroupId ? getGroup(shownGroupId) : null;

  if (!group) {
    section.innerHTML = '<h2 id="my-group-title">Din grupp</h2>' +
      '<div class="card"><p class="muted" style="margin:0">Du är inte med i någon grupp än. Gå med i förslaget ovan eller välj en grupp längre ner.</p></div>';
    return;
  }

  const members = getGroupMemberIds(group.id);
  const meeting = nextMeeting(group.id);
  const attending = isAttending(group.id, me.id);
  const others = getUserGroups(me.id).filter(g => g.id !== group.id);
  const isMySmall = group.id === (getSmallGroup(me.id) || {}).id;

  section.innerHTML =
    '<div class="section-head"><h2 id="my-group-title">' + (isMySmall ? 'Din lilla grupp' : 'Din grupp') + '</h2>' +
    (others.length ? '<div class="row"><span class="muted small">Dina andra grupper:</span>' + others.map(g =>
      '<a class="chip" href="grupper.html?grupp=' + g.id + '">' + escapeHtml(g.name) + '</a>').join('') + '</div>' : '') + '</div>' +
    '<div class="my-group">' +
      '<div class="card card-accent stack">' +
        '<div><div class="row row-between"><h3 style="font-size:1.5rem;margin:0">' + escapeHtml(group.name) + '</h3>' +
        '<span class="badge badge-accent">' + escapeHtml(getInterestName(group.interest_id)) + '</span></div>' +
        '<p class="muted" style="margin:.5rem 0 0">' + escapeHtml(group.description) + '</p></div>' +
        '<div class="meeting" style="margin:0">' + icon('calendar') +
          '<div><strong>Nästa träff: ' + formatDate(meeting) + '</strong><br><span class="muted small">' + meetingText(group) + ' · ' + countAttending(group.id) + ' har sagt att de kommer</span></div>' +
          '<button type="button" class="btn ' + (attending ? 'btn-success' : 'btn-primary') + '" id="attend-btn" aria-pressed="' + attending + '" style="margin-left:auto">' +
            (attending ? icon('check') + 'Du kommer' : 'Jag kommer') + '</button>' +
        '</div>' +
        '<details class="guide"><summary>Första gången? Så går en träff till</summary><ol>' +
          '<li>Ni börjar med en kort runda där alla säger hur veckan har varit. Du får alltid säga "pass".</li>' +
          '<li>Ses ni online får kameran vara av, och du kan skriva i chatten i stället för att prata.</li>' +
          '<li>En volontär är med de första gångerna och ser till att alla får plats.</li>' +
          '<li>Det som sägs i gruppen stannar i gruppen.</li>' +
          '<li>Du kan lämna träffen när du vill.</li>' +
        '</ol></details>' +
        '<div><h4 style="margin-bottom:.5rem">Medlemmar (' + members.length + ' av ' + group.max_members + ')</h4>' +
        '<ul class="member-list">' + members.map(id =>
          '<li>' + avatar(id, 'sm') + '<span>' + escapeHtml(id === me.id ? 'Du' : getAlias(id)) + '</span></li>').join('') + '</ul></div>' +
        '<div class="row">' +
          '<a class="btn btn-secondary btn-sm" href="samtal.html">' + icon('chat') + 'Skriv enskilt till någon</a>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="leave-btn">Lämna gruppen</button>' +
        '</div>' +
      '</div>' +
      '<div class="card chat" aria-labelledby="chat-title">' +
        '<div class="chat-head"><h3 id="chat-title">Gruppchatt</h3><span class="muted small">Bara medlemmar ser chatten. Rapportera med flaggan.</span></div>' +
        '<ul class="messages" id="group-messages" aria-live="polite"></ul>' +
        '<div class="notice notice-warm small" id="chat-notice" hidden role="alert"></div>' +
        '<form class="chat-form" id="chat-form">' +
          '<label class="sr-only" for="chat-input">Skriv till gruppen</label>' +
          '<input type="text" id="chat-input" maxlength="400" placeholder="Skriv till gruppen..." autocomplete="off">' +
          '<button type="submit" class="icon-btn" aria-label="Skicka">' + icon('send') + '</button>' +
        '</form>' +
      '</div>' +
    '</div>';

  renderChat();

  $('#attend-btn').addEventListener('click', () => {
    const key = dateKey(nextMeeting(group.id));
    if (isAttending(group.id, me.id)) {
      deleteRows('group_attendance', a => a.group_id === group.id && a.user_id === me.id && a.meeting_date === key);
      toast('Okej, du är inte anmäld längre.');
    } else {
      insertRow('group_attendance', { group_id: group.id, user_id: me.id, meeting_date: key }, false);
      toast('Toppen! Gruppen ser att du kommer.');
    }
    renderMyGroup();
    $('#attend-btn').focus();
  });

  $('#leave-btn').addEventListener('click', () => {
    if (!confirm('Vill du lämna ' + group.name + '?')) return;
    deleteRows('group_members', m => m.group_id === group.id && m.user_id === me.id);
    toast('Du har lämnat ' + group.name + '.');
    shownGroupId = defaultGroupId();
    renderAll();
  });

  $('#chat-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#chat-input');
    if (!checkBeforePublish(input.value, $('#chat-notice'))) return;
    insertRow('group_messages', { group_id: group.id, user_id: me.id, body: input.value.trim(), created_at: nowIso(), removed_at: null });
    input.value = '';
    renderChat();
  });
}

function renderChat() {
  const msgs = db.group_messages.filter(m => m.group_id === shownGroupId).sort((a, b) => a.created_at.localeCompare(b.created_at));
  renderMessages($('#group-messages'), msgs, me.id, { field: 'group_message_id', onChange: renderChat });
}

function renderOtherGroups() {
  const q = $('#group-search').value.trim().toLowerCase();
  const interest = Number($('#group-interest').value) || null;
  const mine = getUserInterestIds(me.id);

  const groups = db.groups
    .filter(g => !isMember(g.id, me.id) && fitsAgeRange(g, me.id))
    .filter(g => !interest || g.interest_id === interest)
    .filter(g => !q || (g.name + ' ' + g.description + ' ' + getInterestName(g.interest_id)).toLowerCase().includes(q))
    // Grupper som matchar dina intressen först
    .sort((a, b) => Number(mine.includes(b.interest_id)) - Number(mine.includes(a.interest_id)));

  $('#group-list').innerHTML = groups.length ? groups.map(g => {
    const count = countMembers(g.id), full = count >= g.max_members;
    return '<article class="card activity">' +
      '<div class="row row-between"><h3 style="margin:0">' + escapeHtml(g.name) + '</h3>' +
        (mine.includes(g.interest_id) ? '<span class="badge badge-accent">Passar dig</span>' : '') + '</div>' +
      '<p class="muted" style="margin:0">' + escapeHtml(g.description) + '</p>' +
      '<ul class="meta-list">' +
        '<li>' + icon('leaf') + escapeHtml(getInterestName(g.interest_id)) + (isSmallGroup(g) ? ' · Liten grupp' : '') + '</li>' +
        '<li>' + icon('clock') + meetingText(g) + '</li>' +
        '<li>' + icon('users') + count + ' av ' + g.max_members + ' medlemmar</li>' +
        '<li>' + icon('user') + 'För ' + ageRangeLabel(g) + '</li>' +
      '</ul>' +
      '<button type="button" class="btn ' + (full ? 'btn-ghost' : 'btn-primary') + '" data-join="' + g.id + '"' + (full ? ' disabled' : '') + '>' +
        (full ? 'Gruppen är full' : 'Gå med') + '</button>' +
    '</article>';
  }).join('') : '<p class="muted">Inga grupper matchar din sökning.</p>';
  bindJoinButtons($('#group-list'));
}

function bindJoinButtons(root) {
  $$('[data-join]', root).forEach(b => b.addEventListener('click', () => {
    const id = Number(b.dataset.join), g = getGroup(id);
    if (isMember(id, me.id) || countMembers(id) >= g.max_members || !fitsAgeRange(g, me.id)) return;
    insertRow('group_members', { group_id: id, user_id: me.id, joined_at: nowIso() }, false);
    shownGroupId = id;
    toast('Välkommen till ' + g.name + '!');
    renderAll();
    $('#my-group-title').scrollIntoView({ behavior: 'smooth' });
  }));
}
