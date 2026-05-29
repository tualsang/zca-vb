# Project Guide — Volleyball Tournament

Context document for AI coding assistants (Claude Code, Cursor, etc.) and humans working on this codebase. Place at repo root.

---

## What this project is

A single-day, multi-church volleyball tournament site for the **ZCA Conference 2026**. It serves three distinct moments:

1. **Before the tournament** — generate excitement, capture free-agent registrations, show a live countdown to the registration deadline.
2. **Tournament day** — switch to a celebratory "live" banner; signup is closed.
3. **After the tournament** — wind-down state with a thank-you message; countdown is gone.

The app is **phase-driven**: a single `phase` value (computed from the current time vs. fixed event dates) governs which views are shown, whether public registration is open, and what the header looks like.

**Tournament facts:**
- **Date:** July 10, 2026, 9:00 AM – 5:00 PM EDT
- **Location:** 8700 Old Annapolis Road, Ellicott City, MD 21043
- **Registration deadline:** June 14, 2026, 11:59 PM EDT
- **Divisions:** Men's and Women's
- **All times in Eastern.**

### Registration model (IMPORTANT — this changed)

There are two row kinds, but only one public path:

- **Teams are admin-only.** Captains do **not** self-register. They phone the organizer (number shown in the header), and the organizer adds the team from the **Team List** tab while signed in as admin. There is **no player roster** and **no edit code** — a team row is just a church + division + optional captain name + optional phone.
- **Free agents are the only public signup.** A solo player picks their church and division, enters name + phone, and is listed for auto-grouping into ad-hoc squads.

> Historical note: earlier versions let captains self-register a full roster and receive an `XXXX-YYYY` edit code to manage it later. That flow (and the `players` roster, `edit_code`, and the *Manage Team* tab) has been **removed**. See "Removed / deprecated" below.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS, plus a centralized design-token object (`C` in `src/lib/constants.js`) |
| Icons | `lucide-react` |
| Backend | Supabase (Postgres + Auth + Realtime) |
| Hosting | Vercel (auto-deploy on push to `main`) |
| Env | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in `.env.local` |

No router. Single-page app using local `tab` state for navigation. No global state library — `App.jsx` holds the canonical state and passes props down.

---

## Directory structure

```
src/
├── App.jsx                 ← Orchestrator. Owns tab, session, registrations, countdown.
├── main.jsx                ← React entry point (StrictMode root).
├── index.css               ← Tailwind directives + globals.
│
├── components/
│   ├── auth/
│   │   └── LoginModal.jsx          Supabase email/password modal for admin sign-in.
│   ├── header/
│   │   └── CountdownBanner.jsx     Renders the live phase-aware countdown.
│   ├── inputs/
│   │   ├── NameInput.jsx           Reusable text input. Uses sanitizeNameInput.
│   │   └── PhoneInput.jsx          Phone input. Uses sanitizePhoneInput + formatPhone.
│   ├── shared/
│   │   ├── ChoiceCard.jsx          Selectable card primitive.
│   │   ├── FormBlock.jsx           Labeled form section wrapper.
│   │   ├── Status.jsx              LoadingState / EmptyState helpers.
│   │   └── TabButton.jsx           Main nav tab button.
│   └── views/
│       ├── RegisterForm.jsx        Free-agent signup form (free agents only).
│       ├── ConfirmScreen.jsx       Post-submit "You're In" screen for free agents.
│       ├── RosterView.jsx          Public team list + admin "Add Team" panel.
│       ├── FreeAgentsView.jsx      Public list of free agents.
│       ├── InfoView.jsx            Static info: format, date, address, time.
│       └── RegistrationClosedView.jsx   Shown when phase has moved past signup.
│
├── hooks/
│   └── useCountdown.js     Ticks every second; returns { phase, target, ...timeFields }.
│
└── lib/
    ├── constants.js        CHURCHES list, event dates, color tokens (C).
    ├── helpers.js          Pure utilities (see "Helpers" below).
    ├── phase.js            getPhase(now) + isRegistrationOpen / isEventLive / isEventComplete.
    └── supabase.js         Configured Supabase client (singleton).
```

