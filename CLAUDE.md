# Project Guide — Volleyball Tournament

Context document for AI coding assistants (Claude Code, Cursor, etc.) and humans working on this codebase. Place at repo root.

---

## What this project is

A single-day, multi-church volleyball tournament site for the **ZCA Conference 2026**. One React app carries the event across its whole lifecycle, switching behavior automatically based on the clock:

1. **Before** — capture free-agent registrations, count down to the deadline.
2. **Game day** — run the tournament: schedule, live scores, standings, and an MVP vote.
3. **After** — push everyone to MVP voting and show final standings.

The app is **phase-driven**: a single `phase` value (computed from the current time vs. fixed dates) decides which tabs exist, where a visitor lands, and how the header looks.

**Tournament facts:**
- **Date:** July 10, 2026, 9:00 AM – 5:00 PM EDT
- **Location:** 8500 Ridgelys Run Rd, Jessup, MD 20794
- **Registration deadline:** June 14, 2026, 11:59 PM EDT
- **MVP voting opens:** July 10, 2026, 12:00 PM EDT
- **Divisions:** Men's and Women's. **All times Eastern.**

### Registration model

Teams and free agents are handled differently:

- **Teams are admin-only.** Captains phone the organizer (number in the header); the organizer adds the team from the **Team List** tab while signed in. There is **no public team signup, no player roster, and no edit code** — a team row is a church + division + optional captain name + optional phone.
- **Free agents are the only public signup.** A solo player picks church + division, enters name + phone, and is listed for ad-hoc grouping.

> Earlier versions let captains self-register a roster and manage it with an `XXXX-YYYY` edit code. That flow — plus the `players` roster, `edit_code` column, the *Manage Team* tab, and the *Scoreboard* counter strip — has been **removed**. Don't reintroduce them.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + a centralized design-token object (`C` in `src/lib/constants.js`) |
| Icons | `lucide-react` |
| Backend | Supabase (Postgres + Auth + Realtime) |
| Hosting | Vercel (auto-deploy on push to `main`) |
| Env | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env.local` |

No router. Single-page app using local `tab` state. No global state library, no TypeScript, no PropTypes.

---

## Directory structure

```
src/
├── App.jsx                 ← Orchestrator. Owns tab, session, registrations, countdown, phase gating.
├── main.jsx                ← React entry point (StrictMode root).
├── index.css               ← Tailwind directives + globals.
│
├── components/
│   ├── auth/
│   │   └── LoginModal.jsx          Supabase email/password modal for admin sign-in.
│   ├── header/
│   │   └── CountdownBanner.jsx     Phase-aware countdown (rendered only in the two pre-event phases).
│   ├── inputs/
│   │   ├── NameInput.jsx           Text input; uses sanitizeNameInput.
│   │   └── PhoneInput.jsx          Phone input; uses sanitizePhoneInput + formatPhone.
│   ├── shared/
│   │   ├── ChoiceCard.jsx          Selectable card primitive.
│   │   ├── FormBlock.jsx           Labeled form section wrapper.
│   │   ├── Status.jsx              LoadingState / EmptyState.
│   │   └── TabButton.jsx           Main nav tab button.
│   └── views/
│       ├── RegisterForm.jsx        Free-agent signup (free agents only).
│       ├── ConfirmScreen.jsx       Post-submit "You're In" screen for free agents.
│       ├── RosterView.jsx          Public team list + admin "Add Team" panel.
│       ├── FreeAgentsView.jsx      Public list of free agents.
│       ├── ScheduleView.jsx        Separate Men's/Women's columns, per-game times (clock-ordered), live scores, admin scoring, standings table.
│       ├── VoteView.jsx            MVP poll, tap-to-vote, write-ins, admin moderation.
│       ├── InfoView.jsx            Static info: format, date, address, time.
│       └── RegistrationClosedView.jsx   Fallback if the register tab is reached when closed.
│
├── hooks/
│   ├── useCountdown.js     Ticks every second; returns { phase, target, now, ...timeFields }.
│   ├── useMatches.js       Loads matches + Realtime; optimistic updateMatch.
│   └── useMvp.js           Loads MVP votes + Realtime; optimistic castVote / approveVote / deleteVote.
│
└── lib/
    ├── constants.js        CHURCHES, event dates, MVP_VOTE_OPEN, color tokens (C).
    ├── helpers.js          Pure utilities (see "Helpers").
    ├── phase.js            getPhase(now) + isRegistrationOpen / isEventLive / isEventComplete.
    └── supabase.js         Configured Supabase client (singleton).
