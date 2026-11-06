#!/usr/bin/env node
'use strict';
// iran-ready scanner: finds services that are blocked or sanctioned for users in Iran.
// Zero dependencies. Usage: iran-ready scan [dir] [--json]
const fs = require('fs');
const path = require('path');

const BLOCKLIST_PATH = path.join(__dirname, '..', 'data', 'blocklist.json');
const SKIP_DIRS = new Set(['node_modules', 'vendor', 'dist', 'build', 'out', 'coverage', '.git', '.next', '.nuxt', '.svelte-kit']);
const SKIP_FILES = new Set(['package-lock.json', 'composer.lock', 'yarn.lock', 'pnpm-lock.yaml']);
const EXTS = new Set(['.html', '.htm', '.php', '.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.vue', '.svelte', '.css', '.scss', '.json']);
const NAMES = /^(Dockerfile.*|.+\.dockerfile|docker-compose.*\.ya?ml|compose\.ya?ml|\.env\.example|\.npmrc)$/i;
const MAX_BYTES = 1024 * 1024; // skip minified/bundled blobs
const SEVERITY_ORDER = { blocked: 0, 'sanctioned-signup': 1, unreliable: 2 };

function globToRegex(glob) {
  const body = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*+/g, '.*').replace(/\?/g, '.');
  return new RegExp('^' + body + '$', 'i');
}

function loadBlocklist(file = BLOCKLIST_PATH) {
  return JSON.parse(fs.readFileSync(file, 'utf8')).map((e) => ({
    ...e,
    regexes: e.patterns.map((p) => new RegExp(p, 'i')),
    fileRegexes: (e.files || []).map(globToRegex),
  }));
}

// Returns [{ entry, line, match }]. fileName (basename) narrows entries that have `files` hints.
function matchText(text, entries, fileName) {
  const hits = [];
  const active = entries.filter((e) => !fileName || !e.fileRegexes.length || e.fileRegexes.some((r) => r.test(fileName)));
  if (!active.length) return hits;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const entry of active) {
      for (const re of entry.regexes) {
        const m = re.exec(lines[i]);
        if (m) { hits.push({ entry, line: i + 1, match: m[0].trim() }); break; }
      }
    }
  }
  return hits;
}

// shortcut: reads only the root .gitignore, no negation (!) or dir-only semantics; upgrade if nested ignores matter.
function loadIgnore(root) {
  let text;
  try { text = fs.readFileSync(path.join(root, '.gitignore'), 'utf8'); } catch { return []; }
  return text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !l.startsWith('!')).map((l) => {
    const p = l.replace(/\/+$/, '');
    const anchored = p.includes('/');
    return { anchored, re: globToRegex(p.replace(/^\//, '')) };
  });
}

// Directories are checked too, so an ignored dir is never entered.
function isIgnored(rel, name, rules) {
  return rules.some((r) => (r.anchored ? r.re.test(rel) : r.re.test(name)));
}

function isScannable(name) {
  return !SKIP_FILES.has(name) && (EXTS.has(path.extname(name).toLowerCase()) || NAMES.test(name));
}

function* walk(root, rules) {
  const stack = [''];
  while (stack.length) {
    const relDir = stack.pop();
    let dirents;
    try { dirents = fs.readdirSync(path.join(root, relDir), { withFileTypes: true }); } catch { continue; }
    for (const d of dirents) {
      const rel = relDir ? relDir + '/' + d.name : d.name;
      if (isIgnored(rel, d.name, rules)) continue;
      if (d.isDirectory()) { if (!SKIP_DIRS.has(d.name)) stack.push(rel); }
      else if (d.isFile() && isScannable(d.name)) yield rel;
    }
  }
}

function scan(root, entries = loadBlocklist()) {
  const findings = [];
  const rules = loadIgnore(root);
  for (const rel of walk(root, rules)) {
    const abs = path.join(root, rel);
    let text;
    try {
      if (fs.statSync(abs).size > MAX_BYTES) continue;
      text = fs.readFileSync(abs, 'utf8');
    } catch { continue; }
    for (const h of matchText(text, entries, path.basename(rel))) {
      const alt = h.entry.alternatives[0];
      findings.push({
        file: rel, line: h.line, id: h.entry.id, service: h.entry.name, category: h.entry.category,
        severity: h.entry.severity, match: h.match, why: h.entry.why,
        alternative: alt ? alt.name : null, alternatives: h.entry.alternatives,
      });
    }
  }
  findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.file.localeCompare(b.file) || a.line - b.line);
  return findings;
}

function table(findings) {
  if (!findings.length) return 'iran-ready: no blocked or sanctioned services found.';
  const rows = [['LOCATION', 'SERVICE', 'SEVERITY', 'ALTERNATIVE']].concat(
    findings.map((f) => [`${f.file}:${f.line}`, f.service, f.severity, f.alternative || '-']));
  const widths = rows[0].map((_, c) => Math.min(60, Math.max(...rows.map((r) => r[c].length))));
  const fmt = (r) => r.map((cell, c) => (cell.length > widths[c] ? cell.slice(0, widths[c] - 1) + '…' : cell.padEnd(widths[c]))).join('  ').trimEnd();
  const counts = Object.keys(SEVERITY_ORDER).map((s) => `${findings.filter((f) => f.severity === s).length} ${s}`).join(', ');
  return [fmt(rows[0]), widths.map((w) => '-'.repeat(w)).join('  '), ...rows.slice(1).map(fmt), '', `${findings.length} findings: ${counts}`].join('\n');
}

function main(argv) {
  const args = argv.slice(2);
  if (args[0] === 'scan') args.shift();
  if (args.includes('-h') || args.includes('--help')) {
    console.log('Usage: iran-ready scan [dir] [--json]\nExit codes: 0 clean, 1 blocked service found, 2 usage error.');
    return 0;
  }
  const json = args.includes('--json');
  const root = path.resolve(args.find((a) => !a.startsWith('-')) || '.');
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    console.error(`iran-ready: not a directory: ${root}`);
    return 2;
  }
  const findings = scan(root);
  console.log(json ? JSON.stringify({ root, findings }, null, 2) : table(findings));
  return findings.some((f) => f.severity === 'blocked') ? 1 : 0;
}

module.exports = { loadBlocklist, matchText, scan, table, isScannable, BLOCKLIST_PATH };

if (require.main === module) process.exitCode = main(process.argv);
