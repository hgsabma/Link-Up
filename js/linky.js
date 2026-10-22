/* Linky – regelbaserad chatt (ingen riktig AI). Samtalet sparas inte.
   Linky känner igen nyckelord och vanliga stavfel, kommer ihåg vad Linky har frågat om (ja/nej),
   ger förslag som passar dig och har knappar som gör saker direkt – men bara när du trycker. */

let me;
const chat = [];         // samtalet finns bara i minnet medan sidan är öppen
const actions = [];      // knappar i Linkys svar
const suggested = new Set();   // det Linky redan föreslagit, så att samma sak inte upprepas
let offer = null;        // en fråga Linky väntar på ja/nej till

const DEFAULT_QUICK = ['Jag känner mig ensam', 'Jag är stressad över skolan', 'Jag vill prata med en människa', 'Tips på något att göra', 'Hur funkar grupperna?', 'Var hittar jag mina meddelanden?'];
const MOOD_NAMES = ['', 'Dåligt', 'Sådär', 'Okej', 'Bra', 'Toppen'];
const YES = ['ja', 'jaa', 'japp', 'jo', 'gärna', 'okej', 'ok', 'absolut', 'visst', 'yes', 'precis', 'kör'];
const NO = ['nej', 'nä', 'nää', 'nope', 'nja'];

// ---------- Små hjälpare ----------

const link = (href, text) => '<a href="' + href + '">' + escapeHtml(text) + '</a>';
const pick = list => list[Math.floor(Math.random() * list.length)];
const meetText = g => 'ses ' + WEEKDAYS[new Date(g.created_at).getDay()] + 'ar kl ' + formatTime(g.created_at);

// Grupper och aktiviteter som passar dig: rätt ålder, plats kvar, inte redan med och inte redan föreslagna
function findGroup(test) {
  const g = db.groups.find(x => !isMember(x.id, me.id) && fitsAgeRange(x, me.id) && countMembers(x.id) < x.max_members && !suggested.has('g' + x.id) && test(x));
  if (g) suggested.add('g' + g.id);
  return g || null;
}
function findActivity(test) {
  const a = upcomingActivities().find(x => !isParticipant(x.id, me.id) && !isActivityFull(x.id) && !suggested.has('a' + x.id) && test(x));
  if (a) suggested.add('a' + a.id);
  return a || null;
}
const likesInterest = g => getUserInterestIds(me.id).includes(g.interest_id);
function freeStaff() { return db.users.find(u => (u.role === 'volunteer' || u.role === 'counselor') && isAvailableNow(u.id)) || null; }

// ---------- Knappar som gör saker ----------

function joinGroupAction(g) {
  return { label: 'Gå med i ' + g.name, run: () => {
    if (!isMember(g.id, me.id)) insertRow('group_members', { group_id: g.id, user_id: me.id, joined_at: nowIso() }, false);
    return { html: 'Klart! Du är nu med i <strong>' + escapeHtml(g.name) + '</strong>. Nästa träff är ' + whenText(nextMeeting(g.id)).toLowerCase() + '. ' +
      link('grupper.html?grupp=' + g.id, 'Gå till gruppen') + ' och säg hej i gruppchatten.', quick: ['Vad händer på första träffen?'] };
  } };
}
function joinActivityAction(a) {
  return { label: 'Anmäl mig', run: () => {
    if (!isParticipant(a.id, me.id) && !isActivityFull(a.id)) insertRow('activity_participants', { activity_id: a.id, user_id: me.id, joined_at: nowIso() }, false);
    return { html: 'Toppen, du är anmäld till <strong>' + escapeHtml(a.title) + '</strong> ' + whenText(a.starts_at).toLowerCase() + '. Du hittar den under ' +
      link('aktiviteter.html', 'Aktiviteter') + '.' + (a.is_safe_first_meet ? ' Det är en Trygg första träff, så du får ta med en kompis.' : '') };
  } };
}
function volunteerAction(label, staffId) {
  return { label: label || 'Be en volontär höra av sig', run: () => {
    const id = sendVolunteerRequest(me.id, staffId || null, 'Hej! Linky tipsade om att jag kunde skriva till dig. Jag skulle vilja prata.');
    return { html: '<strong>' + escapeHtml(getAlias(id)) + '</strong> har fått din förfrågan och har redan svarat dig. ' + link('samtal.html?person=' + id, 'Öppna samtalet') +
      '. En människa är mycket bättre än jag på att lyssna.' };
  } };
}
function settingAction(kind) {
  return { label: kind === 'theme' ? 'Byt ljust/mörkt läge' : 'Byt textstorlek', run: () => {
    if (kind === 'theme') toggleTheme(); else toggleTextSize();
    return { html: 'Klart! Det sparas, så det är kvar nästa gång du kommer hit.' };
  } };
}

