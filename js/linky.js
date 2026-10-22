/* Linky – enkel regelbaserad chatt (ingen riktig AI). Samtalet sparas inte. */

let me;
const chat = [];   // finns bara i minnet medan sidan är öppen

const SUGGESTIONS = ['Jag känner mig ensam', 'Jag är stressad över skolan', 'Jag vill prata med någon', 'Tips på något att göra', 'Jag sover dåligt'];

// Länk-hjälp
const link = (href, text) => '<a href="' + href + '">' + escapeHtml(text) + '</a>';

function groupSuggestion(filterFn) {
  const g = db.groups.filter(x => !isMember(x.id, me.id) && countMembers(x.id) < x.max_members).find(filterFn);
  return g ? link('grupper.html', g.name) + ' (' + WEEKDAYS[new Date(g.created_at).getDay()] + 'ar)' : link('grupper.html', 'Grupper');
}
function activitySuggestion(filterFn) {
  const a = upcomingActivities().find(filterFn);
  return a ? link('aktiviteter.html', a.title) + ' – ' + formatDate(a.starts_at) : link('aktiviteter.html', 'Aktiviteter');
}
function volunteerSuggestion() {
  const v = db.users.filter(u => u.role === 'volunteer' || u.role === 'counselor');
  const free = v.find(u => isAvailableNow(u.id));
  return free ? link('samtal.html?flik=volontar', free.alias) + ' är ledig just nu' : link('samtal.html?flik=volontar', 'en volontär') + ' (ingen är ledig just nu, men du kan skicka en förfrågan)';
}

// Regler: första regeln vars nyckelord finns i texten vinner
const RULES = [
  { keys: ['diagnos', 'adhd', 'depression', 'depp', 'sjukdom', 'är jag sjuk', 'medicin', 'autism', 'bipolär'],
    reply: () => 'Jag kan inte ställa diagnoser eller ge medicinska råd – jag är en AI och inte vård. Om du undrar över din hälsa kan du ringa ' + link('tel:1177', '1177') + ' eller prata med skolsköterskan eller kuratorn. Vill du prata med ' + volunteerSuggestion() + '?' },
  { keys: ['ensam', 'ingen vän', 'inga vänner', 'utanför', 'ingen bryr'],
    reply: () => 'Det låter jobbigt att känna sig ensam, och du är långt ifrån den enda. Många här har känt likadant. Ett förslag är en liten grupp som ses varje vecka: ' + groupSuggestion(g => g.max_members <= 8) + '. Du kan också läsa och skriva i ämnet ' + link('amnen.html?amne=1', 'Ensamhet') + '.' },
  { keys: ['stress', 'prov', 'plugg', 'läxa', 'skola', 'betyg'],
    reply: () => 'Skolstress är vanligt. Det kan hjälpa att plugga tillsammans med andra: ' + groupSuggestion(g => g.interest_id === 5) + ' eller ' + activitySuggestion(a => /plugg/i.test(a.title)) + '. I ämnet ' + link('amnen.html?amne=2', 'Stress och skola') + ' delar andra sina tips.' },
  { keys: ['sova', 'sover', 'sömn', 'somna', 'trött'],
    reply: () => 'Sömn kan vara svårt när tankarna snurrar. Andra har tipsat om att skriva ner tankar innan man lägger sig och att lägga undan mobilen en stund innan. Läs mer i ämnet ' + link('amnen.html?amne=5', 'Sömn') + '. Om det håller i sig länge kan du ringa ' + link('tel:1177', '1177') + ' för råd.' },
  { keys: ['prata', 'volontär', 'kurator', 'människa', 'någon att'],
    reply: () => 'Det är modigt att vilja prata. Just nu: ' + volunteerSuggestion() + '. Du kan också skriva enskilt med någon i din grupp under ' + link('samtal.html', 'Mina samtal') + '.' },
  { keys: ['ledsen', 'dåligt', 'ångest', 'orolig', 'panik', 'gråter', 'jobbigt', 'tungt'],
    reply: () => 'Tack för att du berättar. Det är okej att inte må bra. Du kan prata med ' + volunteerSuggestion() + ', eller gå med i en lugn grupp: ' + groupSuggestion(g => g.interest_id === 12) + '. Om det känns akut, ring ' + link('tel:90101', 'Självmordslinjen 90101') + ' eller ' + link('tel:112', '112') + '.' },
  { keys: ['bok', 'läsa', 'läser', 'lässtund'],
    reply: () => 'Då kanske du gillar lässtunden! ' + activitySuggestion(a => a.book_id) + '. Du kan lyssna, läsa själv i takt eller chatta. ' + link('lasstund.html', 'Gå till lässtunden') + '.' },
  { keys: ['göra', 'tråkigt', 'aktivitet', 'träffa', 'ute', 'promenad', 'gå ut'],
    reply: () => 'Vad sägs om att testa något på riktigt? ' + activitySuggestion(a => a.is_safe_first_meet) + ' har märket Trygg första träff – offentlig plats, volontär på plats och du får ta med en kompis.' },
  { keys: ['spel', 'gamer', 'gaming', 'spela'],
    reply: () => 'Spelkvällar är ett bra sätt att lära känna folk utan press. Kolla ' + groupSuggestion(g => g.interest_id === 2) + ' eller ' + activitySuggestion(a => /spel/i.test(a.title)) + '.' },
  { keys: ['vän', 'kompis', 'ny skola', 'nya vänner'],
    reply: () => 'Att hitta nya vänner tar tid, men det går! Många här har träffat sina kompisar i en liten grupp. Testa ' + groupSuggestion(g => g.max_members <= 8) + ' eller en aktivitet: ' + activitySuggestion(a => a.is_safe_first_meet) + '.' },
  { keys: ['tack'],
    reply: () => 'Varsågod! Jag finns här om du vill fråga något mer.' },
  { keys: ['hej', 'hallå', 'tja', 'hejsan'],
    reply: () => 'Hej ' + escapeHtml(me.alias) + '! Vad vill du ha hjälp med idag? Du kan skriva fritt eller välja ett förslag nedan.' }
];

