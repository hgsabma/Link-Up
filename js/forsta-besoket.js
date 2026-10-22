/* Första besöket – välj alias, minst tre intressen och godkänn reglerna */

let step = 1;
let pending = null;
const chosen = new Set();

function initPage() {
  try { pending = JSON.parse(getSetting(PENDING_KEY, 'null')); } catch (e) { pending = null; }
  // Man måste ha loggat in med BankID först
  if (!pending) { location.replace('logga-in.html'); return; }

  // Förslag på alias som inte är upptagna
  const ideas = ['Månsken', 'Blåbär', 'Fjädern', 'Nordljus', 'Pixel', 'Sjöstjärna'].filter(a => !getUserByAlias(a)).slice(0, 4);
  $('#alias-ideas').innerHTML = ideas.map(a => '<button type="button" class="chip">' + a + '</button>').join('');
  $$('#alias-ideas .chip').forEach(b => b.addEventListener('click', () => { $('#alias').value = b.textContent; $('#alias').focus(); }));

  // Intressen som knappar som går att slå på och av
  $('#interest-list').innerHTML = db.interests.map(i =>
    '<button type="button" class="chip" aria-pressed="false" data-id="' + i.id + '">' + escapeHtml(i.name) + '</button>').join('');
  $$('#interest-list .chip').forEach(b => b.addEventListener('click', () => {
    const id = Number(b.dataset.id);
    if (chosen.has(id)) chosen.delete(id); else chosen.add(id);
    b.setAttribute('aria-pressed', String(chosen.has(id)));
    updateCount();
  }));
  updateCount();

  $('#welcome-form').addEventListener('submit', e => { e.preventDefault(); next(); });
  $('#back-btn').addEventListener('click', () => goTo(step - 1));
}

function updateCount() {
  $('#interest-count').textContent = chosen.size + ' valda' + (chosen.size < 3 ? ' – välj ' + (3 - chosen.size) + ' till' : '');
}

function fail(text) {
  const n = $('#welcome-notice');
  n.innerHTML = text;
  n.hidden = false;
}

function goTo(n) {
  step = n;
  $('#welcome-notice').hidden = true;
  $$('[data-step]').forEach(s => { s.hidden = Number(s.dataset.step) !== n; });
  $$('.steps li').forEach((li, i) => li.classList.toggle('done', i < n));
  $('#back-btn').hidden = n === 1;
  $('#next-btn').textContent = n === 3 ? 'Kom igång' : 'Nästa';
  const h = $('[data-step="' + n + '"] h2');
  h.tabIndex = -1;
  h.focus();
}

function next() {
  if (step === 1) {
    const alias = $('#alias').value.trim();
    if (!/^[A-Za-zÅÄÖåäöÉéÜü0-9 ]{3,20}$/.test(alias)) return fail('Aliaset måste vara 3–20 tecken och får bara innehålla bokstäver, siffror och mellanslag.');
    if (hasBlockedWords(alias)) return fail('Det aliaset går inte att använda. Välj ett snällare alias.');
    if (/^(volontär|kurator|moderator)/i.test(alias)) return fail('Det aliaset är reserverat. Välj ett annat.');
    if (getUserByAlias(alias)) return fail('Någon annan har redan det aliaset. Testa ett annat!');
    return goTo(2);
  }
  if (step === 2) {
    if (chosen.size < 3) return fail('Välj minst tre intressen för att gå vidare.');
    return goTo(3);
  }
  if (!$('#accept').checked) return fail('Du behöver godkänna reglerna för att gå vidare.');

  // Skapa användaren och koppla intressena
  const user = insertRow('users', {
    bankid_hash: pending.bankid_hash, alias: $('#alias').value.trim(),
    birth_date: pending.birth_date, role: 'member', created_at: nowIso()
  });
  chosen.forEach(id => insertRow('user_interests', { user_id: user.id, interest_id: id }, false));
  try { localStorage.removeItem(PENDING_KEY); } catch (e) { /* ignorera */ }
  login(user.id);
  location.href = pending.next && !['logga-in.html', 'index.html'].includes(pending.next) ? pending.next : 'grupper.html?ny=1';
}
