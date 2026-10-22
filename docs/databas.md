# Databas – Link Up

All data i prototypen är påhittad. Den ligger i `js/data.js` som **normaliserade tabeller** (en array per tabell) och sparas i webbläsarens `localStorage` under nyckeln `linkup_db_v1`. Knappen **Återställ exempeldata** på Min sida laddar om exempeldatan.

## Regler vi följer

- Tabellnamn i plural, fältnamn på engelska med små bokstäver.
- Ingen uppgift sparas på två ställen. Andra tabeller pekar på en rad med dess `id`.
- Inga listor i fält. Varje N:M-relation har en egen kopplingstabell.
- Inget sparas som kan räknas fram. Det sköts av hjälpfunktioner i `js/data.js`.

## Tabeller

PK = primärnyckel, FK = främmande nyckel (pekar på en annan tabell).

### users
| Fält | Typ | Beskrivning |
|---|---|---|
| id | heltal, PK | |
| bankid_hash | text, unik | Påhittad hash från BankID. Gör att samma person inte kan skapa två konton. |
| alias | text, unik | Det enda andra ser. |
| birth_date | datum | Ålder räknas fram härifrån. |
| role | text | `member`, `volunteer`, `counselor` eller `moderator` |
| created_at | tidpunkt | |

### interests
| Fält | Typ | Beskrivning |
|---|---|---|
| id | heltal, PK | |
| name | text, unik | T.ex. Promenader, Spel, Böcker |

### user_interests (koppling users ↔ interests)
| Fält | Typ |
|---|---|
| user_id | FK → users |
| interest_id | FK → interests |

PK = (user_id, interest_id)

### topics
| Fält | Typ |
|---|---|
| id | heltal, PK |
| name | text, unik |

### posts
| Fält | Typ | Beskrivning |
|---|---|---|
| id | heltal, PK | |
| user_id | FK → users | Vem som skrev |
| topic_id | FK → topics | |
| body | text | |
| created_at | tidpunkt | |
| removed_at | tidpunkt eller null | Sätts när en moderator tar bort inlägget |

### replies
| Fält | Typ |
|---|---|
| id | heltal, PK |
| post_id | FK → posts |
| user_id | FK → users |
| body | text |
| created_at | tidpunkt |

### support_reactions (koppling users ↔ posts)
| Fält | Typ | Beskrivning |
|---|---|---|
| user_id | FK → users | |
| post_id | FK → posts | |
| type | text | `hear` (Jag hör dig) eller `not_alone` (Du är inte ensam) |
| created_at | tidpunkt | |

PK = (user_id, post_id, type). Antal reaktioner visas aldrig och sparas inte.

### groups
| Fält | Typ | Beskrivning |
|---|---|---|
| id | heltal, PK | |
| name | text, unik | |
| description | text | |
| interest_id | FK → interests | |
| max_members | heltal | Grupper med max 8 räknas som "små grupper" |
| created_at | tidpunkt | Veckodag och klockslag för veckoträffen räknas fram härifrån |

### group_members (koppling users ↔ groups)
| Fält | Typ |
|---|---|
| group_id | FK → groups |
| user_id | FK → users |
| joined_at | tidpunkt |

PK = (group_id, user_id)

### group_messages
| Fält | Typ |
|---|---|
| id | heltal, PK |
| group_id | FK → groups |
| user_id | FK → users |
| body | text |
| created_at | tidpunkt |

### group_attendance (koppling users ↔ veckoträff) – *tillägg*
| Fält | Typ | Beskrivning |
|---|---|---|
| group_id | FK → groups | |
| user_id | FK → users | |
| meeting_date | datum | Datum för träffen personen sagt "Jag kommer" till |

PK = (group_id, user_id, meeting_date). Behövs för knappen **Jag kommer**.

### direct_messages
| Fält | Typ | Beskrivning |
|---|---|---|
| id | heltal, PK | |
| sender_id | FK → users | |
| receiver_id | FK → users | |
| body | text | |
| created_at | tidpunkt | |
| read_at | tidpunkt eller null | null = oläst |

### books
| Fält | Typ |
|---|---|
| id | heltal, PK |
| title | text |
| author | text |

