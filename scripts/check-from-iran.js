#!/usr/bin/env node
'use strict';
// Field check for the blocklist: run from an Iranian connection WITHOUT a VPN.
// For every service and every suggested alternative it reports whether the URL answers.
// Usage: node scripts/check-from-iran.js            (Node 18+, zero dependencies)
const { loadBlocklist } = require('./scan.js');

// One URL per service that a real app would request. 401/404 still mean "reachable";
// 403/451 or a network error usually mean blocked or geo-refused.
const PROBES = {
  'google-fonts': 'https://fonts.googleapis.com/css2?family=Roboto',
  recaptcha: 'https://www.google.com/recaptcha/api.js',
  'cloudflare-turnstile': 'https://challenges.cloudflare.com/turnstile/v0/api.js',
  'google-maps': 'https://maps.googleapis.com/maps/api/js',
  mapbox: 'https://api.mapbox.com/',
  firebase: 'https://firestore.googleapis.com/',
  'google-cloud': 'https://storage.googleapis.com/',
  'google-analytics': 'https://www.googletagmanager.com/gtag/js?id=G-TEST',
  'google-signin': 'https://accounts.google.com/gsi/client',
  'youtube-embed': 'https://www.youtube.com/embed/',
  'social-embeds': 'https://connect.facebook.net/en_US/sdk.js',
  gravatar: 'https://www.gravatar.com/avatar/0',
  'openai-api': 'https://api.openai.com/v1/models',
  'anthropic-api': 'https://api.anthropic.com/v1/models',
  'google-gemini': 'https://generativelanguage.googleapis.com/v1beta/models',
  'docker-hub': 'https://registry-1.docker.io/v2/',
  'npm-registry': 'https://registry.npmjs.org/react',
  packagist: 'https://repo.packagist.org/packages.json',
  'public-cdns': 'https://cdn.jsdelivr.net/npm/react/package.json',
  stripe: 'https://js.stripe.com/v3/',
  paypal: 'https://www.paypal.com/sdk/js?client-id=test',
  vercel: 'https://vercel.com/',
  netlify: 'https://www.netlify.com/',
  aws: 'https://s3.amazonaws.com/',
  heroku: 'https://www.heroku.com/',
  sentry: 'https://sentry.io/',
  twilio: 'https://api.twilio.com/',
  sendgrid: 'https://api.sendgrid.com/',
};

async function probe(url, ms = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'user-agent': 'iran-ready-check' } });
    res.body?.cancel().catch(() => {});
    const verdict = res.status === 403 || res.status === 451 ? 'REFUSED' : 'ok';
    return { verdict, detail: `HTTP ${res.status}`, ms: Date.now() - start };
  } catch (e) {
    return { verdict: 'FAIL', detail: ctrl.signal.aborted ? 'timeout' : (e.cause && e.cause.code) || e.message, ms: Date.now() - start };
  } finally { clearTimeout(timer); }
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => { while (next < items.length) { const i = next++; out[i] = await fn(items[i]); } }));
  return out;
}

async function main() {
  const entries = loadBlocklist();
  const services = entries.filter((e) => PROBES[e.id]).map((e) => ({ kind: 'service', id: e.id, severity: e.severity, url: PROBES[e.id] }));
  const altUrls = [...new Set(entries.flatMap((e) => e.alternatives.map((a) => a.url)))];
  const alts = altUrls.map((url) => ({ kind: 'alternative', id: entries.find((e) => e.alternatives.some((a) => a.url === url)).id, url }));
  console.log(`Checking ${services.length} services and ${alts.length} alternative links (about 30 seconds)...\n`);
  const rows = await pool([...services, ...alts], 8, async (it) => ({ ...it, ...(await probe(it.url)) }));
  const line = (r) => `${r.verdict.padEnd(8)} ${r.detail.padEnd(16)} ${String(r.ms).padStart(5)}ms  ${r.kind === 'service' ? r.id.padEnd(22) + r.severity : r.url}`;
  console.log('SERVICES (should mostly FAIL or be REFUSED from Iran)');
  rows.filter((r) => r.kind === 'service').forEach((r) => console.log(line(r)));
  console.log('\nALTERNATIVES (should all be ok from Iran)');
  rows.filter((r) => r.kind === 'alternative').forEach((r) => console.log(line(r)));
  console.log(`\nnode ${process.version}, ${new Date().toISOString()}. Copy everything above and send it.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
