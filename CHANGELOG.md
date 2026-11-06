# Changelog

## 1.0.0 (2026-11-06)

First stable release.

- **Blocklist**: 28 services. Severities and alternatives were checked from an Iranian connection without a VPN (`docs/field-check-2026-11-06.txt`). Every service has at least one alternative that was reachable from Iran.
  - Now `blocked` after the check: Sign in with Google, PayPal, Sentry, Twilio, SendGrid.
  - No longer `blocked` (they were reachable): Google Fonts, reCAPTCHA and Google Analytics are now `unreliable`; Google Maps and Google Cloud are now `sanctioned-signup`.
  - Removed IDPay (expired certificate). MinIO now links to GitHub because min.io refused Iran. Ollama is marked unverified because ollama.com refused Iran; vLLM is listed first.
- **Scanner**: `FROM <stage>` in multi-stage Dockerfiles is no longer reported as a Docker Hub pull.
- **Hook**: Python's `from x import y` in a shell command is no longer reported as a Docker Hub pull. Unverified alternatives are labelled.
- **Field check**: `node scripts/check-from-iran.js` tests every service and alternative from the current connection.
- CI on Linux, macOS and Windows with Node 18, 20 and 22. Plugin icon.

## 0.3.0

- `persian-ux` skill: RTL, Jalali dates, Persian digits, half-space, Toman/Rial, validation with `@persian-tools/persian-tools`, PHP/Laravel equivalents.

## 0.2.0

- `PreToolUse` warning hook for blocked services.

## 0.1.0

- Blocklist, zero-dependency scanner, `/iran-audit` and `/iran-fix`.