// ---------- Färdiga svar som flera ämnen använder ----------

function activityReply(test) {
  const a = findActivity(test) || findActivity(() => true);
  if (!a) return { html: 'Jag har inga fler förslag just nu, men titta under ' + link('aktiviteter.html', 'Aktiviteter') + '. Där kan du också skapa en egen aktivitet.' };
  return {
    html: 'Vad sägs om <strong>' + escapeHtml(a.title) + '</strong> ' + whenText(a.starts_at).toLowerCase() + ' – ' + escapeHtml(a.location) + '?' +
      (a.is_safe_first_meet ? ' Det är en <strong>Trygg första träff</strong>: offentlig plats, en volontär är på plats och du får ta med en kompis.' : ''),
    actions: [joinActivityAction(a)], quick: ['Något annat att göra?', 'Vad händer på första träffen?']
  };
}
function groupSentence(g) {
  return '<strong>' + escapeHtml(g.name) + '</strong> verkar passa dig – de ' + meetText(g) + ' och har ' + (g.max_members - countMembers(g.id)) + ' platser kvar.';
}
function volunteerSentence() {
  const free = freeStaff();
  return free ? escapeHtml(free.alias) + ' är ledig just nu.' : 'Ingen volontär är ledig just nu, men du kan skicka en förfrågan så hör de av sig.';
}
function brisSentence() {
  return isUnder18(me.id) ? ' Du kan också ringa Bris på ' + link('tel:116111', '116 111') + ' – det är gratis och du behöver inte säga vem du är.' : '';
}

function concernReply() {
  return {
    html: 'Det du skriver är viktigt, och jag blir orolig för dig. Jag är bara en AI, så du behöver prata med en människa nu. Ring ' +
      link('tel:90101', 'Självmordslinjen 90101') + ', eller ' + link('tel:112', '112') + ' om du är i akut fara. Du kan också be en volontär höra av sig direkt med knappen här under.',
    actions: [volunteerAction('Be en volontär höra av sig nu')], quick: []
  };
}

// ---------- Ämnen Linky känner igen ----------
// Det ämne som får flest träffar vinner. Vid lika vinner det som står först i listan.

