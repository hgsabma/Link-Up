/* Logga in – fejkad BankID-inloggning (kopplas INTE till riktiga BankID) */

// Påhittade BankID-identiteter. Det här är "BankID-appens" data, inte Link Ups databas.
const FAKE_BANKID = [
  { key: 'vanlig', label: 'Vanlig användare', desc: 'Nattuggla, 17 år', bankid_hash: 'bh_7f3a91', birth_date: '2009-03-14' },
  { key: 'ny', label: 'Ny användare', desc: 'Första besöket, 16 år', bankid_hash: 'bh_new_5a21', birth_date: '2010-02-14' },
  { key: 'under15', label: 'Under 15 år', desc: 'Testperson, 13 år', bankid_hash: 'bh_u15_3e08', birth_date: '2013-05-10' },
  { key: 'moderator', label: 'Moderator', desc: 'Moderator Lejonet', bankid_hash: 'bh_c2e810', birth_date: '1992-01-11' },
  { key: 'avstangd', label: 'Avstängd användare', desc: 'Stormen, avstängd av moderator', bankid_hash: 'bh_9d4b77', birth_date: '2009-02-02' }
];

let waitTimer = null;

function initPage() {
  const params = new URLSearchParams(location.search);
  const isNew = params.get('nytt') === '1';
  if (isNew) {
    $('#login-title').textContent = 'Skapa konto med BankID';
    $('#choose-title').textContent = 'Skapa konto med BankID';
  }

  // Redan inloggad? Gå vidare direkt.
  if (currentUser()) { location.replace(params.get('next') || 'index.html'); return; }

  // Visa testpersonerna som radioknappar
  $('#test-users').innerHTML = FAKE_BANKID.map((p, i) => {
    const existing = getUserByBankId(p.bankid_hash);
    const desc = p.key === 'ny' && existing ? existing.alias + ' (har redan gjort första besöket)' : p.desc;
    const checked = isNew ? p.key === 'ny' : i === 0;
    return '<label class="test-user"><span><strong>' + p.label + '</strong><small>' + escapeHtml(desc) + '</small></span>' +
      '<input type="radio" name="person" value="' + p.key + '"' + (checked ? ' checked' : '') + '></label>';
  }).join('');

  $('#bankid-form').addEventListener('submit', e => {
    e.preventDefault();
    const key = new FormData(e.target).get('person');
    startBankId(FAKE_BANKID.find(p => p.key === key));
  });
  $('#cancel-btn').addEventListener('click', () => {
    clearTimeout(waitTimer);
    show('step-choose');
  });
}

function show(id) {
  ['step-choose', 'step-wait', 'step-message'].forEach(s => { $('#' + s).hidden = s !== id; });
  const focusTarget = $('#' + id + ' h2');
  if (focusTarget) { focusTarget.tabIndex = -1; focusTarget.focus(); }
}

// Visa "Öppna BankID-appen" och "logga in" efter 2 sekunder
function startBankId(person) {
  show('step-wait');
  waitTimer = setTimeout(() => finishBankId(person), 2000);
}

function finishBankId(person) {
  const msg = $('#step-message');

  // Under 15 år nekas med ett vänligt meddelande
  if (getAgeFromBirthDate(person.birth_date) < 15) {
    msg.innerHTML =
      '<h2>Hej! Link Up är för dig som är 15 år eller äldre</h2>' +
      '<p>Vad roligt att du vill vara med. Just nu kan du tyvärr inte skapa ett konto, men det finns andra som gärna lyssnar på dig.</p>' +
      '<div class="notice"><p><strong>Bris</strong> finns för dig under 18 år. Ring <a href="tel:116111"><strong>116 111</strong></a> eller chatta på bris.se. Det är gratis och du behöver inte säga vem du är.</p></div>' +
      '<p class="muted small">Är det akut, ring alltid 112.</p>' +
      '<a class="btn btn-secondary" href="index.html">Till startsidan</a>';
    show('step-message');
    return;
  }

  const user = getUserByBankId(person.bankid_hash);

  // Avstängd användare – kan inte heller skapa nytt konto eftersom BankID är kopplat till samma person
  if (user && isSuspended(user.id)) {
    msg.innerHTML =
      '<h2>Ditt konto är avstängt</h2>' +
      '<p>En moderator har stängt av kontot eftersom reglerna inte följdes. Eftersom alla loggar in med BankID går det inte att skapa ett nytt konto.</p>' +
      '<p class="muted">Om du mår dåligt kan du fortfarande få stöd: ring Självmordslinjen 90101, 1177 eller 112 vid akut fara.</p>' +
      '<a class="btn btn-secondary" href="regler.html">Läs reglerna</a>';
    show('step-message');
    return;
  }

  const next = new URLSearchParams(location.search).get('next') || 'index.html';

  // Finns kontot redan? Logga in.
  if (user) {
    login(user.id);
    location.href = next;
    return;
  }

  // Ny person – spara tillfälligt och gå till första besöket
  setSetting(PENDING_KEY, JSON.stringify({ bankid_hash: person.bankid_hash, birth_date: person.birth_date, next: next }));
  location.href = 'forsta-besoket.html';
}