### Removed / deprecated

These existed in earlier versions and should **not** be reintroduced:

- `components/views/ManageTeamFlow.jsx` — captain edit-code roster editor. **Delete.** Not imported anywhere in `App.jsx`; it was the last consumer of `edit_code` and `team.players`.
- `components/header/ScoreboardStats.jsx` — Players / Teams / Free agents counter strip. **Orphaned.** Not imported anywhere; the header shows counts inline on the tab buttons instead. Safe to delete.
- `players` jsonb column and `edit_code` column — dropped from the schema.
- `generateEditCode()` in `helpers.js` — now dead. The `kind === "team"` edit-code branch in `App.jsx`'s `addRegistration` is also dead (free agents always produce a `null` code, so it never inserts the dropped column). Both can be stripped on the next cleanup pass.

---

## Core concepts

### Phases

`getPhase(now)` returns `{ phase, target }` where `target` is the next deadline (or `null` when complete):

| Phase | When | `target` | Public can register? |
|---|---|---|---|
| `pre_registration` | now < June 14, 2026 11:59 PM EDT | `REGISTRATION_DEADLINE` | ✅ Yes (free agents) |
| `pre_event` | deadline passed, event not started | `EVENT_START` | ❌ No (admin can) |
| `live` | July 10, 2026, 9 AM – 5 PM EDT | `EVENT_END` | ❌ No |
| `complete` | after 5 PM EDT on tournament day | `null` | ❌ No |

Convenience predicates from `phase.js`: `isRegistrationOpen`, `isEventLive`, `isEventComplete`.

Admins (signed-in users) **bypass the phase gate** for registration — `canShowRegisterForm = registrationOpenForPublic || isAdmin` in `App.jsx`. This lets the organizer add late free agents from their phone.

### Registration kinds

The `registrations` table has a `kind` discriminator: `"team"` or `"free_agent"`.

- **Team rows** (admin-created): `church`, `division`, optional `captain_name`, optional `phone`.
- **Free-agent rows** (public): `church`, `division`, `player_name`, optional `phone`.

`teamHeadcount(team)` still exists in `helpers.js` and returns `(team.players?.length || 0) + 1`. With the roster gone this always returns `1`, so it is harmless but no longer meaningful — treat a team as a single unit.

### Admin mode

A Supabase auth session = admin. There is no role table — presence of `session` is the entire check. Admin powers:

- Register during any phase
- Add team rows (RosterView "Add Team" panel)
- Delete any registration (`removeRegistration`)
- "Admin" badge in the header, "Sign Out" link in the footer

At the DB level (see RLS below), team inserts, updates, and deletes are restricted to the `authenticated` role, so admin-only is enforced server-side, not just in the UI.

---

## Helpers (`lib/helpers.js`)

All pure functions, no side effects:

| Function | Purpose |
|---|---|
| `splitChurch(full)` | Splits `"Name — Location"` or `"Name - Location"` into `{ name, location }`. Handles em-dash and hyphen with surrounding spaces. |
| `sanitizePhoneInput(value)` | Digits only, max 10. |
| `formatPhone(digits)` | Formats as `(XXX) XXX-XXXX`, handles partial input progressively. |
| `sanitizeNameInput(value)` | Strips digits from name fields. |
| `teamHeadcount(team)` | `(team.players?.length \|\| 0) + 1`. Always `1` now; vestigial. |
| `generateEditCode(churchName)` | **Dead.** Roster/edit-code flow removed. Slated for deletion. |

Phone is stored in its own `phone` column (text, formatted via `formatPhone`) on both free-agent and team rows.

---

## Database (Supabase)

