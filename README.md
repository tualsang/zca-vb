# Volleyball Tournament Registration

A self-hosted registration site for a multi-church volleyball tournament. Captains register their full roster in one go; solo players sign up as free agents and get auto-grouped into squads. Live public roster updates in real-time.

**Stack:** React (Vite) + Tailwind + Supabase (Postgres) + Vercel

---

## Quick Start (the whole flow, top to bottom)

You'll go from this zip to a live URL in ~45 minutes.

---

### Part 1: Set up Supabase (10 min)

1. Go to **https://supabase.com** → sign up with GitHub
2. Click **New project**
   - Name: `volleyball-tournament`
   - Database password: click "Generate" and **save it** somewhere
   - Region: pick the closest to most users
3. Wait ~2 min for it to provision
4. Click **SQL Editor** in the sidebar → **New query**
5. Open `supabase-schema.sql` from this folder, copy the whole thing, paste into the editor, click **Run**
6. You should see "Success. No rows returned."

**Grab your API keys:**

7. Click the gear icon (Settings) → **API**
8. Copy two values somewhere safe:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon / public key** (long string starting with `eyJ...`)

---

### Part 2: Run it locally (10 min)

**Install Node.js if you don't have it:**
```bash
node --version
```
If that errors, download Node LTS from https://nodejs.org and install.

**From this folder (the one with `package.json`):**

1. Open `.env.local` in any text editor
2. Replace `YOUR_PROJECT_ID` and the placeholder anon key with your real values from Part 1, step 8
3. Save the file

**Then in terminal:**

```bash
cd volleyball-tournament   # or wherever you extracted this
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. You should see the form. Try registering a test team — if it shows up in the Roster tab and survives a page refresh, your database is connected. ✅

If it doesn't work, open browser console (F12) and check for errors. The most common issue is a typo in `.env.local` — also remember you must restart `npm run dev` after editing env files.

---

### Part 3: Customize for your tournament (5 min)

Open `src/App.jsx` and find the `CHURCHES` array near the top. Replace those with your actual 10 churches. Format: `"Church Name — City, ST"` (the long dash matters — the app splits on it for display).

Save the file. The dev server hot-reloads automatically.

---

### Part 4: Push to GitHub (5 min)

1. Go to **https://github.com** → sign in (or sign up)
2. Click **+** (top-right) → **New repository**
3. Name it `volleyball-tournament` → **Public** or Private both fine → **don't** check any init boxes → **Create repository**
4. GitHub shows you commands. From your project folder, run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/volleyball-tournament.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

> **Sanity check:** Go to your repo on github.com. You should NOT see `.env.local` in the file list. If you do, delete it from the repo immediately and rotate your Supabase anon key.

---

### Part 5: Deploy to Vercel (5 min)

1. Go to **https://vercel.com/signup** → sign up with GitHub
2. From the dashboard: **Add New → Project**
3. Find `volleyball-tournament` and click **Import**
4. Vercel auto-detects Vite. **Before clicking Deploy:**
   - Expand **Environment Variables**
   - Add `VITE_SUPABASE_URL` = your Supabase URL
   - Add `VITE_SUPABASE_ANON_KEY` = your anon key
5. Click **Deploy**

Wait ~1 min. You'll get a URL like `volleyball-tournament-abc123.vercel.app`.

**That's your shareable link.** Send it to the churches.

---

### Part 6: Lock it down before going live

The current setup lets anyone delete registrations (handy for testing). Before you share the link with churches:

1. Supabase → SQL Editor
2. Run:
   ```sql
   drop policy "Anyone can delete registrations" on registrations;
   ```
3. Now only you (via the Supabase Table Editor) can delete rows.

---

## Making changes later

Any push to GitHub auto-deploys to Vercel within ~1 min.

```bash
git add .
git commit -m "describe what you changed"
git push
```

Want to add another church? Edit `CHURCHES` in `src/App.jsx`, push, done.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Form loads but registrations don't save | Check browser console. Usually env vars missing/typo, or you forgot to run the SQL schema |
| `npm run dev` fails | Run `npm install` again. Make sure you're in the project root (folder with `package.json`) |
| Vercel build fails | Check the build log — usually a typo in env var names. They must be EXACTLY `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| Page is blank, no errors | Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) |
| Realtime updates don't work | Supabase → Database → Replication → enable replication for the `registrations` table |
| Can't see `.env.local` in Finder | macOS hides dotfiles. Press Cmd+Shift+. (period) in Finder to toggle |

---

## File structure

```
volleyball-tournament/
├── .env.local                  ← your Supabase keys (NEVER commit)
├── .gitignore
├── README.md                   ← this file
├── index.html
├── package.json
├── postcss.config.js
├── supabase-schema.sql         ← run this in Supabase once
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── App.jsx                 ← main component, edit CHURCHES here
    ├── index.css
    ├── main.jsx
    └── lib/
        └── supabase.js         ← database client
```
