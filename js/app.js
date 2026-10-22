/* =========================================================
   Link Up – gemensam kod för alla sidor
   Meny, inloggning, hjälpknapp, ordfilter, ljust läge och textstorlek.
   ========================================================= */

const SESSION_KEY = 'linkup_session';   // id för inloggad användare
const PENDING_KEY = 'linkup_pending';   // ny BankID-användare som inte gjort första besöket
const THEME_KEY = 'linkup_theme';       // 'dark' eller 'light'
const TEXT_KEY = 'linkup_text';         // 'normal' eller 'large'

// ---------- Inställningar (läses direkt så att sidan inte blinkar) ----------

function getSetting(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
}
function setSetting(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* ignorera */ }
}
function applySettings() {
  document.documentElement.dataset.theme = getSetting(THEME_KEY, 'dark');
  document.documentElement.dataset.text = getSetting(TEXT_KEY, 'normal');
}
function toggleTheme() {
  setSetting(THEME_KEY, getSetting(THEME_KEY, 'dark') === 'dark' ? 'light' : 'dark');
  applySettings();
  updateSettingButtons();
}
function toggleTextSize() {
  setSetting(TEXT_KEY, getSetting(TEXT_KEY, 'normal') === 'normal' ? 'large' : 'normal');
  applySettings();
  updateSettingButtons();
}
applySettings();

// ---------- Inloggning ----------

function getSessionUserId() {
  try { return Number(localStorage.getItem(SESSION_KEY)) || null; } catch (e) { return null; }
}
function currentUser() {
  const id = getSessionUserId();
  const user = id ? getUser(id) : null;
  if (!user || isSuspended(user.id)) return null;
  return user;
}
function login(userId) { setSetting(SESSION_KEY, String(userId)); }
function logout() {
  try { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(PENDING_KEY); } catch (e) { /* ignorera */ }
  location.href = 'index.html';
}

// Sidor med data-auth="required" eller "moderator" kräver inloggning
(function guardPage() {
  const auth = document.documentElement.dataset.auth;
  if (!auth) return;
  const user = currentUser();
  if (!user) {
    location.replace('logga-in.html?next=' + encodeURIComponent(location.pathname.split('/').pop() || 'index.html'));
    return;
  }
  if (auth === 'moderator' && user.role !== 'moderator') location.replace('index.html');
})();

// ---------- Små verktyg ----------

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const MONTHS = ['jan', 'feb', 'mars', 'apr', 'maj', 'juni', 'juli', 'aug', 'sep', 'okt', 'nov', 'dec'];
const WEEKDAYS = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];

function formatTime(date) {
  const d = new Date(date);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
function formatDate(date) {
  const d = new Date(date);
  return WEEKDAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' kl ' + formatTime(d);
}
// "för 5 min sedan", "igår" osv.
function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 60000;
  if (diff < 1) return 'nyss';
  if (diff < 60) return 'för ' + Math.floor(diff) + ' min sedan';
  if (diff < 60 * 24) return 'för ' + Math.floor(diff / 60) + ' tim sedan';
  if (diff < 60 * 48) return 'igår';
  return new Date(date).getDate() + ' ' + MONTHS[new Date(date).getMonth()];
}
function initials(alias) { return (alias || '?').replace(/^(Volontär|Kurator|Moderator)\s+/, '').slice(0, 1).toUpperCase(); }
function avatar(userId, size) {
  const hue = (userId * 47) % 360;
  return '<span class="avatar ' + (size || '') + '" style="--hue:' + hue + '" aria-hidden="true">' + escapeHtml(initials(getAlias(userId))) + '</span>';
}