### activities
| Fält | Typ | Beskrivning |
|---|---|---|
| id | heltal, PK | |
| created_by | FK → users | |
| title | text | |
| description | text | |
| location | text | "Online" betyder att aktiviteten är online |
| starts_at | tidpunkt | |
| max_participants | heltal | |
| is_safe_first_meet | sant/falskt | Trygg första träff |
| book_id | FK → books eller null | Finns en bok är det en lässtund |
| created_at | tidpunkt | |

### activity_participants (koppling users ↔ activities)
| Fält | Typ |
|---|---|
| activity_id | FK → activities |
| user_id | FK → users |
| joined_at | tidpunkt |

PK = (activity_id, user_id)

### mood_checks
| Fält | Typ | Beskrivning |
|---|---|---|
| id | heltal, PK | |
| user_id | FK → users | |
| mood | heltal 1–5 | 1 Dåligt, 2 Sådär, 3 Okej, 4 Bra, 5 Toppen |
| created_at | tidpunkt | |

### reports
| Fält | Typ | Beskrivning |
|---|---|---|
| id | heltal, PK | |
| reporter_id | FK → users | |
| post_id | FK → posts | |
| reason | text | |
| created_at | tidpunkt | |

(reporter_id, post_id) är unika tillsammans – man kan bara rapportera ett inlägg en gång.

### blocks (koppling users ↔ users)
| Fält | Typ |
|---|---|
| blocker_id | FK → users |
| blocked_id | FK → users |
| created_at | tidpunkt |

PK = (blocker_id, blocked_id)

### moderation_actions
| Fält | Typ | Beskrivning |
|---|---|---|
| id | heltal, PK | |
| moderator_id | FK → users | |
| user_id | FK → users | Den som åtgärden gäller |
| action | text | `remove`, `warn`, `suspend` eller `dismiss` (Inget fel) |
| post_id | FK → posts eller null | |
| reason | text | |
| created_at | tidpunkt | |

### volunteer_hours – *tillägg*
| Fält | Typ | Beskrivning |
|---|---|---|
| user_id | FK → users | Volontär eller kurator |
| weekday | heltal 0–6 | 0 = söndag |
| start_hour | heltal | |
| end_hour | heltal | |

Används för att räkna fram om en volontär är **ledig nu** eller **senare**.

## Tillägg utöver uppgiften

Två tabeller har lagts till för att funktionerna ska gå att bygga utan att spara uträknade värden:

- `group_attendance` – vem som sagt "Jag kommer" till en veckoträff.
- `volunteer_hours` – när volontärer och kurator brukar vara lediga.

## Sådant som räknas fram (sparas inte)

| Vad | Hjälpfunktion |
|---|---|
| Alias från id | `getAlias(userId)` |
| Ålder | `getAge(userId)` / `getAgeFromBirthDate(date)` |
| Om en användare är avstängd | `isSuspended(userId)` – finns en `suspend` i moderation_actions |
| Antal deltagare | `countParticipants(activityId)` |
| Om en aktivitet är full | `isActivityFull(activityId)` |
| Antal medlemmar | `countMembers(groupId)` |
| Antal rapporter | `countReports(postId)` |
| Om ett inlägg är dolt | `isPostHidden(postId)` – 3 eller fler rapporter och ingen moderatoråtgärd efter senaste rapporten |
| Om ett inlägg är granskat | `isPostReviewed(postId)` |
| Nästa veckoträff | `nextMeeting(groupId)` |
| Hur många som kommer | `countAttending(groupId)` |
| Typ av aktivitet (Ute, Online, Lässtund) | `activityType(activity)` |
| Veckans lässtund | `nextReading()` |
| Olästa meddelanden | `countUnread(receiverId, senderId)` |
| Ledig nu / nästa lediga tid | `isAvailableNow(userId)` / `nextAvailable(userId)` |
| Oroande inlägg | `hasConcern(text)` i `js/app.js` |

## Relationer i korthet

```
users ─< posts ─< replies
users ─< support_reactions >─ posts
users ─< reports >─ posts
users ─< user_interests >─ interests
interests ─< groups ─< group_members >─ users
groups ─< group_messages, groups ─< group_attendance
users ─< activities ─< activity_participants >─ users
books ─< activities
users ─< direct_messages (sender_id, receiver_id)
users ─< mood_checks, users ─< blocks, users ─< moderation_actions
users ─< volunteer_hours
```
