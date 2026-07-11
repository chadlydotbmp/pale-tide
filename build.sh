#!/bin/bash
# Bundle CSS + JS into index.html for iPad file:// (Safari blocks external assets)
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

BUILD_ID="$(date -u +"%Y%m%d.%H%M")"

{
  cat <<HEAD
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
    />
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <meta name="ghoulsburg-build" content="${BUILD_ID}" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="theme-color" content="#0c0e12" />
    <title>Ghoulsburg Cemetery</title>
    <script>
      window.__GHOULSBURG_BUILD__ = "${BUILD_ID}";
      window.PaleTideApp = {
HEAD
  cat <<'HEAD2'
        _q: [],
        tap: function (el, ev) {
          if (window.PaleTideApp._go) {
            window.PaleTideApp._go(el, ev || window.event);
          } else {
            window.PaleTideApp._q.push([el, ev || window.event]);
          }
        },
      };
      window.addEventListener('load', function () {
        setTimeout(function () {
          if (!document.documentElement.getAttribute('data-app')) {
            var w = document.getElementById('boot-warn');
            if (w) w.style.display = 'block';
          }
        }, 2000);
      });
    </script>
    <style>
HEAD2
  cat css/app.css
  echo '    </style>'
  echo '  </head>'
  cat body.html
  echo '    <script>'
  cat js/game.js js/reminders.js js/monsters.js js/app.js
  echo '    </script>'
  echo '  </body>'
  echo '</html>'
} > index.bundled.html

mv index.bundled.html index.html

mkdir -p docs
cp index.html docs/index.html
cp icon.svg docs/icon.svg 2>/dev/null || true
if [ -f manifest.webmanifest ]; then
  sed "s|\"start_url\": \"./index.html\"|\"start_url\": \"./index.html?v=${BUILD_ID}\"|" manifest.webmanifest > docs/manifest.webmanifest
  cp docs/manifest.webmanifest manifest.webmanifest
fi
touch docs/.nojekyll

echo "Built index.html ($(wc -c < index.html | tr -d ' ') bytes) · build ${BUILD_ID}"
echo "GitHub Pages: git add docs/index.html docs/manifest.webmanifest && git commit && git push"
