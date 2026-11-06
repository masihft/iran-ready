---
description: Migrate blocked or sanctioned services to local or self-hosted alternatives, one service at a time, after your confirmation
argument-hint: "[service-id]"
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, AskUserQuestion
---

# /iran-fix

Replace services that don't work from Iran with local or self-hosted alternatives. Work on one service at a time and get the user's confirmation before changing anything.

## Rules

- Recommend only local alternatives and self-hosting. Never suggest VPNs, proxies, fake identities, foreign accounts, or any way around sanctions.
- Never delete a file without asking first. Removing a reference (a `<link>`, an import, a dependency line) is part of the approved change. Deleting a whole file is not, so ask.
- Never edit `node_modules`, `vendor`, `dist`, `build` or lock files by hand. Change the manifest (`package.json`, `composer.json`) and tell the user which install command to run.
- Never write real API keys, merchant IDs or passwords. Use environment variables and add placeholders to `.env.example`.
- Every alternative in the blocklist has `"verify": true`. Tell the user that once, before the plan.
- Write in the user's language. If the user writes Persian, answer in Persian.

## 1. Find what to fix

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/scan.js" scan . --json
```

Exit code `1` is normal: it means `blocked` services were found. If there are no findings, say so and stop.

If `$ARGUMENTS` names a service id (for example `google-fonts`), only fix that one. If the id is not in the findings, say so and list the ids that are.

## 2. Propose a plan and ask

For each service, in order (`blocked` first, then `sanctioned-signup`, then `unreliable`; small effort first inside each group):

- The alternative you will use, and why you picked it from the list.
- The files you will change, and what changes in each.
- Anything you will download or install, with its source URL.
- What the user must do themself: create an account with an Iranian provider, set an env var, run an install command.

Ask with AskUserQuestion which services to migrate, and which alternative to use when there is a real choice. Do not change any file before the user answers.

## 3. Apply one service at a time

For each approved service:

1. Make the change.
2. Re-run the scanner and confirm that service no longer appears. If it still does, fix the remaining spots or explain why they stay.
3. Show a short summary: the files changed and what the user still has to do.
4. Ask before moving to the next service.

## Playbooks

Use these as a starting point. Adapt them to the project's framework and conventions.

**Google Fonts → self-hosted Vazirmatn**
- Get the woff2 files from the Vazirmatn releases (`https://github.com/rastikerdar/vazirmatn/releases`) into `assets/fonts/` (or the project's static folder). Ask before downloading. If the download fails or is slow, offer `npm install @fontsource/vazirmatn` instead, or ask the user to place the files by hand.
- Replace the Google `<link>` or `@import` with `@font-face` rules that use `font-display: swap`, and keep the same `font-family` name so other CSS keeps working.
- Next.js `next/font/google`: switch to `next/font/local`.

**Google Analytics / GTM → Umami or Matomo**: remove the gtag snippet and any `gtag(...)` calls, then add the self-hosted script tag with the URL in an env var. Map custom events to `umami.track(...)` or Matomo `_paq.push(...)`.

**reCAPTCHA / Turnstile → server-side captcha**: Node uses `svg-captcha` with the answer in the session; PHP uses `gregwar/captcha`. Replace both the widget and the server-side verify call. Keep rate limiting if there is any.

**Google Maps / Mapbox → Neshan, Map.ir or Leaflet + OSM**: replace the map component, then markers, then geocoding calls. Put the API key in an env var. Check that coordinates stay `[lat, lng]` in the order the new library expects.

**Stripe / PayPal → Zarinpal, Zibal or IDPay**: implement the request → redirect → callback → verify flow on the server. Never trust the callback without the verify call. Check whether the gateway expects Rial or Toman and convert amounts explicitly. Keep the old provider's code behind a flag only if the user asks.

**Firebase → Supabase, Appwrite or PocketBase (self-hosted)**: this is a large migration. Plan it with the user first: auth, then data, then storage. Do not try it in one step.

**Docker Hub → mirror or own registry**: prefix image names with the chosen mirror host in `Dockerfile` and `docker-compose`, or explain the `registry-mirrors` option in `daemon.json`. Do not edit the user's Docker daemon config without asking.

**npm / Packagist registry → mirror or self-hosted proxy**: set `registry=` in the project `.npmrc`, or add a Composer repository entry. Do not change global config without asking.

**YouTube / social embeds → Aparat or self-hosted video**: replace the iframe with the Aparat embed or a `<video>` tag. The user must upload the video, so leave a clear TODO with the old video ID.

**AWS / S3 → ArvanCloud, Liara or MinIO**: keep the S3 SDK and change `endpoint`, region and credentials through env vars. Add `forcePathStyle: true` (or the PHP equivalent) if the provider needs it.

**OpenAI / Anthropic / Gemini API → self-hosted model (Ollama, vLLM)**: point the OpenAI-compatible SDK at the self-hosted `baseURL` from an env var. Warn the user that output quality and context length will differ.

**Sentry → GlitchTip or self-hosted Sentry**: keep the SDK and change the DSN env var.

**Vercel / Netlify / Heroku → Liara or Hamravesh**: add the provider's config file and explain the deploy command. Do not delete the old config file without asking.

## 4. Finish

Re-run the scanner once more and show the before/after counts by severity. List anything left, with the reason. Remind the user to run the install command if any manifest changed.
