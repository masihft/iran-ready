---
description: Scan this project for services that don't work from Iran and explain each finding with alternatives and migration effort
argument-hint: "[path]"
allowed-tools: Read, Grep, Glob
---

# /iran-audit

Audit the project for services that are blocked, unreliable, or impossible to sign up for from Iran. This command only reads. Do not edit any file.

## Scope

Recommend only local alternatives and self-hosting. Never suggest VPNs, proxies, fake identities, foreign accounts, or any way around sanctions. If the user asks for that, say this tool does not cover it.

## 1. Run the scanner

Scan the path in `$ARGUMENTS`. If it is empty, scan the current directory (`.`).

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/scan.js" scan "<path>" --json
```

Exit code `1` means at least one `blocked` service was found. That is a normal result, not an error. Exit code `2` means the path is wrong: tell the user and stop.

If there are no findings, say so in one or two sentences and stop.

## 2. Report

Write in the user's language. If the user writes Persian, write the whole report in Persian. Keep service names, file paths, package names and code in their original form.

Group the findings by severity, in this order:

1. `blocked`: requests fail from Iran. These break the product for Iranian users.
2. `sanctioned-signup`: it may load, but nobody in Iran can open or keep an account.
3. `unreliable`: slow, throttled or filtered at times.

Inside each group, one block per service, not per line:

- **Service name**, with every `file:line` it appears on. If there are more than 8 locations, list 8 and give the count.
- **Why**: one sentence from the `why` field.
- **Alternatives**: from the `alternatives` field, with name, URL and migration note. If any alternative you list has `"verify": true`, mark it as not yet verified from Iran.
- **Effort**: an estimate from the table below. Raise it if the service appears in many files or deep in business logic. Read the code around the findings when you need to judge this.

| Effort | Typical cases |
|---|---|
| S (under 1 hour) | Fonts, analytics snippet, CDN script, Docker base image prefix, Gravatar, embeds |
| M (half a day to 2 days) | Captcha, maps with markers, S3 endpoint swap, error tracking DSN, SMS/OTP, AI API to a self-hosted model |
| L (several days or more) | Payment gateway, Firebase/Auth/database migration, hosting platform move |

## 3. Summary

End with a short table: service, severity, effort. Then one line on the order you recommend. Start with `blocked` items that have S effort, because they give the fastest win.

Last line: tell the user they can run `/iran-fix` to migrate, or `/iran-fix <service-id>` for one service.