// Kort meddelande längst ner på skärmen
function toast(message) {
  let el = $('#toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ---------- Ikoner (egna SVG:er, inga emojis) ----------

const ICONS = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.6c2.6.2 4.4 1.9 5 5.4"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5c-.8 0-1.5-.7-1.5-1.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v7.5c0 4-2.5 7-6.5 7-2.8 0-4.5-1.4-6-4l-1.8-3.2a1.4 1.4 0 0 1 2.3-1.6L8 14"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  block: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  logout: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  text: '<path d="M4 19l5-14 5 14M5.8 14h6.4M15 19l3-8 3 8M15.9 16.6h4.2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19l7-7"/>'
};
function icon(name, extraClass) {
  return '<svg class="icon ' + (extraClass || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
}
const LOGO_MARK = '<svg class="logo-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><rect width="48" height="48" rx="13" fill="#7c3aed"/><g fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13h14a5 5 0 0 1 5 5v5a5 5 0 0 1-5 5h-7l-5 4v-4h-2a5 5 0 0 1-5-5v-5a5 5 0 0 1 5-5z"/><path d="M24 20h14a5 5 0 0 1 5 5v5a5 5 0 0 1-5 5h-2v4l-5-4h-7a5 5 0 0 1-5-5v-5a5 5 0 0 1 5-5z"/></g></svg>';

// ---------- Ordfilter och oroande ord ----------

// Ord som stoppas innan något publiceras (jämförs med hela ord)
const BLOCKED_WORDS = [
  'jävla', 'jävlar', 'jävel', 'javla', 'fan', 'faan', 'helvete', 'helvetes', 'skit', 'skitig', 'idiot', 'idioter',
  'cp', 'mongo', 'hora', 'horunge', 'fitta', 'kuk', 'knulla', 'bitch', 'fuck', 'fucking', 'shit', 'loser',
  'äckel', 'äcklig', 'tjockis', 'fetto', 'bög', 'blatte', 'neger', 'n-ordet', 'retard', 'pucko', 'dumhuvud'
];
// Fraser som stoppas
const BLOCKED_PHRASES = ['gå och dö', 'dö bara', 'ingen gillar dig', 'du är värdelös', 'skaffa ett liv'];
// Oroande uttryck – visar hjälprutan direkt och lyfts först hos moderatorn
const CONCERN_PATTERNS = [
  /vill (jag )?inte (leva|finnas)/, /inte leva längre/, /orkar inte (leva|mer|längre)/, /ta (mitt|mitt eget) liv/,
  /ta livet av mig/, /vill (bara )?dö/, /självmord/, /skada(r)? mig själv/, /vill (bara )?försvinna/,
  /inte vara kvar/, /avsluta allt/, /döda mig/
];

function normalizeText(text) { return ' ' + text.toLowerCase().replace(/[^a-zåäöéü0-9\- ]+/gi, ' ').replace(/\s+/g, ' ') + ' '; }
function hasBlockedWords(text) {
  const norm = normalizeText(text);
  return BLOCKED_WORDS.some(w => norm.includes(' ' + w + ' ')) || BLOCKED_PHRASES.some(p => norm.includes(' ' + p + ' ') || norm.includes(p));
}
function hasConcern(text) {
  const norm = normalizeText(text);
  return CONCERN_PATTERNS.some(p => p.test(norm));
}

// Kontrollera text innan publicering. Visar påminnelse/hjälpruta och returnerar true om texten får publiceras.
function checkBeforePublish(text, noticeEl) {
  const trimmed = text.trim();
  if (noticeEl) { noticeEl.hidden = true; noticeEl.innerHTML = ''; }
  if (!trimmed) {
    showNotice(noticeEl, 'Skriv något först.');
    return false;
  }
  if (hasBlockedWords(trimmed)) {
    showNotice(noticeEl, '<strong>Hoppsan, det där gick inte att skicka.</strong> Texten innehåller ord som kan såra någon. Här pratar vi snällt med varandra. <a href="regler.html">Läs reglerna</a> och försök formulera om dig.');
    return false;
  }
  if (hasConcern(trimmed)) {
    // Texten publiceras, men hjälprutan visas direkt
    setTimeout(() => openHelp(true), 50);
  }
  return true;
}
function showNotice(el, html) {
  if (el) { el.innerHTML = html; el.hidden = false; }
  else toast(html.replace(/<[^>]+>/g, ''));
}

// ---------- Hjälprutan ----------

function helpBoxHtml() {
  return '<ul class="help-list">' +
    '<li><a class="help-line" href="tel:112">' + icon('phone') + '<span><strong>112</strong> Vid akut fara för liv</span></a></li>' +
    '<li><a class="help-line" href="tel:1177">' + icon('phone') + '<span><strong>1177</strong> Råd om vård, dygnet runt</span></a></li>' +
    '<li><a class="help-line" href="tel:90101">' + icon('phone') + '<span><strong>90101</strong> Minds Självmordslinjen</span></a></li>' +
    '</ul>';
}
function openHelp(concern) {
  const dialog = $('#help-dialog');
  $('#help-concern').hidden = !concern;
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
}

// ---------- Sidhuvud, bottenmeny och sidfot ----------

const NAV_DESKTOP = [
  { href: 'index.html', label: 'Hem', page: 'hem' },
  { href: 'utforska.html', label: 'Utforska', page: 'utforska' },
  { href: 'aktiviteter.html', label: 'Aktiviteter', page: 'aktiviteter' },
  { href: 'lasstund.html', label: 'Lässtunder', page: 'lasstund' },
  { href: 'om-oss.html', label: 'Om oss', page: 'om-oss' }
];
const NAV_MOBILE = [
  { href: 'index.html', label: 'Hem', page: 'hem', icon: 'home' },
  { href: 'amnen.html', label: 'Ämnen', page: 'amnen', icon: 'chat' },
  { href: 'grupper.html', label: 'Grupper', page: 'grupper', icon: 'users' },
  { href: 'aktiviteter.html', label: 'Aktiviteter', page: 'aktiviteter', icon: 'calendar' },
  { href: 'min-sida.html', label: 'Min sida', page: 'min-sida', icon: 'user' }
];
// Sidor som räknas till "Utforska" i menyn
const EXPLORE_PAGES = ['utforska', 'amnen', 'grupper', 'samtal', 'linky', 'sok'];

function renderLayout() {
  const page = document.body.dataset.page;
  const user = currentUser();
  const isActive = item => item.page === page || (item.page === 'utforska' && EXPLORE_PAGES.includes(page));

  // Hoppa till innehåll
  document.body.insertAdjacentHTML('afterbegin', '<a class="skip-link" href="#main">Hoppa till innehållet</a>');

  const accountHtml = user
    ? '<a class="btn btn-ghost btn-sm" href="min-sida.html">' + avatar(user.id, 'sm') + '<span>' + escapeHtml(user.alias) + '</span></a>' +
      (user.role === 'moderator' ? '<a class="btn btn-ghost btn-sm" href="moderator.html" aria-label="Moderator">' + icon('shield') + '<span>Moderator</span></a>' : '') +
      '<button type="button" class="btn btn-ghost btn-sm" id="logout-btn" aria-label="Logga ut">' + icon('logout') + '<span>Logga ut</span></button>'
    : '<a class="btn btn-ghost btn-sm" href="logga-in.html">Logga in</a>' +
      '<a class="btn btn-primary btn-sm" href="logga-in.html?nytt=1">Skapa konto med BankID</a>';

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML =
    '<div class="header-inner">' +
      '<a class="logo" href="index.html" aria-label="Link Up, till startsidan">' + LOGO_MARK + '<span class="logo-text">Link Up</span></a>' +
      '<nav class="main-nav" aria-label="Huvudmeny"><ul>' +
        NAV_DESKTOP.map(i => '<li><a href="' + i.href + '"' + (isActive(i) ? ' aria-current="page"' : '') + '>' + i.label + '</a></li>').join('') +
      '</ul></nav>' +
      '<form class="search-form" action="sok.html" role="search">' +
        '<label class="sr-only" for="site-search">Sök på Link Up</label>' +
        icon('search', 'search-icon') +
        '<input id="site-search" name="q" type="search" placeholder="Sök ämnen, grupper..." autocomplete="off">' +
      '</form>' +
      '<div class="header-tools">' +
        '<button type="button" class="icon-btn" id="text-btn" aria-pressed="false" title="Större text"><span aria-hidden="true" class="aa">Aa</span><span class="sr-only">Större text</span></button>' +
        '<button type="button" class="icon-btn" id="theme-btn" aria-pressed="false" title="Ljust läge"><span id="theme-icon"></span><span class="sr-only">Ljust läge</span></button>' +
        '<div class="account">' + accountHtml + '</div>' +
      '</div>' +
    '</div>';
  document.body.prepend(header);
  document.body.prepend($('.skip-link'));

  // Bottenmeny på mobil
  const bottom = document.createElement('nav');
  bottom.className = 'bottom-nav';
  bottom.setAttribute('aria-label', 'Mobilmeny');
  bottom.innerHTML = '<ul>' + NAV_MOBILE.map(i =>
    '<li><a href="' + i.href + '"' + (i.page === page ? ' aria-current="page"' : '') + '>' + icon(i.icon) + '<span>' + i.label + '</span></a></li>'
  ).join('') + '</ul>';
  document.body.appendChild(bottom);

  // Sidfot
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML =
    '<div class="footer-inner">' +
      '<p><strong>Link Up</strong> – Du är inte ensam. Ett elevprojekt på Hitachigymnasiet.</p>' +
      '<p class="muted">Link Up är inte vård och ställer inga diagnoser. All data på sidan är påhittad.</p>' +
      '<nav aria-label="Sidfot"><ul class="footer-links">' +
        '<li><a href="om-oss.html">Om oss</a></li><li><a href="regler.html">Regler</a></li>' +
        '<li><a href="utforska.html">Utforska</a></li><li><a href="samtal.html">Samtal</a></li><li><a href="linky.html">Linky</a></li>' +
        (user && user.role === 'moderator' ? '<li><a href="moderator.html">Moderator</a></li>' : '') +
      '</ul></nav>' +
    '</div>';
  document.body.appendChild(footer);

  // Hjälpknapp och hjälpruta
  document.body.insertAdjacentHTML('beforeend',
    '<button type="button" class="help-fab" id="help-btn">' + icon('heart') + '<span>Behöver du hjälp nu?</span></button>' +
    '<dialog class="dialog" id="help-dialog" aria-labelledby="help-title">' +
      '<div class="dialog-head"><h2 id="help-title">Behöver du hjälp nu?</h2>' +
      '<button type="button" class="icon-btn" data-close aria-label="Stäng">' + icon('close') + '</button></div>' +
      '<p id="help-concern" class="notice notice-warm" hidden>Det du skrev låter tungt. Tack för att du delar det. Du förtjänar att få prata med någon direkt – ring gärna någon av numren nedan.</p>' +
      '<p>Du behöver inte klara allt själv. Här kan du få prata med någon direkt:</p>' +
      helpBoxHtml() +
      '<p class="muted small">Link Up är inte vård. Vid akut fara, ring alltid 112.</p>' +
      '<div class="dialog-actions"><a class="btn btn-secondary" href="samtal.html?flik=volontar">Prata med en volontär</a><button type="button" class="btn btn-primary" data-close>Stäng</button></div>' +
    '</dialog>');

  // Ikoner i statisk HTML: <a data-icon="plus">
  $$('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));

  // Knappar
  $('#help-btn').addEventListener('click', () => openHelp(false));
  $$('#help-dialog [data-close]').forEach(b => b.addEventListener('click', () => $('#help-dialog').close()));
  $('#text-btn').addEventListener('click', toggleTextSize);
  $('#theme-btn').addEventListener('click', toggleTheme);
  const logoutBtn = $('#logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  // Behåll sökordet i sökfältet
  const q = new URLSearchParams(location.search).get('q');
  if (q && page === 'sok') $('#site-search').value = q;
  updateSettingButtons();
}

// Uppdatera knapparnas läge (aria-pressed och ikon)
function updateSettingButtons() {
  const light = getSetting(THEME_KEY, 'dark') === 'light';
  const large = getSetting(TEXT_KEY, 'normal') === 'large';
  const themeBtn = $('#theme-btn'), textBtn = $('#text-btn');
  if (themeBtn) {
    themeBtn.setAttribute('aria-pressed', String(light));
    themeBtn.title = light ? 'Mörkt läge' : 'Ljust läge';
    $('.sr-only', themeBtn).textContent = 'Ljust läge';
    $('#theme-icon').innerHTML = icon(light ? 'moon' : 'sun');
  }
  if (textBtn) textBtn.setAttribute('aria-pressed', String(large));
  // Reglage på Min sida
  $$('[data-setting="theme"]').forEach(el => { el.checked = light; });
  $$('[data-setting="text"]').forEach(el => { el.checked = large; });
}

// ---------- Gemensam chatt (gruppchatt, lässtund) ----------

// Rita upp en lista med meddelanden. Meddelanden från blockerade användare visas inte.
function renderMessages(listEl, messages, myId) {
  const visible = messages.filter(m => !myId || !isBlocked(myId, m.user_id || m.sender_id));
  listEl.innerHTML = visible.length ? visible.map(m => {
    const from = m.user_id || m.sender_id;
    const mine = from === myId;
    return '<li class="msg' + (mine ? ' msg-mine' : '') + '">' +
      (mine ? '' : avatar(from, 'sm')) +
      '<div class="msg-bubble"><span class="msg-meta">' + escapeHtml(mine ? 'Du' : getAlias(from)) + ' · ' + timeAgo(m.created_at) + '</span>' +
      '<p>' + escapeHtml(m.body) + '</p></div></li>';
  }).join('') : '<li class="muted empty">Inga meddelanden än. Säg gärna hej!</li>';
  listEl.scrollTop = listEl.scrollHeight;
}

// ---------- Aktivitetskort (används på flera sidor) ----------

const ACTIVITY_TYPE_LABEL = { ute: 'Ute', online: 'Online', lasstund: 'Lässtund' };

function activityCardHtml(a, me) {
  const d = new Date(a.starts_at);
  const count = countParticipants(a.id);
  const joined = me && isParticipant(a.id, me.id);
  const full = count >= a.max_participants;
  const book = a.book_id ? getBook(a.book_id) : null;
  let button;
  if (!me) button = '<a class="btn btn-primary" href="logga-in.html">Logga in för att vara med</a>';
  else if (joined) button = '<button type="button" class="btn btn-success" data-join-activity="' + a.id + '" aria-pressed="true">' + icon('check') + 'Du är med</button>';
  else if (full) button = '<button type="button" class="btn btn-ghost" disabled>Fullt</button>';
  else button = '<button type="button" class="btn btn-primary" data-join-activity="' + a.id + '" aria-pressed="false">Jag vill vara med</button>';

  return '<article class="card activity">' +
    '<div class="activity-date"><div class="date-box"><span class="day">' + d.getDate() + '</span><span class="mon">' + MONTHS[d.getMonth()] + '</span></div>' +
      '<div><h3 style="margin:0">' + escapeHtml(a.title) + '</h3><span class="muted small">' + WEEKDAYS[d.getDay()] + ' kl ' + formatTime(d) + '</span></div></div>' +
    '<div class="row"><span class="badge">' + ACTIVITY_TYPE_LABEL[activityType(a)] + '</span>' +
      (a.is_safe_first_meet ? '<span class="badge badge-safe" title="Offentlig plats, volontär på plats och du får ta med en kompis">' + icon('shield') + 'Trygg första träff</span>' : '') + '</div>' +
    '<p class="muted" style="margin:0">' + escapeHtml(a.description) + '</p>' +
    '<ul class="meta-list">' +
      '<li>' + icon('pin') + escapeHtml(a.location) + '</li>' +
      (book ? '<li>' + icon('book') + escapeHtml(book.title) + ' – ' + escapeHtml(book.author) + '</li>' : '') +
      '<li>' + icon('users') + count + ' av ' + a.max_participants + ' deltagare</li>' +
    '</ul>' +
    '<div class="progress" aria-hidden="true"><span style="width:' + Math.min(100, Math.round(count / a.max_participants * 100)) + '%"></span></div>' +
    button +
  '</article>';
}

// Koppla "Jag vill vara med"-knapparna. rerender ritar om listan.
function bindActivityButtons(root, me, rerender) {
  $$('[data-join-activity]', root).forEach(b => b.addEventListener('click', () => {
    const id = Number(b.dataset.joinActivity);
    if (isParticipant(id, me.id)) {
      deleteRows('activity_participants', p => p.activity_id === id && p.user_id === me.id);
      toast('Du är avanmäld från ' + getActivity(id).title + '.');
    } else {
      if (isActivityFull(id)) return toast('Tyvärr, aktiviteten är full.');
      insertRow('activity_participants', { activity_id: id, user_id: me.id, joined_at: nowIso() }, false);
      toast('Kul! Du är anmäld till ' + getActivity(id).title + '.');
    }
    rerender();
    const again = $('[data-join-activity="' + id + '"]', root);
    if (again) again.focus();
  }));
}

// ---------- Start ----------

document.addEventListener('DOMContentLoaded', () => {
  renderLayout();
  if (typeof initPage === 'function') initPage();
});