const INTENTS = [
  { keys: ['diagnos', 'adhd', 'add', 'autism', 'depression', 'deprimerad', 'bipolär', 'ocd', 'ptsd', 'ätstörning', 'medicin', 'tabletter', 'är jag sjuk', 'psykiskt sjuk'],
    reply: () => {
      const kurator = db.users.find(u => u.role === 'counselor');
      return { html: 'Det är en viktig fråga, men jag kan inte ställa diagnoser eller ge medicinska råd. Jag är en AI och inte vård, och jag kan ha fel. ' +
        'Den som kan hjälpa dig är ' + link('tel:1177', '1177') + ', skolsköterskan eller en kurator.' + (kurator ? ' Här på Link Up finns ' + escapeHtml(kurator.alias) + ' som du kan skriva till.' : ''),
        actions: kurator ? [volunteerAction('Skriv till ' + kurator.alias, kurator.id)] : [], quick: ['Vad kan du hjälpa till med?'] };
    } },
  { keys: ['ensam', 'ensamhet', 'inga vänner', 'ingen vän', 'inga kompisar', 'utanför', 'ingen bryr', 'osynlig', 'ingen att prata', 'utfryst', 'själv hela tiden'],
    reply: () => {
      const mine = getSmallGroup(me.id);
      const g = mine ? null : (findGroup(x => isSmallGroup(x) && likesInterest(x)) || findGroup(isSmallGroup));
      return {
        html: pick(['Det låter jobbigt att känna sig ensam.', 'Tack för att du berättar. Ensamhet kan göra ont på riktigt.', 'Du är långt ifrån den enda som känner så.']) + ' ' +
          (mine ? 'Du har ju ' + link('grupper.html', mine.name) + ' som ses ' + whenText(nextMeeting(mine.id)).toLowerCase() + '. Kanske kan du skriva något i gruppchatten redan nu?'
                : g ? 'Många här har hittat sin plats i en liten grupp som ses varje vecka. ' + groupSentence(g) : '') +
          ' Du kan också läsa vad andra skriver i ' + link('amnen.html?amne=1', 'Ensamhet') + '.',
        actions: g ? [joinGroupAction(g)] : [],
        offer: { question: 'Vill du att jag tipsar om en aktivitet också?', yes: () => activityReply(a => a.is_safe_first_meet) },
        quick: ['Ja, tipsa om en aktivitet', 'Jag vill prata med en människa']
      };
    } },
  { keys: ['stress', 'stressad', 'prov', 'plugg', 'läxa', 'läxor', 'skola', 'betyg', 'deadline', 'pressad', 'hinner inte'],
    reply: () => {
      const g = findGroup(x => x.interest_id === 5);
      const a = findActivity(x => /plugg/i.test(x.title));
      return {
        html: pick(['Skolstress är jättevanligt, och det säger inget om hur duktig du är.', 'Det låter som mycket just nu.']) +
          ' Ett tips: skriv ner allt du måste göra och välj <em>en</em> sak att börja med. Ta korta pauser och ät ordentligt. ' +
          (g || a ? 'Det är lättare att plugga tillsammans' + (g ? ' i <strong>' + escapeHtml(g.name) + '</strong>' : '') + (a ? (g ? ' eller' : '') + ' på <strong>' + escapeHtml(a.title) + '</strong> ' + whenText(a.starts_at).toLowerCase() : '') + '. ' : '') +
          'I ' + link('amnen.html?amne=2', 'Stress och skola') + ' delar andra sina tips.',
        actions: [g && joinGroupAction(g), a && joinActivityAction(a)].filter(Boolean),
        quick: ['Jag sover dåligt också', 'Jag vill prata med en människa']
      };
    } },
  { keys: ['sova', 'sover', 'sömn', 'somna', 'vaken', 'mardröm', 'trött'],
    reply: () => ({
      html: 'Sömn kan vara svårt när tankarna snurrar. Några saker som hjälper många: skriv ner det du tänker på innan du lägger dig, lägg undan mobilen en halvtimme innan och försök gå och lägga dig samma tid varje kväll. ' +
        'Läs mer i ' + link('amnen.html?amne=5', 'Sömn') + '. Om det håller i sig länge kan du ringa ' + link('tel:1177', '1177') + ' för råd.',
      quick: ['Jag har mycket ångest', 'Tack!']
    }) },
  { keys: ['ångest', 'orolig', 'oro', 'panik', 'panikattack', 'nervös', 'rädd', 'hjärtklappning'],
    reply: () => {
      const g = findGroup(x => x.interest_id === 12);
      return {
        html: 'Oro och ångest kan kännas i hela kroppen, och det går över även om det inte känns så just då. ' +
          (g ? 'En lugn grupp kan vara skönt: ' + groupSentence(g) + ' ' : '') + 'Om det blir för mycket kan du prata med en volontär. ' + volunteerSentence(),
        actions: [volunteerAction(), g && joinGroupAction(g)].filter(Boolean),
        offer: { question: 'Vill du att vi andas tillsammans en stund?', yes: () => ({
          html: 'Okej, vi tar det lugnt. Andas in genom näsan och räkna till fyra. Håll andan och räkna till fyra. Andas ut genom munnen och räkna till sex. Gör det fem gånger. ' +
            'Titta sedan runt dig och hitta fem saker du ser, fyra saker du hör och tre saker du kan känna med händerna. Hur känns det nu?',
          quick: ['Lite bättre', 'Det känns fortfarande jobbigt'] }) },
        quick: ['Ja, gärna', 'Nej tack']
      };
    } },
  { keys: ['ledsen', 'dåligt', 'deppig', 'känner mig nere', 'är nere', 'gråter', 'gråta', 'tungt', 'jobbigt', 'inte bra', 'inte så bra', 'inte glad', 'orkar inte', 'fortfarande jobbigt'],
    reply: () => {
      const g = findGroup(x => x.interest_id === 12);
      return {
        html: pick(['Tack för att du berättar.', 'Det låter tungt.', 'Jag är glad att du skriver.']) + ' Det är okej att inte må bra, och du behöver inte klara allt själv. ' +
          volunteerSentence() + (g ? ' Du kan också gå med i en lugn grupp: ' + groupSentence(g) : '') +
          ' Om det känns akut, ring ' + link('tel:90101', '90101') + ' eller ' + link('tel:112', '112') + '.',
        actions: [volunteerAction(), g && joinGroupAction(g)].filter(Boolean),
        offer: { question: 'Vill du berätta vad som har hänt?', yes: () => ({
          html: 'Jag lyssnar. Skriv så mycket eller lite du vill. Kom ihåg att jag bara är en AI – en volontär kan lyssna på riktigt.', quick: [] }) },
        quick: ['Ja', 'Jag vill prata med en människa']
      };
    } },
  { keys: ['familj', 'föräldrar', 'mamma', 'pappa', 'bråk hemma', 'syskon', 'skilsmässa', 'skiljer sig'],
    reply: () => ({
      html: 'Det kan vara riktigt tufft när det är jobbigt hemma. Du förtjänar att ha det tryggt.' + brisSentence() +
        ' Om du inte är trygg hemma, ring ' + link('tel:112', '112') + '. Här på Link Up kan du läsa och skriva i ' + link('amnen.html?amne=3', 'Familj') + ' eller prata med en volontär.',
      actions: [volunteerAction()], quick: ['Jag vill prata med en människa']
    }) },
  { keys: ['mobbad', 'mobbning', 'mobbar', 'retas', 'kränkt', 'kränker', 'elaka', 'hatar mig', 'hånar'],
    reply: () => ({
      html: 'Ingen förtjänar att bli behandlad så, och det är inte ditt fel. Berätta för en vuxen du litar på, till exempel en lärare, kuratorn eller en förälder – skolan måste agera när någon blir kränkt.' + brisSentence() +
        ' Händer det på nätet: spara skärmbilder. Här på Link Up kan du blockera någon och rapportera med flaggan.',
      actions: [volunteerAction()], quick: ['Hur blockerar jag någon?', 'Hur rapporterar jag?']
    }) },
  { keys: ['kär', 'förälskad', 'dumpad', 'gjort slut', 'hjärtesorg', 'pojkvän', 'flickvän', 'crush', 'relation'],
    reply: () => ({
      html: 'Kärlek och hjärtesorg kan ta jättemycket plats, både när det är bra och när det gör ont. Det brukar hjälpa att prata av sig – med en kompis, i ' +
        link('amnen.html?amne=4', 'Vänskap') + ' eller med en volontär.',
      actions: [volunteerAction()], quick: ['Tips på något att göra']
    }) },
  { keys: ['ful', 'värdelös', 'duger inte', 'dålig på allt', 'hatar mig själv', 'självkänsla', 'självförtroende', 'misslyckad'],
    reply: () => ({
      html: 'Det låter som att du är väldigt hård mot dig själv. Du är mer än det du presterar och hur du ser ut. Ett litet tips: skriv ner tre saker du gjort bra idag, hur små de än är. ' +
        'Och prata gärna med någon om det. ' + volunteerSentence(),
      actions: [volunteerAction()], quick: ['Jag känner mig ensam']
    }) },
  { keys: ['arg', 'ilska', 'irriterad', 'förbannad', 'sur'],
    reply: () => {
      const r = activityReply(a => activityType(a) === 'ute');
      r.html = 'Det är okej att vara arg – det är en känsla som alla har. Det kan hjälpa att röra på sig eller skriva av sig. ' + r.html;
      return r;
    } },
  { keys: ['sorg', 'dog', 'död', 'dött', 'begravning', 'saknar'],
    reply: () => ({
      html: 'Jag är ledsen att höra det. Sorg tar tid och ser olika ut för alla, och alla känslor är okej. Du behöver inte bära det ensam. ' + volunteerSentence() +
        ' Du kan också skriva i ' + link('amnen.html?amne=7', 'Att må bättre') + '.',
      actions: [volunteerAction()], quick: []
    }) },
  { keys: ['alkohol', 'droger', 'knark', 'röka', 'snusa', 'fylla', 'berusad', 'banta', 'vikt', 'äter inte', 'tjock', 'smal', 'kroppen'],
    reply: () => ({
      html: 'Bra att du tar upp det, det är okej att fråga. Jag kan inte ge medicinska råd, men skolsköterskan eller ' + link('tel:1177', '1177') +
        ' kan hjälpa dig. Om någon är i fara, ring ' + link('tel:112', '112') + '.',
      actions: [volunteerAction()], quick: []
    }) },
  { keys: ['glad', 'toppen', 'jättebra', 'mår bra', 'najs', 'lite bättre', 'bättre nu'],
    reply: () => {
      const r = activityReply(() => true);
      r.html = pick(['Vad kul att höra!', 'Härligt!', 'Vad skönt!']) + ' Vill du sprida lite av det? Skriv något peppigt i ' + link('amnen.html?amne=7', 'Att må bättre') + '. Eller häng med på något: ' + r.html;
      return r;
    } },
  { keys: ['grupp', 'liten grupp', 'gå med'],
    reply: () => {
      const mine = getSmallGroup(me.id);
      const g = mine ? null : (findGroup(x => isSmallGroup(x) && likesInterest(x)) || findGroup(isSmallGroup));
      return {
        html: 'En liten grupp är 5–8 personer i din ålder som ses varje vecka, samma dag och tid. Ni har en egen gruppchatt och säger "Jag kommer" inför träffen. ' +
          (mine ? 'Din grupp är ' + link('grupper.html', mine.name) + ', och nästa träff är ' + whenText(nextMeeting(mine.id)).toLowerCase() + '.' : g ? groupSentence(g) : ''),
        actions: g ? [joinGroupAction(g)] : [], quick: ['Vad händer på första träffen?']
      };
    } },
  { keys: ['första träffen', 'första gången', 'vad händer', 'nervös inför'],
    reply: () => ({
      html: 'På en träff börjar ni oftast med en kort runda där alla säger hur veckan har varit – du får alltid säga "pass". En volontär är med de första gångerna. ' +
        'På träffar med märket Trygg första träff möter en volontär dig vid platsen, och du får ta med en kompis. Du kan gå när du vill.',
      quick: ['Tips på något att göra']
    }) },
  { keys: ['meddelande', 'meddelanden', 'inkorg', 'skriva till', 'dm', 'chatta med', 'mina samtal'],
    reply: () => {
      const unread = countUnread(me.id);
      return { html: 'Dina meddelanden finns under ' + link('samtal.html', 'Samtal') + '. Du hittar det i menyn under <strong>Utforska → Prata</strong>, eller på mobilen under <strong>Meny</strong>. ' +
        (unread ? 'Du har ' + unread + ' oläst' + (unread > 1 ? 'a' : '') + ' just nu.' : 'Du har inga olästa just nu.') };
    } },
  { keys: ['blockera', 'blocka', 'blockerad'],
    reply: () => ({ html: 'Tryck på <strong>Blockera</strong> under ett inlägg i Ämnen, eller överst i ett enskilt samtal. Personen får inte veta det. Du kan ta bort blockeringen på ' + link('min-sida.html', 'Min sida') + '.' }) },
  { keys: ['rapportera', 'anmäla', 'flagga'],
    reply: () => ({ html: 'Under varje inlägg i Ämnen finns knappen <strong>Rapportera</strong>. I chattarna trycker du på flaggan bredvid meddelandet. En moderator tittar på det, och den du rapporterar får inte veta att det var du.' }) },
  { keys: ['ljust', 'mörkt', 'tema', 'större text', 'textstorlek', 'liten text', 'svårt att läsa'],
    reply: () => ({
      html: 'Du kan byta till ljust läge och större text med knapparna <strong>Aa</strong> och solen högst upp (på mobilen ligger de i <strong>Meny</strong>), eller på ' + link('min-sida.html', 'Min sida') + '. Eller tryck här:',
      actions: [settingAction('theme'), settingAction('text')]
    }) },
  { keys: ['alias', 'anonym', 'vem ser', 'integritet', 'personuppgift', 'privat', 'sparas'],
    reply: () => ({ html: 'Andra ser bara ditt alias – aldrig ditt namn eller personnummer. Moderatorer läser bara det som någon rapporterat, eller som tyder på att någon är i fara. Och det vi skriver här sparas inte.' }) },
  { keys: ['säker', 'trygg', 'farligt', 'lita på', 'bankid'],
    reply: () => ({
      html: 'Link Up är byggt för att vara tryggt: alla loggar in med BankID och är minst 15 år, unga och vuxna har olika grupper, ett ordfilter stoppar elaka ord och moderatorer ser till att reglerna följs. ' +
        'Träffar med märket <strong>Trygg första träff</strong> är på en offentlig plats med en volontär, och du får ta med en kompis. ' + link('regler.html', 'Läs reglerna') + '.'
    }) },
  { keys: ['link up', 'linkup', 'vad är det här', 'vad kan man göra', 'var börjar', 'var finns', 'var hittar'],
    reply: () => ({
      html: 'Link Up har tre delar. <strong>Prata:</strong> ' + link('amnen.html', 'Ämnen') + ', ' + link('samtal.html', 'Samtal') + ' och jag. ' +
        '<strong>Träffas:</strong> ' + link('grupper.html', 'Grupper') + ', ' + link('aktiviteter.html', 'Aktiviteter') + ' och ' + link('lasstund.html', 'Lässtunder') + '. ' +
        '<strong>Om Link Up:</strong> ' + link('om-oss.html', 'Om oss') + ' och ' + link('regler.html', 'Regler') + '. Allt finns också samlat på ' + link('utforska.html', 'Utforska') + '. ' +
        'Vet du inte var du ska börja? Gå med i en liten grupp – det är hjärtat i Link Up.',
      quick: ['Hur funkar grupperna?', 'Tips på något att göra']
    }) },
  { keys: ['vem är du', 'vad är du', 'är du en människa', 'är du en ai', 'robot', 'linky'],
    reply: () => ({ html: 'Jag är Linky, en AI – inte en människa och inte vård. Jag letar efter ord i det du skriver och tipsar om grupper, aktiviteter och volontärer, eller hjälper dig hitta på sidan. Jag kan ha fel, jag ställer inga diagnoser och det vi skriver sparas inte.', quick: ['Vad kan du hjälpa till med?'] }) },
  { keys: ['hjälpa till med', 'vad kan du'],
    reply: () => ({ html: 'Jag kan föreslå en grupp eller en aktivitet som passar dig, hjälpa dig få kontakt med en volontär, ge några tips när det känns jobbigt och visa var saker finns på Link Up. Prova att skriva vad du känner eller vad du letar efter.', quick: DEFAULT_QUICK }) },
  { keys: ['mående', 'kurva', 'min sida'],
    reply: () => ({ html: 'Din mående-kurva finns på ' + link('min-sida.html', 'Min sida') + ', och du gör en mående-check på ' + link('index.html', 'startsidan') + '. Bara du ser den.' }) },
  { keys: ['prata', 'volontär', 'kurator', 'människa', 'vuxen', 'någon att', 'lyssna', 'samtal'],
    reply: () => {
      const free = freeStaff();
      return {
        html: 'Det är modigt att vilja prata med någon. ' + volunteerSentence() + ' Du kan också skriva enskilt med någon i din grupp under ' + link('samtal.html', 'Samtal') + '.',
        actions: [volunteerAction(free ? 'Skriv till ' + free.alias : 'Skicka förfrågan', free ? free.id : null)], quick: []
      };
    } },
  { keys: ['spel', 'gamer', 'gaming', 'game'],
    reply: () => {
      const g = findGroup(x => x.interest_id === 2);
      const r = activityReply(a => /spel/i.test(a.title));
      r.html = (g ? 'Spelkvällar är ett bra sätt att lära känna folk utan press. ' + groupSentence(g) + ' ' : '') + r.html;
      if (g) r.actions = [joinGroupAction(g)].concat(r.actions || []);
      return r;
    } },
  { keys: ['bok', 'böcker', 'läsa', 'läser', 'lässtund'],
    reply: () => {
      const a = nextReading();
      return { html: 'Då kanske du gillar lässtunden! ' + (a ? 'Nästa gång läser ' + escapeHtml(getAlias(a.created_by)) + ' högt ur <strong>' + escapeHtml(getBook(a.book_id).title) + '</strong> ' + whenText(a.starts_at).toLowerCase() + '. ' : '') +
        'Du kan lyssna, läsa själv i takt eller bara chatta. ' + link('lasstund.html', 'Gå till lässtunden') + '.',
        actions: a && !isParticipant(a.id, me.id) ? [joinActivityAction(a)] : [] };
    } },
  { keys: ['göra', 'tråkigt', 'aktivitet', 'träffa', 'träffas', 'ute', 'promenad', 'hitta på', 'något annat'],
    reply: ctx => activityReply(ctx.text.includes('online') ? a => activityType(a) === 'online' : ctx.text.includes('promenad') || ctx.text.includes(' ute ') ? a => activityType(a) === 'ute' : a => a.is_safe_first_meet) },
  { keys: ['vän', 'vänner', 'kompis', 'kompisar', 'ny skola', 'nya vänner', 'flyttat', 'vänskap'],
    reply: () => {
      const g = findGroup(x => isSmallGroup(x) && likesInterest(x)) || findGroup(isSmallGroup);
      return { html: 'Att hitta nya vänner tar tid, men det går! Många här har träffat sina kompisar i en liten grupp, där man ses samma människor varje vecka. ' + (g ? groupSentence(g) : '') +
        ' Läs också vad andra tipsar om i ' + link('amnen.html?amne=4', 'Vänskap') + '.', actions: g ? [joinGroupAction(g)] : [], quick: ['Tips på något att göra'] };
    } },
  { keys: ['tack', 'schysst', 'snällt'],
    reply: () => ({ html: pick(['Varsågod!', 'Så lite!', 'Alltid!']) + ' Jag finns här om du vill fråga något mer.' }) },
  { keys: ['hej', 'hallå', 'tja', 'tjena', 'hejsan', 'god morgon', 'godkväll'],
    reply: () => ({ html: 'Hej ' + escapeHtml(me.alias) + '! Vad vill du prata om?', quick: DEFAULT_QUICK }) }
];

