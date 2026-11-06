# Privacy

iran-ready collects no data, has no server, and sends nothing to its authors or to any third party.

- **Scanner** (`scripts/scan.js`): reads source files in the folder you point it at, on your machine, and prints the results. Nothing leaves your machine.
- **Hook** (`scripts/guard.js`): reads the content of the tool call Claude is about to make (new file content, edit text or shell command) and checks it locally against `data/blocklist.json`. It stores and sends nothing.
- **Commands** (`/iran-audit`, `/iran-fix`): run the local scanner. `/iran-fix` may download files you approve, such as font files from the alternative's own site, and only after asking you.
- **Skill** (`persian-ux`): instructions for Claude only; no code runs.
- **Field check** (`scripts/check-from-iran.js`): runs only when you start it. It makes plain HTTP requests to the public service URLs listed in the script, without any personal data, and prints the results on your screen.

Questions: open an issue at https://github.com/masihft/iran-ready/issues.
