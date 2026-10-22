/* Lässtund – veckans bok, simulerad uppläsning, läs själv i takt och chatt */

let me, reading, book;
const READING_GROUP_ID = 6;          // Lässtundsgänget – chatten under lässtunden
const SECONDS_PER_PARAGRAPH = 7;     // simulerad läshastighet

// Påhittad text till "Ljuset över Ekön" (skriven för prototypen)
const CHAPTER = [
  'Stormen kom tidigare än någon hade trott. Vid lunch var himlen fortfarande ljusblå, men när Ella cyklade hem från affären hade molnen redan lagt sig som en grå filt över hela ön.',
  'Hon ställde cykeln mot väggen och såg ut mot fyren. Den stod där den alltid hade stått, vit och lite sned, och för första gången på länge var lampan tänd mitt på dagen.',
  'Inne i köket satt morfar med radion på låg volym. "De säger att färjan inte går i kväll", sa han utan att titta upp. Ella nickade. Det betydde att ingen kunde komma, och ingen kunde åka.',
  'Hon hade tänkt att det skulle kännas ensamt. Men när strömmen gick och morfar tände fotogenlampan blev rummet varmt och gult, och plötsligt pratade de om saker de aldrig pratat om förut.',
  'Han berättade om sommaren när han var sexton och trodde att ingen förstod honom. "Jag satt i fyren varje kväll", sa han. "Tills en dag någon annan också satte sig där."',
  'Ella tänkte på sin klass på fastlandet, på alla som verkade ha någon. Kanske satt fler än hon i sina egna fyrar och väntade. Kanske var det bara någon som behövde gå upp för trappan först.',
  'Utanför ven vinden runt husknuten. Men ljuset från fyren svepte över vattnet, varv efter varv, som om det sa samma sak om och om igen: du syns, du syns, du syns.'
];

let current = 0;        // vilket stycke som läses
let elapsed = 0;        // sekunder
let timer = null;
let selfMode = false;

function initPage() {
  me = currentUser();
  reading = nextReading();
  book = getBook(reading ? reading.book_id : 1);

  $('#book-cover').textContent = book.title;
  $('#book-title').textContent = book.title;
  $('#book-author').textContent = 'av ' + book.author + (reading ? ' · ' + formatDate(reading.starts_at) : '');
  const readerId = reading ? reading.created_by : 10;
  $('#reader').innerHTML = avatar(readerId, 'sm') + '<span><strong>' + escapeHtml(getAlias(readerId)) + '</strong> läser högt</span>' +
    (isAvailableNow(readerId) ? '<span class="status status-free">Live nu</span>' : '');

  $('#reading-text').innerHTML = CHAPTER.map((p, i) => '<p data-i="' + i + '">' + escapeHtml(p) + '</p>').join('');

  $('#play-btn').addEventListener('click', togglePlay);
  $('#self-btn').addEventListener('click', toggleSelfMode);
  $('#prev-btn').addEventListener('click', () => step(-1));
  $('#next-btn').addEventListener('click', () => step(1));
  $('#readaloud-btn').addEventListener('click', wantToReadAloud);

  // Chatten
  $('#chat-form').addEventListener('submit', sendChat);
  renderChat();

  // Kommande lässtunder
  renderReadingList();
  updatePlayer();
}

function renderReadingList() {
  const list = upcomingActivities().filter(a => a.book_id);
  $('#reading-list').innerHTML = list.map(a => activityCardHtml(a, me)).join('') || '<p class="muted">Inga fler lässtunder planerade.</p>';
  bindActivityButtons($('#reading-list'), me, renderReadingList);
}

// ---------- Uppspelning ----------

function totalSeconds() { return CHAPTER.length * SECONDS_PER_PARAGRAPH; }
function mmss(s) { return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); }

