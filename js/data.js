/* =========================================================
   Link Up – exempeldata och "databas"
   All data är påhittad. Den ligger i normaliserade tabeller
   (en array per tabell) och sparas i localStorage.
   Inget som kan räknas fram sparas – det sköts av hjälpfunktionerna längst ner.
   ========================================================= */

const DB_KEY = 'linkup_db_v2';

// Alla tabeller i databasen (se docs/databas.md)
const TABLES = [
  'users', 'interests', 'user_interests', 'topics', 'posts', 'replies',
  'support_reactions', 'groups', 'group_members', 'group_messages',
  'group_attendance', 'direct_messages', 'books', 'activities',
  'activity_participants', 'mood_checks', 'reports', 'blocks',
  'moderation_actions', 'volunteer_hours'
];

// ---------- Datumhjälp för exempeldatan ----------

// Tidpunkt relativt nu: dagar framåt (eller bakåt) och klockslag
function relDate(days, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  if (hour !== undefined) d.setHours(hour, minute || 0, 0, 0);
  return d.toISOString();
}

// En tidpunkt några veckor bakåt på en viss veckodag (0 = söndag)
function pastWeekday(weeksAgo, weekday, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7 - ((d.getDay() - weekday + 7) % 7));
  d.setHours(hour, minute || 0, 0, 0);
  return d.toISOString();
}

// ---------- Exempeldata ----------