function initPage() {
  me = currentUser();
  botSay('Hej! Jag heter Linky och är en <strong>AI – inte en människa och inte vård</strong>. Jag kan ha fel, jag ställer inga diagnoser och samtalet sparas inte. Jag kan tipsa dig om grupper, aktiviteter eller en volontär. Vad vill du prata om?');
  $('#linky-suggestions').innerHTML = SUGGESTIONS.map(s => '<button type="button" class="chip">' + s + '</button>').join('');
  $$('#linky-suggestions .chip').forEach(b => b.addEventListener('click', () => userSay(b.textContent)));
  $('#linky-form').addEventListener('submit', e => {
    e.preventDefault();
    userSay($('#linky-input').value);
  });
}

function render() {
  const list = $('#linky-messages');
  list.innerHTML = chat.map(m => m.bot
    ? '<li class="msg"><span class="avatar sm" style="--hue:265" aria-hidden="true">L</span><div class="msg-bubble"><span class="msg-meta">Linky (AI)</span><p>' + m.html + '</p></div></li>'
    : '<li class="msg msg-mine"><div class="msg-bubble"><span class="msg-meta">Du</span><p>' + escapeHtml(m.text) + '</p></div></li>').join('');
  list.scrollTop = list.scrollHeight;
}

function botSay(html) { chat.push({ bot: true, html: html }); render(); }

function userSay(text) {
  const notice = $('#linky-notice');
  if (!checkBeforePublish(text, notice)) return;   // ordfilter + hjälpruta vid oroande ord
  chat.push({ bot: false, text: text.trim() });
  $('#linky-input').value = '';
  render();
  setTimeout(() => botSay(answer(text)), 600);
}

function answer(text) {
  const t = text.toLowerCase();
  if (hasConcern(t)) {
    return 'Det du skriver är viktigt och jag blir orolig för dig. Jag är bara en AI, så du behöver prata med en människa nu. Ring ' + link('tel:90101', 'Självmordslinjen 90101') + ', eller ' + link('tel:112', '112') + ' om du är i akut fara. Du kan också prata med ' + volunteerSuggestion() + '.';
  }
  const rule = RULES.find(r => r.keys.some(k => t.includes(k)));
  if (rule) return rule.reply();
  return 'Jag är inte säker på att jag förstod – jag är en enkel AI och kan ha fel. Vill du hitta en ' + link('grupper.html', 'grupp') + ', en ' + link('aktiviteter.html', 'aktivitet') + ' eller prata med ' + volunteerSuggestion() + '?';
}
