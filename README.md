# Volleyball Tournament

A registration and game-day site for the **ZCA Conference 2026 Volleyball Tournament** — a one-day, multi-church event held **July 10, 2026** in Ellicott City, Maryland.

One React app carries the event across its whole lifecycle:

1. Captures free-agent registrations leading up to the deadline.
2. Runs the tournament on game day — schedule, live scores, and standings.
3. Opens MVP voting and settles into a recap once the event ends.

It has a real-time backend: when a score or vote changes, everyone on the site sees it update without refreshing.

---

## How sign-up works

There are two kinds of entries, but only one public sign-up path.

**Teams are added by the organizer.** Captains contact the organizer by phone (the number is in the header) and the organizer adds the team from the **Team List** tab. There's no public team form, no roster to fill in, and no edit code to keep track of — a team is just its church and division.

**Free agents sign themselves up.** A player without a team picks their church and division and leaves a name and phone number. They appear in the **Free Agents** tab, and after registration closes they're grouped into ad-hoc squads so everyone who wants to play gets a spot.

The church list is a fixed dropdown that ends with a **Free Agents** option for anyone not tied to one of the participating churches.

---

## The four phases

The site behaves differently depending on where we are in the tournament's life. The transitions happen automatically from the clock — nobody flips a switch. All times Eastern.

| Phase | When | What the site does |
|---|---|---|
| **Pre-registration** | Until June 14, 11:59 PM | Counts down to the deadline. Free-agent sign-up is open. Lands on the sign-up form. |
| **Pre-event** | June 14 → July 10, 9 AM | Counts down to game day. Sign-up is closed for the public; the Register tab is gone. Lands on the Team List. |
| **Live** | July 10, 9 AM – 5 PM | The schedule, live scores, and standings take over. No more countdown. Lands on the Schedule. MVP voting opens at noon. |
| **Complete** | After 5 PM, July 10 | Final standings remain, and the header reads "Go Vote for MVP!" Lands on MVP voting. |

---

## What visitors see

Without logging in, anyone can:

- Browse the **Team List** — every team, grouped by division.
- See the **Free Agents** tab (while sign-up is open).
- Follow the **Schedule** on and after game day — every game by round and court, with live best-of-three scores and a **standings table** (matches played, wins, losses, set record, and points ratio per division).
- Vote in the **MVP** poll once it opens at noon, and watch the percentages update live.
- Read the **Info** tab — format, date, address, and time.

Everything updates in real time.

---

## Game day: the schedule

Two courts run in parallel — **Court A** for the Men's division, **Court B** for the Women's. Each division has four teams that play a full round robin (everyone plays everyone), followed by a third-place game and a championship.

Each game is **best of three**. The standings table ranks teams by matches won, then set ratio, then points ratio, and it updates automatically as scores come in. The four finalists for the playoff games are set from the standings.

## The MVP vote

From noon on game day, visitors can vote for the tournament's most valuable player. If their pick is already on the board, they tap to vote and the percentages move instantly. If their player isn't listed, they write in a name and pick a team — that submission is reviewed by an organizer before it joins the poll. Results are visible to everyone the whole time.

---

## What the organizer (admin) does

A small **Admin** link in the footer signs the organizer in. From there they can:

- **Add and remove teams** from the Team List, at any time.
- **Run the schedule** from their phone, courtside: shift a round's start time in 15-minute steps, set team names, and enter set scores. The standings recompute the moment a game is submitted.
- **Moderate the MVP vote** — approve or reject write-ins, add votes directly (for in-person or paper votes), and nudge any candidate's count up or down.

The admin keeps full access to every tab in every phase, so the site can be managed before, during, and after the event.

---

## Tech

React + Vite + Tailwind on the frontend, Supabase (Postgres + Auth + Realtime) on the backend, deployed on Vercel. Deliberately small for a one-day event — no router, no global state library, no TypeScript. Three Postgres tables (`registrations`, `matches`, `mvp_votes`), each with row-level security and realtime replication.

For developer documentation — architecture, conventions, the phase map, database schema, and design tokens — see [CLAUDE.md](./CLAUDE.md).