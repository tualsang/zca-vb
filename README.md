# Volleyball Tournament

A registration and tournament site for the **ZCA Conference 2026 Volleyball Tournament** — a one-day, multi-church event held **July 10, 2026** in Halethorpe, Maryland.

The site does three things across the lifecycle of the tournament:

1. Captures team and free-agent registrations leading up to the deadline
2. Runs the tournament on game day — brackets, schedules, and live scores
3. Settles into a recap view once the event ends

It's built as a single React app with a real-time backend: when a team registers, everyone currently on the site sees them appear without refreshing.

---

## How registration works

There are two ways to sign up.

**Team captains** register their full roster in one pass — they pick their church, choose a division (Men's or Women's), enter their own info as captain, then add each of their players. After submitting, the captain is shown a unique **edit code**, something like `FAIT-X7K2`. That code is the key to the *Manage Team* tab: the captain can come back any time before the deadline to add players, remove no-shows, or fix typos — without needing to contact the organizer.

**Free agents** are players who don't have a team. They sign up individually under their church and division, and they show up in the Free Agents tab where everyone can see them. After registration closes, free agents are grouped into ad-hoc squads so nobody who wants to play gets left out.

The church list is a fixed dropdown with an "Others" option for anyone outside the ten participating churches.

---

## The countdown and the four phases

Every page has a live banner showing where we are in the tournament lifecycle. The site behaves differently in each phase — all times Eastern.

| Phase | When | What the site shows |
|---|---|---|
| **Pre-registration** | Until June 14, 11:59 PM ET | Countdown to the deadline; registration form open to everyone |
| **Pre-event** | June 14 → July 10 | Countdown to game day; public signup closed (admin can still add late entries) |
| **Live** | July 10, 9 AM – 5 PM ET | Game-day banner; signup is over; brackets, schedule, and live scores take over |
| **Complete** | After 5 PM, July 10 | Countdown is gone; final standings and a thank-you recap |

The transitions happen automatically based on the clock — no one has to flip a switch.

---

## What visitors see

Anyone landing on the site, without logging in, can:

- See the **Roster** — every registered team, grouped by church and division
- See the **Free Agents** tab — every solo player and their division
- See the **Scoreboard** at the top — live counts of total players, teams, and free agents
- Read the **Info** tab — format, date, address, time, and house rules
- Once it's game day: follow the schedule, live brackets, and current scores

The page updates in real time. If you're watching the Roster tab and a new team registers from somewhere else, they appear instantly.

---

## What the admin sees

There's a small "Admin" link in the footer. After signing in, the organizer gets:

- An "Admin" badge in the header so they know they're logged in
- The ability to **register teams any time**, including after the public deadline
- The ability to **remove** duplicate or test registrations
- Access to the **Admin Dashboard** (game-day controls), where they:
  - Pick the format per division once registration closes
  - Seed teams into pools (when applicable)
  - Generate the full schedule
  - Enter scores courtside from their phone

The Admin Dashboard is designed mobile-first, because the organizer will be using it one-handed on the sidelines, not at a desk.

---

## Tournament formats

Once registration closes, the admin picks the format for each division based on how many teams signed up. Two formats are supported:

**Round Robin** — for divisions with **4–5 teams**. Every team plays every other team. The top two in the standings (by wins, then head-to-head, then point differential) meet in a championship match.

**Pool Play + Bracket** — for divisions with **6 or more teams**. Teams are split into two pools and play a round-robin within their pool. The top two from each pool advance to a 4-team single-elimination bracket: Pool A's #1 plays Pool B's #2 in one semifinal, and Pool B's #1 plays Pool A's #2 in the other. Winners meet in the final.

The two divisions (Men's and Women's) can run different formats — they're independent.

---

## Tech

React + Vite + Tailwind on the frontend, Supabase (Postgres + Auth + Realtime) on the backend, deployed on Vercel. Kept deliberately small for a one-day event — no router, no global state library, no TypeScript. The whole thing is meant to be readable end-to-end in an afternoon.

For developer documentation — architecture, conventions, database schema, and design tokens — see [CLAUDE.md](./CLAUDE.md).
