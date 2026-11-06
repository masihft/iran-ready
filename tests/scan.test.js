'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { spawnSync } = require('child_process');
const { scan, loadBlocklist, matchText } = require('../scripts/scan.js');

const FIX = path.join(__dirname, 'fixtures');
const CLI = path.join(__dirname, '..', 'scripts', 'scan.js');
const keys = (findings) => findings.map((f) => `${f.file}:${f.line}:${f.id}`).sort();

test('blocklist entries are well-formed', () => {
  const ids = new Set();
  for (const e of loadBlocklist()) {
    assert.ok(!ids.has(e.id), `duplicate id ${e.id}`);
    ids.add(e.id);
    for (const k of ['name', 'category', 'why']) assert.ok(e[k], `${e.id} missing ${k}`);
    assert.ok(['blocked', 'unreliable', 'sanctioned-signup'].includes(e.severity), `${e.id} bad severity`);
    assert.ok(e.patterns.length && e.alternatives.length, `${e.id} needs patterns and alternatives`);
    for (const a of e.alternatives) assert.equal(typeof a.verify, 'boolean', `${e.id}: ${a.name} needs verify: true|false`);
  }
});

test('php-shop: finds every known violation', () => {
  assert.deepEqual(keys(scan(path.join(FIX, 'php-shop'))), [
    'Dockerfile:1:docker-hub',
    'composer.json:5:stripe',
    'composer.json:6:recaptcha',
    'index.php:12:gravatar',
    'index.php:13:youtube-embed',
    'index.php:14:google-maps',
    'index.php:15:recaptcha',
    'index.php:5:google-fonts',
    'index.php:6:recaptcha',
    'index.php:7:google-analytics',
    'index.php:8:paypal',
    'style.css:1:google-fonts',
  ]);
});

test('react-app: finds every known violation and skips node_modules, dist, .gitignore', () => {
  assert.deepEqual(keys(scan(path.join(FIX, 'react-app'))), [
    '.env.example:1:openai-api',
    'docker-compose.yml:3:docker-hub',
    'package.json:12:vercel',
    'package.json:4:google-maps',
    'package.json:5:sentry',
    'package.json:6:stripe',
    'package.json:7:firebase',
    'package.json:9:youtube-embed',
    'src/App.jsx:1:firebase',
    'src/App.jsx:2:youtube-embed',
    'src/App.jsx:5:openai-api',
    'src/index.css:3:google-fonts',
  ]);
});

test('docker-hub pattern ignores images with a registry host', () => {
  const entries = loadBlocklist();
  assert.equal(matchText('FROM docker.arvancloud.ir/library/node:20', entries, 'Dockerfile').length, 0);
  assert.equal(matchText('FROM registry.local:5000/app', entries, 'Dockerfile').length, 0);
  assert.equal(matchText('FROM scratch', entries, 'Dockerfile').length, 0);
  assert.equal(matchText('FROM --platform=linux/amd64 node:20', entries, 'Dockerfile')[0].entry.id, 'docker-hub');
  // multi-stage: `FROM build` refers to an earlier stage, not Docker Hub
  const multi = matchText('FROM docker.arvancloud.ir/library/node:20 AS build\nRUN npm ci\nFROM build AS test\nFROM nginx', entries, 'Dockerfile');
  assert.deepEqual(multi.map((h) => h.line), [4]);
  // files hint: FROM in a non-Docker file is not a pull
  assert.equal(matchText('FROM node:20', entries, 'notes.js').length, 0);
});

test('CLI exit codes: 1 when blocked, 0 when clean, 2 on bad dir', () => {
  const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8' });
  assert.equal(run('scan', path.join(FIX, 'php-shop')).status, 1);
  assert.equal(run('scan', path.join(FIX, 'clean')).status, 0);
  assert.equal(run('scan', path.join(FIX, 'does-not-exist')).status, 2);
  const out = JSON.parse(run('scan', path.join(FIX, 'react-app'), '--json').stdout);
  assert.equal(out.findings.length, 12);
  assert.ok(out.findings[0].alternatives[0].url);
});
