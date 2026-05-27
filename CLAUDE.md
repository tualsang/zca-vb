# Project Guide — Volleyball Tournament

Context document for AI coding assistants (Claude Code, Antigravity, Cursor, etc.) and humans working on this codebase. Place at repo root.

---

## What this project is

A single-day, multi-church volleyball tournament site for the **ZCA Conference 2026**. It serves three distinct moments:

1. **Before the tournament** — generate excitement, capture registrations, show a live countdown to the registration deadline.
2. **Tournament day** — switch to a celebratory "live" banner; signup is closed.
3. **After the tournament** — wind-down state with a thank-you message; countdown is gone.

The app is **phase-driven**: a single `phase` value (computed from the current time vs. fixed event dates) governs which views are shown, whether public registration is open, and what the header looks like.

**Tournament facts:**
- **Date:** July 10, 2026, 9:00 AM – 5:00 PM EDT
- **Location:** 4922 Leeds Ave, Halethorpe, MD 21227
- **Registration deadline:** June 14, 2026, 11:59 PM EDT
- **Divisions:** Men's and Women's
- **All times in Eastern.**

Two registration paths:

- **Team captains** register a full roster in one submission and receive an **edit code** they can use later under the *Manage Team* tab to add/remove players without admin access.
- **Solo players** register as **free agents** and are listed for auto-grouping into ad-hoc squads.

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

No router. The app is single-page and uses local `tab` state for navigation. No global state library — `App.jsx` holds the canonical state and passes props down.

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
│   │   ├── CountdownBanner.jsx     Renders the live phase-aware countdown.
│   │   └── ScoreboardStats.jsx     Players / Teams / Free agents counters.
│   ├── inputs/
│   │   ├── NameInput.jsx           Reusable text input. Uses sanitizeNameInput.
│   │   └── PhoneInput.jsx          Phone input. Uses sanitizePhoneInput + formatPhone.
│   ├── shared/
│   │   ├── ChoiceCard.jsx          Selectable card primitive.
│   │   ├── FormBlock.jsx           Labeled form section wrapper.
│   │   ├── Status.jsx              Status pill / chip.
│   │   └── TabButton.jsx           Main nav tab button.
│   └── views/
│       ├── RegisterForm.jsx        The signup form (team OR free agent).
│       ├── ConfirmScreen.jsx       Post-submit success screen; shows edit code for teams.
│       ├── ManageTeamFlow.jsx      Enter edit code → modify a team's roster.
│       ├── RosterView.jsx          Public list of all registered teams.
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

> View files and `useCountdown.js` have not been directly inspected. Their descriptions above are inferred from how `App.jsx` imports and uses them.

---

## Core concepts

### Phases

`getPhase(now)` returns `{ phase, target }` where `target` is the next deadline (or `null` when complete):

| Phase | When | `target` | Public can register? |
|---|---|---|---|
| `pre_registration` | now < June 14, 2026 11:59 PM EDT | `REGISTRATION_DEADLINE` | ✅ Yes |
| `pre_event` | deadline passed, event not started | `EVENT_START` | ❌ No (admin can) |
| `live` | July 10, 2026, 9 AM – 5 PM EDT | `EVENT_END` | ❌ No |
| `complete` | after 5 PM EDT on tournament day | `null` | ❌ No |

Convenience predicates exported from `phase.js`: `isRegistrationOpen`, `isEventLive`, `isEventComplete`.

Admins (signed-in users) **bypass the phase gate** for registration — `canShowRegisterForm = registrationOpenForPublic || isAdmin` in `App.jsx`. This lets the organizer add late entries from their phone.

### Registration kinds

The `registrations` table has a `kind` discriminator: `"team"` or `"free_agent"`.

- **Team rows** have: `church`, `division`, `captain_name`, `players` (jsonb array of player objects), and an `edit_code`.
- **Free agent rows** have: `church`, `division`, `player_name`.

`teamHeadcount(team)` = `team.players.length + 1` (captain is stored separately from the `players` array, not inside it).

### Edit codes

When a team is created, `generateEditCode(churchName)` produces a code in the format `XXXX-YYYY`:

- **Prefix** (`XXXX`): first 4 uppercase letters of the church name, non-letters stripped, padded with `X` if too short. `splitChurch()` is used first to strip the location suffix.
- **Suffix** (`YYYY`): 4 random chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — deliberately omits `I`, `O`, `0`, `1` to prevent transcription errors.

Examples: `Faith Assembly Church - Arizona` → `FAIT-X7K2`. `Free Agents` → `OTHE-...`.

The captain sees this code on `ConfirmScreen` and enters it in `ManageTeamFlow` to edit their roster. Free agents do not get codes.

### Admin mode

A Supabase auth session = admin. There's no role table — presence of `session` is the entire check. Admin powers observed in code:

- Register during any phase
- Delete any registration (`removeRegistration`)
- "Admin" badge in the header, "Sign Out" link in the footer

The README also notes a manual SQL step to drop the public delete policy before going live, so production-mode deletes are admin-only at the DB level too.

---

## Helpers (`lib/helpers.js`)

All pure functions, no side effects:

| Function | Purpose |
|---|---|
| `splitChurch(full)` | Splits `"Name — Location"` or `"Name - Location"` into `{ name, location }`. Handles both em-dash and hyphen with surrounding spaces. |
| `generateEditCode(churchName)` | Returns `PREFIX-SUFFIX` code (see above). |
| `sanitizePhoneInput(value)` | Digits only, max 10. |
| `formatPhone(digits)` | Formats as `(XXX) XXX-XXXX`, handles partial input progressively. |
| `sanitizeNameInput(value)` | Strips digits from name fields. |
| `teamHeadcount(team)` | `players.length + 1`. |

