Build an open-source Claude Code plugin called "iran-ready".

## Goal
Help developers working from Iran find and fix parts of a project that don't
work there (blocked/sanctioned services), and build proper Persian UX.
Focus ONLY on local alternatives and self-hosting — no VPNs, proxies,
fake identities, or sanction circumvention.

## Repo structure
iran-ready/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json        # so users can: /plugin marketplace add <repo>
├── commands/
│   ├── iran-audit.md           # /iran-audit
│   └── iran-fix.md             # /iran-fix
├── skills/
│   └── persian-ux/SKILL.md
├── hooks/
│   └── hooks.json              # PreToolUse on Write|Edit|Bash
├── scripts/
│   ├── scan.js                 # Node, zero dependencies
│   └── guard.js                # used by the hook
├── data/
│   └── blocklist.json          # the core asset
├── tests/
├── README.md                   # English + short Persian section
├── CONTRIBUTING.md             # how to add a blocklist entry via PR
└── LICENSE                     # MIT

## 1. data/blocklist.json
Each entry:
{ "id", "name", "category" (fonts|captcha|maps|payment|hosting|cdn|registry|
  analytics|auth|media), "patterns": [regex for URLs/imports/package names],
  "files": [glob hints], "severity": "blocked"|"unreliable"|"sanctioned-signup",
  "why", "alternatives": [{ "name", "url", "migration_note" }] }
Seed ~25 entries: Google Fonts, reCAPTCHA, Google Maps, Firebase, Google
Analytics, Stripe, PayPal, Docker Hub pulls, YouTube embeds, Gravatar,
Vercel/Netlify/AWS signup, OpenAI API, etc.
Alternatives: self-hosted Vazirmatn, Neshan map, Zarinpal, ArvanCloud, Liara,
Aparat embed, self-hosted analytics (Umami/Matomo), local package mirrors.
Mark every alternative as "verify: true" — I will check each one manually.

## 2. scripts/scan.js
- Walk the project (respect .gitignore, skip node_modules/vendor/dist).
- Scan: html, php, js/ts/jsx/tsx, css/scss, json, package.json,
  composer.json, Dockerfile, docker-compose, .env.example.
- Output JSON + a readable table: file:line, service, severity, alternative.
- Exit code 1 if anything "blocked" is found (so it works in CI too).
- Also usable standalone: `npx iran-ready scan`.

## 3. /iran-audit
Run scan.js, then explain findings grouped by severity, in Persian if the
user writes Persian. End with an estimated migration effort per item.

## 4. /iran-fix
Take audit results, propose a plan, ask for confirmation, then apply
replacements one service at a time (e.g. download Vazirmatn into
/assets/fonts and rewrite @font-face). Never delete without asking.

## 5. Hook (guard.js)
PreToolUse on Write/Edit/Bash: if new content or command matches a
"blocked" pattern (e.g. fonts.googleapis.com, `npm i firebase`), return a
warning with the alternative. Warn, don't block — must be fast (<100ms)
and never crash the session (always exit 0 on internal errors).

## 6. skills/persian-ux/SKILL.md
Teach Claude to: use RTL correctly (dir, logical CSS properties), Jalali
dates, Persian digits, half-space (نیم‌فاصله), Toman/Rial formatting,
Iranian mobile format, and validate national ID / card / Sheba using
@persian-tools/persian-tools (npm) — do NOT reimplement these.
Include PHP equivalents for PHP projects.

## 7. Tests
Fixture projects (a PHP shop page, a React app) with known violations;
assert scan.js finds them all.

## Order of work
1. blocklist.json + scan.js + tests  → make it work standalone first
2. plugin.json + commands
3. hook
4. skill
5. README with a GIF-friendly demo section and install instructions

Start with step 1. Show me the plan before writing code.