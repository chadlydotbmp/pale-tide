# Deploy to GitHub Pages (recommended for iPad)

**Local Files / iCloud often will not run JavaScript on iPad.** GitHub Pages serves the same app over **HTTPS**, which fixes buttons, Add to Home Screen, and caching.

## One-time setup (~5 minutes)

### 1. Build

```bash
cd pale-tide-app
./build.sh
```

This creates `docs/index.html` (the live app).

### 2. Create a GitHub repo

1. Go to [github.com/new](https://github.com/new)
2. Name it **`pale-tide`** (or anything)
3. **Public** repo
4. Do **not** add README (you already have files)
5. Create repository

### 3. Push from your Mac

Replace `YOUR_USERNAME` with your GitHub username:

```bash
cd pale-tide-app
git init
git add docs/ .gitignore DEPLOY.md README.md
git commit -m "Pale Tide DM app for GitHub Pages"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pale-tide.git
git push -u origin main
```

### 4. Turn on Pages

1. GitHub repo → **Settings** → **Pages**
2. **Build and deployment** → Source: **Deploy from a branch**
3. Branch: **main** → Folder: **/docs**
4. **Save**
5. Wait 1–2 minutes. Your URL will show, e.g.  
   **`https://YOUR_USERNAME.github.io/pale-tide/`**

### 5. iPad

1. Open that URL in **Safari** (type or AirDrop the link)
2. Confirm header shows **· live** and a **date chip**
3. Tap **Ritual +1** — counter should move
4. **Share → Add to Home Screen** (works on HTTPS)

Bookmark this URL. You need cell or Wi‑Fi to open it; leave the tab open at the table if signal is weak.

## Updates after editing the app

```bash
./build.sh
git add docs/index.html
git commit -m "Update app"
git push
```

Hard-refresh on iPad (or close Safari tab and reopen the URL).

## Still not working?

| Symptom | Fix |
|--------|-----|
| Styled page, red “App did not start” banner | You opened a **local file**. Use the **https://** URL only. |
| 404 on GitHub URL | Pages not enabled yet, or wrong folder — must be **/docs**. |
| Old behavior after push | Wait 2 min, force-quit Safari, reopen URL. |
| · live but taps dead | Screenshot the red error bar if any; email yourself latest `docs/index.html` size (~87KB). |