Schema lives in `supabase-schema.sql`. Confirmed columns on `registrations`:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (default `gen_random_uuid()`) | Primary key |
| `kind` | text | CHECK: `'team'` or `'free_agent'` |
| `church` | text | Required |
| `division` | text | CHECK: `'mens'` or `'womens'` |
| `captain_name` | text | Optional, team rows |
| `player_name` | text | Free-agent rows |
| `phone` | text | Optional contact, admin-visible only |
| `created_at` | timestamptz | Ordering in `loadRegistrations` |

**Dropped:** `players` (jsonb) and `edit_code` (text). See the migration block in `supabase-schema.sql`.

### Row Level Security

RLS is enabled. Production policies:

- **Select:** anyone can read (public Roster / Free Agents tabs).
- **Insert (anon):** public may insert **only** `kind = 'free_agent'` rows. A public team insert is rejected.
- **Insert (authenticated):** admin may insert any row, including teams.
- **Update (authenticated):** admin only.
- **Delete (authenticated):** admin only.

> The old "anyone can insert / anyone can delete" testing policies must be dropped before going live (see PART B of the schema). The new model relies on the anon-vs-authenticated split, so signing in is what unlocks team management.

### Realtime

The `registrations` table must have replication enabled (Supabase → Database → Replication). `App.jsx` opens a `postgres_changes` channel on `*` events and reloads on any change. This is what makes the public roster update without refresh.

---

## Data flow

```
   Supabase (Postgres + Realtime)
            ▲   │
   insert/  │   │ postgres_changes
   delete   │   │ subscription
            │   ▼
         App.jsx ── registrations[]  ──► RosterView / FreeAgentsView / stats
            │
            ├── tab ──► which view renders
            ├── session ──► isAdmin
            ├── countdown ──► phase ──► gating
            └── justSubmitted ──► ConfirmScreen
```

Key behaviors in `App.jsx`:

- On mount: fetches the current session, subscribes to auth changes, loads all registrations, opens a Realtime channel.
- `addRegistration` inserts the row, reloads, and routes to the confirm screen. (The team edit-code branch inside it is dead — free agents never trigger it.)
- `switchTab` re-fetches on Roster / Free Agents clicks (belt-and-suspenders on top of Realtime).
- `stats` is `useMemo`'d from registrations. Since rosters are gone, the `players` figure is effectively `teams + freeAgents`; it is no longer surfaced in the UI (the old `ScoreboardStats` is orphaned). The tab buttons show `stats.teams` and `stats.freeAgents` inline.

---

## Design system

Aesthetic: **vintage sports program / scoreboard.** Warm cream paper, ink black, rust red accents, uppercase tracked-out micro-text, italic serif subhead. Keep new components consistent with this.

**Convention:** Tailwind classes handle layout, spacing, and responsiveness. Colors and typography use inline `style` referencing `C.*` tokens — *not* Tailwind theme extension. When adding a new color, add it to `C` in `constants.js`.

Color tokens (`C` in `lib/constants.js`):

| Token | Hex | Use |
|---|---|---|
| `cream` | `#F1EADA` | Page background |
| `paper` | `#F8F2E2` | Card surfaces |
| `ink` | `#0E1A33` | Primary text, borders |
| `inkSoft` | `#1F2D4F` | Secondary text, footer |
| `rust` | `#C84E2E` | Primary accent |
| `rustDark` | `#A53D21` | Hover / pressed rust |
| `olive` | `#5C6B3A` | (available, usage TBD) |
| `line` | `#D9CFB8` | Subtle dividers |
| `warn` / `warnBg` | `#B8860B` / `#FBF3DB` | Caution states |
| `ok` / `okBg` | `#2D5A3D` / `#DDF1DE` | Success states |
| `live` / `liveBg` | `#1A7F4F` / `#DDF1DE` | "Event live" accent |
| `gold` / `goldBg` | `#B8860B` / `#FBF3DB` | Trophy / champions accent |