// ---------- Förstå texten ----------

function wordsOf(text) { return text.toLowerCase().replace(/[^a-zåäöéü0-9 ]+/g, ' ').split(/\s+/).filter(Boolean); }

// Antal ändringar mellan två ord – används för att förstå stavfel
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

// Fraser letas i hela texten. Korta ord måste stämma exakt, längre ord får ha böjning (ensam → ensamma) eller ett stavfel.
function matches(key, text, words) {
  if (key.includes(' ')) return text.includes(' ' + key + ' ');
  return words.some(w => key.length <= 3 ? w === key :
    w.startsWith(key) || (key.length >= 5 && Math.abs(w.length - key.length) <= 1 && editDistance(w, key) <= 1));
}

function answer(raw) {
  const words = wordsOf(raw), text = ' ' + words.join(' ') + ' ';
  if (hasConcern(raw)) { offer = null; return concernReply(); }

  // Svar på något Linky har frågat om
  if (offer && YES.includes(words[0])) { const o = offer; offer = null; return o.yes(); }
  if (offer && (NO.includes(words[0]) || text.includes(' inte nu '))) {
    offer = null;
    return { html: pick(['Okej, det är helt lugnt.', 'Inga problem.']) + ' Säg till om du vill prata om något annat.', quick: DEFAULT_QUICK };
  }
  offer = null;

  let best = null, bestScore = 0;
  INTENTS.forEach(intent => {
    const score = intent.keys.filter(k => matches(k, text, words)).length;
    if (score > bestScore) { best = intent; bestScore = score; }
  });
  if (best) return best.reply({ text: text, words: words });
  return {
    html: pick(['Jag är inte säker på att jag förstod.', 'Hmm, det där förstod jag inte riktigt.']) + ' Jag är en enkel AI och kan ha fel. Kan du säga det på ett annat sätt, eller välja något här under?',
    quick: DEFAULT_QUICK
  };
}