function togglePlay() {
  if (timer) { clearInterval(timer); timer = null; }
  else {
    if (selfMode) toggleSelfMode();
    if (elapsed >= totalSeconds()) elapsed = 0;
    timer = setInterval(() => {
      elapsed += 1;
      if (elapsed >= totalSeconds()) { elapsed = totalSeconds(); clearInterval(timer); timer = null; toast('Slut på kapitlet. Tack för att du lyssnade!'); }
      current = Math.min(CHAPTER.length - 1, Math.floor(elapsed / SECONDS_PER_PARAGRAPH));
      updatePlayer();
    }, 1000);
  }
  updatePlayer();
}

function updatePlayer() {
  const playing = !!timer;
  const pct = Math.round(elapsed / totalSeconds() * 100);
  $('#play-btn').setAttribute('aria-pressed', String(playing));
  $('#play-icon').innerHTML = icon(playing ? 'pause' : 'play');
  $('#play-label').textContent = playing ? 'Pausa' : 'Spela upp';
  $('#play-status').textContent = selfMode ? 'Du läser själv' : playing ? 'Läser stycke ' + (current + 1) + ' av ' + CHAPTER.length : 'Pausad';
  $('#play-time').textContent = mmss(elapsed) + ' / ' + mmss(totalSeconds());
  $('#play-progress').setAttribute('aria-valuenow', String(pct));
  $('#play-progress span').style.width = pct + '%';
  $$('#reading-text p').forEach(p => p.classList.toggle('current', Number(p.dataset.i) === current));
}

// Läs själv i takt – stega fram stycke för stycke
function toggleSelfMode() {
  selfMode = !selfMode;
  if (selfMode && timer) { clearInterval(timer); timer = null; }
  $('#self-btn').setAttribute('aria-pressed', String(selfMode));
  $('#self-controls').hidden = !selfMode;
  updatePlayer();
  if (selfMode) $('#next-btn').focus();
}
function step(dir) {
  current = Math.max(0, Math.min(CHAPTER.length - 1, current + dir));
  elapsed = current * SECONDS_PER_PARAGRAPH;
  updatePlayer();
  $('#reading-text p.current').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// Jag vill läsa högt – skickar en förfrågan till volontären som leder lässtunden
function wantToReadAloud() {
  const readerId = reading ? reading.created_by : 10;
  insertRow('direct_messages', { sender_id: me.id, receiver_id: readerId, body: 'Hej! Jag skulle vilja läsa högt på en lässtund.', created_at: nowIso(), read_at: null, removed_at: null });
  const n = $('#readaloud-notice');
  n.innerHTML = '<p>Vad roligt! Vi har skickat ett meddelande till <strong>' + escapeHtml(getAlias(readerId)) + '</strong> som hör av sig om när du kan läsa. Du hittar samtalet under <a href="samtal.html">Samtal</a>.</p>';
  n.hidden = false;
  $('#readaloud-btn').disabled = true;
}

// ---------- Chatt ----------

function renderChat() {
  const member = isMember(READING_GROUP_ID, me.id);
  $('#chat-sub').textContent = getGroup(READING_GROUP_ID).name + (member ? '' : ' · du går med när du skriver');
  const msgs = db.group_messages.filter(m => m.group_id === READING_GROUP_ID).sort((a, b) => a.created_at.localeCompare(b.created_at));
  renderMessages($('#reading-messages'), msgs, me.id, { field: 'group_message_id', onChange: renderChat });
}

function sendChat(e) {
  e.preventDefault();
  const input = $('#chat-input');
  if (!checkBeforePublish(input.value, $('#chat-notice'))) return;
  if (!isMember(READING_GROUP_ID, me.id)) {
    insertRow('group_members', { group_id: READING_GROUP_ID, user_id: me.id, joined_at: nowIso() }, false);
    toast('Du gick med i ' + getGroup(READING_GROUP_ID).name + '.');
  }
  insertRow('group_messages', { group_id: READING_GROUP_ID, user_id: me.id, body: input.value.trim(), created_at: nowIso(), removed_at: null });
  input.value = '';
  renderChat();
}
