# Contributing

The blocklist in `data/blocklist.json` is the core of this project. Most contributions are new entries or better alternatives.

## Scope

iran-ready only recommends **local alternatives and self-hosting**. PRs that suggest VPNs, proxies, fake identities or any way to get around sanctions will be closed.

## Add or change a blocklist entry

1. Add an object to `data/blocklist.json`:

   ```json
   {
     "id": "kebab-case-id",
     "name": "Service name",
     "category": "fonts|captcha|maps|payment|hosting|cdn|registry|analytics|auth|media|ai|messaging",
     "patterns": ["regex matched against each line, case-insensitive"],
     "files": ["optional glob hints on the file name, e.g. Dockerfile*"],
     "severity": "blocked|unreliable|sanctioned-signup",
     "why": "One sentence: what breaks for users in Iran.",
     "alternatives": [
       { "name": "...", "url": "https://...", "migration_note": "How to switch.", "verify": true }
     ]
   }
   ```

2. Severity:
   - `blocked`: requests fail from Iran. The scanner exits with code 1.
   - `sanctioned-signup`: the service may load, but Iranians cannot open or keep an account.
   - `unreliable`: works sometimes; slow, throttled or filtered at times.
3. Keep `"verify": true` on new alternatives. A maintainer sets it to `false` after checking the link and the migration note.
4. Patterns are JSON strings, so escape backslashes (`\\.` for a literal dot). Prefer specific hostnames or quoted package names over short words.
5. Add a line that triggers the entry to a fixture in `tests/fixtures/` and update the expected list in `tests/scan.test.js`.
6. Run `npm test`.
