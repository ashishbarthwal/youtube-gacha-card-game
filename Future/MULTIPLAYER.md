# Multiplayer — parked notes

**Status: not planned, not in scope.** This file exists so the thinking isn't lost.
Nothing here is a commitment. If multiplayer ever gets green-lit, it comes after
WP0/WP1/WP4, reopens locked decision #3 (client-side only) and the scope boundaries
(battles, server persistence), and needs DECISIONS.md entries at that time.
Researched 2026-07.

---

## The one insight that matters

Battles in this game are **auto-resolved** (ATK vs DEF, deterministic). That makes
"multiplayer" an *autobattler*: an opponent is a **stored deck, not a live connection**.
No websockets, no rooms, no presence, no simultaneous-online requirement. Wikigacha's
"Single Random Battle" almost certainly works this way. Every design below flows from
this.

A second structural gift: a card is fully derivable from `(channel id, set version)`.
Decks are ~100 characters of data. Battle results are recomputable by anyone from
public inputs.

## The ladder (cheapest → fanciest)

### Rung 0 — Challenge links: multiplayer with no server ($0 forever)

- Encode a 5-card deck (channel ids + set version) in a URL.
- Both clients resolve the battle deterministically — RNG seeded from a hash of both
  decks — so both sides compute the identical result. No trust, no server, no data
  sent anywhere.
- Does NOT violate locked decision #3. Could ship as a WP5-tier feature whenever.
- Shareable challenge links are exactly the viral mechanic that spread Wikigacha.
- Cannot do: leaderboards, stranger matchmaking (no shared state).

### Rung 1 — One Cloudflare Worker + D1: leaderboards + ghost battles ($0 → $5/mo)

Three endpoints:
- `POST /deck` — store deck (channel ids + set version + display name)
- `POST /battle` — server picks a stored stranger's deck ("ghost"), runs the same
  deterministic sim, records result, adjusts Elo
- `GET /leaderboard` — top N

Free tier: 100K req/day, D1 5M row reads/day. 100 players × 50 battles/day = 5K req/day
= 5% of free tier. Thousands of DAU before the $5/mo Workers paid tier.

Why this design is unusually clean here:
- **Anti-cheat for free.** Server re-derives card stats from the published set JSON and
  re-runs the pure battle sim — every result is verifiable by re-simulation. Clients
  can fake a local collection but cannot fake wins. (Strong portfolio artifact for an
  SDET: server-side verification via deterministic re-simulation, with tests.)
- **ToS-clean storage.** Server stores only channel *ids* (persistent identifiers are
  exempt from YouTube's 30-day rule) — never statistics. Stats always re-derived from
  the current printing. Compliance surface does not grow.

Identity: anonymous UUID in localStorage + chosen display name. No accounts, no email,
no passwords. Needs: profanity filter on names, a delete endpoint.

### Rung 2 — Live spectated 1v1 (still ~$0 at hobby scale, real work)

Durable Objects or PartyKit rooms (Cloudflare, free tiers), or Firebase RTDB (free to
100 concurrent). Buys *spectacle only* — resolution is deterministic anyway, so this
rung is theater (shared reveal, turn timers). Skip unless the drama demands it.

## Cost table

| Option | Leaderboard | 1v1 | Cost at ~100 players | Cost if viral |
|---|---|---|---|---|
| Challenge links (no server) | ✗ | async, friends | $0 | $0 |
| CF Worker + D1 | ✓ | async ghost battles + Elo | $0 | $5/mo |
| Durable Objects / PartyKit | ✓ | live realtime | $0 | ~$5–20/mo |
| VPS + Colyseus/Nakama | ✓ | live realtime | $5/mo min | scales up |

## Battle sim sketch (whenever it happens)

- Pure function in core: `resolveBattle(deckA, deckB, seed) -> { rounds[], winner }`.
  Same function client-side (challenge links) and server-side (verification).
- Seed = hash(deckA + deckB [+ battle id]) → deterministic, replayable, testable.
- Suggested shape: best-of-5 card duels, ATK vs DEF with the rarity multiplier already
  baked into stats. Keep it dumb; the cards are the content.

## Caveats recorded so future-us doesn't rediscover them

- Any shared state = moderation duty (display names on a public leaderboard).
- Cheating can't fully die: the client computes pulls, so god-collections can be faked
  locally. Ghost verification means faked *wins* can't. Stakes are zero; that's enough.
- No monetization stance is unaffected — nothing here may ever cost players money
  (locked decision #1 stands regardless).
- Storing user data (decks, names) adds a deletion obligation (7-day window per
  Google's policies if any YouTube-linked user data is involved; do it anyway).
