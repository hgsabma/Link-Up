# Link Up – Du är inte ensam.

Link Up är en klickbar prototyp av en trygg digital mötesplats för unga från 15 år. Det som gör Link Up unikt är **gemenskap som håller över tid**: en liten grupp på 5–8 personer som ses varje vecka, och aktiviteter där man faktiskt träffas – inte bara korta stödsamtal.

Link Up är **inte vård** och ställer aldrig diagnoser. Vid akut fara: ring 112. Råd om vård: 1177. Minds Självmordslinjen: 90101.

Ett skolprojekt i kursen Digitalt skapande på Hitachigymnasiet, gjort av Leon, Reda, Sabri och Mikael.

> **Allt är påhittat.** BankID-inloggningen, AI-stödet Linky, volontärerna och all data är påhittade. Inget kopplas till riktiga BankID, ingen riktig AI används och ingenting skickas till någon server. All data sparas bara i din egen webbläsare (localStorage).

## Öppna sidan

### Lokalt
1. Ladda ner eller klona repot.
2. Dubbelklicka på `index.html` så öppnas sidan i webbläsaren. Ingen server eller installation behövs.

### Via GitHub Pages
1. Gå till repot på GitHub → **Settings** → **Pages**.
2. Välj **Deploy from a branch**, branch **main** och mappen **/ (root)**. Spara.
3. Efter någon minut finns sidan på `https://<ditt-användarnamn>.github.io/<repots-namn>/`.

## Testanvändare

På sidan **Logga in** väljer du vem du vill logga in som. Efter "Öppna BankID-appen" loggas du in automatiskt efter 2 sekunder.

| Testperson | Vad som händer |
|---|---|
| **Vanlig användare** – Nattuggla, 17 år | Loggas in direkt. Har en liten grupp (Tisdagsgänget), samtal och mående-historik. |
| **Ny användare** – 16 år | Hamnar på Första besöket: välj alias, minst tre intressen och godkänn reglerna. |
| **Under 15 år** – 13 år | Nekas med ett vänligt meddelande och tips om Bris på 116 111. |
| **Moderator** – Moderator Kim | Får tillgång till Moderator-sidan. |
| **Avstängd användare** – Stormen | Nekas. Kan inte heller skapa ett nytt konto eftersom inloggningen sker med BankID. |

Vill du börja om? Klicka **Återställ exempeldata** på Min sida.

## Sidor

| Sida | Fil | Innehåll |
|---|---|---|
| Startsida | `index.html` | "Du är inte ensam.", mående-check, tre startkort, populära ämnen, kommande aktiviteter, veckans lässtund och hjälpruta |
| Logga in | `logga-in.html` | Fejkad BankID-inloggning med testpersoner |
| Första besöket | `forsta-besoket.html` | Alias, intressen och regler |
| Utforska | `utforska.html` | Översikt över allt på Link Up |
| Ämnen | `amnen.html` | Inlägg och svar, stödreaktioner utan siffror, rapportera och blockera |
| Grupper | `grupper.html` | Din lilla grupp (medlemmar, nästa träff, Jag kommer, gruppchatt) och sök fler grupper |
| Aktiviteter | `aktiviteter.html` | Filter, Jag vill vara med, Trygg första träff och skapa aktivitet |
| Lässtund | `lasstund.html` | Veckans bok, simulerad uppläsning, Läs själv i takt, Jag vill läsa högt och chatt |
| Samtal | `samtal.html` | Mina samtal och Prata med en volontär |
| Linky | `linky.html` | Regelbaserad AI-chatt som föreslår grupper, aktiviteter eller volontärer |
| Min sida | `min-sida.html` | Alias, mående-kurva, intressen, grupper, aktiviteter, blockeringar och inställningar |
| Moderator | `moderator.html` | Rapporterade och oroande inlägg, Ta bort / Varna / Stäng av / Inget fel |
| Om oss | `om-oss.html` | Vilka vi är och vad vi står för |
| Regler | `regler.html` | Hur vi behandlar varandra |
| Sök | `sok.html` | Sökresultat från sökfältet i menyn |

## Trygghet och moderering

- **Ordfilter** stoppar svordomar och kränkande ord i inlägg, svar och alla chattar, och visar en vänlig påminnelse om reglerna.
- **Oroande ord** (t.ex. "vill inte leva", "ta mitt liv") öppnar hjälprutan direkt, och inlägget hamnar först på moderatorsidan.
- **Inlägg med 3 eller fler rapporter** döljs tills en moderator har tittat på dem.
- **Mående-check:** väljer man Dåligt eller Sådär föreslås lugna grupper, en volontär och stödlinjer.
- Knappen **Behöver du hjälp nu?** finns på alla sidor och visar 112, 1177 och 90101.

## Tillgänglighet

- Ljust läge och större text (knapparna **Aa** och sol/måne i menyn, eller på Min sida). Valen sparas.
- Tydlig fokusmarkering för tangentbord, "Hoppa till innehållet"-länk, riktiga knappar och länkar.
- Alla knappar är minst 44 px höga. Ikonerna är egna SVG:er, inga emojis.
- På mobil blir menyn en rad med ikoner längst ner: Hem, Ämnen, Grupper, Aktiviteter, Min sida.

## Teknik och mappar

Vanlig HTML, CSS och JavaScript – inga ramverk, inga npm-paket, ingen server och inga API:er. Typsnittet Inter hämtas från Google Fonts (utan internet används systemets typsnitt).

```
index.html, logga-in.html, ...   sidorna
css/style.css                    all design
js/data.js                       databasen: tabeller, exempeldata och hjälpfunktioner
js/app.js                        gemensamt: meny, inloggning, ordfilter, hjälpruta, tema
js/<sida>.js                     kod för varje sida
img/logo.svg, img/favicon.svg    logga
docs/databas.md                  beskrivning av databasen
```

Läs mer om tabellerna i [docs/databas.md](docs/databas.md).