```

### Removed — do not reintroduce
`components/views/ManageTeamFlow.jsx`, `components/header/ScoreboardStats.jsx`, the `players` and `edit_code` columns, and `generateEditCode()` in `helpers.js`.

---

## Phases and the phase-driven UI

`getPhase(now)` returns `{ phase, target }`:

| Phase | When | `target` |
|---|---|---|
| `pre_registration` | now < June 14, 2026 11:59 PM EDT | `REGISTRATION_DEADLINE` |
| `pre_event` | deadline passed, before game day | `EVENT_START` |
| `live` | July 10, 9 AM – 5 PM EDT | `EVENT_END` |
| `complete` | after 5 PM EDT on game day | `null` |

`useCountdown()` also returns `now` (the `Date` it's using, override-aware) so callers can gate on specific clock times — that's how MVP voting opens at noon during the `live` phase.

### Tab visibility, landing, and header by phase

The public follows the flow below; **the admin keeps every management tab open at all times** (each gate is `… || isAdmin`). `MVP_VOTE_OPEN` is noon on game day.

| | pre_registration | pre_event | live | complete |
|---|---|---|---|---|
| **Register** | yes | admin only | admin only | admin only |
| **Team List** | yes | yes | yes | yes |
| **Free Agents** | yes | admin only | admin only | admin only |
| **Schedule** | admin only | yes | yes | yes |
| **MVP Vote** | — | — | from **noon** | yes |
| **Info** | yes | yes | yes | yes |
| **Default landing** | Register | Team List | Schedule | **MVP Vote** |
| **Header** | full + countdown | full + countdown | full, **no banner** | full, **"Go Vote for MVP!"** |

Mechanics in `App.jsx`:
- Visibility flags: `showRegister = isPre || isAdmin`, `showRoster = true`, `showFreeAgents = isPre || isAdmin`, `showSchedule = !isPre || isAdmin`, `showVote = votingOpen || isAdmin` (where `votingOpen = countdown.now >= MVP_VOTE_OPEN`).
- `defaultTabFor(phase)` returns the landing tab; a `prevPhase` ref re-lands the user whenever the phase rolls over (e.g. 9 AM arrives) — no reload needed.
- A guard effect bounces off any now-hidden tab to the phase default.
- The `CountdownBanner` renders only when `isPre || isPreEvent`. After the event, the header subhead becomes a clickable "Go Vote for MVP!" that jumps to the vote tab.
- The header is always rendered (the live window is a full header minus the banner, not a hidden header).

### Registration kinds
`registrations.kind` is `"team"` or `"free_agent"`. Team rows: `church`, `division`, optional `captain_name`, optional `phone`. Free-agent rows: `church`, `division`, `player_name`, optional `phone`.

### Admin mode
A Supabase auth session = admin (no role table; presence of `session` is the whole check). Admin can register/add anytime, remove registrations, run the schedule (scores, times, team names), and moderate MVP votes. RLS enforces write access at the `authenticated` role, so admin-only is real at the DB layer, not just the UI.

---

## Helpers (`lib/helpers.js`)
`splitChurch(full)` -> `{ name, location }` (splits on em-dash or hyphen). `sanitizePhoneInput` (digits, max 10). `formatPhone` (`(XXX) XXX-XXXX`). `sanitizeNameInput` (strips digits). `teamHeadcount` remains but is vestigial (always 1 now).

---

## Database (Supabase)

Three tables. Each has its own `supabase-*.sql` file; run all three.

### `registrations` (`supabase-schema.sql`)
`id`, `kind` (`team`/`free_agent`), `church`, `division` (`mens`/`womens`), `captain_name`, `player_name`, `phone`, `created_at`.
**RLS:** public select; **anon insert only `free_agent`**; authenticated insert any; authenticated update/delete.

### `matches` (`supabase-matches.sql`)
`id`, `division` (`mens`/`womens`), `court` (`A`/`B`), `phase` (`round_robin`/`third_place`/`final`), `slot_index` (0–7), `start_minute` (minutes after midnight, EDT), `team_a`, `team_b` (text, nullable = TBD), `sets` (jsonb `[[a,b],...]`), `created_at`.
**RLS:** public select; authenticated insert/update/delete.
Seeded with the fixed 16-game fixture (placeholder `M1..M4`/`W1..W4`; playoff rows start TBD).

### `mvp_votes` (`supabase-mvp.sql`)
`id`, `player_name`, `team`, `voter_token`, `status` (`approved`/`pending`), `created_at`.
**RLS:** **anon selects only `approved`**, authenticated selects all; anon may insert `approved` or `pending`; authenticated insert/update/delete.

### Realtime
Enable replication (Supabase -> Database -> Replication) on **all three** tables. Each is watched by a `postgres_changes` channel that reloads on change. The "lock it down" step (drop any testing-only public insert/delete policies) applies before going live.

---

## The schedule (`ScheduleView.jsx` + `useMatches.js`)

Court A is the Men's division, Court B the Women's. Four teams per division play a full round robin (6 games each), then a third-place game and a championship.

- **Layout:** the two divisions are **separate, independent columns** — Men's (Court A) and Women's (Court B), side by side on the "All" view (each full-width when filtered). They are no longer paired into shared "rounds"; the men's and women's schedules are unrelated lists.
- **Filter bar:** All / Men (Court A) / Women (Court B) / **Table** (standings).
- **Time** is **per game** and lives **on each card** (shown large under the court/division label, with the round/phase as a small secondary tag). Each game owns its own `start_minute`. Admin ±15-minute steppers sit **on each card** and move **that single game only** — men's and women's are independent, and no two games are linked.
- **Ordering follows the clock:** within each division, games are sorted by `start_minute`, with `slot_index` as a tiebreak for equal times. So retiming a game **re-sorts it into place automatically**. Because round numbers come from `slot_index` (not time), the "Round N" tag can appear out of numeric order once a game is moved — time is the spine, the round number is just a label.
- **Scores** are best-of-3, **free entry** (no validation). A match is **Final** automatically once a side reaches 2 set wins, **Live** once any score is entered, otherwise **Upcoming** — status is derived, never stored.
- **Admin editing:** team-name fields and three set-score rows per game, committed with a **Submit** button (button flashes "Saved"). The card's own score previews as you type; the standings table updates on Submit. Edits are optimistic via `updateMatch`, so they apply instantly and sync after.
- **Standings (Table):** two tables, Men's on top. Columns: **P** (matches played), **W**, **L**, **Sets** (set-win–set-loss), **PTS Ratio** (points for / against). Ranked by wins -> set ratio -> point ratio. Only **decided round-robin** games count. Teams are grouped by name **trimmed and case-insensitive** (so `Bethel` = `bethel`).
- **Playoffs** start as TBD; the admin types the finalists by hand (standings inform seeding — there is no auto-seed yet).

---

## MVP vote (`VoteView.jsx` + `useMvp.js`)

Opens at noon on game day (`MVP_VOTE_OPEN`) and stays open afterward; admins see it any time. Results are public immediately as **percentages** (Player A 5 / Player B 5 -> 50% / 50%), each with a bar.

- **Tap-to-vote** on a listed candidate inserts an **approved** vote — no review.
- **Write-in** (player name + a team from the men's-team dropdown) inserts a **pending** vote; it appears only after an admin approves it. The team dropdown is the men's team names from `matches`, de-duplicated case-insensitively.
- **Admin moderation:** a pending queue with **Approve** / **X**. Approving merges into an existing candidate when name+team already exists (trimmed, case-insensitive) — i.e. +1 to that tally — otherwise it becomes a new candidate. Admins also have a direct **Add a vote** form (for paper/in-person votes) and per-candidate **+1 / −1**.
- **Uniqueness:** a random token in `localStorage` (`zca_mvp_token`) plus a `zca_mvp_voted` flag -> one vote per browser. Best-effort, not airtight (clearing storage or switching devices defeats it) — acceptable for this event. `localStorage` works in the deployed app; it's only disabled inside Claude's artifact preview sandbox.
- Casts/approvals/deletes are **optimistic** in `useMvp`, so a tap updates the poll instantly; Realtime reconciles for other viewers.

---

## Data flow

`App.jsx` owns `registrations` (loaded once, kept fresh by a Realtime channel) and passes it to views. The schedule and MVP features each own their data through a dedicated hook (`useMatches`, `useMvp`) with its own Realtime channel — a deliberate, localized exception to the "App owns all data" rule, since those datasets are only used by one view each. `countdown` drives `phase`, which drives all gating.

---

## Design system

Aesthetic: **vintage sports program / scoreboard** — cream paper, ink, rust accents, uppercase tracked micro-text, italic serif subheads. Tailwind handles layout; colors and type use inline `style` referencing `C.*` tokens (don't migrate these into the Tailwind theme). Add new colors to `C` in `constants.js`.

Tokens (`C`): `cream #F1EADA`, `paper #F8F2E2`, `ink #0E1A33`, `inkSoft #1F2D4F`, `rust #C84E2E`, `rustDark #A53D21`, `olive #5C6B3A`, `line #D9CFB8`, `warn/warnBg`, `ok #2D5A3D / okBg #DDF1DE`, `live #1A7F4F / liveBg`, `gold #B8860B / goldBg`.
Fonts (via `index.html`): **Bebas Neue** (display) and **Newsreader** italic (subheads).