// ---------- Visa samtalet ----------

function greeting() {
  const intro = 'Hej ' + escapeHtml(me.alias) + '! Jag heter Linky och är en <strong>AI – inte en människa och inte vård</strong>. Jag kan ha fel, jag ställer inga diagnoser och det vi skriver sparas inte.';
  const today = getMoodChecks(me.id).filter(m => !m.activity_id && dateKey(m.created_at) === dateKey(new Date())).pop();
  if (today && today.mood <= 2) {
    return { html: intro + ' Jag såg att du svarade <strong>' + MOOD_NAMES[today.mood] + '</strong> i mående-checken idag. Vill du prata om det?',
      offer: { question: 'Ska jag be en volontär höra av sig?', yes: () => volunteerAction().run() }, quick: ['Ja', 'Nej tack', 'Jag känner mig ensam'] };
  }
  const r = getReminders(me.id)[0];
  return { html: intro + (r ? ' Kom ihåg: <strong>' + escapeHtml(r.title) + '</strong> ' + whenText(r.starts_at).toLowerCase() + '.' : '') +
    ' Jag kan tipsa om grupper, aktiviteter och volontärer, eller hjälpa dig hitta på sidan. Vad vill du prata om?', quick: DEFAULT_QUICK };
}

function render() {
  const avatarL = '<span class="avatar sm" style="--hue:265" aria-hidden="true">L</span>';
  const list = $('#linky-messages');
  list.innerHTML = chat.map(m => {
    if (m.typing) return '<li class="msg">' + avatarL + '<div class="msg-bubble"><span class="msg-meta">Linky (AI)</span><p class="typing">Linky skriver<span>.</span><span>.</span><span>.</span></p></div></li>';
    if (!m.bot) return '<li class="msg msg-mine"><div class="msg-bubble"><span class="msg-meta">Du</span><p>' + escapeHtml(m.text) + '</p></div></li>';
    return '<li class="msg">' + avatarL + '<div class="msg-bubble"><span class="msg-meta">Linky (AI)</span><p>' + m.html + '</p>' +
      (m.actions.length ? '<div class="msg-actions">' + m.actions.map(id =>
        '<button type="button" class="btn btn-sm btn-secondary" data-action="' + id + '"' + (actions[id].done ? ' disabled' : '') + '>' + escapeHtml(actions[id].label) + '</button>').join('') + '</div>' : '') +
      '</div></li>';
  }).join('');
  $$('[data-action]', list).forEach(b => b.addEventListener('click', () => {
    const a = actions[Number(b.dataset.action)];
    if (a.done) return;
    a.done = true;
    botReply(a.run());
  }));
  list.scrollTop = list.scrollHeight;
}

