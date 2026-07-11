# Ghoulsburg Cemetery — iPad DM App

Touch-first combat tracker for **Roll For Adventure · L5**.

## iPad: use GitHub Pages (not Files)

**https://chadlydotbmp.github.io/pale-tide/**

Full steps: **[DEPLOY.md](DEPLOY.md)**

---

## Build & push updates

```bash
cd ghoulsburg-cemetery-app
./build.sh
git add docs/index.html
git commit -m "Update app"
git push
```

Wait 1–2 min · hard-refresh Safari on iPad.

## Offline / local file

```bash
cd ghoulsburg-cemetery-app
./build.sh
```

Sync `index.html` via iCloud to iPad **Files** → Share → **Safari**. Local `file://` often breaks JS — GitHub Pages is preferred.

## What it tracks *(L5)*

- **Initiative** — fixed order: Knights 21 → Apex 20 → Hunters 15 → Ghosts 10 → Hordes 5 · Lair 20
- **Acts I / II / III** — Siege · Count · Apostle
- **Ritual / Breach** clocks · pylons · Inner three scenes
- **Apostle** · Dismissal · auto-saves to localStorage

## Edit & rebuild

Change `css/app.css`, `js/*.js`, or `body.html`, then `./build.sh`.

Source docs: parent folder `AT_TABLE_COMBAT.md` · `ENEMY_STAT_BLOCKS.md` · `SANCTUM_CARD.md`