function seedData() {
  return {
    users: [
      { id: 1, bankid_hash: 'bh_7f3a91', alias: 'Nattuggla', birth_date: '2009-03-14', role: 'member', created_at: relDate(-60) },
      { id: 2, bankid_hash: 'bh_2b8c44', alias: 'Molnet', birth_date: '2009-07-02', role: 'member', created_at: relDate(-90) },
      { id: 3, bankid_hash: 'bh_5e1d09', alias: 'Solros', birth_date: '2010-01-20', role: 'member', created_at: relDate(-45) },
      { id: 4, bankid_hash: 'bh_a4f3c2', alias: 'Kompassen', birth_date: '2009-11-05', role: 'member', created_at: relDate(-80) },
      { id: 5, bankid_hash: 'bh_66d0e1', alias: 'Tekoppen', birth_date: '2009-04-30', role: 'member', created_at: relDate(-120) },
      { id: 6, bankid_hash: 'bh_0c9b5a', alias: 'Vågen', birth_date: '2010-06-12', role: 'member', created_at: relDate(-30) },
      { id: 7, bankid_hash: 'bh_e7a213', alias: 'Stjärnfall', birth_date: '2009-09-09', role: 'member', created_at: relDate(-50) },
      { id: 8, bankid_hash: 'bh_31f8d6', alias: 'Löparen', birth_date: '2009-12-01', role: 'member', created_at: relDate(-70) },
      { id: 9, bankid_hash: 'bh_9d4b77', alias: 'Stormen', birth_date: '2009-02-02', role: 'member', created_at: relDate(-40) },
      { id: 10, bankid_hash: 'bh_v10s', alias: 'Volontär Sara', birth_date: '1998-05-18', role: 'volunteer', created_at: relDate(-200) },
      { id: 11, bankid_hash: 'bh_v11j', alias: 'Volontär Jonas', birth_date: '1995-10-03', role: 'volunteer', created_at: relDate(-180) },
      { id: 12, bankid_hash: 'bh_v12a', alias: 'Volontär Amina', birth_date: '2000-02-27', role: 'volunteer', created_at: relDate(-150) },
      { id: 13, bankid_hash: 'bh_k13e', alias: 'Kurator Elin', birth_date: '1985-08-21', role: 'counselor', created_at: relDate(-220) },
      { id: 14, bankid_hash: 'bh_c2e810', alias: 'Moderator Kim', birth_date: '1992-01-11', role: 'moderator', created_at: relDate(-240) }
    ],

    interests: [
      { id: 1, name: 'Promenader' }, { id: 2, name: 'Spel' }, { id: 3, name: 'Musik' },
      { id: 4, name: 'Böcker' }, { id: 5, name: 'Plugg' }, { id: 6, name: 'Film och serier' },
      { id: 7, name: 'Träning' }, { id: 8, name: 'Skapande' }, { id: 9, name: 'Natur' },
      { id: 10, name: 'Matlagning' }, { id: 11, name: 'Djur' }, { id: 12, name: 'Lugna samtal' }
    ],

    user_interests: [
      { user_id: 1, interest_id: 4 }, { user_id: 1, interest_id: 1 }, { user_id: 1, interest_id: 12 }, { user_id: 1, interest_id: 3 },
      { user_id: 2, interest_id: 2 }, { user_id: 2, interest_id: 3 }, { user_id: 2, interest_id: 12 },
      { user_id: 3, interest_id: 4 }, { user_id: 3, interest_id: 8 }, { user_id: 3, interest_id: 12 },
      { user_id: 4, interest_id: 1 }, { user_id: 4, interest_id: 5 }, { user_id: 4, interest_id: 9 },
      { user_id: 5, interest_id: 2 }, { user_id: 5, interest_id: 4 }, { user_id: 5, interest_id: 10 },
      { user_id: 6, interest_id: 3 }, { user_id: 6, interest_id: 11 }, { user_id: 6, interest_id: 12 },
      { user_id: 7, interest_id: 4 }, { user_id: 7, interest_id: 6 }, { user_id: 7, interest_id: 1 },
      { user_id: 8, interest_id: 7 }, { user_id: 8, interest_id: 1 }, { user_id: 8, interest_id: 3 },
      { user_id: 9, interest_id: 2 }, { user_id: 9, interest_id: 6 }, { user_id: 9, interest_id: 7 }
    ],

    topics: [
      { id: 1, name: 'Ensamhet' }, { id: 2, name: 'Stress och skola' }, { id: 3, name: 'Familj' },
      { id: 4, name: 'Vänskap' }, { id: 5, name: 'Sömn' }, { id: 6, name: 'Ångest och oro' },
      { id: 7, name: 'Att må bättre' }, { id: 8, name: 'Bara snack' }
    ],

    posts: [
      { id: 1, user_id: 2, topic_id: 1, body: 'Någon mer som känner sig ensam fast man har folk runt sig hela dagen? I skolan pratar jag med massor men på kvällen känns det tomt.', created_at: relDate(-3, 21, 12), removed_at: null },
      { id: 2, user_id: 3, topic_id: 2, body: 'Tre prov nästa vecka och jag vet inte var jag ska börja. Hur gör ni för att inte få panik?', created_at: relDate(-2, 17, 40), removed_at: null },
      { id: 3, user_id: 5, topic_id: 5, body: 'Har svårt att somna. Ligger och tänker på allt jag sagt under dagen. Några tips som faktiskt funkar?', created_at: relDate(-2, 23, 5), removed_at: null },
      { id: 4, user_id: 6, topic_id: 4, body: 'Bytte skola i höstas och känner inte riktigt någon än. Hur hittade ni nya vänner?', created_at: relDate(-1, 15, 30), removed_at: null },
      { id: 5, user_id: 4, topic_id: 7, body: 'Var på min första promenad med gruppen idag. Var jättenervös innan men det kändes bra efteråt. Vill bara säga att det är värt att testa!', created_at: relDate(-1, 18, 2), removed_at: null },
      { id: 6, user_id: 9, topic_id: 8, body: 'Ni som skriver här är så töntiga, skaffa ett liv istället.', created_at: relDate(-1, 20, 15), removed_at: null },
      { id: 7, user_id: 8, topic_id: 6, body: 'Allt känns tungt just nu och ibland vill jag inte leva längre. Vet inte vem jag ska prata med.', created_at: relDate(0, 8, 45), removed_at: null },
      { id: 8, user_id: 7, topic_id: 8, body: 'Köp billiga sneakers på min sida, skriv till mig så får ni länken!!!', created_at: relDate(0, 9, 30), removed_at: null },
      { id: 9, user_id: 1, topic_id: 3, body: 'Det är mycket bråk hemma just nu och jag stannar helst i skolan så länge det går. Är det fler som har det så?', created_at: relDate(-4, 19, 20), removed_at: null }
    ],

    replies: [
      { id: 1, post_id: 1, user_id: 1, body: 'Känner igen mig så mycket. Kvällarna är värst för mig också.', created_at: relDate(-3, 21, 40) },
      { id: 2, post_id: 1, user_id: 3, body: 'Samma här. Det hjälpte mig att gå med i en liten grupp, då vet man att man ses på tisdag i alla fall.', created_at: relDate(-3, 22, 10) },
      { id: 3, post_id: 2, user_id: 4, body: 'Skriv upp allt på en lapp och välj EN sak att börja med. Plugghjälpen ses på onsdagar om du vill plugga ihop!', created_at: relDate(-2, 18, 5) },
      { id: 4, post_id: 3, user_id: 10, body: 'Många tycker att det hjälper att skriva ner tankarna innan man lägger sig, så att de får "vila" på pappret. Och att lägga undan mobilen en stund innan.', created_at: relDate(-1, 9, 0) },
      { id: 5, post_id: 4, user_id: 2, body: 'Jag hittade mina bästa kompisar på en spelkväll här. Kom på fredag!', created_at: relDate(-1, 16, 12) },
      { id: 6, post_id: 7, user_id: 10, body: 'Tack för att du skriver det här, det är modigt. Du är inte ensam. Om du kan, ring Självmordslinjen på 90101 eller 112 om det är akut. Du kan också skicka en förfrågan till mig under Samtal så pratar vi.', created_at: relDate(0, 9, 5) },
      { id: 7, post_id: 9, user_id: 6, body: 'Ja, jag har det likadant ibland. Skönt att veta att man inte är den enda.', created_at: relDate(-4, 20, 0) }
    ],

    // type: 'hear' = Jag hör dig, 'not_alone' = Du är inte ensam
    support_reactions: [
      { user_id: 3, post_id: 1, type: 'hear', created_at: relDate(-3, 22, 0) },
      { user_id: 4, post_id: 1, type: 'not_alone', created_at: relDate(-3, 22, 30) },
      { user_id: 1, post_id: 5, type: 'hear', created_at: relDate(-1, 19, 0) },
      { user_id: 2, post_id: 9, type: 'not_alone', created_at: relDate(-4, 21, 0) }
    ],

    // Små grupper (max 8) ses varje vecka på samma veckodag och tid som de skapades.
    // min_age och max_age styr vilken åldersgrupp som får gå med (max_age null = ingen övre gräns).
    groups: [
      { id: 1, name: 'Tisdagsgänget', description: 'En lugn grupp som ses online varje tisdag och pratar om veckan. Ingen press att säga något.', interest_id: 12, max_members: 8, min_age: 15, max_age: 17, created_at: pastWeekday(10, 2, 18, 0) },
      { id: 2, name: 'Promenadgruppen Söder', description: 'Vi går en runda på Södermalm varje torsdag efter skolan. Samling vid Medborgarplatsen.', interest_id: 1, max_members: 8, min_age: 15, max_age: 17, created_at: pastWeekday(8, 4, 16, 30) },
      { id: 3, name: 'Lugna kvällar', description: 'Söndagskvällar med te, lugn musik och samtal i liten skala.', interest_id: 12, max_members: 6, min_age: 15, max_age: 17, created_at: pastWeekday(6, 0, 19, 0) },
      { id: 4, name: 'Spelkvällen', description: 'Vi spelar ihop online varje fredag. Alla nivåer är välkomna.', interest_id: 2, max_members: 8, min_age: 15, max_age: 17, created_at: pastWeekday(12, 5, 19, 0) },
      { id: 5, name: 'Plugghjälpen', description: 'Vi pluggar tillsammans på onsdagar och hjälper varandra med läxor.', interest_id: 5, max_members: 8, min_age: 15, max_age: 17, created_at: pastWeekday(9, 3, 15, 0) },
      { id: 6, name: 'Lässtundsgänget', description: 'Gruppen för alla som gillar lässtunderna. Här chattar vi under och efter läsningen.', interest_id: 4, max_members: 30, min_age: 15, max_age: null, created_at: pastWeekday(15, 0, 18, 0) },
      { id: 7, name: 'Musiknördar', description: 'Tipsa om låtar, prata om konserter och dela spellistor.', interest_id: 3, max_members: 25, min_age: 15, max_age: 17, created_at: pastWeekday(20, 6, 14, 0) },
      { id: 8, name: 'Kvällspromenad 18+', description: 'För dig som är 18 eller äldre. Vi går en lugn runda på onsdagskvällar.', interest_id: 1, max_members: 8, min_age: 18, max_age: null, created_at: pastWeekday(5, 3, 19, 0) }
    ],

    group_members: [
      { group_id: 1, user_id: 1, joined_at: relDate(-55) }, { group_id: 1, user_id: 2, joined_at: relDate(-70) },
      { group_id: 1, user_id: 3, joined_at: relDate(-40) }, { group_id: 1, user_id: 4, joined_at: relDate(-60) },
      { group_id: 1, user_id: 5, joined_at: relDate(-65) }, { group_id: 1, user_id: 6, joined_at: relDate(-25) },
      { group_id: 2, user_id: 7, joined_at: relDate(-45) }, { group_id: 2, user_id: 8, joined_at: relDate(-50) },
      { group_id: 2, user_id: 4, joined_at: relDate(-30) },
      { group_id: 3, user_id: 3, joined_at: relDate(-35) }, { group_id: 3, user_id: 6, joined_at: relDate(-20) },
      { group_id: 3, user_id: 7, joined_at: relDate(-40) },
      { group_id: 4, user_id: 2, joined_at: relDate(-80) }, { group_id: 4, user_id: 8, joined_at: relDate(-60) },
      { group_id: 4, user_id: 5, joined_at: relDate(-75) }, { group_id: 4, user_id: 9, joined_at: relDate(-35) },
      { group_id: 5, user_id: 4, joined_at: relDate(-60) }, { group_id: 5, user_id: 5, joined_at: relDate(-58) },
      { group_id: 6, user_id: 1, joined_at: relDate(-50) }, { group_id: 6, user_id: 3, joined_at: relDate(-40) },
      { group_id: 6, user_id: 5, joined_at: relDate(-90) }, { group_id: 6, user_id: 7, joined_at: relDate(-45) },
      { group_id: 6, user_id: 10, joined_at: relDate(-100) },
      { group_id: 7, user_id: 2, joined_at: relDate(-85) }, { group_id: 7, user_id: 6, joined_at: relDate(-28) },
      { group_id: 7, user_id: 8, joined_at: relDate(-66) }
    ],

    group_messages: [
      { id: 1, group_id: 1, user_id: 2, body: 'Hej allihop! Hur har veckan varit?', created_at: relDate(-2, 16, 0), removed_at: null },
      { id: 2, group_id: 1, user_id: 3, body: 'Lite stressig, men okej. Ser fram emot tisdag.', created_at: relDate(-2, 16, 20), removed_at: null },
      { id: 3, group_id: 1, user_id: 4, body: 'Samma! Någon som vill ta en promenad innan träffen?', created_at: relDate(-1, 12, 5), removed_at: null },
      { id: 4, group_id: 6, user_id: 10, body: 'Välkomna till lässtunden! Vi fortsätter med kapitel 3 i Ljuset över Ekön.', created_at: relDate(-1, 18, 0), removed_at: null },
      { id: 5, group_id: 6, user_id: 3, body: 'Älskar när det blir storm på ön, så mysigt att lyssna på.', created_at: relDate(-1, 18, 25), removed_at: null },
      { id: 6, group_id: 4, user_id: 8, body: 'Fredag kl 19 som vanligt?', created_at: relDate(-2, 10, 0), removed_at: null },
      { id: 7, group_id: 4, user_id: 9, body: 'Ni är så dåliga på spel att det är pinsamt att spela med er.', created_at: relDate(-1, 19, 30), removed_at: null },
      { id: 8, group_id: 3, user_id: 6, body: 'Orkar inte mer med allt just nu. Känns som att ingen skulle märka om jag var borta.', created_at: relDate(0, 7, 15), removed_at: null }
    ],

    // Vem som har sagt "Jag kommer" till en grupps veckoträff (meeting_date = datum för träffen)
    group_attendance: [
      { group_id: 1, user_id: 2, meeting_date: null }, { group_id: 1, user_id: 4, meeting_date: null }
    ],

    direct_messages: [
      { id: 1, sender_id: 2, receiver_id: 1, body: 'Hej! Tack för ditt svar i tråden om ensamhet. Skönt att inte vara själv om det.', created_at: relDate(-3, 22, 0), read_at: relDate(-3, 22, 30), removed_at: null },
      { id: 2, sender_id: 1, receiver_id: 2, body: 'Detsamma! Ses på tisdag?', created_at: relDate(-3, 22, 31), read_at: relDate(-3, 23, 0), removed_at: null },
      { id: 3, sender_id: 2, receiver_id: 1, body: 'Absolut, jag kommer!', created_at: relDate(-3, 23, 1), read_at: relDate(-2, 8, 0), removed_at: null },
      { id: 4, sender_id: 3, receiver_id: 1, body: 'Hej Nattuggla, vill du följa med på lässtunden på biblioteket?', created_at: relDate(0, 7, 50), read_at: null, removed_at: null }
    ],

    books: [
      { id: 1, title: 'Ljuset över Ekön', author: 'Maja Lindqvist' },
      { id: 2, title: 'Vinterbrev', author: 'Omar Haddad' }
    ],

    activities: [
      { id: 1, created_by: 10, title: 'Promenad runt Vasaparken', description: 'En lugn promenad på ungefär en timme. Vi pratar om allt och inget, eller går tyst om du vill.', location: 'Vasaparken, Stockholm (vid lekplatsen)', starts_at: relDate(2, 16, 0), max_participants: 10, is_safe_first_meet: true, book_id: null, created_at: relDate(-5) },
      { id: 2, created_by: 5, title: 'Spelkväll online', description: 'Vi spelar enkla partyspel tillsammans. Mikrofon behövs inte, du kan skriva i chatten.', location: 'Online', starts_at: relDate(1, 19, 0), max_participants: 12, is_safe_first_meet: false, book_id: null, created_at: relDate(-4) },
      { id: 3, created_by: 10, title: 'Lässtund: kapitel 3', description: 'Volontär Sara läser högt. Lyssna, läs med i din egen takt eller chatta.', location: 'Online', starts_at: relDate(4, 18, 0), max_participants: 20, is_safe_first_meet: false, book_id: 1, created_at: relDate(-6) },
      { id: 4, created_by: 4, title: 'Plugg på stadsbiblioteket', description: 'Ta med det du behöver plugga. Vi sitter tillsammans och tar fikapaus efter en timme.', location: 'Stadsbiblioteket, Odengatan 53', starts_at: relDate(5, 15, 0), max_participants: 8, is_safe_first_meet: true, book_id: null, created_at: relDate(-3) },
      { id: 5, created_by: 12, title: 'Fika och brädspel', description: 'Enkla brädspel och fika. Volontär Amina är på plats och tar emot vid dörren.', location: 'Ungdomens hus, Kungsgatan 12', starts_at: relDate(6, 17, 0), max_participants: 10, is_safe_first_meet: true, book_id: null, created_at: relDate(-2) },
      { id: 6, created_by: 10, title: 'Lässtund på biblioteket', description: 'Vi läser Ljuset över Ekön tillsammans i ett lugnt rum på biblioteket.', location: 'Stadsbiblioteket, läsrummet plan 2', starts_at: relDate(8, 17, 0), max_participants: 12, is_safe_first_meet: true, book_id: 1, created_at: relDate(-2) },
      { id: 7, created_by: 2, title: 'Morgonyoga i parken', description: 'Mjuk yoga för nybörjare. Ta med en filt eller matta.', location: 'Humlegården, vid statyn', starts_at: relDate(9, 10, 0), max_participants: 15, is_safe_first_meet: false, book_id: null, created_at: relDate(-1) },
      { id: 8, created_by: 10, title: 'Promenad i Humlegården', description: 'En lugn promenad med fika efteråt.', location: 'Humlegården, vid statyn', starts_at: relDate(-2, 16, 0), max_participants: 10, is_safe_first_meet: true, book_id: null, created_at: relDate(-9) }
    ],

    activity_participants: [
      { activity_id: 1, user_id: 4, joined_at: relDate(-4) }, { activity_id: 1, user_id: 8, joined_at: relDate(-3) },
      { activity_id: 1, user_id: 7, joined_at: relDate(-2) },
      { activity_id: 2, user_id: 2, joined_at: relDate(-3) }, { activity_id: 2, user_id: 5, joined_at: relDate(-3) },
      { activity_id: 2, user_id: 8, joined_at: relDate(-2) }, { activity_id: 2, user_id: 6, joined_at: relDate(-1) },
      { activity_id: 3, user_id: 1, joined_at: relDate(-5) }, { activity_id: 3, user_id: 3, joined_at: relDate(-5) },
      { activity_id: 3, user_id: 7, joined_at: relDate(-4) },
      { activity_id: 4, user_id: 5, joined_at: relDate(-2) },
      { activity_id: 5, user_id: 3, joined_at: relDate(-1) }, { activity_id: 5, user_id: 6, joined_at: relDate(-1) },
      { activity_id: 6, user_id: 7, joined_at: relDate(-1) },
      { activity_id: 2, user_id: 1, joined_at: relDate(-1) },
      { activity_id: 8, user_id: 1, joined_at: relDate(-6) }, { activity_id: 8, user_id: 4, joined_at: relDate(-5) },
      { activity_id: 8, user_id: 7, joined_at: relDate(-5) }
    ],

    // mood: 1 = Dåligt, 2 = Sådär, 3 = Okej, 4 = Bra, 5 = Toppen. activity_id är satt när checken gäller en aktivitet.
    mood_checks: [
      { id: 1, user_id: 1, mood: 2, created_at: relDate(-6, 9, 0), activity_id: null },
      { id: 2, user_id: 1, mood: 3, created_at: relDate(-5, 9, 0), activity_id: null },
      { id: 3, user_id: 1, mood: 3, created_at: relDate(-4, 9, 0), activity_id: null },
      { id: 4, user_id: 1, mood: 4, created_at: relDate(-3, 9, 0), activity_id: null },
      { id: 5, user_id: 1, mood: 2, created_at: relDate(-2, 9, 0), activity_id: null },
      { id: 6, user_id: 1, mood: 4, created_at: relDate(-1, 9, 0), activity_id: null }
    ],

    // En rapport gäller exakt ett av: post_id, group_message_id eller direct_message_id
    reports: [
      { id: 1, reporter_id: 1, post_id: 6, group_message_id: null, direct_message_id: null, reason: 'Kränkande', created_at: relDate(-1, 20, 30) },
      { id: 2, reporter_id: 2, post_id: 6, group_message_id: null, direct_message_id: null, reason: 'Kränkande', created_at: relDate(-1, 20, 50) },
      { id: 3, reporter_id: 3, post_id: 6, group_message_id: null, direct_message_id: null, reason: 'Otrevligt', created_at: relDate(-1, 21, 10) },
      { id: 4, reporter_id: 5, post_id: 8, group_message_id: null, direct_message_id: null, reason: 'Reklam eller spam', created_at: relDate(0, 9, 40) },
      { id: 5, reporter_id: 8, post_id: null, group_message_id: 7, direct_message_id: null, reason: 'Kränkande', created_at: relDate(-1, 19, 45) },
      { id: 6, reporter_id: 5, post_id: null, group_message_id: 7, direct_message_id: null, reason: 'Otrevligt', created_at: relDate(-1, 20, 0) }
    ],

    blocks: [
      { blocker_id: 1, blocked_id: 9, created_at: relDate(-1, 21, 0) }
    ],

    // action: 'remove', 'warn', 'suspend' eller 'dismiss' (Inget fel)
    moderation_actions: [
      { id: 1, moderator_id: 14, user_id: 9, action: 'warn', post_id: null, group_message_id: null, direct_message_id: null, reason: 'Otrevlig ton i gruppchatten', created_at: relDate(-10) },
      { id: 2, moderator_id: 14, user_id: 9, action: 'suspend', post_id: null, group_message_id: null, direct_message_id: null, reason: 'Upprepade kränkningar efter varning', created_at: relDate(-1, 22, 0) }
    ],

    // När volontärer och kurator brukar vara lediga (weekday 0 = söndag)
    volunteer_hours: [
      { user_id: 10, weekday: 0, start_hour: 8, end_hour: 23 }, { user_id: 10, weekday: 1, start_hour: 8, end_hour: 23 },
      { user_id: 10, weekday: 2, start_hour: 8, end_hour: 23 }, { user_id: 10, weekday: 3, start_hour: 8, end_hour: 23 },
      { user_id: 10, weekday: 4, start_hour: 8, end_hour: 23 }, { user_id: 10, weekday: 5, start_hour: 8, end_hour: 23 },
      { user_id: 10, weekday: 6, start_hour: 8, end_hour: 23 },
      { user_id: 11, weekday: 1, start_hour: 16, end_hour: 20 }, { user_id: 11, weekday: 3, start_hour: 16, end_hour: 20 },
      { user_id: 11, weekday: 4, start_hour: 16, end_hour: 20 },
      { user_id: 12, weekday: 6, start_hour: 12, end_hour: 18 }, { user_id: 12, weekday: 0, start_hour: 12, end_hour: 18 },
      { user_id: 13, weekday: 1, start_hour: 8, end_hour: 16 }, { user_id: 13, weekday: 2, start_hour: 8, end_hour: 16 },
      { user_id: 13, weekday: 3, start_hour: 8, end_hour: 16 }, { user_id: 13, weekday: 4, start_hour: 8, end_hour: 16 },
      { user_id: 13, weekday: 5, start_hour: 8, end_hour: 12 }
    ]
  };
}

