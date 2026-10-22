/* Aktiviteter – lista med filter, Jag vill vara med och formulär för att skapa en aktivitet */

let me;
let filter = 'alla';

function initPage() {
  me = currentUser();
  const wanted = new URLSearchParams(location.search).get('filter');
  if (['ute', 'online', 'lasstund'].includes(wanted)) filter = wanted;

  $$('#activity-filter .chip').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.filter;
    renderList();
  }));

  // Formuläret
  $('#a-book').insertAdjacentHTML('beforeend', db.books.map(b => '<option value="' + b.id + '">' + escapeHtml(b.title) + '</option>').join(''));
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  $('#a-date').value = dateKey(tomorrow);
  $('#a-date').min = dateKey(new Date());
  $('#a-online').addEventListener('change', e => {
    if (e.target.checked) { $('#a-location').value = 'Online'; $('#a-safe').checked = false; }
    $('#a-safe').disabled = e.target.checked;
  });
  $('#activity-form').addEventListener('submit', createActivity);

  renderList();
}

function renderList() {
  $$('#activity-filter .chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === filter)));
  const list = upcomingActivities().filter(a => filter === 'alla' || activityType(a) === filter);
  $('#activity-list').innerHTML = list.length
    ? list.map(a => activityCardHtml(a, me)).join('')
    : '<p class="muted">Inga aktiviteter här just nu. Skapa en egen!</p>';
  bindActivityButtons($('#activity-list'), me, renderList);
}

function createActivity(e) {
  e.preventDefault();
  const notice = $('#activity-notice');
  const title = $('#a-title').value.trim(), desc = $('#a-desc').value.trim();
  const online = $('#a-online').checked;
  const location_ = online ? 'Online' : $('#a-location').value.trim();
  const max = Number($('#a-max').value);
  const startsAt = new Date($('#a-date').value + 'T' + ($('#a-time').value || '17:00'));

  if (!title || !desc || !location_ || !$('#a-date').value) return showNotice(notice, 'Fyll i rubrik, beskrivning, plats och datum.');
  if (isNaN(startsAt) || startsAt < new Date()) return showNotice(notice, 'Välj en tid som inte redan har varit.');
  if (!(max >= 2 && max <= 50)) return showNotice(notice, 'Antal deltagare måste vara mellan 2 och 50.');
  // Ordfiltret gäller all text
  if (!checkBeforePublish(title + ' ' + desc + ' ' + location_, notice)) return;

  const activity = insertRow('activities', {
    created_by: me.id, title: title, description: desc, location: location_,
    starts_at: startsAt.toISOString(), max_participants: max,
    is_safe_first_meet: !online && $('#a-safe').checked,
    book_id: Number($('#a-book').value) || null, created_at: nowIso()
  });
  // Den som skapar är med automatiskt
  insertRow('activity_participants', { activity_id: activity.id, user_id: me.id, joined_at: nowIso() }, false);

  e.target.reset();
  $('#a-safe').disabled = false;
  notice.hidden = true;
  filter = 'alla';
  renderList();
  toast('Din aktivitet är skapad!');
  $('#activity-list').scrollIntoView({ behavior: 'smooth' });
}