function renderQuick(quick) {
  const box = $('#linky-suggestions');
  box.innerHTML = (quick || DEFAULT_QUICK).map(q => '<button type="button" class="chip">' + escapeHtml(q) + '</button>').join('');
  $$('.chip', box).forEach(b => b.addEventListener('click', () => userSay(b.textContent)));
}

function botSay(reply) {
  if (reply.offer) offer = reply.offer;
  const ids = (reply.actions || []).map(a => actions.push(a) - 1);
  chat.push({ bot: true, html: reply.html + (reply.offer ? ' ' + reply.offer.question : ''), actions: ids });
  render();
  renderQuick(reply.quick);
}

// Visa "Linky skriver..." en kort stund innan svaret
function botReply(reply) {
  chat.push({ typing: true });
  render();
  setTimeout(() => {
    chat.splice(chat.findIndex(m => m.typing), 1);
    botSay(reply);
  }, Math.min(1400, 450 + reply.html.length * 2));
}

function userSay(text) {
  if (!checkBeforePublish(text, $('#linky-notice'))) return;   // ordfilter + hjälpruta vid oroande ord
  chat.push({ bot: false, text: text.trim() });
  $('#linky-input').value = '';
  render();
  botReply(answer(text));
}

function initPage() {
  me = currentUser();
  botSay(greeting());
  $('#linky-form').addEventListener('submit', e => {
    e.preventDefault();
    userSay($('#linky-input').value);
  });
  $('#linky-clear').addEventListener('click', () => {
    chat.length = 0;
    actions.length = 0;
    suggested.clear();
    offer = null;
    botSay(greeting());
    $('#linky-input').focus();
  });
}