// ---------- Ladda och spara ----------

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      TABLES.forEach(t => { if (!Array.isArray(data[t])) data[t] = []; });
      moveDatesForward(data);
      return data;
    }
  } catch (e) { /* localStorage kan vara blockerat – då används exempeldatan */ }
  const fresh = seedData();
  // Fyll i datum för de "Jag kommer" som finns i exempeldatan
  fresh.group_attendance.forEach(a => { a.meeting_date = dateKey(nextMeetingFrom(fresh.groups.find(g => g.id === a.group_id))); });
  saveDb(fresh);
  try { localStorage.setItem(DATE_KEY, dateKey(new Date())); } catch (e) { /* ignorera */ }
  return fresh;
}

// Exempeldatan följer med i tiden: alla tider flyttas fram lika många dagar som gått sedan sidan
// senast öppnades, så att aktiviteter och träffar inte "redan har varit" när man visar sidan senare.
const DATE_KEY = 'linkup_data_day';
const DATE_FIELDS = ['created_at', 'starts_at', 'joined_at', 'read_at', 'removed_at'];

function moveDatesForward(data) {
  const today = dateKey(new Date());
  let lastDay = null;
  try { lastDay = localStorage.getItem(DATE_KEY); } catch (e) { return; }
  // Äldre sparad data saknar dagen – räkna fram den från Nattuggla som skapades 60 dagar innan exempeldatan
  if (!lastDay) {
    const first = data.users.find(u => u.id === 1);
    if (first) { const d = new Date(first.created_at); d.setDate(d.getDate() + 60); lastDay = dateKey(d); }
    else lastDay = today;
  }
  const days = Math.round((new Date(today) - new Date(lastDay)) / 86400000);
  if (days > 0) {
    const weeks = Math.floor(days / 7) * 7;   // grupper flyttas hela veckor så att träffdagen är samma
    const shift = (value, n) => { const d = new Date(value); d.setDate(d.getDate() + n); return d.toISOString(); };
    TABLES.forEach(t => data[t].forEach(row => {
      const n = t === 'groups' || t === 'group_attendance' ? weeks : days;
      DATE_FIELDS.forEach(f => { if (row[f]) row[f] = shift(row[f], n); });
      if (row.meeting_date) row.meeting_date = dateKey(shift(row.meeting_date + 'T12:00:00', n));
    }));
    saveDb(data);
  }
  try { localStorage.setItem(DATE_KEY, today); } catch (e) { /* ignorera */ }
}

