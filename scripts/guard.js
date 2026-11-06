#!/usr/bin/env node
'use strict';
// PreToolUse hook: warns (never blocks) when new code or a shell command uses a service
// marked "blocked" in data/blocklist.json. Any internal error exits 0 silently so the
// Claude Code session is never interrupted.
const path = require('path');

function textsFor(toolName, input) {
  // Returns [{ text, fileName }]. fileName undefined = match against every entry.
  if (toolName === 'Write') return [{ text: input.content, fileName: input.file_path }];
  if (toolName === 'Edit') return [{ text: input.new_string, fileName: input.file_path }];
  if (toolName === 'MultiEdit') return (input.edits || []).map((e) => ({ text: e.new_string, fileName: input.file_path }));
  // Raw shell text skips docker-hub: a FROM-like word there (Python's `from x import y`) is not an image.
  if (toolName === 'Bash') return [{ text: input.command, skip: 'docker-hub' }, { text: bashText(input.command || '') }];
  return [];
}

// Extra lines from install/pull commands, in a form the blocklist patterns already understand:
// `npm i firebase@10` -> `"firebase"`, `docker pull node:20` -> `FROM node:20`.
function bashText(cmd) {
  const extra = [];
  for (const m of cmd.matchAll(/\b(?:npm|pnpm|yarn|bun)\s+(?:i|install|add)\b([^;&|\n]*)/g)) {
    for (const arg of m[1].trim().split(/\s+/)) {
      if (arg && !arg.startsWith('-')) extra.push(`"${arg.replace(/(.)@[^/]*$/, '$1')}"`);
    }
  }
  for (const m of cmd.matchAll(/\bcomposer\s+require\b([^;&|\n]*)/g)) extra.push(m[1]);
  for (const m of cmd.matchAll(/\b(?:docker|podman)\s+(?:pull|run|create)\b([^;&|\n]*)/g)) {
    const image = firstImage(m[1].trim().split(/\s+/));
    if (image) extra.push(`FROM ${image}`);
  }
  return extra.join('\n');
}

// Flags whose value is a separate token (docker run/pull). Others are treated as boolean.
const VALUE_FLAGS = new Set(['--platform', '-v', '--volume', '-p', '--publish', '-e', '--env', '--env-file', '--name',
  '-w', '--workdir', '--network', '--entrypoint', '-u', '--user', '--mount', '-l', '--label', '-m', '--memory']);

function firstImage(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (VALUE_FLAGS.has(t)) { i++; continue; }
    if (t.startsWith('-')) continue;
    return /^\w[\w.-]*(\/[\w.-]+)*(:[\w.-]+)?(@sha256:\w+)?$/.test(t) ? t : null;
  }
  return null;
}

function warnings(event, entries, scan) {
  const input = event.tool_input || {};
  const seen = new Map();
  for (const { text, fileName, skip } of textsFor(event.tool_name, input)) {
    if (typeof text !== 'string' || !text) continue;
    const base = fileName ? path.basename(fileName) : undefined;
    if (base && !scan.isScannable(base)) continue; // same file types as the scanner
    for (const hit of scan.matchText(text, entries.filter((e) => e.id !== skip), base)) {
      if (hit.entry.severity === 'blocked' && !seen.has(hit.entry.id)) seen.set(hit.entry.id, hit);
    }
  }
  return [...seen.values()].map(({ entry, match }) => {
    const alts = entry.alternatives.slice(0, 2).map((a) => `${a.name} (${a.url})${a.verify ? ' [unverified]' : ''}`).join(' or ');
    return `- ${entry.name} [${entry.id}] matched \`${match.slice(0, 80)}\`: ${entry.why} Alternative: ${alts}.`;
  });
}

function main() {
  const raw = require('fs').readFileSync(0, 'utf8');
  if (!raw.trim()) return;
  const event = JSON.parse(raw);
  const scan = require('./scan.js');
  const entries = scan.loadBlocklist().filter((e) => e.severity === 'blocked');
  const lines = warnings(event, entries, scan);
  if (!lines.length) return;
  const where = event.tool_input && event.tool_input.file_path ? ` in ${path.basename(event.tool_input.file_path)}` : '';
  const msg = `iran-ready: this ${event.tool_name}${where} uses services that are blocked from Iran:\n${lines.join('\n')}\n` +
    'This is a warning only. Prefer the local or self-hosted alternative, or tell the user and suggest /iran-ready:iran-fix.';
  process.stdout.write(JSON.stringify({
    systemMessage: `iran-ready: blocked service detected (${lines.length}). See the warning in context.`,
    hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: msg },
  }));
}

if (require.main === module) {
  try { main(); } catch { /* never break the session */ }
  process.exitCode = 0;
}

module.exports = { bashText, warnings, firstImage };
