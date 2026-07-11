# Deploy to GitHub Pages (recommended for iPad)

**Local Files / iCloud often will not run JavaScript on iPad.** GitHub Pages serves the same app over **HTTPS**, which fixes buttons, Add to Home Screen, and caching.

**Live URL (current repo):** **https://chadlydotbmp.github.io/pale-tide/**

## One-time setup (~5 minutes)

### 1. Build

```bash
cd ghoulsburg-cemetery-app
./build.sh
```

This creates `docs/index.html` (the live app).

### 2. Create a GitHub repo *(if not already done)*

1. Go to [github.com/new](https://github.com/new)
2. Name it **`pale-tide`** or **`ghoulsburg-cemetery`**
3. **Public** repo
4. Create repository

### 3. Push from your Mac

```bash
cd ghoulsburg-cemetery-app
git add docs/index.html manifest.webmanifest
git commit -m "Ghoulsburg Cemetery DM app"
git push
```

### 4. Turn on Pages

1. GitHub repo → **Settings** → **Pages**
2. **Build and deployment** → Source: **Deploy from a branch**
3. Branch: **main** → Folder: **/docs**
4. **Save**

### 5. iPad

1. Open **https://chadlydotbmp.github.io/pale-tide/** in **Safari**
2. Confirm header shows **· live**
3. **Share → Add to Home Screen**

## Updates after editing the app

```bash
cd ghoulsburg-cemetery-app
./build.sh
git add docs/index.html docs/manifest.webmanifest index.html manifest.webmanifest
git commit -m "Update app"
git push
```

**Verify deploy:** open **https://chadlydotbmp.github.io/pale-tide/** in Safari — top-right should show a **build stamp** (e.g. `20260711.1649`) matching `./build.sh` output. If you still see **Next Round**, **Brussel**, or an old layout, the push did not land or Safari is cached.

Hard-refresh on iPad:

1. Close the tab completely (not just background).
2. Reopen **https://chadlydotbmp.github.io/pale-tide/** (add `?v=1` if needed).
3. If added to **Home Screen**, remove the icon and **Add to Home Screen** again after push (PWA caches aggressively).

**Local-only:** editing `body.html` / `js/*.js` does nothing until you run `./build.sh` — the iPad loads `docs/index.html`, not the source files.

## Still not working?

| Symptom | Fix |
|--------|-----|
| Styled page, red “App did not start” banner | Use the **https://** URL only — not Files preview. |
| 404 on GitHub URL | Pages not enabled · folder must be **/docs**. |
| Old behavior after push | Check **build stamp** top-right · wait 2 min · force-quit Safari · reopen URL · re-add Home Screen. |
| Edits in Cursor don't show | Run `./build.sh` then commit **docs/index.html**. |