function saveDb(data) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(data || db)); } catch (e) { /* ignorera */ }
}

// Återställ all exempeldata
function resetDb() {
  try { localStorage.removeItem(DB_KEY); } catch (e) { /* ignorera */ }
  db = loadDb();
}

// Nästa lediga id i en tabell
function nextId(table) {
  return db[table].reduce((max, row) => Math.max(max, row.id || 0), 0) + 1;
}

// Lägg till en rad (får id automatiskt om tabellen har id-kolumn) och spara
function insertRow(table, row, withId) {
  if (withId !== false) row = Object.assign({ id: nextId(table) }, row);
  db[table].push(row);
  saveDb();
  return row;
}

// Ta bort rader som matchar ett villkor och spara
function deleteRows(table, test) {
  db[table] = db[table].filter(row => !test(row));
  saveDb();
}

function nowIso() { return new Date().toISOString(); }

// Datum som text "ÅÅÅÅ-MM-DD" (lokal tid)
function dateKey(date) {
  const d = new Date(date);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// ---------- Hjälpfunktioner (allt som räknas fram) ----------

function getUser(userId) { return db.users.find(u => u.id === userId) || null; }
function getAlias(userId) { const u = getUser(userId); return u ? u.alias : 'Okänd'; }
function getUserByBankId(hash) { return db.users.find(u => u.bankid_hash === hash) || null; }
function getUserByAlias(alias) { return db.users.find(u => (u.alias || '').toLowerCase() === alias.toLowerCase()) || null; }

// Ålder räknas fram från födelsedatum
function getAgeFromBirthDate(birthDate) {
  const b = new Date(birthDate), now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
function getAge(userId) { const u = getUser(userId); return u ? getAgeFromBirthDate(u.birth_date) : null; }

// Avstängd = senaste avstängning finns för användaren
function isSuspended(userId) {
  return db.moderation_actions.some(a => a.user_id === userId && a.action === 'suspend');
}
function countWarnings(userId) {
  return db.moderation_actions.filter(a => a.user_id === userId && a.action === 'warn').length;
}

// Åldersgrupper: unga 15–17 och vuxna 18+ hålls isär i grupper och enskilda samtal
function isUnder18(userId) { return getAge(userId) < 18; }
function ageGroupLabel(userId) { return isUnder18(userId) ? '15–17 år' : '18 år och äldre'; }
function isStaff(userId) { const u = getUser(userId); return !!u && u.role !== 'member'; }
// Medlemmar får bara skriva enskilt med någon i samma åldersgrupp, eller med volontär, kurator och moderator
function canMessage(fromId, toId) { return isStaff(fromId) || isStaff(toId) || isUnder18(fromId) === isUnder18(toId); }

function roleLabel(role) {
  return { member: 'Medlem', volunteer: 'Volontär', counselor: 'Kurator', moderator: 'Moderator' }[role] || role;
}

// Intressen och ämnen
function getInterestName(id) { const i = db.interests.find(x => x.id === id); return i ? i.name : ''; }
function getTopicName(id) { const t = db.topics.find(x => x.id === id); return t ? t.name : ''; }
function getUserInterestIds(userId) { return db.user_interests.filter(ui => ui.user_id === userId).map(ui => ui.interest_id); }

// Inlägg
function getPost(postId) { return db.posts.find(p => p.id === postId) || null; }
function countReplies(postId) { return db.replies.filter(r => r.post_id === postId).length; }
function countPostsInTopic(topicId) { return db.posts.filter(p => p.topic_id === topicId && isPostVisible(p.id)).length; }
function hasReacted(userId, postId, type) {
  return db.support_reactions.some(r => r.user_id === userId && r.post_id === postId && r.type === type);
}

// Rapporter och moderering. field = 'post_id', 'group_message_id' eller 'direct_message_id'
function getReports(field, id) { return db.reports.filter(r => r[field] === id); }
function countReports(postId) { return getReports('post_id', postId).length; }
function hasReportedField(userId, field, id) { return db.reports.some(r => r.reporter_id === userId && r[field] === id); }
function hasReported(userId, postId) { return hasReportedField(userId, 'post_id', postId); }
function latestReportTime(field, id) {
  return getReports(field, id).reduce((max, r) => r.created_at > max ? r.created_at : max, '');
}
// En moderator har tittat om det finns en åtgärd efter senaste rapporten
function isReviewed(field, id) {
  const last = latestReportTime(field, id);
  return db.moderation_actions.some(a => a[field] === id && a.created_at >= last);
}
function isPostReviewed(postId) { return isReviewed('post_id', postId); }
// Chattmeddelanden döljs som inlägg: 3 eller fler rapporter och ingen moderator har tittat
function isMessageHidden(field, id) { return getReports(field, id).length >= 3 && !isReviewed(field, id); }
// Dolt = 3 eller fler rapporter och ingen moderator har tittat ännu
function isPostHidden(postId) { return countReports(postId) >= 3 && !isPostReviewed(postId); }
function isPostRemoved(postId) { const p = getPost(postId); return !!(p && p.removed_at); }
function isPostVisible(postId) { return !isPostRemoved(postId) && !isPostHidden(postId); }

// Blockeringar
function isBlocked(blockerId, blockedId) {
  return db.blocks.some(b => b.blocker_id === blockerId && b.blocked_id === blockedId);
}

// Grupper
function getGroup(groupId) { return db.groups.find(g => g.id === groupId) || null; }
function countMembers(groupId) { return db.group_members.filter(m => m.group_id === groupId).length; }
function getGroupMemberIds(groupId) { return db.group_members.filter(m => m.group_id === groupId).map(m => m.user_id); }
function isMember(groupId, userId) { return db.group_members.some(m => m.group_id === groupId && m.user_id === userId); }
function isSmallGroup(group) { return group.max_members <= 8; }
function fitsAgeRange(group, userId) {
  const age = getAge(userId);
  return age >= group.min_age && (group.max_age === null || age <= group.max_age);
}
function ageRangeLabel(group) {
  return group.max_age === null ? group.min_age + ' år och äldre' : group.min_age + '–' + group.max_age + ' år';
}
function getUserGroups(userId) { return db.groups.filter(g => isMember(g.id, userId)); }
// Din lilla grupp = första lilla gruppen du är med i
function getSmallGroup(userId) { return getUserGroups(userId).find(isSmallGroup) || null; }
// Föreslå en liten grupp som matchar dina intressen och din ålder och har plats kvar
function suggestGroup(userId) {
  const interests = getUserInterestIds(userId);
  const options = db.groups.filter(g => isSmallGroup(g) && !isMember(g.id, userId) && fitsAgeRange(g, userId) && countMembers(g.id) < g.max_members);
  return options.filter(g => interests.includes(g.interest_id)).sort((a, b) => countMembers(b.id) - countMembers(a.id))[0] || options[0] || null;
}

// Nästa veckoträff räknas fram från gruppens veckodag och klockslag
function nextMeetingFrom(group) {
  const start = new Date(group.created_at);
  const next = new Date();
  next.setHours(start.getHours(), start.getMinutes(), 0, 0);
  let diff = (start.getDay() - next.getDay() + 7) % 7;
  if (diff === 0 && next < new Date()) diff = 7;
  next.setDate(next.getDate() + diff);
  return next;
}
function nextMeeting(groupId) { return nextMeetingFrom(getGroup(groupId)); }
function isAttending(groupId, userId) {
  const key = dateKey(nextMeeting(groupId));
  return db.group_attendance.some(a => a.group_id === groupId && a.user_id === userId && a.meeting_date === key);
}
function countAttending(groupId) {
  const key = dateKey(nextMeeting(groupId));
  return db.group_attendance.filter(a => a.group_id === groupId && a.meeting_date === key).length;
}

// Personer du delar grupp med (för enskilda samtal)
function getGroupmateIds(userId) {
  const ids = new Set();
  getUserGroups(userId).forEach(g => getGroupMemberIds(g.id).forEach(id => { if (id !== userId) ids.add(id); }));
  return [...ids];
}

// Aktiviteter
function getActivity(activityId) { return db.activities.find(a => a.id === activityId) || null; }
function countParticipants(activityId) { return db.activity_participants.filter(p => p.activity_id === activityId).length; }
function isParticipant(activityId, userId) { return db.activity_participants.some(p => p.activity_id === activityId && p.user_id === userId); }
function isActivityFull(activityId) { const a = getActivity(activityId); return a && countParticipants(activityId) >= a.max_participants; }
function getBook(bookId) { return db.books.find(b => b.id === bookId) || null; }
// Typ räknas fram: lässtund om det finns en bok, online om platsen är online, annars ute
function activityType(activity) {
  if (activity.book_id) return 'lasstund';
  if (/^online/i.test(activity.location)) return 'online';
  return 'ute';
}
function upcomingActivities() {
  const now = nowIso();
  return db.activities.filter(a => a.starts_at >= now).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}
// Veckans lässtund = nästa aktivitet med en bok
function nextReading() { return upcomingActivities().find(a => a.book_id) || null; }

// Antal dagar från idag (0 = idag, 1 = imorgon)
function dayDiff(date) {
  const a = new Date(date), b = new Date();
  a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0);
  return Math.round((a - b) / 86400000);
}
// Påminnelser om gruppträffar och aktiviteter idag eller imorgon
function getReminders(userId) {
  const list = [];
  getUserGroups(userId).forEach(g => {
    const d = nextMeeting(g.id);
    if (dayDiff(d) <= 1) list.push({ title: g.name, starts_at: d.toISOString(), href: 'grupper.html?grupp=' + g.id, groupId: g.id });
  });
  upcomingActivities().filter(a => isParticipant(a.id, userId) && dayDiff(a.starts_at) <= 1)
    .forEach(a => list.push({ title: a.title, starts_at: a.starts_at, href: 'aktiviteter.html', groupId: null }));
  return list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}
// Aktiviteter du var med på de senaste två veckorna men inte har berättat hur de var
function activitiesToRate(userId) {
  const now = nowIso(), from = new Date(Date.now() - 14 * 86400000).toISOString();
  return db.activities.filter(a => a.starts_at < now && a.starts_at > from && isParticipant(a.id, userId) &&
    !db.mood_checks.some(m => m.user_id === userId && m.activity_id === a.id));
}

// Direktmeddelanden
function getConversation(userA, userB) {
  return db.direct_messages
    .filter(m => (m.sender_id === userA && m.receiver_id === userB) || (m.sender_id === userB && m.receiver_id === userA))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}
function countUnread(receiverId, senderId) {
  return db.direct_messages.filter(m => m.receiver_id === receiverId && m.read_at === null && (senderId === undefined || m.sender_id === senderId)).length;
}

// Volontärer: ledig nu räknas fram från tiderna i volunteer_hours
function isAvailableNow(userId, date) {
  const d = date || new Date();
  return db.volunteer_hours.some(h => h.user_id === userId && h.weekday === d.getDay() && d.getHours() >= h.start_hour && d.getHours() < h.end_hour);
}
function nextAvailable(userId) {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  for (let i = 1; i <= 24 * 7; i++) {
    d.setHours(d.getHours() + 1);
    if (isAvailableNow(userId, d)) return new Date(d);
  }
  return null;
}

// Mående
function getMoodChecks(userId) {
  return db.mood_checks.filter(m => m.user_id === userId).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

// Databasen laddas direkt när filen körs
let db = loadDb();
