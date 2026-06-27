# The Pale Tide — iPad DM App

Touch-first combat tracker for **Roll For Adventure · Sat Jun 27**.

## ⚠️ iPad: use GitHub Pages (not Files)

**Opening `index.html` from iCloud/Files usually fails on iPad** — JavaScript does not run reliably from local files. Buttons, tabs, and Add to Home Screen will not work.

**Use GitHub Pages instead** — free HTTPS hosting. Full steps: **[DEPLOY.md](DEPLOY.md)**

Quick summary: `./build.sh` → push `docs/` to GitHub → enable Pages from `/docs` → open `https://YOUR_USERNAME.github.io/pale-tide/` on iPad in Safari.

---

Touch-first combat tracker. No install, no npm — runs in **Safari** on a 7th-gen iPad (or any tablet).

## Offline use (no Wi‑Fi at the venue)

You do **not** need `./serve.sh` or your Mac at the table. The whole app lives in one file.

### 1. Build on your Mac (now)

```bash
cd pale-tide-app
./build.sh
```

### 2. Get `index.html` onto the iPad

Pick one — **before** you leave, while you still have cell or Wi‑Fi once:

| Method | How |
|--------|-----|
| **iCloud** (easiest if this project syncs) | On iPad **Files** → iCloud Drive → `Level 17-20/pale-tide-app/index.html`. Wait for sync; check file size ~77KB. |
| **Email / iMessage** | Attach `index.html` from Mac → open attachment on iPad → **Share → Save to Files**. |
| **AirDrop** | One-time near Mac → save to Files. |

### 3. Pin it locally (recommended)

In **Files**, open the folder containing `index.html`:

1. Long-press **`index.html`** → **Move** → **On My iPad** → create folder `Pale Tide` → save.

That copy works with **no network** at the venue.

### 4. Open in Safari & bookmark

1. Long-press **`index.html`** → **Share** → **Safari**
2. Confirm header shows **· live** and a **date chip** (e.g. `2026-06-26`) — that’s the build you synced
3. **Bookmarks** → **Add Bookmark** (Home Screen isn’t available for local files — bookmark is fine)
4. Optional: leave the Safari tab open; state auto-saves in the iPad

At the venue: open the bookmark or tab — **airplane mode is OK** if the file is on **On My iPad**.

## What it tracks

- **Initiative batches** — shuffle each round (31 · 25 · 20 · 19 · 16 · 10)
- **Turn reminders** — tap **Mark** on any row for batch rules · **legendary actions** · lair picker
- **Lair @ 20** — always-visible quick ref · tap to select in reminder panel
- **Stats tab** — full stat blocks · actions · specials · LA · filter by batch
- **Ritual / Breach** clocks · G-track · cone rounds
- **Pylons** A/B · grave churn · rim anchors
- **Sanctum** inner track · woman friendly
- **Apostle** HP · bloodied · LR · damage wheel
- **Auto-saves** to iPad localStorage

## Add to Home Screen (iPad 7)

**Add to Home Screen only works in Safari** — not in the Files preview when you tap the file.

### Step by step

1. **Files** → find `pale-tide-app/index.html`
2. **Long-press** the file (don’t just tap)
3. Tap **Share** → **Safari** (or **Open in Safari**)
4. In **Safari**, tap the **Share** button (square with ↑) — top-right on iPad
5. **Scroll down** in the share sheet — **Add to Home Screen** is often below AirDrop / Messages
6. Tap **Add to Home Screen** → name it → **Add**

### If you don’t see “Add to Home Screen”

- Scroll the share sheet all the way down
- Tap **Edit Actions** (or **More**) at the bottom → turn **Add to Home Screen** on
- Confirm the address bar says **Safari**, not a Files preview (no browser chrome = wrong app)
- **Local files (`file://`) often hide this option** on iPad — use **Option C** (Wi‑Fi server) instead; Home Screen works reliably from `http://…`

### You don’t need Home Screen

For Saturday, any of these is fine:

- Leave the **Safari tab open** (best for `file://`)
- **Bookmarks** → Add Bookmark in Safari
- **Option C** below → bookmark or Home Screen the `http://` URL (recommended if buttons were flaky)

## Get it on your iPad

### Option A — iCloud / Files (simplest)

1. Put the `pale-tide-app` folder in iCloud Drive (this project folder may already sync).
2. On iPad: **Files** → **long-press** `index.html` → **Share** → **Safari**.
3. Optional: Share → **Add to Home Screen** (see above — may not appear for local files).

### Option B — AirDrop

1. AirDrop the `pale-tide-app` folder to the iPad.
2. Save to **Files** → open `index.html` in Safari → Add to Home Screen.

### Option C — Local Wi‑Fi (most reliable for buttons)

iPad Safari can be flaky with `file://` JavaScript. If taps do nothing, use HTTP:

On your Mac, from this folder:

```bash
cd pale-tide-app
./serve.sh
```

On iPad Safari (same Wi‑Fi): open the URL shown (e.g. `http://192.168.x.x:8080`)

Then **Add to Home Screen**.

### Option D — Manual HTTP server

```bash
cd pale-tide-app
python3 -m http.server 8080
```

## Tabs

| Tab | Use at table |
|---|---|
| **Ph 1** | Tide · Gate LOCKED · Gate + Lane · open gate → Ph 2 |
| **Ph 2** | Ledger · Inner track · pylons · grave · anchors · break |
| **Ph 3** | Apostle · Time Collapse · dismissal · reset |
| **Stats** | Stat blocks · filter by batch |

**Clocks + initiative** — split layout on Ph 1–3: **initiative pinned left**, phase tools **right**. Stats tab is full width.

## Editing (Mac)

Edit `css/app.css`, `js/*.js`, or `body.html`, then rebuild:

```bash
cd pale-tide-app
./build.sh
```

Copy the new `index.html` to the iPad (iCloud sync or AirDrop). After opening in Safari, the title should show **· live** — that means JavaScript loaded. A red bar at the top means something failed (screenshot it).

## Tips

- Tap **Mark** on an initiative row to highlight it and show **turn + LA + lair** reminders above the list.
- **Lair @ 20** cards stay visible under the initiative list every round.
- **New Round** rolls the d5 shuffle, advances R, and resets LA counters.
- State persists until **Reset encounter** on the Apostle tab.
- Works offline once loaded.

Source docs: `AT_TABLE_COMBAT.md` · `ENEMY_STAT_BLOCKS.md` · `SANCTUM_CARD.md`
