---
name: run-liquisity
description: Build, run, and drive the Liquisity static site. Use when asked to start liquisity, run it, take a screenshot of its UI, smoke test the site, or interact with the running pages.
---

Liquisity is a pure-static multi-page product site (no build step). Drive it by starting a Python HTTP server and running `.claude/skills/run-liquisity/driver.mjs`, which uses Playwright's headless Chromium to visit every page and capture screenshots.

All paths below are relative to the repo root (`/Users/kapriel/liquisity/`).

## Prerequisites

Node.js and Python 3 are required (both present in this environment).

```bash
# Install Playwright's chromium browser (one-time, ~92 MB):
npx playwright install chromium
```

## Setup

```bash
# Install playwright package (already in package.json after first run):
npm install
```

## Build

No build step. The site is plain HTML/CSS/JS.

## Run (agent path)

Start the static server, then run the driver:

```bash
# 1. Start server (from repo root):
python3 -m http.server 7420 &
echo $! > /tmp/liquisity-server.pid
for i in $(seq 1 30); do curl -sf http://localhost:7420/ >/dev/null && break; sleep 0.5; done

# 2. Run smoke check (visits all 4 pages, screenshots each, reports console errors):
node .claude/skills/run-liquisity/driver.mjs smoke

# 3. Screenshot a single page (index | buy | brand | contact):
node .claude/skills/run-liquisity/driver.mjs ss buy

# 4. Stop server when done:
kill $(cat /tmp/liquisity-server.pid)
```

Screenshots land in `/tmp/liquisity-screenshots/<page>.png`.

| Command | What it does |
|---|---|
| `smoke` | Visits all 4 pages, screenshots each, exits 1 if console errors |
| `ss <page>` | Screenshots one page (`index`, `buy`, `brand`, `contact`) |

## Run (human path)

```bash
python3 -m http.server 7420   # → open http://localhost:7420 in a browser. Ctrl-C to stop.
```

## Gotchas

- **Product images appear black** — images come from `figma.com/api/mcp/asset/…`. They load fine in a real browser; the Python server never touches them. In screenshots they may render as dark/blank placeholders depending on external availability. This is expected.
- **Port 7420 already in use** — run `pkill -f 'http.server 7420'` before relaunching; the driver connects to the port, not the pid file.
- **playwright not found** — run `npm install` from the repo root. The package was added via `npm install --save-dev playwright`; it is not globally installed.

## Troubleshooting

- **`Cannot find package 'playwright'`**: `playwright` is a local dev dependency. Run `npm install` from the repo root before executing the driver.
- **Poll loop exits immediately with no curl output**: another process owns port 7420. `lsof -i :7420` to identify it, then kill it.
- **`timeout: command not found`** (macOS): `timeout` is a GNU coreutils command not present on macOS by default. The skill uses a `for`/`seq` loop instead — no change needed.