---

## Conventions
- Inline styles for color/type tokens, Tailwind for layout.
- Tab-based navigation: a new screen = a tab value, a `TabButton` (gated as needed), a render block, and an entry in the guard's visibility map.
- `App.jsx` owns registrations; `matches`/`mvp_votes` live in their own hooks.
- All times Eastern; event dates are UTC `Date`s with EDT-equivalent comments in `constants.js`.
- `Free Agents` is a real church option (last in `CHURCHES`); don't filter it out.

## Testing phase transitions
Append `?t=<ISO date>` to freeze the clock (override-aware in `useCountdown`):
- `?t=2026-06-20T10:00:00-04:00` -> pre_event (Team List landing)
- `?t=2026-07-10T10:00:00-04:00` -> live, before noon (no MVP tab yet)
- `?t=2026-07-10T12:30:00-04:00` -> live, MVP voting open
- `?t=2026-07-10T18:00:00-04:00` -> complete (MVP landing, "Go Vote for MVP!")

## Working in this codebase
```bash
npm install
npm run dev       # localhost:5173
npm run build
npm run preview
```
Push to `main` -> Vercel auto-deploys.

**Common edits:** churches -> `CHURCHES`; dates -> `REGISTRATION_DEADLINE` / `EVENT_START` / `EVENT_END` / `MVP_VOTE_OPEN`; display copy -> `EVENT_*` in `constants.js`; phase logic -> `getPhase` in `phase.js`; schedule fixture -> re-seed `matches`.

## Roadmap / not yet built
- **Auto-seed the playoffs** from final round-robin standings (currently manual).
- **Stronger vote integrity** (route all public votes through pending; or soft-key on name+phone) if ballot-stuffing becomes a concern.
- **Post-event recap** surface (champions/standings highlight) beyond the MVP landing.