Fonts (loaded via `index.html`): **Bebas Neue** (headline) and **Newsreader** italic (serif subhead).

---

## Conventions

- **Inline styles for tokens, Tailwind for layout.** Don't migrate `C.*` colors into Tailwind config.
- **No PropTypes or TypeScript.** Check call sites in `App.jsx` for the prop contract.
- **Tab-based navigation.** New top-level screen = add a tab value, a `TabButton`, and a conditional render block in `App.jsx`. No routes.
- **One source of truth for registrations.** `App.jsx` owns the array; child views receive it via props.
- **Side effects gated by Realtime + manual reload.** Don't add additional fetch points; let the channel handle freshness.
- **All times in Eastern.** Event dates in `constants.js` are UTC `Date` objects with EDT-equivalent comments. Respect the offset in any new time logic.
- **`Free Agents` is a real church option.** The `CHURCHES` list ends with `"Free Agents"` to capture anyone not on the curated list. Don't filter it out.
- **`CHURCHES` lives in `lib/constants.js`** (not `App.jsx`).

---

## Testing phase transitions locally

Phases are derived purely from `now` vs. the dates in `constants.js`, so to preview the post-deadline / live / post-event states, feed `useCountdown` a fake `now`. The low-friction option is a dev-only URL override (`?t=...`) read once on mount; with no param it uses the real clock and is inert in production:

- `?t=2026-06-15T00:00:00-04:00` → `pre_event` (registration closed)
- `?t=2026-07-10T12:00:00-04:00` → `live`
- `?t=2026-07-11T00:00:00-04:00` → `complete`

(Offsets are `-04:00` because the event dates are EDT.) Alternatively, temporarily rewind the dates in `constants.js` and revert before committing.

---

## Roadmap gaps

The app currently covers registration and the public team / free-agent lists. Still to build for full "before and after" management:

- **Bracket / schedule + scoring (admin-run).** A `matches` table (division, round/slot index, two team refs + name snapshots, scores, status, winner, and `next_match_id`/`next_slot` for auto-advance) plus an admin "Tournament" screen (generate bracket per division, edit scores, mark final) and a public read-only "Bracket" tab. Gate both on `live` / `complete`. RLS: public select, authenticated insert/update.
- **MVP poll (after the event).** A `complete`-gated tab with `mvp_candidates` (curated shortlist) and `mvp_votes` tables; one-vote-per-browser via a `localStorage` token + unique constraint (good-enough, not auth-grade). Public insert with a check, public select for the tally, realtime bar.

When extending, the pattern is: add a view → gate it in `App.jsx` on the `phase` value (same way `RegistrationClosedView` is gated) → add the table + RLS + replication.

---

## Working in this codebase

```bash
npm install         # first time
npm run dev         # local dev on :5173
npm run build       # production build
npm run preview     # preview the build
```

Push to `main` → Vercel auto-deploys in ~1 min.

**Common edits:**

- **Add/change a church:** edit `CHURCHES` in `src/lib/constants.js`.
- **Move a deadline:** edit `REGISTRATION_DEADLINE` / `EVENT_START` / `EVENT_END` in `constants.js`. Watch the UTC offset comments.
- **Change event display copy:** edit `EVENT_DATE_DISPLAY`, `EVENT_TIME_DISPLAY`, `EVENT_ADDRESS` in `constants.js`.
- **Tweak phase behavior:** edit `getPhase` in `lib/phase.js`.

**Outstanding cleanup (post-model-change):**

1. Delete `ManageTeamFlow.jsx` and `ScoreboardStats.jsx`.
2. Remove `players: []` from the insert in `RosterView.jsx`'s `AdminAddTeam` (errors once the column is dropped).
3. Strip the dead `generateEditCode` import + `edit_code` branch from `App.jsx`, and `generateEditCode` from `helpers.js`.