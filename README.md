# iran-ready

Find the parts of your project that don't work from Iran (blocked or sanctioned services), and get local or self-hosted alternatives.

iran-ready only recommends **local alternatives and self-hosting**. It does not suggest VPNs, proxies, or any way around sanctions.

> Status: the scanner and the `/iran-audit` and `/iran-fix` commands work. The warning hook and the Persian UX skill are in progress.

## Install the Claude Code plugin

```text
/plugin install iran-ready --marketplace masihft/iran-ready
```

On Claude Code versions older than 2.1.275, use two steps:

```text
/plugin marketplace add masihft/iran-ready
/plugin install iran-ready@iran-ready
```

Then, inside any project:

| Command | What it does |
|---|---|
| `/iran-ready:iran-audit [path]` | Scans the project and explains every finding grouped by severity, with alternatives and an effort estimate (S/M/L). It writes in Persian if you write in Persian. It only reads. |
| `/iran-ready:iran-fix [service-id]` | Proposes a migration plan and asks before changing anything. Then it migrates one service at a time and re-scans after each. It never deletes files without asking. |

## Use the scanner on its own

No install and no dependencies. Requires Node 18+.

```bash
npx github:masihft/iran-ready scan
```

Or clone it and run it against any folder:

```bash
node scripts/scan.js scan path/to/project
```

## Demo

```text
$ npx github:masihft/iran-ready scan tests/fixtures/php-shop

LOCATION         SERVICE                         SEVERITY           ALTERNATIVE
---------------  ------------------------------  -----------------  -------------------------------
composer.json:6  Google reCAPTCHA                blocked            svg-captcha (Node, self-hosted)
Dockerfile:1     Docker Hub image pulls          blocked            ArvanCloud Docker mirror
index.php:5      Google Fonts                    blocked            Self-hosted Vazirmatn
index.php:6      Google reCAPTCHA                blocked            svg-captcha (Node, self-hosted)
index.php:7      Google Analytics / Tag Manager  blocked            Umami (self-hosted)
index.php:13     YouTube embeds                  blocked            Aparat embed
index.php:14     Google Maps                     blocked            Neshan Maps
index.php:15     Google reCAPTCHA                blocked            svg-captcha (Node, self-hosted)
style.css:1      Google Fonts                    blocked            Self-hosted Vazirmatn
composer.json:5  Stripe                          sanctioned-signup  Zarinpal
index.php:8      PayPal                          sanctioned-signup  Zarinpal
index.php:12     Gravatar                        unreliable         DiceBear (generated locally)

12 findings: 9 blocked, 2 sanctioned-signup, 1 unreliable
```

## What it checks

28 services across fonts, captcha, maps, payment, hosting, CDNs, package registries, analytics, auth, media, AI APIs and messaging. Examples: Google Fonts, reCAPTCHA, Google Maps, Firebase, Google Analytics, Stripe, PayPal, Docker Hub, YouTube embeds, Gravatar, Vercel, Netlify, AWS, OpenAI. See [`data/blocklist.json`](data/blocklist.json) for the full list.

Each finding has a severity:

| Severity | Meaning |
|---|---|
| `blocked` | Requests fail from Iran. |
| `sanctioned-signup` | It may load, but you cannot open or keep an account from Iran. |
| `unreliable` | Slow, throttled or filtered at times. |

Every alternative is marked `"verify": true` until a maintainer has checked it by hand.

## Files scanned

`html`, `php`, `js/ts/jsx/tsx`, `vue`, `svelte`, `css/scss`, `json` (including `package.json` and `composer.json`), `Dockerfile`, `docker-compose`, `.env.example` and `.npmrc`.

It skips `node_modules`, `vendor`, `dist`, `build`, `.git`, lock files, files over 1 MB, and paths in the root `.gitignore`.

## Use in CI

The exit code is `1` when a `blocked` service is found, `0` otherwise, and `2` for a bad path.

```yaml
- run: npx github:masihft/iran-ready scan
```

Use `--json` for machine-readable output.

## Roadmap

- [x] Blocklist + standalone scanner + fixture tests
- [x] Claude Code plugin: `/iran-audit` and `/iran-fix`
- [ ] `PreToolUse` hook that warns when Claude writes a blocked service into your code
- [ ] `persian-ux` skill: RTL, Jalali dates, Persian digits, half-space, Toman/Rial, national ID / card / Sheba validation

## Contributing

Adding a blocklist entry is the most useful contribution. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## فارسی

**iran-ready** بخش‌هایی از پروژه را پیدا می‌کند که از داخل ایران کار نمی‌کنند، مثل Google Fonts، reCAPTCHA، Google Maps، Firebase، Stripe و Docker Hub. برای هر مورد هم جایگزین داخلی یا self-hosted پیشنهاد می‌دهد، مثل Vazirmatn، نشان، زرین‌پال، آروان‌کلاد، لیارا و آپارات.

این ابزار فقط جایگزین داخلی و میزبانی شخصی پیشنهاد می‌دهد. VPN، پروکسی یا دور زدن تحریم پیشنهاد نمی‌دهد.

نصب پلاگین در Claude Code:

```text
/plugin install iran-ready --marketplace masihft/iran-ready
```

بعد در هر پروژه `/iran-ready:iran-audit` را برای گزارش اجرا کنید و `/iran-ready:iran-fix` را برای مهاجرت. مهاجرت سرویس‌به‌سرویس انجام می‌شود و قبل از هر تغییر از شما تأیید گرفته می‌شود.

اجرای اسکنر بدون نصب:

```bash
npx github:masihft/iran-ready scan
```

اگر سرویسی با وضعیت `blocked` پیدا شود، exit code برابر 1 است؛ برای همین در CI هم قابل استفاده است. برای اضافه کردن سرویس جدید، [CONTRIBUTING.md](CONTRIBUTING.md) را ببینید.

## License

[MIT](LICENSE)
