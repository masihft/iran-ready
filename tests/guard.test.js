'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { spawnSync } = require('child_process');

const GUARD = path.join(__dirname, '..', 'scripts', 'guard.js');
function run(input) {
  const r = spawnSync(process.execPath, [GUARD], { input: typeof input === 'string' ? input : JSON.stringify(input), encoding: 'utf8' });
  return { status: r.status, out: r.stdout ? JSON.parse(r.stdout) : null };
}
const ids = (out) => [...out.hookSpecificOutput.additionalContext.matchAll(/\[([\w-]+)\]/g)].map((m) => m[1]).sort();

test('Write with Google Fonts warns and does not block', () => {
  const r = run({ tool_name: 'Write', tool_input: { file_path: '/p/index.html', content: '<link href="https://fonts.googleapis.com/css2?family=X">' } });
  assert.equal(r.status, 0);
  assert.deepEqual(ids(r.out), ['google-fonts']);
  assert.equal(r.out.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(r.out.hookSpecificOutput.permissionDecision, undefined);
});

test('Edit checks only new_string', () => {
  assert.equal(run({ tool_name: 'Edit', tool_input: { file_path: '/p/a.css', old_string: "@import 'https://fonts.googleapis.com/x';", new_string: "@import './fonts.css';" } }).out, null);
  const r = run({ tool_name: 'MultiEdit', tool_input: { file_path: '/p/App.jsx', edits: [{ new_string: "import x from 'react-youtube';" }] } });
  assert.deepEqual(ids(r.out), ['youtube-embed']);
});

test('Bash install and pull commands warn', () => {
  const r = run({ tool_name: 'Bash', tool_input: { command: 'npm i firebase@10 && docker run -it --rm node:20 bash' } });
  assert.deepEqual(ids(r.out), ['docker-hub', 'firebase']);
  assert.deepEqual(ids(run({ tool_name: 'Bash', tool_input: { command: 'composer require google/recaptcha' } }).out), ['recaptcha']);
});

test('no warning for clean input, mirrors, non-blocked severities and unscanned files', () => {
  assert.equal(run({ tool_name: 'Bash', tool_input: { command: 'docker pull docker.arvancloud.ir/library/node:20' } }).out, null);
  assert.equal(run({ tool_name: 'Bash', tool_input: { command: 'npm install stripe' } }).out, null); // sanctioned-signup, not blocked
  assert.equal(run({ tool_name: 'Write', tool_input: { file_path: '/p/README.md', content: 'fonts.googleapis.com' } }).out, null);
  assert.equal(run({ tool_name: 'Read', tool_input: { file_path: '/p/x.html' } }).out, null);
});

test('never crashes: bad input exits 0 with no output', () => {
  for (const bad of ['', 'not json', '{"tool_name":"Write"}', '{"tool_name":"Write","tool_input":{"content":42}}']) {
    const r = spawnSync(process.execPath, [GUARD], { input: bad, encoding: 'utf8' });
    assert.equal(r.status, 0, bad);
    assert.equal(r.stdout, '', bad);
  }
});