Phone storage shape is not visible in the SQL schema — it's likely a column not in the shared schema file, or nested inside the `players` jsonb. Verify before touching phone logic.

---

## Database (Supabase)

Schema lives in `supabase-schema.sql`. Current confirmed columns on `registrations`:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid (default `gen_random_uuid()`) | Primary key |
| `kind` | text | CHECK: `'team'` or `'free_agent'` |
| `church` | text | Required |
| `division` | text | CHECK: `'mens'` or `'womens'` |
| `captain_name` | text | Set on team rows |
| `player_name` | text | Set on free-agent rows |
| `players` | jsonb | Roster array on team rows; shape determined by `RegisterForm` |
| `created_at` | timestamptz | Used for ordering in `loadRegistrations` |

**⚠ Schema discrepancy:** `App.jsx` writes `edit_code` to every team row, but the shared `supabase-schema.sql` does not declare this column. Either the column exists in the live database (and the schema file is stale), or inserts are silently dropping the value. **Action:** add `edit_code text` to the schema before relying on Manage Team flow in a fresh environment.

Similarly, phone fields aren't visible in the schema — check the live DB or the `players` jsonb shape.

### Row Level Security

RLS is enabled with three public policies:

- **Select:** anyone can read (powers the public Roster / Free Agents tabs).
- **Insert:** anyone can insert (powers public registration).
- **Delete:** anyone can delete — **this is for testing only.** The README's "Part 6: Lock it down" step drops this policy before going live, leaving deletes admin-only via Supabase Table Editor.

### Realtime

The `registrations` table must have replication enabled (Supabase → Database → Replication). `App.jsx` opens a `postgres_changes` channel on `*` events and reloads on any change. This is what makes the public Roster update without refresh.

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

- On mount: fetches current session, subscribes to auth changes, loads all registrations, opens a Realtime channel.
- `addRegistration` generates an edit code for teams, inserts the row, reloads, and routes the user to the confirm screen.
- `switchTab` re-fetches on Roster / Free Agents tab clicks (belt-and-suspenders on top of Realtime).
- `stats` is `useMemo`'d from registrations: `{ players, teams, freeAgents }`.

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
| `rust` | `#C84E2E` | Primary accent (eyebrow, headline highlight) |
| `rustDark` | `#A53D21` | Hover / pressed rust |
| `olive` | `#5C6B3A` | (available, usage TBD) |
| `line` | `#D9CFB8` | Subtle dividers |
| `warn` / `warnBg` | `#B8860B` / `#FBF3DB` | Caution states |
| `ok` / `okBg` | `#2D5A3D` / `#DDF1DE` | Success states |
| `live` / `liveBg` | `#1A7F4F` / `#DDF1DE` | "Event live" celebration accent |
| `gold` / `goldBg` | `#B8860B` / `#FBF3DB` | Trophy / champions accent |

Fonts (loaded via `index.html`):

- **Bebas Neue** — the giant `Volleyball Tournament` headline
- **Newsreader** italic — the serif subhead

---

## Conventions

- **Inline styles for tokens, Tailwind for layout.** Don't migrate `C.*` colors into Tailwind config — the inline pattern is the convention here.
- **No PropTypes or TypeScript.** Components accept loose props; check call sites in `App.jsx` for the contract.
- **Tab-based navigation.** Adding a new top-level screen = add a tab value, a `TabButton`, and a conditional render block in `App.jsx`. No routes.
- **One source of truth for registrations.** `App.jsx` owns the array; child views receive it via props rather than each fetching their own.
- **Side effects gated by Realtime + manual reload.** Don't add additional fetch points; let the channel handle freshness.
- **All times in Eastern.** Event dates in `constants.js` are stored as UTC `Date` objects with comments showing their EDT equivalent. Any new time logic must respect this.
- **`Free Agents` is a real church option.** The CHURCHES list ends with `"Free Agents"` to capture anyone not on the curated list. Don't filter it out.
- **README says CHURCHES lives in `App.jsx` — it doesn't.** It's in `lib/constants.js`. Fix the README on next pass.

---

## Roadmap gaps

The current code is heavily oriented toward the *pre-registration* phase. The stated goal is full "before and after" tournament management. Things likely still to build:

- **Bracket / schedule view** for tournament day (currently `phase === "live"` only changes the banner, not the main content)
- **Live game status** (which game is on which court, scores)
- **Squad assignment UI** for free agents — the README mentions auto-grouping but no view shows this happening
- **Post-tournament recap** state — currently the `complete` phase just hides the countdown; no champions/standings/thank-you surface

When extending, the natural pattern is: add a new view → gate it in `App.jsx` based on the `phase` value (the same way `RegistrationClosedView` is gated).

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

---

## What's still not directly read

To remove the last inferred sections, the next files worth sharing:

1. `src/components/views/RegisterForm.jsx` — to confirm exact `players` jsonb shape and where phone is stored
2. `src/components/views/ManageTeamFlow.jsx` — to confirm how edit codes are validated server-side (if at all)
3. `src/hooks/useCountdown.js` — to confirm tick interval and time fields returned
4. `src/lib/supabase.js` — minor; just confirms client config
5. The live `supabase-schema.sql` from production — to resolve the `edit_code` and phone-column questions
