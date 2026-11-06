# iran-ready

[![test](https://github.com/masihft/iran-ready/actions/workflows/test.yml/badge.svg)](https://github.com/masihft/iran-ready/actions/workflows/test.yml)

Find the parts of your project that don't work from Iran (blocked or sanctioned services), and switch to local or self-hosted alternatives. A Claude Code plugin plus a zero-dependency scanner.

![iran-ready scanning a React app: 8 blocked, 3 sanctioned-signup and 1 unreliable service, each with a local alternative](docs/demo.gif)

iran-ready only recommends **local alternatives and self-hosting**. It does not suggest VPNs, proxies, or any way around sanctions.

## Install

**Claude Code plugin** (recommended):

```text
/plugin install iran-ready --marketplace masihft/iran-ready
```

On Claude Code versions older than 2.1.275, use two steps:

```text
/plugin marketplace add masihft/iran-ready
/plugin install iran-ready@iran-ready
```

**Scanner only**: no install and no dependencies. Requires Node 18+.

```bash
npx github:masihft/iran-ready scan
```

## Demo: try it in 60 seconds

Each step is one command, so you can record each one as its own short clip. The fixtures in `tests/fixtures/` are small fake projects with known problems.

```bash
git clone https://github.com/masihft/iran-ready && cd iran-ready
```

**1. Scan a project.** This is what the GIF above shows.

```bash
npx github:masihft/iran-ready scan tests/fixtures/react-app
```

**2. Get an explained report in Claude Code.**

```text
/iran-ready:iran-audit tests/fixtures/php-shop
```

Claude groups the findings by severity, explains each one, lists alternatives, and ends with an effort table:

```text
| Service          | Severity          | Effort |
|------------------|-------------------|--------|
| Docker Hub       | blocked           | S      |
| YouTube embeds   | blocked           | S      |
| PayPal           | blocked           | L      |
| Google Maps      | sanctioned-signup | S–M    |
| Stripe           | sanctioned-signup | L      |
| Google Fonts     | unreliable        | S      |
| Google Analytics | unreliable        | S      |
| reCAPTCHA        | unreliable        | M      |
| Gravatar         | unreliable        | S      |
```

Write to Claude in Persian and the report comes back in Persian.

**3. See the hook catch a blocked service.** Ask Claude something like *"add Firebase auth to this app"*. When Claude runs `npm install firebase`, it first receives:

```text
iran-ready: this Bash uses services that are blocked from Iran:
- Firebase [firebase] matched `"firebase"`: firestore.googleapis.com returned HTTP 403 from Iran
  in a 2026-11-06 field check; Firebase auth, database and storage calls fail.
  Alternative: Supabase (self-hosted) (https://supabase.com/docs/guides/self-hosting) or
  Appwrite (self-hosted) (https://appwrite.io).
```

**4. Fix it.**

```text
/iran-ready:iran-fix google-fonts
```

Claude proposes a plan and waits for your OK. Then it self-hosts the font, rewrites `@font-face`, and re-scans to confirm.

To re-record the GIF, install [vhs](https://github.com/charmbracelet/vhs) and run `vhs docs/demo.tape`.

## What's inside

| Part | What it does |
|---|---|
| `/iran-ready:iran-audit [path]` | Read-only report grouped by severity, with alternatives and an effort estimate (S/M/L). |
| `/iran-ready:iran-fix [service-id]` | Plans the migration, asks first, then migrates one service at a time and re-scans after each. It never deletes files without asking. |
| Warning hook | A `PreToolUse` hook on `Write`, `Edit`, `MultiEdit` and `Bash` that warns Claude when new code, `npm i ...`, `composer require ...` or `docker pull/run ...` uses a `blocked` service. It warns, never blocks, runs in about 30 ms, and exits 0 on any internal error. |
| `persian-ux` skill | Loads when you build Persian UI. It covers RTL with logical CSS, Jalali dates, Persian digits, half-space (نیم‌فاصله), Rial/Toman, and mobile, national ID, card and Sheba validation with [`@persian-tools/persian-tools`](https://github.com/persian-tools/persian-tools). It includes PHP/Laravel equivalents. |
| `scripts/scan.js` | The scanner behind all of the above. Zero dependencies; usable in CI. |

## What it checks

28 services across fonts, captcha, maps, payment, hosting, CDNs, package registries, analytics, auth, media, AI APIs and messaging. Examples: Google Fonts, reCAPTCHA, Google Maps, Firebase, Google Analytics, Stripe, PayPal, Docker Hub, YouTube embeds, Gravatar, Vercel, Netlify, AWS, OpenAI. See [`data/blocklist.json`](data/blocklist.json) for the full list.

| Severity | Meaning |
|---|---|
| `blocked` | Requests fail from Iran. |
| `sanctioned-signup` | It may load, but you cannot open or keep an account from Iran. |
| `unreliable` | Slow, throttled or filtered at times. |

Severities and alternatives come from a [field check run from an Iranian connection without a VPN](docs/field-check-2026-11-06.txt) on 2026-11-06. Filtering in Iran differs by ISP and changes over time, so treat `unreliable` as "works today, may break". An alternative marked `"verify": true` was not reachable in that check; right now that is only ollama.com.

**Files scanned**: `html`, `php`, `js/ts/jsx/tsx`, `vue`, `svelte`, `css/scss`, `json` (including `package.json` and `composer.json`), `Dockerfile`, `docker-compose`, `.env.example` and `.npmrc`. It skips `node_modules`, `vendor`, `dist`, `build`, `.git`, lock files, files over 1 MB, and paths in the root `.gitignore`.

## Use in CI

The exit code is `1` when a `blocked` service is found, `0` otherwise, and `2` for a bad path. Use `--json` for machine-readable output.

```yaml
- run: npx github:masihft/iran-ready scan
```

## Contributing

Adding a blocklist entry is the most useful contribution. See [CONTRIBUTING.md](CONTRIBUTING.md). Run the tests with `npm test`.

If you are in Iran, the most valuable help is a field check. Turn off any VPN, run `node scripts/check-from-iran.js`, and paste the output in a new issue. It tests every service and every suggested alternative from your connection.

---

## فارسی

**iran-ready** بخش‌هایی از پروژه را پیدا می‌کند که از داخل ایران کار نمی‌کنند، مثل Google Fonts، reCAPTCHA، Google Maps، Firebase، Stripe و Docker Hub. برای هر مورد هم جایگزین داخلی یا self-hosted پیشنهاد می‌دهد، مثل Vazirmatn، نشان، زرین‌پال، آروان‌کلاد، لیارا و آپارات.

این ابزار فقط جایگزین داخلی و میزبانی شخصی پیشنهاد می‌دهد. VPN، پروکسی یا دور زدن تحریم پیشنهاد نمی‌دهد.

نصب پلاگین در Claude Code:

```text
/plugin install iran-ready --marketplace masihft/iran-ready
```

- `/iran-ready:iran-audit`: گزارش کامل، دسته‌بندی‌شده بر اساس شدت، با جایگزین‌ها و تخمین زحمت. اگر فارسی بنویسید، فارسی جواب می‌دهد.
- `/iran-ready:iran-fix`: مهاجرت سرویس‌به‌سرویس. قبل از هر تغییر از شما تأیید می‌گیرد.
- **hook**: اگر Claude بخواهد سرویس مسدودی به کد اضافه کند، به خودش هشدار می‌دهد. جلوی کار را نمی‌گیرد.
- **skill `persian-ux`**: به Claude یاد می‌دهد RTL، تاریخ شمسی، اعداد فارسی، نیم‌فاصله، تومان و ریال، و اعتبارسنجی کد ملی و کارت و شبا را درست پیاده کند.

اجرای اسکنر بدون نصب:

```bash
npx github:masihft/iran-ready scan
```

اگر سرویسی با وضعیت `blocked` پیدا شود، exit code برابر 1 است؛ برای همین در CI هم قابل استفاده است. برای اضافه کردن سرویس جدید، [CONTRIBUTING.md](CONTRIBUTING.md) را ببینید.

اگر داخل ایران هستید، VPN را خاموش کنید، `node scripts/check-from-iran.js` را اجرا کنید و خروجی را در یک issue بفرستید. این بزرگ‌ترین کمک به دقیق‌تر شدن فهرست است.

## License

[MIT](LICENSE)
